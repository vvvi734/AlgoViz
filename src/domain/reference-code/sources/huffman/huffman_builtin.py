"""AlgoViz convenience implementation: Huffman tree with heapq.

Original code written for this repository under the MIT License.
heapq is a min-heap; tuples (frequency, order, node) break ties deterministically.

Reading guide:
1. This convenience file keeps the Huffman merge logic but uses heapq.
2. Heap entries carry a tie-breaking sequence number so nodes remain comparable.
3. Two minima are merged until one root remains; codes are collected recursively.

Complexity: O(n log n); extra space O(n).
Convention: Left edges are 0 and right edges are 1; the sequence field breaks frequency
  ties.
"""

from __future__ import annotations

import heapq
from dataclasses import dataclass


@dataclass
class Node:
    frequency: int
    symbol: str = ""
    left: "Node | None" = None
    right: "Node | None" = None


def collect_codes(node: Node, path: str, codes: dict[str, str]) -> None:
    if node.left is None and node.right is None:
        codes[node.symbol] = path or "(empty)"
        return
    if node.left is not None:
        collect_codes(node.left, path + "0", codes)
    if node.right is not None:
        collect_codes(node.right, path + "1", codes)


def main() -> None:
    symbols = ["a", "b", "c", "d", "e", "f"]
    frequencies = [5, 9, 12, 13, 16, 45]
    heap: list[tuple[int, int, Node]] = []
    for order, (symbol, frequency) in enumerate(zip(symbols, frequencies)):
        heapq.heappush(heap, (frequency, order, Node(frequency, symbol)))

    order = len(frequencies)
    while len(heap) > 1:
        first_frequency, _, first = heapq.heappop(heap)
        second_frequency, _, second = heapq.heappop(heap)
        parent = Node(first_frequency + second_frequency, left=first, right=second)
        heapq.heappush(heap, (parent.frequency, order, parent))
        order += 1

    root = heap[0][2]
    codes: dict[str, str] = {}
    collect_codes(root, "", codes)
    print("root frequency:", root.frequency)
    print("codes:", codes)


if __name__ == "__main__":
    main()
