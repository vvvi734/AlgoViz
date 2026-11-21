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
# 中文导读：以每个顶点依次作为中间点，动态规划求出所有点对的最短距离。
# 阅读顺序：先看 dist 矩阵初始化，再看最外层 k 必须放在最外层的理由。
# 输入/输出：输入邻接矩阵 dist；原地更新为全源最短路径，无返回值。
# 不变量：第 k 轮后，dist[i][j] 只允许经过 {0..k} 中的中间点。
# 易错点：把 k 循环放到内层；INF 相加溢出；负环未检测。
# 复杂度：O(V^3)，额外空间 O(1)（不计输入矩阵）。

from __future__ import annotations

INF = float("inf")


# Outer loop fixes the only allowed intermediate vertex k; relax i -> j through k.
# The outer loop must be the intermediate vertex k; relaxing k before it is allowed would use incomplete paths.
# Purpose: Update dist in place with all-pairs shortest paths; no new matrix is returned.
# 作用：原地把 dist 更新为全源最短路径；不返回新矩阵。
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


# Purpose: Build a demo matrix and print final distances.
# 作用：构造演示矩阵并打印最终距离。
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
