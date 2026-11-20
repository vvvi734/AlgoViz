"""AlgoViz convenience implementation: hash table with a Python dict.

dict chooses its own collision strategy; no probing loop is visible.

Reading guide:
1. This convenience file uses a Python dict, not a hand-written linear-probe table.
2. The dict owns hashing and collision resolution; probe sequences are not exposed.
3. Use this file to compare the interface, not to inspect slot-by-slot probing.

Complexity: Expected time: O(1) per operation, O(n) worst; extra space O(n).
Convention: Unique integer keys; the internal table layout is unspecified.
"""

from __future__ import annotations


def main() -> None:
    table: dict[int, str] = {22: "a", 11: "b", 33: "c", 44: "d", 55: "e"}
    for key, value in table.items():
        print(key, "->", value)
    print("contains 44:", 44 in table)
    print("contains 7:", 7 in table)


if __name__ == "__main__":
    main()
