"""Public AI guide privacy, validation, fallbacks, and resource bounds."""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import discovery_routes
import platform_routes
from limits import _events
from main import app
from settings import frontend_origin


@pytest.fixture(autouse=True)
def reset_budgets():
    discovery_routes._calls.clear()
    _events.clear()
    yield
    discovery_routes._calls.clear()
    _events.clear()


def test_public_help_uses_only_fixed_content_and_returns_plain_text(monkeypatch):
    prompts = []
    async def fake_ai(prompt, local, **kwargs):
        prompts.append(prompt)
        return {"answer": "A gate changes a qubit's state.", "source": "test_ai", "uses_external_ai": True}
    monkeypatch.setattr(discovery_routes, "request_ai_explanation", fake_ai)
    response = TestClient(app).post("/api/discovery/explain", headers={"Origin": frontend_origin}, json={"topic": "superposition", "level": "beginner", "consent": True})
    assert response.status_code == 200
    assert response.json()["uses_external_ai"] is True
    assert "50%" in prompts[0] and "beginner" in prompts[0]
    assert "Circuit:" not in prompts[0] and "email" not in prompts[0]


@pytest.mark.parametrize("changes", [{"topic": "anything"}, {"level": "admin"}, {"consent": False}, {"circuit": {"qubits": 1}}])
def test_help_rejects_unapproved_input(changes):
    body = {"topic": "measurement", "level": "beginner", "consent": True, **changes}
    assert TestClient(app).post("/api/discovery/explain", headers={"Origin": frontend_origin}, json=body).status_code == 422


def test_help_checks_origin_and_falls_back_without_provider(monkeypatch):
    monkeypatch.setattr(platform_routes, "openai_api_key", "")
    client = TestClient(app)
    body = {"topic": "bell", "level": "intermediate", "consent": True}
    assert client.post("/api/discovery/explain", json=body).status_code == 403
    assert client.post("/api/discovery/explain", headers={"Origin": "https://other.example"}, json=body).status_code == 403
    reply = client.post("/api/discovery/explain", headers={"Origin": frontend_origin}, json=body)
    assert reply.status_code == 200 and reply.json()["uses_external_ai"] is False
    assert "00" in reply.json()["answer"]


def test_help_rate_and_concurrency_are_bounded(monkeypatch):
    monkeypatch.setattr(platform_routes, "openai_api_key", "")
    client = TestClient(app)
    body = {"topic": "grover", "level": "advanced", "consent": True}
    headers = {"Origin": frontend_origin}
    for _ in range(3):
        assert client.post("/api/discovery/explain", headers=headers, json=body).status_code == 200
    assert client.post("/api/discovery/explain", headers=headers, json=body).status_code == 429
    _events.clear()
    discovery_routes._slots.acquire()
    discovery_routes._slots.acquire()
    try:
        assert client.post("/api/discovery/explain", headers=headers, json=body).status_code == 429
    finally:
        discovery_routes._slots.release()
        discovery_routes._slots.release()


def test_provider_timeout_falls_back_and_responses_output_is_parsed(monkeypatch):
    import httpx
    real_client = httpx.AsyncClient
    monkeypatch.setattr(platform_routes, "openai_api_key", "test-key")
    def timeout(request):
        raise httpx.ReadTimeout("provider unavailable")
    monkeypatch.setattr(platform_routes.httpx, "AsyncClient", lambda **kwargs: real_client(transport=httpx.MockTransport(timeout), **kwargs))
    client = TestClient(app)
    body = {"topic": "measurement", "level": "beginner", "consent": True}
    reply = client.post("/api/discovery/explain", headers={"Origin": frontend_origin}, json=body)
    assert reply.status_code == 200 and reply.json()["uses_external_ai"] is False
    monkeypatch.setattr(platform_routes, "ai_api_style", "responses")
    def respond(request):
        return httpx.Response(200, json={"output": [{"type": "message", "content": [{"type": "output_text", "text": "One measurement gives one result."}]}]})
    monkeypatch.setattr(platform_routes.httpx, "AsyncClient", lambda **kwargs: real_client(transport=httpx.MockTransport(respond), **kwargs))
    reply = client.post("/api/discovery/explain", headers={"Origin": frontend_origin}, json=body)
    assert reply.json()["uses_external_ai"] is True
    assert reply.json()["answer"] == "One measurement gives one result."
