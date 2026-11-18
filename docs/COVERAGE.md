# AlgoViz 算法与课程覆盖清单

快照：2026-11-18（T1 在 `feat/t1-bst` 完成；G2、G3、G4 与 T1 均未合并 `main`）

## 1. 口径

- **算法入口**：`src/domain/algorithms/catalog.generated.ts` 的 24 个 id。
- **教学课程**：`src/domain/lessons/registry.ts` 注册的 18 门内置课程；24 个入口中 18 个有课程，6 个暂无内置课程。
- **真实 Python**：选中 Python 后由 Pyodide Worker 执行真实代码并记录结构化 Trace；Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量、BST 的 JS 入口是提示桩，不伪造结构动画。

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

## 6. T1 新增算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `bst` | 二叉搜索树 · 查找 / 插入 / 删除 | ✅ 真实 `TreeNode` 与真实 `left/right` 引用，Pyodide 执行 | ✅ 6 个官方预设 53 帧 + 8 个边界场景 44 帧；16 种操作帧 | ✅ 复用二叉树布局：稳定节点 ID、目标键、比较路径、已比较链、中序序列、当前/目标/后继/新节点标记、删除三案例、摘除对象、父/根指针变化、结果面板 | ✅ `binary-search-tree-search-insert-delete`，14 步 | ✅ 独立 CPython 校验 + 17 项单测 + 真实 Pyodide E2E + 8 张截图 |

T1 设计要点：

- **稳定身份**：节点是真实 Python `TreeNode` 对象，创建时分配 `b1…b8` 教学 ID；删除、移植、回退和跳帧都不会重命名幸存节点。父/子关系只读快照的 `leftId/rightId`，不从画布坐标推断。
- **查找**：每帧只比较一个真实节点；`go-left/go-right` 的 `nextNodeId` 必须是当前节点的真实孩子；成功帧记录 `targetNodeId`，失败帧可带最后比较节点，空树时 current/path 为空。
- **插入**：先走真实查找，找到空位后创建新节点并修改父节点 `left/right`；官方预设使用唯一键，重复插入明确拒绝且树不变。默认 `insert` 把 35 挂到 40 的左侧，新节点为 `b8`。
- **删除三案例**：叶子把父指针置空并记录 `removedNode`；单孩子让孩子接替目标位置（默认删除 60，65 接回 70 左侧）；双孩子使用中序后继（默认删除根 50，后继 `b6=60` 保留自己的 ID 移植为根，`b1=50` 真正摘除，65 接回 70 左侧）。删除帧记录父节点、side、replacement、`oldRootId`，不是只让节点从屏幕消失。
- **视觉复用**：复用 `layoutBinaryTree`、`tree-*` 几何/样式与唯一播放器；`BstVisual` 只增加 BST 专属面板，没有第二套 Timeline 或播放器。
- **边界**：单点、空树、查找成功/失败、重复插入、删除叶子/单孩子/双孩子、删除根、删除不存在键均纳入夹具；空树显示明确空态。
- **课程**：14 步分别覆盖查找（比较、方向、成功、失败）、插入（重复拒绝、挂接）、删除（定位、叶子、单孩子、后继查找、后继摘除、移植）与最终复杂度/常见错误；明确“双孩子不是复制值时删除后继”，而是物理移植后继对象。
- **范围**：只保证官方示例与预设输入的真实 Trace；不扩展任意用户代码的通用追踪，也不改造页面主布局。

T1 代表性截图：`docs/t1/bst-find-found-1440-light.png`、`bst-insert-attach-1440-light.png`、`bst-delete-leaf-1440-light.png`、`bst-delete-one-1440-light.png`、`bst-delete-two-successor-1440-light.png`、`bst-delete-two-detach-1440-light.png`、`bst-delete-two-transplant-1440-light.png`、`bst-delete-two-done-390-light.png`。

## 7. 全量矩阵

| 分组 | 算法 | 课程 |
| --- | --- | --- |
| 排序 | 冒泡、插入、选择、快速 | 冒泡 |
| 查找 | 二分、线性 | — |
| 线性结构 | 栈、队列、单链表 | 栈、队列、链表 |
| 图 | BFS、DFS、Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量 | BFS、DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量 |
| 树 | 二叉树中序遍历、二叉搜索树查找/插入/删除 | 中序、BST |
| 递归 | 阶乘、斐波那契 | 阶乘 |

### 覆盖小结

- 24 个算法入口；19 个真实 Python 入口。
- 18 门双语课程；6 个暂无课程（插入、选择、快速、二分、线性、斐波那契）。
- 结构化可视化新增 `bst`，不影响既有 `stack/queue/linked-list/graph/binary-tree/weighted-graph/floyd-matrix/bellman-table/prim-mst/kruskal-mst/topological-sort/critical-path/connected-components/kosaraju`。
- T1 默认 BST 刻意覆盖查找成功/失败、插入、三种删除与根变化；双孩子样例删除根 50，便于在同一官方示例中看到“目标摘除 + 后继移植 + 根指针变化”。

## 8. 验证

本地复核环境：Windows + Microsoft Edge（Playwright `channel=msedge`）+ 真实 Pyodide 0.27.7。

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 通过；1420 modules；`index-DTQmGoK0.js` 1,147.83 kB / gzip 328.65 kB；`index-D5VyLHfv.css` 116.40 kB / gzip 20.40 kB |
| 全量单测 | ✅ 80 个文件、663 tests 全部通过 |
| T1 相关单测 | ✅ `bst.test.ts` 14 项 + `bstLesson.test.ts` 3 项，合计 17 项通过；覆盖 97 帧 Schema、稳定 ID、查找/插入/删除三案例、根变化、空树/单点、跳帧视觉同步、非法快照拒绝与课程帧映射 |
| 全量 E2E | ✅ 94/94（93 条既有 + 1 条 T1 功能/视觉） |
| T1 E2E | ✅ 1/1：真实 Pyodide 依次运行查找、插入、叶子/单孩子/双孩子删除；验证根 b1→b6、后继 b6 保留 ID、65 重连、前进/回退/跳帧同步、390 无页面横向溢出 |
| 独立 Python 校验 | ✅ `scripts/verify_bst_python.py`：6 个官方预设 + 8 个边界场景；逐帧前序/中序/父子引用、无重复 ID、无悬空引用、稳定 ID；删除终态与独立 `RefBST` 比较一致 |
| 回归 | ✅ BFS/DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量/SCC、二叉树遍历、栈/队列/链表在 94/94 全量 E2E 中通过 |
| 入口数量 | ✅ 23→24、课程 17→18 的旧断言已修正并复跑通过 |

## 9. 已知边界

- T1 只保证官方 Python 示例与预设输入的真实 Trace；任意用户改写代码后的完整自动可视化仍不在本批次范围。
- 双孩子删除采用“物理移植中序后继”策略，不采用“复制后继值再删除后继”的显示方式；因此同一节点 ID 会换位置，教学时不要把位置变化误读为新节点。
- 删除帧的 `current` 常为空（目标已摘除），路径/目标高亮因此清空；最终结果、摘除对象、指针与根变化仍由 `removedNode`、`oldRootId/rootId` 明确记录。
- 390 px 下 BST 树画布在容器内横向滚动，页面本身无横向溢出；没有为了 T1 调整页面主布局。
- G2、G3、G4 与 T1 均尚未合并 `main`；T1 从包含 G1～G4 的 `94e34fa` 创建独立分支。
- `BST_PYTHON` 的 `line=` 是教学用近似源码行号，Monaco 实际行号以编辑器为准。

## 10. 下一批次（不在本批次执行）

AVL、堆、哈夫曼树、页面主布局改造与其他算法均未在 T1 中开发；后续继续复用现有树布局、Trace 快照、单一播放器与双语课程架构。
