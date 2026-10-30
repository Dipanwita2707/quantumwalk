from datetime import timedelta
from sqlalchemy import func, select
from completion_models import SimulationJob
from database import utc_now
from extended_models import LabRun, UsageBucket
from job_worker import work_once
from science_models import ScienceRequest, run_model
from simulation_jobs import claim, finalize, heartbeat
from test_platform import signed_client


def submit(client, headers, key="request-key-00000001", **extra):
    return client.post("/api/v1/labs/double-slit/jobs", json={"parameters": {}, "prediction": "Coherent slits should produce fringes.", "request_key": key, **extra}, headers=headers)


def test_queue_is_opt_in_private_idempotent_bounded_and_reserves_once(store, monkeypatch):
    alice, user_id, headers = signed_client(store, "Alice")
    bob, _, bob_headers = signed_client(store, "Bob")
    monkeypatch.setenv("QUANTUMWALK_DURABLE_JOBS", "0")
    assert submit(alice, headers).status_code == 503
    monkeypatch.setenv("QUANTUMWALK_DURABLE_JOBS", "1")
    assert submit(alice, {}).status_code == 403
    assert submit(alice, headers, parameters={"wavelength": 9999}).status_code == 422
    response = submit(alice, headers)
    assert response.status_code == 202, response.text
    row = response.json()
    assert row["status"] == "queued" and row["run_id"] is None
    assert submit(alice, headers).json()["id"] == row["id"]
    assert submit(alice, headers, parameters={"which_path": 1}).status_code == 409
    assert bob.get(f"/api/v1/simulation-jobs/{row['id']}").status_code == 404
    assert bob.post(f"/api/v1/simulation-jobs/{row['id']}/cancel", headers=bob_headers).status_code == 404
    assert bob.get("/api/v1/simulation-jobs").json() == []
    assert submit(alice, headers, key="request-key-00000002").status_code == 202
    assert submit(alice, headers, key="request-key-00000003").status_code == 202
    assert submit(alice, headers, key="request-key-00000004").status_code == 429
    assert alice.post(f"/api/v1/simulation-jobs/{row['id']}/cancel", headers=headers).json()["status"] == "cancelled"
    with store() as db:
        assert db.scalar(select(UsageBucket.used).where(UsageBucket.user_id == user_id, UsageBucket.feature == "lab.run")) == 3
        assert db.scalar(select(func.count()).select_from(LabRun)) == 0


def test_claims_are_exclusive_and_expired_attempt_cannot_finalize(store, monkeypatch):
    monkeypatch.setenv("QUANTUMWALK_DURABLE_JOBS", "1")
    alice, _, headers = signed_client(store, "Alice")
    for i in range(3): assert submit(alice, headers, key=f"claim-request-{i:08}").status_code == 202
    with store() as db:
        first = claim(db, "worker-a"); second = claim(db, "worker-b")
        assert first["id"] != second["id"]
        assert claim(db, "worker-c") is None
        row = db.get(SimulationJob, first["id"]); row.lease_expires_at = utc_now()-timedelta(seconds=1); db.commit()
        assert heartbeat(db, first) is False
        replacement = claim(db, "worker-replacement")
        assert replacement["id"] == first["id"] and replacement["lease"] != first["lease"]
        assert finalize(db, first, result=run_model("double-slit", ScienceRequest())) is False
        assert finalize(db, replacement, result=run_model("double-slit", ScienceRequest())) is True
        assert finalize(db, replacement, result=run_model("double-slit", ScienceRequest())) is False
        assert db.scalar(select(func.count()).select_from(LabRun)) == 1
    current = alice.get(f"/api/v1/simulation-jobs/{first['id']}").json()
    assert current["status"] == "completed"
    assert alice.get(f"/api/v1/runs/{current['run_id']}").json()["seed"] == 42


def test_running_cancellation_and_retry_limit_never_save_success(store, monkeypatch):
    monkeypatch.setenv("QUANTUMWALK_DURABLE_JOBS", "1")
    alice, _, headers = signed_client(store, "Alice")
    row = submit(alice, headers).json()
    with store() as db: job = claim(db, "worker")
    response = alice.post(f"/api/v1/simulation-jobs/{row['id']}/cancel", headers=headers)
    assert response.json()["cancel_requested"] is True
    with store() as db:
        assert not heartbeat(db, job)
        assert finalize(db, job, result=run_model("double-slit", ScienceRequest()))
        assert db.get(SimulationJob, row["id"]).status == "cancelled"
        assert db.scalar(select(func.count()).select_from(LabRun)) == 0
    second = submit(alice, headers, key="retry-request-000001").json()
    with store() as db:
        for i in range(3):
            job = claim(db, "worker")
            assert job["id"] == second["id"]
            record = db.get(SimulationJob, job["id"]); record.lease_expires_at = utc_now()-timedelta(seconds=1); db.commit()
        assert claim(db, "worker") is None
        assert db.get(SimulationJob, second["id"]).error_code == "lease_expired"


def test_real_spawned_worker_persists_result_and_enforces_timeout(store, monkeypatch):
    monkeypatch.setenv("QUANTUMWALK_DURABLE_JOBS", "1")
    alice, _, headers = signed_client(store, "Alice")
    row = submit(alice, headers).json()
    assert work_once(store, "real-worker")
    completed = alice.get(f"/api/v1/simulation-jobs/{row['id']}").json()
    assert completed["status"] == "completed"
    result = alice.get(f"/api/v1/runs/{completed['run_id']}").json()
    assert result["metrics"]["Detected particles"] == 1000
    second = submit(alice, headers, key="timeout-request-0001").json()
    assert work_once(store, "timeout-worker", timeout=0)
    failed = alice.get(f"/api/v1/simulation-jobs/{second['id']}").json()
    assert failed["status"] == "failed" and failed["error_code"] == "execution_timeout" and failed["run_id"] is None
