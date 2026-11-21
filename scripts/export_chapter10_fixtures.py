"""Export real CPython frames for TEXTBOOK-10 sorting modules.

Each fixture executes the exact Python source shipped in the matching
`*Examples.ts` file. No algorithm is reimplemented here.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def extract(ts_file: str, marker: str, tag: str) -> str:
    ts = (ROOT / "src/domain/algorithms" / ts_file).read_text(encoding="utf-8")
    source = ts.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in source, f"{tag}: unexpanded template expression"
    return source


TOURNAMENT_SOURCE = extract(
    "tournamentExamples.ts", "export const TOURNAMENT_PYTHON = `", "tournament"
)
RADIX_SOURCE = extract("radixExamples.ts", "export const RADIX_PYTHON = `", "radix")


def run(source: str, payload: dict, tag: str, max_frames: int = 400) -> list[dict]:
    frames: list[dict] = []

    def trace(state, message="", line=None, variables=None, lesson_step=None, structure=None):
        frames.append(
            {
                "state": copy.deepcopy(state),
                "message": message,
                "line": line,
                "variables": copy.deepcopy(variables),
                "lessonStepId": lesson_step,
                "structure": copy.deepcopy(structure),
            }
        )

    ns = {"input": copy.deepcopy(payload), "trace": trace}
    exec(compile(source, f"<{tag}>", "exec"), ns)
    if not frames:
        raise SystemExit(f"{tag}: empty frame stream")
    if len(frames) > max_frames:
        raise SystemExit(f"{tag}: frame budget exceeded ({len(frames)})")
    operations = [frame["structure"].get("operation") for frame in frames]
    if operations[0] != "init":
        raise SystemExit(f"{tag}: stream does not start with init ({operations[:3]})")
    if operations[-1] != "done":
        raise SystemExit(f"{tag}: stream does not end with done ({operations[-3:]})")
    return frames


TOURNAMENT_CASES = {
    "normal": {"preset": "normal", "values": [8, 3, 11, 1, 7, 2, 9, 4]},
    "duplicates": {"preset": "duplicates", "values": [3, 1, 3, 2, 1, 3, 2, 1]},
    "single": {"preset": "single", "values": [5]},
    "non-power": {"preset": "non-power", "values": [9, 2, 14, 5, 8]},
    "reversed": {"preset": "reversed", "values": [9, 8, 7, 6, 5, 4, 3, 2]},
    "negatives": {"preset": "negatives", "values": [-3, 5, 0, -3, 2]},
}

RADIX_CASES = {
    "multi-digit": {"preset": "multi-digit", "values": [170, 45, 75, 90, 802, 24, 2, 66]},
    "mixed-length": {"preset": "mixed-length", "values": [7, 1000, 23, 5, 999, 0, 12]},
    "duplicates": {"preset": "duplicates", "values": [21, 12, 21, 12, 3, 21]},
    "zero": {"preset": "zero", "values": [0, 10, 2, 100, 0]},
    "single": {"preset": "single", "values": [7]},
    "identical": {"preset": "identical", "values": [42, 42, 42, 42]},
    "four-digits": {"preset": "four-digits", "values": [9999, 1000, 0, 909, 90, 9]},
}


def main():
    fixtures = ROOT / "src/test/fixtures"
    outputs = [
        ("tournament", TOURNAMENT_SOURCE, TOURNAMENT_CASES, "chapter10-tournament-frames.json"),
        ("radix", RADIX_SOURCE, RADIX_CASES, "chapter10-radix-frames.json"),
    ]
    for tag, source, cases, filename in outputs:
        bundle = {}
        for case, payload in cases.items():
            frames = run(source, payload, f"{tag}/{case}")
            bundle[case] = {"input": payload, "frames": frames}
            print(tag, case, len(frames), [frame["structure"]["operation"] for frame in frames])
        (fixtures / filename).write_text(
            json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    print("wrote chapter 10 fixtures")


if __name__ == "__main__":
    main()
