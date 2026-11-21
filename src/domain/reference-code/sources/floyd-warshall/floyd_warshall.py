"""AlgoViz reference implementation: Floyd-Warshall.

Dynamic programming over allowed intermediate vertices; handles negative
edges but not negative cycles. dist[i][j] is the shortest i -> j distance.

Reading guide:
1. Start from the direct-edge distance matrix; diagonal is 0 and missing edges are
   infinity.
2. Use k as the only allowed intermediate vertex, in the outer loop.
3. Relax dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).
4. The matrix is updated in place; negative cycles can be detected on the diagonal.

Complexity: O(V^3); extra space O(V^2) for the distance matrix.
Convention: 0-based vertices; INF means no edge/path; the diagonal starts at 0.
"""

from __future__ import annotations

INF = float("inf")


# Outer loop fixes the only allowed intermediate vertex k; relax i -> j through k.
# The outer loop must be the intermediate vertex k; relaxing k before it is allowed would use incomplete paths.
def floyd_warshall(dist: list[list[float]]) -> None:
    size = len(dist)
    for middle in range(size):
        for source in range(size):
            if dist[source][middle] == INF:
                continue
            for target in range(size):
                if dist[middle][target] == INF:
                    continue
                candidate = dist[source][middle] + dist[middle][target]
                if candidate < dist[source][target]:
                    dist[source][target] = candidate


def main() -> None:
    dist = [
        [0, 3, INF, 7],
        [8, 0, 2, INF],
        [5, INF, 0, 1],
        [2, INF, INF, 0],
    ]
    floyd_warshall(dist)

    print("distances:")
    for row in dist:
        print(["INF" if value == INF else value for value in row])
    assert dist[1][0] == 5
    assert dist[0][3] == 6


if __name__ == "__main__":
    main()
