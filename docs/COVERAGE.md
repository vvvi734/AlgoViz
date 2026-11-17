# AlgoViz 算法与课程覆盖清单

快照：2026-11-17（Stage 7F，分支 `stage7f-dijkstra`，基线 `6512118`）

## 1. 口径

- **算法入口**：`src/domain/algorithms/catalog.generated.ts` 中 `ALGORITHM_CATALOG` 的 15 个 id。
- **旧 JS 预设**：`legacy/algorithm-definitions.js` 经 `npm run sync:legacy` 同步到 typed catalog、i18n 与 `src/test/fixtures/legacy-frames.json` 的 15 个入口。
- **教学课程**：`src/domain/lessons/registry.ts` 实际注册的 9 门内置课程；`9 / 15 = 60%`。没有课程的算法显示“尚未提供教学课程”空态，可由知识包补充。
- **真实 Python**：选中 Python 后由 Pyodide Worker 执行真实代码与 Trace；Dijkstra 的 JS 入口是显式提示桩，不是带权图 JS 演示。

## 2. 算法矩阵

| # | id | 算法 | 分组 | 旧 JS 动画 | 真实 Python | 可视化结构 | 内置课程 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `bubble` | 冒泡排序 | 排序 | ✅ | ✅ | 数组 | ✅ 冒泡排序基础 |
| 2 | `insertion` | 插入排序 | 排序 | ✅ | — | 数组 | — |
| 3 | `selection` | 选择排序 | 排序 | ✅ | — | 数组 | — |
| 4 | `quick` | 快速排序 | 排序 | ✅ | — | 数组 | — |
| 5 | `binary` | 二分查找 | 查找 | ✅ | — | 数组 | — |
| 6 | `linear` | 线性查找 | 查找 | ✅ | — | 数组 | — |
| 7 | `stack` | 栈 | 线性结构 | ✅ | ✅ | `stack` | ✅ 栈 LIFO 基础 |
| 8 | `queue` | 队列 | 线性结构 | ✅ | ✅ | `queue` | ✅ 队列 FIFO 基础 |
| 9 | `linked` | 单链表 | 线性结构 | ✅ | ✅ | `linked-list` | ✅ 链表指针基础 |
| 10 | `bfs` | 广度优先搜索 | 图 | ✅ | ✅ | `graph` | ✅ BFS 队列基础 |
| 11 | `dfs` | 深度优先搜索 | 图 | ✅ | ✅ | `graph` | ✅ DFS 栈基础 |
| 12 | `inorder` | 二叉树中序遍历 | 树 | ✅ | ✅ | `binary-tree` | ✅ 二叉树遍历基础 |
| 13 | `factorial` | 阶乘 | 递归 | ✅ | ✅ | 调用栈 + 变量 | ✅ 阶乘递归基础 |
| 14 | `fib` | 斐波那契 | 递归 | ✅ | ✅ | 调用栈 + 变量 | — |
| 15 | `dijkstra` | Dijkstra 最短路径 | 图 / 最短路径 | 提示桩 | ✅ `heapq` | `weighted-graph` | ✅ Dijkstra 基础 |

### 覆盖小结

- **15 个算法入口**：12 个旧动画入口 + 阶乘 / 斐波那契 + Dijkstra。
- **真实 Python 入口**：10 个（bubble、stack、queue、linked、bfs、dfs、inorder、factorial、fib、dijkstra）。
- **结构化可视化**：`stack`、`queue`、`linked-list`、`graph`（BFS/DFS）、`binary-tree`（中序）、`weighted-graph`（Dijkstra）；排序、查找与递归仍复用数组 / 调用栈 / 变量视图。
- **9 门双语课程**：bubble、factorial、stack、queue、linked、inorder、bfs、dfs、dijkstra。
- **尚无课程（6）**：insertion、selection、quick、binary、linear、fib。

## 3. Dijkstra 课程映射

`lessonId = dijkstra-weighted-shortest-path`，`algorithmId = dijkstra`，`contentVersion = 1.0.0`。9 个 stepId 与真实 Python `lesson_step=` 一一对应：

| stepId | 教学主题 | 真实 Trace 对应 |
| --- | --- | --- |
| `init` | 最短路径定义、距离表初始为 ∞ | 第 0 帧，所有距离 `null` |
| `start` | 起点距离 0、进入优先队列 | 第 1 帧，push `(0,A)` |
| `pop` | 为什么选当前距离最小的候选 | 第 2 帧，pop `(0,A)` |
| `stale` | 重复候选与过期堆条目 | 第 40 帧，移除旧 `(6,F)` |
| `settle` | 距离一旦弹出即确定 | 第 3/17/…帧，settled 顺序 |
| `inspect` | 检查一条真实边与边权 | 松弛前的边检查帧 |
| `relax` | 松弛到底改变了什么 | 7 次严格降低，含 F `6→4` |
| `skip` | 不改进时为什么跳过 | `current + weight >= distance` |
| `done` | previous 恢复路径、总权重、复杂度与边界 | 第 45 帧，A→B→E→F→G = 7 |

课程同时覆盖：负权为何使“弹出即确定”失效、优先队列作用、时间/空间复杂度、常见错误（把 settled 当作可再次松弛、把堆中旧距离当当前距离、忽略不可达）。

## 4. 验证矩阵

| 层次 | 结果 |
| --- | --- |
| 全量单测 | 542 / 542，65 个文件；其中 MCP 20、AI Gateway 16 |
| Schema（Stage 7F） | 16 / 16：空图、单节点、不可达、有向、零权、相同距离、重复堆项、负权/NaN/Infinity/自环/重复边、非法 relax/skip/previous/path |
| 纯模型（Stage 7F） | 7 / 7：距离表、previous、target/settled/onPath、PQ 排序副本、relax 条带、空态 |
| 课程（Stage 7F） | 5 / 5：9 stepId 与真实 fixture 全覆盖、中英等长、概念与真实结果 |
| 课程注册表 | 8 / 8：9 课程 / 15 算法 / 6 未覆盖 |
| 真实 Python 参考 | `scripts/verify_dijkstra_python.py` 通过；独立 Bellman-Ford 逐节点比对最终距离与路径成本 |
| 真实浏览器 E2E（Stage 7F） | 3 / 3 功能测试：默认 46 帧、回退/重跑、非连通/相同距离/单节点/负权 |
| 视觉 E2E（Stage 7F） | 1 / 1：8 个中文状态 × 3 视口 × 2 主题 + 回退 6 + 英文 6 + 390 右滚 2 = 62 张 |
| 全量 E2E | 50 / 50 通过（3.4m，含 7E 回归） |
| 构建 | `tsc -b && vite build` 通过；Monaco chunk 约 4.12 MB |

## 5. 已知边界

- Dijkstra 的 legacy JS 是提示桩，避免旧无权重 `Graph` 渲染器伪造带权结构；切换语言时真实带权演示只走 Python。
- Dijkstra 的 Python `message` 仍是中英双语/中文原文，English UI 中“当前步骤”说明与课程已英文，但 Python 诊断行未做完整本地化。
- 有向图的反向平行边会落在同一对坐标上并重叠，当前未做边偏移。
- `MAX_PRIORITY_QUEUE = 64` 已有 Schema 限额，但未在 20 节点 / 40 边极端图上做堆条目压测。
- 390px 下图画布保持可读最小宽度并在画布内横向滚动，不是整图压缩适配；页面本身无横向溢出。
- 全量 Playwright 与 7E 回归需在 CSS 修复后重新执行；`docs/stage7e/after` 旧截图不能冒充 7F 证据。

## 6. 下一阶段建议

按“先补齐大学数据结构主要经典算法与可视化”的优先级，下一步应复用本阶段带权图基础开发：

1. Floyd-Warshall（全源最短路，距离矩阵）。
2. Prim / Kruskal（最小生成树，带权图 + 并查集）。
3. 拓扑排序（有向无环图 + 入度表）。
4. 补齐 6 门缺失课程的优先级应低于上述算法入口，但需在算法数量增长时同步更新本清单。
