# CODE-DOC-04 RISK-06 实现风险修复报告

日期：2026-11-24  
修复基线：`6dc7af5`（BATCH-06 最终提交）  
范围：`CODE-DOC-04-BATCH-06-REPORT.md` 第 8 节登记的 10 项实现风险。

## 1. 结论

BATCH-06 登记的 10 项风险已全部修复。修复覆盖三语言参考源码中的注释口径、C 分配与容量失败路径、静态上限、索引地址公式、快速排序有序输入退化、最佳归并树虚拟叶语义，以及 ISAM 相等键稳定性。

验证结果：

| 检查项 | 结果 |
| --- | --- |
| RISK-06 专项回归 | 10/10 通过 |
| 全量 Vitest | 159 files / 1575 tests 通过 |
| BATCH-06 注释专项 | 35/35 通过 |
| `npm run typecheck` | 退出 0 |
| `npm run build` | 退出 0 |
| Playwright BATCH-06 代表性验收 | 1/1 通过 |
| 受影响参考程序编译/运行 | C 8/8、C++ 6/6、Python 9/9 |

本批没有新增算法，没有改变 60/60 的 principle 覆盖率口径。

## 2. 逐项修复

### 2.1 `heap` 文件头与实现口径

问题：三语言文件头声称“从最后一个非叶结点倒着下沉建堆”，实现只有逐次 `push` 上浮，没有批量 heapify。

修复：C/C++/Python 的中文导读、阅读顺序、易错点和复杂度统一改为“逐次插入建堆 O(n log n)，不含批量 heapify”。文件头不再暗示存在自底向上建堆。

验证：BATCH-06 注释锚点测试；三语言堆程序编译/运行。

### 2.2 `merge_sort.c` 分配失败静默返回

问题：临时缓冲区 `malloc` 失败时直接 `return`，数组保持未排序；`void MergeSort` 没有状态返回值。

修复：

- `MergeSort` 由 `void` 改为 `int`：成功返回 1，分配失败返回 0。
- `main` 检查返回值，失败时输出错误并返回非零。
- 注释明确说明“返回状态而不是静默留下未排序数组”。

验证：`merge_oom.c` 用宏替换 `malloc` 注入失败，确认 `MergeSort` 返回 0 且不写入排序结果；正常程序输出 `0..9`。

### 2.3 `isam_file.c` 溢出区越界

问题：`MAX_OVERFLOW=5`，创建溢出链头或新结点前没有检查 `overflowCount`，可能越界写 `overflow[]`。

修复：

- `Insert` 由 `void` 改为 `int`，容量不足返回 0。
- 创建溢出头之前检查全局节点池。
- 链接新溢出结点之前再次检查，避免写出半条链。
- `main` 处理拒绝路径。

验证：`isam_capacity.c` 构造 2 条主块记录并持续插入，确认只接受 10 条、使用 5 个溢出结点，第 11 条被拒绝且不越界。

### 2.4 `inverted_index.c` 词表与 posting 上限

问题：`MAX_TERMS=16`、`MAX_POSTINGS=9`、`MAX_KEYWORDS=4` 在插入时未检查。

修复：

- `FindOrCreateTerm` 在词表满时返回 -1。
- `BuildIndex` 先校验 `recordCount`、每个 `keywordCount`，再检查 posting 容量。
- 任一步失败时重置 `listCount` 并返回 0；`main` 输出失败并返回非零。

验证：`inverted_capacity.c` 构造 36 个不同词，确认第 17 个词被拒绝、`listCount` 回到 0；同时验证 `keywordCount=5` 被拒绝。

### 2.5 锦标赛排序 12 条记录上限

问题：C 版固定 `MAX_RECORDS=12`、`MAX_LEAVES=16`；C++ 有 `n > 12` 拒绝；Python 有 `1..12` 限制。

修复：

- C 版新增 `TournamentSort` 入口，按 `n` 动态分配 `records/active/tree/output`，用 `LeafCapacity` 计算最小 2 的幂叶容量并检查 `2*leafCount` 的 `int` 溢出。
- C++ 删除 12 条上限。
- Python 删除 12 条上限，支持空数组。

验证：C harness 排序 64 条记录；Python harness 排序 64 条记录；均检查全序。

### 2.6 多路归并静态数组上限

问题：C 版 `MAX_RECORDS=24`、`MAX_K=4`、`MAX_RUN_RECORDS=6`、`MAX_BUFFER=4` 把段数、段长和缓冲容量固定死。

修复：

- `InputRun.records` 与 `InputRun.buffer` 改为指针，`OutputBuffer.records` 改为指针。
- `MultiwayMerge` 按调用方传入的 `k`、段长和 `bufferCapacity` 动态分配每段 FIFO、输出缓冲和 `written` 数组。
- 新增 `FreeRunBuffers`；任一段分配失败时释放已分配资源并返回 -1。
- `main` 只保留两个示例段，不再声明固定上限。

验证：`multiway_large.c` 使用 7 段、每段 6 条（42 条记录），确认全部归并、`readBlocks=21`、`writeBlocks=14`。

### 2.7 索引文件位置公式硬编码

问题：`indexed_file.cpp` / `.py` 返回位置写死 `blockIndex * 3 + offset`，修改块容量后位置错误。

修复：

- C++ `Lookup` 增加 `capacity` 参数，返回 `blockIndex * capacity + offset`；调用处传 3。
- Python `lookup` 增加 `capacity` 参数，返回 `block_index * capacity + offset`；调用处传 3。
- 注释说明容量必须与 `BuildBlocks` 使用同一布局。

验证：`indexed_capacity.cpp` 用容量 4 建块，查找键 106，期望位置 5，实际返回 5。

### 2.8 快速排序有序输入退化

问题：固定末尾元素为 pivot，已排序输入退化 O(n²)，递归深度最坏 O(n)。

修复：

- 三语言新增三数取中：比较 `low/middle/high`，把中位数换到末尾作为 pivot。
- 递归改为“先递归较小侧、较大侧用循环”，使栈深稳定在 O(log n)。
- 注释、复杂度和易错点同步更新。

验证：`quick_large.c` 对 20 万条升序和降序记录各排序一次，结果正确；Python harness 对 10 万条升序记录排序正确。专项测试还覆盖原 10 条示例与空数组/单元素。

### 2.9 最佳归并树虚拟叶语义

问题：虚拟叶只补形状；原实现没有验证虚拟叶是否改变真实记录总权重，也没有区分虚拟叶与真实零长度段。

修复：

- C/C++ 增加 `realWeight` 累计与根权重校验；虚拟叶权重保持 0，根权重必须等于真实权重，否则返回失败。
- Python 增加根权重校验和“虚拟叶权重必须为 0”的校验。
- Python 移除 `1..12`、`k 2..4`、权重 `<=999` 的人为限制；C++ 增加 `k >= 2` 校验；C 版增加 `segmentCount <= MAX_SEGMENTS` 校验。
- 注释明确虚拟叶只改变树形，不进入归并段。

验证：`optimal_shape.c` 用权重 `{1,2,3,4,5}`、`k=3`，期望总代价 21；确认根权重 15、虚拟叶 0 个。Python harness 用 20 段、`k=3`，确认真实权重和与虚拟叶权重约束。

### 2.10 ISAM C++ 相等键稳定性

问题：`isam_file.cpp` 两处 `std::lower_bound` 把新相等键插到已有相等键之前，与 C/Python 的稳定行为不一致。

修复：主块和溢出链均改为 `std::upper_bound`，比较器改为 `(key, Record)`，新记录插在相等键之后；注释说明与 C/Python 稳定性规则一致。

验证：`isam_stable.cpp` 插入两条键 101、标签 X/Y，确认溢出区顺序为 X 后 Y。

## 3. 接口与调用点变更

| 文件 | 变更 |
| --- | --- |
| `merge_sort.c` | `void MergeSort(int*, int)` → `int MergeSort(int*, int)`，0 表示分配失败 |
| `isam_file.c` | `static void Insert(IsamFile*, Record)` → `static int Insert(...)`，0 表示容量不足 |
| `inverted_index.c` | `BuildIndex` 由 `void` → `int`；`FindOrCreateTerm` 表满返回 -1 |
| `indexed_file.cpp` | `Lookup(..., int target, int capacity, Io&)` |
| `indexed_file.py` | `lookup(blocks, index, target, capacity)` |
| `tournament_sort.c` | 新增 `static int TournamentSort(const int*, int, Record*)` |
| `multiway_merge.c` | `InputRun.records/buffer`、`OutputBuffer.records` 改为指针；`MultiwayMerge` 返回 -1 表示规模或分配失败 |
| `quick_sort` | 新增 `MedianOfThree` / `median_of_three`；递归入口改为小侧递归、大侧循环 |
| `optimal_merge_tree.c/.cpp/.py` | 增加根权重校验；C++ 增加 `k >= 2`；Python 移除人为上限 |

查看器与注释测试已同步：`ReferenceCodePanel.test.tsx` 的归并回退断言由 `void MergeSort` 改为 `int MergeSort`，原先“分配失败静默返回”的展示断言改为“返回状态可区分失败”。

## 4. 回归测试

新增 `src/domain/reference-code/risk-06.test.ts` 与 `risk-06-test/` 下的 10 个 harness：

- C：`tournament_large.c`、`multiway_large.c`、`isam_capacity.c`、`inverted_capacity.c`、`quick_large.c`、`merge_oom.c`、`optimal_shape.c`。
- C++：`isam_stable.cpp`、`indexed_capacity.cpp`。
- Python：`python_checks.py`。

测试使用 `gcc -std=c11 -Wall -Wextra -Werror`、`g++ -std=c++17 -Wall -Wextra -Werror` 编译 harness，运行时检查边界输出；Python 用当前解释器执行。专项结果 **10/10**。

所有受影响的主程序另行手工编译运行：C 8/8、C++ 6/6、Python 9/9，均退出 0。

## 5. 全量验证

- 全量 Vitest：**159 files / 1575 tests** 通过。
- BATCH-06 注释专项：**35/35** 通过。
- `npm run typecheck`：退出 0。
- `npm run build`：退出 0。
- Playwright `e2e/code-doc-04-batch-06.spec.ts`：**1/1** 通过，覆盖 `bubble`、`tournament`、`multiway`、`isam` 的中英显示与复制。

## 6. 范围与残余边界

- 本轮只修复 BATCH-06 报告第 8 节的 10 项。BATCH-02～BATCH-05 报告中登记的其他风险不在本轮范围。
- `optimal_merge_tree.c` 仍使用固定的 `MAX_SEGMENTS=12` / `MAX_NODES` 教学数组；本轮增加了边界校验和失败返回，但没有改成无上限动态实现。
- `inverted_index.c` 仍保留固定 `MAX_TERMS/MAX_POSTINGS/MAX_KEYWORDS`；本轮保证越界前失败，不保证无限容量。
- 多路归并的 `readBlocks/writeBlocks` 仍是教学模拟 I/O，不是磁盘访问。
- `图论/` 目录保持未跟踪、未修改。
- graphify 安装与仓库图谱生成仍未完成；`.venv` 是上一轮中断流程的临时产物。

## 7. Git 交付

- 修复提交：`7c10f54`（`fix(code-doc-04): resolve BATCH-06 implementation risks`）。
- 推送目标：`https://gitee.com/vvvi734/algolens.git` 的 `main`。
- 推送结果：`6dc7af5..7c10f54 main -> main`。
