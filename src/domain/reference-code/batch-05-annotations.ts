// CODE-DOC-04-BATCH-05 reviewed bilingual teaching annotations.
// Entries are merged after the reviewed batches so earlier anchors stay active.
export const BATCH_05_ANNOTATIONS: Record<
  string,
  readonly { en: string; zh: string }[]
> = {
  "avl_tree.c": [
    {
      "en": "Height is derived state, never trusted: recompute it after every pointer change, or every balance factor above becomes stale.",
      "zh": "高度是派生状态，不能直接信任：每次指针改变后都要重算，否则上方所有平衡因子都会过期。"
    },
    {
      "en": "Save the middle subtree before pivot->right is overwritten; it must become root's left child, not stay under the old parent.",
      "zh": "在覆盖 pivot->right 前保存中间子树；它必须变成 root 的左孩子，而不是留在旧父结点下。"
    },
    {
      "en": "The left rotation has the mirror obligation: save pivot->left first, then reattach it as root's right child.",
      "zh": "左旋承担镜像义务：先保存 pivot->left，再把它改挂为 root 的右孩子。"
    },
    {
      "en": "Insertion is ordinary BST descent; all AVL work happens on the unwinding path, where subtree heights and balance factors become known.",
      "zh": "插入下降阶段就是普通 BST；所有 AVL 工作发生在回溯路径上，此时子树高度与平衡因子才已知。"
    },
    {
      "en": "A new leaf starts at height 1; allocation failure returns NULL, and the demo caller must avoid assigning it over an existing subtree.",
      "zh": "新叶高度从 1 开始；分配失败返回 NULL，演示调用方必须避免把它覆盖到已有子树上。"
    },
    {
      "en": "The recursive result is assigned back to root->left; this is also how a rotated subtree root replaces the old child.",
      "zh": "递归结果被接回 root->left；旋转后的子树根也通过这个赋值替换旧孩子。"
    },
    {
      "en": "The sign matters: positive means left-heavy, so only positive imbalance can select LL or LR; magnitude alone is not enough.",
      "zh": "符号很重要：正值表示左重，只有正失衡才可能选择 LL 或 LR；只看绝对值不够。"
    },
    {
      "en": "The inserted value distinguishes LL from LR without another height query; if it lies left of the left child, one right rotation suffices.",
      "zh": "用插入值区分 LL 与 LR，无需再查高度；它位于左孩子左侧时，一次右旋就够。"
    },
    {
      "en": "LR must rotate the left child first; rotating the root immediately would leave the middle subtree attached to the wrong side.",
      "zh": "LR 必须先左旋左孩子；直接右旋根会把中间子树留在错误的一侧。"
    },
    {
      "en": "The mirror cases are symmetric: a negative factor means right-heavy, RR needs one left rotation, and RL needs a child right rotation first.",
      "zh": "镜像情形完全对称：负因子表示右重，RR 只需一次左旋，RL 要先右旋孩子。"
    }
  ],
  "avl_tree.cpp": [
    {
      "en": "Moving root_ into the recursive call is an ownership transfer, not a copy; the returned subtree is then moved back into root_.",
      "zh": "把 root_ move 进递归调用是所有权转移而不是复制；返回的子树随后再 move 回 root_。"
    },
    {
      "en": "x is captured before y->left is overwritten; rotation is only requested when the left side is heavy, so this pointer is non-null.",
      "zh": "在覆盖 y->left 前先捕获 x；只有左侧较重时才请求旋转，因此这个指针非空。"
    },
    {
      "en": "The middle subtree changes parent as one unique_ptr; no node is copied, and the old x->right becomes empty.",
      "zh": "中间子树作为一个 unique_ptr 更换父结点；没有结点被复制，旧的 x->right 变为空。"
    },
    {
      "en": "The factor is left height minus right height, so its sign already names the heavy side; the rotation code relies on that convention.",
      "zh": "平衡因子是左高减右高，符号已经指出较重一侧；旋转代码依赖这个约定。"
    },
    {
      "en": "The child's sign selects LR versus LL; the top-level factor only says the left side is too tall.",
      "zh": "孩子的符号决定 LR 还是 LL；顶层因子只说明左侧过高。"
    },
    {
      "en": "The leaf is created with height 1; duplicate keys return before balance, so an existing node is never rotated for no reason.",
      "zh": "新叶高度为 1；重复键在平衡前返回，已有结点不会无故旋转。"
    },
    {
      "en": "Every recursive return passes through balance, so ancestors see an already repaired subtree rather than a temporarily invalid height.",
      "zh": "每次递归返回都经过 balance，祖先看到的是已修复子树，而不是临时失效的高度。"
    },
    {
      "en": "Rotations change shape but must not change the inorder sequence; this walk is the invariant check that no key was moved across another.",
      "zh": "旋转改变形状，但不能改变中序序列；这次遍历检查没有键被跨过另一个键搬移。"
    }
  ],
  "avl_tree.py": [
    {
      "en": "x is captured before y.left is overwritten; the assertion documents that right rotation is only requested for a left-heavy node.",
      "zh": "在覆盖 y.left 前先捕获 x；断言记录了前提：只有左重结点才会请求右旋。"
    },
    {
      "en": "The middle subtree changes parent as a whole; nothing inside it is rebalanced during this rotation.",
      "zh": "中间子树整体更换父结点；这次旋转不会在其内部再做平衡。"
    },
    {
      "en": "balance repairs one subtree on every unwind level; returning the new root is what lets the parent keep a valid left or right link.",
      "zh": "balance 在每个回溯层修复一个子树；返回新根才能让父结点保持有效的左/右链接。"
    },
    {
      "en": "The assertion documents an invariant of the rotation branch: factor > 1 guarantees a left child, so the later rotation cannot dereference None.",
      "zh": "这个断言记录旋转分支的不变量：factor > 1 保证存在左孩子，后续旋转不会解引用 None。"
    },
    {
      "en": "A right-heavy left child is the LR shape; rotating the child left first reduces it to the LL case.",
      "zh": "左孩子右重就是 LR 形状；先左旋孩子可把它化为 LL 情形。"
    },
    {
      "en": "The new leaf has height 1 and no children; duplicate values return later without a balance pass.",
      "zh": "新叶高度 1 且无孩子；重复值在更后面直接返回，不进入平衡流程。"
    },
    {
      "en": "The duplicate path exits before balance, because an unchanged subtree cannot need a rotation.",
      "zh": "重复键路径在 balance 之前退出，因为未变化的子树不可能需要旋转。"
    },
    {
      "en": "The assertion checks the AVL invariant at the root after all rotations; the inorder assertion alone would only verify BST order.",
      "zh": "这个断言检查所有旋转后根结点的 AVL 不变量；仅检查中序只能验证 BST 次序。"
    }
  ],
  "binary_search.c": [
    {
      "en": "The non-decreasing precondition is documented but not checked here; this C entry trusts the caller, so an unsorted array would discard valid candidates.",
      "zh": "非降序前提只写在契约里，这个 C 入口并不检查；它信任调用方，未排序数组会丢掉有效候选。"
    },
    {
      "en": "high is an inclusive index, not a one-past-the-end bound; for count 0 it becomes -1 and the while condition is false immediately.",
      "zh": "high 是闭区间下标，不是尾后位置；count 为 0 时它变成 -1，while 条件立即为假。"
    },
    {
      "en": "Equality must enter the loop because low == high still names one candidate; stopping at low < high would skip that last element.",
      "zh": "相等时必须进入循环，因为 low == high 仍指向一个候选；若在 low < high 就停止，会漏掉最后一个元素。"
    },
    {
      "en": "Subtract before halving: low + high could overflow int even when the true middle is valid; the floor bias is harmless because both sides shrink.",
      "zh": "先减再折半：即使真实中点合法，low + high 也可能让 int 溢出；向下取整无害，因为两侧都会缩小。"
    },
    {
      "en": "values[middle] is proven smaller than target, so middle itself can be excluded; assigning low = middle would not shrink the window.",
      "zh": "values[middle] 已证明小于 target，因此 middle 本身可以排除；若写 low = middle，窗口不会缩小。"
    },
    {
      "en": "The symmetric exclusion is required here too: middle is proven larger, and keeping it can leave low and high unchanged forever.",
      "zh": "这里同样必须对称排除：middle 已证明更大，若保留它，low 与 high 可能永远不变。"
    },
    {
      "en": "The loop ends only when low > high, meaning no index remains; -1 therefore follows from the empty window, not from a failed comparison.",
      "zh": "循环只在 low > high 时结束，表示已经没有下标候选；因此 -1 来自空窗口，而不是某次比较失败。"
    }
  ],
  "binary_search.cpp": [
    {
      "en": "This helper turns the precondition into an executable check; the search below is only valid after it returns true.",
      "zh": "这个辅助函数把前提变成可执行检查；只有它返回 true 后，下面的查找才有效。"
    },
    {
      "en": "One inversion is enough to reject the input; scanning all pairs would waste work once the order is already broken.",
      "zh": "只要出现一次逆序就足以拒绝输入；顺序已破坏后继续扫描所有相邻对只是浪费。"
    },
    {
      "en": "The empty case is handled before computing right = size - 1, avoiding a conversion from -1 into an unsigned index.",
      "zh": "空容器在计算 right = size - 1 之前处理，避免把 -1 转成无符号下标。"
    },
    {
      "en": "left and right stay int so the subtraction is signed; the cast appears only at the indexing expression.",
      "zh": "left/right 保持 int，使减法按有符号计算；只有真正索引时才转换类型。"
    },
    {
      "en": "Excluding the tested middle is what guarantees progress; all indices left of the new left are known too small.",
      "zh": "排除已测试的中点才能保证推进；新 left 左侧的所有下标都已知过小。"
    },
    {
      "en": "The right half is discarded by moving right below middle, preserving the invariant that the answer can only lie inside [left, right].",
      "zh": "把 right 移到 middle 下方即可丢弃右半区，同时保持“答案只可能在 [left, right] 内”的不变量。"
    },
    {
      "en": "No candidate remains when the inclusive window crosses, so the miss is proven by the window state.",
      "zh": "闭区间交叉后不再有候选，因此未命中由窗口状态本身证明。"
    }
  ],
  "binary_search.py": [
    {
      "en": "all() over adjacent pairs is vacuously true for empty and single-element lists, matching the intended precondition.",
      "zh": "对相邻元素使用 all()，空列表和单元素列表会因空真而返回 True，符合预期前提。"
    },
    {
      "en": "The guard prevents right from becoming -1 on an empty list; Python would otherwise accept values[-1] as the last element.",
      "zh": "这个守卫防止空列表把 right 变成 -1；否则 Python 会把 values[-1] 当成最后一个元素。"
    },
    {
      "en": "Both endpoints are inclusive, so the initial window covers exactly every valid list index.",
      "zh": "两个端点都是闭的，初始窗口恰好覆盖列表的所有有效下标。"
    },
    {
      "en": "The loop condition is inclusive for the same reason as the C version: one remaining element still needs one comparison.",
      "zh": "循环条件保持闭区间，与 C 版同理：只剩一个元素时仍需要一次比较。"
    },
    {
      "en": "Python integers do not overflow, but subtraction still avoids a needless large intermediate and floor division keeps mid inside the window.",
      "zh": "Python 整数不会溢出，但先减仍避免无谓的大中间值，向下取整保证 mid 落在窗口内。"
    },
    {
      "en": "A smaller middle cannot hold the answer, so the left edge moves strictly past it; this is the progress step.",
      "zh": "较小的中点不可能容纳答案，因此左边界严格越过它；这是保证推进的一步。"
    },
    {
      "en": "The exhausted window is the only route to this return, so the caller receives a miss without ambiguity.",
      "zh": "窗口耗尽是到达这个返回的唯一路径，因此调用方得到无歧义的未命中结果。"
    }
  ],
  "bplus_tree.c": [
    {
      "en": "MAX_KEYS is 3, but the arrays reserve one extra slot: insertion writes the fourth key first, then split_leaf moves it out. The overflow slot is part of the algorithm, not slack.",
      "zh": "MAX_KEYS 是 3，但数组多留一个槽：插入先写第 4 个键，再由 split_leaf 移走。溢出槽是算法的一部分，不是冗余空间。"
    },
    {
      "en": "The extra key slot is what makes a split a move rather than a second insertion pass; without it, the fourth key would overflow before the split could run.",
      "zh": "多出的键槽让分裂成为搬移而不是第二遍插入；没有它，第 4 个键会在分裂前就越界。"
    },
    {
      "en": "The static pool returns a node id, not a pointer; -1 is the allocation failure sentinel and also propagates through Split.valid.",
      "zh": "静态池返回结点 id 而不是指针；-1 是分配失败哨兵，也会通过 Split.valid 向上传播。"
    },
    {
      "en": "Equality goes right because separator i equals the minimum of the right child; sending equality left would make a duplicate range unreachable.",
      "zh": "相等走右，因为分隔键 i 等于右孩子最小值；相等时向左会让对应范围不可达。"
    },
    {
      "en": "Only an internal node has separators to follow; the loop stops at the first leaf, which is the only layer that can own a record.",
      "zh": "只有内部结点才有可跟随的分隔键；循环停在第一个叶结点，而叶层是唯一保存记录的一层。"
    },
    {
      "en": "Routing to a leaf is not proof of a hit; the leaf must be scanned because several records can share one leaf block.",
      "zh": "路由到叶并不证明命中；叶内必须扫描，因为多个记录可能共享同一个叶块。"
    },
    {
      "en": "The split is 2/2 after the overflow key is present: right keeps keys 2 and 3, left keeps keys 0 and 1, and the promoted separator stays in the right leaf.",
      "zh": "溢出键存在后按 2/2 分裂：右叶保留 keys 2、3，左叶保留 keys 0、1，提升的分隔键仍留在右叶。"
    },
    {
      "en": "The link order cannot be reversed: right first points at the old successor, then node points at right, so the chain stays connected.",
      "zh": "链接顺序不能反：右结点先指向旧后继，再让 node 指向右结点，链才不会断开。"
    },
    {
      "en": "Internal split removes key 2 from both halves: it becomes the promoted separator, right receives keys after 2 and children after 2, left keeps keys 0..1 and children 0..2.",
      "zh": "内部裂把 key 2 从两半中移除：它成为提升分隔键，右结点拿 key 2 之后的键与孩子，左结点保留 keys 0..1 与 children 0..2。"
    },
    {
      "en": "The separator is read before the left node is truncated; afterward the value exists only in the parent, while both children keep disjoint ranges.",
      "zh": "分隔键在左结点截断前读出；之后它只存在于父结点，两个孩子保持互不重叠的区间。"
    },
    {
      "en": "A full leaf is split only after the new key is written into the overflow slot; the preallocated right node makes this a pure move.",
      "zh": "满叶要等新键写进溢出槽后才分裂；预先分配的右结点让这次分裂只是搬移。"
    },
    {
      "en": "A pending index node is needed only when both parent and child may split; if the child does not split, the pending node is released unused.",
      "zh": "只有父结点与孩子都可能分裂时才需要预分配索引结点；孩子没有分裂时，预分配结点会原样归还。"
    },
    {
      "en": "The root grows only when it is full and the selected child will actually produce a promotion; a full root above a non-full child needs no new level.",
      "zh": "只有当根已满且选中孩子确实会产生提升时才长高；满根下面是未满孩子时不需要新层。"
    },
    {
      "en": "Once a leaf's last key exceeds high, the next leaf starts even higher, so the chain walk may stop without scanning the rest of the tree.",
      "zh": "某叶最后一个键超过 high 后，下一叶只会更高，因此链式扫描可以停止，不必扫完其余树。"
    },
    {
      "en": "The leaf chain starts at the leftmost leaf, reached by always taking child 0; this path is independent of any separator value.",
      "zh": "叶链起点是最左叶，通过始终取 child 0 到达；这条路径与任何分隔键值无关。"
    }
  ],
  "bplus_tree.cpp": [
    {
      "en": "Order 4 means three resident keys; vectors grow to four during insertion, then splitLeaf or splitInternal removes the overflow entry.",
      "zh": "4 阶意味着常驻 3 个键；插入时 vector 会长到 4，再由 splitLeaf 或 splitInternal 移走溢出的项。"
    },
    {
      "en": "next is a non-owning raw pointer: unique_ptr owns the tree edges, while next only exposes the leaf chain for range scans.",
      "zh": "next 是不拥有对象的裸指针：unique_ptr 拥有树边，next 只暴露叶链供范围扫描。"
    },
    {
      "en": "The >= test sends equality to the right child, because a separator is the minimum record of that child rather than a value strictly smaller.",
      "zh": ">= 判断把相等送到右孩子，因为分隔键就是右孩子的最小记录，而不是严格更小的值。"
    },
    {
      "en": "Separators only route; even when target equals a separator, the loop continues until a leaf, because internal entries are not records.",
      "zh": "分隔键只负责路由；即使 target 等于分隔键，循环也继续到叶，因为内部项不是记录。"
    },
    {
      "en": "binary_search is valid because leaf keys stay sorted; it never inspects an internal separator as a possible record.",
      "zh": "叶键保持有序，因此 binary_search 有效；它不会把内部分隔键当作可能记录。"
    },
    {
      "en": "The leaf split assumes the overflow key is already present: node has four keys, right takes keys 2 and 3, and left keeps keys 0 and 1.",
      "zh": "叶分裂假设溢出键已在场：node 有 4 个键，右结点拿 keys 2、3，左结点保留 keys 0、1。"
    },
    {
      "en": "The separator is right->keys.front() and remains stored there; unlike a B-tree split, the promoted value is duplicated at the record layer by design.",
      "zh": "分隔键是 right->keys.front()，并且仍保存在右叶；与 B 树分裂不同，提升值按设计在记录层保留一份。"
    },
    {
      "en": "The middle key is removed from both halves: it becomes the parent separator, right gets keys after 2, and left keeps two keys and three children.",
      "zh": "中间键从两半中都移除：它成为父分隔键，右结点拿下标 2 之后的键，左结点保留两个键和三个孩子。"
    },
    {
      "en": "Right starts at index 3, not 2, because index 2 is the separator; copying index 2 would leave the same key in parent and child.",
      "zh": "右结点从下标 3 开始而不是 2，因为下标 2 是分隔键；复制下标 2 会让父结点与孩子保留同一个键。"
    },
    {
      "en": "Duplicates were rejected before this call, so lower_bound and upper_bound coincide; lower_bound is enough and keeps the leaf sorted.",
      "zh": "调用前重复键已被拒绝，因此 lower_bound 与 upper_bound 重合；用 lower_bound 就足够并保持叶有序。"
    },
    {
      "en": "A promotion at the root creates exactly one new level; no other path in this implementation changes tree height.",
      "zh": "根返回提升时会创建恰好一层新高度；本实现没有其他改变树高的路径。"
    },
    {
      "en": "The first leaf may contain keys below low; the explicit range test filters them instead of assuming the leaf starts at the lower bound.",
      "zh": "首叶可能含低于 low 的键；显式范围判断会过滤它们，而不是假设叶从下界开始。"
    }
  ],
  "bplus_tree.py": [
    {
      "en": "keys and children are plain lists, so every split relies on slicing; leaf and next are the only extra state, and next never owns a node.",
      "zh": "keys 与 children 是普通列表，所有分裂都依赖切片；leaf 与 next 是仅有的额外状态，next 不拥有结点。"
    },
    {
      "en": "Equality belongs to the right child because the separator is that child's minimum; a strict > test would put an equal key on the wrong side.",
      "zh": "相等属于右孩子，因为分隔键就是该孩子的最小值；改成严格 > 会把相等键放到错误一侧。"
    },
    {
      "en": "The overflow key is already present, so four keys split 2/2; right.keys[0] becomes both the separator and the first record of the right leaf.",
      "zh": "溢出键已在场，因此 4 个键按 2/2 分裂；right.keys[0] 同时成为分隔键与右叶首记录。"
    },
    {
      "en": "Right takes the last two keys while left keeps the first two; the separator is duplicated in the parent by design, not moved out of the leaf.",
      "zh": "右叶拿最后两个键，左叶保留前两个；分隔键按设计在父结点复制一份，而不是从叶中移走。"
    },
    {
      "en": "Internal split removes keys 2 from the children: right gets keys 3 onward and children 3 onward, while left keeps keys 0..1 and children 0..2.",
      "zh": "内部裂把 key 2 从孩子中移除：右结点拿 key 3 起的键与孩子，左结点保留 keys 0..1 与 children 0..2。"
    },
    {
      "en": "Slicing the left node to two keys is required after the separator is promoted; leaving the old list would duplicate the separator in both levels.",
      "zh": "分隔键提升后必须把左结点切成两个键；保留旧列表会让分隔键在两层的重复存在。"
    },
    {
      "en": "Duplicate rejection happens before mutation; a root promotion builds a fresh index node with one separator and exactly two children.",
      "zh": "重复拒绝发生在修改前；根提升会新建一个含一个分隔键和恰好两个孩子的索引结点。"
    },
    {
      "en": "The lower-bound leaf can contain keys below low, so each key is filtered; next is followed until a leaf's last key exceeds high.",
      "zh": "下界叶可能含低于 low 的键，因此逐键过滤；沿 next 直到某叶最后键超过 high。"
    }
  ],
  "bst.c": [
    {
      "en": "The recursive call returns the subtree root, and the caller stores it back into left or right; skipping that assignment would lose the newly inserted node.",
      "zh": "递归调用返回子树根，调用方必须把它接回 left 或 right；忽略这个赋值会丢失新插入的结点。"
    },
    {
      "en": "Null is the unique insertion point; allocation happens only when the search path falls off the tree.",
      "zh": "空指针是唯一插入点；只有搜索路径落到树外时才分配结点。"
    },
    {
      "en": "Allocation failure sets inserted=false, but this teaching function still returns NULL; a production caller must propagate failure instead of assigning NULL over an existing subtree.",
      "zh": "分配失败会置 inserted=false，但这个教学函数仍返回 NULL；生产调用方必须向上传播失败，不能把 NULL 覆盖到已有子树上。"
    },
    {
      "en": "Strict comparisons send equal keys to the final else branch; that is why duplicates are rejected rather than stored on an arbitrary side.",
      "zh": "严格比较把相等键送到最后的 else 分支；因此重复键被拒绝，而不是任意挂到左或右。"
    },
    {
      "en": "Iterative search replaces recursion with a pointer walk; the loop ends at NULL only after following the one branch allowed by the ordering invariant.",
      "zh": "迭代查找用指针移动替代递归；只有沿排序不变量允许的唯一分支走到 NULL，循环才结束。"
    },
    {
      "en": "The ordered comparison makes the branch exclusive; searching both sides would abandon the O(h) path guarantee.",
      "zh": "有序比较让分支互斥；两边都搜会放弃 O(h) 的单路径保证。"
    },
    {
      "en": "Left-root-right is not decoration: the printed sequence is ascending exactly when every node satisfies the BST order, so traversal is the structural proof.",
      "zh": "左—根—右不是装饰：只有当每个结点都满足 BST 次序时输出才升序，因此遍历也是结构证明。"
    },
    {
      "en": "Postorder is mandatory here: freeing the root first would destroy the child pointers needed to reach the remaining nodes.",
      "zh": "这里必须后序释放：先释放根会丢掉指向剩余结点的孩子指针。"
    }
  ],
  "bst.cpp": [
    {
      "en": "The wrapper publishes the returned subtree back into root_; the private overload may change ownership, so dropping the return would detach the tree.",
      "zh": "包装函数把返回的子树接回 root_；私有重载可能改变所有权，丢掉返回值会让整棵树脱节。"
    },
    {
      "en": "A null child is exactly where a new leaf belongs; duplicates skip node creation and return the same subtree.",
      "zh": "空孩子正是新叶应出现的位置；重复键跳过建结点并原样返回同一子树。"
    },
    {
      "en": "No left child means the right child, possibly null, can be moved up; unique_ptr transfer both splices and destroys the removed node.",
      "zh": "没有左孩子时，可以把右孩子（可能为空）上提；unique_ptr 转移同时完成接枝与删除。"
    },
    {
      "en": "The successor is the leftmost node of the right subtree; it is the smallest key larger than the removed key, so copying it preserves ordering.",
      "zh": "后继是右子树最左结点，也是比待删键大的最小键；复制它能保持有序性。"
    },
    {
      "en": "The successor is removed by key through the same recursive path, not by a raw pointer; this keeps every parent's unique_ptr valid.",
      "zh": "后继按键沿同一递归路径删除，而不是用裸指针直接摘除；这样每个父结点的 unique_ptr 仍有效。"
    },
    {
      "en": "Search does not modify the tree and does not need the owning pointer type; a raw observation pointer is enough.",
      "zh": "查找不修改树，也不需要拥有型指针；一个只读观察指针就足够。"
    },
    {
      "en": "Recursing left before printing and right afterwards produces ascending keys only because the invariant already holds for every subtree.",
      "zh": "先递归左、再打印、后递归右，只有每个子树都已满足不变量时才会产生升序键。"
    },
    {
      "en": "Removing the root with two children exercises the successor path: the value changes, but the node object and its ownership stay in place.",
      "zh": "删除有两个孩子的根会走后继路径：键值改变，但结点对象与所有权位置不变。"
    }
  ],
  "bst.py": [
    {
      "en": "Returning the subtree root lets the caller reconnect left or right; Python's reference assignment is the analogue of the C pointer update.",
      "zh": "返回子树根让调用方重接 left 或 right；Python 的引用赋值对应 C 的指针更新。"
    },
    {
      "en": "The recursive path creates a node only at None; duplicate values return the same root and never allocate.",
      "zh": "递归只在 None 处创建结点；重复值原样返回同一根，永远不分配新结点。"
    },
    {
      "en": "Equal keys skip both branches and reach the final return, so an existing node is never duplicated or rewired.",
      "zh": "相等键会跳过两个分支并到达最终返回，因此已有结点不会被复制或改接。"
    },
    {
      "en": "The minimum is the leftmost node; the loop can move without a null check because the caller only passes a non-empty right subtree.",
      "zh": "最小值在最左端；循环无需判空，因为调用方只传入非空的右子树。"
    },
    {
      "en": "With no left child, returning root.right splices the only child into the parent slot; Python's garbage collector releases the removed node.",
      "zh": "没有左孩子时返回 root.right，把唯一孩子接进父槽；Python 垃圾回收会释放被删结点。"
    },
    {
      "en": "The two-child case copies the successor's value first, then deletes the successor itself; this avoids rewiring three parent/child links.",
      "zh": "双孩子情形先复制后继值，再删除后继结点本身；这样不必重接三条父子链接。"
    },
    {
      "en": "Deleting by the copied key is safe because the successor is the minimum of the right subtree and therefore has no left child.",
      "zh": "按键删除复制来的值是安全的：后继是右子树最小值，因此它没有左孩子。"
    },
    {
      "en": "The loop follows at most one branch per level; a missing key ends at None after O(h) comparisons.",
      "zh": "循环每层最多走一个分支；缺失键在 O(h) 次比较后到达 None。"
    }
  ],
  "btree.c": [
    {
      "en": "These constants are one arithmetic family: order 4 gives at most 3 keys, at least 1 key in a non-root node, and at most 4 children; every index below assumes this relation.",
      "zh": "这些常量属于同一套算术：4 阶最多 3 个键，非根结点至少 1 个键，最多 4 个孩子；下面所有下标都依赖这个关系。"
    },
    {
      "en": "keys[i] separates children[i] and children[i+1]; a node with k keys therefore owns k+1 child slots, including the empty tail slots.",
      "zh": "keys[i] 分隔 children[i] 与 children[i+1]；因此 k 个键的结点拥有 k+1 个孩子槽，包括尚未使用的尾部槽。"
    },
    {
      "en": "calloc zeroes every slot, so children[0] == NULL is a reliable leaf test; the implementation deliberately stores no separate leaf marker.",
      "zh": "calloc 清零所有槽，因此 children[0] == NULL 是可靠的叶判断；本实现故意不另存 leaf 字段。"
    },
    {
      "en": "The node scan stops at the first key >= target; equality is a hit, and a smaller target means the child at that same index.",
      "zh": "结点内扫描停在第一个 >= target 的键；相等即命中，target 更小时应进入同一下标的孩子。"
    },
    {
      "en": "The median index is 1 for order 4; it is moved to the parent and removed from the child, so the two halves never both retain it.",
      "zh": "4 阶的中位下标是 1；它被移入父结点并从孩子中删除，两半不会同时保留它。"
    },
    {
      "en": "Right receives only the keys after the median; the bound is right->key_count, not MAX_KEYS, because copying the whole tail would duplicate keys.",
      "zh": "右结点只接收中位键之后的键；循环上界是 right->key_count 而不是 MAX_KEYS，复制整个尾部会重复键。"
    },
    {
      "en": "A node with k keys owns k+1 children, so the right child slots include the slot just past the last key; the <= bound moves that tail child too.",
      "zh": "k 个键的结点拥有 k+1 个孩子，因此右孩子的槽包含最后一个键之后的槽；<= 的循环上界会把这个尾部孩子也移走。"
    },
    {
      "en": "Leaf insertion walks left while larger keys are present; the new key is written only after the gap is opened, and key_count grows last.",
      "zh": "叶插入在存在更大键时向左走；只有空位腾出后才写入新键，key_count 最后才增加。"
    },
    {
      "en": "A full child is split before the descent; after promotion, comparing key with the new separator decides whether the lower half or the right sibling is the next child.",
      "zh": "满孩子必须在下降前分裂；提升后比较 key 与新分隔键，决定下一层进入左半还是右兄弟。"
    },
    {
      "en": "Root splitting is the only height increase; both new nodes are allocated before any pointer changes, so an allocation failure leaves the old tree intact.",
      "zh": "根分裂是唯一长高方式；两个新结点都在改指针前分配，因此分配失败时旧树保持完整。"
    },
    {
      "en": "ensure_child runs before descending; borrowing or merging here guarantees the child has at least MIN_KEYS+1 keys when the recursive delete reaches it.",
      "zh": "ensure_child 在下降前运行；这里的借位或合并保证递归删除到达孩子时，它至少有 MIN_KEYS+1 个键。"
    },
    {
      "en": "Left borrowing rotates three things: the parent separator moves down, the left maximum moves up, and the left child's last child slot moves under the inserted key.",
      "zh": "向左借位旋转三样东西：父分隔键下移、左最大键上移，左孩子的最后一个孩子槽移到插入键下面。"
    },
    {
      "en": "A left merge pulls the separator into the left sibling, appends the underfull child's keys and children, then removes the separator and child slot from the parent.",
      "zh": "向左合并把分隔键下拉到左兄弟，追加欠满孩子的键与孩子，再从父结点删除该分隔键和孩子槽。"
    },
    {
      "en": "Leaf deletion only shifts keys left; there is no child pointer to repair, and decrementing key_count is the entire structural change.",
      "zh": "叶删除只需把键左移；没有孩子指针要修复，减少 key_count 就是全部结构变化。"
    },
    {
      "en": "An internal key is replaced by the maximum of its left child, then that real predecessor is deleted; copying the value without deleting its source would duplicate it.",
      "zh": "内部键由左子树最大值替换，然后删除这个真实前驱；只复制值而不删除来源会造成重复。"
    },
    {
      "en": "A zero-key internal root has exactly one child; promoting it is the only legal height decrease and keeps the new root non-empty.",
      "zh": "零键内部根恰好有一个孩子；提升它是唯一合法的降高方式，并让新根保持非空。"
    }
  ],
  "btree.cpp": [
    {
      "en": "The three constants are the node contract: at most 3 keys, at most 4 children, and a non-root node with at least 1 key; the code never derives these from size() alone.",
      "zh": "三个常量构成结点契约：最多 3 个键、4 个孩子，非根结点至少 1 个键；代码不会只凭 size() 推断这些边界。"
    },
    {
      "en": "children has one more entry than keys for every internal node; leaf nodes keep it empty and use the explicit leaf boolean.",
      "zh": "每个内部结点的 children 都比 keys 多一项；叶结点保持 children 为空，并用显式 leaf 标志。"
    },
    {
      "en": "shared_ptr is used only for the child vectors that share ownership; the tree root and local traversal pointers do not create a second owner.",
      "zh": "shared_ptr 只用于共享所有权的孩子 vector；树根与局部遍历指针不会制造第二个所有者。"
    },
    {
      "en": "The inner scan stops at the first key >= target; index then doubles as the child edge, because separators and child slots share the same boundary.",
      "zh": "内层扫描停在第一个 >= target 的键；index 随后兼作孩子边，因为分隔键与孩子槽共享同一边界。"
    },
    {
      "en": "The full child has 3 keys; median index 1 is promoted, key 2 becomes the right node's only key, and children 2 and 3 move with it.",
      "zh": "满孩子有 3 个键；下标 1 的中位键提升，key 2 成为右结点唯一的键，children 2、3 随它移动。"
    },
    {
      "en": "Only key 2 moves right; the promoted key is not copied there, so the parent and child do not both expose the same separator as a record.",
      "zh": "只有 key 2 移到右边；提升键不会复制过去，父结点与孩子不会同时把同一分隔键当记录。"
    },
    {
      "en": "Resizing left to two children is not cosmetic: it drops the moved child slots so a later descent cannot reach a node that now belongs to the right sibling.",
      "zh": "把左结点缩到两个孩子不是装饰：它丢弃已移动的孩子槽，后续下降才不会走到已属于右兄弟的结点。"
    },
    {
      "en": "A full root is split before any descent; this is the only operation in the file that increases tree height.",
      "zh": "满根在任何下降前分裂；这是文件中唯一增加树高的操作。"
    },
    {
      "en": "Splitting happens before the loop moves down; comparing value with promoted then selects the old child or the new sibling, never both.",
      "zh": "分裂发生在循环下降之前；用插入值与提升键比较，只会选旧孩子或新兄弟，不会两者都选。"
    },
    {
      "en": "upper_bound is safe because duplicates were rejected; the insertion position lies inside the leaf, where no child pointers need repair.",
      "zh": "重复键已被拒绝，因此 upper_bound 安全；插入位置在叶内，不需要修复孩子指针。"
    },
    {
      "en": "The repair runs before the recursive delete, so the child has at least MIN_KEYS+1 keys and removing one cannot leave it underfull.",
      "zh": "修复在递归删除前运行，因此孩子至少有 MIN_KEYS+1 个键，删掉一个也不会低于下界。"
    },
    {
      "en": "Left borrow is a three-way rotation: separator down, left maximum up, and one child pointer follows the moved key into the front slot.",
      "zh": "向左借位是三方旋转：分隔键下移、左最大键上移，一个孩子指针跟随被移动的键进入首槽。"
    },
    {
      "en": "A left merge appends the separator and the child's whole key/child ranges to the left sibling, then erases the separator and the child edge from the parent.",
      "zh": "向左合并把分隔键与孩子的整段键/孩子范围追加到左兄弟，再从父结点删除分隔键与孩子边。"
    },
    {
      "en": "The predecessor is a real leaf key reached by always taking the rightmost child; replacing the internal key and deleting that leaf key preserves all ranges.",
      "zh": "前驱是沿最右孩子到达的真实叶键；替换内部键并删除该叶键后，所有区间仍然合法。"
    },
    {
      "en": "A zero-key internal root has one remaining child; replacing the root with it is the mirror of root splitting.",
      "zh": "零键内部根只剩一个孩子；用它替换根是根分裂的镜像操作。"
    }
  ],
  "btree.py": [
    {
      "en": "Python lists carry their own lengths, so the upper and lower bounds are checked against len(node.keys) rather than against a fixed array size.",
      "zh": "Python 列表自带长度，因此上下界都拿 len(node.keys) 比较，而不是固定数组长度。"
    },
    {
      "en": "A node stores keys and children as parallel sequences; for k keys an internal node must have exactly k+1 children, and leaves leave children empty.",
      "zh": "结点用两个平行序列保存键与孩子；k 个键的内部结点必须恰好有 k+1 个孩子，叶结点保持 children 为空。"
    },
    {
      "en": "The key scan stops at the first key >= target; equality returns immediately, and a smaller target breaks to the child at that index.",
      "zh": "键扫描停在第一个 >= target 的键；相等立即返回，target 更小则在该下标的孩子继续。"
    },
    {
      "en": "Order 4 makes index 1 the median; it is copied out before the left key list is truncated, so the parent receives a value that no half retains.",
      "zh": "4 阶让下标 1 成为中位键；在左键表被截断前先取出它，父结点得到的值不会留在任何一半。"
    },
    {
      "en": "A full leaf has 3 keys, so the right node receives exactly the last key; the median itself is not copied into the right half.",
      "zh": "满叶有 3 个键，因此右结点恰好接收最后一个键；中位键本身不会复制到右半。"
    },
    {
      "en": "The left child list is sliced to two entries after children 2 and 3 move right; keeping the old list would leave duplicate ownership of the same subtrees.",
      "zh": "children 2、3 移走后，左孩子列表切到两项；保留旧列表会让同一批子树出现重复归属。"
    },
    {
      "en": "Only a full root creates a new level; the old root becomes the new root's left child and the promoted separator becomes its only key.",
      "zh": "只有根满才创建新层；旧根成为新根的左孩子，提升的分隔键成为新根唯一的键。"
    },
    {
      "en": "A full child is split before descending; the promoted key lets the loop choose the correct child without backtracking.",
      "zh": "满孩子在下降前分裂；提升键让循环无需回溯就能选对下一个孩子。"
    },
    {
      "en": "Leaf insertion finds the gap by moving only larger keys; equal keys would stop the walk, which matches the duplicate-rejection contract.",
      "zh": "叶插入只搬移更大的键来寻找空位；相等键会停止移动，这与拒绝重复键的契约一致。"
    },
    {
      "en": "The child is repaired before recursion; borrowing or merging at the parent is what keeps every recursive call above the minimum.",
      "zh": "孩子在递归前被修复；父结点处的借位或合并让每次递归调用都高于最小键数。"
    },
    {
      "en": "Left borrowing inserts the parent separator at the front, then moves the left maximum up; for an internal child the matching child pointer moves too.",
      "zh": "向左借位把父分隔键插入首部，再把左最大值上移；内部孩子还要移动对应的孩子指针。"
    },
    {
      "en": "A left merge pops the separator from the parent and extends the left sibling with the child's keys; the child itself is then discarded.",
      "zh": "向左合并从父结点弹出分隔键，并用孩子的键扩展左兄弟；随后丢弃这个孩子。"
    },
    {
      "en": "The predecessor is the maximum of the left subtree; copying it into the internal slot and deleting the original leaf key avoids duplicate keys.",
      "zh": "前驱是左子树最大值；把它复制到内部槽再删除原叶键，避免出现重复键。"
    },
    {
      "en": "When the root has no keys but is not a leaf, its only child becomes the new root; this is the only height decrease.",
      "zh": "根没有键但不是叶时，唯一孩子成为新根；这是唯一降低树高的方式。"
    }
  ],
  "hash_chain.c": [
    {
      "en": "The table has a fixed bucket array; initialization only clears heads, and this version never resizes or rehashes existing keys.",
      "zh": "表使用固定桶数组；初始化只清空桶头，本版本从不扩容或重新散列已有键。"
    },
    {
      "en": "C's remainder can be negative, so the conditional adds TABLE_SIZE; without it a negative key would index outside the bucket array.",
      "zh": "C 的余数可能为负，因此条件表达式加 TABLE_SIZE；否则负键会索引到桶数组之外。"
    },
    {
      "en": "The duplicate test scans the entire target chain before allocation; a colliding duplicate may sit behind several nodes, not only at the head.",
      "zh": "查重会在分配前扫描整条目标链；冲突的重复键可能位于多个结点之后，而不只在链头。"
    },
    {
      "en": "A failed allocation returns false, the same value used for a duplicate; the caller cannot distinguish out-of-memory from an existing key in this API.",
      "zh": "分配失败返回 false，与重复键使用同一个值；这个 API 的调用方无法区分内存不足与键已存在。"
    },
    {
      "en": "Head insertion is O(1): the new node points at the old head, then the bucket head is republished; chain order becomes reverse insertion order.",
      "zh": "头插是 O(1)：新结点先指向旧链头，再更新桶头；链顺序因此变成插入顺序的逆序。"
    },
    {
      "en": "Only the target bucket can hold this key because every insertion uses the same hash index; an empty bucket is a proof of absence for this fixed table.",
      "zh": "键只可能在目标桶，因为每次插入都使用同一哈希下标；空桶即可证明该键不在这个固定表中。"
    },
    {
      "en": "next is saved before free because freeing node would make node->next unreadable; the loop must advance through the saved pointer.",
      "zh": "free 前先保存 next，因为释放 node 后 node->next 不可再读；循环必须通过保存的指针前进。"
    },
    {
      "en": "The function frees nodes but does not clear bucket heads; after it returns the table holds dangling pointers and must be re-initialized before reuse.",
      "zh": "这个函数释放结点但不清理桶头；返回后表中仍是悬空指针，复用前必须重新初始化。"
    }
  ],
  "hash_chain.cpp": [
    {
      "en": "The scan is linear in chain length; push_back may reallocate the bucket vector, but the bucket index remains valid because only the inner vector moves.",
      "zh": "扫描成本与链长线性相关；push_back 可能让桶 vector 重新分配，但桶下标仍有效，因为移动的只是内层 vector。"
    },
    {
      "en": "The cast to int is required before modulo; mixing size_t here would turn a negative key into a huge unsigned value before the sign correction.",
      "zh": "取模前必须先转 int；混用 size_t 会把负键在符号修正前变成巨大无符号值。"
    },
    {
      "en": "The whole bucket is scanned before push_back; a duplicate may be behind several colliding keys, so checking only the first element is insufficient.",
      "zh": "push_back 前扫描整个桶；重复键可能在多个冲突键之后，只检查第一个元素不够。"
    },
    {
      "en": "Insertion appends to the chain, so the printed order is insertion order; the C version prepends and therefore prints in the opposite order.",
      "zh": "插入追加到链尾，因此打印顺序是插入顺序；C 版头插，打印顺序正好相反。"
    },
    {
      "en": "Lookup and printing touch one bucket at a time; the average O(1+alpha) bound assumes hashing spreads keys, not that chains are short by construction.",
      "zh": "查找与打印一次只碰一个桶；平均 O(1+α) 界假设哈希能分散键，而不是链按构造就很短。"
    }
  ],
  "hash_chain.py": [
    {
      "en": "The bucket count is fixed at construction; changing it later would invalidate every stored key's home bucket, so no resize API is provided.",
      "zh": "桶数在构造时固定；之后改变它会让每个已存键的原始桶失效，因此没有提供扩容接口。"
    },
    {
      "en": "Python's % already returns a non-negative remainder for negative keys, so unlike the C implementation no sign correction is needed.",
      "zh": "Python 的 % 对负键已返回非负余数，因此不像 C 实现那样需要符号修正。"
    },
    {
      "en": "The membership test performs the duplicate scan, and append happens only after it fails; average cost is 1 + alpha for the target bucket.",
      "zh": "成员测试完成查重，只有失败后才 append；目标桶的平均成本是 1+α。"
    },
    {
      "en": "This is a full linear scan of the target Python list, not a hash lookup; it is O(chain length), which is why alpha controls the real cost.",
      "zh": "这是对目标 Python 列表的完整线性扫描，不是哈希查找；成本为 O(链长)，因此 α 决定实际代价。"
    },
    {
      "en": "Returning copies prevents callers from mutating internal lists; the tradeoff is O(n) copying whenever the table is inspected.",
      "zh": "返回副本防止调用方修改内部列表；代价是每次检查表都要 O(n) 复制。"
    }
  ],
  "hash_probe.c": [
    {
      "en": "The EMPTY sentinel is -1, so this representation assumes non-negative keys; storing -1 as a real key would make that slot indistinguishable from empty.",
      "zh": "EMPTY 哨兵是 -1，因此这种表示假设键非负；把 -1 当作真实键存入会让该槽与空槽无法区分。"
    },
    {
      "en": "Every slot starts EMPTY; because this version never deletes, no DELETED state and no occupancy-versus-tombstone distinction are needed.",
      "zh": "所有槽从 EMPTY 开始；本版本从不删除，因此不需要 DELETED 状态，也不需要区分占用与墓碑。"
    },
    {
      "en": "The home slot is only the start of the probe, not the final position; collisions move forward modulo capacity, wrapping at the array end.",
      "zh": "home 槽只是探测起点，不是最终位置；冲突时按容量取模向前移动，到数组末尾后回绕。"
    },
    {
      "en": "step < capacity guarantees termination even when every slot is occupied; a full table returns false after one complete cycle.",
      "zh": "step < capacity 保证即使所有槽都占用也会终止；表满时绕完一圈后返回 false。"
    },
    {
      "en": "The first EMPTY slot is the insertion point only because no key can be hidden beyond it; adding deletion would break this proof.",
      "zh": "第一个 EMPTY 槽能作为插入点，仅因为没有键会藏在它之后；一旦允许删除，这个证明就失效。"
    },
    {
      "en": "The duplicate test continues along the probe sequence, not just at the home slot; colliding keys may be several steps away.",
      "zh": "查重沿探测序列继续，不能只看 home 槽；冲突键可能在好几步之外。"
    },
    {
      "en": "Search follows the exact same probe sequence as insertion; stopping at EMPTY is valid only in this no-deletion table.",
      "zh": "查找沿与插入完全相同的探测序列；只有在这个不删除的表中，遇到 EMPTY 停止才有效。"
    }
  ],
  "hash_probe.cpp": [
    {
      "en": "Capacity is a constructor argument, so the probe modulo uses slots_.size() rather than a global constant; every slot starts as the sentinel.",
      "zh": "容量是构造参数，因此探测取模使用 slots_.size() 而不是全局常量；所有槽初始都是哨兵值。"
    },
    {
      "en": "kEmpty is also a legal int key, and this class does not reject -1; inserting -1 would make a real key look empty to contains(). Non-negative keys are therefore an implicit precondition.",
      "zh": "kEmpty 本身也是合法 int 键，而这个类不拒绝 -1；插入 -1 会让真实键在 contains() 中看起来像空槽。因此非负键是隐式前提。"
    },
    {
      "en": "The first empty slot accepts the insert; if the table is full, the loop ends without a write and returns false.",
      "zh": "第一个空槽接受插入；表满时循环结束且不写入，返回 false。"
    },
    {
      "en": "A duplicate can appear later in the probe sequence, so the loop must compare every occupied slot until it finds the key or an empty slot.",
      "zh": "重复键可能出现在探测序列后面，因此循环必须比较每个占用槽，直到找到键或空槽。"
    },
    {
      "en": "Contains uses the same start index and step order as insert; if it used a different probe order, it could stop at an empty slot before reaching the key.",
      "zh": "contains 与 insert 使用同一起始下标和步进顺序；若探测顺序不同，可能在到达键之前就遇到空槽而停止。"
    },
    {
      "en": "The modulo is computed in int and only then converted to size_t; converting first would make a negative remainder impossible to correct.",
      "zh": "取模先在 int 中完成，之后才转 size_t；若先转换，负余数就无法再修正。"
    }
  ],
  "hash_probe.py": [
    {
      "en": "EMPTY is a sentinel, not a reserved key; the table never validates that inputs are non-negative, so a real -1 would be lost on lookup.",
      "zh": "EMPTY 是哨兵而不是保留键；表从不校验输入非负，因此真实的 -1 在查找时会被当作空槽。"
    },
    {
      "en": "Capacity is fixed at construction and every slot starts EMPTY; no resize path exists, so alpha can grow until the table is full.",
      "zh": "容量在构造时固定，所有槽从 EMPTY 开始；没有扩容路径，因此 α 会一直增长到表满。"
    },
    {
      "en": "Python's modulo already normalizes negative keys, so this method needs no sign branch; the result is always a valid slot index.",
      "zh": "Python 的取模已经归一化负键，因此这个方法不需要符号分支；结果总是有效槽下标。"
    },
    {
      "en": "The loop bound is the number of slots, which proves termination even when no empty slot exists; a full table returns False.",
      "zh": "循环上界是槽数，即使没有空槽也能证明终止；表满时返回 False。"
    },
    {
      "en": "This empty check is both the insertion point and the absence proof; the two roles coincide only because the table has no deletion.",
      "zh": "这个空槽判断同时承担插入点与不存在证明；两种角色重合，仅因为表不删除。"
    },
    {
      "en": "The search walks the same cyclic sequence as insert and stops at EMPTY; a table full of other keys costs one full cycle before returning False.",
      "zh": "查找沿与插入相同的环形序列前进并在 EMPTY 停止；表被其他键占满时要绕完整一圈才返回 False。"
    }
  ],
  "insertion_sort.c": [
    {
      "en": "The function sorts in place and returns nothing; callers must keep the array alive for the whole call because every value is read and rewritten directly.",
      "zh": "函数原地排序且不返回值；调用方必须在整个调用期间保持数组有效，因为每个值都直接被读写。"
    },
    {
      "en": "The sorted prefix is [0, index); index starts at 1 because a one-element prefix is already sorted, and the loop invariant is restored at the end of each iteration.",
      "zh": "已排序前缀是 [0, index)；index 从 1 开始，因为单元素前缀天然有序，每次迭代结束时恢复循环不变量。"
    },
    {
      "en": "key must be saved before shifting: the first move overwrites values[index], which is the only copy of the element being inserted.",
      "zh": "key 必须在搬移前保存：第一次移动就会覆盖 values[index]，而它是待插入元素唯一的副本。"
    },
    {
      "en": "position names the rightmost element of the sorted prefix, not the hole; the hole is always position+1 during the shift loop.",
      "zh": "position 指向已排序前缀的最右元素，而不是空位；搬移过程中空位始终是 position+1。"
    },
    {
      "en": "The strict > is the stability decision: equal keys stop the shift, so the new key lands after them and their relative order survives.",
      "zh": "严格的 > 是稳定性决策：相等键会停止搬移，新键落在它们之后，相对次序得以保留。"
    },
    {
      "en": "This is a one-slot move, not a swap; only larger values travel right while the hole moves left, so the number of writes is minimal.",
      "zh": "这是单槽搬移而不是交换；只有更大的值向右走，空位向左移动，因此写入次数最少。"
    },
    {
      "en": "After the loop, position+1 is the first slot whose left neighbour is <= key; that is exactly where the saved key belongs.",
      "zh": "循环结束后，position+1 是左邻居 <= key 的第一个槽，正好是保存的 key 应放的位置。"
    },
    {
      "en": "On already sorted input the inner loop never runs, so each outer step costs one comparison and the total is O(n); the quadratic bound is only the worst case.",
      "zh": "输入已有序时内层循环从不执行，每个外层步只花一次比较，总计 O(n)；平方界只是最坏情况。"
    }
  ],
  "insertion_sort.cpp": [
    {
      "en": "The vector is passed by reference and mutated in place; no auxiliary array is allocated, so extra space stays O(1).",
      "zh": "vector 按引用传入并原地修改；没有分配辅助数组，因此额外空间保持 O(1)。"
    },
    {
      "en": "size_t has no negative value, so the prefix index starts at 1 and every earlier position is a valid already-sorted element.",
      "zh": "size_t 没有负值，因此前缀下标从 1 开始，之前的每个位置都是合法的已排序元素。"
    },
    {
      "en": "current is the value being inserted; saving it is necessary because values[index] is overwritten by the first right shift.",
      "zh": "current 是待插入值；必须保存它，因为第一次右移就会覆盖 values[index]。"
    },
    {
      "en": "position is the hole index, so the loop compares values[position-1] and writes the shifted value into values[position].",
      "zh": "position 是空位下标，因此循环比较 values[position-1]，并把被搬移的值写入 values[position]。"
    },
    {
      "en": "The position > 0 guard makes position-1 readable; the strict > stops on equality and preserves the relative order of equal keys.",
      "zh": "position > 0 守卫保证 position-1 可读；严格 > 在相等时停止，保留相等键的相对次序。"
    },
    {
      "en": "The hole moves one slot left while the larger value moves right; no temporary swap is needed because the hole already holds a duplicate.",
      "zh": "空位左移一格，较大的值右移；空位中已是重复值，因此不需要额外交换临时变量。"
    },
    {
      "en": "The loop stops at the first position whose predecessor is <= current, so writing current into the hole restores the sorted prefix.",
      "zh": "循环停在前驱 <= current 的第一个位置，把 current 写入空位即可恢复已排序前缀。"
    }
  ],
  "insertion_sort.py": [
    {
      "en": "The function mutates the caller's list and returns None; a copy would sort a temporary object and leave the original unchanged.",
      "zh": "函数修改调用方传入的列表并返回 None；若复制一份，只会排序临时对象而原列表不变。"
    },
    {
      "en": "range starts at 1 because the one-element prefix values[0:1] is already sorted; range excludes len(values), so the last valid index is len-1.",
      "zh": "range 从 1 开始，因为单元素前缀 values[0:1] 已有序；range 不含 len(values)，因此最后一个有效下标是 len-1。"
    },
    {
      "en": "current must be captured before any assignment; otherwise the first shift would destroy the only reference to the element being inserted.",
      "zh": "current 必须在任何赋值前捕获；否则第一次搬移就会破坏待插入元素的唯一引用。"
    },
    {
      "en": "Python uses position as the current hole and compares position-1, while the C version stores position one slot left of the hole.",
      "zh": "Python 用 position 表示当前空位并比较 position-1，而 C 版把 position 存在空位左边一格。"
    },
    {
      "en": "The guard is checked first, so values[position-1] is only read when the index is valid; equality stops the walk and keeps the sort stable.",
      "zh": "先检查守卫，只有下标有效时才读取 values[position-1]；相等会停止移动，保持排序稳定。"
    },
    {
      "en": "This overwrites the hole with its left neighbour, then decrements position; the list never needs a separate swap buffer.",
      "zh": "这次赋值用左邻居覆盖空位，然后让 position 左移；列表不需要额外的交换缓冲区。"
    },
    {
      "en": "When the loop ends, position is the first slot whose left neighbour is <= current, which is the insertion point.",
      "zh": "循环结束时，position 是左邻居 <= current 的第一个槽，也就是插入点。"
    },
    {
      "en": "The demo sorts a mixed list with duplicates absent but order-sensitive values; stability would matter if equal keys carried payloads.",
      "zh": "演示对混合序列排序，这里没有重复键；若相等键还携带负载，稳定性才会直接影响结果。"
    }
  ],
  "key_tree.c": [
    {
      "en": "A node stores the letter on its incoming edge, not the whole prefix; 26 direct child slots make each character step one array lookup.",
      "zh": "结点保存的是入边字符，不是完整前缀；26 个直接孩子槽让每个字符的转向只需一次数组访问。"
    },
    {
      "en": "The new node owns no parent link; the caller must attach it with nodes[parent].child[letter - 'a'] after allocation succeeds.",
      "zh": "新结点不保存父边；调用方必须在分配成功后用 nodes[parent].child[letter - 'a'] 把它接上。"
    },
    {
      "en": "Subtracting 'a' assumes a lower-case letter; there is no range check here, so any other byte would index outside the 26-slot alphabet.",
      "zh": "减去 'a' 假设输入为小写字母；这里没有范围检查，其他字节会索引到 26 槽字母表之外。"
    },
    {
      "en": "matched is both the number of consumed characters and the index of the next character; the loop stops at the terminator or the first missing edge.",
      "zh": "matched 既是已消费字符数，也是下一个字符下标；循环在终止符或第一条缺失边处停止。"
    },
    {
      "en": "This hard-codes the root id as 0. It is true while the root is the first allocated node and never released, but find_word does not verify that assumption.",
      "zh": "这里把根结点 id 硬编码为 0。只要根是第一个分配且从不释放的结点，这个假设成立，但 find_word 并不校验它。"
    },
    {
      "en": "The two tests answer different questions: complete means the whole path exists, terminal means that path is a stored word; a prefix can pass the first and fail the second.",
      "zh": "两个测试回答不同问题：complete 表示整条路径存在，terminal 表示该路径是已存单词；前缀可以通过第一个却失败于第二个。"
    },
    {
      "en": "exists starts true and is cleared only when a missing edge is created; that flag prevents marking a pre-existing duplicate as a new word.",
      "zh": "exists 初值为 true，只有创建缺失边时才清零；这个标志防止把已存在的重复词当成新词。"
    },
    {
      "en": "Terminal is set after the whole loop, so the same assignment covers a new suffix and an existing prefix that had no complete word at its end.",
      "zh": "terminal 在整段循环结束后才置位，因此同一条赋值既覆盖新建后缀，也覆盖末端尚未成词的已有前缀。"
    },
    {
      "en": "This write assumes depth is below MAX_WORD_LENGTH; insert_word never enforces the length limit, so a longer word would make the demo buffer overflow.",
      "zh": "这次写入假设 depth 小于 MAX_WORD_LENGTH；insert_word 从不校验长度限制，更长的单词会让演示缓冲区越界。"
    },
    {
      "en": "depth > 0 skips the root; otherwise a terminal mark on the root, which represents the empty prefix, would print an empty line as a word.",
      "zh": "depth > 0 跳过根结点；否则根上的 terminal 标记会把空前缀当成一个单词打印成空行。"
    }
  ],
  "key_tree.cpp": [
    {
      "en": "A std::map keyed by char makes each sibling edge unique by construction; no separate scan over 26 slots is needed.",
      "zh": "用 char 作键的 std::map 让每个兄弟边按构造唯一；不需要再扫描 26 个槽。"
    },
    {
      "en": "last always points at a real node, including the root when the first edge is missing; matched stops at the first absent edge or at the end of the string.",
      "zh": "last 总指向真实结点，包括首边缺失时的根；matched 在第一条缺失边或字符串末尾停止。"
    },
    {
      "en": "A failed find breaks the walk without modifying last; a successful find moves both the node and matched exactly one character forward.",
      "zh": "find 失败时直接退出且不修改 last；成功时 node 与 matched 都恰好前进一个字符。"
    },
    {
      "en": "The full-length test and terminal test are separate; a word that is only a prefix must fail even though walk visited its last character.",
      "zh": "整长检查与 terminal 检查彼此独立；只作为前缀的词即使走完最后字符也必须失败。"
    },
    {
      "en": "completePath starts true and is cleared on the first missing edge; a pre-existing path with terminal already set is the only duplicate case.",
      "zh": "completePath 初值为 true，遇到第一条缺失边就清零；只有整条路径已存在且 terminal 已置位才是重复。"
    },
    {
      "en": "Only a missing edge allocates; an existing prefix is reused, so inserting cargo after car extends the shared path instead of creating a new root branch.",
      "zh": "只有缺失边才分配结点；已有前缀会被复用，因此在 car 之后插入 cargo 会扩展现有路径，而不是新建根分支。"
    },
    {
      "en": "Prefix is passed by value, so each recursive branch owns its own string; map iteration order then yields lexicographic output.",
      "zh": "前缀按值传递，每个递归分支拥有自己的字符串；map 的迭代顺序随后产生字典序输出。"
    },
    {
      "en": "A new string is built for every edge; this is simple but costs O(length) per node, a limitation of the teaching version rather than a tuned dictionary.",
      "zh": "每条边都会构造新字符串；写法简单，但每个结点有 O(长度) 的复制成本，这是教学版本的局限而非优化词典。"
    }
  ],
  "key_tree.py": [
    {
      "en": "children is a dict, so edge existence is a hash lookup; dictionary() sorts the result because dict insertion order is not the curriculum's ordering guarantee.",
      "zh": "children 是字典，边是否存在靠哈希查找；dictionary() 会对结果排序，因为字典插入顺序不是本课程承诺的顺序。"
    },
    {
      "en": "The while condition checks both stopping reasons at once: the word ends, or the next character has no edge in the current node.",
      "zh": "while 条件一次检查两个停止原因：单词结束，或下一个字符在当前结点没有边。"
    },
    {
      "en": "Membership is tested before indexing, so a missing edge ends the walk without a KeyError; matched is left at the last successful prefix length.",
      "zh": "先测试成员再索引，缺失边会结束遍历而不会抛 KeyError；matched 停在最后一个成功前缀长度。"
    },
    {
      "en": "The tuple return separates the hit flag from progress; callers can still inspect matched when the word is absent.",
      "zh": "元组返回把命中标志与进度分开；单词不存在时调用方仍能查看 matched。"
    },
    {
      "en": "The loop creates nodes only after a missing edge is observed; an existing prefix therefore stays untouched until the final terminal assignment.",
      "zh": "循环只在发现缺失边后才创建结点；已有前缀在最终 terminal 赋值前保持不变。"
    },
    {
      "en": "get returns None for a missing edge without raising; the newly created child is published into the parent dict before the walk advances.",
      "zh": "get 对缺失边返回 None 而不抛异常；新建孩子先发布到父字典，遍历才继续前进。"
    },
    {
      "en": "An explicit stack avoids the recursion-depth limit; pushing children in reverse sorted order makes pop visit them in ascending order.",
      "zh": "显式栈避免递归深度限制；按排序逆序压入孩子，弹出时就会按升序访问。"
    },
    {
      "en": "reverse=True is paired with stack LIFO: the smallest letter is pushed last and therefore popped first, so the emitted words stay sorted.",
      "zh": "reverse=True 与栈后进先出配套：最小字母最后压入，因而最先弹出，输出单词保持有序。"
    }
  ],
  "linear_search.c": [
    {
      "en": "Linear search has no ordering precondition: every position remains a candidate until the loop either matches or exhausts the array.",
      "zh": "线性查找没有排序前提：在循环命中或扫描完数组之前，每个位置都仍是候选。"
    },
    {
      "en": "The bound is count, not count - 1: index runs 0..count-1, so the loop never reads the position just after the last valid element.",
      "zh": "循环上界是 count 而不是 count-1：index 取 0..count-1，循环因此不会读到最后一个有效位置之后。"
    },
    {
      "en": "Returning immediately makes the duplicate policy visible: this implementation reports the lowest matching index, not any matching index.",
      "zh": "立即返回体现了重复键策略：这个实现给出最小的匹配下标，而不是任意一个匹配下标。"
    },
    {
      "en": "-1 lies outside every valid index, so a real match at index 0 is never confused with the failure value.",
      "zh": "-1 不属于任何有效下标，因此真实命中下标 0 不会与失败值混淆。"
    },
    {
      "en": "sizeof is applied to the array itself, not to a pointer; after an array parameter decays to a pointer this element-count idiom would be wrong.",
      "zh": "sizeof 作用在数组本身而不是指针上；数组参数退化为指针后，这种求元素个数的写法就会出错。"
    }
  ],
  "linear_search.cpp": [
    {
      "en": "The vector carries its size, so this version needs no separate count and has no pointer-decay pitfall.",
      "zh": "vector 自带长度，因此这个版本不需要额外 count，也没有数组退化为指针的陷阱。"
    },
    {
      "en": "size_t is the container's native index type; an empty vector makes the loop body execute zero times without a special case.",
      "zh": "size_t 是容器原生的下标类型；空 vector 会让循环体执行零次，不需要额外特判。"
    },
    {
      "en": "Strict equality is the only match test; the first hit is returned before any later duplicate can be examined.",
      "zh": "只有严格相等才算命中；第一个命中在检查后续重复元素之前就返回。"
    },
    {
      "en": "The cast narrows size_t to the function's int contract; a vector larger than INT_MAX would need a wider return type.",
      "zh": "这个强制转换把 size_t 收窄到函数的 int 契约；超过 INT_MAX 的 vector 需要更宽的返回类型。"
    },
    {
      "en": "The fall-through return is reached only after every index failed, so -1 is a proof of absence rather than an initial guess.",
      "zh": "循环自然结束后的返回只会在所有下标都失败后到达，因此 -1 是“不存在”的证明，不是初始猜测。"
    }
  ],
  "linear_search.py": [
    {
      "en": "A Python list also carries its length, so the scan is expressed by iteration rather than a separately supplied count.",
      "zh": "Python 列表同样自带长度，因此扫描用迭代表达，不需要额外传入 count。"
    },
    {
      "en": "enumerate supplies both the index and the value, so the body never indexes the list a second time.",
      "zh": "enumerate 同时提供下标和值，循环体因此不需要再次索引列表。"
    },
    {
      "en": "The first equal value wins; later duplicates are unreachable because the return exits the loop immediately.",
      "zh": "第一个相等值获胜；后续重复值不可达，因为 return 立即退出循环。"
    },
    {
      "en": "Reaching this line means the iterator was exhausted, which is exactly the condition that proves absence.",
      "zh": "执行到这一行说明迭代器已经耗尽，这正是证明目标不存在的条件。"
    },
    {
      "en": "The assertion pins the miss contract independently of the printed output, so a later refactor cannot silently change -1 to None.",
      "zh": "断言独立于打印输出固定了未命中契约，后续重构不能悄悄把 -1 改成 None。"
    }
  ],
  "shell_sort.c": [
    {
      "en": "Shell sort is a sequence of insertion sorts on interleaved subsequences; it is not a stable sort because earlier gap passes can move equal keys past each other.",
      "zh": "希尔排序是对交错子序列做一系列插入排序；它不是稳定排序，因为较早的 gap 轮次可能让相等键互相越过。"
    },
    {
      "en": "gap starts at n/2 and is halved; integer division eventually reaches 1 and then 0, so the loop terminates and always includes the crucial gap-1 pass.",
      "zh": "gap 从 n/2 开始折半；整数除法最终到 1 再到 0，因此循环终止，并且一定包含关键的 gap=1 轮。"
    },
    {
      "en": "For a fixed gap, start enumerates one element from each residue class; values[start-gap], values[start], ... form the subsequence being inserted into.",
      "zh": "固定 gap 时，start 依次枚举每个同余类的一个元素；values[start-gap], values[start]... 构成待插入的子序列。"
    },
    {
      "en": "key is saved because the gapped shift writes values[start] and then values[start-gap], moving the hole left by gap each time.",
      "zh": "key 必须先保存，因为跨步搬移会写入 values[start]，再写入 values[start-gap]，空位每次左移 gap。"
    },
    {
      "en": "The position >= gap guard keeps position-gap a valid index; the strict > stops at equal keys within this pass, but that does not make the whole algorithm stable.",
      "zh": "position >= gap 保证 position-gap 是有效下标；严格 > 在本趟内遇到相等键会停止，但这不使整个算法稳定。"
    },
    {
      "en": "The hole moves by exactly one gap, not one slot; this is what keeps the insertion inside the same residue class.",
      "zh": "空位每次恰好移动一个 gap，而不是一格；这正是插入始终停留在同一同余类内的原因。"
    }
  ],
  "shell_sort.cpp": [
    {
      "en": "The gaps are generated from the vector's size, so an empty or one-element vector never enters a pass and is already sorted.",
      "zh": "gap 由 vector 长度生成，因此空 vector 或单元素 vector 不会进入任何轮次，本身已有序。"
    },
    {
      "en": "size_t division by 2 is safe and eventually reaches zero; gap always passes through 1 before the loop ends, which is required for a correct final order.",
      "zh": "size_t 除以 2 安全且最终到 0；循环结束前 gap 一定经过 1，这是最终顺序正确的必要条件。"
    },
    {
      "en": "index starts at gap so index-gap is valid; each residue class is processed by a separate starting offset as index advances.",
      "zh": "index 从 gap 开始，保证 index-gap 有效；随着 index 前进，每个同余类由不同起始偏移分别处理。"
    },
    {
      "en": "current is the element inserted into its gap-separated group; it must survive the first write to values[index].",
      "zh": "current 是插入其跨步子序列的元素；它必须在第一次写入 values[index] 后仍然可用。"
    },
    {
      "en": "position >= gap is an unsigned-safe guard: position is never decremented below gap, so position-gap cannot underflow.",
      "zh": "position >= gap 是无符号安全的守卫：position 从不会减到 gap 以下，因此 position-gap 不会下溢。"
    },
    {
      "en": "Each assignment shifts one value by exactly gap slots; the gap-sized hole then moves left, so no swap temp is needed.",
      "zh": "每次赋值把值恰好移动 gap 个槽；空位随后左移 gap，因此不需要交换临时变量。"
    },
    {
      "en": "The final write fills the gap-sized hole; when gap becomes 1 this is the ordinary insertion step and leaves the whole vector sorted.",
      "zh": "最后一次写入填补 gap 大小的空位；当 gap 变成 1 时，这就是普通插入步骤，并使整个 vector 有序。"
    }
  ],
  "shell_sort.py": [
    {
      "en": "The sort mutates the input list in place and returns None; the gap sequence is derived from len(values), so no count parameter is needed.",
      "zh": "排序原地修改输入列表并返回 None；gap 序列由 len(values) 推导，因此不需要 count 参数。"
    },
    {
      "en": "Integer division gives the first gap; the loop below must eventually reach 1, because an odd or even length both shrink to 1 before 0.",
      "zh": "整数除法给出第一个 gap；下面的循环最终一定到达 1，因为奇偶长度都会先缩到 1 再到 0。"
    },
    {
      "en": "The outer condition is the termination proof: each iteration divides gap by 2, so a positive finite start reaches 0 after finitely many passes.",
      "zh": "外层条件是终止性证明：每轮把 gap 除以 2，有限正初值经过有限轮后一定到 0。"
    },
    {
      "en": "The first index is gap, so values[index-gap] is readable; this walks each residue class from its first two members onward.",
      "zh": "首个 index 是 gap，因此 values[index-gap] 可读；这从每个同余类的前两个成员开始处理。"
    },
    {
      "en": "current is the value being placed into the gap-separated sequence; saving it prevents the first shift from destroying it.",
      "zh": "current 是待放入跨步子序列的值；保存它可以防止第一次搬移把它破坏。"
    },
    {
      "en": "The guard guarantees the neighbour index is non-negative; the strict > keeps equal keys in place only within this pass, not globally.",
      "zh": "守卫保证邻居下标非负；严格 > 只在本趟内让相等键保持原位，而不是全局稳定。"
    },
    {
      "en": "After the pass, gap is halved; when it finally becomes 1 the sort performs ordinary insertion sort and establishes the final total order.",
      "zh": "本趟结束后 gap 折半；当它最终变成 1 时，排序执行普通插入排序并建立最终全序。"
    }
  ]
};
