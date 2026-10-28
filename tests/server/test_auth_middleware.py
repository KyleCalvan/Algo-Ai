"""Tests for API key authentication middleware."""

from __future__ import annotations

import pytest

pytest.importorskip("fastapi", reason="openjarvis[server] not installed")

from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from openjarvis.server.auth_middleware import AuthMiddleware


def _make_app(api_key: str) -> FastAPI:
    app = FastAPI()
    app.add_middleware(AuthMiddleware, api_key=api_key)

    @app.get("/v1/models")
    async def models():
        return {"models": []}

    @app.post("/v1/chat/completions")
    async def chat(request: Request):
        return {"public": getattr(request.state, "public_chat", False)}

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    @app.post("/webhooks/twilio")
    async def twilio_webhook():
        return {"status": "received"}

    @app.get("/metrics")
    async def metrics():
        return {"requests": 0}

    @app.get("/v1/modules/list")
    async def modules():
        return []

    @app.get("/v1/modules/mod_123456789a")
    async def module():
        return {"source": "lesson"}

    @app.post("/v1/modules/import/text")
    async def import_module():
        return {"status": "imported"}

    return app


@pytest.fixture
def client():
    return TestClient(_make_app("oj_sk_test123"))


class TestAuthMiddleware:
    def test_rejects_missing_auth_header(self, client):
        resp = client.get("/v1/models")
        assert resp.status_code == 401
        assert "missing" in resp.json()["detail"].lower()

    def test_rejects_wrong_key(self, client):
        resp = client.get(
            "/v1/models",
            headers={"Authorization": "Bearer wrong"},
        )
        assert resp.status_code == 401
        assert "invalid" in resp.json()["detail"].lower()

    def test_accepts_valid_key(self, client):
        resp = client.get(
            "/v1/models",
            headers={"Authorization": "Bearer oj_sk_test123"},
        )
        assert resp.status_code == 200

    def test_health_exempt(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_webhooks_exempt(self, client):
        resp = client.post("/webhooks/twilio")
        assert resp.status_code == 200

    def test_metrics_requires_auth(self, client):
        resp = client.get("/metrics")
        assert resp.status_code == 401

    def test_metrics_accepts_valid_key(self, client):
        resp = client.get(
            "/metrics", headers={"Authorization": "Bearer oj_sk_test123"}
        )
        assert resp.status_code == 200

    def test_no_key_configured_allows_all(self):
        client = TestClient(_make_app(""))
        resp = client.get("/v1/models")
        assert resp.status_code == 200
        assert client.get("/metrics").status_code == 200

    def test_public_modules_are_read_only(self, monkeypatch):
        monkeypatch.setenv("OPENJARVIS_PUBLIC_MODULES", "1")
        client = TestClient(_make_app("oj_sk_test123"))
        assert client.get("/v1/modules/list").status_code == 200
        assert client.get("/v1/modules/mod_123456789a").status_code == 200
        assert client.post("/v1/modules/import/text").status_code == 401
        assert client.get("/v1/models").status_code == 401

    def test_modules_remain_private_by_default(self, client):
        assert client.get("/v1/modules/list").status_code == 401

    def test_public_chat_allows_anonymous_completion_only(self, monkeypatch):
        monkeypatch.setenv("OPENJARVIS_PUBLIC_CHAT", "1")
        client = TestClient(_make_app("oj_sk_test123"))
        assert client.get("/v1/models").status_code == 200
        assert client.post("/v1/chat/completions").json() == {"public": True}
        assert client.post(
            "/v1/chat/completions", headers={"Authorization": "Bearer oj_sk_test123"}
        ).json() == {"public": False}
        assert client.get("/v1/managed-agents").status_code == 401
