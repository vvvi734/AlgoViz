import type { Lesson } from './types';

/**
 * TEXTBOOK-02 §2.4 polynomial-addition course. Step ids match `lesson_step=`
 * in the real Python merge program; equal-exponent merge and zero cancellation
 * are separate steps.
 */
export const polynomialAddLesson: Lesson = {
  lessonId: 'polynomial-add-linked-lists',
  algorithmId: 'polynomial-add',
  contentVersion: '1.0.0',
  title: { zh: '一元多项式相加：两条有序链表的双指针合并', en: 'Polynomial addition: merging two ordered chains with two cursors' },
  oneLiner: {
    zh: '把两个稀疏多项式各存成按指数降序的单链表，再用两个指针比较指数、逐项合并成第三条结果链。',
    en: 'Store each sparse polynomial as an exponent-descending singly linked list, then merge them term by term into a third result chain with two cursors.',
  },
  overview: {
    zh: '多项式 A(x) = 3x⁴ + 2x² − 5 如果按普通数组存系数，需要从 x⁰ 一直开到 x⁴，中间 x³ 与 x¹ 的系数都是 0，浪费大量位置。稀疏多项式只保存非零项，每一项由 coefficient 和 exponent 两个域组成，再用 next 串成链表。为了合并方便，每条链按 exponent 严格降序排列。相加时不需要把两条链排序，也不需要先算每一项再收集；两个指针分别指向 A、B 当前项，比较指数：相等就把系数相加，和不为 0 才生成结果结点；A 的指数大就取 A 项，只移动 A；B 的指数大就取 B 项，只移动 B。某个指针走到 NULL 后，另一条链剩余部分已经有序，直接整段接入结果链即可。结果链同样是按指数降序的稀疏链表。',
    en: 'If A(x) = 3x⁴ + 2x² − 5 were stored as a dense coefficient array from x⁰ through x⁴, the zero coefficients of x³ and x¹ would waste slots. A sparse polynomial stores only nonzero terms, each with coefficient and exponent fields, connected by next. Each chain is kept in strictly descending exponent order to make merging cheap. Addition does not sort the inputs or compute every term separately: two cursors point at the current A and B terms and compare exponents. Equal exponents add coefficients, creating a result node only when the sum is nonzero. If A’s exponent is larger, take the A term and advance only A; if B’s is larger, take the B term and advance only B. Once one cursor reaches NULL, the rest of the other chain is already ordered and can be appended as a whole. The result is again an exponent-descending sparse chain.',
  },
  intuition: {
    zh: '把两条链表想成两列按从高到低排好的卡片，A、B 两只手指各按在一张卡片上。每次只看当前两张：指数一样就把两个系数合成一张新卡片（合成结果为 0 就什么也不放）；A 的指数更高，就先放 A 这张，A 手指往下移一格；B 更高就放 B 这张。某列卡片先放完，另一列剩下的卡片本来就从高到低，直接全部挪到结果列尾部。整个过程像归并两条有序序列，但“相同键”要相加而不是二选一。',
    en: 'Picture two piles of cards sorted from high to low, with one finger on the current card of each pile. Look only at the two current cards: equal exponents combine into one new card (and a zero sum produces no card at all); if A’s exponent is higher, place A’s card and move only A’s finger; if B’s is higher, take B’s. When one pile is exhausted, the remaining cards in the other are already ordered, so the whole tail moves to the result. It is like merging two ordered sequences, except equal keys are added instead of choosing one.',
  },
  prerequisites: {
    zh: ['理解单链表的 next 与头指针', '知道多项式项由系数和指数组成', '理解“按指数降序”为什么使合并只需向前扫描'],
    en: ['Singly linked lists: next and head', 'A polynomial term consists of a coefficient and an exponent', 'Why descending exponent order lets the merge scan forward only'],
  },
  complexity: {
    time: 'O(m+n)',
    space: 'O(m+n)（结果链新建结点）',
    note: {
      zh: '两个指针都只向前移动，从不回退。A 链的每个结点最多被检查一次，B 链同理，因此比较与指针移动总数是 O(m+n)。相等指数合并时两个指针同时前进；指数不等时只前进一个。最后追加剩余段不再比较，仍只是把剩余结点接到结果尾部，总时间仍是 O(m+n)。空间上若结果链新建结点，最坏保存 m+n 个非零项，是 O(m+n)；若允许复用原结点，可以把空间降到 O(1) 额外指针，但会破坏原多项式，教学实现默认不这样做。',
      en: 'Both cursors move forward only and never rewind. Each A node is inspected at most once, and likewise each B node, so comparisons and cursor moves total O(m+n). Equal exponents advance both cursors; unequal exponents advance one. Appending the remaining tail performs no further comparisons and still only links nodes, so total time remains O(m+n). If the result allocates new nodes, it can hold up to m+n nonzero terms, O(m+n) space. Reusing the input nodes could reduce extra space to O(1) pointers, but it destroys the inputs, so the teaching implementation deliberately allocates a new result chain.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 两条有序链与空结果链', en: '① Two ordered chains and an empty result' },
      explanation: {
        zh: '初始化后 A、B 各是一条按指数严格降序的单链表，结果链 head 为 NULL。A 指针指向 A 的第一个结点，B 指针指向 B 的第一个结点；两个指针都不是“数组下标”，而是真实结点引用。若某个多项式为空，对应指针一开始就是 NULL，算法仍可继续，不需要特判“空加空”。',
        en: 'After initialisation A and B are singly linked lists in strictly descending exponent order, and the result head is NULL. The A cursor points at A’s first node and the B cursor at B’s first node; these are real node references, not array indices. If one polynomial is empty, its cursor starts as NULL and the algorithm still runs; there is no special “empty plus empty” case.',
      },
      tip: { zh: 'A/B 指针表示“当前尚未处理的最高次项”，不是已经处理到的位置。', en: 'The A/B cursors denote the highest unprocessed term, not a processed prefix.' },
    },
    {
      stepId: 'compare',
      title: { zh: '② 比较指数：决定移动哪一边', en: '② Compare exponents: decide which side moves' },
      explanation: {
        zh: '循环条件是 A 或 B 至少一个还有剩余项。两边都不空时，先比较 aExp 与 bExp。比较只读指数，不改链表，也不产生结果结点。它是整个算法的分支点：相等进入合并分支，A 更大进入取 A 分支，B 更大进入取 B 分支。因为两条链都按降序排列，当前指数较大的一项一定是全局剩余项中最大的，可以安全地先放进结果。',
        en: 'The loop continues while at least one of A or B has terms left. When both are nonempty, compare aExp with bExp. The comparison reads exponents only; it changes no chain and creates no result node. It is the branch point: equality enters the merge branch, a larger A enters the take-A branch, a larger B enters take-B. Because both chains are descending, the larger current exponent is the largest remaining term overall and can safely be placed next in the result.',
      },
      tip: { zh: '比较指数不是比较系数；系数大小不影响谁先进入结果。', en: 'Compare exponents, not coefficients; coefficient magnitude does not decide order.' },
    },
    {
      stepId: 'equal',
      title: { zh: '③ 指数相等且系数和不为 0：合并成一项', en: '③ Equal exponents with a nonzero sum: merge into one term' },
      explanation: {
        zh: 'aExp = bExp 时，两项是同类项，系数相加得到 total。若 total ≠ 0，就新建一个结果结点，系数为 total、指数仍为这个公共指数，尾插到结果链；然后 A、B 两个指针同时前进。结果链必须保持降序：由于当前指数是两边剩余项的最大值，尾插不会破坏顺序。注意只生成一个结点，而不是把 A、B 两个结点都塞进结果。',
        en: 'When aExp = bExp the terms are like terms, so their coefficients are added into total. If total ≠ 0, create one result node with coefficient total and the shared exponent, append it to the result tail, then advance both A and B. The result stays descending because the current exponent is the largest remaining on both sides, so tail insertion cannot break order. Only one node is created; the two input nodes are not both copied into the result.',
      },
      tip: { zh: '同类项合并的结果指数不变，只把系数相加。', en: 'Merging like terms keeps the exponent and adds only the coefficients.' },
    },
    {
      stepId: 'cancel',
      title: { zh: '④ 系数相加为 0：整项消失', en: '④ Coefficients sum to zero: the term disappears' },
      explanation: {
        zh: '若 total = 0，例如 3x⁴ 与 −3x⁴ 相加，结果不应出现 0x⁴。稀疏链表只保存非零项，所以这一帧不创建任何结果结点，只记录“抵消”，然后两个指针同时前进。若错误地保留 0 系数结点，结果链会多出一个永远为 0 的项，后续按指数扫描、求值、打印都会被迫处理它，也会破坏“非零项”这一表示约定。',
        en: 'If total = 0, for example 3x⁴ plus −3x⁴, the result must not contain 0x⁴. A sparse chain stores nonzero terms only, so this frame creates no result node, records the cancellation, and advances both cursors. Keeping a zero-coefficient node would add a term that is always zero, force later scans, evaluation and printing to handle it, and violate the sparse representation contract.',
      },
      tip: { zh: '指数相等且系数抵消时，结果链长度不增加。', en: 'When equal exponents cancel, the result chain does not grow.' },
    },
    {
      stepId: 'take-a',
      title: { zh: '⑤ A 的指数更大：先取 A，只移动 A', en: '⑤ A’s exponent is larger: take A, advance only A' },
      explanation: {
        zh: 'aExp > bExp 时，A 当前项在剩余项中指数最大，且 B 没有任何同类项可以与它合并，所以它的系数原样复制到结果链，指数不变。随后只把 A 指针移到 A.next，B 指针保持不动。不能同时移动 B：B 的当前项还没有与 A 的后续项比较过，移动它会跳过潜在同类项。',
        en: 'When aExp > bExp, A’s current term has the largest exponent among the remaining terms, and B has no like term that could merge with it, so its coefficient is copied unchanged into the result. Only the A cursor moves to A.next; B stays put. Advancing B too would skip a term that may still merge with a later A term.',
      },
      tip: { zh: '指数较大的一边先出队，另一边原地等待。', en: 'The larger exponent leaves first; the other cursor waits in place.' },
    },
    {
      stepId: 'take-b',
      title: { zh: '⑥ B 的指数更大：先取 B，只移动 B', en: '⑥ B’s exponent is larger: take B, advance only B' },
      explanation: {
        zh: 'bExp > aExp 时完全对称：B 当前项复制到结果链，B 指针前进，A 指针不动。合并过程始终遵守一个不变量：A 指针之前的项和 B 指针之前的项都已经按降序进入结果链，且没有遗漏任何同类项。当前指针指向各自链中尚未处理的最高次项。',
        en: 'When bExp > aExp the situation is symmetric: B’s current term is copied into the result, B advances, and A stays. The merge maintains one invariant: every term before the A cursor and before the B cursor has already entered the result in descending order, with no like term missed. The cursors point at the highest unprocessed term in each chain.',
      },
      tip: { zh: '不变量：结果链已有项严格降序，且两个指针之前的项都已处理完。', en: 'Invariant: the result so far is strictly descending, and everything before both cursors is processed.' },
    },
    {
      stepId: 'append',
      title: { zh: '⑦ 一方耗尽：整段追加剩余项', en: '⑦ One side exhausted: append the remaining segment' },
      explanation: {
        zh: '当 A 指针为 NULL 而 B 还有项时，B 的剩余段本身已经按指数降序，而且都小于结果链当前的最后指数（因为之前比较时 B 的指数不占优），所以不需要再逐项比较，直接把剩余段接到结果尾即可。实现上可以逐结点复制以保持“不改动输入”的约定，也可以一次接到 tail.next；本动画逐步展示复制和尾指针移动，便于看清每一步。A 剩余时完全对称。',
        en: 'When the A cursor is NULL and B still has terms, B’s remaining segment is already descending and all its exponents are below the current result tail (B never won the earlier comparisons), so no further comparisons are needed: append the segment to the result. An implementation may copy node by node to preserve the inputs, or link the whole segment at tail.next; this animation copies and advances the tail step by step so each link is visible. The A-remaining case is symmetric.',
      },
      tip: { zh: '剩余段不再比较，但必须保持尾指针正确。', en: 'The leftover segment needs no comparisons, but the tail pointer must stay correct.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑧ 完成：4x³ + 2x² + 2', en: '⑧ Done: 4x³ + 2x² + 2' },
      explanation: {
        zh: '官方示例中 A = 3x⁴ + 2x² − 5，B = −3x⁴ + 4x³ + 7。指数 4 的系数 3 与 −3 抵消，结果不保留 x⁴；指数 3 只出现在 B 中，取 4x³；指数 2 只出现在 A 中，取 2x²；常数项 −5 与 7 合并为 2。最终结果是 4x³ + 2x² + 2，仍然按指数降序。整个过程只扫描两条链各一次，时间 O(m+n)。',
      en: 'In the official example A = 3x⁴ + 2x² − 5 and B = −3x⁴ + 4x³ + 7. The exponent-4 coefficients 3 and −3 cancel, so no x⁴ term is kept; exponent 3 occurs only in B, contributing 4x³; exponent 2 occurs only in A, contributing 2x²; the constants −5 and 7 combine to 2. The final result is 4x³ + 2x² + 2, still in descending exponent order. Each chain is scanned once, so the time is O(m+n).',
      },
      tip: { zh: '结果不保留 0 系数项；两条链都空时结果就是 0。', en: 'Zero-coefficient terms are not kept; if both chains are empty the result is 0.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把两个多项式按普通数组逐位相加，而不是利用两条链已经按指数有序这一前提。',
      '指数相等时只取其中一个系数，忘记相加。',
      '系数相加为 0 时仍创建结果结点，留下 0x^k 项。',
      'A 的指数较大时同时移动 A、B 两个指针，跳过了 B 可能存在的同类项。',
      '结果链尾插时没有维护 tail，导致每次插入都从头遍历，复杂度退化。',
      '一方耗尽后继续逐项比较，或直接丢弃剩余段。',
      '输入顺序不是降序却静默排序，掩盖了算法对“有序链表”这一前置条件的依赖。',
      '认为空间一定是 O(1)：新建结果结点时最坏需要 O(m+n) 个结点。',
    ],
    en: [
      'Adding dense coefficient arrays position by position instead of exploiting the ordered chains.',
      'Taking only one coefficient when exponents are equal, instead of adding them.',
      'Creating a result node when the coefficient sum is zero, leaving a 0x^k term.',
      'Advancing both A and B when A’s exponent is larger, skipping a possible like term in B.',
      'Appending to the result without maintaining tail, forcing a full walk for every insertion.',
      'Continuing to compare after one side is exhausted, or dropping the remaining segment.',
      'Silently sorting an unordered input and hiding the algorithm’s ordered-list precondition.',
      'Claiming O(1) space when a new result chain can hold up to m+n nodes.',
    ],
  },
};
