import type { Lesson } from './types';

/**
 * LSD decimal radix sort course aligned with the real Python `lesson_step`
 * values: init, digit-start, distribute, collect, pass-end, done.
 */
export const radixSortLesson: Lesson = {
  lessonId: 'radix-sort-basics',
  algorithmId: 'radix',
  contentVersion: '1.0.0',
  title: { zh: '基数排序：LSD 十进制分配与稳定收集', en: 'Radix sort: LSD decimal distribution and stable collection' },
  oneLiner: {
    zh: '从个位开始，按当前位数字把记录放入 0–9 号桶，再按桶号顺序收集；每一位都重复，最终得到升序序列。',
    en: 'Starting at the units digit, place each record into bucket 0–9 by its current digit, then collect buckets in order; repeat for every digit to obtain ascending order.',
  },
  overview: {
    zh: '基数排序不是比较排序：它不直接比较两个完整关键字，而是把关键字拆成十进制数位，逐位分配和收集。LSD（最低位优先）先处理个位，再十位、百位……每一趟都必须稳定：桶内先进入的记录先被收集，否则低位已经建立的次序会在高位相同的记录之间被打乱。d 趟、基数为 10、每趟处理 n 条记录，时间 O(d(n+10))；需要 10 个桶和 n 条记录的链接/引用，额外空间 O(n+10)。本课程只接受 0–9999 的非负整数；不足的位按 0 处理，负数和超范围输入会被明确拒绝。',
    en: 'Radix sort is not a comparison sort: it never compares two full keys directly. It decomposes keys into decimal digits and distributes/collects one digit at a time. LSD processes units, tens, hundreds… and every pass must be stable: records that entered a bucket earlier must be collected earlier, otherwise the order established by lower digits is destroyed among records with equal higher digits. With d passes, radix 10 and n records per pass, the time is O(d(n+10)); ten buckets plus n links/references need O(n+10) extra space. This course accepts only non-negative integers 0–9999. Missing places are treated as zero; negative and out-of-range inputs are rejected explicitly.',
  },
  intuition: {
    zh: '想象十个小盒子，分别标着 0 到 9。第一趟只看个位，把每张卡片放进对应盒子；然后从 0 号盒到 9 号盒依次把卡片拿出来，排成一列。第二趟只看十位，再放进同样的盒子并依次取出。因为每次放卡片都放在盒底、取卡片都从盒口，低位已经排好的次序不会被破坏。',
    en: 'Imagine ten small boxes labelled 0 to 9. In the first pass, look only at the units digit and place each card into its box; then take cards out from box 0 through box 9 in order. The second pass looks only at the tens digit and repeats. Because cards are appended at the back and removed from the front of each box, the order established by lower digits survives.',
  },
  prerequisites: {
    zh: ['会用整除与取余取出某一位数字', '理解“稳定”意味着相等键保持原相对次序', '知道桶是 FIFO 队列，不是随意堆叠'],
    en: ['Extracting a digit with division and remainder', 'Understanding that stable means equal keys keep their relative order', 'Knowing a bucket is a FIFO queue, not an arbitrary pile'],
  },
  complexity: {
    time: 'O(d(n + k))，d 为最大位数，k=10 为基数',
    space: 'O(n + k)（记录引用/链节点与 10 个桶）',
    note: {
      zh: '若关键字是 0–9999 的十进制整数，d 最多 4，k=10，因此时间可写成 O(4(n+10))，即 O(n)。但这不是“所有输入都 O(n)”的普适结论：位数由关键字范围决定。每趟分配扫描 n 条记录，收集扫描 10 个桶；d 趟总代价 O(d(n+10))。桶内稳定是正确性的必要条件，不是可选优化。',
      en: 'For decimal keys 0–9999, d is at most 4 and k=10, so the time is O(4(n+10)), i.e. O(n). This is not a universal claim for every key domain: the digit count is determined by the key range. Each pass scans n records to distribute and ten buckets to collect; d passes cost O(d(n+10)). Stability inside buckets is required for correctness, not an optional optimisation.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 读入序列，确定最大位数', en: '① Read the sequence and find the digit count' },
      explanation: {
        zh: '真实 Python 校验所有输入都是非负整数且不超过 9999，然后按真实最大值计算 maxDigits。例如 802 有 3 位，0 也占 1 位；maxDigits 决定需要跑几趟。此时还没有分配或收集。',
        en: 'Real Python validates that every input is a non-negative integer no greater than 9999, then derives maxDigits from the actual maximum. For example, 802 has three digits and 0 counts as one digit; maxDigits determines the number of passes. Nothing has been distributed or collected yet.',
      },
      tip: {
        zh: '不能静默对负数取绝对值，也不能丢弃负号；当前模型明确拒绝负数。',
        en: 'Never silently absolute-value negatives or drop the minus sign; this model rejects them explicitly.',
      },
    },
    {
      stepId: 'digit-start',
      title: { zh: '② 选择当前数位，清空桶', en: '② Choose the active digit and clear buckets' },
      explanation: {
        zh: '第 pass 趟从 0 开始计数，当前位权是 10 的 pass 次幂。个位趟的位权是 1；十位趟是 10。桶 0–9 全部清空，准备接收本趟记录。位权决定用整除后取余得到的数字。',
        en: 'Pass numbering starts at 0; the active place value is 10 to the pass power. The units pass uses 1 and the tens pass uses 10. Buckets 0–9 are cleared to receive this pass’s records. The place value determines the digit obtained by integer division followed by remainder.',
      },
      tip: {
        zh: '当前位数字 = (value // 10^pass) % 10；不足位自然得到 0。',
        en: 'Current digit = (value // 10^pass) % 10; missing places naturally yield 0.',
      },
    },
    {
      stepId: 'distribute',
      title: { zh: '③ 逐项读取当前位，稳定放入桶', en: '③ Read each digit and append to its bucket' },
      explanation: {
        zh: '按当前序列从左到右扫描每条记录，计算它的当前位数字，然后追加到对应桶的尾部。桶内顺序就是记录进入桶的顺序，绝不插入到中间或按值重排。序列本身在本阶段保持不变。',
        en: 'Scan the current sequence left to right, compute each record’s active digit, and append it to the back of the matching bucket. Bucket order is exactly arrival order; never insert in the middle or reorder by value. The sequence itself is unchanged during this stage.',
      },
      tip: {
        zh: '桶内一乱，低位趟建立的次序就会被破坏，最终结果可能错误。',
        en: 'If bucket order is disturbed, the order established by lower passes breaks and the final result can be wrong.',
      },
    },
    {
      stepId: 'collect',
      title: { zh: '④ 按桶号 0–9 依次收集', en: '④ Collect buckets 0 through 9 in order' },
      explanation: {
        zh: '从 0 号桶开始，把桶内记录按 FIFO 顺序接到收集序列尾部，再处理 1 号桶，直到 9 号桶。空桶直接跳过。收集完成的前缀是真实结果，不是预测动画；本趟全部桶处理完后才整体替换原序列。',
        en: 'Starting at bucket 0, append its records in FIFO order to the collected sequence, then bucket 1, through bucket 9. Empty buckets are skipped. The collected prefix is real output, not a predicted animation; only after every bucket is processed does the pass replace the sequence.',
      },
      tip: {
        zh: '桶号必须按 0→9 升序收集；先收 9 号桶会直接破坏数值次序。',
        en: 'Buckets must be collected in ascending 0→9 order; collecting bucket 9 first immediately destroys numeric order.',
      },
    },
    {
      stepId: 'pass-end',
      title: { zh: '⑤ 本趟结束，替换当前序列', en: '⑤ End the pass and replace the sequence' },
      explanation: {
        zh: '十个桶都收集完毕后，用收集结果整体替换当前序列。此时序列已经按“当前位及更低各位”有序；更高位尚未处理，所以整体看起来可能还不是最终升序。然后进入下一趟，位权乘以 10。',
        en: 'Once all ten buckets are collected, replace the current sequence with the collection. The sequence is now ordered by the active digit and all lower digits; higher digits are not processed yet, so it may not look fully sorted. The next pass then multiplies the place value by ten.',
      },
      tip: {
        zh: '每趟结束只保证“低位有序”，不要用完整比较排序偷偷修正结果。',
        en: 'A pass guarantees only lower-digit order; never secretly run a comparison sort to fix the result.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑥ 所有数位处理完，得到稳定升序', en: '⑥ All digits done: stable ascending order' },
      explanation: {
        zh: '最高位也完成分配和收集后，序列按完整关键字升序。相同关键字的记录始终保持输入时的相对次序，因为每一趟的桶都是稳定 FIFO。排序结束时每条记录恰好被访问 d 次，没有发生任何两两关键字比较。',
        en: 'After the highest digit is distributed and collected, the sequence is ascending by the full key. Records with equal keys retain their input relative order because every bucket is a stable FIFO. At completion each record was visited exactly d times, and no pairwise key comparison ever occurred.',
      },
      tip: {
        zh: '记忆重点：取位 → 入桶 → 0–9 收集 → 换序列 → 更高位；桶内稳定是正确性核心。',
        en: 'Memory hook: extract digit → bucket append → collect 0–9 → replace sequence → next higher digit; bucket stability is the core of correctness.',
      },
    },
  ],
  commonMistakes: {
    zh: [
      '从最高位开始处理（MSD）却没有递归分组，得到错误次序。',
      '桶内按关键字重新排序，破坏低位趟已经建立的稳定次序。',
      '收集时从 9 号桶往 0 号桶取，方向反了。',
      '对负数直接取绝对值或丢掉负号，改变关键字含义。',
      '只按元素个数决定趟数，而不是按真实最大位数。',
      '最后一趟用比较排序“修正”结果，掩盖基数排序本身的错误。',
    ],
    en: [
      'Processing the most significant digit first (MSD) without recursive grouping, producing the wrong order.',
      'Reordering a bucket by key, destroying the stable order established by lower passes.',
      'Collecting bucket 9 down to 0, i.e. the reverse direction.',
      'Absolute-valuing negatives or dropping the minus sign, changing the key’s meaning.',
      'Choosing the pass count from the number of records instead of the true maximum digit count.',
      'Using a comparison sort in the final pass to “fix” the result and hide a radix bug.',
    ],
  },
};
