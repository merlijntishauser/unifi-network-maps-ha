"""E2E test fixtures for Home Assistant integration testing."""

from __future__ import annotations

import base64
import json
import os
import subprocess
import time
from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable, Generator, TypeVar, cast

import bcrypt
import httpx
import pytest

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

    from playwright.sync_api import Page

E2E_DIR = Path(__file__).parent
HA_CONFIG_DIR = Path(os.environ.get("HA_CONFIG_DIR", E2E_DIR / "ha-config-2026.1.2"))
HA_STORAGE_DIR = HA_CONFIG_DIR / ".storage"
STORAGE_TEMPLATE_DIR = E2E_DIR / "ha-config-template" / ".storage"

HA_URL = os.environ.get("HA_URL", "http://localhost:28123")
HA_USERNAME = os.environ.get("HA_USERNAME", "admin")
HA_PASSWORD = os.environ.get("HA_PASSWORD", "admin123")

MOCK_UNIFI_URL = os.environ.get("MOCK_UNIFI_URL", "http://localhost:18443")

F = TypeVar("F", bound=Callable[..., Any])


def typed_fixture(*args: Any, **kwargs: Any) -> Callable[[F], F]:
    """Provide a typed wrapper around pytest.fixture for pyright."""
    return cast(Callable[[F], F], pytest.fixture(*args, **kwargs))


def _reset_ha_storage() -> None:
    """Reset HA storage to clean state before tests."""
    config_entries_path = HA_STORAGE_DIR / "core.config_entries"
    if config_entries_path.exists():
        config_entries_path.write_text("""{
  "version": 1,
  "minor_version": 4,
  "key": "core.config_entries",
  "data": {
    "entries": []
  }
}
""")


def _ensure_auth_provider_credentials() -> None:
    """Ensure HA has the expected username/password in auth provider storage."""
    auth_provider_path = HA_STORAGE_DIR / "auth_provider.homeassistant"
    if not auth_provider_path.exists():
        HA_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": 1,
            "minor_version": 1,
            "key": "auth_provider.homeassistant",
            "data": {"users": []},
        }
        auth_provider_path.write_text(json.dumps(payload, indent=2))
    payload = json.loads(auth_provider_path.read_text())

    users = payload.get("data", {}).get("users", [])
    if not isinstance(users, list):
        raise RuntimeError("Invalid auth provider storage format")

    password_hash = bcrypt.hashpw(HA_PASSWORD.encode(), bcrypt.gensalt(rounds=12)).decode()
    encoded = base64.b64encode(password_hash.encode()).decode()

    updated = False
    for user in users:
        if user.get("username") == HA_USERNAME:
            user["password"] = encoded
            updated = True
    if not updated:
        users.append({"username": HA_USERNAME, "password": encoded})
    payload["data"]["users"] = users
    auth_provider_path.write_text(json.dumps(payload, indent=2))


@typed_fixture(scope="session")
def docker_services() -> Generator[None, None, None]:
    """Start and stop Docker Compose stack for the test session."""
    compose_file = E2E_DIR / "docker-compose.yml"

    # Start services
    _ensure_auth_provider_credentials()
    _reset_ha_storage()
    subprocess.run(
        ["docker", "compose", "-f", str(compose_file), "up", "-d", "--build", "--wait"],
        check=True,
        capture_output=True,
    )

    # Wait for HA to be fully ready
    _wait_for_ha_ready()

    yield

    # Stop and clean up
    subprocess.run(
        ["docker", "compose", "-f", str(compose_file), "down", "-v"],
        check=True,
        capture_output=True,
    )


def _wait_for_ha_ready(timeout: int = 120) -> None:
    """Wait for Home Assistant to be fully ready."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            response = httpx.get(f"{HA_URL}/api/", timeout=5)
            if response.status_code == 401:
                # HA is up and requiring auth - that's good
                return
            if response.status_code == 200:
                return
        except httpx.RequestError:
            pass
        time.sleep(2)
    raise TimeoutError(f"Home Assistant not ready after {timeout}s")


@typed_fixture(scope="session")
def ha_auth_token(docker_services: None) -> str:
    """Get an auth token from Home Assistant."""
    # HA uses OAuth2-like flow, so we need to:
    # 1. Initiate login flow
    # 2. Submit credentials
    # 3. Exchange code for token

    with httpx.Client(base_url=HA_URL, timeout=30) as client:
        flow_id = _start_login_flow(client, f"{HA_URL}/")
        auth_result = _submit_login_flow(client, flow_id)

        # Exchange code for token
        token_response = client.post(
            "/auth/token",
            data={
                "grant_type": "authorization_code",
                "code": auth_result["result"],
                "client_id": f"{HA_URL}/",
            },
        )
        token_response.raise_for_status()
        token_data = token_response.json()

        return token_data["access_token"]


def _start_login_flow(client: httpx.Client, redirect_uri: str) -> str:
    """Start a login flow and return the flow id, with fallbacks."""
    payloads: list[dict[str, object]] = [
        {
            "client_id": f"{HA_URL}/",
            "handler": ["homeassistant", None],
            "redirect_uri": redirect_uri,
        },
        {
            "client_id": f"{HA_URL}/",
            "handler": "homeassistant",
            "redirect_uri": redirect_uri,
        },
    ]
    last_error: Exception | None = None
    for payload in payloads:
        response = client.post("/auth/login_flow", json=payload)
        if response.status_code != 200:
            last_error = httpx.HTTPStatusError(
                f"Login flow start failed: {response.text}",
                request=response.request,
                response=response,
            )
            continue
        data = response.json()
        flow_id = data.get("flow_id")
        if not flow_id:
            last_error = RuntimeError(f"Missing flow_id in response: {data}")
            continue
        return str(flow_id)
    raise RuntimeError(f"Unable to start login flow. {last_error}")


def _submit_login_flow(client: httpx.Client, flow_id: str) -> dict[str, object]:
    """Submit credentials for a login flow, with fallbacks."""
    payloads: list[dict[str, object]] = [
        {
            "client_id": f"{HA_URL}/",
            "redirect_uri": f"{HA_URL}/",
            "username": HA_USERNAME,
            "password": HA_PASSWORD,
        },
        {
            "client_id": f"{HA_URL}/",
            "username": HA_USERNAME,
            "password": HA_PASSWORD,
        },
    ]
    last_error: Exception | None = None
    for payload in payloads:
        response = client.post(f"/auth/login_flow/{flow_id}", json=payload)
        if response.status_code != 200:
            last_error = httpx.HTTPStatusError(
                f"Login flow submit failed: {response.text}",
                request=response.request,
                response=response,
            )
            continue
        data = response.json()
        if "result" not in data:
            last_error = RuntimeError(
                f"Unexpected login flow response: {data}. Check HA_USERNAME/HA_PASSWORD."
            )
            continue
        return data
    raise RuntimeError(f"Unable to submit login flow. {last_error}")


@typed_fixture
def ha_client(ha_auth_token: str) -> Generator[httpx.Client, None, None]:
    """Create an authenticated HTTP client for Home Assistant API."""
    with httpx.Client(
        base_url=HA_URL,
        headers={"Authorization": f"Bearer {ha_auth_token}"},
        timeout=30,
    ) as client:
        yield client


@typed_fixture
async def ha_async_client(
    ha_auth_token: str,
) -> AsyncGenerator[httpx.AsyncClient, None]:
    """Create an authenticated async HTTP client for Home Assistant API."""
    async with httpx.AsyncClient(
        base_url=HA_URL,
        headers={"Authorization": f"Bearer {ha_auth_token}"},
        timeout=30,
    ) as client:
        yield client


@typed_fixture
def mock_unifi_url() -> str:
    """Return the mock UniFi controller URL accessible from HA container."""
    # Inside Docker network, HA reaches mock-unifi via service name
    return "http://mock-unifi:8443"


@typed_fixture
def mock_unifi_credentials() -> dict[str, str]:
    """Return credentials for the mock UniFi controller."""
    return {
        "url": "http://mock-unifi:8443",
        "username": "admin",
        "password": "test123",
        "site": "default",
    }


@typed_fixture(autouse=True)
def cleanup_config_entries(ha_client: httpx.Client) -> Generator[None, None, None]:
    """Clean up any config entries created during tests."""
    yield

    # Get all config entries
    response = ha_client.get("/api/config/config_entries/entry")
    if response.status_code != 200:
        return

    entries = response.json()
    for entry in entries:
        if entry.get("domain") == "unifi_network_map":
            ha_client.delete(f"/api/config/config_entries/entry/{entry['entry_id']}")


@typed_fixture
def browser_context_args(browser_context_args: dict[str, Any]) -> dict[str, Any]:
    """Configure browser context for E2E tests."""
    return {
        **browser_context_args,
        "viewport": {"width": 1280, "height": 720},
        "ignore_https_errors": True,
    }


@typed_fixture
def authenticated_page(
    page: Page,
    ha_auth_token: str,
) -> Page:
    """Return a Playwright page authenticated with HA."""
    # First navigate to HA - this may redirect to auth page
    page.goto(HA_URL, wait_until="domcontentloaded")

    # Wait for any initial redirect to complete
    page.wait_for_timeout(1000)

    # Inject auth token into localStorage
    # This should work even on the auth page
    page.evaluate(
        """(token) => {
            localStorage.setItem('hassTokens', JSON.stringify({
                access_token: token,
                token_type: 'Bearer',
                hassUrl: '"""
        + HA_URL
        + """'
            }));
        }""",
        ha_auth_token,
    )

    # Navigate to the main page again - now with auth
    page.goto(HA_URL, wait_until="networkidle")

    # Wait for HA to load and check we're authenticated
    # If still on auth page, try a few more times
    retries = 3
    while retries > 0:
        if "/auth/" not in page.url:
            break
        page.reload()
        page.wait_for_timeout(2000)
        retries -= 1

    return page


@typed_fixture
def entry_id(ha_client: httpx.Client, mock_unifi_credentials: dict[str, str]) -> str:
    """Create a config entry and return its ID."""
    # Initialize config flow
    response = ha_client.post(
        "/api/config/config_entries/flow",
        json={"handler": "unifi_network_map"},
    )
    if response.status_code != 200:
        raise RuntimeError(
            f"Failed to initialize config flow: {response.status_code} - {response.text}"
        )
    flow_id = response.json()["flow_id"]

    # Submit configuration
    response = ha_client.post(
        f"/api/config/config_entries/flow/{flow_id}",
        json=mock_unifi_credentials,
    )
    if response.status_code != 200:
        raise RuntimeError(
            f"Failed to submit config flow: {response.status_code} - {response.text}"
        )
    result = response.json()

    if result.get("type") != "create_entry":
        raise RuntimeError(f"Failed to create config entry: {result}")

    return result["result"]["entry_id"]
