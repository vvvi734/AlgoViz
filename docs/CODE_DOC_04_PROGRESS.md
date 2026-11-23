# CODE-DOC-04 教学注释深化进度清单

本清单只登记课程注册表 `REFERENCE_CODE` 中的 60 个正式算法；每个算法的 C、C++、Python principle 源码各一份。非正式的 convenience 对照文件不纳入总数，也不以注释条数判定完成。

- BATCH-03 起始基线：`976002fdc58d89afaf91d747c9b7cdee01c86edf`
- BATCH-04 起始基线：`55233ca148f8d1f2d16fb6504eb2f7dd9e8edf73`（BATCH-03 已完成 27/60）
- 排序口径：教材第 1–12 章章序 → 章节课程目录实际出现顺序 → 算法 ID。本表已按该稳定顺序排列，CH1 无正式算法。
- 完成口径：必须存在该算法的教学注释提交哈希，并完成双语 anchor、源码编译/语法检查与专项测试；仅有注释条数不计为完成。
- 当前统计：**38 / 60 已完成且有证据**，0 个本批进行中，22 个尚未完成，0 个阻断。

## 分类统计

| 分类 | 数量 | 说明 |
| --- | ---: | --- |
| 已完成且有证据 | 38 | BATCH-01 6 个、BATCH-02 10 个、BATCH-03 11 个、BATCH-04 11 个，均有提交哈希与源码证据。 |
| 本批进行中 | 0 | BATCH-04 的 11 个算法均已按组提交；全批门禁见 BATCH-04 报告。 |
| 尚未完成 | 22 | 未领取或无教学深化提交，保持原状。 |
| 存在例外或阻断 | 0 | 本批未发现阻断；新发现实现风险只在报告第 8 节登记，未擅自修复。 |

## 60 项正式算法状态

| # | 章节 | 算法 ID | C 参考源码 | C++ 参考源码 | Python 参考源码 | 教学深化状态 | 批次 | 提交哈希 | 教学质量复核 |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | CH2 线性表 | `seqlist` | `sources/seqlist/seqlist.c` | `sources/seqlist/seqlist.cpp` | `sources/seqlist/seqlist.py` | 已完成且有证据 | BATCH-03 | `a9b2401` | 通过（注释/本地化/编译/专项测试） |
| 2 | CH2 线性表 | `linked` | `sources/linked/singly_linked_list.c` | `sources/linked/singly_linked_list.cpp` | `sources/linked/singly_linked_list.py` | 已完成且有证据 | BATCH-03 | `a9b2401` | 通过（注释/本地化/编译/专项测试） |
| 3 | CH2 线性表 | `static-linked-list` | `sources/static-linked-list/static_linked_list.c` | `sources/static-linked-list/static_linked_list.cpp` | `sources/static-linked-list/static_linked_list.py` | 已完成且有证据 | BATCH-02 | `158a730` | 通过（BATCH-02 报告） |
| 4 | CH2 线性表 | `circular` | `sources/circular/circular_linked_list.c` | `sources/circular/circular_linked_list.cpp` | `sources/circular/circular_linked_list.py` | 已完成且有证据 | BATCH-01 | `f55b961` | 通过（BATCH-01 提交与回归） |
| 5 | CH2 线性表 | `doubly` | `sources/doubly/doubly_linked_list.c` | `sources/doubly/doubly_linked_list.cpp` | `sources/doubly/doubly_linked_list.py` | 已完成且有证据 | BATCH-03 | `a9b2401` | 通过（注释/本地化/编译/专项测试） |
| 6 | CH2 线性表 | `polynomial-add` | `sources/polynomial-add/polynomial_add.c` | `sources/polynomial-add/polynomial_add.cpp` | `sources/polynomial-add/polynomial_add.py` | 已完成且有证据 | BATCH-02 | `158a730` | 通过（BATCH-02 报告） |
| 7 | CH3 栈与递归 | `stack` | `sources/stack/stack.c` | `sources/stack/stack.cpp` | `sources/stack/stack.py` | 已完成且有证据 | BATCH-03 | `12697a8` | 通过（注释/本地化/编译/专项测试） |
| 8 | CH3 栈与递归 | `infix-to-postfix` | `sources/infix-to-postfix/infix_to_postfix.c` | `sources/infix-to-postfix/infix_to_postfix.cpp` | `sources/infix-to-postfix/infix_to_postfix.py` | 已完成且有证据 | BATCH-02 | `50d4d99` | 通过（BATCH-02 报告） |
| 9 | CH3 栈与递归 | `postfix-eval` | `sources/postfix-eval/postfix_eval.c` | `sources/postfix-eval/postfix_eval.cpp` | `sources/postfix-eval/postfix_eval.py` | 已完成且有证据 | BATCH-02 | `50d4d99` | 通过（BATCH-02 报告） |
| 10 | CH3 栈与递归 | `factorial` | `sources/factorial/factorial.c` | `sources/factorial/factorial.cpp` | `sources/factorial/factorial.py` | 已完成且有证据 | BATCH-03 | `12697a8` | 通过（注释/本地化/编译/专项测试） |
| 11 | CH3 栈与递归 | `fib` | `sources/fib/fib.c` | `sources/fib/fib.cpp` | `sources/fib/fib.py` | 已完成且有证据 | BATCH-03 | `12697a8` | 通过（注释/本地化/编译/专项测试） |
| 12 | CH3 栈与递归 | `queue` | `sources/queue/queue.c` | `sources/queue/queue.cpp` | `sources/queue/queue.py` | 已完成且有证据 | BATCH-03 | `12697a8` | 通过（注释/本地化/编译/专项测试） |
| 13 | CH4 串 | `bf` | `sources/bf/bf.c` | `sources/bf/bf.cpp` | `sources/bf/bf.py` | 已完成且有证据 | BATCH-02 | `50d4d99` | 通过（BATCH-02 报告） |
| 14 | CH4 串 | `kmp` | `sources/kmp/kmp.c` | `sources/kmp/kmp.cpp` | `sources/kmp/kmp.py` | 已完成且有证据 | BATCH-01 | `74f50e2` | 通过（BATCH-01 提交与回归） |
| 15 | CH5 数组与广义表 | `sparse-transpose` | `sources/sparse-transpose/sparse_transpose.c` | `sources/sparse-transpose/sparse_transpose.cpp` | `sources/sparse-transpose/sparse_transpose.py` | 已完成且有证据 | BATCH-02 | `39edf5e` | 通过（BATCH-02 报告） |
| 16 | CH5 数组与广义表 | `gl-depth` | `sources/gl-depth/gl_depth.c` | `sources/gl-depth/gl_depth.cpp` | `sources/gl-depth/gl_depth.py` | 已完成且有证据 | BATCH-02 | `39edf5e` | 通过（BATCH-02 报告） |
| 17 | CH5 数组与广义表 | `gl-copy` | `sources/gl-copy/gl_copy.c` | `sources/gl-copy/gl_copy.cpp` | `sources/gl-copy/gl_copy.py` | 已完成且有证据 | BATCH-02 | `39edf5e` | 通过（BATCH-02 报告） |
| 18 | CH6 树与二叉树 | `inorder` | `sources/inorder/inorder.c` | `sources/inorder/inorder.cpp` | `sources/inorder/inorder.py` | 已完成且有证据 | BATCH-03 | `d9e7323` | 通过（注释/本地化/编译/专项测试） |
| 19 | CH6 树与二叉树 | `threaded-inorder` | `sources/threaded-inorder/threaded_inorder.c` | `sources/threaded-inorder/threaded_inorder.cpp` | `sources/threaded-inorder/threaded_inorder.py` | 已完成且有证据 | BATCH-02 | `05ccb1a` | 通过（BATCH-02 报告） |
| 20 | CH6 树与二叉树 | `huffman` | `sources/huffman/huffman.c` | `sources/huffman/huffman.cpp` | `sources/huffman/huffman.py` | 已完成且有证据 | BATCH-03 | `d9e7323` | 通过（注释/本地化/编译/专项测试） |
| 21 | CH7 图 | `bfs` | `sources/bfs/bfs.c` | `sources/bfs/bfs.cpp` | `sources/bfs/bfs.py` | 已完成且有证据 | BATCH-03 | `04f83b5` | 通过（注释/本地化/编译/专项测试） |
| 22 | CH7 图 | `dfs` | `sources/dfs/dfs.c` | `sources/dfs/dfs.cpp` | `sources/dfs/dfs.py` | 已完成且有证据 | BATCH-03 | `04f83b5` | 通过（注释/本地化/编译/专项测试） |
| 23 | CH7 图 | `components` | `sources/components/components.c` | `sources/components/components.cpp` | `sources/components/components.py` | 已完成且有证据 | BATCH-04 | `33291ba` | 通过（BATCH-04 报告） |
| 24 | CH7 图 | `scc` | `sources/scc/scc.c` | `sources/scc/scc.cpp` | `sources/scc/scc.py` | 已完成且有证据 | BATCH-04 | `33291ba` | 通过（BATCH-04 报告） |
| 25 | CH7 图 | `articulation` | `sources/articulation/articulation.c` | `sources/articulation/articulation.cpp` | `sources/articulation/articulation.py` | 已完成且有证据 | BATCH-01 | `e5b2a28` | 通过（BATCH-01 提交与回归） |
| 26 | CH7 图 | `prim` | `sources/prim/prim.c` | `sources/prim/prim.cpp` | `sources/prim/prim.py` | 已完成且有证据 | BATCH-04 | `19790ff` | 通过（BATCH-04 报告） |
| 27 | CH7 图 | `kruskal` | `sources/kruskal/kruskal.c` | `sources/kruskal/kruskal.cpp` | `sources/kruskal/kruskal.py` | 已完成且有证据 | BATCH-04 | `19790ff` | 通过（BATCH-04 报告） |
| 28 | CH7 图 | `topological` | `sources/topological/topological_sort.c` | `sources/topological/topological_sort.cpp` | `sources/topological/topological_sort.py` | 已完成且有证据 | BATCH-04 | `2100b4d` | 通过（BATCH-04 报告） |
| 29 | CH7 图 | `critical-path` | `sources/critical-path/critical_path.c` | `sources/critical-path/critical_path.cpp` | `sources/critical-path/critical_path.py` | 已完成且有证据 | BATCH-04 | `2100b4d` | 通过（BATCH-04 报告） |
| 30 | CH7 图 | `dijkstra` | `sources/dijkstra/dijkstra.c` | `sources/dijkstra/dijkstra.cpp` | `sources/dijkstra/dijkstra.py` | 已完成且有证据 | BATCH-04 | `8986b66` | 通过（BATCH-04 报告） |
| 31 | CH7 图 | `floyd-warshall` | `sources/floyd-warshall/floyd_warshall.c` | `sources/floyd-warshall/floyd_warshall.cpp` | `sources/floyd-warshall/floyd_warshall.py` | 已完成且有证据 | BATCH-04 | `8986b66` | 通过（BATCH-04 报告） |
| 32 | CH7 图 | `bellman-ford` | `sources/bellman-ford/bellman_ford.c` | `sources/bellman-ford/bellman_ford.cpp` | `sources/bellman-ford/bellman_ford.py` | 已完成且有证据 | BATCH-04 | `8986b66` | 通过（BATCH-04 报告） |
| 33 | CH8 动态存储管理 | `free-list` | `sources/free-list/free_list.c` | `sources/free-list/free_list.cpp` | `sources/free-list/free_list.py` | 已完成且有证据 | BATCH-01 | `4270cc2` | 通过（BATCH-01 提交与回归） |
| 34 | CH8 动态存储管理 | `buddy-system` | `sources/buddy-system/buddy_system.c` | `sources/buddy-system/buddy_system.cpp` | `sources/buddy-system/buddy_system.py` | 已完成且有证据 | BATCH-04 | `0d245c0` | 通过（BATCH-04 报告） |
| 35 | CH8 动态存储管理 | `garbage-collection` | `sources/garbage-collection/garbage_collection.c` | `sources/garbage-collection/garbage_collection.cpp` | `sources/garbage-collection/garbage_collection.py` | 已完成且有证据 | BATCH-04 | `0d245c0` | 通过（BATCH-04 报告） |
| 36 | CH9 查找 | `linear` | `sources/linear/linear_search.c` | `sources/linear/linear_search.cpp` | `sources/linear/linear_search.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 37 | CH9 查找 | `binary` | `sources/binary/binary_search.c` | `sources/binary/binary_search.cpp` | `sources/binary/binary_search.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 38 | CH9 查找 | `block-search` | `sources/block-search/block_search.c` | `sources/block-search/block_search.cpp` | `sources/block-search/block_search.py` | 已完成且有证据 | BATCH-02 | `05ccb1a` | 通过（BATCH-02 报告） |
| 39 | CH9 查找 | `bst` | `sources/bst/bst.c` | `sources/bst/bst.cpp` | `sources/bst/bst.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 40 | CH9 查找 | `avl` | `sources/avl/avl_tree.c` | `sources/avl/avl_tree.cpp` | `sources/avl/avl_tree.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 41 | CH9 查找 | `btree` | `sources/btree/btree.c` | `sources/btree/btree.cpp` | `sources/btree/btree.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 42 | CH9 查找 | `bplus-tree` | `sources/bplus-tree/bplus_tree.c` | `sources/bplus-tree/bplus_tree.cpp` | `sources/bplus-tree/bplus_tree.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 43 | CH9 查找 | `key-tree` | `sources/key-tree/key_tree.c` | `sources/key-tree/key_tree.cpp` | `sources/key-tree/key_tree.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 44 | CH9 查找 | `hash-chain` | `sources/hash-chain/hash_chain.c` | `sources/hash-chain/hash_chain.cpp` | `sources/hash-chain/hash_chain.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 45 | CH9 查找 | `hash-probe` | `sources/hash-probe/hash_probe.c` | `sources/hash-probe/hash_probe.cpp` | `sources/hash-probe/hash_probe.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 46 | CH10 内部排序 | `insertion` | `sources/insertion/insertion_sort.c` | `sources/insertion/insertion_sort.cpp` | `sources/insertion/insertion_sort.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 47 | CH10 内部排序 | `shell` | `sources/shell/shell_sort.c` | `sources/shell/shell_sort.cpp` | `sources/shell/shell_sort.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 48 | CH10 内部排序 | `bubble` | `sources/bubble/bubble_sort.c` | `sources/bubble/bubble_sort.cpp` | `sources/bubble/bubble_sort.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 49 | CH10 内部排序 | `quick` | `sources/quick/quick_sort.c` | `sources/quick/quick_sort.cpp` | `sources/quick/quick_sort.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 50 | CH10 内部排序 | `selection` | `sources/selection/selection_sort.c` | `sources/selection/selection_sort.cpp` | `sources/selection/selection_sort.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 51 | CH10 内部排序 | `tournament` | `sources/tournament/tournament_sort.c` | `sources/tournament/tournament_sort.cpp` | `sources/tournament/tournament_sort.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 52 | CH10 内部排序 | `heap` | `sources/heap/max_heap.c` | `sources/heap/max_heap.cpp` | `sources/heap/max_heap.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 53 | CH10 内部排序 | `merge` | `sources/merge/merge_sort.c` | `sources/merge/merge_sort.cpp` | `sources/merge/merge_sort.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 54 | CH10 内部排序 | `radix` | `sources/radix/radix_sort.c` | `sources/radix/radix_sort.cpp` | `sources/radix/radix_sort.py` | 已完成且有证据 | BATCH-01 | `b9341a5` | 通过（BATCH-01 提交与回归） |
| 55 | CH11 外部排序 | `multiway` | `sources/multiway/multiway_merge.c` | `sources/multiway/multiway_merge.cpp` | `sources/multiway/multiway_merge.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 56 | CH11 外部排序 | `replacement` | `sources/replacement/replacement_selection.c` | `sources/replacement/replacement_selection.cpp` | `sources/replacement/replacement_selection.py` | 已完成且有证据 | BATCH-01 | `a13aafd` | 通过（BATCH-01 提交与回归） |
| 57 | CH11 外部排序 | `optimal-merge` | `sources/optimal-merge/optimal_merge_tree.c` | `sources/optimal-merge/optimal_merge_tree.cpp` | `sources/optimal-merge/optimal_merge_tree.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 58 | CH12 文件 | `file-index` | `sources/file-index/indexed_file.c` | `sources/file-index/indexed_file.cpp` | `sources/file-index/indexed_file.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 59 | CH12 文件 | `isam` | `sources/isam/isam_file.c` | `sources/isam/isam_file.cpp` | `sources/isam/isam_file.py` | 尚未完成 | 未分配 | `—` | 未复核 |
| 60 | CH12 文件 | `inverted-index` | `sources/inverted-index/inverted_index.c` | `sources/inverted-index/inverted_index.cpp` | `sources/inverted-index/inverted_index.py` | 尚未完成 | 未分配 | `—` | 未复核 |

## BATCH-03 领取与提交证据

| 组 | 算法 ID | 提交哈希 | 推送结果 |
| --- | --- | --- | --- |
| 1 | `seqlist`, `linked`, `doubly` | `a9b2401` | `976002f..a9b2401 main -> main` |
| 2 | `stack`, `factorial`, `fib`, `queue` | `12697a8` | `a9b2401..12697a8 main -> main` |
| 3 | `inorder`, `huffman` | `d9e7323` | `12697a8..d9e7323 main -> main` |
| 4 | `bfs`, `dfs` | `04f83b5` | `d9e7323..04f83b5 main -> main` |

本批新增 219 条英文教学注释及对应中文 annotation，覆盖 33 份 principle 源码；另有专项测试、查看器测试与 Playwright 用例作为独立验证提交（见最终报告）。

`huffman` 的 C 版 `heap_pop` 注释在 `eb7a24d` 做了“先缩小 size、再复制末尾结点”的事实顺序校正，仍属于 BATCH-03 范围。

## BATCH-04 领取与提交证据

| 组 | 算法 ID | 提交哈希 | 推送结果 |
| --- | --- | --- | --- |
| 1 | `components`, `scc` | `33291ba` | `55233ca..33291ba main -> main` |
| 2 | `prim`, `kruskal` | `19790ff` | `33291ba..19790ff main -> main` |
| 3 | `topological`, `critical-path` | `2100b4d` | `19790ff..2100b4d main -> main` |
| 4 | `dijkstra`, `floyd-warshall`, `bellman-ford` | `8986b66` | `2100b4d..8986b66 main -> main` |
| 5 | `buddy-system`, `garbage-collection` | `0d245c0` | `8986b66..0d245c0 main -> main` |
| 6 | 双语 annotation、专项测试、查看器与 Playwright | `efbcf07` | `0d245c0..efbcf07 main -> main` |

本批新增 **211** 条源码教学注释（C/C++ 用 `//`，Python 用 `#`），替换 6 条旧注释；`git diff` 审计的非注释变更数为 **0**。双语映射最终为 **230** 条，覆盖 33 份 principle 源码：211 条对应新增注释，19 条为原有但此前被过滤的注释恢复映射。`buddy_system.cpp` / `buddy_system.py` 各删除 1 条与基础映射重复的 `The merged block starts...` 条目，避免同一锚点被两个中文版本覆盖。

专项验证结果：BATCH-04、事实核查、本地化与查看器共 **79/79** 通过；全量 Vitest **155 files / 1470 tests** 通过；33 份本批源码 C/C++ 编译与 Python 语法检查 **33/33** 通过，此前全量 211 份参考源码复核为 0 失败；`npm run typecheck` 与 `npm run build` 均退出 0；代表性 Playwright 用 `components`、`critical-path`、`buddy-system`、`garbage-collection` 完成中英显示与真实剪贴板复制，**1/1** 通过。

## BATCH-04 未修改的实现风险（详情见报告第 8 节）

1. `prim.c` 用 0 表示无边，真实零权边会被 `GRAPH[best][next] != 0` 拒绝；`prim.cpp` / `prim.py` 只把零权树边从打印列表中隐藏，总权值仍包含 0。
2. `kruskal.cpp` / `kruskal.py` 以 `used == 4` 作为五顶点演示的停止条件；`topological_sort.py` 以 `len(order) != 6` 判断环。换顶点数会误判。
3. `critical_path.c` 假定 `ACTIVITIES` 已按拓扑序排列；任意边序会用到尚未完成的前驱。
4. `dijkstra.cpp::path_to` 对不可达目标只返回目标名；`dijkstra.py` 的边指向未登记顶点时在 `distance[v]` 处触发 `KeyError`。
5. `buddy_system.c` 的 `init_memory` 接受非 2 的幂容量，`allocate_block` 后续才返回失败；重复标签与 `MAX_LABEL=4` 截断会让标签身份产生歧义。
6. `garbage_collection.c` 的显式栈容量为 `MAX_OBJECTS`，对象在首次弹出前可被多个父对象重复压栈；根固定为下标 0，真实收集器需要显式根集合。

## 未修改的实现风险登记

以下问题在本批代码阅读中被发现，按要求只登记、不修复，且不计入算法完成状态：

1. `huffman.c`：`main` 中 `heap_push(&heap, make_node(...))` 未检查 `make_node` 的 NULL 返回；分配失败后 `heap_push` 会解引用空指针。
2. `huffman.c`：合并循环中的 `parent = make_node(...)` 同样未检查 NULL，随后直接写 `parent->left` / `parent->right`。
3. `huffman.c`：`MinHeap` 使用固定数组容量，未做运行时容量检查；当前示例在容量内，换更大输入可能越界。
4. `bfs.c` / `dfs.c`：对 `start` 未做范围检查，依赖调用方；`main` 只传合法值。
5. `seqlist.c::ListErase`：未检查 `removed` 是否为 NULL，依赖调用方提供有效输出指针。
6. `doubly_linked_list.c::list_remove`：假定 `node` 非空且确实属于该链表，未做归属校验。
