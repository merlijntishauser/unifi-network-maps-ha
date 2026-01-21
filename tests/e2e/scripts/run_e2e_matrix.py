from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


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
        print(
            f"==> Running e2e for {name} ({image_tag}) using {config_path}",
            flush=True,
        )
        subprocess.run(["make", "test-e2e"], check=True, env=env)


if __name__ == "__main__":
    main()
