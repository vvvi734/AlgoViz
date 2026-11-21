"""AlgoViz reference implementation: critical path on an AOE network.

A forward topological pass computes earliest start times; a reverse pass
computes latest times. An activity is critical when its slack is zero.

Reading guide:
1. Treat the AOE network as a DAG of events and weighted activities.
2. Compute earliest event times in topological order.
3. Compute latest event times in reverse topological order.
4. An activity is critical when latest(head) - earliest(tail) - weight == 0.

Complexity: O(V + E) for adjacency-list processing, O(V^2) when scanning a matrix;
  extra space O(V + E) for times, degrees and the queue.
Convention: Vertices are 0-based events; the project starts at event 0 and ends at the
  last event.
"""
# 中文导读：在 AOE 网上做正推和逆推，得到每个活动的最早/最迟开始时间与时间余量。
# 阅读顺序：先看拓扑序的正推，再看逆推的取最小，最后看余量为 0 的关键活动。
# 输入/输出：输入活动边 (u, v, duration)；输出最早/最迟时间和关键活动列表。
# 不变量：正推取前驱完成时间最大值；逆推取后继最迟开始时间最小值。
# 易错点：逆推顺序不是拓扑逆序；把边权当顶点权；汇点不唯一。
# 复杂度：O(V+E)，额外空间 O(V+E)。

from __future__ import annotations

from collections import deque


# Forward pass takes the maximum predecessor finish; backward pass the minimum successor start; activity slack is latest(head) - earliest(tail) - weight.
# 作用：构造演示 AOE 网并打印关键路径信息。
def main() -> None:
    activities = [
        (0, 1, 3), (0, 2, 2), (1, 2, 1), (1, 3, 2),
        (2, 3, 1), (2, 4, 3), (3, 5, 2), (4, 5, 1),
    ]
    graph: list[list[int]] = [[] for _ in range(6)]
    indegree = [0] * 6
    for index, (source, target, _) in enumerate(activities):
        graph[source].append(index)
        indegree[target] += 1

    earliest = [0] * 6
    ready = deque(vertex for vertex in range(6) if indegree[vertex] == 0)
    order: list[int] = []
    while ready:
        vertex = ready.popleft()
        order.append(vertex)
        for index in graph[vertex]:
            source, target, weight = activities[index]
            earliest[target] = max(earliest[target], earliest[source] + weight)
            indegree[target] -= 1
            if indegree[target] == 0:
                ready.append(target)

    latest = [earliest[-1]] * 6
    # Reverse pass: latest[v] = min(latest[next] - weight).
    for vertex in reversed(order):
        for index in graph[vertex]:
            _, target, weight = activities[index]
            latest[vertex] = min(latest[vertex], latest[target] - weight)

    print("earliest:", earliest)
    print("latest:", latest)
    print("duration:", earliest[-1])

    print("critical edges:")
    for source, target, weight in activities:
        if (
            earliest[source] == latest[source]
            and earliest[target] == latest[target]
            and latest[target] - earliest[source] == weight
        ):
            print(f"{source} -> {target} : {weight}")

    assert earliest[-1] == 8
    assert latest == [0, 3, 4, 6, 7, 8]


if __name__ == "__main__":
    main()
