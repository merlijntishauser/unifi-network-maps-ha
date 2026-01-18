from __future__ import annotations

import sys
import zipfile
from pathlib import Path


def _add_path(archive: zipfile.ZipFile, root: Path, path: Path) -> None:
    if path.is_dir():
        for file in path.rglob("*"):
            if file.is_file():
                archive.write(file, file.relative_to(root).as_posix())
        return
    if path.is_file():
        archive.write(path, path.relative_to(root).as_posix())


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: build_release_zip.py <zip-path>", file=sys.stderr)
        return 1

    zip_path = Path(sys.argv[1])
    root = Path.cwd()
    targets = (root / "custom_components", root / "hacs.json")

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in targets:
            _add_path(archive, root, path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
