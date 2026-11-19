"""AlgoViz reference implementation: Floyd-Warshall.

Original code written for this repository under the MIT License.
Dynamic programming over allowed intermediate vertices; handles negative
edges but not negative cycles. dist[i][j] is the shortest i -> j distance.
"""

from __future__ import annotations

INF = float("inf")


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
