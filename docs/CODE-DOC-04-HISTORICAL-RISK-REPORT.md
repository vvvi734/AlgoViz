# CODE-DOC-04 历史批次实现风险整改报告（2026-11-24）

- 整改基线：`2b436fec48bbea1d8fffa82f60a34ece2f573167`
- 整改范围：`CODE-DOC-04-BATCH-02` 至 `BATCH-05` 报告中“只登记、未修复”的全部实现风险
- 整改结果：**26 / 26 条登记已修复（覆盖 25 个风险主题），0 项遗留**
- 计数说明：按四份原始报告逐行清点，BATCH-02～05 共 26 条登记；其中 BATCH-04 的 Prim C 版与 C++/Python 版分列两行，按一个风险主题合并后为 25 个主题。此前的“25 项”表述少算了一条 Prim 登记，本报告以 26 条为准。
- 范围说明：BATCH-06 的 10 项风险已由 `CODE-DOC-04-RISK-06-REPORT.md` 单独关闭，不在本报告重复计数。

## 一、范围与计数

| 来源 | 原始登记条数 | 风险主题 | 本次修复 | 遗留 |
| --- | ---: | ---: | ---: | ---: |
| BATCH-02 第 7 节 | 3 | 3 | 3 | 0 |
| BATCH-03 第 10 节 | 6 | 6 | 6 | 0 |
| BATCH-04 第 9 节 | 11 | 10 | 11 | 0 |
| BATCH-05 第 8 节 | 6 | 6 | 6 | 0 |
| **合计** | **26** | **25** | **26** | **0** |

BATCH-04 的 Prim 风险覆盖 C、C++、Python 三个实现，表格中 C 版与 C++/Python 版分列两行，按一个风险主题合并；第二节的 25 行表格是主题视图，实际 26 条登记全部包含在这 25 行内。BATCH-05 第 7 条“B 树/B+ 树分配失败路径已由 SAFETY 阶段修复”是说明，不是新登记缺陷，未计入。

## 二、逐项修复

### 2.1 BATCH-02（3 项）

| # | 文件 | 原风险 | 修复 |
| ---: | --- | --- | --- |
| 1 | `sparse-transpose/sparse_transpose.c`、`.cpp` | `fast_transpose` 统计列时直接使用三元组 `col`，越界坐标会写坏 `num[]` | C 在统计前校验每个三元组的 `row/col`，失败返回 0；C++ 抛出 `std::invalid_argument`；Python 原有校验保留 |
| 2 | `gl-depth/`、`gl-copy/` 三语言共 6 份 | 递归没有深度预算，极深广义表可能耗尽 C 调用栈 | 增加 `GL_MAX_DEPTH=64`；C/C++ 超限返回 `-1`/`NULL`，Python 抛 `ValueError`；`gl_copy` 通过 `copy_one_limited` 传播剩余预算 |
| 3 | `static-linked-list/static_linked_list.c` | `static_init` 对 `count > CAPACITY` 静默截断，调用方无法知道输入被丢弃 | 改为返回 `int`；拒绝空表、负计数、超容量计数和“非零计数但 values 为空”；`main` 检查返回值 |

### 2.2 BATCH-03（6 项）

| # | 文件 | 原风险 | 修复 |
| ---: | --- | --- | --- |
| 4 | `huffman/huffman.c` | 初始叶子 `make_node` 失败后直接解引用 NULL | 检查每个叶子分配；失败时回收已建森林并返回 1 |
| 5 | `huffman/huffman.c` | 合并循环的 `parent` 分配失败后继续写 `left/right` | 检查父节点分配与堆压入；失败时回收森林并返回 1 |
| 6 | `huffman/huffman.c` | `MinHeap` 固定容量且无运行时检查，大输入会越界 | 容量扩为 64；`heap_push` 返回 `int` 并检查满堆/NULL；`heap_pop` 空堆返回 NULL；路径缓冲同步扩容 |
| 7 | `bfs/bfs.c`、`dfs/dfs.c` | 起点未校验，越界 `start` 会读坏邻接表 | 改为 `int BFS/DFS`；入口校验 `0 <= start < VERTEX_COUNT`，越界打印错误并返回 0；`main` 检查 |
| 8 | `seqlist/seqlist.c` | `ListErase` 未检查 `removed` 输出指针 | 增加 `list == NULL || removed == NULL` 检查，避免写空指针 |
| 9 | `doubly/doubly_linked_list.c` | `list_remove` 假定结点属于该链表，错误结点会破坏链 | 改为返回 `int`；先 O(n) 扫描确认归属，再改 `prev/next` 并释放；不属于返回 0 |

### 2.3 BATCH-04（11 条登记，10 个主题）

| # | 文件 | 原风险 | 修复 |
| ---: | --- | --- | --- |
| 10 | `prim/prim.c`、`.cpp`、`.py` | 用 0 表示无边，真实零权边被拒绝或从输出中隐藏 | C 矩阵保留 `INF` 表示无边，松弛条件改为 `< INF`；C++/Python 候选改为 `(weight, vertex, parent)`，根种子 `parent=-1`，用 parent 是否存在决定是否输出树边 |
| 11 | `kruskal/kruskal.cpp`、`.py` | `used == 4` 写死顶点数，非 5 顶点图提前停止 | 从边端点最大值推导 `vertex_count`，停止条件改为 `used == vertex_count - 1` |
| 12 | `topological/topological_sort.py` | `len(order) != 6` 把合法的小图误报为环 | 改为 `len(order) != len(graph)`，并校验每条边端点在图范围内 |
| 13 | `critical-path/critical_path.c` | 假定活动数组已拓扑有序，乱序输入会用到未完成前驱 | 新增 Kahn 入度队列求 `order[]`；按拓扑序正推、逆拓扑序倒推；项目工期取所有事件最大值；有环打印 `cycle detected` 并返回 |
| 14 | `dijkstra/dijkstra.cpp` | `path_to` 对不可达目标仍打印一条“路径” | 增加 `source` 参数；目标越界或 `target != source && previous[target] == -1` 返回 `path: unreachable` |
| 15 | `dijkstra/dijkstra.py` | 未登记顶点触发 `KeyError`，负权也未拒绝 | 初始化时校验源点、边目标和边权非负；`path_to` 对未知目标抛 `ValueError` |
| 16 | `buddy-system/buddy_system.c` | 非 2 的幂容量初始化不报错，后续分配才失败 | `init_memory` 改为返回 `int`，非 2 的幂直接失败；`main` 检查 |
| 17 | `buddy-system/buddy_system.c` | `MAX_LABEL=4` 截断标签；重复标签让释放只能命中第一个块；分裂可能半完成 | `MAX_LABEL` 扩到 32、`MAX_BLOCKS` 扩到 128；拒绝空/过长/重复已用标签；`insert_block` 返回 `int`；分裂前预检查块表容量 |
| 18 | `garbage-collection/garbage_collection.c` | 弹出时才标记，宽扇出会让同一对象重复入栈，显式栈越界 | 改为入栈即标记（根与孩子都先置 `marked=1` 再压栈），每个对象最多入栈一次 |
| 19 | `garbage-collection/garbage_collection.c` | 固定 `root = 0`，根不在对象表第 0 项时会漏标或误标 | 新增 `roots[]`、`root_count`、`add_root`；`reset_graph` 建立显式根集合；`mark_reachable` 遍历根集合 |

### 2.4 BATCH-05（6 项）

| # | 文件 | 原风险 | 修复 |
| ---: | --- | --- | --- |
| 20 | `bst/bst.c` | 分配失败返回 NULL，父结点可能把已有孩子置空 | `BSTInsert` 增加 `bool *failed`；失败置位并返回 NULL；父结点看到 `failed` 直接返回原 root，不写孩子；`main` 失败时释放整树并返回 1 |
| 21 | `avl/avl_tree.c` | 插入分配失败可能断链 | `AVLInsert` 增加 `int *failed`；分配失败不覆盖原子树；`main` 检查并释放整树。AVL 仍无删除，属原定功能范围 |
| 22 | `hash-chain/hash_chain.c` | `table_free` 释放结点但不清理桶头，表变成悬空指针集合 | 每个桶释放完链后执行 `buckets[i] = NULL` |
| 23 | `hash-probe/hash_probe.cpp`、`.py` | `kEmpty=-1` / `EMPTY=-1` 与真实键冲突 | C++ 改用 `std::optional<int>` 槽；Python 改用 `None` 槽；`-1` 成为合法键 |
| 24 | `key-tree/key_tree.c` | `find_word` 硬编码 root=0；插入不校验长度和字符；失败插入不回滚 | `find_child` 校验 parent 范围与小写字母；`find_word` 使用全局 `root`；`insert_word` 校验 NULL、长度和字符，失败时回滚 `node_count` 并断开第一条新边；`print_words` 加深度上限 |
| 25 | `bplus-tree/bplus_tree.c` | `MAX_NODES=72` 静态池，超过后插入失败 | 改为 `BPlusNode *nodes` + 几何扩容；`realloc` 失败返回 -1 且旧表不变；`release_node` 保持 LIFO 回滚；结束时 `free(nodes)`；`node_limit=0` 默认不设上限，仅测试可注入有限预算 |

## 三、同步修改

- `src/domain/reference-code/annotations.ts`：`static_linked_list.c` 的“静默截断”注释改为“拒绝超容量前缀”。
- `src/domain/reference-code/batch-04-annotations.ts`：更新 Prim、Kruskal、拓扑排序、关键路径、Dijkstra、GC 的 9 条旧锚点。
- `src/domain/reference-code/batch-05-annotations.ts`：更新 AVL、B+、BST、哈希链、开放定址、键树的 7 条旧锚点。
- `batch-04-teaching.test.ts` / `batch-05-teaching.test.ts`：移除与 `HEAD` 源码比较的断言，因为本轮有意修改了有效代码；保留注释锚点、双语本地化与代码一致性断言。
- `ReferenceCodePanel.test.tsx`：同步 4 个代表性算法的中英文锚点。
- `safety-01-bplus.test.ts` / `bplus_harness.c`：适配动态节点表；新增 500 键 `dynamic-growth` 用例，验证节点数超过旧的 72 上限仍能插入并通过结构校验。

## 四、验证

| 检查 | 结果 |
| --- | --- |
| C 参考源码 | 63/63 `gcc -std=c11 -Wall -Wextra -Wpedantic -Werror -fsyntax-only` 通过 |
| C++ 参考源码 | 74/74 `g++ -std=c++17` 同警告集通过 |
| Python 参考源码 | 74/74 内存 `compile()` 通过 |
| 批次注释测试 | `batch-04-teaching.test.ts` + `batch-05-teaching.test.ts` 70/70 通过 |
| B+ 失败注入与动态扩容 | `safety-01-bplus.test.ts` 全部通过，含 500 键动态增长 |
| 全量 Vitest | 159 文件 / 1576 测试通过 |
| `npm run typecheck` | 退出 0 |
| `npm run build` | 退出 0 |
| 全量 Playwright | 见 `docs/RELEASES/v1.0.0-release-check-2026-11-24.md` |

验证边界：26 条登记均已完成源码修复、全量编译和现有回归；其中 B+ 动态扩容增加了直接行为用例，其余项目主要依靠既有官方输入、专项测试与全量回归验证，未对每一条都构造恶意输入的独立 harness。
