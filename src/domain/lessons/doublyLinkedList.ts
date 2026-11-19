import type { Lesson } from './types';

/**
 * L1A doubly linked-list course. Step ids are the exact `lesson_step=` values
 * emitted by the real Python DNode preset; the player resolves frames by id,
 * never by guessing from the message.
 */
export const doublyLinkedListLesson: Lesson = {
  lessonId: 'doubly-linked-list-pointers',
  algorithmId: 'doubly',
  contentVersion: '1.0.0',
  title: { zh: '双向链表：prev 与 next 同时维护', en: 'Doubly linked list: maintaining prev and next' },
  oneLiner: {
    zh: '每个节点同时保存前驱和后继引用；向前、向后都能走，但每次改链都要维护两个方向。',
    en: 'Each node stores both predecessor and successor references; you can walk either way, but every relink must maintain both directions.',
  },
  overview: {
    zh: '双向链表的每个真实 Node 对象都有 value、prev 和 next。head 的 prev 是 None，tail 的 next 是 None；中间每个节点满足 next.prev 指向自己、prev.next 也指向自己。它和普通单链表的关键区别不是“多存一个值”，而是多了一条反向引用：单链表删除一个节点通常要先找前驱，双向链表在已经持有目标节点引用时可以直接用 target.prev 和 target.next 完成局部改链。适用场景包括需要双向遍历的编辑器历史、浏览器前进后退、LRU 缓存的双向链以及需要 O(1) 从已知节点摘除的容器。代价是每个节点多一条引用，插入和删除要同步维护两个方向。',
    en: 'Every real Node in a doubly linked list has value, prev and next. The head’s prev is None and the tail’s next is None; in the middle, next.prev points back to the node and prev.next points forward to it. The difference from a singly linked list is not an extra value but a reverse reference: deleting a node in a singly list usually needs its predecessor first, while a doubly list can splice a node out with target.prev and target.next when the node reference is already held. Typical uses include editor history, browser back/forward, the linked list inside an LRU cache, and containers that must unlink a known node in O(1). The cost is one extra reference per node and two directions to maintain on every insertion or deletion.',
  },
  intuition: {
    zh: '把节点想成一张双面车票：正面写“下一站”，背面写“上一站”。从 head 沿正面走可以正向遍历，从 tail 沿背面走可以反向遍历。插入时先把新节点的两条边接好，再让前驱和后继分别改指；删除时让前驱的 next 越过目标、后继的 prev 也越过目标。任何一步只改一面，另一面就会指向旧节点，反向遍历立刻出错。',
    en: 'Think of each node as a two-sided ticket: one side says “next stop”, the other says “previous stop”. Follow the front from head for forward traversal, or the back from tail for backward traversal. On insertion, connect both of the new node’s links first, then redirect the predecessor and successor. On deletion, make the predecessor’s next bypass the target and the successor’s prev bypass it too. Change only one side and the other still points at the old node, so backward traversal breaks immediately.',
  },
  prerequisites: {
    zh: ['理解 Python 对象引用与 None', '知道单链表的 head、next 与遍历', '能区分“节点引用”和“按值查找”'],
    en: ['Python object references and None', 'Singly linked lists: head, next and traversal', 'Distinguishing a node reference from a search by value'],
  },
  complexity: {
    time: '按值查找 O(n) · 已持有节点引用时局部改链 O(1)',
    space: 'O(n)',
    note: {
      zh: '按值查找、从头/尾走到中间位置都需要 O(n)。若已经持有目标节点引用，插入或删除只改常数条 prev/next，是 O(1)；在 head 或 tail 处操作同样是 O(1)。这不是说“双向链表所有操作都是 O(1)”：查找本身仍然要走路。空间 O(n)，每个节点比单链表多保存一条 prev 引用。',
      en: 'Searching by value, or walking from either end to a middle position, is O(n). If the target node reference is already held, insertion or deletion rewrites a constant number of prev/next links, O(1); operations at head or tail are also O(1). That does not mean “every doubly linked-list operation is O(1)”: the search itself still walks. Space is O(n), with one extra prev reference per node compared with a singly list.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 空表：head 与 tail 都是 None', en: '① Empty list: head and tail are None' },
      explanation: {
        zh: '一开始没有 Node，head = None 且 tail = None。空表没有“第 0 个节点”，只有两条空引用；head.prev 和 tail.next 都无从谈起，因为根本没有 head 或 tail。后续每次插入都要同时考虑这两个端点引用。',
        en: 'There are no Nodes yet: head = None and tail = None. There is no “node 0”, only two empty references. head.prev and tail.next do not exist because there is no head or tail yet. Every later insertion must consider both endpoint references.',
      },
      tip: { zh: '空表是合法状态，不是错误；先判断 head 是否为 None。', en: 'An empty list is a valid state, not an error; check head for None first.' },
    },
    {
      stepId: 'insert-head',
      title: { zh: '② 头部插入：先接旧头，再补反向引用', en: '② Head insertion: keep the old head, then add the reverse link' },
      explanation: {
        zh: '创建新节点后，先执行 new.next = 旧 head，让新节点接住整条旧链；再执行 旧 head.prev = new，让旧头反向接住新节点；最后 head = new。空表插入时新节点同时成为 head 和 tail，prev 与 next 仍为 None。若先改 head，旧链就可能失去唯一入口。',
        en: 'After creating the node, run new.next = old head so the new node holds the whole old chain; then old head.prev = new so the old head points back; finally head = new. When inserting into an empty list the new node becomes both head and tail, with prev and next still None. Changing head first could lose the only entry to the old chain.',
      },
      tip: { zh: '头部插入两条边：new.next = 旧 head，旧 head.prev = new。', en: 'Two links for head insertion: new.next = old head, then old head.prev = new.' },
    },
    {
      stepId: 'insert-tail',
      title: { zh: '③ 尾部插入：旧尾向前接，新节点向后接', en: '③ Tail insertion: old tail points forward, new node points back' },
      explanation: {
        zh: '先执行 旧 tail.next = new，再执行 new.prev = 旧 tail，最后 tail = new。旧尾的 next 从 None 变成新节点，新节点的 prev 从 None 变成旧尾；新节点的 next 仍是 None，因为它是新的尾。非空表里 tail 更新后，tail.next 必须保持 None。',
        en: 'Run old tail.next = new, then new.prev = old tail, then tail = new. The old tail’s next changes from None to the new node, and the new node’s prev changes from None to the old tail. The new node’s next remains None because it is the tail. After tail moves in a non-empty list, tail.next must stay None.',
      },
      tip: { zh: '尾插后 new.next 必须是 None；这是双向链表与循环链表的关键分界。', en: 'After tail insertion new.next must be None; this is the key boundary between a doubly and a circular list.' },
    },
    {
      stepId: 'insert-middle',
      title: { zh: '④ 中间插入：四条引用都要接对', en: '④ Middle insertion: four references must agree' },
      explanation: {
        zh: '先按值找到 target。创建 new 后依次执行 new.next = target.next、后继.prev = new、new.prev = target、target.next = new。前两步让新节点和后继互相接住，后两步让前驱和新节点互相接住。若 target 原来是尾节点，还要把 tail 更新为 new，并让 new.next 保持 None。',
        en: 'Find target by value first. After creating new, run new.next = target.next, successor.prev = new, new.prev = target, and target.next = new. The first two connect the new node and successor both ways; the last two connect the predecessor and new node both ways. If target was the tail, also move tail to new and keep new.next None.',
      },
      tip: { zh: '四条边：new↔后继两条，target↔new 两条；少一条就会单向断裂。', en: 'Four links: two between new and successor, two between target and new; missing one breaks a direction.' },
    },
    {
      stepId: 'traverse-forward',
      title: { zh: '⑤ 正向遍历：从 head 沿 next 到 None', en: '⑤ Forward traversal: head along next to None' },
      explanation: {
        zh: 'current 从 head 开始，读取当前值后执行 current = current.next。每一步都访问一个节点，直到 current 变成 None。高亮节点与变量面板中的 current、current_id 同步；节点身份看稳定 ID，不看值。',
        en: 'current starts at head, reads the value, then runs current = current.next. One node is visited per step until current becomes None. The highlighted node stays in sync with current and current_id; identity comes from the stable id, not the value.',
      },
      tip: { zh: '正向终止条件是 current is None，和反向遍历不同。', en: 'Forward traversal stops when current is None, unlike backward traversal.' },
    },
    {
      stepId: 'traverse-reverse',
      title: { zh: '⑥ 反向遍历：从 tail 沿 prev 到 None', en: '⑥ Backward traversal: tail along prev to None' },
      explanation: {
        zh: '反向遍历把 current 初始化成 tail，读取当前值后执行 current = current.prev，直到 current 变成 None。这正是双向链表比单链表多出来的能力。若插入时漏掉某条 prev，反向序列会提前断掉或指向错误节点。',
        en: 'Backward traversal initialises current to tail, reads the value, then runs current = current.prev until current becomes None. This is the capability a singly list lacks. If an insertion missed one prev assignment, the backward sequence stops early or points at the wrong node.',
      },
      tip: { zh: '正向与反向结果必须互为逆序；这是双向链表最直接的正确性检查。', en: 'Forward and backward results must be exact reverses; this is the simplest doubly-list correctness check.' },
    },
    {
      stepId: 'find',
      title: { zh: '⑦ 按值查找：命中就停，未命中走完', en: '⑦ Search by value: stop on a hit, exhaust on a miss' },
      explanation: {
        zh: '查找从 head 沿 next 前进，当前值等于目标就发 found 帧并停止；走到 None 仍未命中则发 not-found 帧。命中只说明某个节点的 value 相等，若要精确定位对象应比较节点 ID。查找本身是 O(n)，找到节点后的局部改链才可能是 O(1)。',
        en: 'Search walks next from head. When the current value equals the target it emits a found frame and stops; if it reaches None it emits not-found. A hit only means some node has an equal value; compare node ids when exact identity matters. The search itself is O(n); only the local splice after a node is found can be O(1).',
      },
      tip: { zh: '“找到节点”与“摘除节点”是两个阶段，复杂度要分开说。', en: '“Find the node” and “splice the node out” are two phases; state their costs separately.' },
    },
    {
      stepId: 'delete-middle',
      title: { zh: '⑧ 删除中间节点：两侧同时越过目标', en: '⑧ Delete middle: both sides bypass the target' },
      explanation: {
        zh: '先执行 target.prev.next = target.next，让前驱的正向指针越过目标；再执行 target.next.prev = target.prev，让后继的反向指针也越过目标；最后把 target.prev 和 target.next 清空，发 detach 帧。完成帧里前后节点必须互相指向，目标节点不再从 head 可达。',
        en: 'Run target.prev.next = target.next so the predecessor’s forward pointer bypasses the target; then target.next.prev = target.prev so the successor’s backward pointer bypasses it too; finally clear target.prev and target.next and emit detach. In the complete frame the neighbours must point at each other and the target is no longer reachable from head.',
      },
      tip: { zh: '删除要改两条边，不是一条；先接好再清空目标自己的引用。', en: 'Deletion changes two links, not one; reconnect first, then clear the target’s own references.' },
    },
    {
      stepId: 'delete-head',
      title: { zh: '⑨ 删除头节点：head 前移并清空新头 prev', en: '⑨ Delete head: move head and clear the new head’s prev' },
      explanation: {
        zh: '删除头节点时 head = target.next，然后新 head.prev = None；若删除的是唯一节点，head 和 tail 都要变成 None。完成帧要求新 head 的 prev 为 None。只改 head 不清 prev，会留下指向已删除节点的悬空反向引用。',
        en: 'Deleting the head runs head = target.next, then new head.prev = None; if the only node is removed, both head and tail become None. The complete frame requires the new head’s prev to be None. Moving head without clearing prev leaves a dangling backward reference to the removed node.',
      },
      tip: { zh: '新头 prev = None 是双向链表的不变量，不是可选清理。', en: 'New head prev = None is an invariant, not optional cleanup.' },
    },
    {
      stepId: 'delete-tail',
      title: { zh: '⑩ 删除尾节点：tail 后移并清空新尾 next', en: '⑩ Delete tail: move tail and clear the new tail’s next' },
      explanation: {
        zh: '删除尾节点时 tail = target.prev，然后新 tail.next = None；删除唯一节点时 head 和 tail 都变 None。完成帧要求新 tail 的 next 为 None。若只改 tail 不清 next，链表会保留一条指向已删除节点的正向引用。',
        en: 'Deleting the tail runs tail = target.prev, then new tail.next = None; removing the only node clears both head and tail. The complete frame requires the new tail’s next to be None. Moving tail without clearing next leaves a forward reference to the removed node.',
      },
      tip: { zh: '删尾后 tail.next = None；删尾与“变成循环链表”只差这一条引用。', en: 'After tail deletion tail.next = None; one reference separates this from becoming a circular list.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑪ 完成：不变量与复杂度', en: '⑪ Done: invariants and complexity' },
      explanation: {
        zh: '演示最终回到空表，head 与 tail 都是 None。整个过程验证了 head.prev = None、tail.next = None、相邻 next/prev 互证。双向链表的核心收益是双向遍历和已知节点引用的 O(1) 局部改链；代价是每个节点多一条引用，插入删除要维护两倍指针。',
        en: 'The demo ends empty again, with head and tail None. The run verifies head.prev = None, tail.next = None, and agreeing next/prev pairs. The core benefit is bidirectional traversal and O(1) local splicing when a node reference is held; the cost is one extra reference per node and twice the pointer bookkeeping on insertion or deletion.',
      },
      tip: { zh: '记忆：先接后继，再补反向；删除两侧同时越过目标。', en: 'Memory hook: keep the successor first, then add the reverse link; on deletion both sides bypass the target.' },
    },
  ],
  commonMistakes: {
    zh: [
      '先改 head 再保存旧 head，导致旧链失去入口；应先 new.next = 旧 head。',
      '插入只改 next 不改 prev，正向能走但反向遍历断裂。',
      '删除头节点后忘记把新 head.prev 设为 None，留下悬空反向引用。',
      '删除尾节点后忘记把新 tail.next 设为 None，留下指向已删除节点的正向引用。',
      '删除中间节点只让前驱绕过目标，没有让后继的 prev 也绕过目标。',
      '把“按值查找 O(n)”和“已持有节点引用时 O(1) 摘除”混为一谈，宣称所有操作都是 O(1)。',
      '用 value 判断节点身份；值相同的两个节点仍然是不同对象，应比较稳定节点 ID。',
      '插入时先改 target.next，再读 target.next 赋给 new.next；此时读到的是新节点自己，链会断。',
    ],
    en: [
      'Changing head before saving the old head, losing the old chain; assign new.next first.',
      'Updating only next on insertion, so forward traversal works but backward traversal breaks.',
      'Forgetting to set the new head.prev to None after deleting the head, leaving a dangling reverse reference.',
      'Forgetting to set the new tail.next to None after deleting the tail, leaving a forward reference to the removed node.',
      'Making only the predecessor bypass the target on middle deletion, without updating the successor’s prev.',
      'Confusing “search by value is O(n)” with “splice a held node reference in O(1)” and claiming every operation is O(1).',
      'Using value as node identity; equal values can be different objects, so compare stable node ids.',
      'Reading target.next after assigning target.next = new and then assigning that to new.next; the chain can close on itself and break.',
    ],
  },
};
