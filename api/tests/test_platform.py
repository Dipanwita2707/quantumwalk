import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from qiskit import qasm2
from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from auth import COOKIE_NAME, create_session, csrf_for_token, get_db, upsert_google_user  # noqa: E402
from database import Base, Circuit, User, UserSession  # noqa: E402
from main import app  # noqa: E402
from sqlalchemy.exc import OperationalError  # noqa: E402


def test_real_database_dependency_opens_a_session():
    dependency = get_db()
    try:
        assert next(dependency).is_active
    finally:
        dependency.close()


def signed_client(store, name="Learner"):
    with store() as db:
        user = User(display_name=name, email=f"{name.lower()}@example.test")
        db.add(user)
        db.commit()
        token = create_session(db, user)
        user_id = user.id
    client = TestClient(app)
    client.cookies.set(COOKIE_NAME, token)
    return client, user_id, {"X-CSRF-Token": csrf_for_token(token)}


def test_readiness_and_safe_request_logging(store, caplog):
    with caplog.at_level("INFO", logger="uvicorn.error"):
        response = TestClient(app).get("/readyz?code=private-oauth-code")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}
    assert response.headers["cache-control"] == "no-store"
    assert len(response.headers["x-request-id"]) == 36
    assert '"route": "/readyz"' in caplog.text
    assert "private-oauth-code" not in caplog.text


def test_readiness_outage_returns_safe_503():
    class UnavailableDatabase:
        def execute(self, _statement):
            raise OperationalError("SELECT 1", {}, Exception("private-database-secret"))

    def unavailable_db():
        yield UnavailableDatabase()

    app.dependency_overrides[get_db] = unavailable_db
    try:
        response = TestClient(app).get("/readyz")
        assert response.status_code == 503
        assert response.json() == {"status": "unavailable"}
        assert "private-database-secret" not in response.text
    finally:
        app.dependency_overrides.clear()


def test_google_identity_uses_provider_subject_not_email(store):
    with store() as db:
        first = upsert_google_user(db, {"sub": "google-1", "email": "same@example.test", "email_verified": True, "name": "One"})
        second = upsert_google_user(db, {"sub": "google-2", "email": "same@example.test", "email_verified": True, "name": "Two"})
        again = upsert_google_user(db, {"sub": "google-1", "email": "changed@example.test", "email_verified": True})
        assert first.id != second.id
        assert again.id == first.id
        assert again.email == "changed@example.test"


def test_private_circuit_crud_and_csrf(store):
    owner, _, owner_csrf = signed_client(store, "Owner")
    other, _, other_csrf = signed_client(store, "Other")
    payload = {"name": "My Bell pair", "qubits": 2, "operations": [{"gate": "h", "target": 0}, {"gate": "cx", "control": 0, "target": 1}]}
    assert TestClient(app).post("/api/circuits", json=payload).status_code == 401
    assert owner.post("/api/circuits", json=payload).status_code == 403
    created = owner.post("/api/circuits", json=payload, headers=owner_csrf)
    assert created.status_code == 201
    circuit_id = created.json()["id"]
    assert len(owner.get("/api/circuits").json()) == 1
    assert other.get("/api/circuits").json() == []
    assert other.get(f"/api/circuits/{circuit_id}").status_code == 404
    assert other.put(f"/api/circuits/{circuit_id}", json=payload, headers=other_csrf).status_code == 404
    assert other.delete(f"/api/circuits/{circuit_id}", headers=other_csrf).status_code == 404
    assert owner.get(f"/api/circuits/{circuit_id}").json()["name"] == "My Bell pair"
    assert owner.delete(f"/api/circuits/{circuit_id}", headers=owner_csrf).status_code == 204
    assert owner.get(f"/api/circuits/{circuit_id}").status_code == 404


def test_lesson_answer_unknown_slug_and_invalid_choice(store):
    guest = TestClient(app)
    assert guest.post("/api/lessons/not-a-lesson/answer", json={"choice": 0}).status_code == 404
    assert guest.post("/api/lessons/first-qubit/answer", json={"choice": 99}).status_code == 422
    assert guest.post("/api/lessons/first-qubit/answer", json={"choice": -1}).status_code == 422


def test_progress_is_private_and_challenge_is_graded_by_simulator(store):
    owner, _, csrf = signed_client(store)
    guest = TestClient(app)
    answer = guest.post("/api/lessons/first-qubit/answer", json={"choice": 1}).json()
    assert answer["saved"] is False
    assert answer["correct"] is True
    assert answer["score"] == 100
    wrong = guest.post("/api/lessons/first-qubit/answer", json={"choice": 0}).json()
    assert wrong["correct"] is False
    assert wrong["score"] == 0
    assert "correct" in answer
    assert owner.post("/api/lessons/first-qubit/answer", json={"choice": 1}).status_code == 403
    assert owner.post("/api/lessons/first-qubit/answer", json={"choice": 1}, headers=csrf).json()["saved"] is True
    circuit = {"qubits": 2, "operations": [{"gate": "h", "target": 0}, {"gate": "cx", "control": 0, "target": 1}]}
    graded = owner.post("/api/challenges/make-bell-pair/submit", json={"circuit": circuit}, headers=csrf)
    assert graded.status_code == 200
    assert graded.json()["solved"] is True
    assert {row["activity_slug"] for row in owner.get("/api/progress").json()} == {"lesson:first-qubit", "challenge:make-bell-pair"}
    assert guest.get("/api/progress").status_code == 401


def test_logout_revokes_session_and_account_deletion_cascades(store):
    client, user_id, csrf = signed_client(store)
    assert client.get("/api/me").json()["authenticated"] is True
    assert client.post("/api/logout", headers=csrf).status_code == 204
    assert client.get("/api/me").json()["authenticated"] is False
    with store() as db:
        assert db.get(User, user_id) is not None
    second, delete_user_id, csrf = signed_client(store, "Delete")
    assert second.delete("/api/account", headers=csrf).status_code == 204
    with store() as db:
        assert db.get(User, delete_user_id) is None
        assert db.scalars(select(UserSession).where(UserSession.user_id == delete_user_id)).all() == []


def test_google_start_is_unavailable_without_credentials(store, monkeypatch):
    import auth
    monkeypatch.setattr(auth, "google_enabled", False)
    assert TestClient(app).get("/auth/google/start", follow_redirects=False).status_code == 503


def test_google_database_outage_returns_safe_login_error(store, monkeypatch):
    import auth
    from types import SimpleNamespace
    from sqlalchemy.exc import OperationalError

    async def verified_profile(request):
        return {"userinfo": {"sub": "test-google", "email": "test@example.test", "email_verified": True}}

    def database_outage(db, profile):
        raise OperationalError("account lookup", None, Exception("unavailable"))

    monkeypatch.setattr(auth, "google_enabled", True)
    monkeypatch.setattr(auth, "oauth", SimpleNamespace(google=SimpleNamespace(authorize_access_token=verified_profile)))
    monkeypatch.setattr(auth, "upsert_google_user", database_outage)
    response = TestClient(app).get("/auth/google/callback", follow_redirects=False)
    assert response.status_code == 303
    assert "error=account_unavailable" in response.headers["location"]
    assert COOKIE_NAME not in response.cookies


def test_qasm_export_round_trips_supported_circuit(store):
    payload = {"qubits": 2, "operations": [{"gate": "h", "target": 0}, {"gate": "cx", "control": 0, "target": 1}, {"gate": "measure", "target": 0}]}
    client, _, csrf = signed_client(store)
    response = client.post("/api/export/qasm", json=payload)
    assert response.status_code == 200
    restored = qasm2.loads(response.json()["code"])
    assert [instruction.operation.name for instruction in restored.data] == ["h", "cx", "measure"]
    code = client.post("/api/export/qiskit", json=payload).json()["code"]
    assert "circuit.cx(0, 1)" in code
    assert "exec(" not in code
    cirq = client.post("/api/export/cirq", json=payload).json()
    assert cirq["format"] == "cirq_python"
    assert "cirq.CNOT(qubits[0], qubits[1])" in cirq["code"]


def test_platform_requires_login_and_simulation_requires_csrf(store):
    guest = TestClient(app)
    for endpoint in ("algorithms", "lessons", "challenges", "hardware/status"):
        assert guest.get(f"/api/{endpoint}").status_code == 200
    for endpoint in ("circuits", "progress"):
        assert guest.get(f"/api/{endpoint}").status_code == 401
    circuit = {"qubits": 1, "operations": [{"gate": "h", "target": 0}]}
    assert guest.post("/api/simulate", json=circuit).status_code == 401
    assert guest.post("/api/tutor/explain", json={"question": "What is H?", "circuit": circuit}).status_code == 401
    owner, _, csrf = signed_client(store)
    assert owner.post("/api/simulate", json=circuit).status_code == 403
    assert owner.post("/api/simulate", json=circuit, headers=csrf).status_code == 200
    reply = owner.post("/api/tutor/explain", json={"question": "What is H?", "circuit": circuit}, headers=csrf)
    assert reply.status_code == 200
    assert reply.json()["uses_external_ai"] is False
    assert guest.get("/api/me").json()["authenticated"] is False


def test_ai_requires_explicit_consent_and_excludes_identity(store, monkeypatch):
    import httpx
    import platform_routes

    captured = []
    real_client = httpx.AsyncClient

    def respond(request):
        captured.append(request.content.decode())
        return httpx.Response(200, json={"choices": [{"message": {"content": "H creates a superposition from the initial state."}}]})

    monkeypatch.setattr(platform_routes, "openai_api_key", "test-provider-key")
    monkeypatch.setattr(platform_routes, "ai_api_style", "chat_completions")
    monkeypatch.setattr(platform_routes, "ai_api_base_url", "https://provider.example.test/v1")
    monkeypatch.setattr(platform_routes.httpx, "AsyncClient", lambda **kwargs: real_client(transport=httpx.MockTransport(respond), **kwargs))
    owner, _, csrf = signed_client(store, "PrivateIdentity")
    payload = {"question": "What does H do?", "circuit": {"qubits": 1, "operations": [{"gate": "h", "target": 0}]}}
    assert owner.post("/api/tutor/explain", json=payload, headers=csrf).json()["uses_external_ai"] is False
    assert captured == []
    payload["allow_external_ai"] = True
    assert owner.post("/api/tutor/explain", json=payload).status_code == 403
    answer = owner.post("/api/tutor/explain", json=payload, headers=csrf).json()
    assert answer["uses_external_ai"] is True
    assert len(captured) == 1
    assert "What does H do?" in captured[0]
    assert "PrivateIdentity" not in captured[0]
    assert "@example.test" not in captured[0]


def test_curated_algorithms_match_their_claimed_outcomes():
    from content import ALGORITHMS
    from simulator import CircuitRequest, simulate

    expected = {
        "superposition": {"0": 0.5, "1": 0.5},
        "bell-pair": {"00": 0.5, "11": 0.5},
        "ghz-three": {"000": 0.5, "111": 0.5},
        "deutsch-jozsa-balanced": {"01": 0.5, "11": 0.5},
        "grover-two": {"11": 1.0},
    }
    assert {item["slug"] for item in ALGORITHMS} == expected.keys()
    for item in ALGORITHMS:
        circuit = CircuitRequest.model_validate({"qubits": item["qubits"], "operations": item["operations"]})
        final = simulate(circuit).steps[-1]
        observed = {entry.basis: entry.probability for entry in final.probabilities}
        for basis, probability in observed.items():
            assert probability == pytest.approx(expected[item["slug"]].get(basis, 0), abs=1e-9)
