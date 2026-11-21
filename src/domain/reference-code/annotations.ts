/**
 * Reviewed bilingual annotations for the reference sources.
 *
 * The source files stay in English so there is only one implementation body. A
 * key is the source file name; `en` must match the text of a standalone line
 * comment in that file exactly, and `zh` is the reviewed Chinese rendering
 * shown when the UI language is Chinese. Comments that are not listed here are
 * treated as source-only documentation and are omitted from the Chinese view.
 */
export interface ReferenceAnnotation {
  en: string;
  zh: string;
}

export const REFERENCE_ANNOTATIONS: Record<string, readonly ReferenceAnnotation[]> = {
  "avl_tree.c": [
    {
      en: "The balance factor is height(left) - height(right); values outside {-1, 0, 1} need rotation.",
      zh: "平衡因子是 height(left) - height(right)；超出 {-1, 0, 1} 就需要旋转。",
    },
    {
      en: "LR case: rotate the left child left first, then rotate the unbalanced root right.",
      zh: "LR 情形：先对左孩子左旋，再对失衡的根右旋。",
    },
  ],
  "avl_tree.cpp": [
    {
      en: "The balance factor is height(left) - height(right); values outside {-1, 0, 1} need rotation.",
      zh: "平衡因子是 height(left) - height(right)；超出 {-1, 0, 1} 就需要旋转。",
    },
    {
      en: "LR case: repair the left-left shape with a left rotation on the child, then a right rotation.",
      zh: "LR 情形：先对左孩子左旋，把形状转成 LL，再对根右旋。",
    },
  ],
  "avl_tree.py": [
    {
      en: "The balance factor is height(left) - height(right); values outside {-1, 0, 1} need rotation.",
      zh: "平衡因子是 height(left) - height(right)；超出 {-1, 0, 1} 就需要旋转。",
    },
    {
      en: "A negative left-child factor means LR: rotate the child left before rotating the root right.",
      zh: "左孩子平衡因子为负表示 LR：先左旋孩子，再右旋根。",
    },
  ],
  "bellman_ford.c": [
    {
      en: "V-1 full passes settle every simple shortest path; one more pass that still relaxes proves a reachable negative cycle.",
      zh: "V-1 轮完整松弛足以确定所有简单最短路；再扫一遍仍能松弛就说明存在可达负环。",
    },
  ],
  "bellman_ford.cpp": [
    {
      en: "V-1 full passes settle every simple shortest path; one more pass that still relaxes proves a reachable negative cycle.",
      zh: "V-1 轮完整松弛足以确定所有简单最短路；再扫一遍仍能松弛就说明存在可达负环。",
    },
  ],
  "bellman_ford.py": [
    {
      en: "V-1 full passes settle every simple shortest path; one more pass that still relaxes proves a reachable negative cycle.",
      zh: "V-1 轮完整松弛足以确定所有简单最短路；再扫一遍仍能松弛就说明存在可达负环。",
    },
  ],
  "bf.c": [],
  "bf.cpp": [],
  "bf.py": [],
  "gl_depth.c": [],
  "gl_depth.cpp": [],
  "gl_depth.py": [],
  "gl_copy.c": [],
  "gl_copy.cpp": [],
  "gl_copy.py": [],
  "bfs.c": [
    {
      en: "Mark a vertex when it enters the queue, not when it leaves, so it cannot be enqueued twice.",
      zh: "顶点入队时就标记，而不是出队时才标记，否则同一顶点可能重复入队。",
    },
  ],
  "bfs.cpp": [
    {
      en: "Mark a vertex when it enters the queue, not when it leaves, so it cannot be enqueued twice.",
      zh: "顶点入队时就标记，而不是出队时才标记，否则同一顶点可能重复入队。",
    },
  ],
  "bfs.py": [
    {
      en: "Mark a vertex when it enters the queue, not when it leaves, so it cannot be enqueued twice.",
      zh: "顶点入队时就标记，而不是出队时才标记，否则同一顶点可能重复入队。",
    },
  ],
  "binary_search.c": [
    {
      en: "The window is inclusive: low == high still leaves one candidate, and mid is computed without overflow.",
      zh: "查找窗口是闭区间：low == high 时仍有一个候选；mid 的计算方式避免加法溢出。",
    },
  ],
  "binary_search.cpp": [
    {
      en: "The window is inclusive: low == high still leaves one candidate, and mid is computed without overflow.",
      zh: "查找窗口是闭区间：low == high 时仍有一个候选；mid 的计算方式避免加法溢出。",
    },
  ],
  "binary_search.py": [
    {
      en: "The window is inclusive: low == high still leaves one candidate, and mid is computed without overflow.",
      zh: "查找窗口是闭区间：low == high 时仍有一个候选；mid 的计算方式避免加法溢出。",
    },
  ],
  "bst_builtin.cpp": [
    {
      en: "`std::set` keeps unique keys ordered; `count` is membership, not an index lookup.",
      zh: "`std::set` 保持键有序且唯一；`count` 只判断成员是否存在，不返回下标。",
    },
  ],
  "bst_builtin.py": [
    {
      en: "`insort` keeps the list ordered but shifts the tail, so insertion is O(n) even though search is O(log n).",
      zh: "`insort` 保持列表有序，但要搬移尾部元素，因此虽然查找是 O(log n)，插入仍是 O(n)。",
    },
  ],
  "bst.c": [
    {
      en: "BST invariant: left keys < root < right keys; duplicates are rejected, so search follows one path.",
      zh: "BST 不变量：左子树关键字 < 根 < 右子树关键字；重复键被拒绝，因此查找只沿一条路径下降。",
    },
  ],
  "bst.cpp": [
    {
      en: "BST invariant: left keys < root < right keys; duplicates are rejected, so search follows one path.",
      zh: "BST 不变量：左子树关键字 < 根 < 右子树关键字；重复键被拒绝，因此查找只沿一条路径下降。",
    },
  ],
  "bst.py": [
    {
      en: "BST invariant: left keys < root < right keys; duplicates are rejected, so search follows one path.",
      zh: "BST 不变量：左子树关键字 < 根 < 右子树关键字；重复键被拒绝，因此查找只沿一条路径下降。",
    },
  ],
  "btree.c": [
    {
      en: "A full child is split before descending; its median moves into the parent, so insertion never needs to back up.",
      zh: "下降前先分裂已满的孩子；中位键上移到父节点，因此插入不需要回溯。",
    },
  ],
  "btree.cpp": [
    {
      en: "A full child is split before descending; its median moves into the parent, so insertion never needs to back up.",
      zh: "下降前先分裂已满的孩子；中位键上移到父节点，因此插入不需要回溯。",
    },
  ],
  "btree.py": [
    {
      en: "A full child is split before descending; its median moves into the parent, so insertion never needs to back up.",
      zh: "下降前先分裂已满的孩子；中位键上移到父节点，因此插入不需要回溯。",
    },
  ],
  "bubble_sort.c": [
    {
      en: "After pass k the largest k values sit at the right end; an unchanged pass ends the sort early.",
      zh: "第 k 轮结束后，最大的 k 个值已经落在右端；某一轮没有发生交换即可提前结束。",
    },
  ],
  "bubble_sort.cpp": [
    {
      en: "After pass k the largest k values sit at the right end; an unchanged pass ends the sort early.",
      zh: "第 k 轮结束后，最大的 k 个值已经落在右端；某一轮没有发生交换即可提前结束。",
    },
  ],
  "bubble_sort.py": [
    {
      en: "After pass k the largest k values sit at the right end; an unchanged pass ends the sort early.",
      zh: "第 k 轮结束后，最大的 k 个值已经落在右端；某一轮没有发生交换即可提前结束。",
    },
  ],
  "builtin_search.c": [
    {
      en: "`bsearch` requires a sorted array and returns a pointer to one matching element; duplicates may return any match.",
      zh: "`bsearch` 要求数组已排序，返回指向某个匹配元素的指针；有重复元素时可能返回任意一个。",
    },
  ],
  "builtin_search.cpp": [
    {
      en: "`lower_bound` returns the first position not less than the target; end() means no candidate.",
      zh: "`lower_bound` 返回第一个不小于目标的位置；得到 end() 表示没有候选。",
    },
  ],
  "builtin_search.py": [
    {
      en: "`bisect_left` returns an insertion point in [0, len]; check the slot before treating it as a hit.",
      zh: "`bisect_left` 返回 [0, len] 内的插入点；要检查该槽位的值才能确认是否命中。",
    },
  ],
  "builtin_sorting.c": [
    {
      en: "`qsort` is in-place and not guaranteed stable; the comparator returns negative, zero or positive.",
      zh: "`qsort` 原地排序且不保证稳定；比较函数返回负数、零或正数。",
    },
  ],
  "builtin_sorting.cpp": [
    {
      en: "`std::sort` is not stable; use `std::stable_sort` when equal-key order matters.",
      zh: "`std::sort` 不保证稳定；需要保持相等键顺序时使用 `std::stable_sort`。",
    },
  ],
  "builtin_sorting.py": [
    {
      en: "`sorted()` returns a new list; `list.sort()` mutates in place, and both are stable.",
      zh: "`sorted()` 返回新列表；`list.sort()` 原地修改，二者都稳定。",
    },
  ],
  "circular_linked_list.c": [
    {
      en: "The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.",
      zh: "尾节点的 `next` 指回 `head`，因此遍历要在回到 head 时停止，而不是等待 NULL。",
    },
  ],
  "circular_linked_list.cpp": [
    {
      en: "The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.",
      zh: "尾节点的 `next` 指回 `head`，因此遍历要在回到 head 时停止，而不是等待 NULL。",
    },
  ],
  "circular_linked_list.py": [
    {
      en: "The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.",
      zh: "尾节点的 `next` 指回 `head`，因此遍历要在回到 head 时停止，而不是等待 NULL。",
    },
  ],
  "components.c": [
    {
      en: "The outer scan opens a new component only at an unvisited vertex; one DFS marks its whole component.",
      zh: "外层只从未访问顶点开启新分量；一次 DFS 会标记该连通分量的全部顶点。",
    },
  ],
  "components.cpp": [
    {
      en: "The outer scan opens a new component only at an unvisited vertex; one DFS marks its whole component.",
      zh: "外层只从未访问顶点开启新分量；一次 DFS 会标记该连通分量的全部顶点。",
    },
  ],
  "components.py": [
    {
      en: "The outer scan opens a new component only at an unvisited vertex; one DFS marks its whole component.",
      zh: "外层只从未访问顶点开启新分量；一次 DFS 会标记该连通分量的全部顶点。",
    },
  ],
  "articulation.c": [
    {
      en: "The cut test is low[child] >= disc[parent]; the bridge test is strict low[child] > disc[parent].",
      zh: "关节点判据是 low[child] >= disc[parent]；桥判据是严格的 low[child] > disc[parent]。",
    },
  ],
  "articulation.cpp": [
    {
      en: "The cut test is low[child] >= disc[parent]; the bridge test is strict low[child] > disc[parent].",
      zh: "关节点判据是 low[child] >= disc[parent]；桥判据是严格的 low[child] > disc[parent]。",
    },
  ],
  "articulation.py": [
    {
      en: "The cut test is low[child] >= disc[parent]; the bridge test is strict low[child] > disc[parent].",
      zh: "关节点判据是 low[child] >= disc[parent]；桥判据是严格的 low[child] > disc[parent]。",
    },
  ],
  "critical_path.c": [
    {
      en: "Forward pass takes the maximum predecessor finish; backward pass the minimum successor start; activity slack is latest(head) - earliest(tail) - weight.",
      zh: "正推取前驱完成时间的最大值；逆推取后继开始时间的最小值；活动的时间余量是 latest(head) - earliest(tail) - weight。",
    },
  ],
  "critical_path.cpp": [
    {
      en: "Forward pass takes the maximum predecessor finish; backward pass the minimum successor start; activity slack is latest(head) - earliest(tail) - weight.",
      zh: "正推取前驱完成时间的最大值；逆推取后继开始时间的最小值；活动的时间余量是 latest(head) - earliest(tail) - weight。",
    },
  ],
  "critical_path.py": [
    {
      en: "Forward pass takes the maximum predecessor finish; backward pass the minimum successor start; activity slack is latest(head) - earliest(tail) - weight.",
      zh: "正推取前驱完成时间的最大值；逆推取后继开始时间的最小值；活动的时间余量是 latest(head) - earliest(tail) - weight。",
    },
  ],
  "dfs.c": [
    {
      en: "Mark a vertex on entry; the recursion then visits every unvisited neighbour before returning.",
      zh: "进入顶点时立即标记；随后递归访问所有未访问邻居，再返回上一层。",
    },
  ],
  "dfs.cpp": [
    {
      en: "Mark a vertex on entry; the recursion then visits every unvisited neighbour before returning.",
      zh: "进入顶点时立即标记；随后递归访问所有未访问邻居，再返回上一层。",
    },
  ],
  "dfs.py": [
    {
      en: "Mark a vertex on entry; the recursion then visits every unvisited neighbour before returning.",
      zh: "进入顶点时立即标记；随后递归访问所有未访问邻居，再返回上一层。",
    },
  ],
  "dijkstra.c": [
    {
      en: "best has the smallest tentative distance; with non-negative weights this value is final.",
      zh: "best 拥有最小的暂定距离；在非负权图中，这个值此时已经确定。",
    },
    {
      en: "A zero matrix entry means no edge, not a zero-cost edge.",
      zh: "邻接矩阵中的 0 表示没有边，不是一条权值为 0 的边。",
    },
  ],
  "dijkstra.cpp": [
    {
      en: "Ignore stale heap entries: a shorter distance for this vertex was pushed later.",
      zh: "跳过堆中的过期条目：该顶点更短的距离之后已经入堆。",
    },
    {
      en: "Once settled, the vertex distance cannot improve when all edge weights are non-negative.",
      zh: "在边权全部非负时，顶点一旦确定，其距离不会再被改小。",
    },
  ],
  "dijkstra.py": [
    {
      en: "Ignore stale heap entries: the same vertex may appear with an older, larger distance.",
      zh: "跳过堆中的过期条目：同一顶点可能带着更旧、更大的距离再次出现。",
    },
    {
      en: "Settling is final because every remaining candidate distance is at least this value.",
      zh: "顶点一旦确定即为最终结果，因为其余候选距离都不小于当前值。",
    },
  ],
  "doubly_linked_list_builtin.cpp": [
    {
      en: "`std::list` owns both directions; iterators survive splicing, but there is no random access.",
      zh: "`std::list` 同时维护两个方向；拼接后迭代器仍然有效，但不支持随机访问。",
    },
  ],
  "doubly_linked_list.c": [
    {
      en: "Removal repairs both `prev` and `next`; removing the head or tail must also update the external head/tail pointer.",
      zh: "删除要同时修复 `prev` 和 `next`；删除头或尾时还必须更新外部的 head/tail 指针。",
    },
  ],
  "doubly_linked_list.cpp": [
    {
      en: "Removal repairs both `prev` and `next`; removing the head or tail must also update the external head/tail pointer.",
      zh: "删除要同时修复 `prev` 和 `next`；删除头或尾时还必须更新外部的 head/tail 指针。",
    },
  ],
  "doubly_linked_list.py": [
    {
      en: "Removal repairs both `prev` and `next`; removing the head or tail must also update the external head/tail pointer.",
      zh: "删除要同时修复 `prev` 和 `next`；删除头或尾时还必须更新外部的 head/tail 指针。",
    },
  ],
  "factorial_builtin.py": [
    {
      en: "`math.factorial` returns an arbitrary-precision integer and rejects negative input.",
      zh: "`math.factorial` 返回任意精度整数，并拒绝负数输入。",
    },
  ],
  "factorial.c": [
    {
      en: "Base cases collapse to 1; the unwind multiplies n by the already-computed (n-1)!.",
      zh: "递归基例收缩为 1；逐层返回时用 n 乘以已经算好的 (n-1)!。",
    },
  ],
  "factorial.cpp": [
    {
      en: "Base cases collapse to 1; the unwind multiplies n by the already-computed (n-1)!.",
      zh: "递归基例收缩为 1；逐层返回时用 n 乘以已经算好的 (n-1)!。",
    },
  ],
  "factorial.py": [
    {
      en: "Base cases collapse to 1; the unwind multiplies n by the already-computed (n-1)!.",
      zh: "递归基例收缩为 1；逐层返回时用 n 乘以已经算好的 (n-1)!。",
    },
  ],
  "fib.c": [
    {
      en: "The two recursive calls are independent and uncached, so identical subproblems are recomputed.",
      zh: "两个递归调用彼此独立且没有缓存，因此相同子问题会被重复计算。",
    },
  ],
  "fib.cpp": [
    {
      en: "The two recursive calls are independent and uncached, so identical subproblems are recomputed.",
      zh: "两个递归调用彼此独立且没有缓存，因此相同子问题会被重复计算。",
    },
  ],
  "fib.py": [
    {
      en: "The two recursive calls are independent and uncached, so identical subproblems are recomputed.",
      zh: "两个递归调用彼此独立且没有缓存，因此相同子问题会被重复计算。",
    },
  ],
  "floyd_warshall.c": [
    {
      en: "The outer loop must be the intermediate vertex k; relaxing k before it is allowed would use incomplete paths.",
      zh: "最外层必须枚举中间顶点 k；过早用 k 松弛会用到尚未允许的中间路径。",
    },
  ],
  "floyd_warshall.cpp": [
    {
      en: "The outer loop must be the intermediate vertex k; relaxing k before it is allowed would use incomplete paths.",
      zh: "最外层必须枚举中间顶点 k；过早用 k 松弛会用到尚未允许的中间路径。",
    },
  ],
  "floyd_warshall.py": [
    {
      en: "The outer loop must be the intermediate vertex k; relaxing k before it is allowed would use incomplete paths.",
      zh: "最外层必须枚举中间顶点 k；过早用 k 松弛会用到尚未允许的中间路径。",
    },
  ],
  "hash_chain_builtin.cpp": [
    {
      en: "`unordered_map` owns hashing and chains; iteration order is unspecified, so it is not sorted output.",
      zh: "`unordered_map` 自行管理哈希和链；迭代顺序没有保证，不能当作有序输出。",
    },
  ],
  "hash_chain_builtin.py": [
    {
      en: "A dict owns hashing and collision resolution; insertion order is incidental, not a hash-table guarantee.",
      zh: "dict 自行管理哈希与冲突；插入顺序只是附带现象，不是哈希表的语义保证。",
    },
  ],
  "hash_chain.c": [
    {
      en: "Each bucket owns a chain; inserting at the bucket head is O(1), and duplicates are rejected before allocation.",
      zh: "每个桶维护一条链；插入桶头是 O(1)，重复键在分配节点前就被拒绝。",
    },
  ],
  "hash_chain.cpp": [
    {
      en: "Each bucket owns a chain; inserting at the bucket head is O(1), and duplicates are rejected before allocation.",
      zh: "每个桶维护一条链；插入桶头是 O(1)，重复键在分配节点前就被拒绝。",
    },
  ],
  "hash_chain.py": [
    {
      en: "Each bucket owns a chain; inserting at the bucket head is O(1), and duplicates are rejected before allocation.",
      zh: "每个桶维护一条链；插入桶头是 O(1)，重复键在分配节点前就被拒绝。",
    },
  ],
  "hash_probe_builtin.cpp": [
    {
      en: "`unordered_map` may use any collision strategy; this file cannot show linear probing or tombstones.",
      zh: "`unordered_map` 可以使用任意冲突策略；这个文件无法展示线性探测或墓碑。",
    },
  ],
  "hash_probe_builtin.py": [
    {
      en: "A dict may use any collision strategy; probe sequences and tombstones are not exposed.",
      zh: "dict 可以使用任意冲突策略；探测序列与墓碑都不会暴露出来。",
    },
  ],
  "hash_probe.c": [
    {
      en: "This teaching version has no deletion, so an empty slot ends the probe; adding tombstones would require lookup to continue past them.",
      zh: "这个教学版本没有删除操作，因此空槽即可终止探测；若加入墓碑，查找必须越过墓碑继续。",
    },
  ],
  "hash_probe.cpp": [
    {
      en: "This teaching version has no deletion, so an empty slot ends the probe; adding tombstones would require lookup to continue past them.",
      zh: "这个教学版本没有删除操作，因此空槽即可终止探测；若加入墓碑，查找必须越过墓碑继续。",
    },
  ],
  "hash_probe.py": [
    {
      en: "This teaching version has no deletion, so an empty slot ends the probe; adding tombstones would require lookup to continue past them.",
      zh: "这个教学版本没有删除操作，因此空槽即可终止探测；若加入墓碑，查找必须越过墓碑继续。",
    },
  ],
  "huffman_builtin.cpp": [
    {
      en: "The comparator reverses the default max-heap order so the two smallest frequencies are popped first.",
      zh: "比较器反转默认的大根堆顺序，使频率最小的两个节点先被弹出。",
    },
  ],
  "huffman_builtin.py": [
    {
      en: "Heap tuples include a sequence number so equal frequencies never compare node objects.",
      zh: "堆元组带有序号，频率相等时不会去比较节点对象。",
    },
  ],
  "huffman.c": [
    {
      en: "Merge the two least frequent nodes repeatedly; the final tree gives shorter codes to more frequent symbols.",
      zh: "反复合并频率最小的两个节点；最终树让频率更高的符号获得更短编码。",
    },
  ],
  "huffman.cpp": [
    {
      en: "Merge the two least frequent nodes repeatedly; the final tree gives shorter codes to more frequent symbols.",
      zh: "反复合并频率最小的两个节点；最终树让频率更高的符号获得更短编码。",
    },
  ],
  "huffman.py": [
    {
      en: "Merge the two least frequent nodes repeatedly; the final tree gives shorter codes to more frequent symbols.",
      zh: "反复合并频率最小的两个节点；最终树让频率更高的符号获得更短编码。",
    },
  ],
  "threaded_inorder.c": [
    {
      en: "Thread null left pointers into predecessors and null right pointers into successors.",
      zh: "空左指针线索化为前驱，空右指针线索化为后继。",
    },
  ],
  "threaded_inorder.cpp": [
    {
      en: "Thread null left pointers into predecessors and null right pointers into successors.",
      zh: "空左指针线索化为前驱，空右指针线索化为后继。",
    },
  ],
  "threaded_inorder.py": [
    {
      en: "Thread null left pointers into predecessors and null right pointers into successors.",
      zh: "空左指针线索化为前驱，空右指针线索化为后继。",
    },
  ],
  "inorder.c": [
    {
      en: "Recurse left, visit the root, then recurse right; for a BST this emits keys in ascending order.",
      zh: "先递归左子树，再访问根，最后递归右子树；对 BST 来说这会按升序输出关键字。",
    },
  ],
  "inorder.cpp": [
    {
      en: "Recurse left, visit the root, then recurse right; for a BST this emits keys in ascending order.",
      zh: "先递归左子树，再访问根，最后递归右子树；对 BST 来说这会按升序输出关键字。",
    },
  ],
  "inorder.py": [
    {
      en: "Recurse left, visit the root, then recurse right; for a BST this emits keys in ascending order.",
      zh: "先递归左子树，再访问根，最后递归右子树；对 BST 来说这会按升序输出关键字。",
    },
  ],
  "insertion_sort.c": [
    {
      en: "Shift only while the previous value is strictly greater; equal keys stop the shift and keep the sort stable.",
      zh: "只有前一个值严格更大时才右移；遇到相等元素就停止，排序因此保持稳定。",
    },
  ],
  "insertion_sort.cpp": [
    {
      en: "Shift only while the previous value is strictly greater; equal keys stop the shift and keep the sort stable.",
      zh: "只有前一个值严格更大时才右移；遇到相等元素就停止，排序因此保持稳定。",
    },
  ],
  "insertion_sort.py": [
    {
      en: "Shift only while the previous value is strictly greater; equal keys stop the shift and keep the sort stable.",
      zh: "只有前一个值严格更大时才右移；遇到相等元素就停止，排序因此保持稳定。",
    },
  ],
  "kmp_find_builtin.cpp": [
    {
      en: "Advancing by one after a hit keeps overlapping occurrences; find is a library shortcut, not KMP.",
      zh: "命中后从下一位继续搜索才能保留重叠匹配；find 只是标准库快捷方法，不是 KMP。",
    },
  ],
  "kmp_find_builtin.py": [
    {
      en: "Advancing by one after a hit keeps overlapping occurrences; find is a library shortcut, not KMP.",
      zh: "命中后从下一位继续搜索才能保留重叠匹配；find 只是标准库快捷方法，不是 KMP。",
    },
  ],
  "kmp.c": [
    {
      en: "next[] is a one-based failure table; follow its chain instead of restarting the pattern.",
      zh: "next[] 是一基失败表；失配时沿它的链回退，而不是从头重新匹配。",
    },
    {
      en: "After a full match, reuse the border table so overlapping occurrences are still found.",
      zh: "完整匹配后继续复用边界表，才能找出重叠出现的位置。",
    },
  ],
  "kmp.cpp": [
    {
      en: "lps stores lengths, not positions; j - 1 is the last matched prefix index.",
      zh: "lps 存的是长度而不是位置；j - 1 才是最后已匹配前缀的下标。",
    },
    {
      en: "i has already moved past the match; subtract m to report its start.",
      zh: "此时 i 已越过整个匹配；减去 m 才是匹配起点。",
    },
  ],
  "kmp.py": [
    {
      en: "Fall back to the longest border that can still be extended.",
      zh: "回退到仍有可能继续延伸的最长 border。",
    },
    {
      en: "i is already past the match; i - m is the start, then j falls back for overlaps.",
      zh: "i 已越过匹配；i - m 是起点，随后让 j 回退以寻找重叠匹配。",
    },
  ],
  "kruskal.c": [
    {
      en: "Sort by weight, then accept an edge only when union-find reports different components; otherwise it closes a cycle.",
      zh: "先按权值排序，再用并查集判断：只有两端属于不同连通分量时才接受该边，否则会成环。",
    },
  ],
  "kruskal.cpp": [
    {
      en: "Sort by weight, then accept an edge only when union-find reports different components; otherwise it closes a cycle.",
      zh: "先按权值排序，再用并查集判断：只有两端属于不同连通分量时才接受该边，否则会成环。",
    },
  ],
  "kruskal.py": [
    {
      en: "Sort by weight, then accept an edge only when union-find reports different components; otherwise it closes a cycle.",
      zh: "先按权值排序，再用并查集判断：只有两端属于不同连通分量时才接受该边，否则会成环。",
    },
  ],
  "levelorder_queue.c": [
    {
      en: "The FIFO queue holds pending nodes; enqueue children after visiting the parent to keep level order.",
      zh: "FIFO 队列保存待访问节点；访问父节点后再让左右孩子入队，才能保持层序。",
    },
  ],
  "levelorder_queue.cpp": [
    {
      en: "The FIFO queue holds pending nodes; enqueue children after visiting the parent to keep level order.",
      zh: "FIFO 队列保存待访问节点；访问父节点后再让左右孩子入队，才能保持层序。",
    },
  ],
  "levelorder_queue.py": [
    {
      en: "`deque.popleft()` is O(1); a list pop(0) would shift every remaining element.",
      zh: "`deque.popleft()` 是 O(1)；若用 list 的 pop(0)，每次都要搬移剩余元素。",
    },
  ],
  "linear_search.c": [
    {
      en: "Return the first matching index; -1 is correct only after the entire array has been scanned.",
      zh: "返回第一个匹配下标；只有扫描完整个数组后才能确定返回 -1。",
    },
  ],
  "linear_search.cpp": [
    {
      en: "Return the first matching index; -1 is correct only after the entire array has been scanned.",
      zh: "返回第一个匹配下标；只有扫描完整个数组后才能确定返回 -1。",
    },
  ],
  "linear_search.py": [
    {
      en: "Return the first matching index; -1 is correct only after the entire array has been scanned.",
      zh: "返回第一个匹配下标；只有扫描完整个数组后才能确定返回 -1。",
    },
  ],
  "max_heap_builtin.cpp": [
    {
      en: "`std::priority_queue` is a max-heap by default; equal keys have unspecified relative order.",
      zh: "`std::priority_queue` 默认是大根堆；相等键之间的相对顺序没有保证。",
    },
  ],
  "max_heap_builtin.py": [
    {
      en: "`heapq` is a min-heap, so values are negated; remember to negate the popped value back.",
      zh: "`heapq` 是小根堆，因此这里把值取负；弹出后要再取负还原。",
    },
  ],
  "max_heap.c": [
    {
      en: "For index i the children are 2*i+1 and 2*i+2; sift-down swaps with the larger child until the parent is >= both.",
      zh: "下标 i 的孩子是 2*i+1 和 2*i+2；下沉时与较大的孩子交换，直到父节点不小于两个孩子。",
    },
  ],
  "max_heap.cpp": [
    {
      en: "For index i the children are 2*i+1 and 2*i+2; sift-down swaps with the larger child until the parent is >= both.",
      zh: "下标 i 的孩子是 2*i+1 和 2*i+2；下沉时与较大的孩子交换，直到父节点不小于两个孩子。",
    },
  ],
  "max_heap.py": [
    {
      en: "For index i the children are 2*i+1 and 2*i+2; sift-down swaps with the larger child until the parent is >= both.",
      zh: "下标 i 的孩子是 2*i+1 和 2*i+2；下沉时与较大的孩子交换，直到父节点不小于两个孩子。",
    },
  ],
  "merge_sort.c": [
    {
      en: "The buffer is shared across recursive calls; ties take the left run, which keeps the merge stable.",
      zh: "缓冲区在所有递归调用间复用；相等时先取左段，归并因此保持稳定。",
    },
  ],
  "merge_sort.cpp": [
    {
      en: "The buffer is shared across recursive calls; ties take the left run, which keeps the merge stable.",
      zh: "缓冲区在所有递归调用间复用；相等时先取左段，归并因此保持稳定。",
    },
  ],
  "merge_sort.py": [
    {
      en: "The buffer is shared across recursive calls; ties take the left run, which keeps the merge stable.",
      zh: "缓冲区在所有递归调用间复用；相等时先取左段，归并因此保持稳定。",
    },
  ],
  "prim.c": [
    {
      en: "`key[v]` is the lightest edge from v to the current tree; `parent[v]` records the endpoint that supplied it.",
      zh: "`key[v]` 是 v 连接到当前树的最轻边；`parent[v]` 记录提供这条边的端点。",
    },
  ],
  "prim.cpp": [
    {
      en: "This implementation grows the tree by popping the lightest cut edge from `candidates`; selected vertices are skipped as stale.",
      zh: "这个实现从 `candidates` 中弹出横跨切割的最轻边来扩展生成树；已选顶点对应的边会被跳过。",
    },
  ],
  "prim.py": [
    {
      en: "This implementation grows the tree by popping the lightest cut edge from `candidates`; selected vertices are skipped as stale.",
      zh: "这个实现从 `candidates` 中弹出横跨切割的最轻边来扩展生成树；已选顶点对应的边会被跳过。",
    },
  ],
  "queue_builtin.cpp": [
    {
      en: "`std::queue::pop()` returns void; read `front()` before removing the oldest element.",
      zh: "`std::queue::pop()` 没有返回值；应先读 `front()`，再删除队首元素。",
    },
  ],
  "queue_builtin.py": [
    {
      en: "`deque.popleft()` is O(1); a list pop(0) would shift every remaining element.",
      zh: "`deque.popleft()` 是 O(1)；若用 list 的 pop(0)，每次都要搬移剩余元素。",
    },
  ],
  "queue.c": [
    {
      en: "front == rear means empty; one reserved slot makes (rear + 1) % capacity == front full.",
      zh: "front == rear 表示队空；牺牲一个空槽后，(rear + 1) % capacity == front 表示队满。",
    },
  ],
  "queue.cpp": [
    {
      en: "front == rear means empty; one reserved slot makes (rear + 1) % capacity == front full.",
      zh: "front == rear 表示队空；牺牲一个空槽后，(rear + 1) % capacity == front 表示队满。",
    },
  ],
  "queue.py": [
    {
      en: "front == rear means empty; one reserved slot makes (rear + 1) % capacity == front full.",
      zh: "front == rear 表示队空；牺牲一个空槽后，(rear + 1) % capacity == front 表示队满。",
    },
  ],
  "quick_sort.c": [
    {
      en: "Lomuto partition: `boundary` marks the end of the <= pivot region and starts at low - 1; the pivot is swapped to `boundary + 1`.",
      zh: "Lomuto 分区：`boundary` 标记 <= pivot 区域的末尾，初始为 low - 1；最后把 pivot 换到 `boundary + 1`。",
    },
  ],
  "quick_sort.cpp": [
    {
      en: "Lomuto partition: `boundary` marks the end of the <= pivot region and starts at low - 1; the pivot is swapped to `boundary + 1`.",
      zh: "Lomuto 分区：`boundary` 标记 <= pivot 区域的末尾，初始为 low - 1；最后把 pivot 换到 `boundary + 1`。",
    },
  ],
  "quick_sort.py": [
    {
      en: "Lomuto partition: `boundary` marks the end of the <= pivot region and starts at low - 1; the pivot is swapped to `boundary + 1`.",
      zh: "Lomuto 分区：`boundary` 标记 <= pivot 区域的末尾，初始为 low - 1；最后把 pivot 换到 `boundary + 1`。",
    },
  ],
  "scc.c": [
    {
      en: "First pass records finish order; the reverse graph is then explored in decreasing finish order to isolate SCCs.",
      zh: "第一轮记录完成顺序；随后在反向图上按完成顺序的逆序搜索，从而分离出各个强连通分量。",
    },
  ],
  "scc.cpp": [
    {
      en: "First pass records finish order; the reverse graph is then explored in decreasing finish order to isolate SCCs.",
      zh: "第一轮记录完成顺序；随后在反向图上按完成顺序的逆序搜索，从而分离出各个强连通分量。",
    },
  ],
  "scc.py": [
    {
      en: "First pass records finish order; the reverse graph is then explored in decreasing finish order to isolate SCCs.",
      zh: "第一轮记录完成顺序；随后在反向图上按完成顺序的逆序搜索，从而分离出各个强连通分量。",
    },
  ],
  "selection_sort.c": [
    {
      en: "`minimum` holds the index of the smallest value seen in the unsorted suffix; swap only after the scan finishes.",
      zh: "`minimum` 是未排序后缀中目前最小值的下标；扫描结束后才交换。",
    },
  ],
  "selection_sort.cpp": [
    {
      en: "`minimum` holds the index of the smallest value seen in the unsorted suffix; swap only after the scan finishes.",
      zh: "`minimum` 是未排序后缀中目前最小值的下标；扫描结束后才交换。",
    },
  ],
  "selection_sort.py": [
    {
      en: "`minimum` holds the index of the smallest value seen in the unsorted suffix; swap only after the scan finishes.",
      zh: "`minimum` 是未排序后缀中目前最小值的下标；扫描结束后才交换。",
    },
  ],
  "seqlist_builtin.cpp": [
    {
      en: "`std::vector::insert/erase` shift later elements and may invalidate iterators after the edit.",
      zh: "`std::vector::insert/erase` 会搬移后续元素，并可能使编辑点之后的迭代器失效。",
    },
  ],
  "seqlist_builtin.py": [
    {
      en: "`list.insert/pop` shift the tail; this adapter has no separate capacity field.",
      zh: "`list.insert/pop` 会搬移尾部元素；这个适配版本没有独立的 capacity 字段。",
    },
  ],
  "seqlist.c": [
    {
      en: "`length` is the live element count, not capacity; insert/erase shift only the live range and then update it.",
      zh: "`length` 是有效元素数量，不是容量；插入/删除只搬移有效区间，最后再更新它。",
    },
  ],
  "seqlist.cpp": [
    {
      en: "`length` is the live element count, not capacity; insert/erase shift only the live range and then update it.",
      zh: "`length` 是有效元素数量，不是容量；插入/删除只搬移有效区间，最后再更新它。",
    },
  ],
  "seqlist.py": [
    {
      en: "`length` is the live element count, not capacity; insert/erase shift only the live range and then update it.",
      zh: "`length` 是有效元素数量，不是容量；插入/删除只搬移有效区间，最后再更新它。",
    },
  ],
  "shell_sort.c": [
    {
      en: "Each gap pass insertion-sorts independent subsequences; gap 1 is the final ordinary insertion sort.",
      zh: "每个 gap 轮次对相互独立的子序列做插入排序；gap 为 1 时就是最后一次普通插入排序。",
    },
  ],
  "shell_sort.cpp": [
    {
      en: "Each gap pass insertion-sorts independent subsequences; gap 1 is the final ordinary insertion sort.",
      zh: "每个 gap 轮次对相互独立的子序列做插入排序；gap 为 1 时就是最后一次普通插入排序。",
    },
  ],
  "shell_sort.py": [
    {
      en: "Each gap pass insertion-sorts independent subsequences; gap 1 is the final ordinary insertion sort.",
      zh: "每个 gap 轮次对相互独立的子序列做插入排序；gap 为 1 时就是最后一次普通插入排序。",
    },
  ],
  "singly_linked_list.c": [
    {
      en: "Link the new node to the old head before changing *head; otherwise the list is lost.",
      zh: "先让新节点指向旧头，再改 *head；顺序反了会丢失整条链表。",
    },
    {
      en: "Deleting the head only moves *head; the successor already owns the rest of the list.",
      zh: "删除头节点只需移动 *head；后继节点已经接住其余链表。",
    },
    {
      en: "Unlink the target before freeing it; previous keeps the only link to its successor.",
      zh: "先把目标节点摘链，再 free；previous 保存着指向后继的唯一链接。",
    },
  ],
  "singly_linked_list.cpp": [
    {
      en: "Publish the new node only after its next pointer reaches the old head.",
      zh: "先让新节点的 next 指向旧头，再把 head 发布为新节点。",
    },
    {
      en: "Removing the current tail must move tail_ back to prev, or the tail becomes dangling.",
      zh: "删除当前尾节点时必须把 tail_ 退回 prev，否则尾指针会悬空。",
    },
  ],
  "singly_linked_list.py": [
    {
      en: "Point the new node at the old head before reassigning self.head.",
      zh: "先让新节点指向旧头，再重新赋值 self.head。",
    },
    {
      en: "A None predecessor means the insertion point is unknown, so reject the request instead of dereferencing it.",
      zh: "前驱为 None 表示无法确定插入位置，应直接拒绝，而不是解引用空指针。",
    },
  ],
  "sparse_transpose_sort.cpp": [
    {
      en: "Swap row/col first, then sort by (row, col); this is O(t log t), not the course O(t+c) fast transpose.",
      zh: "先交换 row/col，再按 (row, col) 排序；这是 O(t log t)，不是课程中的 O(t+c) 快速转置。",
    },
  ],
  "sparse_transpose_sort.py": [
    {
      en: "Swap row/col first, then sort by (row, col); this is O(t log t), not the course O(t+c) fast transpose.",
      zh: "先交换 row/col，再按 (row, col) 排序；这是 O(t log t)，不是课程中的 O(t+c) 快速转置。",
    },
  ],
  "sparse_transpose.c": [
    {
      en: "`cpot[col]` is the next write position for that column; writing a triple increments it for the next entry.",
      zh: "`cpot[col]` 是该列下一个写入位置；每写入一个三元组就递增，供同列下一条使用。",
    },
  ],
  "sparse_transpose.cpp": [
    {
      en: "`cpot[col]` is the next write position for that column; writing a triple increments it for the next entry.",
      zh: "`cpot[col]` 是该列下一个写入位置；每写入一个三元组就递增，供同列下一条使用。",
    },
  ],
  "sparse_transpose.py": [
    {
      en: "`cpot[col]` is the next write position for that column; writing a triple increments it for the next entry.",
      zh: "`cpot[col]` 是该列下一个写入位置；每写入一个三元组就递增，供同列下一条使用。",
    },
  ],
  "stack_builtin.cpp": [
    {
      en: "`std::stack::pop()` returns void; read `top()` first and check emptiness before either call.",
      zh: "`std::stack::pop()` 没有返回值；调用前应先读 `top()` 并检查栈是否为空。",
    },
  ],
  "stack_builtin.py": [
    {
      en: "A Python list is a dynamic stack; pop() on an empty list raises IndexError.",
      zh: "Python list 可以作为动态栈；对空列表调用 pop() 会抛出 IndexError。",
    },
  ],
  "stack.c": [
    {
      en: "top is the live top index; -1 means empty.",
      zh: "top 指向当前栈顶而不是下一个空位；-1 表示空栈。",
    },
  ],
  "stack.cpp": [
    {
      en: "top is the live top index; -1 means empty.",
      zh: "top 指向当前栈顶而不是下一个空位；-1 表示空栈。",
    },
  ],
  "stack.py": [
    {
      en: "top is the live top index; -1 means empty.",
      zh: "top 指向当前栈顶而不是下一个空位；-1 表示空栈。",
    },
  ],
  "topological_sort.c": [
    {
      en: "A vertex enters the queue only when its indegree reaches zero; fewer than V emitted vertices means a directed cycle.",
      zh: "只有入度变为 0 的顶点才入队；最终输出少于 V 个顶点就说明存在有向环。",
    },
  ],
  "topological_sort.cpp": [
    {
      en: "A vertex enters the queue only when its indegree reaches zero; fewer than V emitted vertices means a directed cycle.",
      zh: "只有入度变为 0 的顶点才入队；最终输出少于 V 个顶点就说明存在有向环。",
    },
  ],
  "topological_sort.py": [
    {
      en: "A vertex enters the queue only when its indegree reaches zero; fewer than V emitted vertices means a directed cycle.",
      zh: "只有入度变为 0 的顶点才入队；最终输出少于 V 个顶点就说明存在有向环。",
    },
  ],
  "static_linked_list.cpp": [
    {
      en: "Keep the successor first, then redirect the predecessor; reversing loses the tail.",
      zh: "先让新结点接住后继，再改前驱；顺序反过来会丢掉后面的链。",
    },
  ],
  "static_linked_list.c": [
    {
      en: "Keep the successor first, then redirect the predecessor.",
      zh: "先让新结点接住后继，再改前驱。",
    },
  ],
  "static_linked_list.py": [
    {
      en: "Follow cur from head; array order is not logical order.",
      zh: "从 head 沿 cur 前进；数组顺序不是逻辑顺序。",
    },
  ],
  "polynomial_add.c": [
    {
      en: "Equal exponents add; a zero sum creates no result node.",
      zh: "指数相等时系数相加；和为 0 不创建结果结点。",
    },
  ],
  "polynomial_add.py": [
    {
      en: "Two cursors advance once each; a zero coefficient sum creates no node.",
      zh: "两个指针各前进一次；系数和为 0 不建结点。",
    },
  ],
  "polynomial_add.cpp": [
    {
      en: "A zero coefficient sum must create no node: 0x^k is not a sparse term.",
      zh: "系数相加为 0 时不能建结点：0x^k 不是稀疏多项式的有效项。",
    },
  ],
  "infix_to_postfix.c": [
    {
      en: "a left parenthesis blocks every pop until it is explicitly removed.",
      zh: "左括号是弹栈边界：在它被显式弹出前，不能越过它弹出其他运算符。",
    },
  ],
  "infix_to_postfix.cpp": [
    {
      en: "a left parenthesis blocks every pop until it is explicitly removed.",
      zh: "左括号是弹栈边界：在它被显式弹出前，不能越过它弹出其他运算符。",
    },
  ],
  "infix_to_postfix.py": [
    {
      en: "a left parenthesis blocks every pop until it is explicitly removed.",
      zh: "左括号是弹栈边界：在它被显式弹出前，不能越过它弹出其他运算符。",
    },
  ],
  "postfix_eval.c": [
    {
      en: "the first pop is the right operand; compute left op right.",
      zh: "第一次弹出的是右操作数，必须按“左操作数 运算符 右操作数”的顺序计算。",
    },
  ],
  "postfix_eval.cpp": [
    {
      en: "the first pop is the right operand; compute left op right.",
      zh: "第一次弹出的是右操作数，必须按“左操作数 运算符 右操作数”的顺序计算。",
    },
  ],
  "postfix_eval.py": [
    {
      en: "the first pop is the right operand; compute left op right.",
      zh: "第一次弹出的是右操作数，必须按“左操作数 运算符 右操作数”的顺序计算。",
    },
  ],
};
