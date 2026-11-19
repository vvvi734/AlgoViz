"""AlgoViz reference implementation: Huffman coding.

Original code written for this repository under the MIT License.
Builds a min-heap of nodes, repeatedly merges the two lightest nodes,
then emits prefix-free codes by walking the tree.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Node:
    frequency: int
    symbol: str = ""
    order: int = 0
    left: "Node | None" = None
    right: "Node | None" = None


def node_less(a: Node, b: Node) -> bool:
    return (a.frequency, a.order) < (b.frequency, b.order)


class MinHeap:
    def __init__(self) -> None:
        self._items: list[Node] = []

    def __len__(self) -> int:
        return len(self._items)

    def push(self, node: Node) -> None:
        self._items.append(node)
        index = len(self._items) - 1
        while index > 0:
            parent = (index - 1) // 2
            if not node_less(self._items[index], self._items[parent]):
                return
            self._items[parent], self._items[index] = self._items[index], self._items[parent]
            index = parent

    def pop(self) -> Node:
        top = self._items[0]
        last = self._items.pop()
        if self._items:
            self._items[0] = last
            index = 0
            while True:
                left = index * 2 + 1
                right = left + 1
                smallest = index
                if left < len(self._items) and node_less(self._items[left], self._items[smallest]):
                    smallest = left
                if right < len(self._items) and node_less(self._items[right], self._items[smallest]):
                    smallest = right
                if smallest == index:
                    return top
                self._items[index], self._items[smallest] = (
                    self._items[smallest],
                    self._items[index],
                )
                index = smallest
        return top


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
    heap = MinHeap()
    for order, (symbol, frequency) in enumerate(zip(symbols, frequencies)):
        heap.push(Node(frequency, symbol, order))

    order = len(frequencies)
    while len(heap) > 1:
        first = heap.pop()
        second = heap.pop()
        heap.push(Node(first.frequency + second.frequency, order=order, left=first, right=second))
        order += 1

    root = heap.pop()
    codes: dict[str, str] = {}
    collect_codes(root, "", codes)
    print("root frequency:", root.frequency)
    print("codes:", codes)
    assert root.frequency == sum(frequencies)
    assert codes["f"] == "0"


if __name__ == "__main__":
    main()
