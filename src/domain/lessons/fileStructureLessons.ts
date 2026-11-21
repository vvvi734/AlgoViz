import type { Lesson } from './types';

/**
 * TEXTBOOK-12 courses. Step ids are the exact `lesson_step` strings emitted by
 * the real Python programs; they must never be translated or renamed.
 */
export const indexedFileLesson: Lesson = {
  lessonId: 'indexed-file-lookup',
  algorithmId: 'file-index',
  contentVersion: '1.0.0',
  title: {
    zh: '索引文件查找：先查索引，再读目标块',
    en: 'Indexed-file lookup: probe the index, then read the target block',
  },
  oneLiner: {
    zh: '索引项把关键字与文件块相连；查找先选索引项，只读一个数据块，再在块内确认记录。',
    en: 'An index entry links a key to a file block; a lookup chooses an entry, reads exactly one data block, then confirms the record inside.',
  },
  overview: {
    zh: '本课程把一个有序记录文件切成若干数据块，并按稠密或稀疏规则建立一级索引。稠密索引为每条记录保留一项；稀疏索引只保留每块首键或上界。查找时逐个检查索引项，选择“不大于目标的最后一项”，读取它指向的数据块，再逐条比较块内记录。无论成功还是失败，恰好读取一个数据块；索引表固定按一个索引块计。模拟 I/O 只用于说明前提，不代表真实磁盘测量。',
    en: 'This course splits an ordered record file into data blocks and builds a one-level index, either dense or sparse. A dense index has one entry per record; a sparse index keeps only each block’s first key or upper bound. A lookup probes entries, chooses the last entry not above the target, reads its block, and compares records inside. Exactly one data block is read on success or failure; the index table counts as one index block. Simulated I/O states assumptions, not real disk measurements.',
  },
  intuition: {
    zh: '把索引想成一排路牌：每个路牌写着“到这个关键字为止，去某条街”。你不必走遍所有街区，只需选对路牌，进那条街逐户确认。稠密索引把每户门牌都写在路牌上；稀疏索引只在街口写一个范围，省牌子但要多走几步。',
    en: 'Think of the index as signs saying “up to this key, take that street.” You choose the right sign and check houses on that street instead of walking every street. A dense index lists every house number; a sparse index marks only street ranges, saving signs but requiring a short walk inside.',
    },
  prerequisites: {
    zh: ['理解记录、字段与文件块', '知道块内与块间按关键字有序', '能区分索引项的关键字与地址'],
    en: ['Understanding records, fields and file blocks', 'Knowing keys are ordered inside and across blocks', 'Distinguishing an entry’s key from its address'],
  },
  complexity: {
    time: 'O(E + B)，E 为实际检查的索引项数，B 为块内记录数',
    space: 'O(n) 稠密索引 / O(n/B) 稀疏索引，外加数据块',
    note: {
      zh: '本课程只建一级索引，索引项线性检查，因此不伪装成 B+ 树的 O(log n)。实际代价还取决于索引是否常驻内存、索引块大小和块内记录数；界面分别显示索引项检查数与数据块读取数。',
      en: 'This course builds a one-level index and probes entries linearly, so it does not pretend to be an O(log n) B+ tree. Real cost also depends on memory residency, index-block size and records per block; the UI reports index probes and data-block reads separately.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 排序、分块并建立索引', en: '① Sort, block and build the index' },
      explanation: {
        zh: '真实 Python 先按关键字排序输入记录，再按块容量切块。稠密索引为每条记录生成一项；稀疏索引只为每块最后一条记录生成一项，该项关键字就是该块上界。数据块内部与块间都必须有序，否则索引定位没有依据。',
        en: 'Real Python sorts records by key and splits them by block capacity. A dense index creates one entry per record; a sparse index creates one entry per block using the block’s last key as its upper bound. Keys must be ordered inside and across blocks, or index routing has no basis.',
      },
      tip: {
        zh: '索引项的关键字必须真实出现在数据块中，不能凭空估计。',
        en: 'An entry key must actually occur in its data block; it cannot be invented.',
      },
    },
    {
      stepId: 'index-probe',
      title: { zh: '② 逐个检查索引项', en: '② Probe index entries one by one' },
      explanation: {
        zh: '从第一项开始比较：若等于目标，直接选它；若大于目标，停止并保留上一项；若小于目标，继续。若目标小于首项，选择首项；若大于所有项，选择最后一项。每次检查都让 index probes 加一，界面显示当前索引位置。',
        en: 'Compare from the first entry: equality selects it immediately; a larger key stops and keeps the previous entry; a smaller key continues. A target below the first key selects the first entry, and one above every key selects the last. Each probe increments the counter and exposes the current index position.',
      },
      tip: {
        zh: '稀疏索引选择的是“不大于目标的最后一项”，不是第一个大于目标的项。',
        en: 'A sparse index chooses the last entry not above the target, never the first entry above it.',
      },
    },
    {
      stepId: 'read-block',
      title: { zh: '③ 读取索引项指向的数据块', en: '③ Read the block addressed by the entry' },
      explanation: {
        zh: '选定索引项后，取它的 blockId 并读取整块。块读取计数加一；不论目标是否在块内，这次读块都已发生。若索引项地址与真实块不一致，课程会在校验阶段拒绝该 Trace。',
        en: 'After choosing an entry, take its blockId and read the whole block. The block-read count increments; the read happens whether or not the target is present. If an entry address disagrees with the real block, validation rejects the trace.',
      },
      tip: {
        zh: '不能只读取块中的一条记录：外存传输单位是块。',
        en: 'You cannot read only one record from the block: the transfer unit is the whole block.',
      },
    },
    {
      stepId: 'compare',
      title: { zh: '④ 在目标块内逐条比较', en: '④ Compare records inside the target block' },
      explanation: {
        zh: '按块内顺序比较每条记录的关键字。相等则下帧标记 found；若块内已越过目标或扫描完仍不相等，则记 not-found。稠密索引仍需这一步确认记录确实存在，索引只保证“去哪块”，不替代真实比较。',
        en: 'Compare keys in block order. Equality marks found on the next frame; passing the target or exhausting the block without equality leads to not-found. Even a dense index needs this confirmation: the index says where to look, not that the record exists.',
      },
      tip: {
        zh: '稀疏索引的块内扫描是设计的一部分，不是实现缺陷。',
        en: 'The in-block scan of a sparse index is part of the design, not an implementation defect.',
      },
    },
    {
      stepId: 'found',
      title: { zh: '⑤ 命中：记录 ID 与关键字一致', en: '⑤ Hit: record id and key agree' },
      explanation: {
        zh: '命中帧把具体记录 ID 标为结果，并保留目标块、关键字和已读块数。校验器会确认该记录的 key 等于目标，且它确实位于当前块，防止动画只显示一个无关的“成功”。',
        en: 'The hit frame marks the concrete record id and keeps the block, key and read count. Validation confirms that the record’s key equals the target and that it really belongs to the current block, preventing an unrelated “success” label.',
      },
      tip: {
        zh: '命中记录必须来自刚读入的块，不能来自其他块。',
        en: 'The hit record must come from the block just read, not another block.',
      },
    },
    {
      stepId: 'not-found',
      title: { zh: '⑥ 失败：索引定位正确但块内无目标', en: '⑥ Miss: routing was valid but the block lacks the key' },
      explanation: {
        zh: '失败不是“索引没查”或“块没读”。课程仍会记录一个数据块读取，并把结果标为 not-found；若目标落在边界外，所选首块或末块同样被真实读取。这样失败路径与成功路径具有可比较的 I/O。',
        en: 'A miss is not “no index probe” or “no block read.” The course still records one data-block read and reports not-found; a target outside the key range still reads the first or last block. Success and failure paths therefore have comparable I/O.',
      },
      tip: {
        zh: '失败结果必须与“目标不在任何块中”的真实状态一致。',
        en: 'A miss must agree with the real state that the target is absent from every block.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑦ 结束：索引项、块地址与结果一致', en: '⑦ Done: entries, addresses and result agree' },
      explanation: {
        zh: '完成帧汇总索引项检查数、数据块读取数和结果。校验器检查索引键与块上界、块地址、记录归属以及命中/失败结论；同时要求恰好读取一个数据块。索引表按一个索引块计，缓存不纳入模型。',
        en: 'The done frame summarises index probes, data-block reads and the result. Validation checks entry keys against block bounds, addresses, record membership and the final hit/miss; it also requires exactly one data-block read. The index table counts as one index block and caching is excluded.',
      },
      tip: {
        zh: '模拟 I/O 计数只反映本课程的块假设，不能当作真实磁盘性能。',
        en: 'Simulated I/O reflects this course’s block assumptions, not real disk performance.',
      },
    },
  ],
  commonMistakes: {
    zh: [
      '把稀疏索引选成“第一个大于目标的项”，导致目标块前移。',
      '索引命中后不再块内比较，直接把索引项当成记录。',
      '只读目标记录而不读整块，违反外存传输单位。',
      '索引项地址与真实块号不一致，却仍宣布查找成功。',
      '失败路径不计数据块读取，导致成功与失败 I/O 不可比。',
      '把一级索引的线性索引检查说成 B+ 树的 O(log n)。',
      '把模拟块计数当成真实磁盘测量。',
    ],
    en: [
      'Choosing the first entry above the target instead of the last entry not above it.',
      'Skipping the in-block comparison and treating an index entry as the record itself.',
      'Reading one record instead of the whole block, violating the external transfer unit.',
      'Announcing success while an entry address disagrees with the real block.',
      'Not counting the data-block read on a miss, making success and failure I/O incomparable.',
      'Calling the linear one-level index probe an O(log n) B+ tree.',
      'Presenting simulated block counts as real disk measurements.',
    ],
  },
};

export const isamLesson: Lesson = {
  lessonId: 'isam-overflow-chain',
  algorithmId: 'isam',
  contentVersion: '1.0.0',
  title: {
    zh: 'ISAM 文件：主区、索引上界与溢出链',
    en: 'ISAM files: main area, index bounds and overflow chains',
  },
  oneLiner: {
    zh: 'ISAM 先用索引上界选主块，再扫描主块；主块满时插入该块专属溢出链，并可能刷新上界。',
    en: 'ISAM selects a main block by index bounds, scans it, and sends overflow insertions to that block’s private chain while refreshing bounds when needed.',
  },
  overview: {
    zh: 'ISAM 把记录按关键字有序放入主数据区，每块有一个容量上限。索引层保存每个主块及其溢出链的最大关键字。查找选择第一个上界不小于目标的主块；若目标大于全部上界，则选择最后一块。读入主块后块内比较，未命中再沿该块的溢出链继续。插入先选块：有空间就按序插入主区；块满则追加到专属溢出链，必要时建立新节点、维护 next 链接并刷新索引上界。插入后程序会真实重查新记录，以证明结构可检索。',
    en: 'ISAM places records in key order in a main data area, with a capacity per block. The index stores the maximum key of each main block and its overflow chain. A lookup chooses the first block whose bound is not below the target, or the last block when the target exceeds every bound. It scans the main block, then follows that block’s chain. Insertion selects a block: with space it inserts in order; when full it appends to the private chain, creating a node, maintaining next and refreshing the bound. A real re-lookup then proves the new record is retrievable.',
  },
  intuition: {
    zh: '主数据区像一排容量固定的抽屉，每个抽屉贴着“本抽屉最大编号”的标签。找东西先看标签选抽屉；抽屉塞满后，新物品放进抽屉背后的挂袋，挂袋之间用绳子串起来。标签若因挂袋里的编号变大，就要改写。',
    en: 'The main area is a row of fixed-capacity drawers, each labelled with its largest key. A lookup chooses a drawer by its label. When a drawer is full, new items go into bags behind it, linked by a rope. If a bag enlarges the drawer’s maximum, the label must be rewritten.',
  },
  prerequisites: {
    zh: ['理解有序主数据区与索引上界', '知道溢出记录仍属于原主块', '能区分主块命中与溢出链命中'],
    en: ['Understanding an ordered main area and index bounds', 'Knowing overflow records still belong to their main block', 'Distinguishing a main-block hit from a chain hit'],
  },
  complexity: {
    time: 'O(E + C + B)，E 索引项、C 溢出链节点、B 块内记录',
    space: '主区 O(n) + 索引 O(块数) + 溢出区 O(溢出记录)',
    note: {
      zh: '本课程把索引检查、主块读取和每个实际访问的溢出节点分别计数。索引是一层上界表，不是 B+ 树；溢出链越长，查找越接近顺序扫描。定期重组会改变链长，但本课程不模拟完整重组过程。',
      en: 'The course counts index probes, the one main-block read and every visited overflow node separately. The index is a one-level bound table, not a B+ tree; longer chains approach a sequential scan. Periodic reorganization changes chain length, but this course does not simulate full reorganization.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 建立有序主块、索引上界与空链', en: '① Build ordered main blocks, bounds and empty chains' },
      explanation: {
        zh: '输入记录按关键字排序后按容量切块，每块记录一个上界，初始溢出链为空。校验器要求主块内部有序、记录只属于一个块、块数在限制内，并确认索引上界等于该块当前最大键。',
        en: 'Records are sorted by key and split by capacity; each block records an upper bound and starts with an empty chain. Validation requires ordered blocks, unique record membership and a bounded block count, and checks that each bound equals the block’s current maximum.',
      },
      tip: {
        zh: '上界不是“下一块的首键”，而是本块（含溢出）的最大键。',
        en: 'The bound is this block’s maximum key including overflow, not the next block’s first key.',
      },
    },
    {
      stepId: 'index-probe',
      title: { zh: '② 用上界选择主块', en: '② Select a main block by bounds' },
      explanation: {
        zh: '从索引第一项开始，找第一个上界不小于目标的主块。若目标大于所有上界，则选择最后一个主块，让边界外目标仍有一个确定的检查位置。索引检查次数独立于主块读取次数。',
        en: 'Probe from the first entry for the first bound not below the target. If the target exceeds every bound, choose the last block so an out-of-range key still has a definite place to check. Index probes are counted separately from main-block reads.',
      },
      tip: {
        zh: '选择最后一块不是“目标一定在最后一块”，只是边界外的确定落点。',
        en: 'Choosing the last block does not mean the target is there; it is merely a definite landing point outside the range.',
      },
    },
    {
      stepId: 'read-main',
      title: { zh: '③ 读入主块并准备块内扫描', en: '③ Read the main block and prepare the scan' },
      explanation: {
        zh: '主块读取计数加一，当前块被设为选中块。块内记录按关键字顺序排列，后续比较从第一条开始。即使主块已满，读取的仍是主块本身；溢出链尚未访问。',
        en: 'The main-read count increments and the selected block becomes current. Records are in key order and comparisons start at the first one. Even a full block is read as the main block; the overflow chain has not been visited yet.',
      },
      tip: {
        zh: '主区读取与溢出读取是两种独立事件，不能合并成一个计数。',
        en: 'Main-area reads and overflow reads are separate events and cannot share one counter.',
      },
    },
    {
      stepId: 'compare',
      title: { zh: '④ 在主块内比较记录', en: '④ Compare records in the main block' },
      explanation: {
        zh: '逐条比较关键字。命中则转到 found；若扫描完主块仍未命中且该块有溢出链，则转到溢出读取。比较帧只标记当前记录，不改动链结构。',
        en: 'Compare keys one by one. A hit leads to found; exhausting the main block without a hit and with a non-empty chain leads to overflow. The compare frame marks the current record without changing links.',
      },
      tip: {
        zh: '主块命中时不应继续读溢出链，否则会多算 I/O。',
        en: 'A main-block hit must not continue into the chain, or I/O is overcounted.',
      },
    },
    {
      stepId: 'read-overflow',
      title: { zh: '⑤ 沿专属溢出链继续读取', en: '⑤ Follow the private overflow chain' },
      explanation: {
        zh: '从被选主块的 overflowHead 开始，逐个节点读取并比较。每个实际访问的节点增加一次溢出读；nextId 为空表示链尾。链不能跨到别的主块，也不能形成环。',
        en: 'Start at the selected block’s overflowHead, read each node and compare. Every visited node adds one overflow read; a null nextId ends the chain. A chain cannot cross into another block or form a cycle.',
      },
      tip: {
        zh: '溢出节点仍属于原主块；别的块不能借用这条链。',
        en: 'Overflow nodes still belong to the original block; another block cannot share the chain.',
      },
    },
    {
      stepId: 'found',
      title: { zh: '⑥ 命中：结果可能来自主区或溢出区', en: '⑥ Hit: the record may be in the main area or overflow' },
      explanation: {
        zh: '命中帧给出记录 ID，并保留主块、已访问的溢出节点与两种读取计数。校验器会比较记录的实际归属，确保界面说明“主区命中”或“溢出区命中”没有说反。',
        en: 'The hit frame reports the record id and keeps the block, visited overflow nodes and both read counts. Validation checks the record’s actual membership so the UI cannot swap “main-area hit” and “overflow hit.”',
      },
      tip: {
        zh: '结果正确不仅要求记录存在，还要求命中位置说明正确。',
        en: 'A correct result requires both the right record and the right location description.',
      },
    },
    {
      stepId: 'not-found',
      title: { zh: '⑦ 失败：主块与链都未命中', en: '⑦ Miss: neither the block nor its chain contains the key' },
      explanation: {
        zh: '只有主块扫描与整条溢出链访问都结束后才可报告失败。若链中有节点尚未访问，不能提前断言不存在。失败帧保留全部已读节点，便于对照 I/O。',
        en: 'A miss can be reported only after both the main block and the complete chain have been examined. If any node remains unvisited, absence cannot be asserted. The miss frame keeps every read node so I/O is comparable.',
      },
      tip: {
        zh: '“主块没有”不等于“文件没有”；还要看链。',
        en: '“Not in the main block” is not “not in the file”; the chain still matters.',
      },
    },
    {
      stepId: 'insert-main',
      title: { zh: '⑧ 插入主区：块内有空间', en: '⑧ Insert into the main area when space remains' },
      explanation: {
        zh: '按与查找相同的规则选块。若块内记录数小于容量，把新记录按关键字顺序插入，保持块内有序。若新记录成为该块最大键，随后发出 index-update 帧刷新上界。',
        en: 'Select a block by the same rule as lookup. If the block holds fewer records than capacity, insert the new record in key order. If it becomes the block maximum, an index-update frame refreshes the bound.',
      },
      tip: {
        zh: '插入后块内仍须有序，不能简单追加到末尾。',
        en: 'The block must remain ordered after insertion; a blind tail append is wrong.',
      },
    },
    {
      stepId: 'insert-overflow',
      title: { zh: '⑨ 插入溢出区：主块已满', en: '⑨ Insert into overflow when the main block is full' },
      explanation: {
        zh: '主块记录数达到容量时，新记录不能被塞入。程序在溢出区创建记录，并把它挂到该主块专属链。若这是该块第一个溢出记录，需要建立链头节点；否则追加到链尾。主块本身不变。',
        en: 'When the main block reaches capacity, the new record cannot be forced in. The program creates it in overflow and attaches it to that block’s private chain. The first overflow record creates a node; later ones append. The main block itself is unchanged.',
      },
      tip: {
        zh: '溢出不是“丢弃记录”，记录必须能被后续查找访问。',
        en: 'Overflow never discards a record; it must remain retrievable.',
      },
    },
    {
      stepId: 'link-overflow',
      title: { zh: '⑩ 维护溢出链链接', en: '⑩ Maintain the overflow link' },
      explanation: {
        zh: '若新建了溢出节点，前一节点或主块的 overflowHead 必须指向它。链接帧显示 nextId 的真实变化；校验器禁止链环、跨块链接和孤立节点。',
        en: 'When a node is created, the previous node or the block’s overflowHead must point to it. The link frame exposes the real nextId change; validation forbids cycles, cross-block links and orphan nodes.',
      },
      tip: {
        zh: '新节点写入成功但未链接，等于查找时不可达。',
        en: 'A written node without a link is unreachable during lookup.',
      },
    },
    {
      stepId: 'index-update',
      title: { zh: '⑪ 刷新索引上界', en: '⑪ Refresh the index upper bound' },
      explanation: {
        zh: '记录进入主区或溢出链后，该块的实际最大键可能变大。索引项必须同步为新的上界，否则后续查找会选错块或过早停止。若最大键未变化，则不必制造这一帧。',
        en: 'After insertion, the block’s real maximum may grow. The entry must adopt the new bound, or later lookups select the wrong block or stop too early. If the maximum does not change, this frame is unnecessary.',
      },
      tip: {
        zh: '索引上界来自真实记录，不能只按新插入值盲目覆盖。',
        en: 'The bound comes from the real maximum, not blindly from the inserted value.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑫ 结束：插入后重查成功', en: '⑫ Done: the inserted record is found again' },
      explanation: {
        zh: '插入命令结束后，程序真实重查新关键字。完成帧的结果必须为 inserted，且 foundId 必须是刚插入的记录；查找命令则报告 found 或 not-found。校验器同时确认完成后至少读过一次主区。',
        en: 'After an insertion the program genuinely looks up the new key. The done frame must report inserted with foundId equal to the new record; a find command reports found or not-found. Validation also requires at least one main-area read.',
      },
      tip: {
        zh: '“插入成功”不能只看记录写进了数组；必须从文件结构重新查到它。',
        en: '“Inserted successfully” cannot mean only that the record entered an array; it must be found again through the structure.',
      },
    },
  ],
  commonMistakes: {
    zh: [
      '把索引上界当成下一块首键，导致边界选择错误。',
      '主块命中后仍无条件读取整条溢出链。',
      '溢出记录被挂到错误主块的链上。',
      '新溢出节点写入但未更新前驱 nextId 或链头。',
      '块内插入后未保持关键字有序。',
      '新记录扩大最大键却不刷新索引上界。',
      '插入后不回查就宣布成功。',
      '把 ISAM 的静态上界索引说成 B+ 树的动态平衡索引。',
    ],
    en: [
      'Treating a bound as the next block’s first key and selecting the wrong block.',
      'Reading the whole chain even after a main-block hit.',
      'Attaching an overflow record to the wrong block’s chain.',
      'Creating an overflow node without updating the predecessor or chain head.',
      'Inserting inside a block without preserving key order.',
      'Growing the maximum key without refreshing the index bound.',
      'Declaring insertion successful without a real re-lookup.',
      'Calling ISAM’s static bound index a dynamically balanced B+ tree.',
    ],
  },
};

export const invertedIndexLesson: Lesson = {
  lessonId: 'inverted-index-query',
  algorithmId: 'inverted-index',
  contentVersion: '1.0.0',
  title: {
    zh: '倒排索引：从记录关键字到记录 ID 的集合查询',
    en: 'Inverted index: from record terms to record-id set queries',
  },
  oneLiner: {
    zh: '构建时把每条记录的关键字写入对应倒排表；查询时读取多个表，AND 求交、OR 求并，结果回到原记录。',
    en: 'Building writes each record’s terms into posting lists; querying reads several lists, intersects for AND or unions for OR, and maps ids back to records.',
  },
  overview: {
    zh: '本课程接受一组已分好词的记录，每条记录有 1–4 个关键字。构建阶段先为全部不同关键字建立空倒排表，再逐记录扫描：读取关键字并把记录 ID 追加到相应表。查询阶段逐词读取倒排表；AND 对累计结果与当前表求交，OR 求并，结果始终按原记录顺序过滤。缺失关键字产生空表：AND 会使结果为空，OR 不增加记录。课程不实现中文分词、排名或全文搜索语法。',
    en: 'The course accepts records with 1–4 pre-segmented terms. Building creates an empty list per distinct term, then scans records: read each term and append the record id. Querying reads lists one term at a time; AND intersects the running result with the current list, OR unions them, and results are filtered in original record order. A missing term yields an empty list: AND empties the result, OR adds nothing. The course implements no tokenizer, ranking or full-text query grammar.',
  },
  intuition: {
    zh: '普通索引问“这条记录有哪些关键字”，倒排索引反过来问“这个关键字出现在哪些记录”。构建像给每本书贴多个标签，再把同标签的书号抄到同一张清单；查询就是抽出几张清单，取交集或并集。',
    en: 'An ordinary index asks “which terms does this record have?” An inverted index asks “which records contain this term?” Building is like tagging books and copying each tag’s book ids onto one list; querying pulls several lists and intersects or unions them.',
    },
  prerequisites: {
    zh: ['理解记录 ID 与次关键字', '知道一个关键字可对应多条记录', '理解集合交集与并集'],
    en: ['Understanding record ids and secondary keys', 'Knowing one term may match many records', 'Understanding set intersection and union'],
  },
  complexity: {
    time: '构建 O(T)；查询 O(Σ|L_i|) 的列表读取与集合运算',
    space: 'O(T + P)，T 为不同关键字数，P 为倒排项总数',
    note: {
      zh: '本实现按记录顺序做小型集合运算，列表长度直接决定代价；它不是大型搜索引擎的压缩倒排或跳跃指针实现。空间按每个记录-关键字出现计一次倒排项，同一记录重复写同一个词会在输入校验阶段被拒绝。',
      en: 'This implementation performs small set operations in record order; list length directly determines cost. It is not a compressed or skip-list posting implementation from a large search engine. Space counts one posting per record–term occurrence; duplicate terms inside one record are rejected at input validation.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 为全部关键字建立空倒排表', en: '① Create an empty posting list for every term' },
      explanation: {
        zh: '先收集所有记录中的不同关键字，按稳定顺序建立空表。此帧只有结构，没有 posting；每条记录的关键字集合已在输入阶段校验为 1–4 个且不重复。',
        en: 'Collect every distinct term and create an empty list in stable order. This frame contains structure but no postings; input validation already ensured each record has 1–4 unique terms.',
      },
      tip: {
        zh: '倒排表的键是关键字，不是记录 ID。',
        en: 'Posting-list keys are terms, not record ids.',
      },
    },
    {
      stepId: 'scan-record',
      title: { zh: '② 扫描一条记录，读取已分好的关键字', en: '② Scan one record’s segmented terms' },
      explanation: {
        zh: '按输入记录顺序取一条记录，设置 currentRecord，并准备逐个处理它的关键字。扫描帧不修改倒排表；只有后续 term-add 才追加 posting。',
        en: 'Take one record in input order, set currentRecord, and prepare to process its terms. The scan frame does not modify lists; only the following term-add appends postings.',
      },
      tip: {
        zh: '这里的“扫描”是读已分好的关键字，不做分词。',
        en: '“Scanning” reads pre-segmented terms; it does not tokenize text.',
      },
    },
    {
      stepId: 'term-add',
      title: { zh: '③ 把记录 ID 追加到关键字倒排表', en: '③ Append the record id to a term’s list' },
      explanation: {
        zh: '对当前记录的每个关键字，在其倒排表尾部追加记录 ID。追加顺序保持记录输入顺序，因此同一关键字对应的多条记录不会乱序。一个记录可向多个表各追加一次。',
        en: 'For each term in the current record, append its id to the corresponding list. Append order follows input record order, so records sharing a term stay ordered. One record may append once to several lists.',
      },
      tip: {
        zh: '同一记录不能在同一关键字的表中重复出现。',
        en: 'One record must not appear twice in the same term’s list.',
      },
    },
    {
      stepId: 'build-done',
      title: { zh: '④ 构建完成：每张表等于真实关键字集合', en: '④ Build complete: every list equals its real term set' },
      explanation: {
        zh: '全部记录扫描完后，倒排表应精确等于“所有包含该关键字的记录 ID”。校验器逐词比对期望集合与 Trace 结果，缺失词允许表为空；不会根据查询结果反推索引。',
        en: 'After all records are scanned, every list must equal the set of ids containing that term. Validation compares each expected set with the trace; missing terms may have empty lists. The index is never back-filled from query results.',
      },
      tip: {
        zh: '构建完成帧必须出现在任何查询帧之前。',
        en: 'The build-done frame must precede every query frame.',
      },
    },
    {
      stepId: 'query-term',
      title: { zh: '⑤ 读取一个查询词的倒排表', en: '⑤ Read one query term’s posting list' },
      explanation: {
        zh: '按查询词顺序读取对应倒排表；若词不存在，当前表为空。界面保留当前查询词与实际列表，随后的 combine 才更新累计结果。',
        en: 'Read the list for each query term in order; a missing term yields an empty list. The UI keeps the current term and its real list; the following combine updates the running result.',
      },
      tip: {
        zh: '读取列表不等于已经完成 AND/OR 运算。',
        en: 'Reading a list is not yet the AND/OR operation.',
      },
    },
    {
      stepId: 'combine',
      title: { zh: '⑥ 与累计结果求交集或并集', en: '⑥ Intersect or union with the running result' },
      explanation: {
        zh: '第一个词直接作为累计结果；之后 AND 只保留同时出现在当前累计与当前表中的记录，OR 保留任一方出现的记录，并按原记录顺序去重。界面显示当前词、当前表和累计 matchedIds。',
        en: 'The first term becomes the running result. Later AND keeps ids in both the running set and current list; OR keeps ids in either, deduplicating in original record order. The UI shows the term, its list and the running matchedIds.',
      },
      tip: {
        zh: 'AND 的第一张表不是最终答案；必须继续与后续表求交。',
        en: 'The first AND list is not final; later lists must still be intersected.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑦ 查询结束：记录 ID 回到原记录', en: '⑦ Done: record ids map back to original records' },
      explanation: {
        zh: '完成帧清空临时当前词与当前表，保留最终 matchedIds。校验器重算真实交集/并集，并要求结果顺序与原记录一致；结果为空时报告 empty，而不是制造一条假记录。',
        en: 'The done frame clears temporary term state and keeps final matchedIds. Validation recomputes the true intersection/union and requires original record order; an empty result reports empty rather than inventing a record.',
      },
      tip: {
        zh: '最终结果是记录 ID 集合，不是关键字列表。',
        en: 'The final result is a set of record ids, not a list of terms.',
      },
    },
  ],
  commonMistakes: {
    zh: [
      '把记录 ID 写进错误关键字的倒排表。',
      '同一记录在同一关键字表中重复追加。',
      'AND 只读取第一张表就返回。',
      'OR 求并后未去重，同一记录出现两次。',
      '缺失关键字被当成错误，而不是空表。',
      '结果按集合迭代顺序输出，破坏原记录顺序。',
      '把倒排表当成唯一键索引，误以为一个关键字只能对应一条记录。',
      '把本课程说成实现了中文分词或全文搜索。',
    ],
    en: [
      'Appending a record id to the wrong term’s list.',
      'Adding the same record twice to one term’s list.',
      'Returning after only the first AND list.',
      'Unioning OR lists without deduplication, returning a record twice.',
      'Treating a missing term as an error instead of an empty list.',
      'Outputting in incidental set iteration order instead of record order.',
      'Treating a posting list as a unique-key index where one term has one record.',
      'Claiming the course implements Chinese tokenization or full-text search.',
    ],
  },
};

export const FILE_STRUCTURE_LESSONS: readonly Lesson[] = [
  indexedFileLesson,
  isamLesson,
  invertedIndexLesson,
];
