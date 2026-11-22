/*
 * 中文导读：以每个结点为“允许的中间点”，逐步更新所有点对之间的最短路。
 * 阅读顺序：先看 dist 矩阵初始化（自己到自己是 0，无边是 INF）；再看三层循环中 k 必须在最外层；最后看负环检测的对角线。
 * 关键不变量：处理完 k 后，dist[i][j] 是只允许 0..k 作为中间点的最短路。
 * 易错点：把 k 放到内层；INF 相加溢出；无向边只填一个方向；负环仍当作有效结果。
 * 复杂度：O(V³) 时间，O(V²) 空间。
 * 输入/输出：输入邻接矩阵；原地更新为全源最短路径；main 打印最终矩阵。
*/

/*
 * Floyd-Warshall all-pairs shortest paths in C11.
 *
 * Start from the weighted adjacency matrix, with INF where no edge exists and 0
 * on the diagonal. For every intermediate vertex k, relax dist[i][j] through k.
 * The k loop must stay outermost so each round uses paths whose intermediate
 * vertices are already allowed. Time O(V^3), space O(V^2).
 */

#include <stdio.h>

#define VERTEX_COUNT 4
#define INF 1000000

// The outer loop must be the intermediate vertex k; relaxing k before it is allowed would use incomplete paths.
// Purpose: Treat each vertex k as the allowed intermediate and update every i→j distance; k must be the outermost loop.
// 作用：以每个结点 k 作为允许的中间点，更新所有 i→j 的最短距离；k 必须在最外层。
void FloydWarshall(int distance[VERTEX_COUNT][VERTEX_COUNT])
{
    for (int middle = 0; middle < VERTEX_COUNT; ++middle)
    {
        for (int from = 0; from < VERTEX_COUNT; ++from)
        {
            for (int to = 0; to < VERTEX_COUNT; ++to)
            {
                if (distance[from][middle] != INF && distance[middle][to] != INF &&
                    distance[from][middle] + distance[middle][to] < distance[from][to])
                {
                    distance[from][to] = distance[from][middle] + distance[middle][to];
                }
            }
        }
    }
}

int main(void)
{
    int distance[VERTEX_COUNT][VERTEX_COUNT] = {
        {0, 5, INF, 10},
        {INF, 0, 3, INF},
        {INF, INF, 0, 1},
        {INF, INF, INF, 0},
    };

    FloydWarshall(distance);
    printf("all-pairs shortest distances:\n");
    for (int from = 0; from < VERTEX_COUNT; ++from)
    {
        for (int to = 0; to < VERTEX_COUNT; ++to)
        {
            if (distance[from][to] == INF)
            {
                printf(" INF");
            }
            else
            {
                printf(" %3d", distance[from][to]);
            }
        }
        printf("\n");
    }
    return 0;
}
