import type { LocalizedList, LocalizedText } from '../lessons/types';
import type { CourseGuide, GuideFlowKind, GuideStage } from './types';

const text = (zh: string, en: string): LocalizedText => ({ zh, en });
const list = (zh: string[], en: string[]): LocalizedList => ({ zh, en });

const step = (
  zh: string,
  en: string,
  zhNote?: string,
  enNote?: string,
): GuideStage => ({
  title: text(zh, en),
  ...(zhNote && enNote ? { summary: text(zhNote, enNote) } : {}),
});

const algorithm = (...stages: GuideStage[]): { flowKind: GuideFlowKind; stages: GuideStage[] } => ({
  flowKind: 'algorithm',
  stages,
});

const operations = (...stages: GuideStage[]): { flowKind: GuideFlowKind; stages: GuideStage[] } => ({
  flowKind: 'operations',
  stages,
});

/**
 * One authored entry per formal course.
 *
 * - `intro` answers: what problem, why the naive approach is limited, what this
 *   method improves.
 * - `definition` uses CS terminology; the UI pairs it with the course's own
 *   intuition as the plain-language half.
 * - `stages` are abstract phases from algorithm principles/textbook order, not
 *   the current Trace's frame captions.
 * - `conditions` are correctness/precondition facts, never Python prerequisites.
 */
export const COURSE_GUIDES: Record<string, CourseGuide> = {
  bubble: {
    intro: text(
      '排序问题的朴素做法是反复扫描并交换逆序对。冒泡排序把交换限制在相邻元素之间；每一轮都会把当前未排序区的最大值送到区尾，于是下一轮可以少检查一个位置。它实现简单、稳定且原地，适合作为排序入门，但 O(n²) 的比较次数不适合大规模数据。',
      'A naive sorting approach repeatedly scans the array and swaps inverted pairs. Bubble sort restricts each swap to adjacent elements; every pass pushes the largest remaining value to the end of the unsorted region, so the next pass can stop one slot earlier. It is simple, stable and in-place, making it a good first sorting algorithm, but its O(n²) comparisons do not scale to large inputs.',
    ),
    definition: text(
      '冒泡排序是一种稳定的原地比较排序：反复比较相邻元素，若前者大于后者则交换；每轮结束时当前未排序区的最大元素位于区尾。',
      'Bubble sort is a stable, in-place comparison sort: it repeatedly compares adjacent elements and swaps them when the left value is greater; after each pass the largest value of the unsorted region sits at its end.',
    ),
    ...algorithm(
      step('比较相邻元素', 'Compare adjacent values'),
      step('交换逆序对', 'Swap inverted pairs'),
      step('一轮定位最大值', 'Place the maximum at the pass end', '一轮结束，最大值已到未排序区区尾。', 'At the end of a pass, the maximum is already at the end of the unsorted region.'),
      step('缩小未排序区', 'Shrink the unsorted region'),
      step('重复至有序', 'Repeat until sorted'),
    ),
    conditions: list(
      ['元素必须可比较、可交换。', '相等元素不交换，因此稳定。', '原地排序，额外空间 O(1)。'],
      ['Elements must be comparable and swappable.', 'Equal elements are never swapped, so the sort is stable.', 'In-place with O(1) extra space.'],
    ),
  },

  selection: {
    intro: text(
      '当交换成本较高时，我们希望每一轮只做一次交换。选择排序先完整扫描未排序区，记下最小值的下标，再把它与区首交换；这样交换次数最多 n−1，但无论输入如何都要扫完整个后缀。它适合理解“选择”与“原地交换”，代价是 O(n²) 时间且不稳定。',
      'When swaps are expensive, we want at most one swap per pass. Selection sort scans the whole unsorted region, records the minimum index, then swaps it with the first unsorted slot. This caps swaps at n−1, but every pass still scans the entire suffix. It is a clear model of selection and in-place exchange, at the cost of O(n²) time and instability.',
    ),
    definition: text(
      '选择排序是一种原地比较排序：每轮在未排序区中选择最小元素，并与未排序区首元素交换，逐步扩大有序前缀。',
      'Selection sort is an in-place comparison sort: each pass selects the minimum element of the unsorted region and swaps it with the region’s first element, growing a sorted prefix.',
    ),
    ...algorithm(
      step('扫描未排序区', 'Scan the unsorted region'),
      step('记录最小下标', 'Record the minimum index', '只记录下标，扫描期间不交换。', 'Only the index is recorded; no swaps happen during the scan.'),
      step('与区首交换', 'Swap with the region head'),
      step('前缀扩大一格', 'Grow the sorted prefix by one'),
    ),
    conditions: list(
      ['元素必须可比较。', '标准实现不稳定：远处的最小值可能跨过相等元素。', '交换次数少，但比较次数始终约为 n²/2。'],
      ['Elements must be comparable.', 'The standard implementation is unstable: a distant minimum may jump over equal elements.', 'Few swaps, but comparisons always stay around n²/2.'],
    ),
  },

  insertion: {
    intro: text(
      '很多数据并不是完全无序，而是接近有序。插入排序维护一个有序前缀，把当前元素向左插入；输入越接近有序，移动越少，最好可到 O(n)。它稳定、原地、实现简单，也是希尔排序和小数组归并优化的基础，但逆序输入仍会退化到 O(n²)。',
      'Many inputs are nearly ordered rather than completely random. Insertion sort maintains a sorted prefix and inserts the current element into it; the closer the input is to sorted, the fewer moves are needed, reaching O(n) in the best case. It is stable, in-place and simple, and underpins Shell sort and small-array merge optimisations, but reverse-ordered input still degrades to O(n²).',
    ),
    definition: text(
      '插入排序是一种稳定的原地排序：维护有序前缀，将当前元素 key 插入前缀中的正确位置，必要时把较大元素依次右移。',
      'Insertion sort is a stable, in-place sort: it maintains a sorted prefix and inserts the current key at its correct position, shifting larger elements right when necessary.',
    ),
    ...algorithm(
      step('取出当前 key', 'Take the current key'),
      step('向左比较', 'Compare leftwards'),
      step('较大元素右移', 'Shift larger elements right', '空位随比较一起左移。', 'The hole moves left together with the comparison.'),
      step('key 写入空位', 'Place the key in the hole'),
      step('有序前缀扩大', 'Grow the sorted prefix'),
    ),
    conditions: list(
      ['元素必须可比较。', '相等元素不跨过 key，因此稳定。', '适合小规模或接近有序的数据；逆序时最坏 O(n²)。'],
      ['Elements must be comparable.', 'Equal elements do not cross the key, so the sort is stable.', 'Best for small or nearly sorted inputs; worst case is O(n²) on reverse order.'],
    ),
  },

  shell: {
    intro: text(
      '插入排序一次只能把元素向左移动一格，遇到远离目标位置的元素时效率很低。希尔排序先用较大的 gap 让元素跨越式移动，快速减少逆序对，再逐步缩小 gap；最后一轮 gap=1 就是普通插入排序。它的性能取决于间隔序列，本课的折半序列最坏仍是 O(n²)，但通常明显快于直接插入排序。',
      'Insertion sort moves an element only one slot per comparison, which is slow when an element is far from its destination. Shell sort first uses a large gap so elements can jump across the array and remove many inversions quickly, then shrinks the gap; the final gap=1 pass is ordinary insertion sort. Its performance depends on the gap sequence: the halving sequence used here is still O(n²) in the worst case, though usually much faster than plain insertion sort.',
    ),
    definition: text(
      '希尔排序是一种基于插入排序的分组排序：按递减的间隔 gap 将数组分成若干子序列，分别做插入排序，最终 gap=1 完成全局排序。',
      'Shell sort is a gap-based variant of insertion sort: it divides the array into subsequences according to a decreasing gap, insertion-sorts each subsequence, and finishes with gap=1.',
    ),
    ...algorithm(
      step('选择初始 gap', 'Choose the initial gap'),
      step('按 gap 分组', 'Split into gap lanes'),
      step('组内插入排序', 'Insertion-sort each lane', '同一 lane 内按 gap 跳跃比较与移动。', 'Within a lane, comparisons and moves jump by gap.'),
      step('缩小 gap', 'Shrink the gap'),
      step('gap=1 收尾', 'Finish with gap=1'),
    ),
    conditions: list(
      ['时间界取决于间隔序列，不能笼统写成 O(n log n)。', '本课 n/2 折半序列最坏 O(n²)。', '标准实现不稳定，额外空间 O(1)。'],
      ['The time bound depends on the gap sequence and is not simply O(n log n).', 'The halving sequence used here is O(n²) in the worst case.', 'The standard implementation is unstable with O(1) extra space.'],
    ),
  },

  quick: {
    intro: text(
      '归并排序能稳定地做到 O(n log n)，但需要额外缓冲区；快速排序希望在原数组上获得接近 O(n log n) 的平均性能。它选一个 pivot，把不大于 pivot 的元素放到左侧，再递归处理左右区间。代价是 pivot 选择不佳时会退化到 O(n²)，且标准原地实现不稳定。',
      'Merge sort guarantees O(n log n) but needs an extra buffer; quicksort aims for near O(n log n) average time on the original array. It chooses a pivot, partitions values no greater than the pivot to the left, then recurses on both sides. The price is O(n²) when pivot choices are poor, and the standard in-place implementation is unstable.',
    ),
    definition: text(
      '快速排序是一种原地分治排序：选择 pivot，将不大于 pivot 的元素划分到左侧、大于 pivot 的元素划分到右侧，再递归处理左右子区间。',
      'Quicksort is an in-place divide-and-conquer sort: it chooses a pivot, partitions values no greater than the pivot to the left and values greater than the pivot to the right, then recurses on both subranges.',
    ),
    ...algorithm(
      step('选择 pivot', 'Choose a pivot'),
      step('分区扫描', 'Partition the range', 'Lomuto 扫描把不大于 pivot 的值换到左边界。', 'The Lomuto scan swaps values no greater than the pivot to the left boundary.'),
      step('pivot 归位', 'Place the pivot'),
      step('递归左右区间', 'Recurse on both sides'),
    ),
    conditions: list(
      ['数组必须支持原地交换与随机访问。', 'pivot 选择显著影响最坏情况；极端 pivot 会退化为 O(n²)。', '标准原地实现不稳定，递归栈最坏 O(n)。'],
      ['The array must support in-place swaps and random access.', 'Pivot choice strongly affects the worst case; an extreme pivot degrades to O(n²).', 'The standard in-place implementation is unstable, with O(n) worst-case recursion depth.'],
    ),
  },

  merge: {
    intro: text(
      '把两个已经有序的序列合并成一个有序序列，只需要反复比较两个队首；这个“合并”操作是线性的。归并排序把这个操作递归地用到底：先拆到单元素，再逐层合并。它稳定且最坏 O(n log n)，但数组实现需要 O(n) 辅助空间。',
      'Merging two already sorted sequences into one only requires repeatedly comparing their fronts, which is linear. Merge sort applies that operation recursively: split down to single elements, then merge back level by level. It is stable and O(n log n) in the worst case, but the array implementation needs O(n) auxiliary space.',
    ),
    definition: text(
      '归并排序是一种稳定的分治排序：递归地将区间对半拆分到单元素，再合并两个有序子区间，直到整个区间有序。',
      'Merge sort is a stable divide-and-conquer sort: it recursively splits a range in half down to single elements, then merges two sorted subranges until the whole range is ordered.',
    ),
    ...algorithm(
      step('二分拆分区间', 'Split the range in half'),
      step('单元素返回', 'Return a single element'),
      step('合并两有序区', 'Merge two sorted runs', '相等时先取左半区元素，保持稳定。', 'Take from the left run on ties to preserve stability.'),
      step('写入缓冲区', 'Write into the buffer'),
      step('按区间写回', 'Copy back into the range'),
    ),
    conditions: list(
      ['需要可比较元素。', '数组实现需要 O(n) 辅助缓冲区。', '稳定排序；链表归并可做到 O(1) 额外空间（递归栈除外）。'],
      ['Elements must be comparable.', 'The array implementation requires an O(n) auxiliary buffer.', 'Stable; linked-list merge can use O(1) extra space excluding recursion.'],
    ),
  },

  factorial: {
    intro: text(
      '阶乘的数学定义天然是递归的：n! 依赖 (n−1)!。如果直接写循环也能算，但递归定义更贴近“把同类子问题交给下一层”这一模式。递归实现必须显式给出 0! 或 1! 的终止条件，否则会无限下探；它的调用栈深度是 O(n)。',
      'The mathematical definition of factorial is naturally recursive: n! depends on (n−1)!. A loop can compute it too, but the recursive definition models “hand the same subproblem to the next level”. A recursive implementation must state the 0! or 1! base case explicitly, or it descends forever; its call-stack depth is O(n).',
    ),
    definition: text(
      '阶乘 n! 定义为 1 到 n 的所有正整数之积，并约定 0! = 1；递归实现利用 n! = n × (n−1)! 将问题规模减一。',
      'The factorial n! is the product of all positive integers from 1 to n, with 0! = 1 by convention; the recursive implementation uses n! = n × (n−1)! to reduce the problem size by one.',
    ),
    ...algorithm(
      step('检查终止条件', 'Check the base case', 'n=0 或 n=1 时直接返回 1。', 'Return 1 immediately when n is 0 or 1.'),
      step('递归 n−1', 'Recurse on n−1', '把规模减一，等待下一层结果。', 'Reduce the size by one and wait for the next level.'),
      step('本层相乘', 'Multiply at this level'),
      step('逐层返回', 'Return through the stack'),
    ),
    conditions: list(
      ['n 必须是非负整数。', '必须定义 0! = 1，否则递归缺少终止值。', '递归深度为 n；n 过大可能导致调用栈溢出。'],
      ['n must be a non-negative integer.', 'Define 0! = 1; otherwise the recursion lacks a terminating value.', 'Recursion depth is n; a very large n can overflow the call stack.'],
    ),
  },

  fib: {
    intro: text(
      '斐波那契的递归定义有两个子问题，因此调用形状从阶乘的“链”变成了“树”。朴素实现不缓存任何子结果，同一个 fib(k) 会在不同分支被反复计算，调用数随 n 指数增长；这不是算法写错，而是它真实的代价。任一时刻活动调用栈仍只有一条根到当前节点的路径，空间是 O(n)。',
      'Fibonacci’s recursive definition has two subproblems, so its call shape becomes a tree instead of factorial’s chain. The naive implementation caches nothing: the same fib(k) is recomputed in different branches and the call count grows exponentially with n. That is not a bug but its real cost. At any instant the live stack is only one root-to-current path, so space is O(n).',
    ),
    definition: text(
      '斐波那契数列满足 F(0)=0、F(1)=1，且 F(n)=F(n−1)+F(n−2)（n≥2）；朴素递归直接按这条定义展开两个子调用，不使用记忆化。',
      'The Fibonacci sequence satisfies F(0)=0, F(1)=1 and F(n)=F(n−1)+F(n−2) for n≥2. Naive recursion expands both subcalls directly from this definition and uses no memoization.',
    ),
    ...algorithm(
      step('建立调用并检查终止条件', 'Create a frame and check the base case', 'n≤1 时直接返回 n；否则准备展开两个子调用。', 'Return n immediately when n≤1; otherwise prepare both subcalls.'),
      step('展开左分支 fib(n−1)', 'Expand the left branch fib(n−1)', '父帧暂停，调用栈加深；左子树一直展开到终止条件。', 'The parent suspends, the stack deepens, and the left subtree runs to its base case.'),
      step('左分支返回，保存 left', 'Left returns into left', '左子帧弹出，父帧恢复，但还不能相加。', 'The left child pops; the parent resumes but still cannot add.'),
      step('展开右分支 fib(n−2)', 'Expand the right branch fib(n−2)', '右分支是另一棵独立子树，可能重复计算相同 n。', 'The right branch is a separate subtree and may recompute the same n.'),
      step('右分支返回，合并 left + right', 'Right returns, then combine left + right'),
      step('逐层返回并弹栈', 'Return through the tree and pop'),
    ),
    conditions: list(
      ['n 必须是非负整数，0 与 1 都必须命中终止条件。', '右侧参数是 n−2，不能误写成 n−1。', '本课程展示朴素递归，不加入缓存或动态规划。'],
      ['n must be a non-negative integer; both 0 and 1 must hit the base case.', 'The right argument is n−2, not n−1.', 'This course shows naive recursion without a cache or dynamic programming.'],
    ),
  },

  stack: {
    intro: text(
      '很多场景只需要在序列的一端追加和删除，例如撤销操作、括号匹配和函数调用。栈把插入和删除都限制在栈顶，因此 push/pop/peek 都是 O(1)。顺序栈用一段连续槽位和 top 下标，链栈用结点指针；两种实现共享同一组栈顶操作，代价是不能随机访问中间元素。',
      'Many tasks only append and remove at one end: undo, bracket matching, function calls. A stack restricts insertion and removal to the top, so push/pop/peek are O(1). A sequential stack uses contiguous slots plus a top index, while a linked stack uses node pointers; both implementations share the same top operations, at the cost of no random access to middle elements.',
    ),
    definition: text(
      '栈是一种后进先出（LIFO）的线性结构，只允许在栈顶进行插入（push）、删除（pop）和读取（peek）。顺序栈的 top 指向当前栈顶，top = -1 表示空栈；链栈的 top 指向首结点。',
      'A stack is a last-in-first-out (LIFO) linear structure that permits insertion (push), removal (pop) and inspection (peek) only at the top. In a sequential stack, top indexes the live top and top = -1 means empty; in a linked stack, top points at the first node.',
    ),
    ...operations(
      step('选择存储方式', 'Choose the storage mode', '顺序栈用数组槽位与 top 下标；链栈用结点与 top 指针。', 'A sequential stack uses array slots and a top index; a linked stack uses nodes and a top pointer.'),
      step('push 先检查栈满', 'Check for a full stack before push', '顺序栈看 top 是否已到 capacity − 1；链栈只要内存允许就能继续接结点。', 'The sequential stack checks whether top has reached capacity − 1; the linked stack can keep linking nodes while memory allows.'),
      step('push 写入并移动栈顶', 'Push, write and move the top', '顺序栈先加一 top 再写入；链栈让新结点指向旧 top，再移动 top。', 'The sequential stack increments top before writing; the linked stack links the new node to the old top, then moves top.'),
      step('peek 只读栈顶', 'Peek without moving the top'),
      step('pop 读取后删除栈顶', 'Pop: read, then remove the top'),
      step('空栈拒绝 pop 与 peek', 'Reject pop and peek on an empty stack'),
    ),
    conditions: list(
      ['只能在栈顶插入、删除和读取。', '顺序栈的 top 指向当前栈顶，top = -1 表示空栈；链栈的 top 指向首结点。', 'push/pop/peek 为 O(1)，查找中间元素仍需 O(n)。'],
      ['Insert, remove and inspect only at the top.', 'For the sequential stack, top indexes the live top and -1 means empty; for the linked stack, top points at the first node.', 'Push/pop/peek are O(1); searching the middle still costs O(n).'],
    ),
  },

  queue: {
    intro: text(
      '当任务必须按到达顺序处理时，例如打印队列或 BFS 的待办列表，用普通数组的 pop(0) 每次都要搬移其余元素。循环队列用 front、rear 两个下标把 enqueue/dequeue 做成 O(1)，并用一个保留空槽区分队空与队满；链队列用头结点和 rear 指针达到同样目标，代价是额外的指针空间。',
      'When tasks must be processed in arrival order—print queues or the BFS frontier—calling pop(0) on an ordinary array shifts every remaining element. A circular queue uses front and rear indices to make enqueue/dequeue O(1), reserving one empty slot to distinguish empty from full. A linked queue reaches the same goal with a head sentinel and a rear pointer, at the cost of extra pointer storage.',
    ),
    definition: text(
      '队列是一种先进先出（FIFO）的线性结构，插入发生在队尾（enqueue），删除发生在队首（dequeue）。循环队列牺牲一个空槽：front == rear 为空，(rear + 1) % capacity == front 为满；链队列带头结点，front 指向头结点，rear 指向最后一个数据结点。',
      'A queue is a first-in-first-out (FIFO) linear structure: insertion (enqueue) happens at the rear and removal (dequeue) at the front. A circular queue reserves one empty slot: front == rear means empty and (rear + 1) % capacity == front means full. A linked queue keeps a head sentinel: front points at the sentinel and rear at the last data node.',
    ),
    ...operations(
      step('选择存储方式', 'Choose the storage mode', '循环队列用固定槽位与 front/rear 下标；链队列用头结点与 rear 指针。', 'A circular queue uses fixed slots with front/rear indices; a linked queue uses a head sentinel and a rear pointer.'),
      step('enqueue 先判队满', 'Check for a full queue before enqueue', '循环队列检查 rear 的下一个位置是否追上 front；链队列只要内存允许就能继续接结点。', 'The circular queue checks whether the slot after rear has caught up with front; the linked queue can keep linking nodes while memory allows.'),
      step('enqueue 写入并移动队尾', 'Enqueue, write and advance the rear', '循环队列把值写进 rear 所指空位后取模后移；链队列在 rear 之后接新结点。', 'The circular queue writes into the free slot at rear and advances modulo capacity; the linked queue links a new node after rear.'),
      step('front 读队首', 'Read the front'),
      step('dequeue 读取并移动队首', 'Dequeue: read and advance the front', '链队列删除最后一个数据结点后，rear 要回到 head。', 'After the linked queue removes its last data node, rear returns to the head sentinel.'),
      step('空队列拒绝 front 与 dequeue', 'Reject front and dequeue on an empty queue'),
    ),
    conditions: list(
      ['只能在队尾插入、队首删除。', '循环队列用保留空槽判满，不能再用 count 充当主判据；链队列删除最后一个数据结点后 rear = head。', '两端操作均为 O(1)，但不能随机访问中间元素。'],
      ['Insert only at the rear and remove only at the front.', 'A circular queue distinguishes full with the reserved slot and never uses count as the primary test; a linked queue moves rear back to head after removing its last data node.', 'Both endpoint operations are O(1), but middle elements cannot be accessed at random.'],
    ),
  },

  'infix-to-postfix': {
    intro: text(
      '人习惯把运算符写在两个操作数中间，但计算机顺序扫描时很难直接判断先算哪一步。中缀转后缀用运算符栈暂存还没决定输出顺序的运算符：操作数立刻输出，优先级更高的运算符先算，左括号把栈内的运算符隔开。转换后得到的是后缀序列，后续求值不再需要括号和优先级规则。',
      'People write operators between operands, but a left-to-right scanner cannot directly tell which operation comes first. Infix-to-postfix keeps undecided operators on an operator stack: operands are emitted immediately, higher-precedence operators are emitted first, and a left parenthesis separates the operators inside it. The result is a postfix sequence whose evaluation no longer needs parentheses or precedence rules.',
    ),
    definition: text(
      '中缀转后缀（调度场算法）从左到右扫描 token：操作数直接加入输出；左括号入栈；右括号弹出运算符直到左括号；普通运算符先弹出所有优先级不低于自己的栈顶，再入栈；扫描结束后清空运算符栈。',
      'Infix-to-postfix (shunting-yard) scans tokens left to right: operands go straight to the output; a left parenthesis is pushed; a right parenthesis pops operators back to the left parenthesis; an ordinary operator first pops every top with greater-or-equal precedence, then pushes itself; the stack is flushed after the scan.',
    ),
    ...algorithm(
      step('切分 token', 'Tokenise the expression', '多位整数保持为一个整体，圆括号与四个运算符各自成为 token。', 'Keep multi-digit integers whole; parentheses and the four operators each become one token.'),
      step('操作数直接输出', 'Emit operands immediately'),
      step('左括号作为弹栈边界入栈', 'Push the left parenthesis as a barrier', '栈顶是左括号时，任何运算符都不能越过它弹出。', 'While a left parenthesis is on top, no operator may pop past it.'),
      step('按优先级弹出旧运算符', 'Pop older operators by precedence', '同级运算符左结合，因此栈顶优先级不低于当前运算符时就先弹出。', 'Operators of equal precedence are left-associative, so a top with greater-or-equal precedence is popped first.'),
      step('右括号回弹到左括号', 'Let the right parenthesis pop back', '弹出的运算符进入后缀，左括号本身只丢弃、不输出。', 'Popped operators enter the suffix; the left parenthesis itself is discarded, not emitted.'),
      step('扫描结束清空栈', 'Flush the stack after the scan'),
    ),
    conditions: list(
      ['只接受非负整数、+ − * / 与圆括号；空格可任意出现。', '不支持一元负号和隐式乘法，遇到非法字符或括号不匹配必须报错。', '每个 token 至多入栈、出栈一次，时间与空间均为 O(n)。'],
      ['Only non-negative integers, + − * / and parentheses are accepted; spaces may appear anywhere.', 'Unary minus and implicit multiplication are rejected; invalid characters or unbalanced parentheses must report an error.', 'Every token is pushed and popped at most once, so time and space are O(n).'],
    ),
  },

  'postfix-eval': {
    intro: text(
      '后缀表达式把运算符放在两个操作数之后，因此扫描到一个运算符时，它要用的两个值已经算好并保存在操作数栈里。求值只需从左到右压数字、弹两个值、算完压回结果，不需要括号，也不需要优先级表。关键顺序是第一次弹出右操作数、第二次弹出左操作数，否则减法和除法会算反。',
      'A postfix expression places an operator after its two operands, so when the scanner reaches an operator, both values it needs are already computed and waiting on the operand stack. Evaluation only pushes numbers, pops two values, computes, and pushes the result back; it needs neither parentheses nor a precedence table. The critical order is to pop the right operand first and the left operand second, otherwise subtraction and division reverse their operands.',
    ),
    definition: text(
      '后缀求值维护一个操作数栈：数字转换为整数后压栈；遇到运算符时要求栈中至少有两个值，先弹出 right、再弹出 left，按 left op right 计算并把结果压回；扫描结束后栈中必须恰好剩下一个值。',
      'Postfix evaluation maintains an operand stack: numbers are converted to integers and pushed; an operator requires at least two values, pops right first and left second, computes left op right and pushes the result back; exactly one value must remain after the scan.',
    ),
    ...algorithm(
      step('切分后缀 token', 'Tokenise the postfix expression', '按空格切分，多位整数保持为一个整体。', 'Split on spaces and keep multi-digit integers whole.'),
      step('数字压入操作数栈', 'Push numbers onto the operand stack'),
      step('运算符先检查两个操作数', 'Check for two operands before applying an operator'),
      step('先弹右、再弹左', 'Pop right, then left', '顺序反过来会把 a − b 算成 b − a。', 'Reversing the order turns a − b into b − a.'),
      step('按左 op 右计算并压回', 'Compute left op right and push it back', '除法使用整数除法，并向零截断，与 C/C++ 和课程 Trace 一致。', 'Division is integer division truncated toward zero, matching C/C++ and the course trace.'),
      step('结束检查唯一结果', 'Require exactly one result at the end', '多于一个说明操作数过多，少于一个说明操作数不足。', 'More than one means too many operands; none means too few.'),
    ),
    conditions: list(
      ['只接受非负整数与 + − * /，token 之间用空格分隔。', '每个运算符要求栈中至少有两个值；除数为零必须报错。', '结束后栈中恰好一个值；时间与空间均为 O(n)。'],
      ['Only non-negative integers and + − * / are accepted, separated by spaces.', 'Every operator requires at least two values on the stack; division by zero must report an error.', 'Exactly one value must remain at the end; time and space are O(n).'],
    ),
  },

  seqlist: {
    intro: text(
      '需要按位置快速访问、且元素数量相对稳定时，顺序表把有效元素连续存放在一段固定槽位中，下标访问是 O(1)。代价是中间插入/删除必须搬移后续元素，最坏 O(n)；固定容量还会在装满后拒绝插入。它适合理解“连续存储”与“搬移成本”。',
      'When positional access must be fast and the element count is relatively stable, a sequential list stores active elements contiguously in a fixed block of slots, giving O(1) indexing. The cost is that middle insertion/deletion must shift later elements, O(n) in the worst case; a fixed capacity also rejects insertion when full. It is the canonical model of contiguous storage and shifting costs.',
    ),
    definition: text(
      '顺序表是用一段连续存储单元依次存放线性表元素的存储结构；逻辑相邻的元素在物理位置上也相邻，支持按下标随机访问。',
      'A sequential list stores linear-list elements in a contiguous block of storage; logically adjacent elements are physically adjacent, enabling random access by index.',
    ),
    ...operations(
      step('按下标访问', 'Access by index'),
      step('按值查找', 'Search by value'),
      step('指定位置插入', 'Insert at an index', '从后往前搬移，避免覆盖尚未移动的元素。', 'Shift from back to front so unread elements are not overwritten.'),
      step('指定位置删除', 'Delete at an index', '从前往后搬移，最后清空尾部旧副本。', 'Shift from front to back, then clear the stale tail copy.'),
      step('遍历有效元素', 'Traverse active elements'),
    ),
    conditions: list(
      ['下标访问要求 0 ≤ i < length。', '插入要求 length < capacity。', '固定容量实现不讨论动态扩容的摊还成本。'],
      ['Index access requires 0 ≤ i < length.', 'Insertion requires length < capacity.', 'This fixed-capacity implementation does not assume amortised dynamic resizing.'],
    ),
  },

  linked: {
    intro: text(
      '顺序表的中间插入要搬移大量元素。单链表让每个节点保存一个值和一条 next 引用，插入/删除只需改常数条指针；代价是不能随机访问，按位置或按值查找都要从头走 O(n)，并且每个节点多保存一条引用。它适合频繁在已知位置改链的场景。',
      'Middle insertion in a sequential list shifts many elements. A singly linked list stores a value and a next reference per node, so insertion/deletion changes only a constant number of links. The cost is no random access: search by position or value walks from the head in O(n), and every node carries an extra reference. It suits frequent relinking at known positions.',
    ),
    definition: text(
      '单链表是由节点组成的线性结构，每个节点包含数据域和一条指向后继的 next 指针；最后一个节点的 next 为空。',
      'A singly linked list is a linear structure of nodes, each containing a data field and a next pointer to its successor; the last node’s next is null.',
    ),
    ...operations(
      step('创建节点', 'Create a node'),
      step('查找前驱', 'Find the predecessor'),
      step('插入节点', 'Insert a node', '先让新节点指向原后继，再改前驱的 next。', 'Point the new node at the old successor first, then relink the predecessor.'),
      step('删除节点', 'Delete a node', '让前驱越过目标节点，再释放目标。', 'Let the predecessor skip the target, then release the target.'),
      step('遍历链表', 'Traverse the list'),
    ),
    conditions: list(
      ['只能沿 next 单向遍历。', '插入/删除通常需要先找到前驱，按位置操作最坏 O(n)。', '空表 head 为空；按值查找最坏 O(n)。'],
      ['Traversal is one-way along next.', 'Insertion/deletion usually needs the predecessor first; positional work is O(n) worst case.', 'An empty list has a null head; search by value is O(n) worst case.'],
    ),
  },

  'static-linked-list': {
    intro: text(
      '不能随意申请结点、又需要频繁插入删除时，可以把链式关系塞回一段固定数组：每个单元存 data 和一个 cur 下标，下标代替指针。逻辑顺序由 cur 决定，物理行号只表示存放位置；再用一条空闲链复用被删除的单元。难点不是“把链表画进数组”，而是同时维护有效链、空闲链和不重叠的游标约定。',
      'When nodes cannot be allocated freely but insertion and deletion must stay cheap, the links can live inside a fixed array: each cell stores data and a cur index, and indices replace pointers. Cursors define logical order while row numbers only locate storage; a free chain recycles deleted cells. The difficulty is maintaining the live chain, the free chain and a non-overlapping cursor convention at the same time.',
    ),
    definition: text(
      '静态链表用数组单元保存结点，每个结点含 data 与 cur；cur 保存后继在数组中的下标（或空游标），并用独立的 head/freeHead 分别指向逻辑链与空闲链。',
      'A static linked list stores nodes in array cells, each with data and cur; cur holds the successor’s array index (or a null cursor), and separate head/freeHead cursors start the live and free chains.',
    ),
    ...operations(
      step('初始化有效链与空闲链', 'Initialise live and free chains', '初始值按逻辑顺序放在数组前缀，剩余单元用 cur 串成空闲链。', 'Initial values occupy the array prefix in logical order; remaining cells form the free chain through cur.'),
      step('申请空闲结点', 'Allocate a free cell', '先从 freeHead 借出首单元，再让 freeHead 后移。', 'Borrow the first cell from freeHead, then advance freeHead.'),
      step('按游标插入', 'Insert by cursor', '先让新结点接住原后继，再改前驱的 cur 或 head。', 'Point the new cell at the old successor first, then change the predecessor’s cur or head.'),
      step('按游标删除', 'Delete by cursor', '从逻辑链摘下目标，再把它接到空闲链头部。', 'Unlink the target from the live chain, then push it onto the free-chain head.'),
      step('按 cur 遍历', 'Traverse by cur'),
    ),
    conditions: list(
      ['插入位置满足 1 ≤ position ≤ length+1；删除位置满足 1 ≤ position ≤ length。', 'freeHead 为空表示数组已满，插入必须拒绝。', '空游标不能与“下标 0 是头结点”的约定混用；有效链与空闲链不得重叠。'],
      ['Insertion requires 1 ≤ position ≤ length+1; deletion requires 1 ≤ position ≤ length.', 'A null freeHead means the array is full and insertion must be rejected.', 'A null cursor must not be mixed with the convention that index 0 is a header; the live and free chains must stay disjoint.'],
    ),
  },

  'polynomial-add': {
    intro: text(
      '稀疏多项式只有少数非零项，若按次数逐项存数组会浪费大量零系数。把每个非零项做成“系数 + 指数”结点，并按指数降序串成链表，就可以只保存有效项。两个这样的有序链相加时，用两个指针同步扫描：指数相同就合并系数，指数不同就取较大者；系数和为零的项不进入结果。整个过程 O(m+n)，且不破坏输入链。',
      'A sparse polynomial has few nonzero terms; storing every degree in an array wastes space on zeros. Represent each nonzero term as a coefficient/exponent node and chain them in descending exponent order. To add two such ordered chains, scan with two cursors: equal exponents merge coefficients, unequal exponents take the larger one, and a zero coefficient sum creates no result node. The merge is O(m+n) and leaves both inputs intact.',
    ),
    definition: text(
      '一元多项式链表按指数严格降序保存非零项；每项含系数 coef 与指数 exp。相加即对两条有序链做双指针归并，生成一条新的有序结果链。',
      'A univariate polynomial chain stores nonzero terms in strictly descending exponent order; each term has a coefficient and an exponent. Addition is a two-cursor merge of two ordered chains into a new ordered result chain.',
    ),
    ...algorithm(
      step('初始化两个指针与结果链', 'Initialise two cursors and the result'),
      step('比较当前指数', 'Compare current exponents', '指数大者先进入结果；相等时合并系数。', 'The larger exponent enters the result first; equal exponents merge coefficients.'),
      step('处理相等指数', 'Handle equal exponents', '系数和为零时不创建结点；否则新建结点并同时后移两个指针。', 'A zero sum creates no node; otherwise create one node and advance both cursors.'),
      step('取较大指数项', 'Take the larger-exponent term', '只后移被取走那一侧的指针。', 'Advance only the cursor whose term was taken.'),
      step('追加剩余段', 'Append the remaining tail', '一侧耗尽后，另一侧已经有序，可整段接入结果。', 'Once one side is exhausted, the other side is already ordered and can be appended as a segment.'),
      step('返回结果链', 'Return the result chain'),
    ),
    conditions: list(
      ['每个多项式的指数必须非负、互不重复且严格降序；本课不自动重排非法输入。', '零系数项不应出现在稀疏链中；系数相加为零时结果也不保留该指数。', '输入链只读，结果链由新结点组成；m、n 分别为两个多项式的项数，时间 O(m+n)。'],
      ['Exponents must be non-negative, unique and strictly descending; invalid order is rejected rather than silently sorted.', 'Zero coefficients are not stored; a zero coefficient sum also leaves no result term.', 'Inputs are read-only and the result uses new nodes; with m and n terms, time is O(m+n).'],
    ),
  },

  doubly: {
    intro: text(
      '单链表只能沿 next 前进，删除时还要先找前驱。双向链表给每个节点再加一条 prev 引用，使“已知节点”的插入和删除可以 O(1) 完成，也能从尾部反向遍历。代价是每个节点多一条指针，且每次改链都要同时维护两个方向。',
      'A singly linked list moves only along next and must find a predecessor before deletion. A doubly linked list adds a prev reference to each node, so insertion/deletion at a known node is O(1) and traversal can run backwards from the tail. The cost is one extra pointer per node and the need to maintain both directions on every relink.',
    ),
    definition: text(
      '双向链表是每个节点同时保存前驱 prev 和后继 next 指针的线性链表，支持从两端遍历以及在已知节点处 O(1) 改链。',
      'A doubly linked list is a linear list whose nodes store both a prev and a next pointer, supporting traversal from either end and O(1) relinking at a known node.',
    ),
    ...operations(
      step('头部插入', 'Insert at the head'),
      step('尾部插入', 'Insert at the tail'),
      step('中间插入', 'Insert in the middle', '先接好新节点的 prev/next，再改前驱和后继。', 'Wire the new node’s prev/next first, then update its neighbours.'),
      step('正向遍历', 'Traverse forward'),
      step('反向遍历', 'Traverse backward'),
      step('删除节点', 'Delete a node', '前驱的 next 与后继的 prev 同时越过目标。', 'Both the predecessor’s next and the successor’s prev must skip the target.'),
      step('删除头节点或尾节点', 'Delete the head or tail', '空表直接结束；否则调用统一的摘除逻辑修正 head/tail 与相邻链接。', 'An empty list ends immediately; otherwise the shared detach logic repairs head/tail and the neighbouring links.'),
    ),
    conditions: list(
      ['每个节点必须同时维护 prev 和 next。', '按值查找仍需 O(n)；只有已持有节点引用时局部改链才是 O(1)。', '空表 head 与 tail 均为空，删除头尾节点会直接结束。'],
      ['Every node must maintain both prev and next.', 'Search by value is still O(n); O(1) relinking requires an existing node reference.', 'An empty list has null head and tail, so deleting either endpoint ends immediately.'],
    ),
  },

  circular: {
    intro: text(
      '有些任务需要循环访问，例如轮转调度和约瑟夫环。循环单链表让尾节点的 next 指回 head，从任意位置出发都能绕一圈回到起点。它省掉了“到尾就停”的判断，但遍历必须显式检测是否回到 head，否则会无限循环。',
      'Some tasks need cyclic access, such as round-robin scheduling and the Josephus problem. A circular singly linked list makes the tail’s next point back to the head, so traversal from any node eventually returns to the start. It removes the “stop at null” check, but traversal must explicitly detect returning to the head or it loops forever.',
    ),
    definition: text(
      '循环单链表是尾节点的 next 指回头节点的单链表；从任一节点出发沿 next 最终回到起点，空表时 head 与 tail 为空。',
      'A circular singly linked list is a singly linked list whose tail’s next points back to the head; following next from any node eventually returns to the start, and an empty list has null head and tail.',
    ),
    ...operations(
      step('头部插入', 'Insert at the head'),
      step('尾部插入', 'Insert at the tail', 'tail.next 指新节点，新节点 next 指回 head。', 'Set tail.next to the new node and the new node’s next back to the head.'),
      step('遍历一圈', 'Traverse one full cycle', '再次回到 head 时必须主动停止。', 'Stop explicitly when traversal returns to the head.'),
      step('按值查找', 'Search by value'),
      step('删除节点', 'Delete a node'),
      step('删除头节点或尾节点', 'Delete the head or tail', '空表直接结束；否则统一摘除并保持 tail.next 指回 head。', 'An empty list ends immediately; otherwise the shared detach keeps tail.next pointing back to head.'),
    ),
    conditions: list(
      ['遍历必须检测“回到 head”，不能等待 next 变空。', '空表 head=tail=null；单节点时该节点指向自己。', '单链表删除尾节点仍需 O(n) 找前驱，即使维护了 tail。'],
      ['Traversal must detect returning to the head; it cannot wait for a null next.', 'An empty list has null head and tail; a one-node list points to itself.', 'Deleting the tail still needs O(n) to find the predecessor, even with a tail pointer.'],
    ),
  },

  inorder: {
    intro: text(
      '树的节点不是连续数组，不能靠下标直接访问。遍历需要一套固定的访问顺序，才能把树形结构线性化。中序遍历先左、再根、再右，对 BST 恰好得到升序序列；前序适合复制/序列化，后序适合释放/自底向上计算。递归实现最直观，但调用栈深度是 O(h)。',
      'Tree nodes are not a contiguous array and cannot be indexed directly. Traversal needs a fixed visit order to linearise the tree. In-order visits left, then root, then right, which yields ascending order for a BST; pre-order suits copying/serialisation, post-order suits freeing or bottom-up computation. Recursion is the clearest implementation, but call-stack depth is O(h).',
    ),
    definition: text(
      '二叉树的中序遍历按“左子树 → 根 → 右子树”的次序访问每个节点；对二叉搜索树，中序序列单调不减。',
      'In-order traversal of a binary tree visits every node in the order “left subtree → root → right subtree”; for a binary search tree the in-order sequence is non-decreasing.',
    ),
    ...algorithm(
      step('进入当前节点', 'Enter the current node'),
      step('遍历左子树', 'Traverse the left subtree'),
      step('访问根节点', 'Visit the root', '中序在左子树返回后才访问根。', 'In-order visits the root only after the left subtree returns.'),
      step('遍历右子树', 'Traverse the right subtree'),
      step('返回上一层', 'Return to the caller'),
    ),
    conditions: list(
      ['空树返回空序列。', '递归/显式栈的额外空间为 O(h)，h 为树高。', '对 BST 使用中序才能得到有序序列；前序/后序不具备该性质。'],
      ['An empty tree yields an empty sequence.', 'Recursion or an explicit stack uses O(h) extra space, where h is the tree height.', 'Only in-order yields a sorted sequence for a BST; pre-order and post-order do not.'],
    ),
  },

  'threaded-inorder': {
    intro: text(
      '普通二叉树的 n 个结点有 n+1 个空指针，递归遍历还要额外付出 O(h) 的调用栈。线索二叉树把这些空指针原地改造成指向前驱/后继的线索，并用 ltag、rtag 区分“真实孩子”和“线索”，于是中序遍历可以只靠当前指针走完全树。代价是插入、删除结点时必须同步维护线索。',
      'A binary tree with n nodes has n+1 null pointers, and recursive traversal still pays O(h) call-stack space. A threaded binary tree rewrites those null pointers in place as predecessor/successor threads and uses ltag/rtag to distinguish a real child from a thread, so an in-order traversal can walk the whole tree with only a current pointer. The cost is that insertion and deletion must maintain the threads.',
    ),
    definition: text(
      '线索二叉树在每个结点增加 ltag、rtag 与线索字段：tag=0 表示指针指向真实孩子，tag=1 表示该指针是一条前驱或后继线索。中序线索化按中序顺序把空左指针指向前驱、空右指针指向后继。',
      'A threaded binary tree adds ltag, rtag and thread fields to every node: tag=0 means the pointer addresses a real child, tag=1 means it is a predecessor or successor thread. In-order threading fills null left pointers with predecessors and null right pointers with successors, following in-order order.',
    ),
    ...algorithm(
      step('按左、根、右递归线索化', 'Thread recursively: left, node, right'),
      step('空左指针写入前驱', 'Null left pointer becomes the predecessor', '写 left_thread 并置 ltag=1，不能覆盖真实 left。', 'Write left_thread and set ltag=1; never overwrite a real left child.'),
      step('前驱的空右指针写入后继', 'The predecessor’s null right pointer becomes the successor'),
      step('最后一个结点保留空后继', 'The last node keeps a null successor', '右线索为空，但 rtag 仍必须置 1。', 'Its right thread is null, but rtag must still be 1.'),
      step('从最左结点开始遍历', 'Start traversal at the left-most node'),
      step('rtag=1 沿线索，rtag=0 进入右子树最左', 'rtag=1 follows a thread; rtag=0 enters the right subtree and goes left-most'),
    ),
    conditions: list(
      ['共有 n+1 个空指针可被线索利用；本例 5 个结点有 6 个空指针。', '线索化时间 O(n)，递归栈 O(h)；线索遍历时间 O(n)、额外空间 O(1)。', 'tag 必须与指针分开保存，否则无法区分真实孩子和线索。'],
      ['There are n+1 null pointers available for threads; this five-node example has six.', 'Threading costs O(n) time and O(h) stack; threaded traversal costs O(n) time and O(1) extra space.', 'Tags must be stored separately from pointers, otherwise a real child cannot be distinguished from a thread.'],
    ),
  },

  bst: {
    intro: text(
      '在无序数组中查找要 O(n)。二叉搜索树利用“左小右大”把每次比较变成一次分支，平均查找 O(log n)。代价是树形依赖插入顺序：按升序插入会退化成链，最坏 O(n)。删除还要处理 0/1/2 个孩子的不同重连情况。',
      'Searching an unordered array costs O(n). A binary search tree uses “smaller on the left, larger on the right” to turn each comparison into a branch, giving O(log n) average search. The cost is that shape depends on insertion order: ascending insertion degenerates into a chain with O(n) worst case. Deletion must also handle the 0/1/2-child relinking cases.',
    ),
    definition: text(
      '二叉搜索树是满足有序性质的二叉树：任一节点的左子树键小于该节点，右子树键大于该节点（重复键需另行约定策略）。',
      'A binary search tree is a binary tree with the ordering property: every key in a node’s left subtree is smaller than the node’s key, and every key in its right subtree is larger (duplicate keys need an explicit policy).',
    ),
    ...operations(
      step('查找键', 'Search for a key'),
      step('插入叶子', 'Insert a leaf'),
      step('删除叶子节点', 'Delete a leaf'),
      step('删除单孩子节点', 'Delete a node with one child'),
      step('删除双孩子节点', 'Delete a node with two children', '用右子树最小节点（中序后继）替换，再删除后继。', 'Replace with the minimum of the right subtree (in-order successor), then delete the successor.'),
    ),
    conditions: list(
      ['所有键必须可比较，并约定重复键策略。', '树高决定复杂度：平均 O(log n)，退化成链时 O(n)。', '删除双孩子节点通常用中序后继或前驱替换。'],
      ['All keys must be comparable, with an explicit duplicate policy.', 'Tree height drives complexity: O(log n) average, O(n) when degenerate.', 'Deleting a two-child node usually replaces it with the in-order successor or predecessor.'],
    ),
  },

  avl: {
    intro: text(
      '普通 BST 的平均 O(log n) 依赖树形平衡，最坏会退化成 O(n)。AVL 在每个节点记录高度，要求左右子树高度差不超过 1；插入/删除后沿父链更新，必要时用 LL/RR/LR/RL 旋转恢复平衡。它把最坏查找也压到 O(log n)，代价是维护高度和旋转的额外常数。',
      'The average O(log n) of a plain BST depends on a balanced shape and can degrade to O(n). AVL stores a height at each node and requires the left/right height difference to stay at most 1; after insertion/deletion it updates along the parent chain and applies LL/RR/LR/RL rotations when needed. It pushes even the worst-case search to O(log n), at the cost of height maintenance and rotation overhead.',
    ),
    definition: text(
      'AVL 树是带平衡条件的二叉搜索树：每个节点的左右子树高度差（平衡因子）属于 {−1, 0, 1}，失衡时通过旋转恢复。',
      'An AVL tree is a binary search tree with a balance condition: every node’s left/right subtree height difference (balance factor) lies in {−1, 0, 1}, restored by rotations when violated.',
    ),
    ...operations(
      step('BST 查找', 'BST search'),
      step('插入或删除', 'Insert or delete'),
      step('更新高度与 BF', 'Update height and balance factor'),
      step('单旋 LL / RR', 'Single rotation LL / RR', '外侧失衡用一次旋转恢复。', 'An outside imbalance is fixed by one rotation.'),
      step('双旋 LR / RL', 'Double rotation LR / RL', '内侧失衡需要先转孩子，再转失衡节点。', 'An inside imbalance first rotates the child, then the unbalanced node.'),
      step('沿父链回溯', 'Walk back up the parent chain'),
    ),
    conditions: list(
      ['每个节点的平衡因子必须保持在 −1、0、1。', '插入/删除后要沿父链更新高度，可能连续旋转。', '旋转必须保持 BST 的中序顺序。'],
      ['Every node’s balance factor must stay in −1, 0, 1.', 'After insertion/deletion, update heights up the parent chain and possibly rotate several times.', 'Rotations must preserve the BST in-order sequence.'],
    ),
  },

  btree: {
    intro: text(
      '二叉搜索树每个节点只存一个关键字，树高约为 log₂ n；数据库按页读取，真正昂贵的是访问节点次数。B 树让一个节点存放多个有序关键字，用 k 个关键字分出 k+1 个子树，把分支因子提高到 m，树高降到约 log_m n。所有叶子等深保证查找路径长度稳定；插入通过“下降前分裂满节点”维持这一平衡。代价是节点内比较、分裂搬移和未装满的空间。',
      'A binary search tree stores one key per node and has height about log₂ n; databases read whole pages, so node visits dominate. A B-tree stores several ordered keys per node and uses k keys to separate k+1 subtrees, raising the branching factor to m and lowering height to about log_m n. Equal leaf depth keeps every search path stable; insertion preserves balance by splitting full nodes before descending. The costs are in-node comparisons, split movement and partially filled nodes.',
    ),
    definition: text(
      'm 阶 B 树是一棵多路平衡查找树：每个节点最多 m 个孩子、m−1 个关键字；含 k 个关键字的内节点恰有 k+1 个孩子，关键字严格递增且孩子按区间归属；除根外每个节点至少 ceil(m/2)−1 个关键字；所有叶子在同一深度。',
      'An order-m B-tree is a multiway balanced search tree: each node has at most m children and m−1 keys; an internal node with k keys has exactly k+1 children, keys strictly increase and children own disjoint intervals; every non-root node has at least ceil(m/2)−1 keys; all leaves share one depth.',
    ),
    ...operations(
      step('查找：进入当前节点', 'Search: enter the current node'),
      step('比较节点内关键字', 'Compare keys inside the node'),
      step('命中则结束；否则按区间选孩子', 'Hit ends; otherwise choose a child by interval', '命中直接返回；未命中时目标只属于一个区间，选择唯一孩子。', 'A hit returns immediately; otherwise the target belongs to exactly one interval, so exactly one child is chosen.'),
      step('进入下一层，回到比较', 'Descend and compare again', '沿真实孩子引用下降一层，在新节点内重新比较，直到命中或到达叶子；这一阶段会回到“比较节点内关键字”。', 'Follow a real child reference down one level and compare again inside the new node, until a hit or a leaf; this stage loops back to “compare keys inside the node”.'),
      step('插入：只读定位并拒绝重复', 'Insert: locate read-only and reject duplicates', '先确认关键字不存在；重复键明确拒绝，树保持不变。', 'Confirm absence first; a duplicate is explicitly rejected with the tree unchanged.'),
      step('检查将进入的满节点', 'Check the full node before entering', '根满先分裂；此后每个满孩子都在下降前分裂。', 'A full root splits first; every full child splits before descending.'),
      step('分裂：中间关键字上升', 'Split: the median rises', '满节点 3 键分成左 1 键、上升 1 键、右 1 键，孩子随关键字一起分配。', 'A full three-key node becomes one key on the left, one promoted key and one on the right; children move with their keys.'),
      step('选择子树继续下降', 'Choose the subtree and continue'),
      step('到达叶子插入', 'Insert at the leaf', '目标叶子在下降前已确保有空格，写入后关键字仍有序。', 'The target leaf is guaranteed to have room before descent; after writing, keys stay ordered.'),
      step('结束：恢复全部约束', 'Finish: restore every invariant', '检查关键字有序、区间对应、非根下限和叶子同深。', 'Check ordered keys, matching intervals, the non-root minimum and equal leaf depth.'),
    ),
    conditions: list(
      ['本课固定 m=4：最多 4 个孩子、3 个关键字；非根至少 1 个关键字，根非叶时至少 2 个孩子。', '树高 h=O(log_m n)；查找与插入都只访问 O(log_m n) 个节点，层内比较另计。', '节点容量越大树越矮，但单页比较与数据量增加；真实 m 由页大小和关键字大小决定。'],
      ['This course fixes m=4: at most four children and three keys; every non-root node keeps at least one key, and a non-leaf root has at least two children.', 'Height is h=O(log_m n); search and insertion visit O(log_m n) nodes, with in-node comparisons counted separately.', 'Larger node capacity lowers height but increases per-page comparisons and payload; real m follows page and key sizes.'],
    ),
  },

  heap: {
    intro: text(
      '需要反复取最大值时，普通数组每次扫描要 O(n)，维护完全有序数组又要为插入和删除搬移大量元素。最大堆用完全二叉树形状把最大值放在根，插入/删除堆顶只沿一条根叶路径走 O(log n)，建堆可在线性时间完成。代价是堆只保证父子偏序，不保证整体有序，也不能高效查找任意元素。',
      'When the maximum must be extracted repeatedly, a plain array costs O(n) per scan, while keeping a fully sorted array requires moving many elements on every update. A max-heap uses a complete-tree shape to keep the maximum at the root; insertion and delete-max walk one root-to-leaf path in O(log n), and heap construction is linear. The cost is that a heap only guarantees parent-child order, not total order, and arbitrary search is inefficient.',
    ),
    definition: text(
      '最大堆是一棵完全二叉树，满足父节点的值不小于任一孩子；通常用从 0 开始下标的数组存储，孩子为 2i+1 和 2i+2。',
      'A max-heap is a complete binary tree in which every parent is no smaller than either child; it is usually stored in a 0-indexed array, with children at 2i+1 and 2i+2.',
    ),
    ...operations(
      step('自底向上建堆', 'Build the heap bottom-up', '从最后一个非叶节点向前逐个下沉。', 'Sift down from the last non-leaf node back to the root.'),
      step('下沉 sift-down', 'Sift down'),
      step('插入上浮', 'Insert and sift up'),
      step('删除堆顶', 'Delete the maximum'),
      step('原地堆排序', 'In-place heap sort'),
    ),
    conditions: list(
      ['最大堆要求父节点不小于孩子；最小堆方向相反。', '数组下标从 0 开始时，孩子为 2i+1、2i+2，父为 (i−1)/2。', '堆排序原地但不稳定；堆不保证整体有序。'],
      ['A max-heap requires parents to be no smaller than children; a min-heap reverses the order.', 'With 0-based arrays, children are 2i+1 and 2i+2; the parent is (i−1)/2.', 'Heap sort is in-place but unstable; a heap does not guarantee total order.'],
    ),
  },

  huffman: {
    intro: text(
      '定长编码给每个字符相同位数，频率高的字符也被迫用长码。哈夫曼编码按频率构造最优前缀码：频率越高，根到叶的路径越短；所有字符只放在叶子上，保证没有一个码字是另一个的前缀。构造过程只需反复合并两个最小权值，不需要枚举所有树形。',
      'Fixed-length coding gives every character the same number of bits, forcing frequent characters to use long codes too. Huffman coding builds an optimal prefix code from frequencies: more frequent characters get shorter root-to-leaf paths, and all characters sit at leaves so no codeword is a prefix of another. Construction only repeatedly merges the two smallest weights; it never enumerates all tree shapes.',
    ),
    definition: text(
      '哈夫曼编码是一种按字符频率构造最优前缀码的贪心方法：频率越高的字符码字越短，所有字符位于叶子，任一码字都不是另一码字的前缀。',
      'Huffman coding is a greedy method that builds an optimal prefix code from character frequencies: more frequent characters receive shorter codewords, all characters are leaves, and no codeword is a prefix of another.',
    ),
    ...algorithm(
      step('建立叶子森林', 'Create the leaf forest'),
      step('取两个最小权值', 'Take the two smallest weights'),
      step('合并父节点', 'Merge under a parent', '父节点权值等于两个孩子权值之和。', 'The parent weight equals the sum of its two children.'),
      step('父节点放回森林', 'Return the parent to the forest'),
      step('重复到单根', 'Repeat until one root'),
      step('生成 0/1 编码', 'Generate 0/1 codewords'),
    ),
    conditions: list(
      ['字符频率必须为非负数，且至少有两个不同符号需要合并。', '单符号文本需要特判，否则没有“两个最小权值”。', '频率相同时最优树不唯一；编码必须保持前缀性质。'],
      ['Character frequencies must be non-negative, with at least two distinct symbols to merge.', 'Single-symbol input needs a special case; there are no “two smallest weights”.', 'Equal frequencies can yield multiple optimal trees; the code must remain prefix-free.'],
    ),
  },

  bfs: {
    intro: text(
      '在无权图中，沿一条路一直深入不一定先得到最近的目标；深度优先可能绕很远。广度优先搜索用队列按层扩展，先处理所有距离为 1 的节点，再处理距离为 2 的节点，因此首次到达即最短（边数最少）。代价是需要 O(V) 的队列和访问标记。',
      'In an unweighted graph, following one path deeply does not necessarily find the nearest target; depth-first search may take a long detour. Breadth-first search expands by layers with a queue: all vertices at distance 1 are processed before distance 2, so the first arrival is a shortest path in edge count. The cost is O(V) queue and visitation storage.',
    ),
    definition: text(
      '广度优先搜索从源点出发，按到源点的边数层次扩展；使用 FIFO 队列保存待处理顶点，并用 discovered/visited 标记避免重复。',
      'Breadth-first search starts at a source and expands in layers by edge count; it uses a FIFO queue for pending vertices and discovered/visited marks to avoid duplicates.',
    ),
    ...algorithm(
      step('起点入队', 'Enqueue the source'),
      step('出队并访问', 'Dequeue and visit'),
      step('发现邻居入队', 'Discover and enqueue neighbours', 'discovered 表示已入队，visited 表示已处理。', 'Discovered means enqueued; visited means processed.'),
      step('跳过已发现节点', 'Skip already discovered vertices'),
      step('队列空则结束', 'Finish when the queue is empty'),
    ),
    conditions: list(
      ['只适用于无权图或所有边权相同的图。', '必须区分 discovered（已入队）与 visited（已处理）。', '邻接表实现时间为 O(V+E)，空间 O(V)。'],
      ['Only for unweighted graphs or graphs with equal edge weights.', 'Distinguish discovered (enqueued) from visited (processed).', 'Adjacency-list implementation runs in O(V+E) time and O(V) space.'],
    ),
  },

  dfs: {
    intro: text(
      '有些问题只关心“能否到达”或需要回溯探索所有分支，例如连通性、环检测和拓扑排序。深度优先搜索用栈沿一条路走到底，再回退到上一个岔路；它不需要按层保存所有节点，但首次到达不保证最短路径，递归深度最坏 O(V)。',
      'Some problems only need reachability or must explore every branch with backtracking: connectivity, cycle detection, topological ordering. Depth-first search uses a stack to go deep along one path, then backtracks to the last fork. It does not store all vertices by layer, but first arrival is not guaranteed shortest, and recursion depth can reach O(V).',
    ),
    definition: text(
      '深度优先搜索从源点出发，优先沿最新发现的顶点深入；使用 LIFO 栈（或递归调用栈），走不通时回退到上一个分支。',
      'Depth-first search starts at a source and goes deep along the most recently discovered vertex; it uses a LIFO stack (or the call stack) and backtracks to the previous branch when stuck.',
    ),
    ...algorithm(
      step('起点入栈', 'Push the source'),
      step('弹出并访问', 'Pop and visit'),
      step('发现邻居压栈', 'Discover and push neighbours', 'LIFO 决定下一步深入哪个邻居。', 'LIFO determines which neighbour is explored next.'),
      step('跳过已发现节点', 'Skip already discovered vertices'),
      step('栈空回溯结束', 'Finish when the stack is empty'),
    ),
    conditions: list(
      ['适用于有向图和无向图。', '首次到达不保证最短路径；求最短路径应使用 BFS/Dijkstra。', '递归实现深度最坏 O(V)，可能栈溢出；显式栈可缓解。'],
      ['Works on directed and undirected graphs.', 'First arrival does not guarantee a shortest path; use BFS/Dijkstra for that.', 'Recursive depth can reach O(V) and overflow; an explicit stack avoids that.'],
    ),
  },

  dijkstra: {
    intro: text(
      'BFS 只能处理边权相同的最短路径；一旦边权不同，“步数少”不等于“总代价小”。Dijkstra 维护起点到各点的当前最短距离，每次取出距离最小的未确定节点并松弛它的出边。非负边权保证这个节点一旦确定就不会再被更短的路径改写；负权边会破坏这一前提。',
      'BFS only handles shortest paths when all edge weights are equal; once weights differ, fewer edges no longer means lower total cost. Dijkstra maintains current distance estimates, repeatedly extracts the unsettled vertex with the smallest distance and relaxes its outgoing edges. Non-negative weights guarantee that once settled, a vertex cannot later be improved; negative edges break that premise.',
    ),
    definition: text(
      'Dijkstra 算法求非负边权图的单源最短路径：维护距离估计，重复取出未确定顶点中距离最小者，并对其出边执行松弛。',
      'Dijkstra’s algorithm solves single-source shortest paths on graphs with non-negative edge weights: it maintains distance estimates, repeatedly extracts the unsettled vertex with the smallest estimate, and relaxes its outgoing edges.',
    ),
    ...algorithm(
      step('初始化距离表', 'Initialise the distance table'),
      step('取最小候选', 'Extract the minimum candidate'),
      step('确定该节点', 'Settle the vertex', '非负权保证此后它的距离不会更短。', 'Non-negative weights guarantee its distance cannot improve later.'),
      step('松弛出边', 'Relax outgoing edges', '只有更小的候选距离才写回。', 'Write back only when the candidate distance is smaller.'),
      step('重复至堆空', 'Repeat until the heap is empty'),
      step('回溯前驱路径', 'Recover the path via predecessors'),
    ),
    conditions: list(
      ['所有边权必须非负；负权边会使“已确定”失效。', '只求单源最短路径；全源问题可用 Floyd-Warshall 或多次运行。', '邻接表 + 最小堆为 O((V+E) log V)。'],
      ['All edge weights must be non-negative; negative edges invalidate settling.', 'Solves single-source shortest paths; all-pairs needs Floyd-Warshall or repeated runs.', 'Adjacency list plus a min-heap runs in O((V+E) log V).'],
    ),
    diagram: 'dijkstra',
  },

  'floyd-warshall': {
    intro: text(
      '如果需要对所有点对求最短路径，从每个起点各跑一次 Dijkstra 在稠密图上并不划算。Floyd-Warshall 用动态规划逐个开放中转点 k，检查 i→k→j 是否比当前 i→j 更短。它实现简单、支持负权边，但 O(V³) 时间和 O(V²) 空间只适合小规模或稠密图。',
      'When all-pairs shortest paths are needed, running Dijkstra from every source is not attractive on dense graphs. Floyd-Warshall uses dynamic programming, opening one intermediate vertex k at a time and checking whether i→k→j is shorter than the current i→j. It is simple and supports negative edges, but O(V³) time and O(V²) space limit it to small or dense graphs.',
    ),
    definition: text(
      'Floyd-Warshall 算法用动态规划求所有点对最短路径：依次允许前 k 个顶点作为中转点，更新 dist[i][j] = min(dist[i][j], dist[i][k]+dist[k][j])。',
      'The Floyd-Warshall algorithm computes all-pairs shortest paths by dynamic programming: allowing the first k vertices as intermediates in turn and updating dist[i][j] = min(dist[i][j], dist[i][k]+dist[k][j]).',
    ),
    ...algorithm(
      step('初始化距离矩阵', 'Initialise the distance matrix'),
      step('枚举中转点 k', 'Enumerate intermediate k'),
      step('枚举起点 i', 'Enumerate source i'),
      step('枚举终点 j', 'Enumerate target j'),
      step('执行三角松弛', 'Apply the triangle relaxation', '允许负权边，但不能存在负权环。', 'Negative edges are allowed, but negative cycles are not.'),
      step('检查负权环', 'Check for negative cycles'),
    ),
    conditions: list(
      ['允许负权边，但不能存在任何负权环。', '适合稠密图或需要全源答案的小规模图。', '时间 O(V³)，空间 O(V²)。'],
      ['Negative edges are allowed, but no negative cycle may exist anywhere in the graph.', 'Best for dense graphs or small all-pairs instances.', 'O(V³) time and O(V²) space.'],
    ),
  },

  'bellman-ford': {
    intro: text(
      'Dijkstra 不能处理负权边，因为“已确定”的节点仍可能被后续负边改小。Bellman-Ford 不依赖最小值选择，而是对所有边做 V−1 轮松弛；第 r 轮最多发现经过 r 条边的最短路径。它支持负权边并能检测从起点可达的负权环，代价是 O(VE)。',
      'Dijkstra cannot handle negative edges because a “settled” vertex may still be reduced by a later negative edge. Bellman-Ford avoids minimum extraction and relaxes every edge for V−1 rounds; round r can discover shortest paths using at most r edges. It supports negative edges and detects negative cycles reachable from the source, at O(VE) cost.',
    ),
    definition: text(
      'Bellman-Ford 算法通过对所有边进行最多 V−1 轮松弛求单源最短路径，并可在第 V 轮检测从源点可达的负权环。',
      'The Bellman-Ford algorithm computes single-source shortest paths by relaxing all edges for at most V−1 rounds, and a V-th round detects negative cycles reachable from the source.',
    ),
    ...algorithm(
      step('初始化距离', 'Initialise distances'),
      step('V−1 轮全边松弛', 'Relax every edge for V−1 rounds'),
      step('整轮无更新则提前停', 'Stop early after a clean round', '整轮没有任何距离变短，说明已达不动点。', 'If no distance improves in a whole round, the fixed point is reached.'),
      step('第 V 轮检测负环', 'Detect a negative cycle in round V'),
      step('回溯前驱路径', 'Recover the path via predecessors'),
    ),
    conditions: list(
      ['允许负权边。', '若第 V 轮仍能松弛，说明存在从起点可达的负权环，最短路径无定义。', 'O(VE) 时间，适合稀疏图或含负权边的图。'],
      ['Negative edge weights are allowed.', 'If round V still relaxes an edge, a negative cycle is reachable from the source and shortest paths are undefined.', 'O(VE) time; suitable for sparse graphs or graphs with negative edges.'],
    ),
  },

  prim: {
    intro: text(
      '要从图中选出一棵连接所有顶点的最小生成树，直接枚举所有边组合会组合爆炸。Prim 从任意起点长出一棵树，每次只选连接树内外的最轻边；最小堆让“当前最轻横切边”可以快速取出。它必须使用无向图且边权可比较；邻接矩阵的 O(V²) 朴素版本适合稠密图，邻接表 + 最小堆版本也能处理稀疏图。',
      'Choosing a minimum spanning tree by enumerating edge subsets explodes combinatorially. Prim grows a tree from any start vertex and always selects the lightest edge crossing from the tree to the outside; a min-heap makes the current lightest crossing edge quick to extract. It requires an undirected graph with comparable weights; the O(V²) adjacency-matrix variant suits dense graphs, while adjacency lists plus a min-heap also handle sparse graphs.',
    ),
    definition: text(
      'Prim 算法从任一顶点开始构造最小生成树：每步选择连接树内与树外的最轻边，将新顶点及其横切边加入。',
      'Prim’s algorithm builds a minimum spanning tree from any start vertex: each step selects the lightest edge between the tree and the outside, adding the new vertex and its crossing edges.',
    ),
    ...algorithm(
      step('起点加入树', 'Add the start vertex to the tree'),
      step('横切边入堆', 'Push crossing edges into the heap'),
      step('取最轻有效边', 'Extract the lightest valid edge', '另一端已在树内的边直接丢弃。', 'Discard edges whose other endpoint is already in the tree.'),
      step('加入新顶点', 'Add the new vertex'),
      step('加入新横切边', 'Push its new crossing edges'),
      step('重复或重开森林', 'Repeat, or restart for a forest'),
    ),
    conditions: list(
      ['图必须是无向图，边权可比较。', '不连通图会得到最小生成森林，而不是一棵树。', '邻接表 + 最小堆为 O((V+E) log V)。'],
      ['The graph must be undirected with comparable edge weights.', 'A disconnected graph yields a minimum spanning forest, not a single tree.', 'Adjacency list plus a min-heap runs in O((V+E) log V).'],
    ),
  },

  kruskal: {
    intro: text(
      'Prim 需要反复维护横切边；如果边已经按权重排好，能否直接逐条接受？Kruskal 正是这种贪心策略：从最轻边开始，只要不会形成环就加入生成树。并查集让“两端是否已连通”接近常数时间。它适合稀疏图，不要求从某个起点开始。',
      'Prim repeatedly maintains crossing edges; if edges are already sorted by weight, can we simply accept them one by one? Kruskal is exactly that greedy strategy: start from the lightest edge and keep it whenever it does not create a cycle. A disjoint-set structure makes “are the endpoints already connected?” almost constant time. It suits sparse graphs and does not require a start vertex.',
    ),
    definition: text(
      'Kruskal 算法按边权升序扫描无向边，用并查集判断两端是否已连通；不形成环的边被加入最小生成树。',
      'Kruskal’s algorithm scans undirected edges in ascending weight order and uses a disjoint-set structure to test whether their endpoints are already connected; edges that do not form a cycle are added to the minimum spanning tree.',
    ),
    ...algorithm(
      step('边按权排序', 'Sort edges by weight'),
      step('初始化并查集', 'Initialise the disjoint sets'),
      step('取最小边', 'Take the lightest edge'),
      step('判断是否成环', 'Test for a cycle'),
      step('接受并合并 / 跳过', 'Accept and union, or skip', '只有两端不在同一集合时才合并。', 'Union only when the endpoints are in different sets.'),
      step('选够 V−1 条边', 'Stop after V−1 edges'),
    ),
    conditions: list(
      ['只适用于无向图。', '必须能对所有边按权重排序。', '不连通图会得到最小生成森林；并查集用路径压缩和按秩合并。'],
      ['Only for undirected graphs.', 'All edges must be sortable by weight.', 'A disconnected graph yields a minimum spanning forest; use path compression and union by rank.'],
    ),
  },

  topological: {
    intro: text(
      '当任务之间存在依赖关系时，不能任意排序；必须保证每个前置任务都排在后续任务之前。拓扑排序把入度理解为“还有多少前置未完成”，反复取出零入度任务并删除其出边。若最终输出的顶点少于 V 个，说明依赖图中存在环，任务无法全部完成。',
      'Tasks with dependencies cannot be ordered arbitrarily: every prerequisite must precede its dependants. Topological sorting treats in-degree as “how many prerequisites remain unfinished”, repeatedly extracting zero-in-degree tasks and removing their outgoing edges. If fewer than V vertices are output, the dependency graph contains a cycle and cannot be fully scheduled.',
    ),
    definition: text(
      '拓扑排序对有向无环图给出线性顺序，使每条有向边 u→v 都满足 u 排在 v 之前；通常用入度表和零入度队列实现。',
      'A topological sort produces a linear order of a directed acyclic graph such that every edge u→v places u before v; it is usually implemented with an in-degree table and a zero-in-degree queue.',
    ),
    ...algorithm(
      step('统计入度', 'Compute in-degrees'),
      step('零入度入队', 'Enqueue zero-in-degree vertices'),
      step('出队并输出', 'Dequeue and append to the order', '输出顺序就是一份合法依赖顺序。', 'The output order is one valid dependency order.'),
      step('邻居入度减一', 'Decrement neighbour in-degrees'),
      step('新零入度入队', 'Enqueue newly zero-in-degree vertices'),
      step('检查剩余顶点', 'Check for leftover vertices', '若输出少于 V 个，图中存在环。', 'If fewer than V vertices are output, the graph contains a cycle.'),
    ),
    conditions: list(
      ['图必须是有向无环图（DAG）。', '若输出顶点数少于 V，说明存在有向环。', '邻接表实现时间为 O(V+E)，空间 O(V+E)。'],
      ['The graph must be a directed acyclic graph (DAG).', 'If fewer than V vertices are output, a directed cycle exists.', 'Adjacency-list implementation runs in O(V+E) time and O(V+E) space.'],
    ),
    diagram: 'kahn',
  },

  'critical-path': {
    intro: text(
      '项目中的活动可以并行，但有些活动没有任何缓冲，一旦延迟就会拖慢总工期。关键路径法在 DAG 上先正推每个事件的最早开始 ve，再逆推最晚开始 vl；余量 l−e 为 0 的活动就是关键活动。它们串成的最长路径决定项目最短完成时间。',
      'Project activities can run in parallel, but some have no slack: any delay pushes the whole project. Critical-path analysis works on a DAG, first forward-propagating each event’s earliest time ve, then backward-propagating its latest time vl; activities with zero slack are critical. The longest chain of critical activities determines the shortest project duration.',
    ),
    definition: text(
      '关键路径法是 DAG 上的工期分析方法：正推事件最早时间 ve、逆推最晚时间 vl，余量为 0 的活动构成决定总工期的关键路径。',
      'Critical-path analysis is a duration-analysis method on a DAG: it forward-propagates earliest event times ve and backward-propagates latest event times vl; activities with zero slack form the critical path that determines total duration.',
    ),
    ...algorithm(
      step('拓扑排序', 'Topologically sort the DAG'),
      step('正推 ve', 'Propagate ve forward', 've[v] = max(ve[u] + weight(u,v))。', 've[v] = max(ve[u] + weight(u,v)).'),
      step('逆推 vl', 'Propagate vl backward', 'vl[u] = min(vl[v] − weight(u,v))。', 'vl[u] = min(vl[v] − weight(u,v)).'),
      step('计算活动 e / l', 'Compute activity e and l'),
      step('取零余量活动', 'Select zero-slack activities', '余量 l−e 为 0 的活动没有缓冲。', 'Activities with zero slack l−e have no buffer.'),
      step('汇总总工期', 'Report the total duration'),
    ),
    conditions: list(
      ['图必须是有向无环图，边权表示活动持续时间。', '通常需要一个源点和一个汇点；多源/多汇可加虚源/虚汇。', '关键路径可能不唯一；总工期等于最长路径长度。'],
      ['The graph must be a DAG; edge weights are activity durations.', 'Usually a single source and sink are assumed; add virtual source/sink for multiple ones.', 'The critical path may not be unique; total duration equals the longest path length.'],
    ),
  },

  components: {
    intro: text(
      '无向图可能分成互不连通的多块；只从一个起点搜索会漏掉其他区域。连通分量算法扫描所有未访问顶点，每发现一个就启动一次 DFS/BFS，并把这次可达闭包标记为同一分量。总时间仍是 O(V+E)，因为每条边只在端点展开时检查常数次。',
      'An undirected graph may consist of several disconnected pieces; searching from one start misses the others. A connected-components algorithm scans every unvisited vertex, starts a DFS/BFS from each newly found one, and marks that reachable closure as one component. Total time remains O(V+E), since every edge is examined a constant number of times at its endpoints.',
    ),
    definition: text(
      '无向图的连通分量是极大连通子图；从每个未访问顶点启动一次 DFS/BFS，可达闭包即一个分量。',
      'A connected component of an undirected graph is a maximal connected subgraph; starting a DFS/BFS from every unvisited vertex yields one component per reachable closure.',
    ),
    ...algorithm(
      step('扫描未访问顶点', 'Scan for an unvisited vertex'),
      step('启动 DFS / BFS', 'Start DFS / BFS'),
      step('标记整个分量', 'Mark the whole component', '同一次搜索可达的顶点共享一个分量编号。', 'Vertices reached by one search share a component id.'),
      step('分量数加一', 'Increment the component count'),
      step('重复至全部访问', 'Repeat until all vertices are visited'),
    ),
    conditions: list(
      ['只适用于无向图；有向图应求强连通分量。', 'DFS 和 BFS 都可作为分量内部的搜索方式。', '邻接表实现时间为 O(V+E)，空间 O(V+E)。'],
      ['Only for undirected graphs; directed graphs need strongly connected components.', 'Either DFS or BFS can explore a component.', 'Adjacency-list implementation runs in O(V+E) time and O(V+E) space.'],
    ),
  },

  scc: {
    intro: text(
      '有向图中“互相可达”的关系比无向连通更强：A 能到 B，不代表 B 能到 A。强连通分量把这种双向可达的极大顶点集合压缩成一个整体。Kosaraju 先记录原图 DFS 的完成顺序，再在转置图上按逆序做第二遍 DFS；两遍都是 O(V+E)。',
      'Mutual reachability in a directed graph is stronger than undirected connectivity: A reaching B does not imply B reaches A. A strongly connected component captures a maximal set of vertices that reach each other. Kosaraju records the original DFS finish order, then runs a second DFS on the transposed graph in reverse finish order; both passes are O(V+E).',
    ),
    definition: text(
      '有向图的强连通分量是极大的顶点集合，集合内任意两点互相可达；Kosaraju 用原图完成序加转置图逆序 DFS 求解。',
      'A strongly connected component of a directed graph is a maximal vertex set in which every pair reaches each other; Kosaraju solves it with the original finish order plus a reverse-order DFS on the transposed graph.',
    ),
    ...algorithm(
      step('原图 DFS 记录完成序', 'DFS the original graph for finish order'),
      step('构造转置图', 'Build the transposed graph'),
      step('按完成序逆序扫描', 'Scan in reverse finish order'),
      step('转置图上 DFS', 'DFS on the transposed graph', '转置使“能到达根”变成“从根可达”。', 'Transposing turns “can reach the root” into “reachable from the root”.'),
      step('收集一个 SCC', 'Collect one SCC'),
      step('重复至全部处理', 'Repeat until all vertices are assigned'),
    ),
    conditions: list(
      ['只适用于有向图。', '需要同时保存原图和转置图。', '递归深度最坏 O(V)；两遍 DFS 总时间 O(V+E)。'],
      ['Only for directed graphs.', 'Both the original and transposed graphs must be stored.', 'Recursion depth can reach O(V); the two DFS passes total O(V+E) time.'],
    ),
    diagram: 'kosaraju',
  },

  articulation: {
    intro: text(
      '关节点问题问的是“删掉哪个顶点会让连通分量变多”。朴素做法对每个顶点删除后重新数一遍连通分量，代价 O(V(V+E))。DFS low-link 把发现时间 disc 与子树最早可回溯时间 low 一次算完：非根顶点若有树孩子满足 low[child] ≥ disc[u]，删去 u 就会切断这棵子树；根没有祖先，只能看 DFS 树孩子数是否至少为 2。同一遍 DFS 还能用严格不等式 low[child] > disc[u] 找出桥。',
      'The articulation-point problem asks which vertex deletion increases the component count. The naive method deletes each vertex and recounts components, costing O(V(V+E)). DFS low-link computes discovery time disc and the subtree’s earliest reachable time low in one pass: a non-root u is a cut vertex when a tree child satisfies low[child] ≥ disc[u], because deleting u separates that subtree. The root has no ancestor, so only its number of DFS tree children matters, with at least two required. The same pass finds bridges with the strict inequality low[child] > disc[u].',
    ),
    definition: text(
      '无向图的关节点是删除它及其关联边后连通分量数增加的顶点；桥是删除后连通分量数增加的边。点双连通分量是不含自身关节点的极大子图，桥本身是一个含两个顶点的特殊块。',
      'An articulation point of an undirected graph is a vertex whose deletion, together with its incident edges, increases the number of connected components; a bridge is an edge whose deletion does so. A vertex-biconnected component is a maximal subgraph with no internal articulation vertex, and a bridge is a special two-vertex block of its own.',
    ),
    ...algorithm(
      step('记录发现时间并初始化 low', 'Record discovery time and initialise low', '进入顶点时 disc 递增，low 先等于自己的 disc。', 'On entry, disc increments and low starts equal to the vertex’s own disc.'),
      step('扫描每个未访问顶点', 'Scan every unseen vertex', '非连通图要对每个未访问顶点重新开一棵 DFS 树。', 'A disconnected graph restarts a DFS tree at every unseen vertex.'),
      step('分类树边与返祖边', 'Classify tree and back edges', '未发现邻点形成树边并递归；指向祖先的非父边才降低 low。', 'An unseen neighbour forms a tree edge and recurses; only a non-parent edge to an ancestor lowers low.'),
      step('回传 low 并判非根关节点', 'Propagate low and test non-root cuts', '子节点返回后取 low 的较小值，再比较 low[child] ≥ disc[u]。', 'After a child returns, take the smaller low and compare low[child] ≥ disc[u].'),
      step('用严格不等式判桥', 'Test bridges with the strict inequality', 'low[child] > disc[u] 才说明子树连 u 都回不到。', 'Only low[child] > disc[u] means the subtree cannot even return to u.'),
      step('根节点单独数孩子', 'Count root children separately', '根至少有两个 DFS 树孩子才是关节点。', 'The root needs at least two DFS tree children to be a cut vertex.'),
    ),
    conditions: list(
      [
        '只适用于无向图；有向图应使用强连通分量或其它结构。',
        '非连通图必须对每个未访问顶点重新启动 DFS。',
        '非根关节点用 low[child] ≥ disc[u]，桥用严格 low[child] > disc[u]。',
        '根节点不能套用 low 判据，只能数 DFS 树孩子。',
      ],
      [
        'Only for undirected graphs; directed graphs need SCCs or another structure.',
        'A disconnected graph must restart DFS at every unseen vertex.',
        'Non-root cuts use low[child] ≥ disc[u]; bridges use the strict low[child] > disc[u].',
        'The root never uses the low test; count its DFS tree children instead.',
      ],
    ),
  },

  linear: {
    intro: text(
      '在无序数组中，元素位置与值没有关系，无法根据大小跳过候选。顺序查找从索引 0 开始逐个比较，命中就返回下标，全部检查完仍未命中则返回 −1。它实现最简单、对数据没有排序要求，但最坏需要 O(n) 次比较。',
      'In an unordered array, position carries no information about value, so candidates cannot be skipped by comparisons. Linear search starts at index 0 and compares one by one, returning the index on a match and −1 after exhausting the array. It is the simplest search and requires no ordering, but needs O(n) comparisons in the worst case.',
    ),
    definition: text(
      '顺序查找是一种线性搜索：从第一个元素开始逐个比较，返回第一个匹配下标；未找到时返回 −1。',
      'Linear search is a sequential search: it compares elements one by one from the start and returns the first matching index, or −1 if no element matches.',
    ),
    ...algorithm(
      step('从索引 0 开始', 'Start at index 0'),
      step('比较当前元素', 'Compare the current element'),
      step('前进到下一个', 'Advance to the next element', '未命中就继续，不能跳过任何候选。', 'Continue on a miss; no candidate may be skipped.'),
      step('命中或返回 −1', 'Return the index or −1'),
    ),
    conditions: list(
      ['数组不需要有序。', '空数组直接返回 −1。', '最坏 O(n)，平均约 n/2 次比较。'],
      ['The array does not need to be sorted.', 'An empty array returns −1 immediately.', 'O(n) worst case, about n/2 comparisons on average.'],
    ),
  },

  binary: {
    intro: text(
      '顺序查找在有序数组上仍然要逐个检查，浪费了“有序”这一信息。二分查找每次看中间元素，根据大小排除一半候选，把比较次数降到 O(log n)。代价是数组必须有序且支持随机访问；链表即使有序也无法 O(1) 定位中点。',
      'Linear search still checks every element in a sorted array, wasting the ordering information. Binary search examines the middle element and discards half the candidates based on the comparison, reducing comparisons to O(log n). The price is that the array must be sorted and support random access; even a sorted linked list cannot locate the midpoint in O(1).',
    ),
    definition: text(
      '二分查找在有序数组的闭区间 [left, right] 中反复取中点 mid，根据 a[mid] 与目标的大小关系排除一半候选。',
      'Binary search repeatedly takes the midpoint of the closed interval [left, right] in a sorted array and discards half the candidates according to how a[mid] compares with the target.',
    ),
    ...algorithm(
      step('确认输入有序', 'Confirm the array is sorted'),
      step('初始化闭区间', 'Initialise the closed interval'),
      step('取中点 mid', 'Take the midpoint'),
      step('比较并排除一半', 'Compare and discard half', '每轮至少去掉一半候选。', 'Each round removes at least half the candidates.'),
      step('命中或区间为空', 'Return the index or −1'),
    ),
    conditions: list(
      ['数组必须有序（非降序），否则排除一半的逻辑不成立。', '必须支持 O(1) 随机访问；链表不适合。', '闭区间写法要求 left ≤ right；空数组直接返回 −1。'],
      ['The array must be sorted (non-decreasing); otherwise discarding half is invalid.', 'O(1) random access is required; linked lists are unsuitable.', 'The closed-interval form requires left ≤ right; an empty array returns −1.'],
    ),
  },

  'hash-chain': {
    intro: text(
      '直接按值建立数组映射只在键范围很小时可行。哈希表用哈希函数把键压到 m 个桶，允许不同键落入同一桶；链地址法把冲突元素串成链表。平均查找 O(1+α)，最坏所有键同桶时退化到 O(n)。它用额外指针换取平均常数时间。',
      'Direct array indexing by key only works when the key range is small. A hash table uses a hash function to map keys into m buckets and allows different keys to share a bucket; separate chaining links colliding entries into a list. Average search is O(1+α), degenerating to O(n) when all keys land in one bucket. It trades extra pointers for average constant time.',
    ),
    definition: text(
      '链地址法哈希表用哈希函数 h(key) 将键映射到 m 个桶，每个桶维护一条冲突链；查找、插入、删除都先定位桶再沿链操作。',
      'A separate-chaining hash table maps keys to m buckets with a hash function h(key), each bucket maintaining a collision chain; search, insertion and deletion locate the bucket first and then walk the chain.',
    ),
    ...operations(
      step('计算桶号', 'Compute the bucket index', '桶号为 h(key) mod m。', 'The bucket index is h(key) mod m.'),
      step('桶内查找', 'Search the bucket chain', '平均链长 α = n/m。', 'The average chain length is α = n/m.'),
      step('插入节点', 'Insert a node'),
      step('删除节点', 'Delete a node'),
    ),
    conditions: list(
      ['哈希函数必须稳定，且结果落在 [0, m)。', '允许冲突，桶内用 next 链保存同桶元素。', '平均 O(1+α)，最坏 O(n)；本课不自动扩容。'],
      ['The hash function must be stable and map into [0, m).', 'Collisions are allowed; a next chain stores same-bucket entries.', 'O(1+α) average, O(n) worst case; this course does not resize automatically.'],
    ),
  },

  'hash-probe': {
    intro: text(
      '链地址法需要额外的 next 指针；开放寻址把全部键值直接放在桶数组里，冲突时按探测序列找下一个空槽。它节省指针、缓存局部性好，但删除不能直接置空，必须留下 DELETED 墓碑；装载因子越高，聚集越严重，平均探测次数迅速上升。',
      'Separate chaining needs extra next pointers; open addressing stores all keys directly in the bucket array and follows a probe sequence to the next slot on collision. It saves pointers and has good cache locality, but deletion cannot simply clear a slot: a DELETED tombstone is required. The higher the load factor, the worse the clustering and average probe count.',
    ),
    definition: text(
      '开放寻址哈希表把键值直接存入桶数组；线性探测按 (h(key)+i) mod m 依次寻找槽位，删除时用 DELETED 标记保留探测链。',
      'An open-addressing hash table stores keys directly in the bucket array; linear probing examines slots in the order (h(key)+i) mod m, and deletion leaves a DELETED marker to preserve probe chains.',
    ),
    ...operations(
      step('计算初始槽', 'Compute the initial slot'),
      step('线性探测', 'Probe linearly'),
      step('插入', 'Insert'),
      step('查找', 'Search'),
      step('删除留墓碑', 'Delete with a tombstone', 'DELETED 不能改回 EMPTY，否则会截断探测链。', 'DELETED must not become EMPTY, or the probe chain would be cut.'),
    ),
    conditions: list(
      ['表长 m 固定，探测顺序必须与查找一致。', '删除必须留下 DELETED 墓碑；查找遇到 EMPTY 才能判定失败。', '装载因子越高，聚集越严重；本课不自动扩容。'],
      ['Table length m is fixed; probing order must match between insertion and search.', 'Deletion must leave a DELETED tombstone; search may stop only at EMPTY.', 'Higher load factor worsens clustering; this course does not resize automatically.'],
    ),
  },

  'bf': {
    intro: text(
      'BF 把模式串依次对齐到每个合法起点，再从这个起点的第一个字符开始逐位比较。字符相同就继续，字符不同就说明当前起点作废：起点整体右移一格，模式串指针清零，从头再比。它不复用上一次对齐已经确认的前缀，所以同一段主串字符可能被多次比较，最坏时间为 O(nm)，但额外空间只需常数个指针与计数。',
      'BF aligns the pattern with each legal start and compares character by character from that start. Equality continues; a mismatch invalidates the current start, shifts it right by one and resets the pattern pointer to zero. Nothing from the previous alignment is reused, so text characters may be compared repeatedly, giving O(nm) worst-case time but only constant extra space.',
    ),
    definition: text(
      '朴素模式匹配（Brute Force）是一种直接枚举全部候选起点的串匹配算法：对每个 s∈[0,n−m]，令 j=0，依次比较 T[s+j] 与 P[j]；若全部 m 个字符都相等，记录起点 s；只要有一位不等，就令 s=s+1、j=0 重新开始。遍历结束后返回全部匹配起点，允许重叠。',
      'Naive pattern matching (brute force) enumerates every candidate start: for each s in [0,n−m], set j=0 and compare T[s+j] with P[j]. If all m characters are equal, record s; on the first inequality set s=s+1 and j=0 and restart. At the end it returns every match start, overlaps included.',
    ),
    ...algorithm(
      step(
        '外层枚举候选起点',
        'Outer loop over candidate starts',
        's 从 0 走到 n−m；每个 s 表示模式串首字符对齐到主串的这个位置。',
        's runs from 0 to n−m; each s aligns the pattern’s first character with that text position.',
      ),
      step(
        '内层逐字符比较',
        'Inner character comparison',
        '进入每个起点时 j 重置为 0，比较 T[s+j] 与 P[j]；j 表示模式串内偏移，不是主串绝对下标。',
        'j resets to 0 at each start and T[s+j] is compared with P[j]; j is a pattern offset, not an absolute text index.',
      ),
      step(
        '相同则 j 前进',
        'Advance j on equality',
        '字符相同只让 j 加一，起点 s 不动；j 未到 m 就继续比较下一位。',
        'On equality only j increases while s stays fixed; until j reaches m the next pair is compared.',
      ),
      step(
        '失配则起点右移',
        'Shift the start on a mismatch',
        '只要有一位不同就放弃当前 s，令 s=s+1、j=0；刚刚比较过的主串字符可能在新对齐下再次被比较。',
        'One inequality discards the current s and sets s=s+1, j=0; text characters just compared may be compared again under the new alignment.',
      ),
      step(
        '记录全部匹配并结束',
        'Record every match and finish',
        'j 走到 m 时记录起点 s，然后仍继续 s+1，因此重叠匹配不会漏掉；s 超过 n−m 后返回全部结果。',
        'When j reaches m, record s and still continue at s+1, so overlapping matches are kept; after s exceeds n−m, return every result.',
      ),
    ),
    conditions: list(
      [
        '合法起点只有 0..n−m；若 n<m，一个候选起点也没有，结果为空。',
        '空主串合法，返回空列表；空模式串没有定义好的匹配语义，本课直接拒绝。',
        '返回全部匹配起点，允许重叠；例如 AAAAA 中查找 AAA 得到 0、1、2。',
        '最坏时间 O(nm)，额外空间 O(1)；seen 计数只用于教学展示，不是算法必需。',
      ],
      [
        'Legal starts are only 0..n−m; if n<m there is no candidate and the result is empty.',
        'Empty text is legal and yields an empty list; an empty pattern has no well-defined meaning here and is rejected.',
        'Every match start is returned, overlaps included: AAA in AAAAA yields 0, 1 and 2.',
        'Worst-case time O(nm), extra space O(1); the seen counters are teaching aids, not algorithm state.',
      ],
    ),
  },

  'kmp': {
    intro: text(
      '朴素模式匹配在每个起点重新开始：一旦失配，主串起点右移一格，刚刚已经确认相等的整段字符又会被重新比较，最坏 O(nm)。KMP 先对模式串求前缀表 lps，把“已匹配前缀的后缀同时也是模式串前缀”这一结构保存下来；失配时只把模式串指针 j 回退到 lps[j-1]，主串指针 i 持续前进，于是构造加扫描的总时间为 O(n+m)。',
      'Naive matching restarts at each text position: after one mismatch the text start shifts by one and the whole segment just confirmed equal is compared again, costing O(nm) in the worst case. KMP first computes the pattern’s lps table, recording where a suffix of a matched prefix is also a pattern prefix. On a mismatch only pattern pointer j falls back to lps[j-1] while text pointer i keeps advancing, so construction plus scanning is O(n+m).',
    ),
    definition: text(
      'KMP 是一种线性时间的字符串匹配算法：先计算模式串 P 的前缀表 lps，其中 lps[k] 是 P[0..k] 的最长相等真前后缀长度；再令主串指针 i 只前进，模式串指针 j 在失配时按 lps[j-1] 回退，从而在不回退主串的前提下找到所有匹配起点。',
      'KMP is a linear-time string matching algorithm. It first computes the pattern’s lps table, where lps[k] is the longest proper prefix of P[0..k] that is also its suffix. Text pointer i then only advances, while pattern pointer j falls back to lps[j-1] on a mismatch, finding every match start without ever rewinding the text.',
    ),
    ...algorithm(
      step(
        '构造初始化',
        'Initialize the table build',
        'lps[0]=0、i=1、j=0；长度为 1 的串没有真前后缀，所以首项必为 0。',
        'lps[0]=0, i=1, j=0: a one-character string has no proper prefix/suffix, so its first entry is always 0.',
      ),
      step(
        '构造循环：比较与分支',
        'Build loop: compare and branch',
        '比较 P[i] 与 P[j]：相等则 j++ 并写 lps[i]；不等且 j>0 则 j=lps[j-1] 后继续同一轮比较；不等且 j=0 则写 lps[i]=0、i++。i 走完 m 项才退出循环。',
        'Compare P[i] with P[j]: if equal, increment j and write lps[i]; if different and j>0, set j=lps[j-1] and retry the same comparison; if different and j=0, write lps[i]=0 and increment i. The loop exits only after i has covered all m entries.',
      ),
      step(
        '进入匹配：i=0、j=0',
        'Enter matching: i=0, j=0',
        '前缀表构建完成后才开始扫描主串；匹配阶段 i 只增不减。',
        'Text scanning starts only after the table is complete; during matching i never decreases.',
      ),
      step(
        '匹配循环：相等则同步前进',
        'Match loop: advance together on equality',
        '若 T[i]=P[j]，则 i++、j++；当 j=m 时记录起点 s=i-m，再令 j=lps[m-1] 继续寻找，因此不会漏掉重叠匹配。',
        'If T[i]=P[j], increment both i and j. When j=m, record s=i-m and set j=lps[m-1] before continuing, so overlapping occurrences are not missed.',
      ),
      step(
        '匹配循环：失配只回退 j',
        'Match loop: fall back j only',
        '若 T[i]≠P[j] 且 j>0，则 j=lps[j-1]，i 不动并重新比较；若 j=0，则当前主串位置不可能成为起点，i++。i 到达 n 时循环结束。',
        'If T[i]≠P[j] and j>0, set j=lps[j-1], keep i fixed and compare again; if j=0, this text position cannot start a match, so increment i. The loop ends when i reaches n.',
      ),
      step(
        '输出全部匹配起点',
        'Output every match start',
        '扫描结束后 matches 保存所有真实起点；允许重叠，例如 AAAAA 中查找 AAA 得到 0、1、2。',
        'When the scan ends, matches holds every real start. Overlaps are allowed: AAA in AAAAA yields 0, 1 and 2.',
      ),
    ),
    conditions: list(
      [
        '本课统一使用 0 基 lps：lps[k] 对应 P[0..k]，失配回退到 lps[j-1]。',
        '部分教材的 next / nextval 采用不同下标或整体移位定义，不能与本课的 lps 混用。',
        '模式串长度 m 至少为 1；空模式串没有定义好的真前后缀，本课直接拒绝。',
        '时间 O(n+m)：构造 O(m)、扫描 O(n)，i 不回退；辅助空间 O(m)。',
      ],
      [
        'This course uses a 0-based lps: lps[k] covers P[0..k], and a mismatch falls back to lps[j-1].',
        'Some textbooks define next/nextval with different indices or an off-by-one shift; those conventions must not be mixed with this lps.',
        'The pattern length m is at least 1; an empty pattern has no well-defined proper prefix/suffix and is rejected here.',
        'Time O(n+m): O(m) to build plus O(n) to scan because i never rewinds; O(m) extra space.',
      ],
    ),
  },

  'sparse-transpose': {
    intro: text(
      '稀疏矩阵的三元组表只记录非零元素。若直接把每条 (row, col, value) 改成 (col, row, value)，结果不再按转置矩阵的行优先顺序排列；若再排序，就会多出 O(t log t) 的代价。快速转置先统计原矩阵每一列的非零个数 num，再由 num 递推每一列在结果表中的起始槽 cpot，最后按源表行优先顺序把每个元素一次写入最终位置。它把“排序”换成“预先算好每列的落点”，时间 O(t+c)，额外辅助空间 O(c)。',
      'A sparse triplet list stores only non-zeros. Rewriting each (row, col, value) as (col, row, value) immediately breaks the row-major order of the transpose; sorting afterwards adds O(t log t). Fast transpose counts non-zeros per original column into num, derives each column’s starting slot cpot from num, then places every source triplet directly into its final slot in one pass. It replaces sorting with precomputed column offsets: O(t+c) time and O(c) extra working space.',
    ),
    definition: text(
      '稀疏矩阵快速转置是一种基于三元组表的线性转置算法：num[c] 统计原矩阵第 c 列的非零元素个数；cpot[0]=0，cpot[c]=cpot[c−1]+num[c−1] 给出第 c 列在结果表中的起始槽；随后按源三元组行优先顺序，把 (row, col, value) 写成 (col, row, value) 放入 result[cpot[col]]，并将 cpot[col] 加一。',
      'Fast sparse transpose is a linear-time transpose over a triplet list. num[c] counts non-zeros in original column c; cpot[0]=0 and cpot[c]=cpot[c−1]+num[c−1] give column c’s starting slot in the result. Then, in source row-major order, each (row, col, value) becomes (col, row, value) and is written to result[cpot[col]], after which cpot[col] is incremented.',
    ),
    ...algorithm(
      step(
        '读入并为 num 清零',
        'Read the input and clear num',
        '读取行数、列数与非零三元组；num 的长度是原矩阵的列数 c。每条三元组必须非零、坐标唯一且严格行优先。',
        'Read row count, column count and non-zero triplets; num has length c, the original column count. Every triplet must be non-zero, with unique coordinates and strict row-major order.',
      ),
      step(
        '第一遍循环：统计各列',
        'First loop: count each column',
        '遍历全部 t 条三元组，只读列号 col，执行 num[col] += 1。循环结束后 sum(num) 必须等于 t。',
        'Visit all t triplets, read only their column col and perform num[col] += 1. After the loop, sum(num) must equal t.',
      ),
      step(
        '递推 cpot：列块起点',
        'Recurrence for cpot: block starts',
        'cpot[0]=0；对 c=1..c−1 执行 cpot[c]=cpot[c−1]+num[c−1]。每一步依赖前一列的起点和长度，不能并行猜测。',
        'Set cpot[0]=0; for c=1..c−1 compute cpot[c]=cpot[c−1]+num[c−1]. Each step depends on the previous block’s start and length and cannot be guessed independently.',
      ),
      step(
        '第二遍循环：读取源三元组',
        'Second loop: read a source triplet',
        '重新按行优先顺序遍历源表，取出 row、col、value，并令 q=cpot[col]。q 是该元素在结果表中的最终槽。',
        'Walk the source list again in row-major order, read row, col and value, and set q=cpot[col]. q is the entry’s final slot in the result.',
      ),
      step(
        '写入：交换坐标，值不变',
        'Write: swap coordinates, keep the value',
        '把 (col, row, value) 写入 result[q]。不移动其他元素，也不重新排序；列块布局已保证 q 不会越界或冲突。',
        'Write (col, row, value) to result[q]. No other entry moves and no sorting occurs; the column-block layout guarantees q is in bounds and unoccupied.',
      ),
      step(
        '更新 cpot：该列指针前移',
        'Update cpot: advance that column',
        '刚写过的槽已被占用，执行 cpot[col]=q+1。只推进当前列；其他列的 cpot 保持不变。',
        'The written slot is occupied, so set cpot[col]=q+1. Only the current column advances; other columns stay unchanged.',
      ),
      step(
        '完成：结果已是行优先',
        'Done: the result is row-major',
        '全部源三元组处理完后，结果表每个槽恰好写一次。列块按列号升序，块内按源行优先，因此结果正是转置矩阵的行优先三元组表。',
        'After every source triplet is processed, each result slot was written exactly once. Blocks follow ascending column numbers and preserve source row order within a block, so the result is the transpose’s row-major triplet list.',
      ),
    ),
    conditions: list(
      [
        '本课统一使用 0 基：矩阵行列、三元组坐标、cpot 槽号都从 0 开始。',
        '输入三元组必须严格行优先且 (row, col) 唯一；零元素不进入三元组表。',
        'num 统计的是原矩阵的“列”，不是行；转置后它对应结果表每一块的长度。',
        'cpot 在放置阶段必须可变；写入后不更新会导致同列元素互相覆盖。',
        '时间 O(t+c)：两次扫描三元组加一次 cpot 递推；额外辅助空间 O(c)，结果表 O(t)。',
        '空矩阵、空列、单行/单列和矩形矩阵都必须返回正确结果。',
      ],
      [
        'This course is 0-based throughout: matrix coordinates, triplet positions and cpot slots all start at 0.',
        'Input triplets must be strictly row-major with unique (row, col); zeros never enter the triplet list.',
        'num counts original columns, not rows; after transposing, each entry is the length of one result block.',
        'cpot must be mutable during placement; failing to advance it makes entries in the same column overwrite each other.',
        'Time O(t+c): two triplet scans plus one cpot recurrence; extra working space O(c), result storage O(t).',
        'Empty matrices, empty column sets, single-row/column and rectangular shapes must all return correct results.',
      ],
    ),
  },
  'gl-depth': {
    intro: text(
      '广义表的深度不是元素个数，而是嵌套层数。若只用一个循环扫描节点，遇到子表就不知道该往下走几层，也无法回答“哪条分支最深”。递归把每个子表当成同类的子问题：原子和空表直接给出终止值，非空表汇总所有子表返回值，取最大值再加当前这一层。这样每个节点只访问一次，深度随调用栈自然得到。',
      'The depth of a generalized list is nesting, not element count. A single scan cannot tell how many levels to descend at a sublist or which branch is deepest. Recursion treats each sublist as the same subproblem: atoms and empty lists return base values, while a non-empty list combines all child returns, takes the maximum and adds its own level. Every node is visited once and depth falls out of the call stack.',
    ),
    definition: text(
      '广义表深度递归：Depth(atom)=0；Depth(())=1；对非空表 (e1,…,en)，Depth=1+max(Depth(ei))。真实程序从根开始先序进入每个节点，原子/空表立即返回，非空表递归全部孩子后合并最大值。',
      'Generalized-list depth recursion: Depth(atom)=0; Depth(())=1; for a non-empty list (e1,…,en), Depth=1+max(Depth(ei)). The real program enters nodes preorder from the root, returns immediately at atoms/empty lists, and combines child maxima after recursing all children of a non-empty list.',
    ),
    ...algorithm(
      step('解析表达式并建立节点', 'Parse the expression and build nodes', '括号决定层级，逗号只分隔同一层；节点按先序获得稳定 id。', 'Parentheses define levels and commas separate siblings; nodes receive stable preorder ids.'),
      step('进入节点，区分原子与子表', 'Enter a node and classify it', 'enter 帧只记录当前节点、父节点和递归层，还没有返回值。', 'The enter frame records the node, parent and level; it does not yet produce a value.'),
      step('原子返回 0，空表返回 1', 'Atom returns 0; empty list returns 1', '两种终止条件不同：原子不可再分，空表仍占一层括号。', 'The two base cases differ: an atom is indivisible, while an empty list still occupies one bracket level.'),
      step('递归所有子表，记录最大子深度', 'Recurse into every child and keep the maximum', '每个 child 的返回值与 best 比较，只保留最大值，不累加。', 'Compare each child return with best and keep only the maximum; never sum them.'),
      step('当前层返回 1 + best', 'Return 1 + best for this level', '当前层只加一次，写回该节点的深度账本。', 'Add the current level exactly once and write it into that node’s ledger entry.'),
      step('根返回整表深度', 'The root returns the whole depth', 'done 帧显示最终结果；最深路径决定深度。', 'The done frame shows the result; the deepest path determines it.'),
    ),
    conditions: list(
      [
        '本课深度约定：原子 0，空表 1，非空表 1 + 子表最大深度；三处必须同时遵守。',
        '输入只接受有限、无环、无共享子表的括号表达式，最多 80 字符、40 节点、8 层。',
        '一个表有多个子表时取 max，不能求和；长度才数最外层元素。',
        '每个节点只进入一次；原子和空表必须立即返回，不能再展开。',
        '时间 O(n)，递归栈 O(h)；本课将 h 限制在 8。',
      ],
      [
        'Depth convention here: atom 0, empty list 1, non-empty list 1 + maximum child depth; all three must agree.',
        'Inputs are finite, acyclic bracketed expressions without shared sublists, at most 80 characters, 40 nodes and 8 levels.',
        'With several children take max, never a sum; length, by contrast, counts outermost elements.',
        'Each node is entered once; atoms and empty lists must return immediately and never expand.',
        'Time O(n), recursion stack O(h); this course caps h at 8.',
      ],
    ),
  },

  'gl-copy': {
    intro: text(
      '把 copy_root = root 赋值只复制了根指针，新旧表仍共享全部节点；修改副本会污染原表。真正的复制要构造同形但独立的新节点。广义表节点分为原子和子表，孩子数量不固定，普通的一层循环无法覆盖嵌套。递归复制在进入每个源节点时先分配新节点并接到新父节点，再按源 children 递归；原子复制值，空表保留真实节点，最终返回独立的新根。',
      'Assigning copy_root = root copies only the root pointer, so both lists still share every node and editing the copy mutates the original. A real copy builds new nodes with the same shape but independent identity. Generalized-list nodes are atoms or sublists with variable child counts, so one flat loop cannot cover nesting. Recursive copying allocates a new node on entry and attaches it to the new parent, then recurses through source children; atoms copy values, empty lists remain real nodes, and an independent new root is returned.',
    ),
    definition: text(
      '广义表复制递归：clone(node,parent_copy) 先按 node.kind 分配同类型新节点；根写入 copy_root，其余追加到 parent_copy.children。原子写入相同 atom 后返回；空表直接返回新空表节点；非空表按源 children 顺序递归，每个子调用返回的新节点已接到当前新节点，全部完成后返回当前新节点。',
      'Generalized-list copy recursion: clone(node,parent_copy) allocates a new node of the same kind; the root becomes copy_root and others append to parent_copy.children. An atom copies its value and returns; an empty list returns its new empty node; a non-empty list recurses through source children, each returned new child is already attached, and the current new node is returned after all children finish.',
    ),
    ...algorithm(
      step('解析源表，准备独立副本', 'Parse the source and prepare a copy', '源节点 n0… 与复制节点 c0… 使用不同 id 空间。', 'Source nodes n0… and copy nodes c0… use separate id spaces.'),
      step('进入源节点，判断原子或子表', 'Enter the source node and classify it', 'enter 帧还没有 copyId，因为新节点尚未分配。', 'The enter frame has no copyId because no new node exists yet.'),
      step('先分配新节点并接父', 'Allocate the new node and attach it first', '根写入 copy_root，其余追加到 parent_copy；children 暂为空。', 'The root becomes copy_root; others append to parent_copy with empty children.'),
      step('原子复制值，空表保留节点', 'Copy atom values; keep empty-list nodes', '空表不能简化为 NULL，否则 (()) 会丢失一个元素。', 'Never collapse an empty list to NULL, or (()) loses an element.'),
      step('按源 children 递归并接回', 'Recurse through source children and relink', '每个子调用返回新节点，父层把它接到新 children；绝不接源节点。', 'Each child call returns a new node; the parent links it into new children, never to a source node.'),
      step('返回新根：结构等价、节点独立', 'Return the new root: equivalent but independent', '复制计数等于源节点总数；文本相同且无新节点指向源节点。', 'The copied count equals the source node count; text matches and no new node points at a source node.'),
    ),
    conditions: list(
      [
        '复制必须构造新节点，不能只返回源根指针或复用源 children。',
        '先分配父节点、再递归孩子；否则孩子没有可接入的新父节点。',
        '原子复制 atom 值并返回新节点；空表必须保留真实新节点，hp=NULL 不等于没有该元素。',
        '新节点 children 只连接 c 前缀新节点；sourceId 仅用于教学对照，不能用于结构连接。',
        '时间 O(n)，新表占 O(n)，递归栈 O(h)；节点最多 40、深度最多 8。',
      ],
      [
        'A copy must allocate new nodes; never return the source root or reuse source children.',
        'Allocate the parent before recursing so children have a new parent to attach to.',
        'Atoms copy their value and return a new node; empty lists keep a real new node, since hp=NULL does not mean the element is absent.',
        'New children link only to c-prefixed nodes; sourceId is for teaching comparison, never structural linking.',
        'Time O(n), new storage O(n), recursion stack O(h); at most 40 nodes and 8 levels.',
      ],
    ),
  },
};

export type CourseGuideId = keyof typeof COURSE_GUIDES;
