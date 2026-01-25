from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


def main() -> None:
    matrix = subprocess.check_output(
        [
            sys.executable,
            str(Path("tests/e2e/scripts/ha_matrix.py")),
            "--github",
        ],
        text=True,
    )
    data = json.loads(matrix)
    versions = data.get("include", [])
    if not versions:
        raise SystemExit("No versions found in ha-matrix.yaml")

    results: list[dict[str, Any]] = []
    for entry in versions:
        name = entry.get("name")
        image_tag = entry.get("image_tag")
        config_dir = entry.get("config_dir")
        if not name or not image_tag or not config_dir:
            raise SystemExit(f"Invalid matrix entry: {entry}")
        env = os.environ.copy()
        env["HA_IMAGE_TAG"] = image_tag
        config_path = (Path("tests/e2e") / config_dir).resolve()
        env["HA_CONFIG_DIR"] = str(config_path)
        version_file = Path("tests/e2e/.ha-version.json")
        env["E2E_VERSION_FILE"] = str(version_file)
        print(
            f"==> Running e2e for {name} ({image_tag}) using {config_path}",
            flush=True,
        )
        result = subprocess.run(["make", "test-e2e"], env=env)
        ha_version = "unknown"
        if version_file.exists():
            try:
                data = json.loads(version_file.read_text())
                ha_version = data.get("version", "unknown")
            except json.JSONDecodeError:
                ha_version = "unknown"
            version_file.unlink(missing_ok=True)
        results.append(
            {
                "name": name,
                "image_tag": image_tag,
                "version": ha_version,
                "result": "passed" if result.returncode == 0 else "failed",
            }
        )
        if result.returncode != 0:
            print(f"==> E2E failed for {name}", flush=True)

    print("\nE2E Matrix Summary")
    print(f"{'Name':<10} {'Image Tag':<10} {'HA Version':<12} Result")
    for row in results:
        print(f"{row['name']:<10} {row['image_tag']:<10} {row['version']:<12} {row['result']}")
    if any(row["result"] != "passed" for row in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
