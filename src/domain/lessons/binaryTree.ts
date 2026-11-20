import type { Lesson } from './types';

/**
 * Stage 7D binary-tree traversal course, extended by TREE-02. Step ids are
 * exactly the `lesson_step=` values emitted by the real Python preset:
 * init, root, enter, left, visit, right, return, level-init, level-process,
 * level-order, order, done. Repeated stages resolve to real frames through
 * the existing deterministic `findFrameForStep` lookup, never message text.
 */
export const binaryTreeLesson: Lesson = {
  lessonId: 'binary-tree-traversal-basics',
  algorithmId: 'inorder',
  contentVersion: '1.1.0',
  title: { zh: '二叉树遍历：递归、栈与队列', en: 'Binary-tree traversal: recursion, stack and queue' },
  oneLiner: {
    zh: '同一棵树，可以按前序、中序、后序递归地下钻，也可以借助 FIFO 队列从上到下逐层访问。',
    en: 'The same tree can be explored recursively in preorder, inorder or postorder, or visited level by level with a FIFO queue.',
  },
  overview: {
    zh: '这棵演示树用层序数组 [4, 2, 6, 1, 3, 5, 7] 创建，但屏幕上呈现的是真实的 TreeNode 对象：n1 的值是 4，它的 left 指向 n2、right 指向 n3，其余节点也各自保存真实的左右引用。节点身份由 n1…n7 决定，不靠数组下标，也不靠值是否相同。前序、中序、后序使用同一个 traverse 函数，只是把“访问当前节点”放在递归左子树之前、两次递归之间或递归右子树之后；层序不使用递归，而是把根入队，每次取出队首访问，再把它的左孩子、右孩子依次入队。调用栈或队列、路径、访问顺序和代码行都来自这次真实 Python 执行。没有孩子的节点叫叶子（n4、n5、n6、n7），画布标为 LEAF；根的深度是 0，这棵树的最大深度是 2、树高是 3。',
    en: 'The demo tree is created from the level-order array [4, 2, 6, 1, 3, 5, 7], but what you see are real TreeNode objects: n1 has value 4, its left points to n2 and its right to n3, and every other node stores its own real left/right references. Identity comes from n1…n7, never from an array index or equal values. Preorder, inorder and postorder share one traverse function; the only difference is whether “visit this node” happens before the left recursion, between the two recursions, or after the right recursion. Level order is different: it never recurses. It enqueues the root, dequeues the front to visit it, then enqueues that node’s left and right children. The call stack or queue, path, visit order and source line all come from that real Python run. A node with no children is a leaf (n4, n5, n6, n7), marked LEAF; the root has depth 0, this tree has maximum depth 2 and height 3.',
  },
  intuition: {
    zh: '前三种遍历像一位邮差，沿家谱往左院、右院递归地走，返回时再决定何时敲门。层序更像在门口排队：根先排到队首，被叫到的人进去访问，然后把他的左孩子、右孩子依次排到队尾；先来先服务，所以同层的人总在下一层之前被访问，同层内部则保持从左到右。',
    en: 'The first three traversals are like a postal worker walking recursively down the left and right yards of a family tree, deciding when to knock on the way back. Level order is a queue at the door: the root joins the front, the person called is visited, then that person’s left child and right child join the rear in that order. First come, first served means every level finishes before the next one, and within a level the order stays left to right.',
  },
  prerequisites: {
    zh: ['知道 Python 的 class 与对象属性', '理解变量保存的是对象引用，None 表示没有孩子', '见过函数调用与递归返回', '知道 FIFO 队列的入队与出队'],
    en: ['Python classes and object attributes', 'Understanding object references and None for a missing child', 'Having seen function calls and recursive returns', 'Knowing FIFO enqueue and dequeue'],
  },
  complexity: {
    time: 'O(n)',
    space: 'O(h) / O(w)',
    note: {
      zh: '四种遍历都会真实进入并访问每个节点一次，所以时间都是 O(n)，n 是节点数。前序、中序、后序的递归栈最深等于树高 h，额外空间 O(h)；层序的队列同时保存“已发现但还没访问”的节点，最大长度等于树的最大层宽 w，额外空间 O(w)。完全平衡的树 w 约为 n/2，最坏可到 O(n)；不要把层序队列误说成固定 O(1)。这里的 n1…n7 只是教学 ID，不代表 Python 对象地址。',
      en: 'All four traversals enter and visit every node once, so time is O(n), where n is the number of nodes. The recursive traversals use O(h) stack space, where h is the tree height. Level order stores discovered-but-not-yet-visited nodes, so its queue reaches the maximum level width w and uses O(w) extra space. A balanced tree can have w about n/2, so the worst case is O(n); the queue is not O(1). The ids n1…n7 are teaching labels, not Python object addresses.',
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
      stepId: 'level-init',
      title: { zh: '⑧ 层序起点：根节点入队', en: '⑧ Level-order start: enqueue the root' },
      explanation: {
        zh: '层序开始前队列为空。代码把根 n1 从队尾入队，队列变成 [n1]，队首和队尾暂时是同一个节点。此时还没有访问任何节点；enqueue 帧只记录“已发现”，不等于“已访问”。如果树为空，根不存在，循环一次也不会执行。',
        en: 'The queue starts empty. The code enqueues root n1 at the rear, so the queue becomes [n1]; front and rear are the same node for now. Nothing has been visited yet: an enqueue frame records “discovered”, not “visited”. If the tree is empty there is no root, and the loop never runs.',
      },
      tip: { zh: '入队只负责排队；真正的访问发生在出队之后。', en: 'Enqueue only joins the queue; the actual visit happens after dequeue.' },
    },
    {
      stepId: 'level-process',
      title: { zh: '⑨ 出队、访问、孩子入队', en: '⑨ Dequeue, visit, enqueue children' },
      explanation: {
        zh: '每一轮先取队首并出队，再把该节点加入 VISITED，随后按从左到右的顺序把存在的左孩子、右孩子依次放到队尾。因为队列是先进先出，上一层的节点总排在下一层孩子的前面，所以访问顺序自然是从上到下；同一层内，左孩子先于右孩子入队，访问时也就从左到右。没有孩子就不入队，不会伪造节点。',
        en: 'Each round removes the front node, appends it to VISITED, then puts its existing left child and right child at the rear in that order. FIFO order means every node of the current level sits ahead of the next level’s children, so visits go top to bottom; within a level, the left child is enqueued before the right child, so visits go left to right. Missing children are never enqueued and no node is invented.',
      },
      tip: { zh: '若把队列换成栈，或先右后左入队，得到的顺序就不再是标准层序。', en: 'Replacing the queue with a stack, or enqueuing right before left, no longer gives standard level order.' },
    },
    {
      stepId: 'level-order',
      title: { zh: '⑩ 层序结果：逐层从左到右', en: '⑩ Level-order result: each level, left to right' },
      explanation: {
        zh: '这棵树的真实层序结果是 4 → 2 → 6 → 1 → 3 → 5 → 7：先根一层，再第二层的 2、6，最后第三层的 1、3、5、7。结果直接来自真实出队与 VISITED，不是预先写好的数组。层序时间为 O(n)；队列最大长度出现在最宽的一层，所以额外空间是 O(w)，w 为最大层宽。',
        en: 'The real level-order result is 4 → 2 → 6 → 1 → 3 → 5 → 7: the root level first, then 2 and 6, then 1, 3, 5 and 7. It comes from real dequeues and VISITED, not a precomputed array. Time is O(n); the queue peaks at the widest level, so extra space is O(w), where w is the maximum level width.',
      },
      tip: { zh: '层序不是递归遍历，也不能用“左根右”的中序口诀解释。', en: 'Level order is not a recursive traversal and cannot be explained by the inorder “left-root-right” slogan.' },
    },
    {
      stepId: 'order',
      title: { zh: '⑪ 四种遍历的最终顺序', en: '⑪ The final order of all four traversals' },
      explanation: {
        zh: '同一棵树的真实结果：前序 4 → 2 → 1 → 3 → 6 → 5 → 7；中序 1 → 2 → 3 → 4 → 5 → 6 → 7；后序 1 → 3 → 2 → 5 → 7 → 6 → 4；层序 4 → 2 → 6 → 1 → 3 → 5 → 7。访问序列直接来自 VISITED，不是预先写好的答案数组。中序在这里看起来有序，只因为这是一棵二叉搜索树；普通二叉树的中序不保证有序。',
        en: 'Real results on the same tree: preorder 4 → 2 → 1 → 3 → 6 → 5 → 7; inorder 1 → 2 → 3 → 4 → 5 → 6 → 7; postorder 1 → 3 → 2 → 5 → 7 → 6 → 4; level order 4 → 2 → 6 → 1 → 3 → 5 → 7. The sequence comes directly from VISITED, never from a precomputed answer array. Inorder looks sorted here only because this tree is a binary search tree; a general binary tree does not guarantee sorted inorder output.',
      },
      tip: { zh: '不要用同一条递归规则硬套四种遍历；层序依赖队列。', en: 'Do not force one recursive rule onto all four traversals; level order depends on a queue.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑫ 复杂度与常见错误', en: '⑫ Complexity and common mistakes' },
      explanation: {
        zh: '四种遍历都访问每个节点一次，时间 O(n)。递归遍历的栈深为树高 h，额外空间 O(h)；层序队列的最大长度为最大层宽 w，额外空间 O(w)，最坏 O(n)。常见错误包括：把进入当成访问、认为中序对所有树都有序、把节点 ID 和函数 frameId 混淆、层序时先右后左入队、把出队节点误当成已访问、以及只背最终数组而不理解队列状态。',
        en: 'All four traversals visit each node once: O(n) time. Recursive traversals use O(h) stack space for tree height h; level order uses O(w) queue space for maximum level width w, O(n) worst case. Common mistakes include confusing entry with visit, assuming inorder is sorted for every tree, mixing node ids with frame ids, enqueuing right before left in level order, treating a dequeued node as already visited, and memorising the final array without understanding the queue.',
      },
      tip: { zh: '判断层序是否正确，看当前节点、队首/队尾和已访问序列是否同步。', en: 'To judge level order, check that the current node, queue front/rear and visit sequence agree.' },
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
      '层序遍历时先入队右孩子再入队左孩子，导致同层顺序变成从右到左。',
      '把出队当成访问；真正的访问要看出队后是否执行了 VISITED.append。',
      '认为层序也是递归遍历，或把它的队列空间说成固定 O(1)。',
    ],
    en: [
      'Treating “entered a node” as “visited the node”, which shifts inorder and postorder explanations too early.',
      'Assuming every binary tree has sorted inorder output; that property belongs to binary search trees.',
      'Mixing tree node ids (n1…n7) with Python frame ids (f1, f2…).',
      'Recursing when left or right is None, which invents a call frame that never existed.',
      'Reading only the final visit array without checking the current node, recursion path and call stack.',
      'Using an array index as node identity, which fails for equal values or gaps.',
      'Enqueuing the right child before the left in level order, which reverses left-to-right order within a level.',
      'Treating a dequeue as a visit; the real visit is the VISITED.append after dequeue.',
      'Calling level order recursive, or claiming its queue uses fixed O(1) space.',
    ],
  },
};
