"""Translations ship complete, as the Marketplace expects.

Custom integrations do not use strings.json; translations/en.json is the
source, and every other language must carry the same keys.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

INTEGRATION_DIR = (
    Path(__file__).parents[2] / "custom_components" / "unifi_network_map"
)
TRANSLATIONS_DIR = INTEGRATION_DIR / "translations"


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _flatten(data: dict[str, Any], prefix: str = "") -> set[str]:
    keys: set[str] = set()
    for key, value in data.items():
        path = f"{prefix}{key}"
        if isinstance(value, dict):
            keys |= _flatten(value, f"{path}.")  # type: ignore[arg-type]
        else:
            keys.add(path)
    return keys


def test_no_strings_json() -> None:
    assert not (INTEGRATION_DIR / "strings.json").exists()


def test_english_describes_verify_ssl() -> None:
    english = _flatten(_load(TRANSLATIONS_DIR / "en.json"))
    assert "config.step.user.data_description.verify_ssl" in english


def test_every_language_has_the_english_keys() -> None:
    english = _flatten(_load(TRANSLATIONS_DIR / "en.json"))
    for path in sorted(TRANSLATIONS_DIR.glob("*.json")):
        keys = _flatten(_load(path))
        assert keys == english, (
            f"{path.name}: missing {sorted(english - keys)}, "
            f"extra {sorted(keys - english)}"
        )
