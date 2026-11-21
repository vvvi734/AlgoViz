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
      '串可以用定长数组、堆上的连续空间或块链保存。三者都记录串长，但容量、随机访问、连接操作和空间开销不同；选择存储结构要看串长是否可预知、是否频繁拼接。',
      'A string can live in a fixed array, a heap allocation or a chain of blocks. All three record the length, but they differ in capacity, random access, concatenation cost and overhead. Choose according to whether the length is known and whether concatenation is frequent.',
    ],
    diagram: 'string-storage',
    definitions: [
      {
        term: ['定长顺序存储', 'Fixed-length sequential storage'],
        text: [
          '用固定大小的字符数组保存串，另设 length 记录实际长度；最大长度在编译或初始化时确定。',
          'A fixed-size character array plus a length field; the maximum length is fixed at compile or initialization time.',
        ],
      },
      {
        term: ['堆分配存储', 'Heap-allocated storage'],
        text: [
          '串仍连续存放，但空间在运行时从堆申请；用基址指针和 length 描述，容量可按实际需要确定。',
          'Characters remain contiguous, but the space is allocated from the heap at run time; a base pointer and length describe it, and capacity can match the actual need.',
        ],
      },
      {
        term: ['块链存储', 'Block-chain storage'],
        text: [
          '把串切成若干字符块，每块是一个结点，结点之间用 next 连接；最后一块可能没有装满。',
          'The string is split into character blocks. Each block is a node linked by next; the final block may be partially filled.',
        ],
      },
      {
        term: ['串长', 'String length'],
        text: [
          '当前有效字符的个数，不包含结尾哨兵；它与数组容量、块结点数量都不是同一个概念。',
          'The number of valid characters, excluding any terminator. It is distinct from array capacity and from the number of block nodes.',
        ],
      },
    ],
    sections: [
      {
        title: ['定长顺序存储：简单但会截断', 'Fixed sequential storage: simple but bounded'],
        body: [
          '定长顺序串的容量 MAXLEN 在定义时固定。赋值、连接等操作一旦超过容量，只能报错或截断；不能用“数组还有空位”来判断能否写入，必须同时检查 length。',
          'A fixed sequential string has a compile-time MAXLEN. Assignment or concatenation beyond capacity must fail or truncate; “the array still has spare cells” is not enough—check length as well.',
        ],
        points: [
          ['第 i 个字符可直接按下标访问，随机访问是 O(1)。', 'Character i is directly indexable, so random access is O(1).'],
          ['插入/删除中间字符通常要搬移后缀，代价 O(n)。', 'Inserting or deleting in the middle usually shifts the suffix, costing O(n).'],
          ['容量浪费与溢出风险同时存在，适合长度短且可预知的串。', 'Wasted capacity and overflow coexist; suited to short strings of known bound.'],
        ],
      },
      {
        title: ['堆分配存储：按实际长度申请', 'Heap allocation: size to the actual string'],
        body: [
          '堆分配串在运行时申请一块连续空间，基址指针指向首字符，length 记录有效长度。它保留顺序存储的随机访问，又能让容量贴近实际长度；代价是申请/释放、复制和失败处理。',
          'A heap string allocates one contiguous run at run time. A base pointer names the first character and length records the valid count. It keeps O(1) indexed access while sizing capacity to the text, at the cost of allocation, freeing, copying and failure handling.',
        ],
        points: [
          ['扩容通常要申请新块、复制旧字符、释放旧块，不能假定原块后面一定有空位。', 'Growing normally allocates a new block, copies the old characters and frees the old block; the old block is not guaranteed to have free space after it.'],
          ['浅拷贝只复制基址指针，会让两个串共享同一块字符空间；需要独立所有权时必须深拷贝。', 'A shallow copy duplicates only the base pointer, making two strings share storage; independent ownership requires a deep copy.'],
          ['适合长度变化较大、需要连续字符序列的模式匹配。', 'Suited to variable lengths and pattern matching that needs a contiguous character sequence.'],
        ],
      },
      {
        title: ['块链存储：拼接灵活但访问不直接', 'Block chain: flexible concatenation, indirect access'],
        body: [
          '块链串把字符分散在多个块结点中。连接两个串只需把前串尾块指向后串首块，通常不必复制全部字符；但要找第 i 个字符，必须从头块逐块跳转并在块内定位。',
          'A block-chain string scatters characters across linked blocks. Concatenation can point the last block of one string at the first block of another without copying every character, but locating character i requires walking blocks from the head and then indexing inside the block.',
        ],
        points: [
          ['块大小是重要参数：块大则指针开销小、块内定位快；块小则拼接粒度细、碎片少。', 'Block size matters: larger blocks reduce pointer overhead and speed in-block access; smaller blocks give finer concatenation and less waste.'],
          ['最后一块可能只填了一部分，遍历必须以 length 为准，不能把整块都当有效字符。', 'The last block may be partial; traversal must stop at length rather than treating the whole block as valid.'],
          ['适合频繁连接、字符流式追加或不能保证大块连续空间的场景。', 'Suited to frequent concatenation, streaming appends, or settings without large contiguous space.'],
        ],
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
