# CODE-DOC-04 BATCH-05 最终报告

- 基线：`c6272a8b3d79373030152dcab2609ec4361ec818`（BATCH-04 完成 38/60）
- 范围：按教材顺序领取的 11 个未完成查找/内部排序算法
- 结果：本批 11 个完成，累计 **49/60**；未修改算法有效代码，未进入 BATCH-06
- 提交：`94a18ad`、`18b9188`、`feb4756`、`51b8a64`、`77bee84`（文档提交见末尾）

## 1. 本批 11 个算法

| 算法 ID | 进度行 | 主要教学难点 | C/C++/Python 新增注释 |
| --- | ---: | --- | ---: |
| `linear` | 36 | 循环上界 `count` 与 `count-1` 的区别；首个命中与 `-1` 失败值的语义；重复键返回最小下标；哨兵写法的收益与覆盖风险 | 5 / 5 / 5 |
| `binary` | 37 | 闭区间 `[low, high]` 的有效窗口；中点与边界收缩；非降序前提未检查；重复键不保证首个位置 | 7 / 7 / 7 |
| `bst` | 39 | 左小右大不变量；递归返回值必须写回父指针；重复键拒绝；分配失败可能断开原子树；C 版没有删除 | 8 / 8 / 8 |
| `avl` | 40 | 空树高 0 与平衡因子符号；LL/RR/LR/RL 的选择依据；旋转后高度更新顺序；三语言均只有插入 | 10 / 8 / 8 |
| `btree` | 41 | `ORDER=4` 下 3 键/4 孩子的索引关系；满孩子先分裂再下降；中位键提升并移出孩子；借位与合并的三方指针转移；删除后根收缩 | 16 / 15 / 14 |
| `bplus-tree` | 42 | 记录只在叶层；内部键等于右子树最小键；叶 2/2 分裂保留提升键；内部中位键提升并移除；`next` 链顺序；范围扫描不回到根 | 15 / 12 / 8 |
| `key-tree` | 43 | 26 字母的孩子映射；逐字符下降；词尾标记；根结点 id 硬编码为 0；长词未校验与失败无回滚 | 10 / 8 / 8 |
| `hash-chain` | 44 | 桶头与链结点所有权；C 头插、C++/Python 尾插的差异；查重沿链扫描；释放后桶头悬空；无删除 | 8 / 5 / 5 |
| `hash-probe` | 45 | `EMPTY=-1` 与非负键前提；线性探测回绕；查重必须走完整探测序列；遇到 EMPTY 才终止的依据；无墓碑 | 7 / 6 / 6 |
| `insertion` | 46 | 已排序前缀 `[0, i)`；暂存当前键形成空位；严格 `>` 停止搬移；稳定性依据；最坏比较次数 | 8 / 7 / 8 |
| `shell` | 47 | gap 子序列仍是插入排序；`gap=n/2` 序列；最后一轮 `gap=1` 才保证全局有序；跨步移动破坏稳定性 | 6 / 7 / 7 |
| **合计** |  |  | **272** |

## 2. 三语言实际文件

| 算法 | C | C++ | Python |
| --- | --- | --- | --- |
| `linear` | `sources/linear/linear_search.c` | `sources/linear/linear_search.cpp` | `sources/linear/linear_search.py` |
| `binary` | `sources/binary/binary_search.c` | `sources/binary/binary_search.cpp` | `sources/binary/binary_search.py` |
| `bst` | `sources/bst/bst.c` | `sources/bst/bst.cpp` | `sources/bst/bst.py` |
| `avl` | `sources/avl/avl_tree.c` | `sources/avl/avl_tree.cpp` | `sources/avl/avl_tree.py` |
| `btree` | `sources/btree/btree.c` | `sources/btree/btree.cpp` | `sources/btree/btree.py` |
| `bplus-tree` | `sources/bplus-tree/bplus_tree.c` | `sources/bplus-tree/bplus_tree.cpp` | `sources/bplus-tree/bplus_tree.py` |
| `key-tree` | `sources/key-tree/key_tree.c` | `sources/key-tree/key_tree.cpp` | `sources/key-tree/key_tree.py` |
| `hash-chain` | `sources/hash-chain/hash_chain.c` | `sources/hash-chain/hash_chain.cpp` | `sources/hash-chain/hash_chain.py` |
| `hash-probe` | `sources/hash-probe/hash_probe.c` | `sources/hash-probe/hash_probe.cpp` | `sources/hash-probe/hash_probe.py` |
| `insertion` | `sources/insertion/insertion_sort.c` | `sources/insertion/insertion_sort.cpp` | `sources/insertion/insertion_sort.py` |
| `shell` | `sources/shell/shell_sort.c` | `sources/shell/shell_sort.cpp` | `sources/shell/shell_sort.py` |

非正式 convenience 文件（如 `bst_builtin.cpp`）不计入 60 个正式算法，也不在本批统计中。

## 3. 真实中文内部注释示例

- `linear`：`-1 不属于任何有效下标，因此真实命中下标 0 不会与失败值混淆。`
- `binary`：`非降序前提只写在契约里，这个 C 入口并不检查；它信任调用方，未排序数组会丢掉有效候选。`
- `bst`：`分配失败会置 inserted=false，但这个教学函数仍返回 NULL；生产调用方必须向上传播失败，不能把 NULL 覆盖到已有子树上。`
- `avl`：`符号很重要：正值表示左重，只有正失衡才可能选择 LL 或 LR；只看绝对值不够。`
- `btree`：`4 阶的中位下标是 1；它被移入父结点并从孩子中删除，两半不会同时保留它。`
- `bplus-tree`：`溢出键存在后按 2/2 分裂：右叶保留 keys 2、3，左叶保留 keys 0、1，提升的分隔键仍留在右叶。`
- `key-tree`：`这里把根结点 id 硬编码为 0。只要根是第一个分配且从不释放的结点，这个假设成立，但 find_word 并不校验它。`
- `hash-chain`：`这个函数释放结点但不清理桶头；返回后表中仍是悬空指针，复用前必须重新初始化。`
- `hash-probe`：`EMPTY 哨兵是 -1，因此这种表示假设键非负；把 -1 当作真实键存入会让该槽与空槽无法区分。`
- `insertion`：`严格的 > 是稳定性决策：相等键会停止搬移，新键落在它们之后，相对次序得以保留。`
- `shell`：`希尔排序是对交错子序列做一系列插入排序；它不是稳定排序，因为较早的 gap 轮次可能让相等键互相越过。`

对应英文（依次）：

- `-1 lies outside every valid index, so a real match at index 0 is never confused with the failure value.`
- `The non-decreasing precondition is documented but not checked here; this C entry trusts the caller, so an unsorted array would discard valid candidates.`
- `Allocation failure sets inserted=false, but this teaching function still returns NULL; a production caller must propagate failure instead of assigning NULL over an existing subtree.`
- `The sign matters: positive means left-heavy, so only positive imbalance can select LL or LR; magnitude alone is not enough.`
- `The median index is 1 for order 4; it is moved to the parent and removed from the child, so the two halves never both retain it.`
- `The split is 2/2 after the overflow key is present: right keeps keys 2 and 3, left keeps keys 0 and 1, and the promoted separator stays in the right leaf.`
- `This hard-codes the root id as 0. It is true while the root is the first allocated node and never released, but find_word does not verify that assumption.`
- `The function frees nodes but does not clear bucket heads; after it returns the table holds dangling pointers and must be re-initialized before reuse.`
- `The EMPTY sentinel is -1, so this representation assumes non-negative keys; storing -1 as a real key would make that slot indistinguishable from empty.`
- `The strict > is the stability decision: equal keys stop the shift, so the new key lands after them and their relative order survives.`
- `Shell sort is a sequence of insertion sorts on interleaved subsequences; it is not a stable sort because earlier gap passes can move equal keys past each other.`

## 4. 人工复核的复杂算法片段

### 4.1 `bst.c` 分配失败边界

```c
BSTNode *node = (BSTNode *)malloc(sizeof(BSTNode));
// Allocation failure sets inserted=false, but this teaching function still returns NULL; a production caller must propagate failure instead of assigning NULL over an existing subtree.
if (node == NULL)
{
    *inserted = false;
    return NULL;
}
```

复核结论：注释指出教学实现的风险，但没有改写有效代码。调用方若把 NULL 写回 `left/right`，会丢失原子树；这是已登记缺陷，不在本批修复。

### 4.2 `btree.c` 中位键提升与子指针迁移

```c
int middle = MAX_KEYS / 2;
int median = full->keys[middle];
right->key_count = MAX_KEYS - middle - 1;
for (int offset = 0; offset < right->key_count; ++offset)
{
    right->keys[offset] = full->keys[middle + 1 + offset];
}
if (full->children[0] != NULL)
{
    for (int offset = 0; offset <= right->key_count; ++offset)
    {
        right->children[offset] = full->children[middle + 1 + offset];
    }
}
full->key_count = middle;
```

复核结论：`ORDER=4 → MAX_KEYS=3 → middle=1`；右半取 key 2 及 child 2、3；左半收缩为 1 键、2 孩子；提升键不留在任何孩子中。注释与代码一致。

### 4.3 `bplus_tree.c` 叶 2/2 分裂与 `next` 链

```c
nodes[right].key_count = nodes[node].key_count - 2;
for (int index = 2; index < nodes[node].key_count; ++index)
{
    nodes[right].keys[index - 2] = nodes[node].keys[index];
}
nodes[right].next = nodes[node].next;
nodes[node].next = right;
nodes[node].key_count = 2;
result.separator = nodes[right].keys[0];
```

复核结论：溢出后 4 键按 2/2 切分；右叶先接旧后继、左叶再接右叶，链不会断；提升键仍保留在右叶首位置。注释与代码一致。

### 4.4 `hash_probe.cpp` 哨兵冲突

```cpp
// kEmpty is also a legal int key, and this class does not reject -1; inserting -1 would make a real key look empty to contains(). Non-negative keys are therefore an implicit precondition.
static constexpr int kEmpty = -1;
```

复核结论：`contains(-1)` 会在探测到值为 -1 的槽时立即判空，真实键 -1 永远不可命中。注释只声明前提，不修改有效代码。

## 5. 本地化、显示与复制

- `batch-05-annotations.ts` 共 **272** 条中英映射，覆盖 **33** 个文件；`en` 为源码中独立 `// ` / `# ` 注释，`zh` 为对应中文。
- `annotations.ts` 在 BATCH-03、BATCH-04 之后追加合并；专项测试验证合并后 `en` / `zh` 仍各自唯一。
- 查看器测试新增 11 个算法循环项：中文视图含 `zh` 且不含 `en`；英文视图含 `en` 且无汉字；两次复制分别包含当前语言注释。
- 代表性 Playwright 使用 `linear`、`btree`、`bplus-tree`、`hash-probe`，从真实页面切换中英文并用剪贴板读取验证，**1/1** 通过。

## 6. 有效代码一致性

- `batch-05-teaching.test.ts` 对 33 个文件执行 `stripReferenceComments`，再与工作区源码及 `git show HEAD:path` 比较；结果 **33/33** 一致。
- `git diff --stat`：**296 insertions / 22 deletions**。新增正式教学注释 **272** 条；其余增删来自 4 个文件头的错误事实修正，不涉及有效代码。
- 文件头修正：`bst.c` 不再声称删除；`avl_tree.c` / `avl_tree.cpp` 明确只实现插入；`hash_chain.c` 删除不存在的 `remove` 声明，并修正 `table_free` 后桶头仍悬空的事实。
- 全量 Vitest 后追加的 `leaf flag` → `leaf marker` / `leaf boolean` 措辞修正只改注释与映射，未触碰代码。

## 7. 编译、测试、类型检查与构建

| 检查 | 结果 |
| --- | --- |
| C 编译（11 文件，`gcc -std=c11 -Wall -Wextra -O2`） | 11/11 通过 |
| C++ 编译（11 文件，`g++ -std=c++17 -Wall -Wextra -O2`） | 11/11 通过 |
| C/C++ 参考程序运行 | 22/22 退出码 0 |
| Python 语法检查（`compile`，不生成 `__pycache__`） | 11/11 通过 |
| Python 参考程序运行 | 11/11 退出码 0 |
| BATCH-05 专项测试 | 35/35 通过 |
| 注释事实测试 | 4/4 通过 |
| 查看器测试 | 39/39 通过 |
| 全量 Vitest | 156 files / 1516 tests 通过 |
| 代表性 Playwright | 1/1 通过 |
| `npm run typecheck` | 退出 0 |
| `npm run build` | 退出 0（Vite 6.4.6，1950 modules） |

代表性运行输出：

- `linear`：`find 4: index=3`、`find 8: index=-1`
- `btree`：删除 17 后树仍可查找，删除 99 不改变树
- `bplus-tree`：插入 12 后范围 `[10,18]` 返回 `10 12 15`
- `hash-probe`：`contains 44: yes`、`contains 7: no`

## 8. 尚存缺陷（只登记，未修复）

1. `bst.c`：`malloc` 失败返回 NULL，父结点可能把原孩子指针置 NULL，丢失原子树；C 版无删除。
2. `avl_tree.c`：插入分配失败同样可能断链；三语言 AVL 均无删除。
3. `hash_chain.c`：`table_free` 释放结点但不清理桶头；返回后表处于悬空指针状态，复用前必须重新初始化。
4. `hash_probe.cpp` / `hash_probe.py`：`EMPTY=-1` 与真实键冲突；C 版明确只接受非负键。
5. `key_tree.c`：`find_word` 硬编码 root id=0；`MAX_WORD_LENGTH=8` 未在插入时校验；失败插入无回滚。
6. `bplus_tree.c`：静态池 `MAX_NODES=72`，超出后插入失败；无删除。
7. B 树/B+ 树分配失败路径已由 SAFETY 阶段修复，本批注释只说明，不重构。

## 9. 提交与推送

| 组 | 算法/内容 | 提交 |
| --- | --- | --- |
| 1 | `linear`, `binary`, `bst` | `94a18ad` |
| 2 | `avl`, `btree`, `bplus-tree` | `18b9188` |
| 3 | `key-tree`, `hash-chain`, `hash-probe` | `feb4756` |
| 4 | `insertion`, `shell` | `51b8a64` |
| 5 | 双语 annotation、专项测试、查看器与 Playwright | `77bee84` |

推送目标：`origin main`。本批不创建分支、worktree 或 Tag，不部署；`图论/` 保持未跟踪且未修改。

## 10. 结论

BATCH-05 的 11 个算法均完成三语言教学注释、双语映射、查看器显示与复制验证；有效代码与基线一致，编译、运行、全量测试、类型检查和生产构建全部通过。累计进度 **49/60**，剩余 11 个算法留待 BATCH-06。
