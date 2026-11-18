# AlgoViz 算法与课程覆盖清单

快照：2026-11-18（G3 在 `feat/g3-topo-critical-path` 完成；G2 与 G3 均未合并 `main`）

## 1. 口径

- **算法入口**：`src/domain/algorithms/catalog.generated.ts` 的 21 个 id。
- **教学课程**：`src/domain/lessons/registry.ts` 注册的 15 门内置课程；21 个入口中 15 个有课程，6 个暂无内置课程。
- **真实 Python**：选中 Python 后由 Pyodide Worker 执行真实代码并记录结构化 Trace；Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径的 JS 入口是提示桩，不伪造图动画。

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

## 5. 全量矩阵

| 分组 | 算法 | 课程 |
| --- | --- | --- |
| 排序 | 冒泡、插入、选择、快速 | 冒泡 |
| 查找 | 二分、线性 | — |
| 线性结构 | 栈、队列、单链表 | 栈、队列、链表 |
| 图 | BFS、DFS、Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径 | BFS、DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径 |
| 树 | 二叉树中序遍历 | 中序 |
| 递归 | 阶乘、斐波那契 | 阶乘 |

### 覆盖小结

- 21 个算法入口；16 个真实 Python 入口。
- 15 门双语课程；6 个暂无课程（插入、选择、快速、二分、线性、斐波那契）。
- 结构化可视化新增 `topological-sort` 与 `critical-path`，不影响既有 `stack/queue/linked-list/graph/binary-tree/weighted-graph/floyd-matrix/bellman-table/prim-mst/kruskal-mst`。
- G3 默认拓扑图包含多个零入度源点、一个汇点分支和多种合法顺序；默认 AOE 图刻意包含两条同长关键路径与一条非关键活动 B–D。

## 6. 验证

本地复核环境：Windows + Microsoft Edge（Playwright `channel=msedge`）+ 真实 Pyodide 0.27.7。

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 通过 |
| 全量单测 | ✅ 76 个文件、622 tests 全部通过 |
| G3 相关单测 | ✅ `dag.test.ts` 11 项、`dagEdgeCases.test.ts` 10 项、`g3Lessons.test.ts` 6 项；Schema / registry / catalog / App 入口断言同步通过 |
| 全量 E2E | ✅ 88/88（83 条既有 + 4 条 G3 功能 + 1 条 G3 视觉） |
| G3 功能 E2E | ✅ 4/4（Kahn 入度/队列/减一/入队/完成；非连通/多合法顺序/环/单点；AOE ve/vl/余量/双关键路径；多源/多汇/负持续时间/无向图拒绝） |
| G3 视觉 E2E | ✅ 1/1（拓扑减一/完成、关键路径 ve/活动/完成，1440 与 390） |
| 独立 Python 校验 | ✅ `scripts/verify_dag_python.py`：默认拓扑 32 帧、非连通 14 帧、环 3 帧；默认 AOE 22 帧/工期 11/双关键路径、多源 14 帧/工期 4、多汇 11 帧/工期 5、单点 5 帧、空图；独立参考逐项核对 ve/vl/e/l/slack 与路径枚举 |
| 回归 | ✅ Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、BFS/DFS、Stage 7B–7F、UI-01/02/03 在 88/88 全量 E2E 中通过 |
| 入口数量 | ✅ 19→21 与课程 13→15 的旧断言已修正并复跑通过 |

## 7. 已知边界

- 拓扑排序输入限制 12 节点 / 30 条原始边 / 20 条唯一边；AOE 输入限制 12 节点 / 30 条原始边 / 20 项活动。两者都拒绝无向图、自环、重复同向边与未知端点。
- 拓扑排序只接受 DAG 语义；有向环不会被“强行排序”，最终帧明确 `hasCycle` 并保留未解析顶点。
- AOE 持续时间必须为有限非负数；负持续时间直接 `ValueError`。有向环明确拒绝，不伪造总工期。
- 多源事件全部 `ve=0`；多汇事件全部 `vl=项目总工期`。源事件的 `vl` 不一定为 0（例如多源图中较短分支的源可以有正余量），UI 与测试按真实 `vl` 显示。
- 关键路径枚举上限 12 条，超过时 Python 显式抛出 `ValueError`，不静默截断。
- 非连通 AOE 没有专门的“关键路径不存在”UI 文案；由源/汇语义与空路径状态处理。非连通 DAG 的拓扑排序仍合法，按分量分别排序。
- 用户任意改代码后的完整自动可视化仍不在本批次范围；G3 只保证官方 Python 示例与预设输入的真实 Trace。
- 390 px 下 DAG 画布与表格各自在容器内滚动，页面本身无横向溢出。

## 8. 下一批次（不在本批次执行）

G4、树算法与其他算法均未在 G3 中开发；后续继续复用有向图、真实 Python Trace、单一播放器与双语课程架构。
