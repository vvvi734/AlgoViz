import type { Lesson } from './types';

/**
 * Merge sort course matched to the real Python `lesson_step` values:
 * init, merge-split, merge-compare, merge-buffer, merge-writeback.
 *
 * The final `done` frame deliberately shares `merge-writeback`: the last
 * write-back and the whole-array completion are one visible final stage.
 */
export const mergeSortLesson: Lesson = {
  lessonId: 'merge-sort-basics',
  algorithmId: 'merge',
  contentVersion: '1.0.0',
  title: { zh: '归并排序：自顶向下拆分与缓冲区合并', en: 'Merge sort: top-down splitting and buffered merging' },
  oneLiner: {
    zh: '先递归把区间拆到单元素，再把两个有序半区按较小值逐个写入缓冲区并写回原数组。',
    en: 'Recursively split ranges to singletons, then append the smaller value of two sorted halves into a buffer and write it back.',
  },
  overview: {
    zh: '归并排序是稳定的分治排序：把区间二分到单元素（天然有序），再自底向上合并两个有序半区。合并时比较左右候选，较小者先写入独立临时缓冲区；相等时优先取左侧，保证相同键的相对次序不变。整个算法任何输入都是 O(n log n)，但数组实现通常需要 O(n) 辅助空间。这里的缓冲区、左右游标、每次写入和写回都来自真实 Python 执行。',
    en: 'Merge sort is a stable divide-and-conquer sort: split ranges down to singletons (already sorted), then merge two sorted halves bottom-up. During merging, compare the left and right candidates and append the smaller one into a separate temporary buffer; on equality take the left side so equal keys keep their relative order. Every input is O(n log n), but the array implementation usually needs O(n) extra space. The buffer, cursors, every append and write-back all come from real Python execution.',
  },
  intuition: {
    zh: '把数组想成两摞已经排好的卡片。你只需要反复看两摞最上面的牌，把较小的那张放进一个新盒子；一张牌被取走后，那一摞的游标后移。某一摞取空后，把另一摞剩下的牌按原顺序全部放进盒子。盒子装满后，再按顺序倒回原数组的对应区间。',
    en: 'Think of the two sorted halves as two piles of cards. Repeatedly compare the top cards, put the smaller one into a new box, and advance that pile’s cursor. When one pile is empty, copy the rest of the other pile into the box in order. Once the box is full, pour it back into the same range of the original array.',
  },
  prerequisites: {
    zh: ['理解递归拆分与递归返回的顺序', '会维护左右两个游标', '知道临时缓冲区与原地数组是两块不同的存储'],
    en: ['Understanding recursive split and return order', 'Maintaining two cursors for the two halves', 'Knowing the buffer and the original array are separate storage'],
  },
  complexity: {
    time: 'O(n log n)（最好、平均、最坏）',
    space: 'O(n) 辅助空间（数组实现）',
    note: {
      zh: '递归树有 log n 层，每一层的所有合并总共处理 n 个元素，所以最好、平均、最坏都是 O(n log n)，与输入初始顺序无关。数组归并需要一个长度等于当前区间的临时缓冲区，最坏同时只保留一条递归路径上的缓冲区，总量仍是 O(n)。按“相等取左”的规则合并可以保持稳定。',
      en: 'The recursion tree has log n levels and every level merges n elements in total, so best, average and worst are all O(n log n), independent of the input order. The array implementation needs a temporary buffer as long as the current range; along one recursion path the total is still O(n). Merging with “take left on equality” preserves stability.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 读入数组，准备自顶向下拆分', en: '① Read the array for top-down splitting' },
      explanation: {
        zh: '真实 Python 读入数组，尚未拆分或合并。自顶向下归并从整个区间 [0, n-1] 开始，递归树会先一路拆到单元素。',
        en: 'Real Python reads the array before any split or merge. Top-down merge sort starts with the whole range [0, n-1] and the recursion tree first splits all the way to singletons.',
      },
      tip: { zh: '归并排序先“拆到底”，再“合上来”；拆分阶段不产生有序结果。', en: 'Merge sort splits all the way down first, then merges back up; splitting alone produces no sorted result.' },
    },
    {
      stepId: 'merge-split',
      title: { zh: '② 二分区间，单元素返回', en: '② Split the range, singletons return' },
      explanation: {
        zh: '对 [low, high] 取中点 mid=(low+high)//2，拆成 [low, mid] 与 [mid+1, high] 两个非空半区并递归。区间只剩一个元素时天然有序，直接返回；空区间不会被调用。拆分只改变递归结构，不改变主数组。',
        en: 'For [low, high], compute mid=(low+high)//2 and split into two non-empty halves [low, mid] and [mid+1, high], then recurse. A one-element range is already sorted and returns directly; an empty range is never called. Splitting changes only the recursion structure, not the main array.',
      },
      tip: { zh: 'mid 必须保证左右两半都非空；否则递归无法缩小。', en: 'mid must leave both halves non-empty, otherwise recursion cannot shrink.' },
    },
    {
      stepId: 'merge-compare',
      title: { zh: '③ 合并两个有序半区，比较左右候选', en: '③ Merge sorted halves, compare candidates' },
      explanation: {
        zh: '左右半区都已有序后，左游标指向左半区第一个元素，右游标指向右半区第一个元素。每次比较 a[left] 与 a[right]；a[left] ≤ a[right] 时优先取左侧，否则取右侧。相等取左是稳定性的关键。',
        en: 'Once both halves are sorted, the left cursor points at the first element of the left half and the right cursor at the first element of the right half. Compare a[left] with a[right]; take the left when a[left] ≤ a[right], otherwise take the right. Taking left on equality is the key to stability.',
      },
      tip: { zh: '相等时取右侧会反转相同键的相对次序，破坏稳定性。', en: 'Taking the right on equality reverses equal keys and breaks stability.' },
    },
    {
      stepId: 'merge-buffer',
      title: { zh: '④ 较小值写入缓冲区，耗尽后复制剩余', en: '④ Append smaller values, copy the remainder' },
      explanation: {
        zh: '被选中的候选值写入临时缓冲区的下一个真实槽位，来源下标和缓冲区位置都记录在帧里。某一侧耗尽后，另一侧剩余元素按原顺序继续追加。缓冲区不是主数组，也不会被渲染成排序完成的柱。',
        en: 'The chosen candidate is appended into the next real buffer slot; both its source index and buffer position are recorded in the frame. When one side is exhausted, the remaining elements of the other side are appended in order. The buffer is separate from the main array and is never drawn as a sorted main bar.',
      },
      tip: { zh: '缓冲区长度等于当前区间长度时，合并数据才完整。', en: 'The merge data is complete only when the buffer length equals the current range length.' },
    },
    {
      stepId: 'merge-writeback',
      title: { zh: '⑤ 写回原数组，区间完成', en: '⑤ Write back and finish the range' },
      explanation: {
        zh: '缓冲区完整后，逐个槽位覆盖回原数组的 [low, high]；每次写回都对应真实下标。写回完成后整个区间有序并标记为已归并，父调用把它当作一个有序半区。最顶层完成后整个数组升序，元素多重集与输入一致。',
        en: 'Once the buffer is complete, copy it back slot by slot into [low, high]; each write-back names the real array index. The whole range is then sorted and marked merged, and the parent treats it as one sorted half. At the top level the whole array is ascending with the same multiset as the input.',
      },
      tip: { zh: '记忆重点：拆到单元素 → 比较左右候选 → 写缓冲区 → 写回；O(n log n)，O(n) 辅助空间，相等取左保持稳定。', en: 'Memory hook: split to singletons → compare left/right → buffer append → write back; O(n log n), O(n) extra space, take left on equality for stability.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把归并排序画成主数组内的原地交换，忽略独立临时缓冲区。',
      '某一侧耗尽后继续比较越界下标，而不是直接复制另一侧剩余元素。',
      '相等时取右侧，导致相同键的相对次序反转，得到不稳定的结果。',
      '拆分中点取错，出现空半区或重复元素，递归无法正确收敛。',
      '写回时只写一部分，或把缓冲区与主数组混为同一块存储。',
      '用预写动画代替真实 Python 的拆分、比较、缓冲写入和写回帧。',
    ],
    en: [
      'Drawing merge sort as in-place swaps in the main array and omitting the separate temporary buffer.',
      'Continuing to compare an out-of-bounds cursor after one side is exhausted instead of copying the remainder.',
      'Taking the right candidate on equality, reversing equal keys and producing an unstable result.',
      'Computing the wrong midpoint, leaving an empty half or duplicating elements so recursion cannot converge.',
      'Writing back only part of the buffer, or treating the buffer and the main array as the same storage.',
      'Replacing real Python split, compare, buffer-append and write-back frames with prewritten animation.',
    ],
  },
};
