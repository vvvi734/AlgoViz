# CODE-DOC-04-BATCH-04 最终报告

## 1. 结论

BATCH-04 已完成。按教材章序与课程目录顺序，从 33 个未完成正式算法中领取前 11 个：

`components`、`scc`、`prim`、`kruskal`、`topological`、`critical-path`、`dijkstra`、`floyd-warshall`、`bellman-ford`、`buddy-system`、`garbage-collection`

累计完成数由 27/60 增至 **38/60**，剩余 22 个尚未完成；未进入 BATCH-05。本批只修改 11 个算法的 33 份 principle 源码注释、对应双语 annotation、相关测试、进度清单与本报告，没有修改有效代码、Trace、输入 Schema、SVG、课程导航或其他算法。

起始基线为 `55233ca148f8d1f2d16fb6504eb2f7dd9e8edf73`。本批按 5 个算法组提交源码注释，另有 1 个双语 annotation/测试提交，全部推送至 Gitee `origin/main`；未创建分支、worktree、Tag，也未部署。

## 2. 前置核验与算法选择

- `src/domain/reference-code/registry.ts` 的 `REFERENCE_CODE` 覆盖 60 个顶层正式算法，每个算法都有 C/C++/Python principle 源码；convenience 文件不作为独立算法计数。
- 基线 `docs/CODE_DOC_04_PROGRESS.md` 记录 **27/60** 已完成，BATCH-01 6 个、BATCH-02 10 个、BATCH-03 11 个，均有实际提交哈希。
- 课程目录 `src/domain/algorithms/textbook.ts` 的 CH1–CH12 章序与进度清单一致；未发现注册表、课程目录与清单之间的 ID 冲突。
- 从未完成的 33 个中按固定顺序取前 11 个；没有为选择“更容易”的算法而重排。`articulation`（第 25 行）与 `free-list`（第 33 行）已完成，未混入本批。

| 进度行 | 章 | 算法 ID | 领取依据 |
| ---: | --- | --- | --- |
| 23 | CH7 图 | `components` | 未完成序列第 1 个 |
| 24 | CH7 图 | `scc` | 未完成序列第 2 个 |
| 26 | CH7 图 | `prim` | 未完成序列第 3 个 |
| 27 | CH7 图 | `kruskal` | 未完成序列第 4 个 |
| 28 | CH7 图 | `topological` | 未完成序列第 5 个 |
| 29 | CH7 图 | `critical-path` | 未完成序列第 6 个 |
| 30 | CH7 图 | `dijkstra` | 未完成序列第 7 个 |
| 31 | CH7 图 | `floyd-warshall` | 未完成序列第 8 个 |
| 32 | CH7 图 | `bellman-ford` | 未完成序列第 9 个 |
| 34 | CH8 动态存储管理 | `buddy-system` | 未完成序列第 10 个 |
| 35 | CH8 动态存储管理 | `garbage-collection` | 未完成序列第 11 个 |

## 3. 三语言源码路径

根目录为 `src/domain/reference-code/`。

| 算法 | C | C++ | Python |
| --- | --- | --- | --- |
| `components` | `sources/components/components.c` | `sources/components/components.cpp` | `sources/components/components.py` |
| `scc` | `sources/scc/scc.c` | `sources/scc/scc.cpp` | `sources/scc/scc.py` |
| `prim` | `sources/prim/prim.c` | `sources/prim/prim.cpp` | `sources/prim/prim.py` |
| `kruskal` | `sources/kruskal/kruskal.c` | `sources/kruskal/kruskal.cpp` | `sources/kruskal/kruskal.py` |
| `topological` | `sources/topological/topological_sort.c` | `sources/topological/topological_sort.cpp` | `sources/topological/topological_sort.py` |
| `critical-path` | `sources/critical-path/critical_path.c` | `sources/critical-path/critical_path.cpp` | `sources/critical-path/critical_path.py` |
| `dijkstra` | `sources/dijkstra/dijkstra.c` | `sources/dijkstra/dijkstra.cpp` | `sources/dijkstra/dijkstra.py` |
| `floyd-warshall` | `sources/floyd-warshall/floyd_warshall.c` | `sources/floyd-warshall/floyd_warshall.cpp` | `sources/floyd-warshall/floyd_warshall.py` |
| `bellman-ford` | `sources/bellman-ford/bellman_ford.c` | `sources/bellman-ford/bellman_ford.cpp` | `sources/bellman-ford/bellman_ford.py` |
| `buddy-system` | `sources/buddy-system/buddy_system.c` | `sources/buddy-system/buddy_system.cpp` | `sources/buddy-system/buddy_system.py` |
| `garbage-collection` | `sources/garbage-collection/garbage_collection.c` | `sources/garbage-collection/garbage_collection.cpp` | `sources/garbage-collection/garbage_collection.py` |

## 4. 每算法关键教学难点与实际注释示例

以下“源码实际注释”是源码中真实存在的一行 `//` 或 `#` 教学注释；“中文 annotation”是它在 `batch-04-annotations.ts` 中的真实 `zh` 字段，不是报告另写的概述。

### 4.1 `components`（连通分量）

- 关键难点：无向边会指回父结点，`visited` 必须在递归前置位；外层扫描每遇到一个未访问顶点才增加分量数；矩阵扫描是 O(V²)，邻接表是 O(V+E)；打印顺序是 DFS 发现顺序，不是分量编号或排序结果。
- 源码实际注释：`The matrix scan checks every column, including the edge back to the parent; the visited test is what stops that walk.`
- 中文 annotation：`矩阵扫描会检查所有列，包括指回父结点的边；真正阻止沿这条边绕回去的是 visited 判断。`

### 4.2 `scc`（强连通分量，Kosaraju）

- 关键难点：第一遍在邻居循环结束后追加，记录的是完成顺序而不是发现顺序；第一遍后所有顶点都已标记，第二遍必须清空；转置图必须交换端点；第二遍必须按完成顺序逆序启动，每棵 DFS 树恰好是一个 SCC。
- 源码实际注释：`Append after the neighbour loop: this is finish order, not discovery order, and Kosaraju reads it backwards.`
- 中文 annotation：`邻居循环结束后才追加：这里记录的是完成顺序而不是发现顺序，Kosaraju 会倒着读它。`

### 4.3 `prim`（最小生成树）

- 关键难点：`key` 是横跨当前切割的最轻边，不是到源点的累计距离；顶点确定后不再被改写；堆实现允许一个顶点因多条关联边多次入堆，`selected` 检查用来丢弃过期、较重的条目；矩阵用 0 表示“无边”，会与真正的零权边冲突；堆提前空表示图不连通，演示只返回部分总权值。
- 源码实际注释：`This matrix uses zero for 'no edge'; a genuine zero-weight edge would be indistinguishable from absence.`
- 中文 annotation：`这个矩阵用 0 表示“没有边”；真正的零权边会与“无边”无法区分。`

### 4.4 `kruskal`（最小生成树）

- 关键难点：先按权值排序是贪心前提；并查集的 `find` 返回集合代表，只有两端代表不同才接受边；按秩合并只在秩相等时增加秩；接受 V−1 条边才能提前停止，但这个上界必须由实际顶点数推导；C++ `std::sort` 不稳定，但等权边任一次序都得到合法 MST。
- 源码实际注释：`4 is V-1 for this five-vertex demo; a generic implementation must derive the bound from the vertex count.`
- 中文 annotation：`这个五顶点演示里 4 就是 V−1；通用实现必须从顶点数推导这个上界。`

### 4.5 `topological`（拓扑排序，Kahn）

- 关键难点：入度是“尚未完成的前驱数”，不是出度；所有入度为 0 的顶点同时就绪，FIFO 只是平局策略；顶点出队后才写入结果，`emitted` 同时是长度和下一个写入下标；删除一条出边只让一个邻居的入度减一，只有恰好归零才入队；结果少于 V 是存在环的证书，不是部分答案。
- 源码实际注释：`A count below V is not a partial answer; it is the cycle certificate the caller must check.`
- 中文 annotation：`少于 V 的计数不是部分答案，而是调用者必须检查的“存在环”证据。`

### 4.6 `critical-path`（AOE 关键路径）

- 关键难点：活动是带持续时间的边，事件是顶点；最早时间取所有入边完成时刻的最大值，最迟时间取所有后继“最迟减持续时间”的最小值；总工期是唯一汇点的最早时间，不是所有活动权值之和；零余量是活动级判据；C 版本假定活动数组已按拓扑序排列，且演示只有一个汇点。
- 源码实际注释：`This C version assumes ACTIVITIES is already in topological order; a random edge order would use unfinished predecessors.`
- 中文 annotation：`这个 C 版假定 ACTIVITIES 已按拓扑序排列；任意边序会用到尚未完成的前驱。`

### 4.7 `dijkstra`（单源最短路）

- 关键难点：只有非负权才能保证“已确定即最终”；堆中可能留有旧距离条目，弹出距离与表中距离不等时丢弃；未确定顶点的最小暂定距离仍为 INF 表示剩余顶点不可达；只有严格变短才改写前驱，等长路径保留先前一条；前驱链从目标向源点走，收集后只在打印时反转。
- 源码实际注释：`Dijkstra's proof needs non-negative weights; rejecting a negative edge is safer than silently returning a wrong path.`
- 中文 annotation：`Dijkstra 的正确性依赖非负权；拒绝负边比悄悄返回错误路径更安全。`

### 4.8 `floyd-warshall`（全源最短路）

- 关键难点：`k` 必须在最外层，处理完第 k 轮后 `dist[i][j]` 才表示只允许 0..k 作为中间点；更新是原地的，但本轮 `middle` 固定，因此不需要复制旧矩阵；两段都必须有限，`INF + 权值` 会溢出哨兵并造出假路线；等长路线不替换；本教学版本不检测负环，负对角线会被当作普通距离。
- 源码实际注释：`Both halves must be finite; adding INF would overflow the sentinel and create a fake route.`
- 中文 annotation：`两段都必须有限；把 INF 相加会溢出哨兵值并造出假路线。`

### 4.9 `bellman-ford`（带负权单源最短路）

- 关键难点：一条最短简单路径最多 V−1 条边，所以 V−1 轮足够；整轮无改变即为不动点，可提前停止；第 V 轮仍能松弛可达边才证明存在从源点可达的负环；不可达起点不能松弛，否则 `INF + 负权` 会造出假的有限距离；不可达的负环不应让结果失败。
- 源码实际注释：`The extra pass runs after V-1 rounds; only a reachable edge can still improve and expose a negative cycle.`
- 中文 annotation：`额外一轮在 V−1 轮之后运行；只有可达边还能变短，才暴露负环。`

### 4.10 `buddy-system`（伙伴系统）

- 关键难点：请求按 `ceil(log2(size))` 向上取整到级别；从目标级向上找第一个空闲块，避免多余分裂；分裂时左半块留在原位、右半块插到后面，地址顺序和当前下标保持有效；所有分裂完成后才标记已用；XOR 求兄弟地址依赖“2 的幂大小 + 对齐”；只有同大小且空闲的伙伴才能级联合并；合并块必须从较小地址开始。
- 源码实际注释：`XOR works because size is a power of two and the block is aligned; it gives the sibling address, not an arbitrary block.`
- 中文 annotation：`XOR 成立是因为大小是 2 的幂且块已对齐；它给出兄弟块地址，而不是任意块。`

### 4.11 `garbage-collection`（标记清除与存储紧缩）

- 关键难点：根集合决定可达性，演示固定为下标 0 的 A；每轮收集前必须清空 `marked`；在弹出时标记而不是入栈时标记，因为对象在首次弹出前可能被多个父对象重复压栈；清除只释放未标记对象；紧缩按对象数组顺序移动存活对象，保持相对顺序但不按原地址排序；引用保存对象下标，移动 `start` 后打印地址由对象派生，不需要重写引用下标。
- 源码实际注释：`References store object indices, not raw addresses; moving start changes the address derived from the object, not the stored index.`
- 中文 annotation：`引用保存对象下标而不是原始地址；移动 start 改变的是由对象派生的地址，不是存储的下标。`

## 5. 注释数量与双语映射

本批新增 **211** 条源码教学注释，并替换 6 条旧注释。最终 `BATCH_04_ANNOTATIONS` 有 **230** 条映射，覆盖 33 个 principle 文件：

| 算法 | 新增源码注释行 | 最终双语映射条数 |
| --- | ---: | ---: |
| `components` | 15 | 16 |
| `scc` | 18 | 18 |
| `prim` | 18 | 21 |
| `kruskal` | 17 | 17 |
| `topological` | 16 | 16 |
| `critical-path` | 18 | 18 |
| `dijkstra` | 15 | 16 |
| `floyd-warshall` | 19 | 19 |
| `bellman-ford` | 18 | 20 |
| `buddy-system` | 26 | 35 |
| `garbage-collection` | 31 | 34 |
| **合计** | **211** | **230** |

映射条数高于新增注释行，是因为 19 条原本已存在但此前未进入中文教学视图的有效注释被恢复映射；另有 2 条 `buddy_system.cpp` / `buddy_system.py` 的 `The merged block starts...` 与基础映射重复，已从本批映射删除，由基础映射继续提供，避免同一锚点出现两个中文版本。

验收不以“条数”单独判定。专项测试同时检查：每个文件至少 5 条；每条 `en` 是源码中的一条独立 `//` 或 `#` 注释且只出现一次；每条 `zh` 含中文并且不是模板；中文视图包含对应 `zh`、不残留该 `en`；英文视图包含 `en`、不残留任何中文；中英文视图去掉注释后的有效代码都与源码、与 `HEAD` 一致。模板式 `Purpose:` / `作用：` / `第N步` 也被测试拒绝。

## 6. 事实修正与注释质量

本批阅读源码后修正了原注释中的事实问题：

- `garbage_collection.c/.cpp/.py` 原先写成“每个引用保存地址，移动对象后必须刷新所有端点”。实际 `refs` 保存对象下标，`start` 移动后打印地址由对象派生，不需要重写下标。三语言注释和基础映射中的旧错误条目已改写/清空。
- `localization.ts` 的 `garbage-collection` 教学说明原先写成“重写每条引用端点”“标记 O(N+E)”。本实现每个对象扫描全部引用，标记为 O(N·E)；建邻接表才可降到 O(N+E)。说明已改为与实现一致。
- `floyd_warshall.cpp` 顶部原先把“不检测负环”的实现说成可在对角线检测；已改为明确不运行负环检测。
- `bellman_ford.cpp` 顶部原先把额外空间写成 `distances` 和 `predecessors`；实际只保存 `distances`，已修正。
- `prim.c` 的 settle 注释明确“先确定再松弛”；`floyd_warshall.cpp` 的等长路径注释明确“等长保留旧路径”；`buddy_system.c` 的容量、根级别、分裂注释按实际行为收紧措辞。

## 7. 双语展示、查看器与复制验证

- `batch-04-teaching.test.ts`：35 个测试，覆盖 11 个算法 × 3 种语言共 33 个文件；检查映射注册、深注释下限、唯一性、独立锚点、中文/英文视图、模板拒绝、有效代码与 `HEAD` 一致。
- `comment-fact.test.ts`：4 个测试通过，复核注释事实。
- `localization.test.ts`：12 个测试通过，其中“maps every reviewed annotation to a standalone source comment”覆盖锚点可独立定位。
- `ReferenceCodePanel.test.tsx`：28 个测试通过；其中 16 个算法执行“中文显示 → 复制 → 切换英文 → 复制”的查看器闭环，本批 11 个算法均已加入。中文复制内容包含对应中文、不包含英文原句；英文复制内容包含英文、不含中文。
- `e2e/code-doc-04-batch-04.spec.ts`：使用 `components`、`critical-path`、`buddy-system`、`garbage-collection` 四个代表算法，在真实查看器中验证文件切换、中文/英文注释语言、真实系统剪贴板读取与复制内容，1 个用例通过（4.4s）。

## 8. 人工教学质量复核

### 8.1 `components.c`：无向 DFS 的回边与分量计数

```c
void visit(int graph[VERTEX_COUNT][VERTEX_COUNT], int vertex, bool visited[VERTEX_COUNT])
{
    visited[vertex] = true;
    printf(" %d", vertex);
    for (int next = 0; next < VERTEX_COUNT; ++next)
    {
        if (graph[vertex][next] && !visited[next])
        {
            visit(graph, next, visited);
        }
    }
}
```

`visited[vertex] = true` 在递归前执行，是因为无向矩阵中 `graph[parent][vertex]` 与 `graph[vertex][parent]` 都存在；如果先递归再标记，子调用会沿父边回到尚未标记的父结点。矩阵扫描不会“跳过父结点”，父边仍然被检查，真正阻止回环的是 `!visited[next]`。外层 `count_components` 每次遇到未访问起点就 `++components`，所以返回值是 DFS 启动次数，不是度数之和或边数。

### 8.2 `scc.c`：完成顺序、转置图与第二遍起点

```c
for (int next = 0; next < VERTEX_COUNT; ++next)
{
    if (graph[vertex][next] && !visited[next])
    {
        first_pass(graph, next, visited, order, position);
    }
}
order[(*position)++] = vertex;
```

`order` 在邻居循环之后追加，记录的是完成顺序，不是发现顺序。Kosaraju 第二遍要按完成顺序的逆序处理，因此从 `VERTEX_COUNT - 1` 向 0 扫描；如果从下标 0 正序走，可能从汇侧顶点启动并把一个 SCC 拆开。第二遍前必须把 `visited` 全部清空；建图时同时写 `reverse_graph[to][from]`，否则第二遍仍在原图上沿正向边搜索。第二遍每个未访问起点开启一棵 DFS 树，每棵树恰好是一个 SCC。

### 8.3 `critical_path.c`：正推取最大、逆推取最小

```c
int candidate = earliest[ACTIVITIES[index].from] + ACTIVITIES[index].duration;
if (candidate > earliest[ACTIVITIES[index].to])
{
    earliest[ACTIVITIES[index].to] = candidate;
}
```

正推阶段一个事件的最早时间由所有入边完成时刻的最大值决定，取 `max` 才能等到最晚的前驱；逆推阶段 `latest[from]` 取所有后继 `latest[to] - duration` 的最小值，取 `min` 才能让所有后继都来得及。演示把 `latest` 全部初始化为唯一汇点的最早时间；多汇点网络需要按每个汇点分别初始化。零余量判据是 `earliest[from] == latest[to] - duration`，不是简单的节点差值。C 版本按活动数组顺序正扫/反扫，因此数组必须已经是拓扑序；这是实现前提，不是算法本身的普适性质。

### 8.4 `buddy_system.c`：分裂、标记与合并

```c
while (blocks[index].level > target_level)
{
    int half = blocks[index].size / 2;
    blocks[index].size = half;
    blocks[index].level -= 1;
    insert_block(index + 1, blocks[index].start + half, half, 1);
}
blocks[index].free = 0;
```

分裂循环保留左半块在原位，把右半块插入到它后面；因为插入位置就在当前块之后，当前 `index` 仍然指向工作块，地址顺序也保持递增。`free = 0` 放在循环之后，保证只完成一半的分裂不会提前发布为“已分配”。释放时 `buddy_start = start ^ size` 依赖块大小是 2 的幂且地址按该大小对齐；只有 `free` 且大小相同的伙伴才能合并。合并块从较小地址开始，否则 `start` 与 `level` 不再描述同一区间。

### 8.5 `garbage_collection.c`：根集合、弹出标记与下标引用

```c
int root = 0; // The demo has one root, A.
...
int current = stack[--top];
if (objects[current].marked)
{
    continue;
}
objects[current].marked = 1;
```

演示只有一个根 A（下标 0）；真实收集器必须遍历显式根集合，不能把“对象表的第 0 项”当成通用根。循环在弹出对象时才置 `marked`，而不是在压栈时置位；因此同一对象在第一次弹出前可能被多个父对象重复压栈，代码用 `if (objects[current].marked) continue` 丢弃重复项。每个对象都扫描全部引用，复杂度是 O(N·E)，不是 O(N+E)。紧缩按对象数组顺序移动存活对象，引用保存的是对象下标，所以移动 `start` 后打印地址由对象新位置派生，不需要重写引用数组。

## 9. 未修改的实现风险登记

按要求，以下问题只登记、不修复；它们不影响本批注释完成状态，建议交给独立安全整改批次逐项补测试。

| 路径 | 触发条件 | 影响 | 建议测试 |
| --- | --- | --- | --- |
| `sources/prim/prim.c:76` | 图中存在真实零权边 | 矩阵把 0 当作“无边”，`GRAPH[best][next] != 0` 会拒绝这条边，生成树可能错误 | 3 顶点含 0 权边的图，断言 MST 包含该边且总权值正确；或改用 `INT_MAX` 哨兵/邻接表 |
| `sources/prim/prim.cpp:70`、`sources/prim/prim.py:65` | 生成树包含真实零权边 | 总权值仍包含 0，但零权边不会出现在打印的边列表，教学输出不完整 | 零权边图断言打印边数与总权值一致 |
| `sources/kruskal/kruskal.cpp:121`、`sources/kruskal/kruskal.py:82` | 顶点数不是 5 | `used == 4` 对 6 顶点图会提前停止，得到少于 V−1 条边 | 6 顶点、5 条可接受边的图，断言选满 5 条；用 `vertex_count - 1` |
| `sources/topological/topological_sort.py:54` | 任意非 6 顶点的 DAG | `len(order) != 6` 会把合法的 4 顶点拓扑序误报为环 | 4 顶点 DAG 断言正常输出；改为与 `len(graph)` 比较 |
| `sources/critical-path/critical_path.c:44` | `ACTIVITIES` 未按拓扑序排列 | 正推会读到尚未完成的前驱，最早时间偏小；逆推也不是逆拓扑序 | 打乱活动数组后比较结果；或先显式拓扑排序再正/逆推 |
| `sources/dijkstra/dijkstra.cpp:108` | 目标不可达 | `path_to` 只返回目标名，看起来像一条合法路径 | 孤立目标断言返回明确的“不可达”标记 |
| `sources/dijkstra/dijkstra.py:57` | 边指向未登记顶点 | `distance[v]` 触发 `KeyError`，而不是受控诊断 | 邻接表含未知顶点，断言明确错误或自动登记 |
| `sources/buddy-system/buddy_system.c:40` | `init_memory` 收到非 2 的幂容量 | 初始化不报错，后续 `allocate_block` 才返回失败；`max_level` 已按取整值建立 | 非 2 的幂容量断言初始化失败或显式诊断 |
| `sources/buddy-system/buddy_system.c:118`、`:127` | 重复标签或长度超过 3 的 ID | `MAX_LABEL=4` 会截断；重复标签让 `release_block` 只能释放第一个匹配块 | 两个同标签块分别释放的测试；长 ID 断言拒绝或使用更大缓冲区 |
| `sources/garbage-collection/garbage_collection.c:71-100` | 根对象扇出很宽，多个父对象在首次弹出前重复压入同一对象 | 栈容量固定为 `MAX_OBJECTS`，`top` 可能超过对象数，存在越界写风险 | 构造超过 `MAX_OBJECTS` 次重复压栈的引用集，用 sanitizer 断言无越界 |
| `sources/garbage-collection/garbage_collection.c:74` | 根不是对象表第 0 项 | 固定 `root = 0` 会把真正的根漏掉，把无关对象标成存活 | 重排对象表或提供显式根集合，断言只有根可达对象被标记 |

## 10. 测试结果

| 项目 | 结果 |
| --- | --- |
| 源码注释一致性 | 新增 211 行、替换 6 行；`git diff --unified=0` 审计中非注释变更 **0** |
| 本批 C/C++ 编译与 Python 语法 | 33/33 通过；`gcc -std=c11 -Wall -Wextra -Wpedantic -Werror -fsyntax-only`、`g++ -std=c++17` 同警告集、Python 内存 `compile()` |
| 全量参考源码复核 | 211 份通过（C 63、C++ 74、Python 74，0 失败） |
| BATCH-04 专项 + 事实 + 本地化 + 查看器 | 4 files / **79 tests** 通过 |
| 全量 Vitest | **155 files / 1470 tests** 通过；仅出现既有 `ThemeProvider` 的 React `act(...)` stderr 警告，不是失败 |
| `npm run typecheck` | 退出 0 |
| `npm run build` | 退出 0，Vite 构建 28.60s；仅有 `zod` 内部注释位置警告，不影响产物 |
| 代表性 Playwright | `e2e/code-doc-04-batch-04.spec.ts` 1/1 通过（4.4s），4 个算法真实查看器与剪贴板验证 |
| 全量 60 算法 Pyodide 矩阵 | 按任务要求未重复运行 |

## 11. 提交与推送

| 组 | 范围 | 提交哈希 | 推送结果 |
| --- | --- | --- | --- |
| 1 | `components`、`scc` 三语言注释 | `33291ba` | `55233ca..33291ba main -> main` |
| 2 | `prim`、`kruskal` 三语言注释 | `19790ff` | `33291ba..19790ff main -> main` |
| 3 | `topological`、`critical-path` 三语言注释 | `2100b4d` | `19790ff..2100b4d main -> main` |
| 4 | `dijkstra`、`floyd-warshall`、`bellman-ford` 三语言注释 | `8986b66` | `2100b4d..8986b66 main -> main` |
| 5 | `buddy-system`、`garbage-collection` 三语言注释 | `0d245c0` | `8986b66..0d245c0 main -> main` |
| 6 | 双语 annotation、专项测试、查看器与 Playwright | `efbcf07` | `0d245c0..efbcf07 main -> main` |

本报告与 `docs/CODE_DOC_04_PROGRESS.md` 的更新在随后的 docs 提交中交付。全程未创建分支或 worktree，未创建 Tag，未执行部署；受保护的未跟踪目录 `图论/` 未被修改、未被暂存、未被提交。

## 12. 停止状态

- 累计完成：**38 / 60**，剩余 22 个。
- 剩余算法：`linear`、`binary`、`bst`、`avl`、`btree`、`bplus-tree`、`key-tree`、`hash-chain`、`hash-probe`、`insertion`、`shell`、`bubble`、`quick`、`selection`、`tournament`、`heap`、`merge`、`multiway`、`optimal-merge`、`file-index`、`isam`、`inverted-index`。
- BATCH-05 未开始，本轮在 BATCH-04 完成后停止。
- 第 9 节风险仍需独立安全整改；本批未顺手修改有效代码。
