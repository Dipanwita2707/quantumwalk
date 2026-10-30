import math

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from main import app
from science_models import LABS, ScienceRequest, run_model, transmission
from extended_models import RewardEvent, UsageBucket
from test_platform import signed_client


@pytest.mark.parametrize("slug", LABS)
def test_models_are_finite_bounded_and_reproducible(slug):
    request = ScienceRequest(seed=17)
    result = run_model(slug, request)
    assert result == run_model(slug, request)
    assert len(result["x"]) <= 128
    for series in result["series"]:
        assert len(series["values"]) == len(result["x"])
        assert all(math.isfinite(value) for value in series["values"])


def test_physical_reference_cases():
    assert transmission(1, 3, 0) == 1
    assert transmission(1, 3, .2) > transmission(1, 3, .4)
    assert transmission(3, 3, .3) == pytest.approx(1 / (1 + 3 * .3**2 / (4 * .03809982)))
    assert run_model("bell", ScienceRequest())["metrics"]["Ideal CHSH S"] == pytest.approx(2 * math.sqrt(2))
    assert run_model("bell", ScienceRequest(parameters={"visibility": 0.}))["metrics"]["Ideal CHSH S"] == 0
    oscillator = run_model("oscillator", ScienceRequest())
    dx = oscillator["x"][1] - oscillator["x"][0]
    assert sum(oscillator["series"][0]["values"]) * dx == pytest.approx(1, abs=1e-6)
    assert run_model("spectrum", ScienceRequest(parameters={"noise": 0.}))["metrics"]["Peak frequency (Hz)"] == 8
    slit = run_model("double-slit", ScienceRequest())
    assert sum(slit["series"][1]["values"]) == 1000
    assert sum(slit["series"][0]["values"]) == pytest.approx(1000)


def test_streak_counts_mastery_days_without_removing_progress():
    from datetime import date, timedelta
    from laboratory_routes import mastery_streak
    today = date(2026, 10, 29)
    assert mastery_streak({today, today - timedelta(days=1)}, today) == 2
    assert mastery_streak({today - timedelta(days=1), today - timedelta(days=2)}, today) == 2
    assert mastery_streak({today - timedelta(days=2)}, today) == 0


def test_model_validation_and_public_api(store):
    client = TestClient(app)
    assert len(client.get("/api/science/labs").json()) == 9
    assert client.post("/api/science/labs/tunnelling/run", json={"parameters": {"width": 100}}).status_code == 422
    assert client.post("/api/science/labs/oscillator/run", json={"parameters": {"state": 1.5}}).status_code == 422
    assert client.post("/api/science/labs/spectrum/run", json={"parameters": {"unknown": 1}}).status_code == 422
    assert client.post("/api/science/labs/missing/run", json={}).status_code == 404


def test_private_run_report_ownership_and_mission_idempotency(store):
    alice, user_id, headers = signed_client(store, "Alice")
    bob, _, bob_headers = signed_client(store, "Bob")
    payload = {"parameters": {}, "seed": 42, "prediction": "Recording the path removes the fringes."}
    assert TestClient(app).post("/api/v1/labs/double-slit/runs", json=payload).status_code == 401
    response = alice.post("/api/v1/labs/double-slit/runs", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    assert response.json()["created_at"].endswith("Z") or response.json()["created_at"].endswith("+00:00")
    run_id = response.json()["id"]
    assert bob.get(f"/api/v1/runs/{run_id}").status_code == 404
    assert bob.delete(f"/api/v1/runs/{run_id}", headers=bob_headers).status_code == 404
    assert bob.get(f"/api/v1/runs/{run_id}/export?format=json").status_code == 404
    report = alice.post("/api/v1/reports", json={"run_id": run_id, "format": "pdf"}, headers=headers)
    assert report.status_code == 201, report.text
    path = report.json()["download"]
    assert alice.get(path).content.startswith(b"%PDF-1.4")
    assert bob.get(path).status_code == 404
    assessment = {"run_id": run_id, "choice": 0, "reflection": "The pattern agrees with the loss of coherence when the path is recorded."}
    assert alice.post("/api/v1/missions/double-slit/events", json=assessment, headers=headers).json()["xp_awarded"] == 100
    assert alice.post("/api/v1/missions/double-slit/events", json=assessment, headers=headers).json()["xp_awarded"] == 0
    with store() as db:
        assert db.scalar(select(func.count()).select_from(RewardEvent).where(RewardEvent.user_id == user_id)) == 1
    assert alice.get("/api/v1/me/progress").json()["xp"] == 100


def test_notebook_ownership_and_quotas(store):
    alice, user_id, headers = signed_client(store, "Alice")
    bob, _, bob_headers = signed_client(store, "Bob")
    run = alice.post("/api/v1/labs/oscillator/runs", json={"parameters": {}, "prediction": "Ground state has nonzero energy."}, headers=headers).json()
    notebook = alice.post("/api/v1/notebooks", json={"title": "Physics notes"}, headers=headers).json()
    endpoint = f"/api/v1/notebooks/{notebook['id']}/entries"
    assert bob.get(endpoint).status_code == 404
    assert bob.post(endpoint, json={"run_id": run["id"]}, headers=bob_headers).status_code == 404
    entry = alice.post(endpoint, json={"run_id": run["id"], "notes": "Zero-point energy"}, headers=headers)
    assert entry.status_code == 201
    assert alice.put(endpoint + "/" + entry.json()["id"], json={"notes": "Updated interpretation"}, headers=headers).status_code == 200
    with store() as db:
        bucket = db.scalar(select(UsageBucket).where(UsageBucket.user_id == user_id, UsageBucket.feature == "lab.run"))
        bucket.used = 30; db.commit()
    failed = alice.post("/api/v1/labs/oscillator/runs", json={"parameters": {}, "prediction": "Ground state has nonzero energy."}, headers=headers)
    assert failed.status_code == 429
