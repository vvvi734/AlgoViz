"""AlgoViz convenience implementation: Huffman tree with heapq.

heapq is a min-heap; tuples (frequency, order, node) break ties deterministically.

Reading guide:
1. This convenience file keeps the Huffman merge logic but uses heapq.
2. Heap entries carry a tie-breaking sequence number so nodes remain comparable.
3. Two minima are merged until one root remains; codes are collected recursively.

Complexity: O(n log n); extra space O(n).
Convention: Left edges are 0 and right edges are 1; the sequence field breaks frequency
  ties.
"""
# 中文导读：用 heapq 合并最小权值结点，构造哈夫曼树后递归收集编码。
# 阅读顺序：先看优先队列的合并顺序，再看 collect_codes 的左右分支。
# 输入/输出：输入字符权值；输出每个字符的 0/1 编码。
# 不变量：每次合并两个最小权值结点，树的带权路径长度最小。
# 易错点：把 0/1 分支写反；只有一个字符时编码为空。
# 复杂度：O(n log n)，额外空间 O(n)。

from __future__ import annotations

import heapq
from dataclasses import dataclass


@dataclass
class Node:
    frequency: int
    symbol: str = ""
    left: "Node | None" = None
    right: "Node | None" = None


# Purpose: Collect leaf codes recursively, appending 0 on the left branch and 1 on the right branch.
# 作用：递归收集叶子编码；左分支补 0，右分支补 1。
def collect_codes(node: Node, path: str, codes: dict[str, str]) -> None:
    if node.left is None and node.right is None:
        codes[node.symbol] = path or "(empty)"
        return
    if node.left is not None:
        collect_codes(node.left, path + "0", codes)
    if node.right is not None:
        collect_codes(node.right, path + "1", codes)


# Purpose: Build a demo weight set and print Huffman codes.
# 作用：构造演示权值集合并打印哈夫曼编码。
def main() -> None:
    symbols = ["a", "b", "c", "d", "e", "f"]
    frequencies = [5, 9, 12, 13, 16, 45]
    heap: list[tuple[int, int, Node]] = []
    for order, (symbol, frequency) in enumerate(zip(symbols, frequencies)):
        heapq.heappush(heap, (frequency, order, Node(frequency, symbol)))

    order = len(frequencies)
    # Heap tuples include a sequence number so equal frequencies never compare node objects.
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
