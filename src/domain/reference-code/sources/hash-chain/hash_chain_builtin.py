"""AlgoViz convenience implementation: hash table with a Python dict.

dict performs hashing and collision resolution internally.

Reading guide:
1. This convenience file uses a Python dict instead of hand-written bucket chains.
2. Membership and insertion are expected O(1), with O(n) worst case.
3. The dict owns hashing and collision resolution; insertion order is preserved as an
   incidental detail.

Complexity: Expected time: O(1) per operation, O(n) worst; extra space O(n).
Convention: Unique integer keys; do not rely on ordering for hash-table semantics.
"""

from __future__ import annotations


def main() -> None:
    table: dict[int, str] = {15: "alpha", 22: "beta", 8: "gamma", 29: "delta"}
    for key, value in table.items():
        print(key, "->", value)
    print("contains 29:", 29 in table)
    print("contains 7:", 7 in table)


if __name__ == "__main__":
    main()
