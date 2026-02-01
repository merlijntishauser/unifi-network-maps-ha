"""E2E test fixtures for Home Assistant integration testing."""

from __future__ import annotations

import base64
import json
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable, Generator, TypeVar, cast

import bcrypt
import httpx
import pytest

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

    from playwright.sync_api import Page

# Detect CI environment (GitHub Actions sets CI=true)
IS_CI = os.environ.get("CI", "").lower() == "true"

# Skip reason for browser tests in CI
SKIP_BROWSER_IN_CI: pytest.MarkDecorator = pytest.mark.skipif(
    IS_CI,
    reason="Browser tests skipped in CI due to Chromium stability issues",
)

E2E_DIR = Path(__file__).parent
HA_CONFIG_DIR = Path(os.environ.get("HA_CONFIG_DIR", E2E_DIR / "ha-config-2026.1.2"))
HA_STORAGE_DIR = HA_CONFIG_DIR / ".storage"
STORAGE_TEMPLATE_DIR = E2E_DIR / "ha-config-template" / ".storage"

# Ensure CUSTOM_COMPONENTS_DIR is set for docker-compose
if "CUSTOM_COMPONENTS_DIR" not in os.environ:
    os.environ["CUSTOM_COMPONENTS_DIR"] = str(E2E_DIR.parent.parent / "custom_components")

HA_URL = os.environ.get("HA_URL", "http://localhost:28123")
HA_USERNAME = os.environ.get("HA_USERNAME", "admin")
HA_PASSWORD = os.environ.get("HA_PASSWORD", "admin123")

MOCK_UNIFI_URL = os.environ.get("MOCK_UNIFI_URL", "http://localhost:18443")

F = TypeVar("F", bound=Callable[..., Any])


def typed_fixture(*args: Any, **kwargs: Any) -> Callable[[F], F]:
    """Provide a typed wrapper around pytest.fixture for pyright."""
    return cast(Callable[[F], F], pytest.fixture(*args, **kwargs))


def _env_flag(name: str) -> bool:
    value = os.environ.get(name, "")
    return value.lower() in {"1", "true", "yes", "on"}


def _reset_ha_storage(storage_dir: Path) -> None:
    """Reset HA storage to clean state before tests."""
    # Completely clear storage dir to avoid stale files from different HA versions
    if storage_dir.exists():
        shutil.rmtree(storage_dir)
    storage_dir.mkdir(parents=True, exist_ok=True)

    # Reset config entries
    config_entries_path = storage_dir / "core.config_entries"
    config_entries_path.write_text("""{
  "version": 1,
  "minor_version": 4,
  "key": "core.config_entries",
  "data": {
    "entries": []
  }
}
""")

    # Ensure onboarding is marked complete
    onboarding_path = storage_dir / "onboarding"
    onboarding_path.write_text("""{
  "version": 4,
  "minor_version": 1,
  "key": "onboarding",
  "data": {
    "done": ["user", "core_config", "analytics", "integration"]
  }
}
""")

    # Ensure auth storage has the test user
    auth_path = storage_dir / "auth"
    auth_path.write_text("""{
  "version": 1,
  "minor_version": 1,
  "key": "auth",
  "data": {
    "users": [
      {
        "id": "e2e_test_user_id",
        "group_ids": ["system-admin"],
        "is_owner": true,
        "is_active": true,
        "name": "E2E Test User",
        "system_generated": false,
        "local_only": false
      }
    ],
    "groups": [
      {"id": "system-admin", "name": "Administrators"},
      {"id": "system-users", "name": "Users"},
      {"id": "system-read-only", "name": "Read Only"}
    ],
    "credentials": [
      {
        "id": "e2e_test_credential_id",
        "user_id": "e2e_test_user_id",
        "auth_provider_type": "homeassistant",
        "auth_provider_id": null,
        "data": {"username": "admin"}
      }
    ],
    "refresh_tokens": []
  }
}
""")


def _ensure_writable_config_dir() -> tuple[Path, Path]:
    """Ensure HA config directory is writable, copying to temp if needed."""
    storage_path = HA_STORAGE_DIR
    writable = os.access(HA_CONFIG_DIR, os.W_OK)
    if storage_path.exists():
        writable = writable and os.access(storage_path, os.W_OK)
    if writable:
        return HA_CONFIG_DIR, HA_STORAGE_DIR

    temp_dir = Path(tempfile.mkdtemp(prefix="ha-config-"))
    try:
        _make_tree_readable(HA_CONFIG_DIR)
        shutil.copytree(HA_CONFIG_DIR, temp_dir, dirs_exist_ok=True)
    except shutil.Error:
        _copytree_readable(HA_CONFIG_DIR, temp_dir)
    config_dir = temp_dir
    storage_dir = config_dir / ".storage"
    os.environ["HA_CONFIG_DIR"] = str(config_dir)
    return config_dir, storage_dir


def _copytree_readable(src: Path, dst: Path) -> None:
    """Copy only readable files to avoid permission errors in CI."""
    for root, _dirs, files in os.walk(src):
        root_path = Path(root)
        rel_root = root_path.relative_to(src)
        target_root = dst / rel_root
        target_root.mkdir(parents=True, exist_ok=True)
        for name in files:
            src_path = root_path / name
            if not os.access(src_path, os.R_OK):
                continue
            try:
                shutil.copy2(src_path, target_root / name)
            except OSError:
                continue


def _make_tree_readable(src: Path) -> None:
    """Best-effort chmod to make files readable before copying."""
    for root, dirs, files in os.walk(src):
        root_path = Path(root)
        for name in dirs:
            try:
                os.chmod(root_path / name, 0o755)
            except OSError:
                continue
        for name in files:
            try:
                os.chmod(root_path / name, 0o644)
            except OSError:
                continue


def _ensure_auth_provider_credentials(storage_dir: Path) -> None:
    """Ensure HA has the expected username/password in auth provider storage."""
    storage_dir.mkdir(parents=True, exist_ok=True)
    auth_provider_path = storage_dir / "auth_provider.homeassistant"
    if not auth_provider_path.exists():
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


def _dedupe_args(args: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for arg in args:
        if arg in seen:
            continue
        seen.add(arg)
        deduped.append(arg)
    return deduped


def _remove_args(args: list[str], remove: set[str]) -> list[str]:
    return [arg for arg in args if arg not in remove]


def _compose_run(
    compose_file: Path, args: list[str], *, check: bool = False
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["docker", "compose", "-f", str(compose_file), *args],
        capture_output=True,
        text=True,
        check=check,
    )


def _copy_blueprints(config_dir: Path) -> None:
    """Copy integration blueprints to HA config directory."""
    custom_components = Path(os.environ.get("CUSTOM_COMPONENTS_DIR", ""))
    source_blueprints = custom_components / "unifi_network_map" / "blueprints" / "automation"

    if not source_blueprints.exists():
        print(f"Blueprint source not found: {source_blueprints}")
        return

    target_blueprints = config_dir / "blueprints" / "automation" / "unifi_network_map"
    target_blueprints.mkdir(parents=True, exist_ok=True)

    # Copy each blueprint file (overwrite any existing symlinks)
    for blueprint_file in source_blueprints.glob("*.yaml"):
        target_file = target_blueprints / blueprint_file.name
        # Remove existing file/symlink if present
        if target_file.exists() or target_file.is_symlink():
            target_file.unlink()
        shutil.copy2(blueprint_file, target_file)
        print(f"Copied blueprint: {blueprint_file.name}")


@typed_fixture(scope="session")
def docker_services() -> Generator[None, None, None]:
    """Start and stop Docker Compose stack for the test session."""
    compose_file = E2E_DIR / "docker-compose.yml"
    reuse_stack = _env_flag("E2E_REUSE")

    # Stop any existing containers first to ensure clean state
    # This handles CI where workflow may have pre-started Docker
    if not reuse_stack:
        _compose_run(compose_file, ["down", "-v"])

    # Set up storage before starting services
    _config_dir, storage_dir = _ensure_writable_config_dir()

    # Copy blueprints to HA config directory
    _copy_blueprints(_config_dir)
    _reset_ha_storage(storage_dir)  # Clear old storage first
    _ensure_auth_provider_credentials(storage_dir)  # Then create auth provider

    # Debug: show resolved docker-compose config
    print("\n=== Docker compose environment ===")
    print(f"HA_CONFIG_DIR={os.environ.get('HA_CONFIG_DIR', 'not set')}")
    print(f"CUSTOM_COMPONENTS_DIR={os.environ.get('CUSTOM_COMPONENTS_DIR', 'not set')}")

    # Verify paths exist
    custom_components = Path(os.environ.get("CUSTOM_COMPONENTS_DIR", ""))
    if custom_components.exists():
        print(f"custom_components path exists: {custom_components}")
        integration_dir = custom_components / "unifi_network_map"
        if integration_dir.exists():
            print(f"Integration dir contents: {list(integration_dir.iterdir())[:10]}")
            manifest_path = integration_dir / "manifest.json"
            if manifest_path.exists():
                print(f"manifest.json found: {manifest_path.read_text()[:200]}")
        else:
            print(f"WARNING: Integration dir does not exist: {integration_dir}")
    else:
        print(f"WARNING: custom_components path does not exist: {custom_components}")

    # Start services
    if reuse_stack:
        result = _compose_run(
            compose_file, ["up", "-d", "--wait", "--pull", "always", "mock-unifi"]
        )
        if result.returncode != 0:
            print(f"Docker compose up failed:\n{result.stdout}\n{result.stderr}")
            raise RuntimeError(f"Docker compose up failed: {result.stderr}")
        result = _compose_run(
            compose_file,
            [
                "up",
                "-d",
                "--wait",
                "--pull",
                "always",
                "--force-recreate",
                "homeassistant",
            ],
        )
        if result.returncode != 0:
            print(f"Docker compose up failed:\n{result.stdout}\n{result.stderr}")
            raise RuntimeError(f"Docker compose up failed: {result.stderr}")
    else:
        result = _compose_run(compose_file, ["up", "-d", "--build", "--wait"])
        if result.returncode != 0:
            print(f"Docker compose up failed:\n{result.stdout}\n{result.stderr}")
            raise RuntimeError(f"Docker compose up failed: {result.stderr}")

    # Wait for HA to be fully ready
    _wait_for_ha_ready()

    # Wait for our integration to be loaded
    _wait_for_integration_loaded()

    yield

    # Stop and clean up
    if reuse_stack:
        print("Leaving Docker services running (E2E_REUSE enabled)")
        return

    _compose_run(compose_file, ["down", "-v"], check=True)


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


def _wait_for_integration_loaded(timeout: int = 90) -> None:
    """Wait for our custom integration to be loaded by HA."""
    # First get an auth token
    with httpx.Client(base_url=HA_URL, timeout=30) as client:
        flow_id = _start_login_flow(client, f"{HA_URL}/")
        auth_result = _submit_login_flow(client, flow_id)
        token_response = client.post(
            "/auth/token",
            data={
                "grant_type": "authorization_code",
                "code": auth_result["result"],
                "client_id": f"{HA_URL}/",
            },
        )
        token_response.raise_for_status()
        token = token_response.json()["access_token"]
        _log_ha_version(client, token)

    headers = {"Authorization": f"Bearer {token}"}
    start = time.time()
    last_handlers: list[str] = []

    while time.time() - start < timeout:
        try:
            response = httpx.get(
                f"{HA_URL}/api/config/config_entries/flow_handlers",
                headers=headers,
                timeout=10,
            )
            if response.status_code == 200:
                handlers = response.json()
                last_handlers = handlers
                if "unifi_network_map" in handlers:
                    print(f"Integration loaded successfully after {time.time() - start:.1f}s")
                    return
        except httpx.RequestError:
            pass
        time.sleep(3)

    # Debug: show what's in the container
    _debug_container_state()
    raise TimeoutError(
        f"Integration unifi_network_map not loaded after {timeout}s. "
        f"Available handlers: {last_handlers[:20]}..."
    )


def _debug_container_state() -> None:
    """Print debug info about the container state."""
    compose_file = E2E_DIR / "docker-compose.yml"
    print("\n=== DEBUG: Container state ===")

    # Show custom_components contents in container
    result = subprocess.run(
        [
            "docker",
            "compose",
            "-f",
            str(compose_file),
            "exec",
            "-T",
            "homeassistant",
            "ls",
            "-la",
            "/config/custom_components/",
        ],
        capture_output=True,
        text=True,
    )
    print(f"custom_components dir:\n{result.stdout}\n{result.stderr}")

    # Show unifi_network_map contents
    result = subprocess.run(
        [
            "docker",
            "compose",
            "-f",
            str(compose_file),
            "exec",
            "-T",
            "homeassistant",
            "ls",
            "-la",
            "/config/custom_components/unifi_network_map/",
        ],
        capture_output=True,
        text=True,
    )
    print(f"unifi_network_map dir:\n{result.stdout}\n{result.stderr}")

    # Show HA logs for integration loading errors
    result = subprocess.run(
        [
            "docker",
            "compose",
            "-f",
            str(compose_file),
            "logs",
            "homeassistant",
            "--tail=100",
        ],
        capture_output=True,
        text=True,
    )
    # Filter for relevant logs
    relevant_lines = [
        line
        for line in result.stdout.split("\n")
        if "unifi" in line.lower()
        or "custom_component" in line.lower()
        or "error" in line.lower()
        or "exception" in line.lower()
    ]
    print("Relevant HA logs:\n" + "\n".join(relevant_lines[-30:]))


def _log_ha_version(client: httpx.Client, token: str) -> None:
    """Log the Home Assistant version in use for E2E runs."""
    try:
        response = client.get(
            "/api/config",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if response.status_code != 200:
            print(f"HA config version request failed: {response.status_code}")
            return
        data = response.json()
        version = data.get("version")
        if version:
            image_tag = os.environ.get("HA_IMAGE_TAG", "unknown")
            print(f"Home Assistant version: {version} (image tag: {image_tag})")
            _write_version_file(version, image_tag)
    except httpx.RequestError as exc:
        print(f"HA config version request error: {exc}")


def _write_version_file(version: str, image_tag: str) -> None:
    version_file = os.environ.get("E2E_VERSION_FILE")
    if not version_file:
        return
    try:
        payload = {"version": version, "image_tag": image_tag}
        Path(version_file).write_text(json.dumps(payload))
    except OSError as exc:
        print(f"Failed to write E2E version file: {exc}")


@typed_fixture(scope="session")
def ha_tokens(docker_services: None) -> dict[str, object]:
    """Get auth tokens from Home Assistant."""
    # HA uses OAuth2-like flow, so we need to:
    # 1. Initiate login flow
    # 2. Submit credentials
    # 3. Exchange code for tokens

    with httpx.Client(base_url=HA_URL, timeout=30) as client:
        flow_id = _start_login_flow(client, f"{HA_URL}/")
        auth_result = _submit_login_flow(client, flow_id)

        token_response = client.post(
            "/auth/token",
            data={
                "grant_type": "authorization_code",
                "code": auth_result["result"],
                "client_id": f"{HA_URL}/",
            },
        )
        token_response.raise_for_status()
        return token_response.json()


@typed_fixture(scope="session")
def ha_auth_token(ha_tokens: dict[str, object]) -> str:
    """Get an access token from Home Assistant."""
    access_token = ha_tokens.get("access_token")
    if not isinstance(access_token, str):
        raise RuntimeError(f"Invalid token response: {ha_tokens}")
    return access_token


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


@typed_fixture(scope="session")
def _configure_browser_args(base_args: list[str]) -> list[str]:
    ci_args = [
        "--disable-dev-shm-usage",  # Overcome limited /dev/shm in CI
        "--no-sandbox",  # Required for running as root in containers
        "--disable-gpu",  # Disable GPU hardware acceleration
        "--disable-setuid-sandbox",
        "--disable-software-rasterizer",
    ]
    local_args = [
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--enable-accelerated-2d-canvas",
        "--enable-gpu-rasterization",
    ]
    args = base_args
    if IS_CI:
        args = args + ci_args
    else:
        args = _remove_args(args, set(ci_args)) + local_args
    return _dedupe_args(args)


def browser_type_launch_args(browser_type_launch_args: dict[str, Any]) -> dict[str, Any]:
    """Configure browser launch args for local speed or CI stability."""
    args = _configure_browser_args(list(browser_type_launch_args.get("args", [])))
    return {
        **browser_type_launch_args,
        "args": args,
    }


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
    ha_tokens: dict[str, object],
) -> Page:
    """Return a Playwright page authenticated with HA."""
    token_payload = {
        "access_token": ha_tokens.get("access_token"),
        "refresh_token": ha_tokens.get("refresh_token"),
        "expires_in": ha_tokens.get("expires_in"),
        "token_type": ha_tokens.get("token_type", "Bearer"),
    }
    payload = json.dumps(token_payload)
    script = f"""
        const tokens = {payload};
        const now = Date.now();
        const expiresIn = Number(tokens.expires_in || 0) * 1000;
        const tokenData = {{
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            token_type: tokens.token_type || 'Bearer',
            expires: now + expiresIn
        }};
        localStorage.setItem('hassTokens', JSON.stringify({{
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type,
            expires: tokenData.expires,
            hassUrl: window.location.origin
        }}));
        localStorage.setItem('hassToken', tokenData.access_token || '');
        sessionStorage.setItem('hassTokens', JSON.stringify({{
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type,
            expires: tokenData.expires,
            hassUrl: window.location.origin
        }}));
    """
    page.add_init_script(script=script)

    page.goto(HA_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    page.goto(f"{HA_URL}/config", wait_until="networkidle")

    # Verify auth by making API request with explicit Authorization header
    # (page.request doesn't use localStorage tokens automatically)
    access_token = ha_tokens.get("access_token")
    response = page.request.get(
        f"{HA_URL}/api/config",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if response.status != 200:
        raise RuntimeError(f"Failed to authenticate in browser (status {response.status})")

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

    entry_id = result["result"]["entry_id"]

    # Set options to include clients for filter tests
    options_flow_response = ha_client.post(
        "/api/config/config_entries/options/flow",
        json={"handler": entry_id},
    )
    if options_flow_response.status_code == 200:
        options_flow_id = options_flow_response.json().get("flow_id")
        if options_flow_id:
            # Provide all required options fields (matching _options_schema_fields)
            options_result = ha_client.post(
                f"/api/config/config_entries/options/flow/{options_flow_id}",
                json={
                    "scan_interval": 10,
                    "include_ports": False,
                    "include_clients": True,
                    "client_scope": "all",
                    "only_unifi": False,
                    "svg_isometric": False,
                    "use_cache": False,
                },
            )
            # Options update triggers _async_options_updated which refreshes automatically
            # But if entry is in error state, listener may not fire - force a reload
            if options_result.status_code == 200:
                # Reload the config entry to ensure options are applied
                ha_client.post(f"/api/config/config_entries/entry/{entry_id}/reload")
                time.sleep(3)  # Allow time for reload to complete

    return entry_id
