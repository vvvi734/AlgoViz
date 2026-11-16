import type { Lesson } from './types';

/**
 * Stage 7D binary-tree traversal course. Original bilingual wording. Step ids
 * are exactly the `lesson_step=` values emitted by the real Python preset:
 * init, root, enter, left, visit, right, return, order, done. Repeated stages
 * (enter/left/visit/right/return) resolve to real frames through the existing
 * deterministic `findFrameForStep` lookup, never through message text.
 */
export const binaryTreeLesson: Lesson = {
  lessonId: 'binary-tree-traversal-basics',
  algorithmId: 'inorder',
  contentVersion: '1.0.0',
  title: { zh: '二叉树遍历：沿真实左右引用走一遍', en: 'Binary-tree traversal: walking real left/right references' },
  oneLiner: {
    zh: '树不是一排数组格子，而是由根、左孩子、右孩子引用组成的层级结构；遍历就是递归地决定“先处理谁”。',
    en: 'A tree is not a row of array cells: it is a hierarchy of root, left-child and right-child references. Traversal is the recursive decision of what to process first.',
  },
  overview: {
    zh: '这棵演示树用层序数组 [4, 2, 6, 1, 3, 5, 7] 创建，但屏幕上呈现的是真实的 TreeNode 对象：n1 的值是 4，它的 left 指向 n2、right 指向 n3，其余节点也各自保存真实的左右引用。节点身份由 n1…n7 决定，不靠它在数组里的下标，也不靠值是否相同。前序、中序、后序使用同一个 traverse 函数，只是把“访问当前节点”放在递归左子树之前、两次递归之间或递归右子树之后。调用栈、路径、访问顺序和代码行都来自这次真实 Python 执行。没有孩子的节点叫叶子（n4、n5、n6、n7），画布标为 LEAF；从根到某节点经过的边数叫深度，根的深度是 0，这棵树的最大深度是 2、树高是 3。',
    en: 'The demo tree is created from the level-order array [4, 2, 6, 1, 3, 5, 7], but what you see are real TreeNode objects: n1 has value 4, its left points to n2 and its right to n3, and every other node stores its own real left/right references. Identity comes from n1…n7, never from an array index or from equal values. Preorder, inorder and postorder share one traverse function; the only difference is whether “visit this node” happens before the left recursion, between the two recursions, or after the right recursion. The call stack, path, visit order and source line all come from that real Python run. A node with no children is a leaf (n4, n5, n6, n7), marked LEAF on the canvas; depth is the number of edges from the root, so the root has depth 0, this tree has maximum depth 2 and height 3.',
  },
  intuition: {
    zh: '把树想成一棵家谱：根在最上面，左孩子和右孩子是它的两个分支。递归遍历像一位邮差，每到一户先决定要不要现在敲门（访问），然后按顺序去左院、右院，最后原路返回。前序是“进门就敲”，中序是“从左院回来再敲”，后序是“两个院子都走完才敲”。返回不是新的访问，而是回到上一层的门口。',
    en: 'Think of the tree as a family tree: the root is at the top, with a left branch and a right branch. Recursive traversal is like a postal worker who decides at each house whether to knock now (visit), then visits the left yard and right yard in order, and finally walks back. Preorder knocks on arrival, inorder knocks after returning from the left yard, and postorder knocks after both yards are done. A return is not a new visit; it is walking back to the previous doorway.',
  },
  prerequisites: {
    zh: ['知道 Python 的 class 与对象属性', '理解变量保存的是对象引用，None 表示没有孩子', '见过函数调用与递归返回'],
    en: ['Python classes and object attributes', 'Understanding object references and None for a missing child', 'Having seen function calls and recursive returns'],
  },
  complexity: {
    time: 'O(n)',
    space: 'O(h)',
    note: {
      zh: '三种遍历都会真实进入每个节点一次、访问每个节点一次，所以时间都是 O(n)，n 是节点数。递归调用栈的深度最多等于树高 h：完全平衡的 7 节点树 h=3，最坏的单链树 h=n。因此额外空间是 O(h)，不是固定的 O(1)。这里的 n1…n7 只是教学 ID，不代表 Python 对象在内存中的地址。',
      en: 'All three traversals enter every node once and visit every node once, so time is O(n), where n is the number of nodes. The recursion stack grows to the tree height h: a balanced 7-node tree has h=3, while a skewed chain has h=n. Extra space is therefore O(h), not O(1). The ids n1…n7 are teaching labels, not Python object addresses.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 从层序数组建出真实树', en: '① Build a real tree from a level-order array' },
      explanation: {
        zh: '初始化帧先展示整棵树，但这时还没有任何节点被访问。数组只用于创建节点和连接：下标 i 的左孩子候选是 2i+1，右孩子候选是 2i+2；代码会检查候选是否真实存在，再执行 node.left = ... 或 node.right = ...。屏幕上 n1 是根，n2/n3 是它的左右孩子，边的两端都是真实节点 ID。',
        en: 'The init frame shows the whole tree before any node has been visited. The array is used only to create nodes and connect them: index i has candidate children 2i+1 and 2i+2; the code checks that each candidate exists before running node.left = ... or node.right = .... On screen n1 is the root, n2/n3 are its children, and both ends of every edge are real node ids.',
      },
      tip: { zh: '数组只是建树输入；渲染和遍历都不靠数组下标决定父子关系。', en: 'The array is only build input; rendering and traversal never infer parent/child from array indices.' },
    },
    {
      stepId: 'root',
      title: { zh: '② 根节点：递归的入口', en: '② The root: the entry point of recursion' },
      explanation: {
        zh: '第一次 traverse(ROOT) 进入根 n1。真实调用栈出现第一帧，递归路径是 [n1]。此时节点被“进入”，但还没有被“访问”：这两个状态在树上是不同的边框和序号。根节点位于画布最上方，ROOT 标记来自 rootId，而不是数组第 0 项。',
        en: 'The first traverse(ROOT) enters root n1. A real call frame appears and the recursion path is [n1]. The node has been entered but not visited yet: the canvas distinguishes these states with different borders and order badges. The root sits at the top, and ROOT comes from rootId rather than “array element 0”.',
      },
      tip: { zh: '“进入节点”与“访问节点”不是同一件事。', en: 'Entering a node and visiting a node are not the same event.' },
    },
    {
      stepId: 'enter',
      title: { zh: '③ 进入子节点：压入新的函数帧', en: '③ Enter a child: push a new call frame' },
      explanation: {
        zh: '当代码执行 traverse(node.left) 或 traverse(node.right) 时，Python 真正调用同一个函数，调用栈增加一层，路径追加子节点，当前节点切换到子节点。每一层都有自己的 node 参数和局部变量；frameId 是函数帧身份，n2 等是树节点身份，两者不能混用。',
        en: 'When the code runs traverse(node.left) or traverse(node.right), Python really calls the same function: the call stack gains a frame, the path appends the child, and the current node changes to that child. Each level has its own node argument and locals; frameId identifies the function invocation, while n2 identifies a tree node. The two identities must not be mixed.',
      },
      tip: { zh: '同一函数递归多次会产生多个 frameId，但可以指向同一个树节点。', en: 'The same function called recursively gets distinct frameIds even when it handles the same tree node.' },
    },
    {
      stepId: 'left',
      title: { zh: '④ 进入左子树：先看 left', en: '④ Go to the left subtree: follow left' },
      explanation: {
        zh: '当前节点有左孩子时，代码先发出 left 帧，再执行 traverse(node.left)。前序会在进入左子树之前访问当前节点；中序和后序会先深入左子树。边界线从父节点指向真实左孩子，data-next-child-id 记录的就是即将进入的节点。如果 left 是 None，这一段不会执行，也不会伪造边。',
        en: 'When the current node has a left child, the code emits a left frame and then runs traverse(node.left). Preorder visits the current node before going left; inorder and postorder descend first. The highlighted edge goes from the parent to the real left child, and data-next-child-id is the node about to be entered. If left is None, this block does not run and no edge is invented.',
      },
      tip: { zh: 'left 只在真实存在左孩子时发生；叶子节点没有左递归。', en: 'left only happens when a real left child exists; a leaf has no left recursion.' },
    },
    {
      stepId: 'visit',
      title: { zh: '⑤ 访问节点：把值加入真实访问序列', en: '⑤ Visit a node: append its value to the real sequence' },
      explanation: {
        zh: '访问时先执行 VISITED.append(node)，再发出带 visitedIds 的帧，所以当前节点一出现就已经带访问序号。前序的访问发生在进入节点后、左递归前；中序发生在左子树返回后、右递归前；后序发生在左右子树都完成后。相同值的两个节点会有不同 node_id 和不同访问序号。',
        en: 'A visit first runs VISITED.append(node), then emits a frame carrying visitedIds, so the current node already has an order badge when the frame appears. Preorder visits after entry and before left recursion; inorder visits after the left subtree returns and before right recursion; postorder visits after both subtrees finish. Two equal values still get different node ids and different order badges.',
      },
      tip: { zh: '当前节点可以有边框但没有访问序号；中序和后序尤其常见。', en: 'A current node can have a border but no order badge; this is common in inorder and postorder.' },
    },
    {
      stepId: 'right',
      title: { zh: '⑥ 进入右子树：左分支处理完之后', en: '⑥ Go to the right subtree after the left branch' },
      explanation: {
        zh: '右孩子存在时，代码在左子树完成后发出 right 帧并执行 traverse(node.right)。前序在访问当前节点、完成左子树后进入右；中序在访问当前节点后进入右；后序在访问当前节点之前进入右。右边会显示即将进入的真实边和新的调用帧。',
        en: 'When a right child exists, the code emits a right frame after the left subtree is done and runs traverse(node.right). Preorder goes right after visiting the current node and finishing the left; inorder goes right after visiting the current node; postorder goes right before visiting the current node. The canvas highlights the real edge and the call stack gains the new frame.',
      },
      tip: { zh: '右递归的时机随模式改变，但“先左后右”的子树顺序不变。', en: 'When the right recursion starts depends on the mode, but the subtree order is always left before right.' },
    },
    {
      stepId: 'return',
      title: { zh: '⑦ 返回上一层：弹出真实调用帧', en: '⑦ Return to the caller: pop the real frame' },
      explanation: {
        zh: '一个节点处理完后，函数返回，调用栈弹出最深帧，递归路径缩短一层，当前节点回到调用者。返回帧仍显示刚完成的节点和它的访问序号，但随后上层代码继续执行。回退时间轴会同时恢复树、调用栈和变量，不会出现“树还在深层、栈已经回上层”的错位。',
        en: 'When a node is done, the function returns: the deepest frame is popped, the path shortens by one, and the current node becomes the caller. The return frame still shows the node that just finished and its order badge, then the caller continues. Scrubbing backward restores the tree, call stack and variables together, so the tree can never remain deep while the stack is already back at the caller.',
      },
      tip: { zh: '返回不是访问；它只改变“现在在哪一层”。', en: 'A return is not a visit; it only changes which call level is active.' },
    },
    {
      stepId: 'order',
      title: { zh: '⑧ 三种遍历的最终顺序', en: '⑧ The final order of all three traversals' },
      explanation: {
        zh: '同一棵树的真实结果：前序 4 → 2 → 1 → 3 → 6 → 5 → 7；中序 1 → 2 → 3 → 4 → 5 → 6 → 7；后序 1 → 3 → 2 → 5 → 7 → 6 → 4。访问序列直接来自 VISITED，不是预先写好的答案数组。中序在这里看起来有序，只因为这是一棵二叉搜索树；普通二叉树的中序不保证有序。',
        en: 'Real results on the same tree: preorder 4 → 2 → 1 → 3 → 6 → 5 → 7; inorder 1 → 2 → 3 → 4 → 5 → 6 → 7; postorder 1 → 3 → 2 → 5 → 7 → 6 → 4. The sequence comes directly from VISITED, never from a precomputed answer array. Inorder looks sorted here only because this tree is a binary search tree; a general binary tree does not guarantee sorted inorder output.',
      },
      tip: { zh: '不要把“中序一定有序”当成所有二叉树的性质。', en: 'Do not treat “inorder is always sorted” as a property of every binary tree.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑨ 复杂度与常见错误', en: '⑨ Complexity and common mistakes' },
      explanation: {
        zh: '三种遍历都是每个节点进入一次、访问一次，时间 O(n)。递归栈最深等于树高 h，额外空间 O(h)；单链树最坏 O(n)。常见错误包括：把进入当成访问、认为中序对所有树都有序、把节点 ID 和函数 frameId 混淆、在没有左孩子时仍调用左递归、以及只按最终数组背诵顺序而不理解递归返回。',
        en: 'All three traversals enter and visit each node once: O(n) time. The recursion stack reaches the tree height h, so extra space is O(h); a skewed chain is O(n) worst case. Common mistakes include confusing entry with visit, assuming inorder is sorted for every tree, mixing node ids with frame ids, recursing left when no left child exists, and memorising a final array without understanding the returns.',
      },
      tip: { zh: '判断遍历是否正确，看当前节点、调用栈、路径和访问序号是否一致。', en: 'To judge correctness, check that the current node, call stack, path and visit order agree.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把“进入节点”当成“访问节点”，导致中序和后序的讲解整体提前。',
      '认为任何二叉树的中序遍历都一定得到有序序列；只有二叉搜索树才具有该性质。',
      '把树节点 ID（n1…n7）与 Python 函数帧 ID（f1、f2…）混为一谈。',
      '在 left 或 right 为 None 时仍然递归，凭空多出一层调用。',
      '只看最终访问数组，不检查当前节点、递归路径和调用栈是否同步。',
      '把数组下标当成节点身份，遇到相同值或空洞时无法区分节点。',
    ],
    en: [
      'Treating “entered a node” as “visited the node”, which shifts inorder and postorder explanations too early.',
      'Assuming every binary tree has sorted inorder output; that property belongs to binary search trees.',
      'Mixing tree node ids (n1…n7) with Python frame ids (f1, f2…).',
      'Recursing when left or right is None, which invents a call frame that never existed.',
      'Reading only the final visit array without checking the current node, recursion path and call stack.',
      'Using an array index as node identity, which fails for equal values or gaps.',
    ],
  },
};
