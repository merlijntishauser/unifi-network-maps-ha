from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import yaml


def load_config(path: Path) -> dict[str, Any]:
    data = yaml.safe_load(path.read_text())
    if not isinstance(data, dict):
        raise ValueError("Matrix config must be a mapping")
    return data


def build_matrix(data: dict[str, Any]) -> dict[str, Any]:
    versions = data.get("versions", [])
    if not isinstance(versions, list) or not versions:
        raise ValueError("Matrix config must include a non-empty 'versions' list")
    matrix: list[dict[str, str]] = []
    for item in versions:
        if not isinstance(item, dict):
            raise ValueError("Each version entry must be a mapping")
        name = str(item.get("name", ""))
        image_tag = str(item.get("image_tag", ""))
        config_dir = str(item.get("config_dir", ""))
        if not name or not image_tag or not config_dir:
            raise ValueError("Each version must include name, image_tag, and config_dir")
        matrix.append(
            {
                "name": name,
                "image_tag": image_tag,
                "config_dir": config_dir,
            }
        )
    return {"include": matrix}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="tests/e2e/ha-matrix.yaml")
    parser.add_argument("--github", action="store_true")
    args = parser.parse_args()

    data = load_config(Path(args.config))
    matrix = build_matrix(data)

    if args.github:
        print(json.dumps(matrix))
    else:
        print(json.dumps(matrix, indent=2))


if __name__ == "__main__":
    main()
