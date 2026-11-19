import type { Lesson } from './types';

/**
 * Simple selection sort, matched to the real Python `lesson_step` values:
 * init, select-start, select-compare, select-candidate, select-swap,
 * select-done, done.
 */
export const selectionSortLesson: Lesson = {
  lessonId: 'selection-sort-basics',
  algorithmId: 'selection',
  contentVersion: '1.0.0',
  title: { zh: '简单选择排序：每轮锁定一个最小值', en: 'Selection sort: lock one minimum per pass' },
  oneLiner: {
    zh: '每一轮扫描未排序区，记住最小值的下标，最后把它与未排序区的第一个位置交换。',
    en: 'Scan the unsorted suffix, remember the index of the smallest value, and swap it with the first unsorted slot once at the end of the pass.',
  },
  overview: {
    zh: '选择排序把数组分成“已确定前缀”和“未排序后缀”。第 i 轮从后缀里选出最小值，放到位置 i。它和冒泡排序一样是 O(n²)，但交换次数很少——每轮最多一次。标准交换式选择排序通常不稳定：远方的最小值可能跨过相等元素，改变它们的相对顺序。',
    en: 'Selection sort splits the array into a fixed prefix and an unsorted suffix. Pass i selects the minimum of the suffix and puts it at index i. Like bubble sort it is O(n²), but it performs very few swaps — at most one per pass. The standard swap version is usually unstable: a distant minimum can jump over equal keys and reverse their relative order.',
  },
  intuition: {
    zh: '把未排序区想成一排待挑的球。你先假定第一个球最小，然后依次看后面的球：只要发现更小的，就把“当前最小”的标记移到它身上。整排看完后，把标记的球和第一个球交换。下一轮从第二个位置开始，已经放好的球不再参与。',
    en: 'Treat the unsorted suffix as a row of balls. Assume the first ball is the minimum, then inspect each later ball: whenever a smaller one appears, move the “current minimum” marker to it. After the scan, swap the marked ball with the first slot. The next pass starts one slot later and never touches the fixed prefix again.',
  },
  prerequisites: {
    zh: ['会使用数组下标和 for 循环', '理解“交换两个元素”需要暂存其中一个值', '知道前缀与后缀的边界如何随轮次移动'],
    en: ['Using array indices and for-loops', 'Knowing a swap needs one value held temporarily', 'Understanding how the prefix/suffix boundary moves each pass'],
  },
  complexity: {
    time: 'O(n²)（最好、平均、最坏）',
    space: 'O(1)',
    note: {
      zh: '无论输入是否已经有序，第 i 轮都必须把后缀完整扫描一遍，比较次数为 (n-1)+(n-2)+…+1 = n(n-1)/2，所以最好、平均、最坏都是 O(n²)。交换最多 n-1 次。额外空间只有 i、j、最小值下标和一次交换的临时值，是 O(1)。',
      en: 'Whether the input is sorted or not, pass i scans the entire suffix, so comparisons are (n-1)+(n-2)+…+1 = n(n-1)/2: best, average and worst are all O(n²). There are at most n-1 swaps. Extra space is only i, j, the minimum index and one temporary swap value — O(1).',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 初始化', en: '① Initialise' },
      explanation: {
        zh: '读入真实数组。此时已排序前缀长度为 0，整个数组都属于未排序区。',
        en: 'Read the real array. The sorted prefix has length 0, so the whole array is unsorted.',
      },
      tip: { zh: '记住：选择排序每一轮只确定一个位置，不会提前知道后面的顺序。', en: 'Remember: each pass fixes exactly one slot; later positions are still unknown.' },
    },
    {
      stepId: 'select-start',
      title: { zh: '② 设定本轮最小候选', en: '② Seed the minimum candidate' },
      explanation: {
        zh: '第 i 轮先把候选下标设为 i，也就是未排序区的第一个位置。候选只是一个“目前见过的最小值”，还不一定是全局最小。',
        en: 'Pass i first sets the candidate index to i, the first slot of the unsorted suffix. The candidate is only the smallest value seen so far, not necessarily the final minimum.',
      },
      tip: { zh: '候选指针从后缀起点出发，后面可能被更小的值带走。', en: 'The candidate starts at the suffix boundary and may move when a smaller value appears.' },
    },
    {
      stepId: 'select-compare',
      title: { zh: '③ 扫描并比较', en: '③ Scan and compare' },
      explanation: {
        zh: '依次比较 a[j] 与当前候选 a[m]。这一帧只读取两个值，不修改数组；候选只在严格更小时才移动。',
        en: 'Compare a[j] with the current candidate a[m]. This frame only reads two values and does not modify the array; the candidate moves only when the new value is strictly smaller.',
      },
      tip: { zh: '相等时不更新候选，这也是选择排序可能不稳定的原因之一。', en: 'Equal values do not move the candidate — one reason the standard version can be unstable.' },
    },
    {
      stepId: 'select-candidate',
      title: { zh: '④ 更新最小值候选', en: '④ Move the minimum candidate' },
      explanation: {
        zh: '当 a[j] < a[m] 时，把候选下标改成 j。数组内容仍然不变，改变的只是“当前最小”的标记。',
        en: 'When a[j] < a[m], the candidate index becomes j. The array is unchanged; only the “current minimum” marker moves.',
      },
      tip: { zh: '把候选看成一个指针，而不是把值搬来搬去。', en: 'Think of the candidate as a pointer, not as a value being moved around.' },
    },
    {
      stepId: 'select-swap',
      title: { zh: '⑤ 轮末交换', en: '⑤ Swap at the end of the pass' },
      explanation: {
        zh: '扫描结束后，候选就是后缀中的真实最小值。把它与位置 i 交换，最小值落到已排序前缀的末尾。若候选本来就在 i，则是一次原地不动。',
        en: 'After the scan, the candidate is the true minimum of the suffix. Swap it with slot i so the minimum lands at the end of the sorted prefix. If the candidate was already i, nothing moves.',
      },
      tip: { zh: '一轮只有这一次交换；这是选择排序写入次数少的关键。', en: 'There is exactly one swap per pass — the reason selection sort performs so few writes.' },
    },
    {
      stepId: 'select-done',
      title: { zh: '⑥ 本轮完成，前缀扩大', en: '⑥ Pass complete, prefix grows' },
      explanation: {
        zh: '位置 i 已经永久确定，已排序前缀从 i 个元素变成 i+1 个。下一轮从 i+1 开始，重复“设定候选、扫描、交换”。',
        en: 'Slot i is now final, and the sorted prefix grows from i to i+1 elements. The next pass starts at i+1 and repeats seed, scan and swap.',
      },
      tip: { zh: '第 i 轮结束后，前 i+1 个位置一定非递减有序。', en: 'After pass i, the first i+1 slots are non-decreasing.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑦ 排序完成', en: '⑦ Sorting complete' },
      explanation: {
        zh: '最后一轮结束后整个数组升序。排序前后元素多重集不变，只是位置改变。',
        en: 'After the last pass the whole array is ascending. The multiset of values is unchanged; only positions changed.',
      },
      tip: { zh: '选择排序的比较次数固定，已有序输入也不会更快。', en: 'Selection sort always performs the same comparison count; an already sorted input is not faster.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把候选的“值”复制出来，却忘记记下标，轮末不知道该和哪个位置交换。',
      '每发现一个更小值就立刻交换，把选择排序写成了不稳定的连续交换版本。',
      '内层循环从 i 而不是 i+1 开始，让自己和自己比较，或把已排序前缀重新卷进后缀。',
      '误以为选择排序稳定；标准交换会把远方的最小值跨过相等元素。',
    ],
    en: [
      'Copying the candidate value but not its index, so the final swap has no target.',
      'Swapping immediately on every smaller value, turning selection sort into an unstable sequence of exchanges.',
      'Starting the inner loop at i instead of i+1, comparing an element with itself or re-including the sorted prefix.',
      'Assuming selection sort is stable; the standard swap can move a distant minimum across equal keys.',
    ],
  },
};
