"""Public concept help: fixed curriculum only, no circuits or account data."""

from collections import deque
from threading import BoundedSemaphore, Lock
from time import monotonic
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict

from limits import enforce_rate
from platform_routes import request_ai_explanation
from settings import frontend_origin

router = APIRouter(prefix="/api/discovery", tags=["discovery"])
Topic = Literal["superposition", "measurement", "interference", "bell", "mixed", "grover", "kickback"]
FACTS = {
    "superposition": "A qubit has outcomes 0 and 1. H is a quantum operation. H on |0> prepares equal amplitudes: each ideal measurement probability is 50%. One measurement returns one bit.",
    "measurement": "Prepare |+> freshly before each measurement. Each outcome is 0 or 1 with probability 50%. Finite counts vary; 10 trials need not give five of each. A measured qubit is not still in the original superposition.",
    "interference": "|+> and |-> both have computational-basis probabilities 50/50. H maps |+> to |0>, |-> to |1>. Relative phase allows amplitudes to reinforce or cancel.",
    "bell": "H on q0 then CX from q0 to q1 on initial 00 creates (|00>+|11>)/sqrt(2). Only 00 and 11 occur, each 50%. Entanglement does not enable faster-than-light communication.",
    "mixed": "The Bell pair is a pure joint state. Each reduced single-qubit state is I/2, maximally mixed with Bloch vector zero. Correlations require the joint state.",
    "grover": "For exactly four basis states and one marked |11> outcome, the initial marked probability is 25%. One ideal oracle-and-diffuser iteration gives marked probability 100%. This is a specific ideal example, not a universal iteration count.",
    "kickback": "U_f maps |x>|y> to |x>|y xor f(x)>. Target |-> is an X eigenstate of eigenvalue -1. Input amplitudes acquire (-1)^f(x); target remains |->. Relative signs across inputs affect interference.",
}
_calls: deque[float] = deque()
_lock = Lock()
_slots = BoundedSemaphore(2)


class DiscoveryHelp(BaseModel):
    model_config = ConfigDict(extra="forbid")
    topic: Topic
    level: Literal["beginner", "intermediate", "advanced"]
    consent: Literal[True]


class DiscoveryReply(BaseModel):
    answer: str
    source: str
    uses_external_ai: bool


@router.post("/explain", response_model=DiscoveryReply)
async def explain(body: DiscoveryHelp, request: Request) -> dict:
    if request.headers.get("origin") != frontend_origin:
        raise HTTPException(403, "Open this guide from QuantumWalk to request an explanation.")
    enforce_rate(request, "discovery", 3)
    enforce_rate(request, "discovery-hour", 20, 3600)
    if not _slots.acquire(blocking=False):
        raise HTTPException(429, "The guide is helping other learners. Please try again shortly.")
    try:
        now = monotonic()
        with _lock:
            while _calls and _calls[0] <= now - 3600:
                _calls.popleft()
            if len(_calls) >= 60:
                raise HTTPException(429, "AI help has reached its hourly budget. The illustrated lesson is still available.")
            _calls.append(now)
        facts = FACTS[body.topic]
        prompt = (
            f"You are QuantumWalk's friendly learning guide for a {body.level} learner. "
            "Explain the supplied facts in at most 100 words. Start with the everyday intuition, "
            "define unfamiliar terms, then suggest one thing to notice in the illustration. "
            "No markdown, no invented results, no claims of running a simulator. "
            "Avoid equations for beginners. Analogies must not imply a classical hidden bit or faster-than-light communication. "
            f"Topic: {body.topic}. Verified lesson facts: {facts}"
        )
        return await request_ai_explanation(prompt, facts, fast=True)
    finally:
        _slots.release()
