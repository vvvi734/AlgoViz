"""AlgoViz convenience implementation: queue with collections.deque.

append() adds at the right; popleft() removes from the left in O(1).

Reading guide:
1. This convenience file uses collections.deque instead of a hand-written ring buffer.
2. append adds at the right; popleft removes the oldest element in O(1).
3. A list would make popleft O(n), which is why deque is the appropriate container.

Complexity: O(1) per append/popleft; extra space O(n).
Convention: The left end is the front; popleft on an empty deque raises IndexError.
"""

from __future__ import annotations

from collections import deque


def main() -> None:
    # `deque.popleft()` is O(1); a list pop(0) would shift every remaining element.
    queue: deque[int] = deque()
    for value in range(1, 5):
        queue.append(value)

    print("front:", queue[0])
    while queue:
        print("dequeue:", queue.popleft())
    print("empty: yes")


if __name__ == "__main__":
    main()
