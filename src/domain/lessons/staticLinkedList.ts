import type { Lesson } from './types';

/**
 * TEXTBOOK-02 §2.3 static linked-list course. Step ids are the exact
 * `lesson_step=` values emitted by the real Python cursor program.
 */
export const staticLinkedListLesson: Lesson = {
  lessonId: 'static-linked-list-operations',
  algorithmId: 'static-linked-list',
  contentVersion: '1.0.0',
  title: { zh: '静态链表：用数组下标模拟指针', en: 'Static linked list: array indices as pointers' },
  oneLiner: {
    zh: '结点仍然存放在一段固定数组里，但逻辑后继由每个单元的 cur 记录；改游标就是改链，数组下标就是“指针”。',
    en: 'Nodes still live in a fixed array, but each cell records its logical successor in cur; changing a cursor changes the chain, and an array index acts as a pointer.',
  },
  overview: {
    zh: '静态链表解决的是一个很具体的问题：在没有显式指针类型、或者结点必须集中存放在连续数组中的环境里，怎样仍然得到链式结构。每个数组单元有两个域：data 保存元素，cur（也称 next）保存后继所在的下标。下标是数组内的位置编号，不是内存地址；它只能在本数组内使用，不能像真正的指针那样指向任意地址。为了区分“有效结点”和“空闲结点”，教材通常把数组分成两条用游标串起来的链：head 指向第一条逻辑链，freeHead 指向空闲链。插入时先从空闲链借一个单元，把 data 写好后接入逻辑链；删除时把目标从逻辑链摘下，再把它的 cur 指向原 freeHead，使它回到空闲链。这样数组容量固定，但结点可以在数组内反复搬运、复用。',
    en: 'A static linked list solves a concrete problem: how to obtain linked behaviour when there is no explicit pointer type, or when nodes must live inside one contiguous array. Each cell has two fields: data stores the element, and cur (also called next) stores the index of its successor. An index is a position inside this array, not a memory address; it cannot point outside the array the way a real pointer can. To separate live nodes from free ones, the textbook usually keeps two cursor chains: head points into the logical chain, and freeHead points into the free chain. Insertion borrows a cell from the free chain, writes data, then links it into the logical chain. Deletion unlinks the target, points its cur at the old freeHead, and returns it to the free chain. The array size stays fixed while cells are recycled.',
  },
  intuition: {
    zh: '把数组想成一排带编号的储物格，每个格子里放着一张纸条，写着“下一个格子是几号”。HEAD 和 freeHead 是你手里的两张起始便条。要找逻辑上的第一个元素，不必看 0 号格，而是看 HEAD 指向几号；要判断数组满没满，也不看 data 有没有值，而是看 freeHead 是否为 NULL。因为“下一个”写在格子里，逻辑顺序可以和物理编号完全不同：3 号格可以接在 0 号格后面，而 1 号格可能还在空闲链上。',
    en: 'Picture numbered lockers, each holding a note that says which locker comes next. HEAD and freeHead are the two starting notes in your hand. The first logical element is not necessarily locker 0; it is the locker named by HEAD. The array is full not when every data field looks used, but when freeHead is NULL. Because “next” is written inside the cell, logical order can differ completely from physical order: locker 3 may follow locker 0 while locker 1 is still on the free chain.',
  },
  prerequisites: {
    zh: ['理解数组下标从 0 开始且连续', '知道链式结构中“后继”的含义', '区分“结点的物理位置”与“结点的逻辑次序”'],
    en: ['Array indices are zero-based and contiguous', 'The meaning of a successor in a linked structure', 'Distinguishing a node’s physical position from its logical position'],
  },
  complexity: {
    time: '按位置定位 O(n) · 改游标 O(1) · 遍历 O(n)',
    space: 'O(capacity)',
    note: {
      zh: '按第 i 个逻辑位置插入或删除，仍要沿 head 走 i−1 步找到前驱，所以定位是 O(n)；找到前驱后，申请结点、改 cur、归还结点都只改常数个域，是 O(1)。遍历必须沿 cur 走，访问 n 个结点，是 O(n)。空间由数组容量决定，是 O(capacity)，不会因为元素变多而重新分配；容量耗尽时只能拒绝插入，不能像动态链表那样再申请新结点。',
      en: 'Inserting or deleting at logical position i still walks i−1 steps from head to find the predecessor, so locating is O(n). Once found, allocating a cell, changing cursors and recycling are constant-time field updates, O(1). Traversal follows cur and visits n nodes, O(n). Space is fixed by array capacity, O(capacity); it is not reallocated as elements are added. When capacity is exhausted, insertion must be rejected rather than allocating a new node as a dynamic list could.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 初始化：一条逻辑链，一条空闲链', en: '① Initialise: one live chain, one free chain' },
      explanation: {
        zh: '初始值按逻辑顺序写入数组前缀，cur 依次指向下一个下标；最后一个有效结点的 cur 是 NULL。剩余单元从第一个空位开始，用 cur 串成空闲链，freeHead 指向它的第一个单元。若初始值已经填满数组，freeHead 就是 NULL。注意：教材常用 0 号单元作为头结点、并用 0 表示空指针；本动画改用独立的 head/freeHead 和 NULL，避免把“下标 0”误当成“空”。两种约定都能表示静态链表，但绝不能混用。',
        en: 'Initial values are written into the array prefix in logical order, with cur pointing to the next index; the last live node has cur = NULL. The remaining cells form a free chain starting at the first unused index, and freeHead points to its first cell. If the initial values fill the array, freeHead is NULL. Note: the textbook often reserves cell 0 as a header and uses 0 as the null pointer; this animation instead uses separate head/freeHead and NULL so that index 0 is never confused with “empty”. Both conventions describe static lists, but they must not be mixed.',
      },
      tip: { zh: '先确认空游标约定：本动画用 NULL，不把下标 0 当空。', en: 'Fix the null-cursor convention first: this animation uses NULL, not index 0.' },
    },
    {
      stepId: 'allocate',
      title: { zh: '② 申请空闲结点：从 freeHead 借一个单元', en: '② Allocate: borrow the first free cell' },
      explanation: {
        zh: '插入前先检查 freeHead。若为 NULL，说明空闲链已经空了，数组容量耗尽，插入必须被拒绝。否则令 new = freeHead，再令 freeHead = cur[new]，把空闲链的起点后移到下一个空闲单元。此时 new 已经从空闲链摘下，但还没有接入逻辑链，data 也还没写；它在数组中是一个“已申请、未接入”的孤立单元。',
        en: 'Before inserting, check freeHead. If it is NULL, the free chain is empty and the array is full, so insertion must be rejected. Otherwise set new = freeHead, then freeHead = cur[new], moving the free-chain start to the next free cell. The cell is now detached from the free chain but not yet linked into the live chain, and data has not been written; it is an allocated but unlinked cell.',
      },
      tip: { zh: '申请动作只改 freeHead，不改逻辑链；这两条链必须互不重叠。', en: 'Allocation only moves freeHead; the live chain is untouched, and the two chains must stay disjoint.' },
    },
    {
      stepId: 'insert',
      title: { zh: '③ 写入 data，再接入逻辑链', en: '③ Write data, then link into the live chain' },
      explanation: {
        zh: '先写 data[new] = value，再找第 position 个逻辑位置的前驱 prev。若 position = 1，前驱为空，新结点应成为 head；否则沿 head 走 position−2 步找到 prev。接入顺序与动态链表相同：先让 new 接住原后继（cur[new] = cur[prev] 或 head），再让前驱改指 new（cur[prev] = new 或 head = new）。顺序反过来会丢失原后继。动画的游标变化条会显示 new.cur 从 NULL 变成后继下标。',
        en: 'First write data[new] = value, then find the predecessor prev of logical position position. If position = 1 there is no predecessor and the new node becomes head; otherwise walk position−2 steps from head to find prev. Linking follows the same order as a dynamic list: let new hold the old successor first (cur[new] = cur[prev] or head), then redirect the predecessor (cur[prev] = new or head = new). Reversing the order loses the old successor. The cursor-change strip shows new.cur changing from NULL to the successor index.',
      },
      tip: { zh: '先 new.cur = 原后继，再 prev.cur = new；和动态链表是同一条不变量。', en: 'First new.cur = old successor, then prev.cur = new; the same invariant as a dynamic list.' },
    },
    {
      stepId: 'remove',
      title: { zh: '④ 删除：先摘链，再归还', en: '④ Delete: unlink first, recycle second' },
      explanation: {
        zh: '删除第 position 个逻辑结点时，先找到目标 target 和它的前驱 prev，保存 target 的后继 successor。若 prev 为空，令 head = successor；否则令 cur[prev] = successor。此时逻辑链已经绕过 target，但 target 仍然占着一个数组单元，它的 cur 也仍指向旧后继。摘链和归还是两个独立动作，不能合并成“把 target 从数组删掉”——数组单元不会消失。',
        en: 'To delete logical node position, find the target and its predecessor prev, and save the target’s successor. If prev is empty, set head = successor; otherwise set cur[prev] = successor. The live chain now bypasses the target, but the target still occupies an array cell and its cur still points at the old successor. Unlinking and recycling are two separate actions; the cell never disappears from the array.',
      },
      tip: { zh: '摘链只改前驱；target 自己的 cur 要等归还空闲链时才改。', en: 'Unlinking changes only the predecessor; the target’s own cur changes when it is recycled.' },
    },
    {
      stepId: 'free',
      title: { zh: '⑤ 归还空闲链：freeHead 重新指向 target', en: '⑤ Recycle: point freeHead back at the target' },
      explanation: {
        zh: '把 target 归入空闲链：先令 cur[target] = freeHead，让 target 接住当前空闲链；再令 freeHead = target。随后清空 data[target]（教材实现也可能保留旧值，只要它已不可从 head 到达就不会被遍历）。最终 target 出现在空闲链头部，下一次插入会优先复用它。这一步也说明了“删除”并不缩短数组，只是把单元从逻辑链转移到空闲链。',
        en: 'Recycle the target into the free chain: first set cur[target] = freeHead so the target holds the current free chain, then set freeHead = target. Clear data[target] afterwards; a textbook implementation may keep the old value, which is harmless once the cell is unreachable from head. The target is now at the front of the free chain, and the next insertion reuses it first. This also shows that deletion does not shrink the array; it moves a cell from the live chain to the free chain.',
      },
      tip: { zh: '归还顺序：target.cur = 旧 freeHead，再 freeHead = target。', en: 'Recycle order: target.cur = old freeHead, then freeHead = target.' },
    },
    {
      stepId: 'traverse',
      title: { zh: '⑥ 按游标遍历：不要按数组下标顺序读', en: '⑥ Traverse by cursors, not by array order' },
      explanation: {
        zh: '遍历从 head 开始，读取 data[current]，再执行 current = cur[current]，直到 current 为 NULL。访问顺序完全由 cur 决定，数组里编号更小的单元不一定先被访问。当前帧高亮当前下标，同时把已访问下标记入 visited。若只看数组的物理行顺序去读 data，得到的序列可能是错的。',
        en: 'Traversal starts at head, reads data[current], then runs current = cur[current] until current is NULL. The visiting order is defined entirely by cur; a lower array index does not necessarily come first. The frame highlights the current index and records visited indices. Reading data in physical row order can produce the wrong sequence.',
      },
      tip: { zh: '逻辑顺序 = 从 head 沿 cur 走出的下标序列。', en: 'Logical order is the index sequence obtained by following cur from head.' },
    },
    {
      stepId: 'delete',
      title: { zh: '⑦ 删除完成帧：数组与逻辑链同时一致', en: '⑦ Complete deletion: array and chain agree' },
      explanation: {
        zh: '删除完成时，被删单元已经不在逻辑链上，data 被清空，并且它已经位于空闲链；逻辑链里每个结点的 cur 仍正确指向后继。检查一致性要看三件事：从 head 沿 cur 能走到的结点恰好是 logical；从 freeHead 沿 cur 能走到 freeList；两条链没有重叠。数组的物理行数不变，但可读的有效结点少了一个。',
        en: 'When deletion completes, the removed cell is no longer on the live chain, its data is cleared, and it belongs to the free chain; every remaining live node still points at the correct successor. Consistency means three things: the nodes reachable from head by cur are exactly logical; those reachable from freeHead are exactly freeList; the two chains do not overlap. The number of physical rows is unchanged, but one fewer cell is live.',
      },
      tip: { zh: '不要用“data 是否为 NULL”判断数组满；要看 freeHead。', en: 'Do not decide “full” from data being NULL; look at freeHead.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑧ 结束：物理顺序 ≠ 逻辑顺序', en: '⑧ Done: physical order ≠ logical order' },
      explanation: {
        zh: '官方示例先插入 25 到第 2 个逻辑位置，再删除第 3 个逻辑结点。插入借用了 3 号空闲单元，所以逻辑链变成 0 → 3 → 1 → 2；删除 20 后，1 号单元回到空闲链头部。最后遍历得到 10 → 25 → 30，而数组物理行仍是 0、1、2、3。这个差异就是静态链表最需要看懂的地方：下标只是存放位置，cur 才定义次序。',
        en: 'The official example inserts 25 at logical position 2, then deletes logical node 3. Insertion borrows free cell 3, so the live chain becomes 0 → 3 → 1 → 2; deleting 20 returns cell 1 to the front of the free chain. Traversal then yields 10 → 25 → 30 while the physical rows remain 0, 1, 2, 3. That difference is the point of a static list: an index is storage, while cur defines order.',
      },
      tip: { zh: '记忆句：数组管存放，游标管次序；插入先借后接，删除先摘后还。', en: 'Memory line: the array stores, cursors order; insert borrows then links, delete unlinks then recycles.' },
    },
    {
      stepId: 'reject',
      title: { zh: '⑨ 拒绝帧：满表与非法位置', en: '⑨ Rejected frames: full array and invalid positions' },
      explanation: {
        zh: '两类错误必须在改结构前拒绝：freeHead 为 NULL 时数组已满，不能插入；插入位置必须满足 1 ≤ position ≤ length+1，删除位置必须满足 1 ≤ position ≤ length。拒绝帧保留当前结构，只记录错误原因，不会产生半个新结点，也不会伪造一次成功的游标修改。',
        en: 'Two errors must be rejected before mutating the structure: when freeHead is NULL the array is full and insertion cannot proceed; insertion requires 1 ≤ position ≤ length+1, deletion requires 1 ≤ position ≤ length. A rejected frame preserves the current structure and records the reason; it never leaves a half-created node or fakes a successful cursor change.',
      },
      tip: { zh: '先检查位置和 freeHead，再申请或摘链。', en: 'Check the position and freeHead before allocating or unlinking.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把数组下标当作内存地址，误以为 cur 可以指向数组外的位置。',
      '把 0 号下标同时当作“头结点”和“空指针”，导致空表与第一个结点无法区分。',
      '用数组物理顺序遍历，而不是从 head 沿 cur 走。',
      '申请结点后忘记把 freeHead 后移，导致同一个空闲单元被借两次。',
      '插入时先改前驱的 cur，再设置 new.cur，丢失原后继。',
      '删除时只改前驱，忘记把 target 归入空闲链，造成单元永久泄漏。',
      '用 data 是否为 NULL 判断数组满；正确判据是 freeHead 是否为 NULL。',
      '把“容量固定”误当成“元素数量固定”：元素可增删，只是数组单元数量不变。',
    ],
    en: [
      'Treating an array index as a memory address and letting cur point outside the array.',
      'Using index 0 as both a header and the null pointer, making an empty list indistinguishable from the first node.',
      'Traversing in physical array order instead of following cur from head.',
      'Forgetting to advance freeHead after allocating, so the same free cell is borrowed twice.',
      'Changing the predecessor’s cur before setting new.cur, losing the old successor.',
      'Unlinking the target without recycling it, permanently leaking a cell.',
      'Deciding that the array is full from data being NULL; the correct test is freeHead === NULL.',
      'Confusing fixed capacity with a fixed number of elements: elements change, array cells do not.',
    ],
  },
};
