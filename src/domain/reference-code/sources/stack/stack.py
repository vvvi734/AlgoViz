"""AlgoViz reference implementation: array stack.

A fixed-capacity stack with an explicit size and overflow checks.

Reading guide:
1. The stack stores items in a fixed array plus a size counter.
2. The top element is items[size - 1]; push writes at items[size] and increments size.
3. Pop decrements size before reading; empty and full operations report failure instead
   of crashing.

Complexity: O(1) per operation; extra space O(capacity).
Convention: size is the number of stored items and also the next free slot; capacity is
  fixed.
"""

from __future__ import annotations


class Stack:
    def __init__(self, capacity: int = 8) -> None:
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self._items: list[int] = [0] * capacity
        self._size = 0

    # Push writes at size and increments it; the capacity check prevents overflow.
    def push(self, value: int) -> bool:
        if self._size == len(self._items):
            return False
        self._items[self._size] = value
        self._size += 1
        return True

    def pop(self) -> int | None:
        if self._size == 0:
            return None
        self._size -= 1
        return self._items[self._size]

    def peek(self) -> int | None:
        if self._size == 0:
            return None
        return self._items[self._size - 1]

    def is_empty(self) -> bool:
        return self._size == 0


def main() -> None:
    stack = Stack()
    assert stack.push(1) and stack.push(2) and stack.push(3)
    assert stack.peek() == 3
    print("top:", stack.peek())
    while not stack.is_empty():
        print("pop:", stack.pop())
    assert stack.pop() is None
    print("underflow: yes")


if __name__ == "__main__":
    main()
