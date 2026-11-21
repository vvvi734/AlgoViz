# 中文导读：用一次 DFS 的 disc/low 同时求无向图的关节点和桥。
# 阅读顺序：先看 disc、low、parent 的初始化；再看 dfs 如何分树边、返祖边和父边；最后看根的双孩子条件。
# 关键不变量：low[u] 是 u 子树能回到的最早祖先；low[child] >= disc[parent] 时 parent 删除会切断 child 子树。
# 易错点：根错误套用 low 判据；父边当返祖边；桥条件应为严格大于。
# 复杂度：O(V+E) 时间，O(V) 递归栈与状态数组。
# 输入/输出：输入 8 个顶点的无向图；输出关节点编号与桥端点。
# 函数地图：先读 main 的建图和多根扫描，再读 dfs 的进入、分类、返回判定。

"""
AlgoViz reference implementation: articulation points and bridges.

Reading guide:
1. disc is the discovery time; low is the earliest reachable ancestor.
2. A tree edge recurses into an undiscovered neighbour.
3. A non-root u is a cut vertex when low[child] >= disc[u].
4. A bridge is the stricter tree edge with low[child] > disc[u].
5. A root is a cut vertex only with at least two DFS tree children.

Complexity: O(V + E) time, O(V) recursion and state space.
"""

VERTEX_COUNT = 8
graph = [[] for _ in range(VERTEX_COUNT)]
disc = [0] * VERTEX_COUNT
low = [0] * VERTEX_COUNT
parent = [-1] * VERTEX_COUNT
articulation = [False] * VERTEX_COUNT
bridges = set()
timer = 0


def add_edge(a, b):
    """Store an undirected edge from both endpoints."""
    graph[a].append(b)
    graph[b].append(a)


# The cut test is low[child] >= disc[parent]; the bridge test is strict low[child] > disc[parent].
# 关节点判据是 low[child] >= disc[parent]；桥判据是严格的 low[child] > disc[parent]。
def dfs(u, root):
    """DFS from u, propagate low, and mark cut vertices and bridges."""
    global timer
    timer += 1
    disc[u] = low[u] = timer
    children = 0

    for v in graph[u]:
        if disc[v] == 0:
            parent[v] = u
            children += 1
            dfs(v, root)
            low[u] = min(low[u], low[v])
            if u != root and low[v] >= disc[u]:
                articulation[u] = True
            if low[v] > disc[u]:
                bridges.add(tuple(sorted((u, v))))
        elif v != parent[u] and disc[v] < disc[u]:
            # A back edge reaches an ancestor; use disc[v], never low[v].
            # 返祖边指向祖先，应使用 disc[v]，而不是 low[v]。
            low[u] = min(low[u], disc[v])

    if u == root and children >= 2:
        articulation[root] = True


def main():
    """Build the teaching graph, run every DFS root, and print the result."""
    for a, b in [(0, 1), (1, 2), (2, 0), (2, 3), (3, 4), (3, 5), (4, 5), (6, 7)]:
        add_edge(a, b)

    for start in range(VERTEX_COUNT):
        if disc[start] == 0:
            dfs(start, start)

    print("articulation:", [v for v in range(VERTEX_COUNT) if articulation[v]])
    print("bridges:", sorted(bridges))


if __name__ == "__main__":
    main()
