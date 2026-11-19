# AlgoViz 算法与课程覆盖清单

快照：2026-11-19（L1B 从 L1A 最终记录 `4fab01b` 创建 `feat/l1b-sequential-list` 完成；UIX-V01 从 L1B 最终记录 `7c70176` 创建 `feat/uix-v01-array-canvas`，实现记录 `d190af0`；UX-04C、T2、T3、T4、S1、S2、F1、F2、L1A、L1B 与 UIX-V01 均未合并 `main`）

## 1. 口径

- **算法入口**：`src/domain/algorithms/catalog.generated.ts` 的 34 个 id。
- **教学课程**：`src/domain/lessons/registry.ts` 注册的 33 门内置课程；34 个入口中 33 个有课程，仅斐波那契暂无内置课程。
- **真实 Python**：34 个入口全部有官方真实 Python 示例，选中 Python 后由 Pyodide Worker 执行真实代码并记录结构化 Trace。Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量、BST、AVL、最大堆/堆排序、哈夫曼树/哈夫曼编码、简单选择排序、直接插入排序、希尔排序、快速排序、归并排序、顺序查找、二分查找、链地址法、线性探测、双向链表、循环单链表、顺序表的 JS 入口是提示桩或旧演示，不伪造结构动画。快速排序保留旧 JavaScript 演示，但默认 Python 课程来自真实 Lomuto Python；归并排序新增 legacy 入口与旧 JS 演示，官方课程来自真实自顶向下 Python；顺序查找/二分查找复用既有 `linear`/`binary` legacy ID，链地址法/线性探测新增 `hash-chain`/`hash-probe`，双向链表/循环单链表新增 `doubly`/`circular`，顺序表新增 `seqlist`，官方课程均来自真实 Python。

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

## 8. T3 新增算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `heap` | 最大堆 · 自底向上建堆 / 插入 / 删除堆顶 / 原地堆排序 | ✅ 真实 Python 数组 `VALUES/IDS` 与 `HEAP_SIZE/SORTED_FROM`，Pyodide 执行 | ✅ 4 个官方预设 79 帧 + 12 个边界/重复场景 62 帧；13 种操作帧，单一 `operation` 区分 `build/push/extract/sort` | ✅ 完全二叉树按槽位固定几何，右侧真实数组逐槽联动；稳定元素 ID、`2i+1/2i+2/⌊(i-1)/2⌋` 公式、比较父子/兄弟、交换两槽、活动/路径、已排序后缀、删除最大值与末尾补根 | ✅ `max-heap-build-push-extract-sort`，10 步 | ✅ 独立 CPython 16 用例 + 13 项专项单测 + 4 条真实 Pyodide E2E + 6 张截图 |

T3 设计要点：

- **一个算法、四种真实操作**：`heap` 只有一个入口；输入对象中的 `operation` 决定执行 `build`、`push`、`extract` 或 `sort`。四种操作共享同一份 `HEAP_PYTHON`、同一套快照与同一个播放器，不是四套伪造动画。
- **真实数组与稳定身份**：`VALUES[slot]` 是数组内容，`IDS[slot]` 是稳定教学 ID `h1…hn`。快照 `elements[slot] = {id,value,slot}` 按槽位连续存储；交换只改变元素的槽位，树形只由槽位数推导，交换不会重排完全二叉树。
- **建堆**：从最后一个非叶节点 `n//2 - 1` 开始向前，每个子树根执行一次真实下沉；先比较两个孩子，再比较父与较大孩子，相等不交换。默认 `[4,9,2,7,5,9,1]` 共 17 帧，最终 `[9,7,9,4,5,2,1]`。
- **插入**：先把新值真实追加到数组尾，再沿父链上浮。默认 `[9,8,6,3,7,2]` 插入 `10` 共 7 帧；新元素稳定 ID 为 `h7`，从 #6 上浮到 #0，最终 `[10,8,9,3,7,2,6]`。
- **删除堆顶**：`extract-select` 先展示根最大值，随后真实记录返回值、弹出尾元素、让末尾元素补到 #0 并缩小 `heapSize/totalSize`，再从根下沉。默认 `[9,8,6,3,7,2,5]` 共 10 帧，删除 `h1=9`，`h7` 从 #6 补到 #0，最终 `[8,7,6,3,5,2]`。
- **堆排序**：先完整建堆；每轮 `sort-select` 标记当前根最大值，`swap-to-end` 随后真实交换 #0 与当前堆尾并同步缩小 `heapSize` 与 `sortedFrom`，再只在下沉范围内恢复堆性质。默认 `[5,1,9,3,9,2,6]` 共 45 帧，最终升序 `[1,2,3,5,6,9,9]`；已排序后缀不再参与任何堆调整。
- **视觉**：复用现有舞台、SVG、播放器与课程面板；新增 `heapLayout` 仅按槽位生成完全二叉树几何（7 节点设计尺寸 280×274），`heapModel` 同时生成树节点、边与真实数组槽位。树和数组读取同一 `MaxHeapSnapshot`，没有第二套时间轴或状态源。
- **响应式**：桌面树占主区域、数组为窄侧栏；≤860px 改为上下布局，真实数组在手机端使用四列网格完整展示全部槽位，页面本身无横向溢出。空堆与“堆区为空、全部进入已排序后缀”分别显示明确空态。
- **课程**：10 步覆盖完全二叉树、最大/最小堆、数组存储与三条下标公式、自底向上建堆、上浮与下沉、删除堆顶、完整堆排序、不稳定性、常见错误与考试记忆。复杂度明确：建堆 `O(n)`、插入/删除堆顶 `O(log n)`、堆排序 `O(n log n)`、原地辅助空间 `O(1)`（不含教学 Trace 与展示快照）。
- **边界**：空堆、单元素、重复值均纳入独立 CPython 夹具；重复值验证“父不小于子包含相等，不因相等而交换”。任意用户改写后的通用堆识别与可视化不在 T3 范围。

T3 代表性截图：`docs/t3/heap-build-1440-light.png`、`heap-push-1440-light.png`、`heap-extract-1440-light.png`、`heap-sort-1440-light.png`、`heap-sort-1440-dark.png`、`heap-sort-390-light.png`。

## 9. T4 新增算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `huffman` | 哈夫曼树构建 · 哈夫曼编码 | ✅ 真实 Python `heapq`：真实 `heappop`/`heappush`、真实父子引用与稳定节点 ID，Pyodide 执行 | ✅ 官方 29 帧；`init/merge-select/merge-create/merge-requeue/build-done/encode-start/encode-left/encode-right/encode-leaf/done`；等权/单字符/空输入/重复频率边界 40 帧 | ✅ 三区联动：固定 88×58 节点的树画布、真实 heapq 优先队列（原始数组顺序 + 优先级顺序 + heap index）、字符/频率/编码/码长/加权贡献表；树/队列/码表全部读同一快照 | ✅ `huffman-build-and-prefix-codes`，10 步 | ✅ 独立 CPython 69 帧校验 + 11 项专项单测 + 2 条真实 Pyodide E2E + 8 张截图 |

T4 设计要点：

- **一个算法、两个连续阶段**：`huffman` 只有一个入口和一套播放器；同一 Trace 先完成建树，再从同一棵真实树生成编码。没有第二个 `huffman-coding` 入口，也没有按预设直接画最终树。
- **真实 heapq 与稳定身份**：初始每个字符是稳定叶子 `n1…nN`，`order` 单调递增且唯一；左孩子先弹出、右孩子后弹出。`merge-create` 的父节点权值严格等于两个孩子之和，父子引用是 Python 中的真实 `left/right`；`merge-requeue` 在真实 `heappush` 之后发出。`queueIds` 是 heapq 内部数组的真实顺序，不是手写排序；`queueEntries` 按 `(weight,order)` 优先级展示并保留 `heapIndex`。
- **等权确定性**：优先队列键固定为 `(weight, order)`，同权时先创建者先弹出。官方 A5/B9/C12/D13/E16/F45 每次运行可复现；测试仍允许左右交换等合法差异，不把某一条码串当作唯一正确答案。
- **编码与最优性**：约定左分支 `0`、右分支 `1`；`encode-start` 从根出发，`encode-left/right` 沿真实边追加位，`encode-leaf` 才写入码表。官方最终码表为 A `1100`/4、B `1101`/4、C `100`/3、D `101`/3、E `111`/3、F `0`/1；WPL `224`、实际总位数 `224`、定长 3 位/字符合计 `300`，节省 25.3%。`pathIds`、`prefix` 与码表均从同一树路径读取。
- **边界口径**：单字符 `single` 理论树 WPL 为 `0`，但实际采用 1 位码 `0`，总位数按 `weight×1=7` 计；空输入只有 `init` 与 `done(result='empty')`，不建树、不编码、metrics 全 0；重复字符在 Python 中按首次出现顺序累加频率。`MAX_SYMBOLS=16`、`MAX_NODES=33`、`MAX_CODE_BITS=16`。
- **Schema 不信任画面**：`huffmanSnapshotSchema` 逐帧校验节点 ID 唯一、`order` 连续、每个节点双孩子或无孩子、叶/内部符号、父权值等于两孩子和、单父、全节点从根可达无环、队列只含森林根并满足最小堆序、`merge-select` 恰好弹出当前最小两个、`merge-create` 父/孩子对应、编码路径与码表一致、WPL 由真实深度重算、done 时叶与码一一对应。
- **视觉复用与滚动**：复用现有舞台、播放器、课程与树布局思路；`huffmanLayout` 固定节点 88×58，先算子宽再摆放，父节点居中于两孩子；不缩小节点以塞满一屏，树画布允许内部横向/纵向滚动。`HuffmanVisual` 的树、队列、码表三区共享同一快照，码表在完成阶段自动增高以显示官方全部 6 行。
- **课程与目录**：`huffmanLesson` 10 步严格映射 Python `lesson_step`，覆盖 WPL、最优二叉树、为什么合并两个最小、最小堆作用、左 0 右 1、前缀码、高频短码、定长对比、`O(n log n)`（建树 n−1 次合并 × 堆操作，编码 O(n)）、编码不唯一、单字符口径与 7 条常见错误；口诀「两小合一，重复建树；左零右一，走到叶子」明确只适用于本页二叉编码约定。教材 `ch6-tree/huffman` 从 planned 变为 authored，T4 完成时目录总计 27 个入口（S1 后为 28）。
- **测试口径**：独立 `scripts/verify_huffman_python.py` 用不依赖 Trace 树的 `reference_wpl` 累加每次合并的父权值，逐帧校验 69 帧；专项 `huffman.test.ts` 11 项覆盖 Schema、布局、等权/单字符/空/重复、回退；E2E 验证官方 29 帧的关键帧、码表 6 行、回退同步、Dark 与 390 无页面横向溢出。编码存在多解，测试验证前缀性和 WPL 最优，不只比固定码串。

T4 代表性截图：`docs/t4/huffman-merge-select-1440-light.png`、`huffman-build-done-1440-light.png`、`huffman-build-done-tree-bottom-1440-light.png`、`huffman-encode-path-1440-light.png`、`huffman-final-table-1440-light.png`、`huffman-final-table-1440-dark.png`、`huffman-final-table-390-light.png`、`huffman-single-symbol-1440-light.png`。

## 10. S1 新增排序算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `selection` | 简单选择排序 | ✅ 真实 Python `SELECTION_PYTHON`，复用既有 `selection` legacy 入口与 ID | ✅ 官方 40 帧；7 种操作 `init/select-start/select-compare/select-candidate/select-swap/select-done/done` | ✅ 复用数组柱状图；已排序前缀、未排序区、当前最小候选、正在比较、轮末交换、`MIN/CMP/⇄` 标记 | ✅ `selection-sort-basics`，7 步 | ✅ 独立 CPython + 专项单测 + 真实 Pyodide E2E + 2 张截图 |
| `insertion` | 直接插入排序 | ✅ 真实 Python `INSERTION_PYTHON`，复用既有 `insertion` legacy 入口与 ID | ✅ 官方 33 帧；6 种操作 `init/insert-key/insert-compare/insert-shift/insert-place/done` | ✅ 同一柱状图；有序前缀、key 卡片、向左比较、真实右移产生的重复值、写回空位 | ✅ `insertion-sort-basics`，6 步 | ✅ 独立 CPython + 专项单测 + 真实 Pyodide E2E + 2 张截图 |
| `shell` | 希尔排序 | ✅ 真实 Python `SHELL_PYTHON`，新增 legacy 入口 `shell` | ✅ 官方 70 帧；7 种操作 `init/gap-change/shell-compare/shell-shift/shell-place/gap-done/done` | ✅ 同一柱状图；gap 轮次、gap 序列、lane、跨 gap 比较与右移、key 写回；无关元素保持可见 | ✅ `shell-sort-basics`，7 步 | ✅ 独立 CPython + 专项单测 + 真实 Pyodide E2E + 2 张截图 |

S1 设计要点：

- **一个快照、一个渲染器、一个播放器**：三种排序共用一个 `sortingSnapshotSchema`、一个 `SortingVisual` 与既有的 `Timeline`/播放控制；没有三套数组组件，也没有第二套播放器。数组槽位固定 `p0…p(n-1)`，每帧 `state.values` 与 `structure.elements` 逐槽一致。
- **真实 Python 执行**：三份源码均为 CPython 可执行程序，从 `input` 归一化最多 20 个有限数值；`trace()` 每帧写入真实数组、焦点、变量、`lesson_step` 与完整结构快照。官方默认输入分别为选择 `[6,4,9,1,7,2]`、插入 `[7,3,5,1,9,2]`、希尔 `[8,3,7,4,9,2,6,1]`。
- **选择排序语义**：每轮从未排序后缀选最小并只做一次轮末交换。官方 6 轮、15 次比较、5 次候选更新、6 次交换（含最后一轮自交换），最终 `[1,2,4,6,7,9]`。多帧显式区分 `select-start` 的扫描起点、`select-compare` 的正在比较、`select-candidate` 的候选迁移、`select-swap` 的实际交换。标准交换式选择排序不稳定，最好/平均/最坏均为 `O(n²)`，辅助空间 `O(1)`。
- **插入排序语义**：取出 `key=a[i]` 后，只有 `a[j] > key` 才执行 `a[j+1]=a[j]` 并发 `insert-shift`，相等不移动；最后把 key 写回 `insert-place`。官方 5 轮、12 次比较、9 次真实右移、5 次写回；第 1 轮 `key=3` 让 `7` 从 p0 移到 p1，再写回 p0。右移过程中数组暂时出现真实重复值，不伪造“洞已填好”。标准直接插入排序稳定，最好 `O(n)`、平均/最坏 `O(n²)`，辅助空间 `O(1)`。
- **希尔排序语义**：官方 gap 序列为 `n//2` 反复减半 `[4,2,1]`，每个 gap 内按 lane（`i % gap`）做跨 gap 插入。官方 3 个 gap 轮次、28 次比较、17 次右移、17 次写回；`gap=1` 是普通插入排序，最后保证全局有序，最终 `[1,2,3,4,6,7,8,9]`。gap 缩小使 lane 合并、有序性增强；复杂度取决于间隔序列，本页只声明该 `n//2` 序列最坏 `O(n²)`，不笼统声称所有希尔排序都是 `O(n log n)`；通常不稳定，辅助空间 `O(1)`。
- **Schema 校验**：`SORTING_LIMITS.MAX_VALUES=20`、`MAX_ROUNDS=64`、`MAX_ABS_VALUE=1_000_000_000_000`；逐帧校验槽位顺序、已排序前缀非降、done 全局升序、选择扫描区间/交换、插入真实右移重复与 key 写回、Shell gap 序列/lane/shift 距离/key 落点。
- **共享视觉**：已排序用绿色，比较用红色，候选用蓝色，key 用红色虚线，shift target 用斜纹，lane 用虚线轮廓；所有元素保持可见，不用“隐藏无关元素”制造焦点。390 px 使用既有单列布局，无页面横向溢出。
- **课程与目录**：三课分别 7/6/7 步，与真实 Python `lesson_step` 严格一致；课程明确比较三种算法的稳定性、复杂度和适用场景。教材 `ch9-sort/selection-sort`、`insertion-sort`、`shell-sort` 均为 authored，`merge-sort` 仍是唯一 planned 排序主题。
- **边界**：普通乱序、已有序、完全逆序、重复元素、负数、单元素、空数组、浮点混合均进入独立 CPython 与 fixtures；空数组只发出 `init` 与 `done(result='empty')`，不伪造柱子。

S1 代表性截图：`docs/s1/selection-candidate-1440-light.png`、`selection-done-390-light.png`、`insertion-shift-1440-light.png`、`insertion-done-390-light.png`、`shell-shift-1440-light.png`、`shell-done-390-light.png`。

## 10A. S2 新增算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `quick` | 快速排序 · Lomuto 分区 · 末尾 pivot | ✅ 真实 `QUICK_PYTHON`，保留既有 `quick` legacy ID 与旧 JS 演示 | ✅ 官方 32 帧；`init/quick-range/quick-compare/quick-swap/quick-place/quick-return/done` | ✅ 同一柱状图：当前递归区间、pivot、扫描 j、边界 i 左侧的 ≤ pivot 区域、真实交换、pivot 归位、左右递归、已确定终位 | ✅ `quick-sort-basics`，5 步 | ✅ 独立 CPython + 6 项专项单测 + 真实 Pyodide E2E + 3 张截图 |
| `merge` | 归并排序 · 自顶向下 · 独立缓冲区 | ✅ 真实 `MERGE_PYTHON`，新增 `merge` legacy 入口与旧 JS 演示 | ✅ 官方 110 帧；`init/merge-range/merge-split/merge-return/merge-start/merge-compare/merge-write/merge-copy/merge-writeback/merge-range-done/done` | ✅ 主数组 + 当前递归区间、左右候选 L/R、独立缓冲区逐槽、B 来源、↓ 写回目标、已归并区间；无第二套播放器 | ✅ `merge-sort-basics`，5 步 | ✅ 独立 CPython + 6 项专项单测 + 真实 Pyodide E2E + 3 张截图 |

S2 设计要点：

- **一个快照、一个渲染器、一个播放器**：quick/merge 与 S1 三种排序共用 `sortingSnapshotSchema`、`sortingModel.ts`、`SortingVisual.tsx` 与既有 Timeline/播放控制。新字段 `range/pivot/boundary/split/left/right/buffer/bufferWrite/writeAt/finalized/mergedRanges` 带默认值，S1 旧快照通过默认值继续工作。
- **快速排序不是相邻交换动画**：真实 Lomuto 末尾 pivot；`quick-compare` 只读比较，`quick-swap` 只在 `i != j` 时真实交换扫描位置与边界，`quick-place` 的 pivot 交换后落到最终槽位并进入 `finalized`；递归为 `[low, i-1]` 与 `[i+1, high]`。官方 32 帧，最终 `[1,2,3,4,5,7,8,9]`。
- **归并排序有真实临时缓冲区**：`merge-write`/`merge-copy` 每帧记录 buffer 下标、值、来源下标；`merge-writeback` 记录真实 `writeAt`；缓冲区与主数组是两块独立存储。相等键 `a[left] <= a[right]` 取左，保持稳定。官方 110 帧，最终 `[1,2,3,4,5,7,8,9]`。
- **教学正确性**：quick 课程明确平均/通常期望 `O(n log n)`、最坏 `O(n²)`、递归栈平均 `O(log n)`/最坏 `O(n)`、标准原地通常不稳定；merge 课程明确所有输入 `O(n log n)`、数组实现 `O(n)` 辅助空间、相等取左稳定、拆分与合并的分治思想。两门课程均由真实 5 个 `lesson_step` 驱动，顶部导学真实生成 5 个阶段。
- **验证**：`scripts/verify_divide_sort_python.py` 逐帧对照独立参考，覆盖官方 + 已排序/逆序/重复/负数/全相同/单元素/空数组/长随机 9 类输入，923 帧全部通过；fixtures 默认 142 帧 + 边界 516 帧；专项单测验证 pivot 不变量、buffer 来源/写回、多重集、帧数上限与 S1 默认字段兼容。
- **语义边界**：merge 写回是逐槽覆盖的真实中间态，主数组可能暂时出现重复/缺失槽位；缓冲区持有完整区间内容，`merge-range-done`/final 恢复多重集。quick 与 merge 都只验证官方/预设真实 Trace，不支持任意用户改写代码。
- **目录折中**：只把既有 `ch9-sort/merge-sort` 从 `planned` 改为 authored 并挂 `merge`，未新增主题、未改章节顺序；快速排序沿用既有 entries，不另建重复 ID。

S2 代表性截图：`docs/s2/quick-swap-1440-light.png`、`quick-place-1440-light.png`、`quick-done-390-light.png`、`merge-write-1440-light.png`、`merge-writeback-1440-light.png`、`merge-done-390-light.png`。

## 10B. F1 新增查找算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `linear` | 顺序查找 | ✅ 真实 `LINEAR_PYTHON`，复用既有 `linear` legacy ID | ✅ 官方 12 帧；`init/scan-start/scan-compare/scan-next/found/not-found`；空数组 2 帧 | ✅ 复用数组柱状图，但独立查找语义：已检查前缀、当前比较、未检查后缀、命中元素、checked 数；不是排序交换动画 | ✅ `linear-search-basics`，5 步 | ✅ 独立 CPython 143 帧参考 + 10 项专项单测 + 真实 Pyodide E2E + 2 张截图 |
| `binary` | 二分查找 · 迭代实现 | ✅ 真实 `BINARY_PYTHON`，复用既有 `binary` legacy ID | ✅ 官方 10 帧；`binary-init/binary-mid/binary-compare/binary-exclude-left/binary-exclude-right/binary-found/binary-not-found/invalid` | ✅ 同一数组基础，独立区间动画：L/R/MID、当前有效区间、按真实 Python 边界排除的半区淡色、命中结果；排除完全由 `left/right` 驱动 | ✅ `binary-search-basics`，5 步 | ✅ 独立 CPython 143 帧参考 + 10 项专项单测 + 真实 Pyodide E2E + 2 张截图 |

F1 设计要点：

- **复用入口**：`legacy/algorithm-definitions.js` 原本已有 `linear`、`binary`，二者均属 `search` 分组；本次只更新显示名与官方 Python，不新增同名 ID。`linear` 的中文显示名由「线性查找」改为「顺序查找」，`binary` 保持「二分查找」。
- **真实顺序查找**：官方输入 `[6,3,9,2,7,4]`、target `7`，从左到右逐项比较，返回首次遇到的匹配；官方 12 帧，第 10 帧比较 p4=7，第 11 帧 `found` 索引 4；全部检查完仍未命中时发 `not-found`。空数组只发 `init` 与 `not-found`，不伪造柱子。
- **真实迭代二分**：官方输入 `[1,3,5,7,9,11,13]`、target `9`，`while left <= right`；官方 10 帧，`left/right/mid` 变化由 Python 真实边界更新驱动：`[0,6] → mid3 → 7<9 排除左半区 left=4 → [4,6] → mid5 → 11>9 right=4 → [4,4] → mid4 → found`。`left<=right` 保证最后一个候选元素仍被比较；找不到时 `left>right`。
- **无序输入不偷偷排序**：`BINARY_PYTHON` 先检查非递减前提；无序输入只发 1 帧 `invalid`，`reason='unsorted'`，不携带 `left/right/mid/range`，也不发任何二分进度。页面显示明确警告，不产生误导性动画。
- **重复值语义**：F1 采用“找到任意一个匹配位置”；`[2,2,2,3]` target 2 返回合法索引 1，不承诺第一个或最后一个匹配位置，课程与讲解均明确说明。
- **视觉边界**：`SearchVisual` 只从 `SearchSnapshot` 构建模型；`state.values` 必须与 `elements` 逐项一致，否则模型返回 null，不显示假状态。找到帧只显示单个 `✓`，有 mid 时只显示 `MID`，单元素边界显示合并 `L=R`，避免 L/R/MID/✓ 叠字。
- **同一播放器**：复用既有 Timeline 与播放/暂停/前进/后退/任意跳帧；没有第二套播放器，也没有重构 Trace Schema 的大结构。
- **课程与目录**：两门课程均 5 步，覆盖一句话理解、核心思想、复杂度、常见错误与记忆重点；教材第 8 章「查找」沿用既有 `sequential-search → linear`、`ordered-search → binary`，未改章节结构。
- **验证**：`scripts/verify_search_python.py` 用独立 CPython 参考校验 143 帧 / 23 组输入（官方 + 成功/失败、空、单元素、首尾命中、重复值、负数、中间目标、无序等），全部通过；真实 Pyodide E2E 2/2，覆盖比较帧、found、排除区间、前后跳帧与无序警告。
- **知识包回归**：F1 后 `linear`/`binary` 已有内置课程，旧官方示例包原先用 `binary` 作为“无内置课程”载体因此冲突；官方示例包迁移为 `algolens-fib-basics`（`fib` 斐波那契递归，5 步），知识包不可覆盖内置课程的规则保持不变。

F1 代表性截图：`docs/f1/linear-compare-1440-light.png`、`linear-found-1440-light.png`、`binary-narrow-1440-light.png`、`binary-found-1440-light.png`。

## 10C. F2 新增散列表算法

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `hash-chain` | 散列表 · 链地址法 | ✅ 真实 `Node` 类、真实 `next` 引用、稳定 `n1…` ID，Pyodide 执行 | ✅ 官方 60 帧；`init/hash/bucket/chain-compare/insert/duplicate/found/not-found/delete-head/delete-middle/delete-tail/delete-missing/done` | ✅ 7 桶数组 + 桶内真实 next 链；当前键、`h(key)=key%7`、桶索引、逐节点比较、头/中/尾删除重连、removed 区、元素数/装载因子 | ✅ `hash-chaining-basics`，5 步 | ✅ 独立 CPython 752 帧总校验 + 10 项 Schema/模型单测 + 真实 Pyodide E2E + 3 张截图 |
| `hash-probe` | 散列表 · 线性探测 | ✅ 真实 `Entry` 数组 + `TOMBSTONE` 对象，三态槽，Pyodide 执行 | ✅ 官方 182 帧；`init/hash/probe-check/probe-next/insert/duplicate/found/not-found/delete/delete-missing/table-full/done` | ✅ 7 连续槽 + PTR/当前探测槽 + 探测路径；EMPTY/OCCUPIED/DELETED 三态、回绕、表满、墓碑继续查找、墓碑复用、元素数/装载因子 | ✅ `hash-probing-basics`，5 步 | ✅ 独立 CPython 752 帧总校验 + 10 项 Schema/模型单测 + 真实 Pyodide E2E + 3 张截图 |

F2 设计要点：

- **真实 Python，不用内置 dict 代替教学算法**：官方表长 `m=7`、`h(key)=key % 7`，冲突键 `1、8、15` 都映射到桶/槽 1。链地址法用真实 `Node` 对象与 `next` 指针，线性探测用真实 `Entry` 数组与 `TOMBSTONE = object()`；结构快照由 Python 发射，JS 只读取。
- **链地址法头插与稳定身份**：官方链为 `15 → 8 → 1`，节点 ID 固定为 `n3=15, n2=8, n1=1`；插入新节点真实把 `next` 指向原桶头并更新头指针。删除覆盖头/中/尾，分别记录真实前一节点、被删节点与重连结果；`removed` 显示被摘除对象，不用动画节点冒充 Python 对象。
- **线性探测三态与删除标记**：`EMPTY` 表示从未使用，`DELETED` 是墓碑，`OCCUPIED` 才计入元素数。查找遇到 `DELETED` 必须继续，只有 `EMPTY` 才能判定不存在；删除写 `DELETED`，绝不写回 `EMPTY`。插入先扫描完整探测链查重并记录第一个 `DELETED`，再复用墓碑或写入 `EMPTY`。
- **探测序列与边界**：标准序列 `(h(key)+i) % m`。官方覆盖冲突、回绕（插入 24 路径 `3→4→5→6→0`）、表满（插入 31 探测 `3→4→5→6→0→1→2` 后返回 `full`，不无限循环）、删除后继续查找（查找 15 经过 slot2 的 DELETED）、墓碑复用（22→slot2、31→slot3、38→slot0）。
- **重复键策略统一**：两种实现都不允许重复键；重复插入返回 `duplicate`，不覆盖旧值、不增加元素数，课程、Python、测试与目录描述一致。
- **装载因子口径**：元素数 / 表长。链地址法允许 `n>m`，不把装载因子错误限制在 1 以下；线性探测的 OCCUPIED 槽数不超过表长。官方末尾分别展示 `3/7=0.429`、`7/7=1.000`。
- **视觉复用但结构不同**：两种算法共用既有 Trace 回放、Timeline、课程面板与 `VisualStage` 接入；链地址法画桶数组 + 桶内链表 + 真实 next 箭头，线性探测画连续槽 + PTR + 探测路径 + 三态颜色/文字。没有把两者都退化成普通数组高亮，也没有第二套播放器。
- **Schema 不信任画面**：校验桶归属、`headId`、节点 `nextId` 无环且完全可达、三种删除真实重连；校验槽状态合法、键/ID 唯一、`probePath` 从 hashIndex 起按 `+1 % m` 连续、`currentIndex` 在路径上、表满路径长度等于 m。非法 Hash、自环、错误删除、墓碑变空、非连续路径均被拒绝。
- **课程与导学**：两门课程均为 5 步中英双语，顶部导学覆盖散列表、散列函数、冲突不可避免、链地址法、线性探测、装载因子、优缺点、平均/期望 `O(1)` 的条件、最坏 `O(n)`、聚集、DELETED 必要性、EMPTY 与 DELETED 的区别、回绕、表满、插入/查找/删除复杂度、常见错误与记忆重点。右侧逐步解释只讲当前键、当前槽/节点、冲突与本步结果。
- **教材与兼容**：第 8 章「查找」的既有 `hash-search` 专题从 `planned` 升级为 `hash-chain`、`hash-probe`，未新增章节、未改章节顺序；复用既有 `hash-search` 专题入口，不创建重复算法入口。旧存储键、官方知识包与用户本地课程不变。
- **范围**：只实现链地址法与线性探测；不做二次探测、双重散列、动态扩容/重新散列、复杂自定义散列函数，不调整页面布局，不新增 AI/MCP，不做图论定理。

F2 代表性截图：`docs/f2/chain-collision-1440-light.png`、`chain-delete-middle-1440-light.png`、`chain-delete-tail-1440-light.png`、`probe-collision-1440-light.png`、`probe-tombstone-1440-light.png`、`probe-tablefull-1440-light.png`。

## 10D. L1A 新增双向链表与循环单链表

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `doubly` | 双向链表 · 正反向遍历 / 头尾中间插入删除 / 按值查找 | ✅ 真实 `DNode(node_id,value,prev,next)`，稳定 `n1…` ID，Pyodide 执行 | ✅ 官方 89 帧；`init/create/set-next/set-prev/set-head/set-tail/visit/found/not-found/detach/done`；`intermediate/complete` 两阶段 | ✅ 节点卡片同时显示 `prev ←` / `next →`；next 实线、prev 虚线；头/尾标记、空表 `NULL`、脱离区、指针变化面板、命中/未命中 | ✅ `doubly-linked-list-pointers`，11 步 | ✅ 独立 CPython 18 组 / 516 帧 + 14 项专项单测 + 真实 Pyodide E2E 3/3 + 3 张截图 |
| `circular` | 循环单链表 · 整圈遍历 / 头尾中间插入删除 / 按值查找 | ✅ 真实 `CNode(node_id,value,next)` + `head/tail`，稳定 `n1…` ID，Pyodide 执行 | ✅ 官方 80 帧；非空 `tail.next=head`、单节点自环、空表 `head=tail=None`；遍历以 `current is head` 收尾 | ✅ 独立回环曲线/点线与“回环 next → HEAD”标签；`HEAD/TAIL/HEAD · TAIL` 标记；单节点自环；空表与脱离区 | ✅ `circular-linked-list-cycle`，10 步 | ✅ 独立 CPython 18 组 / 516 帧 + 14 项专项单测 + 真实 Pyodide E2E 3/3 + 3 张截图 |

L1A 设计要点：

- **旧 Schema 不被削弱**：旧 `linkedListSnapshotSchema` 仍只接受 `kind:'linked-list'`、只含 `id/value/nextId` 且禁止环。L1A 新增 `doubly-linked-list`、`circular-linked-list` 两个独立分支并加入 `structureSchema` 联合；测试仍用循环形状构造旧单链表快照，确认旧 Schema 继续报 `cyclic linked list detected`。
- **中间帧与完成帧分开**：新快照用 `phase:'intermediate'|'complete'` 描述真实指针写入过程。`complete` 帧强制结构不变量；`intermediate` 只校验引用合法性，允许“新节点已创建但尚未接线”“head 已更新而 tail 尚未更新”等真实瞬态。端点头尾一致性只在 `complete` 帧强制。
- **真实对象身份，不是重排数组**：双向 `DNode` 与循环 `CNode` 在 Python 中创建时分配 `n1…` 教学 ID；插入、删除、回退、跳帧都不会重命名幸存节点。每条 `change={nodeId,field,beforeId,afterId}` 来自真实赋值前后的指针，不是从最终数组重建结构。
- **双向不变量**：`head.prev=None`、`tail.next=None`；相邻节点的 `next/prev` 相互指回；完成帧无环；不可达节点 `prev/next` 均为 `None`。视觉层只根据快照 `prevId/nextId` 生成边；中间帧里 `n2.prev=n4` 且 `n4` 尚未接入链时，不画一条虚假的 `n2→n1` 虚线。
- **循环不变量与终止条件**：非空 `tail.next=head`；从 `head` 沿 `next` 恰好回到 `head` 且不重复、不遗漏；单节点 `next` 指向自身；空表 `head=tail=None`。Python 遍历使用 `current is head`，不是 `current.next is None`；查找未命中在一整圈后 `break`。
- **视觉复用与差异**：复用既有 `LinkedListVisual` 的节点外壳、舞台、Trace、Timeline、播放器与课程面板；新增 `AdvancedLinkedListVisual`，但保留不同指针语义：双向是上下两条 next/prev 边，循环是独立的虚线回环曲线。没有第二套播放器。
- **头部/尾部复杂度不笼统**：双向课程明确“已持有目标节点引用时，局部插入/删除 O(1)；按值查找仍 O(n)”。循环课程明确“维护 head/tail 时头插/尾插 O(1)，删尾仍 O(n) 找前驱；有 tail 并不能让所有操作都变成 O(1)”。
- **课程与教材**：两门课程分别 11/10 步，顶部导学均覆盖结构定义、与普通单链表的区别、核心操作、适用场景、复杂度及前提、容易写错的指针关系与记忆重点。教材第 3 章原有 `circular-linked-list`、`doubly-linked-list` 两个 planned 专题升级为真实算法入口，未新增章节、未改章节顺序。
- **范围**：只实现双向链表与循环单链表；不实现顺序表、循环双向链表或其他算法，不调整页面布局、导学/教材目录整体结构，不做 AI/MCP，不扩展任意用户 Python 代码的通用可视化。

L1A 代表性截图：`docs/l1a/doubly-empty-1440-light.png`、`doubly-five-1440-light.png`、`doubly-delete-middle-1440-light.png`、`circular-single-1440-light.png`、`circular-five-1440-light.png`、`circular-empty-1440-light.png`。

## 10E. L1B 新增顺序表

| id | 算法 | Python 示例 | Trace | 动画 | 中英课程 | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| `seqlist` | 顺序表 · 按索引访问 / 按值查找 / 指定位置插入 / 指定位置删除 / 遍历 | ✅ 真实固定容量 `data=[None]*capacity`，显式赋值搬移，无 `list.insert()` / `list.pop()` | ✅ 14 个官方预设 84 帧 + 21 个边界用例 89 帧；`init/access/search/insert/delete/traverse/done`；`read/compare/visit/check/shift-right/write/save/shift-left/clear/complete/reject`；`intermediate/complete` | ✅ 连续槽位 + 索引 + 值 + `length/capacity` + 有效/空闲/临时区域 + 源/目标/当前槽位 + 真实 `before→after` + 插入右移/删除左移方向条 + 拒绝/命中/遍历结果 | ✅ `sequential-list-basics`，7 步；顶部导学解释顺序存储、固定容量、O(1) 访问、搬移方向与链表差异 | ✅ 独立 CPython 173 帧 + 8 项专项单测 + 真实 Pyodide E2E 3/3 + 4 张截图 |

L1B 设计要点：

- **容量与长度分开**：快照固定携带 `capacity`、`length` 与恰好 `capacity` 个槽位；`[0,length)` 是有效区，`[length,capacity)` 是空闲区。视觉模型只用 `index < length` 判定有效元素，空闲槽位即使在本帧持有真实复制值也只标为 `temporary`，绝不渲染为有效数据。
- **真实搬移，不是结果替换**：插入从 `old_length-1` 向 `index` 倒序执行 `data[i+1]=data[i]`，删除从 `index` 向 `length-2` 正序执行 `data[i]=data[i+1]`。每步都产生独立 `change={index,before,after}` 帧；默认插入 8 帧、默认删除 9 帧。中间帧可以出现重复值或临时空位，完成帧必须恢复 `[0,length)` 全非空、空闲区全空。
- **Schema 拒绝伪状态**：`shift-right` 只能属于 insert 且 `targetIndex=sourceIndex+1`；`shift-left` 只能属于 delete 且 `targetIndex=sourceIndex-1`；`write` 必须带目标槽与 change；`clear` 必须清空 `data[length]`；`save` 必须记录被删值与索引；`reject` 必须带错误且不改槽位。`complete` 帧才强制最终不变量。
- **五类操作与预设**：按索引访问、按值查找、插入、删除、遍历各有一个统一入口；14 个官方预设覆盖中间/头部/尾部访问与插入删除、命中/未命中、正常遍历、空表、空表删除、满表插入、越界访问。预设只改输入，点击 Run 后才由真实 Python 生成 Trace。
- **视觉复用与范围**：复用现有 `VisualStage`、Trace、Timeline、播放控制器与课程面板；新增 `SequentialListVisual` 只替换画布为连续槽位，不创建第二套播放器，不改页面比例、顶部导学层级或教材目录结构。
- **课程与教材**：`sequential-list-basics` 7 步，覆盖顺序存储、连续空间、`length`/`capacity`、O(1) 随机访问原因、插入从后往前与删除从前往后的原因、顺序表与链表差异、越界错误与固定容量前提；教材第 3 章原有 `sequential-list` 概念专题升级为 `seqlist` 真实入口，章节与专题顺序不变。
- **范围**：固定容量实现，不开发动态扩容；不实现循环双向链表、静态链表或其他算法；不扩展任意用户 Python 代码的通用可视化，不新增 AI/MCP 功能。

L1B 代表性截图：`docs/l1b/insert-middle-1440-light.png`（索引 2 插入 25 的真实右移帧）、`delete-middle-1440-light.png`（删除索引 1 的真实左移帧）、`full-insert-1440-light.png`（满表拒绝）、`empty-delete-1440-light.png`（空表删除拒绝）。

## 10F. UIX-V01 排序与查找柱状图空间优化（不新增算法）

| 范围 | 算法 | 修改 | 不变量 | 测量/测试 |
| --- | --- | --- | --- | --- |
| 共享数组画布 | `bubble`、`selection`、`insertion`、`shell`、`quick`、`merge`、`linear`、`binary` | 柱高由领域 `165px` 换算为轨内百分比；数组轨 `205/280/340px`（排序最高 `360px`），桌面收起导学后填满 stage 剩余高度；390 固定 `220px` 轨；归并缓冲区高度收紧但仍保留槽位/索引/写回来源 | 元素值、索引、key/空位、gap lane、pivot/i/j、L/R/MID、已排除区、归并主数组/缓冲区/写回标记全部保留；真实 Trace/帧、播放器、导学、右栏文案、教材目录、其他渲染器均未改 | 3 尺寸 × 8 算法 × 展开/收起共 48 条测量；专项 E2E 3/3；全量 E2E 149/149；单元 875/875 |

UIX-V01 设计要点：

- **只改渲染空间，不改领域数值**：`sortingModel.ts`、`searchModel.ts`、`model.ts` 仍输出 `14–165px` 的领域高度，领域单测不变；`SortingVisual`、`SearchVisual`、`VisualStage` 只把 `cell.height / 165` 映射为 `0–100%`，柱体绝对定位在真实高度的 `.bar-item` 轨道内。
- **桌面焦点态**：`guide-open` 时保留原 280/360px 上限；导学收起后 stage 高度确定，`.sorting-visual` 与 `.sorting-array-wrap` 填满剩余高度，数组轨最高 340/360px，普通柱高由 158–165px 提升到 217.7–323.3px（1440）。
- **移动端**：stage 高度由内容决定，百分比无法稳定解析，因此 390 下固定 `220px` 数组轨；柱高稳定为 184–202px，不再出现此前一次迭代的 10px 塌陷。
- **归并**：缓冲区面板由 46px 槽位收紧到 34px，仅压缩空白与内间距，`b0…b7`、值、写回来源和 8/8 计数仍完整可读；因此 1440 焦点态归并柱高 217.7px，仍高于其他辅助内容更多的基线 158px。
- **宽度不动**：实测 1440 主画布 674px、右栏 438px；1366 主画布 628px、右栏 410px，主画布没有被右栏过度挤压，所以没有改全局宽度比例，也没有缩小右栏字号。
- **1366 物理上限**：768 高度下 stage 内高仅 363px，播放器、key 卡、gap 元信息、legend 与归并缓冲区都保留后，数组轨最多 205–227px；焦点态柱高 169–191px（基线 158–165px），占比与柱高均未回退。该尺寸不追求与 1440 相同的 1.5× 增幅。

UIX-V01 证据：`docs/uix-v01/before/` 与 `docs/uix-v01/after/` 各 18 张截图（6 代表帧 × 3 尺寸）及 `measurements.json`；专项测试为 `e2e/uix01.spec.ts`。详细前后数值见 `docs/UIX_V01_REPORT.md`。

## 11. UX-01 / UX-01B / UX-02 导学与逐帧讲解（不新增算法）

UX-01 首次加入顶部可折叠导学；UX-01B 在同一数据模型上重排阅读层级与高度；UX-02 把右侧 `LessonPanel` 收敛为与当前帧同步的四段讲解，并把旧课程资料/步骤跳转折叠保留。三批都没有新增算法入口，也没有修改 Python/Trace 语义；这批改造发生时算法入口与课程数保持不变，后续 T3、T4、S1、S2、F1、F2、L1A、L1B 才把它们扩展到 34 个入口与 33 门课程。

| 导学来源 | 覆盖 | 内容 |
| --- | --- | --- |
| 原创精选 | Dijkstra、拓扑排序（Kahn）、强连通分量（Kosaraju），共 3 个 | 问题、核心思想与静态示意图、7～8 个真实执行步骤、必要前置、显式适用条件与关键限制、复杂度、常见错误、记忆重点；中英双语 |
| 课程派生 | 其余 30 门有课程的算法 | 复用 Lesson 的 `oneLiner / intuition / steps / prerequisites / complexity / commonMistakes`；步骤标题去掉课程自带序号，末步 `tip` 作为记忆重点；不另写算法事实 |
| 目录安全回退 | 斐波那契，共 1 个 | 只显示 `catalog.generated.ts` 已确认的简介、时间/空间复杂度与“步骤待补充”说明；不显示虚构步骤、前置或记忆口诀 |

UX-01 设计要点：

- **位置与折叠**：导学位于顶部算法标题栏与 `lab-primary` 之间；展开时页面自然向下滚动，收起后只保留原 `lab-head` 标题栏与“展开算法导学”按钮。折叠偏好以算法 id 数组存入 `localStorage`，切换未折叠算法默认展开，已折叠算法保持收起。
- **不碰播放器**：展开/收起只改组件可见性，不调用 `selectAlgo`、`stop`、`seek` 或重跑；E2E 在 Dijkstra 第 11/46 帧折叠再展开，帧号保持不变。
- **内容来源**：独立 `domain/guides` 只组装展示数据；课程派生与目录回退共用同一 `AlgorithmGuideContent`。不扩展 Lesson Schema，不复制教材长文或插图。
- **视觉**：复用 `lab-head`、既有 token、主题与响应式断点；导学区仅用静态 SVG 直觉图，没有第二套 Timeline/播放器。1440 两栏、390 单栏，页面无横向溢出。
- **范围**：只保证内置课程与目录算法的官方导学；不扩展任意用户代码自动生成导学，不进入 UX-02（右侧面板精简）、UX-03（左侧目录层级）或 UX-04（整页比例）。

UX-01 证据：`docs/ux01/guide-expanded-1440-light.png`、`guide-collapsed-1440-light.png`、`guide-expanded-390-light.png`。

### 11.1 UX-01B 排版与视觉层级（基线）

UX-01B 只调整导学区的排版、内容层级和静态示意图，不进入 UX-02，也不改左侧目录、右侧逐帧讲解、Trace、算法数量或整页网格。

- **三层阅读顺序**：`guide-hero` 先给“一句话理解 + 算法名”、问题与高对比核心思想（`coreHeadline`）；`guide-flow` 只给 3～5 个阶段（阶段名 + 一句话）；`guide-bottom` 给记忆重点与操作按钮。详细步骤、前置、复杂度解释、条件限制、常见错误和来源全部进入默认关闭的 `guide-details`，展开后完整保留。
- **三算法各自成立**：Dijkstra 4 阶段（初始化距离表 / 贪心选最近 / 松弛出边 / 重复并回退路径），Kahn 4 阶段（统计入度 / 零入度入队 / 出队删边减度 / 归零再入队并查环），Kosaraju 5 阶段（原图第一遍 DFS / 记录完成顺序 / 构造转置图 / 按逆序第二遍 DFS / 一棵 DFS 树 = 一个 SCC）。没有机械套用同一套四步文案。
- **课程派生规则**：课程本身恰有 3～5 个真实步骤时，`lessonStages` 把真实步骤转成阶段（标题去圈号，说明取首句）；6 步及以上课程不强制分组，`stages` 留空，在概览中显示一条紧凑回退说明，完整步骤仍在详情区。目录回退只显示简介、时间/空间与安全说明，不编造阶段或口诀。
- **高度与首屏**：静态示意图保留在核心思想右侧，仅作直觉提示，最大高度 138px；1440×900 下 Dijkstra 导学高度约 481px（Kahn/Kosaraju 约 513px），`lab-workbench` 顶部约 745/777px，动画顶部进入首屏。旧版导学则延伸出 900px 视口，动画完全不可见。
- **折叠与播放**：点击“开始看动画”或标题栏“收起算法导学”都只切换导学可见性；按算法折叠偏好沿用 `algoviz-ux01-guide-collapsed`，不调用 `seek/stop/selectAlgo`，不重置播放帧。
- **视觉**：复用现有 token 与按钮，不使用新 UI 库；没有大面积相同浅蓝卡片，阶段条、记忆条和详情区有明确层级；中英、Light/Dark、键盘与 390 单栏均覆盖。

UX-01B 证据：`docs/ux01b/before/`（4 张优化前）与 `docs/ux01b/after/`（7 张优化后，含 Dijkstra 展开/详情/收起、Kahn 展开、Kosaraju 展开、Kosaraju Dark、390 展开）。

### 11.2 UX-02 右侧逐帧讲解（当前）

UX-02 只改右侧 `Teaching Course` 的默认信息架构，不改顶部导学、左侧目录、整页网格、代码编辑器、变量区或 Trace 协议。

- **默认四项**：`current-step` 依次显示当前操作标题、算法阶段 pill、帧数 `n / total`、操作原因、真实状态变化和可选记忆重点。
- **变化来源**：新增纯函数 `buildFrameInsight`。Dijkstra / Kahn / Kosaraju / BST / AVL 读取强类型 `structure` 与 `lessonStepId`；其他算法优先比较当前帧/上一帧的 `state.values`，没有结构化变化时明确说明，不解析任意 message 猜测结构。
- **折叠保留**：课程简介、核心思想、复杂度、前置知识、常见错误、原始 message、变量进入 `课程资料`；完整步骤与 `lesson-step-<id>` 跳转进入 `步骤导航`。两个入口默认关闭，展开后仍用 `countStepFrames` / `findFrameForStep` 跳真实帧。
- **同步**：`currentEvent.lessonStepId` 是唯一同步键；没有第二套播放器或步骤计数器。前进、回退、拖动、跳帧均立即刷新四段内容。
- **高度**：1440×900 下 Dijkstra/Kahn 为 427px、Kosaraju 为 405px；改造前基线分别为 1153/964/1056px。390×844 下 Dijkstra 为 416px，页面无横向溢出。
- **视觉**：当前操作标题 20px（390 下 18px），四段用虚线分隔，状态变化用 before → after、箭头、标签表达；中英、Light/Dark/System 复用现有 token。

UX-02 证据：`docs/ux02/before/`（4 张基线）与 `docs/ux02/after/`（7 张本分支，含 Dijkstra 松弛/完成、Kahn 减度、Kosaraju 第二遍、BST 查找/390、Dijkstra 英文 Dark）。

## 12. 全量矩阵

| 分组 | 算法 | 课程 |
| --- | --- | --- |
| 排序 | 冒泡、直接插入、简单选择、快速、希尔、最大堆/堆排序、归并 | 冒泡、直接插入、简单选择、希尔、快速、归并、堆排序 |
| 查找 | 顺序查找、二分查找、链地址法散列表、线性探测散列表 | 顺序查找、二分查找、链地址法、线性探测 |
| 线性结构 | 栈、队列、单链表、双向链表、循环单链表 | 栈、队列、单链表、双向链表、循环单链表 |
| 图 | BFS、DFS、Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量 | BFS、DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量、强连通分量 |
| 树 | 二叉树中序遍历、哈夫曼树/哈夫曼编码、二叉搜索树查找/插入/删除、AVL 插入/删除/四种旋转 | 中序、哈夫曼、BST、AVL |
| 递归 | 阶乘、斐波那契 | 阶乘 |

### 覆盖小结

- 34 个算法入口；34 个真实 Python 入口。
- 33 门双语课程；仅 1 个暂无课程（斐波那契）。
- 导学覆盖：3 个原创精选、30 个课程派生、1 个目录安全回退；34 个入口全部有导学入口或明确“简介待补充”状态。
- 结构化可视化新增 `hash`（链地址法与线性探测共用同一个 `HashSnapshot` 判别联合）、`doubly-linked-list`、`circular-linked-list`（L1A 两个独立快照分支）与 `sequential-list`（L1B 独立快照分支，不复用排序数组快照）；不影响既有 `sorting/search/stack/queue/linked-list/graph/binary-tree/bst/avl/weighted-graph/floyd-matrix/bellman-table/prim-mst/kruskal-mst/topological-sort/critical-path/connected-components/kosaraju/max-heap/huffman` 等结构。
- T2 默认 AVL 预设刻意覆盖四种旋转、无需旋转的普通插入、叶子/单孩子/双孩子（根）/缺失键删除，以及一次叶子删除触发两个祖先 LR 双旋的连续重平衡。
- T3 默认 `heap` 预设覆盖四个操作：建堆 17 帧、插入 7 帧、删除堆顶 10 帧、堆排序 45 帧；另有空堆/单元素/重复值 62 帧边界夹具。堆排序默认预设的重复值验证相等不交换，最终 `[1,2,3,5,6,9,9]` 升序。
- T4 官方 `huffman` 预设 A5/B9/C12/D13/E16/F45 共 29 帧，最终 WPL=总位数=224、定长对比 300；等权 19 帧 WPL32、单字符 5 帧实际总位数 7、空输入 2 帧、重复频率 14 帧 WPL39，边界夹具共 40 帧。
- S1 官方 `selection` 40 帧、`insertion` 33 帧、`shell` 70 帧，合计 143 帧；7 类边界输入合计 578 帧；总计 721 帧全部通过 Schema 与独立 CPython 参考。
- S2 官方 `quick` 32 帧、`merge` 110 帧，合计 142 帧；7 类边界输入合计 516 帧；另加长随机/逆序等独立 CPython 输入，verifier 合计 923 帧全部通过 Schema 与独立参考；两者最终均为 `[1,2,3,4,5,7,8,9]`。
- F1 官方 `linear` 12 帧、`binary` 10 帧；独立 CPython 校验 143 帧 / 23 组输入，覆盖成功、失败、空数组、单元素、首尾命中、重复值、负数、中间目标、无序与重复值二分；`linear` 返回首次匹配，`binary` 返回任意合法匹配且无序输入只发 `invalid`。
- F2 官方 `hash-chain` 60 帧、`hash-probe` 182 帧，默认合计 242 帧；边界夹具 510 帧（链地址法 5 组 174 帧、线性探测 14 组 336 帧），共 752 帧全部通过 Schema 与独立 CPython 参考。
- L1A 官方 `doubly` 89 帧、`circular` 80 帧；四份 fixtures 合计 514 帧（双向 89+174、循环 80+171），独立 CPython 的 18 组场景共 516 帧全部通过；专项单测 14 项，真实 Pyodide E2E 3/3。
- L1B 官方 14 个预设共 84 帧（默认插入 8、中间删除 9、满表插入 3 等），21 个边界用例共 89 帧；独立 CPython 173 帧全部通过，fixtures 与专项单测 8 项通过，真实 Pyodide E2E 3/3。

## 13. 验证

本地复核环境：Windows + Microsoft Edge（Playwright `channel=msedge`）+ 真实 Pyodide 0.27.7。

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 通过；版本 `0.27.1-uix01`，1484 modules，`index-DXyl2egV.js` 1,926.73 kB（gzip 539.84 kB）、`monaco-setup-CzR1tBD-.js` 4,122.24 kB（gzip 1,066.59 kB）、`index-CX1f6qog.css` 220.02 kB（gzip 35.78 kB）、`monaco-setup-CX3ij07K.css` 186.75 kB（gzip 27.79 kB） |
| 全量单测 | ✅ 105 个文件、875 tests 全部通过 |
| F2 专项单测 | ✅ `hash.test.ts` 10 项、`hashVisual.test.tsx` 7 项、`hashLessons.test.ts` 7 项，合计 24 项 |
| F2 独立 Python 校验 | ✅ `scripts/verify_hash_python.py` 752/752 帧 / 19 组输入：官方 + 空表、单元素、负整数、表长 2/17、长链、重复键、删除头/中/尾、墓碑继续、墓碑复用、回绕、表满；逐命令对照独立引用模型 |
| F2 真实帧 fixtures | ✅ `hash-default-frames.json` 242 帧（链 60 + 探测 182）、`hash-edge-frames.json` 510 帧，全部通过 Zod `structureSchema` 与 `hashSnapshotSchema` |
| F2 真实 Pyodide E2E | ✅ 2/2：链地址法 60 帧、线性探测 182 帧；覆盖桶 1 冲突链、重复键、三种删除、三态槽、墓碑查找、回绕、表满、墓碑复用、前进/回退/跳帧、390 无横向溢出 |
| L1A 专项单测 | ✅ `advancedLinkedList.test.ts` 14 项：新旧 Schema 隔离、稳定 ID、双向正/反向、头/中/尾插入删除、循环 `tail.next=head`、单节点自环、删除最后节点为空、整圈遍历、未命中、模型边类型、中间帧真实指针不造假、回退与课程帧映射 |
| L1A 独立 Python 校验 | ✅ `scripts/verify_l1a_python.py` 18 组 / 516 帧：官方 + 空表、单节点正反向、头尾删除、中间插入删除、缺失值、删到空、重建、顺序场景；逐帧对照独立 CPython 参考模型，最终输出 `ALL L1A INDEPENDENT CHECKS PASS` |
| L1A 真实帧 fixtures | ✅ `l1a-doubly-default-frames.json` 89 帧、`l1a-circular-default-frames.json` 80 帧、`l1a-doubly-edge-frames.json` 174 帧、`l1a-circular-edge-frames.json` 171 帧；全部通过 Zod `structureSchema` 与两个专用 Schema |
| L1A 真实 Pyodide E2E | ✅ 3/3：双向 89 帧、循环 80 帧；覆盖空表/单节点、5 节点双向 prev/next、中间插入 `n2.prev=n4` 中间态、中间删除重连、正/反向遍历、整圈 5 帧无重复、命中/未命中、头/尾/中删除、删到空、单节点自环、回退跳帧、中英 Dark/Light、390 无页面横向溢出；生成 6 张截图 |
| L1B 专项单测 | ✅ `sequentialList.test.ts` 8 项：全部官方/边界帧通过 `structureSchema` 与专用 Schema；默认插入右移方向/`change`/`write`/终态；默认删除 `save`/左移/`clear`/终态；满表、空表、越界拒绝不改数据；空闲槽临时值不被当作有效元素；回退/跳帧后 length 与 occupied 槽同步；重复值/负数/单元素/初始溢出；focus 标志与 snapshot 同步 |
| L1B 独立 Python 校验 | ✅ `scripts/verify_seqlist_python.py` 官方 14 例 / 84 帧 + 边界 21 例 / 89 帧，合计 173 帧；逐帧对照独立 `Reference` 模型，检查 `length/capacity` 边界、槽位连续、完成帧区域不变量、`change.before/after` 与相邻帧一致、插入 `[4,3,2]→[5,4,3]` 与删除 `[2,3,4]→[1,2,3]` 方向、最终数组、满表/空表/越界拒绝、重复值/负数/单元素/初始溢出 |
| L1B 真实帧 fixtures | ✅ `seqlist-official-frames.json` 84 帧（14 预设）、`seqlist-edge-frames.json` 89 帧（21 边界），全部通过 Zod `structureSchema` 与 `sequentialListSnapshotSchema` |
| L1B 真实 Pyodide E2E | ✅ 3/3：默认 8 帧插入、9 帧删除、3 帧满表拒绝、2 帧空表拒绝；覆盖预设 pending→Run、`shift-right` 源 4→目标 5、`shift-left` 源 2→目标 1、`write`、`clear`、回退/跳帧同步、390 画布内滚动且页面无横向溢出；生成 4 张截图 |
| UIX-V01 像素测量 | ✅ `docs/uix-v01/before/measurements.json` 与 `after/measurements.json` 各 48 条（8 算法 × 3 尺寸 × 展开/收起）；1440 焦点态最大柱高由 158–165px 提升至 217.7–323.3px，1366 由 158–165px 提升至 169–191.3px，390 由 124.2–146.2px 提升至 184–202px；两种模式均无页面横向溢出 |
| UIX-V01 专项 E2E | ✅ `e2e/uix01.spec.ts` 3/3：1440/1366 × 8 算法检查数组高度、最大柱高、右栏宽度、柱/标签/标记无裁切重叠；390 检查固定 220px 轨与归并缓冲区 8 槽可读；播放/前后跳帧、中英、Light/Dark 均通过 |
| F1 专项单测 | ✅ `search.test.ts` 10 项、`searchVisual.test.tsx` 6 项、`searchLessons.test.ts` 5 项、`searchInsight.test.ts` 3 项，合计 24 项 |
| F1 独立 Python 校验 | ✅ `scripts/verify_search_python.py` 143/143 帧 / 23 组输入：官方 + 成功/失败、空数组、单元素、首尾命中、重复值、负数、中间目标、无序；linear 返回首次匹配，binary 返回任意合法匹配且无序只发 `invalid` |
| F1 真实帧 fixtures | ✅ `search-default-frames.json` 12+10=22 帧、`search-edge-frames.json` 121 帧，全部通过 Zod `structureSchema` 与 `searchSnapshotSchema` |
| F1 真实 Pyodide E2E | ✅ 2/2：linear 比较帧 p4=7、checked 4/6、第 11 帧 found 索引 4；binary 第 3 帧排除左半区 left=4/right=6、excluded=4、第 9 帧 found 索引 4；前后跳帧一致；无序输入 1 帧 invalid、警告可见、无 L/R/MID |
| 官方知识包 E2E | ✅ 2/2：`algolens-fib-basics` 安装/预览/课程/重载/卸载，以及课程 Python 示例真实 Pyodide 运行到 `init/combine/done`；包内 5 文件、归档 5,502 B |
| 全量 E2E | ✅ 149/149（既有 146 条基线 + UIX-V01 3 条；真实 Edge + 本地 Pyodide，约 10 分钟） |
| S1 相关单测 | ✅ `sorting.test.ts` 9 项、`sortingLessons.test.ts` 4 项、`SortingVisual.test.tsx` 4 项，合计 17 项；另 `registry/catalog/textbook/frameInsight/App/AlgorithmSidebar` 联动断言全部通过 |
| S1 独立 Python 校验 | ✅ `scripts/verify_sorting_python.py` 721/721 帧：3 算法 × 8 输入（官方 + 7 边界）；最终升序、多重集不变、选择每轮后缀最小与交换、插入前缀有序与真实右移、Shell gap 序列/lane/shift/gap=1 全局有序；稳定性身份样例验证插入稳定、选择与 Shell 不稳定 |
| S1 真实帧 fixtures | ✅ `sorting-default-frames.json` 143 帧 + `sorting-edge-frames.json` 578 帧，全部通过 Zod `structureSchema` 与 `sortingSnapshotSchema` |
| S2 独立 Python 校验 | ✅ `scripts/verify_divide_sort_python.py` 923/923 帧：quick/merge × 9 输入（官方 + 已排序、逆序、重复、负数、全相同、单元素、空数组、长随机）；逐帧检查 pivot 终位与左右不变量、递归边界、拆分中点、buffer 来源与写回目标、多重集、终帧有序；merge 稳定 records witness |
| S2 专项单测 | ✅ `sortingS2.test.ts` 6 项、`sortingS2Lessons.test.ts` 6 项、`sortingS2Visual.test.tsx` 4 项，合计 16 项；覆盖 Schema 语义、默认字段、课程 5 阶段、双语复杂度/稳定性、真实交换 chip 与缓冲区渲染 |
| S2 真实帧 fixtures | ✅ `sorting-s2-default-frames.json` 32+110=142 帧、`sorting-s2-edge-frames.json` 516 帧；quick 33/33/28/25/25/3/2、merge 75/73/77/77/59/4/2，全部通过 Zod |
| T3 独立 Python 校验 | ✅ `scripts/verify_heap_python.py` 16 个用例全部通过：4 个官方预设 + 12 个空堆/单元素/重复值边界；逐帧检查父子槽位、比较、交换、removed/replacement、已排序后缀、终帧结果，并用独立 `RefMaxHeap` 验证最终数组与堆性质 |
| UX-02 相关单测 | ✅ `frameInsight.test.ts` 9 项 + `LessonPanel.test.tsx` 18 项，合计 27 项通过；覆盖四算法真实结构变化/回退与无结构降级、默认四项、资料/步骤折叠、展开后旧数据仍在、步骤跳转同步 |
| UX-01B 相关单测 | ✅ `buildGuide.test.ts` 7 项 + `AlgorithmGuide.test.tsx` 7 项 + `useAlgorithmGuidePreferences.test.ts` 3 项，合计 17 项通过；覆盖三算法双语完整性、3～5 阶段、课程长步骤回退、目录安全回退、详情默认收起/展开、折叠不碰播放器与按算法偏好 |
| T1 相关单测 | ✅ `bst.test.ts` 14 项 + `bstLesson.test.ts` 3 项，合计 17 项通过 |
| T2 相关单测 | ✅ `avl.test.ts` 9 项 + `avlLesson.test.ts` 3 项，合计 12 项通过；覆盖 176 帧 Schema、稳定 ID、四种旋转/双旋两阶段、删除三案例、根变化、连续重平衡、回退视觉同步、非法快照拒绝与课程帧映射 |
| F1 前全量 E2E 基线 | ✅ 136/136（S1 134 条 + S2 2 条；F1 新增 2 条后为 138，F2 新增 2 条后为 140） |
| UX-02 E2E | ✅ 5/5：Dijkstra 默认四项/旧资料折叠/frame 27 relax `6→4`/frame 21 回退/frame 40 stale/frame 45 done 路径与权重/步骤导航跳转/资料展开；Kahn frame 5 入度 `2→1`、8 入队、9 出队、31 完成；Kosaraju 14/26/27/59；BST 5 比较 b5(40)、7 完成与 390 无溢出；英文 Dark 与 390 无溢出；生成 7 张 after 截图 |
| UX-01B E2E | ✅ 2/2：1440 导学三层/阶段数/详情默认收起/展开后 7 步与知识/高度与动画首屏、Dijkstra 第 11/46 帧折叠再展开不丢帧、键盘、三算法切换、按算法偏好、英文、Dark/System、目录安全回退；390 展开/详情/收起与无横向溢出；生成 7 张 after 截图 |
| T1 E2E | ✅ 1/1：真实 Pyodide 依次运行查找、插入、叶子/单孩子/双孩子删除；验证根 b1→b6、后继 b6 保留 ID、65 重连、前进/回退/跳帧同步、390 无页面横向溢出 |
| T2 E2E | ✅ 1/1：真实 Pyodide 运行 10 个官方预设；验证四种旋转、双旋 chip、删除三案例/根变化/连续重平衡、节点 ID 与 height/BF、前进/回退/跳帧、390 根居中与页面无横向溢出、英文切换；并生成 6 张截图 |
| T4 E2E | ✅ 2/2：官方 29 帧 `A5/B9` 弹出、`n7=14` 新父、真实回队、build-done 11 节点/WPL224、F 路径 `0`、最终 6 行码表与回退同步；equal/single/empty 边界、Dark、390 无页面横向溢出；生成 8 张截图 |
| S1 E2E | ✅ 3/3：真实 Pyodide 依次运行选择 40 帧、插入 33 帧、Shell 70 帧；验证候选/交换、key/真实右移重复值/写回、gap 序列/lane/shift/gap-done、前进回退跳帧、done 全排序与 390 无页面横向溢出；生成 6 张截图 |
| S2 E2E | ✅ 2/2：真实 Pyodide 执行 quick 32 帧与 merge 110 帧；验证 Lomuto pivot/真实交换/归位/递归/最终顺序、拆分/缓冲区写入/来源/写回/稳定终序、前进回退跳帧与 390 无页面横向溢出；生成 6 张截图 |
| 独立 Python 校验 | ✅ `verify_bst_python.py`、`verify_avl_python.py`、`verify_heap_python.py`、`verify_huffman_python.py`、`verify_sorting_python.py`、`verify_divide_sort_python.py`、`verify_search_python.py`、`verify_hash_python.py` 与 `verify_l1a_python.py` 全部通过；S1 721 帧 + S2 923 帧 + F1 143 帧 + F2 752 帧 + L1A 516 帧 |
| 回归 | ✅ BFS/DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量/SCC、二叉树遍历、栈/队列/链表、BST/AVL/最大堆/哈夫曼、S1 三排序、S2 两排序、F1 两查找、F2 链地址法/线性探测、L1A 双向/循环单链表与 L1B 顺序表在 149/149 全量 E2E 中通过 |
| 入口数量 | ✅ 34 个入口 / 33 门课程 / 34 个真实 Python；仅 `fib` 无内置课程，作为官方知识包的目录安全回退载体 |

## 14. 已知边界

- T1/T2/T3/T4/S1/UX-01B/UX-02 只保证官方 Python 示例、预设输入与内置导学/逐帧讲解内容；任意用户改写代码后的完整自动可视化、通用堆识别、通用哈夫曼识别或自动导学仍不在本批次范围。
- 哈夫曼只实现官方 `official/equal/single/empty` 预设与重复频率边界；不读取任意用户提交的频率表，不支持任意字符集、多叉哈夫曼、加权外部路径长度以外的变体。`MAX_SYMBOLS=16`、`MAX_NODES=33`、`MAX_CODE_BITS=16`。
- 哈夫曼编码不唯一：左右子树交换或等权节点采用不同合并顺序会得到不同合法码串，但最优 WPL 不变；页面展示的是真实 `(weight, order)` 确定性顺序下的一条合法编码，不应被当作唯一答案。
- 单字符场景理论 WPL=0，但实际采用 1 位码 `0`，因此页面同时展示 WPL=0、码长=1、总位数=`weight×1`；不要把理论 WPL 与传输位数混为一谈。
- 树画布固定 88×58 节点，不为塞入一屏而缩小；官方 6 叶最终树宽约 678 px、高约 474 px，在桌面和 390 px 下都通过画布内部滚动查看，页面本身不产生横向溢出。390 px 的码表改为零最小宽度，六列可完整显示。
- 最大堆只实现官方 `build/push/extract/sort` 四种操作；用户改写后的非标准堆操作、任意比较器或泛型堆不在 T3 范围。`MAX_HEAP_LIMITS.MAX_ELEMENTS = 24`，超过上限的输入不会得到教学 Trace。
- 堆排序的“原地 O(1)”只指算法自身辅助数组；本页额外保存每帧 Trace、稳定 ID 与展示快照，复杂度教学明确排除这部分存储。
- 堆排序是不稳定排序；重复值在相等父子比较时不交换，但相等元素的原相对次序不保证保留。
- S1 三种排序只实现官方 Python 源码与内置输入（含 7 类边界）；用户改写后的任意排序代码不会自动获得通用可视化，也不在 S1 范围。
- 选择排序的 6 次 `select-swap` 包含最后一轮单元素自交换；标准交换式选择排序每轮只交换一次，且不稳定，不能因为“只在轮末交换”就误认为稳定。
- 插入排序右移帧中的数组会短暂出现两个相同值，这是真实 `a[j+1]=a[j]` 的中间状态；key 单独保存在 key 卡片，直到 `insert-place` 才写回空位，不伪造“洞已填好”。
- 希尔排序本页只使用 `n//2` 反复减半的确定 gap 序列；复杂度取决于间隔序列，不能笼统声明所有 Shell Sort 都是 `O(n log n)`。标准 Shell Sort 通常不稳定，身份样例已验证 `2a/2b` 可在 gap=2 轮次被跨越。
- 390 px 下堆数组使用四列网格展示全部槽位，树画布保持在容器内，不制造页面级横向溢出；没有为 T3 改动顶部导学、左侧目录或右侧讲解布局。
- 双孩子删除采用“物理移植中序后继”策略，不采用“复制后继值再删除后继”的显示方式；因此同一节点 ID 会换位置，教学时不要把位置变化误读为新节点。
- 删除帧的 `current` 常为空（目标已摘除），路径/目标高亮因此清空；最终结果、摘除对象、指针与根变化仍由 `removedNode`、`oldRootId/rootId` 明确记录。
- `delete-cascade` 的删除分类是叶子删除，但会连续触发两个不同祖先的 LR 双旋；不能把它当成双孩子删除，也不能假设删除后至多旋转一次。
- 旋转帧在 `before/after` 之间允许 `|BF|>1`，但 `init/done` 必须满足 AVL 条件，Schema 和测试都按此校验。
- 390 px 下 BST/AVL 树画布在容器内横向滚动，AVL 会自动把根居中；页面本身无横向溢出，没有为了 T1/T2 调整页面主布局。
- UX-01B 的完整原创导学仍只有 Dijkstra、Kahn、Kosaraju 三个；其余 30 门课程直接复用 Lesson 结构，1 个无课程入口（`fib`）只显示目录简介与复杂度。课程只有 3～5 个真实步骤时才生成阶段条；6 步及以上只显示紧凑回退，完整步骤仍可展开。
- 导学静态示意图是教学示意，不是按真实输入计算出的图形；真实结构、指针与帧状态始终由下方 `VisualStage` 的 Trace 决定。
- UX-01B 不改变左侧目录、整页双栏比例或任一 Python/Trace 语义；UX-02 只更新右侧讲解面板，同样不改这些结构。左侧目录层级与整页高度比例已分别由 UX-03 / UX-04 改造完成，T3 没有再次调整。
- G2、G3、G4、T1、T2、T3、T4、S1、S2、F1、UX-01、UX-01B、UX-02 与 UX-03 均尚未合并 `main`；S1 从 T4 定稿 `dc3469c` 创建 `feat/s1-sorting`，S2 从 S1 最终记录 `ccc8553` 创建 `feat/s2-sorting`，F1 从 S2 最终记录 `1e17dfe` 创建 `feat/f1-searching`，F2 从 F1 最终记录创建，L1A 从 F2 最终记录 `27f7354` 创建 `feat/l1a-linked-lists`，L1B 从 L1A 最终记录 `4fab01b` 创建 `feat/l1b-sequential-list`；没有从落后的 `main`（`10f9a68`）开发，也没有重置或覆盖任何既有分支。
- S2 只实现 quick/merge 官方 Python 与内置输入（含 7 类边界）；快速排序固定 Lomuto 末尾 pivot，不提供 Hoare/随机 pivot/三路分区；归并固定自顶向下数组归并，不提供自底向上或原地归并。
- 归并写回是逐槽覆盖的真实中间状态：主数组在写回期间可能暂时出现重复或缺失槽位，缓冲区始终持有完整区间内容；`merge-range-done` 与 final 恢复完整多重集。教学时不能把写回中间帧当作已完成的排序结果。
- 快速排序标准原地 Lomuto 版本通常不稳定；课程与 hints 明确这一点，不用“分区只换边界”误判为稳定。归并只在 `a[left] <= a[right]` 时取左，才保持相等键的原有相对次序。
- 本页不把 Trace 帧数、焦点数组与展示快照计入算法空间复杂度；quick 的 `O(log n)`/`O(n)`、merge 的 `O(n)` 都只指算法自身递归栈/辅助数组。
- F1 交付时只实现 `linear` 顺序查找与 `binary` 迭代二分；F2 已补齐链地址法与线性探测，但仍未实现跳表、插值查找、指数查找、二次探测、双重散列或动态扩容等变体。
- 二分查找采用普通“找到任意一个匹配位置”语义；重复值不保证返回第一个或最后一个匹配，课程与逐帧讲解已明确。
- 无序输入不会被偷偷排序后仍称为“对原数组直接二分”；`BINARY_PYTHON` 只发 `invalid` 并与 `reason='unsorted'`，页面显示明确前提警告，不产生二分进度动画。
- F1 的可视化复用数组柱状基础，但查找状态是 `SearchVisualModel` 独立语义；顺序查找不表现成排序交换，二分查找的排除半区由真实 Python `left/right` 更新驱动，不由帧数模拟。
- 知识包不能覆盖已有内置课程；F1 后 `linear`/`binary` 均有内置课程，旧官方示例包已迁移为 `algolens-fib-basics`（`fib`），因此知识包示例不再使用这两个入口。
- F2 只实现固定表长 `m=7`、`h(key)=key%7` 的链地址法与线性探测官方示例及内置输入；不支持动态扩容/重新散列、二次探测、双重散列、复杂自定义散列函数或任意用户代码的通用哈希识别。
- 链地址法允许长链与 `n>m`，装载因子可大于 1；线性探测的 OCCUPIED 槽数不超过表长。两者都以真实元素数为准，不把 DELETED 计入元素数。
- 线性探测删除必须留下 DELETED；若把墓碑写回 EMPTY，会截断后续冲突元素的查找路径。查找只有遇到 EMPTY 才能证明键不存在，遇到 DELETED 必须继续。
- 重复键策略为“拒绝插入并返回 `duplicate`”，不覆盖旧值、不改变元素数；课程、Python、Schema、测试与教材描述保持一致。
- 平均/期望 `O(1)` 只在散列分布较均匀且装载因子受控时成立；本页不声称哈希查找总是 `O(1)`。最坏情况可能退化为 `O(n)`，线性探测还需说明聚集现象。
- 本批次不开发自动扩容、二次探测、双重散列、复杂自定义散列函数、AI/MCP、图论定理或页面布局调整；F2 完成后停止，不自动开始线性表或其他算法。
- F2 的 6 张证据截图均为 1440 Light；390 仅做无横向溢出断言，未额外保存移动端截图。
- F2 的真实 Pyodide E2E 只执行官方 Python 源码与内置输入；用户改写代码后的完整自动可视化不在本批次范围。
- L1A 只实现双向链表与循环单链表；顺序表、循环双向链表、静态链表和其他算法不在本批次范围，L1A 完成后停止，不自动进入 L1B。
- 旧单链表 `linkedListSnapshotSchema` 仍禁止环；循环关系由新增 `circular-linked-list` 分支表达，不能为了兼容循环链表而放宽旧 Schema。
- 双向链表“局部插入/删除 O(1)”的前提是已持有目标节点或其前驱引用；按值查找仍需 O(n)，不能把整条链上的所有操作都笼统写成 O(1)。
- 循环单链表有 head/tail 引用时，头插和尾插可以是 O(1)；删尾仍需 O(n) 找前驱，除非额外维护 prev 或双向结构。课程不宣称所有循环单链表操作都是 O(1)。
- L1A 的 `intermediate` 帧允许暂时出现“head 已更新、tail 尚未更新”“新节点已创建但尚未接入链”“被删节点仍持有旧 prev/next”等真实瞬态；只有 `complete` 帧强制不变量。因此截图和讲解必须区分中间帧与完成帧。
- 循环单链表遍历必须用“回到 head”或等价计数终止，不能判断 `node.next is None`；空表、单节点自环、删除最后节点后变为空表均有独立断言。
- 循环回环边与普通 next 边同时存在，但回环使用虚线曲线和独立文字标签，不只靠颜色区分；390 px 下画布内部滚动，不制造页面级横向溢出。
- L1A 的 6 张证据截图均为 1440 Light；中英与 Dark 通过 E2E 断言验证，未额外保存 Dark 截图。
- L1A 的真实 Pyodide E2E 只执行官方 Python 源码与内置输入；任意用户 Python 链表的自动识别与可视化不在本批次范围。
- L1B 只实现固定容量顺序表；`capacity` 在官方示例中最大 16，不开发动态扩容、缩容、重新分配或装载因子策略。`length <= capacity` 始终成立，插入前必须同时检查索引与剩余容量。
- 顺序表插入必须从最后一个有效元素向 `index` 倒序搬移，删除必须从 `index` 向尾部正序搬移；搬移方向不是视觉偏好，写反会覆盖尚未搬走的元素。
- 中间帧允许空闲槽位暂时持有真实复制值、也允许源与目标短暂出现相同值；视觉上这类槽位标为 `temporary` 而非有效元素。只有 `phase='complete'` 帧才要求 `[0,length)` 全非空、`[length,capacity)` 全空。
- `index=length` 是合法插入位置（尾插），但不是合法访问位置；访问、删除都要求 `0 <= index < length`。官方预设与课程均明确这一区别。
- L1B 复用现有数组 Trace、Timeline 与唯一播放器，新增的只是连续槽位画布；不创建第二套播放器，不重构 Schema，不修改顶部导学、教材目录层次或页面比例。
- L1B 的 4 张证据截图均为 1440 Light；中英、Dark、390 窄屏画布内滚动与页面无横向溢出由真实 Pyodide E2E 断言覆盖，未额外保存移动端或 Dark 截图。
- UIX-V01 只调整 `bubble/selection/insertion/shell/quick/merge/linear/binary` 共 8 个入口共享的数组/柱形画布；未新增算法，未改真实 Python Trace、执行帧、播放器数据结构、导学默认展开、右侧讲解文案、教材目录、其他树/图/链表渲染器，也未处理 UIX-02 阶段跳转。
- 柱形高度仍在渲染层换算，`sortingModel.ts` / `searchModel.ts` / `model.ts` 的 `14–165px` 领域数值及其单测未改；柱体、标记带与索引标签共用一个定位轨道，普通数组预留 18px、排序/查找预留 36px，避免柱顶与 key/CMP/L/R/MID 重叠。
- 1366×768 的绘图区受 768px 物理高度限制，保留播放器、key 卡、gap 元信息、legend 与归并缓冲区后，数组轨为 205–227px；本批优先保证语义完整与无裁切，不强行追平 1440 的 1.5× 柱高。
- 390×844 使用固定 220px 数组轨，因为移动端 stage 高度由内容决定、百分比轨道无法稳定解析；该尺寸下所有页面级横向溢出为 0，归并缓冲区槽位最小高度 34px。
- UIX-V01 未修改主画布与右栏的宽度比例；1440 实测右栏 437.8px、1366 实测 409.6px，均保持原有可读宽度。
- `BST_PYTHON` / `AVL_PYTHON` 的 `line=` 是教学用近似源码行号，Monaco 实际行号以编辑器为准。
- AVL 节点上的 ROOT/LEAF/当前角色徽标在 T2 中隐藏，避免与 height/BF 徽标叠字；当前节点由顶部指标与描边表达。

## 15. 下一批次（不在本批次执行）

UIX-V01 已完成并停止。本批次只做 8 个排序/查找入口的共享数组画布空间优化，未新增算法，未改真实 Python Trace、算法帧、播放器、导学默认展开策略、右侧讲解文案、教材目录或其他渲染器，也未实施 UIX-02 阶段跳转。后续如继续 UIX-02，应另开独立分支与独立验收，不复用本批测量结论作为 UI 功能验收。
