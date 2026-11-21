import type { Lesson } from './types';

/**
 * TEXTBOOK-09 courses for block search, B+ tree and key tree.
 *
 * Step ids are exactly the `lesson_step=` values emitted by the matching
 * Python programs. Every frame therefore has an authored explanation; frames
 * that a particular operation never produces simply show no current count.
 */

export const blockSearchLesson: Lesson = {
  lessonId: 'block-search-index-then-scan',
  algorithmId: 'block-search',
  contentVersion: '1.0.0',
  title: { zh: '分块查找：先查索引，再在块内顺序扫描', en: 'Block search: index lookup, then a block scan' },
  oneLiner: {
    zh: '把记录切成块，每块登记最大值；先用索引锁定唯一可能的块，再在块内逐项比较。',
    en: 'Cut records into blocks and record each block’s maximum; the index selects the only possible block before an in-block scan.',
  },
  overview: {
    zh: '分块查找又称索引顺序查找，是顺序查找与索引思想的折中。数据被划分为若干连续块，每块建立一个索引项，记录该块的最大关键字、起始下标和长度。索引项的最大值必须严格递增，并且后一块的所有关键字都要大于前一块的最大值；但块内允许无序下沉，不要求整体有序。查找分两阶段：先在索引表中顺序比较，找到第一个最大值不小于目标值的块；若所有最大值都更小，目标不可能存在。然后只扫描这个块，逐项比较，命中就返回，扫描完整块仍未命中则失败。块内顺序不变，输入从不被静默排序或重排。平均代价由索引比较与块内比较共同决定，最优块长约为 √n，但真实选择还要看块内是否有序、更新频率与存储布局。',
    en: 'Block search, also called indexed sequential search, is a compromise between sequential search and indexing. Records are divided into consecutive blocks, and each block has an index entry storing its maximum key, start offset and length. Index maxima must strictly increase, and every key in a later block must exceed the previous block’s maximum; inside a block the records may remain unordered. Search has two phases: compare the target against index maxima until the first block whose maximum is not smaller; if every maximum is smaller, the target cannot exist. Then scan only that block, comparing each record; a hit returns and a complete block scan without a hit fails. The block’s internal order is never silently rearranged. The average cost combines index comparisons and block comparisons; the textbook optimum block length is about √n, while real choices also depend on whether blocks are sorted, update frequency and memory layout.',
  },
  intuition: {
    zh: '把索引表想成一排写着“本箱最重物品重量”的标签，箱子内部则是随意摆放的物品。先沿着标签找到第一只“最重不超过目标上限”的箱子，再伸手进去一件件摸。因为箱子之间按最大重量递增排列，一旦某只箱子的最大值已经覆盖目标，目标就不可能落在更后面的箱子里；而前面的箱子最大值更小，也不可能容纳它。箱子内部没有顺序，所以必须逐件检查，不能二分。',
    en: 'Think of the index as a row of labels giving each box’s heaviest item, while the box contents are arbitrarily arranged. Walk the labels to the first box whose maximum can cover the target, then reach inside and check items one at a time. Because maxima increase, once a box’s maximum covers the target, later boxes cannot contain it; earlier boxes have smaller maxima and cannot hold it either. Inside the box there is no order, so every item must be checked; binary search is not available there.',
  },
  prerequisites: {
    zh: ['理解数组下标与连续区间', '知道“块间有序、块内可无序”的索引约束', '能区分关键字比较次数与记录访问次数'],
    en: ['Array indices and contiguous ranges', 'The “ordered across blocks, unordered inside a block” constraint', 'Distinguishing key comparisons from record accesses'],
  },
  complexity: {
    time: 'O(√n) 次比较（块长约 √n 时）',
    space: 'O(n + b)',
    note: {
      zh: '设记录数为 n、块数为 b、平均块长为 s = n/b。索引阶段最多比较 b 次，块内最多比较 s 次，合计 b + s。固定 b 时最坏 O(n)；当 b 与 s 都约为 √n 时取得约 2√n 的极小值，因此常写作 O(√n)。这是比较次数，不含输入校验与建索引的一次性 O(n)。空间上记录本身 O(n)，索引表 O(b)。若块内也有序，块内可改用二分，代价变为 O(log b + log s)，但本课的块内扫描保持顺序查找，以便展示真实的两阶段差异。',
      en: 'With n records, b blocks and average block length s = n/b, the index phase performs at most b comparisons and the block scan at most s, for b + s. With b fixed the worst case is O(n); choosing both b and s near √n gives a minimum near 2√n, usually written O(√n). These are comparisons only, excluding one-time input validation and index construction O(n). Records cost O(n) space and the index O(b). If blocks are also sorted, a binary search inside a block changes the cost to O(log b + log s), but this course keeps a linear block scan to expose the two real phases.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 建块与索引：块间有序，块内保持原顺序', en: '① Build blocks and index: ordered across, original order inside' },
      explanation: {
        zh: '输入先按固定块长切成连续区间，再为每块登记最大值、起始下标和长度。索引项的最大值严格递增，且后一块的最小值也必须大于前一块的最大值；这两个条件共同保证目标最多只可能落在一个块。建索引不会重排记录，块内顺序与输入完全一致，因此输入中的无序下沉也被保留。init 帧同时给出索引表与全部数据块，后续所有高亮都引用这些真实下标。',
        en: 'The input is cut into contiguous ranges of a fixed block length, then each block records its maximum, start offset and length. Index maxima strictly increase, and the smallest key of a later block must exceed the previous block’s maximum; together these conditions guarantee at most one candidate block. Building the index never rearranges records, so in-block order matches the input and its local descents are preserved. The init frame shows both the index and every data block; later highlights reference these real offsets.',
      },
      tip: { zh: '块内无序是允许的；被禁止的是块间范围重叠。', en: 'In-block disorder is allowed; overlapping ranges across blocks are not.' },
    },
    {
      stepId: 'index-compare',
      title: { zh: '② 索引阶段：逐个比较块最大值', en: '② Index phase: compare block maxima' },
      explanation: {
        zh: '索引阶段从第 1 块开始顺序比较 target 与当前块的 max。每次比较只回答“这个块的最大值是否覆盖目标”，不扫描块内记录。若 target 大于当前 max，目标不可能在本块，继续下一项；若 target 小于等于当前 max，当前块就是唯一候选，索引阶段立即停止。indexCount 记录已进行的索引比较次数，它与后续 blockCount 分开累计，便于核对 ASL 的两个阶段。',
        en: 'The index phase compares the target with each block maximum from the first block onward. Each comparison only asks whether that block’s maximum covers the target; no record is scanned yet. If the target exceeds the current maximum it cannot be in this block, so the next entry is checked; when the target is not greater than the maximum, that block is the only candidate and the index phase stops. indexCount totals index comparisons separately from blockCount, so the two ASL stages can be checked independently.',
      },
    },
    {
      stepId: 'index-select',
      title: { zh: '③ 锁定候选块：块间范围保证唯一性', en: '③ Lock the candidate block: block ranges make it unique' },
      explanation: {
        zh: '第一个 max 不小于 target 的索引项被选中，selected 指向真实块号。由于索引最大值严格递增、后块最小值大于前块最大值，这个块是唯一可能包含目标的块：更前面的块最大值都小于 target，更后面的块最小值都大于前块最大值，也就大于 target。index-select 帧的 compareValue 记录刚比较过的块最大值，currentPos 此时可以为空，因为还没有开始块内扫描。',
        en: 'The first index entry whose maximum is not smaller than the target is selected, and selected names the real block. Because maxima strictly increase and later blocks start above earlier maxima, this block is the only possible owner: earlier blocks have smaller maxima, while later blocks start above the previous maximum and therefore above the target. The index-select frame records the compared maximum in compareValue; currentPos may be empty because the in-block scan has not started.',
      },
    },
    {
      stepId: 'block-compare',
      title: { zh: '④ 块内阶段：只扫描选中的块', en: '④ Block phase: scan only the selected block' },
      explanation: {
        zh: '进入候选块后，从块首开始逐项比较 target 与真实记录值。块内可以无序，所以不能用二分，也不能根据“已经比某个值大”跳过后续项；必须按位置顺序检查，直到命中或整块扫描完。blockCount 只统计块内比较，indexCount 保持不变；两者相加才是本次查找的总比较次数。高亮位置 currentPos 是块内偏移，不是全局下标。',
        en: 'Inside the candidate block, compare the target with real records from the block start. The block may be unordered, so binary search is unavailable and a larger earlier value cannot justify skipping later entries; positions are checked in order until a hit or the block is exhausted. blockCount counts only in-block comparisons and indexCount stays fixed; their sum is the total comparisons for this search. currentPos is a block offset, not a global index.',
      },
    },
    {
      stepId: 'found',
      title: { zh: '⑤ 块内命中：返回真实全局下标', en: '⑤ Hit inside the block: return the real global index' },
      explanation: {
        zh: '当某个块内记录等于 target 时发出 found 帧，result=found，并给出全局下标、块号与块内偏移。命中后立即停止，不再扫描本块剩余记录，也不检查其他块。全局下标由块起始位置加块内偏移得到，不能把块内偏移直接当成数组下标。若输入中存在重复值，本课采用“块内第一个命中”的确定性规则，结果可复现。',
        en: 'When a record inside the block equals the target, a found frame sets result=found and reports the global index, block number and block offset. The scan stops at once, without checking the rest of the block or any other block. The global index is the block start plus the block offset; a block offset is never treated as an array index. If duplicates exist, this course fixes “first hit inside the block” so results stay reproducible.',
      },
    },
    {
      stepId: 'not-found',
      title: { zh: '⑥ 两阶段都可能失败：区分索引失败与块内失败', en: '⑥ Either phase can fail: distinguish index failure from block failure' },
      explanation: {
        zh: '失败有两种真实来源。第一，所有索引项的最大值都小于 target，索引阶段就结束，根本不会进入任何块；空表也走这条路径。第二，索引选中了候选块，但块内全部记录都扫描完仍没有相等值。两种失败都发出 not-found，result=not-found，但帧里的 selected 与 currentPos 不同：前者没有选中块，后者保留了真实块号与扫描终点。失败不会改变记录或索引，也不会为了“凑一个结果”而篡改块边界。',
        en: 'Failure has two real sources. First, every index maximum is smaller than the target, so the index phase ends without entering any block; an empty table follows this path too. Second, the index selects a candidate block, but a complete in-block scan finds no equal record. Both emit not-found with result=not-found, yet selected and currentPos differ: the first case has no block, the second preserves the real block number and scan endpoint. Failure changes neither records nor index and never edits block boundaries to invent a result.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑦ 结果、比较次数与 ASL', en: '⑦ Result, comparison counts and ASL' },
      explanation: {
        zh: 'done 帧汇总最终结果、索引比较次数与块内比较次数。成功查找的 ASL 是“索引阶段命中位置的比较次数 + 块内命中位置的比较次数”的期望；失败查找则要加上整块扫描。若假设各记录等概率命中，索引项被选中的概率与其块长成正比，不能简单把 b 个索引项等权。若失败目标等概率落在各块范围，索引比较次数近似 (b+1)/2，块内通常要扫完整块。课程不会把成功与失败的 ASL 混成一个数字。',
        en: 'The done frame reports the result, index comparisons and in-block comparisons. Successful ASL adds the index comparison count at the hit position to the in-block count at the hit position; a failed search additionally pays for a full block scan. If records are equally likely to be hit, an index entry’s selection probability is proportional to its block length, so b entries are not simply equally weighted. If failed targets are uniform over block ranges, index comparisons are about (b+1)/2 and the chosen block is usually scanned completely. The course never merges successful and failed ASL into one number.',
      },
      tip: { zh: 'ASL 必须说明概率假设；成功与失败要分开算。', en: 'ASL must state its probability model; success and failure are counted separately.' },
    },
  ],
  commonMistakes: {
    zh: [
      '为了让块间有序而重排块内记录，破坏了输入的真实顺序。',
      '只保证索引最大值递增，却忘记后块最小值必须大于前块最大值。',
      '索引阶段选中块后仍继续比较后面的索引项，浪费比较。',
      '块内使用二分查找，忽略块内可以无序这一前提。',
      '把块内偏移直接当作全局下标返回。',
      '把成功 ASL 与失败 ASL 合成一个没有概率说明的数字。',
    ],
    en: [
      'Reordering records inside a block just to make it sorted, destroying the real input order.',
      'Keeping index maxima increasing but forgetting that later blocks must start above earlier maxima.',
      'Continuing through later index entries after the candidate block is already selected.',
      'Binary-searching inside a block even though blocks may be unordered.',
      'Returning a block offset as if it were a global array index.',
      'Combining successful and failed ASL into one number without a probability model.',
    ],
  },
};

export const bplusTreeLesson: Lesson = {
  lessonId: 'bplus-tree-search-insert-range',
  algorithmId: 'bplus-tree',
  contentVersion: '1.0.0',
  title: { zh: 'B+ 树：叶层记录、分隔键与范围扫描', en: 'B+ tree: leaf records, separators and range scans' },
  oneLiner: {
    zh: '内部节点只存分隔键，所有记录都在同一层叶子，叶子之间用 next 串成有序链。',
    en: 'Internal nodes store separators only; every record lives in one leaf layer, and leaves are linked in order by next.',
  },
  overview: {
    zh: '本课使用一棵真实的 4 阶 B+ 树：每个节点最多 4 个孩子、3 个关键字。与 B 树不同，B+ 树的所有记录只存放在叶子，内部节点的键只是“右子树最小记录”的副本，用来选择孩子，不是数据记录。因此点查找必须一路走到叶子，哪怕在内部看到相等的分隔键也不能提前返回。所有叶子位于同一深度，并按关键字从小到大用 next 链接；范围查询先定位下界所在叶子，再沿 next 向右收集，直到超过上界。插入先拒绝重复键，再把记录写入叶子；叶子溢出时按 2/2 分裂并把右叶首键提升为父分隔键，父节点溢出时提升并移除中间键，根溢出时新建一层根。', 
    en: 'This course runs a real order-4 B+ tree: at most four children and three keys per node. Unlike a B-tree, every record lives in a leaf; internal keys are copies of the minimum record in the right subtree and only route searches. A point lookup must therefore reach a leaf, even if an equal separator appears internally. All leaves share one depth and are linked by next in ascending key order; a range query locates the leaf containing the lower bound, then follows next and collects records until the upper bound is exceeded. Insertion first rejects duplicates, then writes the record into a leaf; an overflowing leaf splits 2/2 and promotes the first key of the right leaf, an overflowing internal node promotes and removes its middle key, and an overflowing root creates a new level.',
  },
  intuition: {
    zh: '把内部节点想成图书馆的楼层指引牌，牌子上写的是“这一层从哪本书开始”，但书本身全部放在最底层的书架上。找一本书必须先按指引走到最底层，不能因为指引牌上出现了书名就以为书在那里。找到第一本够大的书后，若还要找一段连续的书，就沿着书架之间的传送带一直向右走，不必重新回到楼层指引。那条传送带就是叶子之间的 next 链。',
    en: 'Think of internal nodes as floor signs that say where a range starts, while every book sits on the bottom-floor shelves. A lookup must follow the signs to the bottom; seeing a title on a sign does not mean the book is stored there. Once the first large-enough book is found, scanning a continuous range simply follows the conveyor between shelves instead of returning to the floor signs. That conveyor is the next link between leaves.',
  },
  prerequisites: {
    zh: ['理解 B 树的多路节点与阶', '知道“内部键只是分隔键，不是记录”', '能跟随叶子 next 链做顺序扫描'],
    en: ['Multiway nodes and order in a B-tree', 'Knowing an internal key is a separator, not a record', 'Following a leaf next chain for a sequential scan'],
  },
  complexity: {
    time: '点查找 O(log_m n)；范围查询 O(log_m n + k)',
    space: 'O(n)',
    note: {
      zh: '设记录数为 n、阶为 m、树高为 h，则 h = O(log_m n)。点查找每层选一个孩子，层内最多比较 m−1 个分隔键，最终在叶子比较记录，因此是 O(log_m n) 次节点访问，乘上层内比较为 O(m log_m n)，层内二分可降为 O(log m log_m n)。范围查询先花 O(log_m n) 定位下界叶子，再沿 next 输出 k 条记录；每片叶子只访问一次，总代价 O(log_m n + k)，这正是 B+ 树相对 B 树的优势。插入同样只走一条根叶路径，分裂搬移 O(m) 个键与孩子。空间保存 n 条记录、内部键副本与孩子引用，O(n)。',
      en: 'With n records, order m and height h, h = O(log_m n). A point lookup chooses one child per level, compares at most m−1 separators there, and finally checks the leaf, so node visits are O(log_m n), with O(m log_m n) key comparisons or O(log m log_m n) using binary search inside a node. A range query spends O(log_m n) locating the lower-bound leaf, then follows next to output k records; each leaf is visited once, for O(log_m n + k), which is the B+ tree’s advantage over a B-tree. Insertion also follows one root-to-leaf path and moves O(m) keys and children when splitting. Space holds n records, internal separator copies and child references, O(n).',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 内部索引层 + 叶层 + 叶链', en: '① Internal index layer, leaf layer and leaf chain' },
      explanation: {
        zh: '初始帧已经显示完整结构：内部节点只有分隔键与孩子指针，叶节点保存真实记录，所有叶节点处于同一深度，并按关键字升序用 next 相连。每个内部键都等于其右子树的最小记录，因此“键 i 及其右侧”对应的孩子范围不会重叠。根可以是叶，也可以是多层索引；无论哪层，记录都只在叶子，内部键只是副本。节点与叶链都由真实对象字段生成，不是画布上的装饰线。',
        en: 'The init frame shows the full structure: internal nodes hold separators and child pointers, leaves hold real records, every leaf shares one depth and leaves are linked by next in ascending order. Each internal key equals the minimum record of its right subtree, so the ranges of key i and its right child never overlap. The root may be a leaf or a multi-level index; in every case records live only in leaves and internal keys are copies. Nodes and leaf links come from real object fields, not decorative canvas lines.',
      },
      tip: { zh: '内部键不是记录；查找不能停在内部节点。', en: 'An internal key is not a record; a lookup never stops there.' },
    },
    {
      stepId: 'inspect-internal',
      title: { zh: '② 内部节点按分隔键选路', en: '② Route through internal separators' },
      explanation: {
        zh: '内部节点的键 k₀ < k₁ < … 把孩子分成若干区间：小于 k₀ 走最左孩子，大于等于 kᵢ 且小于 kᵢ₊₁ 走第 i+1 个孩子，大于等于最后一个键走最右孩子。因为 kᵢ 是右子树的最小记录，相等时必须走右侧，否则会把本应属于右子树的值送进左侧。inspect-internal 帧记录当前节点、比较的分隔键与走向；这里只选路，不判断命中。',
        en: 'Internal keys k₀ < k₁ < … divide children into intervals: below k₀ take the leftmost child, between kᵢ and kᵢ₊₁ take child i+1, and at or above the last key take the rightmost child. Because kᵢ is the minimum record of the right subtree, equality must go right; sending an equal value left would miss its real home. The inspect-internal frame records the node, compared separator and direction; it only routes and never declares a hit.',
      },
    },
    {
      stepId: 'descend',
      title: { zh: '③ 只沿一个孩子下降一层', en: '③ Descend through exactly one child' },
      explanation: {
        zh: '路由结果唯一确定一个孩子，descend 帧给出 childSlot 与真实 childId。与 B 树不同，内部节点没有记录，所以不存在“内部命中”这条捷径；即使某个分隔键等于目标，也必须继续下降到右子树，最终在叶子确认记录。每下降一层，路径 path 追加真实节点，用于最终高亮完整查找路径。',
        en: 'Routing determines exactly one child; the descend frame reports childSlot and the real childId. Unlike a B-tree, internal nodes hold no records, so there is no “internal hit” shortcut: even when a separator equals the target, the walk continues into the right subtree and confirms the record at a leaf. Each descent appends the real node to path, which later highlights the complete search path.',
      },
    },
    {
      stepId: 'inspect-leaf',
      title: { zh: '④ 叶层逐条比较真实记录', en: '④ Compare real records inside the leaf' },
      explanation: {
        zh: '到达叶子后，目标只可能在这个叶子的有序记录列表中。inspect-leaf 帧逐项比较叶内记录，记录下标与值都来自真实 keys 列表。若相等，下一帧就是 found；若比较到列表末尾仍没有相等值，则 not-found。因为所有记录都在叶子，这一步是点查找唯一的“确认”阶段；内部层的分隔键再相等也不能替代它。',
        en: 'At the leaf, the target can only be in that leaf’s ordered record list. inspect-leaf compares records one by one, with indices and values taken from the real keys list. An equal value leads to found; reaching the end without equality leads to not-found. Because every record is in a leaf, this is the only confirmation stage for a point lookup; an equal internal separator can never replace it.',
      },
    },
    {
      stepId: 'found',
      title: { zh: '⑤ 叶层命中：记录真实存在', en: '⑤ Leaf hit: the record really exists' },
      explanation: {
        zh: '找到相等记录后发出 found 帧，result=found，并给出叶节点、叶内下标与完整路径。内部键只是分隔键，因此“内部键等于目标”不会产生 found；只有叶层记录相等才算命中。命中不修改任何节点或叶链，树与查询前一致。若目标重复，本课在插入阶段就拒绝重复，因此叶内至多一条记录。',
        en: 'An equal record emits found with result=found, reporting the leaf, leaf index and full path. Internal keys are separators only, so an equal separator never produces found; only equality with a leaf record counts. A hit changes no node or leaf link, leaving the tree as before. Duplicates are rejected during insertion, so a leaf holds at most one copy of a key.',
      },
    },
    {
      stepId: 'not-found',
      title: { zh: '⑥ 叶层没有记录：查找失败', en: '⑥ No record in the leaf: search fails' },
      explanation: {
        zh: '叶子记录全部比较完仍没有相等值时发出 not-found，result=not-found，并保留最后到达的叶子与路径。空树查找只产生 init 与 done，done 的结果也是 not-found，不会伪造一个不存在的叶节点。失败不会尝试相邻叶子：点查找只沿分隔键走到唯一候选叶，范围查询才使用 next 链。',
        en: 'When every leaf record has been compared without equality, not-found sets result=not-found and preserves the final leaf and path. An empty-tree search produces only init and done, with done reporting not-found and no invented leaf. Failure never tries neighbouring leaves: a point lookup reaches exactly one candidate leaf through separators, while only a range query follows next.',
      },
    },
    {
      stepId: 'duplicate',
      title: { zh: '⑦ 插入前拒绝重复记录', en: '⑦ Reject duplicate records before mutation' },
      explanation: {
        zh: '插入先用点查找做只读定位。若叶层已经存在相同记录，立即发出 duplicate，result=duplicate，树完全不变，既不覆盖旧记录，也不创建新叶。只有确认不存在后才开始真实插入。重复键不会散落在不同叶子，因为每次插入前都执行同一次全局查重。',
        en: 'Insertion first performs a read-only point lookup. If the leaf already holds the same record, duplicate sets result=duplicate and the tree stays completely unchanged: no overwrite and no new leaf. Real insertion starts only after absence is confirmed. Duplicates cannot scatter across leaves because every insertion runs the same global check first.',
      },
    },
    {
      stepId: 'insert-leaf',
      title: { zh: '⑧ 记录只写入叶子，叶链保持有序', en: '⑧ Records enter leaves only; the chain stays ordered' },
      explanation: {
        zh: '定位到目标叶子后，把记录插入叶内 keys 的正确下标。若叶子未满，直接发出 insert-leaf，叶链不需要改接；若叶子满，先完成分裂再重新定位并写入。空树插入创建一个叶子根，它同时是根与唯一的叶子。无论哪种情况，记录都不会写进内部节点，内部键只在分裂时作为副本上升。',
        en: 'After locating the target leaf, the record is inserted at the right index in its keys. If the leaf has room, insert-leaf reports completion and no leaf link changes; if it is full, the split happens first and the record is written afterwards. An empty tree creates a leaf root that is both root and only leaf. In every case the record never enters an internal node; internal keys rise only as copies during a split.',
      },
    },
    {
      stepId: 'split-leaf',
      title: { zh: '⑨ 叶分裂：左二右二，右叶首键上升', en: '⑨ Leaf split: two left, two right, right first key rises' },
      explanation: {
        zh: '4 阶 B+ 树最多 3 个键。叶内插入第 4 个键后溢出，按 2/2 分裂：前两个键留在原叶，后两个键进入新右叶；原叶的 next 改为指向新右叶，新右叶的 next 继承原叶原来的后继。右叶首键被复制并提升到父节点作为新分隔键，原叶不删除任何记录。这个分隔键只是副本，记录仍在右叶。split-leaf 帧同时给出被分裂叶、右叶、提升键与最终父节点。',
        en: 'An order-4 B+ tree holds at most three keys. Inserting a fourth key overflows the leaf and triggers a 2/2 split: the first two keys stay in the old leaf and the last two move to a new right leaf; the old leaf’s next is redirected to the new leaf, which inherits the old successor. The first key of the right leaf is copied upward as the new parent separator, and the old leaf keeps every record. The separator is only a copy; its record remains in the right leaf. The split-leaf frame reports the split leaf, right leaf, promoted key and final parent.',
      },
    },
    {
      stepId: 'split-internal',
      title: { zh: '⑩ 内部分裂：中间键上升并被移除', en: '⑩ Internal split: the middle key rises and leaves the node' },
      explanation: {
        zh: '内部节点同样最多 3 个键。插入一个上升分隔键后变成 4 个键，分裂时提升中间键 k₂，左节点保留 k₀、k₁ 与左侧三个孩子，右节点保留 k₃ 与右侧两个孩子。与 B 树不同，提升的 k₂ 必须从内部节点移除，因为它已经是父层的分隔键；它本来就不是记录，移除不会丢数据。父节点在孩子列表的同一位置插入新右孩子，保持“键数 + 1 = 孩子数”。',
        en: 'An internal node also holds at most three keys. After one promoted separator is inserted it has four keys; splitting lifts the middle key k₂, keeps k₀ and k₁ with their three left children, and gives k₃ with its two right children to a new node. Unlike a B-tree, the lifted k₂ is removed from the internal node because it now separates children at the parent level; it was never a record, so no data is lost. The parent inserts the new right child at the matching position, preserving “keys + 1 = children”.',
      },
    },
    {
      stepId: 'split-root',
      title: { zh: '⑪ 根分裂：新根只有 1 个分隔键，树高加一', en: '⑪ Root split: a new root with one separator adds a level' },
      explanation: {
        zh: '如果溢出的是根，没有父节点可以接收上升键，就新建一个内部根：它只含提升键，两个孩子分别指向原根分裂后的左右部分。旧根不再是根，树高增加 1，所有叶子仍处于同一深度。新根可能暂时只有 1 个键，这是根节点允许的特殊情况；非根内部节点仍必须满足下限。split-root 帧的 rootChanged=true，后续路径必须以新根 id 为起点。',
        en: 'When the root overflows there is no parent to receive the promoted key, so a new internal root is created with only that separator and two children pointing at the split halves. The old root stops being root, height grows by one, and all leaves remain at one depth. The new root may temporarily hold a single key, a special allowance for roots; non-root internal nodes must still meet their minimum. split-root sets rootChanged=true, and later paths must start from the new root id.',
      },
    },
    {
      stepId: 'range-start',
      title: { zh: '⑫ 范围查询：先定位下界叶子', en: '⑫ Range query: locate the lower-bound leaf' },
      explanation: {
        zh: '范围查询先把下界 low 当作点查找目标，沿分隔键走到第一个可能包含 low 的叶子，但不在叶内提前停止。range-start 帧给出起点叶、根到叶的真实路径与完整叶链。若树为空或 low 大于 high，范围立即为空。范围查询不依赖中序遍历，也不从根重新搜索每个键；它只定位一次起点，然后交给 next 链。',
        en: 'A range query treats the lower bound low as a point target and follows separators to the first leaf that may contain it, without stopping early inside the leaf. The range-start frame reports the starting leaf, the real root-to-leaf path and the complete leaf chain. If the tree is empty or low exceeds high, the range is immediately empty. The query does not rely on an inorder walk or re-search each key from the root; it locates one start and then uses next.',
      },
    },
    {
      stepId: 'range-scan',
      title: { zh: '⑬ 沿叶链收集区间内的记录', en: '⑬ Collect records along the leaf chain' },
      explanation: {
        zh: '从起点叶开始，逐条检查叶内记录：小于 low 的记录跳过，落在闭区间内的记录加入结果，一旦遇到大于 high 的记录就说明后续叶子只会更大，可以立即停止。当前叶扫描完后沿 next 进入下一叶，不回到内部节点。range-scan 帧累计已收集记录与访问过的叶节点；叶链保证跨叶顺序仍然升序，这是 B+ 树范围查询高效的根本原因。',
        en: 'Starting at the first leaf, each record is checked: values below low are skipped, values inside the closed interval are collected, and a value above high proves every later leaf is larger, so the scan stops. After a leaf finishes, next leads to the following leaf without returning to internal nodes. The range-scan frame accumulates collected records and visited leaves; the chain keeps cross-leaf order ascending, which is why B+ range queries are efficient.',
      },
    },
    {
      stepId: 'range-end',
      title: { zh: '⑭ 范围结束：闭区间、空区间与累计结果', en: '⑭ Range end: closed bounds, empty ranges and accumulated results' },
      explanation: {
        zh: '范围是闭区间 [low, high]，两端记录都包含。结束原因可能是遇到大于 high 的记录、叶链走到尽头、树为空，或下界大于上界。range-end 帧保留已收集的键与访问过的叶 id；done 帧还要把累计结果继续带出，避免最终画面只剩最后一片叶子。空结果也是合法结果，不能因为“没找到”就伪造一条记录。范围扫描不修改树，也不改变叶链。',
        en: 'The range is the closed interval [low, high], including both ends. It may end because a record exceeds high, the chain runs out, the tree is empty, or low exceeds high. The range-end frame preserves collected keys and visited leaf ids; the final done frame carries the accumulated result forward so the last leaf does not erase earlier output. An empty result is legitimate and never replaced by a fabricated record. A range scan changes neither the tree nor the leaf chain.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑮ 操作范围：查找、插入与范围查询', en: '⑮ Operation scope: search, insertion and range queries' },
      explanation: {
        zh: '本课实现的 B+ 树操作是点查找、插入（含叶分裂、内部分裂与根分裂）以及叶链范围查询。删除没有在本轮实现，课程不会把 B 树的删除逻辑直接搬到 B+ 树，也不会声称支持删除；页面和参考代码都明确这一覆盖范围。done 帧汇总结果、根 id、最终叶链与范围累计值。插入只会改变叶层记录和必要的分隔键副本，范围查询只读。若后续要加入删除，必须单独处理叶层记录、分隔键更新、叶链改接以及借位与合并的语义，不能复用 B 树的删除代码。',
        en: 'This course implements point search, insertion with leaf splits, internal splits and root splits, plus leaf-chain range queries. Deletion is not implemented this round; the course does not transplant B-tree deletion into a B+ tree and never claims delete support. The page and reference code state this scope explicitly. The done frame summarizes the result, root id, final leaf chain and accumulated range values. Insertion changes only leaf records and the necessary separator copies, while range queries are read-only. Any future deletion must handle leaf records, separator updates, leaf relinking and borrow/merge semantics separately; B-tree deletion code cannot simply be reused.',
      },
      tip: { zh: '本轮不实现 B+ 删除；不要把“未实现”说成“已支持”。', en: 'B+ deletion is out of scope this round; never present it as supported.' },
    },
  ],
  commonMistakes: {
    zh: [
      '在内部节点看到相等分隔键就返回命中，忘记记录只在叶子。',
      '把内部键当作真实记录复制到结果中。',
      '叶分裂后忘记改接 next，导致范围查询跳过新叶。',
      '内部分裂时把提升键留在原节点，造成重复分隔键。',
      '根分裂后仍从旧根开始画路径，忽略 rootChanged。',
      '范围查询每收集一个键都从根重新搜索，丢掉叶链优势。',
      '把本轮未实现的删除写成已支持。',
    ],
    en: [
      'Returning a hit at an equal internal separator even though records live only in leaves.',
      'Treating internal keys as real records and copying them into results.',
      'Forgetting to relink next after a leaf split, so range scans skip the new leaf.',
      'Leaving the promoted key in the old node during an internal split, creating duplicate separators.',
      'Drawing paths from the old root after a root split, ignoring rootChanged.',
      'Re-searching every collected range key from the root instead of following next.',
      'Claiming deletion support when this round does not implement it.',
    ],
  },
};

export const keyTreeLesson: Lesson = {
  lessonId: 'key-tree-prefix-search-insert',
  algorithmId: 'key-tree',
  contentVersion: '1.0.0',
  title: { zh: '键树（Trie）：前缀共享、终止标记与逐层查找', en: 'Key tree (trie): shared prefixes, terminal marks and layered search' },
  oneLiner: {
    zh: '关键字按字符逐层拆开，相同前缀共用一条路径，只有带终止标记的节点才代表一个完整关键字。',
    en: 'Keys are split character by character; equal prefixes share one path, and only a terminal-marked node represents a complete key.',
  },
  overview: {
    zh: '键树（Trie，也称数字查找树或前缀树）把关键字按组成符号逐层组织：根是哨兵，每条边代表一个字符，从根到某节点的路径拼出该节点对应的前缀。共享前缀的关键字共用路径，因此 car、card、care 会共享 c→a→r，再在 r 处分出 d、e 分支。仅仅路径存在并不代表一个关键字存在：必须在路径末端设置 terminal 标记，才表示从根到该节点的整个字符串是词典中的完整词。查找从根开始逐字符检查是否存在对应孩子，全部字符走通后再检查 terminal；中途缺边就是失败，路径走完但没有 terminal 则只是更长词的前缀。插入只为缺失的后缀创建节点，最后设置 terminal；重复词在修改前拒绝。键树适合前缀查询与自动补全，但每个字符一个节点会消耗较多指针空间。',
    en: 'A key tree (trie, digital search tree or prefix tree) organizes keys by their component symbols: the root is a sentinel, every edge carries one character, and the path from the root spells the prefix of that node. Keys with a shared prefix share the path, so car, card and care share c→a→r before branching at r into d and e. A path alone does not prove a key exists: a terminal mark at the path end is required to declare the whole root-to-node string a complete dictionary word. Search checks one character at a time for the matching child, then checks terminal after all characters are consumed; a missing edge fails immediately, while a complete path without terminal is only a prefix of longer words. Insertion creates nodes only for the missing suffix and sets terminal last; a duplicate is rejected before mutation. Tries excel at prefix queries and autocomplete, but one node per character costs many pointers.',
  },
  intuition: {
    zh: '把词典想成一棵由字母路标组成的树：从门口出发，先看第一个字母指向哪条走廊，再看第二个字母。car、card、care 在 c、a、r 三个路口完全同路，直到 r 之后才分叉。走到一个路口时，牌子上可能写着“这里是一个完整单词”，也可能什么都不写；只有写着终止标记的路口才算词。ca 虽然能沿 c、a 走到，却没有终止标记，所以它只是 care、card 等词的前缀，不是词典里的词。',
    en: 'Picture the dictionary as a tree of letter signposts: leave the entrance, follow the corridor for the first letter, then the second. Car, card and care share the c, a and r junctions and only branch after r. A junction may carry a “this is a complete word” plaque or nothing; only the terminal mark makes it a word. Although ca can be reached through c and a, it has no terminal mark, so it is merely a prefix of care, card and others, not a dictionary word.',
  },
  prerequisites: {
    zh: ['理解树的孩子指针与根哨兵', '知道“路径存在”与“关键字存在”的区别', '能按字符遍历字符串'],
    en: ['Tree child pointers and a sentinel root', 'The difference between an existing path and an existing key', 'Iterating over characters of a string'],
  },
  complexity: {
    time: '查找、插入 O(L)；L 为关键字长度',
    space: 'O(ΣL) 个字符节点',
    note: {
      zh: '键树查找与插入都只沿关键字长度 L 走一条路径，每层在该节点的孩子集合中找一个字符；若孩子用固定字母表数组，单层是 O(1)，总代价 O(L)。若用有序孩子列表或哈希表，单层成本随分支数变化，但通常仍记作 O(L)（忽略孩子查找的常数或对数因子）。空间按所有关键字的字符总数计：共享前缀只存一份，因此小于各词长度之和的独立存储；最坏无共享前缀时为 O(ΣL) 个节点。每个节点还要保存孩子指针与 terminal 标记，实际空间取决于字母表实现。L 是关键字长度，不是词数；键树不会因为词多而自动变慢，除非前缀共享减少。',
      en: 'Lookup and insertion follow exactly one path of length L, finding one character among each node’s children; a fixed alphabet array makes each layer O(1) and the total O(L). An ordered child list or hash map changes the per-layer factor with the branching degree, but the cost is still normally written O(L), ignoring that constant or logarithmic child lookup. Space counts the total characters of all keys: shared prefixes are stored once, so it is smaller than independent storage of every word; with no sharing the worst case is O(ΣL) nodes. Each node also stores child pointers and a terminal mark, so real space depends on the alphabet representation. L is key length, not word count; a trie does not slow down merely because it holds many words, unless sharing disappears.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 哨兵根与共享前缀路径', en: '① Sentinel root and shared-prefix paths' },
      explanation: {
        zh: '根节点不携带字符，只作为所有关键字的起点。每个非根节点保存一个字符，从根到它的路径按顺序拼出前缀。car、card、care 共享 c→a→r，只在 r 之后分出 d、e；do 与 dog 共享 d→o。init 帧给出完整节点集合、父子边、终止标记与叶链无关的真实结构。节点 id 由创建顺序决定，不能根据画布位置推断父子关系。',
        en: 'The root carries no character and only anchors every key. Each non-root node stores one character, and the root-to-node path spells its prefix in order. Car, card and care share c→a→r and branch only after r into d and e; do and dog share d→o. The init frame reports the complete node set, parent/child edges and terminal marks. Node ids follow creation order; parent/child relations are never inferred from canvas positions.',
      },
    },
    {
      stepId: 'compare',
      title: { zh: '② 逐字符查找对应孩子', en: '② Check one character at a time for a child' },
      explanation: {
        zh: '查找从根开始，按目标词的字符顺序逐个检查当前节点是否有对应字符的孩子。compare 帧记录已匹配长度、当前字符与当前节点。若孩子存在，沿边下降并把 matchedLength 加一；若不存在，目标后缀不可能出现，立即失败。每个节点同一字符至多一个孩子，因此同一层不会出现两个相同字符分支。',
        en: 'Search starts at the root and checks, in target order, whether the current node has a child for each character. The compare frame records the matched length, current character and node. An existing child means descend and increment matchedLength; a missing child proves the remaining suffix cannot exist, so the search fails at once. A node has at most one child per character, so no two branches at one level carry the same character.',
      },
    },
    {
      stepId: 'create',
      title: { zh: '③ 插入只为缺失的后缀建节点', en: '③ Insertion creates nodes only for the missing suffix' },
      explanation: {
        zh: '插入同样先逐字符前进，但遇到缺失孩子时不失败，而是新建一个字符节点并接到当前节点。create 帧记录新节点 id、字符、父节点与已匹配长度；已存在的共享前缀一个节点也不复制。新节点创建后继续处理剩余字符，最终在路径末端设置 terminal。若目标词已经存在且末端 terminal=true，则先发出 duplicate，树不创建任何节点。',
        en: 'Insertion also walks character by character, but a missing child is not a failure: a new character node is created and attached to the current node. The create frame records the new id, character, parent and matched length; an existing shared prefix is never copied. After creation the remaining characters continue, and terminal is set at the path end. If the word already exists with terminal=true, duplicate is emitted first and no node is created.',
      },
    },
    {
      stepId: 'terminal',
      title: { zh: '④ 终止标记：路径末端才成为完整关键字', en: '④ Terminal mark: only the path end becomes a complete key' },
      explanation: {
        zh: '路径走完后，terminal 帧把末端节点的 terminal 设为 true。这个标记与“节点存在”是两件不同的事：节点存在只说明前缀存在，terminal=true 才说明从根到这里的整个字符串是一个词。插入一个已经是其他词前缀的词（例如先有 ca，再插入 cat）不需要新建任何节点，只需在已有末端补上 terminal。删除一个词时也只清除 terminal，不能直接删掉仍被更长词共享的节点。',
        en: 'After the path is complete, the terminal frame sets terminal=true on the final node. This mark is distinct from node existence: an existing node only proves the prefix exists, while terminal=true declares the whole root-to-node string a word. Inserting a word that is already a prefix of longer words, such as ca before cat, creates no node and only adds terminal at the existing end. Deleting a word clears terminal only; nodes still shared by longer words must not be removed.',
      },
      tip: { zh: '节点存在 ≠ 关键字存在；terminal 才是词标记。', en: 'Node existence is not key existence; terminal is the word marker.' },
    },
    {
      stepId: 'found',
      title: { zh: '⑤ 路径走完且 terminal=true：命中', en: '⑤ Complete path with terminal=true: a hit' },
      explanation: {
        zh: '当所有字符都成功匹配、且末端节点 terminal=true 时发出 found，result=found，并给出完整路径与匹配长度。两个条件缺一不可：缺边会在中途 not-found，路径存在但没有 terminal 会在末端 not-found。命中不修改树，也不改变任何节点的孩子或标记。',
        en: 'When every character matches and the final node has terminal=true, found sets result=found and reports the complete path and matched length. Both conditions are required: a missing edge fails partway, while a complete path without terminal fails at the end. A hit changes neither the tree nor any child pointer or mark.',
      },
    },
    {
      stepId: 'not-found',
      title: { zh: '⑥ 两种失败：缺边与“只是前缀”', en: '⑥ Two failures: missing edge and “prefix only”' },
      explanation: {
        zh: 'not-found 可能发生在中途，也可能发生在路径末端。中途失败说明某个字符没有对应孩子，剩余后缀根本不存在；末端失败说明整个词的所有字符都存在，但末端没有 terminal，因此它只是更长关键字的前缀。帧里的 matchedLength 精确区分两者：小于词长说明缺边，等于词长但没有 terminal 说明只是前缀。这两种失败都不修改树。',
        en: 'Not-found may occur partway or at the very end. A partial match means one character has no child and the remaining suffix does not exist; an end failure means all characters exist but the final node is not terminal, so the string is only a prefix of longer keys. The frame’s matchedLength distinguishes them exactly: below the word length means a missing edge, equal to the word length without terminal means prefix only. Neither failure mutates the tree.',
      },
    },
    {
      stepId: 'duplicate',
      title: { zh: '⑦ 重复关键字：修改前拒绝', en: '⑦ Duplicate key: reject before mutation' },
      explanation: {
        zh: '插入前先完成一次只读查找。如果路径走完且末端 terminal=true，说明该词已经存在，立即发出 duplicate，result=duplicate，不创建节点、不改变标记。若末端节点存在但 terminal=false，则不是重复，只需要补上终止标记。这个检查顺序保证“重复”不会以“插入成功但看不见差异”的形式悄悄发生。',
        en: 'Insertion performs a read-only lookup first. If the path completes and the end is terminal=true, the word already exists; duplicate sets result=duplicate without creating nodes or changing marks. If the end node exists with terminal=false, it is not a duplicate and only needs the terminal mark. This order ensures a duplicate is never a silent “successful insertion with no visible change”.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑧ 结果、词典与前缀共享的代价', en: '⑧ Result, dictionary and the cost of shared prefixes' },
      explanation: {
        zh: 'done 帧汇总操作结果、最终词典与真实节点集合。键树查找与插入只沿长度 L 的一条路径，时间 O(L)；空间按所有词的字符总数计，共享前缀只保存一份。与普通 BST 相比，键树的层数由关键字长度决定，而不是由词数决定，比较也不再是“整个键与键比较”，而是逐字符选边；这使它天然适合前缀查询，但每个字符节点都带指针开销，且字母表越大单节点越宽。课程只实现查找与插入，不扩展成完整自动补全或文本搜索引擎。',
        en: 'The done frame summarizes the result, final dictionary and real node set. Trie lookup and insertion follow one path of length L in O(L) time; space counts all characters and stores a shared prefix once. Compared with a BST, depth is governed by key length rather than word count, and comparison becomes per-character edge selection instead of whole-key comparison. That makes prefix queries natural, but every character node carries pointer overhead and a larger alphabet widens each node. The course implements search and insertion only; it is not a full autocomplete or text search engine.',
      },
      tip: { zh: '键树的深度由关键字长度决定，不由词数决定。', en: 'Trie depth follows key length, not the number of words.' },
    },
  ],
  commonMistakes: {
    zh: [
      '只看路径存在就判定命中，忽略末端 terminal 标记。',
      '插入共享前缀时复制整条路径，破坏前缀共享。',
      '把 ca 当成已经存在于 car、care 词典中的词。',
      '重复插入时先建节点再检查，导致“拒绝”后树已改变。',
      '删除词时直接删节点，破坏更长词仍在使用的共享路径。',
      '把键树与普通 BST 混为一谈：键树的层数由字符长度决定。',
    ],
    en: [
      'Declaring a hit merely because the path exists, ignoring the terminal mark.',
      'Copying an entire shared prefix during insertion instead of reusing it.',
      'Treating ca as an existing word because car and care are in the dictionary.',
      'Creating nodes before the duplicate check, so a rejection has already changed the tree.',
      'Deleting a node when removing a word, breaking shared paths still used by longer words.',
      'Confusing a trie with a BST: trie depth follows character length.',
    ],
  },
};

export const SEARCH09_LESSONS: readonly Lesson[] = [
  blockSearchLesson,
  bplusTreeLesson,
  keyTreeLesson,
];
