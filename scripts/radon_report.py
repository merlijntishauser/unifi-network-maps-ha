import json
import statistics
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
RADON_BIN = BASE_DIR / ".venv" / "bin" / "radon"
TARGETS = ["custom_components"]
MAX_COMPLEXITY = 10


def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True)


def main() -> int:
    mi = json.loads(run([str(RADON_BIN), "mi", "-j", *TARGETS]))
    mi_values = [entry["mi"] for entry in mi.values() if "mi" in entry]
    if mi_values:
        avg = statistics.mean(mi_values)
        lo, hi = min(mi_values), max(mi_values)
        print(
            f"radon mi: files={len(mi_values)}"
            f" avg={avg:.1f}"
            f" min={lo:.1f} max={hi:.1f}"
        )
    else:
        print("radon mi: no files")

    cc = json.loads(run([str(RADON_BIN), "cc", "-j", *TARGETS]))
    blocks: list[dict[str, object]] = []
    for filename, file_blocks in cc.items():
        for block in file_blocks:
            block = dict(block)
            block["filename"] = filename
            blocks.append(block)

    if blocks:
        avg_cc = statistics.mean(block["complexity"] for block in blocks)  # type: ignore[arg-type]
        max_cc = max(block["complexity"] for block in blocks)  # type: ignore[arg-type]
        grades = [block.get("rank", "?") for block in blocks]
        grade_counts = {
            grade: grades.count(grade)
            for grade in ["A", "B", "C", "D", "E", "F"]
        }
        grade_summary = " ".join(
            f"{grade}={count}" for grade, count in grade_counts.items()
        )
        print(
            f"radon cc: blocks={len(blocks)}"
            f" avg={avg_cc:.1f} max={max_cc}"
            f" {grade_summary}"
        )
    else:
        print("radon cc: no blocks")

    violations = [
        block
        for block in blocks
        if block.get("complexity", 0) > MAX_COMPLEXITY
    ]
    if violations:
        print(f"radon cc violations (>{MAX_COMPLEXITY}):")
        for block in sorted(
            violations,
            key=lambda b: (
                str(b.get("filename", "")),
                int(b.get("lineno", 0)),
            ),
        ):
            filename = block.get("filename", "<unknown>")
            lineno = block.get("lineno", "?")
            name = block.get("name", "<unknown>")
            complexity = block.get("complexity", "?")
            print(f"{filename}:{lineno} {name} (C={complexity})")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
