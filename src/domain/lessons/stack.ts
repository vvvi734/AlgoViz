import type { Lesson } from './types';

/**
 * Stage 7B stack course. Original prose (no text or illustrations copied from
 * any textbook). Step ids are the exact `lesson_step=` values emitted by the
 * real Python preset in `structureExamples.ts`.
 */
export const stackLesson: Lesson = {
  lessonId: 'stack-lifo-basics',
  algorithmId: 'stack',
  contentVersion: '1.0.0',
  title: { zh: '栈：只能从顶部进出的容器', en: 'Stack: a container with one open end' },
  oneLiner: {
    zh: '最后放进去的元素，会最先被取出来——这就是后进先出（LIFO）。',
    en: 'The element added last is removed first — that is last-in, first-out (LIFO).',
  },
  overview: {
    zh: '栈像一只只有顶部开口的桶：你只能把东西从上面放进去，也只能从上面拿走。它适合处理“最近发生的事情要最先处理”的场景，例如撤销操作、浏览器后退、函数调用返回。与数组相比，栈不是一种新的存储介质，而是一条操作规则：只允许在栈顶添加、查看和删除，因此实现简单、操作稳定。',
    en: 'A stack is like a bucket with only the top open: you can put something in or take something out only at that opening. It fits “the most recent thing must be handled first”: undo, browser back, and returning from a function call. Compared with an array, a stack is not a different storage medium but a rule: add, inspect and remove only at the top. That makes it simple and predictable.',
  },
  intuition: {
    zh: '想象一摞盘子。新盘子放在最上面，拿盘子也从最上面拿；你不可能直接抽出最底下的盘子。每放一个，栈顶就上移一格；每取一个，栈顶就下移一格。所谓“栈顶指针”，就是始终标记最上面那个元素的位置。',
    en: 'Picture a pile of plates. A new plate goes on top, and you take a plate from the top; you cannot pull the bottom plate out directly. Each push moves the top up one slot, each pop moves it down. The “top pointer” simply marks the uppermost element.',
  },
  prerequisites: {
    zh: ['知道 Python 列表的基本读写', '理解 append 与 pop 的作用', '知道索引 -1 表示最后一个元素'],
    en: ['Basic Python list reads and writes', 'Understanding what append and pop do', 'Knowing that index -1 means the last element'],
  },
  complexity: {
    time: 'O(1)',
    space: 'O(n)',
    note: {
      zh: '在尾部 append、从尾部 pop、读取 stack[-1] 都只碰最后一个位置，所以 push、pop、peek 是 O(1)。如果要查找某个值或删除中间元素，就必须逐个检查，最坏 O(n)。栈本身要保存 n 个元素，因此空间是 O(n)。',
      en: 'append at the end, pop from the end and reading stack[-1] touch only the last slot, so push, pop and peek are O(1). Searching for a value or deleting a middle element requires scanning, O(n) in the worst case. The stack stores n elements, so space is O(n).',
    },
  },
  steps: [
    {
      stepId: 'empty',
      title: { zh: '① 空栈与栈顶', en: '① Empty stack and TOP' },
      explanation: {
        zh: '一开始桶里没有元素，称为空栈。此时没有栈顶元素，任何 pop 或 peek 都没有东西可操作。代码先画出一个空容器，准备接收第一个 Push。',
        en: 'The bucket starts with no elements: an empty stack. There is no top element, so pop or peek has nothing to act on. The code first draws an empty container ready for the first push.',
      },
      tip: { zh: '空栈不是错误状态，它只是“还没有元素”。', en: 'An empty stack is not an error; it simply has no elements yet.' },
    },
    {
      stepId: 'push',
      title: { zh: '② Push：从顶部进入', en: '② Push: enter at the top' },
      explanation: {
        zh: 'Push 把新元素放到栈顶，成为新的最后进入者。Python 的 stack.append(value) 在列表尾部追加，正好对应桶口。后进来的元素会盖住先来的元素，所以最后进入的 8 现在位于栈顶。',
        en: 'Push puts a new element on top and makes it the newest arrival. Python’s stack.append(value) adds at the end of the list, exactly at the bucket opening. Later elements sit above earlier ones, so the last pushed 8 is now TOP.',
      },
      tip: { zh: '看数值块的上下顺序：3 在底部，5 在中间，8 在顶部。', en: 'Read the blocks from bottom to top: 3 at the bottom, 5 in the middle, 8 at TOP.' },
    },
    {
      stepId: 'peek',
      title: { zh: '③ Peek：只查看栈顶', en: '③ Peek: inspect TOP only' },
      explanation: {
        zh: 'Peek 读取 stack[-1]，告诉你当前栈顶是谁，但不会删除它。动画只把栈顶高亮，元素数量保持不变；这与 Pop 有本质区别。',
        en: 'Peek reads stack[-1] and tells you the current top without deleting it. The animation highlights TOP while the element count stays the same — fundamentally different from pop.',
      },
      tip: { zh: 'Peek 之后再做 Pop，取出的仍然是同一个栈顶元素。', en: 'If you pop after a peek, you still remove that same top element.' },
    },
    {
      stepId: 'pop',
      title: { zh: '④ Pop：从顶部离开', en: '④ Pop: leave through the top' },
      explanation: {
        zh: 'Pop 删除并返回栈顶元素。8 离开后，下面的 5 自动成为新的栈顶；这正是 LIFO：最后进来的 8 最先离开。动画用一块淡出的“已离开”块表示被删除的元素，而栈内只剩 3 和 5。',
        en: 'Pop removes and returns the top element. After 8 leaves, the 5 below becomes the new top — that is LIFO: the last arrival, 8, leaves first. A fading “left” block marks the removed element while the stack keeps only 3 and 5.',
      },
      tip: { zh: '回退时间轴到 Pop 之前，8 必须重新出现在栈顶。', en: 'Scrub back before the pop: 8 must reappear at TOP.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑤ 结束与复杂度', en: '⑤ Done and complexity' },
      explanation: {
        zh: '演示结束时，栈里剩下 3 和 5，5 是当前栈顶。Push、Pop、Peek 都只操作栈顶，所以是 O(1)；但栈需要保存所有元素，空间是 O(n)。',
        en: 'At the end the stack holds 3 and 5, with 5 at TOP. Push, pop and peek touch only the top, so they are O(1); storing every element costs O(n) space.',
      },
      tip: { zh: '如果不断 Push 而不 Pop，空间会线性增长。', en: 'Pushing without popping makes the space grow linearly.' },
    },
  ],
  commonMistakes: {
    zh: [
      '对空栈执行 pop 或 peek，程序会抛出 IndexError；操作前应先判断栈是否为空。',
      '把 peek 当成 pop：peek 只读取栈顶，元素数量不应减少。',
      '用栈底元素做栈顶：stack[-1] 才是最后进入的元素，stack[0] 是最早进入的元素。',
      '把栈和队列混为一谈：栈从同一端进出，队列从队尾进、队首出。',
    ],
    en: [
      'Calling pop or peek on an empty stack raises IndexError; check emptiness first.',
      'Treating peek as pop: peek only reads TOP and must not reduce the element count.',
      'Using the bottom as the top: stack[-1] is the newest element, stack[0] the oldest.',
      'Confusing a stack with a queue: a stack uses one end, a queue enters at REAR and leaves at FRONT.',
    ],
  },
};
