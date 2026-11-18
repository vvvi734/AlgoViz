import type { Lesson } from './types';

/**
 * T2 AVL course. Step ids are exactly the `lesson_step=` values emitted by
 * AVL_PYTHON, so the rail highlights a real frame and never guesses from a
 * message:
 *   init / compare / direction / insert / height / imbalance / rotate-left /
 *   rotate-right / duplicate / delete-locate / delete-leaf / delete-one /
 *   successor / successor-detach / transplant / not-found / done.
 */
export const avlLesson: Lesson = {
  lessonId: 'avl-balanced-binary-search-tree',
  algorithmId: 'avl',
  contentVersion: '1.0.0',
  title: { zh: 'AVL 平衡二叉搜索树：插入、删除与四种旋转', en: 'AVL balanced BST: insert, delete and four rotations' },
  oneLiner: {
    zh: 'AVL 在 BST 的“左小右大”之上再加“每个节点左右子树高度差不超过 1”；插入或删除破坏平衡时，用 LL/RR/LR/RL 四种真实旋转把树拉回来。',
    en: 'AVL adds one rule to the BST ordering: every node’s left/right subtree heights may differ by at most 1. When insert or delete breaks it, LL/RR/LR/RL rotations restore balance with real pointer changes.',
  },
  overview: {
    zh: '普通 BST 的查找、插入、删除都沿一条路径走，平均 O(log n)；但如果按 1,2,3… 升序插入，每个新键都挂到最右边，树退化成一条链，高度变成 n，三个操作都退化为 O(n)。AVL 树在每个节点保存真实子树高度，并把平衡因子定义为 height(left) − height(right)，要求每个节点的平衡因子只能是 −1、0、1。插入后从新节点的父节点向上更新高度并检查平衡；一旦某个祖先的平衡因子变成 ±2，就根据“失衡节点—较高孩子—较高孙子”的方向分成 LL、RR、LR、RL：外侧失衡用一次单旋，内侧失衡用两次方向相反的单旋。删除先按 BST 规则摘除目标，再从受影响位置向上更新高度并重新平衡；一次删除可能让多个祖先连续失衡，因此平衡检查必须继续向上，不能修好一个节点就停。四种旋转都提供独立官方预设；双旋会发出两组 before/after 帧，展示两个真实的连续操作，而不是直接画最终树。',
    en: 'Ordinary BST search, insert and delete follow one path and are O(log n) on average; but inserting 1,2,3… in ascending order hangs every key on the right, degenerating into a chain of height n and making all three operations O(n). An AVL tree stores a real subtree height at every node and defines balance factor as height(left) − height(right), requiring every node to stay in {−1, 0, 1}. After insertion it updates heights from the new node’s parent upward; when an ancestor reaches ±2, the direction of “imbalance node → taller child → taller grandchild” classifies the case as LL, RR, LR or RL. An outside case needs one single rotation; an inside case needs two opposite single rotations. Delete first removes the target by BST rules, then updates heights and rebalances upward from the affected position; one delete can unbalance several ancestors, so the check must continue rather than stopping after the first repair. Each of the four rotations has its own official preset; double rotations emit two real before/after pairs instead of only drawing the final tree.',
  },
  intuition: {
    zh: '把 BST 想成一根可以长高的天平：每次插入或删除都可能让某一侧的子树变高，天平就向那边倾斜。AVL 的做法不是等整棵树歪掉再重建，而是在每个节点上记一个“身高差”，只允许差 1。发现某个节点差 2 时，抓住“歪的那条链”的顶端做一次局部手术：如果歪在左边外侧（LL），把左孩子提上来（右旋）；歪在右边外侧（RR），把右孩子提上来（左旋）；如果歪在左边内侧（LR），先让左孩子的右孩子上来（左旋），再把新的左孩子提上来（右旋）；RL 则完全镜像。旋转只改常数条指针，整棵子树的中序顺序不变，所以 BST 性质仍然成立。双旋不是“两个动画”，而是两次真实的 Python 指针操作，中间那一帧的树形也必须能被回退和跳帧正确恢复。',
    en: 'Think of a BST as a balance scale that can grow: every insert or delete may raise one side’s subtree, tilting the node. AVL does not wait for the whole tree to collapse; it stores a height difference at every node and allows only 1. At a node with difference 2, it operates locally on the top of the tilted chain: a left-outside tilt (LL) promotes the left child with a right rotation; a right-outside tilt (RR) promotes the right child with a left rotation; a left-inside tilt (LR) first promotes the left child’s right child with a left rotation, then promotes the new left child with a right rotation; RL is the mirror image. Rotations change only a constant number of pointers and preserve in-order order, so the BST property survives. A double rotation is not one animation: it is two real Python pointer operations, and the intermediate tree must be restored correctly when scrubbing backward or jumping frames.',
  },
  prerequisites: {
    zh: ['理解 BST 的左小右大与中序遍历', '知道二叉树高度、叶子高度为 1', '理解 Python 对象引用与 left/right/parent 指针'],
    en: ['BST ordering and in-order traversal', 'Binary-tree height, with a leaf height of 1', 'Python object references and left/right/parent pointers'],
  },
  complexity: {
    time: 'O(log n)',
    space: 'O(n)',
    note: {
      zh: 'AVL 的平衡条件保证树高 h = O(log n)，因此查找、插入、删除都沿 O(log n) 层路径走，旋转本身只改常数条指针，总时间 O(log n)。每个节点额外保存一个整数高度，空间 O(n)；递归/迭代辅助栈为 O(h)=O(log n)。与普通 BST 的平均 O(log n) 不同，AVL 的最坏情况也被限制在 O(log n)，代价是插入/删除后要向上更新高度并可能旋转，常数更大。n 是节点数，h 是树高。',
      en: 'The AVL balance condition bounds height at h = O(log n), so search, insert and delete follow O(log n) levels; a rotation itself changes only a constant number of pointers, giving O(log n) total. Each node stores one integer height, so space is O(n); the recursion/iteration stack is O(h)=O(log n). Unlike an ordinary BST’s average O(log n), AVL also guarantees the worst case, paying for upward height updates and possible rotations with a larger constant. Here n is node count and h is tree height.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① AVL 与普通 BST 的区别', en: '① AVL versus an ordinary BST' },
      explanation: {
        zh: '初始化帧显示的是一棵已经满足 AVL 条件的真实树：每个节点都有稳定编号（a1、a2…）、真实 value、left/right 引用和真实 height。与普通 BST 相比，AVL 多存一个高度字段，并要求每个节点的 |height(left) − height(right)| ≤ 1。普通 BST 只保证中序有序，不限制形状；按升序插入会得到一条右链，高度 n。AVL 在每次结构变化后主动恢复平衡，所以树高始终 O(log n)。屏幕上的节点位置只是布局，父子关系只来自 leftId/rightId。',
        en: 'The init frame shows a real tree that already satisfies the AVL condition: every node has a stable id (a1, a2…), a real value, real left/right references and a real height. Compared with an ordinary BST, AVL stores one extra height field and requires |height(left) − height(right)| ≤ 1 at every node. An ordinary BST only guarantees sorted in-order, not shape: ascending inserts produce a right-only chain of height n. AVL actively restores balance after each structural change, keeping height O(log n). On-screen positions are layout only; parent/child relations come exclusively from leftId/rightId.',
      },
      tip: { zh: '先看每个节点下方的 h/BF 徽标：h 是真实子树高度，BF 是左高 − 右高。', en: 'Start with the h/BF badges under each node: h is the real subtree height and BF is left height − right height.' },
    },
    {
      stepId: 'compare',
      title: { zh: '② 插入/删除都先做 BST 式比较', en: '② Insert and delete both start with BST comparisons' },
      explanation: {
        zh: '定位阶段与普通 BST 完全相同：从根开始，每帧只比较目标键与当前节点的 value；目标更小走 left，更大走 right，相等则命中。pathIds 是从根到当前节点的真实路径，visitedIds 是已经比较过的节点。AVL 的比较阶段不更新高度、不旋转，只有结构真正改变后才进入 height/balance 阶段。删除时命中后还要数孩子，决定叶子、单孩子或双孩子。',
        en: 'The location phase is exactly the same as a BST: start at the root, compare the target with one node per frame; smaller goes left, larger goes right, equality hits. pathIds is the real root-to-current path and visitedIds records compared nodes. AVL does not update heights or rotate during comparison; the height/balance phase begins only after a real structural change. For delete, a hit is followed by a child count that decides leaf, one-child or two-child.',
      },
      tip: { zh: '比较路径必须沿真实 left/right 到达 current，不能按画布坐标猜。', en: 'The comparison path must follow real left/right references to current, never canvas coordinates.' },
    },
    {
      stepId: 'direction',
      title: { zh: '③ 目标更小走左，更大走右', en: '③ Smaller goes left, larger goes right' },
      explanation: {
        zh: 'direction 帧记录唯一方向：go-left 的 nextNodeId 必须是 current.left，go-right 必须是 current.right。若对应孩子为 None，就暴露空位；插入会在这里挂新节点，删除/查找则继续走到失败。AVL 不改变 BST 的走向规则，只在插入或删除完成后从受影响位置向上维护高度与平衡。',
        en: 'A direction frame records exactly one choice: go-left’s nextNodeId must be current.left, go-right’s must be current.right. If that child is None, the frame exposes the empty slot; insert attaches there, while delete/search continues to failure. AVL does not change BST routing; it only maintains heights and balance upward from the affected position after the structural change.',
      },
      tip: { zh: '方向帧不会同时走两边，也不会跳过中间层。', en: 'A direction frame never takes both branches or skips a level.' },
    },
    {
      stepId: 'insert',
      title: { zh: '④ 插入：挂上新节点，保留稳定编号', en: '④ Insert: attach a new node with a stable id' },
      explanation: {
        zh: '找到空位后，Python 真实创建 AvlNode(target)，再执行 parent.left = node 或 parent.right = node；空树时 ROOT = node。attach 帧记录 insertedId、parentId、side，父节点的 left/right 必须真实指向新节点。新节点初始高度为 1，编号新分配，旧节点编号不变。此时树可能暂时不平衡，下一阶段会从父节点向上更新高度并检测。',
        en: 'After finding an empty slot, Python really creates AvlNode(target) and runs parent.left = node or parent.right = node; for an empty tree it runs ROOT = node. The attach frame records insertedId, parentId and side, and the parent’s left/right must really point at the new node. The new node starts at height 1, gets a fresh id and leaves existing ids unchanged. The tree may be temporarily unbalanced now; the next phase updates heights upward from the parent and checks balance.',
      },
      tip: { zh: '插入只改一个父指针（或根），不要重排整棵树。', en: 'Insert changes one parent pointer (or the root), not the whole tree.' },
    },
    {
      stepId: 'height',
      title: { zh: '⑤ 高度更新与平衡因子', en: '⑤ Height update and balance factor' },
      explanation: {
        zh: '每次结构变化后，从受影响节点向上重新计算：height(node) = 1 + max(height(left), height(right))，空子树高度为 0；balance = height(left) − height(right)。height 帧（插入）或 balance 帧（删除）逐层显示真实高度与 BF。注意高度是子树真实高度，不是节点深度，也不是画布上的 y 坐标。叶子高度为 1，BF 为 0；单孩子节点 BF 为 ±1。',
        en: 'After every structural change, heights are recomputed upward from the affected node: height(node) = 1 + max(height(left), height(right)), with an empty subtree at 0; balance = height(left) − height(right). Height frames (insert) or balance frames (delete) show the real height and BF layer by layer. Height is the real subtree height, not node depth and not a canvas y coordinate. A leaf has height 1 and BF 0; a one-child node has BF ±1.',
      },
      tip: { zh: 'BF = 左子树高度 − 右子树高度；正数左高，负数右高。', en: 'BF = left subtree height − right subtree height; positive means left-heavy, negative means right-heavy.' },
    },
    {
      stepId: 'imbalance',
      title: { zh: '⑥ 失衡检测：|BF| > 1', en: '⑥ Imbalance detection: |BF| > 1' },
      explanation: {
        zh: '从插入/删除位置向上，只要遇到 |balance| > 1 就发出 imbalance 帧，imbalanceId 指向这个祖先。分类看“失衡节点 → 较高孩子 → 较高孙子”的方向：LL 是左孩子的左子树更高，RR 是右孩子的右子树更高，LR 是左孩子的右子树更高，RL 是右孩子的左子树更高。四种情况对应四种旋转组合；双旋的总步数为 2，单旋为 1。检测必须继续向上，因为一次删除可能让多个祖先连续失衡。',
        en: 'Walking upward from the insertion/deletion position, the first node with |balance| > 1 emits an imbalance frame, with imbalanceId pointing at that ancestor. Classification follows “imbalance node → taller child → taller grandchild”: LL means the left child’s left subtree is taller, RR the right child’s right subtree, LR the left child’s right subtree, RL the right child’s left subtree. The four cases map to four rotation combinations; a double rotation records total 2 and a single rotation total 1. Detection must continue upward because one delete can unbalance several ancestors.',
      },
      tip: { zh: '记忆：两个字母依次表示“孩子方向 + 孙子方向”，第二个字母决定先旋哪边。', en: 'Mnemonic: the two letters are child direction + grandchild direction; the second letter decides which side rotates first.' },
    },
    {
      stepId: 'rotate-right',
      title: { zh: '⑦ 右旋：LL 的单旋，也是 LR 的第二步、RL 的第一步', en: '⑦ Right rotation: LL’s single rotation, LR’s second step and RL’s first step' },
      explanation: {
        zh: '右旋以失衡节点 x 为轴，让它的左孩子 y 上升：y 接管 x 原来的父指针位置，x 变成 y.right，y 原来的右子树 β 挂到 x.left。Python 先真实修改 parent/left/right，再发出 after 帧；before 帧的 pivot=x、promoted=y 与 after 帧的父子关系必须能对应上。LL 只做一次右旋；LR 先对 x.left 左旋，再对 x 右旋，所以会看到两组 before/after；RL 的第一步正是对 x.right 右旋，第二步才是对 x 左旋。双旋不是只画最终树，旋转也保持中序顺序，不复制或重排键值。',
        en: 'A right rotation pivots on the imbalance node x and promotes its left child y: y takes x’s old parent link, x becomes y.right, and y’s old right subtree β is reattached as x.left. Python really changes parent/left/right first, then emits the after frame; the before frame’s pivot=x and promoted=y must match the after frame’s parent/child relations. LL needs one right rotation; LR first left-rotates x.left, then right-rotates x, so two before/after pairs appear; RL’s first step is exactly a right rotation on x.right, followed by a left rotation on x. A double rotation is never just the final tree; rotations preserve in-order order and never copy or reorder keys.',
      },
      tip: { zh: 'LL 记忆“左左 → 右旋”；右旋后原来的左孩子成为子树新根。', en: 'LL mnemonic “left-left → rotate right”; the old left child becomes the subtree’s new root.' },
    },
    {
      stepId: 'rotate-left',
      title: { zh: '⑧ 左旋：RR 的单旋，也是 RL 的第二步、LR 的第一步', en: '⑧ Left rotation: RR’s single rotation, RL’s second step and LR’s first step' },
      explanation: {
        zh: '左旋以失衡节点 x 为轴，让它的右孩子 y 上升：y 接管 x 原来的父指针位置，x 变成 y.left，y 原来的左子树 β 挂到 x.right。RR 只做一次左旋；RL 先对 x.right 右旋，再对 x 左旋，所以第二段是左旋；LR 的第一步正是对 x.left 左旋，第二步才是对 x 右旋。两种双旋都有两组真实 before/after，不能用最终树代替中间状态。旋转后要更新 x 与 y 的高度，再继续向上检查祖先。若旋转改变了根，rootId 必须同步变化，回退/跳帧时也要恢复正确。',
        en: 'A left rotation pivots on the imbalance node x and promotes its right child y: y takes x’s old parent link, x becomes y.left, and y’s old left subtree β is reattached as x.right. RR needs one left rotation; RL first right-rotates x.right, then left-rotates x, so its second step is this left rotation; LR’s first step is exactly a left rotation on x.left, followed by a right rotation on x. Both double rotations have two real before/after pairs, never only the final tree. After rotating, update x and y heights, then continue checking ancestors. If the rotation changes the root, rootId must change with it and be restored correctly when scrubbing backward or jumping frames.',
      },
      tip: { zh: 'RR 记忆“右右 → 左旋”；RL 是“右旋再左旋”，别只做一半。', en: 'RR mnemonic “right-right → rotate left”; RL is “right then left”, never only half.' },
    },
    {
      stepId: 'duplicate',
      title: { zh: '⑨ 重复键：明确拒绝，树不变', en: '⑨ Duplicate keys: explicitly rejected, tree unchanged' },
      explanation: {
        zh: '官方 AVL 示例采用唯一键。插入先走 BST 比较；若命中已有值，发出 duplicate 帧，result=duplicate，insertedId 为空，节点数、高度和所有指针保持不变。不会覆盖旧值，也不会把重复键挂到某一侧破坏中序严格递增。若产品需要重复键，必须另行定义稳定策略（例如计数或固定方向），不能在这里含糊。',
        en: 'The official AVL examples use unique keys. Insert first follows BST comparisons; on an existing value it emits duplicate, sets result=duplicate, leaves insertedId empty and changes neither node count, heights nor pointers. It never overwrites the old value or hangs a duplicate on one side, which would break strictly increasing in-order. A product that wants duplicates must define a stable policy (such as a count or fixed direction) rather than being vague here.',
      },
      tip: { zh: '重复键不是“插入成功但看不见”，而是明确拒绝。', en: 'A duplicate is not an invisible successful insert; it is an explicit rejection.' },
    },
    {
      stepId: 'delete-locate',
      title: { zh: '⑩ 删除：定位目标，数孩子', en: '⑩ Delete: locate the target and count children' },
      explanation: {
        zh: '删除先用真实比较路径定位目标，发出 locate 帧，targetNodeId 指向它。随后真实检查 target.left 与 target.right，把孩子数量分成 0、1、2 三种情况。分类必须来自对象本身，不能靠画布位置；叶子、单孩子、双孩子的指针操作完全不同。删除完成后从受影响父节点向上更新高度并重新平衡。',
        en: 'Delete first locates the target through the real comparison path and emits locate with targetNodeId pointing at it. It then inspects target.left and target.right and classifies 0, 1 or 2 children. Classification must come from the object, never canvas position; leaf, one-child and two-child pointer operations are completely different. After removal, heights are updated and balance is restored upward from the affected parent.',
      },
      tip: { zh: '删除前必须知道目标是叶子、单孩子还是双孩子。', en: 'Before deleting, know whether the target is a leaf, one-child or two-child node.' },
    },
    {
      stepId: 'delete-leaf',
      title: { zh: '⑪ 删除叶子：父指针置空，再向上平衡', en: '⑪ Delete a leaf: clear the parent pointer, then rebalance upward' },
      explanation: {
        zh: '叶子没有孩子，删除只需把父节点对应方向设为 None：parent.left = None 或 parent.right = None；若目标是根，ROOT 变为 None。delete-leaf 帧的 removedNode 记录目标编号、父编号、side 与 replacementId=null，目标不再出现在 nodes 中。随后从父节点开始更新高度；本预设会立刻让根出现 LL 失衡并触发右旋，说明“删除叶子也可能需要旋转”，不能删完就结束。',
        en: 'A leaf has no child, so deletion only clears the parent’s corresponding link: parent.left = None or parent.right = None; if it is the root, ROOT becomes None. The delete-leaf frame’s removedNode records the target id, parent id, side and replacementId=null; the target disappears from nodes. Heights then update from the parent; this preset immediately makes the root LL-heavy and triggers a right rotation, showing that even a leaf delete may rotate rather than stopping after removal.',
      },
      tip: { zh: '叶子删除不能让父节点仍指向已摘除对象（悬空引用）。', en: 'A leaf delete must not leave its parent pointing at a detached object (a dangling reference).' },
    },
    {
      stepId: 'delete-one',
      title: { zh: '⑫ 删除单孩子：孩子接替位置', en: '⑫ Delete a one-child node: the child takes its place' },
      explanation: {
        zh: '目标只有一个孩子时，让孩子直接接到目标的父节点：parent.left = child 或 parent.right = child；目标若是根，ROOT = child，child 没有父节点。delete-one 帧记录 removedNode.replacementId 为孩子，孩子仍在树中，目标被摘除。先接好孩子再断开目标，任何中间帧都不能出现悬空引用；随后从孩子的父节点向上重新平衡。',
        en: 'When the target has exactly one child, connect that child to the target’s parent: parent.left = child or parent.right = child; if the target is the root, ROOT = child and the child has no parent. The delete-one frame records removedNode.replacementId as that child, which stays attached while the target is detached. Reconnect the child before detaching the target so no intermediate frame has a dangling reference; then rebalance upward from the child’s parent.',
      },
      tip: { zh: '单孩子删除改的是“父 → 孩子”，不是“目标 → 孩子”。', en: 'A one-child delete rewires parent → child, not target → child.' },
    },
    {
      stepId: 'successor',
      title: { zh: '⑬ 双孩子：寻找中序后继', en: '⑬ Two children: find the in-order successor' },
      explanation: {
        zh: '目标有两个孩子时，中序后继是右子树中最小的节点：从 target.right 出发一路向左走到底，后继没有左孩子。successor-search 帧真实走这条左路径，successor-found 帧把 successorId 指向它。后继的值大于目标左子树全部节点、小于右子树其余节点，因此搬到目标位置后仍满足 BST 性质。本实现采用“物理移植后继对象”，不是复制后继值后删除原后继。',
        en: 'With two children, the in-order successor is the smallest node in the right subtree: start at target.right and follow left to the end; it has no left child. successor-search frames walk that real left path, and successor-found points successorId at it. Its value is larger than every node in the target’s left subtree and smaller than the rest of the right subtree, so transplanting it preserves BST order. This implementation physically transplants the successor object; it does not copy a value and then delete the successor.',
      },
      tip: { zh: '后继来自右子树的最左节点，不是任意右孩子。', en: 'The successor is the left-most node of the right subtree, not any right child.' },
    },
    {
      stepId: 'successor-detach',
      title: { zh: '⑭ 后继离开原位置：先接回它的右孩子', en: '⑭ The successor leaves: reconnect its right child first' },
      explanation: {
        zh: '中序后继没有左孩子，但可能有右孩子。successor-detach 帧真实执行 successor_parent.left = successor.right（或对应方向），让后继的右孩子接回原位置，后继自身暂时离开树。removedNode.role=successor 记录后继原父节点、side 与 replacementId；此时后继编号不变，下一步会被移植到目标位置。这个中间帧很关键：双孩子删除不是瞬间完成的。',
        en: 'The in-order successor has no left child but may have a right child. The successor-detach frame really runs successor_parent.left = successor.right (or the corresponding link), reconnecting that right child into the old position while the successor temporarily leaves the tree. removedNode.role=successor records its old parent, side and replacementId; its id is unchanged and the next step transplants it into the target position. This intermediate frame matters: a two-child delete is not instantaneous.',
      },
      tip: { zh: '后继原位置的空缺必须由它的右孩子补上，不能悬空。', en: 'The successor’s old slot must be filled by its right child; it cannot be left dangling.' },
    },
    {
      stepId: 'transplant',
      title: { zh: '⑮ 后继接入目标位置，目标真正摘除', en: '⑮ Transplant the successor; the target is truly detached' },
      explanation: {
        zh: '移植帧把后继接到目标的父节点（如果是根则改 ROOT），再让 successor.left = target.left、successor.right = target.right；最后断开目标的 left/right，目标对象离开树。removedNode.role=target 记录目标父节点、side 与 replacementId=后继；如果根变化，oldRootId 与 rootId 同时记录。后继保留自己的编号，所以回退或跳帧时同一个节点不会被伪装成新节点。移植后从后继或它原来的父节点向上更新高度并重新平衡。',
        en: 'The transplant frame connects the successor to the target’s parent (or changes ROOT when the target is root), sets successor.left = target.left and successor.right = target.right, then clears the target’s left/right so the target object leaves the tree. removedNode.role=target records the target’s parent, side and replacementId=successor; when the root changes, oldRootId and rootId are both recorded. The successor keeps its own id, so scrubbing backward never disguises the same node as a new one. After transplanting, heights update and balance is restored from the successor or its old parent upward.',
      },
      tip: { zh: '两个孩子的删除是“移动后继对象”，不是“复制后继值”。', en: 'A two-child delete moves the successor object; it does not copy its value.' },
    },
    {
      stepId: 'not-found',
      title: { zh: '⑯ 删除不存在的键：明确失败，树不变', en: '⑯ Delete a missing key: explicit failure, unchanged tree' },
      explanation: {
        zh: '走到 None 仍未相等时发出 not-found 帧，result=missing，targetNodeId 为空，路径记录最后比较的节点。树的结构、高度与所有指针保持不变。空树删除也走这里，rootId 仍为 null。失败不是异常崩溃，而是一条真实走到底的比较路径加一个明确的空孩子；不能为了“看起来有结果”伪造一个目标节点。',
        en: 'Reaching None without equality emits not-found, sets result=missing, leaves targetNodeId empty and records the last compared node in the path. Tree structure, heights and all pointers stay unchanged. Deleting from an empty tree also takes this route with rootId null. Failure is not a crash: it is a real comparison path ending at an explicit missing child. Never fabricate a target node to make the result look complete.',
      },
      tip: { zh: '失败也要能指出最后比较了谁、在哪个方向遇到空位。', en: 'Failure must still show the last compared node and the direction whose child was missing.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑰ 复杂度、常见错误与记忆方法', en: '⑰ Complexity, common mistakes and mnemonics' },
      explanation: {
        zh: '完成帧给出 result 与最终树：插入 inserted/duplicate；删除 deleted/missing。所有帧的中序必须严格递增，节点高度必须等于真实子树高度，BF 必须等于左高 − 右高，init/done 必须满足 |BF| ≤ 1；旋转中间帧允许暂时超限，但 after 帧必须反映真实指针重连。AVL 的查找、插入、删除都是 O(log n)，空间 O(n)。常见错误：把节点深度当高度、用画布位置算 BF、只修一个祖先就停止、双旋只做一次、旋转只改图形不改 Python 指针、复制后继值后忘记摘除后继、删除后不更新高度、以及认为 AVL 永远不会退化。记忆：LL→右旋，RR→左旋，LR→左旋再右旋，RL→右旋再左旋；第二个字母就是“先旋哪边”。',
        en: 'The done frame reports the result and final tree: insert gives inserted/duplicate; delete gives deleted/missing. Every frame’s in-order must be strictly increasing, node height must equal the real subtree height, BF must equal left height − right height, and init/done must satisfy |BF| ≤ 1; rotation intermediates may temporarily exceed it, but after frames must show real pointer rewiring. AVL search, insert and delete are O(log n), with O(n) space. Common mistakes: confusing node depth with height, computing BF from canvas positions, stopping after repairing one ancestor, performing only half of a double rotation, changing only the drawing instead of Python pointers, copying a successor value and forgetting to detach the successor, skipping height updates after delete, and assuming AVL can never degenerate. Mnemonic: LL→right, RR→left, LR→left then right, RL→right then left; the second letter tells which side rotates first.',
      },
      tip: { zh: '判断旋转是否正确：看 before/after 的 pivot、promoted 与真实父子指针，不要只看最终树形。', en: 'To judge a rotation, check pivot, promoted and real parent/child pointers in before/after frames, not only the final tree.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把节点深度当成“高度”，导致 BF 计算错误。',
      '从画布 y 坐标或节点位置计算高度差，而不是从 left/right 子树计算。',
      '只修复第一个失衡祖先就停止，忽略一次删除可能引发的多层连续失衡。',
      '双旋只做一次单旋，或只画最终树形而没有两个真实中间状态。',
      '旋转时只移动 SVG 图形，没有先发生 Python left/right/parent 指针变化。',
      'LL/RR/LR/RL 分类看错“较高孩子/较高孙子”的方向。',
      '双孩子删除复制后继值后忘记摘除后继，或丢掉后继的右孩子。',
      '删除叶子/单孩子后不向上更新高度，误以为删除不影响平衡。',
      '认为 AVL 的查找、插入、删除最坏也是 O(log n) 却不理解平衡条件如何保证树高。',
    ],
    en: [
      'Treating node depth as height, which corrupts the BF calculation.',
      'Computing height difference from canvas y positions instead of left/right subtrees.',
      'Stopping after repairing the first unbalanced ancestor, ignoring cascading rebalancing after one delete.',
      'Performing only one rotation of a double rotation, or drawing only the final tree without two real intermediate states.',
      'Moving SVG shapes without first changing real Python left/right/parent pointers.',
      'Misreading the taller child/grandchild direction when classifying LL/RR/LR/RL.',
      'Copying a successor value but forgetting to detach the successor, or dropping its right child.',
      'Skipping upward height updates after deleting a leaf or one-child node, as if delete could not affect balance.',
      'Claiming AVL search/insert/delete are worst-case O(log n) without understanding how the balance condition bounds height.',
    ],
  },
};
