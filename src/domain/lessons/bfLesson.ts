import type { Lesson } from './types';

/**
 * BF course. Step ids mirror the real Python program in `bfExamples.ts`; a
 * frame is emitted only after the comparison or shift has actually happened.
 */
export const bfLesson: Lesson = {
  lessonId: 'bf-naive-pattern-matching',
  algorithmId: 'bf',
  contentVersion: '1.0.0',
  title: { zh: '朴素模式匹配（BF）：逐个起点、逐字符比较', en: 'Naive pattern matching (BF): every start, every character' },
  oneLiner: {
    zh: '把模式串依次对齐到每个可能的起点，内层从头逐字符比较；失配就把起点右移一格，从头再来，直到检查完所有起点。',
    en: 'Align the pattern with every possible start and compare from its first character; on a mismatch shift the start right and begin again until no start remains.',
  },
  overview: {
    zh: 'BF（Brute Force，也叫朴素匹配）是最直接的串匹配算法。主串 T 长度为 n，模式串 P 长度为 m，合法起点只有 0..n-m。对每个起点 s，令 j=0，依次比较 T[s+j] 与 P[j]：相同就继续，不同就放弃这个 s，令 s=s+1 后重新从 P[0] 开始。若 j 走到 m，说明整段模式串都相同，记录起点 s。BF 不复用上一次对齐已经确认的前缀，因此失配后可能把同一段主串字符再比较多次；最坏时间为 O(nm)，额外空间只需常数个指针和计数，为 O(1)。本课与 KMP 使用同一套语义：0 基下标、返回全部匹配起点、允许重叠；空主串合法并返回空列表，空模式串会被拒绝。',
    en: 'BF (brute force, also called naive matching) is the most direct string-matching algorithm. With text T of length n and pattern P of length m, the only legal starts are 0..n-m. For each start s set j=0 and compare T[s+j] with P[j]: equality continues, inequality discards this s, moves s right by one and restarts at P[0]. If j reaches m, the whole pattern matched and s is recorded. BF reuses nothing from the previous alignment, so a mismatch can force the same text characters to be compared again; the worst case is O(nm) time and O(1) extra space. This course shares KMP’s contract: 0-based indices, every match start, overlaps allowed; empty text is legal and yields an empty list, while an empty pattern is rejected.',
  },
  intuition: {
    zh: '像拿一张透明模式串卡片在主串上滑动：每次把卡片左边对准一个位置，从卡片第一个字符开始逐个核对；只要有一个字符不同，就把卡片整体向右挪一格，重新从第一个字符核对。因为卡片不会记住上次已经核对到哪一位，所以同一个主串字符可能被不同的对齐反复检查。',
    en: 'Picture sliding a transparent pattern card across the text: align its left edge with a position, then check from the card’s first character. One mismatch moves the whole card one place right and restarts from the first character. The card remembers nothing from the previous alignment, so the same text character can be checked repeatedly by different alignments.',
  },
  prerequisites: {
    zh: ['理解主串、模式串和 0 基下标', '知道子串与匹配起点的含义', '能写出两层循环并区分外层起点 s 与内层下标 j'],
    en: ['Text, pattern and 0-based indices', 'Substrings and what a match start means', 'Two nested loops with an outer start s and an inner index j'],
  },
  complexity: {
    time: 'O(nm)',
    space: 'O(1)',
    note: {
      zh: '最坏情况下每个起点都要比较到模式串末尾才失配，例如 T=AAAA...A、P=AAA...AB，总比较次数约为 (n-m+1)·m，因此为 O(nm)。最好情况是第一个起点就完整匹配，为 O(m)。BF 只保存起点、j、计数和结果列表，额外空间不随输入规模增长，为 O(1)（结果列表本身不计入辅助空间）。',
      en: 'In the worst case every start compares almost the whole pattern before failing, e.g. T=AAAA...A and P=AAA...AB, giving about (n-m+1)·m comparisons and O(nm) time. The best case matches at the first start in O(m). BF stores only a start, j, counters and the result list, so extra space is O(1) excluding the returned list.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 读入主串与模式串', en: '① Read the text and pattern' },
      explanation: {
        zh: '真实 Python 读取 T 与 P，建立空匹配列表、每个主串字符的比较次数表 seen、候选起点计数 checked 和总比较计数 comparisons。这一帧没有比较，也没有预写结果。',
        en: 'Real Python reads T and P and creates an empty match list, a per-text-character comparison count seen, a checked-start counter and a total comparison counter. This frame performs no comparison and contains no prewritten result.',
      },
      tip: { zh: 'seen 记录每个主串字符被比较了多少次，后面用来显示“被重新扫描”。', en: 'seen counts comparisons per text character and later drives the “rescanned” badge.' },
    },
    {
      stepId: 'candidate-start',
      title: { zh: '② 选择一个候选起点 s', en: '② Pick a candidate start s' },
      explanation: {
        zh: '外层循环让 s 从 0 走到 n-m。每个 s 都代表模式串首字符对齐到主串的这个位置；进入内层前 j 重置为 0，表示还没有任何字符被确认相同。',
        en: 'The outer loop runs s from 0 to n-m. Each s aligns the pattern’s first character with this text position; j resets to 0 before the inner loop, meaning no character is confirmed yet.',
      },
      tip: { zh: '合法起点必须满足 s ≤ n-m，否则模式串会越过主串末尾。', en: 'A legal start must satisfy s ≤ n-m, or the pattern would run past the text.' },
    },
    {
      stepId: 'compare',
      title: { zh: '③ 比较 T[s+j] 与 P[j]', en: '③ Compare T[s+j] with P[j]' },
      explanation: {
        zh: '这是 BF 唯一真正读取字符的地方。真实程序先让 seen[s+j] 与 comparisons 各加一，再判断两个字符是否相同；因此画面上的比较次数和重新扫描徽标都来自实际执行，不是估算。',
        en: 'This is the only place BF actually reads characters. Real Python increments seen[s+j] and comparisons before testing equality, so both the counters and the rescanned badges come from real execution rather than estimates.',
      },
      tip: { zh: '当前比较位置由 s+j 决定；j 是模式串内偏移，不是主串绝对下标。', en: 'The compared text position is s+j; j is a pattern offset, not an absolute text index.' },
    },
    {
      stepId: 'advance',
      title: { zh: '④ 字符相同，j 前进', en: '④ Characters equal, advance j' },
      explanation: {
        zh: '相等时只让 j 加一，s 保持不变。若 j 还没到 m，说明模式串前缀又确认了一位，继续比较 T[s+j] 与 P[j]；外层起点没有变化。',
        en: 'On equality only j increases; s stays fixed. If j has not reached m, one more pattern prefix character is confirmed and the next pair T[s+j], P[j] is compared at the same start.',
      },
      tip: { zh: '相同字符不会移动起点，只会让内层指针右移。', en: 'A matching character never moves the start; it only advances the inner pointer.' },
    },
    {
      stepId: 'mismatch',
      title: { zh: '⑤ 失配，起点整体右移', en: '⑤ Mismatch, shift the whole alignment' },
      explanation: {
        zh: '只要 T[s+j] 与 P[j] 不同，当前起点就不可能产生完整匹配。BF 不尝试利用已经匹配的前缀，直接令 s=s+1、j=0，回到外层循环。刚才比较过的主串字符会在新的对齐下重新被比较，seen 因此可能大于 1。',
        en: 'As soon as T[s+j] differs from P[j], this start cannot produce a full match. BF does not reuse the matched prefix: it sets s=s+1 and j=0 and returns to the outer loop. Text characters just compared may be compared again under the new alignment, so seen can exceed 1.',
      },
      tip: { zh: '失配后 j 直接清零，这正是 BF 与 KMP 的核心差别。', en: 'Resetting j to 0 on a mismatch is exactly where BF differs from KMP.' },
    },
    {
      stepId: 'match-found',
      title: { zh: '⑥ j 走到 m，记录一个匹配', en: '⑥ j reaches m, record a match' },
      explanation: {
        zh: '当 j 增加到 m，模式串每一位都与 T[s..s+m-1] 相同，真实程序把 s 加入 matches。记录后仍然令 s=s+1 继续外层循环，所以像 AAAAA 中查找 AAA 会得到 0、1、2 三个重叠匹配。',
        en: 'When j reaches m, every pattern character equals T[s..s+m-1] and real Python appends s to matches. It still moves s to s+1 and continues the outer loop, so AAA in AAAAA yields the overlapping starts 0, 1 and 2.',
      },
      tip: { zh: '找到一个匹配后不能提前结束，否则会漏掉后面的重叠匹配。', en: 'Do not stop at the first hit, or later overlapping matches are lost.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑦ 所有起点检查完毕', en: '⑦ Every start has been checked' },
      explanation: {
        zh: 's 超过 n-m 后外层循环结束，matches 保存全部真实起点。若 n<m，则一个合法起点都不存在，程序在 init 后直接发出 done，matches 为空；空主串也走这条路径。',
        en: 'Once s exceeds n-m the outer loop ends and matches holds every real start. If n<m there is no legal start at all, so after init the program emits done directly with an empty matches list; empty text follows the same path.',
      },
      tip: { zh: 'done 帧的 checked 应等于 max(0, n-m+1)，matches 应与逐个起点验证的结果一致。', en: 'In the done frame, checked should equal max(0, n-m+1) and matches should agree with start-by-start verification.' },
    },
  ],
  commonMistakes: {
    zh: [
      '外层起点写成 s < n，导致 s+j 越界访问主串。',
      '失配后只把 j 清零却忘了把 s 右移，程序会在同一对齐上死循环。',
      '把 j 当作主串绝对下标，比较时误写成 T[j] 而不是 T[s+j]。',
      '找到一个匹配就 break 或 return，漏掉后面的重叠匹配。',
      '把空模式串当作“处处匹配”，没有在入口拒绝它。',
      '用比较次数估算 seen，却没有在每次真实比较时同步增加。',
    ],
    en: [
      'Using s < n for the outer loop, which lets s+j read past the end of the text.',
      'Resetting j on a mismatch but forgetting to move s, which loops forever at the same alignment.',
      'Treating j as an absolute text index and comparing T[j] instead of T[s+j].',
      'Breaking or returning at the first hit, which drops later overlapping matches.',
      'Treating an empty pattern as matching everywhere instead of rejecting it at the entrance.',
      'Estimating seen from the comparison total instead of incrementing it on every real comparison.',
    ],
  },
};
