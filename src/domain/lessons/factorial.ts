import type { Lesson } from './types';

/**
 * Factorial recursion — the second full course.
 *
 * `stepId`s match the `lesson_step=` values emitted by the Python preset
 * (`call` / `return` come from the parameterised `@tracked` decorator, the rest
 * from explicit `trace()` calls inside the function). Different recursion
 * depths share the same step ids on purpose; frame identity stays independent.
 */
export const factorialLesson: Lesson = {
  lessonId: 'factorial-recursion-basics',
  algorithmId: 'factorial',
  contentVersion: '1.1.0',
  title: { zh: '递归阶乘：一层层下去，再一层层上来', en: 'Factorial recursion: go down layer by layer, then come back up' },
  oneLiner: {
    zh: '把 n! 拆成 n × (n-1)!，一路拆到 1! 为止，再把结果一层层乘回去。',
    en: 'Break n! into n × (n-1)!, keep breaking until 1!, then multiply the answers back up layer by layer.',
  },
  overview: {
    zh: '阶乘是理解递归的最小完整例子：它有一个明确的终止条件、一次规模更小的自我调用、以及把子结果组合成本层结果的动作。学完它，你就能看懂汉诺塔、树的遍历、归并排序等更复杂的递归。注意递归不是“循环的替代品”，它真的会在内存里堆起调用帧。',
    en: 'Factorial is the smallest complete example of recursion: a clear base case, one smaller self-call, and a combination step that turns the sub-result into this layer’s result. Once it clicks, tower of Hanoi, tree traversal and merge sort all become readable. Note that recursion is not a fancy loop — real call frames really do pile up in memory.',
  },
  intuition: {
    zh: '把“算 4!”这件事交给一个办事员。他不直接算，而是先问“3! 是多少”，自己只负责最后一乘。3! 的办事员同样去问 2!，2! 去问 1!。1! 的办事员发现已经到了终止条件，直接回答 1，不再向下问。于是答案沿原路返回：1 回到 2!（得到 2），2 回到 3!（得到 6），6 回到 4!（得到 24）。',
    en: 'Hand “compute 4!” to a clerk. Instead of computing it, the clerk asks “what is 3!?” and only does the final multiplication. The 3! clerk asks the 2! clerk, which asks the 1! clerk. The 1! clerk hits the base case and answers 1 without asking anyone. The answers then travel back: 1 → 2! gives 2, → 3! gives 6, → 4! gives 24.',
  },
  prerequisites: {
    zh: ['理解函数调用与返回值', '知道 if 判断和 return 的作用', '听过“调用栈”这个词'],
    en: ['Understanding function calls and return values', 'Knowing what if and return do', 'Having heard the term call stack'],
  },
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: {
      zh: '时间：从 n 一路递归到 1，共 n 层，每层只做一次乘法，所以是 O(n)（这里不计大整数乘法的成本）。空间：递归不返回就不释放，调用栈会同时保存 n 层帧，所以额外空间是 O(n)。',
      en: 'Time: n layers from n down to 1, one multiplication per layer, so O(n) (ignoring big-integer multiplication cost). Space: frames are not released until they return, so n frames are alive at the deepest point — O(n) extra space.',
    },
  },
  steps: [
    {
      stepId: 'call',
      title: { zh: '① 函数调用', en: '① Call the function' },
      explanation: {
        zh: '每次 factorial(n) 被调用，就产生一个新的调用帧：它有独立的参数 n、独立的局部变量，以及一个唯一标识。同一函数被调用多次时，这些帧互不干扰。',
        en: 'Each call to factorial(n) creates a new frame: its own parameter n, its own locals, and a unique id. Two calls of the same function never share a frame.',
      },
      tip: { zh: '看调用栈面板：最上面的帧是当前正在执行的那一层。', en: 'Look at the call stack: the top frame is the layer currently executing.' },
    },
    {
      stepId: 'check',
      title: { zh: '② 检查终止条件', en: '② Check the base case' },
      explanation: {
        zh: '进入函数后先判断 n <= 1。n = 0 和 n = 1 都直接返回 1，不再继续调用自己——这既符合 0! = 1，也保证递归一定停下来。',
        en: 'Right after entering, the function checks n <= 1. Both n = 0 and n = 1 return 1 immediately and never call themselves again — this matches 0! = 1 and guarantees the recursion stops.',
      },
      tip: { zh: '只有最上面那一层会命中终止条件，其他层都在等下一层的结果。', en: 'Only the deepest layer hits the base case; every other layer is waiting for its child.' },
    },
    {
      stepId: 'recurse',
      title: { zh: '③ 继续递归', en: '③ Recurse deeper' },
      explanation: {
        zh: 'n 大于 1 时，先把 (n-1)! 交给下一次调用。注意这一层此时还没有结果，它暂停在原地等子调用返回，调用栈因此变高一层。',
        en: 'When n is greater than 1, the (n-1)! work is handed to the next call. This layer has no result yet — it is suspended waiting for the child, which is exactly why the stack grows by one.',
      },
      tip: { zh: '对比前后两帧，栈深度加 1，参数 n 减 1。', en: 'Compare consecutive frames: depth grows by one while n drops by one.' },
    },
    {
      stepId: 'combine',
      title: { zh: '④ 本层计算', en: '④ Combine this layer' },
      explanation: {
        zh: '子调用返回后，这一层用拿到的 partial 乘以自己的 n，得到本层结果。每一层都只关心“自己的 n × 子结果”，不需要知道下面发生过什么。',
        en: 'Once the child returns, this layer multiplies its n by the partial it received. Every layer only cares about “my n × my child’s result” and knows nothing about the layers below.',
      },
      tip: { zh: '局部变量里同时出现 n、partial 和 result，正好对应这条乘法。', en: 'The locals show n, partial and result together — that is the multiplication.' },
    },
    {
      stepId: 'return',
      title: { zh: '⑤ 逐层返回', en: '⑤ Return upstream' },
      explanation: {
        zh: '本层把结果返回给调用者，自己的帧随即销毁，栈深度减一。返回的顺序是从最深的一层开始，一路回到最初那层。',
        en: 'This layer hands its result back and its frame is destroyed, so the depth drops by one. Returns happen from the deepest layer outward, back to where it all started.',
      },
      tip: { zh: '观察 returnValue：1 → 2 → 6 → 24，正是逐层乘回去的轨迹。', en: 'Watch returnValue: 1 → 2 → 6 → 24 is exactly the multiplication travelling back up.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑥ 完成计算', en: '⑥ Done' },
      explanation: {
        zh: '最外层返回后调用栈清空，answer 就是最终结果。若此时栈里还有帧，说明还有没返回的调用，结果一定不完整。',
        en: 'After the outermost call returns the stack is empty and answer is the final value. A non-empty stack here would mean some call never returned, so the result would be incomplete.',
      },
      tip: { zh: '把输入改成 5，再验证一次每层变化是否符合预期。', en: 'Change the input to 5 and check the same layer-by-layer pattern again.' },
    },
  ],
  commonMistakes: {
    zh: [
      '忘记写终止条件，或把它写进 else 分支以致永远走不到，最终触发 RecursionError。',
      '终止条件写成 n < 1，导致 n = 1 时还要继续调用 factorial(0)。',
      '递归调用写错方向（写成 factorial(n + 1)），规模没有变小，栈永远不收敛。',
      '把返回值算错，例如写成 n + factorial(n - 1)，得到的是累加而不是阶乘。',
      '以为递归层之间共享变量，实际上每层都有独立的 n 与局部变量。',
    ],
    en: [
      'Omitting the base case, or hiding it in a branch that can never run, ending in RecursionError.',
      'Writing n < 1 instead of n <= 1, so n = 1 still calls factorial(0).',
      'Recursing in the wrong direction (factorial(n + 1)), so the problem never shrinks.',
      'Combining with the wrong operator, e.g. n + factorial(n - 1), which sums instead of multiplying.',
      'Assuming layers share variables — each layer has its own n and its own locals.',
    ],
  },
};
