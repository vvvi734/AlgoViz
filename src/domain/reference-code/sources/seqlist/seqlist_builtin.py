"""AlgoViz convenience implementation: sequential list with a Python list.

Original code written for this repository under the MIT License.
list.insert and list.pop shift elements internally.

Reading guide:
1. This convenience file uses a Python list as a dynamic sequential list.
2. Indexing and append are fast; insert/pop in the middle shift the tail.
3. The adapter does not maintain a separate capacity field.

Complexity: O(1) indexed access, O(n) middle insert/erase, O(1) amortized append;
  extra space O(n).
Convention: Positions are 0-based; insert accepts 0..len, pop requires a valid index.
"""

from __future__ import annotations


def main() -> None:
    values = [1, 3]
    values.insert(1, 2)
    values.append(4)
    print("after inserts:", values)

    values.pop(1)
    print("after erase:", values)


if __name__ == "__main__":
    main()
