import type { Lesson } from './types';

/**
 * T3 max-heap / heap-sort course. Step ids are exactly the `lesson_step=` values
 * emitted by HEAP_PYTHON:
 *   init / build / heapify / compare-children / compare-parent / swap /
 *   insert / extract / sort / done.
 * One program covers build, push, extract and sort; the selected operation still
 * determines which frames exist. The rail never invents a step for a frame that
 * the real Python run did not produce.
 */
export const heapLesson: Lesson = {
  lessonId: 'max-heap-build-push-extract-sort',
  algorithmId: 'heap',
  contentVersion: '1.0.0',
  title: { zh: '最大堆：建堆、插入、删除堆顶与堆排序', en: 'Max heap: build, push, extract max and heap sort' },
  oneLiner: {
    zh: '最大堆把“父节点不小于孩子”的性质存进一个真实 Python 数组；建堆、插入上浮、删除堆顶下沉和原地堆排序都只移动元素，不改变完全二叉树的形状。',
    en: 'A max heap stores “every parent is at least its children” in one real Python array; build, push sift-up, extract sift-down and in-place heap sort move elements without reshaping the complete binary tree.',
  },
  overview: {
    zh: '本课使用一个真实 Python 数组作为堆的唯一存储：VALUES[slot] 是当前值，IDS[slot] 是该元素的稳定教学编号。完全二叉树完全由槽位推出：槽位 i 的左孩子是 2i+1，右孩子是 2i+2，父节点是 ⌊(i-1)/2⌋。数组前 heapSize 个槽位属于有效堆，heapSize 之后的槽位是堆排序已经固定在最终位置的升序后缀，不参与任何堆调整。建堆从最后一个非叶节点 n//2 - 1 开始，逐个对子树根下沉；插入把新元素追加到尾端再上浮；删除堆顶先记录根最大值，把末尾元素移到根、堆大小减一，再从根下沉；堆排序完整建堆后，反复把堆顶最大值交换到当前堆尾、缩小堆区并恢复根。交换帧中的两个编号只是从槽位 A 移到槽位 B：例如 h3 的值从 #0 移到 #5，节点形状和编号都不变，变的是它所在的数组槽位。',
    en: 'This course uses one real Python array as the only heap storage: VALUES[slot] is the current value and IDS[slot] is the element’s stable teaching id. The complete tree is derived from slots alone: slot i has left child 2i+1, right child 2i+2 and parent ⌊(i-1)/2⌋. The first heapSize slots are the active heap; slots after heapSize are the ascending suffix already fixed by heap sort and never take part in heap repairs. Build starts at the last non-leaf n//2 - 1 and sifts down every subtree root. Push appends the new element at the tail and sifts it up. Extract records the root maximum, moves the tail element to the root, shrinks the heap by one and sifts down. Heap sort builds once, then repeatedly swaps the maximum root to the current heap end, shrinks the heap and repairs the root. In a swap frame the two ids only move from slot A to slot B: if h3’s value moves from #0 to #5, the tree shape and the id stay the same; what changed is the array slot it occupies.',
  },
  intuition: {
    zh: '把数组想成一栋按层住满的楼：0 号房是屋顶，1、2 号房在下一层，3～6 号房再下一层，只有最后一层可以从右往左少住几间，这就是完全二叉树。最大堆的规矩是“每家都不能比自己的孩子小”，所以屋顶一定是全楼最大。建堆像从最底层的工头开始逐层向上检查：每个工头先看两个孩子谁更大，再和自己比；自己不小时就停，自己小时就和较大的孩子换房间，然后继续往下检查。插入是先在最后一层最右边加一间房，再沿着父链往上问“我是不是比爸爸大”；删除堆顶是把屋顶的人请走，把最后一个人先搬到屋顶，再让他一路向下和较大的孩子换，直到坐稳。堆排序则反复把屋顶最大值搬到当前楼的最后一间、把楼缩小一层，再让新屋顶下沉；被搬走的最大值从此不再属于这栋楼，形成从尾部长出来的升序后缀。楼的外形不因换房而改变，换的只是谁住在哪个房间。',
    en: 'Think of the array as a building filled level by level: room 0 is the roof, rooms 1 and 2 are the next floor, rooms 3–6 the floor below, and only the last floor may be short from the right. That is a complete binary tree. The max-heap rule is “no parent is smaller than its children”, so the roof is always the global maximum. Build behaves like checking every foreman from the bottom upward: compare the two children, then compare the larger child with the parent; if the parent is not smaller, stop, otherwise exchange rooms with the larger child and continue downward. Push first adds a room at the far right of the last floor, then asks along the parent chain “am I larger than my father?” Extract invites the roof’s maximum to leave, moves the last resident to the roof, then lets that resident move down with the larger child until settled. Heap sort repeatedly moves the roof maximum to the current last room, shrinks the building by one floor, and sifts the new roof down; the removed maxima grow an ascending suffix from the tail. The building’s shape never changes because of an exchange: only who lives in which room changes.',
  },
  prerequisites: {
    zh: ['理解数组下标从 0 开始', '知道完全二叉树与层序编号', '会用 Python 列表、整数除法 // 与交换语法'],
    en: ['Zero-based array indexing', 'Complete binary trees and level-order numbering', 'Python lists, integer division // and tuple swap'],
  },
  complexity: {
    time: '建堆 O(n) · 插删 O(log n) · 排序 O(n log n)',
    space: '原地排序 O(1)',
    note: {
      zh: '自底向上建堆不是 O(n log n)：绝大多数节点靠近底层、下沉高度很小，把每层节点数与可下沉高度相乘求和后是 O(n)。插入和删除堆顶只沿一条根叶路径走，树高 ⌊log₂n⌋，因此各为 O(log n)。堆排序建堆 O(n)，随后 n-1 次“交换到堆尾 + 根下沉”，每次 O(log n)，总计 O(n log n)。若只算数组原地操作，辅助空间是 O(1)；本页额外保存每一帧教学 Trace、稳定编号与展示快照，这些是为了回退/跳帧和教学观察，不属于堆排序算法本身的辅助空间。最大堆也不保证相等元素的相对次序，所以堆排序是不稳定排序。',
      en: 'Bottom-up build is not O(n log n): most nodes sit near the bottom and sift down only a short distance; summing nodes-per-level × possible height gives O(n). Push and extract follow one root-to-leaf path of height ⌊log₂n⌋, so each is O(log n). Heap sort builds in O(n), then performs n-1 “swap to the end + sift the root down” rounds at O(log n), for O(n log n). Counting only in-place array operations, auxiliary space is O(1); this page additionally stores every teaching Trace frame, stable ids and display snapshots for rewind/jump and observation, which are not part of the heap-sort algorithm’s auxiliary space. A max heap also does not preserve the relative order of equal values, so heap sort is unstable.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 完全二叉树与数组槽位', en: '① Complete tree and array slots' },
      explanation: {
        zh: '初始化帧把输入数组按层序摆成完全二叉树：除最后一层外每层都满，最后一层从左到右连续。最大堆与最小堆只差比较方向：最大堆要求每个父节点 ≥ 两个孩子，最小堆要求父节点 ≤ 两个孩子；本课统一使用最大堆。数组就是这棵树的层序存储，槽位 i 的左孩子是 2i+1、右孩子是 2i+2、父节点是 ⌊(i-1)/2⌋。节点上的 #i 与右侧数组行的 i 必须一一对应，树的形状只由总元素数和槽位决定。',
        en: 'The init frame places the input array into a complete binary tree in level order: every level is full except the last, which is filled left to right. Max and min heaps differ only in comparison direction: a max heap requires every parent ≥ its two children, a min heap requires parent ≤ children; this course always uses a max heap. The array is exactly the level-order storage of that tree: slot i has left child 2i+1, right child 2i+2 and parent ⌊(i-1)/2⌋. The #i on a node and the row i in the array panel must match one-to-one; the tree shape depends only on the total count and slots.',
      },
      tip: { zh: '完全二叉树只有最后一层可以不满，而且必须从左到右连续。', en: 'Only the last level may be incomplete, and it must be filled left to right.' },
    },
    {
      stepId: 'build',
      title: { zh: '② 自底向上建堆：从最后一个非叶节点开始', en: '② Bottom-up build: start at the last non-leaf' },
      explanation: {
        zh: '建堆不把元素一个个插入，而是承认叶子本身已经是合法堆，从最后一个非叶节点 n//2 - 1 开始向前，对每个子树根执行一次下沉。每一层先修好下面的子树，再修当前根，所以轮到某个根时，它的左右子树都已经是最大堆。这个顺序让建堆达到 O(n)，而不是 n 次 O(log n) 插入的 O(n log n)。build-start 帧只标出起点，此时还没有选中任何 active 节点；随后每个 heapify-node 帧选中一个子树根。',
        en: 'Build does not insert one element at a time. It treats every leaf as a valid heap and starts at the last non-leaf n//2 - 1, moving backwards and sifting down each subtree root. Lower subtrees are repaired before the current root, so when a root is processed its two subtrees are already max heaps. This order makes build O(n), not n insertions at O(log n) for O(n log n). The build-start frame only marks the starting point and has no active node; each following heapify-node frame selects one subtree root.',
      },
      tip: { zh: '最后一个非叶节点下标是 n//2 - 1；下标 ≥ n//2 的槽位都是叶子。', en: 'The last non-leaf is n//2 - 1; every slot ≥ n//2 is a leaf.' },
    },
    {
      stepId: 'heapify',
      title: { zh: '③ 下沉：让一个子树根重新落位', en: '③ Sift down: restore one subtree root' },
      explanation: {
        zh: '下沉从当前子树根 start 开始：反复计算左孩子 2i+1，若右孩子 2i+2 存在则先比较两个孩子，选出较大者；再把当前节点与这个较大孩子比较。父节点不小时停止，父节点小时交换父子槽位，并把当前下标移到孩子继续向下。因为下面子树已经是最大堆，换下来的元素只可能继续沿这条路径违反性质，不需要检查另一棵子树。heapify-node 只标记起点，compare-children 和 compare-parent-child 分别记录真实发生的一次孩子比较和一次父子比较。',
        en: 'Sift down starts at the subtree root: compute left child 2i+1, compare the two children when right child 2i+2 exists, choose the larger, then compare the current node with that larger child. Stop when the parent is not smaller; otherwise exchange parent/child slots and continue from the child. Because the lower subtrees are already max heaps, the displaced value can only violate the rule along this path, so the other subtree needs no check. heapify-node marks the start; compare-children and compare-parent-child record one real sibling comparison and one real parent/child comparison respectively.',
      },
      tip: { zh: '下沉只和较大的孩子交换；和较小孩子交换可能把更大值埋到下面，破坏堆性质。', en: 'Sift down swaps with the larger child; swapping with the smaller one can bury a larger value and break the heap.' },
    },
    {
      stepId: 'compare-children',
      title: { zh: '④ 左孩子 2i+1，右孩子 2i+2', en: '④ Left child 2i+1, right child 2i+2' },
      explanation: {
        zh: '比较孩子帧的 leftId/rightId 必须指向槽位 2i+1 与 2i+2 的真实元素，left 槽位是奇数，right 恰好是 left+1，二者共享同一个父节点 i。代码先选较大孩子：values[left] >= values[right] 时选左，否则选右；相等时选左是一条明确、稳定的规则，不代表左孩子“更重要”。如果只有左孩子，就不发 compare-children 帧，直接进入父子比较；右孩子存在而左孩子不存在在完全二叉树中不会发生。',
        en: 'A sibling frame’s leftId/rightId must point at the real elements in slots 2i+1 and 2i+2: the left slot is odd, right is exactly left+1, and both share parent i. The code chooses the larger child first: values[left] >= values[right] selects left, otherwise right; choosing left on equality is a stable rule, not a claim that the left child matters more. With only a left child there is no sibling frame, and the code goes straight to the parent comparison; a right child without a left cannot occur in a complete tree.',
      },
      tip: { zh: '考试常把 2i+1 / 2i+2 写成 2i / 2i+1；从 0 开始编号时必须用前者。', en: 'A common exam mistake writes 2i / 2i+1; with zero-based slots the correct pair is 2i+1 / 2i+2.' },
    },
    {
      stepId: 'compare-parent',
      title: { zh: '⑤ 父节点 ⌊(i-1)/2⌋ 与上浮/下沉判断', en: '⑤ Parent ⌊(i-1)/2⌋ and the sift decision' },
      explanation: {
        zh: '父子比较帧记录 parentId 与 childId，父槽位必须等于 ⌊(child-1)/2⌋。下沉时 active 是父节点，路径从根到父；上浮时 active 是子节点，路径从根到子。最大堆要求父 ≥ 子：满足就停止，不满足就交换。相等时也停止，因为交换不会改善堆性质，还会制造无意义的移动；本课的重复值正用来验证这一点。比较帧不直接改数组，下一帧 swap 才表示真实交换。',
        en: 'A parent/child frame records parentId and childId, and the parent slot must equal ⌊(child-1)/2⌋. During sift-down the active node is the parent and the path runs root-to-parent; during sift-up the active node is the child and the path runs root-to-child. A max heap requires parent ≥ child: stop when true, exchange when false. Equality also stops because an exchange would not improve the invariant and would only add a meaningless move; the course’s duplicate values verify this. A comparison frame does not change the array; the next swap frame represents the real exchange.',
      },
      tip: { zh: '“父不小于子”包含相等；只有严格小于时才需要交换。', en: '“Parent is not smaller” includes equality; only a strict smaller parent requires a swap.' },
    },
    {
      stepId: 'swap',
      title: { zh: '⑥ 交换的是槽位里的元素，不是树形', en: '⑥ A swap moves elements between slots, not the tree' },
      explanation: {
        zh: '交换帧同时给出 firstId 与 secondId；它们只是从原槽位移动到对方槽位，完全二叉树仍然按原槽位存在。例如下沉时把父 #i 与孩子 #j 交换：h3 与 h5 的值互换，h3 现在住在 #j，h5 住在 #i，节点总数、层级和父子槽位公式都没有变。数组帧随后按槽位重新列出元素，因此节点圆和数组行读的是同一份快照。上浮交换的 active 是移动后到父槽位的那颗元素，下沉交换的 active 是移动后到孩子槽位的元素，路径也随之更新。',
        en: 'A swap frame provides firstId and secondId; they only move from one slot to the other, while the complete tree continues to exist at the same slots. For a sift-down exchange between parent #i and child #j, h3 and h5 exchange values: h3 now lives in #j while h5 lives in #i, but the node count, levels and parent/child formulas do not change. The array panel re-lists elements by slot in the same snapshot, so circles and rows read one source. In a sift-up swap the active element is the one now at the parent slot; in a sift-down swap it is the one now at the child slot, and the path follows it.',
      },
      tip: { zh: '不要把“元素身份”与“数组位置”混为一谈：编号随元素走，槽位随树走。', en: 'Never conflate element identity with array position: the id travels with the element, the slot belongs to the tree.' },
    },
    {
      stepId: 'insert',
      title: { zh: '⑦ 插入：追加到尾端，再沿父链上浮', en: '⑦ Push: append at the tail, then sift up' },
      explanation: {
        zh: '插入先把新值追加到数组末尾，也就是完全二叉树最后一层最右边的新槽位；push-append 帧的 addedId 必须等于该尾槽位的元素，并成为 active。随后循环比较它与父节点：父 ≥ 子就停止，父 < 子就交换并继续向上。每层只走一个父，最多走到根，所以是 O(log n)。新元素的稳定编号 h7 来自这次真实创建，之后即使它上浮到 #0 也不会改名为“根”或 h1；数组尾槽位和树节点同时显示同一编号。',
      en: 'Push first appends the new value to the array tail, the new far-right slot of the last level; the push-append frame’s addedId must be that tail element and it becomes active. The loop then compares it with its parent: parent ≥ child stops, parent < child exchanges and continues upward. Each step visits one parent, at most the root, so it is O(log n). The new element’s stable id h7 comes from this real creation; even if it sifts up to #0 it is never renamed “root” or h1. The tail slot and tree node show the same id.',
      },
      tip: { zh: '插入不能先比较再追加；新元素必须先真实进入数组，才能沿父链上浮。', en: 'Push must append before comparing; the new element has to exist in the array before sift-up can follow its parent chain.' },
    },
    {
      stepId: 'extract',
      title: { zh: '⑧ 删除堆顶：记录最大值，末尾补根，再下沉', en: '⑧ Extract max: record it, move the tail to the root, sift down' },
      explanation: {
        zh: '删除堆顶先发出 extract-select，active 指向 #0，此时数组还未改变，最大值仍在根。代码记录返回值和 removed，然后把最后一个元素弹出，让 totalSize 与 heapSize 同时减一；如果堆已空，直接以 result=empty 结束。否则把原来的尾元素写入 #0，发出 replace-root：removed 是旧根且不再出现在 elements，replacement 记录 tailId 从旧尾槽位 fromSlot 移到 0。之后若堆大小大于 1，从根下沉；单元素或空堆不需要下沉。删除只沿一条根叶路径，O(log n)。',
        en: 'Extract emits extract-select with active #0 while the array is still unchanged and the maximum is still at the root. Python records the return value and removed, pops the last element, and decrements both totalSize and heapSize; if the heap was empty it finishes with result=empty. Otherwise the old tail is written into #0 and replace-root is emitted: removed is the old root and no longer appears in elements, while replacement records tailId moving from the old tail slot fromSlot to 0. If more than one element remains, sift down from the root; a single element or empty heap needs no sift. Extract follows one root-to-leaf path, O(log n).',
      },
      tip: { zh: '删除堆顶不是把根标记为空：必须让最后一个元素真实补到 #0，再恢复堆性质。', en: 'Extract does not just mark the root empty: the last element must really move to #0 and the heap must be repaired.' },
    },
    {
      stepId: 'sort',
      title: { zh: '⑨ 原地堆排序：最大值换到堆尾，堆区缩小', en: '⑨ In-place heap sort: maximum to the end, shrink the heap' },
      explanation: {
        zh: '堆排序先完整建出最大堆。随后每一轮：sort-select 标记当前根 #0 是最大值；把它与当前堆尾 #end 交换；heapSize 变为 end，sortedFrom 也变为 end，表示 #end 及其右边已经固定为最终升序后缀；swap-to-end 帧记录 #0 ↔ #heapSize 的真实交换。若堆区还剩多于一个元素，从根下沉恢复最大堆。下一轮只在前 heapSize 个槽位里选最大值，已排序后缀不再参与任何比较。这样最大值依次从右往左固定，最后得到全局升序。',
      en: 'Heap sort first builds a complete max heap. Each round then marks root #0 as the current maximum with sort-select, swaps it with the current heap end #end, sets heapSize to end and sortedFrom to end, so #end and everything to its right are fixed as the final ascending suffix, then emits swap-to-end for the real #0 ↔ #heapSize exchange. If more than one heap element remains, sift down from the root. The next round selects a maximum only among the first heapSize slots; the sorted suffix takes part in no comparison. Maxima are fixed from right to left, producing a globally ascending array.',
      },
      tip: { zh: '交换后堆区已经缩小：新根下沉时绝不能碰 sortedFrom 之后的最大值。', en: 'The heap shrinks before the swap frame: sift-down must never touch a fixed maximum at or after sortedFrom.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑩ 结果、重复值与不稳定性', en: '⑩ Result, duplicates and instability' },
      explanation: {
        zh: '终帧由真实 Python 执行发出：build 得到 result=built，push 得到 pushed，非空 extract 得到 extracted 且 removed 是实际最大值，空堆 extract 得到 empty，堆排序得到 sorted 且全数组升序。堆排序的辅助空间按算法本身是 O(1)，但本页为教学 Trace、稳定编号和逐帧快照额外保存了数据，这部分不算算法辅助空间。最大堆在比较相等时按既定规则停止或选左，不保留相等元素原来的相对次序，因此堆排序是不稳定排序；本课的重复 9 用来验证相等时不会乱换。常见错误包括：把建堆误写成 O(n log n)、混淆 2i+1 与 2i、删除堆顶后忘记缩小堆大小、堆排序时继续调整已排序后缀、以及交换时误以为树形改变。考试记忆重点是“建堆 O(n)、插删 O(log n)、排序 O(n log n)、原地 O(1)、不稳定”，以及三条下标公式。',
        en: 'The terminal frame comes from real Python: build gives result=built, push gives pushed, a non-empty extract gives extracted with the actual maximum in removed, an empty extract gives empty, and heap sort gives sorted with the entire array ascending. Heap sort’s auxiliary space is O(1) for the algorithm itself, but this page additionally stores teaching Trace frames, stable ids and snapshots; those are not algorithmic auxiliary space. A max heap stops or chooses left on equality and does not preserve the original relative order of equal elements, so heap sort is unstable; the duplicate 9 verifies that equality does not trigger random swaps. Common mistakes include calling build O(n log n), swapping 2i+1 with 2i, forgetting to shrink heapSize after extract, continuing to sift a sorted suffix during heap sort, and believing a swap reshapes the tree. Exam memory: build O(n), push/extract O(log n), sort O(n log n), in-place O(1), unstable, plus the three index formulas.',
      },
      tip: { zh: '复杂度的“原地 O(1)”只指算法辅助数组；教学 Trace 与展示快照不算。', en: '“In-place O(1)” refers to algorithmic auxiliary arrays only; teaching Trace and display snapshots do not count.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把自底向上建堆算成 O(n log n)：正确结果是 O(n)，因为大多数节点下沉高度很小。',
      '把左孩子写成 2i、右孩子写成 2i+1；从 0 开始编号时应为 2i+1 与 2i+2。',
      '下沉时与较小的孩子交换，导致更大的孩子仍大于新父节点，堆性质被破坏。',
      '删除堆顶后只把根置空，或忘记把 heapSize/totalSize 减一，数组出现空洞。',
      '堆排序交换到堆尾后仍让已排序后缀参与下沉，破坏已经固定的最大值。',
      '把元素稳定编号当成数组下标；交换时改编号而不是移动槽位，导致树形被错误重排。',
      '把堆排序说成稳定排序；相等元素在堆调整中没有保持原相对次序。',
      '把原地堆排序的辅助空间报成 O(log n)；算法本身只使用常数个下标与临时变量。',
    ],
    en: [
      'Calling bottom-up build O(n log n); it is O(n) because most nodes sift only a short distance.',
      'Writing left child 2i and right child 2i+1; with zero-based slots they are 2i+1 and 2i+2.',
      'Sifting down with the smaller child, leaving the larger child still above the new parent value.',
      'Extract only clearing the root, or forgetting to decrement heapSize/totalSize and leaving a hole.',
      'Letting the sorted suffix take part in sift-down after heap sort has fixed a maximum.',
      'Treating a stable element id as an array index; swapping ids instead of moving slots reshapes the tree incorrectly.',
      'Calling heap sort stable; equal values do not keep their original relative order through heap repairs.',
      'Reporting O(log n) auxiliary space for in-place heap sort; algorithmic auxiliary space is O(1).',
    ],
  },
};
