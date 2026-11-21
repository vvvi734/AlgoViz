# T1 交付报告：二叉搜索树 BST（查找 + 插入 + 删除）

日期：2026-11-18  
分支：`feat/t1-bst`  
基线：从包含 G1～G4 的 `94e34fa` 创建；`main` 仍为 `1dcdf76`。本批次没有修改 `main`，也没有从缺少近期算法的旧 `main` 开发。

## 1. 实现内容

### 1.1 独立 BST 快照与稳定节点 ID

- 新增 `bstSnapshotSchema`（`kind:'bst'`），作为 `structureSchema` union 第 14 个分支；没有把查找/插入/删除塞进 `binary-tree` 遍历快照，避免遍历模式与删除迁移字段互相污染。
- 快照记录 `preset`、`command`、`operation`、`deleteCase`、`targetValue`、`rootId`、`nodes[{id,value,leftId,rightId}]`、`currentNodeId`、`pathIds`、`visitedIds`、`inorderIds`、`targetNodeId`、`nextNodeId`、`parentId`、`side`、`insertedId`、`successorId`、`replacementId`、`removedNode`、`oldRootId`、`result`。
- 节点是真实 Python `TreeNode` 对象，创建时分配 `b1…b8` 教学 ID；删除、移植、回退和跳帧都不重命名幸存节点。父子关系只读 `leftId/rightId`，不从画布坐标推断。
- Schema 校验：节点 ID 唯一、根唯一、无多父、无环、全部可达；`inorderIds` 严格递增且等于真实中序；`pathIds` 从根沿真实 `left/right` 到达 current；`go-left/go-right` 的 `nextNodeId` 必须是 current 的真实孩子；`attach` 的父/side 必须指向真实新节点；`removedNode` 不得仍在树中，`replacementId` 必须仍在树中；`oldRootId` 必须是被删旧根；command 与 operation 一一对应。

### 1.2 真实 Python 三操作

- `src/domain/algorithms/bstExamples.ts` 中 `BST_PYTHON` 约 349 行；程序读取 `{preset, operation, tree, target}`，按输入顺序执行真实 BST 插入建树，再按 `OPERATION` 分支执行查找、插入或删除。所有帧由同一条 Python 源产生。
- 操作帧 16 种：`init / inspect / go-left / go-right / found / not-found / attach / locate / delete-leaf / delete-one / successor-search / successor-found / successor-detach / transplant / duplicate / done`。
- **查找**：逐帧比较一个真实节点；小于走左、大于走右；`go-left/go-right` 带 `nextNodeId`；成功帧记录 `targetNodeId`，失败帧可带最后比较节点，空树 current/path 为空。
- **插入**：真实查找后创建 `TreeNode` 并修改父节点 `left/right`；官方预设使用唯一键，重复插入明确拒绝且树不变。默认插入 35 到 40 左侧，新节点 `b8`。
- **删除叶子**：删除 20，父节点 `b2.left` 置空，`removedNode` 记录 `b4=20`、parent `b2`、side `left`。
- **删除单孩子**：删除 60，只有右孩子 65；`b3.left` 改为 `b8=65`，60 真正离开树。
- **删除双孩子（中序后继物理移植）**：默认删除根 50。后继 `b6=60` 先搜索、再离开原位置（65 接回 `b3=70` 左侧），随后保留自己的 ID 移植为根；`b1=50` 被真正摘除，`oldRootId=b1`、`rootId=b6`。不是“复制后继值再删后继”，也不让节点从屏幕凭空消失。

### 1.3 官方示例与边界

- 6 个官方预设共 **53 帧**：`find-success` 8、`find-missing` 9、`insert` 9、`delete-leaf` 9、`delete-one` 9、`delete-two` 9。
- 8 个边界场景共 **44 帧**：空树查找、单点查找、空树插入、重复插入、空树删除、删除不存在键、根单孩子删除、根双孩子删除。
- 默认输入 `find-success`：树 `[50,30,70,20,40,60,80]`，目标 40，路径 50→30→40，成功。
- 默认树稳定 ID：`b1=50, b2=30, b3=70, b4=20, b5=40, b6=60, b7=80`；扩展树追加 `b8=65`。

### 1.4 可视化、课程与目录

- `BstVisual.tsx` 复用 `layoutBinaryTree`、`tree-*` 几何/CSS 与唯一播放器；新增操作/命令栏、目标键、结果、ROOT、删除三案例、比较路径、已比较链、中序序列、节点标签（当前/目标/后继/新节点/root/leaf）、已摘除对象、父指针变化、根指针变化。
- 根指针变化同时显示稳定 ID 与值（如 `b1 · 50 → b6 · 60`）；ROOT 指标显示 `b6 · 60`。
- `BstPicker.tsx` 提供 6 个官方示例；选择只改输入并显示 pending，实际动画来自 Python 快照 `preset`，不伪造未运行的帧。
- `bstLesson.ts` 为 `binary-search-tree-search-insert-delete`，14 步，stepId 与 Python `lesson_step` 完全对应；覆盖左小右大、查找/插入路径、重复键拒绝、删除三情况、中序后继、物理移植、中序有序、平均 O(log n)/最坏 O(n)、O(h) 空间、退化链表风险、常见错误与记忆重点。
- 目录入口从 23 增至 24，课程从 17 增至 18；BST 的 JS 入口只提示在 Python 模式运行。
- `t1.css` 只处理 BST 面板与 980/560 断点单列；没有第二套播放器，也没有改造页面主布局。

## 2. 测试结果

| 门禁 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 通过；1420 modules；`index-DTQmGoK0.js` 1,147.83 kB / gzip 328.65 kB；`index-D5VyLHfv.css` 116.40 kB / gzip 20.40 kB |
| 全量单测 | ✅ **80 个测试文件 / 663 项全部通过** |
| T1 专项单测 | ✅ **17 项通过**：`bst.test.ts` 14 项 + `bstLesson.test.ts` 3 项 |
| 全量 E2E | ✅ **94/94 通过**，真实 Microsoft Edge + 真实 Pyodide 0.27.7，6.2m |
| T1 E2E | ✅ **1/1 通过**，11.2s：查找/插入/叶子/单孩子/双孩子删除、根 b1→b6、后继 b6 保留 ID、65 重连、回退与跳帧、390 无页面横向溢出、双语切换 |
| 独立 CPython 校验 | ✅ `python scripts/verify_bst_python.py`：6 个官方预设 + 8 个边界场景全部通过；`find-success` 8 帧、`find-missing` 9 帧、`find-empty` 3 帧、`find-single` 4 帧；每帧前序/中序/父子引用、无重复 ID、无悬空引用、稳定 ID 均校验；删除终态与独立 `RefBST` 一致；349 source lines |
| 目录同步 | ✅ `npm run sync:legacy`：24 个算法；`bst` 生成 1 帧占位提示 |
| 回归 | ✅ BFS/DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量/SCC、二叉树遍历、栈/队列/链表在 94/94 全量 E2E 中通过 |

T1 单测覆盖重点：

- 97 帧全部通过 `structureSchema` 与 `bstSnapshotSchema`；查找存在/不存在、路径值与中序有序。
- 插入 `b8`、父指针 `b5.left=b8`、稳定 ID；重复插入拒绝且树不变。
- 删除叶子 `b4`、单孩子 `b6`（`b3.left=b8`）、双孩子根 `b1`（后继 `b6` 移植为根，65 接回 70 左侧）。
- 根叶子/根单孩子删除的 `oldRootId/rootId`；空树/单点/删除不存在键。
- `successor-detach`/`transplant` 跳帧时 active/path/removed/root 同步。
- 拒绝重复值、悬空 root、错误 inorder、被删节点仍挂在树上、replacement 不存在。

## 3. 截图位置

全部为真实 Microsoft Edge + 真实 Pyodide 运行截图，位于 `docs/t1/`：

| 文件 | 内容 |
| --- | --- |
| `docs/t1/bst-find-found-1440-light.png` | 查找 40 成功，第 7/8 帧，路径 50→30→40，1440 Light |
| `docs/t1/bst-insert-attach-1440-light.png` | 插入 35 第 8/9 帧，`b5.left → b8=35`，新节点标记，1440 Light |
| `docs/t1/bst-delete-leaf-1440-light.png` | 删除叶子 20 第 8/9 帧，`b4` 消失，`b2.left → ∅`，1440 Light |
| `docs/t1/bst-delete-one-1440-light.png` | 删除单孩子 60 第 8/9 帧，`b6` 消失，`b3.left → b8=65`，1440 Light |
| `docs/t1/bst-delete-two-successor-1440-light.png` | 双孩子删除第 6/9 帧，后继 `b6=60` 被标记，路径 50→70→60，1440 Light |
| `docs/t1/bst-delete-two-detach-1440-light.png` | 后继离开原位置第 7/9 帧，`b6` 已摘除，65 接回 `b3.left`，1440 Light |
| `docs/t1/bst-delete-two-transplant-1440-light.png` | 后继接入根第 8/9 帧，根 `b1 · 50 → b6 · 60`，`b1` 被摘除，1440 Light |
| `docs/t1/bst-delete-two-done-390-light.png` | 双孩子完成第 9/9 帧，390 单列；树画布内部可横向滚动，页面无横向溢出 |

## 4. 已知限制

- 本批次只保证官方 Python 示例与预设输入的完整动画；任意用户改代码后自动生成专属 BST 动画不在范围内。
- 双孩子官方样例删除根 50；未额外提供“非根双孩子”预设。三种删除情况与根变化均已覆盖，但非根双孩子的父指针变化不在官方样例中单独演示。
- 删除帧的 `current` 常为空（目标已摘除），路径/目标高亮因此清空；摘除对象、父/根指针变化和最终树仍由 `removedNode`、`oldRootId/rootId` 明确记录。
- `BST_PYTHON` 的 `line=` 是教学用近似源码行号，Monaco 实际行号以编辑器为准。
- 390px 下 BST 树画布在容器内横向滚动，截图只显示当前滚动位置；页面本身无横向溢出，未为 T1 改造页面主布局。
- 单门 BST 课程包含 find/insert/delete 专属步骤；当前 trace 只激活本操作对应的步骤，其他操作步骤显示 0 帧/禁用。
- G2、G3、G4 与 T1 均尚未合并 `main`；T1 从 `94e34fa` 创建，不从旧 `main` 开发。

## 5. Git 提交

- T1 实现、测试与截图：`acf7f51` `feat(t1): add binary search tree search, insert and delete visualizations`
- T1 文档、覆盖清单与版本：本报告所在提交 `docs(t1): record coverage, architecture and delivery report`
- 分支：`feat/t1-bst`，推送到 `origin/feat/t1-bst`；`main` 未修改。
