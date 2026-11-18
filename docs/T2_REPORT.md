# T2 交付报告 · AVL 平衡二叉搜索树

状态：**已完成**（插入、删除、失衡检测、LL/RR/LR/RL 四种真实旋转、双语课程、专项/全量回归与截图）。

- 分支：`feat/t2-avl`
- 基于 T1 最新文档提交 `ef0ee4f` 创建；没有从落后的 `main`（`1dcdf76`）开发，没有重置或覆盖 `feat/t1-bst`
- 实现提交：`8e3dd24`（feat(t2): add real AVL insertion deletion and rotations）
- 文档与报告：本报告所在提交（分支 HEAD）
- 未直接修改 `main`

## 1. 实现摘要

### 1.1 真实 Python Trace

`src/domain/algorithms/avlExamples.ts` 使用真实 `AvlNode`：

```python
node_id / value / left / right / parent / height
```

- 稳定 ID 按创建顺序分配为 `a1, a2, ...`；删除、移植、回退和跳帧都不重命名幸存节点。
- 初始树用 `SILENT=True` 的真实插入构建，构造阶段的旋转帧不会泄漏到教学 Trace。
- `refresh_heights` 在后序位置按真实子树重算高度。
- `balance_factor(node) = height(node.left) - height(node.right)`。
- `rotate_right / rotate_left` 先真实修改 `parent / left / right`，再发 `before` / `after` 两帧；视觉层只消费结构快照，不先移动 SVG。
- `perform_balance` 按 `LL / RR / LR / RL` 执行单旋或两个连续旋转；`balance_up(start)` 从受影响位置向上刷新高度并继续检查祖先。

### 1.2 插入

- 按 BST 规则比较、记录路径、寻找空位，真实创建节点并挂接父指针。
- 插入后向上更新高度，遇到第一个 `|BF| > 1` 的祖先记录失衡类型。
- 四种旋转均覆盖：
  - LL：对失衡节点右旋。
  - RR：对失衡节点左旋。
  - LR：先对左孩子左旋，再对失衡节点右旋。
  - RL：先对右孩子右旋，再对失衡节点左旋。
- 双旋是两个真实连续操作，各自有 `before/after` 帧与 `rotationStep/rotationTotal`，不是只展示最终树。
- 重复键明确拒绝，树不变。

### 1.3 删除

- 叶子：父指针置空并记录摘除对象。
- 单孩子：孩子真实接替目标位置。
- 双孩子：物理移植中序后继；后继保留自己的 ID，目标对象真正摘除。
- 根节点：双孩子删除时更新 `rootId`，后继成为新根。
- 不存在键：`not-found` 帧，结果 `missing`，树不变。
- 删除后从受影响位置向上更新高度并重新平衡，必要时连续调整多个祖先。

### 1.4 可视化

- 复用 T1 的 `layoutBinaryTree`、二叉树画布、滚动/缩放与唯一播放器。
- 每个节点显示键值、`h` 高度、`BF` 平衡因子。
- 当前节点、失衡节点、旋转轴（pivot）、上升节点（promoted）有独立标签与描边。
- 旋转面板显示 case、阶段与 `step/total`；旋转边、指针变化、根变化、摘除对象、目标键、比较路径、中序序列同帧展示。
- 节点 ROOT/LEAF/当前角色徽标在 AVL 中隐藏，避免与 `h/BF` 徽标叠字。
- 390 px 下树画布保留可读最小比例并在容器内横向滚动；宽度/根变化时自动把滚动位置居中到根，页面本身无横向溢出。
- 没有第二套播放器，没有修改页面主布局。

### 1.5 课程与预设

`src/domain/lessons/avlLesson.ts` 共 17 步，中英文齐全，stepId 与 Python `lesson_step` 一一对应：

`init / compare / direction / insert / height / imbalance / rotate-left / rotate-right / duplicate / delete-locate / delete-leaf / delete-one / successor / successor-detach / transplant / not-found / done`

内容覆盖 AVL 与普通 BST 的区别、普通 BST 退化、节点高度与平衡因子、AVL 平衡条件、LL/RR/LR/RL、单旋与双旋、插入/删除后的再平衡、O(log n)、常见错误与记忆方法。第 ⑦/⑧ 步明确说明一次右旋/左旋同时是某种双旋的某一步。

10 个官方预设（按预设选择器顺序）：

| 预设 | 初始树 → 目标 | 帧数 | 关键行为 |
| --- | --- | --- | --- |
| `insert-ll` | `[30,20,40,10]` → 5 | 15 | 失衡祖先 `a2`，右旋 |
| `insert-rr` | `[30,20,40,50]` → 60 | 15 | RR，左旋 |
| `insert-lr` | `[50,30,70,20,40,60,80,10,25]` → 27 | 20 | LR 两段，各 2 帧 |
| `insert-rl` | `[50,30,70,60,55]` → 52 | 17 | RL 两段，最终根 `a5=55` |
| `insert-balanced` | `[30,20,40,10,25,35]` → 28 | 12 | 无需旋转 |
| `delete-leaf` | `[30,20,40,10,25,35,5]` → 35 | 14 | 叶子删除 + 重平衡 |
| `delete-one` | 同树 → 40 | 11 | 单孩子接替 + 重平衡 |
| `delete-two` | `[50,30,70,20,40,60,80,65]` → 50 | 10 | 根双孩子，后继 `a6=60` 成为新根 |
| `delete-cascade` | `[3,9,1,6,8,11,12,2,10,7,5,4]` → 12 | 21 | 叶子删除，连续两个不同祖先的 LR 双旋 |
| `delete-missing` | `[30,20,40,10,25,35]` → 50 | 7 | 缺失键，树不变 |

默认输入：`{preset:'insert-ll', operation:'insert', tree:[30,20,40,10], target:5}`。

## 2. 正确性与回归

本地环境：Windows + Microsoft Edge（Playwright `channel=msedge`）+ 真实 Pyodide 0.27.7。

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 通过；1426 modules；`index-B3X5mSw6.js` 1,237.06 kB / gzip 344.90 kB；`index-CU3aLdJA.css` 118.78 kB / gzip 20.75 kB |
| 全量单测 | ✅ **82 个文件 / 677 tests 全部通过** |
| T2 单测 | ✅ **12/12**：`avl.test.ts` 9 项 + `avlLesson.test.ts` 3 项 |
| 全量 E2E | ✅ **95/95**（94 条既有 + 1 条 T2 功能/视觉），6.1 min |
| T2 E2E | ✅ 1/1：真实 Pyodide 运行 10 个预设；验证四种旋转、双旋 chip、删除三案例/根变化/连续重平衡、节点 ID 与 height/BF、回退/跳帧、390 根居中与无页面溢出、英文切换 |
| 独立 Python 校验 | ✅ `scripts/verify_avl_python.py`：10 个官方预设 + 多祖先 + 空树/重复/非法值全部通过；逐帧验证中序严格递增、真实 height、`|BF| ≤ 1`、无环/无重复归属/无悬空引用；最终树形与独立参考 AVL 交叉验证 |
| T1 回归 | ✅ `scripts/verify_bst_python.py` 全部通过；`e2e/t1.spec.ts` 1/1；BST 单测 17 项通过 |
| 既有算法回归 | ✅ BFS/DFS、Dijkstra、Floyd、Bellman-Ford、Prim、Kruskal、拓扑排序、关键路径、连通分量/SCC、二叉树遍历、栈/队列/链表在 95/95 全量 E2E 中通过 |
| 入口/课程计数 | ✅ 24→25、18→19 的旧断言已修正并复跑通过 |
| 目录同步 | ✅ `npm run sync:legacy`：baseline 25 algorithms；`avl` 生成 1 帧占位提示 |

关键校验点：

- 插入后的中序遍历严格有序。
- 所有节点高度与实际子树高度一致。
- 每个节点平衡因子绝对值不大于 1（`init/done`）；旋转中间帧允许暂时超限。
- LL、RR、LR、RL 均正确，双旋为两个真实连续操作。
- 删除叶子、单孩子、双孩子、根节点、缺失键均正确。
- 删除触发的连续祖先重平衡正确；`delete-cascade` 验证两个不同失衡祖先。
- 节点引用无环、无重复归属、无丢失。
- 回退与任意跳帧后，节点 ID、父子关系和高度恢复正确。
- 现有 BST、二叉树遍历与图算法无回归。

## 3. 代表性截图

统一位于 `docs/t2/`：

| 截图 | 内容 |
| --- | --- |
| [`avl-insert-ll-1440-light.png`](t2/avl-insert-ll-1440-light.png) | LL 旋转后，根 `a1`、pivot `a2`、promoted `a4` |
| [`avl-insert-rr-1440-light.png`](t2/avl-insert-rr-1440-light.png) | RR 旋转后，右子树 `50/40/60` |
| [`avl-insert-lr-1440-light.png`](t2/avl-insert-lr-1440-light.png) | LR 第一段后，chip 1/2，pivot `a4`、promoted `a9` |
| [`avl-insert-rl-1440-light.png`](t2/avl-insert-rl-1440-light.png) | RL 第二段后，chip 2/2，根 `a5=55` |
| [`avl-delete-cascade-rebalance-1440-light.png`](t2/avl-delete-cascade-rebalance-1440-light.png) | 叶子删除后第二段 LR 重平衡，根 `a4=6` |
| [`avl-delete-cascade-390-light.png`](t2/avl-delete-cascade-390-light.png) | 390 宽完成态，根居中、树画布内部滚动、页面无横向溢出 |

## 4. 覆盖清单

`docs/COVERAGE.md` 已更新为：

- 25 个算法入口；20 个真实 Python 入口。
- 19 门内置双语课程；6 个暂无课程。
- 新增 `avl` 结构化可视化与 17 步课程。
- 验证表更新为 677 单测 / 95 E2E / 1426 modules，并记录 T2 专项与独立 Python 校验。

## 5. 已知限制

- 只保证 10 个官方预设与边界输入的真实 Trace；任意用户改写 AVL Python 代码后的完整自动可视化不在本批次范围。
- 旋转只展示当前子树与 `balance_up` 路径上的真实指针变化，不是全局重排动画。
- `delete-cascade` 的删除分类是 **叶子删除**，但连续触发两个不同祖先的 LR 双旋；不能把它当成双孩子删除，也不能假设删除后至多旋转一次。
- 390 px 下 AVL 树仍在容器内横向滚动，不缩放整棵树；根会自动居中，页面本身无横向溢出。
- AVL 节点上的 ROOT/LEAF/当前角色徽标已隐藏，避免和 `h/BF` 叠字；当前节点由顶部指标和描边表达。
- AVL 的 JavaScript 入口是提示桩，真实结构演示使用 Python。
- `AVL_PYTHON` 的 `line=` 是教学用近似源码行号，Monaco 实际行号以编辑器为准。
- 未实现堆、哈夫曼树，未修改页面整体布局。
- 未安装 axe-core，触控尺寸未逐项审计。

## 6. Git 与开发耗时分类

- 分支：`feat/t2-avl`
- 基线：`ef0ee4f`（T1 文档提交）
- 实现提交：`8e3dd24`
- 文档/报告：本报告所在提交
- `main`：保持 `1dcdf76`，未修改
- T2 完成后停止，不自动开发堆/哈夫曼树，不修改页面布局

开发耗时分类（按工作项归类；没有精确计时，不给虚构小时数）：

| 类别 | 主要工作 |
| --- | --- |
| 域层与真实 Python | `AvlNode`、稳定 ID、真实高度、四种旋转、删除三案例、`balance_up` 多祖先重平衡、Schema 与快照字段 |
| 视觉与接入 | `avlModel`、`AvlVisual`、`AvlPicker`、旋转/失衡标签、`t2.css`、目录/舞台/控制器接入、390 根居中 |
| 课程与文案 | 17 步双语课程、四种旋转概念修正、算法元数据与预设文案 |
| 正确性与测试 | 独立 CPython 校验、9 项 trace 单测、3 项课程单测、真实 Pyodide E2E、全量 95 条回归 |
| 交付与文档 | 6 张截图、README/COVERAGE/ARCHITECTURE/REFERENCES、分支提交与推送 |

## 7. 结论

T2 在独立分支完成，复用 T1 树布局、真实 Python Trace、单一播放器与课程系统，没有大规模重构 Trace Schema。四种旋转都由真实指针变化驱动，双旋保留两个连续操作；删除覆盖叶子、单孩子、双孩子和根，并能连续重平衡多个祖先。专项、全量与独立 Python 校验均通过。
