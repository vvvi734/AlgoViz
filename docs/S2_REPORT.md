# S2 交付报告 · 快速排序 / 归并排序

状态：**已完成**（真实 Python Trace、Lomuto 分区与独立归并缓冲区、双语课程、独立 CPython 逐帧参考校验、专项单测、真实 Pyodide E2E、全量回归与生产构建）。

- 分支：`feat/s2-sorting`
- 基线：`ccc8553 docs(s1): finalize delivery commit and push record`（S1 最终记录；包含 S1 三种排序、T4 与全部既有算法）
- 基线来源：没有从落后的 `main` 开发，没有重置或覆盖 `feat/s1-sorting`
- 版本：`0.23.0-s2`
- S2 完成后按要求停止，不进入 S3，不开发其他排序、查找、链表、队列、图论定理、AI/MCP 或任意用户代码专属动画

## 1. 实现摘要

### 1.1 两个算法、同一套共享排序基础设施

`quick` 与 `merge` 继续复用 S1 已建立的：

- `sortingSnapshotSchema` 与公共区间/缓冲区校验；
- `sortingModel.ts` 纯视觉模型；
- `SortingVisual.tsx` 唯一排序渲染器与 `.bars/.bar-item/.bar`；
- 既有 `Timeline`、播放/回退/跳帧控制、Python Trace、课程与顶部导学。

S1 的选择/插入/Shell 与 S2 的快速/归并共用一个播放器、一个数组渲染器，没有为两个新算法分别建立完整播放器。所有区间、pivot、边界、左右游标、缓冲区与写回位置都从当前 `structure` 快照推导；不从操作名重建状态，也没有预写 JS 帧。

### 1.2 真实 Python 与官方帧数

源码位于 `src/domain/algorithms/sortingExamples.ts`，均为 CPython 可执行程序。

| 算法 | 官方输入 | 帧数 | 最终数组 |
| --- | --- | ---: | --- |
| 快速排序 | `[8,3,1,7,5,2,9,4]` | 32 | `[1,2,3,4,5,7,8,9]` |
| 归并排序 | `[7,3,5,1,9,2,8,4]` | 110 | `[1,2,3,4,5,7,8,9]` |

### 1.3 快速排序语义

- 固定使用 **Lomuto 分区，pivot 取区间末尾 `a[high]`**。
- `quick-range`：进入非空区间，pivot=high，边界 `i=low`。
- `quick-compare`：扫描 `j` 从 `low` 到 `high-1`，逐帧比较 `a[j]` 与 pivot；该帧只读。
- `quick-swap`：仅当 `a[j] <= pivot` 且 `i != j` 时真实交换 `a[i]` 与 `a[j]`，下一帧边界推进到 `i+1`；`i==j` 只推进边界，不伪造自交换。
- `quick-place`：扫描结束后真实交换 `a[i]` 与 `a[high]`，pivot 归位并进入 `finalized`；左子区间全部 `<= pivot`，右子区间全部 `> pivot`。
- `quick-return`：空区间直接返回；单元素区间标记为已确定终位；顶层单元素允许 `round=0`，其余操作要求 `round>=1`。
- 递归 `[low, i-1]` 与 `[i+1, high]`，pivot 自身不再进入任何子区间。
- 复杂度：平均/通常期望 `O(n log n)`；最坏 `O(n²)`（已排序数组仍取末尾 pivot 时会退化）。递归栈平均 `O(log n)`、最坏 `O(n)`。标准原地快速排序通常不稳定。

### 1.4 归并排序语义

- 使用 **自顶向下 Merge Sort**，真实递归拆分到单元素。
- `merge-range` → `merge-split`（真实 `mid=(low+high)//2`）→ 左右递归。
- `merge-return`：单元素区间直接返回并标记该区间已有序；空区间不进入递归。
- `merge-start`：左右半区已有序，独立缓冲区为空，左/右游标分别指向两个半区首位。
- `merge-compare`：比较 `a[left]` 与 `a[right]`；`a[left] <= a[right]` 时取左侧，保证相等键的相对次序稳定。
- `merge-write`：把较小真实元素追加到缓冲区下一个槽位，帧记录 `index/value/source`。
- `merge-copy`：一侧耗尽后，另一侧剩余元素按原顺序复制进缓冲区。
- `merge-writeback`：完整缓冲区逐槽覆盖回原数组 `[low, high]`，`writeAt` 是真实写回下标。
- `merge-range-done`：当前区间整体有序并标记为已归并，父调用只把它当作一个有序半区。
- 复杂度：最好/平均/最坏均为 `O(n log n)`；数组实现通常需要 `O(n)` 辅助空间；按“相等取左”的规则可以保持稳定；整体是拆分与合并的分治。

### 1.5 UI、课程与注册

- `SortingVisual.tsx` 在同一个柱状图中增加：
  - 当前递归区间轮廓、`range-start/range-end`；
  - quick 的 `PIV` 标记、`CMP` 比较标记、边界 `i` 虚线、已确定终位 `✓`、真实交换 `⇄` 与交换 chip；
  - merge 的左/右候选 `L/R`、`split` chip、独立 `sorting-buffer` 面板、`B` 缓冲来源、`↓` 写回目标、已归并区间 chip。
- 新 testid：`sorting-range`、`sorting-pivot`、`sorting-boundary`、`sorting-split`、`sorting-left`、`sorting-right`、`sorting-swap`、`sorting-buffer`、`sorting-buffer-slot`、`sorting-merged-ranges`。
- 新 `src/styles/s1.css` 追加 S2 样式，S1 原样式和既有排序标记保持不变；390 px 继续沿用单列布局。
- 课程：
  - `quickSortLesson.ts`，5 步：`init / quick-partition / quick-swap / quick-place / done`；
  - `mergeSortLesson.ts`，5 步：`init / merge-split / merge-compare / merge-buffer / merge-writeback`。
  - 两门课程均中英双语，包含一句话理解、5 个阶段、当前帧解释、复杂度、稳定性、常见错误与记忆重点；顶部导学由 `lessonStages` 生成真实 5 阶段，不是“0 个阶段但有完整步骤”。
- 注册：
  - `legacy` 快速排序 ID 保留旧 JavaScript 演示，并更新为 Lomuto 末尾 pivot；`merge` 新增 legacy 入口与旧 JS 演示；
  - `npm run sync:legacy` 后 catalog 29 个入口、课程 26 门、真实 Python 27 个；
  - 教材只把既有 `ch9-sort/merge-sort` 从 `planned` 改为 authored 并挂 `merge`，未新增/重排主题；
  - `useLabController` 选中 quick/merge 时默认 Python。

## 2. 正确性与验收

| 项 | 结果 |
| --- | --- |
| 独立 CPython 校验 | ✅ `scripts/verify_divide_sort_python.py` 923/923 帧：2 算法 × 9 输入（官方 + 已排序、逆序、重复、负数、全相同、单元素、空数组、长随机）；逐帧与独立参考操作流比较 |
| fixtures | ✅ `sorting-s2-default-frames.json` 32+110=142 帧；`sorting-s2-edge-frames.json` 7 类 × 2 算法共 516 帧；全部通过 Schema 与专项校验 |
| 快速排序不变量 | ✅ 每个 `quick-place` 左半 `<= pivot`、右半 `> pivot`；pivot 进入 `finalized`；递归边界正确；每帧多重集不变；最大 `round` 不超过 64；无无限递归或遗漏元素 |
| 归并排序不变量 | ✅ 拆分中点与代入区间正确；每次合并结果有序；buffer 每槽 value/source 与真实数组一致；`writeAt` 与真实写回槽一致；`merge-range-done` 整个区间有序；最终多重集与参考一致 |
| 稳定性 | ✅ 真实 Python 使用 `a[left] <= a[right]` 相等取左；独立 records witness 确认相同键身份次序不变；快速排序课程明确说明标准原地版本通常不稳定 |
| 多重集 | ✅ 最终数组、所有非写回帧与 quick 全帧多重集不变；merge 写回是按槽覆盖的真实中间态，缓冲区始终持有完整区间多重集，`merge-range-done`/final 恢复完整多重集 |
| 播放/回退/任意跳帧 | ✅ S2 E2E 在 quick 第 5 帧与 merge 第 14 帧执行 next→prev 一致性，并跳至最终帧；所有显示只读取当前 Trace 快照 |
| 帧数上限 | ✅ quick 默认 32、merge 默认 110、边界最大 77；`SORTING_LIMITS` 与导出脚本均不超过 500 |
| 专项单测 | ✅ `sortingS2.test.ts` 6 项、`sortingS2Lessons.test.ts` 6 项、`sortingS2Visual.test.tsx` 4 项；共 16 项 |
| 全量单测 | ✅ 96 个文件、795 tests 全部通过（S1 原有 93 文件 776 tests + 3 个 S2 专项文件 16 tests + catalog/目录参数化新增 3 项） |
| 类型检查 | ✅ `npm run typecheck` 通过 |
| 生产构建 | ✅ `npm run build` 通过；产物见第 5 节 |
| S2 真实 Pyodide E2E | ✅ 2/2：quick Lomuto pivot/真实交换/归位/递归/最终顺序；merge 拆分/缓冲区写入/写回/最终顺序；真实 Pyodide 执行，无预写帧 |
| 全量 E2E | ✅ 136/136（S1 134 条基线 + 2 条 S2；其中 UX-01B / UX-03 / UX-03B 的入口数、无课程回退与合并课程断言已同步到 29 入口 / 26 课程口径） |
| 回归 | ✅ S1 选择/插入/Shell、原有冒泡、BST、AVL、最大堆、哈夫曼与 G1–G4 图算法全部通过 |

## 3. 截图

| 文件 | 内容 |
| --- | --- |
| `docs/s2/quick-swap-1440-light.png` | quick 第 5/32 帧，pivot p7=4，边界 i=1，p0/p1 真实交换 |
| `docs/s2/quick-place-1440-light.png` | quick 第 13/32 帧，pivot 归位 p3=4，已确定终位 1/8，交换 p3 ⇄ p7 |
| `docs/s2/quick-done-390-light.png` | quick 第 32/32 帧，最终 `[1,2,3,4,5,7,8,9]`，390 单栏无溢出 |
| `docs/s2/merge-write-1440-light.png` | merge 第 14/110 帧，区间 [0,1]，左 p0、右 p2，p1=3 写入缓冲区 b0 |
| `docs/s2/merge-writeback-1440-light.png` | merge 第 101/110 帧，完整缓冲区 8/8，b0=1 写回 p0，已归并 [0,3]/[4,7] |
| `docs/s2/merge-done-390-light.png` | merge 第 110/110 帧，最终 `[1,2,3,4,5,7,8,9]`，390 单栏无溢出 |

## 4. 已知限制

- 只保证 quick/merge 两份官方 Python 源码、官方输入与内置预设/边界输入的真实 Trace；用户改写后的任意排序代码不在通用可视化范围。
- 快速排序固定 Lomuto 末尾 pivot；不实现 Hoare 双指针、随机 pivot 或三路分区。
- 归并排序固定自顶向下、数组 + 独立缓冲区；不实现自底向上、原地归并或链表归并。
- 归并写回是逐槽覆盖的真实中间状态，写回过程中主数组可能暂时出现重复/缺失槽位；缓冲区帧持有完整区间内容，最终和 `merge-range-done` 恢复多重集。教学文案明确这是写回过程，不把它伪装成已完成的排序结果。
- 相等键的稳定性由真实 `a[left] <= a[right]` 和独立 records witness 验证；数组中只有数值，柱状图不额外伪造“同值身份标签”。
- 本页不把 S2 的 Trace 帧数、焦点数组与展示快照计入算法自身空间复杂度；quick 的 `O(log n)`/`O(n)` 与 merge 的 `O(n)` 均指算法辅助空间。
- 按用户要求，S2 完成后立即停止，不自动进入 S3 或其他算法开发。
- 本批次没有引入外部源码文件，也没有直接复制第三方实现；Lomuto Quick Sort 与自顶向下 Merge Sort 均为项目内按教学语义独立编写，因此没有新增第三方许可证义务。若后续参考 TheAlgorithms/Python 等外部仓库，需在引入前单独核实许可证并在报告中登记来源。

## 5. 构建产物

`npm run build`：

- `dist/assets/index-D5cHUaFa.js` 1,636.51 kB（gzip 462.52 kB）；
- `dist/assets/monaco-setup-BEbmHtIE.js` 4,122.24 kB（gzip 1,066.59 kB）；
- `dist/assets/index-B0YGFqNf.css` 189.25 kB（gzip 31.32 kB）。

`dist/index.html` 1.36 kB。构建版本 `0.23.0-s2`。

## 6. Git

- 分支：`feat/s2-sorting`，从 `ccc8553` 建立
- 远端：`https://gitee.com/vvvi734/algolens.git`
- 提交与推送记录见本轮最终 Git 输出。
