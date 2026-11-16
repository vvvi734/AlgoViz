import type { Lesson } from './types';

/**
 * Stage 7B queue course. Original bilingual prose. Step ids match the real
 * `lesson_step=` values emitted by the Python deque preset.
 */
export const queueLesson: Lesson = {
  lessonId: 'queue-fifo-basics',
  algorithmId: 'queue',
  contentVersion: '1.0.0',
  title: { zh: '队列：从队尾进、从队首出', en: 'Queue: enter at REAR, leave at FRONT' },
  oneLiner: {
    zh: '最先进入队列的元素，会最先离开——这就是先进先出（FIFO）。',
    en: 'The element that arrived first leaves first — that is first-in, first-out (FIFO).',
  },
  overview: {
    zh: '队列像现实中的排队：新来的人站到队尾，服务完成后队首的人离开，中间的人依次向前移动。打印任务、消息处理、广度优先搜索都依赖这种顺序。与数组相比，队列的重点不是存储方式，而是两条固定规则：只能在队尾加入，只能在队首删除，因此不会出现“插队”。',
    en: 'A queue is a real line: newcomers join at the back, the person at the front leaves after being served, and everyone moves forward in order. Print jobs, message processing and breadth-first search all rely on this. Compared with an array, the point is not storage but two fixed rules: add only at REAR, remove only at FRONT — nobody can cut in.',
  },
  intuition: {
    zh: '把三个号码牌依次放到桌上：先放 3，再放 5，最后放 8。取牌时你从最左边拿走 3；3 离开后，5 成为新的队首。左边是 FRONT（队首），右边是 REAR（队尾）。',
    en: 'Put three numbered cards on a table: 3 first, then 5, then 8. When serving, you take 3 from the left; after 3 leaves, 5 becomes FRONT. The left end is FRONT, the right end is REAR.',
  },
  prerequisites: {
    zh: ['知道 Python 列表或 deque 的基本用法', '理解 append 与 popleft 的区别', '知道“先来后到”的排队规则'],
    en: ['Basic Python list or deque usage', 'Understanding the difference between append and popleft', 'Knowing the first-come-first-served rule'],
  },
  complexity: {
    time: 'O(1)',
    space: 'O(n)',
    note: {
      zh: 'deque 的 append 与 popleft 都在两端操作，是 O(1)。如果改用普通列表的 pop(0)，每次出队都要把后面所有元素前移，单次成本是 O(n)。队列保存 n 个元素，所以空间是 O(n)。',
      en: 'deque append and popleft work at the ends in O(1). Using a plain list’s pop(0) shifts every remaining element, costing O(n) per dequeue. The queue stores n elements, so space is O(n).',
    },
  },
  steps: [
    {
      stepId: 'empty',
      title: { zh: '① 空队列与两端', en: '① Empty queue and both ends' },
      explanation: {
        zh: '一开始队列里没有人，FRONT 与 REAR 重合，只是还没有元素。此时 Dequeue 或 Front 都没有对象可操作。',
        en: 'The line starts empty: FRONT and REAR coincide because there are no elements yet. Dequeue or Front has nothing to act on.',
      },
      tip: { zh: '记住方向：左侧 FRONT 是出口，右侧 REAR 是入口。', en: 'Remember the direction: FRONT on the left is the exit, REAR on the right is the entrance.' },
    },
    {
      stepId: 'enqueue',
      title: { zh: '② Enqueue：从队尾进入', en: '② Enqueue: enter at REAR' },
      explanation: {
        zh: 'Enqueue 把新元素放到队尾。queue.append(value) 在 deque 的右端追加，对应从右侧排队入场。3、5、8 依次进入后，3 仍在最左边，8 在最右边。',
        en: 'Enqueue adds a new element at REAR. queue.append(value) appends at the right end of the deque, matching a newcomer joining on the right. After 3, 5, 8 arrive, 3 is still leftmost and 8 is rightmost.',
      },
      tip: { zh: '连续入队不会改变队首，只会把队尾向右延伸。', en: 'Repeated enqueues keep FRONT fixed and extend REAR to the right.' },
    },
    {
      stepId: 'front',
      title: { zh: '③ Front：只查看队首', en: '③ Front: inspect FRONT only' },
      explanation: {
        zh: 'Front（或 Peek）读取 queue[0]，告诉你谁最先排队，但不会让他离开。动画只高亮最左边的 3，队列长度保持不变。',
        en: 'Front (or peek) reads queue[0] and tells you who has waited longest without removing them. The animation highlights leftmost 3 while the queue length stays unchanged.',
      },
      tip: { zh: 'Front 之后执行 Dequeue，离开的仍然是 3。', en: 'A dequeue after front still removes 3.' },
    },
    {
      stepId: 'dequeue',
      title: { zh: '④ Dequeue：从队首离开', en: '④ Dequeue: leave at FRONT' },
      explanation: {
        zh: 'Dequeue 删除并返回队首元素。3 从左侧离开后，5 自动成为新的 FRONT，8 仍是 REAR；剩下的人整体向前补位。这就是 FIFO：最早进入的 3 最先离开。',
        en: 'Dequeue removes and returns FRONT. After 3 leaves to the left, 5 becomes the new FRONT and 8 remains REAR; the line closes the gap. That is FIFO: earliest arrival 3 leaves first.',
      },
      tip: { zh: '回退时间轴到 Dequeue 之前，3 必须回到队首。', en: 'Scrub back before the dequeue: 3 must return to FRONT.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑤ 结束与复杂度', en: '⑤ Done and complexity' },
      explanation: {
        zh: '演示结束时，队列剩下 5 和 8，5 是新的队首。deque 的入队和出队都是 O(1)；用普通列表的 pop(0) 出队则会变成 O(n)。',
        en: 'At the end the queue holds 5 and 8, with 5 as the new FRONT. deque enqueue and dequeue are O(1); a plain list’s pop(0) would make dequeue O(n).',
      },
      tip: { zh: '队列常用于按到达顺序处理任务，也用于 BFS 的逐层扩展。', en: 'Queues process tasks in arrival order and drive BFS level by level.' },
    },
  ],
  commonMistakes: {
    zh: [
      '对空队列执行 dequeue 或 front，deque 会抛出 IndexError；先判断队列是否为空。',
      '用普通列表的 pop(0) 出队，虽然结果正确，但每次都会移动其余元素，复杂度变成 O(n)。',
      '把 Front 当成 Dequeue：Front 只读取队首，队列长度不应减少。',
      '从队尾出队或从队首入队，破坏了 FIFO；队列的两端各有固定职责。',
    ],
    en: [
      'Calling dequeue or front on an empty queue raises IndexError from deque; check emptiness first.',
      'Using a plain list’s pop(0): the result is right but every remaining element shifts, making it O(n).',
      'Treating Front as Dequeue: Front only reads FRONT and must not shorten the queue.',
      'Removing at REAR or inserting at FRONT breaks FIFO; each end has one fixed job.',
    ],
  },
};
