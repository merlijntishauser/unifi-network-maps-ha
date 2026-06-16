"""Contract test for upstream `UnifiClient` HTTP-error message format.

The integration distinguishes a post-login HTTP 401/403 (request rejected --
wrong site / permissions / 2FA) from a generic connection failure by reading
the status code out of the `UnifiApiError` message, which upstream formats as
``... failed (HTTP <code>)``. A future upstream bump that changes this format
would silently regress the RequestRejected mapping in ``api.py`` back to a
misleading "Cannot connect", so this contract locks the format.
"""

from __future__ import annotations

import pytest
from unifi_topology.adapters.unifi_api import UnifiApiError, UnifiClient


class _FakeResponse:
    def __init__(self, status_code: int) -> None:
        self.status_code = status_code
        self.ok = False
        self.headers: dict[str, str] = {}

    def json(self) -> dict[str, object]:
        return {"meta": {"rc": "error"}}


class _FakeSession:
    def __init__(self, status_code: int) -> None:
        self._status_code = status_code
        self.headers: dict[str, str] = {}

    def get(self, *_args: object, **_kwargs: object) -> _FakeResponse:
        return _FakeResponse(self._status_code)


def _client_with_status(status_code: int) -> UnifiClient:
    # api_key auth means __init__ does not hit the network.
    client = UnifiClient("https://unifi.local", api_key="k", verify_ssl=False)
    client._session = _FakeSession(status_code)  # type: ignore[assignment]
    return client


def test_get_devices_failure_message_includes_http_status() -> None:
    client = _client_with_status(403)
    with pytest.raises(UnifiApiError) as exc:
        client.get_devices("default", detailed=False)
    assert "(HTTP 403)" in str(exc.value)
