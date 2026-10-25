"""Public learning content and user-owned application resources."""

from __future__ import annotations

from datetime import datetime
import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
import httpx
from pydantic import BaseModel, ConfigDict, Field, field_validator
from qiskit import QuantumCircuit, qasm2
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import (
    AuthContext,
    check_csrf,
    csrf_for_token,
    current_auth,
    get_db,
    optional_auth,
    require_csrf,
)
from content import ALGORITHMS, CHALLENGES, CHALLENGE_TIERS, LESSONS, LESSON_ANSWERS
from database import Circuit, Progress, User
from limits import enforce_rate, simulation_slot
from settings import ai_api_base_url, ai_api_style, google_enabled, openai_api_key, openai_model
from circuit_bridge import build_qiskit_circuit, export_cirq_python, export_qiskit_python
from qiskit import transpile
from simulator import CircuitRequest, simulate

def require_platform_session(request: Request, auth: AuthContext | None = Depends(optional_auth)) -> None:
    if request.url.path != "/api/me" and auth is None:
        raise HTTPException(status_code=401, detail="Sign in to enter your private lab")


router = APIRouter(prefix="/api", dependencies=[Depends(require_platform_session)])


class CircuitSave(CircuitRequest):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("A circuit name is required")
        return value


class CircuitView(BaseModel):
    id: str
    name: str
    qubits: int
    operations: list[dict]
    updated_at: datetime


class LessonAnswer(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    choice: int = Field(ge=0, le=10)


class ChallengeSubmission(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    circuit: CircuitRequest


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    display_name: str = Field(min_length=1, max_length=120)
    analytics_opt_in: bool

    @field_validator("display_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("A display name is required")
        return value


class TutorQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    question: str = Field(min_length=1, max_length=500)
    circuit: CircuitRequest
    allow_external_ai: bool = False


def circuit_view(circuit: Circuit) -> CircuitView:
    return CircuitView(
        id=circuit.id, name=circuit.name, qubits=circuit.qubits,
        operations=circuit.operations_json, updated_at=circuit.updated_at,
    )


def owned_circuit(db: Session, circuit_id: str, user_id: str) -> Circuit:
    circuit = db.scalar(select(Circuit).where(Circuit.id == circuit_id, Circuit.owner_user_id == user_id))
    if circuit is None:
        raise HTTPException(status_code=404, detail="Circuit not found")
    return circuit


def save_progress(db: Session, user_id: str, activity_slug: str, score: int) -> None:
    progress = db.scalar(select(Progress).where(Progress.user_id == user_id, Progress.activity_slug == activity_slug))
    if progress is None:
        progress = Progress(user_id=user_id, activity_slug=activity_slug, score=score, completed=score == 100)
        db.add(progress)
    else:
        progress.score = max(progress.score, score)
        progress.completed = progress.score == 100
    db.commit()


@router.get("/me")
def me(auth: AuthContext | None = Depends(optional_auth)) -> dict:
    if auth is None:
        return {"authenticated": False, "google_enabled": google_enabled}
    user = auth.user
    return {
        "authenticated": True,
        "id": user.id,
        "display_name": user.display_name,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "analytics_opt_in": user.analytics_opt_in,
        "csrf_token": csrf_for_token(auth.token),
    }


@router.get("/algorithms")
def algorithms() -> list[dict]:
    return ALGORITHMS


@router.get("/algorithms/{slug}")
def algorithm(slug: str) -> dict:
    item = next((entry for entry in ALGORITHMS if entry["slug"] == slug), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    return item


@router.get("/lessons")
def lessons() -> list[dict]:
    return LESSONS


@router.get("/lessons/{slug}")
def lesson(slug: str) -> dict:
    item = next((entry for entry in LESSONS if entry["slug"] == slug), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return item


@router.post("/lessons/{slug}/answer")
def answer_lesson(
    slug: str, answer: LessonAnswer, request: Request,
    auth: AuthContext | None = Depends(optional_auth), db: Session = Depends(get_db),
) -> dict:
    item = next((entry for entry in LESSONS if entry["slug"] == slug), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    enforce_rate(request, "lesson", 30)
    if auth:
        check_csrf(request, auth)
    if answer.choice >= len(item["choices"]):
        raise HTTPException(status_code=422, detail="Invalid answer choice")
    correct = answer.choice == LESSON_ANSWERS[slug]
    if auth:
        save_progress(db, auth.user.id, f"lesson:{slug}", 100 if correct else 0)
    return {"correct": correct, "score": 100 if correct else 0, "saved": auth is not None}


@router.get("/challenges")
def challenges() -> list[dict]:
    return CHALLENGES


@router.post("/challenges/{slug}/submit")
def submit_challenge(
    slug: str, submission: ChallengeSubmission, request: Request,
    auth: AuthContext | None = Depends(optional_auth), db: Session = Depends(get_db),
) -> dict:
    challenge = next((entry for entry in CHALLENGES if entry["slug"] == slug), None)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    enforce_rate(request, "challenge", 15)
    if auth:
        check_csrf(request, auth)
    if submission.circuit.qubits != challenge["qubits"]:
        raise HTTPException(status_code=422, detail="Use the qubit count shown in the challenge")
    # Grading needs ideal probabilities; terminal measurement samples are unnecessary.
    ideal_request = CircuitRequest(
        qubits=submission.circuit.qubits,
        operations=[operation for operation in submission.circuit.operations if operation.gate != "measure"],
        shots=1,
    )
    with simulation_slot():
        final = simulate(ideal_request).steps[-1]
    probabilities = {entry.basis: entry.probability for entry in final.probabilities}
    if slug == "make-superposition":
        solved = abs(probabilities["0"] - 0.5) < 1e-6 and abs(probabilities["1"] - 0.5) < 1e-6
    else:
        solved = all(abs(probabilities[basis] - expected) < 1e-6 for basis, expected in {"00": 0.5, "01": 0, "10": 0, "11": 0.5}.items())
    tier = "none"
    gate_ops = [op for op in submission.circuit.operations if op.gate != "measure"]
    limits = CHALLENGE_TIERS.get(slug, {"max_gates": 99, "reference_ops": 99})
    if solved:
        tier = "bronze"
        if len(gate_ops) <= limits["max_gates"]:
            tier = "silver"
        if len(gate_ops) <= limits["reference_ops"]:
            tier = "gold"
    score = {"none": 0, "bronze": 60, "silver": 80, "gold": 100}[tier]
    xp_awarded = score
    if auth:
        save_progress(db, auth.user.id, f"challenge:{slug}", score)
    return {
        "solved": solved,
        "score": score,
        "tier": tier,
        "xp_awarded": xp_awarded,
        "saved": auth is not None,
        "hint": None if solved else "Run the circuit and match the goal probabilities shown in the mission.",
    }


class DiscoveryProgressBody(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    explored: int = Field(ge=0, le=4)


@router.post("/discovery/progress")
def save_discovery_progress(
    body: DiscoveryProgressBody,
    request: Request,
    auth: AuthContext | None = Depends(optional_auth),
    db: Session = Depends(get_db),
) -> dict:
    enforce_rate(request, "discovery", 20)
    if auth:
        check_csrf(request, auth)
    score = min(body.explored * 25, 100)
    if auth:
        save_progress(db, auth.user.id, "discovery:introduction", score)
    return {"explored": body.explored, "score": score, "saved": auth is not None}


@router.post("/transpile-preview")
def transpile_preview(circuit: CircuitRequest, request: Request) -> dict:
    enforce_rate(request, "transpile", 30)
    try:
        built = build_qiskit_circuit(
            CircuitRequest(qubits=circuit.qubits, operations=[op for op in circuit.operations if op.gate != "measure"], shots=1)
        )
        lowered = transpile(built, basis_gates=["cx", "h", "rz"], optimization_level=1)
        return {
            "depth": lowered.depth(),
            "size": lowered.size(),
            "basis_gates": sorted({instruction.operation.name for instruction in lowered.data}),
            "note": "Educational preview using a common gate set. Not a hardware calibration.",
        }
    except Exception as exc:  # noqa: BLE001 — return safe client message
        raise HTTPException(status_code=422, detail=f"Transpile preview unavailable: {exc}") from exc


@router.get("/progress")
def progress(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)) -> list[dict]:
    records = db.scalars(select(Progress).where(Progress.user_id == auth.user.id).limit(100)).all()
    return [{"activity_slug": item.activity_slug, "completed": item.completed, "score": item.score} for item in records]


@router.get("/circuits", response_model=list[CircuitView])
def list_circuits(offset: int = Query(0, ge=0, le=100), auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)) -> list[CircuitView]:
    circuits = db.scalars(select(Circuit).where(Circuit.owner_user_id == auth.user.id).order_by(Circuit.updated_at.desc()).offset(offset).limit(50)).all()
    return [circuit_view(item) for item in circuits]


@router.post("/circuits", response_model=CircuitView, status_code=201)
def create_circuit(payload: CircuitSave, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)) -> CircuitView:
    count = db.scalar(select(func.count()).select_from(Circuit).where(Circuit.owner_user_id == auth.user.id))
    if count >= 100:
        raise HTTPException(status_code=409, detail="Circuit limit reached. Delete one before saving another.")
    circuit = Circuit(
        owner_user_id=auth.user.id, name=payload.name, qubits=payload.qubits,
        operations_json=[operation.model_dump(exclude_none=True) for operation in payload.operations],
    )
    db.add(circuit)
    db.commit()
    return circuit_view(circuit)


@router.get("/circuits/{circuit_id}", response_model=CircuitView)
def get_circuit(circuit_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)) -> CircuitView:
    return circuit_view(owned_circuit(db, circuit_id, auth.user.id))


@router.put("/circuits/{circuit_id}", response_model=CircuitView)
def update_circuit(circuit_id: str, payload: CircuitSave, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)) -> CircuitView:
    circuit = owned_circuit(db, circuit_id, auth.user.id)
    circuit.name = payload.name
    circuit.qubits = payload.qubits
    circuit.operations_json = [operation.model_dump(exclude_none=True) for operation in payload.operations]
    db.commit()
    return circuit_view(circuit)


@router.delete("/circuits/{circuit_id}", status_code=204)
def delete_circuit(circuit_id: str, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)) -> Response:
    db.delete(owned_circuit(db, circuit_id, auth.user.id))
    db.commit()
    return Response(status_code=204)


@router.put("/profile")
def update_profile(payload: ProfileUpdate, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)) -> dict:
    user = db.get(User, auth.user.id)
    user.display_name = payload.display_name
    user.analytics_opt_in = payload.analytics_opt_in
    db.commit()
    return {"display_name": user.display_name, "analytics_opt_in": user.analytics_opt_in}


@router.get("/account/export")
def export_account(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)) -> dict:
    circuits = db.scalars(select(Circuit).where(Circuit.owner_user_id == auth.user.id).limit(1000)).all()
    progress_rows = db.scalars(select(Progress).where(Progress.user_id == auth.user.id).limit(1000)).all()
    return {
        "profile": {"display_name": auth.user.display_name, "email": auth.user.email},
        "circuits": [circuit_view(item).model_dump(mode="json") for item in circuits],
        "progress": [{"activity_slug": item.activity_slug, "score": item.score} for item in progress_rows],
    }


def curated_explanation(question: TutorQuestion) -> str:
    operations = question.circuit.operations
    topic = question.question.lower()
    if "probab" in topic or "count" in topic or "shot" in topic:
        explanation = "Ideal probabilities come from the exact simulated state. Counts come from a finite number of sampled shots, so they can vary between runs."
    elif "bloch" in topic or "entang" in topic:
        explanation = "A Bloch vector describes one qubit's local state. If it is entangled with another qubit, its vector can be shorter than the sphere radius."
    elif "phase" in topic:
        explanation = "Phase belongs to the complex amplitude. A Z gate can change relative phase without changing immediate measurement probabilities."
    elif not operations:
        explanation = "Start with an H gate on q0. It makes the ideal probabilities of 0 and 1 equal."
    elif operations[-1].gate == "measure":
        explanation = "Measurement gives a sampled classical outcome. Compare its counts with exact ideal probabilities; small differences are normal."
    elif operations[-1].gate == "cx":
        explanation = "CX flips its target only when its control is 1. In a superposition, it can correlate qubits."
    elif operations[-1].gate == "h":
        explanation = "H mixes the 0 and 1 amplitudes. Run the circuit to see exact probabilities at this step."
    else:
        explanation = "This gate changes the state. Step through the circuit to inspect its simulator-derived amplitudes and probabilities."
    return explanation


@router.post("/tutor/explain")
async def explain_tutor(question: TutorQuestion, request: Request, auth: AuthContext = Depends(require_csrf)) -> dict:
    enforce_rate(request, "tutor", 15)
    local = curated_explanation(question)
    if not openai_api_key or not question.allow_external_ai:
        return {"source": "curated_local_explanation", "answer": local, "uses_external_ai": False}

    prompt = (
        "You are QuantumWalk's quantum-computing tutor. Explain for a beginner in plain language. "
        "Use the supplied circuit only as context. Do not invent numerical results; tell the learner "
        "to verify numbers in the simulator. Keep the answer under 120 words.\n\n"
        f"Question: {question.question}\nCircuit: {json.dumps(question.circuit.model_dump(mode='json'))}"
    )
    return await request_ai_explanation(prompt, local)


async def request_ai_explanation(prompt: str, local: str, *, fast: bool = False) -> dict:
    """Bounded provider request shared by the private tutor and public concept guide."""
    if not openai_api_key:
        return {"source": "curated_local_fallback", "answer": local, "uses_external_ai": False}
    try:
        payload = {"model": openai_model, "messages": [{"role": "user", "content": prompt}], "max_tokens": 1000}
        endpoint = f"{ai_api_base_url}/chat/completions"
        # Short, verified concept explanations do not need a large reasoning budget.
        if fast and ai_api_base_url == "https://openrouter.ai/api/v1" and openai_model.split("/")[-1].startswith("gpt-5"):
            payload["reasoning"] = {"effort": "minimal", "exclude": True}
        if ai_api_style == "responses":
            endpoint = f"{ai_api_base_url}/responses"
            payload = {"model": openai_model, "input": prompt, "store": False, "max_output_tokens": 220}
        async with asyncio.timeout(12.0):
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(endpoint, headers={"Authorization": f"Bearer {openai_api_key}"}, json=payload)
                response.raise_for_status()
                result = response.json()
        answer = result.get("output_text")
        if ai_api_style == "responses" and not answer:
            answer = "\n".join(part.get("text", "") for item in result.get("output", []) for part in item.get("content", []) if part.get("type") == "output_text")
        if ai_api_style != "responses":
            choices = result.get("choices", [])
            answer = choices[0].get("message", {}).get("content") if choices else None
        if isinstance(answer, str) and answer.strip():
            source = "openai_responses_api" if ai_api_style == "responses" else "openai_compatible_chat"
            return {"source": source, "answer": answer.strip()[:3000], "uses_external_ai": True}
    except (httpx.HTTPError, TimeoutError, ValueError, KeyError, TypeError, AttributeError):
        pass
    return {"source": "curated_local_fallback", "answer": local, "uses_external_ai": False}


@router.get("/hardware/status")
def hardware_status() -> dict:
    return {"available": False, "message": "Real quantum hardware is a later, optional integration."}


@router.post("/export/qiskit")
def export_qiskit(circuit: CircuitRequest, request: Request) -> dict:
    enforce_rate(request, "export", 30)
    return {"format": "qiskit_python", "code": export_qiskit_python(circuit)}


@router.post("/export/cirq")
def export_cirq(circuit: CircuitRequest, request: Request) -> dict:
    enforce_rate(request, "export", 30)
    return {"format": "cirq_python", "code": export_cirq_python(circuit)}


@router.post("/export/qasm")
def export_qasm(circuit: CircuitRequest, request: Request) -> dict:
    enforce_rate(request, "export", 30)
    quantum = QuantumCircuit(circuit.qubits, circuit.qubits)
    for operation in circuit.operations:
        if operation.gate in {"cx", "cz", "swap"}:
            getattr(quantum, operation.gate)(operation.control, operation.target)
        elif operation.gate in {"rx", "ry", "rz"}:
            getattr(quantum, operation.gate)(operation.angle, operation.target)
        elif operation.gate == "measure":
            quantum.measure(operation.target, operation.target)
        else:
            getattr(quantum, operation.gate)(operation.target)
    return {"format": "openqasm_2", "code": qasm2.dumps(quantum)}
