/*
 * 中文导读：按边权从小到大扫描，用并查集跳过会成环的边，选出 V-1 条边。
 * 阅读顺序：先看边的排序；再看 find/union 如何判断两端是否已连通；最后看提前停止条件。
 * 关键不变量：已选边始终构成森林；加入一条边前，它的两个端点必须属于不同集合。
 * 易错点：忘记路径压缩/按秩合并；边数不足 V-1 仍当成功；并查集父数组未初始化；有向边误用。
 * 复杂度：O(E log E) 排序 + 近似 O(E α(V)) 并查集，空间 O(V+E)。
 * 输入/输出：输入无向带权边表；返回选中的 V-1 条边与总权值；main 打印 MST。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz reference implementation: Kruskal's minimum spanning tree (C++17).
// Sorts all edges by weight and adds an edge only when its endpoints are
// in different disjoint-set components.
//
// Reading guide:
// 1. Sort all undirected edges by nondecreasing weight.
// 2. A disjoint-set structure tracks which vertices are already connected.
// 3. Accept an edge only when its endpoints are in different sets; union them
//    afterwards.
// 4. Stop after V - 1 edges; a shorter result means the graph is disconnected.
//
// Complexity: O(E log E) for sorting plus near-linear DSU work; extra space
//   O(V + E).
// Convention: Edges are (u, v, weight); 0-based vertices; equal weights may yield
//   different valid MSTs.

#include <algorithm>
#include <iostream>
#include <vector>

struct Edge
{
    int from;
    int to;
    int weight;
};

class DisjointSet
{
  public:
    // 作用：初始化并查集：每个结点自成一个集合，秩初始为 0。
    explicit DisjointSet(int size) : parent_(size), rank_(size, 0)
    {
        for (int i = 0; i < size; ++i)
        {
            parent_[i] = i;
        }
    }

    // Union by rank keeps DSU trees shallow; a rejected edge would close a cycle.
    // Sort by weight, then accept an edge only when union-find reports different components; otherwise it closes a cycle.
    // 作用：合并两个集合：先找根，根相同说明会成环；否则按秩挂接并更新秩。
    bool unite(int a, int b)
    {
        int root_a = find(a);
        int root_b = find(b);
        if (root_a == root_b)
        {
            return false;
        }
        if (rank_[root_a] < rank_[root_b])
        {
            parent_[root_a] = root_b;
        }
        else if (rank_[root_a] > rank_[root_b])
        {
            parent_[root_b] = root_a;
        }
        else
        {
            parent_[root_b] = root_a;
            ++rank_[root_a];
        }
        return true;
    }

  private:
    // 作用：并查集查找根；带路径压缩，降低后续查询高度。
    int find(int vertex)
    {
        while (parent_[vertex] != vertex)
        {
            parent_[vertex] = parent_[parent_[vertex]];
            vertex = parent_[vertex];
        }
        return vertex;
    }

    std::vector<int> parent_;
    std::vector<int> rank_;
};

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    std::vector<Edge> edges{
        {0, 1, 2}, {0, 3, 6}, {1, 2, 3}, {1, 3, 8}, {1, 4, 5}, {2, 4, 7}, {3, 4, 9},
    };
    std::sort(edges.begin(), edges.end(),
              [](const Edge &a, const Edge &b)
              {
                  return a.weight < b.weight;
              });

    DisjointSet sets(5);
    int total = 0;
    int used = 0;
    std::cout << "mst edges:\n";
    for (const Edge &edge : edges)
    {
        if (sets.unite(edge.from, edge.to))
        {
            std::cout << edge.from << " - " << edge.to << " : " << edge.weight << '\n';
            total += edge.weight;
            if (++used == 4)
            {
                break;
            }
        }
    }
    std::cout << "total: " << total << '\n';
    return 0;
}
