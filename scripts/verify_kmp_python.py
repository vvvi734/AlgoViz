"""Independent CPython verification for STR-01 KMP.

Reads the real teaching source from `kmpExamples.ts`, runs it with a local
`trace()` collector, and checks every emitted snapshot against a separately
written reference implementation and the documented lps convention.
"""
from __future__ import annotations

import copy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/kmpExamples.ts").read_text(encoding="utf-8")
MARKER = "export const KMP_PYTHON = `"
SOURCE = TS.split(MARKER, 1)[1].split("`;", 1)[0]
assert "${" not in SOURCE, "unexpanded template expression"

OFFICIAL = {"text": "ABABABCABABABC", "pattern": "ABABC"}
CASES = {
    "official": OFFICIAL,
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


def build_lps_ref(pattern: str) -> list[int]:
    m = len(pattern)
    lps = [0] * m
    for i in range(1, m):
        j = lps[i - 1]
        while j > 0 and pattern[i] != pattern[j]:
            j = lps[j - 1]
        if pattern[i] == pattern[j]:
            j += 1
        lps[i] = j
    return lps


def kmp_ref(text: str, pattern: str) -> list[int]:
    if not pattern:
        raise ValueError("empty pattern")
    lps = build_lps_ref(pattern)
    i = j = 0
    starts = []
    while i < len(text):
        if text[i] == pattern[j]:
            i += 1
            j += 1
            if j == len(pattern):
                starts.append(i - j)
                j = lps[j - 1]
        elif j:
            j = lps[j - 1]
        else:
            i += 1
    return starts


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


def validate(payload, frames) -> list[str]:
    errors: list[str] = []
    text = payload["text"] if isinstance(payload.get("text"), str) else ""
    pattern = payload["pattern"] if isinstance(payload.get("pattern"), str) else ""
    n, m = len(text), len(pattern)
    canonical = build_lps_ref(pattern)
    expected = kmp_ref(text, pattern)

    if not frames:
        return ["no frames"]
    if frames[0]["structure"].get("operation") != "init":
        errors.append("trace does not start with init")
    if frames[-1]["structure"].get("operation") != "search-done":
        errors.append("trace does not end with search-done")

    build_fallback = False
    search_fallback = False
    match_frames = []
    previous_i = None

    for index, frame in enumerate(frames):
        snapshot = frame["structure"]
        if not isinstance(snapshot, dict) or snapshot.get("kind") != "kmp":
            errors.append(f"frame {index}: missing kmp structure")
            continue
        op = snapshot["operation"]
        phase = snapshot["phase"]
        if snapshot["text"] != text or snapshot["pattern"] != pattern:
            errors.append(f"frame {index}: text/pattern changed")
        if len(snapshot["lps"]) != m:
            errors.append(f"frame {index}: lps length {len(snapshot['lps'])} != {m}")
        ready = snapshot["lpsReady"]
        if not 0 <= ready <= m:
            errors.append(f"frame {index}: lpsReady {ready} out of range")
        if snapshot["lps"][:ready] != canonical[:ready]:
            errors.append(f"frame {index}: finalized lps prefix disagrees")
        if any(value != 0 for value in snapshot["lps"][ready:]):
            errors.append(f"frame {index}: unfinalized lps entries not zero")
        if op in ("init", "build-start", "build-compare", "build-fallback", "build-record", "build-complete"):
            if phase != "build":
                errors.append(f"frame {index}: {op} has phase {phase}")
        else:
            if phase != "search":
                errors.append(f"frame {index}: {op} has phase {phase}")

        if op == "init":
            if snapshot["lpsReady"] != 0:
                errors.append("init must have lpsReady 0")
            if snapshot["i"] is not None or snapshot["j"] is not None:
                errors.append("init must not have pointers")
        elif snapshot["i"] is None or snapshot["j"] is None:
            errors.append(f"{op} must carry both pointers")

        if op == "build-start":
            if snapshot["i"] != 1 or snapshot["j"] != 0:
                errors.append("build-start must be i=1 j=0")
            if snapshot["lpsReady"] != 1:
                errors.append("build-start must finalize lps[0]")

        if op == "build-compare":
            i, j = snapshot["i"], snapshot["j"]
            if not (0 <= i < m and 0 <= j < m):
                errors.append(f"build-compare pointers {i},{j} outside pattern")
            elif snapshot["matched"] != (pattern[i] == pattern[j]):
                errors.append("build-compare matched flag is wrong")

        if op == "build-record":
            i = snapshot["i"]
            if snapshot["lpsReady"] != i + 1:
                errors.append("build-record ready != i+1")
            if snapshot["lps"][i] != snapshot["j"]:
                errors.append("build-record lps[i] != j")
            if snapshot["matched"] is not None:
                errors.append("build-record matched must be null")

        if op == "build-fallback":
            build_fallback = True
            frm, to = snapshot["fallbackFrom"], snapshot["fallbackTo"]
            if frm is None or to is None:
                errors.append("build-fallback lacks from/to")
            else:
                if to != canonical[frm - 1]:
                    errors.append(f"build-fallback to {to} != lps[{frm-1}]")
                if snapshot["j"] != to:
                    errors.append("build-fallback j != to")
                if snapshot["matched"] is not False:
                    errors.append("build-fallback must be a mismatch")

        if op == "build-complete":
            if snapshot["lpsReady"] != m:
                errors.append("build-complete does not finalize table")
            if snapshot["lps"] != canonical:
                errors.append("build-complete table != reference")
            if snapshot["i"] != m:
                errors.append("build-complete i != m")

        if op == "search-compare":
            i, j = snapshot["i"], snapshot["j"]
            if not (0 <= i < n and 0 <= j < m):
                errors.append(f"search-compare pointers {i},{j} outside strings")
            elif snapshot["matched"] != (text[i] == pattern[j]):
                errors.append("search-compare matched flag is wrong")

        if op == "search-fallback":
            search_fallback = True
            frm, to = snapshot["fallbackFrom"], snapshot["fallbackTo"]
            if frm is None or to is None:
                errors.append("search-fallback lacks from/to")
            else:
                if to != canonical[frm - 1]:
                    errors.append(f"search-fallback to {to} != lps[{frm-1}]")
                if snapshot["j"] != to:
                    errors.append("search-fallback j != to")
                if snapshot["matched"] is not False:
                    errors.append("search-fallback must be a mismatch")
                if previous_i is not None and snapshot["i"] != previous_i:
                    errors.append("search-fallback moved i")
            if snapshot["j"] >= m:
                errors.append("search-fallback kept j >= m")

        if op == "match-found":
            match_frames.append(snapshot)
            i, j = snapshot["i"], snapshot["j"]
            if j != m:
                errors.append("match-found j != m")
            start = snapshot["currentMatchStart"]
            if start is None or i != start + m:
                errors.append("match-found start/i inconsistent")
            if start not in snapshot["matches"]:
                errors.append("match-found start absent from matches")

        if op in ("search-compare", "search-fallback", "search-miss", "match-found"):
            i = snapshot["i"]
            if i is not None:
                if previous_i is not None and op != "search-miss" and op != "match-found" and i < previous_i:
                    errors.append(f"{op} moved i backwards")
                previous_i = i

        matches = snapshot["matches"]
        if matches != sorted(set(matches)):
            errors.append(f"frame {index}: matches not strictly increasing")
        if matches != expected[: len(matches)]:
            errors.append(f"frame {index}: matches {matches} not a prefix of {expected}")
        current = snapshot["currentMatchStart"]
        if current is not None:
            if not matches or current != matches[-1]:
                errors.append(f"frame {index}: currentMatchStart is not latest match")

    final = frames[-1]["structure"]
    if final["matches"] != expected:
        errors.append(f"final matches {final['matches']} != {expected}")
    if final["i"] != n:
        errors.append("search-done i != n")
    if final["lps"] != canonical:
        errors.append("final lps != reference")
    if text and pattern and not build_fallback and any(
        pattern[i] == pattern[j] for i in range(1, m) for j in range(i)
    ):
        # Not an error by itself; only report missing fallback when a real
        # mismatch must have occurred during construction.
        pass

    if not expected and match_frames:
        errors.append("no-match case emitted match-found")
    if expected and len(match_frames) != len(expected):
        errors.append(f"match-found frames {len(match_frames)} != {len(expected)} matches")
    return errors


def main():
    total = 0
    for case, payload in CASES.items():
        frames = run(payload)
        errors = validate(payload, frames)
        total += len(frames)
        if len(frames) > 200:
            raise SystemExit(f"{case}: frame budget exceeded")
        if errors:
            print(f"FAIL {case}: {len(errors)} errors")
            for error in errors[:12]:
                print(f"  - {error}")
            raise SystemExit(1)
        print(f"ok {case}: {len(frames)} frames, matches={frames[-1]['structure']['matches']}")

    try:
        run({"text": "AB", "pattern": ""})
    except ValueError as error:
        print(f"ok invalid empty pattern: rejected ({error})")
    else:
        raise SystemExit("invalid empty pattern: not rejected")

    official = run(OFFICIAL)
    lps_values = official[-1]["structure"]["lps"]
    if lps_values != [0, 0, 1, 2, 0]:
        raise SystemExit(f"official lps {lps_values} != [0,0,1,2,0]")
    if official[-1]["structure"]["matches"] != [2, 9]:
        raise SystemExit("official matches != [2,9]")
    if not any(frame["structure"]["operation"] == "build-fallback" for frame in official):
        raise SystemExit("official trace lacks a build fallback")
    if not any(frame["structure"]["operation"] == "search-fallback" for frame in official):
        raise SystemExit("official trace lacks a search fallback")
    print(f"verified {total} frames across {len(CASES)} cases")


if __name__ == "__main__":
    main()
