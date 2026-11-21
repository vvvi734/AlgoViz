import type { Lesson } from './types';

/**
 * Chapter 3 stack course. Original prose (no text or illustrations copied from
 * any textbook). Step ids are the exact `lesson_step=` values emitted by the
 * real Python preset in `structureExamples.ts`.
 *
 * The same course covers both storage modes. Switching storage in the input
 * panel re-runs the same operation list; the visual model then paints either
 * the array slots plus `top` or the linked nodes plus `top` pointer.
 */
export const stackLesson: Lesson = {
  lessonId: 'stack-lifo-basics',
  algorithmId: 'stack',
  contentVersion: '2.0.0',
  title: { zh: '栈：一种受限的线性表', en: 'Stack: a restricted linear list' },
  oneLiner: {
    zh: '只能在栈顶插入和删除，最后进入的元素最先离开（LIFO）。',
    en: 'Insert and delete only at TOP; the last element in is the first out (LIFO).',
  },
  overview: {
    zh: '栈是限定仅在表尾进行插入和删除的线性表。允许插入、删除的一端叫栈顶（top），另一端叫栈底（bottom）。栈底固定不动，栈顶随操作移动；没有元素时称为空栈。栈可以采用顺序存储（数组加 top 下标），也可以采用链式存储（top 指针加结点 next）。两种实现改变的是存储方式，不改变 LIFO 规则。',
    en: 'A stack is a linear list whose insertions and deletions are restricted to one end. The active end is TOP, the fixed end is the bottom. With no elements it is empty. It can be stored sequentially (an array plus a top index) or linked (a top pointer plus node next links). The storage changes; the LIFO rule does not.',
  },
  intuition: {
    zh: '想象一摞盘子：新盘子只能压在最上面，取盘子也只能从最上面取，不能直接抽走最底下那个。顺序栈就是给这摞盘子编号的数组，top 记录当前最上面盘子的下标；链栈则是每个盘子用 next 指向下面那个，top 直接指向最上面的结点。空栈时顺序栈 top = -1，链栈 top = NULL。',
    en: 'Picture a pile of plates: a new plate goes on top, and you take one from the top; you cannot pull the bottom plate out. A sequential stack numbers the slots and lets top index the top plate. A linked stack lets each plate point to the one below and keeps top at the first node. Empty means top = -1 for the array and top = NULL for the links.',
  },
  prerequisites: {
    zh: ['知道数组下标从 0 开始', '理解指针/引用与 next 的含义', '知道“栈顶”和“栈底”不是同一个位置'],
    en: ['Zero-based array indices', 'Pointers or references and what next means', 'TOP and bottom are different ends'],
  },
  complexity: {
    time: 'push O(1) · pop O(1) · peek O(1)',
    space: 'O(n)',
    note: {
      zh: '顺序栈的 push 只做 ++top 和一次写入，pop 只读取后 --top；链栈的 push/pop 只改 top 和首结点 next。两者都是 O(1)。顺序栈的空间在创建时按容量固定分配，可能浪费空槽；链栈按需申请结点，但有 next 指针开销。查找某个值仍要逐个扫描，O(n)。',
      en: 'A sequential push increments top and writes once; a pop reads then decrements top. A linked push/pop only rewires top and the first next. Both are O(1). The array allocates capacity up front and may waste slots; links allocate on demand but pay for next pointers. Searching a value still scans, O(n).',
    },
  },
  steps: [
    {
      stepId: 'empty',
      title: { zh: '① 空栈：top 的约定', en: '① Empty stack: the top convention' },
      explanation: {
        zh: '顺序栈用 top 表示当前栈顶下标，空栈约定 top = -1；第一个元素入栈后 top 变成 0。链栈没有数组下标，空栈约定 top = NULL。两种约定都必须先判断空栈，不能直接读取栈顶。',
        en: 'A sequential stack uses top as the index of the current top; empty is top = -1, and the first push makes it 0. A linked stack has no array index and uses top = NULL. Both must test emptiness before reading TOP.',
      },
      tip: { zh: 'top 是“当前栈顶的位置”，不是“下一个空位”。', en: 'top is the current TOP position, not the next free slot.' },
    },
    {
      stepId: 'push',
      title: { zh: '② Push：在栈顶插入', en: '② Push: insert at TOP' },
      explanation: {
        zh: '顺序栈先检查是否已满，然后 ++top，把新值写入 data[top]。链栈先申请新结点，让新结点的 next 指向原 top，再让 top 指向新结点。两者都只改栈顶一侧，因此是 O(1)。',
        en: 'A sequential stack checks fullness, increments top, then writes data[top]. A linked stack allocates a node, points its next at the old top, then moves top to the new node. Both touch only the TOP side, so both are O(1).',
      },
      tip: { zh: '链栈的插入顺序不能反：先让新结点指向旧栈顶，再移动 top。', en: 'Linked push order matters: link the new node to the old top first, then move top.' },
    },
    {
      stepId: 'full',
      title: { zh: '③ 栈满：顺序栈的边界', en: '③ Full: the array boundary' },
      explanation: {
        zh: '顺序栈容量固定。若 top 已经等于 capacity - 1，再 push 就会越界，必须拒绝并报告“栈满”，不能覆盖别的内存。链栈没有预分配容量，只要内存允许就能继续申请结点，因此不存在“栈满”，只可能申请失败。',
        en: 'A sequential stack has a fixed capacity. If top already equals capacity - 1, another push would run past the array, so it must be rejected as “full” rather than overwrite memory. A linked stack has no preallocated capacity and only fails when allocation fails, so it has no full state.',
      },
      tip: { zh: '默认顺序栈容量为 4；第 4 次 push 后 top = 3，即栈满。', en: 'The default array capacity is 4; after the fourth push top = 3, which is full.' },
    },
    {
      stepId: 'peek',
      title: { zh: '④ Peek：读取栈顶但不删除', en: '④ Peek: read TOP without removing' },
      explanation: {
        zh: 'Peek（也常写作 top 或 getTop）只返回当前栈顶值：顺序栈读 data[top]，链栈读 top 结点的值。它不改变 top，也不改变元素个数。空栈时没有栈顶，peek 必须报错或返回一个明确的空值约定。',
        en: 'Peek (also top or getTop) returns the current TOP value: data[top] for an array, the top node’s value for links. It changes neither top nor the element count. On an empty stack there is no TOP, so peek must fail or use an explicit empty convention.',
      },
      tip: { zh: 'Peek 后紧接 Pop，取出的仍是同一个元素。', en: 'A pop right after peek still removes that same element.' },
    },
    {
      stepId: 'pop',
      title: { zh: '⑤ Pop：删除栈顶', en: '⑤ Pop: delete TOP' },
      explanation: {
        zh: '顺序栈先保存 data[top] 作为返回值，再 --top，逻辑上删除该元素；数组里的旧值可以暂时留着，但不再属于栈。链栈先保存 top 结点，再让 top = top.next，最后释放旧结点。被删除的永远是最后进入的元素，这就是 LIFO。',
        en: 'A sequential pop saves data[top] as the result, then decrements top; the old cell may still contain a value but is no longer part of the stack. A linked pop saves the top node, moves top to top.next, then frees the old node. The element removed is always the newest arrival: LIFO.',
      },
      tip: { zh: '回退时间轴到 Pop 之前，被删元素必须重新出现在栈顶。', en: 'Scrub back before the pop: the removed element must return at TOP.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑥ 结束：同一规则，两种存储', en: '⑥ Done: one rule, two layouts' },
      explanation: {
        zh: '演示结束时，顺序栈与链栈都应得到相同的逻辑序列：底部是最早进入的元素，顶部是最后进入的元素。区别只在物理表示：数组用连续槽位和 top 下标，链栈用离散结点和 next 指针。push、pop、peek 都是 O(1)，保存 n 个元素需要 O(n) 空间。',
        en: 'At the end both layouts must produce the same logical sequence: oldest at the bottom, newest at TOP. Only the physical representation differs: contiguous slots plus top versus scattered nodes plus next. Push, pop and peek are O(1); storing n elements costs O(n).',
      },
      tip: { zh: '切换存储方式后重新运行，逻辑结果必须一致。', en: 'Switch storage and rerun: the logical result must stay identical.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把 top 当成“下一个空位”：本课程的顺序栈约定 top 指向当前栈顶，空栈为 -1。',
      '链栈 push 时先移动 top 再连接 next，导致旧栈顶丢失。',
      '顺序栈不检查 capacity 就继续 push，造成数组越界。',
      '把 peek 当成 pop：peek 只读，元素个数不能减少。',
      '认为链栈也有“栈满”：链式存储没有预分配容量，只有内存申请失败。',
      '用 stack[0] 当栈顶；顺序栈的栈顶是 data[top]，不是第一个槽位。',
    ],
    en: [
      'Treating top as the next free slot: this course uses top as the current TOP, with -1 for empty.',
      'Moving top before linking next during a linked push, which loses the old top.',
      'Pushing without checking capacity, which writes past the array.',
      'Treating peek as pop: peek only reads and must not reduce the count.',
      'Assuming a linked stack has a “full” state: it allocates on demand and only fails when allocation fails.',
      'Using stack[0] as TOP; the sequential TOP is data[top], not the first slot.',
    ],
  },
};
