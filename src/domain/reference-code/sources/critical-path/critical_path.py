"""AlgoViz reference implementation: critical path on an AOE network.

Original code written for this repository under the MIT License.
A forward topological pass computes earliest start times; a reverse pass
computes latest times. An activity is critical when its slack is zero.
"""

from __future__ import annotations

from collections import deque


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
