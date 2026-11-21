"""AlgoViz convenience implementation: stack with a Python list.

append() adds at the end; pop() removes and returns the last item.

Reading guide:
1. This convenience file uses a Python list as a LIFO stack.
2. append adds to the end; pop() removes the last element.
3. The adapter does not implement a fixed capacity or manual top index.

Complexity: O(1) amortized push/pop; extra space O(n).
Convention: The end of the list is the top; pop from an empty list raises IndexError.
"""

from __future__ import annotations


def main() -> None:
    # A Python list is a dynamic stack; pop() on an empty list raises IndexError.
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
