import type { Lesson } from './types';

/**
 * Bubble sort — the first full course.
 *
 * Original content written for AlgoLens (no text copied from any third-party
 * tutorial). `stepId`s match the `lesson_step=` values emitted by the Python
 * preset in `legacy/algorithm-definitions.js`, which is what makes the highlight
 * come from real execution instead of a guess.
 */
export const bubbleSortLesson: Lesson = {
  lessonId: 'bubble-sort-basics',
  algorithmId: 'bubble',
  contentVersion: '1.0.0',
  title: { zh: '冒泡排序：把最大的数冒到末尾', en: 'Bubble sort: bubbling the largest value to the end' },
  oneLiner: {
    zh: '反复比较相邻的两个数，把逆序的那一对交换过来，每一轮最大的数就会“冒”到末尾。',
    en: 'Repeatedly compare adjacent pairs and swap the ones that are out of order, so the largest value bubbles to the end of each pass.',
  },
  overview: {
    zh: '冒泡排序适合元素数量不多、并且你希望在讲解中“看得见每一次比较与交换”的场合。它不需要额外空间，实现只有双重循环；代价是比较次数多，元素一多就明显变慢。它是理解“排序 = 消除逆序对”的最好起点。',
    en: 'Bubble sort fits small inputs and teaching situations where every comparison and swap should be visible. It needs no extra space and is just a double loop, but the comparison count grows quickly. It is the easiest place to see that sorting means removing inversions.',
  },
  intuition: {
    zh: '想象一排高矮不同的同学。你从队首开始，每次只看相邻两个人：左边比右边高就换位置。走完一趟，最高的那位一定被一路换到了队尾。然后你不再管队尾，对前面的人重复这一趟，第二高的人会到位，依此类推。每一轮都让“未排序区”缩小一格。',
    en: 'Picture a line of people of different heights. Starting at the front, look only at two neighbours at a time and swap them if the left one is taller. After one full walk, the tallest person has been pushed to the very end. Ignore the end and repeat on the shorter prefix: the second tallest lands next, and so on. Each pass shrinks the unsorted region by one slot.',
  },
  prerequisites: {
    zh: ['会读写数组下标（从 0 开始）', '理解 for 循环与循环边界', '知道“交换两个变量需要临时变量或元组赋值”'],
    en: ['Reading and writing array indices (0-based)', 'Understanding for-loops and their bounds', 'Knowing that a swap needs a temporary value or tuple assignment'],
  },
  complexity: {
    time: 'O(n²)',
    space: 'O(1)',
    note: {
      zh: '两层循环：外层走 n-1 轮，内层每轮比较的次数依次减少（n-1、n-2、…），总比较次数约为 n²/2，所以时间复杂度是 O(n²)。只用了 i、j 和交换时的临时空间，所以空间复杂度是 O(1)。',
      en: 'Two loops: the outer loop runs n-1 passes while the inner loop compares n-1, n-2, … elements, giving about n²/2 comparisons — O(n²) time. Only i, j and a temporary value for the swap are used, so the space cost is O(1).',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 初始化', en: '① Initialise' },
      explanation: {
        zh: '把输入复制成数组并记下长度 n。此时整个数组都是“未排序区”，还没有任何元素确定位置。',
        en: 'Copy the input into an array and record its length n. The whole array is still unsorted; no element has a fixed position yet.',
      },
      tip: { zh: '先在纸上写下数组和 n，后面的每一轮都在缩小同一块未排序区。', en: 'Write the array and n down first — every later pass shrinks that same unsorted region.' },
    },
    {
      stepId: 'compare',
      title: { zh: '② 比较相邻元素', en: '② Compare neighbours' },
      explanation: {
        zh: '内层循环取一对相邻元素 arr[j] 与 arr[j+1]，判断它们是否逆序。这一步只观察、不修改数组，所以同一次运行里它会重复出现很多次。',
        en: 'The inner loop looks at one adjacent pair, arr[j] and arr[j+1], and asks whether they are out of order. Nothing is modified yet, so this stage repeats many times in a single run.',
      },
      tip: { zh: '观察变量面板里的 j：它从 0 一路增加，到本轮边界就停下。', en: 'Watch j in the variables panel: it climbs from 0 and stops at the pass boundary.' },
    },
    {
      stepId: 'swap',
      title: { zh: '③ 交换逆序对', en: '③ Swap an inverted pair' },
      explanation: {
        zh: '当 arr[j] > arr[j+1] 时，两者交换位置，逆序对就此消除。交换只发生在“左大右小”的时候，所以逆序多的时候这一步会频繁出现，正序时可能一次都不出现。',
        en: 'When arr[j] > arr[j+1], the two values trade places and that inversion disappears. Swaps happen only for a left-bigger-right-smaller pair, so a reversed input triggers many swaps while a sorted input triggers none.',
      },
      tip: { zh: '对照数组画布的前后两帧，确认正好这两个格子互换了值。', en: 'Compare the two frames around this step: exactly those two cells exchange their values.' },
    },
    {
      stepId: 'pass',
      title: { zh: '④ 完成一轮', en: '④ Finish a pass' },
      explanation: {
        zh: '内层循环走完，本轮未排序区里最大的元素已经被送到该区最右端，它的位置永久确定。下一轮只处理它左边剩下的部分。',
        en: 'When the inner loop ends, the largest value of the unsorted region has been carried to its right edge and is now final. The next pass only touches what remains to its left.',
      },
      tip: { zh: '数一数：第 i 轮结束后，末尾已经有 i+1 个元素排好序了。', en: 'Count them: after pass i, the last i+1 elements are already in their final places.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑤ 排序完成', en: '⑤ Sorting complete' },
      explanation: {
        zh: '外层循环执行 n-1 轮后，剩下的最后一个元素必然就位，整个数组非递减有序。',
        en: 'After n-1 passes the single remaining element must already be in place, so the array is sorted in non-decreasing order.',
      },
      tip: { zh: '如果某一轮完全没有发生交换，说明数组已经有序，可以提前结束。', en: 'If a whole pass performs no swap, the array is already sorted and you may stop early.' },
    },
  ],
  commonMistakes: {
    zh: [
      '内层循环写成 range(n - 1)，于是访问 arr[j + 1] 时越界到不存在的下标。',
      '循环边界忽略“每一轮末尾已经排好”的事实，写成 range(n - 1) 外层、range(n - 1) 内层，多做了大量无用比较。',
      '交换时直接写 arr[j] = arr[j+1]; arr[j+1] = arr[j]，把两个值都变成了原来的右值。',
      '把比较条件写成 >=，遇到相等元素也交换，虽然结果仍有序但会引入不必要的写操作。',
    ],
    en: [
      'Writing the inner bound as range(n - 1) and then reading arr[j + 1] out of range.',
      'Ignoring that the tail is already sorted, so the inner loop keeps comparing settled elements.',
      'Swapping with arr[j] = arr[j+1]; arr[j+1] = arr[j], which overwrites both cells with the right value.',
      'Using >= in the comparison, which swaps equal elements and adds pointless writes.',
    ],
  },
};
