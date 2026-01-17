from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = ROOT / "VERSION"
MANIFEST_FILE = ROOT / "custom_components" / "unifi_network_map" / "manifest.json"
FRONTEND_PACKAGE = ROOT / "frontend" / "package.json"
FRONTEND_LOCK = ROOT / "frontend" / "package-lock.json"


def read_version(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def validate_version(version: str) -> None:
    if not re.match(r"^\d+\.\d+\.\d+$", version):
        raise ValueError(f"Invalid semver: {version}")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def update_manifest(version: str) -> None:
    manifest = load_json(MANIFEST_FILE)
    manifest["version"] = version
    write_json(MANIFEST_FILE, manifest)


def update_frontend_package(version: str) -> None:
    package = load_json(FRONTEND_PACKAGE)
    package["version"] = version
    write_json(FRONTEND_PACKAGE, package)


def update_frontend_lock(version: str) -> None:
    lock = load_json(FRONTEND_LOCK)
    lock["version"] = version
    packages = lock.get("packages")
    if isinstance(packages, dict) and "" in packages:
        packages[""]["version"] = version
    write_json(FRONTEND_LOCK, lock)


def update_versions(version: str) -> None:
    update_manifest(version)
    update_frontend_package(version)
    update_frontend_lock(version)


def main() -> int:
    try:
        version = read_version(VERSION_FILE)
        validate_version(version)
        update_versions(version)
    except (OSError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
