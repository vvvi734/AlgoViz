import type { ConceptPage } from './types';

/**
 * TEXTBOOK-12: static theory for record files. These pages describe a
 * data-structure course model of records and blocks, not an operating-system
 * file manager. Runnable courses own every animated lookup and index update.
 */
export const FILE_STRUCTURE_CONCEPT_PAGES: readonly ConceptPage[] = [
  {
    id: 'file-basics',
    topicId: 'file-basics',
    title: ['文件的基本概念：记录、字段、关键字与文件块', 'File fundamentals: records, fields, keys and blocks'],
    chapter: ['第 12 章 · 文件', 'Chapter 12 · Files'],
    summary: [
      '数据结构课程中的文件是带结构的记录集合，不是操作系统意义上的目录、权限与文件句柄。每条记录由若干字段组成，关键字是用于识别或排序记录的字段；文件按记录的逻辑顺序组织，再由物理块承载。访问方式与组织方式共同决定查找、插入、删除和范围扫描的代价。',
      'A file in a data-structures course is a structured collection of records, not an operating-system directory with permissions and handles. Each record consists of fields, and a key identifies or orders records. The logical record sequence is carried by physical blocks. Organization and access mode together determine lookup, insertion, deletion and range-scan costs.',
    ],
    diagram: 'file-basics',
    definitions: [
      {
        term: ['文件', 'File'],
        text: [
          '同类记录组成的集合，并具有统一的结构与访问规则。本课程只讨论记录文件。',
          'A collection of records of the same kind with a uniform structure and access rules. This course discusses record files only.',
        ],
      },
      {
        term: ['记录与字段', 'Record and field'],
        text: [
          '记录是文件的基本逻辑单位；字段是记录中的属性，例如学号、姓名、类别。',
          'A record is the basic logical unit of a file; a field is an attribute inside a record, such as ID, name or category.',
        ],
      },
      {
        term: ['关键字', 'Key'],
        text: [
          '用于识别记录或组织记录的字段。能唯一识别记录的关键字叫主关键字；不唯一但可用于检索的字段叫次关键字。',
          'A field used to identify or organize records. A key that identifies a record uniquely is a primary key; a non-unique searchable field is a secondary key.',
        ],
      },
      {
        term: ['逻辑记录与物理记录', 'Logical and physical records'],
        text: [
          '逻辑记录是用户看到的一条完整记录；物理记录是外存一次传输实际承载的记录组，通常对应一个文件块。两者边界不一定相同。',
          'A logical record is one complete record seen by the user; a physical record is the group moved by one external transfer, usually a file block. Their boundaries need not coincide.',
        ],
      },
      {
        term: ['文件块', 'File block'],
        text: [
          '外存读写的最小教学单位。一个块可容纳多条记录，也可只容纳一条大记录；块内记录可能有序，也可能无序。',
          'The teaching unit of external transfer. A block may hold several records or one large record; records inside may be ordered or unordered.',
        ],
      },
      {
        term: ['逻辑结构与物理结构', 'Logical and physical organization'],
        text: [
          '逻辑结构描述记录之间的顺序、索引或散列关系；物理结构描述这些记录如何分配到块、柱面或桶。教材中的文件组织方式首先关心逻辑关系如何映射到块。',
          'Logical organization describes sequential, indexed or hashed relationships between records; physical organization describes their placement in blocks, cylinders or buckets. File organization maps logical relationships to blocks.',
        ],
      },
      {
        term: ['顺序访问与随机访问', 'Sequential and random access'],
        text: [
          '顺序访问必须按记录排列依次前进；随机访问可直接计算或查询目标块的位置。顺序文件也可以随机访问某个块，但不能因此假设任意单条记录都可零代价直达。',
          'Sequential access moves through the record order; random access computes or looks up a target block directly. A sequential file may support direct block access, but a single record is not free to fetch.',
        ],
      },
      {
        term: ['索引', 'Index'],
        text: [
          '索引项把关键字或块边界映射到地址。索引本身也是文件数据，需要占用块，并在插入、删除或块分裂后维护。',
          'An index entry maps a key or block boundary to an address. The index is itself stored data, occupies blocks, and must be maintained after insertions, deletions or block splits.',
        ],
      },
    ],
    sections: [
      {
        title: ['同一组记录可以怎样组织', 'How the same records can be organized'],
        body: [
          '以三条记录为例：101/A/X、102/B/Y、103/C/X。按关键字升序连续排放得到顺序文件；为关键字建立“关键字 → 块地址”的表得到索引文件；把类别 X 的记录串成一条链、类别 Y 的记录串成另一条链，则得到多重表；把“X → 101,103”和“Y → 102”建成倒排表，则得到倒排文件。',
          'Take three records: 101/A/X, 102/B/Y and 103/C/X. Placing them in ascending key order gives a sequential file. A table “key → block address” gives an indexed file. Linking all X records and all Y records separately gives a multilist. Tables “X → 101,103” and “Y → 102” give an inverted file.',
        ],
        points: [
          ['同一批记录可以有多份辅助结构；辅助结构越多，查找路径越多，维护代价也越大。', 'One record set may have several auxiliary structures; more structures mean more access paths and more maintenance.'],
          ['“按主关键字查找”和“按次关键字检索”不是同一个问题；前者可唯一命中，后者可能返回多条记录。', 'Primary-key lookup and secondary-key search are different: the former is unique, while the latter may return many records.'],
          ['索引与数据文件必须保持一致；索引项指向错误块时，查找结果就不可信。', 'Index and data file must stay consistent; an index entry pointing to the wrong block makes lookups unreliable.'],
        ],
      },
      {
        title: ['文件操作与代价', 'File operations and costs'],
        body: [
          '查找、插入、删除和更新都要落到“读哪些块、写哪些块”。插入可能要求移动记录、改写索引或创建溢出记录；删除可能留下空洞、断开链或使索引项失效。只比较内存中的循环次数，无法解释外存文件的行为。',
          'Lookup, insertion, deletion and update all reduce to which blocks are read and written. Insertion may move records, rewrite index entries or create overflow records; deletion may leave holes, break links or invalidate index entries. Counting only in-memory loop iterations cannot explain external-file behaviour.',
        ],
        points: [
          ['顺序文件的插入若要保持物理有序，可能需要移动后续记录或使用溢出区。', 'Keeping a sequential file physically ordered may require shifting later records or using an overflow area.'],
          ['索引文件的更新必须同时考虑数据块与索引项；只改一边会产生悬空地址。', 'Indexed-file updates must change both data blocks and index entries; changing one side creates dangling addresses.'],
          ['本课程用模拟块计数比较组织方式，不把计数当作真实磁盘性能测量。', 'This course compares organizations with simulated block counts, not real disk-performance measurements.'],
        ],
      },
      {
        title: ['课程边界', 'Scope of this course'],
        body: [
          '这里不实现目录树、权限、文件描述符、缓存一致性或日志恢复。重点是记录集合的逻辑组织、块级访问、索引和溢出链。所有动态课程中的读写都是可复现的教学事件。',
          'This chapter does not implement directory trees, permissions, file descriptors, cache coherence or crash recovery. The focus is logical record organization, block access, indexes and overflow chains. Every read and write in the runnable courses is a reproducible teaching event.',
        ],
      },
    ],
    comparison: {
      title: ['逻辑记录与物理块', 'Logical records and physical blocks'],
      columns: [['维度', 'Dimension'], ['逻辑记录', 'Logical record'], ['物理块', 'Physical block']],
      rows: [
        [['含义', 'Meaning'], ['用户看到的一条完整记录', 'One complete record seen by the user'], ['一次外存传输承载的记录组', 'The group moved by one external transfer']],
        [['边界', 'Boundary'], ['由字段结构决定', 'Determined by field structure'], ['由块大小与记录长度决定', 'Determined by block size and record length']],
        [['数量关系', 'Count relation'], ['文件中 n 条记录', 'n records in the file'], ['通常少于 n 个块，也可能一块一条', 'Usually fewer than n blocks; sometimes one per block']],
      ],
    },
    takeaway: [
      '文件组织不是“把记录放进数组”这么简单：记录、关键字、块与访问路径必须一起设计，索引和溢出结构都属于文件本身。',
      'File organization is more than storing records in an array: records, keys, blocks and access paths are designed together, and indexes and overflow structures are part of the file itself.',
    ],
  },

  {
    id: 'sequential-file',
    topicId: 'sequential-file',
    title: ['顺序文件：有序、无序与块扫描', 'Sequential files: ordered, unordered and block scans'],
    chapter: ['第 12 章 · 文件', 'Chapter 12 · Files'],
    summary: [
      '顺序文件按某种记录顺序连续组织。若按主关键字有序，则支持按关键字范围扫描；若物理顺序与关键字无关，则按关键字查找只能扫描全部记录。读取通常按块推进，当前读取位置和块边界比“数组下标”更重要。',
      'A sequential file stores records in some order. If the order is by primary key, key-range scans are possible; if physical order is unrelated to the key, a key lookup must scan all records. Reads advance by blocks, so the current position and block boundary matter more than an array index.',
    ],
    diagram: 'sequential-file',
    definitions: [
      {
        term: ['有序顺序文件', 'Ordered sequential file'],
        text: [
          '记录按关键字非降序（或非升序）连续存放。块内与块间都保持该顺序，因此可按关键字定位大致位置并顺序扫描范围。',
          'Records are stored in non-decreasing or non-increasing key order, both inside and across blocks, enabling approximate positioning and ordered range scans.',
        ],
      },
      {
        term: ['无序顺序文件', 'Unordered sequential file'],
        text: [
          '记录只按到达或插入顺序连续存放，关键字没有整体次序。按关键字查找必须检查到命中或文件结束。',
          'Records are stored by arrival or insertion order with no global key order. A key lookup must inspect until a hit or end-of-file.',
        ],
      },
      {
        term: ['顺序扫描', 'Sequential scan'],
        text: [
          '从头开始逐块读取并检查记录，直到命中、范围结束或文件结束。代价按被检查的记录数和块数计。',
          'Read blocks from the beginning and inspect records until a hit, range end or end-of-file. Cost is measured in inspected records and blocks.',
        ],
      },
      {
        term: ['按主关键字查找', 'Primary-key lookup'],
        text: [
          '目标关键字唯一。在有序文件中可利用块上界缩小起点；在无序文件中没有这种剪枝依据。',
          'The target key is unique. In an ordered file block bounds can narrow the start; an unordered file offers no such pruning.',
        ],
      },
      {
        term: ['范围扫描', 'Range scan'],
        text: [
          '给定关键字区间 [lo, hi]，按顺序输出区间内所有记录。有序文件定位 lo 后可连续读取；无序文件只能逐条判断。',
          'Given a key interval [lo, hi], output every record inside in order. An ordered file locates lo and then reads contiguously; an unordered file must test every record.',
        ],
      },
    ],
    sections: [
      {
        title: ['块边界决定实际读了多少', 'Block boundaries determine reads'],
        body: [
          '即使目标记录只有一条，读取也要搬入包含它的整个块。若一条记录跨块存放，读取可能涉及两个块；本课程的小模型让每条记录完整落在一个块内，避免把跨块拆分当作额外算法。',
          'Even one target record requires reading its whole block. A record spanning two blocks may need both; the small model here keeps each record inside one block so cross-block splitting is not mistaken for an algorithm.',
        ],
        points: [
          ['当前读取位置通常以块和块内偏移表示，而不是裸记录下标。', 'The current position is usually a block plus an in-block offset, not a bare record index.'],
          ['有序文件可以记下每块最大关键字，从而跳过不可能包含目标的块。', 'An ordered file can store each block’s maximum key to skip blocks that cannot contain the target.'],
          ['范围扫描必须把区间内所有记录读完，不能只返回第一条命中。', 'A range scan must read every record in the interval, not stop at the first hit.'],
        ],
      },
      {
        title: ['插入与删除的真实代价', 'The real cost of insertion and deletion'],
        body: [
          '在有序顺序文件中插入记录，若要保持块内与块间有序，可能需要把后续记录后移、分裂块并更新块边界。无序文件可直接追加到尾部，但会失去范围剪枝能力。删除若只做标记，会留下逻辑空洞；若立即压缩，则要移动后续记录。',
          'Inserting into an ordered sequential file while preserving order may shift later records, split a block and update block bounds. An unordered file can append at the end but loses range pruning. Deletion may leave a logical hole if marked, or move later records if compacted immediately.',
        ],
        points: [
          ['“追加一条记录”在无序文件中很便宜，但按关键字查找可能变成全文件扫描。', 'Appending is cheap in an unordered file, but key lookups may become full-file scans.'],
          ['有序性是一种用插入维护成本换取查找与范围访问能力的交易。', 'Order is a trade: insertion maintenance buys faster lookup and range access.'],
          ['块分裂后必须更新索引或块边界，否则范围剪枝会指向错误区间。', 'After a block split, index or block bounds must be updated or range pruning points to the wrong interval.'],
        ],
      },
      {
        title: ['配套动态课程', 'Related runnable course'],
        body: [
          '本页不复制第二套顺序查找动画。第 9 章的顺序查找课程已经展示逐条比较；把同样的数组扫描换成文件块扫描时，新增的只是块计数与块边界，不应伪装成另一套算法。',
          'This page does not duplicate a second sequential-search animation. The Chapter 9 sequential-search course already demonstrates record-by-record comparison. Replacing array slots with file blocks adds block counters and boundaries, not a new algorithm.',
        ],
      },
    ],
    comparison: {
      title: ['有序与无序顺序文件', 'Ordered and unordered sequential files'],
      columns: [['维度', 'Dimension'], ['有序顺序文件', 'Ordered sequential file'], ['无序顺序文件', 'Unordered sequential file']],
      rows: [
        [['按关键字查找', 'Key lookup'], ['可跳过块，通常少于全扫描', 'Can skip blocks; often less than a full scan'], ['必须扫描到命中或末尾', 'Must scan to a hit or the end']],
        [['范围扫描', 'Range scan'], ['定位起点后连续读取', 'Locate the start and read contiguously'], ['每条都要判断，顺序输出需额外整理', 'Test every record; ordered output needs extra work']],
        [['插入', 'Insertion'], ['可能后移、分裂并更新边界', 'May shift, split and update bounds'], ['尾部追加较简单', 'Append at the tail is simpler']],
        [['适用场景', 'Best use'], ['按主关键字检索、范围查询', 'Primary-key retrieval and range queries'], ['只按到达顺序处理、批量追加', 'Arrival-order processing and bulk appends']],
      ],
    },
    takeaway: [
      '顺序文件的关键不是“连续”两个字，而是记录顺序是否与关键字一致；只有有序时，块边界才能帮助剪枝和范围扫描。',
      'The key issue is not contiguity but whether record order agrees with key order; only an ordered file lets block bounds prune searches and support range scans.',
    ],
  },

  {
    id: 'index-file',
    topicId: 'index-structure',
    title: ['索引文件：稠密索引、稀疏索引与多级索引', 'Indexed files: dense, sparse and multilevel indexes'],
    chapter: ['第 12 章 · 文件', 'Chapter 12 · Files'],
    summary: [
      '索引文件把“关键字 → 记录或块地址”的索引项与数据文件分开存放。查找先访问索引，再由索引项定位数据块，避免扫描整个文件。稠密索引为每条记录建立一项；稀疏索引只为每个块的首关键字或上界建立一项。多级索引则对索引本身再建索引。',
      'An indexed file stores “key → record or block address” entries separately from the data file. A lookup visits the index first, then uses an entry to locate a data block instead of scanning the whole file. A dense index has one entry per record; a sparse index has one entry per block, using its first key or upper bound. A multilevel index indexes the index itself.',
    ],
    diagram: 'indexed-file',
    definitions: [
      {
        term: ['索引项', 'Index entry'],
        text: [
          '至少包含关键字与地址两部分。地址可以是记录地址、块号或桶号；必须与数据文件中的真实位置一致。',
          'Contains at least a key and an address. The address may identify a record, block or bucket and must agree with the real location in the data file.',
        ],
      },
      {
        term: ['稠密索引', 'Dense index'],
        text: [
          '数据文件中每条记录都有一个索引项。可以直接由关键字得到记录所在块，索引空间为 O(n)。',
          'Every data record has an index entry. A key directly identifies its block, at O(n) index space.',
        ],
      },
      {
        term: ['稀疏索引', 'Sparse index'],
        text: [
          '每个数据块只保留一个索引项，通常记录该块首关键字或最大关键字。索引更小，但命中块后仍需块内扫描。',
          'One entry per data block, usually its first or largest key. The index is smaller, but the selected block still needs an in-block scan.',
        ],
      },
      {
        term: ['一级索引与多级索引', 'One-level and multilevel indexes'],
        text: [
          '一级索引直接指向数据块。当索引本身大到不能一次装入内存时，可对索引块再建高一层索引，形成多级索引；查找逐层下降，最后仍要读数据块。',
          'A one-level index points directly to data blocks. When the index itself is too large for memory, another level can index the index blocks. A lookup descends level by level and still reads a data block at the end.',
        ],
      },
      {
        term: ['索引维护', 'Index maintenance'],
        text: [
          '插入、删除、块分裂或记录迁移都可能改变索引项。稠密索引要增删具体记录项；稀疏索引要更新块首键或边界。',
          'Insertions, deletions, block splits or record moves may change entries. A dense index adds or removes record entries; a sparse index updates block-start keys or bounds.',
        ],
      },
    ],
    sections: [
      {
        title: ['一次索引查找的真实路径', 'The real path of an indexed lookup'],
        body: [
          '以块容量 3、关键字 101…108 为例，三个数据块分别为 [101,102,103]、[104,105,106]、[107,108]。稠密索引有 8 项，106 直接指向第二块；稀疏索引只有 101→B0、104→B1、107→B2 三项，查找 106 时选择不大于目标的最后一项 104，读 B1 后再扫描三条记录。',
          'With block capacity 3 and keys 101…108, the blocks are [101,102,103], [104,105,106] and [107,108]. A dense index has eight entries and 106 points directly to block two. A sparse index has only 101→B0, 104→B1, 107→B2; looking up 106 chooses the last entry not above the target, reads B1, then scans its records.',
        ],
        points: [
          ['查找必须同时记录“检查了哪些索引项”和“读了哪个数据块”，不能只显示最终结果。', 'A lookup must expose both index probes and the data block read, not only the final answer.'],
          ['稀疏索引的前置条件是数据块内部与块间都按关键字有序。', 'A sparse index presupposes key order both inside and across data blocks.'],
          ['若目标小于第一个索引键或大于最后一个块的上界，仍要读一个边界块并正确报告失败。', 'If the target is below the first key or above the last block bound, a boundary block is still read and the miss reported correctly.'],
        ],
      },
      {
        title: ['稠密索引与稀疏索引的取舍', 'Dense versus sparse trade-offs'],
        body: [
          '稠密索引把块内查找也省掉，但索引项数量与记录数同阶；稀疏索引显著缩小索引，却把一次块内扫描留给查找。选择取决于记录数、块容量、索引能否常驻内存以及更新频率。',
          'A dense index removes the in-block search but has as many entries as records; a sparse index shrinks the index while leaving one block scan. The choice depends on record count, block capacity, whether the index fits in memory and update frequency.',
        ],
        points: [
          ['“稠密一定更快”不成立：若索引本身多占许多块，读索引的 I/O 可能抵消块内扫描的节省。', '“Dense is always faster” is false: if the larger index occupies many blocks, index I/O may cancel the saved block scan.'],
          ['稀疏索引的块首键必须真实存在；不能用一个凭空估计的边界值。', 'A sparse block-start key must actually exist; an invented boundary value is invalid.'],
          ['多级索引减少的是索引层扫描，不改变最终仍需读取目标数据块这一事实。', 'A multilevel index reduces index-level scans; it does not remove the final target data-block read.'],
        ],
      },
      {
        title: ['与本课程动态实现的关系', 'Relation to the runnable course'],
        body: [
          '动态课程只模拟一级索引，支持稠密/稀疏切换、命中与失败，并显示索引项、目标块、块内比较和模拟 I/O 计数。多级索引在本页用结构图说明，不伪装成另一套已完成播放器。',
          'The runnable course models a one-level index, supports dense/sparse switching, hits and misses, and shows entries, the target block, in-block comparisons and simulated I/O counters. Multilevel indexing is explained by the structure diagram here rather than pretending to be another finished player.',
        ],
      },
    ],
    comparison: {
      title: ['稠密索引与稀疏索引', 'Dense and sparse indexes'],
      columns: [['维度', 'Dimension'], ['稠密索引', 'Dense index'], ['稀疏索引', 'Sparse index']],
      rows: [
        [['索引项数量', 'Entry count'], ['每条记录一项，O(n)', 'One per record, O(n)'], ['每块一项，O(n/B)', 'One per block, O(n/B)']],
        [['定位后', 'After locating'], ['可直接确认记录地址', 'Directly identifies the record address'], ['仍需扫描目标块', 'Still scans the target block']],
        [['索引空间', 'Index space'], ['较大', 'Larger'], ['较小', 'Smaller']],
        [['维护', 'Maintenance'], ['增删记录项', 'Add or remove record entries'], ['更新块首键或块边界', 'Update block-start keys or bounds']],
        [['适用', 'Best use'], ['索引可常驻内存、点查多', 'Index fits in memory and point lookups dominate'], ['索引较大、块内记录不多', 'Large index with few records per block']],
      ],
    },
    takeaway: [
      '索引文件先用索引缩小“读哪个块”，再在块内确认记录；稠密与稀疏的差别是索引项粒度，而不是有没有索引。',
      'An indexed file uses the index to narrow which block to read, then confirms the record inside the block. Dense versus sparse changes entry granularity, not whether an index exists.',
    ],
  },

  {
    id: 'isam-vsam',
    topicId: 'isam-vsam-theory',
    title: ['ISAM 与 VSAM：相对静态索引与动态索引组织', 'ISAM and VSAM: relatively static versus dynamic index organization'],
    chapter: ['第 12 章 · 文件', 'Chapter 12 · Files'],
    summary: [
      'ISAM 采用主数据区加索引层，主区按关键字有序，插入溢出时进入溢出区，查找需沿对应的溢出链继续。VSAM 在教材模型中强调索引区域、顺序数据区域与 B+ 树式索引定位，支持较稳定的顺序和范围访问。两者都不是“现代数据库”本身；本章只讲经典组织思想。',
      'ISAM combines an ordered main data area with an index layer. When insertion overflows, records enter an overflow area and a lookup follows the corresponding chain. The textbook VSAM model emphasizes an index region, a sequence data region and B+ tree-style index routing, supporting stable sequential and range access. Neither is a modern database; this chapter presents the classic organization ideas.',
    ],
    diagram: 'isam-vsam',
    definitions: [
      {
        term: ['主数据区', 'Main data area'],
        text: [
          'ISAM 中按关键字有序、按块组织的主体记录区。每块有容量上限，初始装入时尽量填满。',
          'The ordered, block-organized body of records in ISAM. Each block has a capacity limit and is filled as far as possible during initial loading.',
        ],
      },
      {
        term: ['溢出区', 'Overflow area'],
        text: [
          '主块已满时接纳新记录的附属区域。溢出记录按所属主块建立链，查找在扫描主块后继续检查该链。',
          'An auxiliary area for records when their main block is full. Overflow records are chained to their main block; a lookup scans the main block and then follows that chain.',
        ],
      },
      {
        term: ['索引层', 'Index layer'],
        text: [
          '保存主块上界或柱面/块地址。查找先用索引选择主块，再检查主块与溢出链。',
          'Stores upper bounds or cylinder/block addresses. A lookup selects a main block by the index, then checks the block and overflow chain.',
        ],
      },
      {
        term: ['定期重组', 'Periodic reorganization'],
        text: [
          '大量溢出记录会拉长链、破坏块间顺序，使查找退化。重组把溢出记录重新分布到主区，并重写索引。',
          'Many overflow records lengthen chains and disrupt block order, degrading lookups. Reorganization redistributes overflow records into the main area and rewrites the index.',
        ],
      },
      {
        term: ['VSAM 的索引区域与数据区域', 'VSAM index and data regions'],
        text: [
          '教材模型把索引与顺序数据记录分开描述。索引用于按关键字定位，数据区支持顺序读取与范围扫描；实际历史实现还包含控制区间、控制区域等细节，本章不假装完整复刻。',
          'The textbook model separates an index from sequential data records. The index locates keys while the data region supports sequential reads and range scans. Historical implementations also use control intervals and areas, which this chapter does not claim to reproduce fully.',
        ],
      },
      {
        term: ['与 B+ 树的联系和差异', 'Relation to B+ trees'],
        text: [
          'VSAM 的索引思想与 B+ 树相近：多层索引、叶子层数据访问、顺序与范围扫描。但“VSAM 就是 B+ 树”不准确；VSAM 是包含多个区域与存储管理规则的文件组织，B+ 树是索引结构。第 9 章 B+ 树课程展示的是索引算法，不是历史 VSAM 产品。',
          'VSAM’s indexing idea resembles a B+ tree: multiple index levels, leaf-level data access and ordered range scans. But “VSAM is a B+ tree” is inaccurate: VSAM is a file organization with regions and storage rules, while a B+ tree is an index structure. The Chapter 9 B+ tree course demonstrates the index algorithm, not the historical VSAM product.',
        ],
      },
    ],
    sections: [
      {
        title: ['ISAM 查找与插入', 'ISAM lookup and insertion'],
        body: [
          '查找目标 k 时，选择第一个上界不小于 k 的索引项；若 k 大于所有上界，则选择最后一个主块。读入主块后块内扫描；未命中再沿该主块专属的溢出链继续。插入先按同样规则选块：主块有空间就插入并保持块内有序；块满则进入溢出链。若新记录扩大了该块的最大键，索引上界也要刷新。',
          'For target k, choose the first index bound not below k; if k exceeds every bound, choose the final main block. Scan the main block and, if necessary, follow only that block’s overflow chain. Insertion selects a block by the same rule: insert in order if space remains, otherwise append to the chain. If the new record enlarges the block maximum, the index bound is refreshed.',
        ],
        points: [
          ['选择主块不能只看“当前块”，还要保留索引上界与目标的关系。', 'Block selection must expose the index bound and target relation, not only the chosen block.'],
          ['主区命中时不需要访问溢出链；不能无条件把整条链都读入。', 'A main-block hit does not visit the chain; the full chain is not read unconditionally.'],
          ['溢出链记录仍属于原主块；跨块链接会把索引语义弄乱。', 'Overflow records still belong to their original block; cross-block links corrupt the index semantics.'],
          ['ISAM 的索引相对静态，没有 B+ 树的自动分裂与平衡维护。', 'ISAM’s index is relatively static, without automatic B+ tree splits and balancing.'],
        ],
      },
      {
        title: ['VSAM 的顺序与范围访问', 'VSAM sequential and range access'],
        body: [
          'VSAM 的索引按关键字逐层定位顺序数据区域中的起点，之后可按记录顺序连续读取。范围查询的优势来自数据记录的物理/逻辑顺序与索引定位，而不是再建一棵独立 BST。本章不开发第二套 B+ 树播放器，复用第 9 章已有 B+ 树查找、插入和范围查询课程来观察索引层行为。',
          'VSAM’s index descends by key to a starting point in the sequence data region and then reads records in order. Range-query strength comes from ordered data plus index positioning, not from building another BST. This chapter does not create a second B+ tree player; it reuses the Chapter 9 B+ tree search, insertion and range courses to observe index-level behaviour.',
        ],
        points: [
          ['“索引区域”和“顺序数据区域”是教学分层，不能简化为一个内存数组。', 'The index region and sequence data region are teaching layers, not one in-memory array.'],
          ['范围扫描需要保持起点与后继关系；索引命中单条记录不代表区间已完整。', 'A range scan needs start and successor relationships; one index hit does not complete an interval.'],
          ['历史 VSAM 的存储管理细节超出本章范围，不能用现代数据库术语替代教材模型。', 'Historical VSAM storage-management details are outside this chapter; modern database terminology must not replace the textbook model.'],
        ],
      },
    ],
    comparison: {
      title: ['ISAM 与教材 VSAM 模型', 'ISAM and the textbook VSAM model'],
      columns: [['维度', 'Dimension'], ['ISAM', 'ISAM'], ['VSAM（教材模型）', 'VSAM (textbook model)']],
      rows: [
        [['主体组织', 'Primary organization'], ['有序主区 + 溢出链 + 索引层', 'Ordered main area + overflow chains + index'], ['索引区域 + 顺序数据区域', 'Index region + sequence data region']],
        [['索引维护', 'Index maintenance'], ['相对静态，依赖定期重组', 'Relatively static; periodic reorganization'], ['B+ 树式动态索引定位', 'B+ tree-style dynamic index routing']],
        [['插入压力', 'Insertion pressure'], ['主块满则进入溢出链', 'Full main block sends records to overflow'], ['索引与数据组织可动态调整', 'Index and data organization can adjust dynamically']],
        [['范围访问', 'Range access'], ['主区有序但可能被溢出链打断', 'Main area ordered but chains may interfere'], ['顺序数据区域支持连续范围读取', 'Sequence data region supports contiguous range reads']],
        [['边界', 'Boundary'], ['不是 B+ 树', 'Not a B+ tree'], ['不是“现代 B+ 树”的同义词', 'Not a synonym for a modern B+ tree']],
      ],
    },
    takeaway: [
      'ISAM 的核心是“有序主区 + 溢出链 + 静态上界索引”；VSAM 的核心是索引区域定位顺序数据区。二者可以对照 B+ 树理解，但不能互相等同。',
      'ISAM is “ordered main area + overflow chains + static upper-bound index”; VSAM uses an index region to locate a sequence data region. Both can be compared with B+ trees, but none is interchangeable with them.',
    ],
  },

  {
    id: 'hashed-file',
    topicId: 'direct-file',
    title: ['直接存取文件（散列文件）：桶、冲突与溢出', 'Direct-access files: buckets, collisions and overflow'],
    chapter: ['第 12 章 · 文件', 'Chapter 12 · Files'],
    summary: [
      '散列文件用哈希函数把关键字映射到桶地址。桶通常由一个或多个文件块组成；同一桶内的记录仍可能需要块内查找。桶满后，冲突记录进入溢出区或链。按关键字点查通常只需计算桶地址并读取少量块，但散列破坏了关键字顺序，因此不适合有序范围查询。',
      'A hashed file maps a key to a bucket address with a hash function. A bucket usually consists of one or more file blocks, and records inside still need an in-bucket search. When a bucket is full, colliding records enter overflow. Point lookup usually computes a bucket and reads a few blocks, but hashing destroys key order, so ordered range queries are poorly supported.',
    ],
    diagram: 'hashed-file',
    definitions: [
      {
        term: ['桶', 'Bucket'],
        text: [
          '散列文件的基本地址单位，可包含一个或多个块，并能容纳若干条记录。桶号由哈希函数产生。',
          'The basic address unit of a hashed file. It may contain one or more blocks and hold several records. Its number comes from the hash function.',
        ],
      },
      {
        term: ['哈希冲突', 'Hash collision'],
        text: [
          '不同关键字映射到同一桶。冲突本身不是错误；关键是桶满后如何保存并检索额外记录。',
          'Different keys map to the same bucket. A collision is not an error; the issue is how extra records are stored and found after the bucket fills.',
        ],
      },
      {
        term: ['溢出区', 'Overflow area'],
        text: [
          '桶满后接纳额外记录的块或链。查找必须先检查主桶，再按确定规则检查溢出链。',
          'Blocks or chains accepting records after a bucket fills. A lookup checks the primary bucket and then the overflow chain by a deterministic rule.',
        ],
      },
      {
        term: ['直接定位', 'Direct addressing'],
        text: [
          '由关键字计算桶地址，不需要先扫描索引。仍有桶内比较与可能的溢出访问，因此不是“零 I/O 命中”。',
          'Compute a bucket address from the key without scanning an index. In-bucket comparisons and possible overflow visits remain, so it is not a zero-I/O hit.',
        ],
      },
      {
        term: ['散列文件与内存哈希表', 'Hashed file versus in-memory hash table'],
        text: [
          '两者都使用哈希思想，但内存哈希表以槽/节点为单位并常用链地址法或开放定址；外存散列文件以桶/块为单位，冲突处理要落到额外块和 I/O 计数。不能把内存哈希表的 O(1) 直接套到外存。',
          'Both use hashing, but an in-memory table uses slots or nodes with chaining or open addressing, while an external hashed file uses buckets and blocks; collision handling becomes extra blocks and I/O. An in-memory O(1) claim does not transfer unchanged.',
        ],
      },
    ],
    sections: [
      {
        title: ['点查与范围查询的分界', 'Point lookup versus range query'],
        body: [
          '给定关键字 k，计算 h(k) 得到桶号，读主桶并比较桶内记录；若未命中且存在溢出链，再顺序检查链。若要做 [lo, hi] 范围查询，散列函数不会把相邻关键字集中到相邻桶，因此只能扫描全部桶或另建有序索引。',
          'For key k, compute h(k), read the primary bucket and compare records. If the bucket misses and an overflow chain exists, inspect the chain. For a range [lo, hi], the hash function does not keep adjacent keys in adjacent buckets, so either every bucket is scanned or a separate ordered index is required.',
        ],
        points: [
          ['桶内记录数量影响比较次数；桶容量不是无限大。', 'The number of records per bucket affects comparisons; bucket capacity is finite.'],
          ['溢出链越长，点查越接近链表扫描；需要关注装填因子与重组。', 'Longer overflow chains make point lookup approach a linked-list scan; load factor and reorganization matter.'],
          ['“按关键字直接定位”指定位桶，不是定位到唯一记录。', '“Direct key addressing” locates a bucket, not necessarily a unique record.'],
        ],
      },
      {
        title: ['与第 9 章哈希课程的关系', 'Relation to the Chapter 9 hash courses'],
        body: [
          '链地址法与开放定址法课程已经展示内存哈希表的插入、查找和冲突处理。本章只补充外存桶、块和溢出链的教学结构，不重新开发同名的哈希动画，也不把桶计数声称为真实磁盘测量。',
          'The separate-chaining and open-addressing courses already demonstrate insertion, lookup and collision handling in memory. This chapter adds the external bucket, block and overflow-chain structure only; it does not rebuild the same hash animations or claim bucket counts are real disk measurements.',
        ],
      },
    ],
    comparison: {
      title: ['索引文件与散列文件', 'Indexed and hashed files'],
      columns: [['维度', 'Dimension'], ['索引文件', 'Indexed file'], ['散列文件', 'Hashed file']],
      rows: [
        [['定位依据', 'Locating basis'], ['索引项中的关键字', 'Key in an index entry'], ['哈希函数计算的桶号', 'Bucket number from a hash function']],
        [['点查路径', 'Point path'], ['索引 → 数据块', 'Index → data block'], ['桶 → 桶内/溢出链', 'Bucket → in-bucket or overflow chain']],
        [['范围查询', 'Range query'], ['有序索引可支持', 'Supported by ordered indexes'], ['通常不支持，需另建索引', 'Usually unsupported without another index']],
        [['冲突', 'Collisions'], ['索引项不按哈希聚集', 'Entries are not hash-clustered'], ['桶满后产生溢出', 'Full buckets create overflow']],
        [['主要风险', 'Main risk'], ['索引膨胀与维护', 'Index growth and maintenance'], ['装填因子高、溢出链变长', 'High load factor and long chains']],
      ],
    },
    takeaway: [
      '散列文件是“按桶直接定位”的外存组织，不等于内存哈希表的 O(1)；桶内比较、溢出链和块 I/O 仍然存在，而且范围查询需要额外的有序结构。',
      'A hashed file is direct bucket addressing in external storage, not an in-memory O(1) table. In-bucket comparisons, overflow chains and block I/O remain, and range queries need an additional ordered structure.',
    ],
  },

  {
    id: 'multi-table-file',
    topicId: 'multi-table',
    title: ['多重表文件：一条记录参与多条链', 'Multilist files: one record in several chains'],
    chapter: ['第 12 章 · 文件', 'Chapter 12 · Files'],
    summary: [
      '多重表文件为每个需要检索的次关键字建立一条链，同一条记录可以同时出现在多条链中。它不像倒排文件那样把记录 ID 集中写在一张倒排表里，而是让记录本身携带多个链指针。按某个次关键字查询时沿对应链前进；更新记录要同时维护所有相关链。',
      'A multilist file maintains one chain for each searchable secondary key, and one record may appear in several chains. Unlike an inverted file, which centralizes record ids in posting lists, the record itself carries several link pointers. A secondary-key query follows the matching chain; updating a record requires maintaining every affected chain.',
    ],
    diagram: 'multi-table-file',
    definitions: [
      {
        term: ['多重表', 'Multilist'],
        text: [
          '以记录为节点、以次关键字为链标签的组织方式。每条链串起具有同一字段值的记录。',
          'An organization whose nodes are records and whose link labels are secondary keys. Each chain connects records sharing one field value.',
        ],
      },
      {
        term: ['链头', 'Chain head'],
        text: [
          '每个次关键字值对应一个入口，保存该链首记录地址。链头本身可组成一张小型索引。',
          'Each secondary-key value has an entry holding the first record address. These heads may form a small index.',
        ],
      },
      {
        term: ['多链成员', 'Membership in several chains'],
        text: [
          '一条记录可拥有多个 next 指针，例如按类别链和按地区链各一个。指针数量取决于需要支持的检索维度。',
          'One record may own several next pointers, such as one category chain and one region chain. The number of pointers matches the search dimensions supported.',
        ],
      },
      {
        term: ['维护代价', 'Maintenance cost'],
        text: [
          '插入或删除记录时，必须在每个相关链中找到前驱并改写链接；链越长，维护越昂贵。',
          'Inserting or deleting a record requires finding predecessors in every affected chain and rewriting links; longer chains cost more.',
        ],
      },
    ],
    sections: [
      {
        title: ['同一批记录的两种多关键字组织', 'Two multi-key organizations over the same records'],
        body: [
          '设有记录 R1(id=101, 类别=X, 地区=东)、R2(102,Y,东)、R3(103,X,西)。多重表可建“X: R1→R3”“Y: R2”“东: R1→R2”“西: R3”四条链；每条记录同时处在类别链和地区链中。倒排文件则集中保存“X→[R1,R3]”“东→[R1,R2]”等倒排列表。',
          'Let R1(id=101, category=X, region=East), R2(102,Y,East) and R3(103,X,West). A multilist might build X: R1→R3, Y: R2, East: R1→R2 and West: R3; each record belongs to both a category and a region chain. An inverted file instead stores X→[R1,R3], East→[R1,R2] and so on as centralized lists.',
        ],
        points: [
          ['多重表把链接分散在记录里，倒排文件把记录 ID 集中在倒排表中。', 'A multilist distributes links across records; an inverted file centralizes record ids in posting lists.'],
          ['多重表的查询沿链前进，结果天然按链顺序出现；倒排查询通常需要集合运算。', 'Multilist queries walk a chain and see results in chain order; inverted queries usually perform set operations.'],
          ['多重表与普通单链表、邻接表都使用指针，但语义是“记录成员关系”，不是线性表次序或图邻接。', 'Multilists, ordinary linked lists and adjacency lists all use pointers, but the semantics here are record membership, not list order or graph adjacency.'],
        ],
      },
      {
        title: ['按条件访问与维护', 'Access and maintenance by condition'],
        body: [
          '按类别 X 查询时取 X 链头，沿链读取全部记录；若还要地区为东，则要对链中记录再做条件判断，或沿地区链求交。插入一条新记录时，要把它接到所有字段对应的链尾或链头，并更新相关链头。删除时要从每条链上摘除，不能只断一条。',
          'For category X, start at the X head and read the chain; if region East is also required, test each record or intersect with the region chain. Inserting a new record links it into every field chain and updates the heads. Deletion must unlink it from every chain, not just one.',
        ],
        points: [
          ['链头入口数量由不同字段值数量决定，而不是由记录数决定。', 'The number of head entries depends on distinct field values, not record count.'],
          ['多条链共享记录节点时，删除必须同步所有指针；遗漏会留下悬空成员。', 'When several chains share a record node, deletion must update every pointer or leave stale membership.'],
          ['多重表适合按单个次关键字顺序遍历；多条件交集仍可能需要在链上过滤。', 'Multilists suit traversal by one secondary key; multi-condition intersections may still filter along a chain.'],
        ],
      },
    ],
    comparison: {
      title: ['多重表与倒排文件', 'Multilist and inverted file'],
      columns: [['维度', 'Dimension'], ['多重表', 'Multilist'], ['倒排文件', 'Inverted file']],
      rows: [
        [['记录 ID 位置', 'Record ids'], ['链接藏在记录中', 'Links live in records'], ['集中在倒排列表', 'Centralized in posting lists']],
        [['单关键字查询', 'Single-key query'], ['沿链顺序读取', 'Walk one chain'], ['直接读列表/做集合运算', 'Read a list or set operation']],
        [['多关键字查询', 'Multi-key query'], ['链上过滤或链间求交', 'Filter a chain or intersect chains'], ['列表交集/并集', 'Intersect/union lists']],
        [['更新', 'Update'], ['维护多条链指针', 'Maintain several link pointers'], ['维护多个倒排表', 'Maintain several posting lists']],
        [['空间', 'Space'], ['每记录多个指针', 'Several pointers per record'], ['每个倒排项保存记录 ID', 'Record ids stored in every posting list']],
      ],
    },
    takeaway: [
      '多重表把“同一记录属于多个关键字值”的关系分散成多条链；查询沿链，删除要拆掉所有链，不能把它当成普通单链表。',
      'A multilist distributes “one record belongs to several key values” into multiple chains. Queries walk a chain, and deletion must unlink every chain; it is not an ordinary singly linked list.',
    ],
  },

  {
    id: 'inverted-file',
    topicId: 'inverted-structure',
    title: ['倒排文件：从记录含有关键字到关键字对应记录', 'Inverted files: from record keywords to keyword postings'],
    chapter: ['第 12 章 · 文件', 'Chapter 12 · Files'],
    summary: [
      '倒排文件为每个次关键字建立一张倒排表，保存包含该关键字的记录 ID。查询不再逐记录判断，而是读取相关倒排表并做集合运算：AND 取交集，OR 取并集，最后把记录 ID 映射回原记录。它适合多关键字检索，但倒排表本身会占用空间并需要随记录更新。',
      'An inverted file builds a posting list per secondary key, storing the ids of records containing that key. A query reads the relevant lists and applies set operations—AND for intersection, OR for union—then maps ids back to original records. It suits multi-key retrieval, but posting lists consume space and must be maintained as records change.',
    ],
    diagram: 'inverted-file',
    definitions: [
      {
        term: ['倒排表', 'Posting list'],
        text: [
          '某个关键字对应的记录 ID 集合或列表。一个关键字可以有多个记录，一个记录也可出现在多个倒排表中。',
          'The set or list of record ids for one term. A term may occur in many records, and one record may appear in several lists.',
        ],
      },
      {
        term: ['倒排索引', 'Inverted index'],
        text: [
          '关键字到倒排表的有序集合。索引项至少包含关键字与列表入口，可按关键字直接取得列表。',
          'An ordered collection mapping terms to posting lists. Each entry contains at least a term and a list entry, so a list is retrieved directly by term.',
        ],
      },
      {
        term: ['AND 查询', 'AND query'],
        text: [
          '只有包含全部查询词的记录才保留。实现上对各倒排表求交集，结果仍引用原记录。',
          'Only records containing every query term remain. Implementation intersects the posting lists, and the result still references original records.',
        ],
      },
      {
        term: ['OR 查询', 'OR query'],
        text: [
          '包含任一查询词的记录都保留。实现上对各倒排表求并集，并去除重复记录 ID。',
          'Records containing at least one query term remain. Implementation unions the posting lists and removes duplicate record ids.',
        ],
      },
      {
        term: ['构建与更新', 'Build and update'],
        text: [
          '构建时扫描每条记录，把它已分好的关键字逐个加入对应倒排表。插入记录要追加到所有相关表；删除记录要从所有相关表中摘除。',
          'Construction scans every record and adds its segmented keywords to the corresponding lists. Inserting a record appends to every related list; deleting removes it from every related list.',
        ],
      },
    ],
    sections: [
      {
        title: ['一个最小倒排例子', 'A minimal inverted example'],
        body: [
          '记录 R1 含“数据结构、算法”，R2 含“算法、排序”，R3 含“数据结构、排序”。构建后“数据结构 → R1,R3”“算法 → R1,R2”“排序 → R2,R3”。查询“算法 AND 排序”读取后两张表求交，得到 R2；查询“算法 OR 排序”求并，得到 R1,R2,R3。',
          'R1 contains “data structures, algorithms”, R2 contains “algorithms, sorting” and R3 contains “data structures, sorting”. The lists become data structures→R1,R3, algorithms→R1,R2, sorting→R2,R3. “algorithms AND sorting” intersects to R2; “algorithms OR sorting” unions to R1,R2,R3.',
        ],
        points: [
          ['必须区分记录 ID、关键字和倒排列表三种对象；结果返回的是记录 ID。', 'Distinguish record id, term and posting list; the result contains record ids.'],
          ['一个关键字可对应多个记录，不能把倒排表误当成唯一键索引。', 'One term may map to many records; a posting list is not a unique-key index.'],
          ['构建顺序可以不同，但最终每个倒排表必须与记录的完整关键字集合一致。', 'Build order may vary, but every final posting list must match the complete record keyword sets.'],
          ['本课程输入已分好词；不实现中文分词器或全文搜索语法。', 'This course accepts pre-segmented keywords; it does not implement a Chinese tokenizer or full-text query grammar.'],
        ],
      },
      {
        title: ['集合运算与结果顺序', 'Set operations and result order'],
        body: [
          '倒排表本身通常按记录 ID 或记录物理顺序排列。AND/OR 的可交换性只保证集合相同；若结果要按输入记录顺序展示，应在最后按记录顺序过滤，而不是依赖集合的偶然迭代次序。',
          'Posting lists are usually ordered by record id or physical order. AND/OR commutativity guarantees the same set, not the same display order. If results follow input record order, filter in record order at the end rather than relying on incidental set iteration.',
        ],
        points: [
          ['AND 的第一张表不能直接作为最终答案，必须与后续表继续求交。', 'The first AND list is not the final answer; it must be intersected with later lists.'],
          ['OR 求并集时必须去重，同一条记录不能重复返回。', 'OR union must deduplicate; one record cannot be returned twice.'],
          ['缺失关键字的倒排表为空；AND 结果立即为空，OR 不增加记录。', 'A missing term has an empty list: an AND result becomes empty, while OR adds nothing.'],
          ['倒排表长、关键字多、查询词交叠多时，集合运算与 I/O 都会增加。', 'Long lists, many terms and overlapping queries increase set work and I/O.'],
        ],
      },
      {
        title: ['与多重表的差别', 'Difference from a multilist'],
        body: [
          '多重表让记录携带多个链指针，查询沿链遍历；倒排文件把同一关键字的记录 ID 集中成表，查询直接读取列表并做集合运算。前者更新要改记录内指针，后者更新要改多个倒排表。',
          'A multilist makes records carry several link pointers and queries walk a chain. An inverted file centralizes record ids for a term into a list and queries read lists and compute sets. The former updates pointers inside records; the latter updates several posting lists.',
        ],
      },
    ],
    comparison: {
      title: ['倒排索引与普通关键字索引', 'Inverted index and ordinary key index'],
      columns: [['维度', 'Dimension'], ['倒排索引', 'Inverted index'], ['普通主关键字索引', 'Ordinary primary-key index']],
      rows: [
        [['映射方向', 'Direction'], ['关键字 → 多条记录', 'Term → many records'], ['关键字 → 唯一记录/块', 'Key → one record or block']],
        [['结果数量', 'Result count'], ['可为零、一条或多条', 'Zero, one or many'], ['通常零或一条', 'Usually zero or one']],
        [['查询方式', 'Query form'], ['读取多个列表并求交/并', 'Read several lists and intersect/union'], ['定位一个地址并确认', 'Locate one address and confirm']],
        [['典型用途', 'Typical use'], ['多关键字/属性检索', 'Multi-key or attribute retrieval'], ['主关键字点查', 'Primary-key point lookup']],
      ],
    },
    takeaway: [
      '倒排文件把“记录包含哪些词”翻转为“每个词对应哪些记录”。查询是对倒排表做集合运算，结果必须回到原记录 ID。',
      'An inverted file reverses “which terms does a record contain?” into “which records contain each term?” Queries operate on posting lists, and results must map back to original record ids.',
    ],
  },

  {
    id: 'file-comparison',
    topicId: 'file-comparison',
    title: ['文件组织方式比较：按块、索引与查询前提分析', 'Comparing file organizations by blocks, indexes and query assumptions'],
    chapter: ['第 12 章 · 文件', 'Chapter 12 · Files'],
    summary: [
      '比较文件组织不能只写 O(1)、O(log n)、O(n)。必须说明块大小、索引高度、是否常驻内存、是否允许溢出、缓存假设以及查询是点查还是范围/多关键字检索。顺序文件适合有序扫描，索引文件缩小点查范围，ISAM/VSAM 强调索引顺序访问，散列文件适合点查，多重表与倒排文件解决多关键字检索。',
      'File organizations cannot be ranked by O(1), O(log n) or O(n) alone. The comparison must state block size, index height, memory residency, overflow policy, cache assumptions and whether the query is a point lookup, range scan or multi-key retrieval. Sequential files favour ordered scans; indexed files reduce point-lookup scope; ISAM/VSAM emphasize index-sequential access; hashed files favour point lookup; multilists and inverted files address multi-key retrieval.',
    ],
    diagram: 'file-comparison',
    definitions: [
      {
        term: ['组织方式', 'Organization'],
        text: [
          '记录在文件中的逻辑顺序及辅助定位结构。它决定按什么路径找到记录，而不只是记录放在哪个块。',
          'The logical record order plus auxiliary locating structures. It determines the access path, not merely which block stores a record.',
        ],
      },
      {
        term: ['访问方式', 'Access method'],
        text: [
          '顺序访问、直接/随机访问与范围访问是对操作方式的描述；同一种组织可以支持多种访问，但代价不同。',
          'Sequential, direct/random and range access describe operations. One organization may support several access modes at different costs.',
        ],
      },
      {
        term: ['空间开销', 'Space overhead'],
        text: [
          '除记录本身外，索引项、链指针、溢出块、倒排表都占空间。评价组织方式必须把辅助结构计入。',
          'Beyond records, index entries, link pointers, overflow blocks and posting lists consume space. Auxiliary structures count in the total.',
        ],
      },
      {
        term: ['适用前提', 'Applicability preconditions'],
        text: [
          '索引要求关键字与块边界一致；稀疏索引要求块内有序；ISAM 依赖主区有序；倒排要求关键字已分好；散列依赖可接受的冲突率。',
          'Indexes require key-to-block consistency; sparse indexes require ordered blocks; ISAM depends on an ordered main area; inverted files require segmented terms; hashing requires an acceptable collision rate.',
        ],
      },
    ],
    sections: [
      {
        title: ['怎样读这张比较表', 'How to read the comparison table'],
        body: [
          '“点查”指按一个主关键字找唯一记录；“范围”指按关键字区间连续返回；“多关键字”指用多个次关键字条件筛选。表中的“适合”是组织本身的能力，不代表在任意块大小和任意装填因子下都更快。',
          'Point lookup finds one unique record by primary key; range access returns a contiguous key interval; multi-key retrieval filters by several secondary conditions. “Suitable” describes the organization’s capability, not a guarantee that it is faster under every block size and load factor.',
        ],
        points: [
          ['顺序文件的有序版本支持范围；无序版本的范围查询只能全扫后整理。', 'An ordered sequential file supports ranges; an unordered one requires a full scan and extra ordering.'],
          ['索引文件与 ISAM/VSAM 都需要索引维护；溢出或索引膨胀会改变实际代价。', 'Indexed, ISAM and VSAM files all need index maintenance; overflow or index growth changes actual cost.'],
          ['散列文件点查快的前提是哈希分布较均匀且溢出链不长。', 'Hashed point lookup is fast only when hashing is reasonably uniform and overflow chains stay short.'],
          ['多重表与倒排都支持多关键字，但一个沿链更新指针，一个维护集中倒排表。', 'Multilists and inverted files both support multi-key retrieval, but one maintains pointers in chains and the other maintains centralized lists.'],
        ],
      },
      {
        title: ['I/O 估算是带前提的', 'I/O estimates carry assumptions'],
        body: [
          '若索引高度为 h、每次索引层访问读一块，点查至少读 h 个索引块与 1 个数据块；若上层索引常驻内存，则外存索引读会减少。散列点查通常读 1 个主桶块，若溢出链长度 e，则再加 e 个块。顺序扫描则按整个文件块数计。不同课程的小模型采用不同计数规则，界面必须明确说明。',
          'If the index has height h and each level costs one block, a point lookup reads at least h index blocks plus one data block; memory-resident upper levels reduce external index reads. A hash point lookup reads one primary bucket block and e additional blocks for an overflow chain of length e. A full scan counts all file blocks. Each teaching model must state its own counting rule.',
        ],
        points: [
          ['缓存命中会改变实际 I/O，但本课程不将模拟计数冒充真实缓存测量。', 'Cache hits change real I/O, but this course does not present simulated counts as real cache measurements.'],
          ['块更大通常会减少块数，却可能增加每次传输的数据量和块内比较。', 'Larger blocks often reduce block count but increase transfer volume and in-block comparisons.'],
          ['索引高度、溢出链长度和装填因子是动态量，不能只给一个固定复杂度。', 'Index height, chain length and load factor are dynamic quantities; a single fixed complexity is insufficient.'],
        ],
      },
      {
        title: ['全书覆盖收尾', 'End of the textbook coverage'],
        body: [
          '第 12 章完成后，12 章教材目录均有已完成的理论页或动态课程。普通教材例子没有独立播放器不算缺陷；只有核心结构或核心操作缺失才记为知识缺口。顺序文件扫描复用第 9 章查找课，VSAM 索引复用第 9 章 B+ 树课，散列文件复用第 9 章哈希课。',
          'With Chapter 12 complete, every chapter in the 12-chapter directory has finished theory pages or runnable courses. A textbook example without its own player is not a defect; only a missing core structure or operation counts as a knowledge gap. Sequential scanning reuses Chapter 9 search, VSAM indexing reuses Chapter 9 B+ trees, and hashed files reuse Chapter 9 hashing.',
        ],
      },
    ],
    comparison: {
      title: ['七种文件组织方式', 'Seven file organizations'],
      columns: [
        ['比较维度', 'Dimension'],
        ['顺序文件', 'Sequential'],
        ['索引文件', 'Indexed'],
        ['ISAM', 'ISAM'],
        ['VSAM（教材模型）', 'VSAM (textbook)'],
        ['散列文件', 'Hashed'],
        ['多重表', 'Multilist'],
        ['倒排文件', 'Inverted'],
      ],
      rows: [
        [
          ['记录组织', 'Record organization'],
          ['按到达或关键字顺序连续存放', 'Contiguous by arrival or key order'],
          ['数据区 + 关键字索引', 'Data area + key index'],
          ['有序主区 + 溢出链 + 索引层', 'Ordered main area + chains + index'],
          ['索引区域 + 顺序数据区域', 'Index region + sequence data region'],
          ['按哈希桶分布', 'Distributed by hash buckets'],
          ['记录携带多条次关键字链', 'Records carry several secondary chains'],
          ['关键字 → 倒排记录表', 'Term → posting lists'],
        ],
        [
          ['点查定位', 'Point lookup'],
          ['有序时可从块边界起步', 'May start from block bounds when ordered'],
          ['索引项 → 数据块 → 块内确认', 'Entry → block → in-block confirm'],
          ['索引上界 → 主块 → 溢出链', 'Bound → main block → chain'],
          ['索引定位顺序数据区', 'Index locates sequence data'],
          ['哈希函数 → 桶 → 溢出', 'Hash → bucket → overflow'],
          ['沿对应次关键字链', 'Follow the matching secondary chain'],
          ['读取倒排表并做集合运算', 'Read lists and compute sets'],
        ],
        [
          ['范围查询', 'Range query'],
          ['有序版本适合；无序需全扫', 'Ordered version suits; unordered needs scan'],
          ['有序索引可支持', 'Supported with ordered indexes'],
          ['主区有序，但链可能干扰', 'Main area ordered; chains may interfere'],
          ['支持顺序/范围读取', 'Supports sequential/range reads'],
          ['通常不适合', 'Usually unsuitable'],
          ['需在链上过滤或配合其他结构', 'Filter chains or combine structures'],
          ['可用排序后的倒排/额外索引', 'With sorted postings or another index'],
        ],
        [
          ['多关键字检索', 'Multi-key retrieval'],
          ['需额外索引或多次扫描', 'Needs extra indexes or repeated scans'],
          ['通常针对主/单个索引', 'Usually one key or index'],
          ['主要针对索引字段', 'Primarily index fields'],
          ['主要针对索引字段', 'Primarily index fields'],
          ['不支持，需额外结构', 'Not supported without extra structures'],
          ['支持，沿多条链组合', 'Supports by combining chains'],
          ['支持，列表交/并', 'Supports via list intersection/union'],
        ],
        [
          ['更新维护', 'Update maintenance'],
          ['保持有序可能移动/分裂', 'Ordered form may shift/split'],
          ['维护索引项与数据块', 'Maintain entries and blocks'],
          ['溢出链与索引上界；需重组', 'Chains and bounds; reorganize'],
          ['索引与数据组织动态维护', 'Maintain index and data organization'],
          ['桶满产生溢出；关注装填因子', 'Overflow on full buckets; load factor'],
          ['维护所有相关链指针', 'Maintain every related chain'],
          ['维护所有倒排表', 'Maintain every posting list'],
        ],
        [
          ['空间开销', 'Space overhead'],
          ['主要是记录与块内空洞', 'Records plus internal holes'],
          ['索引项 + 数据块', 'Index entries + data blocks'],
          ['主区 + 索引 + 溢出块', 'Main area + index + overflow'],
          ['索引区域 + 数据区域', 'Index region + data region'],
          ['主桶 + 溢出块', 'Primary buckets + overflow'],
          ['每记录多个链指针 + 链头', 'Several pointers per record + heads'],
          ['倒排表保存记录 ID', 'Posting lists store record ids'],
        ],
        [
          ['适用场景', 'Best use'],
          ['批量顺序处理、按主键范围', 'Bulk sequential work and primary ranges'],
          ['主键点查、索引可管理', 'Primary point lookup with manageable index'],
          ['相对静态、可定期重组的索引顺序文件', 'Relatively static index-sequential files'],
          ['顺序/范围访问为主的索引文件', 'Indexed files dominated by sequential/range access'],
          ['均匀哈希下的主键点查', 'Primary lookup under uniform hashing'],
          ['按单个次关键字遍历、记录可多链', 'Single secondary traversal with multi-chain records'],
          ['多关键字/属性组合检索', 'Multi-key or attribute-combination retrieval'],
        ],
      ],
    },
    takeaway: [
      '文件组织方式没有绝对冠军：先看查询是点查、范围还是多关键字，再看块大小、索引高度、溢出与维护成本；复杂度和 I/O 估算必须带前提。',
      'No file organization wins universally: identify point, range or multi-key queries first, then account for block size, index height, overflow and maintenance. Complexity and I/O estimates always carry assumptions.',
    ],
  },
];

// Kept as a named export so the catalog can spread it without special cases.
export const FILE_CONCEPT_PAGES = FILE_STRUCTURE_CONCEPT_PAGES;
