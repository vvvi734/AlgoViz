"""AlgoViz convenience implementation: max heap with heapq.

heapq is a min-heap, so values are negated to simulate a max-heap.

Reading guide:
1. This convenience file uses heapq, which is a min-heap by contract.
2. Negating values turns the smallest negated key into the largest original value.
3. heappush/heappop maintain the heap; no manual sift code is present.

Complexity: O(1) peek via heap[0], O(log n) push/pop; extra space O(n).
Convention: Values are stored negated; remember to negate again when reading the
  maximum.
"""

from __future__ import annotations

import heapq


def main() -> None:
    heap: list[int] = []
    for value in [5, 3, 8, 1, 9, 2]:
        # `heapq` is a min-heap, so values are negated; remember to negate the popped value back.
        heapq.heappush(heap, -value)

    output: list[int] = []
    while heap:
        output.append(-heapq.heappop(heap))
    print("extract:", output)


if __name__ == "__main__":
    main()
