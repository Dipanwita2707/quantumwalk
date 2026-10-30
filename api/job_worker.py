"""Run `python api/job_worker.py` after explicitly enabling durable jobs.

Each allowlisted computation runs in a spawned child with a wall-clock deadline.
Only validated model inputs enter the child through the execution contract.
"""
import argparse
import logging
import multiprocessing
import os
import time
from uuid import uuid4

from database import SessionLocal
import extended_models  # Register foreign-key metadata in this independent process.
from science_models import LABS, ScienceRequest, run_model
from simulation_jobs import EXECUTION_SECONDS, claim, enabled, finalize, heartbeat

logger = logging.getLogger("quantumwalk.worker")


def compute(connection, slug, version, parameters):
    try:
        if slug not in LABS or LABS[slug].version != version:
            connection.send({"error": "model_version_changed"})
        else:
            request = ScienceRequest(parameters=parameters["parameters"], seed=parameters["seed"])
            connection.send({"result": run_model(slug, request)})
    except Exception:
        # Send only a fixed code, never exception text or private parameters.
        connection.send({"error": "model_execution_failed"})
    finally:
        connection.close()


def execute_claim(sessions, job, *, timeout=EXECUTION_SECONDS):
    context = multiprocessing.get_context("spawn")
    receiver, sender = context.Pipe(duplex=False)
    child = context.Process(target=compute, args=(sender, job["lab"], job["model_version"], job["parameters"]), daemon=True)
    message = {"error": "model_execution_failed"}
    child.start(); sender.close()
    deadline = time.monotonic() + timeout
    next_heartbeat = 0.
    try:
        while True:
            if time.monotonic() >= next_heartbeat:
                with sessions() as db:
                    if not heartbeat(db, job): break
                next_heartbeat = time.monotonic() + 2
            if time.monotonic() >= deadline:
                message = {"error": "execution_timeout"}; break
            if receiver.poll(.1):
                try: message = receiver.recv()
                except EOFError: pass
                break
            if not child.is_alive(): break
    except KeyboardInterrupt:
        message = {"error": "worker_interrupted"}
        raise
    finally:
        if child.is_alive(): child.terminate()
        child.join(timeout=5)
        if child.is_alive(): child.kill(); child.join(timeout=5)
        receiver.close()
        with sessions() as db:
            finalize(db, job, result=message.get("result"), error_code=message.get("error"))


def work_once(sessions=SessionLocal, worker_id=None, *, timeout=EXECUTION_SECONDS):
    with sessions() as db:
        job = claim(db, worker_id or f"worker-{os.getpid()}-{uuid4()}")
    if job is None: return False
    execute_claim(sessions, job, timeout=timeout)
    return True


def main():
    parser = argparse.ArgumentParser(description="Bounded QuantumWalk scientific worker")
    parser.add_argument("--once", action="store_true", help="Process at most one queued job and exit")
    args = parser.parse_args()
    if not enabled(): parser.error("Set QUANTUMWALK_DURABLE_JOBS=1 only after migrating the target database")
    worker_id = f"worker-{os.getpid()}-{uuid4()}"
    while True:
        try:
            worked = work_once(worker_id=worker_id)
        except KeyboardInterrupt:
            break
        except Exception:
            logger.error("Worker database/execution unavailable; retrying without logging private context")
            worked = False
        if args.once: break
        if not worked: time.sleep(2)


if __name__ == "__main__":
    main()
