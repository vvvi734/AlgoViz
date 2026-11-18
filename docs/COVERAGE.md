# AlgoViz 算法与课程覆盖清单

快照：2026-11-18（G4 在 `feat/g4-components-scc` 完成；G2、G3 与 G4 均未合并 `main`）

## 1. 口径

- **算法入口**：`src/domain/algorithms/catalog.generated.ts` 的 23 个 id。
- **教学课程**：`src/domain/lessons/registry.ts` 注册的 17 门内置课程；23 个入口中 17 个有课程，6 个暂无内置课程。
- **真实 Python**：选中 Python 后由 Pyodide Worker 执行真实代码并记录结构化 Trace；Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量的 JS 入口是提示桩，不伪造图动画。

## 2. G1 新增算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `floyd-warshall` | Floyd-Warshall 全源最短路 | ✅ 真实 Pyodide 执行 | ✅ 87 帧默认；`init/k/update/skip/negative-cycle/done` | ✅ 带权图 + 动态距离矩阵 + 当前 k/i/j + 旧值→新值 + 路径/负环 | ✅ `floyd-warshall-all-pairs`，6 步 | ✅ 单测 + 浏览器 E2E + 截图 |
| `bellman-ford` | Bellman-Ford 单源最短路 | ✅ 真实 Pyodide 执行 | ✅ 35 帧默认；`init/round/inspect/relax/skip/early-exit/negative-cycle/done` | ✅ 带权图 + 距离表 + 松弛轮次 + 当前边 + 提前结束/负环 + 路径 | ✅ `bellman-ford-single-source`，8 步 | ✅ 单测 + 浏览器 E2E + 截图 |

## 3. G2 新增算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `prim` | Prim 最小生成树 | ✅ 真实 `heapq`，Pyodide 执行 | ✅ 21 帧默认；`init/start/push/pop/select-edge/skip/component-start/done` | ✅ 带权图 + 生成树扩张 + 当前候选边 + heapq 优先队列 + 已选/跳过边 + 总权重 | ✅ `prim-minimum-spanning-tree`，8 步 | ✅ 单测 + 浏览器 E2E + 截图 |
| `kruskal` | Kruskal 最小生成树 | ✅ 真实并查集（路径压缩 + 按秩合并），Pyodide 执行 | ✅ 15 帧默认；`init/sort/inspect-edge/reject-edge/union/done` | ✅ 带权图 + 按权排序表 + 当前边 + 两端根 + 环检测 + parent/rank/find 根表 + union 详情 + 总权重 | ✅ `kruskal-minimum-spanning-tree`，6 步 | ✅ 单测 + 浏览器 E2E + 截图 |

## 4. G3 新增算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `topological` | 拓扑排序（Kahn 入度法） | ✅ 真实 `collections.deque` + 入度表，Pyodide 执行 | ✅ 32 帧默认；`init/enqueue/dequeue/inspect-edge/decrement/enqueue-node/cycle/done` | ✅ 有向图 + 入度徽标 + 入度表 + FIFO 候选队列 + 当前拓扑序列 + 当前边/移除边 + 环检测 | ✅ `topological-sort-kahn`，8 步 | ✅ 单测 + 真实 Pyodide E2E + 截图 |
| `critical-path` | AOE 关键路径 | ✅ 真实拓扑序 + ve/vl + 活动余量，Pyodide 执行 | ✅ 22 帧默认；`init/topo-order/ve/vl/activity/cycle/done` | ✅ AOE 有向图 + 活动持续时间 + 计算阶段 + 事件 ve/vl 表 + 活动 e/l/余量表 + 全部关键路径 + 总工期 | ✅ `aoe-critical-path`，7 步 | ✅ 单测 + 真实 Pyodide E2E + 截图 |

两个算法共享有向图节点/边基础组件、确定性 DAG 分层布局、唯一的播放/跳帧系统与课程面板；拓扑排序面板突出“入度表 + FIFO 队列 + 当前序列”，关键路径面板突出“阶段轨道 + ve/vl 时间表 + 活动余量 + 多条关键路径”。没有第二套播放器。

G3 默认结果：

- 拓扑图 7 节点 A–G、8 条依赖边；Kahn FIFO 得到 `A, B, D, C, E, F, G`，但同一 DAG 存在多种合法顺序，测试逐边验证 `from` 先于 `to`，不固定唯一序列。
- AOE 图 6 事件 A–F、7 项活动；`ve=vl={A:0,B:3,C:2,D:6,E:9,F:11}`，总工期 11，关键活动 e1/e2/e4/e5/e6/e7，两条关键路径 `A→B→E→F` 与 `A→C→D→E→F`；B→D 余量为 1。

## 5. G4 新增算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `components` | 无向图连通分量 | ✅ 真实迭代 DFS，Pyodide 执行 | ✅ 50 帧默认；`init/start-component/pop/visit/inspect-edge/discover/push/skip/complete-component/done` | ✅ 无向图 + 当前节点/检查边 + 显式 DFS 栈 + 已发现/已访问 + 当前分量 + C 编号分量结果表 | ✅ `connected-components-dfs`，10 步 | ✅ 单测 + 真实 Pyodide E2E + 截图 |
| `scc` | 有向图 Kosaraju 强连通分量 | ✅ 真实双遍 DFS + 边反转，Pyodide 执行 | ✅ 60 帧默认；`init/start-first/inspect-edge/skip/push/finish/reverse/start-second/assign/complete-component/done` | ✅ 有向图 + 第一遍 DFS + 完成顺序 + 反向图 + 第二遍 DFS + 当前 DFS 栈 + C 编号 SCC 结果表 | ✅ `strongly-connected-components-kosaraju`，11 步 | ✅ 单测 + 真实 Pyodide E2E + 截图 |

G4 设计要点：

- **连通分量不是“按边分堆”**：真实迭代 DFS 从节点输入顺序选择未发现根，按输入边顺序建邻接表；`start-component` 同时发现根并入栈，`pop/visit/inspect-edge/discover/push/skip` 分开成帧；一个分量完成后才选择下一个未发现节点。默认图 8 节点、5 条无向边（A–B、A–C、B–C、D–E、F–G，H 孤立），50 帧，最终 `C1={A,B,C}`、`C2={D,E}`、`C3={F,G}`、`C4={H}`。
- **SCC 不能靠忽略方向分组**：真实 Kosaraju 第一遍在原图记录完成顺序；`reverse` 帧反转全部边并清空第二遍 discovered/visited/栈/分量，但保留完成顺序；第二遍严格按完成顺序的逆序扫描反向图，逐个分配 SCC。默认图 8 节点、7 条有向边（A→B、B→C、C→A、C→D、D→E、E→D、F→G），60 帧；第一遍完成顺序 `E,D,C,B,A,G,F,H`，第二遍顺序 `H,F,G,A,B,C,D,E`，最终 5 个 SCC：`{H}`、`{F}`、`{G}`、`{A,C,B}`、`{D,E}`。
- **视觉复用**：两个算法复用既有 `mst-stage / mst-layout / mst-panel / mst-node / mst-edge` 图布局与单一播放器；G4 组件只从 `currentEvent.structure` 构建模型。节点、分量行、状态表同时显示 `C1/C2/...` 编号与颜色，颜色不是唯一语义；SCC 额外显示第一遍完成顺序、第二遍处理顺序、阶段轨道和反向图徽标。
- **边界**：连通分量覆盖单点、孤立节点、空图、完全连通图、多个分量；SCC 覆盖单向链、有向环、桥接图、单点、空图。空图显示明确空态；不把单向链错误合并成一个 SCC。
- **课程**：`connected-components-dfs` 10 步，`strongly-connected-components-kosaraju` 11 步，均为中英双语；覆盖普通连通 vs 强连通、方向的重要性、为什么需要两遍 DFS、为什么按完成时间逆序、复杂度、常见错误与记忆重点。
- **范围**：只保证官方示例与预设输入的真实 Trace；不扩展任意用户代码的通用追踪，也不改造页面主布局。

## 6. 全量矩阵

| 分组 | 算法 | 课程 |
| --- | --- | --- |
| 排序 | 冒泡、插入、选择、快速 | 冒泡 |
| 查找 | 二分、线性 | — |
| 线性结构 | 栈、队列、单链表 | 栈、队列、链表 |
| 图 | BFS、DFS、Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量 | BFS、DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量 |
| 树 | 二叉树中序遍历 | 中序 |
| 递归 | 阶乘、斐波那契 | 阶乘 |

### 覆盖小结

- 23 个算法入口；18 个真实 Python 入口。
- 17 门双语课程；6 个暂无课程（插入、选择、快速、二分、线性、斐波那契）。
- 结构化可视化新增 `connected-components` 与 `kosaraju`，不影响既有 `stack/queue/linked-list/graph/binary-tree/weighted-graph/floyd-matrix/bellman-table/prim-mst/kruskal-mst/topological-sort/critical-path`。
- G4 默认连通分量图刻意包含 4 个分量和 1 个孤立点；默认 SCC 图同时包含 3 节点有向环、2 节点有向环、单向边 F→G 和孤立点 H，专门用于区分 SCC 与普通连通分量。

## 7. 验证

本地复核环境：Windows + Microsoft Edge（Playwright `channel=msedge`）+ 真实 Pyodide 0.27.7。

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 通过；1414 modules；`index-Cf7Q5QtD.js` 1078.42 kB / gzip 310.49 kB；`index-D4fiU_S7.css` 110.71 kB / gzip 19.57 kB |
| 全量单测 | ✅ 78 个文件、644 tests 全部通过 |
| G4 相关单测 | ✅ `components.test.ts` 12 项 + `g4Lessons.test.ts` 6 项，合计 18 项通过；覆盖 Schema、默认分组、栈/发现同步、边界图、SCC 双向可达性、单向链/有向环、转置帧、回退跳帧与 C 编号显示 |
| 全量 E2E | ✅ 93/93（88 条既有 + 4 条 G4 功能 + 1 条 G4 视觉） |
| G4 功能 E2E | ✅ 4/4（连通分量发现/栈/C 编号/4 分量；Kosaraju 第一遍/转置/第二遍/5 SCC；空图；单向链 vs 有向环） |
| G4 视觉 E2E | ✅ 1/1（连通分量栈与完成、Kosaraju 转置与第二遍、1440 与 390） |
| 独立 Python 校验 | ✅ `scripts/verify_components_python.py`：默认连通 50 帧/4 分量、SCC 60 帧/5 SCC；边界 disconnected 28 帧/3、single 6 帧/1、empty 2 帧/0、complete 39 帧/1、chain 24 帧/3、cycle 24 帧/1、bridge 36 帧/2、single 8 帧/1、empty 2 帧/0；逐组核对 SCC 内双向可达与跨 SCC 不合并 |
| 回归 | ✅ Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、BFS/DFS、拓扑排序、关键路径、Stage 7B–7F、UI-01/02/03 在 93/93 全量 E2E 中通过 |
| 入口数量 | ✅ 21→23、课程 15→17 的旧断言已修正并复跑通过 |

## 8. 已知边界

- 连通分量与 SCC 输入上限一致：12 节点 / 30 条原始边 / 20 条唯一边；拒绝未知端点、自环、重复边（连通分量按无向边去重，SCC 按同向边去重）与节点 id 重复。连通分量要求无向图，SCC 要求有向图。
- 连通分量使用迭代 DFS，不递归；邻接表按输入边顺序构建，因此同一输入每次播放顺序一致，换输入顺序会改变分量内部节点顺序。
- SCC 的 `C1/C2/...` 编号按第二遍真实发现顺序分配，不是节点字典序；测试比较分组集合，不依赖固定编号。
- SCC 第一遍完成顺序与第二遍顺序来自真实 Python Trace；`reverse` 帧只反转边，不重排节点。
- 空图 SCC 的 `done` 帧 `reversed=false`（没有边可反转）；这是当前语义，不表示算法漏做转置。
- 用户任意改代码后的完整自动可视化仍不在本批次范围；G4 只保证官方 Python 示例与预设输入的真实 Trace。
- 390 px 下图画布与结果表在各自容器内滚动，页面本身无横向溢出；没有为了 G4 调整页面主布局。
- G2、G3、G4 均尚未合并 `main`；G4 从 G3 的 `787d0df` 创建，不从缺少 G2/G3 的旧 `main` 开发。

## 9. 下一批次（不在本批次执行）

树算法、页面主布局改造与其他算法均未在 G4 中开发；后续继续复用现有图布局、Trace 快照、单一播放器与双语课程架构。
