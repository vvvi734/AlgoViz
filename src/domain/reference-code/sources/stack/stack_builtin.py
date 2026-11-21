"""AlgoViz convenience implementation: stack with a Python list.

append() adds at the end; pop() removes and returns the last item.

Reading guide:
1. This convenience file uses a Python list as a LIFO stack.
2. append adds to the end; pop() removes the last element.
3. The adapter does not implement a fixed capacity or manual top index.

Complexity: O(1) amortized push/pop; extra space O(n).
Convention: The end of the list is the top; pop from an empty list raises IndexError.
"""
# 中文导读：用 Python list 的 append/pop 演示后进先出栈。
# 阅读顺序：先看 append 压栈，再看 pop 弹栈。
# 输入/输出：输入整数序列；输出出栈顺序。
# 不变量：list 尾部就是栈顶，append/pop 都是 O(1)。
# 易错点：用 pop(0) 当成弹栈导致 O(n) 搬移；空栈仍弹出。
# 复杂度：每次操作 O(1)，额外空间 O(n)。

from __future__ import annotations


# 作用：用 list 演示栈的 LIFO 行为。
def main() -> None:
    # A Python list is a dynamic stack; pop() on an empty list raises IndexError.
    stack: list[int] = []
    stack.append(1)
    stack.append(2)
    stack.append(3)

    print("top:", stack[-1])
    while stack:
        print("pop:", stack.pop())
    print("empty: yes")


if __name__ == "__main__":
    main()
