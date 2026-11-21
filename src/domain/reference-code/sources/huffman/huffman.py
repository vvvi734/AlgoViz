"""AlgoViz reference implementation: Huffman coding.

Builds a min-heap of nodes, repeatedly merges the two lightest nodes,
then emits prefix-free codes by walking the tree.

Reading guide:
1. Count the frequency of every symbol.
2. Put all leaf nodes in a min-heap ordered by frequency.
3. Repeatedly merge the two least frequent nodes until one root remains.
4. Left edges mean 0 and right edges mean 1, producing prefix-free codes.

Complexity: O(n log n) with a heap; extra space O(n) for tree and codes.
Convention: Symbols are unique; ties are broken by insertion order where the heap
  supports it.
"""
# 中文导读：自定义结点比较器让 heapq 按权值合并，递归生成哈夫曼编码。
# 阅读顺序：先看 node_less 的平局规则，再看合并循环和 collect_codes。
# 输入/输出：输入字符权值；输出编码表。
# 不变量：优先队列中权值最小的两个结点先合并；叶子的编码由路径唯一确定。
# 易错点：比较器不满足全序导致堆行为不稳定；单字符树编码为空。
# 复杂度：O(n log n)，额外空间 O(n)。

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Node:
    frequency: int
    symbol: str = ""
    order: int = 0
    left: "Node | None" = None
    right: "Node | None" = None


# Purpose: Provide an ascending-weight comparison for heapq, using the symbol to keep equal weights stable.
# 作用：为 heapq 提供按权值升序的比较；权值相同时按字符稳定排序。
def node_less(a: Node, b: Node) -> bool:
    return (a.frequency, a.order) < (b.frequency, b.order)


class MinHeap:
    def __init__(self) -> None:
        self._items: list[Node] = []

    def __len__(self) -> int:
        return len(self._items)

    # Min-heap ordering is (frequency, insertion order), keeping ties deterministic.
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


# Purpose: Collect leaf codes recursively with 0 for the left edge and 1 for the right edge.
# 作用：递归收集叶子编码；左 0 右 1。
def collect_codes(node: Node, path: str, codes: dict[str, str]) -> None:
    if node.left is None and node.right is None:
        codes[node.symbol] = path or "(empty)"
        return
    if node.left is not None:
        collect_codes(node.left, path + "0", codes)
    if node.right is not None:
        collect_codes(node.right, path + "1", codes)


# Purpose: Build a demo Huffman tree and print the codes.
# 作用：构造演示哈夫曼树并打印编码。
def main() -> None:
    symbols = ["a", "b", "c", "d", "e", "f"]
    frequencies = [5, 9, 12, 13, 16, 45]
    heap = MinHeap()
    for order, (symbol, frequency) in enumerate(zip(symbols, frequencies)):
        heap.push(Node(frequency, symbol, order))

    order = len(frequencies)
    # Merge the two least frequent nodes repeatedly; the final tree gives shorter codes to more frequent symbols.
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
