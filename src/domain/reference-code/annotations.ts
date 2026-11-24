/**
 * Reviewed bilingual annotations for the reference sources.
 *
 * The source files stay in English so there is only one implementation body. A
 * key is the source file name; `en` must match the text of a standalone line
 * comment in that file exactly, and `zh` is the reviewed Chinese rendering
 * shown when the UI language is Chinese. Comments that are not listed here are
 * treated as source-only documentation and are omitted from the Chinese view.
 */
import { BATCH_03_ANNOTATIONS } from './batch-03-annotations';
import { BATCH_04_ANNOTATIONS } from './batch-04-annotations';
import { BATCH_05_ANNOTATIONS } from './batch-05-annotations';

export interface ReferenceAnnotation {
  en: string;
  zh: string;
}

const BASE_REFERENCE_ANNOTATIONS: Record<string, readonly ReferenceAnnotation[]> = {
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
    {
      en: "Reset j for every candidate. BF keeps no prefix state, so characters already compared under one alignment may be compared again under the next; that is the source of its O(nm) worst case.",
      zh: "每个候选起点都把 j 重置为 0。BF 不保存前缀状态，上一对齐比较过的字符可能在下一起点再次比较，这正是 O(nm) 最坏情况的来源。",
    },
    {
      en: "The candidate bound s <= n-m makes every s+j a valid text index, so the loop can run to m without a separate bounds check inside.",
      zh: "候选上界 s ≤ n−m 保证每个 s+j 都是合法主串下标，因此循环可一直走到 m，无需在内部再加边界检查。",
    },
    {
      en: "The output array is caller-owned and fixed. Fail before writing past capacity rather than silently dropping a match and returning a smaller count.",
      zh: "输出数组由调用方提供且容量固定；写越界前必须失败，不能静默丢掉匹配却返回更小的计数。",
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
    {
      en: "j restarts at 0 for each start because BF intentionally keeps no matched-prefix state. Previously compared characters may be compared again, giving O(nm) worst-case time.",
      zh: "每个起点都把 j 重置为 0，因为 BF 刻意不保存已匹配前缀；旧字符可能再次比较，导致 O(nm) 最坏时间。",
    },
    {
      en: "The legal-start bound makes s+j stay inside text, so the inner loop only needs to test j < m and character equality.",
      zh: "合法起点上界保证 s+j 不越过主串，因此内层只需判断 j < m 和字符是否相等。",
    },
    {
      en: "candidate_count is computed only after the n < m guard, so it is at least one and the unsigned loop has a safe stop.",
      zh: "candidate_count 只在 n < m 的提前返回之后计算，因此至少为 1，无符号循环也有安全终点。",
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
    {
      en: "j is reset for every start because BF does not reuse a matched prefix. The same text character can be compared in several alignments, which is why the worst case is O(nm).",
      zh: "每个起点都重置 j，因为 BF 不复用已匹配前缀；同一主串字符可能在多次对齐中重复比较，故最坏为 O(nm)。",
    },
    {
      en: "The legal-start bound keeps start+j within text; the loop therefore only checks the pattern index and character equality.",
      zh: "合法起点上界保证 start+j 不越过主串；循环只需检查模式下标和字符是否相等。",
    },
    {
      en: "The n < m case has already returned, so candidate_count is at least one and range(candidate_count) always has a valid first start.",
      zh: "n < m 的情况已提前返回，因此 candidate_count 至少为 1，range(candidate_count) 总有合法首起点。",
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
      en: "Sibling sublists are alternatives, so take the maximum depth, never the sum.",
      zh: "同层子表是并列关系，深度取最大值而不是相加；相加会得到元素总数而非嵌套层数。",
    },
    {
      en: "Save next before freeing, and release the head chain first so nested children are not lost.",
      zh: "释放前先保存 next，并先释放 head 子链，否则释放当前节点后既无法继续同层，也会泄漏子表。",
    },
    {
      en: "An atom has no list layer, so its depth is 0. Reading value.head here would use the wrong union member and treat a character buffer as a pointer.",
      zh: "原子没有列表层，所以深度为 0；此处读 value.head 会取错 union 成员，把字符缓冲区当成指针。",
    },
    {
      en: "An empty list is a real node representing (), so it counts as one layer. Only a null pointer means no table at all; that case was handled before this check.",
      zh: "空表是表示 () 的真实结点，因此算一层；只有空指针才表示根本没有表，而那种情况已在此检查前处理。",
    },
    {
      en: "best starts at 0 because the empty-list case already returned. Every child depth must beat the current best before it can become the maximum.",
      zh: "best 从 0 开始，因为空表情况已经提前返回；每个孩子深度必须超过当前最大值，才能成为新的最大值。",
    },
    {
      en: "Recursion enters one child through head; the for-loop's next step follows the sibling next link. This keeps nesting depth separate from same-level traversal.",
      zh: "递归通过 head 进入一个孩子；for 循环的下一步沿同层 next 前进，从而把嵌套深度与同层遍历区分开。",
    },
    {
      en: "Adding one counts the current list's parentheses layer. Taking the maximum rather than the sum is what makes this a depth, not a count of elements.",
      zh: "加一是在计算当前列表这一层括号；取最大值而不是求和，才使结果表示深度而不是元素个数。",
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
      en: "Sibling sublists are alternatives; take the maximum, not the sum.",
      zh: "同层子表是并列关系，深度取最大值而不是相加。",
    },
    {
      en: "Save next before delete, and release the head chain first so nested children are not lost.",
      zh: "delete 前先保存 next，并先释放 head 子链，避免释放后失联或泄漏嵌套孩子。",
    },
    {
      en: "An atom contributes no nesting layer, so it returns 0. Deferencing value.head for an atom would read the union through the wrong member.",
      zh: "原子不贡献嵌套层，因此返回 0；对原子解引用 value.head 会通过错误的 union 成员读取。",
    },
    {
      en: "A real empty list has no children but still represents one pair of parentheses, so it returns 1; null is only a defensive no-node value.",
      zh: "真实空表没有孩子，但仍代表一对括号，所以返回 1；nullptr 只是防御性的“没有结点”。",
    },
    {
      en: "The empty case already returned, so best can start at 0. Each child's depth is compared against the best seen so far.",
      zh: "空表情况已经返回，因此 best 可从 0 开始；每个孩子深度都与目前最大值比较。",
    },
    {
      en: "head moves one level down, while the loop's child=child->next stays on the sibling chain. Recursion depth therefore tracks nesting, not the number of siblings.",
      zh: "head 向下一层进入，而循环中的 child=child->next 留在同层兄弟链；因此递归深度对应嵌套层数，而不是兄弟数量。",
    },
    {
      en: "The +1 accounts for the current list layer; the maximum, not a sum, ensures several sibling branches do not inflate the depth.",
      zh: "加一计算当前列表层；取最大值而非求和，确保多个兄弟分支不会把深度累加虚增。",
    },
  ],
  "gl_depth.py": [
    {
      en: "A node stores its tag plus either an atom value or a child head.",
      zh: "节点同时保存 tag 和 atom/head 两支字段，但按 tag 只有一支有效；next 只指向同层后继。",
    },
    {
      en: "Append child to the sibling chain; this function owns child.next.",
      zh: "把 child 接到同层链尾；parent.head 为空时直接成为首孩子，否则沿 next 找到末尾再接入。",
    },
    {
      en: "Return 0 for an atom, 1 for (), or 1 + the maximum child depth.",
      zh: "原子返回 0，空表返回 1，非空表对每个孩子递归取最大值后加当前层；None 只是防御值。",
    },
    {
      en: "Siblings are alternatives, so take the maximum child depth, not the sum.",
      zh: "同层兄弟是并列分支，应取最大孩子深度，不能把各分支深度累加。",
    },
    {
      en: "An atom has no child head and no parentheses layer, so its depth is 0; treating it as a list would read the wrong representation.",
      zh: "原子没有孩子 head，也没有括号层，所以深度为 0；把它当子表会读取错误的表示。",
    },
    {
      en: "A list node with head None is the real empty list (), which still counts as one layer. A missing node is different and was handled by the None check above.",
      zh: "head 为 None 的列表结点是真实空表 ()，仍然算一层；缺少结点是另一回事，已由上方的 None 判断处理。",
    },
    {
      en: "best is safe to start at 0 only because the empty-list case has already returned; every non-empty child must provide a depth to compare.",
      zh: "只有空表已提前返回时，best 才能安全地从 0 开始；每个非空孩子都必须给出可比较的深度。",
    },
    {
      en: "Recursive descent follows head into one child, while `child = child.next` walks siblings. Those two links represent different levels and must not be mixed.",
      zh: "递归沿 head 下降到一个孩子，而 `child = child.next` 遍历兄弟；这两条链接代表不同层级，不能混用。",
    },
    {
      en: "The current list adds one bracket layer; the maximum child depth is used, so sibling alternatives do not add extra levels.",
      zh: "当前列表增加一层括号；使用孩子最大深度，因此并列兄弟不会额外增加层数。",
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
      en: "Append child to the sibling chain and set its next pointer.",
      zh: "把 child 接到同层链尾，并由本函数负责设置它的 next。",
    },
    {
      en: "Allocate the copy's parent before descending. Returning src or reusing a child would alias source and copy, so later mutation in one tree would silently change the other.",
      zh: "先分配副本的父结点再递归下降；返回 src 或复用孩子会让源表与副本别名，之后修改一棵树会悄悄改变另一棵。",
    },
    {
      en: "An atom has no children, so copying its text into the fresh node completes this subtree. There is no head to recurse into and no next to copy here.",
      zh: "原子没有孩子，把文本复制到新结点就完成了这棵子树；这里既没有 head 可递归，也不复制 next。",
    },
    {
      en: "tail is the address of the next link slot, starting at the new list's head. This lets the first and later copied children use the same assignment path.",
      zh: "tail 是下一个链接槽的地址，从新表的 head 开始；这样第一个和后续复制孩子都走同一条赋值路径。",
    },
    {
      en: "Attach the copied child at the current slot, then move tail to the child's next field. Linking before advancing is what preserves sibling order.",
      zh: "把复制孩子接到当前槽，再把 tail 移到该孩子的 next 字段；先接链再前进才能保持同层顺序。",
    },
    {
      en: "A failed recursive copy leaves a partially linked subtree. Free it through the real child edges before returning NULL, so the caller never receives a half-built list.",
      zh: "递归复制失败会留下部分连接的子树；返回 NULL 前必须沿真实孩子边释放它，避免调用方拿到半成品链。",
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
    {
      en: "The new parent must exist before its children are copied. Sharing a source child would make the two trees alias, so a later edit in one would appear in the other.",
      zh: "新父结点必须先于孩子复制而存在；共享源孩子会让两棵树别名，之后对一棵的修改会出现在另一棵。",
    },
    {
      en: "An atom is a leaf: copying its text into the fresh node finishes the whole subtree, with no head recursion and no next link copied.",
      zh: "原子是叶结点：把文本复制到新结点就完成整棵子树，既没有 head 递归，也不复制 next。",
    },
    {
      en: "tail addresses the next child-link slot. Starting at the fresh node's head lets an empty copy and a non-empty copy share one insertion loop.",
      zh: "tail 指向下一个孩子链接槽；从新结点的 head 开始，使空副本与非空副本共用同一个插入循环。",
    },
    {
      en: "Write the copied child into the current slot, then advance tail to that child's next field. Reversing the two steps would lose the insertion point.",
      zh: "把复制孩子写入当前槽，再把 tail 推进到该孩子的 next 字段；两步顺序反过来会丢失插入位置。",
    },
    {
      en: "A throw from a deeper allocation is not caught here, but this null check still guards the contract. Freeing the half-built subtree keeps ownership clean on failure.",
      zh: "更深层的分配异常不会在此捕获，但这个空指针检查仍维护契约；失败时释放半成品子树可保持所有权清晰。",
    },
  ],
  "gl_copy.py": [
    {
      en: "One node carries a tag and either atom text or a child head.",
      zh: "每个节点用 tag 区分原子文本与子表 head；next 只表示同层后继。",
    },
    {
      en: "Copy one node and its subtree; src.next is intentionally not copied.",
      zh: "复制当前节点及其子树，但故意不复制 src.next；同层后继由调用方连接。",
    },
    {
      en: "Link copies one by one; dst.head holds the first child and next holds the rest.",
      zh: "逐个接入复制孩子：第一个放 dst.head，其余沿 next 串联，避免只剩第一个孩子。",
    },
    {
      en: "Append child to parent's sibling chain and set its next to None.",
      zh: "把 child 追加到 parent 的同层链尾，并把 child.next 显式置为 None。",
    },
    {
      en: "A fresh node copies the tag and atom value but not head or next. Those links are rebuilt separately, which is what makes this a deep copy rather than an alias.",
      zh: "新结点复制 tag 与 atom 值，但不复制 head 或 next；这些链接另行重建，这才使它成为深复制而不是别名。",
    },
    {
      en: "An atom has no children, so the fresh node is already a complete copy of this one-node subtree.",
      zh: "原子没有孩子，因此新结点已经是这棵单结点子树的完整副本。",
    },
    {
      en: "tail starts at the new list node; the first child goes into dst.head, and later children follow tail.next. This mirrors the C pointer-to-pointer insertion without a dummy node.",
      zh: "tail 从新列表结点开始；第一个孩子放进 dst.head，后续孩子沿 tail.next 接入，用无哑结点的方式对应 C 的指向指针的尾指针。",
    },
    {
      en: "The first copied child must initialize head; only later children use next. Checking head here is what distinguishes the two cases without a dummy node.",
      zh: "第一个复制孩子必须初始化 head；只有后续孩子才用 next。这里检查 head 才能在没有哑结点时区分两种情况。",
    },
    {
      en: "Advance tail after the child is linked. Moving it first would discard the only reference to the slot where the next sibling must be attached.",
      zh: "接好孩子后再推进 tail；若先移动，就会丢掉“下一个兄弟应接在哪里”的唯一引用。",
    },
  ],
  "bfs.c": [],
  "bfs.cpp": [],
  "bfs.py": [],
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
      en: "Failure path: split allocates nothing; callers allocate `right` before any structural write, so OOM returns 0 with the old tree unchanged.",
      zh: "失败路径：split 不分配；调用方在改结构前分配 right，OOM 返回 0，旧树保持不变。",
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
    {
      en: "This is whole-ring cleanup, not a single-node delete: no predecessor relinking is needed, but every node must still be released exactly once.",
      zh: "这里做的是整环清理，不是单结点删除：无需改前驱的 next，但每个结点仍必须且只能释放一次。",
    },
    {
      en: "Both endpoints must be NULL: an empty ring has no sentinel node, and head/tail are two views of the same absence.",
      zh: "空环没有任何结点：head 与 tail 必须同时为 NULL；它们只是空表的两个入口，不是哨兵结点。",
    },
    {
      en: "For the first node, next must point to itself: this single node is immediately both head and tail, so it already closes the ring.",
      zh: "插入第一个结点时，next 必须指向自己：它同时是 head 和 tail，自环就是最小的非空循环链表。",
    },
    {
      en: "Set the new node's next to the old head before touching the old tail; the old ring stays intact until this link exists.",
      zh: "先把新结点的 next 指向原 head，再去改旧 tail；在新边建立之前，旧环仍然完整。",
    },
    {
      en: "Only now join the old tail to the new node, and only after both links exist move tail; moving tail first would lose the only handle to the old tail.",
      zh: "这时才让旧尾结点指向新结点；两条边都接好后才移动 tail。若先移动 tail，就再也找不到旧尾结点了。",
    },
    {
      en: "Check emptiness before entering the ring: a non-empty ring has no NULL node, so the first legal node must be handled separately.",
      zh: "进入环之前先判断空表：非空环里没有 NULL 结点，所以必须单独处理“还没有第一个结点”的情况。",
    },
    {
      en: "Do-while prints head first, advances, and stops only when the pointer returns to head after one full lap.",
      zh: "do-while 先打印 head 再前进，只有指针绕回 head 时才说明正好走完一圈。",
    },
    {
      en: "Stop at tail, not at NULL: a one-node ring should skip this loop, and following links until head would never terminate.",
      zh: "循环以 tail 为终点而不是等 NULL：单结点环会直接跳过循环，而沿链追到 head 则永远不会结束。",
    },
    {
      en: "Save next before free: once the node is released, reading node->next would touch invalid memory.",
      zh: "free 之前先保存 next；结点释放后再读 node->next 就是访问已失效内存。",
    },
    {
      en: "After the last free, clear both head and tail; otherwise one stale endpoint could make a freed node look like a live ring.",
      zh: "最后一个结点释放后要把 head 与 tail 一起清空；否则残留端点会让已释放结点看起来仍是一条有效环。",
    },
    {
      en: "A failed append leaves the ring unchanged; free the nodes already built before returning, so no allocation is leaked.",
      zh: "append 失败时原环不变；返回前释放已建好的结点，避免把已分配内存泄漏。",
    },
  ],
  "circular_linked_list.cpp": [
    {
      en: "The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.",
      zh: "尾节点的 `next` 指回 `head`，因此遍历要在回到 head 时停止，而不是等待 NULL。",
    },
    {
      en: "The destructor delegates to clear, so normal scope exit and explicit cleanup share the same release path; there is no separate length member to reset.",
      zh: "析构统一调用 clear，正常离开作用域与主动清理走同一条释放路径；本类没有单独的 length 字段需要复位。",
    },
    {
      en: "nothrow makes allocation failure a null pointer, allowing append to return false before the existing ring is touched.",
      zh: "nothrow 把分配失败变成空指针，因此 append 可以在改动现有环之前返回 false。",
    },
    {
      en: "For the first node, next must point to itself: this node is both head and tail and already closes the ring.",
      zh: "插入第一个结点时，next 必须指向自己：它同时是 head 和 tail，本身就已经把环闭合。",
    },
    {
      en: "Point the new node at the old head before changing the old tail; the old ring remains valid until this link exists.",
      zh: "先把新结点的 next 指向原 head，再去改旧 tail；在新边建立之前，旧环仍然有效。",
    },
    {
      en: "Join the old tail to the new node before moving tail_; moving first would lose the only pointer to the old tail.",
      zh: "先让旧 tail_ 指向新结点，再移动 tail_；顺序反过来会失去旧尾结点的唯一指针。",
    },
    {
      en: "Do-while prints head_ first, advances, and stops when the pointer returns to head_ after a complete lap.",
      zh: "do-while 先打印 head_ 再前进，指针完整绕回 head_ 时停止。",
    },
    {
      en: "Use tail_ as the exit marker: a one-node ring skips the loop, and chasing links until head_ would cycle forever.",
      zh: "用 tail_ 作为释放终点：单结点环会跳过循环，而追到 head_ 会无限绕圈。",
    },
    {
      en: "Save next before delete: deleting the node makes its own next link unreadable.",
      zh: "delete 之前先保存 next；结点删除后它自己的 next 就不能再读了。",
    },
    {
      en: "Clear both endpoints after the last delete; a stale head_ or tail_ would look like a live ring over freed nodes.",
      zh: "最后一个结点删除后清空两个端点；残留的 head_ 或 tail_ 会让已释放结点看起来仍是一条有效环。",
    },
  ],
  "circular_linked_list.py": [
    {
      en: "The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.",
      zh: "尾节点的 `next` 指回 `head`，因此遍历要在回到 head 时停止，而不是等待 NULL。",
    },
    {
      en: "Nodes point to one another, so this ring is reclaimed by Python's cyclic garbage collector after the list becomes unreachable; there is no manual free step.",
      zh: "结点之间互相引用，因此链表不可达后由 Python 的循环垃圾回收器回收，没有显式 free 步骤。",
    },
    {
      en: "An empty ring has no node: both head and tail are None; neither points at a sentinel.",
      zh: "空环没有结点：head 与 tail 都是 None，二者都不指向哨兵。",
    },
    {
      en: "Python allocation failure raises MemoryError; unlike the C/C++ demos, append has no false return value to check.",
      zh: "Python 分配失败会抛 MemoryError；与 C/C++ 示例不同，append 没有可检查的 false 返回值。",
    },
    {
      en: "The first node points to itself: it is simultaneously head and tail, so the one-node ring is already closed.",
      zh: "第一个结点指向自己：它同时是 head 和 tail，单结点环已经闭合。",
    },
    {
      en: "Link the new node to the old head before changing the old tail; the old ring stays intact until this edge exists.",
      zh: "先把新结点接到原 head，再去改旧 tail；在这条边建立前旧环仍然完整。",
    },
    {
      en: "Only now let the old tail point to the new node; then tail can move without losing the old tail.",
      zh: "这时才让旧 tail 指向新结点；随后移动 tail 不会丢失旧尾结点。",
    },
    {
      en: "Move tail last: after both links exist, the new node is the only node whose next points back to head.",
      zh: "最后才移动 tail：两条边都存在后，新结点才是唯一 next 指回 head 的结点。",
    },
    {
      en: "Handle the empty ring before the loop: None means there is no first node, not a terminator inside a live ring.",
      zh: "进入循环前先处理空环：None 表示根本没有第一个结点，而不是有效环内部的终止标记。",
    },
    {
      en: "The loop is not waiting for None: a non-empty ring has no None terminator, so it stops by comparing the advanced pointer with head.",
      zh: "这个循环不是在等 None：非空环没有 None 终止符，而是每次前进后与 head 比较。",
    },
    {
      en: "The assertion documents the link contract only; it does not create a None terminator or define the empty state.",
      zh: "断言只用于说明链接契约；它既不创建 None 终止符，也不定义空表状态。",
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
    {
      en: "disc is the DFS discovery order; low starts at disc[u], then becomes the earliest discovery time reachable from u's subtree.",
      zh: "disc 是 DFS 发现次序；low 先记为 disc[u]，随后变成 u 子树能够到达的最早发现时间。",
    },
    {
      en: "children counts DFS tree children, not all neighbours; the root's cut test uses this count.",
      zh: "children 统计 DFS 树中的孩子，而不是所有邻居；根的关节点判据用的正是这个数量。",
    },
    {
      en: "disc==0 means v is unvisited: this edge becomes a DFS tree edge, and v's subtree result will return through low[v].",
      zh: "disc==0 表示 v 尚未访问：这条边成为 DFS 树边，v 子树的结果会通过 low[v] 回传。",
    },
    {
      en: "The child subtree may reach an ancestor of u; propagate its earliest reachable time upward.",
      zh: "孩子子树可能绕过 u 到达更早的祖先；把它能到达的最早时间向上回传。",
    },
    {
      en: "For a non-root u, low[v] >= disc[u] means no back edge from v's subtree can bypass u, so removing u separates that subtree.",
      zh: "对非根 u，low[v] >= disc[u] 表示 v 子树没有任何返祖边能绕过 u；删除 u 就会把这棵子树分离出去。",
    },
    {
      en: "The strict > identifies a bridge: even v's subtree cannot reach u's discovery time, so edge u-v is the only connection.",
      zh: "严格的 > 用来识别桥：连 v 子树都无法回到 u 的发现时间，说明边 u-v 是两边唯一的连接。",
    },
    {
      en: "Skip the parent edge explicitly: it is the tree edge that discovered u, not a cycle back to an ancestor.",
      zh: "显式排除父边：它是发现 u 的那条树边，不是指回祖先的环。",
    },
    {
      en: "Use disc[v], not low[v]: the edge u-v directly touches ancestor v; low[v] may describe a larger subtree and mix in another reachability set.",
      zh: "这里应使用 disc[v] 而不是 low[v]：边 u-v 直接碰到的是祖先 v；low[v] 描述的是更大的子树，可能混入另一组可达关系。",
    },
    {
      en: "The root has no parent to bypass it, so it is a cut vertex only when two DFS children would become disconnected.",
      zh: "根没有父边可以绕过它，因此只有当至少两棵 DFS 子树会彼此断开时，根才是关节点。",
    },
    {
      en: "A disconnected graph has several DFS roots; each unvisited start opens a new tree while timer continues globally.",
      zh: "非连通图有多个 DFS 根；每个未访问起点都会开启一棵新树，而 timer 在整个森林中持续递增。",
    },
  ],
  "articulation.cpp": [
    {
      en: "The cut test is low[child] >= disc[parent]; the bridge test is strict low[child] > disc[parent].",
      zh: "关节点判据是 low[child] >= disc[parent]；桥判据是严格的 low[child] > disc[parent]。",
    },
    {
      en: "disc records DFS discovery order; low begins at disc[u] and later stores the earliest time reachable from this subtree.",
      zh: "disc 记录 DFS 发现次序；low 先等于 disc[u]，随后保存该子树能到达的最早时间。",
    },
    {
      en: "children is the number of DFS tree children; only the root uses this count, while non-root vertices use low[child] >= disc[u].",
      zh: "children 是 DFS 树孩子数；只有根使用这个计数，非根顶点使用 low[child] >= disc[u] 判据。",
    },
    {
      en: "disc[v]==0 means the edge is a tree edge to an unvisited vertex; the recursive result will be carried back by low[v].",
      zh: "disc[v]==0 表示这是一条通向未访问顶点的树边；递归结果会通过 low[v] 带回。",
    },
    {
      en: "After the child returns, propagate the earliest ancestor its subtree can reach; this is the only update from a tree edge.",
      zh: "孩子返回后，把它子树能到达的最早祖先回传；这是树边对 low 的唯一更新。",
    },
    {
      en: "For non-root u, low[v] >= disc[u] means v's subtree has no bypass around u, so u becomes a cut vertex.",
      zh: "对非根 u，low[v] >= disc[u] 说明 v 子树无法绕过 u，因此 u 成为关节点。",
    },
    {
      en: "The strict > detects a bridge: v's subtree cannot even reach u, so the tree edge u-v is its only exit.",
      zh: "严格的 > 检测桥：v 子树连 u 都到不了，因此树边 u-v 是它唯一的出口。",
    },
    {
      en: "The parent edge is the tree edge that discovered u; treating it as a back edge would give every non-root a false bypass.",
      zh: "父边是发现 u 的树边；若把它当返祖边，每个非根顶点都会多出一条假的可绕过路径。",
    },
    {
      en: "A back edge reaches an ancestor directly, so its contribution is disc[v], not low[v]; low[v] belongs to a different subtree scope.",
      zh: "返祖边直接到达祖先，所以贡献值是 disc[v] 而不是 low[v]；low[v] 属于另一层子树的范围。",
    },
    {
      en: "The root has no parent bypass; two DFS children mean removing the root separates those branches.",
      zh: "根没有父边可绕过；有两棵 DFS 子树就意味着删除根会使这些分支彼此断开。",
    },
    {
      en: "Scan every unvisited start separately: disconnected components cannot be reached from one DFS root, while timer stays global.",
      zh: "分别扫描每个未访问起点：非连通分量无法从单一 DFS 根到达，而 timer 仍保持全局递增。",
    },
  ],
  "articulation.py": [
    {
      en: "The cut test is low[child] >= disc[parent]; the bridge test is strict low[child] > disc[parent].",
      zh: "关节点判据是 low[child] >= disc[parent]；桥判据是严格的 low[child] > disc[parent]。",
    },
    {
      en: "timer has already advanced; low starts at disc[u] and later becomes the earliest discovery time reachable from this subtree.",
      zh: "timer 已经先自增；low 先等于 disc[u]，随后变成该子树能够到达的最早发现时间。",
    },
    {
      en: "children counts DFS tree children, not every entry in graph[u]; the root's condition uses this count.",
      zh: "children 统计 DFS 树孩子，而不是 graph[u] 中的每个邻居；根的判据用的是这个数量。",
    },
    {
      en: "disc==0 means v is unvisited, so this edge is a tree edge and its subtree result will flow back through low[v].",
      zh: "disc==0 表示 v 尚未访问，因此这条边是树边，它的子树结果会通过 low[v] 回传。",
    },
    {
      en: "Propagate the earliest ancestor reachable from the child's subtree; this keeps low[u] valid after the child returns.",
      zh: "把孩子子树能到达的最早祖先回传，使 child 返回后 low[u] 仍然正确。",
    },
    {
      en: "For non-root u, low[v] >= disc[u] means no back edge from v's subtree can bypass u, so removing u separates that subtree.",
      zh: "对非根 u，low[v] >= disc[u] 表示 v 子树没有返祖边能绕过 u；删除 u 就会分离这棵子树。",
    },
    {
      en: "The strict > marks a bridge: v's subtree cannot reach u's discovery time, so edge u-v is the only connection.",
      zh: "严格的 > 标记桥：v 子树无法回到 u 的发现时间，因此边 u-v 是唯一连接。",
    },
    {
      en: "Exclude the parent edge explicitly: it is the tree edge that discovered u, not a back edge to an ancestor.",
      zh: "显式排除父边：它是发现 u 的树边，不是指回祖先的返祖边。",
    },
    {
      en: "For a back edge, use the ancestor's discovery time disc[v]; low[v] describes a larger subtree and can mix another reachability set.",
      zh: "遇到返祖边应使用祖先的发现时间 disc[v]；low[v] 描述更大的子树，可能混入另一组可达关系。",
    },
    {
      en: "The root has no parent bypass, so it is a cut vertex only when at least two DFS branches would be separated.",
      zh: "根没有父边可绕过，因此只有当至少两棵 DFS 分支会被分开时，根才是关节点。",
    },
    {
      en: "Start a new DFS at every undiscovered vertex; disconnected components need separate trees, while timer remains global.",
      zh: "每个未发现顶点都要启动新的 DFS；非连通分量需要独立的树，而 timer 保持全局。",
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
  "dfs.c": [],
  "dfs.cpp": [],
  "dfs.py": [],
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
      en: "Thread targets live in separate fields, so a real left/right child is never overwritten. ltag/rtag tell traversal which pointer is meaningful.",
      zh: "线索目标放在独立字段中，真实左/右孩子永不被覆盖；ltag/rtag 告诉遍历哪个指针才是有效的。",
    },
    {
      en: "A missing real left child is exactly the slot that can store the predecessor. prev is NULL only for the first in-order node, and that NULL is itself the correct no-predecessor thread.",
      zh: "缺少真实左孩子，正好可以用这个位置保存前驱；只有中序第一个结点的 prev 为 NULL，而这个 NULL 本身就是正确的“无前驱”线索。",
    },
    {
      en: "The current node is the predecessor's successor only when the predecessor has no real right child. If it has a right child, the successor lies inside that subtree, so this thread must not be written.",
      zh: "只有前驱没有真实右孩子时，当前结点才是它的中序后继；若前驱有右子树，后继在右子树内部，不能在这里写后继线索。",
    },
    {
      en: "Advance prev only after both links are handled. The next node must see this node as its predecessor, while this node's successor may be written when the next node is visited.",
      zh: "两条线索都处理完才推进 prev；下一个结点要把当前结点当作前驱，而当前结点的后继可能在下一次访问时才写入。",
    },
    {
      en: "The in-order tail has no successor, but its right link is still a thread. Setting rtag=1 with a NULL thread records that the absence is intentional, not a forgotten real child.",
      zh: "中序尾结点没有后继，但它的右链接仍应标记为线索；用 rtag=1 和空线索记录“这里本来就是空”，而不是漏掉真实孩子。",
    },
    {
      en: "rtag==1 means right is not a real child, so right_thread is the successor. rtag==0 means descend into the real right subtree and take its leftmost node.",
      zh: "rtag==1 表示 right 不是真实孩子，应直接走 right_thread；rtag==0 表示进入真实右子树并取它的最左结点。",
    },
    {
      en: "Tags start at 0 because both child pointers begin as NULL; a thread is written only after the real child is known to be absent.",
      zh: "ltag/rtag 初始为 0，因为两个真实孩子指针此时都是 NULL；只有确认真实孩子不存在后，才会改写为线索。",
    },
    {
      en: "One prev pointer is enough: in-order recursion visits exactly one predecessor immediately before each node, so threading never needs an ancestor stack.",
      zh: "一个 prev 指针就够了：中序递归在访问每个结点前恰好访问它的前驱，因此线索化不需要祖先栈。",
    },
    {
      en: "The whole walk must finish before the tail is patched: only then is last the true in-order tail whose right thread is empty.",
      zh: "必须走完整棵树才能修补尾结点：只有这时 last 才是真正的中序尾结点，其右线索为空。",
    },
    {
      en: "ltag==0 means left is a real child; stopping at the first tag==1 node returns this subtree's first in-order node.",
      zh: "ltag==0 表示 left 是真实孩子；在第一个 tag==1 的结点停下，正好得到该子树中序第一个结点。",
    },
    {
      en: "The walk needs no recursion stack: a right thread jumps directly to the successor, otherwise the successor is the leftmost node of the real right subtree.",
      zh: "遍历不需要递归栈：右线索直接跳到后继，否则后继就是真实右子树的最左结点。",
    },
    {
      en: "Each node contributes its two tags; summing over real children counts every thread once and should equal n+1.",
      zh: "每个结点贡献两个标记；沿真实孩子求和会把每条线索恰好计一次，总数应为 n+1。",
    },
    {
      en: "Each node is freed once through the real edge that owns it; thread edges do not own their targets.",
      zh: "每个结点只通过拥有它的真实边释放一次；线索边不拥有目标结点，不能据此重复释放。",
    },
    {
      en: "The demo builds only real child edges; threading then creates non-owning aliases that traversal reads.",
      zh: "演示只建立真实孩子边；线索化随后生成不拥有结点的别名，遍历读取这些别名。",
    },
  ],
  "threaded_inorder.cpp": [
    {
      en: "unique_ptr owns only real children; thread targets are non-owning raw pointers. Keeping them separate prevents ownership cycles and accidental deletion of a threaded target.",
      zh: "unique_ptr 只拥有真实孩子，线索目标是非拥有裸指针；分开保存可避免所有权环和误删线索目标。",
    },
    {
      en: "A null real left child is the exact place to store the predecessor. prev is null only for the first in-order node, and that null is the correct end-of-thread value.",
      zh: "真实左孩子为空时，正好在这里保存前驱；只有中序首结点的 prev 为空，而这个空值就是正确的线索终点。",
    },
    {
      en: "The current node is the predecessor's successor only if the predecessor has no real right child. When a real right subtree exists, its leftmost node is the successor instead.",
      zh: "只有前驱没有真实右孩子时，当前结点才是它的后继；若存在真实右子树，后继应是该子树的最左结点。",
    },
    {
      en: "Move prev after both connections. The next visit must use this node as its predecessor, and this node's successor link may be filled when the next node is processed.",
      zh: "两条连接完成后再移动 prev；下一次访问要把当前结点当作前驱，而当前结点的后继可能在下个结点处理时才填写。",
    },
    {
      en: "The final in-order node has no successor. rtag=1 plus a null thread says the empty link is intentional, not a real child that was lost.",
      zh: "中序最后一个结点没有后继；rtag=1 加空线索表示这个空链接是刻意的，而不是丢失的真实孩子。",
    },
    {
      en: "A tagged right link already points at the successor. Otherwise right is a real child, and the successor is the leftmost node of that subtree.",
      zh: "右链接已标记为线索时，它直接指向后继；否则 right 是真实孩子，后继就是该子树的最左结点。",
    },
    {
      en: "ltag==0 proves the left link is a real child; the loop stops as soon as it meets a thread, which marks the subtree's first in-order node.",
      zh: "ltag==0 证明 left 是真实孩子；一旦遇到线索就停止，该结点正是子树中序第一个结点。",
    },
    {
      en: "prev and last are reference outputs so every recursive frame updates one shared threading state; in-order order makes prev the true predecessor.",
      zh: "prev 与 last 用引用回传，使每层递归共享同一线索化状态；中序顺序保证 prev 就是真正前驱。",
    },
    {
      en: "After the walk, last is the true in-order tail; only it still needs an explicit empty successor tag.",
      zh: "走完整棵树后，last 才是真正的中序尾结点；只有它还缺一条显式的空后继线索。",
    },
    {
      en: "Each step either follows a ready successor thread or descends to the leftmost node of a real right subtree; no call stack is involved.",
      zh: "每一步要么沿现成的后继线索前进，要么下降到真实右子树的最左结点；整个过程不使用调用栈。",
    },
    {
      en: "Tagging every null child link once gives n+1 threads for n nodes; the count is a structural self-check.",
      zh: "n 个结点的 n+1 个空孩子链接各被标记一次；这个计数是结构自检。",
    },
    {
      en: "Owning unique_ptr links build the demo tree; traversal later reads only non-owning thread fields.",
      zh: "unique_ptr 拥有真实孩子来构建演示树；遍历随后只读取不拥有结点的线索字段。",
    },
  ],
  "threaded_inorder.py": [
    {
      en: "Threads are separate from real child links. The tag, not the pointer's truthiness alone, decides whether left_thread/right_thread is valid.",
      zh: "线索与真实孩子链接分开保存；判断线索是否有效要看 tag，而不能只看指针是否为空。",
    },
    {
      en: "A missing real left child is the slot that stores the predecessor. For the first in-order node PRE is None, which is the correct no-predecessor thread.",
      zh: "真实左孩子为空时，这个位置用于保存前驱；中序首结点的 PRE 为 None，正是正确的“无前驱”线索。",
    },
    {
      en: "The current node is the predecessor's successor only when the predecessor has no real right child. If pre[0].right exists, the successor lies in that subtree.",
      zh: "只有前驱没有真实右孩子时，当前结点才是它的后继；若 pre[0].right 存在，后继在该子树内部。",
    },
    {
      en: "Advance PRE after both links. The next node must treat this node as its predecessor, while this node's own successor may be linked during the next visit.",
      zh: "两条线索处理完再推进 PRE；下一结点要把当前结点当作前驱，而当前结点的后继可能在下一次访问时才链接。",
    },
    {
      en: "The in-order tail has no successor, yet its right pointer is still a thread. Marking rtag=1 with None records an intentional empty successor.",
      zh: "中序尾结点没有后继，但其右指针仍是一条线索；用 rtag=1 和 None 记录“刻意没有后继”。",
    },
    {
      en: "A right thread is already the successor. With rtag==0, right is a real subtree, so the walk must descend to its leftmost node.",
      zh: "右线索已经直接指向后继；rtag==0 时 right 是真实子树，必须下降到它的最左结点。",
    },
    {
      en: "A node keeps real child links and thread fields separate; only the tags decide whether a thread field is valid.",
      zh: "结点把真实孩子链接与线索字段分开保存；字段是否有效只由 tag 决定。",
    },
    {
      en: "Level-order indices are only a demo construction rule; the real shape is still determined by the child links that build_tree assigns.",
      zh: "层序下标只是演示建树规则；真正的树形仍由 build_tree 赋值的真实孩子链接决定。",
    },
    {
      en: "The nested walk updates PRE exactly in in-order order, so one shared pointer is enough; last records the tail for the final empty-thread patch.",
      zh: "嵌套遍历严格按中序推进 PRE，因此一个共享指针就够；last 记录尾结点，供最后补空线索。",
    },
    {
      en: "The loop descends only while ltag==0; the first tagged link marks this subtree's first in-order node, exactly where the walk must start.",
      zh: "循环只在 ltag==0 时下降；第一条线索处就是子树中序第一个结点，也是遍历起点。",
    },
    {
      en: "Each iteration follows either a successor thread or the leftmost node of a real right subtree, so no recursion stack is needed.",
      zh: "每次迭代要么沿后继线索，要么进入真实右子树的最左结点，因此不需要递归栈。",
    },
    {
      en: "This recursive walk is an oracle: it follows real children only and never reads the threads it is checking.",
      zh: "这个递归遍历只作为对照：它只走真实孩子，完全不读取待验证的线索。",
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
      en: "The current border cannot be extended, so try the border of that border; next[border] stores that shorter length, not a character index.",
      zh: "当前 border 无法延长，就改试“这个 border 的 border”；next[border] 存的是更短的长度，而不是字符下标。",
    },
    {
      en: "After a full match, reuse the border table so overlapping occurrences are still found.",
      zh: "完整匹配后继续复用边界表，才能找出重叠出现的位置。",
    },
    {
      en: "position is the prefix length being extended; border is that prefix's longest proper border length.",
      zh: "position 是当前正在延伸的前缀长度；border 是该前缀的最长真 border 长度。",
    },
    {
      en: "-1 is a sentinel, not a real border: at the first pattern character there is no shorter prefix to fall back to.",
      zh: "next[0] = -1 是哨兵而不是真实 border：模式串首字符之前没有更短前缀可以回退。",
    },
    {
      en: "Build one table entry per prefix: position is also the next pattern character to compare against pattern[border].",
      zh: "每个前缀都要生成一个表项：position 同时就是下一个要与 pattern[border] 比较的字符位置。",
    },
    {
      en: "The border can be extended when border is -1 (start fresh) or the two next characters match; either way the new length grows by one.",
      zh: "border 为 -1（从头开始）或两个待比较字符相等时，当前 border 可以延长一位；两种情况下新长度都加一。",
    },
    {
      en: "After extension, next[position] records the border length of the prefix ending at position-1, which is exactly one-based next.",
      zh: "延长后，next[position] 记录的是以 position-1 结尾的那个前缀的 border 长度，这正是 1 基 next 的定义。",
    },
    {
      en: "This C demo defines an empty pattern as zero matches; there is no start position to return, so it does not use the usual matches-everywhere convention.",
      zh: "本 C 示例把空模式串定义为 0 次匹配；它没有起点可返回，因此不采用“在每个位置都匹配”的约定。",
    },
    {
      en: "The table needs m+1 entries: next[m] is reused after a full match to keep the longest overlap.",
      zh: "表需要 m+1 个槽：完整命中后还要使用 next[m] 来保留最长重叠。",
    },
    {
      en: "Allocation failure is an error, not a legitimate zero-match result; return -1 so callers can distinguish them.",
      zh: "分配失败是错误，不是合法的“零次匹配”；返回 -1，调用方可以据此区分两种结果。",
    },
    {
      en: "pattern_index is the length of the matched prefix, not the index of the last compared pattern character.",
      zh: "pattern_index 是已匹配前缀的长度，不是最后比较过的模式字符下标。",
    },
    {
      en: "-1 means no usable border is left; in that case advance both pointers, so the text pointer still never moves backwards.",
      zh: "-1 表示已无可用 border；此时两个指针一起前进，因此主串指针始终不会后退。",
    },
    {
      en: "A mismatch falls back to the longest border of the matched prefix; the text index stays put because that prefix is already known to match.",
      zh: "失配时回退到已匹配前缀的最长 border；主串下标保持不动，因为这段前缀已经确认匹配。",
    },
  ],
  "kmp.cpp": [
    {
      en: "lps[i] is a length, not a position: on mismatch fall back to lps[j - 1].",
      zh: "lps[i] 存的是长度而不是位置；失配时回退到 lps[j - 1]。",
    },
    {
      en: "All starts, including overlapping occurrences.",
      zh: "返回全部起点，包括重叠出现的位置。",
    },
    {
      en: "i has already moved past the match; subtract m to report its start.",
      zh: "此时 i 已越过整个匹配；减去 m 才是匹配起点。",
    },
    {
      en: "i is the prefix end being filled; j is the border length. lps[0] stays 0 because a one-character prefix has no proper border.",
      zh: "i 是正在填写的前缀末端；j 是当前 border 长度。单字符前缀没有真 border，所以 lps[0] 保持 0。",
    },
    {
      en: "Extending by one character succeeds; the new border length is the old j plus one, stored at the current prefix end.",
      zh: "延长一个字符成功，新 border 长度就是旧 j 加一，并写在这个前缀末端。",
    },
    {
      en: "j is a length, so the last matched character is at j-1; lps[j-1] is the next shorter border to try.",
      zh: "j 是长度，所以最后匹配的字符在 j-1；lps[j-1] 才是下一个可尝试的更短 border。",
    },
    {
      en: "No border can be extended and j is already zero, so this prefix has no non-empty proper border.",
      zh: "没有 border 可以延长且 j 已为 0，因此这个前缀没有非空真 border。",
    },
    {
      en: "An empty pattern has no meaningful start positions in this implementation; return no matches rather than inventing a convention.",
      zh: "本实现不为空模式串定义起点；直接返回无匹配，而不是临时发明一种约定。",
    },
    {
      en: "In the scan, i is the next text position and j is the number of pattern characters already matched.",
      zh: "扫描阶段 i 是下一个主串位置，j 是已经匹配的模式字符数。",
    },
    {
      en: "A full match ends at i-1, so i-m is its start; j then falls back to lps[m-1] to preserve the longest overlap.",
      zh: "完整匹配结束于 i-1，因此 i-m 是起点；随后 j 回退到 lps[m-1]，保留最长重叠。",
    },
    {
      en: "Only the pattern pointer rewinds here; j-1 is the last matched character and lps[j-1] is the longest border that can still extend.",
      zh: "这里只回退模式指针；j-1 是最后已匹配字符，lps[j-1] 是仍可能继续延伸的最长 border。",
    },
  ],
  "kmp.py": [
    {
      en: "lps[i] is a length, not a position: on mismatch fall back to lps[j - 1].",
      zh: "lps[i] 是长度而不是位置：失配时回退到 lps[j - 1]。",
    },
    {
      en: "i is already past the match; i - m is the start, then j falls back for overlaps.",
      zh: "i 已越过匹配；i - m 是起点，随后让 j 回退以寻找重叠匹配。",
    },
    {
      en: "i is the prefix end being filled; j is the current border length. The first character needs no proper border, so lps[0] stays 0.",
      zh: "i 是正在填写的前缀末端；j 是当前 border 长度。首字符不需要真 border，所以 lps[0] 保持 0。",
    },
    {
      en: "A successful extension raises the border length by one and records it at the current prefix end.",
      zh: "一次成功延长会把 border 长度加一，并记录在当前前缀末端。",
    },
    {
      en: "j is a length, so j-1 is the last matched character; lps[j-1] gives the next shorter border to try.",
      zh: "j 是长度，因此 j-1 是最后匹配字符；lps[j-1] 给出下一个可尝试的更短 border。",
    },
    {
      en: "build_lps accepts an empty pattern and returns []; the public search function rejects it separately because there is no match-start convention.",
      zh: "build_lps 接受空模式串并返回 []；公开搜索函数会单独拒绝它，因为没有可定义的匹配起点。",
    },
    {
      en: "This API rejects an empty pattern with ValueError; returning [] would be ambiguous with a legitimate no-match result.",
      zh: "这个 API 用 ValueError 拒绝空模式串；若返回 []，就会与合法的“没有匹配”混淆。",
    },
    {
      en: "Here i is the text position and j is the matched prefix length, not a character index into pattern.",
      zh: "这里 i 是主串位置，j 是已匹配前缀长度，而不是模式串中的字符下标。",
    },
    {
      en: "A full match ends at i-1, so i-m is the start; then j falls back to the whole pattern's border for overlaps.",
      zh: "完整匹配结束于 i-1，因此 i-m 是起点；随后 j 回退到整个模式串的 border，以寻找重叠。",
    },
    {
      en: "The text pointer stays after a hit; only j rewinds so the next search can reuse the longest suffix that is also a prefix.",
      zh: "命中后主串指针不动，只让 j 回退，使下一次搜索复用“最长的既是后缀又是前缀”的部分。",
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
      en: "`size_` is the live element count, not capacity; insert/erase shift only the live range and then update it.",
      zh: "`size_` 是有效元素数量，不是容量；插入/删除只搬移有效区间，最后再更新它。",
    },
  ],
  "seqlist.py": [
    {
      en: "`_size` is the live element count, not capacity; insert/erase shift only the live range and then update it.",
      zh: "`_size` 是有效元素数量，不是容量；插入/删除只搬移有效区间，最后再更新它。",
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
    {
      en: "Transpose swaps the shape immediately: the source column count becomes the destination row count, and vice versa. The triplet count stays the same because non-zero positions are only relabelled.",
      zh: "转置首先交换矩阵形状：源列数变成目标行数，源行数变成目标列数；非零元素个数不变，因为只是重标行列坐标。",
    },
    {
      en: "A zero-column source has no column to index; the destination already has zero triples, so success without building num/cpot is correct.",
      zh: "源矩阵没有列就没有可建索引的列；目标三元组数已经为 0，因此不建 num/cpot 而直接成功是正确的。",
    },
    {
      en: "Column 0 owns the first result slot. There is no earlier column whose entries must be reserved, so its start is exactly zero.",
      zh: "第 0 列占据结果中的第一个槽；它前面没有别的列需要预留空间，因此起始位置恰好为 0。",
    },
    {
      en: "Each column starts after all previous columns: the previous start plus the previous count is the prefix sum that gives this column its first slot.",
      zh: "每一列都排在前一列的全部元素之后：前一列起点加前一列元素数，就是确定本列首槽的前缀和。",
    },
    {
      en: "Scan the source in its existing row-major order. Within one source column, entries appear in increasing source row, which becomes increasing destination column; direct placement therefore produces row-major output.",
      zh: "按源三元组原有的行优先顺序扫描；同一源列内条目按源行递增，转置后正好变成目标列递增，因此直接回填就得到行优先结果。",
    },
    {
      en: "q is this column's next free slot, not a global write counter. Every column has its own moving cursor, so columns can be filled independently.",
      zh: "q 是本列的下一个空闲槽，而不是全局写指针；每列都有独立移动的游标，因此各列可以分别回填。",
    },
    {
      en: "Advance the cursor after the write. The current triple occupies q; the next triple from the same column must go to q+1, otherwise entries would overwrite each other.",
      zh: "写入后再推进游标：当前三元组占据 q，同列下一条必须写到 q+1，否则会互相覆盖。",
    },
  ],
  "sparse_transpose.cpp": [
    {
      en: "`cpot[col]` is the next write position for that column; writing a triple increments it for the next entry.",
      zh: "`cpot[col]` 是该列下一个写入位置；每写入一个三元组就递增，供同列下一条使用。",
    },
    {
      en: "The transpose swaps dimensions before any data movement: source columns become result rows and source rows become result columns. Only coordinates change, not the number of non-zero values.",
      zh: "转置在搬数据前先交换维度：源列成为结果行，源行成为结果列；改变的只是坐标，不是非零值个数。",
    },
    {
      en: "With no source columns there is no column start to compute; the resized result already has the correct row count and zero triples.",
      zh: "源矩阵没有列就无需计算列起点；已调整大小的结果已有正确行数和 0 个三元组。",
    },
    {
      en: "Column 0 starts at result slot 0 because no earlier column has entries to reserve before it.",
      zh: "第 0 列从结果槽 0 开始，因为前面没有任何列需要先占位置。",
    },
    {
      en: "The loop builds a prefix sum: column c starts after the start plus the size of column c-1, so all earlier columns remain contiguous and untouched.",
      zh: "循环构造前缀和：第 c 列排在“前一列起点 + 前一列大小”之后，从而让所有更早的列保持连续且不被覆盖。",
    },
    {
      en: "The source is scanned in its stored row-major order. Within one source column, source rows increase, and after the coordinate swap those become increasing result columns, so each column's block is filled in order.",
      zh: "按源三元组保存的行优先顺序扫描；同一源列内源行递增，交换坐标后就是目标列递增，因此每列区块按序填满。",
    },
    {
      en: "q is the next free slot of this specific column, not a global counter; cpot is a per-column moving write cursor.",
      zh: "q 是当前这一列的下一个空闲槽，而不是全局计数器；cpot 是每列独立的移动写游标。",
    },
    {
      en: "Increment only after writing. The current item owns q, and the next item from this column must use q+1 or it would overwrite the just-written triple.",
      zh: "写完后才自增；当前条目占用 q，同列下一条必须使用 q+1，否则会覆盖刚写入的三元组。",
    },
  ],
  "sparse_transpose.py": [
    {
      en: "`cpot[col]` is the next write position for that column; writing a triple increments it for the next entry.",
      zh: "`cpot[col]` 是该列下一个写入位置；每写入一个三元组就递增，供同列下一条使用。",
    },
    {
      en: "Preallocate one destination slot per source triple. Placement writes by random index through cpot, so the list must already have all slots; each slot is then overwritten exactly once.",
      zh: "按源三元组数量预先分配目标槽；回填时通过 cpot 随机下标写入，因此列表必须先有全部槽位，之后每个槽恰好被覆盖一次。",
    },
    {
      en: "Column 0 begins at result index 0 because no earlier column has entries to place before it.",
      zh: "第 0 列从结果下标 0 开始，因为前面没有更早的列需要先放元素。",
    },
    {
      en: "Each cpot entry is a prefix sum: column c starts after the previous column's start and all of its entries, keeping column blocks contiguous.",
      zh: "每个 cpot 项都是前缀和：第 c 列排在前一列起点及其全部条目之后，使各列区块保持连续。",
    },
    {
      en: "The source list is already strictly row-major. Scanning it in that order preserves the within-column source-row order, which becomes destination-column order after the swap.",
      zh: "源列表已严格按行优先排列；按此顺序扫描会保留列内源行次序，交换坐标后正好成为目标列次序。",
    },
    {
      en: "q is the next free position for this source column, not a single global write index. Each column consumes its own cpot slot independently.",
      zh: "q 是当前源列的下一个空闲位置，而不是单一全局写下标；每列独立消费自己的 cpot 槽。",
    },
    {
      en: "Move this column's cursor forward only after filling q. The next entry from the same column must land at q+1, so writing and advancing cannot be swapped.",
      zh: "填好 q 后才推进本列游标；同列下一条必须落在 q+1，因此写入与推进的顺序不能交换。",
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
    {
      en: "cur is an array index, and kNull=-1 is deliberately outside 0..kCapacity-1. That makes a real first cell (index 0) different from the end marker.",
      zh: "cur 是数组下标，kNull=−1 被刻意放在 0..kCapacity−1 之外；这样真实的 0 号槽不会和结束标记混淆。",
    },
    {
      en: "The live prefix occupies cells 0..count-1. Linking it in array order is correct only for this initial state; later inserts may make logical order differ from physical order.",
      zh: "有效前缀占据 0..count−1；按数组顺序串起来只保证初始状态，后续插入会让逻辑顺序与物理顺序分离。",
    },
    {
      en: "The free suffix starts immediately after the live prefix. If the array is full, a null head makes the next insert fail before any cell is touched.",
      zh: "空闲后缀紧接在有效前缀之后；数组已满时把空闲头置空，下一次插入会在改动任何槽之前失败。",
    },
    {
      en: "`fresh` keeps the cell that is about to leave the free chain. It must be saved before `freeHead_` moves, because after that move the old head index is no longer stored anywhere.",
      zh: "`fresh` 保存即将离开空闲链的槽；必须在 `freeHead_` 移动前保存，否则旧头下标就再也找不到了。",
    },
    {
      en: "The free chain uses the same cur field as the live chain. Advancing freeHead_ to the borrowed cell's successor is the actual removal from the free list.",
      zh: "空闲链和数据链共用 cur 字段；把 freeHead_ 推进到被借槽的后继，才是真正从空闲链中摘除该槽。",
    },
    {
      en: "Link the fresh cell to its successor before changing `head_` or the predecessor's cur. The reverse order would overwrite the only pointer to the remaining tail.",
      zh: "先让新槽指向后继，再改 `head_` 或前驱的 cur；顺序反过来会覆盖指向剩余尾部的唯一指针。",
    },
    {
      en: "A null predecessor means insertion at the front, so only this branch rewrites `head_`; a middle or tail insert rewrites exactly one predecessor's cur.",
      zh: "前驱为空表示插在表头，只有这个分支改写 `head_`；中间或尾部插入只改一个前驱的 cur。",
    },
    {
      en: "Recycle only after the live chain is unlinked. Pushing target to the front of the free chain reuses the cell without disturbing any live sibling.",
      zh: "先完成数据链解链，再回收目标槽；把它压到空闲链头即可复用该槽，且不影响任何有效兄弟结点。",
    },
    {
      en: "There is no `length_` field: this O(n) walk from `head_` is the authoritative size and always agrees with the actual cur chain after inserts and deletes.",
      zh: "类中没有 `length_` 字段：这次从 `head_` 出发的 O(n) 遍历才是权威长度，插入删除后也始终与真实 cur 链一致。",
    },
  ],
  "static_linked_list.c": [
    {
      en: "Keep the successor first, then redirect the predecessor.",
      zh: "先让新结点接住后继，再改前驱。",
    },
    {
      en: "cur is an array index, not a machine address: the array fixes every node's physical location, so changing a logical successor only rewrites this index and never moves data.",
      zh: "cur 保存的是数组下标而不是机器地址：结点的物理位置由数组固定，改变逻辑后继只需改写这个下标，不必搬动数据。",
    },
    {
      en: "The initializer clamps the active prefix to CAPACITY before linking anything; a longer input must not make the live chain or the free suffix leave the array.",
      zh: "初始化在串链之前就把有效前缀截断到 CAPACITY；输入再长也不能让数据链或空闲链越过数组边界。",
    },
    {
      en: "The length is not cached. Walking cur from head is the authoritative count, so this function cannot disagree with the actual live chain.",
      zh: "这里不缓存长度；从 head 沿 cur 计数才是权威结果，因此函数不会与真实数据链不一致。",
    },
    {
      en: "For a 1-based position p, starting at head already accounts for the first node; the loop performs p-2 hops and stops on the node immediately before p.",
      zh: "对 1 基位置 p，从 head 出发已经算过第一个结点；循环只走 p−2 步，正好停在第 p 个结点的前驱上。",
    },
    {
      en: "free_head is the only proof that a cell is available. The data chain must never be scanned as an allocation source, because live nodes are not free slots.",
      zh: "free_head 是“还有空槽”的唯一凭据；不能把数据链当作分配来源扫描，因为有效结点并不是空闲槽。",
    },
    {
      en: "Read the borrowed cell's free successor before overwriting its cur: this assignment is what actually removes new_index from the free chain and keeps the rest reachable.",
      zh: "在覆盖被借结点的 cur 之前先读出它的空闲后继；正是这次赋值把 new_index 从空闲链摘下，同时保住其余空闲槽。",
    },
    {
      en: "The new cell must point at the old successor before head or the predecessor is changed. Redirecting the predecessor first would erase the only link to the tail.",
      zh: "必须先让新结点接住原后继，再改 head 或前驱；若先改前驱，指向尾部的唯一链接就会被覆盖。",
    },
    {
      en: "NULL_INDEX doubles as the predecessor sentinel for position 1. This branch is the only case where the head itself, rather than a cur field, must be rewritten.",
      zh: "NULL_INDEX 同时充当位置 1 的前驱哨兵；只有这个分支需要改 head 本身，其他插入都只改某个 cur。",
    },
    {
      en: "Unlink the live chain first, then push target onto the free head. The order keeps a deleted cell from still being reachable as a live node while it joins the free list.",
      zh: "必须先把目标结点从数据链解下，再把它压入空闲链头；否则同一结点会同时被数据链和空闲链引用。",
    },
  ],
  "static_linked_list.py": [
    {
      en: "Follow cur from head; array order is not logical order.",
      zh: "从 head 沿 cur 前进；数组顺序不是逻辑顺序。",
    },
    {
      en: "`None` is the null cursor, never index 0. Every live cursor is an integer in 0..capacity-1, so a physical slot and a logical position stay independent.",
      zh: "`None` 是空游标，绝不是 0 号下标；有效游标都是 0..capacity−1 的整数，因此物理槽位与逻辑位置相互独立。",
    },
    {
      en: "Clamp the initial sequence before any linking, so both the live prefix and the free suffix stay inside the fixed `data` and `cur` arrays.",
      zh: "先截断初始序列再串链，确保有效前缀和空闲后缀都落在固定的 `data`、`cur` 数组内。",
    },
    {
      en: "The free chain begins at the first unused slot. `None` is the explicit empty state, not a slot that can be borrowed.",
      zh: "空闲链从第一个未用槽开始；`None` 是显式空状态，表示没有任何槽可借。",
    },
    {
      en: "Read the next free index before writing `cur[fresh]`; this assignment removes `fresh` from the free chain while preserving the rest of the free suffix.",
      zh: "在写 `cur[fresh]` 前先读出下一个空闲下标；这次赋值把 `fresh` 从空闲链摘下，同时保住其余空闲后缀。",
    },
    {
      en: "`previous is None` is the head sentinel for position 1. Otherwise the successor is the predecessor's current cur, captured before any rewiring.",
      zh: "`previous is None` 表示位置 1 的头部哨兵；否则后继就是前驱当前的 cur，并且必须在改链前捕获。",
    },
    {
      en: "Connect the borrowed slot to its successor before changing `head` or the predecessor. Reversing the order cuts off every node after the insertion point.",
      zh: "先让借来的槽接住后继，再改 `head` 或前驱；顺序反过来会切断插入点之后的整条链。",
    },
    {
      en: "Recycle after unlinking: target becomes the new free head, and its old free successor remains reachable through the new `cur[target]`.",
      zh: "解链后再回收：target 成为新的空闲链头，而原来的空闲后继通过新的 `cur[target]` 仍然可达。",
    },
    {
      en: "Advance by cur, not by the loop index. After inserts and deletes the physical array order is deliberately unrelated to logical order.",
      zh: "前进靠 cur 而不是循环下标；插入删除后，数组物理顺序本来就与逻辑顺序无关。",
    },
  ],
  "polynomial_add.c": [
    {
      en: "Equal exponents add; a zero sum creates no result node.",
      zh: "指数相等时系数相加；和为 0 不创建结果结点。",
    },
    {
      en: "The exponent is the ordering key. A descending chain lets the merge choose the next output term from only the two heads, without random access or a coefficient array.",
      zh: "指数是排序键；按指数降序的链使合并只需比较两个头结点就能决定下一项，无需随机访问或系数数组。",
    },
    {
      en: "The first term must set `head`; later terms only follow `tail->next`. Maintaining tail is what makes every append O(1) instead of rescanning the result.",
      zh: "第一项必须设置 `head`；后续项只沿 `tail->next` 接入。维护尾指针使每次追加都是 O(1)，不必重扫结果链。",
    },
    {
      en: "The loop continues while either input has terms. The two-input branch compares exponents; the leftover branches copy an unopposed tail without another comparison.",
      zh: "只要任一输入还有项循环就继续；双输入分支比较指数，剩余分支直接复制没有对手的尾部，无需再比较。",
    },
    {
      en: "Compute the sum before moving either cursor. The zero test then decides whether a result node exists; cursor advance is separate from node creation.",
      zh: "先算出系数和，再移动任一游标；零值判断只决定是否建结果结点，与游标前进是两件事。",
    },
    {
      en: "Equal exponents are the only merge case. A zero sum creates no node, but both cursors still advance because both input terms have been consumed.",
      zh: "只有指数相等才合并；系数和为 0 时不建结点，但两个游标仍要前进，因为两项输入都已被消费。",
    },
    {
      en: "A has the larger exponent, so its term is next in descending output. B must wait; emitting B first would break the required exponent order.",
      zh: "A 的指数更大，所以它的项应先在降序结果中输出；B 必须等待，先输出 B 会破坏要求的指数顺序。",
    },
    {
      en: "Once B is exhausted, every remaining A term is already in descending order. Copying them one by one preserves that order and handles unequal lengths.",
      zh: "B 用尽后，A 的剩余项本身已经降序；逐项复制即可保持顺序，也正确处理了两条链长度不等的情况。",
    },
  ],
  "polynomial_add.py": [
    {
      en: "Two cursors advance once each; a zero coefficient sum creates no node.",
      zh: "两个指针各前进一次；系数和为 0 不建结点。",
    },
    {
      en: "The node constructor rejects zero coefficients and negative exponents immediately, so every chain built from these nodes already satisfies the sparse-term invariant.",
      zh: "结点构造器立即拒绝零系数和负指数，因此由这些结点组成的链天然满足稀疏项不变量。",
    },
    {
      en: "The previous exponent must be strictly larger. Equal exponents would be duplicate terms, while an increasing exponent would make the merge order impossible.",
      zh: "前一个指数必须严格更大；相等会产生重复项，递增则会使合并所依赖的顺序不成立。",
    },
    {
      en: "The tail is a real node reference. Link through it before moving tail, so append stays O(1) without a separate length field.",
      zh: "尾指针是真实结点引用；先通过它接链再移动尾指针，追加就能保持 O(1)，无需额外长度字段。",
    },
    {
      en: "The result is built until both input cursors are exhausted. The leftover branch is required for unequal lengths, not an optional optimization.",
      zh: "结果要一直构建到两个输入游标都耗尽；剩余分支用于处理长度不等，并不是可选优化。",
    },
    {
      en: "Only equal exponents combine. A zero total is omitted, but both cursors advance because both input terms have already been consumed.",
      zh: "只有指数相等才合并；总和为 0 时省略该项，但两个游标仍要前进，因为两项输入都已被消费。",
    },
    {
      en: "The larger exponent must appear first in the descending result. The other cursor remains so its term can compete with the next left term.",
      zh: "更大的指数必须先在降序结果中出现；另一个游标保持不动，让它的项与下一个左项继续竞争。",
    },
    {
      en: "Once right is exhausted, the rest of left is already in descending order; appending each node preserves the invariant instead of re-sorting.",
      zh: "右链用尽后，左链剩余部分已经降序；逐结点追加即可保持不变量，无需重新排序。",
    },
  ],
  "polynomial_add.cpp": [
    {
      en: "A zero coefficient sum must create no node: 0x^k is not a sparse term.",
      zh: "系数相加为 0 时不能建结点：0x^k 不是稀疏多项式的有效项。",
    },
    {
      en: "The exponent orders the sparse terms. Descending order lets the merge pick the next result from the two heads only, so no random access to a coefficient array is needed.",
      zh: "指数为稀疏项排序；降序使合并只从两个头结点取下一项，无需随机访问系数数组。",
    },
    {
      en: "`unique_ptr` owns each node, while `tail_` is a non-owning cursor. Updating `tail_` after linking keeps appends O(1) and avoids a second owning pointer.",
      zh: "`unique_ptr` 拥有每个结点，`tail_` 只是非拥有游标；接好链后再更新 `tail_`，使追加保持 O(1) 且不产生第二个拥有者。",
    },
    {
      en: "An empty polynomial has no tail yet. The first node must set both `head_` and `tail_`; later nodes only follow `tail_->next`.",
      zh: "空多项式还没有尾结点；第一个结点必须同时设置 `head_` 与 `tail_`，后续结点只沿 `tail_->next` 接入。",
    },
    {
      en: "Either non-empty chain keeps the merge alive. Each iteration consumes exactly one cursor, or both when exponents are equal, so neither chain is skipped.",
      zh: "任一链非空合并就继续；每轮恰好消费一个游标，指数相等时消费两个，因此不会跳过任何一条链。",
    },
    {
      en: "Equal exponents are the only case that combines coefficients. A zero sum skips node creation, but both cursors still advance because both terms are consumed.",
      zh: "只有指数相等才合并系数；零和不建结点，但两个游标仍要前进，因为两项都已被消费。",
    },
    {
      en: "Left has the larger exponent and must be emitted first in descending order. Right stays put so it can be compared with the next left term.",
      zh: "左链指数更大，必须在降序结果中先输出；右游标保持不动，以便与下一个左项继续比较。",
    },
    {
      en: "When right is exhausted, the remaining left terms are already ordered. Copying them directly finishes the merge without inventing extra comparisons.",
      zh: "右链用尽后，左链剩余项本身有序；直接复制即可完成合并，不需要额外比较。",
    },
  ],
  "infix_to_postfix.c": [
    {
      en: "a left parenthesis blocks every pop until it is explicitly removed.",
      zh: "左括号是弹栈边界：在它被显式弹出前，不能越过它弹出其他运算符。",
    },
    {
      en: "Operators wait in this stack until their right context is known; operands never enter the stack because their final output position is already fixed.",
      zh: "运算符在栈中等待右侧上下文确定；操作数从不入栈，因为它在输出中的最终位置已经确定。",
    },
    {
      en: "Read the whole digit run before emitting it. Splitting 12 into 1 and 2 would change the value and make later postfix evaluation wrong.",
      zh: "输出前要先读完整的连续数字；把 12 拆成 1 和 2 会改变数值，使后续后缀求值出错。",
    },
    {
      en: "A right parenthesis closes one group: emit operators until the matching left parenthesis, then discard the parenthesis itself.",
      zh: "右括号结束一个分组：先弹出并输出运算符直到匹配的左括号，再丢弃这对括号本身。",
    },
    {
      en: "An empty stack before the matching left parenthesis means this right parenthesis is unmatched; return false instead of reading below the array.",
      zh: "在找到匹配左括号前栈已空，说明这个右括号没有配对；应返回 false，不能继续读取数组下界之外。",
    },
    {
      en: "Push the incoming operator only after the while has emitted every greater-or-equal top; pushing first would reverse its operands.",
      zh: "只有 while 已输出所有优先级不低于自己的栈顶后才压入新运算符；先压栈会颠倒操作数顺序。",
    },
    {
      en: "After the scan no later token can decide the remaining order; flush the stack so lower-priority operators still reach the output.",
      zh: "扫描结束后不会再有 token 决定剩余顺序；必须清空栈，让低优先级运算符也进入输出。",
    },
    {
      en: "A remaining left parenthesis means its right partner never appeared; report failure rather than printing a parenthesis as an operator.",
      zh: "栈中残留左括号说明它没有右括号配对；应报告失败，不能把括号当运算符输出。",
    },
  ],
  "infix_to_postfix.cpp": [
    {
      en: "a left parenthesis blocks every pop until it is explicitly removed.",
      zh: "左括号是弹栈边界：在它被显式弹出前，不能越过它弹出其他运算符。",
    },
    {
      en: "The vector is an operator stack: operators are delayed until their right context is known, while operands can be emitted immediately.",
      zh: "这个 vector 是运算符栈：运算符要等右侧上下文确定后才输出，而操作数可以立即写出。",
    },
    {
      en: "Consume the entire digit run before appending the token. The token boundary is not known until a non-digit appears.",
      zh: "追加 token 前要消费整段连续数字；在看到非数字字符之前，token 的边界并未确定。",
    },
    {
      en: "A right parenthesis pops and emits operators back to its matching left parenthesis, then removes the left parenthesis without emitting it.",
      zh: "右括号会不断弹出并输出运算符直到匹配左括号，然后删除左括号但不输出它。",
    },
    {
      en: "An empty stack here means there is no matching left parenthesis; never call back() on an empty vector.",
      zh: "此处栈空说明没有匹配的左括号；绝不能对空 vector 调用 back()。",
    },
    {
      en: "Push the current operator only after the while has emitted every top with greater-or-equal precedence; this is the left-associative ordering.",
      zh: "只有 while 已输出所有优先级不低于当前运算符的栈顶后才压入；这正是左结合要求的顺序。",
    },
    {
      en: "The scan has no more input to resolve the remaining operators; flush them now so the output contains every operator exactly once.",
      zh: "输入已经扫描完，没有 token 再决定剩余运算符的顺序；现在清栈，确保每个运算符恰好输出一次。",
    },
    {
      en: "A left parenthesis left at the end never found its right partner; return nullopt instead of treating it as an operator.",
      zh: "扫描结束时仍留在栈中的左括号没有右括号配对；应返回 nullopt，不能把它当运算符。",
    },
  ],
  "infix_to_postfix.py": [
    {
      en: "a left parenthesis blocks every pop until it is explicitly removed.",
      zh: "左括号是弹栈边界：在它被显式弹出前，不能越过它弹出其他运算符。",
    },
    {
      en: "Tokenization happens before conversion so the converter sees whole numbers and explicit parentheses, not individual characters.",
      zh: "先分词再转换，使转换器看到完整数字和显式括号，而不是单个字符。",
    },
    {
      en: "This list is the operator stack. Operands go straight to output; only operators whose output order is still unsettled wait here.",
      zh: "这个列表是运算符栈；操作数直接进入输出，只有输出顺序尚未确定的运算符才在此等待。",
    },
    {
      en: "A right parenthesis drains operators to its matching left parenthesis and discards both parentheses; an empty stack means it is unmatched.",
      zh: "右括号把运算符弹到匹配左括号并丢弃这对括号；若栈为空则说明右括号没有配对。",
    },
    {
      en: "The left-parenthesis test short-circuits the precedence test; `>=` is required for left associativity, so 8-3-2 emits the first minus first.",
      zh: "左括号判断会短路优先级判断；`>=` 是左结合所必需的，因此 8−3−2 会先输出第一个减号。",
    },
    {
      en: "No token remains to settle the stack order. Pop everything, but treat a leftover left parenthesis as an unmatched-parenthesis error.",
      zh: "已无 token 能决定栈中顺序；应全部弹出，但残留左括号要作为括号不匹配错误处理。",
    },
    {
      en: "Only digits, the four binary operators and parentheses are accepted. A unary minus, exponentiation or variable is rejected instead of assigned a guessed precedence.",
      zh: "这里只接受数字、四个二元运算符和括号；一元负号、幂运算或变量会直接报错，而不是猜测优先级。",
    },
  ],
  "postfix_eval.c": [
    {
      en: "the first pop is the right operand; compute left op right.",
      zh: "第一次弹出的是右操作数，必须按“左操作数 运算符 右操作数”的顺序计算。",
    },
    {
      en: "The stack holds values already computed from the processed prefix. A binary operator consumes two values and returns one, so its height never exceeds the token count.",
      zh: "栈保存已处理前缀算出的值；每个二元运算符消费两个值并产出一个，因此栈高不会超过 token 数。",
    },
    {
      en: "Only an all-digit token is a number. A leading minus is not accepted here, so negative literals must be produced by subtraction rather than written directly.",
      zh: "只有全数字 token 才算操作数；这里不接受前导负号，因此负数应由减法产生，而不是直接写成字面量。",
    },
    {
      en: "The token has already passed the digit check; atoi converts the same text to an integer and pushes it as one complete operand.",
      zh: "token 已通过全数字检查；atoi 把同一段文本转成整数并作为一个完整操作数压栈。",
    },
    {
      en: "top is an index, so top < 1 means fewer than two operands. Check before popping; otherwise the second read would use a negative index.",
      zh: "top 是下标，top < 1 表示不足两个操作数；必须在弹栈前检查，否则第二次读取会访问负下标。",
    },
    {
      en: "Check the divisor before dividing. Returning false with an error message leaves the caller's output value untouched.",
      zh: "除法前先检查除数；返回 false 并写入错误信息，同时不改动调用方的结果值。",
    },
    {
      en: "The two popped operands are replaced by one result. Each binary operator therefore reduces stack height by exactly one.",
      zh: "弹出的两个操作数被一个结果替代；因此每个二元运算符都让栈高恰好减少一。",
    },
    {
      en: "A valid postfix expression leaves exactly one value. top < 0 means missing operands; top > 0 means extra operands were never consumed.",
      zh: "合法后缀表达式最后恰好剩一个值；top < 0 表示操作数不足，top > 0 表示还有多余操作数未被消费。",
    },
    {
      en: "C integer division truncates toward zero, matching the Python trace's int(left / right).",
      zh: "C 整数除法向零截断，与 Python Trace 中的 int(left / right) 一致。",
    },
  ],
  "postfix_eval.cpp": [
    {
      en: "the first pop is the right operand; compute left op right.",
      zh: "第一次弹出的是右操作数，必须按“左操作数 运算符 右操作数”的顺序计算。",
    },
    {
      en: "This stack stores computed values, not tokens. Every operator pops two values and pushes one, so the stack is the only state the scan needs.",
      zh: "这个栈保存已计算的值而不是 token；每个运算符弹出两个、压回一个，因此扫描只需维护这一个状态。",
    },
    {
      en: "The all-digit predicate rejects signs and mixed tokens such as 12a before stoi is called; only a genuine operand is pushed.",
      zh: "全数字判断会在调用 stoi 前拒绝符号和 12a 这类混合 token；只有真正的操作数才会入栈。",
    },
    {
      en: "Two operands are required before an operator can run. Checking size avoids back() on an empty vector.",
      zh: "运算符执行前必须有两个操作数；先检查 size，避免对空 vector 调用 back()。",
    },
    {
      en: "Division by zero is detected before the division expression runs; return an EvalError rather than relying on undefined behavior.",
      zh: "除零在真正执行除法前就被发现；应返回 EvalError，而不是依赖未定义行为。",
    },
    {
      en: "The result replaces the two consumed operands, so each binary operator reduces the stack by exactly one element.",
      zh: "结果替代两个已消费的操作数，因此每个二元运算符都让栈恰好减少一个元素。",
    },
    {
      en: "An empty final stack means the expression had too few operands; this is a syntax error, not a zero result.",
      zh: "最终栈为空说明表达式操作数不足；这是语法错误，不是结果 0。",
    },
    {
      en: "More than one final value means operands were left unconsumed; returning the top value silently would hide the malformed input.",
      zh: "最终多于一个值说明还有操作数未被消费；若静默返回栈顶，就会掩盖非法输入。",
    },
  ],
  "postfix_eval.py": [
    {
      en: "the first pop is the right operand; compute left op right.",
      zh: "第一次弹出的是右操作数，必须按“左操作数 运算符 右操作数”的顺序计算。",
    },
    {
      en: "The list is an operand stack, not a call stack. Its only job is to hold values whose operator has not appeared yet.",
      zh: "这个列表是操作数栈而不是调用栈；它只保存尚未遇到运算符的值。",
    },
    {
      en: "Only a whole digit token is pushed. The evaluator does not accept a leading minus or a decimal point, so negative values must come from subtraction.",
      zh: "只有完整数字 token 才入栈；求值器不接受前导负号或小数点，因此负数必须由减法产生。",
    },
    {
      en: "A binary operator needs two operands. Check length before pop so an empty or one-item stack raises PostfixError instead of IndexError.",
      zh: "二元运算符需要两个操作数；先检查长度，使空栈或单元素栈抛出 PostfixError 而不是 IndexError。",
    },
    {
      en: "Reject a zero divisor before computing. The operands have already been popped, but the local stack is discarded on error, so no partial result escapes.",
      zh: "计算前先拒绝零除数；此时操作数已弹出，但出错会丢弃局部栈，因此不会有部分结果泄漏。",
    },
    {
      en: "No remaining value means operands were missing; the input never formed one complete expression.",
      zh: "最终没有值说明操作数不足；输入从未形成一条完整表达式。",
    },
    {
      en: "Extra values mean the input left operands unused. Raising is safer than returning the top and hiding the malformed expression.",
      zh: "剩余多个值说明输入有操作数未被使用；抛错比返回栈顶、掩盖非法表达式更安全。",
    },
    {
      en: "Python's // floors negative results; C truncates toward zero.",
      zh: "Python 的 // 对负数向下取整，而 C 向零截断。",
    },
  ],
  "free_list.c": [
    {
      en: "Free-space list: First Fit / Best Fit over one simulated address range.",
      zh: "空闲空间分配：在一条模拟地址空间上演示首次适应与最佳适应。",
    },
    {
      en: "A descriptor owns the half-open range [start, start + size); the byte at start + size belongs to the next block.",
      zh: "块描述符拥有半开区间 [start, start + size)；start + size 处的字节属于下一个块。",
    },
    {
      en: "This is a block-table simulation, not a real allocator: head/tail tags are teaching fields, not hardware boundary tags.",
      zh: "这是块描述符表的模拟，不是真实分配器；head/tail 标记是教学字段，不等同于硬件边界标识。",
    },
    {
      en: "Descriptors stay in increasing address order so adjacent blocks can be recognized by index, not by searching addresses.",
      zh: "所有块描述符按地址递增排列，因此相邻关系可以直接用下标判断，不必再搜索地址。",
    },
    {
      en: "start and size describe [start, start + size): size is a length, not an inclusive end address.",
      zh: "start 与 size 描述区间 [start, start + size)：size 是长度，不是包含末字节的结束地址。",
    },
    {
      en: "free=1 means the block is reusable; label names an allocated request and is empty for free blocks.",
      zh: "free=1 表示块可复用；label 记录已分配的请求名，空闲块保持空字符串。",
    },
    {
      en: "head_size/tail_size and head_free/tail_free duplicate the block size/state for teaching boundary tags; they are not independent truth.",
      zh: "head_size/tail_size 与 head_free/tail_free 只是为演示边界标识而复制块的大小和状态，不是四份互相独立的事实。",
    },
    {
      en: "blocks[] plus count form an address-ordered descriptor table; count is the number of valid records, not the memory capacity.",
      zh: "blocks[] 与 count 组成按地址排序的块描述符表；count 是有效记录数，不是内存容量。",
    },
    {
      en: "capacity is the original simulated size; it also supplies a sentinel larger than any possible best-fit remainder.",
      zh: "capacity 是模拟内存的原始大小，同时为最佳适应提供一个大于任何可能剩余量的哨兵。",
    },
    {
      en: "policy is a list-level switch: 0 selects First Fit, 1 selects Best Fit; it is read anew on every allocation.",
      zh: "policy 是整张块表的策略开关：0 为首次适应，1 为最佳适应，每次分配都会重新读取。",
    },
    {
      en: "sync_tags is the only routine that writes the simulated head/tail tags; every size or state change must call it.",
      zh: "sync_tags 是唯一写入模拟首尾标记的函数；任何大小或占用状态变化后都必须调用它。",
    },
    {
      en: "Initial state is exactly one free descriptor [0, total); later allocations split this single hole.",
      zh: "初始状态只有一个空闲块 [0, total)；后续分配都从这个唯一的洞中切分。",
    },
    {
      en: "count becomes 1 only after start, size, free and tags are complete, so the first scan always sees a valid record.",
      zh: "只有 start、size、free 和首尾标记都写好后才把 count 设为 1，确保第一次扫描看到的是完整记录。",
    },
    {
      en: "Inserting a split remainder must preserve address order, so every descriptor at and after index moves one slot right.",
      zh: "插入分裂出的剩余块必须保持地址顺序，因此从 index 开始的所有描述符都要右移一位。",
    },
    {
      en: "MAX_BLOCKS bounds this teaching table; insert_block returns 0 without moving records when the table is full.",
      zh: "MAX_BLOCKS 限制这张教学块表的大小；表满时 insert_block 返回 0，不移动任何描述符。",
    },
    {
      en: "The copy loop runs backwards from count to index; a forward loop would overwrite a record before it is moved.",
      zh: "复制循环从 count 倒退到 index；如果正向复制，会先把尚未搬走的记录覆盖掉。",
    },
    {
      en: "count increases last, after the new record and its tags are complete; no later loop can observe a half-written slot.",
      zh: "等新记录和首尾标记都完整后，最后才增加 count；这样后续循环不会看到写了一半的槽。",
    },
    {
      en: "Removing a descriptor closes the gap by moving every later record one slot left; this edits the simulation table only.",
      zh: "删除描述符时把后面的记录逐个左移来填洞；这里只修改模拟块表，不释放真实进程内存。",
    },
    {
      en: "count decreases after the shift, so the stale last slot is never visited again.",
      zh: "搬移完成后才减少 count，因此末尾的旧槽不会再被访问。",
    },
    {
      en: "First Fit can stop at the first adequate block; Best Fit cannot, because a later block may leave a smaller remainder.",
      zh: "首次适应一旦遇到第一个足够大的块就可以停止；最佳适应不能停，因为后面的块可能留下更小的剩余空间。",
    },
    {
      en: "chosen=-1 means \"no candidate\"; best_remainder starts at capacity+1 so any real remainder beats that sentinel.",
      zh: "chosen=-1 表示“尚无候选”；best_remainder 从 capacity+1 开始，任何真实剩余量都小于这个哨兵。",
    },
    {
      en: "A used block cannot be allocated, and a block smaller than request cannot be split into a non-negative remainder.",
      zh: "已占用块不能分配；小于申请量的块也无法切出非负的剩余空间。",
    },
    {
      en: "remainder is the free tail after a split; an exact fit leaves remainder 0 and needs no new descriptor.",
      zh: "remainder 是切分后留下的空闲尾部；正好等大时剩余为 0，不需要新建描述符。",
    },
    {
      en: "First Fit selects the first adequate block in address order and breaks immediately.",
      zh: "首次适应按地址顺序选择第一个足够大的块，并立即结束扫描。",
    },
    {
      en: "Best Fit must inspect every candidate; \"<\" keeps the earlier address when two blocks leave the same remainder.",
      zh: "最佳适应必须检查所有候选；剩余量相同时用 \"<\" 保留地址更靠前的块。",
    },
    {
      en: "No chosen block means the request cannot fit in any single free interval; return 0 leaves the table unchanged.",
      zh: "没有选出块，说明请求无法放入任何单个空闲区间；返回 0 且块表保持不变。",
    },
    {
      en: "Only a strictly larger block is split; the free suffix starts exactly at the old start plus the allocated prefix.",
      zh: "只有严格大于申请量的块才分裂；空闲后缀正好从原起点加上已分配前缀的长度处开始。",
    },
    {
      en: "remainder_start is old start + request; it marks the first byte that the allocated prefix does not own.",
      zh: "remainder_start 等于原起点加申请量，标记已分配前缀不再拥有的第一个字节。",
    },
    {
      en: "remainder_size is old size minus request, so [start, start+request) and the suffix are adjacent and never overlap.",
      zh: "remainder_size 是原大小减去申请量，因此 [start, start+request) 与后缀相邻且不会重叠。",
    },
    {
      en: "Insert the suffix before shrinking the chosen block: the split uses the old size, and chosen keeps its index.",
      zh: "先插入后缀、再缩小选中块：分裂读取的是原大小，而选中块的下标不会改变。",
    },
    {
      en: "Shrink the prefix only after the suffix exists, so the table always covers the original interval.",
      zh: "等后缀记录存在后才缩小前缀，保证块表始终覆盖原来的完整区间。",
    },
    {
      en: "After the split, mark the prefix used and attach the request label; then sync tags so the footer describes the final state.",
      zh: "分裂完成后把前缀标记为已占用并写入请求名，再同步首尾标记，使块尾描述最终状态。",
    },
    {
      en: "Merge the current block into its left neighbour; both records are adjacent and free.",
      zh: "把当前块合并进左邻块；两条记录必须相邻且都空闲。",
    },
    {
      en: "The union starts at the left neighbour's address because the released block lies immediately after it.",
      zh: "联合块从左邻块的地址开始，因为被释放块紧跟在左邻块之后。",
    },
    {
      en: "The merged size is the sum of two adjacent lengths; no address gap exists between them.",
      zh: "合并后的大小是两个相邻块长度之和；两块之间没有地址空隙。",
    },
    {
      en: "Assign the union to the left slot and delete the current record, keeping one descriptor for the continuous range.",
      zh: "把合并结果写回左槽并删除当前记录，连续区间只保留一个描述符。",
    },
    {
      en: "Merge the current block with its right neighbour; both records are adjacent and free.",
      zh: "把当前块与右邻块合并；两条记录必须相邻且都空闲。",
    },
    {
      en: "The union keeps the current start because the right neighbour begins exactly at current start + current size.",
      zh: "联合块保留当前起点，因为右邻块正好从“当前起点 + 当前大小”处开始。",
    },
    {
      en: "The merged size adds the right length; deleting the right record leaves a single descriptor for the union.",
      zh: "合并后的大小加上右邻块长度；删除右邻记录后，联合区间只剩一个描述符。",
    },
    {
      en: "Release accepts only an allocated record with the exact ID; free blocks and unknown IDs are not valid releases.",
      zh: "释放只接受“已占用且 ID 完全匹配”的记录；空闲块或未知 ID 都不是合法释放。",
    },
    {
      en: "If neither neighbour is free, the released descriptor stays as an independent hole.",
      zh: "如果左右都不空闲，被释放的记录就保留为独立的洞。",
    },
    {
      en: "Mark the block free and clear its label before neighbour checks, so the search sees the released interval as a hole.",
      zh: "先标记为空闲并清空 label，再检查邻块，这样邻块判断看到的就是一个洞。",
    },
    {
      en: "left_free and right_free snapshot physical adjacency; only an actually adjacent free block may be merged.",
      zh: "left_free 与 right_free 记录真实相邻关系；只有确实相邻的空闲块才允许合并。",
    },
    {
      en: "A left merge absorbs the released record into the previous descriptor and removes one record.",
      zh: "向左合并会把被释放记录吸收进前一个描述符，并删除一条记录。",
    },
    {
      en: "After a left merge the unified block sits at index-1, so index must decrease before checking the right side.",
      zh: "左合并后联合块位于 index-1，因此必须先执行 index -= 1，才能继续检查右侧。",
    },
    {
      en: "right_free was captured before the left merge; after index-- it still names the block immediately right of the union.",
      zh: "right_free 在左合并前就已记录；index 减一后，它仍然指向联合块右边紧邻的块。",
    },
    {
      en: "print_blocks walks the address order and prints [start, end), making gaps or overlaps visible.",
      zh: "print_blocks 按地址顺序打印 [start, end)，便于直接看出空隙或重叠。",
    },
    {
      en: "A-E allocate adjacent blocks from low addresses, so the only untouched space is the trailing free suffix.",
      zh: "A-E 从低地址开始连续分配，因此尚未使用的空间只剩下末尾的空闲区。",
    },
    {
      en: "The demonstration assumes enough capacity and a correct fixed operation sequence; it is not a general input parser.",
      zh: "该演示假定容量足够且固定操作序列成立；它不是通用输入解析器。",
    },
    {
      en: "Releasing B and D creates two isolated holes; F can reuse the earlier hole under First Fit.",
      zh: "释放 B、D 产生两个互不相邻的洞；首次适应会让 F 复用靠前的那个洞。",
    },
    {
      en: "F is allocated after the two releases, so it demonstrates reuse of a hole rather than growth of the tail.",
      zh: "F 在两次释放之后分配，用来演示复用空洞，而不是继续从尾部扩展。",
    },
    {
      en: "Releasing C joins both neighbours, then releasing F joins the remaining right hole; this demonstrates two-sided coalescing.",
      zh: "释放 C 会同时合并左右邻块，随后释放 F 再合并右侧的洞；这里演示了两侧合并。",
    },
    {
      en: "G=40 is deliberately larger than every remaining contiguous hole, so the final call must fail without changing the table.",
      zh: "G=40 故意大于所有剩余连续空闲区，因此最后一次申请必须失败且不改变块表。",
    },
  ],
  "free_list.cpp": [
    {
      en: "Free-space list: First Fit / Best Fit over one simulated address range.",
      zh: "空闲空间分配：在一条模拟地址空间上演示首次适应与最佳适应。",
    },
    {
      en: "A descriptor owns half-open [start, start + size); this program models block records, not raw pointer memory.",
      zh: "块描述符拥有半开区间 [start, start + size)；本程序模拟块记录，而不是直接操作原始指针内存。",
    },
    {
      en: "The vector stays in address order, so adjacency is decided by neighbouring indices.",
      zh: "vector 始终按地址递增排列，因此相邻关系由相邻下标决定。",
    },
    {
      en: "head/tail tags are teaching copies of size and occupancy, not independent allocator metadata.",
      zh: "head/tail 标记只是大小与占用状态的教学副本，不是独立的分配器元数据。",
    },
    {
      en: "start and size define [start, start + size); size is a length, not an inclusive address.",
      zh: "start 与 size 定义 [start, start + size)；size 是长度，不是包含末字节的地址。",
    },
    {
      en: "free and label are canonical occupancy state; the four tag fields only mirror them.",
      zh: "free 与 label 是规范的占用状态；四个首尾标记字段只是它们的镜像。",
    },
    {
      en: "sync_tags must run after every size or state change, or the printed footer becomes stale.",
      zh: "任何大小或占用状态变化后都必须运行 sync_tags，否则打印出的块尾信息就会过期。",
    },
    {
      en: "FreeList owns a vector of Block records; no manual new/delete is involved, and vector growth moves elements but not logical addresses.",
      zh: "FreeList 持有一个 Block 记录的 vector；没有手动 new/delete，vector 扩容只移动元素，不改变逻辑地址。",
    },
    {
      en: "The constructor creates one free block [0,total); capacity_ is kept as a sentinel bound and as the original memory size.",
      zh: "构造函数创建唯一的空闲块 [0,total)；capacity_ 既作为哨兵上界，也记录原始内存大小。",
    },
    {
      en: "The scan follows vector order, which is address order; First Fit can return at the first adequate block.",
      zh: "扫描顺序就是 vector 的地址顺序；首次适应遇到第一个足够大的块就可以返回。",
    },
    {
      en: "block is a reference, not a copy; it must not survive vector::insert/erase, so later code re-indexes blocks_[chosen].",
      zh: "block 是引用而不是副本；它不能跨越 vector::insert/erase，因此后续代码重新用 blocks_[chosen] 访问。",
    },
    {
      en: "chosen<0 and capacity_+1 encode \"no candidate\"; any real remainder is smaller than the sentinel.",
      zh: "chosen<0 与 capacity_+1 表示“尚无候选”；任何真实剩余量都小于这个哨兵。",
    },
    {
      en: "Used blocks and blocks too small for the request cannot produce a valid free prefix.",
      zh: "已占用块和小于申请量的块都无法切出合法的空闲前缀。",
    },
    {
      en: "First Fit breaks immediately; Best Fit continues to compare remainders and uses < so ties keep the earlier block.",
      zh: "首次适应立即结束扫描；最佳适应继续比较剩余量，并用 < 在剩余量相同时保留靠前的块。",
    },
    {
      en: "If no candidate exists, return false and leave blocks_ unchanged; the request has no single contiguous hole.",
      zh: "没有候选时返回 false 且 blocks_ 保持不变；请求找不到任何单个连续空洞。",
    },
    {
      en: "A block larger than the request is split; exact fit skips the split and simply changes occupancy.",
      zh: "只有大于申请量的块才分裂；正好等大时跳过分裂，只改变占用状态。",
    },
    {
      en: "The suffix starts at start+request and has size oldSize-request, so prefix and suffix are adjacent and disjoint.",
      zh: "后缀从 start+request 开始、大小为 oldSize-request，因此前缀与后缀相邻且不相交。",
    },
    {
      en: "vector::insert shifts later records right; after it returns, refer to blocks_[chosen], not the old reference.",
      zh: "vector::insert 会把后面的记录右移；返回后必须重新用 blocks_[chosen] 访问，不能继续使用旧引用。",
    },
    {
      en: "Shrink the chosen prefix after insertion; its start is unchanged and the new suffix remains at chosen+1.",
      zh: "插入完成后才缩小选中前缀；它的起点不变，新后缀仍在 chosen+1 位置。",
    },
    {
      en: "Set occupancy and label before sync_tags, then let the footer copy the finished state.",
      zh: "先设置占用状态和 label，再调用 sync_tags，让块尾复制最终状态。",
    },
    {
      en: "Only an allocated block with the exact label can be released; missing or already-free IDs return false.",
      zh: "只有“已占用且 label 完全匹配”的块才能释放；不存在或已空闲的 ID 返回 false。",
    },
    {
      en: "If neither side is free, the released record remains an independent hole.",
      zh: "如果左右都不空闲，被释放的记录就保留为独立的洞。",
    },
    {
      en: "Mark free and clear the label before neighbour checks, so the released interval is visible as a hole.",
      zh: "先标记为空闲并清空 label，再检查邻块，这样被释放区间在判断时就是一个洞。",
    },
    {
      en: "left_free and right_free snapshot adjacency before any erase; vector::erase shifts indices but preserves address order.",
      zh: "left_free 与 right_free 在任何 erase 之前记录相邻关系；vector::erase 只移动下标，不破坏地址顺序。",
    },
    {
      en: "A left merge uses the left neighbour's start and the sum of both sizes, then erases the released record.",
      zh: "向左合并使用左邻块的起点和两块大小之和，然后删除被释放记录。",
    },
    {
      en: "The merged range starts at the left neighbour because the released block is immediately to its right.",
      zh: "合并区间从左邻块开始，因为被释放块正好位于它的右边。",
    },
    {
      en: "index -= 1 is required because erase removed the old current element; the merged block now sits one slot left.",
      zh: "必须执行 index -= 1，因为 erase 删除了原来的当前元素，合并块现在位于左边一格。",
    },
    {
      en: "right_free was captured before the left erase; after index-- it still names the block immediately right of the merged range.",
      zh: "right_free 在左删除前就已记录；index 减一后，它仍指向合并区间右边紧邻的块。",
    },
    {
      en: "The second merge keeps the current start; the right neighbour begins at current start + current size.",
      zh: "第二次合并保留当前起点；右邻块正好从“当前起点 + 当前大小”处开始。",
    },
    {
      en: "policy_ is a list-level switch read by the next allocate; it does not change existing blocks.",
      zh: "policy_ 是整张表级开关，只影响下一次 allocate，不会改变已有块。",
    },
    {
      en: "policy_ stores the policy for this list: false is First Fit, true is Best Fit.",
      zh: "policy_ 保存当前列表的策略：false 为首次适应，true 为最佳适应。",
    },
    {
      en: "print() only reads the vector, so address order and tag consistency can be inspected without mutation.",
      zh: "print() 只读取 vector，因此可以在不修改状态的情况下检查地址顺序和首尾标记一致性。",
    },
    {
      en: "A-E allocate adjacent prefixes, leaving one trailing free interval.",
      zh: "A-E 连续分配相邻前缀，最后只剩一个末尾空闲区。",
    },
    {
      en: "The demonstration assumes a fixed sequence and enough capacity; it is not a general input parser.",
      zh: "该演示假定固定操作序列和容量足够；它不是通用输入解析器。",
    },
    {
      en: "Releasing B and D produces two isolated holes; F reuses the earlier hole under First Fit.",
      zh: "释放 B、D 产生两个互不相邻的洞；首次适应会让 F 复用靠前的洞。",
    },
    {
      en: "F is allocated after the releases, so it demonstrates hole reuse rather than tail growth.",
      zh: "F 在释放之后分配，用来演示复用空洞而不是继续扩展尾部。",
    },
    {
      en: "Releasing C joins both sides, then releasing F joins the right hole; this exercises two-sided coalescing.",
      zh: "释放 C 会合并左右两侧，随后释放 F 再合并右侧的洞；这里练习了两侧合并。",
    },
    {
      en: "G=40 exceeds every remaining contiguous hole, so allocate must return false and leave the table unchanged.",
      zh: "G=40 大于所有剩余连续空洞，因此 allocate 必须返回 false 且不改变块表。",
    },
  ],
  "free_list.py": [
    {
      en: "Free-space list: First Fit / Best Fit over one simulated address range.",
      zh: "空闲空间分配：在一条模拟地址空间上演示首次适应与最佳适应。",
    },
    {
      en: "A block owns half-open [start, start + size); size is a length, not an inclusive end address.",
      zh: "块拥有半开区间 [start, start + size)；size 是长度，不是包含末字节的结束地址。",
    },
    {
      en: "blocks is an address-ordered list of Block objects; adjacency is determined by list indices.",
      zh: "blocks 是按地址排序的 Block 对象列表；相邻关系由列表下标决定。",
    },
    {
      en: "free and label are canonical; head/tail tags are teaching copies of size and occupancy.",
      zh: "free 与 label 是规范状态；head/tail 标记只是大小和占用状态的教学副本。",
    },
    {
      en: "The constructor stores start, size, free and label, then immediately syncs the simulated boundary tags.",
      zh: "构造函数保存 start、size、free 和 label，然后立即同步模拟首尾标记。",
    },
    {
      en: "sync_tags must follow every size or occupancy change; otherwise the footer describes an old interval.",
      zh: "任何大小或占用状态变化后都必须调用 sync_tags，否则块尾描述的仍是旧区间。",
    },
    {
      en: "The list starts with one free block [0, capacity); every later allocation splits an existing hole.",
      zh: "列表初始只有唯一的空闲块 [0, capacity)；之后每次分配都从已有洞中切分。",
    },
    {
      en: "capacity records the original simulated size; allocation still uses the current Block.size values.",
      zh: "capacity 记录模拟内存的原始大小；实际分配仍以当前 Block.size 为准。",
    },
    {
      en: "best_fit is a per-call policy switch; it does not mutate the list, so later calls may choose differently.",
      zh: "best_fit 是每次调用独立的策略开关；它不修改列表，后续调用可以改用另一种策略。",
    },
    {
      en: "The scan follows list order, which is address order; First Fit may stop at the first adequate block.",
      zh: "扫描顺序就是列表的地址顺序；首次适应遇到第一个足够大的块就可以停止。",
    },
    {
      en: "None is the sentinel for \"no candidate\"; best_remainder stays None until the first adequate block.",
      zh: "None 表示“尚无候选”；在遇到第一个足够大的块之前，best_remainder 保持 None。",
    },
    {
      en: "Used blocks and blocks smaller than request cannot yield a non-negative free remainder.",
      zh: "已占用块和小于申请量的块都无法产生非负的空闲剩余量。",
    },
    {
      en: "First Fit breaks immediately; Best Fit keeps the smallest remainder and uses < so ties keep the earlier address.",
      zh: "首次适应立即结束扫描；最佳适应保留最小剩余量，并用 < 在剩余量相同时保留靠前的地址。",
    },
    {
      en: "If chosen is None, return False and leave the list unchanged; no single hole can hold the request.",
      zh: "chosen 为 None 时返回 False 且列表保持不变；没有任何单个洞能容纳该请求。",
    },
    {
      en: "A block larger than the request is split; exact fit skips the split and just changes occupancy.",
      zh: "只有大于申请量的块才分裂；正好等大时跳过分裂，只改变占用状态。",
    },
    {
      en: "The suffix begins at old start+request and has size oldSize-request, so the ranges are adjacent and disjoint.",
      zh: "后缀从原 start+request 开始、大小为 oldSize-request，因此两段区间相邻且不相交。",
    },
    {
      en: "Insert the suffix before shrinking block: Block(...) reads the old size, and block is an object reference that survives list insertion.",
      zh: "先插入后缀、再缩小 block：Block(...) 读取的是旧大小，而 block 是对象引用，不会因列表插入而失效。",
    },
    {
      en: "After insertion, block still names the chosen object; set occupancy and label before sync_tags so the footer copies the final state.",
      zh: "插入后 block 仍指向被选中的对象；先设置占用状态和 label，再调用 sync_tags，让块尾复制最终状态。",
    },
    {
      en: "Only an allocated block with the exact ID can be released; unknown or already-free IDs return False.",
      zh: "只有“已占用且 ID 完全匹配”的块才能释放；未知或已空闲的 ID 返回 False。",
    },
    {
      en: "If neither side is free, the released record remains an independent hole.",
      zh: "如果左右都不空闲，被释放记录就保留为独立的洞。",
    },
    {
      en: "Mark free and clear the label before neighbour checks, so the released interval is visible as a hole.",
      zh: "先标记为空闲并清空 label，再检查邻块，这样被释放区间在判断时就是一个洞。",
    },
    {
      en: "left_free and right_free snapshot adjacency before any deletion; only true neighbours may be merged.",
      zh: "left_free 与 right_free 在任何删除之前记录相邻关系；只有真正相邻的块才允许合并。",
    },
    {
      en: "A left merge uses the left block's start and the sum of both sizes, then deletes the released record at index.",
      zh: "向左合并使用左块的起点和两块大小之和，然后删除 index 处的被释放记录。",
    },
    {
      en: "The merged object starts at left.start and spans both adjacent lengths.",
      zh: "合并对象从 left.start 开始，跨越两个相邻块的长度。",
    },
    {
      en: "index -= 1 is required because the deletion shifted the merged block one slot left.",
      zh: "必须执行 index -= 1，因为删除操作把合并块整体左移了一格。",
    },
    {
      en: "right_free records the pre-deletion neighbour snapshot; the second branch below rechecks the shifted neighbour instead of trusting this old boolean.",
      zh: "right_free 记录删除前的邻居快照；下面的第二个分支会重新检查移动后的邻居，而不是直接相信这个旧布尔值。",
    },
    {
      en: "After a left deletion, index -= 1 makes index+1 the original right neighbour; the condition must be evaluated anew because the list shifted.",
      zh: "左删除后 index -= 1，使 index+1 重新指向原来的右邻块；由于列表已经移动，条件必须重新求值。",
    },
    {
      en: "The second merge keeps the current start and adds the right length, covering the adjacent range.",
      zh: "第二次合并保留当前起点并加上右块长度，覆盖整个相邻区间。",
    },
    {
      en: "print_blocks walks the list in address order; visible [start,end) ranges should tile the capacity without gaps.",
      zh: "print_blocks 按地址顺序遍历列表；可见的 [start,end) 区间应当无缝铺满容量。",
    },
    {
      en: "The asserts assume the fixed demonstration sequence succeeds; under -O they disappear, so this is a teaching harness, not a runtime guarantee.",
      zh: "这些 assert 假定固定演示序列成功；在 -O 下会被移除，因此它只是教学演示，不是运行时保证。",
    },
    {
      en: "A-E place adjacent allocations, leaving one trailing free interval.",
      zh: "A-E 连续放置相邻分配，最后只剩一个末尾空闲区。",
    },
    {
      en: "Releasing B and D creates two isolated holes; F reuses the earlier hole under the default First Fit.",
      zh: "释放 B、D 产生两个互不相邻的洞；默认首次适应会让 F 复用靠前的洞。",
    },
    {
      en: "F is allocated after the releases, demonstrating hole reuse rather than tail growth.",
      zh: "F 在释放之后分配，用来演示复用空洞而不是扩展尾部。",
    },
    {
      en: "Releasing C and F exercises two-sided coalescing; G=40 exceeds every remaining hole and must fail.",
      zh: "释放 C 和 F 练习两侧合并；G=40 大于所有剩余空洞，必须失败。",
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
  "garbage_collection.c": [],
  "garbage_collection.cpp": [],
  "garbage_collection.py": [],
  "block_search.c": [
    {
      en: "Before any entry exists, reject a size that cannot partition the array; otherwise the ceiling division and later maximum lookup have no defined block boundary.",
      zh: "在建立任何索引项之前先拒绝无法切分数组的块大小；否则向上取整与后续最大值查询都没有明确的块边界。",
    },
    {
      en: "Index and block comparisons are counted separately because they measure two different searches; merging them would hide which stage dominates.",
      zh: "索引比较与块内比较分开计数，因为它们度量两种不同搜索；合并会掩盖哪一阶段占主导。",
    },
    {
      en: "Ceiling division counts the final short block. Floor division would omit it whenever count is not a multiple of block_size.",
      zh: "向上取整会计入最后一个短块；若用向下取整，count 不是 block_size 整数倍时就会漏掉该块。",
    },
    {
      en: "The index is valid only if maxima strictly increase and every value in this block exceeds the previous maximum. Otherwise a later block could contain a value smaller than an earlier block's max, so max-based selection would be unsafe.",
      zh: "只有块最大值严格递增且本块所有值都大于前一块最大值时索引才有效；否则后块可能含更小值，按最大值选块就不安全。",
    },
    {
      en: "The first block whose maximum reaches target is the only possible block: earlier maxima are too small, and later blocks all start above this maximum.",
      zh: "第一个最大值达到 target 的块就是唯一候选：更早的块最大值太小，而更晚的块所有值都大于这个最大值。",
    },
    {
      en: "No maximum reaches target means target is larger than every value in the array; return -1 before scanning any block.",
      zh: "没有任何块最大值达到 target，说明目标大于数组中所有值；应在扫描任何块之前返回 −1。",
    },
    {
      en: "Inside a block the values are not promised sorted, so only a linear equality scan is valid. A binary search here would assume an ordering the index never guarantees.",
      zh: "块内并未保证有序，因此只能线性扫描判等；在这里用二分会假设一种索引从未承诺过的顺序。",
    },
    {
      en: "The sample deliberately keeps the data unsorted: the index contract concerns block ranges and maxima, not reordering the array.",
      zh: "示例刻意保持数据原序：索引契约针对块的区间与最大值，并不要求重排数组。",
    },
  ],
  "block_search.cpp": [
    {
      en: "Before creating entries, reject a block size that cannot partition the vector; otherwise the loop has no well-defined block boundaries.",
      zh: "建立索引项前先拒绝无法切分 vector 的块大小；否则循环没有明确的块边界。",
    },
    {
      en: "The two comparison counters stay separate because index probing and block scanning are different searches; a merged count would hide the cost split.",
      zh: "两个比较计数器保持分离，因为索引探测与块内扫描是不同搜索；合并计数会掩盖成本构成。",
    },
    {
      en: "Ceiling division includes the tail block even when its length is smaller than blockSize; truncating division would silently lose that suffix.",
      zh: "向上取整把长度不足 blockSize 的尾块也计入；截断除法会悄悄丢掉这段后缀。",
    },
    {
      en: "Later blocks must have strictly larger maxima and every element above the previous maximum. Without both checks, selecting by max could enter a block that does not contain the target.",
      zh: "后续块必须最大值严格更大且每个元素都大于前一块最大值；缺少任一检查，按最大值选块都可能进入不含目标的块。",
    },
    {
      en: "Earlier blocks have smaller maxima, so this first satisfying block is the only one that can contain target; all later blocks lie strictly above the previous maximum.",
      zh: "更早块的最大值更小，因此第一个满足条件的块才是唯一可能包含 target 的块；后续块都严格高于前一最大值。",
    },
    {
      en: "If no maximum reaches target, target exceeds every record. Return -1 before doing any block scan.",
      zh: "若没有任何最大值达到 target，目标就大于所有记录；应在扫描块之前返回 −1。",
    },
    {
      en: "The block is scanned linearly because its internal order is not part of the index contract. Only equality can guide this stage; binary search would require sorted data.",
      zh: "块内顺序不属于索引契约，因此只能线性扫描；本阶段只能用相等判断，二分则需要数据有序。",
    },
    {
      en: "The demo keeps the original order: block search indexes range maxima and must not silently sort the data.",
      zh: "演示保持原始顺序：分块查找为块最大值建索引，不能悄悄排序数据。",
    },
  ],
  "block_search.py": [
    {
      en: "Reject an unusable block size before building entries; otherwise slicing and max() would describe a partition the index cannot guarantee.",
      zh: "建立索引项前先拒绝不可用的块大小；否则切片与 max() 描述的划分并非索引能够保证。",
    },
    {
      en: "Index probing and block scanning are separate stages; the returned counts keep their costs visible instead of collapsing them.",
      zh: "索引探测与块内扫描是两个阶段；返回的计数让两部分成本保持可见而不是被合并。",
    },
    {
      en: "Ceiling division allocates an index entry for the final short block; floor division would omit the tail whenever the length is not an exact multiple.",
      zh: "向上取整会为最后一个短块建立索引项；长度不是整数倍时，向下取整会漏掉尾部。",
    },
    {
      en: "Slice only the current block; the last chunk may be shorter than block_size, and max(chunk) must use its real length rather than a fixed width.",
      zh: "只切出当前块；最后一块可能短于 block_size，max(chunk) 必须使用真实长度而不是固定宽度。",
    },
    {
      en: "The index contract requires both strictly increasing maxima and every value above the previous maximum. Checking only the maximum would miss a small value hidden in a later block.",
      zh: "索引契约要求最大值严格递增，且每个值都高于前一块最大值；只检查最大值会漏掉后块中隐藏的小值。",
    },
    {
      en: "The first block whose maximum is at least target is the only possible block: earlier maxima are too small, and later blocks all start above this maximum.",
      zh: "第一个最大值不小于 target 的块就是唯一候选：更早的最大值太小，而后块所有值都高于这个最大值。",
    },
    {
      en: "No maximum reaches target means the value exceeds every record; return -1 without scanning a block.",
      zh: "没有任何最大值达到 target，说明目标大于所有记录；不再扫描块，直接返回 −1。",
    },
    {
      en: "The selected block is scanned linearly because the index never promises sorted values inside a block. Only equality is a valid test here.",
      zh: "被选块只能线性扫描，因为索引从未承诺块内有序；这里只能做相等判断。",
    },
  ],
  "bplus_tree.c": [
    {
      en: "Purpose: Split a leaf 2/2, preserve the leaf chain, and promote the first key of the new right leaf.",
      zh: "作用：把叶节点按 2/2 分裂，保持叶链，并提升新右叶的首键。",
    },
    {
      en: "Failure path: new_node failures are reported as valid=-1 before any key or link changes; callers release preallocated nodes and return -1 to insert_key.",
      zh: "失败路径：new_node 失败在改动任何键或链接前返回 valid=-1；调用方释放预分配节点并把 -1 传回 insert_key。",
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
    {
      en: "Dividing by the current place value removes lower digits; %10 keeps this pass's digit. Missing higher positions naturally yield 0.",
      zh: "先除以当前位权去掉更低的数位，再对 10 取余得到本趟数位；不存在的高位自然得到 0。",
    },
    {
      en: "Start with one pass so the value 0 still gets a units pass; divide the maximum until it is below 10 to count decimal positions.",
      zh: "至少保留一趟，使 0 也能处理个位；用最大值反复除以 10 直到小于 10，从而数出十进制位数。",
    },
    {
      en: "Before pass p, order is stable for digits below p; this pass adds digit p as the next key without discarding that lower-digit order.",
      zh: "第 p 趟开始前，order 已按低于 p 的数位稳定有序；本趟只是把第 p 位作为新的比较键，同时保留低位次序。",
    },
    {
      en: "Reset counts every pass; stale bucket cells beyond counts are never read, so they need no clearing.",
      zh: "每趟都要清零 counts；桶中超过 counts 的旧槽不会再被读取，因此不需要整体清空桶。",
    },
    {
      en: "Walk the current stable order, not the raw input: earlier passes determine the order in which records enter each bucket.",
      zh: "按当前稳定序列扫描，而不是按原始输入：前几趟的结果决定记录进入各桶的先后。",
    },
    {
      en: "Write at each bucket's tail. Collecting from slot 0 upward then makes the bucket FIFO, which is the stability requirement.",
      zh: "把记录写到桶尾；收集时从 0 号槽向上读，桶就保持 FIFO，这正是稳定性的要求。",
    },
    {
      en: "Collect buckets 0..9 in ascending digit order; this digit is now the primary key, while each bucket's FIFO retains lower-digit order.",
      zh: "按 0..9 升序收集桶；当前数位成为主键，而桶内 FIFO 次序保留低位数已排好的顺序。",
    },
    {
      en: "Replace order only after the whole new sequence is built; mixing reads and writes in one array would corrupt unread records.",
      zh: "等整条新序列收集完才替换 order；若在同一个数组里边读边写，会覆盖尚未读取的记录。",
    },
    {
      en: "After the most significant pass, every decimal digit has been applied from least to most significant; stability carried lower-digit order forward, so order is fully sorted.",
      zh: "最高位处理完后，所有十进制位都按从低到高参与过排序；稳定性把低位次序一路带过来，因此 order 已经整体有序。",
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
    {
      en: "The place value selects one decimal digit; a shorter number has implicit leading zeros, so division naturally yields 0 beyond its top digit.",
      zh: "位权选出当前十进制数位；较短整数相当于高位补零，超过最高位后除法自然得到 0。",
    },
    {
      en: "At least one pass handles zero; repeatedly dividing the maximum by ten counts how many decimal positions exist.",
      zh: "至少一趟处理 0；把最大值不断除以 10，就能数出共有多少个十进制位。",
    },
    {
      en: "At the start of pass p, order is already stable for all lower digits; this pass adds digit p as the next key.",
      zh: "第 p 趟开始时，order 已按所有更低数位稳定有序；本趟再把第 p 位作为新的键。",
    },
    {
      en: "Distribute the current stable sequence, not raw input: the order from previous passes decides insertion order inside each bucket.",
      zh: "分配的是当前稳定序列而不是原始输入：前几趟得到的顺序决定记录在桶内的插入次序。",
    },
    {
      en: "push_back appends at the bucket tail; when buckets are collected front-to-back, this preserves FIFO order.",
      zh: "push_back 把记录追加到桶尾；按从前到后收集时，FIFO 次序因此得以保持。",
    },
    {
      en: "Append buckets 0..9 in order; the current digit is now the primary key, while the bucket sequence retains lower digits.",
      zh: "按 0..9 顺序追加桶内容；当前数位成为主键，而桶内序列保留低位结果。",
    },
    {
      en: "Swap only after nextOrder is complete; the old order then becomes the discarded buffer for the next pass.",
      zh: "等 nextOrder 完整后才交换；旧 order 随即成为下一趟可丢弃的缓冲。",
    },
    {
      en: "Once the highest digit has been processed, all digits have acted from least to most significant; stability preserved lower digits, so order is fully sorted.",
      zh: "最高位处理完后，所有数位都已从低到高参与排序；稳定性保留了低位数结果，因此 order 已整体有序。",
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
    {
      en: "Integer division removes lower digits and %10 selects this pass's digit; a short number behaves as if its missing high digits were zero.",
      zh: "整除去掉低位，再对 10 取余得到本趟数位；较短整数相当于缺失的高位都是 0。",
    },
    {
      en: "One pass is always needed for the units digit; dividing the maximum until it is below ten counts the remaining decimal positions.",
      zh: "个位至少需要一趟；把最大值除到小于 10，就数出了剩余十进制位。",
    },
    {
      en: "Before pass p, order is stable for digits below p; this pass adds digit p without discarding the lower-digit ordering.",
      zh: "第 p 趟前，order 已按低于 p 的数位稳定有序；本趟加入第 p 位，同时不丢弃低位次序。",
    },
    {
      en: "Scan the current stable order, not the original input: previous passes define the order in which records enter buckets.",
      zh: "扫描当前稳定序列而不是原始输入：前几趟决定记录进入桶的先后。",
    },
    {
      en: "append puts the record at the bucket tail; reading each bucket from the front then gives FIFO collection and stability.",
      zh: "append 把记录放在桶尾；从桶头读取就得到 FIFO 收集顺序和稳定性。",
    },
    {
      en: "Rebuild order by buckets 0..9: the current digit is the primary key, while each bucket keeps the lower-digit order.",
      zh: "按 0..9 重建 order：当前数位成为主键，而每个桶内部保留低位数结果。",
    },
    {
      en: "After the highest digit, every position has been applied; stable passes preserve lower digits, so the returned order is fully sorted.",
      zh: "处理完最高位后，每个数位都已参与排序；稳定各趟保留了低位结果，因此返回的序列已经整体有序。",
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
    {
      en: "The workspace holds only resident candidates; current is a separate run buffer, so a run may grow beyond the workspace capacity.",
      zh: "工作区只保存驻留候选记录；current 是独立的归并段缓冲，因此一段可以长于工作区容量。",
    },
    {
      en: "hasLastOutput separates no-output-yet from a real threshold of 0; without it, key 0 would be mistaken for a previous output.",
      zh: "hasLastOutput 用来区分“尚未输出”和真实阈值 0；否则关键字 0 会被误当成上一次输出。",
    },
    {
      en: "The winner is the smallest eligible key; choosing it next is what keeps the current run nondecreasing.",
      zh: "winner 是当前最小的可输出键；下一次输出它，当前段才能保持非降序。",
    },
    {
      en: "Append the winner to the run buffer before replacing it; the record leaves the workspace, so this output can be longer than M.",
      zh: "先把 winner 追加到段缓冲，再补读新记录；记录已离开工作区，所以整段长度可以超过 M。",
    },
    {
      en: "Mark the output slot empty so exactly one replacement can be read into it; frozen records must not be overwritten.",
      zh: "把输出槽标为空，才能在其中补读恰好一条记录；冻结记录绝不能被覆盖。",
    },
    {
      en: "If input remains but no slot is empty, the one-output-one-refill invariant has been broken; return -1 instead of reusing a frozen slot.",
      zh: "如果还有输入却找不到空槽，说明“输出一条、补读一条”的不变量已破坏；应返回 -1，而不是覆盖冻结槽。",
    },
    {
      en: "No eligible key means the current run cannot grow; close and copy it before unfreezing candidates for the next run.",
      zh: "没有可输出键说明当前段无法继续增长；先封段并复制，再解冻下一段的候选。",
    },
    {
      en: "Frozen records still occupy their slots; unfreezing changes only eligibility, not their keys or storage positions.",
      zh: "冻结记录仍占着槽位；解冻只改变可输出性，不改变关键字或存储位置。",
    },
    {
      en: "This selection is a linear scan; a heap would reduce the O(M) choice to O(log M), but the teaching version keeps every slot state visible.",
      zh: "这里用线性扫描选择；堆可以把 O(M) 的选择降到 O(log M)，但教学版保留了每个槽的可见状态。",
    },
    {
      en: "Only EMPTY slots can receive a new record; a FROZEN slot is still resident and must keep its record for the next run.",
      zh: "只有 EMPTY 槽能接收新记录；FROZEN 槽仍有驻留记录，必须留给下一段使用。",
    },
    {
      en: "The run buffer is appended in nondecreasing key order: after the first output, every eligible refill is checked against lastOutput.",
      zh: "段缓冲按非降序追加：第一次输出之后，每条可补读记录都要与 lastOutput 比较。",
    },
    {
      en: "With no eligible and no frozen record, every slot should be empty;",
      zh: "当没有可输出记录也没有冻结记录时，所有槽位都应当是空的；",
    },
    {
      en: "remaining input means the refill invariant was violated.",
      zh: "若仍有输入，说明补读不变量已被破坏。",
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
    {
      en: "workspace holds resident candidates only; current is a separate vector, so an output run can be larger than the workspace.",
      zh: "workspace 只保存驻留候选；current 是独立 vector，因此输出段可以大于工作区。",
    },
    {
      en: "This flag distinguishes no output yet from a genuine threshold of 0; a plain int would misclassify key 0.",
      zh: "该标志区分“尚未输出”和真实阈值 0；只用 int 会把关键字 0 误判。",
    },
    {
      en: "The selection loop is linear in M; a heap would make it O(log M), but this teaching version keeps all slot states visible.",
      zh: "选择循环对 M 线性；堆可做到 O(log M)，但教学版保留所有槽状态的可见性。",
    },
    {
      en: "Copy the winner into the run buffer before refilling the slot; this is why the run may exceed the workspace size.",
      zh: "先把 winner 复制进段缓冲，再补读槽位；这就是段长可以超过工作区大小的原因。",
    },
    {
      en: "The output slot becomes empty so one replacement can enter; a frozen slot is never reused for a different record.",
      zh: "输出槽变空后只能补入一条替换记录；冻结槽不会被换成别的记录。",
    },
    {
      en: "Remaining input with no empty slot violates the refill invariant; throw instead of overwriting a frozen record.",
      zh: "仍有输入却没有空槽，违反补读不变量；应抛出错误，而不是覆盖冻结记录。",
    },
    {
      en: "No eligible record ends the current run; copy the buffer into runs before unfreezing the next candidates.",
      zh: "没有可输出记录就结束当前段；先复制缓冲，再解冻下一批候选。",
    },
    {
      en: "Unfreezing changes eligibility only; the record still occupies the same slot and keeps its key.",
      zh: "解冻只改变可输出性；记录仍占同一槽位并保留原关键字。",
    },
    {
      en: "current is appended in nondecreasing key order: every eligible refill must be at least the last output of this run.",
      zh: "current 按非降序追加：每条可补读记录都不得小于本段上一次输出。",
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
    {
      en: "workspace stores resident candidates; current is a separate list, so the emitted run can grow beyond capacity.",
      zh: "workspace 保存驻留候选；current 是独立列表，因此输出的段可以超过容量。",
    },
    {
      en: "None is the no-threshold sentinel; it distinguishes the first output from a real threshold value of 0.",
      zh: "None 是“尚无阈值”的哨兵；它把第一次输出与真实阈值 0 区分开。",
    },
    {
      en: "Only eligible slots compete; frozen records remain resident but are invisible to the selector.",
      zh: "只有 eligible 槽参与选择；冻结记录仍在工作区，但对选择器不可见。",
    },
    {
      en: "Append the winner to the run buffer before refilling; the run is outside workspace and may exceed capacity.",
      zh: "先把 winner 加入段缓冲，再补读；段缓冲位于工作区之外，所以可超过容量。",
    },
    {
      en: "The winner's slot becomes empty and can receive exactly one replacement; a frozen slot is never overwritten.",
      zh: "winner 的槽变空，只能接收一条替换记录；冻结槽绝不会被覆盖。",
    },
    {
      en: "No eligible record ends the run; append the completed buffer before unfreezing records for the next run.",
      zh: "没有可输出记录就结束本段；先把完整缓冲加入结果，再解冻下一段的记录。",
    },
    {
      en: "Unfreezing only changes state to eligible; the same record stays in the same slot with the same key.",
      zh: "解冻只把状态改成 eligible；同一条记录仍留在原槽并使用原关键字。",
    },
    {
      en: "current is appended in nondecreasing key order: every eligible refill is checked against last_output.",
      zh: "current 按非降序追加：每条可补读记录都要与 last_output 比较。",
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

const MERGED_REFERENCE_ANNOTATIONS: Record<string, readonly ReferenceAnnotation[]> = {
  ...BASE_REFERENCE_ANNOTATIONS,
};

for (const [fileName, annotations] of Object.entries(BATCH_03_ANNOTATIONS)) {
  MERGED_REFERENCE_ANNOTATIONS[fileName] = [
    ...(MERGED_REFERENCE_ANNOTATIONS[fileName] ?? []),
    ...annotations,
  ];
}

for (const [fileName, annotations] of Object.entries(BATCH_04_ANNOTATIONS)) {
  MERGED_REFERENCE_ANNOTATIONS[fileName] = [
    ...(MERGED_REFERENCE_ANNOTATIONS[fileName] ?? []),
    ...annotations,
  ];
}

for (const [fileName, annotations] of Object.entries(BATCH_05_ANNOTATIONS)) {
  MERGED_REFERENCE_ANNOTATIONS[fileName] = [
    ...(MERGED_REFERENCE_ANNOTATIONS[fileName] ?? []),
    ...annotations,
  ];
}

export const REFERENCE_ANNOTATIONS = MERGED_REFERENCE_ANNOTATIONS;
