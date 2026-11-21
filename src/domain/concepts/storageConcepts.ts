import type { ConceptPage } from './types';

/**
 * TEXTBOOK-01 — the three storage/recursion concepts that were still pending
 * rows in the directory. They are static pages: no trace, player or editor.
 *
 * They intentionally do not repeat the runnable stack/queue/KMP lessons. The
 * focus is respectively the cursor representation, the call stack behind
 * recursion, and the three C-style string representations.
 */
export const STORAGE_CONCEPT_PAGES: readonly ConceptPage[] = [
  {
    id: 'static-linked-list',
    topicId: 'static-linked-list',
    title: ['静态链表', 'Static linked list'],
    chapter: ['第 2 章 · 线性表', 'Chapter 2 · Linear lists'],
    summary: [
      '静态链表把链式关系存进数组：结点仍由 next 串联，但 next 保存的是数组下标（游标），不是内存地址。它适合不能随意申请结点、又需要频繁插入删除的固定容量场景。',
      'A static linked list stores a linked structure inside an array: next still links nodes, but it holds an array index (a cursor), not a memory address. It fits fixed-capacity settings where allocation is unavailable but insertion and deletion must stay cheap.',
    ],
    diagram: 'static-linked-list',
    definitions: [
      {
        term: ['静态链表', 'Static linked list'],
        text: [
          '用一段数组存放结点，每个结点含数据域和游标域；逻辑相邻由游标指出，而不是由物理相邻决定。',
          'Nodes live in one array. Each node has a data field and a cursor field; logical neighbours are named by cursors, not by physical adjacency.',
        ],
      },
      {
        term: ['游标', 'Cursor'],
        text: [
          '结点中保存后继数组下标的整数。它模拟指针，但只能指向同一数组内的位置。',
          'An integer holding the array index of the successor. It simulates a pointer but can only refer to a slot in the same array.',
        ],
      },
      {
        term: ['空闲链表', 'Free list'],
        text: [
          '所有未使用结点也用游标串成一条链；插入时从这条链取结点，删除时把结点还回去。',
          'Unused slots are linked by the same cursor field. Allocation takes a slot from this chain; deletion returns it.',
        ],
      },
      {
        term: ['头结点', 'Header node'],
        text: [
          '放在链表最前面的哨兵结点，本身不存有效数据；有了它，在表头插入、删除时不必单独改写外部 head。',
          'A sentinel before the first data node. It removes the special case of updating an external head when inserting or deleting at the front.',
        ],
      },
    ],
    sections: [
      {
        title: ['数组里如何表示一条链', 'How a chain fits inside an array'],
        body: [
          '每个单元至少有两个域：data 存元素，next 存后继下标。head 保存第一个有效结点的下标，空闲链表用 freeHead 保存第一个空槽的下标。空指针必须使用实现约定好的哨兵；图示用 -1，教材实现常用 0 号单元作头结点，因此不能把“0 一定是空”当成所有实现的通用规则。',
          'Each slot has at least data and next. head stores the index of the first data node, while freeHead stores the first unused slot. A null cursor is an implementation convention: the diagram uses -1, while many textbook implementations reserve slot 0 as a header, so “0 always means null” is not a universal rule.',
        ],
        points: [
          ['逻辑顺序由 next 决定，数组中的物理顺序可以完全不同。', 'The next cursors define logical order; physical array order may differ.'],
          ['游标只能在本数组内跳转，不能像真实指针那样访问任意地址。', 'A cursor can jump only inside this array, unlike a real pointer that may address arbitrary memory.'],
          ['下标 0 可能被保留为头结点，因此有效数据从 1 开始时，0 不能同时被当作空。', 'If slot 0 is reserved as a header, it cannot also be the null sentinel for data nodes.'],
        ],
      },
      {
        title: ['插入：先向空闲链表借结点', 'Insertion: borrow a node from the free list'],
        body: [
          '插入先取 freeHead 指向的空槽，令 freeHead 后移；把新结点接到链上时必须先写 new.next = prev.next，再写 prev.next = new。顺序反过来会先覆盖 prev.next，新结点就找不到原来的后继。',
          'Insertion first takes the slot at freeHead and advances freeHead. To link the new node, write new.next = prev.next before prev.next = new. Reversing the order overwrites the only reference to the old successor.',
        ],
        points: [
          ['在表头插入时，更新 head 指向新结点；有头结点时则更新头结点的 next。', 'At the front, update head (or the header node’s next when a header exists).'],
          ['在表尾插入时，新结点的 next 置空，原尾结点的 next 指向新结点。', 'At the tail, set the new node’s next to null and point the old tail at it.'],
          ['容量固定：空闲链表为空就表示数组已满，插入必须失败而不是继续覆盖。', 'Capacity is fixed: an empty free list means the array is full, so insertion must fail rather than overwrite.'],
        ],
      },
      {
        title: ['删除：摘链后把结点还回空闲链表', 'Deletion: unlink, then recycle'],
        body: [
          '删除需要先找到前驱。令 prev.next = target.next 绕过目标结点，再把 target.next 改成 freeHead、freeHead 改成 target 的下标。这样目标结点重新成为空闲链表的首元，数据域不必清零。',
          'Deletion needs the predecessor. Set prev.next = target.next to bypass the target, then set target.next = freeHead and freeHead = target’s index. The slot rejoins the free list; its data field need not be cleared.',
        ],
        points: [
          ['删除表头时要更新 head；若使用头结点，则删除头结点的后继。', 'Deleting the first data node updates head, or the header’s next when a header is used.'],
          ['删除表尾时，新尾结点的 next 必须置空。', 'Deleting the tail requires the new tail’s next to become null.'],
          ['结点回收后不能再从原链访问；外部若还保存它的下标，就是悬空引用。', 'After recycling, the old chain must not reach the slot; a saved cursor is now a dangling reference.'],
        ],
      },
      {
        title: ['和动态链表的关键区别', 'Key differences from a dynamic linked list'],
        body: [
          '动态链表用 malloc/new 在运行时申请任意结点，容量受可用内存限制；静态链表在编译期或初始化时确定数组大小，插入删除只改下标，不发生整块搬移。代价是容量上限固定，而且每个结点都要额外保存游标。',
          'A dynamic list allocates nodes at run time with malloc/new and is limited by available memory. A static list fixes its array size up front; insertion and deletion only rewrite indices and never shift the whole array. The price is a hard capacity limit and one extra cursor per node.',
        ],
        points: [
          ['静态链表仍要 O(n) 时间查找第 i 个结点，游标并不提供随机访问。', 'A static list still needs O(n) time to reach the i-th node; cursors do not provide random access.'],
          ['数组整体扩容或搬移会改变结点下标，外部保存的游标随之失效。', 'Growing or moving the array changes indices, invalidating cursors held outside.'],
          ['它常出现在不允许动态分配、或需要把链表状态整体序列化的教学与嵌入式场景。', 'It appears where dynamic allocation is unavailable or the whole list must be serialized as one array.'],
        ],
        formula: '结点 = (data, next)；next 是数组下标，不是地址',
        formulaEn: 'node = (data, next); next is an array index, not an address',
      },
    ],
    comparison: {
      title: ['静态链表与动态链表', 'Static versus dynamic linked lists'],
      columns: [
        ['比较项', 'Aspect'],
        ['静态链表', 'Static linked list'],
        ['动态链表', 'Dynamic linked list'],
      ],
      rows: [
        [
          ['结点来源', 'Node source'],
          ['预先分配的一维数组', 'A preallocated array'],
          ['运行时 malloc / new', 'malloc / new at run time'],
        ],
        [
          ['“指针”是什么', 'What “next” is'],
          ['同一数组的下标（游标）', 'An index into the same array'],
          ['真实地址或对象引用', 'A real address or object reference'],
        ],
        [
          ['容量', 'Capacity'],
          ['固定，空闲链表为空即满', 'Fixed; insertion fails when the free list is empty'],
          ['受可用内存限制，可逐结点申请', 'Limited by available memory; allocated per node'],
        ],
        [
          ['插入删除', 'Insert / delete'],
          ['改游标，不搬移数组元素', 'Rewrite cursors; no array shifting'],
          ['改指针，不搬移已有结点', 'Rewrite pointers; no existing node moves'],
        ],
        [
          ['主要风险', 'Main risk'],
          ['容量耗尽、游标失效、下标约定不统一', 'Capacity exhaustion, invalid cursors, inconsistent index conventions'],
          ['分配失败、内存泄漏、悬空指针', 'Allocation failure, leaks, dangling pointers'],
        ],
      ],
    },
    takeaway: [
      '静态链表的核心不是“数组”，而是“用下标当指针”；只要守住空闲链表与 next 赋值顺序，插入删除就和动态链表一样是 O(1)。',
      'The point is not the array itself but using indices as pointers. Preserve the free list and the next-assignment order, and insertion/deletion stay O(1) like a dynamic list.',
    ],
  },
  {
    id: 'sequential-list-capacity',
    topicId: 'sequential-capacity',
    title: ['顺序表的容量与动态扩容', 'Sequential-list capacity and dynamic growth'],
    chapter: ['第 2 章 · 线性表', 'Chapter 2 · Linear lists'],
    summary: [
      '顺序表用一段连续的存储单元保存元素。length 是当前有效元素个数，capacity 是这段空间最多能容纳多少个；两者不是同一个量。固定数组在 length 达到 capacity 后无法再插入，动态扩容通过申请更大的连续空间、复制旧元素、释放旧空间来继续增长。',
      'A sequential list stores elements in one contiguous block. length counts live elements, while capacity is how many the block can hold; they are different quantities. A fixed array cannot insert once length reaches capacity. Dynamic growth allocates a larger contiguous block, copies the old elements, releases the old block, and continues.',
    ],
    diagram: 'array',
    definitions: [
      {
        term: ['表长 length', 'Length'],
        text: ['当前真正保存的元素个数，合法范围是 0 ≤ length ≤ capacity。访问、插入、删除的有效范围都由 length 决定。', 'The number of elements actually stored, 0 ≤ length ≤ capacity. length, not capacity, defines the valid ranges for access, insertion and deletion.'],
      },
      {
        term: ['容量 capacity', 'Capacity'],
        text: ['当前这块连续存储空间最多能容纳的元素个数。容量不等于表长；length 达到 capacity 只表示“满了”，不表示“有 capacity 个有效元素”。', 'The maximum number of elements the current contiguous block can hold. Capacity is not length; length reaching capacity means full, not that capacity elements are meaningful.'],
      },
      {
        term: ['动态扩容', 'Dynamic growth'],
        text: ['表满且仍需插入时，申请一块更大的连续空间，把原有 length 个元素复制过去，更新数据区指针与 capacity，再释放旧空间。length 在复制前后保持不变。', 'When the table is full and another insertion is required, allocate a larger contiguous block, copy the length live elements, update the data pointer and capacity, then release the old block. length is unchanged by the copy.'],
      },
      {
        term: ['摊还代价', 'Amortised cost'],
        text: ['单次扩容要复制 length 个元素，是 O(n)；若每次把容量扩大为原来的常数倍（常见是 2 倍），连续 n 次插入的总复制量是 O(n)，平均每次插入 O(1)。', 'One growth copies length elements, O(n). If capacity is multiplied by a constant factor (commonly 2), the total copying over n insertions is O(n), so the average per insertion is O(1).'],
      },
    ],
    sections: [
      {
        title: ['先分清 length 与 capacity', 'Separate length from capacity'],
        body: [
          '固定容量顺序表常见的实现是 data[capacity] 加一个 length。前 length 个槽位是有效区 [0, length)，后面 capacity−length 个槽位是空闲区。按下标访问只允许 0 ≤ i < length；插入允许 0 ≤ i ≤ length，但必须先检查 length < capacity。把 capacity 当成元素个数，或遍历到 capacity，是顺序表最常见的越界错误。',
          'A fixed-capacity sequential list is usually data[capacity] plus a length. The first length slots form the live range [0, length); the remaining capacity−length slots are free. Indexed access allows 0 ≤ i < length; insertion allows 0 ≤ i ≤ length but must first check length < capacity. Treating capacity as the element count, or traversing to capacity, is the classic out-of-range bug.',
        ],
        points: [
          ['length = 0 是空表，仍是合法状态；capacity 可以大于 0。', 'length = 0 is a valid empty table even when capacity > 0.'],
          ['length = capacity 时表满；再插入必须先扩容或拒绝。', 'When length = capacity the table is full; another insertion must grow or be rejected.'],
          ['顺序表的随机访问 O(1) 来自连续地址计算，不来自 length 或 capacity 的数值。', 'O(1) random access comes from contiguous address arithmetic, not from the values of length or capacity.'],
        ],
        formula: '0 ≤ length ≤ capacity；有效下标 0 ≤ i < length',
        formulaEn: '0 ≤ length ≤ capacity; valid index 0 ≤ i < length',
      },
      {
        title: ['表满时怎样扩容', 'How growth works when the table is full'],
        body: [
          '扩容不是“把数组原地拉长”。连续空间后面可能已经被别的数据占用，所以通常要申请一块新的、更大的连续区域，把原 data[0..length) 逐个复制到新区域，再让 data 指向新区域、capacity 改成新容量，最后释放旧区域。复制后逻辑顺序不变，length 也不变；改变的是存放地点和可用空间。',
          'Growth is not “stretching the array in place”. The bytes after the block may belong to other data, so the usual procedure allocates a new, larger contiguous block, copies data[0..length) into it, points data at the new block, updates capacity, and releases the old block. Logical order and length do not change; the storage location and available space do.',
        ],
        points: [
          ['常见策略是把容量扩大为 2 倍；固定增量（例如每次加 10）在大量插入时会导致 O(n²) 的总复制。', 'A common policy doubles capacity; a fixed increment such as +10 can lead to O(n²) total copying over many insertions.'],
          ['扩容后旧空间的地址失效；任何指向旧 data 的指针、引用或迭代器都必须重新获取。', 'After growth the old block is invalid; any pointer, reference or iterator into the old data must be reacquired.'],
          ['扩容只发生在 length = capacity 且还要插入时；删除通常不缩容，避免频繁申请释放。', 'Growth happens only when length = capacity and another insertion is required; deletion usually does not shrink, avoiding repeated allocate/free churn.'],
        ],
        formula: 'newCapacity = max(1, 2 × capacity)；复制 length 个元素',
        formulaEn: 'newCapacity = max(1, 2 × capacity); copy length elements',
      },
      {
        title: ['复杂度与适用判断', 'Costs and when to use it'],
        body: [
          '扩容的单次复制是 O(length)，但按倍数增长时，容量序列是 1, 2, 4, 8, …，到 n 个元素总共复制的元素数不超过 2n，所以 n 次插入的摊还代价是 O(1)。这不代表每次插入都 O(1)：刚好触发扩容的那一次仍是 O(n)。顺序表的优势是随机访问 O(1)、缓存局部性好；代价是中间插入删除要搬移 O(n) 个元素，扩容时还要复制整块数据。若元素数量变化很大且主要在中间增删，链式存储通常更合适。',
          'One growth copies O(length) elements, but with doubling the capacities are 1, 2, 4, 8, … and the total copied before reaching n elements is at most 2n, so n insertions have O(1) amortised cost. That does not make every insertion O(1): the one that triggers growth is still O(n). The sequential list offers O(1) random access and good locality; it pays O(n) shifting for middle insertion/deletion and a full copy when growing. If the element count varies widely and changes concentrate in the middle, linked storage is often a better fit.',
        ],
        points: [
          ['扩容期间旧数组仍然存在，峰值内存可能接近旧容量与新容量之和。', 'During growth both blocks exist, so peak memory can approach old capacity plus new capacity.'],
          ['扩容改变的是 capacity，不是 length；复制完成后有效元素个数仍相同。', 'Growth changes capacity, not length; the element count is unchanged after copying.'],
          ['不要把“摊还 O(1)”误写成“最坏 O(1)”；单次扩容的最坏代价是 O(n)。', 'Do not turn “amortised O(1)” into “worst-case O(1)”; a single growth is O(n) worst case.'],
        ],
        formula: '访问 O(1)；中间插删 O(n)；扩容单次 O(n)，摊还 O(1)',
        formulaEn: 'access O(1); middle insert/delete O(n); growth O(n) once, O(1) amortised',
      },
    ],
    comparison: {
      title: ['固定容量与动态扩容', 'Fixed capacity versus dynamic growth'],
      columns: [
        ['比较项', 'Aspect'],
        ['固定容量数组', 'Fixed-capacity array'],
        ['动态扩容数组', 'Growing array'],
      ],
      rows: [
        [
          ['容量来源', 'Capacity source'],
          ['初始化时确定，之后不变', 'Fixed at initialisation'],
          ['满时申请更大连续块并更新 capacity', 'Allocates a larger block when full and updates capacity'],
        ],
        [
          ['表满插入', 'Insert when full'],
          ['直接拒绝', 'Rejected'],
          ['先扩容、复制，再插入', 'Grow, copy, then insert'],
        ],
        [
          ['单次最坏代价', 'Worst case per insertion'],
          ['O(n) 搬移，但无扩容复制', 'O(n) shifting, no growth copy'],
          ['O(n) 搬移，触发扩容时另加 O(n) 复制', 'O(n) shifting plus O(n) copying when growth triggers'],
        ],
        [
          ['地址稳定性', 'Address stability'],
          ['data 地址固定', 'data address is stable'],
          ['扩容后旧地址失效', 'Old addresses become invalid after growth'],
        ],
      ],
    },
    takeaway: [
      '容量是“能放多少”，表长是“已经放了多少”；扩容复制的是 length 个有效元素，复制后 length 不变、capacity 变大。按倍数扩容才有摊还 O(1)，单次扩容仍是 O(n)。',
      'Capacity is how much the block can hold; length is how much is stored. Growth copies the length live elements and changes capacity, not length. Doubling gives amortised O(1), while one growth is still O(n).',
    ],
  },
  {
    id: 'stack-recursion',
    topicId: 'stack-recursion',
    title: ['栈与递归', 'Stacks and recursion'],
    chapter: ['第 3 章 · 栈和队列', 'Chapter 3 · Stacks and queues'],
    summary: [
      '递归函数不是“跳回自己”，而是每次调用都压入一个新的栈帧；返回时按后进先出弹出。理解栈帧里保存了什么，才能解释递归为什么需要终止条件、为什么会栈溢出。',
      'A recursive function does not “jump back to itself”: every call pushes a new stack frame, and returns pop them in LIFO order. Understanding what a frame stores explains why recursion needs a base case and why deep recursion can overflow the stack.',
    ],
    diagram: 'stack-recursion',
    definitions: [
      {
        term: ['递归调用', 'Recursive call'],
        text: [
          '函数在执行过程中直接或间接调用自身；每次调用都有独立的参数和局部变量，不能与上一层共用。',
          'A function calls itself directly or indirectly. Each invocation has its own arguments and locals; it does not share them with the caller.',
        ],
      },
      {
        term: ['栈帧 / 活动记录', 'Stack frame / activation record'],
        text: [
          '一次函数调用对应的运行时记录，通常保存参数、局部变量、返回地址、调用者的栈帧位置，以及返回值。',
          'The run-time record for one call: typically arguments, locals, the return address, the caller’s frame link, and the result.',
        ],
      },
      {
        term: ['调用栈', 'Call stack'],
        text: [
          '当前尚未返回的所有栈帧组成的后进先出结构；栈顶是正在执行的调用。',
          'The LIFO structure of all frames that have not returned; the top frame is the call currently executing.',
        ],
      },
      {
        term: ['递归基', 'Base case'],
        text: [
          '不再继续递归、可以直接返回的输入条件；没有递归基，调用链不会收敛。',
          'An input condition that returns directly without another recursive call. Without it, the call chain never terminates.',
        ],
      },
    ],
    sections: [
      {
        title: ['一次递归调用怎样展开', 'How one recursive call unfolds'],
        body: [
          '以求 n! 为例，factorial(3) 不能立刻算出结果，它要先调用 factorial(2)；factorial(2) 再调用 factorial(1)，直到 factorial(0) 命中递归基返回 1。此时栈里同时存在 3、2、1、0 四层调用，最底层并没有“完成”。',
          'For n!, factorial(3) cannot finish immediately: it calls factorial(2), which calls factorial(1), until factorial(0) hits the base case and returns 1. At that moment four calls coexist on the stack; the outermost call is still unfinished.',
        ],
        formula: 'F(0) = 1；F(n) = n × F(n − 1)，n ≥ 1',
        formulaEn: 'F(0) = 1; F(n) = n × F(n − 1) for n ≥ 1',
      },
      {
        title: ['栈帧里保存什么', 'What a stack frame must keep'],
        body: [
          '递归调用返回后，外层函数还要继续做乘法，因此它必须记住当前参数 n、临时结果以及“返回到哪条指令”。这些信息不能放在一个全局变量里，否则下一层调用会覆盖上一层。',
          'After the inner call returns, the outer function still has to multiply, so it must remember its n, its partial result and where to resume. These values cannot live in one global slot, or the next call would overwrite them.',
        ],
        points: [
          ['参数与局部变量：每层独立，互不覆盖。', 'Arguments and locals: separate per invocation, never overwritten by the next call.'],
          ['返回地址：内层返回后，外层从调用点的下一条指令继续。', 'Return address: after the inner call returns, the outer call resumes after the call site.'],
          ['调用者帧链接：弹出当前帧后，恢复上一层的执行环境。', 'Caller link: after popping the current frame, the previous environment is restored.'],
          ['返回值：把内层结果交回外层，通常通过约定寄存器或调用者提供的空间传递。', 'Return value: hands the inner result back, often through a register or caller-provided space.'],
        ],
      },
      {
        title: ['返回为什么是后进先出', 'Why returns are LIFO'],
        body: [
          '最后被调用的 factorial(0) 最先返回 1；它返回后，factorial(1) 才能计算 1×1 并返回；接着 factorial(2) 计算 2×1，最后 factorial(3) 得到 6。压栈顺序与出栈顺序相反，这正是栈的约束。',
          'factorial(0), the last call pushed, returns 1 first. Only then can factorial(1) compute 1×1, then factorial(2) compute 2×1, and finally factorial(3) produce 6. Push order and pop order are opposites, exactly the stack constraint.',
        ],
        points: [
          ['递归的“回溯”不是重新执行函数体，而是逐层恢复被挂起的栈帧。', 'Recursive “backtracking” does not re-run the body; it resumes each suspended frame.'],
          ['尾递归可以把递归调用放在返回位置，但普通编译器不保证消除调用栈。', 'Tail recursion places the call in return position, but ordinary compilers do not guarantee stack elimination.'],
          ['用显式栈模拟递归时，必须自己保存参数、阶段和局部状态，不能只保存一个下标。', 'Simulating recursion with an explicit stack requires saving arguments, stage and locals, not just an index.'],
        ],
      },
      {
        title: ['终止条件与栈空间', 'Base cases and stack space'],
        body: [
          '递归基负责切断调用链；缺少它或写错边界，函数会一直压栈直到运行时栈耗尽。即使有递归基，深度为 n 的线性递归也需要 O(n) 个栈帧，所以“时间复杂度可以接受”不代表空间上安全。',
          'The base case cuts the call chain. Missing or wrong bounds keep pushing frames until the run-time stack is exhausted. Even with a base case, linear recursion of depth n needs O(n) frames, so acceptable time complexity does not imply safe space use.',
        ],
        points: [
          ['先检查最小输入、边界输入和“不会再缩小”的分支。', 'Check the smallest input, boundary inputs and the branch that no longer shrinks.'],
          ['递归深度与输入规模同阶时要评估栈上限；必要时改成迭代或显式栈。', 'When depth grows with input, evaluate the stack limit; switch to iteration or an explicit stack if needed.'],
          ['重复子问题不会自动被调用栈消除，斐波那契的朴素递归仍会指数级重复。', 'The call stack does not remove repeated subproblems: naive Fibonacci recursion still repeats exponentially.'],
        ],
      },
    ],
    comparison: {
      title: ['递归实现与显式栈模拟', 'Recursive implementation versus an explicit stack'],
      columns: [
        ['比较项', 'Aspect'],
        ['递归函数', 'Recursive function'],
        ['显式栈模拟', 'Explicit-stack simulation'],
      ],
      rows: [
        [
          ['代码结构', 'Code shape'],
          ['函数调用自身，贴近数学定义', 'The function calls itself, close to the mathematical definition'],
          ['循环 + 手写栈，需记录执行阶段', 'A loop plus a manual stack with recorded stages'],
        ],
        [
          ['状态保存', 'State saving'],
          ['由运行时栈帧自动保存', 'Saved by the run-time stack frames'],
          ['由代码显式保存参数与局部状态', 'The code saves arguments and locals explicitly'],
        ],
        [
          ['空间', 'Space'],
          ['O(递归深度) 个栈帧', 'O(recursion depth) frames'],
          ['O(深度) 个自建记录', 'O(depth) manually built records'],
        ],
        [
          ['主要风险', 'Main risk'],
          ['栈溢出；边界写错导致不终止', 'Stack overflow; a wrong base case prevents termination'],
          ['状态漏存或阶段顺序错误', 'Missing state or incorrect stage ordering'],
        ],
      ],
    },
    takeaway: [
      '把递归看成“压帧—挂起—逐层返回”，而不是函数反复从头执行；终止条件决定能否停下，栈帧数量决定会不会溢出。',
      'Read recursion as push a frame, suspend, then return layer by layer. The base case decides whether it stops; the number of frames decides whether it overflows.',
    ],
  },
  {
    id: 'string-storage',
    topicId: 'string-storage',
    title: ['串的存储结构', 'String storage structures'],
    chapter: ['第 4 章 · 串', 'Chapter 4 · Strings'],
    summary: [
      '串可以用定长数组、堆上的连续空间或块链保存。三者都要把“容量”和“当前串长”分开，但容量来源、随机访问、插入删除与连接代价不同；还要区分 C 语言以 0 结尾的字符串和教材中带显式 length 的串 ADT。',
      'A string can live in a fixed array, a heap allocation or a chain of blocks. All three separate capacity from current length, but differ in capacity source, indexed access, insertion/deletion and concatenation cost. Also distinguish a C string ended by 0 from the textbook string ADT with an explicit length.',
    ],
    diagram: 'string-storage',
    definitions: [
      {
        term: ['定长顺序存储', 'Fixed-length sequential storage'],
        text: [
          '用固定大小的字符数组保存串，另设 length 记录实际长度；最大长度在编译或初始化时确定，容量不能再增长。',
          'A fixed-size character array plus a length field; the maximum is fixed at compile or initialization time, so capacity cannot grow.',
        ],
      },
      {
        term: ['堆分配存储', 'Heap-allocated storage'],
        text: [
          '串仍连续存放，但空间在运行时从堆申请；用基址指针、当前长度和容量描述，扩容时重新分配并复制字符。',
          'Characters remain contiguous, but space is allocated from the heap at run time; a base pointer, current length and capacity describe it, and growth reallocates and copies characters.',
        ],
      },
      {
        term: ['块链存储', 'Block-chain storage'],
        text: [
          '把串切成若干字符块，每块是一个结点，结点内有固定容量的字符数组和 next 指针；最后一块可能没有装满。',
          'The string is split into character blocks. Each node holds a fixed-capacity character array and a next pointer; the final block may be partially filled.',
        ],
      },
      {
        term: ['串长', 'String length'],
        text: [
          '当前有效字符的个数，不包含结尾哨兵；它与数组容量、块结点数量都不是同一个概念。',
          'The number of valid characters, excluding any terminator. It is distinct from array capacity and from the number of block nodes.',
        ],
      },
      {
        term: ['结束约定', 'Termination convention'],
        text: [
          '教材串 ADT 用 length 字段决定有效字符个数；C 语言字符串没有 length，改用字符 0（写作 \\0）标记结尾。两种约定不能混用。',
          'The textbook string ADT uses a length field; a C string has no length field and uses the null character 0 (written \\0) as a terminator. The two conventions must not be mixed.',
        ],
      },
      {
        term: ['存储密度', 'Storage density'],
        text: [
          '块链串中有效字符所占空间与全部结点空间之比。块越大，指针开销占比越低；块越小，链接开销和块内空位浪费越明显。',
          'For a block chain, the ratio of space holding valid characters to total node space. Larger blocks reduce pointer overhead; smaller blocks make link overhead and unused slots more visible.',
        ],
      },
    ],
    sections: [
      {
        title: ['定长顺序存储：简单但会截断', 'Fixed sequential storage: simple but bounded'],
        body: [
          '定长顺序串的容量 MAXLEN 在定义时固定。赋值、连接等操作一旦超过容量，只能报错或截断；不能用“数组还有空位”来判断能否写入，必须同时检查 length。字符连续存放使按下标访问为 O(1)，但插入、删除或连接往往要搬移整段后缀。',
          'A fixed sequential string has a compile-time MAXLEN. Assignment or concatenation beyond capacity must fail or truncate; “the array still has spare cells” is not enough—check length as well. Contiguous characters give O(1) indexed access, but insertion, deletion or concatenation often shift a suffix.',
        ],
        points: [
          ['第 i 个字符可直接按下标访问，随机访问是 O(1)。', 'Character i is directly indexable, so random access is O(1).'],
          ['在位置 i 插入一段字符：先把 i 及其后的字符整体后移，再写入新字符；删除则把后缀整体前移。', 'Inserting at i shifts i and later characters right before writing; deletion shifts the suffix left.'],
          ['连接两个定长串要检查结果长度是否超过 MAXLEN；超出时只能截断或报错，不能悄悄覆盖容量外的内存。', 'Concatenating fixed strings must check the result against MAXLEN; overflow must truncate or fail rather than write past capacity.'],
          ['容量浪费与溢出风险同时存在，适合长度短且可预知的串。', 'Wasted capacity and overflow coexist; suited to short strings of known bound.'],
        ],
      },
      {
        title: ['C 字符串的 0 结尾与教材串 ADT 的 length 字段', 'C string terminator versus the ADT length field'],
        body: [
          'C 语言字符串用字符 0（显示为 \\0）表示“有效字符到此为止”，函数通常靠扫描这个 0 求长度；教材串 ADT 则在结构里显式保存 length，字符数组只是容量。两者都能描述同一段字符，但判断结束、求长和越界检查的方式完全不同。',
          'A C string uses the null character 0 (shown as \\0) to mark the end, and functions usually scan for it to find the length; the textbook string ADT stores length explicitly and treats the array as capacity. Both can describe the same characters, but end detection, length computation and bounds checks differ.',
        ],
        points: [
          ['C 字符串：实际字符之后必须留一个 \\0； strlen 扫描到它为止，因此求长是 O(n)，且不能表示“内容中本来就含 0”的普通文本。', 'C string: one \\0 must follow the last character; strlen scans to it, so length is O(n), and ordinary text containing an embedded 0 cannot be represented.'],
          ['串 ADT：length 是有效字符数，第 length 个槽位之后的内容不属于当前串；求长是 O(1)，但每次写入都必须同步维护 length。', 'String ADT: length is the valid character count; slots at and beyond length are outside the string. Length is O(1), but every write must maintain length.'],
          ['把 C 字符串直接按 length 访问，或用 strlen 给 ADT 求长，都会把两套约定混在一起，是常见越界/错读来源。', 'Accessing a C string as if it had a length field, or calling strlen on an ADT, mixes the conventions and is a common source of out-of-bounds reads.'],
          ['图示同时画出两种读法：数组第 5 格放 \\0 表示 C 字符串结束；ADT 则记 S.length = 5，第 5 格及以后仍是容量。', 'The diagram shows both readings: slot 5 holds \\0 for a C string, while the ADT records S.length = 5 and treats slot 5 onward as capacity.'],
        ],
        formula: 'C 字符串：ch[5] = \\0，长度由扫描得到；串 ADT：S.length = 5，长度直接读取',
        formulaEn: 'C string: ch[5] = \\0, length found by scanning; string ADT: S.length = 5, length read directly',
      },
      {
        title: ['堆分配存储：按实际长度申请', 'Heap allocation: size to the actual string'],
        body: [
          '堆分配串在运行时申请一块连续空间，基址指针指向首字符，length 记录有效长度，capacity 记录当前可写容量。它保留顺序存储的随机访问，又能让容量贴近实际长度；代价是申请/释放、复制和失败处理。',
          'A heap string allocates one contiguous run at run time. A base pointer names the first character, length records valid characters and capacity records writable slots. It keeps O(1) indexed access while sizing capacity to the text, at the cost of allocation, freeing, copying and failure handling.',
        ],
        points: [
          ['起始地址 base 只是堆块的入口；T[i] 对应 base[i]，不能把 base 当成字符本身。', 'The base address is only the entry to the heap block; T[i] maps to base[i], so base is not a character.'],
          ['扩容通常经历“申请新块 → 复制旧字符 → 释放旧块 → 更新 base 与 capacity”；旧块后面不一定有可用空间，不能盲目原地延长。', 'Growth normally allocates a new block, copies old characters, frees the old block and updates base and capacity; the old block is not guaranteed to have room after it.'],
          ['realloc 可能移动内存，因此扩容后旧指针可能失效；所有指向旧块的指针都要重新获取。', 'realloc may move memory, so old pointers can become invalid after growth; every pointer into the old block must be refreshed.'],
          ['浅拷贝只复制基址指针，会让两个串共享同一块字符空间；需要独立所有权时必须深拷贝。', 'A shallow copy duplicates only the base pointer, making two strings share storage; independent ownership requires a deep copy.'],
          ['拷贝 n 个字符是 O(n)；若采用“容量翻倍”策略，连续追加的摊还代价仍为 O(1) 每次。', 'Copying n characters is O(n); with capacity doubling, repeated appends have O(1) amortized cost.'],
        ],
      },
      {
        title: ['块链存储：拼接灵活但访问不直接', 'Block chain: flexible concatenation, indirect access'],
        body: [
          '块链串把字符分散在多个块结点中。每个结点通常包含一个固定容量的字符数组和一个 next 指针。连接两个串可以只把前串尾块指向后串首块，通常不必复制全部字符；但要找第 i 个字符，必须从头块逐块跳转并在块内定位。',
          'A block-chain string scatters characters across linked nodes. Each node normally holds a fixed-capacity character array and a next pointer. Concatenation can point the last block of one string at the first block of another without copying every character, but locating character i requires walking blocks from the head and then indexing inside the block.',
        ],
        points: [
          ['结点容量决定“每块最多几个字符”；串长仍单独记录，最后一块通常只填一部分。', 'Node capacity sets the maximum characters per block; string length is still separate, and the final block is usually partial.'],
          ['存储密度 = 有效字符总空间 / 全部结点空间。块越小，next 指针与块内空位占比越大；块越大，单次拼接复制和空间浪费可能越大。', 'Storage density = space for valid characters / total node space. Smaller blocks increase pointer and unused-slot overhead; larger blocks can increase copy cost and waste on concatenation.'],
          ['遍历到 length 就停止，不能因为当前块是最后一块就把所有槽位都当有效字符。', 'Traversal stops at length; do not treat every slot in the final block as valid.'],
          ['块链适合频繁连接、字符流式追加或难以申请大块连续空间的场景；模式匹配通常仍偏好连续存储。', 'Block chains suit frequent concatenation, streaming appends or settings without large contiguous allocations; pattern matching usually still prefers contiguous storage.'],
        ],
        formula: '存储密度 ≈ 有效字符数 / (结点数 × 结点容量)；还要计入 next 指针开销',
        formulaEn: 'storage density ≈ valid characters / (nodes × node capacity), with next-pointer overhead added',
      },
      {
        title: ['怎样选择', 'Choosing a representation'],
        body: [
          '若串长有明确上限且操作简单，定长顺序存储最直接；若长度变化大、需要连续空间做匹配，堆分配更合适；若以拼接和分段追加为主、连续大块难申请，块链更合适。',
          'If the length has a tight known bound and operations are simple, fixed sequential storage is simplest. If length varies and matching needs contiguous characters, heap allocation is better. If concatenation and chunked appends dominate and large contiguous blocks are scarce, use a block chain.',
        ],
        points: [
          ['不要用“最多能存多少”代替“当前有多长”，容量与长度必须分开维护。', 'Never use maximum capacity as the current length; keep capacity and length separate.'],
          ['模式匹配通常偏好连续存储；块链要先处理跨块窗口，算法会复杂得多。', 'Pattern matching usually prefers contiguous storage; a block chain must handle windows spanning blocks, which complicates the algorithm.'],
          ['三种结构都不改变串的逻辑定义：字符序列、长度和位置关系仍然相同。', 'None changes the logical definition: character sequence, length and positional order remain the same.'],
        ],
      },
    ],
    comparison: {
      title: ['三种串存储结构', 'Three string storage structures'],
      columns: [
        ['比较项', 'Aspect'],
        ['定长顺序', 'Fixed sequential'],
        ['堆分配', 'Heap allocated'],
        ['块链', 'Block chain'],
      ],
      rows: [
        [
          ['存储布局', 'Storage layout'],
          ['一段连续数组，length 在结构内', 'One contiguous array with length inside the struct'],
          ['堆上一段连续块，base + length + capacity', 'One contiguous heap block with base + length + capacity'],
          ['多个结点，每结点含字符数组与 next', 'Several nodes, each with a character array and next'],
        ],
        [
          ['空间来源', 'Space source'],
          ['固定字符数组', 'A fixed character array'],
          ['运行时堆上的连续块', 'A contiguous heap block allocated at run time'],
          ['多个块结点 + next', 'Several block nodes linked by next'],
        ],
        [
          ['容量', 'Capacity'],
          ['初始化后不可变，超出即截断/报错', 'Fixed after initialization; overflow truncates or fails'],
          ['可按实际长度申请，扩容需复制', 'Sized to the actual text; growth copies'],
          ['按块增加，最后一块可不满', 'Grows by blocks; the last block may be partial'],
        ],
        [
          ['插入/删除主要代价', 'Cost of insert/delete'],
          ['搬移位置之后的整段后缀，最坏 O(n)', 'Shift the suffix after the position, O(n) worst case'],
          ['在连续块内搬移，扩容时还可能整体复制', 'Shift within the block; growth may copy the whole string'],
          ['找到块后改 next；可能拆分/合并块，块内仍有搬移', 'Rewire next after locating the block; splitting/merging may still shift inside blocks'],
        ],
        [
          ['随机访问第 i 个字符', 'Random access to character i'],
          ['O(1)', 'O(1)'],
          ['O(1)', 'O(1)'],
          ['O(i / 块大小)，需逐块定位', 'O(i / block size), walking blocks'],
        ],
        [
          ['连接两个串', 'Concatenate two strings'],
          ['受容量限制，可能搬移/截断', 'Capacity-bound; may shift or truncate'],
          ['申请新块并复制两段字符', 'Allocate a new block and copy both parts'],
          ['改尾块 next，通常无需复制字符', 'Link the tail block; usually no character copy'],
        ],
        [
          ['存储密度/额外开销', 'Storage density/overhead'],
          ['高，除 length 外无链接开销，但容量可能闲置', 'High, only a length field, but spare capacity may sit idle'],
          ['高，字符连续；需额外保存 base/capacity，扩容有复制峰值', 'High and contiguous; base/capacity add fields, and growth has a copy peak'],
          ['较低，next 指针和末块空位占空间，块越小越明显', 'Lower: next pointers and final-block gaps cost space, worse with small blocks'],
        ],
        [
          ['典型场景', 'Typical use'],
          ['短串、上限明确', 'Short strings with a known bound'],
          ['长度可变、需要连续匹配', 'Variable length and contiguous matching'],
          ['频繁拼接、流式追加', 'Frequent concatenation and streaming appends'],
        ],
      ],
    },
    takeaway: [
      '先分清容量与串长，再按“是否需要连续空间、是否频繁拼接、长度是否可预知”选择存储结构；块链省复制，但随机访问和匹配都会变复杂。',
      'Separate capacity from length, then choose by contiguity, concatenation frequency and whether the length is known. A block chain saves copying but complicates indexed access and matching.',
    ],
  },
];
