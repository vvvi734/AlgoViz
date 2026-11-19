"""AlgoViz convenience implementation: hash table with a Python dict.

Original code written for this repository under the MIT License.
dict performs hashing and collision resolution internally.
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
