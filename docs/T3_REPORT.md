# T3 交付报告 · 最大堆与堆排序

状态：**已完成**（自底向上建堆、插入上浮、删除堆顶下沉、原地堆排序；真实 Python 数组与完全二叉树逐槽联动；双语课程、专项验证、真实 Pyodide E2E 与截图）。

- 分支：`feat/t3-heap-sort`
- 基线：`308d489 feat(ux04c): fit graph canvas to node bounds and reclaim vertical space`
- 基线来源：包含 UX-04C、T2 与全部既有算法；没有从落后的 `main`（`10f9a68`）开发
- 版本：`0.20.0-t3`
- 实现与文档提交：本分支 HEAD（见文末 Git）
- 未直接修改 `main`，未进入哈夫曼树，未继续页面结构或 UI 优化

## 1. 实现摘要

### 1.1 单一算法入口与四种真实操作

目录中只新增一个算法 id `heap`，算法名称覆盖「最大堆 · 建堆 / 插入 / 删除堆顶 / 堆排序」；输入对象的 `operation` 区分四种操作：

- `build`：自底向上建堆。
- `push`：追加新元素并上浮。
- `extract`：删除堆顶最大值并下沉恢复。
- `sort`：完整原地堆排序。

四种操作共享同一份 `HEAP_PYTHON`、同一套强类型快照、同一个播放器与同一门课程，不是四套独立伪造动画。官方示例默认 Python，JS 入口只显示提示桩，不会退回旧 JavaScript 演示。

### 1.2 真实 Python 数组与稳定身份

`src/domain/algorithms/heapExamples.ts` 中的真实 Python 维护：

```python
VALUES      # 当前数组内容，按槽位下标
IDS         # 每个元素的稳定教学编号 h1…hn
TOTAL       # 当前数组元素总数
HEAP_SIZE   # 有效堆区大小
SORTED_FROM # 堆排序已固定后缀起点，None 或等于 HEAP_SIZE
```

- 元素身份与数组位置分离：`elements[slot] = {id, value, slot}` 严格按槽位连续存储；交换只把两个元素移动到对方槽位，完全二叉树形状只由槽位推导，绝不因交换重排。
- 所有快照由同一个 `snapshot/emit` 生成，树形图、数组和右侧讲解读取同一帧 `MaxHeapSnapshot`。
- 稳定 ID 在创建时分配为 `h1…hn`；插入得到新 ID `h7`，上浮到根后仍叫 `h7`，不会改名为 h1 或“根”。

### 1.3 四种操作语义

| 操作 | Python 真实行为 | 关键帧 |
| --- | --- | --- |
| 建堆 | 从最后一个非叶节点 `TOTAL//2 - 1` 开始向前，每个子树根执行一次下沉；先比较左右孩子，再比较父与较大孩子 | `init → build-start → heapify-node → compare-children → compare-parent-child → swap → … → done(built)` |
| 插入 | 先真实 `append` 到数组尾，再沿父链上浮；父 ≥ 子立即停止，相等也不交换 | `push-append → compare-parent-child → swap → … → done(pushed)` |
| 删除堆顶 | `extract-select` 先展示根最大值；记录返回值与 `removed`，弹出尾元素并缩小 `totalSize/heapSize`；尾元素真实写入 #0，再从根下沉 | `extract-select → replace-root → compare-children/compare-parent-child/swap → done(extracted)` |
| 堆排序 | 先建最大堆；每轮把堆顶最大值交换到当前堆尾，`heapSize` 与 `sortedFrom` 同步缩小，再只在前 `heapSize` 个槽位恢复堆性质 | `build-start … build-done → sort-select → swap-to-end → sift-down → … → done(sorted)` |

关键语义：

- `sortedFrom` 只能为 `null` 或等于 `heapSize`；已排序后缀不参与任何堆调整。
- `sort-select` 在交换前展示当前根最大值；`swap-to-end` 在真实交换并缩小堆区之后发出。
- `extract-select` 在 pop 前展示根；`replace-root` 在弹出尾元素并写根之后发出，带 `removed` 与 `replacement`；`replacement.fromSlot` 是旧尾槽位。
- `done` 是唯一终帧：`build→built`、`push→pushed`、非空 `extract→extracted`、空堆 `extract→empty`、`sort→sorted`。
- 删除唯一元素后 `totalSize=0` 但仍有 `removed`，结果报 `extracted`；只有初始空堆删除才报 `empty`。

### 1.4 专属可视化

- `heapLayout`：完全二叉树固定槽位几何。层级 `floor(log2(count))+1`；第 d 层从槽位 `2^d - 1` 开始；7 节点设计尺寸 280×274，节点半径 28，无 CSS transform 放大。
- `heapModel`：读取同一快照，生成树节点、边、数组槽位、活动/比较/交换/新增/路径、删除最大值、补根和已排序后缀。布局按 `totalSize` 计算，堆区缩小时存活节点不会移动。
- `HeapVisual`：SVG 完全二叉树 + 右侧真实数组侧栏。每个树节点显示稳定 ID、值、槽位 `#i`；数组行显示槽位 `i`、稳定 ID、值和 `SORTED` 标签，并固定展示公式 `2i+1 · 2i+2 · ⌊(i-1)/2⌋`。
- 树节点与数组槽位一一对应；交换时同时高亮两个槽位；删除帧显示「已删除最大值」和「末尾补根 #6 → #0」；排序帧显示分隔线与升序后缀。
- 空堆与「堆区为空、全部元素已进入已排序后缀」分别有明确空态。
- 桌面树占主区域、数组为窄侧栏；≤860px 改为上下布局，数组用四列网格完整显示全部槽位，页面无横向溢出。

### 1.5 课程与预设

`src/domain/lessons/heapLesson.ts` 共 10 步，中英双语，stepId 与 Python 的 `lesson_step` 完全一致：

`init / build / heapify / compare-children / compare-parent / swap / insert / extract / sort / done`

课程内容覆盖完全二叉树、最大堆与最小堆的区别、最大堆性质、为什么堆可以用数组存储、三条下标公式、自底向上建堆、上浮与下沉、删除堆顶、完整堆排序、不稳定性、常见错误与考试记忆重点。

复杂度口径：

- 自底向上建堆：`O(n)`。
- 插入：`O(log n)`。
- 删除堆顶：`O(log n)`。
- 堆排序：`O(n log n)`。
- 原地堆排序辅助空间：`O(1)`，不包括教学 Trace 快照与展示所需额外存储。

四个官方 Python 预设：

| 预设 | 输入 | 操作 | 帧数 | 最终结果 |
| --- | --- | --- | --- | --- |
| `build` | `[4,9,2,7,5,9,1]` | 建最大堆 | 17 | `[9,7,9,4,5,2,1]` |
| `push` | `[9,8,6,3,7,2]` + `10` | 插入上浮 | 7 | `[10,8,9,3,7,2,6]` |
| `extract` | `[9,8,6,3,7,2,5]` | 删除堆顶 | 10 | `[8,7,6,3,5,2]` |
| `sort` | `[5,1,9,3,9,2,6]` | 原地堆排序 | 45 | `[1,2,3,5,6,9,9]` |

边界夹具另含空堆、单元素和重复值场景共 62 帧，全部由同一真实 Python 程序生成。

### 1.6 接入范围

- `schema.ts`：新增 `MAX_HEAP_LIMITS.MAX_ELEMENTS=24`、命令/操作/结果枚举、元素/比较/交换/替代 schema，以及带 `superRefine` 的 `maxHeapSnapshotSchema`。
- `structureExamples.ts`、`useLabController`、`LabView`、`VisualStage`：官方默认 Python、四种预设选择、模型分派与舞台接入。
- `textbook.ts`、`registry.ts`、`frameInsight.ts`、`messages.ts`：排序章 `heap-sort` 从 planned 变为已实现、课程注册、逐帧讲解与中英文文案。
- `main.tsx`：在 `ux04.css` 之后加载 `t3.css`。
- 复用现有舞台、数组、播放器、课程、目录与响应式基础；没有第二套播放系统，没有新增 AI/MCP，没有修改顶部导学、左侧教材目录和右侧讲解布局。

## 2. 正确性与验收

| 项 | 结果 |
| --- | --- |
| 独立 CPython 校验 | ✅ `scripts/verify_heap_python.py` 16/16；4 个官方预设 + 12 个空堆/单元素/重复值边界；逐帧校验槽位、父子槽位、比较、交换、removed/replacement、sorted suffix 与终帧结果，并用独立 `RefMaxHeap` 核对最终数组和堆不变量 |
| 真实帧 fixtures | ✅ 默认 79 帧、边界 62 帧，全部通过 Zod `structureSchema` 与 `maxHeapSnapshotSchema` |
| 专项单测 | ✅ `src/domain/trace/heap.test.ts` 13 项：141 帧逐帧树/数组一致、建堆父节点均不小于子节点、插入后堆性质、删除最大值与补根、堆排序升序与多重集不变、重复/空/单元素、回退恢复、非法快照拒绝 |
| 全量单测 | ✅ 88 个文件、738 tests 全部通过 |
| 生产构建 | ✅ `npm run build` 通过；1444 modules；`index-CycKiOWR.js` 约 1,410 kB / gzip 399.58 kB；`index-DjtG_5kc.css` 168.06 kB / gzip 28.16 kB |
| T3 E2E | ✅ 4/4 真实 Pyodide：四种操作、树数组同槽位、回退/跳帧、已排序后缀排除、空堆区提示、390 无页面横向溢出 |
| 全量 E2E | ✅ 129/129；BST、AVL、二叉树遍历、图算法、栈/队列/链表、递归与既有 UX/E2E 无回归 |
| 目录/课程计数 | ✅ 入口 25→26、课程 19→20 的旧断言已修正；`catalog / textbook / registry / App.dom` 全部通过 |
| 覆盖清单 | ✅ `docs/COVERAGE.md` 更新到 26 个入口、20 门课程、21 个真实 Python 入口 |

验收重点逐项：

- 建堆后的所有父节点均不小于子节点：CPython 与 TypeScript fixtures 双重校验。
- 插入后的数组仍满足最大堆性质：默认 push 终帧 `[10,8,9,3,7,2,6]` 与独立参考实现一致。
- 删除堆顶返回正确最大值：`extract` 的 `removed` 为 `h1=9`，且从 `elements` 消失。
- 删除后堆性质恢复：终帧 `[8,7,6,3,5,2]` 通过堆检查。
- 堆排序结果升序且多重集不变：`[1,2,3,5,6,9,9]`，重复 9 保留两个。
- 重复值、单元素、空堆边界：62 帧边界夹具覆盖并通过。
- 每一帧树形与数组内容一致：专项单测遍历 141 帧，节点必须对应 `elements[slot]`。
- 回退和跳帧恢复交换前后状态：E2E 从交换帧回退到比较帧再跳回，槽位和值完全恢复。
- 已排序后缀不再参与堆调整：Schema 限制 `sortedFrom === heapSize`，E2E 在 heapSize=6/4/0 时分别校验后缀数量与树节点数。
- 现有 BST、AVL、二叉树遍历与图算法无回归：全量单测与全量 E2E 通过。

## 3. 截图

| 文件 | 内容 |
| --- | --- |
| `docs/t3/heap-build-1440-light.png` | 建堆交换 `h6(9)@#2 ↔ h3(2)@#5`，树与数组同步高亮 |
| `docs/t3/heap-push-1440-light.png` | 插入 10 后 `h7` 从 #6 上浮到 #2，路径 h1→h3→h7 |
| `docs/t3/heap-extract-1440-light.png` | 删除堆顶 9，`h7(5)` 从 #6 补到 #0，堆大小 7→6 |
| `docs/t3/heap-sort-1440-light.png` | 堆排序第 18/45 帧，`h5(9)` 固定到 #6，已排序后缀 9 |
| `docs/t3/heap-sort-1440-dark.png` | 同帧 Dark 主题回归 |
| `docs/t3/heap-sort-390-light.png` | 390×844 上下布局，树与全部 7 个数组槽位可见，无页面横向溢出 |

## 4. 已知限制

- 只支持官方 `build/push/extract/sort` 四种操作与官方/边界预设；不实现任意用户改写代码后的通用堆识别、任意比较器或泛型堆。
- 单堆最多 24 个元素（`MAX_HEAP_LIMITS.MAX_ELEMENTS`）；超过上限不会生成教学 Trace。
- 课程与讲解只保证内置中英文内容；不新增 AI 自动生成。
- 原地 `O(1)` 是算法辅助空间口径，不包含教学 Trace 帧、稳定 ID 与展示快照。
- 390px 下数组使用四列网格；更多元素时数组面板内部滚动，不扩展页面宽度。
- 按用户要求，本批次在 T3 完成后停止，没有进入哈夫曼树，也没有继续 UI 结构优化。

## 5. Git

- 实现、课程、测试与初始报告提交：`0bd6268 feat(t3): add max heap build, push, extract and heap sort lab`
- 分支：`feat/t3-heap-sort`，从 `308d489` 建立
- 远端：`https://gitee.com/vvvi734/algolens.git`
- 推送：已成功创建并跟踪 `origin/feat/t3-heap-sort`
- 报告 Git 段定稿：以分支最新 HEAD 的文档提交为准
