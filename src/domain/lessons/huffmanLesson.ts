import type { Lesson } from './types';

/**
 * T4 Huffman course. Step ids are exactly the `lesson_step=` values emitted by
 * HUFFMAN_PYTHON: init / merge-select / merge-create / merge-requeue /
 * build-done / encode-start / encode-left / encode-right / encode-leaf / done.
 *
 * The build and the encoding are two halves of one real Python run, so one
 * course covers both. A frame is highlighted only when the real trace emitted
 * its step; the rail never invents stages for frames that do not exist.
 */
export const huffmanLesson: Lesson = {
  lessonId: 'huffman-build-and-prefix-codes',
  algorithmId: 'huffman',
  contentVersion: '1.0.0',
  title: { zh: '哈夫曼树与哈夫曼编码：最小堆建树、前缀码与 WPL', en: 'Huffman tree and codes: min-heap build, prefix codes and WPL' },
  oneLiner: {
    zh: '把每个字符看成带频率的叶子，反复合并当前最小的两个权值，得到一棵带权路径长度最小的二叉树；再从根到叶读 0/1 路径，就得到频率越高码越短的前缀编码。',
    en: 'Treat every symbol as a leaf with a frequency, repeatedly merge the two smallest weights into one binary tree of minimum weighted path length, then read each root-to-leaf 0/1 path to obtain prefix codes that are shorter for more frequent symbols.',
  },
  overview: {
    zh: '哈夫曼编码解决的是“怎样用不等长二进制码表示一组字符，使总位数最少”。每个字符是一个叶子，叶子的权值是它的频率（或出现次数）。从根到某个叶子的边数叫该叶子的深度，所有叶子“频率 × 深度”的和就是带权路径长度 WPL，也就是按这棵树编码后的总位数。哈夫曼的构造非常直接：把所有叶子放进最小优先队列，每次取出权值最小的两个根，新建一个父节点，权值为两者之和，把两个根真实接成左右孩子，再把父节点放回队列；重复到只剩一个根。这样得到的树在所有二叉编码树中 WPL 最小，称为最优二叉树。编码阶段从根出发，左分支记 0、右分支记 1，走到叶子时路径上的位串就是该字符的编码。因为字符只在叶子出现，任一完整编码都不会是另一编码的前缀，所以解码不需要分隔符。本页的建树和编码都来自同一份真实 Python 执行：heapq 的每次弹出、入队、父子引用和新节点编号都有快照，三个区域读同一帧。',
    en: 'Huffman coding answers “how do we represent a set of symbols with variable-length binary codes while minimising the total number of bits?” Every symbol is a leaf whose weight is its frequency (or count). The number of edges from the root to a leaf is that leaf’s depth; the sum of frequency × depth over all leaves is the weighted path length WPL, which equals the total encoded bits for this tree. Construction is direct: put every leaf into a min-priority queue, repeatedly pop the two minimum-weight roots, create a parent whose weight is their sum, attach the two roots as real left/right children, and push the parent back; repeat until one root remains. The resulting tree has the minimum WPL among all binary coding trees, hence “optimal binary tree”. Encoding walks from the root, writes 0 for a left edge and 1 for a right edge, and the bits collected at a leaf form that symbol’s code. Because symbols live only at leaves, no complete code can be a prefix of another, so decoding needs no separator. On this page both the build and the encoding come from one real Python run: every heapq pop, push, parent/child reference and new node id is recorded in the same frame read by all three regions.',
  },
  intuition: {
    zh: '想象你要给六个字符发“二进制电报”，出现最多的 F 应该用最短的码，出现最少的 A 可以用最长的码。怎么保证这样拼出来的码不会互相误解？把字符全部放到树的叶子上，从根往叶子走，每走一条边记一位。两个字符的路径在某个岔口分开以后就再也不会重合，所以没有哪个码会是另一个码的开头。现在的问题是树该怎么长。最少的两个频率注定要待在最深的地方：如果它们还很浅，就把它们和最深的叶子交换，总位数只会变小。于是先把最小的两个拎出来，给它们同一个父亲，父亲代表“这两个字符合起来”的频率；再把父亲当成一个新的“超字符”放回候选堆，继续找当前最小的两个。每合并一次，树就少一棵、多一层，最后只剩一个根。这个“两小合一”的过程没有回溯，也不需要枚举所有树形，却恰好得到最优解。',
    en: 'Imagine sending a binary telegram for six symbols: the most frequent F deserves the shortest code, while the rarest A can afford the longest. How do we guarantee the resulting codes cannot be misread? Put every symbol at a leaf and walk from the root; each edge contributes one bit. Once two symbol paths diverge at a branching point they never meet again, so no code can be the beginning of another. The remaining question is the tree’s shape. The two smallest frequencies belong at the greatest depth: if they sat shallowly, swapping them with the deepest leaves would only reduce the total. So pop the two smallest, give them one parent whose weight is their combined frequency, and push that parent back as a new “super-symbol”. Each merge removes one tree from the forest and adds one level; at the end a single root remains. This “merge the two smallest” process needs no backtracking or enumeration of all tree shapes, yet it still reaches the optimum.',
  },
  prerequisites: {
    zh: [
      '知道二叉树、叶子、深度与父子引用',
      '理解带权路径长度：每个叶子的权值乘以它的深度再求和',
      '会用 Python 的 heapq 最小堆，知道 heappop / heappush 的代价是 O(log n)',
      '知道二进制前缀码：任一码都不是另一码的前缀',
    ],
    en: [
      'Binary trees, leaves, depth and parent/child references',
      'Weighted path length: sum each leaf’s weight × its depth',
      'Python heapq min-heap, with heappop / heappush costing O(log n)',
      'Binary prefix codes: no code is a prefix of another',
    ],
  },
  complexity: {
    time: 'O(n log n)',
    space: 'O(n)',
    note: {
      zh: '设叶子数为 n。建树要做 n-1 次合并，每次两次 heappop 和一次 heappush，单次 O(log n)，合计 O(n log n)；初始建堆是 O(n)。编码阶段对每个叶子沿根到叶路径走一次，所有路径长度之和正是 WPL，最坏 O(n²) 但通常远小于此；若只做一次深度优先遍历并沿途记录位串，则是 O(n) 次节点访问加上输出码字本身的长度。辅助空间包括堆中的 n 个叶子与 n-1 个内部节点、父子引用和码表，均为 O(n)。注意 O(n log n) 是“按字符种类数 n”计的；若按待编码文本总长度计，还要加上读取与输出每一位的成本。',
      en: 'Let n be the number of leaves. Building performs n-1 merges; each merge does two heappops and one heappush at O(log n), for O(n log n) total, while the initial heapify is O(n). Encoding visits each leaf along its root-to-leaf path; the sum of all path lengths is exactly the WPL, worst case O(n²) but normally far smaller. A single depth-first walk that carries the bit string visits O(n) nodes plus the cost of writing the codewords. Auxiliary space covers n leaves and n-1 internal nodes in the heap, parent/child references and the code table, all O(n). The O(n log n) bound counts n distinct symbols; counting the full text length adds the cost of reading and emitting every bit.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 每个字符是一片叶子，WPL 是总位数', en: '① Every symbol is a leaf; WPL is the total bits' },
      explanation: {
        zh: '初始化帧里还没有任何合并：每个字符单独成树，全部叶子同时进入最小堆（优先队列）。节点上的数字是权值（频率），A5、B9、C12、D13、E16、F45 一共 6 个叶子，总权值 100。带权路径长度 WPL 定义为 Σ(叶子权值 × 叶子深度)，根深度为 0。因为初始每个叶子就是自己的根，深度都是 0，所以此刻若强行编码，WPL 是 0；但这不是最终答案，建树会逐步把叶子压深。树的形状还没有出现，画布上是 6 棵独立树，队列按 (权值, 创建序) 排列，权值最小的 A=5 在堆顶。',
        en: 'At init nothing has been merged: each symbol is its own tree and all leaves enter the min-priority queue. The number on a node is its weight (frequency): A5, B9, C12, D13, E16 and F45 give six leaves with total weight 100. Weighted path length is defined as Σ(leaf weight × leaf depth), with the root at depth 0. Initially every leaf is its own root at depth 0, so a hypothetical encoding now would have WPL 0; that is not the final answer, because merging will push leaves deeper. No tree shape exists yet: the canvas shows six independent trees, and the queue is ordered by (weight, creation order), with the smallest A=5 on top.',
      },
      tip: { zh: 'WPL 不是“权值相加”，而是每个叶子权值乘以它到根的边数再求和。', en: 'WPL is not a plain sum of weights: it is each leaf weight multiplied by its edge distance to the root.' },
    },
    {
      stepId: 'merge-select',
      title: { zh: '② 每次取出当前最小的两个权值', en: '② Pop the two current minimum weights' },
      explanation: {
        zh: '第一次合并取出 A=5 与 B=9，队列里剩下 C12、D13、E16、F45。为什么必须取最小的两个？设 u、v 是当前森林里权值最小的两个根。在任何最优二叉编码树中，权值最小的叶子一定在最深的一层；若它不在，就把它与最深的叶子交换，WPL 不会增大。同理，最小的两个叶子可以作为最深的兄弟：它们共享最深的父节点，换成别的叶子只会让总代价变大。因此“合并当前最小的两个”不是启发式猜测，而是有交换论证支撑的最优选择。第一次的 5 和 9 也因此成为最深一层的入口。',
        en: 'The first merge pops A=5 and B=9, leaving C12, D13, E16 and F45 in the queue. Why the two smallest? Let u and v be the two minimum-weight roots in the current forest. In any optimal binary coding tree, a minimum-weight leaf must sit at the greatest depth; otherwise swapping it with a deepest leaf would not increase WPL. Likewise the two smallest leaves can be deepest siblings: they share the deepest parent, and replacing either with a heavier leaf can only increase the cost. So “merge the two current minima” is not a heuristic guess but an optimal choice justified by an exchange argument. The first 5 and 9 therefore enter the deepest level.',
      },
      tip: { zh: '不是“取两个最小叶子”就结束：新父节点也要回到候选堆，之后可能再次被取出。', en: 'Popping the two smallest leaves is not the end: the new parent returns to the heap and may be popped again.' },
    },
    {
      stepId: 'merge-create',
      title: { zh: '③ 真实父节点：权值为两子之和，左右引用成立', en: '③ A real parent: weight is the sum, left/right references exist' },
      explanation: {
        zh: '合并帧新建一个内部节点，权值严格等于两个子节点权值之和：5+9=14。这个父节点不是画上去的装饰，而是 Python 对象：left 指向 A，right 指向 B，两个孩子的 parent 反向指回它，节点获得稳定的新编号与最新创建序。画布上的新父节点因此有真实的父子边，而不是按最终答案预排的坐标。内部节点没有字符，它只代表“这两个分支的权值合计”；字符仍然只在叶子上。合并也让两片叶子的深度同时加一，所以 WPL 恰好增加两子权值之和，也就是新增父节点的权值；把所有合并出的父权值累加，就能不依赖树结构独立算出 WPL。',
      en: 'The merge frame creates an internal node whose weight is exactly the sum of its two children: 5+9=14. This parent is a real Python object, not a drawn decoration: left points to A, right to B, both children point back through parent, and the node receives a stable new id and the newest creation order. The canvas edge therefore reflects a real parent/child reference rather than coordinates pre-arranged from a known answer. An internal node has no symbol; it only represents the combined weight of two branches, while symbols remain at leaves. The merge also increases both leaf depths by one, so WPL grows by exactly the sum of the two child weights, which is the new parent’s weight. Summing every created parent weight yields WPL independently of the tree shape.',
      },
      tip: { zh: '新父节点权值必须等于左右孩子之和；写成 max、平均值或少加叶子权值都会破坏最优性。', en: 'The parent weight must equal the sum of its children; max, average or a missing leaf weight destroys optimality.' },
    },
    {
      stepId: 'merge-requeue',
      title: { zh: '④ 新父节点回到最小堆；等权也要有确定顺序', en: '④ The new parent returns to the min-heap; equal weights need a deterministic order' },
      explanation: {
        zh: '父节点创建后必须真实 heappush 回队列，下一轮才可能继续和别的根比较。若忘记回队，队列会过早变空，树也拼不完整。heapq 只保证“父不大于孩子”的数组堆序，不保证整个数组是排序列表；右侧面板按真实优先级展示，同时保留 heapq 的内部数组顺序，二者不能混为一谈。比较键是 (权值, 创建序)：权值相同时，先创建的节点先被取出。这个创建序单调递增且唯一，所以官方示例的每次合并顺序、左右孩子和最终码串都可复现，不会因为 Python 对象比较或运行环境而漂移。',
      en: 'After creation the parent must really be heappushed back, or the next round cannot compare it with the remaining roots. Forgetting the requeue empties the queue too early and leaves the tree incomplete. heapq guarantees only the array heap property “parent is not larger than its children”, not a globally sorted array; the right-hand panel shows priority order while the raw heapq array order is preserved separately, and the two must not be conflated. The comparison key is (weight, creation order): on equal weights the earlier-created node is popped first. That order is strictly increasing and unique, so every merge order, left/right assignment and final bit string in the official example is reproducible across runs and Python builds.',
      },
      tip: { zh: '把堆当“排序好的列表”是常见错误；堆只承诺堆顶最小。', en: 'Treating a heap as a sorted list is a common mistake; a heap only promises that the root is minimal.' },
    },
    {
      stepId: 'build-done',
      title: { zh: '⑤ 森林收成一个根：最优二叉树与 WPL', en: '⑤ The forest becomes one root: optimal tree and WPL' },
      explanation: {
        zh: '当队列只剩一个根时建树完成。每一次合并都让森林少一棵树，n 个叶子恰好需要 n-1 次合并，所以最终一定是一棵有 n 个叶子和 n-1 个内部节点的满二叉树（每个内部节点都有两个孩子）。原始字符与叶子一一对应，内部节点不代表任何字符。官方示例得到 11 个节点、6 个叶子的树，WPL=224：这就是按这棵树编码 100 个字符所需的总位数。因为每一步都合并当前最小权值，任何其他二叉编码树都不能得到更小的 WPL；但“最优”只约束 WPL，不约束具体的树形和码串。',
      en: 'The build ends when only one root remains in the queue. Every merge removes one tree from the forest, and n leaves require exactly n-1 merges, so the result is a full binary tree with n leaves and n-1 internal nodes (every internal node has two children). Original symbols correspond one-to-one with leaves; internal nodes represent no symbol. The official example yields 11 nodes with 6 leaves and WPL=224, the total bits needed to encode 100 characters with this tree. Since every step merged the current minima, no other binary coding tree can have a smaller WPL; however, “optimal” constrains only WPL, not the exact tree shape or bit strings.',
      },
      tip: { zh: '6 个叶子必然合并 5 次，最终 11 个节点；叶子和内部节点数是固定关系。', en: 'Six leaves require five merges and give 11 nodes; leaf and internal-node counts have a fixed relationship.' },
    },
    {
      stepId: 'encode-start',
      title: { zh: '⑥ 从根出发：左分支 0，右分支 1', en: '⑥ Start at the root: left 0, right 1' },
      explanation: {
        zh: '编码从一个真实根节点开始，当前路径只含根，前缀为空。约定很明确：走向左孩子追加 0，走向右孩子追加 1。这不是唯一的约定——把左右分支的标签交换，所有码串会取反，WPL 不变；本页固定使用“左 0 右 1”，因此口诀与画面一致。编码路径必须沿真实的 parent/child 引用走，不能根据权值猜测左右；单字符树没有边，理论深度是 0，但实际必须给一个可区分的码字，页面采用 0，并在结果表中单独说明。',
      en: 'Encoding starts at a real root: the current path contains only the root and the prefix is empty. The convention is explicit: going to a left child appends 0, going to a right child appends 1. It is not the only convention—swapping the two labels complements every bit string while leaving WPL unchanged—but this page fixes “left 0, right 1”, so the mnemonic matches the screen. The path must follow real parent/child references, never infer sides from weights. A single-symbol tree has no edge and theoretical depth 0, yet a distinguishable codeword is still required; the page uses 0 and explains it separately in the results table.',
      },
      tip: { zh: '编码前先确认左右约定；不同约定会得到不同码串，但 WPL 相同。', en: 'Confirm the left/right convention before encoding; another convention changes the bits but not WPL.' },
    },
    {
      stepId: 'encode-left',
      title: { zh: '⑦ 左分支与当前前缀：前缀码的由来', en: '⑦ Left branch and current prefix: where prefix-freedom comes from' },
      explanation: {
        zh: '走左分支时，当前前缀在父前缀后追加 0，active 移到真实的左孩子。如果左孩子仍是内部节点，就继续下降；如果是叶子，下一帧直接记下完整编码。前缀码性质来自结构而不是事后检查：字符只放在叶子上，两个不同叶子不可能出现在同一条根到叶路径上；一旦两条路径分开，后面再也不会汇合。于是任一完整码字都不会是另一码字的前缀。若把字符放到内部节点，就可能出现“短码读完之前已经是一个字符”的歧义，这正是编码树要求字符只在叶子上的原因。',
      en: 'On a left branch the prefix appends 0 to its parent prefix and active moves to the real left child. If that child is still internal, descent continues; if it is a leaf, the next frame records the complete code. Prefix-freedom follows from structure rather than a post-hoc check: symbols sit only at leaves, two different leaves cannot lie on the same root-to-leaf path, and once two paths diverge they never rejoin. Therefore no complete codeword is a prefix of another. Placing a symbol at an internal node would allow “a symbol is already complete before the shorter code ends”, which is exactly why coding trees keep symbols only at leaves.',
      },
      tip: { zh: '前缀码不需要分隔符；一旦某个码是另一个的前缀，解码就会歧义。', en: 'Prefix codes need no separator; if one code were a prefix of another, decoding would be ambiguous.' },
    },
    {
      stepId: 'encode-right',
      title: { zh: '⑧ 右分支、等权合并与编码不唯一', en: '⑧ Right branch, equal weights and non-unique codes' },
      explanation: {
        zh: '右分支追加 1，其余规则与左分支对称。因为 Huffman 只要求每次取两个最小权值，等权节点谁先谁后、两个子节点谁在左谁在右，都可能不同，所以编码不唯一。官方示例虽然用创建序固定了执行过程，但换一种等权合并顺序，仍可能得到另一组合法码串；它们的共同点是：叶子集合相同、每个叶子的深度相同或对应权重下的 WPL 相同、都满足前缀性、都能正确往返解码。因此验证时不能只比较某一组固定码串，而要比较 WPL、码长多重集、前缀性以及编解码往返。',
        en: 'A right branch appends 1; everything else mirrors the left case. Huffman only requires popping two minimum weights, so equal-weight nodes may be ordered differently and either child may sit on the left or right; codes are therefore not unique. Although the official example fixes execution by creation order, another equal-weight merge order can still produce a different valid set of bit strings. What all such results share: the same leaf set, depths that preserve the weighted optimum (the same WPL), prefix-freedom, and correct round-trip decoding. Validation must therefore compare WPL, the multiset of code lengths, prefix-freedom and encode/decode round-trips, not one hard-coded bit string.',
      },
      tip: { zh: '看到不同码串不要立刻判错；先检查 WPL、前缀性和往返解码。', en: 'Do not reject a different bit string immediately; check WPL, prefix-freedom and round-trip decoding first.' },
    },
    {
      stepId: 'encode-leaf',
      title: { zh: '⑨ 到达叶子：高频短码、加权贡献与单字符特例', en: '⑨ Leaf reached: frequent-short codes, weighted contribution and the single-symbol case' },
      explanation: {
        zh: '到达叶子时，当前路径的位串就是该字符的编码，码长等于叶子深度。结果表逐行记录字符、频率、二进制码、码长和加权贡献（频率 × 码长）；所有贡献相加就是 WPL。频率越高的字符在最优树中通常越浅，因此码越短：官方示例 F=45 只用 1 位，而 A=5 要 4 位。这里的“通常”很重要：最优性保证总代价最小，并不保证每个高频字符都严格比每个低频字符短。单字符是边界情况：树只有一个叶子，理论深度 0、WPL=0；但若真的输出空串就无法区分“有字符”和“没有字符”，所以页面实际采用码 0、码长 1，实际总位数等于频率 × 1，并在界面明确区分这两个口径。',
      en: 'At a leaf, the current path bits are the symbol’s code and its length equals the leaf depth. The results table records symbol, frequency, binary code, length and weighted contribution (frequency × length); summing all contributions gives WPL. More frequent symbols are usually shallower and therefore shorter in an optimal tree: in the official example F=45 needs one bit while A=5 needs four. “Usually” matters: optimality minimises the total cost, not the length of every individual frequent symbol relative to every rare one. The single-symbol case is a boundary: one leaf gives theoretical depth 0 and WPL 0, but emitting an empty string would make “one symbol” indistinguishable from “no symbol”, so the page actually uses code 0 with length 1 and total bits = frequency × 1, and labels the two measurements separately.',
      },
      tip: { zh: '单字符要同时报告理论 WPL=0 与实际 1 位编码；不要把两者混成一个数。', en: 'For one symbol report both theoretical WPL 0 and the actual one-bit code; never merge the two numbers.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑩ 编码表、定长对比、复杂度与记忆口诀', en: '⑩ Code table, fixed-length comparison, complexity and the mnemonic' },
      explanation: {
        zh: '最终帧把全部字符、频率、编码、码长与加权贡献放在一张表中，并给出 WPL、实际总位数和定长编码对比。定长编码对 k 个字符用 ⌈log₂k⌉ 位，6 个字符就是 3 位，100 个字符共 300 位；Huffman 示例只用 224 位，少 76 位。一般地，把所有字符按等长码编码本身也是一棵合法编码树，而 Huffman 的 WPL 在所有合法树中最小，所以 Huffman 总位数不会超过同样的定长方案（单字符的 0 位理论值除外，实际采用 1 位）。时间复杂度 O(n log n)，空间 O(n)。记忆口诀：“两小合一，重复建树；左零右一，走到叶子。”前半句是建树，后半句是本页采用的二叉编码约定；换成右 0 左 1 仍是最优前缀码，只是码串不同。',
      en: 'The final frame collects symbol, frequency, code, length and weighted contribution in one table, together with WPL, actual total bits and a fixed-length comparison. A fixed-length code for k symbols uses ⌈log₂k⌉ bits: three bits for six symbols, so 100 characters need 300 bits, while the Huffman example needs only 224—76 fewer. In general, equal-length coding is itself a valid coding tree, and Huffman has the minimum WPL among all valid trees, so its total never exceeds that fixed-length scheme (apart from the single-symbol theoretical zero, where the page actually uses one bit). Time is O(n log n) and space O(n). Mnemonic: “Merge the two smallest, repeat to build the tree; left zero, right one, walk to the leaf.” The first half builds, the second states this page’s binary convention; right 0 / left 1 is still an optimal prefix code, only with different bit strings.',
      },
      tip: { zh: '口诀“两小合一，重复建树；左零右一，走到叶子”只适用于本页采用的二叉编码约定。', en: 'The mnemonic “merge two smallest, repeat; left zero, right one, walk to leaf” applies to this page’s binary convention.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把 WPL 算成所有叶子权值之和；正确公式是 Σ(权值 × 深度)，也就是每个字符编码后的位数之和。',
      '每次只取最小叶子而不把新父节点放回队列，导致森林提前合并完或树不完整。',
      '把内部节点也当作字符输出编码；字符只能出现在叶子上，内部节点只承载合并后的权值。',
      '父节点权值写成 max、平均值或漏加一个孩子；它必须严格等于两个孩子权值之和。',
      '用排序数组代替最小堆，误以为堆中元素整体有序；堆只保证堆顶最小，其他位置只满足父子堆序。',
      '看到不同码串就判错；编码不唯一，应比较 WPL、码长多重集、前缀性和编解码往返。',
      '单字符时把理论 WPL=0 当成实际总位数 0；实际采用 1 位码 0，位数等于频率 × 1。',
    ],
    en: [
      'Computing WPL as a plain sum of leaf weights; the correct formula is Σ(weight × depth), the number of encoded bits per symbol.',
      'Popping only the minimum leaf without pushing the new parent back, so the forest finishes early or the tree stays incomplete.',
      'Emitting codes for internal nodes; symbols belong only at leaves, while internal nodes carry merged weights.',
      'Writing the parent weight as max, an average or a missing child; it must equal the exact sum of both children.',
      'Replacing the min-heap with a sorted array and assuming every heap element is ordered; a heap only guarantees the minimum at the root.',
      'Rejecting a different bit string outright; codes are not unique, so compare WPL, length multiset, prefix-freedom and round-trips.',
      'Treating theoretical WPL 0 as zero actual bits for a single symbol; the page uses one-bit code 0, so bits = frequency × 1.',
    ],
  },
};
