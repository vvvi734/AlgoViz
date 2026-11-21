"""AlgoViz convenience implementation: queue with collections.deque.

append() adds at the right; popleft() removes from the left in O(1).

Reading guide:
1. This convenience file uses collections.deque instead of a hand-written ring buffer.
2. append adds at the right; popleft removes the oldest element in O(1).
3. A list would make popleft O(n), which is why deque is the appropriate container.

Complexity: O(1) per append/popleft; extra space O(n).
Convention: The left end is the front; popleft on an empty deque raises IndexError.
"""
# 中文导读：用 collections.deque 演示 FIFO 队列的入队、出队和查看队头。
# 阅读顺序：先看 append 入队，再看 popleft 出队。
# 输入/输出：输入整数序列；输出出队顺序。
# 不变量：deque 的 popleft 是 O(1)，队头是最早入队元素。
# 易错点：用 list.pop(0) 替代 deque 导致 O(n) 搬移；空队列仍出队。
# 复杂度：每次操作 O(1)，额外空间 O(n)。

from __future__ import annotations

from collections import deque


# Purpose: Demonstrate FIFO queue behaviour with deque.
# 作用：用 deque 演示队列的 FIFO 行为。
def main() -> None:
    # `deque.popleft()` is O(1); a list pop(0) would shift every remaining element.
    queue: deque[int] = deque()
    for value in range(1, 5):
        queue.append(value)

    print("front:", queue[0])
    while queue:
        print("dequeue:", queue.popleft())
    print("empty: yes")


if __name__ == "__main__":
    main()
