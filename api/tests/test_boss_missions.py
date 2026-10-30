from fastapi.testclient import TestClient
from sqlalchemy import func, select
from completion_models import BossAttempt
from extended_models import RewardEvent, UserRole
from main import app
from test_platform import signed_client
from test_completion_features import make_run


def test_boss_evidence_is_private_versioned_and_rewarded_once(store):
    alice, user_id, headers = signed_client(store, "Alice")
    bob, _, bob_headers = signed_client(store, "Bob")
    endpoint = "/api/v1/boss-missions/wave-detective/attempts"
    assert TestClient(app).get("/api/v1/boss-missions").status_code == 401
    assert alice.get("/api/v1/boss-missions").json()[0]["locked"]
    slit = make_run(alice, headers)
    tunnel = make_run(alice, headers, "tunnelling")
    evidence = {"version": 1, "steps": [{"run_id": slit["id"], "choice": 0, "reflection": "The coherent slits produce an interference pattern."}, {"run_id": tunnel["id"], "choice": 1, "reflection": "A wider barrier suppresses sub-barrier transmission."}], "reflection": "Both results demonstrate wave behavior within the assumptions of these stationary models."}
    assert alice.post(endpoint, json=evidence, headers=headers).status_code == 409
    assert alice.post("/api/v1/missions/double-slit/events", json={"run_id": slit["id"], "choice": 0, "reflection": "Coherence is responsible for the interference pattern."}, headers=headers).status_code == 200
    public = alice.get("/api/v1/boss-missions").json()[0]
    assert not public["locked"] and "correct_choice" not in str(public)
    assert alice.post(endpoint, json=evidence).status_code == 403
    assert bob.get("/api/v1/boss-attempts").json() == []
    # A second learner cannot claim the first learner's saved runs.
    outsider_run = make_run(bob, bob_headers)
    invalid = {**evidence, "steps": [{**evidence["steps"][0], "run_id": outsider_run["id"]}, evidence["steps"][1]]}
    assert alice.post(endpoint, json=invalid, headers=headers).status_code == 404
    failed = {**evidence, "steps": [evidence["steps"][0], {**evidence["steps"][1], "choice": 0}]}
    assert alice.post(endpoint, json=failed, headers=headers).json()["xp_awarded"] == 0
    assert alice.post(endpoint, json=evidence, headers=headers).json()["xp_awarded"] == 250
    assert alice.post(endpoint, json=evidence, headers=headers).json()["xp_awarded"] == 0
    with store() as db:
        assert db.scalar(select(func.count()).select_from(BossAttempt).where(BossAttempt.owner_user_id == user_id)) == 3
        assert db.scalar(select(func.count()).select_from(RewardEvent).where(RewardEvent.user_id == user_id, RewardEvent.event_key == "boss:wave-detective:mastery")) == 1


def test_boss_authoring_permissions_stale_writes_retirement_and_snapshots(store):
    editor, user_id, headers = signed_client(store, "Editor")
    body = {"title": "Wave reasoning", "objective": "Explain the wave models using evidence and explicit assumptions.", "xp": 100, "steps": [{"lab_slug": "double-slit", "instructions": "Inspect the interference pattern."}, {"lab_slug": "hydrogen", "instructions": "Interpret the radial probability distribution."}], "expected_version": 1}
    url = "/api/v1/admin/boss-missions/wave-detective"
    assert editor.put(url, json=body, headers=headers).status_code == 403
    with store() as db:
        db.add(UserRole(user_id=user_id, role="reviewer")); db.commit()
    assert editor.put(url, json={**body, "steps": [body["steps"][0]] * 2}, headers=headers).status_code == 422
    assert editor.put(url, json=body, headers=headers).json()["version"] == 2
    assert editor.put(url, json=body, headers=headers).status_code == 409
    assert editor.post("/api/v1/boss-missions/wave-detective/attempts", json={"version": 1, "steps": [{"run_id": "not-a-run", "choice": 0, "reflection": "A sufficiently detailed reflection."}] * 2, "reflection": "A sufficiently long summary connecting the two experiments."}, headers=headers).status_code == 409
    assert editor.put(url, json={**body, "expected_version": 2, "status": "retired"}, headers=headers).status_code == 200
    assert editor.get("/api/v1/boss-missions").json() == []
    assert editor.get("/api/v1/admin/boss-missions").json()[0]["status"] == "retired"
