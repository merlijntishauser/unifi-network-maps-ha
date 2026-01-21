"""Mock UniFi controller server for E2E testing."""

from __future__ import annotations

import json
import os
import secrets
from pathlib import Path
from typing import TYPE_CHECKING

from aiohttp import web

if TYPE_CHECKING:
    from aiohttp.web import Request, Response

FIXTURES_DIR = Path(__file__).parent / "fixtures"
USERNAME = os.environ.get("UNIFI_USERNAME", "admin")
PASSWORD = os.environ.get("UNIFI_PASSWORD", "test123")
SITE = os.environ.get("UNIFI_SITE", "default")

sessions: dict[str, bool] = {}


def load_fixture(name: str) -> dict:
    """Load a JSON fixture file."""
    path = FIXTURES_DIR / f"{name}.json"
    if path.exists():
        return json.loads(path.read_text())
    return {}


async def health_check(_request: Request) -> Response:
    """Health check endpoint."""
    return web.json_response({"status": "ok"})


async def login(request: Request) -> Response:
    """Handle login requests."""
    try:
        data = await request.json()
    except json.JSONDecodeError:
        return web.json_response({"meta": {"rc": "error", "msg": "Invalid JSON"}}, status=400)

    username = data.get("username")
    password = data.get("password")

    if username == USERNAME and password == PASSWORD:
        session_id = secrets.token_hex(16)
        sessions[session_id] = True
        response = web.json_response({"meta": {"rc": "ok"}, "data": []})
        response.set_cookie("unifises", session_id, httponly=True)
        return response

    return web.json_response({"meta": {"rc": "error", "msg": "Invalid credentials"}}, status=401)


async def logout(request: Request) -> Response:
    """Handle logout requests."""
    session_id = request.cookies.get("unifises")
    if session_id and session_id in sessions:
        del sessions[session_id]
    response = web.json_response({"meta": {"rc": "ok"}, "data": []})
    response.del_cookie("unifises")
    return response


def check_auth(request: Request) -> bool:
    """Check if request is authenticated."""
    session_id = request.cookies.get("unifises")
    return session_id is not None and session_id in sessions


async def get_devices(request: Request) -> Response:
    """Return device topology (full details)."""
    if not check_auth(request):
        return web.json_response({"meta": {"rc": "error", "msg": "Unauthorized"}}, status=401)

    topology = load_fixture("topology")
    devices = topology.get("devices", [])
    return web.json_response({"meta": {"rc": "ok"}, "data": devices})


async def get_devices_basic(request: Request) -> Response:
    """Return device topology (basic info)."""
    if not check_auth(request):
        return web.json_response({"meta": {"rc": "error", "msg": "Unauthorized"}}, status=401)

    topology = load_fixture("topology")
    devices = topology.get("devices", [])
    # Return simplified device info for basic endpoint
    basic_devices = [
        {
            "_id": d.get("_id"),
            "mac": d.get("mac"),
            "ip": d.get("ip"),
            "name": d.get("name"),
            "model": d.get("model"),
            "type": d.get("type"),
            "adopted": d.get("adopted", True),
            "state": d.get("state", 1),
        }
        for d in devices
    ]
    return web.json_response({"meta": {"rc": "ok"}, "data": basic_devices})


async def get_clients(request: Request) -> Response:
    """Return client list."""
    if not check_auth(request):
        return web.json_response({"meta": {"rc": "error", "msg": "Unauthorized"}}, status=401)

    topology = load_fixture("topology")
    clients = topology.get("clients", [])
    return web.json_response({"meta": {"rc": "ok"}, "data": clients})


async def get_sites(request: Request) -> Response:
    """Return site list."""
    if not check_auth(request):
        return web.json_response({"meta": {"rc": "error", "msg": "Unauthorized"}}, status=401)

    return web.json_response(
        {
            "meta": {"rc": "ok"},
            "data": [{"name": SITE, "desc": "Default Site", "_id": "default123"}],
        }
    )


async def get_sysinfo(request: Request) -> Response:
    """Return system info."""
    if not check_auth(request):
        return web.json_response({"meta": {"rc": "error", "msg": "Unauthorized"}}, status=401)

    return web.json_response(
        {
            "meta": {"rc": "ok"},
            "data": [
                {
                    "version": "8.0.0",
                    "hostname": "mock-unifi",
                    "name": "Mock UniFi Controller",
                }
            ],
        }
    )


def create_app() -> web.Application:
    """Create the aiohttp application."""
    app = web.Application()
    app.router.add_get("/status", health_check)
    app.router.add_post("/api/login", login)
    app.router.add_post("/api/logout", logout)
    app.router.add_get("/api/self/sites", get_sites)
    app.router.add_get(f"/api/s/{SITE}/stat/device", get_devices)
    app.router.add_get(f"/api/s/{SITE}/stat/device-basic", get_devices_basic)
    app.router.add_get(f"/api/s/{SITE}/stat/sta", get_clients)
    app.router.add_get(f"/api/s/{SITE}/rest/user", get_clients)
    app.router.add_get(f"/api/s/{SITE}/stat/sysinfo", get_sysinfo)
    return app


if __name__ == "__main__":
    app = create_app()
    web.run_app(app, host="0.0.0.0", port=8443)
