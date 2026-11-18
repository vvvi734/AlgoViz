# AlgoViz 算法与课程覆盖清单

快照：2026-11-18（G1 已合并 `main`；G2 在 `feat/g2-mst` 完成，尚未合并）

## 1. 口径

- **算法入口**：`src/domain/algorithms/catalog.generated.ts` 的 19 个 id。
- **教学课程**：`src/domain/lessons/registry.ts` 注册的 13 门内置课程；19 个入口中 13 个有课程，6 个暂无内置课程。
- **真实 Python**：选中 Python 后由 Pyodide Worker 执行真实代码并记录结构化 Trace；Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal 的 JS 入口是提示桩，不伪造带权图动画。

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

两个算法共享带权图节点/边基础组件和唯一的播放/跳帧系统；Prim 面板突出“树向外扩张 + 堆候选”，Kruskal 面板突出“全局排序 + 并查集合并”。没有第二套播放器。

## 4. 全量矩阵

| 分组 | 算法 | 课程 |
| --- | --- | --- |
| 排序 | 冒泡、插入、选择、快速 | 冒泡 |
| 查找 | 二分、线性 | — |
| 线性结构 | 栈、队列、单链表 | 栈、队列、链表 |
| 图 | BFS、DFS、Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal | BFS、DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal |
| 树 | 二叉树中序遍历 | 中序 |
| 递归 | 阶乘、斐波那契 | 阶乘 |

### 覆盖小结

- 19 个算法入口；14 个真实 Python 入口。
- 13 门双语课程；6 个暂无课程（插入、选择、快速、二分、线性、斐波那契）。
- 结构化可视化新增 `prim-mst` 与 `kruskal-mst`，不影响既有 `stack/queue/linked-list/graph/binary-tree/weighted-graph/floyd-matrix/bellman-table`。
- G2 默认图刻意包含三条权重 2 的边，使 Prim 与 Kruskal 选出不同合法 MST，但总权重同为 6。

## 5. 验证

本地复核环境：Windows + Microsoft Edge（Playwright `channel=msedge`）+ 真实 Pyodide 0.27.7。

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 通过；Monaco chunk 约 4.12 MB，`index` 886.13 kB |
| 全量单测 | ✅ 73 个文件、592 tests 全部通过 |
| G2 相关单测 | ✅ `mst.test.ts` 6/6、`g2Lessons.test.ts` 5/5；schema / registry / catalog / App 入口断言同步通过 |
| 全量 E2E | ✅ 83/83，4.8 分钟 |
| G2 功能 E2E | ✅ 4/4（Prim 堆/树/跳过；Kruskal 排序/并查集/拒绝；两算法总权重一致但边集不同；负权、单点、非连通、有向图拒绝） |
| G2 视觉 E2E | ✅ 1/1（Prim 选中/跳过/完成、Kruskal 合并/拒绝/完成，1440 与 390） |
| 独立 Python 校验 | ✅ `scripts/verify_mst_python.py`：穷举生成树参考，默认图 total=6；负权 −3；单点 0；非连通森林 3；多解图 4；有向/重复/自环拒绝 |
| 回归 | ✅ Dijkstra、Floyd、Bellman-Ford、BFS/DFS、Stage 7B–7F、UI-01/02/03 在 83/83 全量 E2E 中通过 |
| 入口数量 | ✅ 17→19 的旧断言已修正并复跑通过 |

## 6. 已知边界

- Prim 教学图限制 10 节点，Kruskal 与共享 helper 限制 12 节点 / 30 条原始边 / 20 条唯一边；默认图 5 节点、6 边。
- 最小生成树允许负权边，不继承 Dijkstra 的非负权限制；自环、重复无向边、非有限权重、未知端点拒绝。
- 有向图不是本批次普通 MST 的支持范围，输入 helper 直接抛 `ValueError`。
- 不连通图不输出“一棵生成树”：Prim/Kruskal 结果条只在最终 `done` 帧显示“最小生成森林”警告；中间 union 帧不会误报。
- Prim 的 `component-start` 只在非连通图进入下一分量时产生；默认连通图没有该帧，但课程保留“断连边界”步骤，步骤列表显示 0 帧。
- 相同权重、多种合法 MST 只比较最小总权重，不固定要求某一条边集；默认示例正好覆盖“边集不同、总权重相同”。
- 390 px 下图与并查集表各自在容器内滚动，页面本身无横向溢出。
- 用户任意改代码后的完整自动可视化仍不在本批次范围。

## 7. 下一批次（不在本批次执行）

拓扑排序、关键路径等后续算法；继续复用带权图、真实 Python Trace、单一播放器与双语课程架构。
