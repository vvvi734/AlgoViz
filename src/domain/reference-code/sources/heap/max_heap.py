"""AlgoViz reference implementation: max heap.

Array-backed binary heap with sift-up on insert and sift-down on pop.

Reading guide:
1. Store the complete binary tree in an array without holes.
2. For index i, the parent is (i - 1) / 2 and the children are 2i + 1, 2i + 2.
3. Push appends and sifts up; pop moves the last value to the root and sifts down.

Complexity: O(log n) push/pop, O(1) top; extra space O(n).
Convention: Max-heap property: every parent is >= its children; 0-based array indices.
"""
# 中文导读：数组存储完全二叉树，插入上滤，弹出把末尾移到根后下滤。
# 阅读顺序：先看父子下标公式，再看 _sift_up 与 _sift_down 的停止条件。
# 输入/输出：输入整数；push 无返回值，pop 返回当前最大值，空堆返回 None。
# 不变量：任意父结点不小于其孩子；数组无空洞。
# 易错点：下标从 1 开始却用 0 基公式；下滤只比较左孩子。
# 复杂度：push/pop O(log n)，top O(1)，额外空间 O(n)。

from __future__ import annotations


class MaxHeap:
    def __init__(self) -> None:
        self._items: list[int] = []

    # 作用：追加 value 并上滤到满足最大堆性质。
    def push(self, value: int) -> None:
        self._items.append(value)
        self._sift_up(len(self._items) - 1)

    # 作用：返回并删除堆顶；空堆返回 None，随后下滤新根。
    def pop(self) -> int | None:
        if not self._items:
            return None
        top = self._items[0]
        last = self._items.pop()
        if self._items:
            self._items[0] = last
            self._sift_down(0)
        return top

    # Sift up while the parent is smaller; stop when the heap property holds or root is reached.
    # 作用：从 index 向上与父结点交换，直到父结点更大或到达根。
    def _sift_up(self, index: int) -> None:
        while index > 0:
            parent = (index - 1) // 2
            if self._items[parent] >= self._items[index]:
                return
            self._items[parent], self._items[index] = self._items[index], self._items[parent]
            index = parent

    # For index i the children are 2*i+1 and 2*i+2; sift-down swaps with the larger child until the parent is >= both.
    # 作用：从 index 向下与较大孩子交换，直到满足堆序或到叶。
    def _sift_down(self, index: int) -> None:
        while True:
            left = index * 2 + 1
            right = left + 1
            largest = index
            if left < len(self._items) and self._items[left] > self._items[largest]:
                largest = left
            if right < len(self._items) and self._items[right] > self._items[largest]:
                largest = right
            if largest == index:
                return
            self._items[index], self._items[largest] = self._items[largest], self._items[index]
            index = largest

    def to_list(self) -> list[int]:
        return list(self._items)


def main() -> None:
    heap = MaxHeap()
    for value in [5, 3, 8, 1, 9, 2]:
        heap.push(value)
    print("heap array:", heap.to_list())

    output = []
    while (value := heap.pop()) is not None:
        output.append(value)
    print("extract:", output)
    assert output == [9, 8, 5, 3, 2, 1]
    assert heap.pop() is None


if __name__ == "__main__":
    main()
