# Stage 7D 报告：二叉树专属可视化

- 版本：`0.9.0-phase7d`
- 分支：`main`
- 起始 HEAD：`7e9abef docs(stage7c): backfill git hashes in report`
- 功能与文档提交：``648490a``
- 远端：`https://gitee.com/vvvi734/algolens.git`
- 门禁：**458 / 458 单测**、**39 / 39 真实浏览器 E2E**、**106 张真实截图**
- 唯一树算法条目：`inorder`（中文名“二叉树遍历 / Binary tree traversal”）
- 三种模式：`preorder` / `inorder` / `postorder`

Stage 7D 的目标不是再画一棵“看起来像树”的装饰图，而是让同一棵真实 Python 二叉树在三种递归顺序下运行，并把树节点、根到当前节点路径、已访问顺序、真实 `@tracked` 调用栈、变量、Monaco 行和教学步骤固定在同一帧上。所有树帧都来自真实 Pyodide 执行，没有预写答案数组、没有从 `message` 猜操作、没有按数组下标推断节点身份。

---

## A. 验收矩阵（28 项）

| # | 验收条件 | 状态 | 证据 |
| --- | --- | --- | --- |
| 1 | 真实 Python 二叉树节点存在 | ✅ | `TREE_PYTHON` 的 `class TreeNode` 创建 `n1…n7`；E2E 读取 7 个 `tree-node`。 |
| 2 | 左右引用关系真实 | ✅ | `node.left = by_index[left_index]` / `node.right = ...`；E2E 断言 6 条边 `n1-n2, n1-n3, n2-n4, n2-n5, n3-n6, n3-n7`。 |
| 3 | 使用稳定节点 ID | ✅ | `node_id` 为 `n1…n7`，每帧转换为 `leftId/rightId`；不使用 Python `id()`；同值节点仍按 ID 区分（E2E `[7,7,7]`）。 |
| 4 | Tree Schema 完成 | ✅ | `binaryTreeSnapshotSchema` 三分支 union、40 节点上限、唯一 ID、引用/根/父/环/可达性/visited/path/operation 校验；19 项树单测。 |
| 5 | 树布局正确 | ✅ | 根在顶部、左孩子左下、右孩子右下；同层不重叠、常规树边不交叉；E2E 用真实 `boundingBox` 断言坐标方向；纯布局 5 项测试。 |
| 6 | 前序真实执行 | ✅ | `MODE == "preorder"` 分支在左递归前 `visit_node`；E2E 运行真实 30 帧。 |
| 7 | 中序真实执行 | ✅ | `MODE == "inorder"` 分支在左右递归之间 `visit_node`；E2E 帧 5/7/8/14/28。 |
| 8 | 后序真实执行 | ✅ | `MODE == "postorder"` 分支在左右递归之后 `visit_node`；E2E 帧 6/12/24/26。 |
| 9 | 三种访问序列正确 | ✅ | 前序 `4,2,1,3,6,5,7`；中序 `1,2,3,4,5,6,7`；后序 `1,3,2,5,7,6,4`；均来自 `VISITED`。 |
| 10 | 当前节点高亮准确 | ✅ | `data-active="true"` + 边框；`enter` 可高亮但无访问序号；E2E 在帧 5 断言 `n4`。 |
| 11 | 已访问节点状态正确 | ✅ | `data-visited` + 圆形序号；插叙帧 5 为 `[]`，帧 8 为 `n4,n2`；后序帧 26 为全部 7 个。 |
| 12 | 递归调用路径可信 | ✅ | `PATH.append/pop` 生成 `pathIds`；Schema 要求从 root 连续到 current；路径条与 `data-current-id`。 |
| 13 | 调用栈来自真实 `@tracked` | ✅ | 帧 5 有 `f1/f2/f3` 三层；帧 8 回到 2 层；`@tracked` 仍是唯一追踪源，没有第二套播放器。 |
| 14 | Monaco 源码行同步 | ✅ | `visit` 行 130/135/140、`init` 142、`order` 146、`done` 147；E2E 展开源码快照后断言 `.lineno = 130`。 |
| 15 | 变量同步 | ✅ | 帧 5 变量面板含 `node/node_id/value/mode/path/visited/depth`；`variables-scope` 显示 `traverse · 深度 2`。 |
| 16 | LessonPanel 同步 | ✅ | 9 个 stepId 与 Python 一致；E2E 断言帧 5 `enter`、帧 7 `return`、帧 8 `visit`、帧 28 `order`、帧 29 `done`。 |
| 17 | 时间轴回退准确 | ✅ | 帧 8 → 帧 5 后，树当前节点、visited、调用栈层数、变量一起恢复；E2E 显式回退断言。 |
| 18 | 任意跳帧准确 | ✅ | 所有帧为完整快照；`setFrame` 直接跳 2/5/7/8/12/14/24/26/28/29 均通过；坐标只由快照决定。 |
| 19 | 算法切换没有旧状态 | ✅ | 切栈后 `tree-visual` 消失、`stack-item` 出现；切模式保留旧 Trace 并显示 pending，Run 后从帧 0 重新开始。 |
| 20 | 双语课程完整 | ✅ | 课程标题、一句话、overview、直觉、前置、复杂度、9 步、6 条常见错误均有中英文；E2E 切换英文后步骤标题变为 `Visit a node`。 |
| 21 | Light / Dark / System 正常 | ✅ | 106 张截图覆盖 light/dark；Stage 7A/7C 三态主题 E2E 继续通过。 |
| 22 | 手机和桌面布局正常 | ✅ | 1440/1024/390 截图；1024 单列、390 无页面横向溢出、树画布内部滑动提示可见；E2E `scrollWidth <= clientWidth + 1`。 |
| 23 | Reduced Motion 有效 | ✅ | `prefers-reduced-motion` 关闭节点/边/按钮过渡；E2E 模拟后帧 14 当前 `n1`、访问序列 `n4,n2,n5,n1`、消息 `visit n1` 不变。 |
| 24 | 旧算法与旧数据结构不回归 | ✅ | Stack/Queue/LinkedList/legacy 14 算法快照、Stage 3 递归调用栈、Stage 7A/7B/7C E2E 全部通过。 |
| 25 | typecheck、测试和 build 成功 | ✅ | 根 `tsc --noEmit`、MCP/AI typecheck、458 单测、`npm run build` 均通过。 |
| 26 | 真实浏览器 E2E 成功 | ✅ | 39/39（Edge + 真实 Pyodide Worker + 真实 Trace；本轮 E2E 的 Pyodide 静态文件由本地 npm 包提供，执行链路未 Mock）。 |
| 27 | MCP 与 AI Gateway 回归成功 | ✅ | 单测内 MCP 20/20、AI Gateway 26/26；MCP stdio 冒烟 9 项通过、1 项按配置跳过；两者 typecheck 通过。 |
| 28 | 真实截图、文档与 Git 完整 | ✅ | `docs/stage7d/after/` 106 张真实运行截图；本报告；正常提交与推送，记录见 J 节。 |

---

## B. BinaryTree Schema

`src/domain/trace/schema.ts` 在原有 `structureSchema` 中加入第三分支，Stack、Queue、LinkedList 与 legacy 无 structure 的 Trace 保持兼容。

```ts
{
  kind: 'binary-tree',
  traversal: 'preorder' | 'inorder' | 'postorder',
  operation: 'init' | 'enter' | 'visit' | 'left' | 'right' | 'return' | 'done',
  rootId: string | null,
  nodes: Array<{ id: string; value: JsonValue; leftId: string | null; rightId: string | null }>,
  currentNodeId: string | null,
  visitedIds: string[],
  pathIds: string[]
}
```

安全规则：

- 节点最多 **40** 个；节点 ID 必须唯一；`value` 必须是可 JSON 序列化的受限值。
- `leftId/rightId` 只能指向存在的节点或 `null`；不允许悬空引用。
- 非空树必须有真实存在的 `rootId`；空树必须是 `rootId: null, nodes: []`。
- 每个非根节点最多一个父节点；根节点不能有父节点；从根做一次遍历时检测环。
- 所有节点必须从根可达；不可达节点直接拒绝，不半渲染。
- `visitedIds` 只能引用真实节点，且不能重复；`visit` 帧的 `currentNodeId` 必须已经在 `visitedIds` 中。
- `pathIds` 从 `rootId` 开始，每一步都必须沿真实 `left/right` 边走，最后必须等于 `currentNodeId`。
- `init/done` 的 `currentNodeId` 必须为 `null` 且路径为空；其他操作的 current 非空且路径非空。
- `left`/`right` 必须确有对应孩子；空孩子不会伪造边，也不会产生递归帧。
- Schema 解析失败由 adapter 整块丢弃该 `structure`，保留原 `state`，页面安全降级。
- 空树、单节点、只有左孩子、只有右孩子、不完整二叉树、同值不同 ID 全部合法。

---

## C. Tree Layout

`src/domain/visualization/binaryTreeLayout.ts` 是 DOM/React 无关的纯函数：

```ts
layoutBinaryTree(nodes, rootId) -> { nodes, edges, width, height, rootId }
```

- 用**迭代中序**为每个节点分配列：左子树的所有列都在父节点左侧，右子树都在右侧。
- 用**深度**分配行：根 `depth = 0` 在最上层。
- 节点中心坐标：`x = 32 + 32 + column * 100 = 64 + 100·column`；`y = 24 + 26 + depth * 88 = 50 + 88·depth`。
- 画布尺寸：`width = 64 + maxColumn * 100`；`height = 100 + maxDepth * 88`。
- 边坐标为父节点底部到子节点顶部，带 SVG 箭头；`side` 为真实 `left/right`。
- 迭代深度遍历 + `seen`/`inStack`/`guard` 防护；空树、缺失 root 返回空布局，环不会导致 `RangeError`。
- 不可达节点不进入布局；正常 7 节点树 6 条边。
- 同一快照坐标完全确定，切帧不会让节点跳位。
- 响应式：画布在容器内自动缩小到 **75%**，让 7 节点树在 1440 双列布局中完整可见；更宽的树在 `.tree-scroller` 内部横向滚动，页面本身不产生横向溢出；390 显示“左右滑动查看整棵树”提示。

测试覆盖：根/左/右方向、同层不重叠、常规树边不交叉、左链/右链、空/缺失 root/环、坐标稳定性、同值不同 ID、模型按引用而非数组顺序、40 上限。

---

## D. Python 实际执行结果

真实源码 `TREE_PYTHON` 位于 `src/domain/algorithms/treeTraversalExamples.ts`，`STRUCTURE_PYTHON.inorder = TREE_PYTHON`。输入兼容旧数组（默认中序）和 `{mode, tree}`；非法 mode 回退 `inorder`。

### 前序 preorder（30 帧）

访问顺序：`4 → 2 → 1 → 3 → 6 → 5 → 7`

代表帧：

| 帧 | 操作 | 当前节点 | visitedIds | Python 显示行 |
| --- | --- | --- | --- | --- |
| 2 | visit | n1 / 4 | n1 | 130 |
| 8 | visit | n4 / 1 | n1,n2,n4 | 130 |
| 12 | visit | n5 / 3 | n1,n2,n4,n5 | 130 |
| 17 | visit | n3 / 6 | +n3 | 130 |
| 24 | visit | n7 / 7 | 全部 7 个 | 130 |
| 28 | order | — | 全部 7 个 | 146 |

E2E 在帧 2 断言教学步骤 `visit`、消息 `visit n1`、Monaco 活动行存在；帧 8 断言 visited `n1,n2,n4` 与源码行 130；帧 28 断言 7 个访问序号。

### 中序 inorder（30 帧）

访问顺序：`1 → 2 → 3 → 4 → 5 → 6 → 7`

完整关键帧：

| 帧 | 操作 | 说明 |
| --- | --- | --- |
| 0 | init | 建树完成，无当前节点、无访问 |
| 1 | enter root | 第一层 `n1`，路径 `n1` |
| 2 | left | `n1 → n2`，真实左孩子边高亮 |
| 3 | enter | 第二层 `n2` |
| 4 | left | `n2 → n4` |
| 5 | enter | 第三层 `n4`，路径 `n1,n2,n4`，visited `[]` |
| 6 | visit | `n4 = 1`，第一个访问序号 |
| 7 | return | `n4` 返回，仍显示 n4，路径尚未弹出 |
| 8 | visit | 回到 `n2`，访问 `n2 = 2`，visited `n4,n2` |
| 9 | right | `n2 → n5` |
| 10 | enter | `n5` |
| 11 | visit | `n5 = 3` |
| 12 | return | `n5` |
| 13 | return | `n2` |
| 14 | visit | 回到 `n1`，访问 `4`，visited `n4,n2,n5,n1` |
| 15 | right | `n1 → n3` |
| 16 | enter | `n3` |
| 17 | left | `n3 → n6` |
| 18 | enter | `n6` |
| 19 | visit | `n6 = 5` |
| 20 | return | `n6` |
| 21 | visit | 回到 `n3`，访问 `6` |
| 22 | right | `n3 → n7` |
| 23 | enter | `n7` |
| 24 | visit | `n7 = 7` |
| 25 | return | `n7` |
| 26 | return | `n3` |
| 27 | return | `n1` |
| 28 | order | 访问顺序 `1,2,3,4,5,6,7` |
| 29 | done | 结束，无当前节点 |

E2E 验证帧 5 三层调用栈、变量 `node_id=n4 / path / depth=2`；帧 7 `return`；帧 8 `visit` 且栈回到 2 层；回退到帧 5 后 visited 恢复为 `[]`、栈恢复 3 层。

### 后序 postorder（30 帧）

访问顺序：`1 → 3 → 2 → 5 → 7 → 6 → 4`

代表帧：

| 帧 | 操作 | 当前节点 | visitedIds | 关键含义 |
| --- | --- | --- | --- | --- |
| 6 | visit | n4 / 1 | n4 | 左子树最左叶 |
| 7 | return | n4 | n4 | 返回 n2 |
| 12 | visit | n2 / 2 | n4,n5,n2 | 左右孩子都完成后才访问父 |
| 24 | visit | n3 / 6 | +n6,n7,n3 | 右子树完成 |
| 26 | visit | n1 / 4 | 全部 7 个 | 根最后访问 |
| 28 | order | — | 全部 7 个 | `1,3,2,5,7,6,4` |

E2E 断言帧 12 `n2` 的 `data-order=3`，证明父节点在两个孩子之后；帧 26 根最后访问。

---

## E. 递归调用栈

- `@tracked(enter_hook=tree_enter, return_hook=tree_return)` 仍由 Stage 3 唯一追踪器发出调用/返回帧；`frameId` 为 `f1/f2/f3…`，树节点为 `n1…n7`，两套身份分离。
- 帧 5 `enter n4`：`f1 traverse(n1)` → `f2 traverse(n2)` → `f3 traverse(n4)`，三层；最内层变量面板显示 `node=TreeNode(n4=1)`、`node_id=n4`、`value=1`、`mode=inorder`、`path=["n1","n2","n4"]`、`visited=[]`、`depth=2`；作用域显示 `traverse · 深度 2`。
- 帧 7 `return n4`：返回帧在弹出前生成，仍保留 n4 与完整路径；调用栈标记 returning。
- 帧 8 `visit n2`：n4 已弹出，调用栈回到 `f1/f2` 两层；树当前节点回到 n2，访问序号显示 n4、n2。
- 后序帧 12：左子树两个叶子都已完成，`f1/f2` 两层，n2 仍未被访问，直到帧 12 才 `visit`。
- 帧 29 `done`：调用栈为空，树无当前节点；回退时三者一起恢复，不会“树在深层、栈已回上层”。
- Python 端修复：`enter_hook`/`return_hook` 返回的 `lessonStepId` 现在会被 `_emit_call` / `_emit_return` 透传；`frame['locals']` 在 `callStack` 快照前更新，保证顶层帧变量面板能看到 `node_id/value/path/depth`。两项均有单测。

---

## F. 教学课程

- Lesson ID：`binary-tree-traversal-basics`
- algorithmId：`inorder`
- contentVersion：`1.0.0`
- 注册：`BUNDLED` 第 6 门课程，课程数 `6 / 14`
- 中英文：标题、一句话、overview、直觉、前置、复杂度、9 步说明/tip、6 条常见错误全部双语
- 教学步骤：

| stepId | 中文标题 | 对应真实帧 |
| --- | --- | --- |
| `init` | ① 从层序数组建出真实树 | 0 |
| `root` | ② 根节点：递归的入口 | 1 |
| `enter` | ③ 进入子节点：压入新的函数帧 | 3/5/… |
| `left` | ④ 进入左子树：先看 left | 2/4/… |
| `visit` | ⑤ 访问节点：把值加入真实访问序列 | 6/8/… |
| `right` | ⑥ 进入右子树：左分支处理完之后 | 9/15/… |
| `return` | ⑦ 返回上一层：弹出真实调用帧 | 7/12/… |
| `order` | ⑧ 三种遍历的最终顺序 | 28 |
| `done` | ⑨ 复杂度与常见错误 | 29 |

课程明确：进入 ≠ 访问；节点 ID ≠ frameId；空孩子不递归；**中序有序只对 BST 成立**，普通二叉树不保证有序；并补充叶子、深度（根为 0）、树高（本例 3）的定义。

---

## G. 视觉截图

目录：`docs/stage7d/after/`，共 **106 张**，全部来自真实应用运行。

- 视口：1440×900、1024×768、390×844
- 主题：light、dark
- 状态：中序 6、前序 5、后序 3、空树 1、单节点 1、同值 1 = 17 状态 × 6 = 102 张
- 递归栈专项：1440/390 × light/dark = 4 张

代表截图：

| 画面 | 文件 |
| --- | --- |
| 初始二叉树 | [`tree-inorder-init-1440-light.png`](./stage7d/after/tree-inorder-init-1440-light.png) |
| 中序三层调用栈 | [`tree-inorder-deep-call-stack-1440-light.png`](./stage7d/after/tree-inorder-deep-call-stack-1440-light.png) |
| 中序最左访问 | [`tree-inorder-leftmost-visit-390-light.png`](./stage7d/after/tree-inorder-leftmost-visit-390-light.png) |
| 中序返回父节点 | [`tree-inorder-leftmost-return-1024-dark.png`](./stage7d/after/tree-inorder-leftmost-return-1024-dark.png) |
| 中序根节点访问 | [`tree-inorder-root-visit-1440-dark.png`](./stage7d/after/tree-inorder-root-visit-1440-dark.png) |
| 前序根访问 | [`tree-preorder-root-visit-1440-light.png`](./stage7d/after/tree-preorder-root-visit-1440-light.png) |
| 前序左子树 | [`tree-preorder-left-subtree-1024-light.png`](./stage7d/after/tree-preorder-left-subtree-1024-light.png) |
| 后序左子树完成 | [`tree-postorder-left-done-1440-light.png`](./stage7d/after/tree-postorder-left-done-1440-light.png) |
| 后序访问根 | [`tree-postorder-root-visit-1440-dark.png`](./stage7d/after/tree-postorder-root-visit-1440-dark.png) |
| 空树 | [`tree-empty-empty-1440-light.png`](./stage7d/after/tree-empty-empty-1440-light.png) |
| 单节点 | [`tree-single-single-1024-light.png`](./stage7d/after/tree-single-single-1024-light.png) |
| 同值不同 ID | [`tree-equal-values-equal-values-390-dark.png`](./stage7d/after/tree-equal-values-equal-values-390-dark.png) |
| 真实三帧调用栈 + 变量 | [`tree-inorder-call-stack-1440-light.png`](./stage7d/after/tree-inorder-call-stack-1440-light.png) |
| 手机栈展开 | [`tree-inorder-call-stack-390-dark.png`](./stage7d/after/tree-inorder-call-stack-390-dark.png) |

检查结论：

- 父子节点关系与 6 条边准确，根在顶部、左孩子左下、右孩子右下；1440 自动缩放后整棵 7 节点树可见，未再出现右侧子树被裁掉。
- 当前节点绿色边框、已访问序号、路径边高亮、ROOT/LEAF 标记同时可读；当前节点在 `enter` 帧没有访问序号。
- 106 张截图页面宽度均未超过视口；390 有画布内滑动提示，页面无横向滚动。
- 调用栈专项截图中，树、`f1/f2/f3` 三层栈、`node_id=n4`、`path`、`visited`、`depth=2` 在同一画面。
- dark 主题对比度足够，颜色不是唯一信息载体（有 ID、序号、文字、形状）。

---

## H. 测试结果

| 项目 | 结果 |
| --- | --- |
| 根 TypeScript | `npx tsc --noEmit` 通过 |
| 单元测试 | **458 / 458**，57 个文件 |
| Build | `npm run build` 通过 |
| 浏览器 E2E | **39 / 39**（Playwright + Edge，真实 Pyodide Worker） |
| Stage 7D 正式 E2E | 6 / 6：中序回退/栈、前序序列/行、后序父子顺序、模式切换/双语、空树/单节点/同值、1024/390/Reduced Motion/栈回归 |
| Stage 7D 截图 E2E | 1 / 1，106 张 |
| MCP 单测 | 20 / 20 |
| MCP stdio 冒烟 | 9 通过，1 按配置跳过 |
| AI Gateway 单测 | 26 / 26（server 16 + providers 10） |
| MCP typecheck | 通过 |
| AI Gateway typecheck | 通过 |
| Legacy snapshots | 14 个算法帧快照与旧 JS 示例全部随单测通过；`inorder` 仍 9 帧 |
| 旧数据结构 | Stack / Queue / LinkedList / Stage 3 调用栈 / Stage 7A/7B/7C E2E 全部通过 |

新增/关键测试：

- `src/domain/visualization/binaryTree.test.ts`：19 项（Schema 9、布局 6、模型 4）
- `src/domain/algorithms/treeTraversal.test.ts`：4 项
- `src/runtime/python/pyodide.trace.test.ts`：12 项（含 hook lessonStepId 与 locals 顺序）
- `e2e/stage7d.spec.ts`：6 项
- `e2e/stage7d.visual.spec.ts`：1 项、106 张截图
- `e2e/fixtures.ts` + `e2e/pyodide-local.ts`：把 CDN 静态文件映射到本地 `node_modules/pyodide@0.27.7`，产品 URL 不变，Worker/Python/Trace 仍真实

---

## I. 已知问题与边界

1. **节点上限 40**：沿用现有安全上限；超过上限的输入会被 Schema 拒绝，页面不会崩。
2. **宽树交互**：7 节点树在 1440 自动缩放到 75% 后可完整显示；更宽的树仍靠画布内横向滚动。390 初始滚动位置在最左列，根节点可能不在首屏，需左右滑动；这是“保留节点可读尺寸”的取舍。
3. **布局不是通用 Reingold–Tilford**：采用中序列 + 深度行，常规二叉树不交叉、同层不重叠；极深单链会得到很高的画布（页面纵向变长），没有实现折叠/分层视图。
4. **只有遍历，没有 BST 增删**：本阶段明确不做红黑树、AVL、BST 完整增删；`inorder` 条目只承担三模式遍历。
5. **JavaScript 旧树仍走旧渲染**：结构化 `binary-tree` 只由真实 Python 产生；切到 JS 时控制器把 `{mode, tree}` 归一化为层序数组，旧 JS 示例不受影响，但不会得到新的树画布。
6. **模式切换不自动运行**：切换只改输入并显示 pending，保留旧 Trace；必须用户点 Run 才产生从第 0 帧开始的新 Trace。这是有意设计，避免把旧画面贴上新模式标签。
7. **E2E 的 Pyodide 传输层是本地 npm 包**：测量时 jsDelivr 的 `pyodide.asm.wasm` 持续 0 字节，测试用本地包提供同一版本静态文件；Worker、解释器、Trace 都是真的，但 CI 首次安装会多一个 `pyodide@0.27.7` devDependency（约 5.6 MB 包）。
8. **真实 Ollama / 云端 AI 未实测**：沿用 Stage 6A 的 mock 回归；MCP 也仍未在第三方宿主实测，本轮只做协议/stdio 回归。
9. **System 主题截图**：截图只固定 light/dark；System 由浏览器偏好解析，由 Stage 7A/7B 既有 E2E 覆盖。

---

## J. Git 状态

- 分支：`main`
- 起始 HEAD：`7e9abef docs(stage7c): backfill git hashes in report`
- 功能与文档提交：``648490a``
- 报告哈希回填提交：紧随其后的 docs 回填提交；为避免哈希递归，正文不记录该提交自身哈希，可用 `git log -1 --format=%h` 核对
- 工作区：报告与截图纳入提交后 clean
- 远端：`origin https://gitee.com/vvvi734/algolens.git`
- 推送：`git push origin main`
- 版本：`0.9.0-phase7d`（`package.json` / `package-lock.json`）

---

## K. 后续阶段评估（只评估，不实现）

- **图 BFS/DFS**：当前 `structure` 已有 stack/queue/linked-list/binary-tree 四分支；图需要新的 `graph` 快照（顶点、边、frontier、visited、当前顶点）与可复用的队列/栈联动。适合独立阶段，需先定图规模与布局（力导向/分层），不要直接复用树的坐标。
- **队列与图遍历联动**：队列已有真实 Python 帧；图 BFS 可直接复用 `QueueVisual`，但必须让队列 item 与图顶点共享稳定 ID，且一帧内同时快照，避免两个组件各自播放。
- **双向链表**：需要 `prev` 引用、头/尾/双向箭头与断开节点的独立模型；可复用链表布局但字段与边方向不同，应新开 `doubly-linked-list` kind，不复用单向链表 Schema。
- **算法知识包扩展**：现有 6 / 14 课程；树课程可作为官方包示例的内容模板，但包 Schema 已稳定，优先补课程而不是改协议。

Stage 7D 到此停止，不开发 Stage 7E、图论、双向链表、题库或 408 内容。
