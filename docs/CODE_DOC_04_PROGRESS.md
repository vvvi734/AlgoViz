# CODE-DOC-04 教学注释深化进度清单

本清单只登记课程注册表 `REFERENCE_CODE` 中的 60 个正式算法；每个算法的 C、C++、Python principle 源码各一份。非正式的 convenience 对照文件不纳入总数，也不以注释条数判定完成。

- BATCH-03 起始基线：`976002fdc58d89afaf91d747c9b7cdee01c86edf`
- BATCH-04 起始基线：`55233ca148f8d1f2d16fb6504eb2f7dd9e8edf73`（BATCH-03 已完成 27/60）
- BATCH-05 起始基线：`c6272a8b3d79373030152dcab2609ec4361ec818`（BATCH-04 已完成 38/60）
- BATCH-06 起始基线：`582d4cd0cf8758e350d78a59475874867528b7f2`（BATCH-05 已完成 49/60）
- 排序口径：教材第 1–12 章章序 → 章节课程目录实际出现顺序 → 算法 ID。本表已按该稳定顺序排列，CH1 无正式算法。
- 完成口径：必须存在该算法的教学注释提交哈希，并完成双语 anchor、源码编译/语法检查与专项测试；仅有注释条数不计为完成。
- 当前统计：**60 / 60 已完成且有证据**，0 个本批进行中，0 个尚未完成，0 个阻断。

## 分类统计

| 分类 | 数量 | 说明 |
| --- | ---: | --- |
| 已完成且有证据 | 60 | BATCH-01 6 个、BATCH-02 10 个、BATCH-03 11 个、BATCH-04 11 个、BATCH-05 11 个、BATCH-06 11 个，均有提交哈希与源码证据。 |
| 本批进行中 | 0 | BATCH-06 的 11 个算法均已按组提交；全批门禁见 BATCH-06 报告。 |
| 尚未完成 | 0 | 60 个正式算法的三语言 principle 源码均已进入教学注释与双语映射。 |
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
| 36 | CH9 查找 | `linear` | `sources/linear/linear_search.c` | `sources/linear/linear_search.cpp` | `sources/linear/linear_search.py` | 已完成且有证据 | BATCH-05 | `94a18ad` | 通过（注释/本地化/编译/专项测试） |
| 37 | CH9 查找 | `binary` | `sources/binary/binary_search.c` | `sources/binary/binary_search.cpp` | `sources/binary/binary_search.py` | 已完成且有证据 | BATCH-05 | `94a18ad` | 通过（注释/本地化/编译/专项测试） |
| 38 | CH9 查找 | `block-search` | `sources/block-search/block_search.c` | `sources/block-search/block_search.cpp` | `sources/block-search/block_search.py` | 已完成且有证据 | BATCH-02 | `05ccb1a` | 通过（BATCH-02 报告） |
| 39 | CH9 查找 | `bst` | `sources/bst/bst.c` | `sources/bst/bst.cpp` | `sources/bst/bst.py` | 已完成且有证据 | BATCH-05 | `94a18ad` | 通过（注释/本地化/编译/专项测试） |
| 40 | CH9 查找 | `avl` | `sources/avl/avl_tree.c` | `sources/avl/avl_tree.cpp` | `sources/avl/avl_tree.py` | 已完成且有证据 | BATCH-05 | `18b9188` | 通过（注释/本地化/编译/专项测试） |
| 41 | CH9 查找 | `btree` | `sources/btree/btree.c` | `sources/btree/btree.cpp` | `sources/btree/btree.py` | 已完成且有证据 | BATCH-05 | `18b9188` | 通过（注释/本地化/编译/专项测试） |
| 42 | CH9 查找 | `bplus-tree` | `sources/bplus-tree/bplus_tree.c` | `sources/bplus-tree/bplus_tree.cpp` | `sources/bplus-tree/bplus_tree.py` | 已完成且有证据 | BATCH-05 | `18b9188` | 通过（注释/本地化/编译/专项测试） |
| 43 | CH9 查找 | `key-tree` | `sources/key-tree/key_tree.c` | `sources/key-tree/key_tree.cpp` | `sources/key-tree/key_tree.py` | 已完成且有证据 | BATCH-05 | `feb4756` | 通过（注释/本地化/编译/专项测试） |
| 44 | CH9 查找 | `hash-chain` | `sources/hash-chain/hash_chain.c` | `sources/hash-chain/hash_chain.cpp` | `sources/hash-chain/hash_chain.py` | 已完成且有证据 | BATCH-05 | `feb4756` | 通过（注释/本地化/编译/专项测试） |
| 45 | CH9 查找 | `hash-probe` | `sources/hash-probe/hash_probe.c` | `sources/hash-probe/hash_probe.cpp` | `sources/hash-probe/hash_probe.py` | 已完成且有证据 | BATCH-05 | `feb4756` | 通过（注释/本地化/编译/专项测试） |
| 46 | CH10 内部排序 | `insertion` | `sources/insertion/insertion_sort.c` | `sources/insertion/insertion_sort.cpp` | `sources/insertion/insertion_sort.py` | 已完成且有证据 | BATCH-05 | `51b8a64` | 通过（注释/本地化/编译/专项测试） |
| 47 | CH10 内部排序 | `shell` | `sources/shell/shell_sort.c` | `sources/shell/shell_sort.cpp` | `sources/shell/shell_sort.py` | 已完成且有证据 | BATCH-05 | `51b8a64` | 通过（注释/本地化/编译/专项测试） |
| 48 | CH10 内部排序 | `bubble` | `sources/bubble/bubble_sort.c` | `sources/bubble/bubble_sort.cpp` | `sources/bubble/bubble_sort.py` | 已完成且有证据 | BATCH-06 | `4a55a52` | 通过（注释/本地化/编译/专项测试/全量覆盖） |
| 49 | CH10 内部排序 | `quick` | `sources/quick/quick_sort.c` | `sources/quick/quick_sort.cpp` | `sources/quick/quick_sort.py` | 已完成且有证据 | BATCH-06 | `4a55a52` | 通过（注释/本地化/编译/专项测试/全量覆盖） |
| 50 | CH10 内部排序 | `selection` | `sources/selection/selection_sort.c` | `sources/selection/selection_sort.cpp` | `sources/selection/selection_sort.py` | 已完成且有证据 | BATCH-06 | `4a55a52` | 通过（注释/本地化/编译/专项测试/全量覆盖） |
| 51 | CH10 内部排序 | `tournament` | `sources/tournament/tournament_sort.c` | `sources/tournament/tournament_sort.cpp` | `sources/tournament/tournament_sort.py` | 已完成且有证据 | BATCH-06 | `974300e` | 通过（注释/本地化/编译/专项测试/全量覆盖） |
| 52 | CH10 内部排序 | `heap` | `sources/heap/max_heap.c` | `sources/heap/max_heap.cpp` | `sources/heap/max_heap.py` | 已完成且有证据 | BATCH-06 | `974300e` | 通过（注释/本地化/编译/专项测试/全量覆盖） |
| 53 | CH10 内部排序 | `merge` | `sources/merge/merge_sort.c` | `sources/merge/merge_sort.cpp` | `sources/merge/merge_sort.py` | 已完成且有证据 | BATCH-06 | `4a55a52` | 通过（注释/本地化/编译/专项测试/全量覆盖） |
| 54 | CH10 内部排序 | `radix` | `sources/radix/radix_sort.c` | `sources/radix/radix_sort.cpp` | `sources/radix/radix_sort.py` | 已完成且有证据 | BATCH-01 | `b9341a5` | 通过（BATCH-01 提交与回归） |
| 55 | CH11 外部排序 | `multiway` | `sources/multiway/multiway_merge.c` | `sources/multiway/multiway_merge.cpp` | `sources/multiway/multiway_merge.py` | 已完成且有证据 | BATCH-06 | `974300e` | 通过（注释/本地化/编译/专项测试/全量覆盖） |
| 56 | CH11 外部排序 | `replacement` | `sources/replacement/replacement_selection.c` | `sources/replacement/replacement_selection.cpp` | `sources/replacement/replacement_selection.py` | 已完成且有证据 | BATCH-01 | `a13aafd` | 通过（BATCH-01 提交与回归） |
| 57 | CH11 外部排序 | `optimal-merge` | `sources/optimal-merge/optimal_merge_tree.c` | `sources/optimal-merge/optimal_merge_tree.cpp` | `sources/optimal-merge/optimal_merge_tree.py` | 已完成且有证据 | BATCH-06 | `974300e` | 通过（注释/本地化/编译/专项测试/全量覆盖） |
| 58 | CH12 文件 | `file-index` | `sources/file-index/indexed_file.c` | `sources/file-index/indexed_file.cpp` | `sources/file-index/indexed_file.py` | 已完成且有证据 | BATCH-06 | `842799b` | 通过（注释/本地化/编译/专项测试/全量覆盖） |
| 59 | CH12 文件 | `isam` | `sources/isam/isam_file.c` | `sources/isam/isam_file.cpp` | `sources/isam/isam_file.py` | 已完成且有证据 | BATCH-06 | `842799b` | 通过（注释/本地化/编译/专项测试/全量覆盖） |
| 60 | CH12 文件 | `inverted-index` | `sources/inverted-index/inverted_index.c` | `sources/inverted-index/inverted_index.cpp` | `sources/inverted-index/inverted_index.py` | 已完成且有证据 | BATCH-06 | `842799b` | 通过（注释/本地化/编译/专项测试/全量覆盖） |

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

## BATCH-05 领取与提交证据

| 组 | 算法 ID | 提交哈希 | 推送结果 |
| --- | --- | --- | --- |
| 1 | `linear`, `binary`, `bst` | `94a18ad` | `c6272a8..3e107da main -> main` |
| 2 | `avl`, `btree`, `bplus-tree` | `18b9188` | `c6272a8..3e107da main -> main` |
| 3 | `key-tree`, `hash-chain`, `hash-probe` | `feb4756` | `c6272a8..3e107da main -> main` |
| 4 | `insertion`, `shell` | `51b8a64` | `c6272a8..3e107da main -> main` |
| 5 | 双语 annotation、专项测试、查看器与 Playwright | `77bee84` | `c6272a8..3e107da main -> main` |

本批新增 **272** 条源码教学注释，覆盖 33 份 principle 源码；`git diff --stat` 为 296 insertions / 22 deletions，其余增删来自 B 树、AVL、BST、链地址散列文件头的事实修正。有效代码经 `stripReferenceComments` 与 `HEAD` 逐文件比较，33/33 一致。

教学重点覆盖：查找的有效窗口、索引/比较依据、失败条件与树/散列不变量；AVL 旋转符号、B 树中位键提升、B+ 树叶 2/2 分裂与内部分裂；BST/AVL/B 树删除路径；键树根结点 id 假设；链地址与开放定址的释放/哨兵边界；插入排序严格 `>` 的稳定性依据与希尔排序 gap 收尾。

专项验证结果：BATCH-05 专项 **35/35**、注释事实 **4/4**、查看器 **39/39** 通过；全量 Vitest **156 files / 1516 tests** 通过；33 份源码 C/C++ 编译与 Python 语法+运行检查 **33/33** 通过；代表性 Playwright 用 `linear`、`btree`、`bplus-tree`、`hash-probe` 完成中英显示与真实剪贴板复制，**1/1** 通过；`npm run typecheck` 与 `npm run build` 均退出 0。

## BATCH-05 未修改的实现风险（详情见报告第 8 节）

1. `bst.c`：`malloc` 失败时父结点可能把原孩子指针写成 NULL，丢失原子树；C 版没有删除。
2. `avl_tree.c`：插入分配失败同样可能断开原子树；三语言 AVL 均只实现插入，没有删除。
3. `hash_chain.c`：`table_free` 释放结点但不清理桶头，返回后表内是悬空指针，复用前必须重新初始化。
4. `hash_probe.cpp` / `hash_probe.py`：`EMPTY=-1` 同时可作真实键，插入 `-1` 后 `contains(-1)` 会把真实键当空槽；C 版头注释明确只接受非负键。
5. `key_tree.c`：`find_word` 直接把根写成 id=0，依赖根始终是第一个分配结点；`MAX_WORD_LENGTH=8` 未在插入时校验。
6. `bplus_tree.c`：静态池 `MAX_NODES=72`，超出后插入返回 -1；无删除。

## BATCH-06 领取与提交证据

| 组 | 算法 ID | 提交哈希 | 推送结果 |
| --- | --- | --- | --- |
| 1 | `bubble`, `selection`, `quick`, `merge` | `4a55a52` | `582d4cd..5f1f4d9 main -> main` |
| 2 | `tournament`, `heap`, `multiway`, `optimal-merge` | `974300e` | `582d4cd..5f1f4d9 main -> main` |
| 3 | `file-index`, `isam`, `inverted-index` | `842799b` | `582d4cd..5f1f4d9 main -> main` |
| 4 | 双语 annotation、专项测试、全量覆盖、查看器与 Playwright | `05dee78` | `582d4cd..5f1f4d9 main -> main` |
| 5 | 进度、报告与推送证据 | `5f1f4d9` | `582d4cd..5f1f4d9 main -> main` |

本批新增 **238** 条源码教学注释，覆盖 33 份 principle 源码；`git diff --stat` 为 **238 insertions / 0 deletions**，没有文件头事实修正，也没有有效代码改动。有效代码经 `stripReferenceComments` 与 `HEAD` 逐文件比较，33/33 一致。

教学重点覆盖：冒泡排序的 `swapped` 每趟重置与严格 `>` 稳定性；选择排序的最小值候选、惰性交换与不稳定原因；快速排序的末元素基准、Lomuto 边界、相等键左置与递归排除 pivot；归并排序的闭区间、单缓冲复用、左段优先稳定性与 C 版分配失败静默返回；树形选择的 `(value, originalIndex)` 平局规则、逻辑删除与单路径修复；0 基堆的父子公式、固定容量失败与动态容量差异；多路归并的分段 FIFO、按 `(value, originalIndex)` 选赢家、整块写出与末尾 flush；最佳归并树的虚拟零权重叶、满 k 叉树缺口公式与内部权重求和口径；稠密/稀疏索引、ISAM 专属溢出链与倒排索引 AND/OR 单位元。

## BATCH-06 全量覆盖与抽查

- 注册表正式算法 **60** 个；正式 principle 文件 **180** 份（C/C++/Python 各 60），文件名去重后仍为 180。
- 全量覆盖测试逐算法、逐语言加载源码：60 × 3 份文件均有非空双语映射（每份至少 3 条），中文/英文本地化后的去注释代码与源文件、`HEAD` 完全一致。
- 14 个算法人工抽查覆盖线性表、栈、串、树、图、动态存储、查找、内部排序、外部排序与文件：`seqlist`、`doubly`、`stack`、`kmp`、`huffman`、`threaded-inorder`、`articulation`、`free-list`、`linear`、`insertion`、`quick`、`multiway`、`isam`、`file-index`。
- 覆盖测试文件：`src/domain/reference-code/code-doc-04-coverage.test.ts`，3/3 通过。

## BATCH-06 验证结果

- BATCH-06 专项：**35/35**；注释事实：**4/4**；全量覆盖：**3/3**；查看器：**50/50**。
- 全量 Vitest：**158 files / 1565 tests** 全部通过。
- 33 份源码：C 11/11、C++ 11/11 编译通过；22 个可执行程序运行退出码 0；Python 11/11 语法检查与运行通过。
- `npm run typecheck` 退出 0；`npm run build` 退出 0（Vite 6.4.6，1951 modules）。
- 代表性 Playwright：`bubble`、`tournament`、`multiway`、`isam`，中文显示/复制、英文切换/复制、英文无汉字，**1/1** 通过。

## BATCH-06 未修改的实现风险（详情见报告第 8 节）

1. `heap` 三语言文件头提到“从最后一个非叶结点倒着下沉建堆”，但代码只实现逐次 `push` 上浮，没有批量 heapify；本批未修改头注释，只登记口径偏差。
2. `merge_sort.c`：`malloc` 失败时直接 `return`，数组保持未排序且接口没有失败返回值。
3. `isam_file.c`：`MAX_OVERFLOW=5`，创建溢出结点前未检查上限；超过静态数组容量会越界写。
4. `inverted_index.c`：`MAX_TERMS=16`、`MAX_POSTINGS=9`、`MAX_KEYWORDS=4` 未在插入时检查；当前 4 条记录样例在界内。
5. `tournament_sort.c` / `.cpp`：硬上限 12 条记录、`MAX_LEAVES=16`；超出会失败或越界。
6. `multiway_merge.c`：`MAX_RECORDS=24`、`MAX_K=4`、`MAX_RUN_RECORDS=6`，输入规模受静态数组限制；I/O 计数只是教学模型。
7. `indexed_file.cpp` / `.py`：返回位置硬编码 `blockIndex * 3 + offset`，与示例容量 3 绑定；修改块容量而不改公式会返回错误位置。
8. `quick_sort` 末元素 pivot 在已排序输入上退化 O(n²)，递归深度最坏 O(n)。
9. `optimal_merge_tree` 的虚拟叶只补形状，不能当作真实零长度归并段；总代价必须按内部权重求和，不能只报根权重。


