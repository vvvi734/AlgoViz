"""AlgoViz convenience implementation: queue with collections.deque.

Original code written for this repository under the MIT License.
append() adds at the right; popleft() removes from the left in O(1).
"""

from __future__ import annotations

from collections import deque


def main() -> None:
    queue: deque[int] = deque()
    for value in range(1, 5):
        queue.append(value)

    print("front:", queue[0])
    while queue:
        print("dequeue:", queue.popleft())
    print("empty: yes")


if __name__ == "__main__":
    main()
