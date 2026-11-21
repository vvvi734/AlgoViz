import type { ConceptPage } from './types';

/**
 * TEXTBOOK-11: static theory for external sorting. The three pages deliberately
 * separate the I/O model, the construction of initial runs, and the method
 * comparison. The runnable courses own all animation and real traces.
 */
export const EXTERNAL_SORT_CONCEPT_PAGES: readonly ConceptPage[] = [
  {
    id: 'external-sort-basics',
    topicId: 'external-sort-basics',
    title: ['外部排序基本原理：内存装不下时如何排序', 'External-sorting fundamentals: sorting when memory cannot hold the file'],
    chapter: ['第 11 章 · 外部排序', 'Chapter 11 · External sorting'],
    summary: [
      '外部排序处理的对象大到无法一次装入内存。它先把外存文件按数据块分批读入内存，在内存中排成若干初始归并段，再通过多趟归并把它们合并成完整有序文件。此时真正的瓶颈通常是读盘、写盘的数据块次数，而不是内存中的比较次数。',
      'External sorting handles files too large to fit in memory. It reads blocks into memory in batches, sorts each batch into an initial run, then merges the runs over several passes into one sorted file. The real bottleneck is usually block reads and writes, not comparisons inside memory.',
    ],
    diagram: 'external-sort',
    definitions: [
      {
        term: ['内部排序', 'Internal sorting'],
        text: [
          '待排序记录全部位于内存，可以随机访问任意记录；算法优化的重点是比较次数、移动次数和额外空间。',
          'All records reside in memory and any record can be accessed randomly; the optimisation focus is comparisons, moves and extra space.',
        ],
      },
      {
        term: ['外部排序', 'External sorting'],
        text: [
          '记录总量超过可用内存，排序过程中必须反复与外存交换数据。算法必须同时考虑内存工作区、缓冲区数量、归并路数和读写块次数。',
          'The record set exceeds available memory, so sorting must repeatedly exchange data with external storage. The algorithm must account for workspace size, buffer count, fan-in and block I/O.',
        ],
      },
      {
        term: ['外存与数据块', 'External storage and data blocks'],
        text: [
          '外存按数据块读写，一次 I/O 至少搬运一个块；块内可以包含多条记录。不能假设可以像内存数组那样只取一条记录而不付出整块 I/O。',
          'External storage is accessed in blocks: one I/O moves at least one block, and a block may contain several records. One cannot fetch a single record for free as with an in-memory array.',
        ],
      },
      {
        term: ['记录', 'Record'],
        text: [
          '排序的基本对象。每条记录至少有一个排序关键字；关键字相等时是否保持原次序，取决于具体归并实现。',
          'The unit being sorted. Every record has at least one key; whether equal keys preserve their original order depends on the merge implementation.',
        ],
      },
      {
        term: ['初始归并段', 'Initial run'],
        text: [
          '一段内部已经按关键字有序、但段与段之间尚未确定次序的记录序列。它是外部排序第一阶段写回外存的中间结果。',
          'A record sequence that is internally sorted while no order is yet established between runs. It is the intermediate result written back during the first phase.',
        ],
      },
      {
        term: ['输入缓冲区与输出缓冲区', 'Input and output buffers'],
        text: [
          '每个参与归并的段需要一个输入缓冲区保存当前块；待写出的记录先进入输出缓冲区，装满一块后再整体写回外存。缓冲区大小决定一次 I/O 搬运多少条记录。',
          'Each participating run needs an input buffer for its current block; records waiting to be written enter an output buffer and are flushed as one block. Buffer size determines how many records one I/O moves.',
        ],
      },
      {
        term: ['归并趟数', 'Number of merge passes'],
        text: [
          '若初始归并段有 m 个、每次归并 k 路，则归并趟数 s = ⌈log_k m⌉。k 越大，趟数通常越少，但每次从 k 个候选中选最小值的结构也更复杂。',
          'With m initial runs and fan-in k, the number of merge passes is s = ⌈log_k m⌉. Larger k usually reduces passes but complicates selecting the minimum among k candidates.',
        ],
      },
      {
        term: ['多路平衡归并', 'Multiway balanced merge'],
        text: [
          '每一趟把若干组 k 个归并段合并成一组，使段数大约缩小为原来的 1/k，直到只剩一个段。平衡指各趟尽量均匀减少段数，不代表各段长度相等。',
          'Each pass merges groups of k runs so the run count shrinks by roughly a factor of k, until one run remains. Balanced refers to evenly reducing the run count, not to equal run lengths.',
        ],
      },
      {
        term: ['I/O 开销', 'I/O cost'],
        text: [
          '外部排序的主要代价来自读写数据块。若每个归并趟都要把全部记录读一遍、写一遍，减少一趟就能减少一整份文件的读写；这通常比省掉几次内存比较更重要。',
          'External sorting is dominated by block reads and writes. If every merge pass reads and writes the whole file, removing one pass removes a full file’s I/O, which usually matters more than saving a few comparisons.',
        ],
      },
    ],
    sections: [
      {
        title: ['为什么不能一次全部装入内存', 'Why the whole file cannot be loaded'],
        body: [
          '设有 n 条记录，每条占用 r 字节，内存工作区只能容纳 M 条。当 n > M 时，任何要求“先看见全部记录再决定次序”的算法都无法直接运行。外部排序把问题拆成两个层次：先在容量 M 内制造有序性，再在外部把有序段逐步合并。',
          'Suppose there are n records of r bytes and the memory workspace holds only M records. When n > M, no algorithm that requires seeing every record before deciding order can run directly. External sorting splits the problem: create order inside capacity M first, then merge ordered runs outside memory.',
        ],
        points: [
          ['内存容量限制的是同时驻留的记录数，不是记录总量；外部排序允许记录分批进出内存。', 'Memory limits how many records reside at once, not the total record count; records may enter and leave in batches.'],
          ['每次读入的最小单位是数据块；块大小与缓冲区容量共同决定一次搬运多少条记录。', 'The smallest read unit is a block; block size and buffer capacity together decide how many records one transfer moves.'],
          ['本课程的“磁盘”是可复现的教学模型：读块、写块只是 Trace 中的事件，不是浏览器真的访问磁盘。', 'This course’s “disk” is a reproducible teaching model: reads and writes are Trace events, not real browser disk access.'],
        ],
      },
      {
        title: ['两阶段流程：先生成段，再归并', 'Two phases: build runs, then merge'],
        body: [
          '第一阶段从外存顺序读入一批记录，在内存中用内部排序排好，再顺序写回外存，得到一个初始归并段；重复直到输入耗尽。第二阶段把 m 个初始段作为叶子，按 k 路归并反复合并，直到只剩一个完整有序文件。',
          'Phase one reads a batch sequentially, sorts it in memory, writes it back sequentially as one initial run, and repeats until input is exhausted. Phase two treats the m initial runs as leaves and repeatedly merges k at a time until one fully sorted file remains.',
        ],
        points: [
          ['第一阶段的内部排序可使用任意稳定或不稳定的内存排序；段内有序是后续归并的唯一前提。', 'Any in-memory sort may be used in phase one; internal order is the only prerequisite for later merging.'],
          ['归并阶段不重新排序记录，只不断比较各段当前候选并顺序输出。', 'The merge phase never re-sorts records; it compares current candidates and emits them in order.'],
          ['若第一阶段的记录块没有全部读完，就不能提前宣布该段结束。', 'A run cannot be declared finished while its input block still has unread records.'],
          ['最终输出必须包含原文件的每一条记录，且整体按关键字非降序。', 'The final output must contain every original record exactly once and be globally non-decreasing by key.'],
        ],
      },
      {
        title: ['I/O 为什么是主要矛盾', 'Why I/O dominates'],
        body: [
          '内存比较的代价通常在纳秒到微秒级，而一次外存块读写可能慢几个数量级。设初始段数为 m、归并路数为 k，则归并趟数为 s = ⌈log_k m⌉。只考虑归并阶段，每一趟都要把全部 n 条记录读一遍、写一遍；若再算第一阶段的读入与写段，读、写各约 s + 1 遍。',
          'In-memory comparisons cost nanoseconds to microseconds, while one external block access can be orders of magnitude slower. With m initial runs and fan-in k, s = ⌈log_k m⌉ merge passes. Counting only merging, each pass reads and writes all n records; including phase one gives about s + 1 read passes and s + 1 write passes.',
        ],
        points: [
          ['增大 k 可以减少趟数，例如 8 个段二路归并需 3 趟，四路归并只需 2 趟。', 'Larger k reduces passes: eight runs need three two-way passes but only two four-way passes.'],
          ['但 k 路归并每次要从 k 个候选中选最小值；线性扫描为 O(k)，败者树可降为 O(log k)。', 'However, k-way merging selects among k candidates: a linear scan costs O(k), while a loser tree reduces this to O(log k).'],
          ['k 增大还会占用更多输入缓冲区；若内存连 k 个输入缓冲区都放不下，就不能真正同时归并 k 路。', 'Larger k also needs more input buffers; if memory cannot hold k input buffers, k-way merging cannot actually run concurrently.'],
          ['增加每段的缓冲区数量可以让读下一块与处理当前块重叠，但每个缓冲区仍占用内存。', 'More buffers per run can overlap the next block read with current processing, but every buffer still consumes memory.'],
        ],
        formula: '归并趟数 s = ⌈log_k m⌉；总 I/O 随 (s + 1) 份文件读写增长',
        formulaEn: 'Merge passes s = ⌈log_k m⌉; total I/O grows with (s + 1) file reads and writes',
      },
    ],
    comparison: {
      title: ['内部排序与外部排序的关注点', 'What internal and external sorting optimise'],
      columns: [
        ['维度', 'Dimension'],
        ['内部排序', 'Internal sorting'],
        ['外部排序', 'External sorting'],
      ],
      rows: [
        [
          ['数据位置', 'Data location'],
          ['全部在内存', 'Entirely in memory'],
          ['部分驻留内存，主体在外存', 'Part in memory, most on external storage'],
        ],
        [
          ['主要代价', 'Dominant cost'],
          ['比较、移动、递归栈', 'Comparisons, moves, recursion stack'],
          ['数据块读写次数', 'Block reads and writes'],
        ],
        [
          ['基本策略', 'Core strategy'],
          ['直接对全部记录排序', 'Sort all records directly'],
          ['生成初始段，再多趟归并', 'Build initial runs, then merge over passes'],
        ],
        [
          ['关键参数', 'Key parameter'],
          ['n、关键字分布、额外空间', 'n, key distribution, extra space'],
          ['m、k、缓冲区容量、块大小', 'm, k, buffer capacity, block size'],
        ],
        [
          ['能否随机访问记录', 'Random record access'],
          ['可以', 'Yes'],
          ['按块顺序访问，通常不可以', 'Block-sequential; usually no'],
        ],
      ],
    },
    takeaway: [
      '先判断数据是否真的超过内存，再计算初始段数 m 与归并趟数 s；优化外部排序首先是减少整份文件的读写趟数。',
      'First check whether the data truly exceeds memory, then compute m and s. Optimising external sorting starts with reducing full-file I/O passes.',
    ],
  },
  {
    id: 'external-initial-runs',
    topicId: 'initial-runs',
    title: ['初始归并段：从内存批次到有序段', 'Initial runs: from memory batches to ordered segments'],
    chapter: ['第 11 章 · 外部排序', 'Chapter 11 · External sorting'],
    summary: [
      '初始归并段是外部排序的第一阶段产物。最简单的方法每次装满内存、内部排序、写成一个段；置换选择则在同样工作区容量下反复输出可输出的最小值，使一个段可能远长于工作区容量。段越长、段数 m 越少，后续归并趟数就越少。',
      'Initial runs are the first-phase product of external sorting. The simplest method fills memory, sorts internally and writes one run. Replacement selection repeatedly emits the smallest eligible record, so one run may exceed the workspace capacity. Longer runs mean fewer runs m and fewer later merge passes.',
    ],
    diagram: 'external-runs',
    definitions: [
      {
        term: ['初始归并段的长度', 'Initial-run length'],
        text: [
          '一个段包含的记录条数。段长不要求相同；它会影响后续归并树的形状和总代价。',
          'The number of records in one run. Lengths need not be equal; they affect the later merge-tree shape and total cost.',
        ],
      },
      {
        term: ['内存工作区', 'Memory workspace'],
        text: [
          '外部排序第一阶段中可同时容纳记录的有限区域。简单分批法的段长通常不超过工作区容量；置换选择可以让段长超过它。',
          'The limited region that can hold records during phase one. Simple batching keeps a run at most the workspace size; replacement selection can exceed it.',
        ],
      },
      {
        term: ['置换选择排序', 'Replacement selection'],
        text: [
          '一边输出当前可输出的最小值，一边读入新记录来填补空槽；若新记录小于上次输出，它不能进入当前段，被冻结到下一段。',
          'While emitting the smallest eligible value, read a new record into the freed slot. If the new record is below the last output, it cannot join the current run and is frozen for the next one.',
        ],
      },
      {
        term: ['可输出记录', 'Eligible record'],
        text: [
          '关键字不小于本段上次输出值的记录。首次输出前没有“上次输出”限制，工作区内所有记录都可输出。相等关键字允许继续留在当前段。',
          'A record whose key is at least the last output of the current run. Before the first output there is no threshold, so every workspace record is eligible. Equal keys may remain in the run.',
        ],
      },
      {
        term: ['冻结记录', 'Frozen record'],
        text: [
          '小于本段上次输出值、因而不可能继续维持当前段有序的新记录。它仍留在工作区，但不参与当前段的最小值选择，等当前段结束后解冻。',
          'A new record below the last output that cannot preserve the current run’s order. It remains in the workspace but is excluded from selection until the run ends and it is unfrozen.',
        ],
      },
      {
        term: ['封段与解冻', 'Closing and unfreezing'],
        text: [
          '当工作区没有任何可输出记录时，当前段结束并写回外存；随后所有冻结记录改回可输出，清空“上次输出”阈值，开始下一段。',
          'When no eligible record remains, the current run ends and is written back. All frozen records then become eligible, the threshold is cleared, and the next run starts.',
        ],
      },
    ],
    sections: [
      {
        title: ['简单分批：每个内存批次一段', 'Simple batching: one run per memory batch'],
        body: [
          '设工作区最多容纳 M 条记录，输入共有 n 条。每次读入 min(M, 剩余) 条，在内存中排好序，再顺序写成一个段。最终得到 m = ⌈n / M⌉ 个段，段长大致为 M，最后一段可能不满。',
          'If the workspace holds M records and the input has n, read min(M, remaining) records, sort them, and write them as one run. This produces m = ⌈n / M⌉ runs of roughly M records, with a possibly short final run.',
        ],
        points: [
          ['实现简单，段内有序性由一次内部排序保证。', 'Simple to implement; one internal sort guarantees order inside each run.'],
          ['段长受工作区容量硬限制，不能超过 M。', 'Run length is strictly bounded by the workspace capacity M.'],
          ['内部排序可以复用已有的归并、快速、堆排序等课程；不需要为每个段重新设计算法。', 'Any existing internal sort can be reused; no new algorithm is needed per run.'],
        ],
      },
      {
        title: ['置换选择：用“门槛”让段变长', 'Replacement selection: a threshold makes runs longer'],
        body: [
          '工作区初始装满记录。每次选择所有可输出记录中的最小值输出，空出的槽再读入下一条。新记录若不小于上次输出，就仍可输出；否则它比当前段已经写出的值小，必须冻结。可输出集合耗尽时封段，解冻后继续。',
          'The workspace starts full. Repeatedly emit the smallest eligible record, then refill the freed slot. A new record at least the last output remains eligible; otherwise it is smaller than values already emitted and must be frozen. When eligibility is exhausted, close the run and continue after unfreezing.',
        ],
        points: [
          ['冻结不是删除：记录一直在工作区中，只是暂时不能进入当前段。', 'Freezing is not deletion: the record stays in the workspace, merely barred from the current run.'],
          ['当前段输出序列始终非降序，因为每次输出的是可输出集合的最小值。', 'The current run stays non-decreasing because each output is the minimum of the eligible set.'],
          ['随机输入下，置换选择的平均段长约为工作区容量的两倍；输入越有序，段通常越长。', 'On random input the average run is about twice the workspace size; more ordered input tends to produce longer runs.'],
          ['若输入已经整体有序，所有记录都可能留在同一个段中，置换选择几乎不产生额外段。', 'If the input is already ordered, all records may stay in one run, so replacement selection creates almost no extra runs.'],
        ],
      },
      {
        title: ['段数如何影响后续归并', 'How the run count affects later merging'],
        body: [
          '后续归并的叶子就是这些初始段。段数 m 从 n/M 降为更小的值，归并趟数 s = ⌈log_k m⌉ 可能随之减少。因此置换选择的价值不只是“排序更聪明”，而是直接减少外部排序的 I/O 趟数。',
          'The initial runs become leaves of the later merge. Reducing m from n/M lowers the number of passes s = ⌈log_k m⌉. The value of replacement selection is therefore not just clever sorting but directly fewer external I/O passes.',
        ],
        points: [
          ['段数减少一层，可能就少一整趟全文件读写。', 'One fewer level of runs can remove a whole pass of full-file I/O.'],
          ['置换选择本身仍需读入全部记录、写出全部段，不能免除第一阶段 I/O。', 'Replacement selection still reads every record and writes every run; it does not eliminate phase-one I/O.'],
          ['段长不等时，后续还要决定先合并哪些段，这正是最佳归并树的问题。', 'Unequal run lengths raise the question of which runs to merge first, which is exactly the optimal-merge-tree problem.'],
        ],
        formula: '简单分批：m = ⌈n / M⌉；置换选择：段长可变，随机输入平均约 2M',
        formulaEn: 'Simple batching: m = ⌈n / M⌉; replacement selection: variable runs, about 2M on random input',
      },
    ],
    comparison: {
      title: ['两种初始段生成方法', 'Two ways to build initial runs'],
      columns: [
        ['维度', 'Dimension'],
        ['简单分批 + 内部排序', 'Batch + internal sort'],
        ['置换选择', 'Replacement selection'],
      ],
      rows: [
        [
          ['段长上界', 'Run-length bound'],
          ['不超过工作区容量 M', 'At most workspace M'],
          ['可超过 M', 'May exceed M'],
        ],
        [
          ['额外状态', 'Extra state'],
          ['只需工作区', 'Workspace only'],
          ['工作区 + 可输出/冻结状态 + 上次输出阈值', 'Workspace + eligible/frozen state + last-output threshold'],
        ],
        [
          ['输入基本有序', 'Nearly ordered input'],
          ['仍按 M 切段', 'Still cuts every M records'],
          ['可能形成一个很长的段', 'May produce one very long run'],
        ],
        [
          ['实现复杂度', 'Implementation complexity'],
          ['低', 'Low'],
          ['较高，但能减少段数', 'Higher, but reduces the run count'],
        ],
        [
          ['是否改变记录多重集合', 'Preserves the record multiset'],
          ['是', 'Yes'],
          ['是；冻结只是延迟输出', 'Yes; freezing only delays output'],
        ],
      ],
    },
    takeaway: [
      '初始段的目标不是“排得更快”，而是让段内有序、段数更少；置换选择通过冻结与解冻把工作区容量和段长解耦。',
      'The goal of initial runs is internal order and a smaller run count, not faster local sorting; replacement selection decouples workspace size from run length through freezing and unfreezing.',
    ],
  },
  {
    id: 'external-sort-comparison',
    topicId: 'external-sort-comparison',
    title: ['外部排序方法比较：归并路数、缓冲区与代价', 'Comparing external-sorting methods: fan-in, buffers and cost'],
    chapter: ['第 11 章 · 外部排序', 'Chapter 11 · External sorting'],
    summary: [
      '外部排序没有单一“最优”方法。二路归并实现简单但趟数多；增大 k 可减少 I/O 趟数，却增加候选选择和缓冲区压力；置换选择减少初始段数；最佳归并树则在段长不等时降低总记录处理量。选择时应先看 I/O 趟数，再看内存比较与实现约束。',
      'There is no single best external sort. Two-way merging is simple but needs many passes; larger k cuts I/O passes but increases candidate selection and buffer pressure; replacement selection reduces the initial run count; an optimal merge tree lowers total processed records when run lengths differ. Start with I/O passes, then consider comparisons and implementation constraints.',
    ],
    diagram: 'external-comparison',
    definitions: [
      {
        term: ['平衡归并', 'Balanced merge'],
        text: [
          '每趟把归并段按 k 个一组尽量均匀地合并，使段数按约 1/k 缩减。它不要求各段长度相等，也不保证总代价最小。',
          'Each pass merges runs in groups of k as evenly as possible, shrinking the count by about 1/k. It neither requires equal run lengths nor minimises total cost.',
        ],
      },
      {
        term: ['归并路数 k', 'Fan-in k'],
        text: [
          '一次同时参与归并的段数。k 越大，归并趟数 s = ⌈log_k m⌉ 越少，但需要 k 个输入缓冲区，并要从 k 个候选中选择最小。',
          'The number of runs merged simultaneously. Larger k reduces s = ⌈log_k m⌉ but needs k input buffers and a minimum selection among k candidates.',
        ],
      },
      {
        term: ['败者树', 'Loser tree'],
        text: [
          '多路归并的选择结构。叶节点对应各段当前候选，内部节点记录一次比较的败者，最终胜者送到根；某段候选更新后，只沿该叶到根的一条路径重赛。',
          'A selection structure for multiway merging. Leaves hold current candidates, internal nodes remember the loser of each comparison, and the winner reaches the root; after one candidate changes, only its leaf-to-root path is replayed.',
        ],
      },
      {
        term: ['最佳归并树', 'Optimal merge tree'],
        text: [
          '以初始段长度为权重的 k 叉树。每次合并 k 个最轻的根，父权重为子权重之和；总归并代价等于所有内部节点权重之和。',
          'A k-ary tree weighted by initial-run lengths. Each step merges the k lightest roots and the parent weight is the sum of its children; total merge cost equals the sum of all internal-node weights.',
        ],
      },
      {
        term: ['虚拟零权重叶', 'Virtual zero-weight leaf'],
        text: [
          '为使真实叶数满足满 k 叉树约束而补入的权重 0 叶节点。它只占结构位置，不代表任何真实归并段，也不增加总代价。',
          'A weight-0 leaf added so the real leaf count satisfies the full k-ary tree constraint. It occupies a structural slot, represents no real run and adds no cost.',
        ],
      },
      {
        term: ['归并代价', 'Merge cost'],
        text: [
          '按“被处理的记录条数”计量时，一次合并的代价等于父节点权重；整棵树的总代价是各内部节点权重之和，而不是根节点的权重。',
          'Measured in records processed, one combine costs the parent weight; the tree’s total cost is the sum of all internal-node weights, not the root weight alone.',
        ],
      },
    ],
    sections: [
      {
        title: ['二路与多路：趟数和比较的交换', 'Two-way versus multiway: trading passes for comparisons'],
        body: [
          '以 8 个初始段为例，二路归并需要 3 趟，四路归并只需要 2 趟。每减少一趟，就少读写一遍整份文件。然而四路归并每输出一条记录都要在 4 个候选中选最小，线性扫描需 3 次比较；二路只需 1 次。败者树把更新一条候选后的重赛限制在一条路径上，使 k 路选择的代价降到 O(log k)。',
          'With eight initial runs, two-way merging needs three passes while four-way needs two. Removing a pass removes one full-file read and write. Yet four-way selection scans four candidates per output (three comparisons), while two-way needs one. A loser tree confines the replay after a candidate changes to one path, reducing k-way selection to O(log k).',
        ],
        points: [
          ['k 的选择受内存限制：至少要能同时容纳 k 个输入缓冲区和一个输出缓冲区。', 'k is limited by memory: at least k input buffers and one output buffer must fit.'],
          ['若用普通最小堆，它可以在 O(log k) 内取最小，但结构与败者树的内部节点语义不同；不能把普通堆直接叫作败者树。', 'A normal min-heap also extracts the minimum in O(log k), but its internal-node semantics differ from a loser tree; do not rename a heap a loser tree.'],
          ['败者树适合“只有一条候选变化”的多路归并：一条路径更新，不需要重建整棵树。', 'A loser tree suits multiway merging where one candidate changes: update one path instead of rebuilding the structure.'],
        ],
        formula: 'k 路归并线性选择每条 O(k)，败者树每条 O(log k)；趟数 s = ⌈log_k m⌉',
        formulaEn: 'k-way linear selection O(k) per record, loser tree O(log k); passes s = ⌈log_k m⌉',
      },
      {
        title: ['缓冲区：k 路归并的硬约束', 'Buffers: the hard constraint on k-way merging'],
        body: [
          '真正同时归并 k 路，需要每个段都有一个输入缓冲区保存当前块，再加一个输出缓冲区积累待写块。若每个缓冲区容纳 b 条记录，仅这些缓冲区就要 (k + 1)b 条记录的空间，尚未计算归并选择结构和程序自身。',
          'To merge k runs concurrently, each run needs an input buffer for its current block, plus one output buffer for pending writes. If each buffer holds b records, the buffers alone need (k + 1)b records, before selection structures and program overhead.',
        ],
        points: [
          ['k 不能只按“趟数更少”决定，还要检查内存是否放得下。', 'Do not choose k solely for fewer passes; check whether memory can hold the buffers.'],
          ['缓冲区更大可减少每个段的读块次数，但会减少可同时支持的 k。', 'Larger buffers reduce reads per run but lower the feasible k.'],
          ['输出缓冲区满块才写出；最后不满一块也必须写出，不能丢尾部记录。', 'The output buffer flushes when full; the final partial block must also be written, never dropped.'],
        ],
      },
      {
        title: ['段长不等：为什么需要最佳归并树', 'Unequal runs: why an optimal merge tree is needed'],
        body: [
          '平衡归并只控制每一层的段数，不考虑段有多长。若段长分别为 3、5、8、11，先合并 3 和 5 得到 8，再合并两个 8 得到 16，最后合并 11 得到根 27；总代价为 8 + 16 + 27 = 51。若先把 11 与 8 合并，短段会被反复搬运更多次，总代价更高。',
          'Balanced merging controls the run count per level but ignores run lengths. For lengths 3, 5, 8, 11, merge 3 and 5 into 8, the two 8s into 16, and finally 11 into root 27; total cost is 8 + 16 + 27 = 51. Merging 11 with 8 first would drag the short runs through more combines and cost more.',
        ],
        points: [
          ['每次取权重最小的 k 个根，等价于让短段拥有更长的外部路径、长段更靠近根。', 'Taking the k lightest roots each time gives short runs longer external paths and keeps long runs nearer the root.'],
          ['k 路时必须补足虚拟零权重叶，否则最后可能无法组成满 k 叉树。', 'For k-way merging, virtual zero-weight leaves may be required or the final structure cannot be a full k-ary tree.'],
          ['虚拟叶必须与真实段区分显示，不能把“虚拟 0”当成一个长度为 0 的真实文件。', 'Virtual leaves must be visually distinct from real runs; “virtual 0” is not a real zero-length file.'],
          ['该构造与哈夫曼树的贪心思想相通，但权重是归并段长度，目标是归并代价，不是字符编码长度。', 'The greedy idea resembles a Huffman tree, but weights are run lengths and the objective is merge cost, not character-code length.'],
        ],
        formula: '虚拟叶数 d = ((k − 1) − ((n − 1) mod (k − 1))) mod (k − 1)',
        formulaEn: 'Virtual leaves d = ((k − 1) − ((n − 1) mod (k − 1))) mod (k − 1)',
      },
    ],
    comparison: {
      title: ['外部排序方法速查', 'External-sorting method checklist'],
      columns: [
        ['方法', 'Method'],
        ['I/O 趟数', 'I/O passes'],
        ['每条记录的内存选择', 'In-memory selection per record'],
        ['内存前提', 'Memory requirement'],
        ['适用场景', 'Best for'],
      ],
      rows: [
        [
          ['二路平衡归并', 'Two-way balanced merge'],
          ['s = ⌈log₂ m⌉，趟数多', 's = ⌈log₂ m⌉, many passes'],
          ['1 次比较', 'One comparison'],
          ['2 个输入 + 1 个输出缓冲区', '2 input + 1 output buffer'],
          ['实现简单、k 受内存严格限制', 'Simple implementation, tight memory'],
        ],
        [
          ['k 路平衡归并', 'k-way balanced merge'],
          ['s = ⌈log_k m⌉，趟数少', 's = ⌈log_k m⌉, fewer passes'],
          ['线性 O(k)；败者树 O(log k)', 'Linear O(k); loser tree O(log k)'],
          ['k 个输入 + 1 个输出缓冲区', 'k input + 1 output buffer'],
          ['内存能容纳较多缓冲区、I/O 是瓶颈', 'Enough buffers; I/O is the bottleneck'],
        ],
        [
          ['置换选择', 'Replacement selection'],
          ['本身不归并；通过减少 m 间接减少趟数', 'No merging itself; fewer m indirectly cuts passes'],
          ['工作区选最小并判断冻结', 'Select workspace minimum and test freezing'],
          ['固定工作区 + 冻结状态', 'Fixed workspace + frozen state'],
          ['希望初始段更长、段数更少', 'Longer initial runs and fewer runs'],
        ],
        [
          ['最佳归并树', 'Optimal merge tree'],
          ['不改变 k 路归并的 I/O 模型', 'Same k-way I/O model'],
          ['仍需 k 路候选选择', 'Still needs k-way candidate selection'],
          ['需知道各段长度；可能补虚拟叶', 'Needs run lengths; may add virtual leaves'],
          ['初始段长度差异明显', 'Initial run lengths differ markedly'],
        ],
      ],
    },
    takeaway: [
      '先减少整份文件的读写趟数，再优化每条记录的 k 选 1；段长不等时，用最佳归并树降低总处理量，并如实标出虚拟零权重叶。',
      'Reduce full-file I/O passes first, then optimise k-way selection. With unequal runs, use an optimal merge tree to lower total processing and mark virtual zero-weight leaves honestly.',
    ],
  },
];
