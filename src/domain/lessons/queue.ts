import type { Lesson } from './types';

/**
 * Chapter 3 queue course. Step ids match the real Python preset. The course
 * treats the circular array and linked queue as two legal implementations of
 * the same FIFO interface, not as two unrelated data structures.
 */
export const queueLesson: Lesson = {
  lessonId: 'queue-fifo-basics',
  algorithmId: 'queue',
  contentVersion: '2.0.0',
  title: { zh: '队列：在队尾进、在队首出', en: 'Queue: enter at REAR, leave at FRONT' },
  oneLiner: {
    zh: '只能在队尾插入、在队首删除，最先进入的元素最先离开（FIFO）。',
    en: 'Insert only at REAR, delete only at FRONT; the first element in is the first out (FIFO).',
  },
  overview: {
    zh: '队列是只允许在队尾（rear）插入、在队首（front）删除的线性表。它保持元素到达的先后次序，适合任务调度、消息缓冲和广度优先搜索。顺序队列直接用数组和 front/rear 下标时，反复出队会让 front 不断后移、前面空间无法再用；循环队列把数组首尾相接，用取模让 rear 回绕。链队列则用头尾指针把结点串起来。',
    en: 'A queue inserts only at REAR and deletes only at FRONT. It preserves arrival order and suits scheduling, message buffers and BFS. A plain array queue with front/rear indices wastes the slots before front; a circular queue wraps the array with modulo. A linked queue chains nodes with head and tail pointers.',
  },
  intuition: {
    zh: '排队买票时，新来的人站到队尾，窗口只服务队首，不能插队。循环队列像把一条队伍首尾接成一个环：物理数组仍有最后一个槽位，但 rear 走到末尾后会回到下标 0，逻辑上的队尾与物理末尾不是一回事。链队列像一串手拉手的人，front 记住排头，rear 记住排尾。',
    en: 'In a ticket line, newcomers join the back and the window serves only the front; nobody cuts in. A circular queue bends the line into a ring: the array still has a last slot, but rear returns to index 0 after it, so the logical tail is not the physical end. A linked queue is a chain of people with pointers to the first and last.',
  },
  prerequisites: {
    zh: ['知道数组下标与取模运算', '理解 front 与 rear 的职责', '理解“牺牲一个单元”的空满判定前提'],
    en: ['Array indices and modulo arithmetic', 'The distinct jobs of front and rear', 'The reserved-slot precondition for empty/full tests'],
  },
  complexity: {
    time: 'enqueue O(1) · dequeue O(1) · front O(1)',
    space: 'O(n)',
    note: {
      zh: '循环队列的 enqueue 只写 rear 槽并让 rear = (rear + 1) % capacity，dequeue 只读 front 槽并让 front 后移，都是 O(1)。链队列在 rear 后接结点、删除 head.next，也是 O(1)。若用普通数组队列但不回绕，front 前的空间会永久浪费；若用列表 pop(0) 模拟，则每次出队要搬移其余元素，单次 O(n)。',
      en: 'Circular enqueue writes the rear slot and advances rear modulo capacity; dequeue reads the front slot and advances front. Both are O(1). A linked queue links after rear and removes head.next, also O(1). A plain array queue without wrapping permanently wastes the space before front; a list pop(0) simulation shifts the rest, O(n) per dequeue.',
    },
  },
  steps: [
    {
      stepId: 'empty',
      title: { zh: '① 空队列：front 与 rear 重合', en: '① Empty: front and rear coincide' },
      explanation: {
        zh: '循环队列初始令 front = rear = 0，表示没有元素。链队列带头结点：front 指向头结点，rear 也指向头结点，头结点的 next 为 NULL。注意“front 等于 rear”只说明空，不能直接说明满，必须结合count或牺牲单元约定。',
        en: 'A circular queue starts with front = rear = 0. A linked queue with a dummy head has front and rear both pointing at the head, whose next is NULL. front == rear means empty under the reserved-slot rule; it must not be confused with full.',
      },
      tip: { zh: '本课程循环队列采用“牺牲一个单元”：front == rear 为空。', en: 'This circular queue reserves one slot: front == rear means empty.' },
    },
    {
      stepId: 'enqueue',
      title: { zh: '② Enqueue：在队尾写入', en: '② Enqueue: write at REAR' },
      explanation: {
        zh: '循环队列先检查是否已满，然后把新值写入 slots[rear]，再令 rear = (rear + 1) % capacity。链队列则在 rear 结点后接一个新结点，再把 rear 移到新结点。两种实现都不会改变 front，所以队首元素保持不变。',
        en: 'A circular enqueue checks fullness, writes slots[rear], then sets rear = (rear + 1) % capacity. A linked enqueue links a new node after rear and moves rear to it. Neither changes front, so the front element stays put.',
      },
      tip: { zh: '连续入队只有 rear 在动，front 不动。', en: 'Repeated enqueues move only rear; front stays fixed.' },
    },
    {
      stepId: 'full',
      title: { zh: '③ 队满：为什么要牺牲一个单元', en: '③ Full: why one slot is reserved' },
      explanation: {
        zh: '若不加区分，front == rear 既可能表示空，也可能表示绕一圈后装满。为让判定唯一，本课程牺牲一个槽位：当 (rear + 1) % capacity == front 时就认为队满，因此容量为 5 的数组最多存 4 个元素。也可以额外维护 count，但本课程的所有动画和参考代码统一采用牺牲单元约定。链队列按需申请结点，没有这个数组容量问题。',
        en: 'Without a convention, front == rear could mean empty or exactly full after a wrap. This course reserves one slot: (rear + 1) % capacity == front means full, so a capacity-5 array stores at most 4 items. A separate count is an alternative, but every animation and reference program here uses the reserved-slot rule. A linked queue allocates on demand and has no such array limit.',
      },
      tip: { zh: '容量 5 ≠ 可存 5 个；实际最多 4 个。', en: 'Capacity 5 does not mean 5 items; the maximum is 4.' },
    },
    {
      stepId: 'front',
      title: { zh: '④ Front：只查看队首', en: '④ Front: read FRONT only' },
      explanation: {
        zh: '循环队列读取 slots[front]；链队列读取头结点 next 指向的第一个数据结点。Front 不移动 front，也不减少 count，因此队列内容完全不变。空队列没有队首，必须先判空。',
        en: 'A circular front reads slots[front]; a linked front reads the first data node after the dummy head. Front moves nothing and does not decrement count. An empty queue has no front, so test emptiness first.',
      },
      tip: { zh: 'Front 后立刻 Dequeue，出队的仍是同一个元素。', en: 'A dequeue right after front removes that same element.' },
    },
    {
      stepId: 'dequeue',
      title: { zh: '⑤ Dequeue：从队首删除', en: '⑤ Dequeue: delete at FRONT' },
      explanation: {
        zh: '循环队列读出 slots[front]，清空该槽，再令 front = (front + 1) % capacity，count 减一。链队列删除头结点的 next 结点；如果删掉的正好是 rear，还要把 rear 拉回头结点，否则 rear 会指向已释放内存。最早进入的元素最先离开，这就是 FIFO。',
        en: 'A circular dequeue reads slots[front], clears it, advances front modulo capacity and decrements count. A linked dequeue removes head.next; if that node was also rear, rear must return to the head, or it would point at freed memory. The earliest arrival leaves first: FIFO.',
      },
      tip: { zh: '链队列删到最后一个数据结点时，rear 必须回到 head。', en: 'When the last data node leaves a linked queue, rear must return to head.' },
    },
    {
      stepId: 'wrap',
      title: { zh: '⑥ 回绕：物理末尾不是逻辑队尾', en: '⑥ Wrap: the physical end is not the logical tail' },
      explanation: {
        zh: '当 rear 位于 capacity - 1 时再入队，rear 会变成 0，而不是 capacity。此时数组末尾的槽位可能已经空出，新元素却写回下标 0；front 也可能在出队时从末尾回绕。判断逻辑顺序要用 (front + k) % capacity，不能简单认为“下标大的一定在后面”。链队列没有数组，不需要回绕，rear 永远沿 next 前进。',
        en: 'After an enqueue at rear = capacity - 1, rear becomes 0, not capacity. The last array slot may be free while a new item is written at index 0; front can also wrap during a dequeue. Logical order uses (front + k) % capacity, never “larger index means later”. A linked queue has no array to wrap; rear simply follows next.',
      },
      tip: { zh: '本示例在容量 5 的数组中先装满 4 个，出队一个后再入队，观察 rear 回到 0。', en: 'This preset fills 4 of 5 slots, dequeues one, then enqueues again so rear returns to 0.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑦ 结束：同一 FIFO，两种实现', en: '⑦ Done: one FIFO, two implementations' },
      explanation: {
        zh: '演示结束时，循环队列和链队列都应给出相同的逻辑队首到队尾序列。循环队列的优势是数组空间可重复利用、无指针开销；链队列的优势是不受固定容量限制、入队出队只改常数个指针。两者 enqueue、dequeue、front 都是 O(1)，保存 n 个元素需要 O(n) 空间。',
        en: 'At the end both layouts must yield the same logical front-to-rear sequence. The circular array reuses storage and avoids pointers; the linked queue has no fixed capacity and only rewires a constant number of links. Enqueue, dequeue and front are O(1) in both; n elements cost O(n) space.',
      },
      tip: { zh: '切换存储方式后重新运行，逻辑顺序必须一致。', en: 'Switch storage and rerun: the logical order must stay identical.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把 front == rear 一律当成空；在牺牲单元约定下它表示空，但判满要用 (rear + 1) % capacity == front。',
      '容量为 5 就以为能存 5 个；牺牲一个单元后最多 4 个。',
      'rear 自增后忘记取模，走到数组末尾就越界。',
      '链队列出队删掉最后一个数据结点后不把 rear 拉回 head，留下悬空指针。',
      '用“下标更大就更靠后”判断循环队列顺序；必须按 (front + k) % capacity 遍历。',
      '把 Front 当成 Dequeue，读取后错误地减少 count。',
    ],
    en: [
      'Treating front == rear as always empty; under the reserved-slot rule it is empty, but fullness is (rear + 1) % capacity == front.',
      'Assuming capacity 5 stores 5 items; one reserved slot leaves at most 4.',
      'Incrementing rear without modulo, which runs past the array.',
      'Leaving rear pointing at the removed last data node in a linked queue, creating a dangling pointer.',
      'Deciding circular order by “larger index means later”; traverse with (front + k) % capacity.',
      'Treating Front as Dequeue and wrongly decrementing count after a read.',
    ],
  },
};
