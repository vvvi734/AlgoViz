"""AlgoViz convenience implementation: stack with a Python list.

Original code written for this repository under the MIT License.
append() adds at the end; pop() removes and returns the last item.
"""

from __future__ import annotations


def main() -> None:
    stack: list[int] = []
    stack.append(1)
    stack.append(2)
    stack.append(3)

    print("top:", stack[-1])
    while stack:
        print("pop:", stack.pop())
    print("empty: yes")


if __name__ == "__main__":
    main()
