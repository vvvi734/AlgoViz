"""AlgoViz reference implementation: array stack.

A fixed-capacity stack whose `top` is the index of the live top element.

中文导读：用定长数组和 top 下标实现后进先出栈；top 指向当前栈顶而不是下一个空槽。
阅读顺序：先看 top = -1 的空栈定义，再看 push 的容量检查与先加后写，最后看 pop 的先读后减。
输入/输出：push 接收一个整数并返回是否成功；pop/peek 返回栈顶整数，空栈返回 None。
不变量：0 <= top < capacity；data[0..top] 是当前全部元素，top 之上都是未使用槽。
易错点：把 top 当成下一个空槽导致首元素写到 data[1]；空栈仍 pop；容量满时继续写越界。
复杂度：push/pop/peek 均为 O(1)，额外空间 O(capacity)。

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
        # A non-positive capacity makes the first push impossible, so reject it before allocating the backing list.
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self._data: list[int] = [0] * capacity
        # _top is the live top index; -1 is the empty state, so the first push writes index 0.
        self._top = -1

    # top is the live top index; -1 means empty.
    def push(self, value: int) -> bool:
        # Check the last legal index before incrementing; this is the only thing preventing a write past the list.
        if self._top >= len(self._data) - 1:
            return False
        # Increment before assigning data[_top]; the new top must exist before its value is stored.
        self._top += 1
        self._data[self._top] = value
        return True

    # None is the empty signal; a stored 0 is a valid value because the check is on _top, not on the returned value.
    def pop(self) -> int | None:
        if self._top == -1:
            return None
        value = self._data[self._top]
        # Decrementing _top removes the element logically; the backing list keeps the old object but no operation reads it.
        self._top -= 1
        return value

    # Peek is read-only: it returns data[_top] without changing the count or the top index.
    def peek(self) -> int | None:
        if self._top == -1:
            return None
        return self._data[self._top]

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
