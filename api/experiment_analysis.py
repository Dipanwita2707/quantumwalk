"""Owner-scoped controlled variants and evidence-based experiment review."""
import hashlib
import json
import math

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from auth import AuthContext, current_auth, get_db, require_csrf
from laboratory_routes import RunInput, create_run, owned_run
from science_models import LABS

router = APIRouter(prefix="/api/v1/runs")


class WhatIfInput(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    parameters: dict[str, float] = Field(min_length=1, max_length=3)
    prediction: str = Field(min_length=3, max_length=2000)


def metric_changes(before, after):
    changes = []
    for name, value in before.items():
        other = after.get(name)
        if isinstance(value, (int, float)) and isinstance(other, (int, float)) and not isinstance(value, bool) and not isinstance(other, bool):
            if math.isfinite(value) and math.isfinite(other):
                changes.append({"metric": name, "baseline": value, "variant": other, "difference": other - value})
    return changes


@router.post("/{run_id}/what-if", status_code=201)
def what_if(run_id: str, body: WhatIfInput, request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    baseline = owned_run(db, run_id, auth.user.id)
    lab = LABS.get(baseline.lab_slug)
    if baseline.status != "completed" or not lab or baseline.model_version != lab.version:
        raise HTTPException(409, "Choose a completed run of the current model version for a controlled comparison")
    previous = baseline.result["parameters"]
    allowed = {parameter.key for parameter in lab.parameters}
    if set(body.parameters) - allowed:
        raise HTTPException(422, "Choose parameters supported by this model")
    changes = {key: {"before": previous[key], "after": value} for key, value in body.parameters.items() if value != previous[key]}
    if not changes:
        raise HTTPException(422, "Change at least one parameter before running a variant")
    seed = baseline.result["seed"]
    variant = create_run(lab.slug, RunInput(parameters={**previous, **body.parameters}, seed=seed, prediction=body.prediction), request, auth, db,
                         context={"kind": "what-if", "baseline_run_id": baseline.id, "changes": changes, "seed_policy": "same-seed"})
    return {"baseline_run_id": baseline.id, "variant": variant, "parameter_changes": changes,
            "metrics": metric_changes(baseline.result.get("metrics", {}), variant.get("metrics", {})),
            "same_grid": baseline.result.get("x") == variant.get("x"),
            "interpretation": "The seed and model version are held fixed. Differences reflect the changed inputs within this model; they do not establish physical causation outside its assumptions."}


@router.get("/{run_id}/autopsy")
def autopsy(run_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    run = owned_run(db, run_id, auth.user.id)
    result = run.result
    card = result.get("model_card", {})
    lab = LABS.get(run.lab_slug)
    checks = [{"name": "Execution", "state": "pass" if run.status == "completed" else "warning", "detail": f"Recorded execution status: {run.status}."},
              {"name": "Provenance", "state": "info", "detail": f"Stored model {run.model_version}; seed {result.get('seed')}."}]
    series = result.get("series", [])
    finite = bool(series) and all(isinstance(value, (int, float)) and math.isfinite(value) for item in series for value in item.get("values", []))
    aligned = bool(series) and all(len(item.get("values", [])) == len(result.get("x", [])) for item in series)
    checks.append({"name": "Numerical integrity", "state": "pass" if finite and aligned else "warning", "detail": "Stored plot series are finite and align with their axis." if finite and aligned else "The stored series need inspection before interpretation."})
    limits = []
    if lab and lab.version == run.model_version:
        for parameter in lab.parameters:
            value = result.get("parameters", {}).get(parameter.key)
            if value in (parameter.minimum, parameter.maximum):
                limits.append(parameter.label)
    checks.append({"name": "Parameter boundaries", "state": "warning" if limits else "info", "detail": f"At a supported boundary: {', '.join(limits)}. Inspect the model assumptions before extrapolating." if limits else "No current-model parameter is exactly at a declared boundary; this is not a validity guarantee."})
    signature = {key: result.get(key) for key in ("lab", "model_version", "seed", "parameters")}
    return {"run_id": run.id, "prediction": run.prediction, "checks": checks,
            "assumptions": card.get("assumptions", "No model-card snapshot was saved with this run."),
            "limitations": card.get("limitations", "Consult the versioned model reference before interpreting this result."),
            "interpretation": result.get("interpretation"), "analysis_context": result.get("analysis_context"),
            "configuration_checksum": hashlib.sha256(json.dumps(signature, sort_keys=True, allow_nan=False).encode()).hexdigest(),
            "next_steps": ["Compare the observed result with your written prediction.", "Change one parameter and hold the seed fixed.", "Repeat with another seed to inspect sampling variation where applicable."],
            "assessment": "This review checks recorded evidence and provenance. It does not automatically grade the scientific correctness of your prediction or replace expert review."}
