"""AlgoViz convenience implementation: max heap with heapq.

heapq is a min-heap, so values are negated to simulate a max-heap.

Reading guide:
1. This convenience file uses heapq, which is a min-heap by contract.
2. Negating values turns the smallest negated key into the largest original value.
3. heappush/heappop maintain the heap; no manual sift code is present.

Complexity: O(1) peek via heap[0], O(log n) push/pop; extra space O(n).
Convention: Values are stored negated; remember to negate again when reading the
  maximum.
"""
# 中文导读：用 heapq 的负值技巧演示最大堆语义。
# 阅读顺序：先看取负入堆，再看取负还原。
# 输入/输出：输入整数序列；输出堆顶与弹出顺序。
# 不变量：heapq 是最小堆，负值转换后堆顶对应原最大值。
# 易错点：忘记把弹出值取负还原；直接修改堆内元素破坏堆序。
# 复杂度：push/pop O(log n)，堆顶 O(1)，额外空间 O(n)。

from __future__ import annotations

import heapq


# Purpose: Demonstrate max-heap insertion and extraction using negated values.
# 作用：用负值技巧演示最大堆的插入与弹出。
def main() -> None:
    heap: list[int] = []
    for value in [5, 3, 8, 1, 9, 2]:
        # `heapq` is a min-heap, so values are negated; remember to negate the popped value back.
        heapq.heappush(heap, -value)

    output: list[int] = []
    while heap:
        output.append(-heapq.heappop(heap))
    print("extract:", output)


if __name__ == "__main__":
    main()
