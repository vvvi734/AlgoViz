import type { Lesson } from './types';

/**
 * T1 binary-search-tree course. One course covers all three real operations;
 * each operation still owns its own labelled steps. Step ids are exactly the
 * `lesson_step=` values emitted by `BST_PYTHON`, so a frame is located by the
 * recorded id, never by guessing from its message:
 *   init / compare / direction / found / not-found / duplicate / insert /
 *   delete-locate / delete-leaf / delete-one / successor / successor-detach /
 *   transplant / done.
 * Steps for another operation simply show 0 current-run frames; the rail does
 * not invent links between an operation and a frame it never produced.
 */
export const bstLesson: Lesson = {
  lessonId: 'binary-search-tree-search-insert-delete',
  algorithmId: 'bst',
  contentVersion: '1.0.0',
  title: { zh: '二叉搜索树：查找、插入与三种删除', en: 'Binary search tree: search, insert and three delete cases' },
  oneLiner: {
    zh: 'BST 的每个节点都满足“左子树更小、右子树更大”；查找和插入沿同一条比较路径走，删除则要先数孩子，再用真实指针重连。',
    en: 'Every BST node satisfies “left subtree smaller, right subtree larger”. Search and insert follow one comparison path; delete first counts children, then rewires real pointers.',
  },
  overview: {
    zh: '本课使用一棵真实 Python 二叉搜索树，节点是带稳定教学编号的 TreeNode 对象（b1、b2…）。初始树按输入顺序执行真实插入建成；查找、插入和删除共用一个程序，但走不同分支。查找从根开始，每一帧只比较一个节点：目标更小走 left，更大走 right，相等则命中；路径和已比较节点都来自这次真实执行。插入先找到空位置，再创建新节点并修改父节点的 left/right；官方示例约定键唯一，重复键明确拒绝，树不变。删除必须先定位目标并按孩子数量分类：叶子直接让父指针置空；只有一个孩子时让孩子接替目标位置；有两个孩子时必须在右子树找中序后继。本课的双孩子删除不是“复制后继值再删后继”，而是把后继对象真实移植到目标位置，因此后继保留自己的编号，目标对象被真正摘除；如果目标是根，rootId 也会改变。屏幕上的节点位置只是布局，父子关系只来自结构快照里的 leftId/rightId。',
    en: 'This course runs a real Python binary search tree whose nodes are TreeNode objects with stable teaching ids (b1, b2…). The initial tree is built by real insertions in input order; search, insert and delete share one program but take different branches. Search starts at the root and compares exactly one node per frame: smaller goes left, larger goes right, equality hits. The path and compared ids come from that real run. Insert finds an empty slot, creates a node and changes its parent’s left/right reference; the official examples use unique keys and explicitly reject duplicates without changing the tree. Delete first locates the target and classifies it by child count: a leaf clears its parent pointer; a one-child node is replaced by that child; a two-child node must use the in-order successor from the right subtree. The two-child demo does NOT copy a successor value and then delete the successor. It physically transplants the successor object, so the successor keeps its own id and the target object is truly detached; if the target is the root, rootId changes too. Node positions are only layout: parent/child relations come exclusively from leftId/rightId in the recorded structure.',
  },
  intuition: {
    zh: '把 BST 想成一本按大小排好的字典：每次只翻到当前词条，比目标大就翻左边那一叠，比目标小就翻右边那一叠。插入是走到一个空书架格，把新书放进去，再把上一格的“左/右”标签改成指向它。删除更像拆掉一格书架：没有孩子就直接拿掉；只有一个孩子就把孩子连到上一层；有两个孩子则请右子树里最小的那本（中序后继）搬过来接管这一格，再把它原来的位置接好。所有“拿掉、搬过来、接好”都必须对应 Python 中真实的引用变化，不能只是让方块从屏幕消失。',
    en: 'Think of a BST as a size-ordered dictionary: compare with the current entry, go left when the target is larger, go right when it is smaller. Insert walks to an empty shelf slot, puts the new book there, then changes the previous slot’s left/right label to point at it. Delete is dismantling a shelf slot: with no child, remove it; with one child, connect that child to the upper level; with two children, invite the smallest book in the right subtree (the in-order successor) to take over, then reconnect its old position. Every removal, move and reconnection must match a real Python reference change, never just make a box vanish from the screen.',
  },
  prerequisites: {
    zh: ['知道 Python 的 class、对象引用与 None', '理解二叉树 left/right 指针', '会中序遍历并知道其输出有序'],
    en: ['Python classes, object references and None', 'Binary-tree left/right pointers', 'In-order traversal and its sorted output'],
  },
  complexity: {
    time: '平均 O(log n) · 最坏 O(n)',
    space: 'O(h)',
    note: {
      zh: '查找、插入、删除都只沿一条从根到叶的路径走，比较次数等于路径长度。平均情况下树高 h≈log₂n，所以是 O(log n)；但如果按升序插入 1,2,3…，树会退化成一条只有右孩子的链，h=n，三个操作都变成 O(n)。递归/迭代辅助空间是 O(h)（迭代实现为 O(1)）。删除双孩子还要先找后继，但后继查找也只沿右子树一条左边路径，最坏仍是 O(h)，不改变总复杂度。这里的 n 是节点数，h 是树高。',
      en: 'Search, insert and delete follow only one root-to-leaf path, so comparisons equal path length. On average h≈log₂n, giving O(log n); but inserting 1,2,3… in ascending order degenerates into a right-only chain with h=n, making all three O(n). Auxiliary space is O(h) for recursion (O(1) for an iterative version). The two-child delete also searches for the successor, but that search follows one left-only path in the right subtree, still O(h), so total complexity does not change. Here n is node count and h is tree height.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 用真实插入建出 BST', en: '① Build a BST with real insertions' },
      explanation: {
        zh: '初始化帧已经显示整棵树，但还没有开始比较。节点 b1…b7 是按输入值顺序真实创建并插入的对象：50 成为根 b1，30 挂到 b1.left，70 挂到 b1.right，20/40/60/80 再沿真实引用落位。左小右大的不变量在每次插入后都成立，中序列因此严格递增。节点编号在创建时分配，之后不会因为布局变化而重命名。',
        en: 'The init frame already shows the whole tree, but no comparison has started. Nodes b1…b7 are objects really created and inserted in input order: 50 becomes root b1, 30 becomes b1.left, 70 becomes b1.right, and 20/40/60/80 settle through real references. The left-smaller/right-larger invariant holds after every insertion, so the in-order sequence is strictly increasing. Ids are assigned at creation and never renamed because layout changes.',
      },
      tip: { zh: '屏幕上左右位置只是布局；父子关系只认 leftId/rightId。', en: 'On-screen left/right placement is layout only; parent/child relations come from leftId/rightId.' },
    },
    {
      stepId: 'compare',
      title: { zh: '② 查找：比较当前节点', en: '② Search: compare the current node' },
      explanation: {
        zh: '每个比较帧只处理一个真实节点：current 是当前节点，path 是从根到它的比较路径，visited 记录已经比较过的节点。比较的是目标键与 node.value，不是节点编号。无论是查找、插入还是删除，定位阶段都复用这段真实比较；删除在命中后还要额外确认孩子数量。',
        en: 'Each comparison frame handles exactly one real node: current is the node, path is the root-to-current comparison path, and visited records compared ids. It compares the target key with node.value, not with the node id. Search, insert and delete all reuse this real comparison during location; delete additionally counts children after a hit.',
      },
      tip: { zh: '比较路径必须从根开始，并沿真实 left/right 引用到达 current。', en: 'The comparison path must start at the root and follow real left/right references to current.' },
    },
    {
      stepId: 'direction',
      title: { zh: '③ 小于走左，大于走右', en: '③ Smaller goes left, larger goes right' },
      explanation: {
        zh: '当前节点不相等时，代码根据大小选择唯一方向。go-left 帧的 nextNodeId 必须是 current.left，go-right 必须是 current.right；如果对应孩子是 None，这一帧就明确暴露空位，查找随后失败，插入则在这里准备挂新节点。方向帧不会同时走两边，也不会跳过中间层。',
        en: 'When the current node is not equal, the code chooses exactly one direction from the comparison. A go-left frame’s nextNodeId must be current.left, and go-right must be current.right; if that child is None, the frame exposes the empty slot, so search then fails and insert prepares to attach there. A direction frame never takes both branches or skips a level.',
      },
      tip: { zh: '“左小右大”是 BST 的定义，不是画布上箭头的装饰。', en: '“Smaller left, larger right” is the BST definition, not decoration on the canvas arrows.' },
    },
    {
      stepId: 'found',
      title: { zh: '④ 查找成功：目标节点被定位', en: '④ Search succeeds: the target node is located' },
      explanation: {
        zh: '相等时发出 found 帧：current 就是目标节点，targetNodeId 指向它，result=found。查找路径和已比较节点在每一帧都有记录；最终帧不会把另一个同值节点冒充成目标。查找成功不修改任何 left/right 引用，树结构与运行前完全一致。',
        en: 'On equality the found frame sets current to the target node, targetNodeId to that node and result=found. The path and compared ids are recorded on every frame; the final frame never substitutes another node with an equal value. A successful search changes no left/right reference, so the tree is identical to the input tree.',
      },
      tip: { zh: '目标由 targetNodeId 指定，不靠屏幕坐标或值搜索。', en: 'The target is identified by targetNodeId, never by screen position or value scanning.' },
    },
    {
      stepId: 'not-found',
      title: { zh: '⑤ 查找失败 / 删除不存在键', en: '⑤ Search fails / deleting a missing key' },
      explanation: {
        zh: '走到 None 仍未相等时发出 not-found 帧，result=not-found，targetNodeId 为空；空树时 current 和 path 也可以为空。删除一个不存在的键同样走这里，但结果记为 missing，树保持原样。失败不是异常崩溃，而是一条真实走到底的比较路径加一个明确的空孩子。',
        en: 'Reaching None without equality emits not-found with result=not-found and an empty targetNodeId; on an empty tree current and path can also be empty. Deleting a missing key takes the same route but records result=missing and leaves the tree unchanged. Failure is not a crash: it is a real comparison path ending at an explicit missing child.',
      },
      tip: { zh: '失败也要能指出最后比较了谁、在哪个方向遇到空位。', en: 'Failure must still show the last compared node and the direction whose child was missing.' },
    },
    {
      stepId: 'duplicate',
      title: { zh: '⑥ 插入：重复键明确拒绝', en: '⑥ Insert: duplicate keys are explicitly rejected' },
      explanation: {
        zh: '官方示例采用唯一键策略。插入前先用同一套查找定位；如果命中已有值，就发出 duplicate 帧，result=duplicate，insertedId 为空，节点数与所有指针保持不变。不会悄悄覆盖旧值，也不会把重复值挂到某一侧破坏中序严格递增。若产品需要“允许重复”，必须另行定义稳定规则（例如固定挂左或计数），不能在这里含糊处理。',
        en: 'The official examples use unique keys. Insert first locates with the same search; if an existing value is hit, it emits duplicate, sets result=duplicate, leaves insertedId empty and changes neither node count nor pointers. It never silently overwrites the old value or hangs the duplicate on one side, which would break strictly increasing in-order. A product that wants duplicates must define a stable rule (for example always left or a count) rather than being vague here.',
      },
      tip: { zh: '重复键不是“插入成功但看不见”，而是明确拒绝且树不变。', en: 'A duplicate is not an invisible successful insert; it is an explicit rejection with an unchanged tree.' },
    },
    {
      stepId: 'insert',
      title: { zh: '⑦ 插入：创建节点并改父指针', en: '⑦ Insert: create a node and change the parent pointer' },
      explanation: {
        zh: '找到空位后，Python 真实执行 new_node(target)，再执行 parent.left = node 或 parent.right = node；空树时执行 ROOT = node。attach 帧同时显示 insertedId、parentId 和 side，父节点的 leftId/rightId 必须真实指向新节点，根插入时 rootId 必须等于 insertedId。新节点获得新编号，旧节点编号不变。插入完成后中序仍严格递增。',
        en: 'After finding the empty slot, Python really runs new_node(target), then parent.left = node or parent.right = node; for an empty tree it runs ROOT = node. The attach frame records insertedId, parentId and side; the parent’s leftId/rightId must really point at the new node, and an empty-tree insert must set rootId to insertedId. The new node gets a fresh id while existing ids stay stable. In-order remains strictly increasing afterwards.',
      },
      tip: { zh: '只改一个父指针（或 root）；不要重排整棵树。', en: 'Change exactly one parent pointer (or root); do not rebuild the whole tree.' },
    },
    {
      stepId: 'delete-locate',
      title: { zh: '⑧ 删除：先定位，再数孩子', en: '⑧ Delete: locate first, then count children' },
      explanation: {
        zh: '删除先用真实比较路径定位目标，发出 locate 帧，targetNodeId 指向目标。随后代码真实检查 target.left 与 target.right，把孩子数量分成 0、1、2 三种情况；分错情况会导致完全错误的指针操作，所以定位和目标分类必须来自对象本身，不能靠节点在画布上的位置。',
        en: 'Delete first locates the target through the real comparison path and emits locate with targetNodeId pointing at it. The code then inspects target.left and target.right and classifies 0, 1 or 2 children. Misclassifying changes every following pointer operation, so location and classification must come from the object, never from canvas position.',
      },
      tip: { zh: '删除前必须知道目标是叶子、单孩子还是双孩子。', en: 'Before deleting, know whether the target is a leaf, one-child or two-child node.' },
    },
    {
      stepId: 'delete-leaf',
      title: { zh: '⑨ 删除叶子：父指针置空', en: '⑨ Delete a leaf: clear the parent pointer' },
      explanation: {
        zh: '叶子没有孩子，删除只需把父节点对应方向设为 None：parent.left = None 或 parent.right = None。delete-leaf 帧的 removedNode 记录目标编号、父编号、side 和 replacementId=null；目标不再出现在 nodes 中，其他节点编号不变。如果目标是根本身，rootId 变为 null，整棵树变空。',
        en: 'A leaf has no child, so deletion only sets the parent’s corresponding direction to None: parent.left = None or parent.right = None. The delete-leaf frame’s removedNode records the target id, parent id, side and replacementId=null; the target disappears from nodes and other ids stay stable. If the target is the root, rootId becomes null and the tree is empty.',
      },
      tip: { zh: '叶子删除不能让父节点仍指向一个已摘除对象（悬空引用）。', en: 'A leaf delete must not leave the parent pointing at a detached object (a dangling reference).' },
    },
    {
      stepId: 'delete-one',
      title: { zh: '⑩ 删除单孩子：孩子接替位置', en: '⑩ Delete a one-child node: the child takes its place' },
      explanation: {
        zh: '目标只有一个孩子时，让孩子直接接到目标的父节点：parent.left = child 或 parent.right = child；目标若是根，则 rootId = child，child 没有父节点。delete-one 帧记录 removedNode.replacementId 为这个孩子，孩子仍在树中，目标被摘除。先接好孩子再断开目标，任何中间帧都不能出现悬空引用。',
        en: 'When the target has exactly one child, connect that child directly to the target’s parent: parent.left = child or parent.right = child; if the target is the root, rootId = child and the child has no parent. The delete-one frame records removedNode.replacementId as that child, which remains in the tree while the target is detached. Reconnect the child before detaching the target so no intermediate frame contains a dangling reference.',
      },
      tip: { zh: '单孩子删除改的是“父 → 孩子”，不是“目标 → 孩子”。', en: 'A one-child delete rewires parent → child, not target → child.' },
    },
    {
      stepId: 'successor',
      title: { zh: '⑪ 双孩子：在右子树找中序后继', en: '⑪ Two children: find the in-order successor' },
      explanation: {
        zh: '目标有两个孩子时，中序后继是右子树中最小的节点，也就是从 target.right 出发一路向左走到底的节点；它没有左孩子。successor-search 帧真实走这条左边路径，successor-found 帧把 successorId 指向它。后继的值大于目标左子树全部节点、小于右子树其余节点，因此搬到目标位置后仍满足 BST 性质。不能改用“左子树最大”除非明确采用前驱策略。',
        en: 'With two children, the in-order successor is the smallest node in the right subtree: start at target.right and follow left until None; it has no left child. successor-search frames walk that real left path, and successor-found points successorId at it. Its value is larger than every node in the target’s left subtree and smaller than the rest of the right subtree, so moving it into the target position preserves the BST property. Do not silently switch to the left-subtree maximum (the predecessor strategy).',
      },
      tip: { zh: '后继来自右子树的最左节点，不是任意右孩子。', en: 'The successor is the left-most node of the right subtree, not any right child.' },
    },
    {
      stepId: 'successor-detach',
      title: { zh: '⑫ 后继离开原位置：先接回它的右孩子', en: '⑫ The successor leaves: reconnect its right child first' },
      explanation: {
        zh: '中序后继没有左孩子，但可能有右孩子。successor-detach 帧真实执行 successor_parent.left = successor.right（或对应方向），让后继的右孩子接回原位置，后继自身暂时离开树。removedNode.role=successor 记录后继原父节点、side 与 replacementId。此时后继的编号不变，下一步会被移植到目标位置。',
        en: 'The in-order successor has no left child but may have a right child. The successor-detach frame really runs successor_parent.left = successor.right (or the corresponding direction), reconnecting that right child into the old position while the successor temporarily leaves the tree. removedNode.role=successor records its old parent, side and replacementId. Its id is unchanged; the next step transplants it into the target position.',
      },
      tip: { zh: '后继原位置的空缺必须由它的右孩子补上，不能悬空。', en: 'The successor’s old slot must be filled by its right child; it cannot be left dangling.' },
    },
    {
      stepId: 'transplant',
      title: { zh: '⑬ 后继接入目标位置，目标真正摘除', en: '⑬ Transplant the successor; the target is truly detached' },
      explanation: {
        zh: '移植帧把后继接到目标的父节点（如果是根则改 rootId），再让 successor.left = target.left、successor.right = target.right；最后断开目标的 left/right，目标对象离开树。removedNode.role=target 记录目标父节点、side 和 replacementId=后继；如果根发生变化，oldRootId 与 rootId 同时记录。后继保留自己的编号，所以回退或跳帧时同一个节点不会被伪装成新节点。',
        en: 'The transplant frame connects the successor to the target’s parent (or changes rootId when the target is root), then sets successor.left = target.left and successor.right = target.right; finally it clears the target’s left/right so the target object leaves the tree. removedNode.role=target records the target’s parent, side and replacementId=successor; when the root changes, oldRootId and rootId are both recorded. The successor keeps its id, so scrubbing backward never disguises the same node as a new one.',
      },
      tip: { zh: '两个孩子的删除是“移动后继对象”，不是“复制后继值”。', en: 'A two-child delete moves the successor object; it does not copy its value.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑭ 结果、复杂度与常见错误', en: '⑭ Result, complexity and common mistakes' },
      explanation: {
        zh: '完成帧给出 result 和最终树：查找 found/not-found 不改树；插入 inserted/duplicate；删除 deleted/missing。所有帧的中序都必须严格递增，节点数、父子引用、根和无环性也要一致。平均树高 O(log n)，最坏退化成链 O(n)，空间 O(h)。常见错误包括：把重复键强行插入、删除时只让节点从画面消失而不改父指针、双孩子删除复制值后忘记删后继、把后继的右孩子丢掉、以及用布局坐标推断父子关系。',
        en: 'The done frame reports the result and final tree: found/not-found leave the tree unchanged; insert yields inserted/duplicate; delete yields deleted/missing. Every frame’s in-order must be strictly increasing, and node count, parent/child references, root and acyclicity must agree. Average height is O(log n), worst case a chain is O(n), and space is O(h). Common mistakes: forcing duplicate keys in, deleting a node only from the screen without changing the parent pointer, copying a successor value and forgetting to delete the successor, dropping the successor’s right child, and inferring parent/child from layout coordinates.',
      },
      tip: { zh: '判断删除是否正确：看目标是否离开、后继是否保留编号、父/根指针是否接对。', en: 'To judge a deletion: did the target leave, did the successor keep its id, and are the parent/root pointers correct?' },
    },
  ],
  commonMistakes: {
    zh: [
      '把重复键挂到某一侧而不说明策略，破坏“中序严格递增”。',
      '删除叶子时只把节点从画面移除，父节点的 left/right 仍指向它。',
      '删除单孩子时把“父 → 目标”改成“目标 → 孩子”，造成悬空。',
      '双孩子删除复制后继值后忘记摘除后继，或没有接回后继的右孩子。',
      '把中序后继误认成“任意右孩子”或“右子树根”。',
      '用节点的屏幕坐标或数组下标推断父子关系，而不是 leftId/rightId。',
      '认为 BST 查找/插入/删除永远是 O(log n)，忽略退化链的 O(n)。',
    ],
    en: [
      'Attaching duplicate keys on one side without a stated policy, breaking strictly increasing in-order.',
      'Removing a leaf from the screen while its parent still points at it.',
      'Rewiring target → child instead of parent → child for a one-child delete, leaving a dangling reference.',
      'Copying a successor value but forgetting to remove the successor, or failing to reconnect its right child.',
      'Mistaking any right child or the right-subtree root for the in-order successor.',
      'Inferring parent/child from screen coordinates or array indices instead of leftId/rightId.',
      'Assuming BST search/insert/delete are always O(log n), ignoring the degenerate O(n) chain.',
    ],
  },
};
