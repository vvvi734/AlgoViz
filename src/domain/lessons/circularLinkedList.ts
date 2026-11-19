import type { Lesson } from './types';

/**
 * L1A circular singly linked-list course. Step ids match the real CNode preset:
 * `traverse-circle`, not `traverse-forward`, and the Python loop stops on
 * `current is head`, never on `next is None`.
 */
export const circularLinkedListLesson: Lesson = {
  lessonId: 'circular-linked-list-cycle',
  algorithmId: 'circular',
  contentVersion: '1.0.0',
  title: { zh: '循环单链表：让 tail.next 回到 head', en: 'Circular singly linked list: closing tail.next to head' },
  oneLiner: {
    zh: '最后一个节点的 next 不是 None，而是指回 head；遍历必须靠“回到起点”终止。',
    en: 'The last node’s next is not None but a reference back to head; traversal must stop by returning to the start.',
  },
  overview: {
    zh: '循环单链表仍然是单链表，每个节点只有一个 next。它与普通单链表的结构约定不同：非空时 head 指向首节点，tail.next 指向 head；空表时 head 和 tail 都是 None；只有一个节点时该节点 next 指向自身，head = tail。因为链上没有 None 终止，遍历一整圈必须判断 current 是否回到 head，否则会无限循环。适用场景包括轮转调度、约瑟夫环、环形缓冲区、多人轮流操作以及需要从尾部直接回到头部的循环扫描。它不适用于需要明确 NULL 终止或频繁反向遍历的场景。',
    en: 'A circular singly linked list is still a singly linked list: each node has one next. Its structural contract differs: when non-empty, head points at the first node and tail.next points back to head; an empty list has head = tail = None; a single node points to itself and head = tail. Because there is no None terminator, a full traversal must test whether current has returned to head or it will loop forever. Typicals uses include round-robin scheduling, the Josephus ring, ring buffers, taking turns, and cyclic scans that jump from tail back to head. It is a poor fit when you need an explicit NULL terminator or frequent backward traversal.',
  },
  intuition: {
    zh: '把节点排成一个圆圈，tail 不是“终点”，只是“进入圆圈前的最后一站”。从 head 出发一直走 next，最终会回到 head；这时必须主动停，而不是等待 next 变成 None。空表时圆圈不存在，head 和 tail 都是 None；只有一个节点时，这个节点自己指向自己，形成最小的一圈。头尾标记帮助你看清 tail.next 应该改指向谁。',
    en: 'Lay the nodes on a circle. tail is not an endpoint, only the last stop before returning to the start. Walk next from head and you eventually come back to head; stop there instead of waiting for next to become None. An empty list has no circle: head and tail are both None. A single node points to itself, the smallest possible circle. The head and tail markers show what tail.next must point at.',
  },
  prerequisites: {
    zh: ['理解 Python 对象引用与 None', '知道单链表 head、tail 与 next', '能写出“沿 next 遍历直到 None”的单链表循环'],
    en: ['Python object references and None', 'Singly linked lists: head, tail and next', 'Writing a singly-list walk that stops at None'],
  },
  complexity: {
    time: '查找 O(n) · 头/尾操作取决于 head/tail 维护方式',
    space: 'O(n)',
    note: {
      zh: '按值查找和完整一圈遍历都要检查 n 个节点，是 O(n)。若同时维护 head 和 tail，头部插入可在 O(1) 完成（新节点 next 指旧 head，tail.next 改指新节点，head 前移）；尾部插入也可 O(1)（tail.next 指新节点，新节点 next 指 head，tail 前移）。删除头节点在 O(1)：head 前移并把 tail.next 改指新 head；但单链表删除尾节点仍要 O(n) 找前驱，即使有 tail 也不能直接后退。若只维护 head 而没有 tail，尾插要先走 n 个节点。不要笼统宣称循环链表所有操作都是 O(1)。空间 O(n)，每个节点只有一条 next。',
      en: 'Searching by value and one full-circle traversal inspect n nodes, O(n). With both head and tail maintained, head insertion is O(1): the new node points at the old head, tail.next is redirected to the new node, and head moves. Tail insertion is also O(1): tail.next points at the new node, the new node points at head, and tail moves. Head deletion is O(1): head moves forward and tail.next follows the new head. Deleting the tail is still O(n) in a singly list because the predecessor must be found; having tail does not allow walking backward. With only head and no tail, tail insertion first walks n nodes. Do not claim every circular-list operation is O(1). Space is O(n), with one next reference per node.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 空表：head = tail = None', en: '① Empty list: head = tail = None' },
      explanation: {
        zh: '一开始没有节点，head 和 tail 都是 None。空表没有回环，也没有“tail.next 指向 head”这回事。任何遍历、查找或删除都必须先判断 head 是否为 None，否则第一步访问 head.value 就会失败。',
        en: 'There are no nodes yet, so head and tail are both None. There is no cycle and no “tail.next points to head” yet. Every traversal, search or deletion must check head for None first, or the first head.value access fails.',
      },
      tip: { zh: '空表的判据是 head is None；不是 tail.next is None。', en: 'An empty list is detected by head is None, not by tail.next is None.' },
    },
    {
      stepId: 'insert-head',
      title: { zh: '② 头部插入：更新 head 与回环', en: '② Head insertion: move head and close the return edge' },
      explanation: {
        zh: '非空时先 new.next = 旧 head，让新节点接住旧首节点；再 tail.next = new，把回环从旧 head 改到新节点；最后 head = new。空表插入时新节点同时成为 head 和 tail，并执行 new.next = new 建立自环。完成帧必须满足 tail.next = head。',
        en: 'When non-empty, first new.next = old head so the new node holds the old first node; then tail.next = new so the return edge moves from old head to the new node; finally head = new. Inserting into an empty list makes the node both head and tail and closes the self-loop with new.next = new. The complete frame must satisfy tail.next = head.',
      },
      tip: { zh: '头插改两条边：new.next = 旧 head，tail.next = new。', en: 'Head insertion changes two links: new.next = old head, then tail.next = new.' },
    },
    {
      stepId: 'insert-tail',
      title: { zh: '③ 尾部插入：旧尾接新节点，新节点指回 head', en: '③ Tail insertion: old tail to new, new back to head' },
      explanation: {
        zh: '非空时先 tail.next = new，再 new.next = head，最后 tail = new。这样旧尾不再指向 head，而是指向新节点；新节点承担新的回环。空表插入时 head = tail = new，并执行 new.next = new。若先改 tail 再取旧 tail.next，就会丢失旧尾的引用。',
        en: 'When non-empty, run tail.next = new, then new.next = head, then tail = new. The old tail now points at the new node instead of head, and the new node carries the return edge. For an empty list, head = tail = new and new.next = new. Moving tail before reading the old tail.next loses the old tail reference.',
      },
      tip: { zh: '尾插也要改两条边：旧 tail.next 和 new.next，不是只改 tail。', en: 'Tail insertion changes two links too: old tail.next and new.next, not just tail.' },
    },
    {
      stepId: 'insert-middle',
      title: { zh: '④ 中间插入：新节点接入环，tail 可能移动', en: '④ Middle insertion: splice into the ring, tail may move' },
      explanation: {
        zh: '先按值找到 target。创建 new 后执行 new.next = target.next，再执行 target.next = new。若 target 是尾节点，新节点接管回环，必须把 tail 改成 new；若 target 在中间，tail 不动，但 tail.next 仍必须指向 head。完成帧要检查整圈没有断点。',
        en: 'Find target by value. After creating new, run new.next = target.next, then target.next = new. If target was the tail, the new node takes over the return edge and tail must move to new; if target was in the middle, tail stays but tail.next must still point at head. The complete frame must have no break anywhere on the circle.',
      },
      tip: { zh: '中间插入后，tail 不一定是新节点；要看 target 是否原本是尾。', en: 'After middle insertion tail is not necessarily the new node; it depends on whether target was the old tail.' },
    },
    {
      stepId: 'traverse-circle',
      title: { zh: '⑤ 遍历一整圈：回到 head 就停止', en: '⑤ One full circle: stop when back at head' },
      explanation: {
        zh: 'current 从 head 开始，访问后执行 current = current.next。终止条件不是 current is None，而是 current is head：一旦回到起点，说明整圈已经走完，必须 break。计数器显示本圈访问了几个节点；正确结果应恰好等于链表长度，不重复、不遗漏。',
        en: 'current starts at head, visits it, then runs current = current.next. The stop condition is not current is None but current is head: once the walk returns to the start the full circle is done and the loop must break. A counter shows how many nodes this circle visited; the correct result is exactly the list length, no repeats and no omissions.',
      },
      tip: { zh: '循环链表最危险的错误是等待 None；它永远不会来。', en: 'The dangerous mistake is waiting for None; in a circular list it never arrives.' },
    },
    {
      stepId: 'find',
      title: { zh: '⑥ 按值查找：命中即停，回到 head 判未命中', en: '⑥ Search: stop on a hit, return to head means miss' },
      explanation: {
        zh: '从 head 出发逐节点比较。相等就发 found 并立即返回，不继续绕圈；走完一圈又回到 head 仍未命中，才发 not-found 并停止。空表直接 not-found。搜索不存在的值时绝不能无限循环。',
        en: 'Compare node by node from head. On equality emit found and return immediately without another lap; only after a full lap back to head with no match emit not-found and stop. An empty list is an immediate miss. Searching for a missing value must never loop forever.',
      },
      tip: { zh: '命中要提前 return；未命中要在一圈后 break。', en: 'A hit returns early; a miss breaks after one full lap.' },
    },
    {
      stepId: 'delete-middle',
      title: { zh: '⑦ 删除中间节点：前驱越过目标', en: '⑦ Delete middle: predecessor bypasses the target' },
      explanation: {
        zh: '找到 target 及其前驱 previous，执行 previous.next = target.next，把前驱直接接到后继；然后 target.next = None 并 detach。tail 和 head 都不动，但完成帧仍要满足 tail.next = head。若 target 是尾节点，就属于删尾，不能套用这条中间路径。',
        en: 'Find target and its predecessor previous, run previous.next = target.next so the predecessor connects to the successor; then clear target.next and detach. Neither head nor tail moves, but the complete frame still requires tail.next = head. If target is the tail this is a tail deletion, not this middle path.',
      },
      tip: { zh: '中间删除只改前驱的 next；目标自己的 next 最后清空。', en: 'Middle deletion changes the predecessor’s next; the target’s own next is cleared last.' },
    },
    {
      stepId: 'delete-head',
      title: { zh: '⑧ 删除头节点：head 前移，回环跟随', en: '⑧ Delete head: move head, return edge follows' },
      explanation: {
        zh: '非空且不止一个节点时，head = target.next，然后 tail.next = head，让旧尾的回环改指新首节点。只有唯一节点时，head 和 tail 都变 None，链表变空。完成帧必须检查 tail.next = head；只改 head 不改 tail.next，会留下指向已删除节点的回环。',
        en: 'With more than one node, head = target.next, then tail.next = head so the old tail’s return edge follows the new first node. With only one node, head and tail become None and the list is empty. The complete frame must satisfy tail.next = head; moving head without updating tail.next leaves a return edge to the removed node.',
      },
      tip: { zh: '删头后 tail 不变，但 tail.next 必须改指新 head。', en: 'After head deletion tail is unchanged, but tail.next must follow the new head.' },
    },
    {
      stepId: 'delete-tail',
      title: { zh: '⑨ 删除尾节点：tail 后移，新尾指回 head', en: '⑨ Delete tail: move tail, new tail returns to head' },
      explanation: {
        zh: '先找 target 的前驱 previous。tail = previous，然后 previous.next = head，最后清空 target.next 并 detach。删除唯一节点时 head 和 tail 都变 None。完成帧要求新 tail.next = head。注意：即便有 tail，单链表找尾节点的前驱仍要 O(n)。',
        en: 'Find target’s predecessor previous. Set tail = previous, then previous.next = head, then clear target.next and detach. Removing the only node clears head and tail. The complete frame requires new tail.next = head. Even with tail, finding the predecessor of the tail in a singly list still costs O(n).',
      },
      tip: { zh: '删尾不是 O(1)：tail 能给你尾节点，但不能给你前驱。', en: 'Tail deletion is not O(1): tail gives the last node, not its predecessor.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑩ 完成：空表、单节点与一圈不变量', en: '⑩ Done: empty, single-node and full-circle invariants' },
      explanation: {
        zh: '演示最终删到空表，head 与 tail 都是 None。整轮覆盖了空表、单节点自环、非空回环、完整一圈遍历和删除最后节点。循环链表的核心不变量是：非空时 tail.next = head；单节点时 head = tail 且 next 指向自身；遍历恰好一圈后必须回到 head。',
        en: 'The demo deletes back to empty, with head and tail None. The run covers the empty list, a single-node self-loop, a non-empty return edge, one full-circle traversal and deleting the last node. The invariants are: non-empty tail.next = head; a single node has head = tail and next pointing to itself; a full traversal returns to head after exactly one lap.',
      },
      tip: { zh: '记忆：非空 tail.next 一定有值，遍历靠“回到 head”收尾。', en: 'Memory hook: in a non-empty list tail.next always has a value; traversal ends by returning to head.' },
    },
  ],
  commonMistakes: {
    zh: [
      '用 current.next is None 作为循环链表的遍历终止条件；非空时它永远不成立。',
      '删除或插入后只改 head/tail 中的一个，没有检查 tail.next 是否仍指向 head。',
      '删除头节点后忘记 tail.next = 新 head，回环仍指向已删除的旧头。',
      '删除唯一节点时只把 head 设为 None，忘记 tail 也要设为 None。',
      '单节点时没有建立自环 next = self，tail.next 实际为 None，结构不成立。',
      '在空表上直接访问 head.value 或 tail.next，没有先判断 head is None。',
      '认为有 tail 就能 O(1) 删除尾节点；单链表仍要 O(n) 找前驱。',
      '把“头插/尾插在维护 head 和 tail 时是 O(1)”扩大成“循环链表所有操作都是 O(1)”。',
    ],
    en: [
      'Using current.next is None as the traversal stop; in a non-empty circular list it is never true.',
      'Changing only head or only tail after insertion/deletion without checking tail.next still points at head.',
      'Forgetting tail.next = new head after deleting the head, so the return edge still points at the removed node.',
      'Setting only head to None when removing the only node, leaving tail stale.',
      'Omitting the self-loop next = self for a single node, leaving tail.next as None and the contract broken.',
      'Reading head.value or tail.next on an empty list without checking head is None first.',
      'Assuming tail makes tail deletion O(1); a singly list still needs O(n) to find the predecessor.',
      'Generalising “head/tail insertion is O(1) when head and tail are maintained” into “every circular-list operation is O(1)”.',
    ],
  },
};
