"""AlgoViz convenience implementation: sequential list with a Python list.

Original code written for this repository under the MIT License.
list.insert and list.pop shift elements internally.
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
