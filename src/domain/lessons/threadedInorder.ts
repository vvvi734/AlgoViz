import type { Lesson } from './types';

/**
 * TEXTBOOK-06 threaded tree course. Every `stepId` matches a real
 * `lessonStepId` emitted by the Python preset in threadedTreeExamples.ts.
 */
export const threadedInorderLesson: Lesson = {
  lessonId: 'threaded-binary-tree-inorder',
  algorithmId: 'threaded-inorder',
  contentVersion: '1.0.0',
  title: { zh: '线索二叉树：中序线索化与线索遍历', en: 'Threaded binary tree: in-order threading and traversal' },
  oneLiner: {
    zh: '把 n+1 个空指针改造成前驱/后继线索，用 ltag、rtag 区分孩子与线索，就能不用递归栈完成中序遍历。',
    en: 'Reuse the n+1 null pointers as predecessor/successor threads, mark them with ltag and rtag, and traverse inorder without a recursion stack.',
  },
  overview: {
    zh: '这棵演示树由层序数组 [4, 2, 6, 1, 3] 创建：n1=4 是根，n2=2、n3=6 是它的孩子，n4=1、n5=3 分别是 n2 的左右孩子。真实 Python 先递归线索化：结点左指针为空时，把它指向前驱并令 ltag=1；前驱右指针为空时，把它指向当前结点并令 rtag=1。线索建好后，遍历从最左结点 n4 开始，右指针是线索就沿线索跳，是真实孩子就进入右子树再一路向左，得到 1 → 2 → 3 → 4 → 6。画布上实线是真实孩子，虚线箭头是线索，侧向短桩加 ∅ 表示线索目标为空。',
    en: 'The demo tree is built from the level-order array [4, 2, 6, 1, 3]: root n1=4, children n2=2 and n3=6, with n4=1 and n5=3 under n2. Real Python threads it recursively: a null left pointer becomes the predecessor thread with ltag=1; a predecessor whose right pointer is null becomes a successor thread with rtag=1. Traversal then starts at the left-most node n4, follows a right thread when rtag=1, or descends into a real right subtree and goes left-most. The result is 1 → 2 → 3 → 4 → 6. Solid lines are real children, dashed arrows are threads, and a side stub with ∅ marks a null thread target.',
  },
  intuition: {
    zh: '线索化不是另建一张表，而是把原本浪费的空指针原地利用起来：每个结点的空左指针记住“中序里谁在我前面”，空右指针记住“谁在我后面”。这样遍历时不需要栈记住返回路径，顺着线索就能走到下一个结点。',
    en: 'Threading does not build a second table; it reuses the wasted null pointers in place. A null left pointer remembers the inorder predecessor, a null right pointer remembers the successor. Traversal therefore needs no stack to remember the way back: the threads lead to the next node.',
  },
  prerequisites: {
    zh: ['理解二叉树的左右孩子指针', '会写二叉树的中序递归遍历', '知道中序序列中前驱与后继的含义', '理解 Python 对象引用与 None'],
    en: ['Binary-tree left/right child pointers', 'Recursive inorder traversal', 'Predecessor and successor in an inorder sequence', 'Python object references and None'],
  },
  complexity: {
    time: 'O(n)',
    space: 'O(h) / O(1)',
    note: {
      zh: '线索化递归进入每个结点一次，时间 O(n)，递归栈最深为树高 h。线索遍历沿每个结点最多走常数次，时间 O(n)，除当前指针外不需要额外栈，因此遍历阶段额外空间 O(1)。线索本身没有新增结点，只改写原有的空指针和两个标志位；代价是插入/删除结点时要同步维护线索。',
      en: 'Threading enters each node once: O(n) time and O(h) recursion stack. Threaded traversal also costs O(n) time but needs only the current pointer, so its extra space is O(1). Threads add no nodes; they rewrite existing null pointers and two tag bits. The price is that insertion and deletion must maintain the threads.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 初始状态：所有标志为 0', en: '① Initial state: every tag is 0' },
      explanation: {
        zh: '建树后每个结点的 ltag、rtag 都是 0，left_thread、right_thread 都是 None。此时空指针还没有被利用，树就是普通二叉树。n1 的左右孩子是 n2、n3；n2 的左右孩子是 n4、n5；n3、n4、n5 都是叶子，各自有两个空指针。5 个结点共有 6 个空指针，最终都会被线索占据。',
        en: 'After construction every ltag and rtag is 0 and both thread fields are None. The null pointers are still unused, so this is an ordinary binary tree. n1 has children n2 and n3; n2 has n4 and n5; n3, n4 and n5 are leaves with two null pointers each. Five nodes have six null pointers in total, all of which will eventually become threads.',
      },
      tip: { zh: 'tag=0 表示指针指向真实孩子；tag=1 才表示它是一条线索。', en: 'tag=0 means a real child pointer; only tag=1 means a thread.' },
    },
    {
      stepId: 'enter',
      title: { zh: '② 递归进入子树', en: '② Enter a subtree recursively' },
      explanation: {
        zh: 'walk 按“左子树 → 当前结点 → 右子树”的顺序递归。进入 n1 后先进入 n2，再进入 n4；调用栈记录真实函数帧。进入只是开始处理这棵子树，还没有写入任何线索。中序线索化的顺序必须与中序遍历一致，否则前驱/后继会错位。',
        en: 'walk recurses left subtree → current node → right subtree. From n1 it enters n2, then n4, while the real call stack records each frame. Entering only starts processing that subtree; no thread has been written yet. Threading must follow the same order as inorder traversal, otherwise predecessor/successor links would be wrong.',
      },
      tip: { zh: '线索化顺序就是中序顺序：左、根、右。', en: 'Threading order is inorder order: left, node, right.' },
    },
    {
      stepId: 'thread-left',
      title: { zh: '③ 空左指针写入前驱线索', en: '③ A null left pointer becomes a predecessor thread' },
      explanation: {
        zh: '处理 n4 时 left 是 None，代码把 n4.left_thread 指向当前前驱 PRE。n4 是中序第一个结点，前驱为空，所以画布在它左侧画出短桩和 ∅，同时 ltag 变成 1。接着 n5 的左指针也空，前驱是 n2，于是 n5 的左线索指向 n2；n3 的左线索指向 n1。注意线索保存在单独字段中，真实 left 仍是 None，画布靠 tag 判断该画虚线。',
        en: 'Processing n4, left is None, so n4.left_thread is set to the current predecessor PRE. n4 is the first inorder node, so its predecessor is null: the canvas draws a side stub with ∅ and ltag becomes 1. n5 also has a null left pointer and its predecessor is n2, so n5’s left thread points to n2; n3’s left thread points to n1. Threads live in separate fields while the real left pointer stays None; the canvas uses the tag to decide whether to draw a dashed line.',
      },
      tip: { zh: '第一个中序结点没有前驱，它的左线索保持空。', en: 'The first inorder node has no predecessor, so its left thread stays null.' },
    },
    {
      stepId: 'thread-right',
      title: { zh: '④ 前驱的空右指针写入后继线索', en: '④ A predecessor’s null right pointer becomes a successor thread' },
      explanation: {
        zh: '当处理到 n2 时，前驱是 n4。n4 的 right 为 None，代码把 n4.right_thread 指向 n2、rtag 置 1，画布出现 n4 → n2 的虚线。n5 处理时，前驱 n2 的 right 是真实孩子 n5，不能改写；处理 n1 时，前驱 n5 右指针为空，于是 n5.right_thread 指向 n1。这样每个空右指针都记住了中序后继。',
        en: 'When n2 is processed its predecessor is n4. n4 has a null right pointer, so n4.right_thread points to n2 and rtag becomes 1, drawing the dashed n4 → n2 link. When n5 is processed, predecessor n2 has a real right child n5 and must not be overwritten. When n1 is processed, predecessor n5 has a null right pointer, so n5.right_thread points to n1. Every null right pointer now remembers its inorder successor.',
      },
      tip: { zh: '只有前驱的右指针为空时才写后继线索；真实孩子不能被线索覆盖。', en: 'Write a successor thread only when the predecessor’s right pointer is null; never overwrite a real child.' },
    },
    {
      stepId: 'return',
      title: { zh: '⑤ 返回上一层继续处理', en: '⑤ Return to the caller and keep going' },
      explanation: {
        zh: 'n4 处理完返回 n2，n2 的左子树已经完成，于是设置自己的左线索（它自己有真实左孩子，所以 ltag 仍为 0），再检查前驱 n4 的空右指针，然后进入右子树 n5。每次 return 都弹出真实调用帧，但已经写好的线索不会回滚。',
        en: 'After n4 returns, n2’s left subtree is done, so n2 handles its own left pointer (it has a real left child, so ltag stays 0), checks n4’s null right pointer, then enters right subtree n5. Each return pops a real call frame, but threads already written stay in place.',
      },
      tip: { zh: '返回时前驱 PRE 仍指向刚访问的结点，它是写后继线索的依据。', en: 'On return, PRE still points at the node just processed; that is what allows successor threading.' },
    },
    {
      stepId: 'thread-last',
      title: { zh: '⑥ 中序最后一个结点', en: '⑥ The last inorder node' },
      explanation: {
        zh: '最后一个中序结点是 n3。它的左右指针都为空，左线索已经指向 n1；右指针空但没有后继，代码令 rtag=1、right_thread=None。画布在 n3 右侧显示 ∅ 短桩。这个标志很重要：遍历到 n3 时看到 rtag=1 且后继为空，就知道应该停止，而不是继续向右走。',
        en: 'The last inorder node is n3. Both pointers are null; its left thread already points to n1, but it has no successor, so rtag becomes 1 and right_thread stays None. The canvas shows a ∅ stub on its right. This flag matters: when traversal reaches n3 with rtag=1 and no successor, it must stop instead of walking right.',
      },
      tip: { zh: '最后一个结点的右线索为空，但 rtag 仍必须是 1。', en: 'The last node’s right thread is null, yet its rtag must still be 1.' },
    },
    {
      stepId: 'thread-complete',
      title: { zh: '⑦ 线索建立完成：6 个空指针全部利用', en: '⑦ Threading complete: all six null pointers reused' },
      explanation: {
        zh: '线索化结束后 5 个结点共 6 个 tag 为 1：n4 左右各一、n5 左右各一、n3 左右各一。n3 的右线索为空是唯一一个“有 tag、无线索目标”的情况。真实孩子仍然全部保留，实线边没有变化。此时可以丢弃递归栈，接下来的遍历只依赖线索和真实孩子。',
        en: 'Threading finishes with six tags set to 1 across five nodes: both tags on n4, n5 and n3. n3’s null right thread is the only tagged pointer without a target. All real children remain, so the solid edges are unchanged. The recursion stack can now be discarded; traversal depends only on threads and real children.',
      },
      tip: { zh: 'tag 总数等于空指针数，本例是 6，不是结点数 5。', en: 'The tag count equals the number of null pointers — six here, not the five node count.' },
    },
    {
      stepId: 'start',
      title: { zh: '⑧ 从最左结点开始', en: '⑧ Start at the left-most node' },
      explanation: {
        zh: '中序第一个被访问的结点是最左结点。代码从根 n1 一路沿真实 left 走到 n2、n4，n4 的 ltag=1，说明左边已经没有真实孩子，停止。这个“一直向左”的动作不使用递归，只用一个循环。',
        en: 'The first inorder node is the left-most one. Starting at root n1, the code follows real left pointers through n2 to n4. n4 has ltag=1, meaning there is no real left child, so the descent stops. This “keep going left” action uses a loop, not recursion.',
      },
      tip: { zh: 'ltag=1 是向左下降的停止条件，不是“没有左孩子”的另一种说法。', en: 'ltag=1 is the stop condition for descending left; it is not another way of saying “no left child”.' },
    },
    {
      stepId: 'visit',
      title: { zh: '⑨ 访问当前结点', en: '⑨ Visit the current node' },
      explanation: {
        zh: '访问就是执行 VISITED.append(node)。序列依次得到 n4=1、n2=2、n5=3、n1=4、n3=6，正好是中序序列。画布给结点加访问底色和序号，当前结点另有边框；两者可以同时出现，但含义不同。',
        en: 'A visit runs VISITED.append(node). The sequence becomes n4=1, n2=2, n5=3, n1=4, n3=6, exactly inorder. The canvas adds a visited fill and order badge, while the current node keeps its own border; both can appear together but mean different things.',
      },
      tip: { zh: '访问序列来自真实 VISITED，不是预先写好的数组。', en: 'The sequence comes from the real VISITED list, not a precomputed array.' },
    },
    {
      stepId: 'follow-thread',
      title: { zh: '⑩ 沿右线索跳到后继', en: '⑩ Follow a right thread to the successor' },
      explanation: {
        zh: 'n4 的 rtag=1，右指针不是孩子而是线索，当前结点直接跳到 n4.right_thread=n2，不需要栈。n5 的 rtag=1，右线索指向 n1，于是从 n5 直接跳到 n1。画布把这条虚线高亮，并在跳转后的帧里把新结点设为当前。',
        en: 'n4 has rtag=1, so its right pointer is a thread rather than a child; the current node jumps directly to n4.right_thread=n2 without a stack. n5 also has rtag=1 and its thread points to n1, so traversal jumps from n5 to n1. The canvas highlights that dashed link and makes the new node current in the next frame.',
      },
      tip: { zh: 'rtag=1 且后继非空时才沿线索跳；后继为空表示遍历结束。', en: 'Follow a thread only when rtag=1 and the successor exists; a null successor ends the traversal.' },
    },
    {
      stepId: 'descend-left',
      title: { zh: '⑪ rtag=0：进入右子树并走到最左', en: '⑪ rtag=0: enter the right subtree and go left-most' },
      explanation: {
        zh: 'n2 的 rtag=0，它的 right 是真实孩子 n5，不能沿“右指针”简单跳到后继，因为 n2 的中序后继是右子树中最左的结点。代码先进入 n2.right=n5，再沿 left 下降；n5 的 ltag=1，所以 n5 就是 n2 的后继。进入右子树这一步仍然需要一次真实指针跳转，但不使用递归栈。',
        en: 'n2 has rtag=0, so its right pointer is a real child n5 and cannot be treated as the successor. The inorder successor of n2 is the left-most node of its right subtree. The code enters n2.right=n5 and then descends left; n5 has ltag=1, so n5 is the successor. Entering the right subtree still takes one real pointer step, but no recursion stack.',
      },
      tip: { zh: '中序后继要么是右线索，要么是右子树的最左结点。', en: 'An inorder successor is either a right thread or the left-most node of the right subtree.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑫ 完成与代价', en: '⑫ Completion and trade-offs' },
      explanation: {
        zh: 'n3 被访问后 rtag=1、right_thread=None，循环结束，得到 1 → 2 → 3 → 4 → 6。线索化时间 O(n)，遍历时间 O(n)、额外空间 O(1)。线索二叉树的代价是插入、删除结点时必须同步修改前驱/后继线索；若只读或遍历频繁，这份代价很划算。',
        en: 'After n3 is visited, rtag=1 and right_thread is None, so the loop ends with 1 → 2 → 3 → 4 → 6. Threading costs O(n) time; traversal costs O(n) time and O(1) extra space. The trade-off is that insertion and deletion must update predecessor/successor threads; for read-mostly or traversal-heavy workloads that price is worth paying.',
      },
      tip: { zh: '线索树不是“另一种二叉树”，它只是给同一批结点加了 tag 与线索字段。', en: 'A threaded tree is not another binary tree; it is the same nodes plus tag and thread fields.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把线索存进 left/right 本身，覆盖真实孩子指针。',
      '只看指针是否为空判断线索，而不检查 ltag/rtag。',
      '中序最后一个结点的右线索为空，就以为 rtag 应该保持 0。',
      '把中序后继一律说成“右孩子”，忽略右子树的最左结点。',
      '线索化顺序写成前序或后序，导致前驱/后继错位。',
      '遍历时仍然使用递归栈，虽然结果对，但没有体现线索的价值。',
    ],
    en: [
      'Storing threads in left/right themselves and overwriting real child pointers.',
      'Judging a thread by a null pointer alone instead of reading ltag/rtag.',
      'Assuming the last inorder node keeps rtag=0 because its thread target is null.',
      'Calling the right child the successor and forgetting the left-most node of the right subtree.',
      'Threading in preorder or postorder, which misplaces predecessors and successors.',
      'Keeping the recursion stack during traversal: the result is right, but the point of threads is lost.',
    ],
  },
};
