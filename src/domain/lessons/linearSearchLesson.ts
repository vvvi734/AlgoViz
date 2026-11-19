import type { Lesson } from './types';

/**
 * F1 linear search course, matched to the real Python lesson steps:
 * init, scan-start, scan-compare, scan-next, done.
 */
export const linearSearchLesson: Lesson = {
  lessonId: 'linear-search-basics',
  algorithmId: 'linear',
  contentVersion: '1.0.0',
  title: { zh: '顺序查找：从左侧逐个检查', en: 'Linear search: inspect from the left' },
  oneLiner: {
    zh: '从索引 0 开始逐个比较，遇到第一个匹配就返回，全部检查完仍未匹配则返回 -1。',
    en: 'Start at index 0, compare one slot at a time, return the first match, or -1 after every slot has been checked.',
  },
  overview: {
    zh: '顺序查找（线性查找）不要求数组有序，也不需要额外空间。它从左侧开始，每次只看一个元素；最理想的情况是第一个元素就命中，最好时间复杂度 O(1)；平均和最坏要把 n 个元素走完，时间复杂度 O(n)，额外空间 O(1)。它适合较小或无序的数据集合，也是理解“已检查 / 当前 / 未检查”三种状态的入口。',
    en: 'Linear search does not require a sorted array and uses no extra space. It scans from the left and inspects one value at a time. The best case is the first slot, O(1); the average and worst cases inspect all n slots, O(n), with O(1) extra space. It fits small or unordered data and is the clearest place to learn the checked / current / pending states.',
  },
  intuition: {
    zh: '把数组想成一排抽屉，目标值是一张要找的卡片。你从最左边开始拉开抽屉：已经拉过的是“已检查”，手正拉着的是“当前”，右边还没拉的是“未检查”。看到卡片就停下并返回它的位置；全部拉完都没有，就明确返回 -1。因为数组不要求有序，不能根据大小跳过任何抽屉。',
    en: 'Picture the array as a row of drawers and the target as a card. Start at the far left: drawers already opened are checked, the one in your hand is current, and the rest are pending. Stop and return the position as soon as the card matches; if every drawer is empty, return -1 explicitly. Because the array need not be sorted, you cannot skip any drawer based on value.',
  },
  prerequisites: {
    zh: ['能使用数组下标 0..n-1', '理解相等比较与返回 -1 的约定', '知道空数组不能访问下标 0'],
    en: ['Using array indices 0..n-1', 'Understanding equality and the -1 sentinel', 'Knowing an empty array has no index 0'],
  },
  complexity: {
    time: '最好 O(1)；平均与最坏 O(n)',
    space: 'O(1)',
    note: {
      zh: '第一个元素就是目标时只比较一次，最好 O(1)。目标在末尾或不存在时要做 n 次比较，平均约 n/2 次，渐进上界 O(n)。只用了当前下标和结果等常数个变量，额外空间 O(1)。',
      en: 'If the first slot matches, one comparison gives the best case O(1). If the target is last or absent, all n comparisons happen; the average is about n/2, so the asymptotic bound is O(n). Only a current index and result are stored, giving O(1) extra space.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 读入数组与目标值', en: '① Read the array and target' },
      explanation: {
        zh: '真实 Python 先读入数组和目标值。顺序查找不要求数组有序，所以这里不排序、不假设大小关系；空数组也会保留下来，后面直接得到失败结果。',
        en: 'Real Python first reads the array and target. Linear search does not require sorted data, so nothing is sorted and no ordering is assumed; an empty array is preserved and will fail explicitly later.',
      },
      tip: { zh: '记忆：顺序查找只看“是否相等”，不看大小顺序。', en: 'Memory hook: linear search checks equality, not ordering.' },
    },
    {
      stepId: 'scan-start',
      title: { zh: '② 从索引 0 开始', en: '② Start at index 0' },
      explanation: {
        zh: '扫描指针指向第一个元素，已检查集合为空。这里只确定起点，还没有把任何元素与目标值比较。',
        en: 'The scan pointer points at the first element and the checked set is empty. This frame only fixes the starting point; no value has been compared yet.',
      },
      tip: { zh: '空数组没有索引 0，不能伪造一次扫描。', en: 'An empty array has no index 0, so no scan frame is fabricated.' },
    },
    {
      stepId: 'scan-compare',
      title: { zh: '③ 比较当前元素与目标值', en: '③ Compare the current value with the target' },
      explanation: {
        zh: '当前元素只与目标做一次相等比较。相等就立即成功并停止；不相等则进入“移动到下一个位置”的步骤。已检查集合只包含当前位置左侧的元素，当前位置单独作为“正在比较”。',
        en: 'The current value is compared with the target once. Equality succeeds immediately and stops; otherwise the next step advances the pointer. The checked set contains only slots left of the current index, while the current slot is highlighted separately.',
      },
      tip: { zh: '当前比较位置不能提前算进“已检查”。', en: 'The current slot must not be counted as checked yet.' },
    },
    {
      stepId: 'scan-next',
      title: { zh: '④ 不匹配则移动到下一个位置', en: '④ Move to the next slot on a miss' },
      explanation: {
        zh: '不相等时，刚刚比较过的位置变成“已检查”，指针真正向后移动一格。数组没有排序前提，所以不能跳着走；重复值出现时也会在第一次匹配处停止，而不是继续扫描。',
        en: 'On a miss the slot just compared becomes checked and the pointer really advances by one. The array has no ordering guarantee, so no skipping is allowed; with duplicates the search stops at the first match instead of continuing.',
      },
      tip: { zh: '记忆：一次只前进一格，已检查区域从左向右扩大。', en: 'Memory hook: advance one slot at a time; the checked region grows from the left.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑤ 返回匹配索引或 -1', en: '⑤ Return the matching index or -1' },
      explanation: {
        zh: '找到目标时返回第一次遇到的索引；所有位置都检查完仍未匹配时返回 -1。空数组也走失败路径。顺序查找不要求有序，重复值只保证返回其中一个匹配位置，本实现固定返回最先遇到的那个。',
        en: 'A match returns the first index encountered; after every slot is checked without a match the result is -1, and an empty array follows the same failure path. Linear search does not require sorted data; with duplicates it returns one valid match, and this implementation returns the first one.',
      },
      tip: { zh: '记忆重点：无序也能查；最好 O(1)，平均/最坏 O(n)，额外空间 O(1)。', en: 'Memory hook: unordered input is fine; best O(1), average/worst O(n), O(1) extra space.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把顺序查找当成二分查找，错误地假设数组已经有序并跳过元素。',
      '循环边界写成 i <= n，访问越界下标 n。',
      '找到后仍继续扫描，重复值情况下返回了最后一个匹配位置。',
      '空数组没有单独处理，仍然访问 a[0]。',
      '把最好情况也写成 O(n)，忽略第一个元素就命中的 O(1)。',
    ],
    en: [
      'Treating linear search like binary search and skipping slots under a false sorted assumption.',
      'Using i <= n as the loop bound and reading the out-of-range index n.',
      'Continuing after a match and returning the last duplicate instead of the first.',
      'Forgetting the empty-array path and still reading a[0].',
      'Calling the best case O(n) and ignoring the first-slot O(1) hit.',
    ],
  },
};
