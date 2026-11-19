"""AlgoViz reference implementation: circular queue.

Original code written for this repository under the MIT License.
A fixed-capacity ring buffer using head, tail and count.
"""

from __future__ import annotations


class Queue:
    def __init__(self, capacity: int = 8) -> None:
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self._items: list[int] = [0] * capacity
        self._head = 0
        self._tail = 0
        self._count = 0

    def enqueue(self, value: int) -> bool:
        if self._count == len(self._items):
            return False
        self._items[self._tail] = value
        self._tail = (self._tail + 1) % len(self._items)
        self._count += 1
        return True

    def dequeue(self) -> int | None:
        if self._count == 0:
            return None
        value = self._items[self._head]
        self._head = (self._head + 1) % len(self._items)
        self._count -= 1
        return value

    def front(self) -> int | None:
        if self._count == 0:
            return None
        return self._items[self._head]


def main() -> None:
    queue = Queue()
    for value in range(1, 5):
        assert queue.enqueue(value)
    assert queue.front() == 1
    print("front:", queue.front())
    while queue.front() is not None:
        print("dequeue:", queue.dequeue())
    assert queue.dequeue() is None
    print("underflow: yes")


if __name__ == "__main__":
    main()
