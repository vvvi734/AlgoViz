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
  "bf.c": [
    {
      en: "Enumerate legal starts only: s <= n - m, otherwise s + m - 1 would pass the text end.",
      zh: "只枚举合法起点 s ≤ n−m；再大就会让 s + m − 1 越过主串末尾。",
    },
    {
      en: "j is both the confirmed prefix length and the next pattern index; text access is always s + j.",
      zh: "j 既表示已确认相等的前缀长度，也是下一个模式下标；访问主串必须用 s + j，不能直接用 j。",
    },
    {
      en: "j == m proves all m characters matched, not just the last pair.",
      zh: "只有 j == m 才证明整个模式串的 m 个字符都匹配，不能只看最后一次比较。",
    },
    {
      en: "Do not break after a hit: advancing s is what preserves overlapping occurrences.",
      zh: "命中后不能 break；继续令 s 前进，才能保留重叠出现。",
    },
  ],
  "bf.cpp": [
    {
      en: "Enumerate starts below candidate_count; size_t is unsigned, so s <= n - m + 1 would wrap at zero.",
      zh: "起点必须小于 candidate_count；size_t 是无符号类型，写成 s <= n−m+1 会在零附近回绕。",
    },
    {
      en: "Confirm the prefix; j ends at m on success or at the first mismatch, while the text index is s + j.",
      zh: "逐字符确认前缀；成功时 j 到 m，失败时停在首个失配处；主串下标始终是 s + j。",
    },
    {
      en: "Only j == m proves the whole pattern matched, not merely the last comparison.",
      zh: "只有 j == m 才证明整个模式串匹配，不能只看最后一次比较是否相等。",
    },
    {
      en: "Do not stop after a hit; advancing s preserves overlapping matches.",
      zh: "命中后不要停止；继续推进 s 才能保留重叠匹配。",
    },
  ],
  "bf.py": [
    {
      en: "If n < m no alignment can hold the pattern; the early return also avoids a non-positive range bound.",
      zh: "n < m 时没有任何对齐能容纳模式串；提前返回也避免 range 上界变成非正数。",
    },
    {
      en: "Enumerate only legal starts; start aligns pattern[0] with text[start], so its maximum is n - m.",
      zh: "只枚举合法起点；start 把 pattern[0] 对齐到 text[start]，最大值是 n−m。",
    },
    {
      en: "j is both the confirmed prefix length and the next pattern index; the compared text position is start + j.",
      zh: "j 同时是已确认前缀长度和下一个模式下标；真正比较的主串位置是 start + j。",
    },
    {
      en: "j == m proves all m characters matched, not just the last pair.",
      zh: "j == m 说明 m 个字符全部匹配，而不是某一对字符相等。",
    },
    {
      en: "Do not break after a hit: start + 1 may still form an overlapping match.",
      zh: "命中后不能 break：start + 1 仍可能形成重叠匹配。",
    },
  ],
  "gl_depth.c": [
    {
      en: "Append through a pointer-to-pointer tail, so an empty head is updated without a separate branch.",
      zh: "用指向指针的尾指针追加，空表 head 也走同一条赋值路径，不需要单独分支。",
    },
    {
      en: "Depth semantics: atom 0, empty list 1, non-empty list 1 + maximum child depth; null is only a defensive 0.",
      zh: "深度约定：原子为 0，空表为 1，非空表为 1 + 子表最大深度；NULL 仅作防御性返回 0。",
    },
    {
      en: "Purpose: Sibling sublists are alternatives, so take the maximum depth, never the sum.",
      zh: "同层子表是并列关系，深度取最大值而不是相加；相加会得到元素总数而非嵌套层数。",
    },
    {
      en: "Save next before freeing, and release the head chain first so nested children are not lost.",
      zh: "释放前先保存 next，并先释放 head 子链，否则释放当前节点后既无法继续同层，也会泄漏子表。",
    },
  ],
  "gl_depth.cpp": [
    {
      en: "Append through a pointer-to-pointer tail, so an empty head is updated without a separate branch.",
      zh: "用指向指针的尾指针追加，空表 head 也走同一条赋值路径，不需要单独分支。",
    },
    {
      en: "Depth semantics: atom 0, empty list 1, non-empty list 1 + maximum child depth; null is only a defensive 0.",
      zh: "深度约定：原子为 0，空表为 1，非空表为 1 + 子表最大深度；nullptr 仅作防御性返回 0。",
    },
    {
      en: "Purpose: Sibling sublists are alternatives; take the maximum, not the sum.",
      zh: "同层子表是并列关系，深度取最大值而不是相加。",
    },
    {
      en: "Save next before delete, and release the head chain first so nested children are not lost.",
      zh: "delete 前先保存 next，并先释放 head 子链，避免释放后失联或泄漏嵌套孩子。",
    },
  ],
  "gl_depth.py": [
    {
      en: "Purpose: A node stores its tag plus either an atom value or a child head.",
      zh: "节点同时保存 tag 和 atom/head 两支字段，但按 tag 只有一支有效；next 只指向同层后继。",
    },
    {
      en: "Purpose: Append child to the sibling chain; this function owns child.next.",
      zh: "把 child 接到同层链尾；parent.head 为空时直接成为首孩子，否则沿 next 找到末尾再接入。",
    },
    {
      en: "Purpose: Return 0 for an atom, 1 for (), or 1 + the maximum child depth.",
      zh: "原子返回 0，空表返回 1，非空表对每个孩子递归取最大值后加当前层；None 只是防御值。",
    },
    {
      en: "Siblings are alternatives, so take the maximum child depth, not the sum.",
      zh: "同层兄弟是并列分支，应取最大孩子深度，不能把各分支深度累加。",
    },
  ],
  "gl_copy.c": [
    {
      en: "A deep copy must allocate the new parent before descending; sharing a child would alias source and copy.",
      zh: "深复制必须先分配新父节点再递归孩子；直接共享孩子会让源表与副本别名同一块内存。",
    },
    {
      en: "On child failure, free the partially built subtree instead of returning a half-connected list.",
      zh: "孩子复制失败时要释放已建好的半棵子树，不能返回半连接结构而泄漏内存。",
    },
    {
      en: "Append through a pointer-to-pointer tail, so a copy with no children starts cleanly and keeps sibling order.",
      zh: "用指向指针的尾指针追加；新副本没有孩子时也能直接接入，并保持同层顺序。",
    },
    {
      en: "Purpose: Append child to the sibling chain and set its next pointer.",
      zh: "把 child 接到同层链尾，并由本函数负责设置它的 next。",
    },
  ],
  "gl_copy.cpp": [
    {
      en: "A deep copy allocates the new parent before descending; reusing a child would keep source and copy aliased.",
      zh: "深复制先分配新父节点再进入子树；复用孩子指针会让源表与副本共享节点。",
    },
    {
      en: "On allocation failure, free the half-built subtree rather than returning a partially linked copy.",
      zh: "分配失败时释放半成品子树，不能返回部分连接的副本。",
    },
    {
      en: "Append through a pointer-to-pointer tail so an empty child list needs no special branch.",
      zh: "用指向指针的尾指针追加，空孩子链也无需特殊分支。",
    },
    {
      en: "Save next before delete and free the head chain first, so neither siblings nor children are lost.",
      zh: "delete 前保存 next 并先释放 head 子链，保证同层与子表都不会丢失。",
    },
  ],
  "gl_copy.py": [
    {
      en: "Purpose: One node carries a tag and either atom text or a child head.",
      zh: "每个节点用 tag 区分原子文本与子表 head；next 只表示同层后继。",
    },
    {
      en: "Purpose: Copy one node and its subtree; src.next is intentionally not copied.",
      zh: "复制当前节点及其子树，但故意不复制 src.next；同层后继由调用方连接。",
    },
    {
      en: "Purpose: Link copies one by one; dst.head holds the first child and next holds the rest.",
      zh: "逐个接入复制孩子：第一个放 dst.head，其余沿 next 串联，避免只剩第一个孩子。",
    },
    {
      en: "Purpose: Append child to parent's sibling chain and set its next to None.",
      zh: "把 child 追加到 parent 的同层链尾，并把 child.next 显式置为 None。",
    },
  ],
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
    {
      en: "Failure path: this void helper only leaves the child untouched; it cannot report failure, while InsertNonFull continues as if the split happened. The teaching implementation registers this OOM limitation rather than changing control flow.",
      zh: "失败路径：这个 void 辅助函数只是不修改原结点，无法向调用方报告失败；InsertNonFull 仍会按“已分裂”继续。本教学实现登记该 OOM 限制，不改变控制流。",
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
      en: "Forward pass takes the maximum predecessor finish; backward pass the minimum successor start; activity slack is latest[to] - weight - earliest[from].",
      zh: "正推取前驱完成时间的最大值；逆推取后继最迟时间减边权的最小值；活动时间余量是 latest[to] − weight − earliest[from]。",
    },
  ],
  "critical_path.cpp": [
    {
      en: "Forward pass takes the maximum predecessor finish; backward pass the minimum successor start; activity slack is latest[to] - weight - earliest[from].",
      zh: "正推取前驱完成时间的最大值；逆推取后继最迟时间减边权的最小值；活动时间余量是 latest[to] − weight − earliest[from]。",
    },
  ],
  "critical_path.py": [
    {
      en: "Forward pass takes the maximum predecessor finish; backward pass the minimum successor start; activity slack is latest[to] - weight - earliest[from].",
      zh: "正推取前驱完成时间的最大值；逆推取后继最迟时间减边权的最小值；活动时间余量是 latest[to] − weight − earliest[from]。",
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
      en: "Each bucket owns a vector-backed chain; a new key is appended, and duplicates are rejected before push_back.",
      zh: "每个桶用 vector 维护一条链；新键追加到桶尾，重复键在 push_back 前被拒绝。",
    },
  ],
  "hash_chain.py": [
    {
      en: "Each bucket owns a list; a new key is appended to that bucket, and duplicates are rejected before append.",
      zh: "每个桶用列表维护一条链；新键追加到该桶，重复键在 append 前先被拒绝。",
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
      en: "Thread targets live in left_thread/right_thread; the real child pointers stay NULL.",
      zh: "线索目标保存在 left_thread/right_thread；真实孩子指针保持 NULL，未被覆盖。",
    },
  ],
  "threaded_inorder.cpp": [
    {
      en: "Thread targets live in left_thread/right_thread; the real child pointers stay null.",
      zh: "线索目标保存在 left_thread/right_thread；真实孩子指针保持空，未被覆盖。",
    },
  ],
  "threaded_inorder.py": [
    {
      en: "Thread targets live in left_thread/right_thread; the real child pointers stay None.",
      zh: "线索目标保存在 left_thread/right_thread；真实孩子指针保持 None，未被覆盖。",
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
      en: "First pass appends a vertex only after all its outgoing neighbours are finished; the second pass reads this order backwards.",
      zh: "第一遍只在顶点的所有出边邻居都完成后才追加该顶点；第二遍按这个完成顺序的逆序处理。",
    },
  ],
  "scc.cpp": [
    {
      en: "First pass appends a vertex only after all its outgoing neighbours are finished; the second pass reads this order backwards.",
      zh: "第一遍只在顶点的所有出边邻居都完成后才追加该顶点；第二遍按这个完成顺序的逆序处理。",
    },
  ],
  "scc.py": [
    {
      en: "First pass appends a vertex only after all its outgoing neighbours are finished; the second pass reads this order backwards.",
      zh: "第一遍只在顶点的所有出边邻居都完成后才追加该顶点；第二遍按这个完成顺序的逆序处理。",
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
  "free_list.c": [
    {
      en: "A block owns the half-open interval [start, start + size).",
      zh: "一个块拥有半开区间 [start, start + size)；右端点不包含在块内。",
    },
  ],
  "free_list.cpp": [
    {
      en: "A block owns the half-open interval [start, start + size).",
      zh: "一个块拥有半开区间 [start, start + size)；右端点不包含在块内。",
    },
  ],
  "free_list.py": [
    {
      en: "A block owns the half-open interval [start, start + size).",
      zh: "一个块拥有半开区间 [start, start + size)；右端点不包含在块内。",
    },
  ],
  "buddy_system.c": [
    {
      en: "The merged block starts at the smaller address and doubles its size.",
      zh: "合并后的块从较小的地址开始，大小翻倍并提升一级。",
    },
  ],
  "buddy_system.cpp": [
    {
      en: "The merged block starts at the smaller address and doubles its size.",
      zh: "合并后的块从较小的地址开始，大小翻倍并提升一级。",
    },
  ],
  "buddy_system.py": [
    {
      en: "The merged block starts at the smaller address and doubles its size.",
      zh: "合并后的块从较小的地址开始，大小翻倍并提升一级。",
    },
  ],
  "garbage_collection.c": [
    {
      en: "Every reference stores an address, so all endpoints must be refreshed.",
      zh: "引用中保存了地址，因此移动对象后所有相关端点都必须刷新。",
    },
  ],
  "garbage_collection.cpp": [
    {
      en: "Every reference stores an address, so all endpoints must be refreshed.",
      zh: "引用中保存了地址，因此移动对象后所有相关端点都必须刷新。",
    },
  ],
  "garbage_collection.py": [
    {
      en: "Every reference stores an address, so all endpoints must be refreshed.",
      zh: "引用中保存了地址，因此移动对象后所有相关端点都必须刷新。",
    },
  ],
  "block_search.c": [
    {
      en: "Purpose: Validate the index prerequisite and build one entry per real block; returns the block count or -1.",
      zh: "作用：校验索引前提并逐块建立索引项；合法返回块数，非法返回 -1。",
    },
    {
      en: "Purpose: Probe the index, then scan exactly the selected block; comparisons reports both stage counts.",
      zh: "作用：先顺序探测索引，再只扫描被选中的块；comparisons 分别报告索引与块内比较次数。",
    },
  ],
  "block_search.cpp": [
    {
      en: "Purpose: Validate the range prerequisite and build one entry per consecutive block.",
      zh: "作用：校验块范围递增前提，并为每个连续块建立索引项。",
    },
    {
      en: "Purpose: Probe the index, then scan the selected block; stats separates the two stages.",
      zh: "作用：先探测索引，再扫描选中的块；stats 分开记录两个阶段的比较次数。",
    },
  ],
  "block_search.py": [
    {
      en: "Purpose: Build one index entry per consecutive block after validating the real range prerequisite.",
      zh: "作用：校验真实块范围前提后，为每个连续块建立一个索引项。",
    },
    {
      en: "Purpose: Probe the index sequentially, then scan only the selected real block.",
      zh: "作用：顺序探测索引，然后只扫描被选中的真实块。",
    },
  ],
  "bplus_tree.c": [
    {
      en: "Purpose: Split a leaf 2/2, preserve the leaf chain, and promote the first key of the new right leaf.",
      zh: "作用：把叶节点按 2/2 分裂，保持叶链，并提升新右叶的首键。",
    },
    {
      en: "Failure path: `result` starts as {valid=1, right=-1}; if new_node fails this returns that unchanged, and callers do not reject right=-1, so exhausting the static pool can install an invalid separator. The teaching implementation records this limitation instead of changing insertion flow.",
      zh: "失败路径：result 初值为 {valid=1, right=-1}；new_node 失败时原样返回，调用方又没有拒绝 right=-1，因此静态池耗尽可能写入无效分隔键。本教学实现登记该限制，不改变插入流程。",
    },
    {
      en: "Purpose: Split an internal node, promote and remove the middle separator, and move the right child range.",
      zh: "作用：分裂内部节点，提升并移除中间分隔键，同时移动右半孩子范围。",
    },
    {
      en: "Purpose: Range scan starts at the lower-bound leaf, then follows next and stops above high.",
      zh: "作用：范围扫描从下界叶子开始，再沿 next 前进并在超过上界时停止。",
    },
  ],
  "bplus_tree.cpp": [
    {
      en: "Purpose: Split a leaf 2/2 and promote the first key of the right leaf.",
      zh: "作用：叶节点按 2/2 分裂，并提升右叶首键。",
    },
    {
      en: "Purpose: Split an internal node, promote and remove the middle separator, and move the right child range.",
      zh: "作用：分裂内部节点，提升并移除中间分隔键，同时移动右半孩子范围。",
    },
    {
      en: "Purpose: Start at the lower-bound leaf, follow next, and stop once keys exceed the upper bound.",
      zh: "作用：从下界叶子开始，沿 next 前进，超过上界即停止。",
    },
  ],
  "bplus_tree.py": [
    {
      en: "Purpose: Split a leaf 2/2 and promote the first key of the new right leaf.",
      zh: "作用：叶节点按 2/2 分裂，并提升新右叶首键。",
    },
    {
      en: "Purpose: Start at the lower-bound leaf, follow next, and stop once records exceed high.",
      zh: "作用：从下界叶子开始，沿 next 前进，超过上界即停止。",
    },
  ],
  "key_tree.c": [
    {
      en: "Purpose: Follow the whole word and report the last existing node plus matched length; terminal is a separate test.",
      zh: "作用：沿整词下降，返回最后存在的节点与已匹配长度；是否为词还要单独检查 terminal。",
    },
    {
      en: "Purpose: A word exists only when every character edge exists AND the last node is terminal.",
      zh: "作用：只有每个字符边都存在且末节点 terminal=true 才算命中。",
    },
    {
      en: "Purpose: Reject duplicates first, create only missing suffix nodes, then set terminal at the end.",
      zh: "作用：先拒绝重复，再只为缺失后缀建节点，最后在末端设置 terminal。",
    },
  ],
  "key_tree.cpp": [
    {
      en: "Purpose: Walk as far as the edges exist and report the last real node plus matched length.",
      zh: "作用：沿已存在的边尽量下降，返回最后真实节点与匹配长度。",
    },
    {
      en: "Purpose: A hit needs the full path AND terminal=true; a prefix alone is not a word.",
      zh: "作用：命中要求整条路径存在且 terminal=true；只有前缀不算单词。",
    },
  ],
  "key_tree.py": [
    {
      en: "Purpose: A hit needs every edge and terminal=True; a shared prefix alone is not a word.",
      zh: "作用：命中要求每条边都存在且 terminal=True；共享前缀本身不是单词。",
    },
    {
      en: "Purpose: Reject duplicates first, then create only missing suffix nodes and mark the end terminal.",
      zh: "作用：先拒绝重复，再只为缺失后缀创建节点，并把末端标记为 terminal。",
    },
  ],
  "tournament_sort.c": [
    {
      en: "Stable order: smaller value wins; on equality the smaller originalIndex wins.",
      zh: "稳定次序：关键字更小者胜出；关键字相等时原始下标更小者胜出。",
    },
    {
      en: "Purpose: Fill leaves in input order, then build every internal winner bottom-up.",
      zh: "作用：按输入次序填充叶节点，再自底向上构建每个内部节点的赢家。",
    },
    {
      en: "Purpose: Remove one winner and recompute only the ancestors of its leaf.",
      zh: "作用：取出一个赢家，并只重算它所在叶子到根的祖先路径。",
    },
  ],
  "tournament_sort.cpp": [
    {
      en: "Stable order: smaller value wins; on equality the smaller originalIndex wins.",
      zh: "稳定次序：关键字更小者胜出；关键字相等时原始下标更小者胜出。",
    },
    {
      en: "Purpose: Fill leaves in input order, then build every internal winner bottom-up.",
      zh: "作用：按输入次序填充叶节点，再自底向上构建每个内部节点的赢家。",
    },
    {
      en: "Purpose: Deactivate the winner and recompute parents along its leaf-to-root path.",
      zh: "作用：失效赢家，并沿它的叶到根路径重算父节点。",
    },
  ],
  "tournament_sort.py": [
    {
      en: "Purpose: Fill leaves in input order, then build every internal winner bottom-up.",
      zh: "作用：按输入次序填充叶节点，再自底向上构建每个内部节点的赢家。",
    },
    {
      en: "Purpose: Deactivate the winner and recompute only its leaf-to-root path.",
      zh: "作用：失效赢家，并只重算它的叶到根路径。",
    },
  ],
  "radix_sort.c": [
    {
      en: "Purpose: Extract the decimal digit selected by the current place value.",
      zh: "作用：按当前位权取出一个十进制数位。",
    },
    {
      en: "Purpose: Run LSD passes over order, using stable FIFO buckets and a fresh order each pass.",
      zh: "作用：按 LSD 顺序处理各趟，使用稳定的 FIFO 桶，并在每趟生成新的序列。",
    },
  ],
  "radix_sort.cpp": [
    {
      en: "Purpose: Extract the decimal digit selected by the current place value.",
      zh: "作用：按当前位权取出一个十进制数位。",
    },
    {
      en: "Purpose: Run LSD passes over order, using stable FIFO buckets and a fresh order each pass.",
      zh: "作用：按 LSD 顺序处理各趟，使用稳定的 FIFO 桶，并在每趟生成新的序列。",
    },
  ],
  "radix_sort.py": [
    {
      en: "Purpose: Extract the decimal digit selected by the current place value.",
      zh: "作用：按当前位权取出一个十进制数位。",
    },
    {
      en: "Purpose: Run stable LSD passes; the result is built only by distribution and collection.",
      zh: "作用：执行稳定的 LSD 各趟；最终结果只由分配和收集产生。",
    },
  ],
  "multiway_merge.c": [
    {
      en: "Stable candidate order: smaller value wins, then the earlier original record.",
      zh: "候选比较先看关键字，关键字相等时取原始下标更小者，保证稳定次序。",
    },
    {
      en: "Only buffer[0] of each run is a candidate; the run's unread tail stays invisible until Refill moves it in.",
      zh: "每段只有缓冲区队首 buffer[0] 能参加比较；段内尚未读入的尾部记录必须等 Refill 搬进缓冲区后才可见。",
    },
    {
      en: "The last partial output block is still a block and must not be dropped.",
      zh: "循环结束后输出缓冲区可能未满，但残余记录仍构成一个模拟块，必须写出。",
    },
  ],
  "multiway_merge.cpp": [
    {
      en: "Only buffer.front() of each run is a candidate; unread records behind the FIFO window are not compared.",
      zh: "每段只有缓冲区队首能参加比较；FIFO 窗口之后的未读记录不能提前比较。",
    },
    {
      en: "A trailing partial buffer is still one simulated output block.",
      zh: "最后不满的输出缓冲区仍算一个模拟输出块，不能丢弃。",
    },
    {
      en: "Purpose: Fill the free tail of one input buffer from the run's unread prefix.",
      zh: "从该段尚未读入的前缀补满输入缓冲区空位，并累计一次模拟读块。",
    },
    {
      en: "Purpose: Merge k runs and print the stable output plus simulated block counts.",
      zh: "执行一趟 k 路归并，输出稳定结果与模拟读写块数。",
    },
  ],
  "multiway_merge.py": [
    {
      en: "The tuple comparison falls back to the original input position, so equal keys remain stable.",
      zh: "元组比较在关键字相等时回退到原始输入位置，因此重复关键字仍保持稳定次序。",
    },
    {
      en: "Only the buffer front of each run enters candidates; records behind the FIFO window are not read yet.",
      zh: "只有各段缓冲区队首进入候选集；FIFO 窗口后的记录尚未读入，不能参与比较。",
    },
    {
      en: "The final partial block still counts as one simulated write.",
      zh: "最后残余的不完整输出块仍计一次模拟写块。",
    },
    {
      en: "Purpose: Read one simulated block into the free tail of a run's FIFO buffer.",
      zh: "向某段 FIFO 缓冲区尾部读入一个模拟块；没有空位或没有剩余记录时不读。",
    },
  ],
  "replacement_selection.c": [
    {
      en: "Stable order: smaller value first, then the earlier original record.",
      zh: "置换选择按关键字升序；关键字相等时用原始下标决胜，保持稳定。",
    },
    {
      en: "Purpose: Find an empty slot; frozen records keep occupying their slots.",
      zh: "寻找空槽读入新记录；冻结记录仍占着槽位，不能被覆盖或删除。",
    },
    {
      en: "A refilled record joins the run only when key >= lastOutput; equality is allowed, smaller keys freeze.",
      zh: "补读记录只有在关键字不小于上次输出时才可加入当前段；相等允许，较小者冻结。",
    },
    {
      en: "A new run starts with no threshold; keeping the old lastOutput would wrongly freeze smaller keys.",
      zh: "新段开始时没有阈值；若沿用上一段的 lastOutput，会把本可输出的较小关键字错误冻结。",
    },
  ],
  "replacement_selection.cpp": [
    {
      en: "The originalIndex tie-break keeps equal keys in stable input order.",
      zh: "用 originalIndex 决胜，使关键字相等的记录保持原始输入次序。",
    },
    {
      en: "Only keys below the threshold are frozen; equality remains eligible.",
      zh: "只有严格小于阈值的键被冻结；等于阈值仍属于当前段可输出记录。",
    },
    {
      en: "A new run starts with no threshold; carrying lastOutput forward would freeze smaller keys incorrectly.",
      zh: "新段不继承阈值；把旧 lastOutput 带过去会错误冻结更小的键。",
    },
    {
      en: "Purpose: Run replacement selection and return the generated initial runs.",
      zh: "实际运行置换选择，返回生成的各初始归并段。",
    },
  ],
  "replacement_selection.py": [
    {
      en: "The tuple key falls back to input position, so equal values preserve their original order.",
      zh: "元组键在值相等时回退到输入位置，使重复值保持原始次序。",
    },
    {
      en: "Equality is eligible: only a key below last_output would break the current run's sorted order.",
      zh: "等于阈值仍可输出；只有小于 last_output 的键才会破坏当前段的有序性。",
    },
    {
      en: "A new run has no threshold; keeping the previous last_output would freeze records that are now valid.",
      zh: "新段没有阈值；继续保留上一段的 last_output 会冻结本应可输出的记录。",
    },
    {
      en: "Purpose: Run replacement selection over a fixed workspace and return the runs.",
      zh: "在固定大小工作区上运行置换选择，返回全部初始段。",
    },
  ],
  "optimal_merge_tree.c": [
    {
      en: "Greedy order: lightest first; real leaves before virtual leaves, then node id.",
      zh: "森林根按权重最轻优先；同权时真实叶优先于虚拟叶，再按节点编号，保证结果可复现。",
    },
    {
      en: "The forest must end with one root, so pad with d zero-weight leaves; they change shape, never the total weight.",
      zh: "森林最终必须只剩一个根，因此补 d 个零权重虚拟叶；它们只改变树形，不改变总权重和总代价。",
    },
    {
      en: "Each internal weight is paid once in the schedule, so total cost is their sum, not the root weight alone.",
      zh: "每个内部节点的权重在归并计划中支付一次，总代价是所有内部权重之和，不能只看根权重。",
    },
    {
      en: "Purpose: Build the optimal merge tree and return its total merge cost.",
      zh: "构造 k 路最佳归并树，并返回所有内部节点权重之和。",
    },
  ],
  "optimal_merge_tree.cpp": [
    {
      en: "The forest must end with one root, so pad with d zero-weight leaves; they change shape, never the total weight.",
      zh: "森林最终必须只剩一个根，因此补 d 个零权重虚拟叶；它们只改变树形，不改变总权重和总代价。",
    },
    {
      en: "Every internal weight is paid once, so total cost is the sum of all internal weights, not the root.",
      zh: "每个内部权重只支付一次，总代价是所有内部权重之和，不是根权重。",
    },
    {
      en: "Purpose: Build the full k-ary greedy tree and return the total merge cost.",
      zh: "构造满 k 叉的贪心归并树，并返回总归并代价。",
    },
  ],
  "optimal_merge_tree.py": [
    {
      en: "The forest must end with one root, so pad with d zero-weight leaves; they change shape, never total weight.",
      zh: "森林最终必须只剩一个根，因此补 d 个零权重虚拟叶；它们只补形状，不改变总权重。",
    },
    {
      en: "Every internal weight is paid once, so total cost is their sum, not the root weight alone.",
      zh: "每个内部权重只支付一次，总代价是内部权重之和，而不是根权重。",
    },
    {
      en: "Purpose: Build a full k-ary greedy merge tree and return total cost plus nodes.",
      zh: "构造满 k 叉贪心归并树，返回总代价与全部节点。",
    },
  ],
  "indexed_file.c": [
    {
      en: "Purpose: Split sorted records into fixed-capacity data blocks.",
      zh: "把有序记录按块容量切块；块号就是索引项保存的物理地址，块内顺序由排序保证。",
    },
    {
      en: "Dense emits one entry per record; sparse emits each block's last key as an upper bound, not the next block's first key.",
      zh: "稠密索引每记录一项；稀疏索引每块只存最后一条记录的关键字作为上界，这个上界不是下一块的首键。",
    },
    {
      en: "Choose the last entry not greater than target: a sparse bound belongs to the block whose maximum it is.",
      zh: "选择不大于目标的最后一项；稀疏上界属于它所描述的那个块，不能误选第一个更大项。",
    },
    {
      en: "A miss still reads the selected block once, so success and failure are measured with the same I/O unit.",
      zh: "即使失败也要读取被选中的块一次，使成功与失败使用同一个 I/O 计量单位。",
    },
  ],
  "indexed_file.cpp": [
    {
      en: "Stable sorting keeps equal keys in input order, so the block layout is deterministic for the demo.",
      zh: "稳定排序让相等键保持输入次序，使演示中的切块结果可重复。",
    },
    {
      en: "Dense mode emits every record key; sparse mode emits each block's last key as an upper bound, not the next block's first key.",
      zh: "稠密模式为每条记录建项；稀疏模式只存每块最后键作为上界，而不是下一块首键。",
    },
    {
      en: "Choose the last entry not greater than target, then read exactly one block; a miss still counts that block read.",
      zh: "选不大于目标的最后一项，只读一个数据块；失败仍计一次块读取。",
    },
  ],
  "indexed_file.py": [
    {
      en: "Dense mode emits every record; sparse mode emits only the last key of each block as an upper bound.",
      zh: "稠密模式为每条记录建项；稀疏模式只为每块最后键建一个上界项。",
    },
    {
      en: "chosen starts at 0 so a target above every entry still selects the last valid block.",
      zh: "chosen 从 0 开始，目标大于所有索引项时仍会落到最后一个有效块，不会越界。",
    },
    {
      en: "A miss still reads the selected block once; in-block comparisons are record checks, not extra block I/O.",
      zh: "失败也要读选中块一次；块内逐条比较属于记录检查，不额外计块 I/O。",
    },
  ],
  "isam_file.c": [
    {
      en: "Fill the first free slot only after shifting larger keys right, so no sorted record is overwritten.",
      zh: "先把严格更大的键右移，再写第一个空位；否则会覆盖仍有效的有序记录。",
    },
    {
      en: "The main block alone is not enough: an overflow record may be the true maximum, so the chain must be scanned.",
      zh: "只算主块不够：溢出记录可能是真正最大键，必须把专属溢出链一起扫描。",
    },
    {
      en: "Return the first block whose maximum is at least target; beyond every bound, the last block is the only candidate.",
      zh: "返回第一个“最大键不小于目标”的块；目标超过所有上界时，最后一块是唯一候选。",
    },
    {
      en: "Check the selected main block first; only a main-area miss follows that block's private overflow chain.",
      zh: "先检查选中的主块；只有主区未命中，才沿该块专属溢出链继续。",
    },
    {
      en: "Recompute every bound after a mutation because an overflow append can change the block's maximum.",
      zh: "每次修改后都要重算全部上界；向溢出链追加记录也可能改变该块的最大键。",
    },
    {
      en: "The chosen block is fixed before overflow is considered; a full block appends to its own chain and then the index is refreshed.",
      zh: "先锁定主块再考虑溢出；块满时只追加到它自己的链，最后刷新索引上界。",
    },
  ],
  "isam_file.cpp": [
    {
      en: "The main block alone is insufficient: an overflow record can be the true maximum, so the chain is scanned.",
      zh: "只看主块不够：溢出记录可能是真正最大键，因此必须扫描整条专属链。",
    },
    {
      en: "Bounds are derived data, so every mutation rebuilds them from the current blocks and chains.",
      zh: "上界是派生数据；每次插入后都按当前主块与溢出链重建，避免索引落后。",
    },
    {
      en: "Select the first block whose bound is at least target; beyond all bounds, only the last block can contain it.",
      zh: "选第一个上界不小于目标的块；超过全部上界时，只有最后一块可能包含目标。",
    },
    {
      en: "The block is chosen before overflow is considered; a full block appends to its private chain, then bounds are rebuilt.",
      zh: "先选块再处理溢出；主块满时追加到它自己的链，随后重建上界。",
    },
    {
      en: "Scan the selected main block first; only a main-area miss follows that block's private overflow chain.",
      zh: "先扫选中主块；只有主区未命中，才沿该块专属溢出链继续。",
    },
  ],
  "isam_file.py": [
    {
      en: "The first bound >= target owns the candidate; if target exceeds every bound, the last block is still the only possible owner.",
      zh: "第一个上界不小于目标的块承接候选；目标超过所有上界时，最后一块仍是唯一可能的归属。",
    },
    {
      en: "The block is fixed before overflow is considered, so a full block never sends the record to another block's chain.",
      zh: "先锁定块再考虑溢出，因此块满也不会把记录送到别的块链。",
    },
    {
      en: "A main-area hit returns immediately; the private overflow chain is read only after the main block misses.",
      zh: "主区命中立即返回；只有主块未命中后才读取专属溢出链。",
    },
    {
      en: "Bounds are rebuilt from the main blocks plus overflow chains; they are never copied from the inserted key.",
      zh: "上界由主块与溢出链共同重建，不能直接把新插入键复制成上界。",
    },
  ],
  "inverted_index.c": [
    {
      en: "A missing term returns NULL; an empty posting list is a different state, though both contain no record.",
      zh: "缺失关键字返回 NULL；这与“表存在但暂时没有记录”不同，虽然两者都查不到记录。",
    },
    {
      en: "Postings store record indices, so membership compares an integer position rather than an external ID string.",
      zh: "倒排表保存记录下标，因此成员判断比较整数位置，而不是外部记录 ID 字符串。",
    },
    {
      en: "Iterating records in storage order makes AND/OR results stable and naturally deduplicated.",
      zh: "按原记录顺序遍历，使 AND/OR 结果顺序稳定，并且每条记录只判断一次而天然去重。",
    },
  ],
  "inverted_index.cpp": [
    {
      en: "`map[term]` creates the posting vector on first sight, so building needs no separate term directory.",
      zh: "`map[term]` 在关键字首次出现时创建倒排表，因此构建阶段不需要额外维护词项目录。",
    },
    {
      en: "The ordered map keeps terms unique and makes printed term order deterministic; it is not a relevance ranking.",
      zh: "有序 map 保证词项唯一并使打印顺序确定；它只是字典序，不是相关性排名。",
    },
    {
      en: "Walking records, not postings, makes AND/OR output follow storage order and deduplicate each record naturally.",
      zh: "遍历记录而不是遍历倒排表，使 AND/OR 结果遵循存储顺序，并自然去重。",
    },
  ],
  "inverted_index.py": [
    {
      en: "setdefault creates a posting list on first sight, so build order does not need a separate term table.",
      zh: "setdefault 在关键字首次出现时创建倒排表，构建阶段无需单独维护词项目录。",
    },
    {
      en: "Walk records, not posting lists, so AND and OR both keep storage order and return each record at most once.",
      zh: "遍历记录而非倒排表，使 AND 与 OR 都保持存储顺序，并让每条记录最多返回一次。",
    },
    {
      en: "A missing term falls back to an empty list: AND with it must fail, while OR can still match another term.",
      zh: "缺失关键字回退为空列表：与它做 AND 必然失败，但 OR 仍可能由另一个关键字命中。",
    },
  ],
};
