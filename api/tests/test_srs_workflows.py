import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import func, select

from main import app
from auth import COOKIE_NAME
from extended_models import AuditEvent, CommunityPost, EmailCredential, IdentityToken, LabRun, Subscription, UserRole
from test_platform import signed_client
import billing_routes
import email_identity


def test_email_verification_login_reset_and_origin(store, monkeypatch):
    messages = []
    monkeypatch.setattr(email_identity, "email_enabled", lambda: True)
    monkeypatch.setattr(email_identity, "send_identity_mail", lambda address, token, purpose: messages.append((address, token, purpose)))
    client = TestClient(app)
    headers = {"Origin": "http://localhost:3000"}
    payload = {"email": "new@example.test", "password": "a-long-password-123", "display_name": "Learner"}
    assert client.post("/api/v1/auth/register", json=payload).status_code == 403
    assert client.post("/api/v1/auth/register", json=payload, headers=headers).status_code == 200
    assert len(messages) == 1
    credentials = {key: payload[key] for key in ("email", "password")}
    assert client.post("/api/v1/auth/login", json=credentials, headers=headers).status_code == 401
    token = messages[0][1]
    assert client.post("/api/v1/auth/verify", json={"token": token}, headers=headers).status_code == 200
    assert client.post("/api/v1/auth/verify", json={"token": token}, headers=headers).status_code == 400
    assert client.post("/api/v1/auth/login", json=credentials, headers=headers).status_code == 200
    assert client.get("/api/me").json()["authenticated"]
    old_cookie = client.cookies.get(COOKIE_NAME)
    assert client.post("/api/v1/auth/forgot", json={"email": payload["email"]}, headers=headers).status_code == 200
    reset_token = messages[-1][1]
    reset = {"token": reset_token, "password": "a-new-password-456"}
    assert client.post("/api/v1/auth/reset", json=reset, headers=headers).status_code == 200
    assert client.post("/api/v1/auth/reset", json=reset, headers=headers).status_code == 400
    client.cookies.set(COOKIE_NAME, old_cookie)
    assert not client.get("/api/me").json()["authenticated"]
    assert client.post("/api/v1/auth/login", json=credentials, headers=headers).status_code == 401
    with store() as db:
        credential = db.scalar(select(EmailCredential))
        assert payload["password"] not in credential.password_hash
        assert db.scalar(select(func.count()).select_from(IdentityToken)) == 0


def test_signed_billing_webhook_entitlements_duplicates_and_expiry(store, monkeypatch):
    alice, user_id, headers = signed_client(store, "Alice")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test_only")
    monkeypatch.setenv("QUANTUMWALK_PAID_PLANS", json.dumps([{"slug": "research", "title": "Research", "amount_minor": 1000, "currency": "usd", "interval": "month", "price_id": "price_test", "features": {"lab.run": 100, "report.pdf": 30, "class.dashboard": 10, "batch.run": 20}}]))
    live = {"metadata": {"user_id": user_id}, "customer": "cus_test", "status": "active", "items": {"data": [{"price": {"id": "price_test"}, "current_period_end": int(time.time()) + 1000}]}, "cancel_at_period_end": False}
    async def provider(*_args, **_kwargs): return live
    monkeypatch.setattr(billing_routes, "stripe", provider)
    event = {"id": "evt_example", "type": "customer.subscription.updated", "created": int(time.time()), "data": {"object": {"id": "sub_example"}}}
    raw = json.dumps(event).encode(); timestamp = int(time.time())
    signature = hmac.new(b"whsec_test_only", str(timestamp).encode() + b"." + raw, hashlib.sha256).hexdigest()
    signed = {"Stripe-Signature": f"t={timestamp},v1={signature}"}
    endpoint = "/api/v1/billing/webhook"
    assert alice.post(endpoint, content=raw).status_code == 400
    assert alice.post(endpoint, content=raw, headers=signed).status_code == 200
    assert alice.post(endpoint, content=raw, headers=signed).json()["duplicate"]
    assert alice.get("/api/v1/billing/subscription").json()["plan"]["slug"] == "research"
    batch = alice.post("/api/v1/labs/oscillator/batch", json={"runs": [{"prediction": "Ground energy should not vanish.", "parameters": {"state": 0}}, {"prediction": "The next state should have more energy.", "parameters": {"state": 1}}]}, headers=headers)
    assert batch.status_code == 201
    with store() as db:
        record = db.scalar(select(Subscription)); record.period_end = int(time.time()) - 1; db.commit()
    assert alice.get("/api/v1/billing/subscription").json()["plan"]["slug"] == "explorer"
    assert alice.post("/api/v1/labs/oscillator/batch", json={"runs": [{"prediction": "Ground state should not vanish."}]}, headers=headers).status_code == 403


def test_community_explicit_sharing_moderation_and_roles(store):
    alice, user_id, headers = signed_client(store, "Alice")
    bob, _, bob_headers = signed_client(store, "Bob")
    payload = {"title": "What changes the interference?", "body": "I compared the pattern with and without path information.", "category": "discussion", "consent_public": True}
    assert alice.post("/api/v1/community/posts", json={**payload, "consent_public": False}, headers=headers).status_code == 422
    post = alice.post("/api/v1/community/posts", json=payload, headers=headers).json()
    assert bob.get("/api/v1/community/posts").json()[0]["title"] == payload["title"]
    assert bob.delete("/api/v1/community/posts/" + post["id"], headers=bob_headers).status_code == 404
    assert bob.post(f"/api/v1/community/posts/{post['id']}/report", json={"reason": "Please check this interpretation."}, headers=bob_headers).status_code == 200
    assert bob.get("/api/v1/admin/audit").status_code == 403
    with store() as db:
        db.add(UserRole(user_id=user_id, role="moderator")); db.commit()
    assert alice.post(f"/api/v1/admin/community/{post['id']}/hide", json={"reason": "Scientific misinformation under review."}, headers=headers).status_code == 200
    assert bob.get("/api/v1/community/posts").json() == []


def test_classroom_membership_private_feedback_and_assignment_evidence(store, monkeypatch):
    teacher, teacher_id, headers = signed_client(store, "Teacher")
    learner, _, learner_headers = signed_client(store, "Learner")
    outsider, _, _ = signed_client(store, "Outsider")
    import collaboration_routes
    monkeypatch.setattr(collaboration_routes, "consume", lambda *_: None)
    assert teacher.post("/api/v1/faculty/organizations", json={"title": "Science department"}, headers=headers).status_code == 403
    with store() as db:
        db.add(UserRole(user_id=teacher_id, role="faculty")); db.commit()
    org = teacher.post("/api/v1/faculty/organizations", json={"title": "Science department"}, headers=headers).json()
    classroom = teacher.post("/api/v1/faculty/classes", json={"title": "Quantum 101", "organization_id": org["id"]}, headers=headers).json()
    class_id = classroom["id"]
    assert outsider.get(f"/api/v1/faculty/classes/{class_id}/assignments").status_code == 404
    assert learner.post("/api/v1/faculty/classes/join", json={"code": classroom["join_code"]}, headers=learner_headers).status_code == 200
    assignment = teacher.post(f"/api/v1/faculty/classes/{class_id}/assignments", json={"title": "Investigate zero-point energy", "lab_slug": "oscillator", "instructions": "Explain your prediction and the observed ground-state energy.", "due_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()}, headers=headers).json()
    run = learner.post("/api/v1/labs/oscillator/runs", json={"prediction": "The ground state has nonzero energy."}, headers=learner_headers).json()
    submission = learner.post(f"/api/v1/faculty/assignments/{assignment['id']}/submissions", json={"run_id": run["id"], "reflection": "The ground state has energy one-half hbar omega."}, headers=learner_headers)
    assert submission.status_code == 200
    assert outsider.get(f"/api/v1/faculty/assignments/{assignment['id']}/submissions").status_code == 404
    assert teacher.put("/api/v1/faculty/submissions/" + submission.json()["id"], json={"score": 90, "feedback": "Good interpretation."}, headers=headers).status_code == 200
    assert learner.get(f"/api/v1/faculty/assignments/{assignment['id']}/submissions").json()[0]["feedback"] == "Good interpretation."
    analytics = teacher.get(f"/api/v1/faculty/classes/{class_id}/analytics").json()
    assert analytics["average_score"] == 90
    assert analytics["completion_percent"] == 100
    assert outsider.get(f"/api/v1/faculty/classes/{class_id}/analytics").status_code == 404
    export = learner.get("/api/account/export").json()
    assert len(export["laboratory"]["submissions"]) == 1
    assert "password_hash" not in json.dumps(export)


def test_checkout_reuses_server_reservation_even_if_client_keys_change(store, monkeypatch):
    client, _, headers = signed_client(store, "Checkout")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test_only")
    monkeypatch.setenv("QUANTUMWALK_PAID_PLANS", json.dumps([{"slug": "plus", "title": "Plus", "amount_minor": 1000, "currency": "usd", "interval": "month", "price_id": "price_test", "features": {"lab.run": 100}}]))
    calls = []
    async def provider(method, path, data=None, idempotency_key=None):
        calls.append((method, path, idempotency_key))
        if path.startswith("prices/"):
            return {"unit_amount": 1000, "currency": "usd", "recurring": {"interval": "month"}, "active": True}
        return {"url": "https://checkout.stripe.com/c/pay/test-only"}
    monkeypatch.setattr(billing_routes, "stripe", provider)
    for key in ["first-request-key-0000", "second-request-key-111"]:
        response = client.post("/api/v1/billing/checkout", json={"plan": "plus", "request_key": key}, headers=headers)
        assert response.status_code == 200, response.text
    assert len([call for call in calls if call[0] == "POST"]) == 1


def test_private_deletion_removes_science_records_and_tokens(store):
    client, user_id, headers = signed_client(store, "Delete")
    run = client.post("/api/v1/labs/hydrogen/runs", json={"prediction": "The radial density peaks away from zero."}, headers=headers)
    assert run.status_code == 201
    assert client.delete("/api/account", headers=headers).status_code == 204
    with store() as db:
        assert db.scalar(select(func.count()).select_from(LabRun).where(LabRun.owner_user_id == user_id)) == 0


def test_retired_model_cannot_be_opened_or_executed(store):
    client, user_id, headers = signed_client(store, "Reviewer")
    with store() as db:
        db.add(UserRole(user_id=user_id, role="reviewer")); db.commit()
    response = client.put("/api/v1/admin/content/hydrogen", json={"status": "retired", "rationale": "Temporarily withdrawn for further scientific review."}, headers=headers)
    assert response.status_code == 200
    assert client.get("/api/science/labs/hydrogen").status_code == 404
    assert client.post("/api/science/labs/hydrogen/run", json={}).status_code == 404
    assert client.post("/api/v1/labs/hydrogen/runs", json={"prediction": "The radius should be one Bohr radius."}, headers=headers).status_code == 404


def test_leaderboard_is_private_until_explicit_consent(store):
    from extended_models import RewardEvent
    client, user_id, headers = signed_client(store, "Private")
    with store() as db:
        db.add(RewardEvent(user_id=user_id, event_key="mission:double-slit:v1", xp=100, reason="Validated test mission")); db.commit()
    assert client.get("/api/v1/leaderboard").json()["players"] == []

    preference = {"experience": "beginner", "interests": [], "reduced_motion": False, "leaderboard_opt_in": True}
    assert client.put("/api/v1/me/preferences", json=preference, headers=headers).status_code == 200
    assert client.get("/api/v1/leaderboard").json()["players"][0]["xp"] == 100
    preference["leaderboard_opt_in"] = False
    client.put("/api/v1/me/preferences", json=preference, headers=headers)
    assert client.get("/api/v1/leaderboard").json()["players"] == []


def test_content_revisions_require_review_and_saved_runs_keep_published_snapshot(store):
    client, user_id, headers = signed_client(store, "Author")
    with store() as db:
        db.add(UserRole(user_id=user_id, role="reviewer")); db.commit()
    original = client.get("/api/science/labs/oscillator").json()
    draft = {key: original[key] for key in ("title", "question", "objective", "assumptions", "limitations")}
    draft["title"] = "Oscillator: a reviewed teaching sequence"
    assert client.put("/api/v1/admin/content/oscillator/draft", json=draft, headers=headers).status_code == 200
    assert client.get("/api/science/labs/oscillator").json()["title"] == original["title"]
    assert client.put("/api/v1/admin/content/oscillator", json={"status": "approved", "rationale": "The educational wording preserves the verified mathematical model and limitations."}, headers=headers).status_code == 200
    published = client.get("/api/science/labs/oscillator").json()
    assert published["title"] == draft["title"]
    assert published["content_version"] == 1
    result = client.post("/api/v1/labs/oscillator/runs", json={"prediction": "The ground state energy should remain nonzero."}, headers=headers).json()
    assert result["model_card"]["title"] == draft["title"]
    draft["title"] = "A later draft that is not yet published"
    client.put("/api/v1/admin/content/oscillator/draft", json=draft, headers=headers)
    assert client.get("/api/v1/runs/" + result["id"]).json()["title"] == published["title"]
    assert len(client.get("/api/v1/admin/content/oscillator/versions").json()) == 2


def test_institution_grant_requires_admin_and_expires_server_side(store, monkeypatch):
    administrator, admin_id, admin_headers = signed_client(store, "Administrator")
    learner, learner_id, learner_headers = signed_client(store, "InstitutionLearner")
    monkeypatch.setenv("QUANTUMWALK_PAID_PLANS", json.dumps([{"slug": "institution", "title": "Institution", "amount_minor": 1000, "currency": "usd", "interval": "month", "price_id": "price_institution", "features": {"lab.run": 100, "class.dashboard": 10}}]))
    payload = {"user_id": learner_id, "plan_slug": "institution", "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(), "reason": "Approved seat for the controlled institutional pilot."}
    assert learner.post("/api/v1/admin/institution-grants", json=payload, headers=learner_headers).status_code == 403
    with store() as db:
        db.add(UserRole(user_id=admin_id, role="admin")); db.commit()
    assert administrator.post("/api/v1/admin/institution-grants", json=payload, headers=admin_headers).status_code == 200
    assert learner.get("/api/v1/billing/subscription").json()["plan"]["slug"] == "institution"
    assert learner.post("/api/v1/billing/cancel", headers=learner_headers).status_code == 403
    with store() as db:
        record = db.scalar(select(Subscription).where(Subscription.owner_user_id == learner_id)); record.period_end = int(time.time()) - 1; db.commit()
    assert learner.get("/api/v1/billing/subscription").json()["plan"]["slug"] == "explorer"
