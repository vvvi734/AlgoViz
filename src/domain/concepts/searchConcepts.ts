import type { ConceptPage } from './types';

/**
 * TEXTBOOK-09 chapter-9 theory pages. They are static lessons only: every
 * dynamic operation lives in the lab player, while this module explains the
 * vocabulary, preconditions, ASL contracts and cross-structure trade-offs.
 */
export const SEARCH_CONCEPT_PAGES: readonly ConceptPage[] = [
  {
    id: 'search-basics',
    topicId: 'search-basics',
    title: ['查找的基本概念', 'Search fundamentals'],
    chapter: ['第 9 章 · 查找', 'Chapter 9 · Searching'],
    summary: [
      '查找是在一组记录中按关键字确定“是否存在、在哪里”的过程。查找表可以只读，也可以在查询之间插入或删除，因此静态查找与动态查找的分界不是数据结构名称，而是更新是否允许发生。平均查找长度 ASL 把成功与失败分开，按概率对关键字比较次数求期望；它比一个大 O 更贴近具体数据，也要求明确概率与计数口径。',
      'Searching determines whether a key exists and where its record is. A search table may be read-only or may change through insertions and deletions, so the line between static and dynamic search is whether updates are allowed, not the name of a container. Average search length (ASL) separates success from failure and averages key comparisons under stated probabilities; it is more concrete than big-O but only meaningful with explicit probability and counting conventions.',
    ],
    diagram: 'search-basics',
    definitions: [
      {
        term: ['查找表', 'Search table'],
        text: ['由同一类记录构成的集合，并支持按关键字访问。顺序表、链表、树和哈希表都可以承载查找表，差别在访问路径与更新代价。', 'A collection of records of one type supporting access by key. Arrays, lists, trees and hash tables can all host one; they differ in access paths and update costs.'],
      },
      {
        term: ['关键字 key', 'Key'],
        text: ['记录中用于识别或排序的数据项。主关键字唯一标识记录，次关键字可能重复；重复时“查找成功返回哪一条”必须另行约定。', 'A data item used to identify or order a record. A primary key uniquely identifies it; a secondary key may repeat, so which match is returned must be specified.'],
      },
      {
        term: ['记录 record', 'Record'],
        text: ['查找真正取回的数据单位，通常含多个字段。关键字只是记录的一部分，比较关键字不等于已经取得整条记录。', 'The data unit ultimately returned, usually with several fields. The key is only part of a record; comparing keys is not retrieving the record.'],
      },
      {
        term: ['静态查找', 'Static search'],
        text: ['查询期间表结构不变。顺序、二分、分块和静态树表都属于这一类。', 'The table does not change during queries. Sequential, binary, block and static-tree search belong here.'],
      },
      {
        term: ['动态查找', 'Dynamic search'],
        text: ['查询与插入、删除共用同一结构，更新后仍须满足搜索不变量。BST、AVL、B 树、B+ 树和哈希表都属于这一类。', 'Queries share one structure with insertions/deletions, and updates preserve search invariants. BSTs, AVL trees, B/B+ trees and hash tables belong here.'],
      },
      {
        term: ['平均查找长度 ASL', 'Average search length (ASL)'],
        text: ['给定查找概率下，一次查找所需关键字比较次数的期望。ASL_succ 与 ASL_fail 必须分别归一、分别报告。', 'The expected number of key comparisons under stated probabilities. ASL_succ and ASL_fail are normalized and reported separately.'],
      },
      {
        term: ['查找成功 / 失败', 'Successful / unsuccessful search'],
        text: ['成功表示关键字存在并返回记录；失败表示已确定不存在。失败也可能走完整条路径，不能视为零成本。', 'Success returns the record for an existing key; failure establishes absence. Failure may traverse a full path and is not free.'],
      },
      {
        term: ['索引', 'Index'],
        text: ['从关键字或块边界指向数据位置的辅助结构。索引缩短查找范围，但增加空间和更新维护成本。', 'An auxiliary structure mapping keys or block bounds to data locations. It narrows the range but adds space and maintenance.'],
      },
    ],
    sections: [
      {
        title: ['一次查找到底在做什么', 'What one search actually does'],
        body: [
          '给定查找表 T、关键字 k 和比较规则，查找要回答：k 是否在 T 中；若在，对应哪条记录。比较规则必须与数据组织一致：二分要求同一全序，BST 要求左小右大，哈希要求等值关键字得到同一地址。比较规则含糊时，“有序”本身也没有定义。',
          'Given a table T, key k and a comparison rule, a search answers whether k is present and which record it identifies. The rule must match the organization: binary search needs a total order, a BST needs left-smaller/right-larger, hashing needs equal keys at one address. Without a clear rule, even “sorted” is undefined.',
        ],
        points: [
          ['命中通常还要返回记录位置或整条记录，不只是布尔值。', 'A hit usually returns a position or the whole record, not just a Boolean.'],
          ['关键字比较、指针访问与磁盘 I/O 是不同成本。', 'Key comparisons, pointer accesses and disk I/O are different costs.'],
          ['重复关键字要约定返回第一条、最后一条还是全部匹配。', 'With duplicates, define first, last or all matches.'],
        ],
      },
      {
        title: ['静态查找与动态查找', 'Static versus dynamic search'],
        body: [
          '静态表在查询阶段不变，因此可把建表成本摊到很多次查询上：排序、建索引、建静态树都是“一次预处理、多次查询”的投资。动态表把查询和更新放在同一结构上，每次插入删除后恢复搜索不变量；它优化整个操作序列，而不是单次查询。',
          'A static table is unchanged during queries, so sorting, indexing or building a static tree amortizes over many lookups. A dynamic table combines queries with updates and restores invariants after each change; it optimizes the operation sequence, not one lookup.',
        ],
        points: [
          ['静态不等于永远不能改，而是查询阶段不改；仍可批量重建。', 'Static means no change during queries, not immutable; batch rebuilds may occur.'],
          ['动态结构必须同时报告查找、插入、删除三条成本。', 'A dynamic structure must report search, insert and delete costs.'],
          ['更新远少于查询时预处理可能更划算；更新频繁则重建会吞掉优势。', 'Rare updates favour preprocessing; frequent updates can erase that advantage.'],
        ],
      },
      {
        title: ['ASL：成功与失败必须分开', 'ASL: success and failure stay apart'],
        body: [
          '设成功命中第 i 个关键字的概率为 p_i、比较次数为 c_i；失败落入第 j 个失败区间的概率为 q_j、比较次数为 c_j。两组概率各自归一：Σp_i = 1、Σq_j = 1。只有知道查询“存在”的先验概率 P_s，才能合成总期望。把成功与失败的概率直接混加是常见错误。',
          'Let p_i and c_i be the probability and comparison count for hitting key i given success; q_j and c_j for failure gap j. Each set sums to one: Σp_i = 1 and Σq_j = 1. Only the prior P_s that a query exists lets us combine them. Mixing the two probability sets is a common error.',
        ],
        formula: 'ASL_succ = Σ p_i c_i,  Σ p_i = 1\nASL_fail = Σ q_j c_j,  Σ q_j = 1\nE[C] = P_s·ASL_succ + (1 − P_s)·ASL_fail',
        points: [
          ['等概率成功基准 p_i = 1/n；顺序扫描的首项到末项 ASL_succ = (n+1)/2。', 'Equal-probability baseline p_i = 1/n; a first-to-last scan gives ASL_succ = (n+1)/2.'],
          ['有序表有 n+1 个失败区间；等概率时 q_j = 1/(n+1)，但各区间比较次数可能不同。', 'An ordered table has n+1 failure gaps; equal probability gives q_j = 1/(n+1), though counts may differ by gap.'],
          ['是否计最后一次失配、是否使用哨兵，会改变 c_i 与 c_j。', 'Counting the final mismatch and using a sentinel change c_i and c_j.'],
          ['ASL 依赖 n、概率和数据形状；换概率就换结果。', 'ASL depends on n, probabilities and data shape; another distribution changes it.'],
        ],
      },
      {
        title: ['有序表、无序表与索引', 'Ordered tables, unordered tables and indexes'],
        body: [
          '无序表只能逐项排除；有序表允许二分，但维持全局有序通常要搬移。索引是第三条路：不要求数据全局有序，而用较小的辅助表把目标限制在局部，例如分块查找的块最大值索引。索引自身也有顺序与维护成本。',
          'An unordered table can only exclude items one by one; an ordered table enables binary search but maintaining order may require shifts. An index is a third path: it avoids global order and uses a smaller auxiliary table to restrict the target locally, as block maxima do. The index itself has order and maintenance costs.',
        ],
        points: [
          ['“有序”必须说明关键字、比较规则和重复策略。', '“Ordered” must state the key, comparison rule and duplicate policy.'],
          ['索引只缩短定位范围，不会自动确认命中。', 'An index narrows location; it never confirms a hit itself.'],
          ['索引项至少保存边界与位置；仅一个最大值无法定位整块。', 'An index entry needs bounds and location; a maximum alone cannot locate a block.'],
          ['哈希不是有序索引，它依赖散列函数映射到桶。', 'Hashing is not an ordered index; it uses a hash function to map keys to buckets.'],
        ],
      },
      {
        title: ['查找、插入、删除是同一笔账', 'Search, insert and delete share one budget'],
        body: [
          '只比较查找复杂度会误导。二分查询 O(log n)，但有序数组插入可能搬移 O(n)；哈希平均 O(1)，却可能扩容并重新散列；B+ 树查询 O(log n)，插入分裂与删除合并也受阶数约束。评价结构必须按真实工作负载把三种操作一起算。',
          'Search-only comparisons mislead. Binary search is O(log n), but inserting into a sorted array may shift O(n); hashing averages O(1) but may resize and rehash; a B+ tree searches in O(log n) while splits and merges stay bounded by its order. Evaluate all three operations for the real workload.',
        ],
        points: [
          ['只读场景可摊销预处理；频繁更新必须计入维护。', 'Read-only workloads amortize preprocessing; frequent updates must charge maintenance.'],
          ['哈希的期望 O(1) 不保证最坏 O(1)。', 'Expected O(1) hashing does not guarantee worst-case O(1).'],
          ['外存查找首先数磁盘 I/O，而不是内存比较次数。', 'External search counts disk I/O before in-memory comparisons.'],
          ['装填因子、树高、关键字长度都会改变真实成本。', 'Load factor, height and key length change real costs.'],
        ],
      },
    ],
    comparison: {
      title: ['静态查找与动态查找的边界', 'The boundary between static and dynamic search'],
      columns: [
        ['维度', 'Dimension'],
        ['静态查找', 'Static search'],
        ['动态查找', 'Dynamic search'],
      ],
      rows: [
        [
          ['结构是否变化', 'Structure changes'],
          ['查询阶段不变', 'Fixed during queries'],
          ['插入删除与查询交错', 'Updates interleave with queries'],
        ],
        [
          ['典型结构', 'Typical structures'],
          ['顺序、二分、分块、静态树表', 'Sequential, binary, block, static tree'],
          ['BST、AVL、B 树、B+ 树、哈希、键树', 'BST, AVL, B/B+ tree, hash, trie'],
        ],
        [
          ['主要投资', 'Main investment'],
          ['一次排序 / 建索引 / 建树', 'One-time sort / index / build'],
          ['每次更新维护不变量', 'Maintain invariants on every update'],
        ],
        [
          ['成本口径', 'Cost accounting'],
          ['单次 ASL + 预处理摊销', 'Single-search ASL + preprocessing'],
          ['整个序列的查找、插入、删除', 'Search/insert/delete over the sequence'],
        ],
      ],
    },
    takeaway: ['查找表的核心是“按关键字取得记录”；静态与动态的分界是更新是否共用结构。ASL 必须分别给出成功与失败的概率、比较次数与计数口径。有序、索引、平衡与散列都是缩短路径的前置条件，不是免费的性能标签。', 'A search table retrieves records by key; static versus dynamic depends on whether updates share the structure. ASL must state success/failure probabilities, counts and conventions. Order, indexes, balance and hashing are preconditions that shorten paths, not free performance labels.'],
  },
  {
    id: 'static-tree-table',
    topicId: 'static-tree-table',
    title: ['静态树表与次优查找树', 'Static tree tables and nearly optimal search trees'],
    chapter: ['第 9 章 · 查找', 'Chapter 9 · Searching'],
    summary: [
      '静态树表针对关键字集合和查询频率基本固定的问题：先把比较路径建成判定树，使加权路径长度尽量小。高频关键字靠近根，成功查找的平均比较次数下降。严格最优构造代价高，教材常用次优查找树：按累计权值选根并递归，用较小建树成本换取接近最优的 ASL。',
      'A static tree table targets a nearly fixed key set and query distribution: build a decision tree with small weighted path length, placing frequent keys near the root to reduce successful comparisons. Exact optimal construction is costly; the textbook’s nearly optimal tree chooses roots by cumulative weights and recurses, trading some optimality for much cheaper construction.',
    ],
    diagram: 'static-tree-table',
    definitions: [
      {
        term: ['静态树表', 'Static tree table'],
        text: ['查询集合固定或基本固定，预先构造用于比较的树；查询阶段只走树，不插入、不删除。', 'A tree built in advance for a fixed or nearly fixed key set; queries only traverse it.'],
      },
      {
        term: ['判定树', 'Decision tree'],
        text: ['内部节点存放一次比较的关键字，分支表示比较结果；成功止于内部节点，失败止于外部空区间。', 'Internal nodes hold compared keys and branches represent outcomes; success ends internally, failure in an external gap.'],
      },
      {
        term: ['加权路径长度 WPL', 'Weighted path length (WPL)'],
        text: ['所有关键字权值乘以其深度之和。权值可来自查询频率；WPL 越小，平均成功成本越低。', 'The sum of each key weight times its depth. Weights may be query frequencies; smaller WPL means lower average success cost.'],
      },
      {
        term: ['次优查找树', 'Nearly optimal search tree'],
        text: ['按左右累计权值之差最小选根，再递归建左右子树。它不保证全局 WPL 最小，但构造简单、结果接近最优。', 'Choose a root minimizing the cumulative-weight difference, then recurse. It does not guarantee a global minimum but is simple and close.'],
      },
      {
        term: ['等权与不等权', 'Equal and unequal weights'],
        text: ['等权时最优树接近平衡树；不等权时高频关键字应靠近根，树形可能明显偏斜。', 'With equal weights the optimum is nearly balanced; unequal weights pull frequent keys upward and may skew the shape.'],
      },
    ],
    sections: [
      {
        title: ['它解决的不是动态插入', 'It does not solve dynamic insertion'],
        body: [
          '静态树表与 BST 的区别不在“是不是树”，而在更新假设。BST 把插入删除当作一等操作，必须随时保持不变量；静态树表假设关键字集合和权值已确定，建树后主要查询。查询分布变化时，旧树 WPL 可能不再接近最优，需要重建。',
          'A static tree differs from a BST not in being a tree but in update assumptions. A BST treats insertion/deletion as first-class and maintains invariants at all times; a static tree assumes the key set and weights are known. If the query distribution shifts, the old WPL may no longer be near optimal and a rebuild is needed.',
        ],
        points: [
          ['适合“建一次、查很多次”，不适合高频在线更新。', 'Suits build-once/query-many, not frequent online updates.'],
          ['权值是查询频率或优先级，不是关键字大小。', 'Weights are frequencies or priorities, not key values.'],
          ['同一关键字集合换一组权值，最优树可能完全不同。', 'One key set under another distribution may need a different tree.'],
        ],
      },
      {
        title: ['最优静态树为什么难构造', 'Why exact optimal construction is hard'],
        body: [
          '等权时最优判定树应尽量平衡，使深度总和最小；权值不等时，要在有序关键字序列上选根并递归划分，使 Σw_i·depth_i 最小。穷举所有根的选择会指数增长。次优查找树用局部规则代替全局搜索，因此才叫“次优”。',
          'With equal weights the optimum is as balanced as possible, minimizing total depth. With unequal weights, roots must be chosen over an ordered sequence and intervals recursed to minimize Σw_i·depth_i. Exhaustive root choices grow exponentially. The nearly optimal tree uses a local rule, hence “nearly”.',
        ],
        points: [
          ['WPL 最小化同时受关键字顺序和权值分布约束。', 'Minimizing WPL is constrained by both key order and weights.'],
          ['教材算法常以累计权值差最小选根，再递归左右区间。', 'Textbook algorithms often pick the root with the smallest cumulative-weight difference, then recurse.'],
          ['“次优”明确承认非全局最优，换取可实现性。', '“Nearly optimal” explicitly trades global optimality for feasibility.'],
        ],
      },
      {
        title: ['ASL 与 WPL 的关系', 'ASL and WPL'],
        body: [
          '若权值就是成功查找概率，深度从 1 开始计，则 ASL_succ = Σp_i·depth_i，正好等于归一化后的 WPL。等权时 ASL 等于平均深度。失败查找还要给每个外部区间赋概率，并按该区间实际经过的比较次数计算 ASL_fail。',
          'If weights are success probabilities and depth starts at 1, ASL_succ = Σp_i·depth_i, the normalized WPL. With equal weights ASL is mean depth. Failure needs a probability for each external gap and its actual comparison count.',
        ],
        formula: 'WPL = Σ w_i·depth_i\nASL_succ = WPL / Σ w_i  (w_i = p_i 时)\nASL_fail = Σ q_j·c_j',
        points: [
          ['深度起算必须统一：根为第 1 层时比较次数等于深度。', 'Fix the depth convention: root at level 1 makes comparisons equal depth.'],
          ['权值未归一时先除以总权值，不能直接当 ASL。', 'Unnormalized weights must be divided by the total before calling the result ASL.'],
          ['失败 ASL 与树形、外部区间概率有关，不能只报成功值。', 'Failure ASL depends on shape and gap probabilities; never report success alone.'],
        ],
      },
      {
        title: ['次优查找树的构造直觉', 'Construction intuition'],
        body: [
          '把关键字按大小排成序列，每个关键字带权值。对当前区间计算前缀权值和，选一个位置使左右累计权值尽量接近；该位置成为子树根，左右区间递归。高频或“两侧权重平衡”的关键字靠近根，低频关键字下沉。教材实现可能比较相邻候选，避免只凭一个前缀和选错根。',
          'Order the keys and attach weights. For each interval compute prefix weight sums and choose a position whose left/right totals are as close as possible; it becomes the root and the intervals recurse. Frequent or weight-balancing keys rise while rare keys sink. Implementations may compare adjacent candidates to avoid a poor root.',
        ],
        points: [
          ['累计权值差是启发式，不是 WPL 的精确全局优化。', 'Cumulative-weight difference is a heuristic, not an exact global WPL optimizer.'],
          ['递归区间必须保持关键字顺序，否则搜索性质被破坏。', 'Recursive intervals must preserve key order, or the search property breaks.'],
          ['构造复杂度通常为 O(n log n) 或 O(n²) 量级，不应写成 O(1)。', 'Construction is typically O(n log n) or O(n²), not O(1).'],
        ],
      },
      {
        title: ['与二分判定树、平衡树的关系', 'Relation to binary decision trees and balanced trees'],
        body: [
          '二分判定树由“每次取中点”决定，等权时已接近最优；静态树表允许按权值改变根，因此能处理查询偏斜。AVL 也保持平衡，但目标是动态更新后的高度约束，而不是固定权值下的 WPL。三者都用二叉树，却在优化不同目标。',
          'A binary decision tree is fixed by midpoint choices and is near optimal with equal weights. A static tree may choose roots by weights, handling skew. AVL also balances, but its goal is height after dynamic updates, not WPL under fixed weights. All use binary trees while optimizing different objectives.',
        ],
        points: [
          ['二分判定树不需要权值；静态树表需要频率数据。', 'A binary decision tree needs no weights; a static tree needs frequencies.'],
          ['AVL 旋转服务动态更新；静态树通常不旋转。', 'AVL rotations serve dynamic updates; a static tree usually does not rotate.'],
          ['把静态树表当成“另一种 AVL”会混淆目标与更新假设。', 'Treating a static tree as another AVL confuses objectives and update assumptions.'],
        ],
      },
    ],
    comparison: {
      title: ['静态树表、二分判定树与 AVL', 'Static tree, binary decision tree and AVL'],
      columns: [
        ['维度', 'Dimension'],
        ['静态树表 / 次优树', 'Static / nearly optimal tree'],
        ['二分判定树', 'Binary decision tree'],
        ['AVL', 'AVL'],
      ],
      rows: [
        [
          ['优化目标', 'Objective'],
          ['固定权值下的 WPL / ASL', 'WPL/ASL under fixed weights'],
          ['中点划分下的比较路径', 'Comparison path from midpoint splits'],
          ['动态更新后的高度平衡', 'Height balance after updates'],
        ],
        [
          ['是否支持插入删除', 'Dynamic updates'],
          ['通常不支持，需重建', 'Usually no; rebuild'],
          ['不支持，需保持有序表', 'No; sorted table required'],
          ['支持，旋转维护', 'Yes, via rotations'],
        ],
        [
          ['关键输入', 'Key input'],
          ['关键字与权值', 'Keys and weights'],
          ['有序关键字', 'Sorted keys'],
          ['插入/删除序列', 'Insert/delete sequence'],
        ],
        [
          ['典型 ASL', 'Typical ASL'],
          ['接近最优，由权值决定', 'Near optimal, weight-dependent'],
          ['等权时接近最优', 'Near optimal with equal weights'],
          ['O(log n) 高度，ASL 随概率', 'O(log n) height; ASL depends on probabilities'],
        ],
      ],
    },
    takeaway: ['静态树表把固定查询集合的比较路径预先做成树，用 WPL / ASL 衡量；次优查找树用累计权值选根，换取可实现的近优构造。它不是动态结构，更新通常意味着重建。等权时二分判定树已接近最优，不等权时才更显静态树表的价值。', 'A static tree prebuilds comparison paths and judges them by WPL/ASL. The nearly optimal tree chooses roots from cumulative weights, trading exact optimality for feasible construction. It is not dynamic: updates usually mean rebuilding. With equal weights a binary decision tree is already near optimal; unequal weights reveal the static tree’s value.'],
  },
  {
    id: 'hashing-basics',
    topicId: 'hashing-basics',
    title: ['哈希函数、冲突与装填因子', 'Hash functions, collisions and load factor'],
    chapter: ['第 9 章 · 查找', 'Chapter 9 · Searching'],
    summary: [
      '哈希查找用 h(k) 把关键字映射到桶下标，理想情况下一次计算即可定位。不同关键字可能得到同一地址，这就是冲突；冲突必须由链地址法或开放定址法显式处理。装填因子 α = n/m 衡量桶的拥挤程度，冲突策略与 α 共同决定成功、失败的 ASL。O(1) 是均匀散列和低装填因子下的期望，不是无条件的最坏保证。',
      'Hashing maps a key k to a bucket index through h(k), ideally locating it in one computation. Distinct keys may reach the same address; such collisions must be handled explicitly by chaining or open addressing. The load factor α = n/m measures bucket occupancy, and collision policy plus α determines successful and unsuccessful ASL. O(1) is an expectation under uniform hashing and low load, not an unconditional worst-case guarantee.',
    ],
    diagram: 'hashing-basics',
    definitions: [
      {
        term: ['哈希函数 h(k)', 'Hash function h(k)'],
        text: ['把关键字映射到 0..m−1 桶地址的函数。它应计算简单、结果均匀，并尽量降低实际关键字集合的冲突。', 'A function mapping a key to a bucket address 0..m−1. It should be cheap, uniform and reduce collisions for the real key set.'],
      },
      {
        term: ['冲突 collision', 'Collision'],
        text: ['两个不同关键字得到同一地址。冲突不可避免，因为关键字空间通常远大于桶数；好函数只能降低概率。', 'Two distinct keys receive one address. Collisions are unavoidable because the key space usually exceeds bucket count; a good function only lowers probability.'],
      },
      {
        term: ['装填因子 α', 'Load factor α'],
        text: ['α = n/m，n 是记录数、m 是桶数。α 越高，平均链长或探测长度通常越大。', 'α = n/m, where n is record count and m bucket count. Higher α usually means longer chains or probes.'],
      },
      {
        term: ['链地址法', 'Separate chaining'],
        text: ['每个桶保存链表，同地址记录串在一起。删除直接摘链，不需要墓碑；额外空间是指针与节点。', 'Each bucket holds a list and same-address records share it. Deletion unlinks without tombstones; extra cost is pointers/nodes.'],
      },
      {
        term: ['开放定址法', 'Open addressing'],
        text: ['冲突时按探测序列在表内找下一个空槽。记录都在桶数组中，不需要链节点；删除若直接置空会截断探测链。', 'On collision, probe the table for another empty slot. Records live in the array without nodes; clearing a deleted slot would break probe chains.'],
      },
      {
        term: ['墓碑 tombstone', 'Tombstone'],
        text: ['开放定址中表示“曾有记录、现已删除”的标记。查找可越过它继续探测，插入可复用该槽，表需定期清理或重建。', 'A marker for “a record once lived here and was deleted”. Search may pass it, insertion may reuse it, and the table needs cleanup or rebuilding.'],
      },
      {
        term: ['均匀散列假设', 'Uniform hashing assumption'],
        text: ['每个关键字等概率落入每个桶且相互独立。它是期望链长和探测长度的分析基准，真实函数通常只能近似。', 'Each key reaches each bucket with equal probability and independently. It is the analysis baseline for chain/probe lengths; real functions only approximate it.'],
      },
    ],
    sections: [
      {
        title: ['哈希函数设计的基本原则', 'Basic design principles'],
        body: [
          '哈希函数应计算快、地址分布均匀、对输入规律不敏感。除留余数法 h(k) = k mod p 常用素数 p，避免关键字公因子与桶数共振；乘法散列抽取乘积小数部分的高位；折叠法把长关键字分段相加；数字分析法选分布均匀的位。教材列举多种构造，不代表每种都要单独播放器。',
          'A hash function should be cheap, uniformly distribute and resist input regularities. Division hashing h(k) = k mod p often uses a prime p to avoid common factors; multiplicative hashing extracts high bits of a fractional product; folding adds key segments; digit analysis selects well-distributed digits. These constructions do not each need a player.',
        ],
        formula: 'h(k) = k mod p        (p 取合适素数)\nh(k) = ⌊m·(k·A mod 1)⌋  (0 < A < 1)\nα = n / m',
        points: [
          ['模数不要与关键字集合的固定因子同频。', 'Do not let the modulus share fixed factors with the key set.'],
          ['哈希不是加密：追求速度与分布，不要求可逆或抗攻击。', 'Hashing is not encryption: it targets speed/distribution, not reversibility or attack resistance.'],
          ['字符串要混合每个字符的贡献，不能只看首字符或长度。', 'String keys should mix every character, not just the first or length.'],
          ['桶数 m 与函数共同决定地址空间。', 'Bucket count m and the function jointly define the address space.'],
        ],
      },
      {
        title: ['冲突处理：链地址与开放定址', 'Collision handling'],
        body: [
          '链地址法把同地址记录串成链，桶只存链头；查找先算地址再沿链比较，删除摘链即可。开放定址法按 h(k)、h(k)+d₁、h(k)+d₂… 探测直到命中或空槽。线性探测 d_i = i 简单但产生一次聚集；二次探测与双重散列改变序列，也各有聚集或计算成本。',
          'Chaining links same-address records and stores only a head per bucket; search hashes then walks the chain, while deletion unlinks. Open addressing probes h(k), h(k)+d₁, h(k)+d₂… until a hit or empty slot. Linear probing d_i = i is simple but causes primary clustering; quadratic probing and double hashing change the sequence at other costs.',
        ],
        points: [
          ['链地址查找成本由链长决定，α 约等于平均链长。', 'Chaining cost follows chain length; α approximates mean chain length.'],
          ['开放定址探测必须能覆盖整个表，线性探测在未满时可覆盖全表。', 'Open-addressing probes must cover the table; linear probing does while not full.'],
          ['删除不能简单置空，否则同一探测链的后续记录会失联。', 'Never clear a slot blindly; later records on the probe chain become unreachable.'],
          ['α 接近 1 时探测长度急剧上升，通常要扩容或重建。', 'As α approaches 1, probes explode; resize or rebuild.'],
        ],
      },
      {
        title: ['装填因子与 ASL', 'Load factor and ASL'],
        body: [
          '在均匀散列、链地址、成功等概率的简化模型下，成功 ASL 约为 1 + α/2，失败 ASL 约为 α（不同教材对空链检查的计法不同）。开放定址线性探测的成功与失败 ASL 都随 α 非线性增长，接近满表时迅速恶化。公式是模型结论，不是对任意函数和任意分布的保护。',
          'Under uniform hashing, chaining and equal-probability success, successful ASL is about 1 + α/2 and unsuccessful about α (textbooks differ on empty-chain checks). Linear probing grows nonlinearly in both directions and deteriorates near full occupancy. These are model results, not protection for every function and distribution.',
        ],
        formula: '链地址（简化模型）: ASL_succ ≈ 1 + α/2,  ASL_fail ≈ α\n开放定址线性探测: ASL 随 α 非线性增长\nα = n/m',
        points: [
          ['报告 ASL 必须同时给出 α、冲突策略和成功/失败条件。', 'Report ASL with α, collision policy and success/failure conditions.'],
          ['链地址失败可能走完整链；空链只需一次地址检查，口径要说明。', 'A chaining failure may walk the whole chain; an empty chain needs one check, so state the convention.'],
          ['墓碑会增加后续查找的探测长度。', 'Tombstones lengthen later probes.'],
          ['扩容会改变 m 并重新散列全部记录，是 O(n) 级维护。', 'Resizing changes m and rehashes all records, O(n) maintenance.'],
        ],
      },
      {
        title: ['最坏情况：为什么不能笼统说 O(1)', 'Worst case: why “O(1)” is conditional'],
        body: [
          '如果所有关键字落到同一个桶，链地址退化为长度 n 的链，查找最坏 O(n)；开放定址可能探测很多槽甚至因表满失败。对手可以挑选与哈希函数共振的关键字集合，制造拒绝服务式退化。工程上通过随机化/密钥化哈希、限制装填因子和监控链长来降低风险。',
          'If every key lands in one bucket, chaining degenerates to an n-node list and search is worst-case O(n); open addressing may probe many slots or fail when full. An adversary can choose resonant keys and cause denial-of-service degradation. Randomized/keyed hashing, load limits and chain monitoring mitigate it.',
        ],
        points: [
          ['期望 O(1) 以均匀散列与受控 α 为前提。', 'Expected O(1) assumes uniform hashing and controlled α.'],
          ['最坏与平均必须一起报告，尤其是输入可被对手控制时。', 'Report worst and average together, especially with adversarial inputs.'],
          ['扩容、重新散列与缓存缺失会影响真实性能。', 'Resizing, rehashing and cache misses affect real performance.'],
          ['哈希不保持全局有序，不能直接范围查询或按序遍历。', 'Hashing does not preserve global order, so ranges and ordered traversal are unsupported directly.'],
        ],
      },
      {
        title: ['哈希与其他查找结构的分工', 'Division of work with other structures'],
        body: [
          '哈希擅长等值查询：给定一个关键字，快速判断是否存在并取回记录。它不擅长范围、前驱后继和按序输出，因为这些要求关键字有序，而哈希地址打乱了顺序。B+ 树保留叶链，范围扫描有天然优势；BST/AVL 支持有序操作但受树高约束；哈希以空间换等值查询时间。',
          'Hashing excels at equality queries: given one key, decide existence and retrieve the record. It is poor at ranges, predecessor/successor and ordered output because those need key order while hash addresses destroy it. A B+ tree keeps a leaf chain for ranges; BST/AVL support ordered operations at height-dependent cost; hashing trades space for equality time.',
        ],
        points: [
          ['等值查询多、范围查询少时，哈希通常是强候选。', 'With many equality queries and few ranges, hashing is usually a strong candidate.'],
          ['需要按关键字排序输出时，哈希不适合做主结构。', 'When ordered output is required, hashing is not a suitable primary structure.'],
          ['链地址与开放定址的选择取决于删除频率、空间和缓存行为。', 'Chaining versus open addressing depends on deletion frequency, space and cache behaviour.'],
        ],
      },
    ],
    comparison: {
      title: ['链地址法与开放定址法', 'Separate chaining versus open addressing'],
      columns: [
        ['维度', 'Dimension'],
        ['链地址法', 'Separate chaining'],
        ['开放定址法', 'Open addressing'],
      ],
      rows: [
        [
          ['记录存放', 'Record storage'],
          ['桶外链节点', 'Nodes outside buckets'],
          ['全部在桶数组内', 'All inside the bucket array'],
        ],
        [
          ['删除', 'Deletion'],
          ['摘链，无墓碑', 'Unlink; no tombstone'],
          ['需墓碑或重建', 'Tombstone or rebuild'],
        ],
        [
          ['装填因子', 'Load factor'],
          ['可超过 1', 'May exceed 1'],
          ['必须小于 1', 'Must stay below 1'],
        ],
        [
          ['典型 ASL', 'Typical ASL'],
          ['成功约 1 + α/2，失败约 α', 'About 1 + α/2 success, α failure'],
          ['随 α 非线性增长', 'Grows nonlinearly with α'],
        ],
        [
          ['额外空间', 'Extra space'],
          ['链指针 / 节点开销', 'Pointer/node overhead'],
          ['墓碑与空槽开销', 'Tombstone and empty-slot overhead'],
        ],
      ],
    },
    takeaway: ['哈希用 h(k) 把关键字映射到桶；冲突必须由链地址或开放定址显式处理。α = n/m 与冲突策略共同决定 ASL，开放定址删除需要墓碑。O(1) 只是均匀散列、受控装填因子下的期望，最坏可退化为 O(n)；哈希也不支持有序范围查询。', 'Hashing maps keys to buckets through h(k); collisions require explicit chaining or open addressing. α = n/m and collision policy determine ASL, and open-addressing deletion needs tombstones. O(1) is an expectation under uniform hashing and controlled load, with O(n) worst cases; hashing also lacks ordered range support.'],
  },
  {
    id: 'search-comparison',
    topicId: 'search-comparison',
    title: ['查找方法比较：条件、成本与适用场景', 'Comparing search methods: conditions, costs and use cases'],
    chapter: ['第 9 章 · 查找', 'Chapter 9 · Searching'],
    summary: [
      '顺序、二分、分块、BST、AVL、B 树、B+ 树、哈希表与键树不是同一条成本曲线上的名次。它们的前置条件不同：是否要求有序、是否支持动态更新、关键字是整数还是字符串、数据在内存还是外存。复杂度必须连同这些条件一起读；单一数值排名会把适用性问题误写成“谁最好”。',
      'Sequential, binary, block, BST, AVL, B-tree, B+ tree, hashing and tries are not ranks on one cost curve. Their preconditions differ: order requirements, dynamic updates, integer versus string keys, and memory versus disk. Complexity must be read with those conditions; a single numeric ranking mistakes applicability for “best”.',
    ],
    diagram: 'search-comparison',
    definitions: [
      {
        term: ['前置条件', 'Precondition'],
        text: ['使用方法前必须成立的结构性质，例如全局有序、块间有序、平衡性、均匀散列或字符关键字。', 'The structural property required before using a method: global order, block order, balance, uniform hashing or character keys.'],
      },
      {
        term: ['动态更新', 'Dynamic update'],
        text: ['在查询之间插入或删除记录并恢复不变量。静态结构通常通过重建而不是局部更新来应对变化。', 'Inserting or deleting between queries while restoring invariants. Static structures usually rebuild rather than update locally.'],
      },
      {
        term: ['内存查找 / 外存查找', 'In-memory / external search'],
        text: ['内存查找的主要成本是比较与指针访问；外存还要读磁盘块，I/O 次数往往主导总成本。', 'In-memory search costs comparisons and pointer accesses; external search also reads disk blocks, where I/O often dominates.'],
      },
      {
        term: ['扇出 fanout', 'Fanout'],
        text: ['一个节点能容纳的孩子数。B/B+ 树的高扇出降低树高，从而减少外存磁盘块访问次数。', 'The number of children a node can hold. High B/B+ fanout lowers height and reduces disk-block reads.'],
      },
      {
        term: ['关键字长度 L', 'Key length L'],
        text: ['键树按字符逐层比较，成本与 L 相关；哈希函数也要处理整个关键字，长键计算更贵。', 'A trie compares characters level by level, so cost depends on L; a hash function also processes the whole key, making long keys costlier.'],
      },
    ],
    sections: [
      {
        title: ['按前置条件先分组', 'Group by preconditions first'],
        body: [
          '顺序不要求有序；二分要求全局有序；分块只要求块间有序而块内可无序；BST 允许任意插入顺序但树形由它决定；AVL 在 BST 上加高度平衡；B/B+ 树用多关键字节点维持平衡与高扇出；哈希要求可计算均匀的哈希函数；键树要求关键字可分解为字符。前置条件不成立时，复杂度比较没有意义。',
          'Sequential needs no order; binary needs global order; block needs only block-level order; a BST accepts any insertion order but its shape follows it; AVL adds height balance; B/B+ trees use multi-key nodes for balance and fanout; hashing needs a computable uniform function; a trie needs character-decomposable keys. Without the precondition, complexity comparisons are meaningless.',
        ],
        points: [
          ['“O(log n)”只有在前置条件成立时才是该方法的查找成本。', '“O(log n)” is valid only when the precondition holds.'],
          ['有序数组上的二分很快，但维护有序的更新可能很贵。', 'Binary search on a sorted array is fast, but ordered updates can be expensive.'],
          ['哈希均匀性无法从代码表面保证，必须结合实际关键字分布。', 'Hash uniformity cannot be guaranteed from code alone; assess the real key distribution.'],
        ],
      },
      {
        title: ['九种结构的成本与更新', 'Costs and updates across nine structures'],
        body: [
          '顺序：成功平均 (n+1)/2，尾插 O(1)，删除可能搬移或摘链。二分：O(log n) 查询，有序数组插入删除 O(n)。分块：顺序索引约 O(√n)，更新只影响一块与索引但可能分裂合并。BST：平均 O(log n)，退化 O(n)。AVL：三种操作均 O(log n)，代价是旋转。B 树：O(log n) 且高扇出，插入分裂、删除借位合并。B+ 树：O(log n)，叶链使范围高效，记录只在叶。哈希：等值期望 O(1)，最坏 O(n)，范围弱。键树：O(L) 逐字符，前缀共享但空间随节点增长。',
          'Sequential: about (n+1)/2 success; O(1) append, deletion may shift/unlink. Binary: O(log n) search, O(n) update in an array. Block: about O(√n) with a sequential index; one block + index but split/merge possible. BST: O(log n) average, O(n) degenerate. AVL: all three O(log n) with rotations. B-tree: O(log n), high fanout, split/borrow/merge. B+ tree: O(log n), leaf chain for ranges, records only in leaves. Hash: expected O(1) equality, O(n) worst, weak ranges. Trie: O(L) per character, shared prefixes but space grows with nodes.',
        ],
        points: [
          ['B/B+ 的 O(log n) 以阶数、平衡性和叶同深度为前提。', 'B/B+ O(log n) assumes order, balance and equal leaf depth.'],
          ['哈希的 O(1) 以均匀散列与受控 α 为前提。', 'Hash O(1) assumes uniform hashing and controlled α.'],
          ['键树的 O(L) 不是 O(1)：关键字越长，路径越长。', 'Trie O(L) is not O(1): longer keys mean longer paths.'],
          ['分块的 √n 来自顺序索引与顺序块扫描的特定假设。', 'Block √n comes from sequential index and sequential block scan.'],
        ],
      },
      {
        title: ['内存与外存：B 树为什么重要', 'Memory versus disk: why B-trees matter'],
        body: [
          '内存中指针跳转与比较差距有限，O(log n) 树高通常可接受。外存中一次磁盘块读取可能比一次比较贵几个数量级，因此要减少 I/O 层数。B/B+ 树让一个节点容纳大量关键字与孩子，扇出可达数百，树高常只有三到四层；B+ 树把记录集中到叶并用叶链连接，范围扫描可顺序读块。',
          'In memory, pointer jumps and comparisons differ by a limited factor, so O(log n) height is usually acceptable. On disk, one block read may cost orders of magnitude more than a comparison, so I/O levels matter. B/B+ trees pack many keys and children per node, with fanout in the hundreds and height often three or four; B+ leaves are linked so ranges read blocks sequentially.',
        ],
        points: [
          ['外存分析首先数磁盘块访问，而不是关键字比较。', 'External analysis counts disk-block reads before comparisons.'],
          ['高扇出降低树高，是 B/B+ 相对二叉树的真正优势。', 'High fanout lowering height is the real advantage over binary trees.'],
          ['B+ 叶链让范围查询顺序读块，避免反复回根。', 'The B+ leaf chain reads ranges sequentially without returning to the root repeatedly.'],
          ['哈希在外存可能因随机 I/O 吃亏，更不适合有序范围。', 'Hashing may suffer from random disk I/O and is even less suitable for ordered ranges.'],
        ],
      },
      {
        title: ['不要用单一数值排名', 'Do not use a single numeric ranking'],
        body: [
          '“哈希 O(1) 所以最好”只在等值查询、均匀散列、低装填因子且不需要顺序时成立；“二分 O(log n) 所以优于顺序”忽略排序维护；“B+ 树 O(log n) 所以万能”忽略小数据、纯内存和简单更新。正确做法是先列操作组合与前置条件，再比较该组合下的摊销成本。',
          '“Hash is O(1), therefore best” holds only for equality queries, uniform hashing, low load and no order. “Binary is O(log n), therefore better than sequential” ignores sorting maintenance. “B+ is O(log n), therefore universal” ignores small data, pure memory and simple updates. List the operation mix and preconditions first, then compare amortized costs.',
        ],
        points: [
          ['先问：是否要求有序？是否支持范围？更新频率如何？内存还是外存？', 'Ask: is order required? ranges? update frequency? memory or disk?'],
          ['复杂度要注明平均/最坏/期望，以及 n、α、阶数、L 等参数。', 'State average/worst/expected and parameters n, α, order, L.'],
          ['小规模数据下常数因子与实现复杂度可能压倒渐近优势。', 'At small scale, constants and implementation complexity can outweigh asymptotics.'],
          ['工程上常组合多种结构：哈希做等值索引，B+ 树做范围索引。', 'Systems combine structures: hashing for equality, B+ trees for ranges.'],
        ],
      },
      {
        title: ['按任务选结构', 'Choose by task'],
        body: [
          '只读且已排序：二分。只读且块间可排序、块内更新局部化：分块。查询频率偏斜且集合固定：静态树表/次优树。需要动态有序且内存中：AVL（红黑树不在本课程范围）。需要外存范围与高扇出：B+ 树。只需等值且可无序：哈希。字符串且大量共享前缀：键树。顺序查找作为无序小表或兜底方案。',
          'Read-only and sorted: binary. Read-only with sortable blocks and local updates: block. Skewed queries with a fixed set: static/nearly optimal tree. Dynamic order in memory: AVL (red-black trees are outside this course). External ranges and fanout: B+ tree. Equality only and order unnecessary: hashing. String keys with shared prefixes: trie. Sequential search is the unordered small-table fallback.',
        ],
        points: [
          ['范围查询优先考虑 B+ 树或有序树，而不是哈希。', 'Prefer B+ trees or ordered trees for ranges, not hashing.'],
          ['字符串前缀查询优先考虑键树，而不是普通哈希。', 'Prefer a trie for string prefixes over ordinary hashing.'],
          ['更新频繁且要求有序时，平衡树比有序数组更合适。', 'With frequent ordered updates, balanced trees beat sorted arrays.'],
          ['没有一种结构在所有维度同时最优；选择是明确取舍。', 'No structure is optimal on every dimension; selection is trade-off.'],
        ],
      },
    ],
    comparison: {
      title: ['九种查找结构对照', 'Nine search structures compared'],
      columns: [
        ['结构', 'Structure'],
        ['是否要求有序', 'Order required'],
        ['动态更新', 'Dynamic updates'],
        ['典型查找', 'Typical search'],
        ['插入/删除', 'Insert / delete'],
        ['空间与存储特点', 'Space/storage'],
      ],
      rows: [
        [
          ['顺序查找', 'Sequential'],
          ['否', 'No'],
          ['支持（尾部简单）', 'Yes (easy at tail)'],
          ['O(n)', 'O(n)'],
          ['O(1) 尾插；删除可能 O(n)', 'O(1) append; delete may be O(n)'],
          ['无额外索引', 'No extra index'],
        ],
        [
          ['二分查找', 'Binary'],
          ['全局有序', 'Global order'],
          ['静态为主', 'Mostly static'],
          ['O(log n)', 'O(log n)'],
          ['有序数组 O(n) 搬移', 'O(n) shifts in sorted array'],
          ['仅数组', 'Array only'],
        ],
        [
          ['分块查找', 'Block'],
          ['块间有序', 'Block maxima ordered'],
          ['局部更新', 'Local updates'],
          ['≈O(√n)（顺序索引）', '≈O(√n) with sequential index'],
          ['改一块与索引，可能分裂/合并', 'One block + index; split/merge'],
          ['索引表 + 数据块', 'Index + data blocks'],
        ],
        [
          ['BST', 'BST'],
          ['否（中序有序）', 'No (in-order sorted)'],
          ['支持', 'Yes'],
          ['平均 O(log n)，最坏 O(n)', 'Avg O(log n), worst O(n)'],
          ['平均 O(log n)，最坏 O(n)', 'Avg O(log n), worst O(n)'],
          ['左右指针', 'Left/right pointers'],
        ],
        [
          ['AVL', 'AVL'],
          ['否（中序有序）', 'No (in-order sorted)'],
          ['支持', 'Yes'],
          ['O(log n)', 'O(log n)'],
          ['O(log n) + 旋转', 'O(log n) + rotations'],
          ['平衡因子 / 高度', 'Balance factor / height'],
        ],
        [
          ['B 树', 'B-tree'],
          ['节点内有序', 'Keys ordered in nodes'],
          ['支持', 'Yes'],
          ['O(log n)', 'O(log n)'],
          ['O(log n) 分裂/借位/合并', 'O(log n) split/borrow/merge'],
          ['多关键字节点，高扇出', 'Multi-key nodes, high fanout'],
        ],
        [
          ['B+ 树', 'B+ tree'],
          ['是（叶链有序）', 'Yes (ordered leaf chain)'],
          ['支持', 'Yes'],
          ['O(log n)', 'O(log n)'],
          ['O(log n) 分裂/合并', 'O(log n) split/merge'],
          ['记录只在叶，内部为索引', 'Records in leaves, internal index'],
        ],
        [
          ['哈希表', 'Hash'],
          ['否', 'No'],
          ['支持', 'Yes'],
          ['期望 O(1)，最坏 O(n)', 'Expected O(1), worst O(n)'],
          ['期望 O(1)，扩容 O(n)', 'Expected O(1), resize O(n)'],
          ['桶 + 链/探测，α = n/m', 'Buckets + chains/probes, α = n/m'],
        ],
        [
          ['键树', 'Trie'],
          ['按字符路径', 'By character path'],
          ['支持', 'Yes'],
          ['O(L)', 'O(L)'],
          ['O(L)，可能新建节点', 'O(L), may create nodes'],
          ['每字符一节点，前缀共享', 'One node per character, shared prefixes'],
        ],
      ],
    },
    takeaway: ['比较查找结构必须先固定前置条件与操作组合。顺序无需有序但 O(n)；二分 O(log n) 却要求全局有序；分块以索引换局部更新；BST 可能退化，AVL 用旋转保证 O(log n)；B/B+ 树靠高扇出服务外存，B+ 叶链适合范围；哈希等值期望 O(1) 但最坏 O(n) 且无序；键树按字符长度 O(L) 并共享前缀。没有一种结构对所有任务都最好。', 'Compare search structures only after fixing preconditions and the operation mix. Sequential needs no order but costs O(n); binary is O(log n) but needs global order; block trades an index for local updates; BST may degenerate while AVL rotates to O(log n); B/B+ trees use fanout for external storage, with B+ leaf chains for ranges; hashing is expected O(1) for equality but worst O(n) and unordered; a trie costs O(L) and shares prefixes. No structure is best for every task.'],
  },
];
