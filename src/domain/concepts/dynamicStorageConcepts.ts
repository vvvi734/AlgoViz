import type { ConceptPage } from './types';

/**
 * TEXTBOOK-08 — three static foundations for dynamic storage management.
 *
 * The overview page distinguishes internal from external fragmentation and
 * connects allocation, release and compaction. The boundary-tag page explains
 * the book's head/tail fields and the four merge cases; its dynamic half lives
 * inside the free-list course. The compaction page explains moving live
 * objects and rewriting references; its dynamic half is the compaction mode of
 * the garbage-collection course.
 */
export const DYNAMIC_STORAGE_CONCEPT_PAGES: readonly ConceptPage[] = [
  {
    id: 'dynamic-storage-overview',
    topicId: 'dynamic-storage-overview',
    title: ['动态存储管理的基本概念', 'Fundamentals of dynamic storage management'],
    chapter: ['第 8 章 · 动态存储管理', 'Chapter 8 · Dynamic storage management'],
    summary: [
      '程序在运行期间按需申请和释放大小不定的存储块。系统维护一条内存地址带和一张可利用空间表，并在回收时尽量把相邻空闲块合并。',
      'A running program requests and releases variable-sized memory blocks. The system maintains a memory address band and a free-space list, and coalesces adjacent free blocks during release whenever possible.',
    ],
    diagram: 'dynamic-storage',
    definitions: [
      {
        term: ['动态申请与释放', 'Dynamic allocation and release'],
        text: [
          '申请发生在程序运行中，大小由当时的请求决定；释放把不再使用的已分配块交还系统。两者都改变可利用空间表。',
          'A request happens at run time with a size chosen then; a release returns an allocated block that is no longer used. Both change the free-space list.',
        ],
      },
      {
        term: ['已分配块与空闲块', 'Allocated and free blocks'],
        text: [
          '已分配块由某个申请者持有，不能再被别的要求使用；空闲块当前没有拥有者，可以参与下一次分配。块用起始地址和大小描述，地址区间取半开区间 [start, start + size)。',
          'An allocated block is owned by a request and cannot be reused; a free block has no owner and can satisfy a later request. A block is described by its start address and size, using the half-open interval [start, start + size).',
        ],
      },
      {
        term: ['可利用空间表', 'Free-space list (available-space list)'],
        text: [
          '记录所有空闲块的表。表项至少保存起始地址和大小；采用边界标识时还可保存状态和块头/块尾信息。表可以按地址有序，也可以按大小或其它规则组织。',
          'A table of every free block. An entry stores at least its start and size; with boundary tags it can also carry state and head/tail fields. Entries may be ordered by address, by size, or by another policy.',
        ],
      },
      {
        term: ['连续空间分配', 'Contiguous allocation'],
        text: [
          '一次申请必须得到一个地址连续、长度不小于请求量的空闲块。分配程序从可利用空间表中选块；若块比请求大，就把它分裂成“已分配部分 + 剩余空闲部分”。',
          'A request must receive one contiguous free block at least as large as the request. The allocator selects an entry; if the block is larger, it splits it into an allocated part and a remaining free part.',
        ],
      },
      {
        term: ['内部碎片', 'Internal fragmentation'],
        text: [
          '已分配块内部未被使用、但已经不能直接供其他申请利用的空间。它来自“分配粒度大于实际请求”，例如伙伴系统把 6B 请求取整到 8B 块，多出的 2B 就是内部碎片。',
          'Unused space inside an allocated block that cannot directly serve another request. It comes from allocating a coarser unit than requested: the buddy system rounds a 6B request to an 8B block, leaving 2B internal fragmentation.',
        ],
      },
      {
        term: ['外部碎片', 'External fragmentation'],
        text: [
          '多个分散的空闲区域同时存在，总空闲容量可能足够，却没有任何一个连续区域满足请求。它来自分配与释放的历史顺序，而不是某个块内部浪费。',
          'Several separate free regions coexist: total free capacity may be enough, but no single contiguous region satisfies the request. It comes from the history of allocations and releases, not from waste inside one block.',
        ],
      },
      {
        term: ['分裂与合并', 'Splitting and coalescing'],
        text: [
          '分裂发生在分配：大空闲块被切成所需大小和剩余空闲块。合并发生在释放：若释放块的左邻或右邻空闲，就把它们并成一个更大的空闲块，减少外部碎片。',
          'Splitting happens on allocation: a large free block becomes the requested part plus a remainder. Coalescing happens on release: if the left or right neighbour is free, merge them into a larger free block, reducing external fragmentation.',
        ],
      },
      {
        term: ['垃圾与可达对象', 'Garbage and reachable objects'],
        text: [
          '从根集合（栈、全局变量等）出发，沿引用关系能够到达的对象是可达对象；始终不可达的已分配对象是垃圾。判断垃圾看的是“从根是否可达”，而不是“是否还有入边”。',
          'Starting from roots (stack slots, globals, and so on), objects reachable by following references are live. Allocated objects that never become reachable are garbage. The test is reachability from roots, not whether some in-edge exists.',
        ],
      },
    ],
    sections: [
      {
        title: ['一条地址带，两种视角', 'One address band, two views'],
        body: [
          '把模拟内存想成一条从 0 到 capacity 的地址带。已分配块和空闲块首尾相接、互不重叠地铺满整条带。学生应同时读两个视角：地址带回答“空间在哪里”，可利用空间表回答“哪些块现在可以分配”。两者必须由同一次真实分配/释放操作同步更新。',
          'Think of simulated memory as an address band from 0 to capacity. Allocated and free blocks tile the whole band without gaps or overlaps. Read two views together: the band answers where space is, and the free-space list answers which blocks can be allocated now. Both must be updated by the same real allocation or release.',
        ],
        points: [
          ['半开区间 [start, start + size) 让相邻判断变简单：左块结束地址等于右块起始地址。', 'The half-open interval [start, start + size) makes adjacency simple: the left block’s end address equals the right block’s start.'],
          ['地址带中的每一字节恰好属于一个块；容量必须被块无缝覆盖。', 'Every byte belongs to exactly one block; the blocks must tile the capacity without gaps.'],
          ['空闲表不是另一份独立数据，它必须与地址带中的空闲块完全一致。', 'The free list is not independent data; it must agree exactly with the free blocks in the band.'],
        ],
      },
      {
        title: ['为什么分配策略不止一种', 'Why more than one allocation policy exists'],
        body: [
          '首次适应按地址顺序选第一个足够大的空闲块，速度快，低地址容易留下碎片；最佳适应选“装下请求后剩余最小”的块，试图保留大块，但需要扫描更多表项，且容易产生很小的、难以再利用的剩余块。两者都只做连续分配，不允许为了成功而搬动已分配块。',
          'First Fit takes the first adequate block in address order. It is fast but tends to fragment low addresses. Best Fit takes the block that leaves the smallest remainder, trying to preserve large blocks, but it may scan more entries and create tiny remainders that are hard to reuse. Both allocate only contiguous space and never move an allocated block to make a request succeed.',
        ],
        points: [
          ['选择规则不同，不代表底层内存模型不同；同一门课程可以切换策略。', 'A different selection rule does not require a different memory model; one course can switch policies.'],
          ['平局必须有稳定规则。例如最佳适应在剩余空间相同时选择更早的地址。', 'Ties need a stable rule. For example, Best Fit chooses the earlier address when remainders are equal.'],
          ['策略只改变“选哪块”，不改变区间合法性、分裂和释放合并的规则。', 'The policy changes only which block is selected; interval validity, splitting and release merging stay the same.'],
        ],
      },
      {
        title: ['内部碎片与外部碎片的区别', 'Internal versus external fragmentation'],
        body: [
          '内部碎片在“块内”：块已经被分配出去，多余的字节仍属于这个块，其他申请无法使用。外部碎片在“块间”：空闲字节仍然属于系统，但被已分配块隔开，凑不出一个足够大的连续区间。下图上半部分用斜纹标出 A 块内多出的 2B；下半部分有三个 4B 空洞，总空闲 12B，却无法满足 8B 请求。',
          'Internal fragmentation is inside a block: the block is already allocated, so its extra bytes belong to that owner and cannot serve another request. External fragmentation is between blocks: free bytes still belong to the system, but allocated blocks separate them into runs too small for the request. In the diagram, hatching marks the extra 2B inside block A; the lower band has three 4B holes, totaling 12B, yet an 8B request still fails.',
        ],
        points: [
          ['内部碎片由分配粒度造成；外部碎片由分散的空闲区造成。', 'Internal fragmentation comes from allocation granularity; external fragmentation from scattered free runs.'],
          ['合并只能减少外部碎片，不能消除已分配块内部的浪费。', 'Coalescing reduces external fragmentation; it cannot remove waste inside an allocated block.'],
          ['紧缩可以消除外部碎片，但必须移动存活对象并更新所有地址/引用。', 'Compaction can remove external fragmentation, but it must move live objects and update every address or reference.'],
        ],
      },
      {
        title: ['分配、回收与整理的关系', 'Allocation, release and reorganization'],
        body: [
          '分配从空闲表取块并可能分裂；回收把块还给空闲表并可能合并；整理（紧缩）则在垃圾清除后，把仍然存活的对象移动到连续区域，从整体上消除空洞。三者是不同阶段，不是同一个操作的三种叫法。标记—清除本身只回收不可达对象，并不自动移动存活对象；存储紧缩是另一种策略或后续阶段。',
          'Allocation takes a block from the free list and may split it. Release returns a block and may coalesce it. Reorganization (compaction) moves surviving objects into a contiguous region after garbage is cleared, removing holes globally. These are separate phases, not three names for one operation. Mark-Sweep reclaims unreachable objects but does not automatically move survivors; compaction is a different policy or a later phase.',
        ],
        points: [
          ['一次释放后“没有合并”不等于算法错误：左右邻都可能已被占用。', 'A release that does not merge is not necessarily wrong: both neighbours may be allocated.'],
          ['紧缩前必须先确定哪些对象存活；移动垃圾没有意义。', 'Compaction must first know which objects are live; moving garbage is pointless.'],
          ['紧缩后旧地址立即失效，任何仍保存旧地址的引用都必须改写。', 'After compaction, old addresses are stale; every reference that still stores one must be rewritten.'],
        ],
      },
      {
        title: ['代价从哪里来', 'Where the costs come from'],
        body: [
          '讨论复杂度必须先说清分析变量：空闲块数 F、操作序列长度 M、伙伴树深度 L = log₂(capacity)、对象数 N、引用数 E。首次适应最坏要扫描整张空闲表，最佳适应通常也要扫描；若表按地址有序，合并邻块可以直接按地址找到邻居，而不必再全表搜索。伙伴系统定位和逐级分裂/合并都与 L 成正比，但伙伴地址可由 start XOR size 直接算出。',
          'State the variables first: number of free blocks F, operation count M, buddy depth L = log₂(capacity), object count N and reference count E. First Fit may scan the whole free list in the worst case, and Best Fit usually scans it too. With an address-ordered list, neighbours can be found by address instead of another full scan. Buddy location, splitting and merging are proportional to L, while the buddy address follows directly from start XOR size.',
        ],
        points: [
          ['标记阶段沿引用遍历，代价与可达对象和引用数有关；清除阶段还要扫描全部已分配对象。', 'Marking follows references, so its cost depends on reachable objects and edges; sweeping still scans every allocated object.'],
          ['紧缩需要移动存活对象并改写指向它们的引用，代价与存活字节和引用数有关。', 'Compaction moves live bytes and rewrites references that point at moved objects; its cost depends on both.'],
          ['不存在对所有动态存储算法统一的 O(1) 或 O(n) 结论。', 'There is no single O(1) or O(n) bound that covers every dynamic-storage algorithm.'],
        ],
      },
    ],
    comparison: {
      title: ['内部碎片与外部碎片', 'Internal versus external fragmentation'],
      columns: [['比较项', 'Aspect'], ['内部碎片', 'Internal'], ['外部碎片', 'External']],
      rows: [
        [
          ['位置', 'Where'],
          ['已分配块内部', 'Inside an allocated block'],
          ['已分配块之间', 'Between allocated blocks'],
        ],
        [
          ['成因', 'Cause'],
          ['分配粒度大于请求', 'Allocation unit larger than request'],
          ['空闲区被分割、分散', 'Free space split into separate runs'],
        ],
        [
          ['总空闲可能足够吗', 'Can total free be enough?'],
          ['该块内部本来就不能用', 'The bytes are unavailable inside that block'],
          ['可能足够，但没有足够大的连续块', 'Yes, yet no contiguous run is large enough'],
        ],
        [
          ['能否靠合并解决', 'Can coalescing fix it?'],
          ['不能', 'No'],
          ['能减少，不能保证消除', 'It reduces it but cannot guarantee removal'],
        ],
        [
          ['典型对策', 'Typical remedy'],
          ['减小分配粒度或按等级取整', 'Smaller allocation unit or level rounding'],
          ['相邻合并、紧缩、改变分配策略', 'Coalescing, compaction, another policy'],
        ],
      ],
    },
    takeaway: [
      '先分清“块内浪费”和“块间分散”：前者是内部碎片，后者是外部碎片。合并只处理后者，紧缩则通过移动存活对象来整体消除空洞，并强制更新地址。',
      'Separate waste inside a block from scatter between blocks: the first is internal fragmentation, the second external. Coalescing addresses only the second; compaction removes holes by moving survivors and therefore must rewrite addresses.',
    ],
  },
  {
    id: 'boundary-tag-method',
    topicId: 'boundary-tag',
    title: ['边界标识法与相邻块合并', 'Boundary tags and neighbour coalescing'],
    chapter: ['第 8 章 · 动态存储管理', 'Chapter 8 · Dynamic storage management'],
    summary: [
      '在每个块的头部和尾部各保存一份大小与状态，释放时就能在 O(1) 内找到左右邻块，并按四种邻接情形决定如何合并。',
      'Store size and state at both the head and the tail of every block. On release, both neighbours can be found in O(1), and one of four adjacency cases decides the merge.',
    ],
    diagram: 'boundary-tag-method',
    definitions: [
      {
        term: ['块头与块尾标识', 'Head and tail tags'],
        text: [
          '块头位于块的低地址端，保存块大小、空闲/占用状态以及链接信息；块尾位于块的高地址端，至少重复保存大小和状态。两份标识互为镜像，使相邻块可以从任一方向读取边界信息。',
          'The head sits at the low-address end and stores size, free/allocated state and possibly links; the tail sits at the high-address end and repeats at least size and state. The two tags mirror each other, so a neighbour can read boundary information from either direction.',
        ],
      },
      {
        term: ['边界标识法', 'Boundary-tag method'],
        text: [
          '利用块头/块尾中的大小与状态字段，在常量时间内定位物理相邻块，并据此合并空闲块的存储管理方法。它解决的是“如何发现邻居”，不规定用首次适应还是最佳适应选块。',
          'A storage-management method that uses size and state in head/tail tags to locate physical neighbours in constant time and coalesce free blocks. It answers “how to find neighbours”; it does not prescribe First Fit or Best Fit.',
        ],
      },
      {
        term: ['物理相邻', 'Physical adjacency'],
        text: [
          '两个块在地址带上首尾相接：左块满足 left.start + left.size == right.start。物理相邻与“在空闲表中相邻”不是一回事；表中相邻的项在内存里可能隔得很远。',
          'Two blocks touch on the address band: left.start + left.size == right.start. Physical adjacency is not the same as adjacency in the free list; neighbouring list entries may be far apart in memory.',
        ],
      },
    ],
    sections: [
      {
        title: ['字段怎样配合', 'How the fields cooperate'],
        body: [
          '设释放块 X 的起始地址为 p、大小为 s。左邻块若存在，它的尾标识就在 p-1 处；读这个尾标识即可得到左块大小与状态。右邻块若存在，它的头标识就在 p+s 处；读这个头标识即可得到右块大小与状态。因为每个块都保存自己的大小，定位邻居不需要遍历整张空闲表。',
          'Let the released block X start at p with size s. If a left neighbour exists, its tail tag is at p-1; reading it gives the left size and state. If a right neighbour exists, its head tag is at p+s; reading it gives the right size and state. Because every block stores its own size, locating neighbours needs no full free-list scan.',
        ],
        points: [
          ['左邻起始地址 = p - 左块大小；右邻起始地址 = p + s。', 'Left start = p − left size; right start = p + s.'],
          ['边界标识保存的是“大小 + 状态”，不是裸指针；地址仍由起始位置和大小推出。', 'A boundary tag stores size + state, not a raw pointer; addresses still follow from the start and size.'],
          ['块尾标识必须与块头一致；合并后两份标识都要改写。', 'The tail tag must agree with the head; after a merge both tags must be rewritten.'],
        ],
      },
      {
        title: ['释放时的四种情形', 'The four release cases'],
        body: [
          '设 X 已被标记为空闲。左右都占用时，X 成为独立空闲块，只插入空闲表；左邻空闲时，把左块与 X 并成一块，大小相加，并更新合并块的尾标识；右邻空闲时，把 X 与右块并成一块，更新合并块的头标识；左右都空闲时，三块并成一块，删除左、右两个旧表项，只保留一个合并项。',
          'Mark X free first. If both neighbours are allocated, X becomes an independent free entry. If the left is free, merge it with X, add the sizes and update the merged tail tag. If the right is free, merge X with it and update the merged head tag. If both are free, merge all three, remove the two old entries and keep one merged entry.',
        ],
        points: [
          ['左右都空闲时必须先处理一侧再处理另一侧，不能重复把 X 当成两个不同的块。', 'With both neighbours free, merge one side and then the other; never treat X as two different blocks.'],
          ['合并后空闲表项数减少：左或右单侧合并减 1，双侧合并减 2。', 'Merging reduces the free-list size by one for a single side and by two for both sides.'],
          ['合并块的起始地址取三者最小，大小取三者之和。', 'The merged block starts at the minimum start and its size is the sum.'],
        ],
      },
      {
        title: ['为什么能减少外部碎片', 'Why this reduces external fragmentation'],
        body: [
          '相邻空闲块如果一直不合并，地址带会出现许多小空洞；每个空洞单独都太小，但总量可能足够。边界标识让“释放时立刻发现邻居”成为常数操作，于是相邻空洞会尽快合成大块。它不能消除内部碎片，也不能保证总能找到足够大的连续块——若空闲区被已分配块隔开，仍可能失败。',
          'Without coalescing, adjacent free blocks remain many small holes: each is too small alone although their total may be enough. Boundary tags make neighbour discovery constant-time on release, so adjacent holes become larger blocks promptly. They cannot remove internal fragmentation and cannot guarantee a large enough run: allocated blocks may still separate free regions.',
        ],
        points: [
          ['合并的收益是“把连续空闲重新拼起来”，不是“把空闲总量变大”。', 'Coalescing rebuilds contiguous free runs; it does not increase total free bytes.'],
          ['若左右都占用，释放只增加一个空闲项，外部碎片可能仍存在。', 'If both neighbours are allocated, release adds one isolated free entry and external fragmentation may remain.'],
          ['边界标识与选块策略正交：可与首次适应、最佳适应等组合。', 'Boundary tags are orthogonal to the selection policy and combine with First Fit, Best Fit and others.'],
        ],
      },
      {
        title: ['代价与边界条件', 'Cost and boundary conditions'],
        body: [
          '每个块要额外保存两份标识，空间开销与块数成正比。释放时定位左右邻居是常数时间，但更新空闲表仍有表操作代价：若用有序表，插入/删除要 O(F)；若用分离的空闲链表，可把表操作降到常数时间，但选块策略会受影响。地址带两端的块没有左邻或右邻，必须用哨兵或边界检查避免越界读取。',
          'Every block pays for two tags, so overhead grows with the number of blocks. Neighbour location on release is constant time, but free-list maintenance still costs: an ordered table needs O(F) insertion/deletion; segregated free lists can make list operations constant but constrain selection. Blocks at either end have no left or right neighbour, so sentinels or boundary checks must prevent out-of-range reads.',
        ],
        points: [
          ['块大小必须至少能容纳头部和尾部标识。', 'A block must be large enough to hold both its head and tail tags.'],
          ['读取 p-1 或 p+s 之前先校验地址落在 [0, capacity) 内。', 'Validate that p−1 and p+s lie inside [0, capacity) before reading.'],
          ['双向合并后，只有合并块的头部和尾部需要重写，被吞并块的旧标识不再有效。', 'After a two-sided merge only the merged block’s head and tail are rewritten; the swallowed tags are stale.'],
        ],
      },
    ],
    takeaway: [
      '边界标识的关键不是“把相邻块涂成同一种颜色”，而是用块尾/块头字段真正找到邻居、读出大小和状态、再改写合并后的两份边界。四种情形必须分别落到真实算法分支。',
      'The point of boundary tags is not colouring neighbours alike, but using tail/head fields to find them, read size and state, and rewrite both tags after the merge. The four cases must be real algorithm branches.',
    ],
  },
  {
    id: 'storage-compaction',
    topicId: 'storage-compaction',
    title: ['存储紧缩与引用更新', 'Storage compaction and reference updates'],
    chapter: ['第 8 章 · 动态存储管理', 'Chapter 8 · Dynamic storage management'],
    summary: [
      '垃圾清除后，存活对象可能被空洞隔开。存储紧缩把存活对象按地址顺序前移，形成一整块连续空闲区，并同步改写所有指向被移动对象的引用。',
      'After garbage collection, live objects may be separated by holes. Compaction moves survivors left in address order, producing one contiguous free region, and rewrites every reference that points at a moved object.',
    ],
    diagram: 'storage-compaction',
    definitions: [
      {
        term: ['存储紧缩', 'Storage compaction'],
        text: [
          '在不改变对象之间逻辑关系的前提下，把存活对象移动到地址带的一端，使它们连续排列，从而把分散的空闲区合并成一块大的连续空闲区。',
          'Without changing the logical relationships among objects, move live objects toward one end of the address band so they occupy a contiguous region and the scattered free space becomes one large free run.',
        ],
      },
      {
        term: ['存活对象', 'Live object'],
        text: [
          '从根集合出发沿引用能够到达的对象。紧缩只移动存活对象；不可达对象应当先被回收，移动它们没有意义。',
          'An object reachable from the root set by following references. Compaction moves only live objects; unreachable objects should be reclaimed first, since moving them is pointless.',
        ],
      },
      {
        term: ['地址映射与引用更新', 'Address mapping and reference update'],
        text: [
          '对象移动后，旧地址失效，新地址生效。所有保存对象地址的引用（指针、句柄或索引）都必须改写为新地址；只移动对象却不改引用，会让程序访问错误内存。',
          'After an object moves, its old address is stale and its new address is valid. Every reference that stores an address (pointer, handle or index) must be rewritten. Moving objects without updating references makes the program access the wrong memory.',
        ],
      },
    ],
    sections: [
      {
        title: ['紧缩发生在什么阶段', 'When compaction happens'],
        body: [
          '标记—清除先标记可达对象，再扫过全部已分配对象，把未标记对象变为空闲。清除后，存活对象之间可能出现多个小空洞。存储紧缩是随后单独的阶段：它遍历存活对象，计算每个对象的新起始地址，再按新地址移动或复制对象。标记—清除并不自动完成紧缩，两者不能混为一个算法。',
          'Mark-Sweep first marks reachable objects, then scans every allocated object and turns unmarked ones into free space. Several small holes may remain between survivors. Compaction is a separate later phase: it visits live objects, computes each new start, then moves or copies them. Mark-Sweep does not automatically compact; the two are not one algorithm.',
        ],
        points: [
          ['标记解决“谁还活着”，紧缩解决“活着的对象放在哪里”。', 'Marking decides who is live; compaction decides where the live objects sit.'],
          ['若只做标记—清除，空闲区可能仍是分散的，外部碎片没有消除。', 'Mark-Sweep alone can leave free space scattered; external fragmentation remains.'],
          ['紧缩前必须已经知道存活集合，否则会把垃圾也搬走。', 'The live set must be known before compaction, or garbage would be moved too.'],
        ],
      },
      {
        title: ['移动顺序与新地址', 'Move order and new addresses'],
        body: [
          '按地址从低到高处理存活对象，维护一个“下一个可放置位置”指针 next。对每个存活对象 obj，新地址 = next；随后 next 增加 obj.size。因为对象按原地址顺序前移，空洞被逐个填掉，所有对象最终落在 [0, liveBytes) 内，[liveBytes, capacity) 成为一整块空闲区。',
          'Process live objects from low address to high, keeping a next-free pointer. For each live object obj, new address = next, then next += obj.size. Because objects move in their original address order, holes are filled one by one; all survivors end in [0, liveBytes) and [liveBytes, capacity) becomes one free run.',
        ],
        points: [
          ['若对象已经位于 next，它不需要移动，但仍要记录地址未变。', 'If an object already sits at next, it need not move, but its unchanged address is still recorded.'],
          ['移动顺序必须稳定，否则同一输入可能产生不同的新地址。', 'The move order must be stable, or the same input could produce different new addresses.'],
          ['移动后源区域可能被覆盖，实现时要先保存对象内容或用临时区。', 'Moving may overwrite a source region; save the object or use a staging area first.'],
        ],
      },
      {
        title: ['引用为什么必须改写', 'Why references must be rewritten'],
        body: [
          '假设 B 从地址 8 移到 6，而 A 的引用字段仍写着 8。后续通过 A 访问 B 时，程序会读到地址 8 处的其它数据，逻辑关系被破坏。因此紧缩必须建立 old→new 映射，并遍历所有引用：若引用的目标被移动，就把目标地址改成新地址。下图把 A→B、B→C、C→D 的目标地址分别更新为 6、14、20。',
          'Suppose B moves from 8 to 6 while A’s reference field still stores 8. A later access through A reads whatever now sits at 8, breaking the logical link. Compaction therefore builds an old→new map and walks every reference: if its target moved, rewrite the target address. The diagram updates A→B, B→C and C→D to 6, 14 and 20.',
        ],
        points: [
          ['根引用也要更新；根不是“永远不变”的例外。', 'Root references must be updated too; roots are not exempt.'],
          ['若引用保存的是对象 ID 而不是地址，地址变化不影响逻辑引用，但对象表仍要记录新地址。', 'If a reference stores an object id rather than an address, the logical link survives, but the object table still records the new address.'],
          ['旧地址不能继续出现在任何有效引用中。', 'A stale address must not remain in any valid reference.'],
        ],
      },
      {
        title: ['代价、前提与适用场景', 'Cost, preconditions and use'],
        body: [
          '紧缩的时间代价与存活对象数 N、存活字节 L 和引用数 E 有关：计算新地址要遍历存活对象，移动要复制存活字节，更新引用要遍历引用。它需要能识别所有根和所有引用，并且在紧缩期间通常要暂停程序，否则并发访问会看到半移动状态。若对象很大或引用很多，移动成本高；若外部碎片不严重，紧缩可能得不偿失。',
          'Compaction cost depends on the number of live objects N, live bytes L and references E: computing addresses visits survivors, moving copies L bytes, and updating references visits E. It needs complete knowledge of roots and references, and usually stops the program during the move; otherwise concurrent readers could observe half-moved state. Large objects or many references make it expensive, and mild fragmentation may not justify it.',
        ],
        points: [
          ['紧缩的空间收益是“把分散空闲合并成一块”，不是“让对象变小”。', 'The space benefit is one contiguous free run, not smaller objects.'],
          ['若对象不能被移动（例如被外部裸指针固定），就不能直接使用紧缩。', 'Objects that cannot move (for example, pinned by external raw pointers) cannot be compacted directly.'],
          ['标记—清除和紧缩可以组合，但必须作为两个有明确边界的阶段来描述。', 'Mark-Sweep and compaction may be combined, but must be described as two phases with a clear boundary.'],
        ],
      },
    ],
    comparison: {
      title: ['标记—清除与存储紧缩', 'Mark-Sweep versus compaction'],
      columns: [['比较项', 'Aspect'], ['标记—清除', 'Mark-Sweep'], ['存储紧缩', 'Compaction']],
      rows: [
        [
          ['主要目标', 'Main goal'],
          ['回收不可达对象', 'Reclaim unreachable objects'],
          ['把存活对象集中，消除外部碎片', 'Concentrate survivors and remove external fragmentation'],
        ],
        [
          ['是否移动对象', 'Moves objects?'],
          ['不移动', 'No'],
          ['移动存活对象', 'Yes, live objects'],
        ],
        [
          ['地址是否变化', 'Do addresses change?'],
          ['不变', 'No'],
          ['变化，旧地址失效', 'Yes; old addresses become stale'],
        ],
        [
          ['引用是否要改写', 'References rewritten?'],
          ['不需要', 'No'],
          ['所有指向被移动对象的引用都要改', 'Every reference to a moved object'],
        ],
        [
          ['留下的空闲形态', 'Resulting free space'],
          ['可能是多个分散空洞', 'Possibly several scattered holes'],
          ['通常是一块连续空闲区', 'Usually one contiguous free run'],
        ],
        [
          ['主要代价', 'Main cost'],
          ['标记遍历 + 清扫全部对象', 'Mark traversal + sweep all objects'],
          ['计算地址 + 复制存活字节 + 改写引用', 'Address computation + copying live bytes + reference rewrite'],
        ],
      ],
    },
    takeaway: [
      '紧缩不是“把块涂成连续”，而是真实的地址变化：先确定存活集合，再计算新地址、移动对象、改写全部引用。标记—清除与紧缩是两个阶段，不能混为一谈。',
      'Compaction is not painting blocks contiguous: it is a real address change. Determine the live set, compute new addresses, move objects and rewrite every reference. Mark-Sweep and compaction are two phases, not one.',
    ],
  },
];
