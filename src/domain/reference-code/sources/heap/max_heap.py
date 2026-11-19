"""AlgoViz reference implementation: max heap.

Original code written for this repository under the MIT License.
Array-backed binary heap with sift-up on insert and sift-down on pop.
"""

from __future__ import annotations


class MaxHeap:
    def __init__(self) -> None:
        self._items: list[int] = []

    def push(self, value: int) -> None:
        self._items.append(value)
        self._sift_up(len(self._items) - 1)

    def pop(self) -> int | None:
        if not self._items:
            return None
        top = self._items[0]
        last = self._items.pop()
        if self._items:
            self._items[0] = last
            self._sift_down(0)
        return top

    def _sift_up(self, index: int) -> None:
        while index > 0:
            parent = (index - 1) // 2
            if self._items[parent] >= self._items[index]:
                return
            self._items[parent], self._items[index] = self._items[index], self._items[parent]
            index = parent

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
