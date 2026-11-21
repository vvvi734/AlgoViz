"""AlgoViz reference implementation: circular queue.

A fixed-capacity ring buffer that reserves one slot to distinguish empty/full.

中文导读：用环形数组和 front/rear 两个下标实现 FIFO 队列，并刻意空出一个槽来区分队空与队满。
阅读顺序：先看 front/rear 的定义，再看队空与队满的判定，最后看入队/出队为何都要对 capacity 取模。
输入/输出：enqueue 接收一个整数并返回是否成功；dequeue/front 返回队头整数，空队列返回 None。
不变量：front 指向当前队头，rear 指向下一个可写槽；元素个数为 (rear - front + capacity) % capacity。
易错点：把 rear 直接自增而不取模；用 front == rear 同时表示空和满；忘记保留一个空槽导致满/空无法区分。
复杂度：enqueue/dequeue/front 均为 O(1)，额外空间 O(capacity)。

Reading guide:
1. `front` indexes the first live item; `rear` indexes the next free slot.
2. `front == rear` means empty.
3. `(rear + 1) % capacity == front` means full, so at most capacity - 1 items live.
4. Enqueue writes `data[rear]` then advances rear modulo capacity; dequeue reads
   `data[front]` then advances front modulo capacity.

Complexity: O(1) per operation; extra space O(capacity).
Convention: one slot is reserved; this file never mixes that rule with a count.
"""

from __future__ import annotations


class Queue:
    def __init__(self, capacity: int = 8) -> None:
        if capacity <= 1:
            raise ValueError("capacity must be at least 2")
        self._data: list[int] = [0] * capacity
        self._front = 0
        self._rear = 0

    # 作用：判断空队列。front == rear 即空。
    def is_empty(self) -> bool:
        return self._front == self._rear

    # front == rear means empty; one reserved slot makes (rear + 1) % capacity == front full.
    # 作用：判断队满。rear 的下一个位置撞上 front 时，只剩保留空位。
    def is_full(self) -> bool:
        return (self._rear + 1) % len(self._data) == self._front

    # 作用：入队。先判满，再写 data[rear]，最后让 rear 取模后移。
    def enqueue(self, value: int) -> bool:
        if self.is_full():
            return False
        self._data[self._rear] = value
        self._rear = (self._rear + 1) % len(self._data)
        return True

    # 作用：出队。空队列返回 None；否则读 data[front] 后让 front 取模后移。
    def dequeue(self) -> int | None:
        if self.is_empty():
            return None
        value = self._data[self._front]
        self._front = (self._front + 1) % len(self._data)
        return value

    # 作用：读取队首但不删除；不移动 front。
    def front(self) -> int | None:
        if self.is_empty():
            return None
        return self._data[self._front]


def main() -> None:
    queue = Queue(5)
    for value in range(1, 5):
        assert queue.enqueue(value)
    assert queue.is_full()
    assert queue.front() == 1
    print("front:", queue.front())
    print("dequeue:", queue.dequeue())
    assert queue.enqueue(5)
    print("wrapped rear:", queue._rear)
    while queue.front() is not None:
        print("dequeue:", queue.dequeue())
    assert queue.dequeue() is None
    print("underflow: yes")


if __name__ == "__main__":
    main()
