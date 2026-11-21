import type { Lesson } from './types';

/**
 * RECUR-01: naive Fibonacci, with no cache or dynamic programming.
 *
 * `stepId`s match the `lesson_step=` values in the real Python preset. The
 * course deliberately teaches the exponential tree first; memoization is only
 * a closing comparison so the canvas cannot be mistaken for a DP animation.
 */
export const fibonacciLesson: Lesson = {
  lessonId: 'fibonacci-recursion-basics',
  algorithmId: 'fib',
  contentVersion: '1.0.0',
  title: {
    zh: '朴素斐波那契：一棵会重复计算的递归树',
    en: 'Naive Fibonacci: a recursion tree that recomputes',
  },
  oneLiner: {
    zh: 'fib(n) 同时依赖 fib(n−1) 与 fib(n−2)，两个分支各自展开，返回值再相加。',
    en: 'fib(n) depends on both fib(n−1) and fib(n−2); each branch expands, then their returns are added.',
  },
  overview: {
    zh: '斐波那契是“一个函数调用自己两次”的最小例子。它和阶乘最大的区别不是写法，而是调用形状：阶乘是一条链，斐波那契是一棵二叉树。朴素递归不做缓存，相同的 fib(k) 会在不同分支里被重新计算，因此调用次数指数增长；但任意时刻真正存活的调用帧仍然只有一条从根到当前节点的路径，所以调用栈空间是 O(n)。',
    en: 'Fibonacci is the smallest example of a function calling itself twice. The important difference from factorial is not syntax but shape: factorial is a chain, Fibonacci is a binary tree. Naive recursion caches nothing, so the same fib(k) is recomputed in different branches and the call count grows exponentially. At any instant, however, the live frames are only one root-to-current path, so call-stack space is O(n).',
  },
  intuition: {
    zh: '把 fib(4) 交给一个办事员。他先问 fib(3)，再问 fib(2)，自己只负责把两个答案相加。fib(3) 又会问 fib(2) 和 fib(1)。注意 fib(2) 已经在左边算过一次，右边却又从头算了一遍——这不是错误，而是朴素递归的真实行为。只有两个子调用都返回后，父调用才能相加。',
    en: 'Hand fib(4) to a clerk. The clerk asks fib(3), then fib(2), and only adds the two answers. fib(3) asks fib(2) and fib(1). Notice that fib(2) was already computed on the left, yet the right branch starts it again — that is not a bug, it is what naive recursion really does. The parent can add only after both children return.',
  },
  prerequisites: {
    zh: ['理解函数调用、参数与返回值', '知道 if 终止条件和调用栈', '能读懂一棵二叉树的分支'],
    en: ['Function calls, arguments and return values', 'if-based base cases and the call stack', 'Reading the branches of a binary tree'],
  },
  complexity: {
    time: 'O(2ⁿ)',
    space: 'O(n)',
    note: {
      zh: '时间：朴素递归的调用数约为 2×fib(n+1)−1，随 n 指数增长；每层只做一次加法，但不能把重复子树合并。空间：任一时刻只有一条根到当前节点的活动路径，最深 n 层，所以调用栈是 O(n)；已返回的帧会弹出，不会同时保留整棵树。',
      en: 'Time: naive recursion makes about 2×fib(n+1)−1 calls, exponential in n; each frame does one addition, but repeated subtrees are not shared. Space: only one root-to-current path is live at a time, at most n layers, so the call stack is O(n); returned frames pop and the whole tree is never resident at once.',
    },
  },
  steps: [
    {
      stepId: 'call',
      title: { zh: '① 建立调用帧', en: '① Create a call frame' },
      explanation: {
        zh: '每次 fib(n) 真正被调用，都会创建一个独立帧，记录这一层自己的 n、局部变量和唯一 frameId。树中每个节点对应一次真实调用，不是预先画好的固定答案。',
        en: 'Each real call to fib(n) creates its own frame with its own n, locals and unique frameId. Every tree node is one real call, never a pre-drawn fixed answer.',
      },
      tip: { zh: '右侧调用栈只显示当前活动路径；主图的浅色节点是同一份 Trace 中尚未播放到的调用。', en: 'The right rail shows only the live path; faded nodes in the main graph are later calls from the same Trace.' },
    },
    {
      stepId: 'base',
      title: { zh: '② 终止条件 n ≤ 1', en: '② Base case n ≤ 1' },
      explanation: {
        zh: 'n 为 0 时直接返回 0，n 为 1 时直接返回 1，不再产生子调用。没有这个终止条件，两个分支会无限向下展开。',
        en: 'n = 0 returns 0 and n = 1 returns 1 without any child call. Without this base case both branches would expand forever.',
      },
      tip: { zh: 'fib(0)=0 与 fib(1)=1 都要单独覆盖，不能把终止条件误写成 n < 1。', en: 'Cover both fib(0)=0 and fib(1)=1; do not write n < 1 by mistake.' },
    },
    {
      stepId: 'left',
      title: { zh: '③ 展开左分支 fib(n−1)', en: '③ Expand the left branch fib(n−1)' },
      explanation: {
        zh: '父帧先调用 fib(n−1)。父帧本身停在原地等待，因此调用栈加深一层；左子树会一直展开到终止条件。',
        en: 'The parent calls fib(n−1) first and suspends itself, so the stack gains one layer. The left subtree expands until it reaches the base case.',
      },
      tip: { zh: '此时父帧还没有 left、right 或结果，只有自己的 n。', en: 'At this point the parent has no left, right or result yet — only its own n.' },
    },
    {
      stepId: 'left-return',
      title: { zh: '④ 左分支返回', en: '④ The left branch returns' },
      explanation: {
        zh: '左子调用返回后，父帧恢复执行，把结果保存到 left。此时右分支还没有开始，父帧仍然不能相加。',
        en: 'When the left child returns, the parent resumes and stores the value in left. The right branch has not started, so the parent still cannot add.',
      },
      tip: { zh: '对比返回前后：子帧弹出，父帧从等待变为活动，left 出现在局部变量里。', en: 'Compare before/after: the child pops, the parent becomes active, and left appears in its locals.' },
    },
    {
      stepId: 'right',
      title: { zh: '⑤ 展开右分支 fib(n−2)', en: '⑤ Expand the right branch fib(n−2)' },
      explanation: {
        zh: '拿到 left 后，父帧才调用 fib(n−2)。右分支是另一个独立的子树，同一个 n−2 可能已经在左子树里算过。',
        en: 'Only after obtaining left does the parent call fib(n−2). The right branch is a separate subtree, and the same n−2 may already have been computed on the left.',
      },
      tip: { zh: '右分支参数是 n−2，不是 n−1；这是斐波那契与阶乘最关键的结构差异。', en: 'The right argument is n−2, not n−1; this is the key structural difference from factorial.' },
    },
    {
      stepId: 'right-return',
      title: { zh: '⑥ 右分支返回', en: '⑥ The right branch returns' },
      explanation: {
        zh: '右子调用返回，结果保存到 right。现在父帧同时拥有 left 和 right，两个子问题都已完成，可以合并。',
        en: 'The right child returns and its value is stored in right. The parent now owns both left and right, so both subproblems are complete and can be combined.',
      },
      tip: { zh: '右分支可能重复计算同一个 n，这也是朴素递归时间复杂度的来源。', en: 'The right branch may recompute the same n; that is exactly where the exponential cost comes from.' },
    },
    {
      stepId: 'combine',
      title: { zh: '⑦ 合并两个返回值', en: '⑦ Combine the two returns' },
      explanation: {
        zh: '本层执行 result = left + right，只做一次加法。节点上的 “left + right = result” 来自真实局部变量，不是事后推算。',
        en: 'This layer executes result = left + right, one addition. The “left + right = result” shown on the node comes from the real locals, not a later guess.',
      },
      tip: { zh: '只有两个分支都返回后才出现合并；先返回的子结果不能提前决定父结果。', en: 'Combination appears only after both branches return; one child alone cannot determine the parent.' },
    },
    {
      stepId: 'return',
      title: { zh: '⑧ 本层返回并弹栈', en: '⑧ Return and pop this frame' },
      explanation: {
        zh: '父帧把 result 返回给它的调用者，随后自己的帧被弹出。返回顺序沿树的后序路径进行：先子后父，回到根节点。',
        en: 'The parent returns result to its caller and its frame pops. Returns follow the tree’s post-order path: children first, then parents, back to the root.',
      },
      tip: { zh: '返回事件中帧状态变为 returning，returnValue 就是这一层的结果。', en: 'On the return event the frame becomes returning and returnValue is this layer’s result.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑨ 根节点完成', en: '⑨ The root completes' },
      explanation: {
        zh: '根调用返回后调用栈清空，answer 就是 fib(n)。整棵树里出现过的帧都已返回，但同一 n 的多个节点说明它们被重复计算过。',
        en: 'When the root returns the stack is empty and answer is fib(n). Every frame in the tree has returned, but multiple nodes with the same n show that those subproblems were recomputed.',
      },
      tip: { zh: '若加入记忆化缓存，相同 n 可直接复用，树会退化成 O(n) 个不同子问题；本课程仍展示未缓存的朴素行为。', en: 'A memo cache would reuse the same n and collapse the tree to O(n) distinct subproblems; this course still shows the uncached naive behaviour.' },
    },
  ],
  commonMistakes: {
    zh: [
      '终止条件写成 n < 1 或只处理 n = 0，漏掉 fib(1) 的返回值。',
      '右分支误写成 fib(n−1)，把斐波那契树变成两条相同的链，结果和调用次数都不对。',
      '在左分支返回前就尝试相加，误以为父帧能同时拿到两个子结果。',
      '把“重复计算同一个 fib(k)”误认为可以共用同一个帧；每次调用都有独立 frameId。',
      '看到指数级调用次数，就以为空间也是指数级；实际活动调用栈只有 O(n) 深。',
    ],
    en: [
      'Using n < 1 or handling only n = 0, which misses the fib(1) return value.',
      'Writing the right branch as fib(n−1), turning the tree into two identical chains with wrong results and call counts.',
      'Adding before the left branch returns, as if the parent could hold both child results at once.',
      'Assuming repeated fib(k) calls share a frame; every call has an independent frameId.',
      'Inferring exponential space from exponential calls; the live call stack is only O(n) deep.',
    ],
  },
};
