import type { Lesson } from './types';

/**
 * TEXTBOOK-08 — three dynamic-storage courses.
 *
 * Every stepId below is emitted by the real Python program, not synthesised by
 * the UI. Capacity, block addresses, buddy levels, object sets and moved
 * addresses all arrive in the trace snapshot.
 */

export const freeListLesson: Lesson = {
  lessonId: 'free-list-allocation',
  algorithmId: 'free-list',
  contentVersion: '1.0.0',
  title: { zh: '空闲空间表：首次适应与最佳适应', en: 'Free-space list: First Fit and Best Fit' },
  oneLiner: {
    zh: '在一条模拟内存地址带上，用同一套分配/释放算法比较两种选块策略，并观察分裂与相邻合并。',
    en: 'Compare two block-selection policies on one simulated memory band while observing splitting and neighbour coalescing.',
  },
  overview: {
    zh: '已分配块与空闲块首尾相接地铺满整条地址带。一次申请到来时，算法按策略从空闲表选一个足够大的连续块；若块更大，就分裂出剩余空闲块。释放时先看左右邻是否空闲，再合并。',
    en: 'Allocated and free blocks tile the address band without gaps. On a request, the algorithm selects an adequate contiguous block from the free list; if it is larger, the remainder becomes a new free block. On release it checks both neighbours and coalesces them.',
  },
  intuition: {
    zh: '把空闲表想成一张“可租空地清单”。首次适应是“从低地址开始，看到第一块能放下就租”；最佳适应是“把所有能放下的都看一遍，挑剩下最少的那块”。租下大块后要切掉多余部分；退租时若隔壁也空着，就把两块并回去。',
    en: 'Treat the free list as a list of vacant lots. First Fit rents the first adequate lot from the low-address end; Best Fit inspects every adequate lot and takes the one leaving the smallest remainder. Renting a large lot means cutting off the excess; returning a lot merges it with a vacant neighbour.',
  },
  prerequisites: {
    zh: ['知道地址与大小如何表示一个区间', '理解数组下标与半开区间 [start, start + size)', '知道“已分配”与“空闲”是块的状态'],
    en: ['Know how an address and size describe an interval', 'Understand array indices and the half-open interval [start, start + size)', 'Know that allocated and free are block states'],
  },
  complexity: {
    time: 'O(M · F)',
    space: 'O(F + B)',
    note: {
      zh: 'M 为操作数，F 为空闲块数，B 为总块数。首次适应找到第一块即可停止；最佳适应通常要扫描完整个空闲表才能确定“剩余最小”。若空闲表按地址有序，释放时可按地址定位邻块，但插入/删除仍需表操作。',
      en: 'M is the number of operations, F the number of free blocks, B the total number of blocks. First Fit can stop at the first adequate block; Best Fit usually scans the whole free list to prove the smallest remainder. With an address-ordered list, neighbours are found by address, but insertion/deletion still costs list work.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '初始化整块空闲', en: 'Start with one free block' },
      explanation: {
        zh: '容量 capacity 的整段内存从地址 0 开始，是一个空闲块。空闲表只有一项 [0, capacity)，此时没有已分配块。',
        en: 'The whole capacity starts at address 0 as one free block. The free list has the single entry [0, capacity) and no block is allocated yet.',
      },
      tip: { zh: '先确认区间是半开区间，后面所有相邻判断都依赖它。', en: 'Confirm the half-open interval first; every adjacency test depends on it.' },
    },
    {
      stepId: 'scan',
      title: { zh: '按策略扫描候选块', en: 'Scan candidate blocks by policy' },
      explanation: {
        zh: '申请到达后，算法按地址顺序检查空闲块。块太小就跳过；块足够大就记录为候选。首次适应遇到第一个候选立即停止；最佳适应继续扫描，只保留剩余最小的候选。',
        en: 'A request arrives and the algorithm inspects free blocks in address order. A too-small block is skipped; an adequate block becomes a candidate. First Fit stops at the first candidate; Best Fit keeps scanning and retains the smallest remainder.',
      },
      tip: { zh: '候选块用高亮边框标出，但它还不等于最终选择。', en: 'A candidate has a highlighted border, but it is not yet the final choice.' },
    },
    {
      stepId: 'select',
      title: { zh: '确定最终选择的块', en: 'Commit to the selected block' },
      explanation: {
        zh: '扫描结束后，算法确定一个候选作为最终块。首次适应取最低地址的可行块；最佳适应取剩余最小的块，剩余相同时保留更早的地址。',
        en: 'After the scan, one candidate becomes the final block. First Fit takes the lowest-address adequate block; Best Fit takes the smallest remainder, keeping the earlier address on a tie.',
      },
      tip: { zh: '比较两种策略时，最终空闲总量可能相同，但分配位置可能完全不同。', en: 'Across policies the total free bytes may match while the allocated positions differ.' },
    },
    {
      stepId: 'split',
      title: { zh: '分裂剩余空间', en: 'Split the remainder' },
      explanation: {
        zh: '若选中块严格大于请求，就把块的前 request 字节标记为已分配，把后面的剩余字节变成一个新的空闲块。新块起始地址是 start + request，大小是原大小减请求量。',
        en: 'If the selected block is strictly larger than the request, its first request bytes become allocated and the remainder becomes a new free block. The new block starts at start + request with size oldSize − request.',
      },
      tip: { zh: '分裂后的两块必须无缝相接，不能留缝也不能重叠。', en: 'The two resulting blocks must touch exactly: no gap and no overlap.' },
    },
    {
      stepId: 'allocate',
      title: { zh: '登记已分配块', en: 'Record the allocated block' },
      explanation: {
        zh: '选中的区间标记为已分配并写入块 ID；空闲表移除或缩短对应项。请求方现在拥有 [start, start + request)。',
        en: 'The chosen interval is marked allocated and labelled with the block ID; the free entry is removed or shortened. The requester now owns [start, start + request).',
      },
      tip: { zh: '地址、块大小和块 ID 三者要同时更新，否则地址带与空闲表会不一致。', en: 'Address, size and ID must update together, or the band and free list disagree.' },
    },
    {
      stepId: 'release',
      title: { zh: '释放并检查左右邻', en: 'Release and inspect neighbours' },
      explanation: {
        zh: '释放只接受仍处于已分配状态的块。算法把该块标记为空闲，然后读取左邻和右邻状态，得到 isolated、left-free、right-free 或 both-free 四种情形之一。',
        en: 'A release accepts only a block still marked allocated. The block becomes free, then the left and right neighbour states yield one of isolated, left-free, right-free or both-free.',
      },
      tip: { zh: '重复释放必须被拒绝；同一块不能被归还两次。', en: 'Double release must be rejected; one block cannot be returned twice.' },
    },
    {
      stepId: 'merge',
      title: { zh: '与相邻空闲块合并', en: 'Coalesce with free neighbours' },
      explanation: {
        zh: '左邻空闲就先把左块与释放块并成一块，更新新块的起始地址与大小；右邻空闲时再向右并一次。双侧合并后，空闲表减少两项；单侧合并减少一项。',
        en: 'If the left neighbour is free, merge it with the released block and update the merged start and size; if the right neighbour is free, merge again to the right. A two-sided merge removes two free entries, a one-sided merge removes one.',
      },
      tip: { zh: '合并只改变空闲结构，不移动任何已分配块。', en: 'Coalescing changes free structure only; no allocated block moves.' },
    },
    {
      stepId: 'fail',
      title: { zh: '没有足够大的连续块', en: 'No adequate contiguous block' },
      explanation: {
        zh: '若所有空闲块都小于请求，申请失败。算法保持已经存在的所有块不变，不通过移动已分配块来“凑出”空间。失败是一种正确结果。',
        en: 'If every free block is smaller than the request, allocation fails. All existing blocks stay unchanged; the algorithm never moves allocated blocks to manufacture space. Failure is a correct outcome.',
      },
      tip: { zh: '总空闲足够但最大连续块不足，是典型的外部碎片。', en: 'Enough total free bytes with too small a largest run is textbook external fragmentation.' },
    },
    {
      stepId: 'done',
      title: { zh: '操作序列完成', en: 'Operation sequence complete' },
      explanation: {
        zh: '所有申请与释放处理完毕。最终画面给出已分配块、空闲块、空闲区数、总空闲字节与最大连续块，可直接与空闲表对照。',
        en: 'Every request and release is processed. The final frame reports allocated blocks, free blocks, free-region count, total free bytes and the largest run, all directly comparable with the free list.',
      },
      tip: { zh: '切换策略重跑同一序列，观察“选择”帧从哪里开始不同。', en: 'Rerun the same sequence under the other policy and watch where the select frame diverges.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把“总空闲字节”当成“最大连续空闲字节”，于是误判申请应该成功。',
      '释放后只看右邻，漏掉左邻合并。',
      '块大小与块 ID 更新了，但空闲表没有同步缩短或删除。',
      '最佳适应在剩余空间相同时随意选块，导致同一输入出现不稳定结果。',
      '申请失败时偷偷移动已分配块，改变了题目要求的连续分配模型。',
    ],
    en: [
      'Treating total free bytes as the largest contiguous run and predicting a success that cannot happen.',
      'Checking only the right neighbour on release and missing a left merge.',
      'Updating block size and ID without shortening or removing the free-list entry.',
      'Choosing arbitrarily on equal Best-Fit remainders, making the same input unstable.',
      'Moving allocated blocks after a failed request, changing the required contiguous model.',
    ],
  },
};

export const buddySystemLesson: Lesson = {
  lessonId: 'buddy-system-allocation',
  algorithmId: 'buddy-system',
  contentVersion: '1.0.0',
  title: { zh: '伙伴系统：按 2 的幂分裂与合并', en: 'Buddy system: splitting and merging by powers of two' },
  oneLiner: {
    zh: '把整块内存看成完全二叉树，申请时向上取整到 2 的幂、逐层平分；释放时只与真正的伙伴合并。',
    en: 'Treat memory as a complete binary tree: round requests up to powers of two, split level by level, and merge only with a true buddy on release.',
  },
  overview: {
    zh: '容量必须是 2 的幂，因此每个块都能反复平分为两个大小相等的伙伴。申请量先向上取整到块等级；算法从该等级向上寻找最小的可用空闲块，再逐层分裂到目标等级。释放时用 start XOR size 求伙伴地址，只有伙伴存在且空闲才逐级合并。',
    en: 'Capacity is a power of two, so every block can be halved into two equal buddies. A request rounds up to a block level; the algorithm searches upward for the smallest adequate free block, then splits down to the target level. On release, start XOR size gives the buddy; merge only when that buddy exists and is free.',
  },
  intuition: {
    zh: '像把一块蛋糕不断对半切：要 3 寸就先找 4 寸的块，切成两个 2 寸，再把其中一个切成两个 1 寸，取出所需的一份，剩下的碎块留在树上。还蛋糕时，只有“同一刀切出的另一半”也空着，才能拼回上一层的整块。',
    en: 'Think of repeatedly halving a cake. For a 3-unit piece, find a 4-unit block, halve it into two 2-unit blocks, halve one into two 1-unit blocks, take what is needed and leave the rest in the tree. When returning a piece, it can merge only if the exact other half from the same cut is also free.',
  },
  prerequisites: {
    zh: ['知道 2 的幂与 log₂', '理解完全二叉树的层与节点', '知道按位异或 XOR', '理解半开区间与块地址'],
    en: ['Know powers of two and log₂', 'Understand levels and nodes of a complete binary tree', 'Know bitwise XOR', 'Understand half-open intervals and block addresses'],
  },
  complexity: {
    time: 'O(M·L)',
    space: 'O(B)',
    note: {
      zh: 'L = log₂(capacity) 是伙伴树深度，B 是当前块数。查找、逐层分裂和逐级合并都与 L 成正比；伙伴地址由 start XOR size 直接算出，不需要扫描表。内部碎片最多为 blockSize − requestSize。',
      en: 'L = log₂(capacity) is the tree depth and B the current block count. Search, repeated splitting and repeated merging are proportional to L; the buddy address follows from start XOR size without scanning. Internal fragmentation is blockSize − requestSize.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '整块内存作为根', en: 'The whole capacity is the root' },
      explanation: {
        zh: '容量 capacity = 2^L，根块从地址 0 开始、大小为 capacity、等级为 L。初始时它唯一且空闲。',
        en: 'Capacity is 2^L. The root block starts at 0, has size capacity and level L. It is the only block and it is free.',
      },
      tip: { zh: '先校验容量是 2 的幂；否则不能构成完整的伙伴树。', en: 'Check that capacity is a power of two; otherwise the buddy tree is not complete.' },
    },
    {
      stepId: 'locate',
      title: { zh: '把请求向上取整到等级', en: 'Round the request up to a level' },
      explanation: {
        zh: '请求大小 size 取最小的 2^k ≥ size，目标等级 targetLevel = k。算法从目标等级开始向上寻找空闲块；若该等级没有，就继续向更大的等级找。',
        en: 'Choose the smallest 2^k ≥ size as the target level k. Search for a free block at that level; if none exists, continue upward to larger levels.',
      },
      tip: { zh: '这里的向上取整会制造内部碎片，但不会制造外部碎片。', en: 'Rounding up creates internal fragmentation, not external fragmentation.' },
    },
    {
      stepId: 'found',
      title: { zh: '找到最小的可用块', en: 'Find the smallest adequate block' },
      explanation: {
        zh: '从目标等级向上遇到的第一个空闲块就是可用的最小块。它可能比目标等级大，因此接下来要逐层分裂。',
        en: 'The first free block encountered from the target level upward is the smallest adequate one. It may be larger than the target, so it will be split repeatedly.',
      },
      tip: { zh: '找到的是“可用的最小块”，不一定是全局最小的空闲块。', en: 'It is the smallest adequate block, not necessarily the globally smallest free block.' },
    },
    {
      stepId: 'split',
      title: { zh: '平分为两个伙伴', en: 'Halve into two buddies' },
      explanation: {
        zh: '等级 k 的块从中间平分成两个等级 k−1 的块：左伙伴起始地址不变，右伙伴起始地址为 start + size/2。两者大小相同、地址相邻，并且互为伙伴。',
        en: 'A level-k block is halved into two level-(k−1) blocks: the left buddy keeps the start address, the right buddy starts at start + size/2. They have equal size, are adjacent, and are true buddies.',
      },
      tip: { zh: '每分裂一次，空闲块数增加 1；树多一层。', en: 'Each split adds one free block and one tree level.' },
    },
    {
      stepId: 'allocate',
      title: { zh: '分配目标等级块', en: 'Allocate the target block' },
      explanation: {
        zh: '分裂到目标等级后，取其中一个块标记为已分配并写入块 ID。实际块大小为 2^targetLevel；它通常大于请求量，差额就是内部碎片。',
        en: 'After splitting down to the target level, one block becomes allocated and receives the ID. Its actual size is 2^targetLevel, usually larger than the request; the difference is internal fragmentation.',
      },
      tip: { zh: '内部碎片 = 实际块大小 − 请求大小，本课程按块计算。', en: 'Internal fragmentation = actual block size − request size, per allocated block.' },
    },
    {
      stepId: 'release',
      title: { zh: '释放块并求伙伴地址', en: 'Release and compute the buddy' },
      explanation: {
        zh: '释放只接受仍已分配的目标块。把它标记为空闲后，用 buddyStart = start XOR size 计算同等级伙伴的起始地址。XOR 会翻转决定“左/右半边”的那一位。',
        en: 'Release accepts only an allocated target block. Mark it free, then compute the same-level buddy start as start XOR size. XOR flips the bit that decides which half of the parent the block occupies.',
      },
      tip: { zh: '地址相邻且大小相同，仍不一定满足 start XOR size 的伙伴关系。', en: 'Adjacent equal-sized blocks still may not satisfy start XOR size.' },
    },
    {
      stepId: 'buddy-check',
      title: { zh: '检查伙伴是否存在且空闲', en: 'Check that the buddy exists and is free' },
      explanation: {
        zh: '伙伴必须在容量范围内、与当前块同等级、地址为 start XOR size，而且状态为空闲。任一条不满足都不能合并。若伙伴已被分配，两块保持分离。',
        en: 'The buddy must lie inside capacity, share the current level, sit at start XOR size and be free. If any condition fails, no merge happens; an allocated buddy keeps the two blocks separate.',
      },
      tip: { zh: '这一步专门破除“相邻就能合并”的错误直觉。', en: 'This step is where the false intuition “adjacent means mergeable” is corrected.' },
    },
    {
      stepId: 'merge',
      title: { zh: '与伙伴合并并继续向上', en: 'Merge with the buddy and continue upward' },
      explanation: {
        zh: '把两个同等级伙伴并成一个等级加一的块，起始地址取较小者，大小为二者之和。合并后的块可能又和新伙伴成对，于是继续检查并逐级向上合并。',
        en: 'Two same-level buddies become one block at the next level: the smaller start, the sum of sizes. The merged block may pair with a new buddy, so checking and merging continue upward.',
      },
      tip: { zh: '分配失败不能破坏原有内存；合并失败也不能强行拼接。', en: 'A failed allocation must not damage memory; a failed merge must not force a join.' },
    },
    {
      stepId: 'fail',
      title: { zh: '没有足够大的空闲块', en: 'No adequate free block' },
      explanation: {
        zh: '如果从目标等级一直找到根都没有空闲块，说明现有空闲块都太小或不存在。申请失败，所有块保持原状。',
        en: 'If no free block exists from the target level all the way to the root, every existing free block is too small or none exists. The request fails and all blocks stay unchanged.',
      },
      tip: { zh: '失败不是“内存总量为零”，而是没有满足等级的连续伙伴块。', en: 'Failure does not mean zero total memory, only that no free block at an adequate level exists.' },
    },
    {
      stepId: 'done',
      title: { zh: '操作序列完成', en: 'Operation sequence complete' },
      explanation: {
        zh: '序列结束后，内存带按地址展示当前块，伙伴树只保留当前叶子以及必要的分裂路径。可对照每个块的起始地址、大小和等级，检查对齐与伙伴关系。',
        en: 'After the sequence, the band shows current blocks by address and the tree keeps current leaves plus the split path. Check every block’s start, size and level for alignment and buddy relations.',
      },
      tip: { zh: '树的叶子就是当前块，内部节点是曾经分裂、现在已合并掉的块。', en: 'Tree leaves are current blocks; internal nodes are blocks that were split and have since merged.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把“相邻的两个空闲块”直接合并，没有检查 start XOR size。',
      '申请大小没有向上取整到 2 的幂，导致块等级错误。',
      '分裂位置算错，右伙伴起始地址写成 start + size 而不是 start + size/2。',
      '释放后被已分配的伙伴挡住，却仍然继续向上合并。',
      '容量不是 2 的幂却强行建树。',
      '把内部碎片和外部碎片混为一谈。',
    ],
    en: [
      'Merging two adjacent free blocks without checking start XOR size.',
      'Failing to round the request up to a power of two, giving the wrong level.',
      'Splitting at the wrong position, using start + size instead of start + size/2 for the right buddy.',
      'Continuing upward after release even though an allocated buddy blocks the merge.',
      'Building the tree with a capacity that is not a power of two.',
      'Confusing internal fragmentation with external fragmentation.',
    ],
  },
};

export const garbageCollectionLesson: Lesson = {
  lessonId: 'garbage-collection-trace',
  algorithmId: 'garbage-collection',
  contentVersion: '1.0.0',
  title: { zh: '无用单元收集：标记—清除与存储紧缩', en: 'Garbage collection: Mark-Sweep and compaction' },
  oneLiner: {
    zh: '从根集合出发标记可达对象，清除不可达对象；切换模式后，再把存活对象前移并改写全部引用。',
    en: 'Mark reachable objects from the root set and sweep the rest; switch modes to move survivors left and rewrite every reference.',
  },
  overview: {
    zh: '对象图描述对象之间的引用，根集合是遍历起点。标记阶段沿引用访问可达对象，已访问集合防止环形引用无限循环；清除阶段扫描全部已分配对象，回收未标记对象。存储紧缩是另一种模式：先回收垃圾，再按地址顺序前移存活对象，并记录旧地址、新地址和受影响引用。',
    en: 'The object graph describes references and the root set is the traversal start. Marking follows references and a visited set prevents infinite cycles; sweeping scans all allocated objects and reclaims the unmarked. Compaction is another mode: reclaim garbage, move live objects left in address order, and record old addresses, new addresses and affected references.',
  },
  intuition: {
    zh: '把对象想成房间，引用是门。从根房间出发能走到的房间都“还有人用”；走不到的房间即使彼此之间门门相通，也只是锁死的空房。清除就是把空房腾出来；紧缩则是把仍有人的房间全部搬到一起，让空房连成一大片，同时把所有门牌地址改好。',
    en: 'Treat objects as rooms and references as doors. Rooms reachable from a root are still in use; unreachable rooms are vacant even if they have doors between themselves. Sweeping empties those rooms; compaction moves occupied rooms together so the vacant space becomes one region, rewriting every door address.',
  },
  prerequisites: {
    zh: ['理解有向图与可达性', '知道根集合与引用关系', '理解队列或栈的遍历', '知道地址与对象大小的区别'],
    en: ['Understand directed graphs and reachability', 'Know root sets and references', 'Understand queue or stack traversal', 'Know the difference between an address and an object size'],
  },
  complexity: {
    time: 'O(N+E) mark; O(N) sweep; +copy',
    space: 'O(N + E)',
    note: {
      zh: 'N 为对象数，E 为引用数。标记只访问从根可达的对象及其出边；清除仍要扫描全部已分配对象。紧缩还要计算新地址、复制存活字节并遍历引用改写目标地址。不能用统一的 O(n) 概括这些阶段。',
      en: 'N is the object count and E the reference count. Marking visits only objects reachable from roots and their outgoing edges; sweeping still scans every allocated object. Compaction also computes addresses, copies live bytes and walks references to rewrite targets. No single O(n) covers all phases.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '建立对象图与根集合', en: 'Build the object graph and roots' },
      explanation: {
        zh: '每个对象有唯一 ID、大小和当前地址；引用只记录 fromId 和 toId，地址由程序分配。根集合可以有多个成员。此时所有对象都处于已分配状态。',
        en: 'Each object has a unique ID, size and current address; references record only fromId and toId, while addresses are assigned by the program. The root set may contain several members. Every object starts allocated.',
      },
      tip: { zh: '地址不是用户输入，避免测试时把旧地址写进引用。', en: 'Addresses are not user input, so tests cannot accidentally store stale addresses.' },
    },
    {
      stepId: 'root',
      title: { zh: '根引用入栈', en: 'Push root references' },
      explanation: {
        zh: '把根集合中的每个对象放入待访问集合。若根已经标记或已在集合中，就跳过重复入栈。根是“程序仍然能直接找到”的入口。',
        en: 'Put every root object into the pending set. If a root is already marked or queued, skip the duplicate push. Roots are the entries the program can still reach directly.',
      },
      tip: { zh: '根对象本身一定可达，不需要先看入边。', en: 'A root is reachable by definition; no in-edge is required.' },
    },
    {
      stepId: 'visit',
      title: { zh: '访问并标记当前对象', en: 'Visit and mark the current object' },
      explanation: {
        zh: '从待访问集合取出一个对象，若尚未标记就标记它，并准备检查它的出边。标记集合就是“确认可达”的集合。',
        en: 'Take an object from the pending set. If it is unmarked, mark it and prepare to inspect its outgoing edges. The marked set is exactly the confirmed-reachable set.',
      },
      tip: { zh: '标记发生在访问时，入栈本身不等于已标记。', en: 'Marking happens on visit; being queued is not the same as being marked.' },
    },
    {
      stepId: 'follow',
      title: { zh: '沿引用发现新对象', en: 'Follow a reference to a new object' },
      explanation: {
        zh: '对当前对象的每条引用，如果目标未标记且不在待访问集合，就把它加入集合。这样从根可达的所有对象都会最终被访问。',
        en: 'For each reference of the current object, enqueue the target if it is neither marked nor already pending. Every object reachable from a root will eventually be visited.',
      },
      tip: { zh: '引用方向很重要：只沿出边前进，不能逆着箭头走。', en: 'Direction matters: follow outgoing edges only, never walk backwards.' },
    },
    {
      stepId: 'skip',
      title: { zh: '跳过已访问对象', en: 'Skip an already visited object' },
      explanation: {
        zh: '若目标已标记或已在集合中，就不重复处理。环形引用 A→B→A 会在第二次遇到 A 时停止，因此遍历一定终止。',
        en: 'If the target is already marked or pending, do not process it again. A cycle A→B→A stops when A is seen the second time, so traversal terminates.',
      },
      tip: { zh: '没有 visited 集合时，环形引用会导致无限循环。', en: 'Without a visited set, a cyclic reference would loop forever.' },
    },
    {
      stepId: 'marked',
      title: { zh: '标记阶段结束', en: 'Marking completes' },
      explanation: {
        zh: '待访问集合为空时，所有从根可达的对象都已标记。未标记的已分配对象就是垃圾，无论它们之间是否互相引用。',
        en: 'When the pending set is empty, every object reachable from a root is marked. Unmarked allocated objects are garbage, regardless of references among themselves.',
      },
      tip: { zh: '判断垃圾看“从根是否可达”，而不是“有没有入边”。', en: 'Garbage is decided by reachability from roots, not by having an in-edge.' },
    },
    {
      stepId: 'sweep',
      title: { zh: '扫描全部已分配对象', en: 'Sweep all allocated objects' },
      explanation: {
        zh: '清除阶段按地址顺序检查每个对象。已标记的保留；未标记的转为空闲。即使一个垃圾对象被另一个垃圾对象引用，也仍然会被回收。',
        en: 'Sweeping checks every object in address order. Marked objects stay; unmarked objects become free. A garbage object referenced by another garbage object is still reclaimed.',
      },
      tip: { zh: '清除必须扫描全部已分配对象，不能只扫描未标记集合。', en: 'Sweep must scan all allocated objects, not only the unmarked set.' },
    },
    {
      stepId: 'free',
      title: { zh: '回收一个不可达对象', en: 'Reclaim one unreachable object' },
      explanation: {
        zh: '把该对象标记为 free，其地址区间进入空闲区。清除后可能出现多个分散空洞，因为存活对象仍夹在中间。',
        en: 'Mark the object free; its address interval becomes free space. Several scattered holes may appear because live objects still sit between them.',
      },
      tip: { zh: '标记—清除只回收对象，不自动移动存活对象。', en: 'Mark-Sweep reclaims objects; it does not automatically move survivors.' },
    },
    {
      stepId: 'select',
      title: { zh: '紧缩模式：选择一个存活对象', en: 'Compaction: select a live object' },
      explanation: {
        zh: '切换到紧缩模式后，按地址从低到高处理存活对象。对每个对象计算新地址：它应放在当前“下一个可放置位置” next。',
        en: 'In compaction mode, process live objects from low to high address. For each object compute its new address: the current next-free position.',
      },
      tip: { zh: '已位于 next 的对象不需要移动，但地址映射仍要记录。', en: 'An object already at next need not move, but its address mapping is still recorded.' },
    },
    {
      stepId: 'move',
      title: { zh: '移动对象到新地址', en: 'Move the object to its new address' },
      explanation: {
        zh: '把对象内容复制到新地址，更新对象的 start，并记录 from/to。对象按原顺序前移，因此空洞被逐个填掉；移动后空洞位置可能变化，旧地址失效。',
        en: 'Copy the object to its new address, update its start, and record from/to. Objects move in their original order, filling holes one by one; hole positions may change and old addresses become stale.',
      },
      tip: { zh: '移动顺序必须稳定；同一输入应得到同一组新地址。', en: 'The move order must be stable; the same input should yield the same new addresses.' },
    },
    {
      stepId: 'update',
      title: { zh: '改写指向被移动对象的引用', en: 'Rewrite references to moved objects' },
      explanation: {
        zh: '遍历所有引用，若目标对象被移动，就把引用的 toStart 改为新地址。根引用也不例外。所有旧地址必须从有效引用中消失，否则后续访问会读到错误位置。',
        en: 'Walk every reference. If its target moved, rewrite toStart to the new address. Roots are no exception. Every stale address must disappear from valid references, or later accesses read the wrong location.',
      },
      tip: { zh: '只移动对象不改引用，是最危险的“半紧缩”状态。', en: 'Moving objects without rewriting references is the dangerous half-compacted state.' },
    },
    {
      stepId: 'done',
      title: { zh: '序列完成', en: 'Sequence complete' },
      explanation: {
        zh: 'Mark-Sweep 结束时给出存活对象、分散空闲区和引用关系；Compaction 结束时存活对象集中在前部，尾部是一整块连续空闲区，所有引用显示新地址。',
        en: 'At the end of Mark-Sweep the frame shows live objects, scattered free spans and references; at the end of compaction survivors are packed at the front, one contiguous free run remains, and every reference shows its new address.',
      },
      tip: { zh: '并排看两种模式的最终空闲形态，区分“回收”与“整理”。', en: 'Compare final free shapes across modes to separate reclamation from reorganization.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把“有入边”当成“可达”，于是漏掉环形垃圾。',
      '标记时没有 visited 集合，环形引用导致无限循环。',
      '只从第一个根开始遍历，漏掉其它根可达的对象。',
      '紧缩时只移动对象，不更新引用地址。',
      '把标记—清除描述成自动完成紧缩。',
      '把存活对象之间的空洞当成已分配空间，导致空闲区计算错误。',
    ],
    en: [
      'Treating “has an in-edge” as reachable and missing cyclic garbage.',
      'Marking without a visited set, so a cycle loops forever.',
      'Starting from only the first root and missing objects reachable from other roots.',
      'Moving objects during compaction without updating reference addresses.',
      'Describing Mark-Sweep as automatically compacting.',
      'Counting holes between live objects as allocated space, corrupting the free-span calculation.',
    ],
  },
};

export const MEMORY_LESSONS: readonly Lesson[] = [
  freeListLesson,
  buddySystemLesson,
  garbageCollectionLesson,
];
