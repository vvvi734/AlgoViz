# S1 交付报告 · 简单选择排序 / 直接插入排序 / 希尔排序

状态：**已完成**（真实 Python Trace、共享数组动画、三套双语课程、独立 CPython 校验、专项单测、真实 Pyodide E2E 与全量回归）。

- 分支：`feat/s1-sorting`
- 基线：`dc3469c docs(t4): finalize git and push record`（T4 定稿，包含 UX-04C、T2、T3、T4 与全部既有算法）
- 基线来源：没有从落后的 `main`（`10f9a68`）开发，也没有重置或覆盖其他 Agent 的分支
- 版本：`0.22.0-s1`
- 实现提交：`7422d66 feat(s1): add real Python selection, insertion and Shell sort labs`
- 按用户要求，S1 完成后停止；未开发快速排序、归并排序，未继续页面布局、知识讲解页、图论定理、AI/MCP 或任意用户代码可视化

## 1. 实现摘要

### 1.1 三种算法、一个快照、一个播放器

`selection`、`insertion`、`shell` 三个算法共用：

- 一个 `kind: 'sorting'` 的 `sortingSnapshotSchema`；
- 一个纯模型 `sortingModel.ts`；
- 一个数组渲染器 `SortingVisual.tsx`；
- 既有的 `Timeline`、播放控制、课程面板和响应式布局。

没有第二套播放器，没有三套完全独立的数组组件。数组槽位固定 `p0…p(n-1)`，每帧 `state.values` 与 `structure.elements` 逐槽一致；前进、回退和任意跳帧都只读取当前帧快照。

### 1.2 真实 Python 与官方帧数

三份源码位于 `src/domain/algorithms/sortingExamples.ts`，均为 CPython 可执行程序。官方输入与结果：

| 算法 | 官方输入 | 帧数 | 最终数组 |
| --- | --- | ---: | --- |
| 简单选择排序 | `[6,4,9,1,7,2]` | 40 | `[1,2,4,6,7,9]` |
| 直接插入排序 | `[7,3,5,1,9,2]` | 33 | `[1,2,3,5,7,9]` |
| 希尔排序 | `[8,3,7,4,9,2,6,1]` | 70 | `[1,2,3,4,6,7,8,9]` |

选择排序官方 6 轮、15 次比较、5 次候选更新、6 次交换（含最后一轮自交换）。插入排序 5 轮、12 次比较、9 次真实右移、5 次写回。Shell Sort 的 gap 序列为 `[4,2,1]`，3 个 gap 轮次、28 次比较、17 次右移、17 次写回。

### 1.3 教学语义

- **选择排序**：`select-start` 标记本轮扫描起点，`select-compare` 标记正在比较的位置，`select-candidate` 只在发现严格更小值时迁移候选，`select-swap` 才是轮末真实交换。标准交换式选择排序不稳定；最好/平均/最坏均为 `O(n²)`，辅助空间 `O(1)`。
- **直接插入排序**：`insert-key` 保存待插入元素，`insert-compare` 向左比较，只有 `a[j] > key` 才 `insert-shift`，相等不移动，最后 `insert-place` 写回 key。右移帧中的重复值是真实中间状态，key 单独保存在卡片中。标准直接插入排序稳定；最好 `O(n)`、平均/最坏 `O(n²)`，辅助空间 `O(1)`。
- **希尔排序**：`gap-change` 切换间隔，`shell-compare` 跨 gap 比较，`shell-shift` 按 gap 移动，`shell-place` 写回 lane，`gap-done` 结束当前间隔轮；`gap=1` 是普通插入排序并保证全局有序。本页只声明 `n//2` 减半序列最坏 `O(n²)`，不笼统声称所有希尔排序都是 `O(n log n)`；通常不稳定，辅助空间 `O(1)`。

### 1.4 UI、课程与注册

- `SortingVisual.tsx` 复用既有 `.bars/.bar-item/.bar`；用绿色、红色、蓝色、虚线、斜纹和 lane 轮廓区分已排序、比较、候选、key、移动目标和 lane，不隐藏无关元素。
- 新增 `src/styles/s1.css`，只负责排序专属标记、key 卡片和图例。390 px 沿用既有单列布局，无页面横向溢出。
- 三份课程 `selectionSortLesson.ts`（7 步）、`insertionSortLesson.ts`（6 步）、`shellSortLesson.ts`（7 步），中英双语，`lesson_step` 与真实 Python 帧严格一致。
- `frameInsight.ts` 新增 sorting 分支，右栏逐步解释真实操作、已排序前缀变化、比较/候选/key/右移/gap/lane 与最终数组。
- `selection` 与 `insertion` 复用原有 legacy ID，没有注册同名重复算法；`shell` 新增 legacy 入口，`npm run sync:legacy` 后 catalog 为 28 个入口，legacy fixtures 为 28 个算法基线。
- 教材 `ch9-sort/selection-sort`、`insertion-sort`、`shell-sort` 已 authored；`merge-sort` 仍是唯一 planned 排序主题。
- 三算法默认代码语言为 Python，原有 JavaScript 兼容入口保留。

## 2. 正确性与验收

| 项 | 结果 |
| --- | --- |
| 独立 CPython 校验 | ✅ `scripts/verify_sorting_python.py` 721/721 帧：3 算法 × 8 输入（官方 + 7 边界）；逐帧比较独立参考操作流 |
| 边界输入 | ✅ 已有序、完全逆序、重复元素、负数、单元素、空数组、浮点混合 |
| 不变量 | ✅ 最终升序、排序前后多重集不变、槽位 ID 连续、state 与 structure 一致 |
| 选择排序 | ✅ 每轮扫描区间真实后缀最小；轮末交换位置正确；官方 6 轮 |
| 插入排序 | ✅ 每轮插入前前缀有序、shift 真实复制、place 写回 key；官方 9 次右移 |
| 希尔排序 | ✅ gap 序列 `[4,2,1]`、gap-change 顺序、lane 同余、shift 距离；gap=1 后全局有序 |
| 稳定性身份样例 | ✅ 插入排序保持 `2a` 在 `2b` 前；选择排序与 Shell Sort 在同键不同身份样例中被真实跨越 |
| 真实帧 fixtures | ✅ `sorting-default-frames.json` 143 帧 + `sorting-edge-frames.json` 578 帧，全部通过 Zod `structureSchema` 与 `sortingSnapshotSchema` |
| 专项单测 | ✅ `sorting.test.ts` 9 项、`sortingLessons.test.ts` 4 项、`SortingVisual.test.tsx` 4 项 |
| 全量单测 | ✅ 93 个文件、776 tests 全部通过 |
| 类型检查 | ✅ `npm run typecheck` 通过 |
| 生产构建 | ✅ `npm run build` 通过；`index-B47VND16.js` 1,567.12 kB、`monaco-setup-BuO1NcI6.js` 4,122.24 kB、`index-C0HVqFDx.css` 183.09 kB |
| S1 真实 Pyodide E2E | ✅ 3/3：选择候选/交换、插入 key/真实右移/写回、Shell gap/lane/shift/gap-done；前进回退跳帧；done 全排序；390 无页面横向溢出 |
| 全量 E2E | ✅ 134/134（既有 131 条基线 + 3 条 S1，旧计数与 planned 断言已修正） |
| 回归 | ✅ 原有冒泡排序、快速排序 legacy、BST、AVL、最大堆、哈夫曼与 G1–G4 图算法全部通过 |

## 3. 截图

| 文件 | 内容 |
| --- | --- |
| `docs/s1/selection-candidate-1440-light.png` | 选择排序 frame 7/40，候选更新为 `p3=1`，已排序前缀 0/6 |
| `docs/s1/selection-done-390-light.png` | 选择排序 frame 40/40，最终 `[1,2,4,6,7,9]`，390 单栏无溢出 |
| `docs/s1/insertion-shift-1440-light.png` | 插入排序 frame 4/33，`p0=7` 右移到 `p1=7`，key=3 保持 |
| `docs/s1/insertion-done-390-light.png` | 插入排序 frame 33/33，最终 `[1,2,3,5,7,9]` |
| `docs/s1/shell-shift-1440-light.png` | 希尔排序 gap=4、lane=1，`p1=3` 按 gap 右移到 `p5=3`，key=2 |
| `docs/s1/shell-done-390-light.png` | 希尔排序 frame 70/70，gap 序列 `4 → 2 → 1`，最终 `[1,2,3,4,6,7,8,9]` |

## 4. 已知限制

- 只保证三份官方 Python 源码、官方输入与内置预设/边界输入的真实 Trace；用户改写后的任意排序代码不在 S1 的通用可视化范围。
- Shell Sort 只实现 `n//2` 反复减半的确定 gap 序列，不支持其他间隔序列；复杂度教学按该序列表述，不把所有 Shell Sort 笼统归为 `O(n log n)`。
- 插入排序右移时数组中的重复值是真实 `a[j+1]=a[j]` 的中间状态；key 在写回前只存在于 key 卡片，不伪造“洞已填好”。
- 选择排序官方包含最后一轮单元素自交换，因此有 6 次 `select-swap`；这不改变“每轮至多交换一次”的语义。
- “原地 `O(1)`”只指算法自身辅助空间；本页额外保存每帧 Trace、焦点与展示快照，不计入算法空间复杂度。
- 三算法共享现有数组柱状图与唯一播放器；没有为了 S1 建立第二套时间轴、第二套数组组件或新的页面框架。
- 按用户要求，S1 完成后停止，不自动进入 S2（快速排序、归并排序）或其他算法开发。

## 5. Git

- 分支：`feat/s1-sorting`，从 `dc3469c` 建立
- 远端：`https://gitee.com/vvvi734/algolens.git`
- 实现提交：`7422d66 feat(s1): add real Python selection, insertion and Shell sort labs`
- 文档提交：待记录
