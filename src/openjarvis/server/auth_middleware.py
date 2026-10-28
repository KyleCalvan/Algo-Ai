"""API key authentication middleware for the OpenJarvis server."""

from __future__ import annotations

import logging
import os
import re
import secrets

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """Validates ``Authorization: Bearer <key>`` on ``/v1/*`` and ``/api/*`` routes.

    Webhook routes and health checks are exempt — they use
    per-channel signature verification instead.
    """

    def __init__(self, app, api_key: str = "") -> None:  # noqa: ANN001
        super().__init__(app)
        self._api_key = api_key or os.environ.get("OPENJARVIS_API_KEY", "")
        self._public_modules = os.environ.get("OPENJARVIS_PUBLIC_MODULES") == "1"
        self._public_chat = os.environ.get("OPENJARVIS_PUBLIC_CHAT") == "1"

    async def dispatch(self, request: Request, call_next):  # noqa: ANN001
        if self._api_key and self._requires_auth(request.url.path):
            auth = request.headers.get("Authorization", "")
            scheme, _, token = auth.partition(" ")
            authorized = scheme.lower() == "bearer" and secrets.compare_digest(
                token, self._api_key
            )
            if not authorized:
                if self._public_chat_route(request.method, request.url.path):
                    request.state.public_chat = True
                elif self._public_quiz_route(request.method, request.url.path):
                    pass
                elif not self._public_module_read(request.method, request.url.path):
                    return JSONResponse(
                        {"detail": "Invalid API key" if auth else "Missing Authorization header"},
                        status_code=401,
                    )
        return await call_next(request)

    def _public_module_read(self, method: str, path: str) -> bool:
        """Expose only library reads when public modules are enabled."""
        if not self._public_modules or method != "GET":
            return False
        if path == "/v1/modules/list":
            return True
        return re.fullmatch(r"/v1/modules/mod_[0-9a-f]{10}(?:/content)?", path) is not None

    def _public_chat_route(self, method: str, path: str) -> bool:
        if not self._public_chat:
            return False
        return (method == "POST" and path == "/v1/chat/completions") or (
            method == "GET" and path in ("/v1/models", "/v1/info")
        )

    def _public_quiz_route(self, method: str, path: str) -> bool:
        if not self._public_modules or method != "POST":
            return False
        return re.fullmatch(
            r"/v1/modules/mod_[0-9a-f]{10}/quiz/generate|/v1/modules/quiz/[0-9a-f]{8}/submit",
            path,
        ) is not None

    @staticmethod
    def _requires_auth(path: str) -> bool:
        """Protect API routes and operational metrics; leave the UI/health open.

        ``/metrics`` exposes request/token counters that should not be readable
        by unauthenticated clients, so it is gated alongside ``/v1`` and
        ``/api``. ``/health`` stays open for liveness probes.
        """
        return (
            path.startswith("/v1/")
            or path.startswith("/api/")
            or path == "/metrics"
            or path.startswith("/metrics/")
        )



def generate_api_key() -> str:
    """Generate a new API key with ``oj_sk_`` prefix."""
    return f"oj_sk_{secrets.token_urlsafe(32)}"


def check_bind_safety(host: str, *, api_key: str) -> None:
    """Refuse to bind non-loopback without an API key.

    Raises ``SystemExit`` if *host* is not a loopback address and
    *api_key* is empty.
    """
    import ipaddress
    import sys

    try:
        is_loop = ipaddress.ip_address(host).is_loopback
    except ValueError:
        is_loop = host in ("localhost", "")

    if not is_loop and not api_key:
        logger.error(
            "Binding to %s requires OPENJARVIS_API_KEY to be set. "
            "Run: jarvis auth generate-key",
            host,
        )
        sys.exit(1)


def websocket_authorized(websocket, expected_key: str) -> bool:  # noqa: ANN001
    """Return ``True`` if a WebSocket connection presents the expected key.

    ``AuthMiddleware`` is a ``BaseHTTPMiddleware`` and never sees WebSocket
    upgrade requests, so streaming endpoints must check the token themselves
    in the handshake before calling ``websocket.accept()``.

    When *expected_key* is empty, authentication is disabled (the loopback /
    local-only default, matching :class:`AuthMiddleware`) and all connections
    are allowed. The token may be supplied either as a ``?token=`` query
    parameter — browsers cannot set headers on a WebSocket handshake — or via
    an ``Authorization: Bearer <key>`` header for programmatic clients.
    """
    if not expected_key:
        return True
    token = websocket.query_params.get("token", "")
    if not token:
        auth = websocket.headers.get("authorization", "")
        scheme, _, value = auth.partition(" ")
        if scheme.lower() == "bearer":
            token = value
    if not token:
        return False
    return secrets.compare_digest(token, expected_key)
