from fastapi.testclient import TestClient
from sqlalchemy import select

from main import app
from extended_models import AuditEvent, LabRun, MissionEvent, UserRole, UsageBucket
from test_platform import signed_client


def make_run(client, headers, slug="double-slit", **parameters):
    response = client.post(f"/api/v1/labs/{slug}/runs", json={"parameters": parameters, "seed": 42, "prediction": "Changing one input should change the modeled result."}, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_universe_reveals_only_server_confirmed_mastery(store):
    alice, alice_id, headers = signed_client(store, "Alice")
    bob, _, _ = signed_client(store, "Bob")
    assert TestClient(app).get("/api/v1/discovery/universe").status_code == 401
    before = alice.get("/api/v1/discovery/universe").json()
    assert before["discovered"] == 0
    assert next(item for item in before["objects"] if item["id"] == "tunnelling")["state"] == "locked"
    run = make_run(alice, headers)
    assert alice.get("/api/v1/discovery/universe").json()["discovered"] == 0
    event = alice.post("/api/v1/missions/double-slit/events", json={"run_id": run["id"], "choice": 0, "reflection": "My saved result shows the interference from coherent slits."}, headers=headers)
    assert event.status_code == 200
    after = alice.get("/api/v1/discovery/universe").json()
    assert after["discovered"] == 1
    assert next(item for item in after["objects"] if item["id"] == "double-slit")["discovered_at"]
    assert next(item for item in after["objects"] if item["id"] == "tunnelling")["state"] == "available"
    assert bob.get("/api/v1/discovery/universe").json()["discovered"] == 0
    with store() as db:
        assert len(list(db.scalars(select(MissionEvent).where(MissionEvent.user_id == alice_id)))) == 1


def test_what_if_is_private_bounded_persisted_and_same_seed(store):
    alice, user_id, headers = signed_client(store, "Alice")
    bob, _, bob_headers = signed_client(store, "Bob")
    baseline = make_run(alice, headers)
    path = f"/api/v1/runs/{baseline['id']}/what-if"
    payload = {"parameters": {"which_path": 1}, "prediction": "Recording the path should remove the fringes."}
    assert bob.post(path, json=payload, headers=bob_headers).status_code == 404
    assert alice.post(path, json=payload).status_code == 403
    response = alice.post(path, json=payload, headers=headers)
    assert response.status_code == 201, response.text
    variant = response.json()["variant"]
    assert variant["id"] != baseline["id"]
    assert variant["seed"] == baseline["seed"]
    assert variant["parameters"]["which_path"] == 1
    assert alice.get(f"/api/v1/runs/{baseline['id']}").json()["parameters"]["which_path"] == 0
    assert variant["analysis_context"]["baseline_run_id"] == baseline["id"]
    with store() as db:
        assert db.get(LabRun, variant["id"]).owner_user_id == user_id
    for invalid in [{"which_path": 0}, {"unknown": 1}, {"wavelength": 900}]:
        assert alice.post(path, json={**payload, "parameters": invalid}, headers=headers).status_code == 422
    with store() as db:
        old = db.get(LabRun, baseline["id"]); old.model_version = "old-version"; db.commit()
    assert alice.post(path, json=payload, headers=headers).status_code == 409


def test_autopsy_preserves_prediction_and_never_claims_to_grade_it(store):
    alice, _, headers = signed_client(store, "Alice")
    bob, _, _ = signed_client(store, "Bob")
    run = make_run(alice, headers, which_path=1)
    path = f"/api/v1/runs/{run['id']}/autopsy"
    assert bob.get(path).status_code == 404
    review = alice.get(path).json()
    assert review["prediction"] == run["prediction"]
    assert len(review["configuration_checksum"]) == 64
    assert review["configuration_checksum"] == alice.get(path).json()["configuration_checksum"]
    assert any(check["name"] == "Parameter boundaries" and check["state"] == "warning" for check in review["checks"])
    assert "does not automatically grade" in review["assessment"]


def test_operations_is_admin_only_and_redacts_incidents(store):
    alice, user_id, headers = signed_client(store, "Alice")
    endpoint = "/api/v1/admin/operations"
    assert alice.get(endpoint).status_code == 403
    with store() as db:
        db.add(UserRole(user_id=user_id, role="admin")); db.commit()
    bad = alice.post("/api/v1/labs/double-slit/runs", json={"parameters": {"wavelength": 9999}, "prediction": "PRIVATE-PREDICTION-NEVER-LOG"}, headers=headers)
    assert bad.status_code == 422
    result = alice.get(endpoint)
    assert result.status_code == 200
    assert result.json()["incidents"][0]["code"] == "invalid_model_input"
    assert "PRIVATE-PREDICTION" not in result.text
    assert result.json()["usage_today"].get("lab.run", 0) == 0
    assert result.json()["runtime"]["durable_queue"] is False
    with store() as db:
        assert "PRIVATE-PREDICTION" not in str(list(db.scalars(select(AuditEvent)))[0].details)
