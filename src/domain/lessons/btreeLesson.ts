import type { Lesson } from './types';

/**
 * SEARCH-04 order-4 B-tree course.
 *
 * Step ids are exactly the `lesson_step=` values emitted by `BTREE_PYTHON`:
 *   init / inspect / found / not-found / descend / duplicate /
 *   split-before / split-after / insert / done.
 *
 * Search and insertion share one program and one split policy. Steps that only
 * one operation produces simply show zero current-run frames.
 */
export const btreeLesson: Lesson = {
  lessonId: 'b-tree-search-insert-split',
  algorithmId: 'btree',
  contentVersion: '1.0.0',
  title: { zh: 'B 树：4 阶查找、插入与节点分裂', en: 'B-tree: order-4 search, insertion and splitting' },
  oneLiner: {
    zh: 'B 树把多个有序关键字放进一个节点，用 k 个关键字分出 k+1 个子树；查找沿区间下降，插入则在下降前分裂满节点。',
    en: 'A B-tree packs ordered keys into one node and uses k keys to separate k+1 subtrees; search descends by interval, while insertion splits full nodes before descending.',
  },
  overview: {
    zh: '本课使用一棵真实的 4 阶 B 树：每个节点最多 4 个孩子、3 个关键字；非根节点至少 1 个关键字，根不是叶子时至少 2 个孩子，所有叶子位于同一深度。节点是真实的 Python 对象，关键字列表和孩子列表都是对象上的真实字段；初始树由同一套插入算法静默建成，动画帧不预先写死。查找从根开始，在当前节点内逐个比较关键字：命中就结束；否则按目标落在哪个区间选择唯一孩子，进入下一层继续比较；到达叶子仍未命中则报告不存在。插入先做一次只读定位：若命中重复关键字，明确拒绝且树完全不变；否则采用固定的“下降前分裂”策略——根满先分裂并产生新根，之后每进入一个孩子前，只要它已满就先分裂，把中间关键字上升到父节点，再沿正确的区间继续下降，最终在叶子插入。删除不在本轮范围内。',
    en: 'This course runs a real order-4 B-tree: at most four children and three keys per node; every non-root node keeps at least one key, a non-leaf root has at least two children, and all leaves share one depth. Nodes are real Python objects with real key and child lists; the initial tree is built silently by the same insertion routine, and no animation frame is prewritten. Search starts at the root and compares keys inside the current node: a hit stops; otherwise the target’s interval selects exactly one child, and comparison continues one level down; reaching a leaf without a hit reports absence. Insertion first performs a read-only locate: a duplicate is explicitly rejected with the tree unchanged; otherwise the fixed “split before descending” policy applies — a full root splits first and creates a new root, then every full child is split before entering it, its median rises to the parent, and the walk continues through the correct interval until the key is inserted at a leaf. Deletion is out of scope this round.',
  },
  intuition: {
    zh: '把每个节点想成一页印着若干路标的纸：页内关键字把世界切成几段，页底的孩子指针各管一段。查找不是一次只问“左还是右”，而是先在页内找到目标落在哪一段，再翻到那一页孩子。插入像往一页已经写满的纸里加字：先把中间那个关键字抽出来贴到上一页，原页被切成左右两半，这样新页才有空格；如果连最上面那页也满了，就抽出一个新封面当根。所有位置都来自真实对象的孩子列表，而不是画布坐标。',
    en: 'Think of each node as a page of signposts: the keys cut the world into intervals, and the child pointers at the bottom each own one interval. Search does not ask only “left or right”; it first finds the target’s interval inside the page, then turns to that child page. Insertion is like adding a word to a full page: lift the middle key onto the page above, cut the old page into left and right halves, and the new page has room. If even the top page is full, lift out a new cover as the root. Every position comes from real child lists, never canvas coordinates.',
  },
  prerequisites: {
    zh: ['理解二叉搜索树的有序性与孩子指针', '知道树高、叶子深度和节点度的含义', '能读懂 Python 的对象引用与列表插入'],
    en: ['BST ordering and child pointers', 'Tree height, leaf depth and node degree', 'Python object references and list insertion'],
  },
  complexity: {
    time: 'O(log_m n) 节点访问',
    space: 'O(n)',
    note: {
      zh: '设关键字总数为 n、阶为 m、树高为 h。每个节点最多 m 个孩子，因此 h 层最多约 mʰ 个叶子，h = O(log_m n)。查找每层只进入一个节点，层内最多比较 m−1 个关键字；插入的定位同样只走一条根到叶路径，下降前分裂每个满节点只做常数次关键字与孩子搬移，因此节点访问次数也是 O(log_m n)，总代价还要乘上节点内比较 O(m) 或二分 O(log m)。空间上树本身保存 n 个关键字与相应孩子引用，是 O(n)；迭代实现只用常数个辅助变量。m 增大时树高下降，但单节点容量和页内比较增加，实际 m 由页大小与关键字大小决定；本课固定 m=4 只是为了把分裂过程画清楚，不代表真实数据库索引的扇出。',
      en: 'Let n be the key count, m the order and h the height. Each node has at most m children, so h levels hold about mʰ leaves and h = O(log_m n). Search enters one node per level with at most m−1 comparisons inside it; insertion also follows one root-to-leaf path, and splitting a full node moves only a constant number of keys and children, so node visits are O(log_m n) as well, with an extra factor O(m), or O(log m) with binary search inside a node. The tree itself stores n keys and child references, O(n); an iterative implementation uses constant auxiliary variables. A larger m lowers height but increases page payload and in-node comparisons; real m follows page and key sizes. The fixed m=4 here exists to make splitting legible, not to represent a real database fanout.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 用真实插入建出 4 阶 B 树', en: '① Build a real order-4 B-tree' },
      explanation: {
        zh: '初始帧已经显示整棵树，但还没有开始本次查找或插入。节点 n1、n2… 是按输入顺序真实创建并插入的对象；每次静默插入都执行与动画相同的分裂策略，因此这棵树不是手画的示意图。4 阶意味着每个节点最多 4 个孩子、3 个关键字；非根至少 1 个关键字；根不是叶子时至少 2 个孩子；所有叶子在同一深度。',
        en: 'The init frame already shows the whole tree, before this run’s search or insertion starts. Nodes n1, n2… are objects really created and inserted in input order; every silent insertion uses the same split policy as the animation, so the tree is not a hand-drawn sketch. Order 4 means at most four children and three keys per node; every non-root node keeps at least one key; a non-leaf root has at least two children; all leaves share one depth.',
      },
      tip: { zh: '屏幕位置只是布局；父子关系只认快照里的 children id。', en: 'Screen placement is layout only; parent/child relations come from the children ids in the snapshot.' },
    },
    {
      stepId: 'inspect',
      title: { zh: '② 在当前节点内比较关键字', en: '② Compare keys inside the current node' },
      explanation: {
        zh: '每个 inspect 帧只比较当前节点中的一个真实关键字。compareIndex 是关键字在 keys 列表中的下标，compareKey 是它的值；currentNodeId 与 pathIds 指向真实节点路径。节点内关键字严格递增，所以可以顺序比较，也可以二分；一旦目标小于某个关键字，就不必再比较它右边的关键字，直接准备进入该关键字左侧的孩子。',
        en: 'Each inspect frame compares one real key in the current node. compareIndex is its position in the keys list and compareKey its value; currentNodeId and pathIds identify the real node path. Keys inside a node strictly increase, so comparison may be sequential or binary; once the target is smaller than a key, keys to its right need not be compared, and the child on that key’s left is the next candidate.',
      },
      tip: { zh: '比较的是关键字值，不是节点编号；节点编号只用于稳定引用。', en: 'Compare key values, not node ids; ids only provide stable references.' },
    },
    {
      stepId: 'found',
      title: { zh: '③ 命中关键字，查找结束', en: '③ Hit a key and stop' },
      explanation: {
        zh: '当前节点内出现相等关键字时发出 found 帧，result=found，查找立即结束，不再进入任何孩子。B 树的记录可以存放在任意节点，所以内部节点命中就是合法终点；这一点与 B+ 树必须走到叶子不同。命中不修改任何关键字或孩子引用，树与运行前一致。',
        en: 'When an equal key appears in the current node, a found frame sets result=found and the search stops immediately without entering any child. B-tree records may live in any node, so an internal hit is a legal endpoint; this differs from a B+ tree, which must reach a leaf. A hit changes no key or child reference, so the tree matches its input.',
      },
    },
    {
      stepId: 'descend',
      title: { zh: '④ 按区间选择唯一孩子，回到节点内比较', en: '④ Choose one child by interval and compare again' },
      explanation: {
        zh: '未命中时，目标必然落在某一个区间：小于第一个关键字走最左孩子，大于最后一个关键字走最右孩子，否则走相邻两个关键字之间的孩子。descend 帧记录 childSlot 与 childId，二者必须对应同一个真实孩子；进入下一层后回到 inspect，继续在新节点内比较。查找始终只沿一条路径下降，不会同时探索多个子树。',
        en: 'Without a hit the target lies in exactly one interval: below the first key it takes the leftmost child, above the last key the rightmost child, otherwise the child between two adjacent keys. A descend frame records childSlot and childId, which must name the same real child; the next level returns to inspect and compares inside the new node. Search follows exactly one downward path and never explores several subtrees at once.',
      },
      tip: { zh: '选中孩子的区间必须由父节点关键字真实切分，不能按画布左右猜。', en: 'The chosen child’s interval must be cut by real parent keys, not guessed from canvas left/right.' },
    },
    {
      stepId: 'not-found',
      title: { zh: '⑤ 到达叶子仍未命中', en: '⑤ Reach a leaf without a hit' },
      explanation: {
        zh: '叶子没有孩子。如果在叶子内比较完仍没有相等关键字，查找失败，发出 not-found 帧，result=not-found。空树查找只产生 init 与 done 两帧，done 的结果也是 not-found，不会伪造一个不存在的当前节点。失败路径同样真实：它指出了最后比较的叶子与完整路径。',
        en: 'A leaf has no children. If no equal key appears after comparing inside a leaf, the search fails with a not-found frame and result=not-found. Searching an empty tree yields only init and done, with done reporting not-found; it never invents a nonexistent current node. The failure path is real too: it records the last leaf and the full path.',
      },
    },
    {
      stepId: 'duplicate',
      title: { zh: '⑥ 插入前定位：重复关键字明确拒绝', en: '⑥ Locate first: reject duplicate keys' },
      explanation: {
        zh: '插入不是先改树再检查，而是先用同一套查找逻辑做只读定位。若在任意节点命中目标，立即发出 duplicate 帧，result=duplicate，树保持不变——不覆盖旧值，也不把重复键塞进某个叶子。只有当定位确认不存在时，才进入真正的插入阶段。这条规则由导学、Python 实现和动画共同遵守。',
        en: 'Insertion does not mutate first and check later. It performs a read-only locate with the same search logic. A hit at any node emits duplicate with result=duplicate and leaves the tree unchanged — no overwrite and no duplicate pushed into a leaf. Only a confirmed absence enters the real insertion phase. The lesson, Python implementation and animation share this rule.',
      },
      tip: { zh: '重复键不是“插入成功但看不见”，而是明确拒绝且零结构变化。', en: 'A duplicate is not an invisible success; it is an explicit rejection with zero structural change.' },
    },
    {
      stepId: 'split-before',
      title: { zh: '⑦ 下降前检查满节点', en: '⑦ Check a full node before descending' },
      explanation: {
        zh: '本课统一采用“下降前分裂”：根满时先分裂根；此后每准备进入一个孩子，只要该孩子已有 3 个关键字（满），就先发出 split-before 帧，再执行分裂。这样目标叶子在真正插入前一定有空格，不需要在回溯阶段补分裂。帧里的 nodeId 指向满节点，phase=before，左右新节点与上升关键字尚未产生。',
        en: 'This course fixes “split before descending”: a full root splits first; afterwards, before entering any child with three keys (full), it emits split-before and then splits. The target leaf is therefore guaranteed to have room before the real insertion, with no backtracking split. The frame’s nodeId names the full node, phase=before, and the two new sides plus the promoted key do not exist yet.',
      },
      tip: { zh: '检查发生在进入孩子之前，不是在插入失败之后补救。', en: 'The check happens before entering the child, not as a rescue after a failed insert.' },
    },
    {
      stepId: 'split-after',
      title: { zh: '⑧ 中间关键字上升，左右节点重新分配', en: '⑧ The median rises and the two sides redistribute' },
      explanation: {
        zh: '满节点有 3 个关键字 a < b < c 和 4 个孩子。分裂时 b 上升到父节点，原节点保留 a 及其左侧两个孩子，新节点接收 c 及其右侧两个孩子；父节点的关键字列表与孩子列表在同一位置插入 b 和新孩子，保持“k 个关键字对应 k+1 个孩子”。split-after 帧同时给出 leftId、rightId、promotedKey、parentId；根分裂时 rootChanged=true，b 成为新根，树高增加 1。',
        en: 'A full node has three keys a < b < c and four children. Splitting promotes b to the parent, keeps a and its two left children in the old node, and gives c and its two right children to a new node; the parent inserts b and the new child at the same position, preserving “k keys, k+1 children”. The split-after frame reports leftId, rightId, promotedKey and parentId; a root split sets rootChanged=true, b becomes the new root, and height grows by one.',
      },
      tip: { zh: '原节点保留左侧并继续使用原 id，右侧是新 id；连线随孩子列表一起搬移。', en: 'The old node keeps the left side and its id; the right side is a new id, and edges move with the child lists.' },
    },
    {
      stepId: 'insert',
      title: { zh: '⑨ 到达叶子插入，恢复全部约束', en: '⑨ Insert at a leaf and restore every invariant' },
      explanation: {
        zh: '分裂完成后沿正确区间继续下降，最终到达叶子。insert 帧把目标写入叶子 keys 的正确下标，result=inserted；空树插入则先创建叶子根再写入。插入后必须重新满足：节点内关键字严格递增、全局关键字唯一、每个内部节点孩子数等于关键字数加一、孩子区间与父关键字对应、非根关键字数不少于 1、所有叶子同深度。',
        en: 'After splits, the walk continues through the correct interval and reaches a leaf. The insert frame writes the target at the right index in the leaf’s keys and sets result=inserted; an empty-tree insert creates a leaf root first. Afterwards every invariant must hold again: keys strictly increase inside a node, all keys are globally unique, an internal node has one more child than keys, child intervals match parent keys, every non-root node keeps at least one key, and all leaves share one depth.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑩ 结果、树高与代价', en: '⑩ Result, height and cost' },
      explanation: {
        zh: 'done 帧给出最终结果：查找为 found / not-found，插入为 inserted / duplicate。查找与重复拒绝都不改变树；成功插入可能增加一个关键字，也可能因根分裂而使树高增加 1。设关键字数为 n、阶为 m、树高为 h，则 h = O(log_m n)；查找与插入都只访问 O(log_m n) 个节点，层内比较另计。节点容量越大树越矮，但单页比较与数据量也越大。',
        en: 'The done frame reports the final result: found / not-found for search, inserted / duplicate for insertion. Search and duplicate rejection leave the tree unchanged; a successful insert adds one key and may increase height by one when the root splits. With n keys, order m and height h, h = O(log_m n); search and insertion visit O(log_m n) nodes, with in-node comparisons counted separately. Larger node capacity lowers height but increases per-page comparisons and payload.',
      },
      tip: { zh: '判断插入是否正确：关键字有序、区间对应、非根下限、叶子同深，四项同时成立。', en: 'Judge an insertion by four facts together: ordered keys, correct intervals, non-root minimum, and equal leaf depth.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把“阶 m”当成关键字上限：m=4 时孩子最多 4 个，关键字最多 3 个。',
      '分裂时把中间关键字留在原节点，或让左右节点关键字数量分配错误。',
      '忘记把分裂后的新孩子指针插到父节点对应位置，导致孩子数与关键字数不匹配。',
      '根分裂后仍让旧根当根，或没有把上升关键字接到新根。',
      '在插入已经改变树之后才检查重复键，导致“拒绝”时树已被修改。',
      '把节点在画布上的左右位置当成父子关系，而不读真实 children 列表。',
      '认为 B 树查找一定在叶子结束；B 树的内部节点也可以命中。',
    ],
    en: [
      'Treating order m as a key limit: m=4 allows four children but only three keys.',
      'Leaving the median in the old node during a split, or distributing keys incorrectly between the two sides.',
      'Forgetting to insert the new child pointer at the matching parent position, so child count no longer matches key count.',
      'Keeping the old root after a root split, or failing to attach the promoted key to the new root.',
      'Checking for a duplicate only after mutation, so a “rejection” has already changed the tree.',
      'Inferring parent/child from canvas left/right instead of reading the real children list.',
      'Assuming a B-tree search always ends at a leaf; an internal node can hit.',
    ],
  },
};
