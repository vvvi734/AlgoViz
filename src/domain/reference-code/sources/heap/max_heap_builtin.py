"""AlgoViz convenience implementation: max heap with heapq.

Original code written for this repository under the MIT License.
heapq is a min-heap, so values are negated to simulate a max-heap.
"""

from __future__ import annotations

import heapq


def main() -> None:
    heap: list[int] = []
    for value in [5, 3, 8, 1, 9, 2]:
        heapq.heappush(heap, -value)

    output: list[int] = []
    while heap:
        output.append(-heapq.heappop(heap))
    print("extract:", output)


if __name__ == "__main__":
    main()
