"""AlgoViz reference implementation: array stack.

A fixed-capacity stack whose `top` is the index of the live top element.

Reading guide:
1. `top = -1` means empty; the first push makes it 0.
2. Push checks capacity, increments `top`, then writes `data[top]`.
3. Pop reads `data[top]` first, then decrements `top`; peek never moves `top`.

Complexity: O(1) per operation; extra space O(capacity).
Convention: `top` is the current top, not the next free slot.
"""

from __future__ import annotations


class Stack:
    def __init__(self, capacity: int = 8) -> None:
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self._data: list[int] = [0] * capacity
        self._top = -1

    # top is the live top index; -1 means empty.
    # 作用：压栈。先检查 top 是否已到 capacity - 1，再 ++top 后写入。
    def push(self, value: int) -> bool:
        if self._top >= len(self._data) - 1:
            return False
        self._top += 1
        self._data[self._top] = value
        return True

    # 作用：弹栈。先读取当前栈顶，再 --top；空栈返回 None。
    def pop(self) -> int | None:
        if self._top == -1:
            return None
        value = self._data[self._top]
        self._top -= 1
        return value

    # 作用：只读栈顶，不移动 top；空栈返回 None。
    def peek(self) -> int | None:
        if self._top == -1:
            return None
        return self._data[self._top]

    # 作用：判断空栈。唯一条件是 top == -1。
    def is_empty(self) -> bool:
        return self._top == -1


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
