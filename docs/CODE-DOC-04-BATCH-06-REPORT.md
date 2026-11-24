# CODE-DOC-04 BATCH-06 最终报告

- 基线：`582d4cd0cf8758e350d78a59475874867528b7f2`（BATCH-05 完成 49/60）
- 范围：教材第 10–12 章剩余的 11 个正式算法
- 结果：本批 11 个完成，累计 **60/60**；未修改算法有效代码，未进入 TEACHING-FINAL 或正式发布
- 源码提交：`4a55a52`、`974300e`、`842799b`
- 双语与测试提交：`05dee78`
- 进度与报告提交：`5f1f4d9`
- 推送：`582d4cd..5f1f4d9 main -> main`

## 1. 本批 11 个算法

| 算法 ID | 进度行 | 主要教学难点 | C/C++/Python 新增注释 |
| --- | ---: | --- | ---: |
| `bubble` | 48 | `end` 是未排序前缀末下标；`swapped` 每趟重置；内层 `< end` 排除已就位尾部；严格 `>` 决定稳定；整趟无交换的传递性证明 | 6 / 6 / 6 |
| `quick` | 49 | 末尾元素 pivot；`boundary` 是 `<= pivot` 区末位；扫描排除 pivot；`<=` 让相等键左置但不稳定；`boundary+1` 是最终位置；递归排除 pivot；有序输入退化 | 8 / 8 / 8 |
| `selection` | 50 | 前缀全局最小不变量；`minimum=start` 候选；内层从 `start+1` 开始；严格 `<` 选择；只在非自交换时写；跨等键交换导致不稳定；最后一轮无需处理 | 6 / 6 / 6 |
| `tournament` | 51 | `(value, originalIndex)` 稳定平局；`active` 逻辑删除；叶容量取 2 的幂；填充叶 `-1`；自底向上建树；赢家失效后只修复叶到根单路径 | 10 / 8 / 8 |
| `heap` | 52 | 0 基 `parent=(i-1)/2`、`children=2i+1/2i+2`；上浮父不小于即停；下沉先选较大孩子；先写旧 `size` 再自增；弹出先减 `size` 再移末尾；C 固定容量与 C++/Python 动态容量 | 9 / 8 / 8 |
| `merge` | 53 | 闭区间 `[low, high]`；中点防溢出；单缓冲跨递归复用；左段优先 `<=` 保持稳定；两段剩余循环不可省略；每层写回供父层；C 分配失败静默返回 | 8 / 7 / 7 |
| `multiway` | 55 | 每段 `cursor` + FIFO `buffer`；补充取块大小/空闲/剩余最小值；候选只取队首；赢家出队左移；输出满容量才写块；循环结束必须 flush 不满块；线性扫描 k 候选 | 9 / 7 / 7 |
| `optimal-merge` | 57 | `(k-1)` 整除缺口与虚拟零权重叶；森林按权重/真实优先/编号排序；每次取前 k 个根；父权重为子和；总代价为内部权重之和；删除已选根并回插新父 | 9 / 7 / 7 |
| `file-index` | 58 | 主键稳定排序；固定容量切块；稠密每记录一项；稀疏用块内最后键作上界；`chosen=0` 保证低位目标有块可读；命中/失败都只读一块；位置是教学模型地址 | 8 / 6 / 6 |
| `isam` | 59 | 主块容量 2 与块内有序；`InsertSorted` 只右移严格更大键；上界必须扫描专属溢出链；选第一个 `bound>=target` 块；主块未命中才读溢出；每次插入重建上界 | 8 / 7 / 6 |
| `inverted-index` | 60 | term 是表键；构建按记录顺序追加；缺失 term 返回 NULL；posting 保存记录下标；查询遍历原记录使 AND/OR 去重且稳定；AND 初值 true、OR 初值 false | 8 / 5 / 5 |
| **合计** |  |  | **238** |

## 2. 三语言实际文件

| 算法 | C | C++ | Python |
| --- | --- | --- | --- |
| `bubble` | `sources/bubble/bubble_sort.c` | `sources/bubble/bubble_sort.cpp` | `sources/bubble/bubble_sort.py` |
| `quick` | `sources/quick/quick_sort.c` | `sources/quick/quick_sort.cpp` | `sources/quick/quick_sort.py` |
| `selection` | `sources/selection/selection_sort.c` | `sources/selection/selection_sort.cpp` | `sources/selection/selection_sort.py` |
| `tournament` | `sources/tournament/tournament_sort.c` | `sources/tournament/tournament_sort.cpp` | `sources/tournament/tournament_sort.py` |
| `heap` | `sources/heap/max_heap.c` | `sources/heap/max_heap.cpp` | `sources/heap/max_heap.py` |
| `merge` | `sources/merge/merge_sort.c` | `sources/merge/merge_sort.cpp` | `sources/merge/merge_sort.py` |
| `multiway` | `sources/multiway/multiway_merge.c` | `sources/multiway/multiway_merge.cpp` | `sources/multiway/multiway_merge.py` |
| `optimal-merge` | `sources/optimal-merge/optimal_merge_tree.c` | `sources/optimal-merge/optimal_merge_tree.cpp` | `sources/optimal-merge/optimal_merge_tree.py` |
| `file-index` | `sources/file-index/indexed_file.c` | `sources/file-index/indexed_file.cpp` | `sources/file-index/indexed_file.py` |
| `isam` | `sources/isam/isam_file.c` | `sources/isam/isam_file.cpp` | `sources/isam/isam_file.py` |
| `inverted-index` | `sources/inverted-index/inverted_index.c` | `sources/inverted-index/inverted_index.cpp` | `sources/inverted-index/inverted_index.py` |

非正式 convenience 文件（`max_heap_builtin.cpp` / `.py` 等）不计入 60 个正式算法，也不在本批统计中。

## 3. 真实中文内部注释示例

- `bubble`：`一整趟没有交换说明剩余前缀的每一对相邻元素都有序；由传递性可知整个前缀已经有序，停止不会漏排。`
- `quick`：`最终交换把基准放到 <= 区域之后；boundary+1 就是它的最终位置，后续递归必须排除它。`
- `selection`：`扫描时严格 < 会保留相等键的首次出现；但最终交换仍可能让相等键互相越过。`
- `tournament`：`遍历从赢家叶结点之父开始，而不是从叶开始：叶状态已经由 active[] 表示。`
- `heap`：`数组容量固定，堆满时返回失败而不是扩容；C++ 与 Python 版使用动态存储。`
- `merge`：`分配失败会直接返回且不排序；由于接口没有状态返回值，调用方无法区分失败与成功。`
- `multiway`：`最后一次写出在循环之外，因为最后一块通常不满；丢掉它会丢失记录。`
- `optimal-merge`：`每个内部结点的权重在归并计划中支付一次，因此总代价是它们之和，而不是最终根权重。`
- `file-index`：`稀疏索引项是本块自己的最大键，不是下一块的最小键；用下一块首键会把边界相等键导向错误块。`
- `isam`：`主块末键只是最大值的起点；真实最大值可能位于该块的溢出链中。`
- `inverted-index`：`NULL 表示该关键字从未出现；已存在但 postingCount 为 0 的表是另一种状态，尽管两者都没有记录。`

对应英文（依次）：

- `A pass without a swap means every adjacent pair in the remaining prefix is ordered; by transitivity the whole prefix is sorted, so stopping loses no work.`
- `The final swap puts the pivot immediately after the <= region; boundary+1 is its final position, so later recursion must exclude it.`
- `Strict < keeps the first occurrence on equal keys during the scan, but the final swap can still move an equal key across another.`
- `The walk starts at the parent of the winner's leaf, not at the leaf: the leaf itself is already represented by active[].`
- `The array is fixed-size, so a full heap reports failure instead of growing; C++ and Python versions use dynamic storage.`
- `Allocation failure returns without sorting; the caller cannot distinguish this from success because the API has no status result.`
- `The final flush is outside the loop because the last block is usually partial; dropping it would lose records.`
- `Every internal node's weight is paid once in the merge schedule, so total cost is their sum, not the final root weight.`
- `A sparse entry is the block's own maximum, not the next block's minimum; using the next block's first key would send equal boundary keys to the wrong block.`
- `The main block's last key is only a starting maximum; the true maximum may live in this block's overflow chain.`
- `NULL means the term was never seen; an existing table with postingCount 0 would be a different state even though neither contains records.`

## 4. 人工复核的复杂算法片段

### 4.1 `heap`：先写入旧 `size`，再自增

```c
// The new value is written at the old size, then size grows; sifting uses the new last index, not the old slot.
// 新值写在旧 size 位置，随后 size 增长；上浮使用新的末尾下标，而不是旧槽位。
heap->items[heap->size] = value;
heap->size += 1;
SiftUp(heap, heap->size - 1);
```

若先自增再写入，`items[size]` 尚未初始化就被当成新元素上浮；这里的顺序是数组表示完全二叉树的必要条件。

### 4.2 `optimal-merge`：总代价不是根权重

```c
// Every internal node's weight is paid once in the merge schedule, so total cost is their sum, not the final root weight.
// 每个内部结点的权重在归并计划中支付一次，因此总代价是它们之和，而不是最终根权重。
totalCost += nodes[parent].weight;
```

最佳归并树的根权重只包含最后一次合并的代价；按内部结点逐个累加才等于整个归并计划的读写代价。

### 4.3 `isam`：溢出链可能藏着真实最大值

```c
// The main block's last key is only a starting maximum; the true maximum may live in this block's overflow chain.
// 主块末键只是最大值的起点；真实最大值可能位于该块的溢出链中。
int maximum = file->blocks[blockIndex].records[...].key;
```

主块满后记录进入该块专属溢出链；如果只取主块末键作为上界，后续查找可能把目标导向更靠前的块而永远读不到溢出记录。

## 5. 双语映射与本地化

- `batch-06-annotations.ts`：238 条，33 份文件，键为源文件名；顺序与源码插入顺序一致。
- `annotations.ts`：BATCH-06 在 BATCH-03/04/05 之后合并，保证早期锚点仍然有效。
- 专项测试逐文件校验：每条英文是源码中的独立行注释；中文含汉字；中文/英文本地化后的去注释代码与源码逐行一致。
- `ReferenceCodePanel.test.tsx`：新增 BATCH-06 的 11 项，查看器测试由 39 项增至 50 项。

## 6. 60 个正式算法覆盖验收

新增 `code-doc-04-coverage.test.ts`，从注册表读取真实算法，不硬编码文件清单：

1. `REFERENCE_CODE_ALGORITHMS` 长度 **60**；每个算法都有 C/C++/Python principle 文件；文件名去重后 **180** 份。
2. 逐算法、逐语言加载源码，确认为非空且 `REFERENCE_ANNOTATIONS[fileName]` 至少 3 条。
3. 对 180 份文件分别生成中文、英文本地化文本，并用 `stripReferenceComments` 比较有效代码：180/180 与源码一致。
4. 14 个算法抽查覆盖线性表、栈、串、树、图、动态存储、查找、内部排序、外部排序、文件索引：
   `seqlist`、`doubly`、`stack`、`kmp`、`huffman`、`threaded-inorder`、`articulation`、`free-list`、`linear`、`insertion`、`quick`、`multiway`、`isam`、`file-index`。
5. 每个抽查点使用人工复核的真实中英文注释，并验证中文视图/英文视图都能命中对应文本。

结果：**3/3** 通过。该测试不能替代逐条语义审读，但能阻止“文件名漏登记、注释锚点失效、中文映射缺失、本地化改动代码”四类回归。

## 7. 验证结果

| 项目 | 结果 |
| --- | --- |
| BATCH-06 专项 | 35/35 |
| 注释事实测试 | 4/4 |
| 60 算法覆盖 + 14 抽查 | 3/3 |
| 查看器（含 B01–B06） | 50/50 |
| 全量 Vitest | 158 files / 1565 tests |
| C 编译 / C++ 编译 | 11/11 / 11/11 |
| C 程序运行 / C++ 程序运行 | 11/11 / 11/11 |
| Python 语法 / 运行 | 11/11 / 11/11 |
| `npm run typecheck` | 退出 0 |
| `npm run build` | 退出 0（Vite 6.4.6，1951 modules） |
| Playwright BATCH-06 | 1/1 |

Playwright 用例：`e2e/code-doc-04-batch-06.spec.ts`，代表算法 `bubble`、`tournament`、`multiway`、`isam`；验证中文显示与真实剪贴板复制、切换英文后的显示与复制、英文文本不含汉字。

## 8. 未修改的实现风险

以下问题只登记，不在本批修改有效代码，也不影响 60/60 的“教学注释覆盖”口径：

1. `heap` 三语言文件头都提到“建堆/从最后一个非叶结点倒着下沉”，但源码只实现逐次 `push` 上浮，没有批量 heapify；头注释与实现口径不完全一致。
2. `merge_sort.c`：`malloc` 失败时直接 `return`，数组保持未排序；接口没有状态返回值，调用方无法区分失败与成功。
3. `isam_file.c`：`MAX_OVERFLOW=5`，`overflowCount` 增加前没有上限检查；输入超过容量可能越界写 `overflow[]`。
4. `inverted_index.c`：`MAX_TERMS=16`、`MAX_POSTINGS=9`、`MAX_KEYWORDS=4` 均未在插入时检查；当前 4 条记录样例在界内。
5. `tournament_sort.c` / `.cpp`：硬上限 12 条记录、`MAX_LEAVES=16`；超出会失败或越界，不是通用实现。
6. `multiway_merge.c`：`MAX_RECORDS=24`、`MAX_K=4`、`MAX_RUN_RECORDS=6`，输入段数与记录数受静态数组限制；`readBlocks/writeBlocks` 只是教学模型，不是磁盘访问。
7. `indexed_file.cpp` / `.py`：返回位置硬编码 `blockIndex * 3 + offset`，与示例容量 3 绑定；修改块容量而不改公式会返回错误位置。C 版使用 `BLOCK_CAPACITY` 常量，没有该问题。
8. `quick_sort` 末元素 pivot 在已排序输入上退化 O(n²)，递归深度最坏 O(n)。
9. `optimal_merge_tree` 的虚拟叶只补形状，不能当作真实零长度归并段；总代价必须按内部权重求和，不能只报根权重。
10. `isam_file.cpp` 用 `std::lower_bound` 插入，新相等键会排在已有相等键之前；C 版和 Python 版保持稳定，这是三语言行为差异。

## 9. 交付边界

本批完成 `CODE-DOC-04-BATCH-06` 后停止：

- 不进入 `TEACHING-FINAL`。
- 不创建 v1.0.0 Tag，不部署，不修改发布流程。
- 不新建分支或 worktree。
- `图论/` 目录保持未跟踪、未修改。
