import type { Lesson } from './types';

/**
 * Stage 7C singly linked-list course. Original bilingual prose. The step ids
 * are the exact `lesson_step=` values emitted by the real Python Node preset;
 * repeated steps (for example several `create` frames) are resolved by the
 * existing deterministic frame lookup, not by message guessing.
 */
export const linkedListLesson: Lesson = {
  lessonId: 'linked-list-pointer-basics',
  algorithmId: 'linked',
  contentVersion: '1.0.0',
  title: { zh: '单链表：用 next 指针把节点串起来', en: 'Singly linked list: connecting Nodes with next' },
  oneLiner: {
    zh: '每个节点保存一个值和一条指向下一个节点的引用；改变 next，就改变了整条链的形状。',
    en: 'Each Node stores a value and a reference to the next Node; changing next changes the shape of the chain.',
  },
  overview: {
    zh: '单链表不是把数字按顺序摆成一排，而是让一个个独立的 Node 对象通过 next 引用连起来。HEAD 保存第一个节点的引用，最后一个节点的 next 是 NULL。插入和删除的重点不是移动数值，而是修改少数几条引用：先保住后继，再让前驱改指新节点；删除时让前驱绕过目标，并可以主动把目标的 next 清空。因为节点有稳定的身份，两个值相同的节点仍然是两个不同的对象。教材还区分带头结点与不带头结点两种约定：带头结点的表用额外的哑结点统一“在第一个位置插入/删除”的分支，HEAD 永远指向哑结点；本动画采用不带头结点的约定，HEAD 直接指向首结点，空表时 HEAD = NULL。两者操作语义相同，但判空、首结点和头插代码不同，不能混用。',
    en: 'A singly linked list is not an array of values placed in a row. Independent Node objects are connected by next references. HEAD stores the first Node, and the last Node’s next is NULL. Insertion and deletion are about changing a few references, not shifting values: keep the successor first, then redirect the predecessor. For deletion, make the predecessor bypass the target and optionally clear the target’s own next. Node identity is stable, so two Nodes with the same value remain two different objects. The textbook also distinguishes lists with and without a header node: a header (dummy) node unifies insertion/deletion at the first position, and HEAD always points at that dummy. This animation uses the no-header convention, where HEAD points directly at the first Node and an empty list has HEAD = NULL. The semantics match, but emptiness tests, first-Node handling and head-insertion code differ, so the conventions must not be mixed.',
  },
  intuition: {
    zh: '想象一张寻宝纸条：每张纸条写着“下一个线索在哪里”。你从 HEAD 这张纸条出发，沿着 next 一张张找下去，最后一张写着 NULL，表示没有下一张。要在中间加一张纸条，先让新纸条指向原来的下一张，再让前一张改指新纸条；顺序反过来，就会丢掉后面的线索。',
    en: 'Picture a treasure hunt: each note says where the next clue is. Start at HEAD, follow next note by note, and the last note says NULL — no further clue. To insert a note in the middle, first point the new note to the old next note, then redirect the previous note to the new one. Reverse the order and you lose the rest of the trail.',
  },
  prerequisites: {
    zh: ['知道 Python 的 class 与对象属性', '理解变量保存的是对象的引用', '知道 None 表示“没有对象”'],
    en: ['Python classes and object attributes', 'Understanding that a variable holds a reference to an object', 'Knowing that None means “no object”'],
  },
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: {
      zh: '在头部插入只需修改 HEAD 和新节点的 next，是 O(1)。按值查找、在中间插入或删除，通常要先从头沿 next 走到目标位置，最坏检查 n 个节点，因此是 O(n)。遍历本身也是 O(n)。链表保存 n 个节点，空间是 O(n)；每个节点额外保存一条 next 引用。',
      en: 'Inserting at the head only changes HEAD and the new Node’s next: O(1). Searching by value, inserting in the middle or deleting usually requires walking from HEAD along next, checking up to n Nodes: O(n). Traversal is also O(n). The list stores n Nodes, so space is O(n), with one extra next reference per Node.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 空链表与 HEAD → NULL', en: '① Empty list and HEAD → NULL' },
      explanation: {
        zh: '一开始没有任何 Node，HEAD 是 None，也就是 HEAD → NULL。这里没有“第 0 个数组元素”，只有一条空引用。空链表是合法状态；遍历或删除前要先判断 HEAD 是否为 None。',
        en: 'There are no Nodes yet: HEAD is None, drawn as HEAD → NULL. There is no “array index 0”, only an empty reference. An empty list is valid; check whether HEAD is None before traversing or deleting.',
      },
      tip: { zh: 'HEAD 不是节点本身，而是“指向第一个节点的引用”。', en: 'HEAD is not a Node; it is the reference to the first Node.' },
    },
    {
      stepId: 'create',
      title: { zh: '② 创建节点：先独立存在', en: '② Create a Node: it exists before linking' },
      explanation: {
        zh: 'Node(value) 创建了一个真实对象，带有 node_id、value 和 next。刚创建时 next 是 None，它还没有被任何前驱指向，所以显示在主链下方，标为“新节点 · 尚未接入”。这时它已经存在，但不属于从 HEAD 可达的链。',
        en: 'Node(value) creates a real object with node_id, value and next. Its next starts as None, and no predecessor points to it yet, so it appears below the main chain as “new node · not linked yet”. It exists, but it is not reachable from HEAD.',
      },
      tip: { zh: '节点身份看 node_id，不看显示的值；值相同也可能是两个节点。', en: 'Identity comes from node_id, not the displayed value; equal values can be different Nodes.' },
    },
    {
      stepId: 'find',
      title: { zh: '③ 查找前驱：沿 next 走', en: '③ Find the predecessor by following next' },
      explanation: {
        zh: '要修改某条连接，先要找到它的前驱。代码从 HEAD 开始，每次执行 current = current.next，直到 current.value 等于目标值。动画高亮当前访问的节点，变量面板显示 current 与 current_id；查找的成本来自逐节点前进。',
        en: 'To change a connection, first find its predecessor. The code starts at HEAD and runs current = current.next until current.value matches the target. The animation highlights the current Node, and the variables panel shows current and current_id. The cost comes from advancing Node by Node.',
      },
      tip: { zh: '按值查找可能停在第一个同值节点；若要精确身份，应比较 node_id。', en: 'Value search may stop at the first equal value; compare node_id when exact identity matters.' },
    },
    {
      stepId: 'connect',
      title: { zh: '④ 新节点先接住后继', en: '④ The new Node keeps the successor first' },
      explanation: {
        zh: '中间插入的第一步是 new.next = previous.next。新节点先指向原来的后继，主链暂时还没有指向它；如果先改前驱的 next，原来的后继就可能丢失引用。当前帧会记录 new 的 next 从 None 变成后继 ID。',
        en: 'The first insertion assignment is new.next = previous.next. The new Node points at the old successor while the main chain does not point to it yet. If the predecessor were changed first, the old successor could lose its reference. This frame records new’s next changing from None to the successor id.',
      },
      tip: { zh: '观察箭头：新节点已经指向后继，但前驱还没有指向新节点。', en: 'Watch the arrows: the new Node points to the successor, but the predecessor does not point to the new Node yet.' },
    },
    {
      stepId: 'insert',
      title: { zh: '⑤ 前驱改指新节点，插入完成', en: '⑤ Redirect the predecessor; insertion completes' },
      explanation: {
        zh: '第二步执行 previous.next = new。前驱的箭头从原来的后继改指新节点，新节点从此进入从 HEAD 可达的主链。原来的后继仍然被新节点指向，所以整条链没有断。头部插入则改为 head = new，并用 new.next = 旧 HEAD 保住旧链。',
        en: 'The second assignment is previous.next = new. The predecessor’s arrow changes from the old successor to the new Node, so the new Node enters the chain reachable from HEAD. The old successor is still held by the new Node, so nothing is lost. Head insertion instead uses head = new, with new.next = old HEAD to preserve the old chain.',
      },
      tip: { zh: '插入顺序：先 new.next = previous.next，再 previous.next = new。', en: 'Insertion order: first new.next = previous.next, then previous.next = new.' },
    },
    {
      stepId: 'unlink',
      title: { zh: '⑥ 删除：前驱绕过目标，解除引用', en: '⑥ Delete: bypass the target and clear its reference' },
      explanation: {
        zh: '删除中间节点时，先执行 previous.next = target.next，让前驱直接连到目标的后继；然后执行 target.next = None，把目标自己的 next 也解除。目标节点不再从 HEAD 可达，但 Python 对象未必立刻被销毁：只要还有变量引用它，它就仍然存在。动画把断开节点放在下方，表示“已断开 · 不在链上”，不伪造垃圾回收事件。',
        en: 'To delete a middle Node, first run previous.next = target.next so the predecessor connects directly to the target’s successor. Then run target.next = None to clear the target’s own reference. The target is no longer reachable from HEAD, but the Python object is not necessarily destroyed immediately: while a variable still references it, it exists. The animation shows it below as “detached · no longer on the chain” and never fabricates a garbage-collection event.',
      },
      tip: { zh: '“从链表删除”与“对象立即销毁”是两件事；引用计数归零后才可能回收。', en: '“Removed from the list” and “object destroyed now” are different; collection may happen only after references drop to zero.' },
    },
    {
      stepId: 'traverse',
      title: { zh: '⑦ 遍历：从 HEAD 一路走到 NULL', en: '⑦ Traverse: from HEAD all the way to NULL' },
      explanation: {
        zh: '遍历用一个 current 变量从 HEAD 开始：读取当前节点的值，然后 current = current.next。每一步只访问一个节点，直到 current 变成 None。动画高亮当前节点，代码行、变量和教学步骤同步更新；同值节点仍按 node_id 区分。',
        en: 'Traversal uses a current variable starting at HEAD: read the current value, then current = current.next. Each step visits one Node until current becomes None. The animation highlights the current Node while the code line, variables and lesson step stay in sync; equal values are still distinguished by node_id.',
      },
      tip: { zh: '空链表时循环一次也不执行，直接结束。', en: 'On an empty list the loop runs zero times and finishes immediately.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑧ 演示结束与复杂度', en: '⑧ Done and complexity' },
      explanation: {
        zh: '示例最后得到 3 → 6 → 5 → NULL。头部插入是 O(1)；按值查找、中间插入和删除通常要先走链，最坏 O(n)；遍历也是 O(n)。链表的价值在于节点身份和指针关系，而不是把数值排成好看的方块。',
        en: 'The example ends at 3 → 6 → 5 → NULL. Head insertion is O(1); value search, middle insertion and deletion usually walk the chain, O(n) worst case; traversal is O(n). The value of a linked list is Node identity and pointer relationships, not arranging values into pretty blocks.',
      },
      tip: { zh: '常见错误是插入时先改前驱、删除时忘记保存 target.next；两者都会丢掉后继。', en: 'Common mistakes are changing the predecessor before saving the successor, and forgetting to save target.next before deletion; both lose the rest of the chain.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把链表当成数组，用下标访问节点；链表只能从 HEAD 沿 next 走。',
      '用值判断节点身份：两个节点可以有相同的 value，但 node_id 不同。',
      '中间插入时先写 previous.next = new，再写 new.next = previous.next；此时 previous.next 已经被改，new 会指向自己或丢失后继。',
      '删除时直接丢掉 target，却没有让前驱绕过它；目标仍可能被其他引用持有，且主链会断。',
      '认为 target.next = None 会立刻销毁 Python 对象；删除引用和垃圾回收不是同一件事。',
      '遍历时忘记更新 current，或在 current 为 None 后继续访问 current.next。',
    ],
    en: [
      'Treating the list as an array and indexing Nodes; a linked list is reached only by walking next from HEAD.',
      'Using a value as Node identity: two Nodes may share a value but have different node_ids.',
      'In middle insertion, assigning previous.next = new before new.next = previous.next; previous.next is already changed, so new can point to itself or lose the successor.',
      'Dropping target without making the predecessor bypass it; the target may still be referenced elsewhere and the main chain breaks.',
      'Assuming target.next = None destroys the Python object immediately; removing a reference and garbage collection are different.',
      'Forgetting current = current.next during traversal, or reading current.next after current is None.',
    ],
  },
};
