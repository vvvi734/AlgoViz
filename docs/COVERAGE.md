# AlgoViz 算法与课程覆盖清单

快照：2026-11-18（UX-01B 基于 UX-01 的 `715acc3` 在 `feat/ux01b-guide-hierarchy` 完成；G2、G3、G4、T1、T2、UX-01 与 UX-01B 均未合并 `main`）

## 1. 口径

- **算法入口**：`src/domain/algorithms/catalog.generated.ts` 的 25 个 id。
- **教学课程**：`src/domain/lessons/registry.ts` 注册的 19 门内置课程；25 个入口中 19 个有课程，6 个暂无内置课程。
- **真实 Python**：选中 Python 后由 Pyodide Worker 执行真实代码并记录结构化 Trace；Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量、BST、AVL 的 JS 入口是提示桩，不伪造结构动画。

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

## 7. T2 新增算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `avl` | AVL 平衡二叉搜索树 · 插入 / 删除 / 四种旋转 | ✅ 真实 `AvlNode`（`node_id/value/left/right/parent/height`）与真实 `left/right` 指针变化，Pyodide 执行 | ✅ 10 个官方预设 142 帧 + 8 个边界场景 34 帧；15 种操作帧；LL/RR/LR/RL 与双旋两阶段 | ✅ 复用二叉树布局：稳定 `a1…` ID、节点高度 + 平衡因子徽标、当前/失衡/轴/上升节点、旋转 chip 与 before/after、插入/删除目标、指针/根变化、摘除对象、结果面板 | ✅ `avl-balanced-binary-search-tree`，17 步 | ✅ 独立 CPython 校验 + 12 项单测 + 真实 Pyodide E2E + 6 张截图 |

T2 设计要点：

- **稳定身份与真实指针**：节点是真实 Python `AvlNode` 对象，创建时分配 `a1…` 教学 ID；`rotate_left/rotate_right` 先真实修改 `parent/left/right`，再发出 before/after 两帧；视觉层只读结构快照，不先移动 SVG。回退、跳帧和重跑都恢复节点 ID、父子关系与高度。
- **高度与平衡因子**：`refresh_heights` 在后序位置按真实子树重算 `height`；`balance_factor = height(left) − height(right)`。每帧记录节点高度与平衡因子，`imbalance` 帧允许暂时 `|BF|>1`，`init/done` 必须满足 AVL 条件。
- **插入**：先按 BST 规则比较并寻找空位，创建新节点后真实挂接；向上刷新高度，遇到第一个 `|BF|>1` 记录失衡类型。官方覆盖 LL 右旋、RR 左旋、LR 左旋后右旋、RL 右旋后左旋，双旋是两个真实连续操作、各自有 before/after 帧，不是只展示最终树。
- **删除**：支持叶子、单孩子、双孩子、根节点与不存在键。双孩子物理移植中序后继，后继保留自己的 ID，目标对象真正摘除（默认 `delete-two` 删除根 50，后继 `a6=60` 成为新根，`a1=50` 从树中消失）；删除后从受影响位置向上刷新高度，必要时连续调整多个祖先。`delete-cascade` 是叶子删除，但连续触发两个不同祖先的 LR 双旋，说明“删除分类”和“重平衡次数”不是同一件事。
- **视觉复用**：复用 `layoutBinaryTree`、`tree-*` 几何/样式、唯一播放器与既有课程面板；`AvlVisual` 仅增加 AVL 专属指标/旋转面板，没有第二套 Timeline。390 px 下树画布在容器内横向滚动并自动把根居中，页面本身无横向溢出。
- **课程**：17 步覆盖 AVL 与普通 BST 的区别、普通 BST 退化、高度与平衡因子、AVL 条件、四种失衡与旋转、单旋/双旋、插入/删除后的再平衡、O(log n)、常见错误与记忆法。第 ⑦/⑧ 步明确说明一次右旋/左旋同时是某种双旋的某一步。
- **范围**：只保证官方示例与预设输入的真实 Trace；不扩展任意用户代码的通用追踪，也不改造页面主布局。

T2 代表性截图：`docs/t2/avl-insert-ll-1440-light.png`、`avl-insert-rr-1440-light.png`、`avl-insert-lr-1440-light.png`、`avl-insert-rl-1440-light.png`、`avl-delete-cascade-rebalance-1440-light.png`、`avl-delete-cascade-390-light.png`。

## 8. UX-01 / UX-01B 顶部算法导学（不新增算法）

UX-01 首次加入顶部可折叠导学；UX-01B 在同一数据模型上重排阅读层级与高度。两批都没有新增算法入口，也没有修改 Python/Trace 语义；25 个算法入口与 19 门课程不变。

| 导学来源 | 覆盖 | 内容 |
| --- | --- | --- |
| 原创精选 | Dijkstra、拓扑排序（Kahn）、强连通分量（Kosaraju），共 3 个 | 问题、核心思想与静态示意图、7～8 个真实执行步骤、必要前置、显式适用条件与关键限制、复杂度、常见错误、记忆重点；中英双语 |
| 课程派生 | 其余 16 门有课程的算法 | 复用 Lesson 的 `oneLiner / intuition / steps / prerequisites / complexity / commonMistakes`；步骤标题去掉课程自带序号，末步 `tip` 作为记忆重点；不另写算法事实 |
| 目录安全回退 | 插入、选择、快速、二分、线性、斐波那契，共 6 个 | 只显示 `catalog.generated.ts` 已确认的简介、时间/空间复杂度与“步骤待补充”说明；不显示虚构步骤、前置或记忆口诀 |

UX-01 设计要点：

- **位置与折叠**：导学位于顶部算法标题栏与 `lab-primary` 之间；展开时页面自然向下滚动，收起后只保留原 `lab-head` 标题栏与“展开算法导学”按钮。折叠偏好以算法 id 数组存入 `localStorage`，切换未折叠算法默认展开，已折叠算法保持收起。
- **不碰播放器**：展开/收起只改组件可见性，不调用 `selectAlgo`、`stop`、`seek` 或重跑；E2E 在 Dijkstra 第 11/46 帧折叠再展开，帧号保持不变。
- **内容来源**：独立 `domain/guides` 只组装展示数据；课程派生与目录回退共用同一 `AlgorithmGuideContent`。不扩展 Lesson Schema，不复制教材长文或插图。
- **视觉**：复用 `lab-head`、既有 token、主题与响应式断点；导学区仅用静态 SVG 直觉图，没有第二套 Timeline/播放器。1440 两栏、390 单栏，页面无横向溢出。
- **范围**：只保证内置课程与目录算法的官方导学；不扩展任意用户代码自动生成导学，不进入 UX-02（右侧面板精简）、UX-03（左侧目录层级）或 UX-04（整页比例）。

UX-01 证据：`docs/ux01/guide-expanded-1440-light.png`、`guide-collapsed-1440-light.png`、`guide-expanded-390-light.png`。

### 8.1 UX-01B 排版与视觉层级（当前）

UX-01B 只调整导学区的排版、内容层级和静态示意图，不进入 UX-02，也不改左侧目录、右侧逐帧讲解、Trace、算法数量或整页网格。

- **三层阅读顺序**：`guide-hero` 先给“一句话理解 + 算法名”、问题与高对比核心思想（`coreHeadline`）；`guide-flow` 只给 3～5 个阶段（阶段名 + 一句话）；`guide-bottom` 给记忆重点与操作按钮。详细步骤、前置、复杂度解释、条件限制、常见错误和来源全部进入默认关闭的 `guide-details`，展开后完整保留。
- **三算法各自成立**：Dijkstra 4 阶段（初始化距离表 / 贪心选最近 / 松弛出边 / 重复并回退路径），Kahn 4 阶段（统计入度 / 零入度入队 / 出队删边减度 / 归零再入队并查环），Kosaraju 5 阶段（原图第一遍 DFS / 记录完成顺序 / 构造转置图 / 按逆序第二遍 DFS / 一棵 DFS 树 = 一个 SCC）。没有机械套用同一套四步文案。
- **课程派生规则**：课程本身恰有 3～5 个真实步骤时，`lessonStages` 把真实步骤转成阶段（标题去圈号，说明取首句）；6 步及以上课程不强制分组，`stages` 留空，在概览中显示一条紧凑回退说明，完整步骤仍在详情区。目录回退只显示简介、时间/空间与安全说明，不编造阶段或口诀。
- **高度与首屏**：静态示意图保留在核心思想右侧，仅作直觉提示，最大高度 138px；1440×900 下 Dijkstra 导学高度约 481px（Kahn/Kosaraju 约 513px），`lab-workbench` 顶部约 745/777px，动画顶部进入首屏。旧版导学则延伸出 900px 视口，动画完全不可见。
- **折叠与播放**：点击“开始看动画”或标题栏“收起算法导学”都只切换导学可见性；按算法折叠偏好沿用 `algoviz-ux01-guide-collapsed`，不调用 `seek/stop/selectAlgo`，不重置播放帧。
- **视觉**：复用现有 token 与按钮，不使用新 UI 库；没有大面积相同浅蓝卡片，阶段条、记忆条和详情区有明确层级；中英、Light/Dark、键盘与 390 单栏均覆盖。

UX-01B 证据：`docs/ux01b/before/`（4 张优化前）与 `docs/ux01b/after/`（7 张优化后，含 Dijkstra 展开/详情/收起、Kahn 展开、Kosaraju 展开、Kosaraju Dark、390 展开）。

## 9. 全量矩阵

| 分组 | 算法 | 课程 |
| --- | --- | --- |
| 排序 | 冒泡、插入、选择、快速 | 冒泡 |
| 查找 | 二分、线性 | — |
| 线性结构 | 栈、队列、单链表 | 栈、队列、链表 |
| 图 | BFS、DFS、Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量 | BFS、DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量 |
| 树 | 二叉树中序遍历、二叉搜索树查找/插入/删除、AVL 插入/删除/四种旋转 | 中序、BST、AVL |
| 递归 | 阶乘、斐波那契 | 阶乘 |

### 覆盖小结

- 25 个算法入口；20 个真实 Python 入口。
- 19 门双语课程；6 个暂无课程（插入、选择、快速、二分、线性、斐波那契）。
- 导学覆盖：3 个原创精选、16 个课程派生、6 个目录安全回退；25 个入口全部有导学入口或明确“简介待补充”状态。
- 结构化可视化新增 `avl`，不影响既有 `stack/queue/linked-list/graph/binary-tree/bst/weighted-graph/floyd-matrix/bellman-table/prim-mst/kruskal-mst/topological-sort/critical-path/connected-components/kosaraju`。
- T2 默认 AVL 预设刻意覆盖四种旋转、无需旋转的普通插入、叶子/单孩子/双孩子（根）/缺失键删除，以及一次叶子删除触发两个祖先 LR 双旋的连续重平衡。

## 10. 验证

本地复核环境：Windows + Microsoft Edge（Playwright `channel=msedge`）+ 真实 Pyodide 0.27.7。

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 通过；1433 modules；`index-BSf2Dpt6.js` 1,279.25 kB / gzip 359.41 kB；`index-C3WZL0dF.css` 127.59 kB / gzip 22.23 kB |
| 全量单测 | ✅ 85 个文件、694 tests 全部通过 |
| UX-01B 相关单测 | ✅ `buildGuide.test.ts` 7 项 + `AlgorithmGuide.test.tsx` 7 项 + `useAlgorithmGuidePreferences.test.ts` 3 项，合计 17 项通过；覆盖三算法双语完整性、3～5 阶段、课程长步骤回退、目录安全回退、详情默认收起/展开、折叠不碰播放器与按算法偏好 |
| T1 相关单测 | ✅ `bst.test.ts` 14 项 + `bstLesson.test.ts` 3 项，合计 17 项通过 |
| T2 相关单测 | ✅ `avl.test.ts` 9 项 + `avlLesson.test.ts` 3 项，合计 12 项通过；覆盖 176 帧 Schema、稳定 ID、四种旋转/双旋两阶段、删除三案例、根变化、连续重平衡、回退视觉同步、非法快照拒绝与课程帧映射 |
| 全量 E2E | ✅ 97/97（95 条既有 + 2 条 UX-01B 功能/视觉） |
| UX-01B E2E | ✅ 2/2：1440 导学三层/阶段数/详情默认收起/展开后 7 步与知识/高度与动画首屏、Dijkstra 第 11/46 帧折叠再展开不丢帧、键盘、三算法切换、按算法偏好、英文、Dark/System、目录安全回退；390 展开/详情/收起与无横向溢出；生成 7 张 after 截图 |
| T1 E2E | ✅ 1/1：真实 Pyodide 依次运行查找、插入、叶子/单孩子/双孩子删除；验证根 b1→b6、后继 b6 保留 ID、65 重连、前进/回退/跳帧同步、390 无页面横向溢出 |
| T2 E2E | ✅ 1/1：真实 Pyodide 运行 10 个官方预设；验证四种旋转、双旋 chip、删除三案例/根变化/连续重平衡、节点 ID 与 height/BF、前进/回退/跳帧、390 根居中与页面无横向溢出、英文切换；并生成 6 张截图 |
| 独立 Python 校验 | ✅ `scripts/verify_bst_python.py` 与 `scripts/verify_avl_python.py` 全部通过；AVL 覆盖 10 个官方预设、四种旋转、叶子/单孩子/双孩子/根/缺失键、空树/重复/非法值、多祖先连续平衡；逐帧检查中序严格递增、真实 height、`|BF|≤1`、无重复归属/无环/无悬空引用，并与独立参考 AVL 交叉验证 |
| 回归 | ✅ BFS/DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量/SCC、二叉树遍历、栈/队列/链表、BST/AVL 在 97/97 全量 E2E 中通过 |
| 入口数量 | ✅ 24→25、课程 18→19 的旧断言已修正并复跑通过 |

## 11. 已知边界

- T1/T2/UX-01B 只保证官方 Python 示例、预设输入与内置导学内容；任意用户改写代码后的完整自动可视化或自动导学仍不在本批次范围。
- 双孩子删除采用“物理移植中序后继”策略，不采用“复制后继值再删除后继”的显示方式；因此同一节点 ID 会换位置，教学时不要把位置变化误读为新节点。
- 删除帧的 `current` 常为空（目标已摘除），路径/目标高亮因此清空；最终结果、摘除对象、指针与根变化仍由 `removedNode`、`oldRootId/rootId` 明确记录。
- `delete-cascade` 的删除分类是叶子删除，但会连续触发两个不同祖先的 LR 双旋；不能把它当成双孩子删除，也不能假设删除后至多旋转一次。
- 旋转帧在 `before/after` 之间允许 `|BF|>1`，但 `init/done` 必须满足 AVL 条件，Schema 和测试都按此校验。
- 390 px 下 BST/AVL 树画布在容器内横向滚动，AVL 会自动把根居中；页面本身无横向溢出，没有为了 T1/T2 调整页面主布局。
- UX-01B 的完整原创导学仍只有 Dijkstra、Kahn、Kosaraju 三个；其余 16 门课程直接复用 Lesson 结构，6 个无课程入口只显示目录简介与复杂度。课程只有 3～5 个真实步骤时才生成阶段条；6 步及以上只显示紧凑回退，完整步骤仍可展开。
- 导学静态示意图是教学示意，不是按真实输入计算出的图形；真实结构、指针与帧状态始终由下方 `VisualStage` 的 Trace 决定。
- UX-01B 不改变左侧目录、右侧 LessonPanel、整页双栏比例或任一 Python/Trace 语义；这些留到 UX-02 / UX-03 / UX-04。
- G2、G3、G4、T1、T2、UX-01 与 UX-01B 均尚未合并 `main`；T1 从包含 G1～G4 的 `94e34fa` 创建独立分支，T2 从 T1 最新文档提交 `ef0ee4f` 创建 `feat/t2-avl`，UX-01 从 T2 文档提交 `639ae33` 创建 `feat/ux01-algorithm-guide`，UX-01B 从 UX-01 提交 `715acc3` 创建 `feat/ux01b-guide-hierarchy`。
- `BST_PYTHON` / `AVL_PYTHON` 的 `line=` 是教学用近似源码行号，Monaco 实际行号以编辑器为准。
- AVL 节点上的 ROOT/LEAF/当前角色徽标在 T2 中隐藏，避免与 height/BF 徽标叠字；当前节点由顶部指标与描边表达。

## 12. 下一批次（不在本批次执行）

UX-02（右侧教学面板精简）、UX-03（左侧目录层级）、UX-04（整页高度与双栏比例）、堆、哈夫曼树与其他算法均未在 UX-01B 中开发；后续继续复用现有单一播放器、Trace 快照、树/图布局与双语课程架构。
