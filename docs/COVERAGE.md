# AlgoViz 算法与课程覆盖清单

快照：2026-11-18（G1 批次已合并 `main` @ `14cf331`）

## 1. 口径

- **算法入口**：`src/domain/algorithms/catalog.generated.ts` 的 17 个 id。
- **教学课程**：`src/domain/lessons/registry.ts` 注册的 11 门内置课程；17 个入口中 11 个有课程，6 个暂无内置课程。
- **真实 Python**：选中 Python 后由 Pyodide Worker 执行真实代码并记录结构化 Trace；Dijkstra、Floyd-Warshall、Bellman-Ford 的 JS 入口是提示桩，不伪造带权图动画。

## 2. G1 新增算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `floyd-warshall` | Floyd-Warshall 全源最短路 | ✅ 真实 Pyodide 执行 | ✅ 87 帧默认；`init/k/update/skip/negative-cycle/done` | ✅ 带权图 + 动态距离矩阵 + 当前 k/i/j + 旧值→新值 + 路径/负环 | ✅ `floyd-warshall-all-pairs`，6 步 | ✅ 单测 + 浏览器 E2E + 截图 |
| `bellman-ford` | Bellman-Ford 单源最短路 | ✅ 真实 Pyodide 执行 | ✅ 35 帧默认；`init/round/inspect/relax/skip/early-exit/negative-cycle/done` | ✅ 带权图 + 距离表 + 松弛轮次 + 当前边 + 提前结束/负环 + 路径 | ✅ `bellman-ford-single-source`，8 步 | ✅ 单测 + 浏览器 E2E + 截图 |

## 3. 全量矩阵

| 分组 | 算法 | 课程 |
| --- | --- | --- |
| 排序 | 冒泡、插入、选择、快速 | 冒泡 |
| 查找 | 二分、线性 | — |
| 线性结构 | 栈、队列、单链表 | 栈、队列、链表 |
| 图 | BFS、DFS、Dijkstra、Floyd-Warshall、Bellman-Ford | BFS、DFS、Dijkstra、Floyd、Bellman-Ford |
| 树 | 二叉树中序遍历 | 中序 |
| 递归 | 阶乘、斐波那契 | 阶乘 |

### 覆盖小结

- 17 个算法入口；12 个真实 Python 入口。
- 11 门双语课程；6 个暂无课程（插入、选择、快速、二分、线性、斐波那契）。
- 结构化可视化新增 `floyd-matrix` 与 `bellman-table`，不影响既有 `stack/queue/linked-list/graph/binary-tree/weighted-graph`。

## 4. 验证

本地复核环境：Windows + Microsoft Edge + 真实 Pyodide 0.27.7。

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 通过；Monaco chunk 约 4.12 MB |
| 全量单测 | ✅ 71 个文件、577 tests 全部通过 |
| G1 相关单测 | ✅ shortestPath / g1Lessons / registry / catalog / i18n 全部通过 |
| 全量 E2E | ✅ 78/78，4.4 分钟 |
| G1 功能 E2E | ✅ 3/3（默认矩阵与 k/i/j、负环、不可达、Bellman 松弛/提前结束/不可达负环） |
| G1 视觉 E2E | ✅ 1/1（Floyd 更新/完成、Bellman 松弛/完成，1440 与 390） |
| 回归 | ✅ Dijkstra、BFS/DFS、Stage 7B–7F、UI-01/02/03 全部通过 |
| 入口数量 | ✅ 15→17 的旧断言已修正并复跑通过 |

## 5. 已知边界

- Floyd 教学图限制 7 节点，避免 V³ 比较帧超过 500 帧上限；默认 87 帧。
- 负权边允许，自环与重复边拒绝；Floyd 仅跳过 `j == k`，保留 `i == j` 以检测负权环。
- Bellman-Ford 的 `done/negative-cycle` 使用实际完成轮次，不用 `maxRounds` 冒充。
- 390 px 下图与矩阵各自在容器内滚动，页面本身无横向溢出。
- 用户任意改代码后的完整自动可视化仍不在本批次范围。

## 6. 下一批次（不在本批次执行）

Prim / Kruskal、拓扑排序；继续复用带权图与既有播放/课程架构。
