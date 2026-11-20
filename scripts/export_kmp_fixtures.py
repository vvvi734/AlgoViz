"""Export real CPython frames for the STR-01 KMP course.

The JSON is generated from the exact Python shipped in `kmpExamples.ts`.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/kmpExamples.ts").read_text(encoding="utf-8")
OUT_DEFAULT = ROOT / "src/test/fixtures/kmp-default-frames.json"
OUT_EDGE = ROOT / "src/test/fixtures/kmp-edge-frames.json"

MARKER = "export const KMP_PYTHON = `"
SOURCE = TS.split(MARKER, 1)[1].split("`;", 1)[0]
assert "${" not in SOURCE, "unexpanded template expression"

DEFAULT = {"text": "ABABABCABABABC", "pattern": "ABABC"}
CASES = {
    "overlap": {"text": "AAAAA", "pattern": "AAA"},
    "partial_fallback": {"text": "ABABABC", "pattern": "ABABC"},
    "no_match": {"text": "ABCDEF", "pattern": "XYZ"},
    "single_hit": {"text": "A", "pattern": "A"},
    "single_miss": {"text": "A", "pattern": "B"},
    "repeated": {"text": "AAAA", "pattern": "AA"},
    "text_shorter": {"text": "AB", "pattern": "ABC"},
    "pattern_longer": {"text": "ABAB", "pattern": "ABABC"},
    "alternating": {"text": "ABABABAB", "pattern": "ABAB"},
    "border_table": {"text": "AABAAABAABAAAB", "pattern": "AABAAAB"},
    "pattern_one_end": {"text": "XYZ", "pattern": "Z"},
    "empty_text": {"text": "", "pattern": "A"},
    "max_pattern": {"text": "ABCABCABCABC", "pattern": "ABCABCABCABC"},
}


def run(payload) -> list[dict]:
    frames: list[dict] = []

    def trace(state, message="", variables=None, lesson_step=None, structure=None):
        frames.append({
            "state": copy.deepcopy(state),
            "message": message,
            "variables": copy.deepcopy(variables),
            "lessonStepId": lesson_step,
            "structure": copy.deepcopy(structure),
        })

    ns = {"input": copy.deepcopy(payload), "trace": trace}
    exec(compile(SOURCE, "<str01-kmp>", "exec"), ns)
    return frames


def check(payload, frames):
    if not frames:
        raise SystemExit("empty frame stream")
    if len(frames) > 200:
        raise SystemExit(f"{len(frames)} frames exceeds the 200 budget")
    if frames[0]["structure"].get("operation") != "init":
        raise SystemExit("stream does not start with init")
    if frames[-1]["structure"].get("operation") != "search-done":
        raise SystemExit("stream does not end with search-done")
    for index, entry in enumerate(frames):
        structure = entry["structure"]
        if structure.get("kind") != "kmp":
            raise SystemExit(f"frame {index}: wrong structure kind")
        if structure.get("text") != payload["text"] or structure.get("pattern") != payload["pattern"]:
            raise SystemExit(f"frame {index}: input changed")
        if len(structure.get("lps", [])) != len(payload["pattern"]):
            raise SystemExit(f"frame {index}: lps length wrong")
    final = frames[-1]["structure"]
    if final["i"] != len(payload["text"]):
        raise SystemExit("search-done i != n")


def main():
    frames = run(DEFAULT)
    check(DEFAULT, frames)
    OUT_DEFAULT.write_text(json.dumps(frames, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"default: {len(frames)} frames, matches={frames[-1]['structure']['matches']}")

    edge = {}
    total = 0
    for case, payload in CASES.items():
        frames = run(payload)
        check(payload, frames)
        edge[case] = frames
        total += len(frames)
        print(f"{case}: {len(frames)} frames, matches={frames[-1]['structure']['matches']}")
    OUT_EDGE.write_text(json.dumps(edge, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT_DEFAULT.name} and {OUT_EDGE.name}; {total} edge frames")


if __name__ == "__main__":
    main()
