"""AlgoViz convenience implementation: hash table with a Python dict.

Original code written for this repository under the MIT License.
dict chooses its own collision strategy; no probing loop is visible.
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
