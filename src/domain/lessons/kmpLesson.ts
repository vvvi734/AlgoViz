import type { Lesson } from './types';

/**
 * STR-01 KMP course. Step ids are the exact `lesson_step` values emitted by
 * the real Python source in `kmpExamples.ts`.
 */
export const kmpLesson: Lesson = {
  lessonId: 'kmp-pattern-matching',
  algorithmId: 'kmp',
  contentVersion: '1.0.0',
  title: { zh: 'KMP 模式匹配：前缀表与不回退的主串指针', en: 'KMP pattern matching: prefix table and a non-backtracking text pointer' },
  oneLiner: {
    zh: '先构造模式串的前缀表 lps，再让模式串在失配时按 lps 重新对齐，同时找出全部匹配位置（包括重叠匹配）。',
    en: 'Build the pattern’s lps table first, then realign the pattern on a mismatch and report every occurrence, including overlaps.',
  },
  overview: {
    zh: '朴素模式匹配在每个起点重新比较，失配后把主串起点右移一格，往往重新检查刚刚已经匹配过的一段字符。KMP 把“已匹配前缀的后缀同时也是模式串前缀”这一信息存进 lps 表：失配时只把模式串指针 j 回退到 lps[j-1]，主串指针 i 继续向前。构造 lps 需要 O(m)，扫描主串需要 O(n)，总时间 O(n+m)，额外空间 O(m)。本课统一采用从 0 开始的 lps 定义；其他教材的 next / nextval 可能使用不同下标约定，不能混用。',
    en: 'Naive matching restarts at every text position and often rechecks a segment that has just matched. KMP stores the fact that a suffix of the matched prefix is also a prefix of the pattern in the lps table: on a mismatch only the pattern pointer j falls back to lps[j-1], while text pointer i keeps moving forward. Building lps costs O(m), scanning costs O(n), so the total is O(n+m) with O(m) extra space. This course uses the 0-based lps convention; other textbooks may use a shifted next/nextval array, and the conventions must not be mixed.',
  },
  intuition: {
    zh: '把模式串想成一把带刻度的尺子。已经对上的那一段字符里，开头和结尾可能有一段相同的“边框”；失配时不需要把尺子退回起点，只要把尺子向右滑，让这段边框重新对齐主串已经确认的后缀。lps[k] 记录的就是 pattern[0..k] 最长的这种边框长度。主串 i 只前进不后退，因此不会重复扫描已经确认的字符。',
    en: 'Picture the pattern as a ruler with markings. The part that already matched may have a border: a prefix that is also a suffix. On a mismatch the ruler does not go back to the start; it slides right so that this border aligns with the confirmed suffix of the text. lps[k] stores the longest such border of pattern[0..k]. Text pointer i only moves forward, so confirmed characters are never scanned twice.',
  },
  prerequisites: {
    zh: ['理解字符串下标与子串', '知道前缀、后缀和真前缀/真后缀', '能区分主串指针 i 与模式串指针 j', '理解 while 循环中的回退不会让 i 减小'],
    en: ['String indices and substrings', 'Prefix, suffix, proper prefix and proper suffix', 'The difference between text pointer i and pattern pointer j', 'Why a while-loop fallback never decreases i'],
  },
  complexity: {
    time: 'O(n + m)',
    space: 'O(m)',
    note: {
      zh: '构造 lps 时，j 只会增加或沿着 lps 回退，整体均摊 O(m)；匹配时 i 不回头，j 的回退也由已匹配长度支付，整体 O(n)。总时间 O(n+m)。只额外保存长度为 m 的 lps 表和常数个指针，辅助空间 O(m)。',
      en: 'While building lps, j only grows or falls back through lps, so the build is amortized O(m). During matching i never moves back and j’s fallbacks are paid for by the matched prefix length, giving O(n). Total O(n+m); the only extra structure is the m-entry lps table, so O(m) space.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 读入主串与模式串', en: '① Read the text and pattern' },
      explanation: {
        zh: '真实 Python 先保存主串 T、模式串 P，并建立全零的 lps 表。这一帧没有任何比较，也不是预先写死的结果；lps 的每个值稍后都由循环写入。',
        en: 'Real Python stores text T and pattern P, then allocates an all-zero lps table. This frame performs no comparison and contains no prewritten result; every lps entry is filled later by the loop.',
      },
      tip: { zh: '记忆：先有真实输入，再有真实前缀表。', en: 'Memory hook: real input first, real prefix table second.' },
    },
    {
      stepId: 'build-start',
      title: { zh: '② 固定 lps[0]=0', en: '② Fix lps[0]=0' },
      explanation: {
        zh: '长度为 1 的前缀没有真前缀，因此 lps[0] 必为 0。随后令 i=1、j=0：i 扫描模式串，j 表示当前已经匹配的前缀长度。',
        en: 'A one-character prefix has no proper prefix, so lps[0] is always 0. Then i=1 and j=0: i scans the pattern while j is the length of the prefix currently matched.',
      },
      tip: { zh: 'lps[0] 不需要比较，直接为 0。', en: 'lps[0] needs no comparison and is always 0.' },
    },
    {
      stepId: 'build-compare',
      title: { zh: '③ 比较 pattern[i] 与 pattern[j]', en: '③ Compare pattern[i] with pattern[j]' },
      explanation: {
        zh: '这是构造前缀表的核心比较。相等时可以把当前前缀延长一位；不相等时不能直接把 j 清零，而要检查是否还能沿 lps 找到更短的可复用前缀。',
        en: 'This is the core comparison of the table build. Equality extends the current prefix by one; on inequality j cannot simply reset to zero, because a shorter reusable prefix may still exist through lps.',
      },
      tip: { zh: 'j 表示长度，不只是普通下标；pattern[j] 是待扩展位置。', en: 'j is a length, not just another index; pattern[j] is the position being extended.' },
    },
    {
      stepId: 'build-fallback',
      title: { zh: '④ 构造时失配，j 回退', en: '④ Fall back while building' },
      explanation: {
        zh: '当 pattern[i] 与 pattern[j] 不等且 j>0 时，j 变成 lps[j-1]。这一步保留“已经确认的较长前缀的后缀”，用更短的候选前缀继续比较；i 始终不动。',
        en: 'When pattern[i] differs from pattern[j] and j>0, j becomes lps[j-1]. This keeps the suffix of the previously confirmed longer prefix and retries with a shorter candidate; i does not move.',
      },
      tip: { zh: '回退公式固定为 j = lps[j-1]，不是 lps[j]。', en: 'The fallback is exactly j = lps[j-1], not lps[j].' },
    },
    {
      stepId: 'build-record',
      title: { zh: '⑤ 写入 lps[i]', en: '⑤ Write lps[i]' },
      explanation: {
        zh: '相等时 j 先加一，再把 j 写入 lps[i]；j=0 且仍失配时写入 0，然后 i 前进。无论哪种分支，每个 i 只写入一次，因此表值来自真实比较与回退。',
        en: 'On equality j is incremented first and then written into lps[i]; when j=0 still mismatches, lps[i] becomes 0 and i advances. Either branch writes each i exactly once, so every table value comes from a real comparison or fallback.',
      },
      tip: { zh: '先更新 j，再记录；记录的是前缀长度。', en: 'Update j first, then record the prefix length.' },
    },
    {
      stepId: 'build-complete',
      title: { zh: '⑥ 前缀表构建完成', en: '⑥ Prefix table complete' },
      explanation: {
        zh: 'i 走到模式串末尾后，lps 的所有项都已确定。例如 pattern = ABABC 时，lps = [0,0,1,2,0]：最后一项为 0，因为 ABABC 没有非空真前缀同时是后缀。',
        en: 'After i reaches the end of the pattern every lps entry is final. For example, pattern = ABABC gives lps = [0,0,1,2,0]; the last entry is 0 because ABABC has no non-empty proper prefix that is also a suffix.',
      },
      tip: { zh: '先检查 lps 长度是否等于 m，再进入匹配阶段。', en: 'Check that lps has exactly m entries before matching.' },
    },
    {
      stepId: 'search-start',
      title: { zh: '⑦ 匹配从 i=0, j=0 开始', en: '⑦ Start matching at i=0, j=0' },
      explanation: {
        zh: '主串指针 i 和模式串指针 j 都从 0 开始。匹配循环中 i 只增不减；j 可以沿 lps 回退，但它回退的是模式串内部的对齐位置。',
        en: 'Both text pointer i and pattern pointer j start at 0. In the matching loop i never decreases; j may fall back through lps, but that only realigns the pattern internally.',
      },
      tip: { zh: '区分“主串位置”和“模式串已匹配长度”。', en: 'Separate the text position from the matched pattern length.' },
    },
    {
      stepId: 'search-compare',
      title: { zh: '⑧ 比较 text[i] 与 pattern[j]', en: '⑧ Compare text[i] with pattern[j]' },
      explanation: {
        zh: '相等时两个指针一起前进；不等时若 j>0 就进入回退，若 j=0 则当前主串位置不可能成为起点，i 前进一格。整个过程中不回退 i。',
        en: 'On equality both pointers advance; on inequality, j>0 triggers a fallback, while j=0 means the current text position cannot start a match and i advances once. Text pointer i never moves back.',
      },
      tip: { zh: '当前 i 与 j 都来自真实帧，不由帧号推算。', en: 'Live i and j come from the real frame, not from the frame index.' },
    },
    {
      stepId: 'search-advance',
      title: { zh: '⑨ 匹配成功一个字符，指针前进', en: '⑨ One character matched; advance both pointers' },
      explanation: {
        zh: '相等后 i 和 j 同时加一，已匹配前缀变长一位。只要 j 还没到 m，就继续比较下一个字符；主串已经读取的字符不会重新扫描。',
        en: 'After equality i and j both increase by one and the matched prefix grows. Until j reaches m, the next characters are compared; text characters already read are not scanned again.',
      },
      tip: { zh: '匹配阶段正常前进时，i 与 j 的增量都为 1。', en: 'On a normal match advance, both i and j increase by one.' },
    },
    {
      stepId: 'search-fallback',
      title: { zh: '⑩ 匹配时失配，只回退 j', en: '⑩ Mismatch: only j falls back' },
      explanation: {
        zh: '当 text[i] 与 pattern[j] 不等且 j>0 时，令 j=lps[j-1]，i 保持不动。已经确认的主串字符仍然有效，模式串向右滑动到下一个可能对齐位置。',
        en: 'When text[i] differs from pattern[j] and j>0, set j=lps[j-1] while i stays fixed. The confirmed text characters remain valid and the pattern slides to the next possible alignment.',
      },
      tip: { zh: 'KMP 的关键就是这里：i 不回退，j 才回退。', en: 'This is the key: i stays put while j falls back.' },
    },
    {
      stepId: 'search-miss',
      title: { zh: '⑪ j=0 仍失配，i 前进', en: '⑪ Mismatch at j=0; advance i' },
      explanation: {
        zh: '模式串首字符也与 text[i] 不同，当前主串位置不可能成为匹配起点；此时没有更短前缀可试，只能让 i 前进一格。',
        en: 'Even the first pattern character differs from text[i], so this text position cannot start a match. No shorter prefix exists to try, so i advances once.',
      },
      tip: { zh: 'j=0 的失配是唯一需要移动 i 的失配分支。', en: 'The j=0 mismatch is the only mismatch branch that moves i.' },
    },
    {
      stepId: 'match-found',
      title: { zh: '⑫ 找到完整匹配，继续找多个', en: '⑫ Full match; keep searching' },
      explanation: {
        zh: '当 j=m 时，起始位置是 i-m，真实 Python 把它加入匹配列表。随后令 j=lps[m-1] 而不是直接清零，这样模式串可以与同一段主串的后缀重叠，继续找出所有匹配位置。',
        en: 'When j=m, the start is i-m and real Python appends it to the match list. Then j becomes lps[m-1] rather than zero, allowing the pattern to overlap the suffix of the same text segment and find every occurrence.',
      },
      tip: { zh: '若要找多个匹配，匹配完成后 j 不能直接置 0。', en: 'To find every occurrence, j must not simply reset to 0 after a match.' },
    },
    {
      stepId: 'search-done',
      title: { zh: '⑬ 扫描结束，输出全部匹配位置', en: '⑬ Scan complete; output every match start' },
      explanation: {
        zh: '当 i 到达 n 时循环结束，matches 中保存所有真实起点。没有匹配时列表为空；有重叠时也会逐项保留，例如 AAAAA 中查找 AAA 会得到 0、1、2。',
        en: 'The loop ends when i reaches n and matches contains every real start. It is empty when nothing matches; overlapping occurrences are retained, so AAA in AAAAA yields 0, 1 and 2.',
      },
      tip: { zh: '记忆：O(n+m) 时间，O(m) 空间，结果包含重叠匹配。', en: 'Memory hook: O(n+m) time, O(m) space, overlapping matches included.' },
    },
  ],
  commonMistakes: {
    zh: [
      '失配时把 j 写成 lps[j]；本课约定应回退到 lps[j-1]。',
      '把某一本教材的 next 或 nextval 下标约定直接混进来，导致表值整体错位。',
      '匹配失配时错误地移动 i，退化成朴素匹配或跳过候选起点。',
      '找到第一个匹配就结束，或完成后把 j 置 0，漏掉重叠匹配。',
      '把 lps[0] 也拿去比较，或在 pattern 长度为 1 时访问 lps[1]。',
    ],
    en: [
      'Falling back to lps[j] instead of lps[j-1], which is the convention used here.',
      'Mixing in a textbook’s next/nextval indexing convention and shifting the whole table.',
      'Moving i on a mismatch, which either recreates naive matching or skips candidate starts.',
      'Stopping at the first match or resetting j to 0, which loses overlapping occurrences.',
      'Comparing lps[0] as if it needed work, or reading lps[1] when the pattern has length one.',
    ],
  },
};
