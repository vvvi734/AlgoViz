import type { Lesson } from './types';

/**
 * F1 binary search course, matched to the real Python lesson steps:
 * init, binary-mid, binary-compare, binary-narrow, done.
 * An unsorted input is mapped to `init` so the prerequisite warning still has
 * a real course step instead of a fabricated search animation.
 */
export const binarySearchLesson: Lesson = {
  lessonId: 'binary-search-basics',
  algorithmId: 'binary',
  contentVersion: '1.0.0',
  title: { zh: '二分查找：在有序区间中折半缩小', en: 'Binary search: halve a sorted interval' },
  oneLiner: {
    zh: '在升序数组的闭区间 [left, right] 中反复检查 mid，按比较结果排除一半，直到命中或区间为空。',
    en: 'In a sorted closed interval [left, right], inspect mid and discard half according to the comparison until it matches or the interval becomes empty.',
  },
  overview: {
    zh: '二分查找要求数组按比较规则有序。迭代版本维护 left、right 两个闭区间边界，每轮计算 mid=(left+right)//2；相等就返回，arr[mid] 小于目标就排除左半区并令 left=mid+1，大于目标就排除右半区并令 right=mid-1。每次排除都来自真实边界变化，不能只按帧数缩小。最好情况第一次就命中，O(1)；平均与最坏 O(log n)；迭代实现只用常数个变量，额外空间 O(1)。',
    en: 'Binary search requires a sorted array. The iterative version keeps a closed [left, right] interval and computes mid = (left + right) // 2 each round. Equality returns; if arr[mid] is smaller, the left half is discarded with left = mid + 1; if larger, the right half is discarded with right = mid - 1. The real boundaries drive every exclusion; a frame counter may not fake it. The best case hits immediately, O(1); average and worst are O(log n); the iterative version stores only constant variables, O(1) extra space.',
  },
  intuition: {
    zh: '把有序数组想成一本按编号排好的字典。每次翻到当前区间正中间：如果正好是目标，就结束；如果中间值偏小，目标只可能在右边，于是把左半边连同 mid 一起排除；如果中间值偏大，就排除右半边。每轮至少去掉一半候选，所以最多约 log₂n 轮。区间用闭区间 [left, right] 表示，left > right 才代表没有候选。',
    en: 'Think of the sorted array as an ordered dictionary. Open the middle of the current interval: a hit finishes; if the middle is too small, the target can only be on the right, so discard the left half including mid; if too large, discard the right half. Each round removes at least half the candidates, so about log₂n rounds remain. The interval is closed [left, right], and left > right is the only empty state.',
  },
  prerequisites: {
    zh: ['数组必须按升序（允许相等）排列', '能计算闭区间中点 (left + right) // 2', '理解闭区间与 left > right 的空区间含义'],
    en: ['The array must be ascending (duplicates allowed)', 'Computing the closed-interval midpoint (left + right) // 2', 'Understanding a closed interval and the empty state left > right'],
  },
  complexity: {
    time: '最好 O(1)；平均与最坏 O(log n)',
    space: 'O(1)',
    note: {
      zh: '第一次 mid 就命中时只比较一次，最好 O(1)。每轮把候选数量从 n 缩小到约 n/2，最多约 ⌈log₂(n+1)⌉ 轮，因此平均与最坏都是 O(log n)。迭代版本只维护 left、right、mid 等常数个变量，额外空间 O(1)；递归版本才会产生 O(log n) 调用栈。',
      en: 'A first-mid hit compares once, O(1) best. Each round shrinks the candidates from n to about n/2, so at most about ⌈log₂(n+1)⌉ rounds remain, giving O(log n) average and worst. The iterative version stores only constant variables such as left, right and mid, so extra space is O(1); a recursive version would add an O(log n) call stack.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 检查有序前提，初始化左右边界', en: '① Check the sorted prerequisite and initialize boundaries' },
      explanation: {
        zh: '二分查找只对有序数组启动。真实 Python 先检查相邻元素是否满足非递减；如果无序，就发出明确的拒绝帧，不会偷偷排序，也不会播放误导性的折半动画。有序且非空时，闭区间初始化为 [0, n-1]；空数组直接得到空区间。',
        en: 'Binary search starts only on sorted data. Real Python first checks that adjacent values are nondecreasing; if not, it emits an explicit refusal instead of silently sorting or playing a misleading halving animation. For a sorted non-empty array the closed interval starts at [0, n-1]; an empty array starts empty.',
      },
      tip: { zh: '记忆：无序输入不是二分查找，先排序或改用顺序查找。', en: 'Memory hook: unsorted input is not a binary-search problem; sort it or use linear search.' },
    },
    {
      stepId: 'binary-mid',
      title: { zh: '② 计算当前区间的中点 mid', en: '② Compute the midpoint of the live interval' },
      explanation: {
        zh: 'mid 由真实 left 和 right 计算：mid = (left + right) // 2，落在闭区间内。它不是预先写好的固定帧，也不是用帧数推算的位置；left 或 right 一变化，下一帧的 mid 就随之改变。',
        en: 'mid is computed from the real left and right: mid = (left + right) // 2, inside the closed interval. It is neither a prewritten frame nor a position inferred from a frame counter; once left or right changes, the next mid changes with it.',
      },
      tip: { zh: 'mid 必须落在 [left, right] 内，否则区间已经算错。', en: 'mid must lie inside [left, right]; otherwise the interval is already wrong.' },
    },
    {
      stepId: 'binary-compare',
      title: { zh: '③ 比较 arr[mid] 与目标值', en: '③ Compare arr[mid] with the target' },
      explanation: {
        zh: '这一帧只比较 arr[mid] 与目标，不改变边界。相等则立即进入成功；arr[mid] 小于目标说明左半边连同 mid 都不可能，arr[mid] 大于目标说明右半边连同 mid 都不可能。比较结果由真实 Python 的 if/elif/else 产生。',
        en: 'This frame only compares arr[mid] with the target and does not move boundaries. Equality succeeds immediately; arr[mid] smaller means the left half including mid is impossible, while arr[mid] larger means the right half including mid is impossible. The branch comes from real Python if/elif/else execution.',
      },
      tip: { zh: '先比较，再排除；不要把“比较”和“改边界”混成一帧。', en: 'Compare first, then discard; do not merge the comparison and boundary update into one frame.' },
    },
    {
      stepId: 'binary-narrow',
      title: { zh: '④ 按比较结果排除一半并更新边界', en: '④ Discard one half and update the boundary' },
      explanation: {
        zh: 'arr[mid] 小于目标时，left 真正变为 mid+1；arr[mid] 大于目标时，right 真正变为 mid-1。mid 本身已经比较过，必须一起排除，所以不能写成 left=mid 或 right=mid，否则区间可能不缩小而死循环。更新后若 left <= right，新区间仍然有效；若 left > right，下一帧就是失败。',
        en: 'When arr[mid] is smaller, left really becomes mid + 1; when larger, right becomes mid - 1. The inspected mid must be excluded too, so left = mid or right = mid would fail to shrink and could loop forever. After the update, left <= right means the new interval is live; left > right leads to the failure frame.',
      },
      tip: { zh: '记忆：等于就返回，小于就 left=mid+1，大于就 right=mid-1。', en: 'Memory hook: equal returns, smaller sets left = mid + 1, larger sets right = mid - 1.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑤ 命中返回，或区间为空返回 -1', en: '⑤ Return the hit, or -1 when the interval is empty' },
      explanation: {
        zh: '命中时返回当前 mid；重复值只保证任意一个合法匹配位置，不保证第一个或最后一个。while left <= right 结束时一定有 left > right，说明最后一个候选也已被检查和排除，返回 -1。标准闭区间写法必须用 <=，否则会漏掉最后一个候选。',
        en: 'A hit returns the current mid; with duplicates it promises any valid match, not necessarily the first or last. When the while left <= right loop ends, left > right, so even the last candidate has been inspected and excluded, and the result is -1. The standard closed-interval form must use <= or the last candidate is missed.',
      },
      tip: { zh: '记忆重点：有序前提 + 闭区间 left<=right + mid±1；最好 O(1)，平均/最坏 O(log n)，额外空间 O(1)。', en: 'Memory hook: sorted input + closed interval left <= right + mid ± 1; best O(1), average/worst O(log n), O(1) extra space.' },
    },
  ],
  commonMistakes: {
    zh: [
      '忘记检查有序前提，对无序数组直接二分，甚至偷偷先排序再声称查的是原数组。',
      '循环条件写成 left < right，最后一个候选元素还没比较就退出。',
      '更新写成 left = mid 或 right = mid，区间没有排除 mid，可能死循环。',
      '只改可视化区间而不改真实 left/right，或按帧数假装区间缩小。',
      '重复值情况下承诺返回第一个或最后一个匹配位置；本实现只保证任意一个。',
      '把 mid 写成 (left + right + 1) // 2 却不相应调整边界，导致区间卡住。',
    ],
    en: [
      'Skipping the sorted check, binary-searching an unsorted array, or silently sorting it and claiming the original was searched.',
      'Using left < right and exiting before the last candidate is compared.',
      'Writing left = mid or right = mid and failing to exclude mid, which can loop forever.',
      'Changing only the visual range while the real left/right stay put, or shrinking by frame count.',
      'Promising the first or last duplicate; this implementation promises only any valid match.',
      'Using (left + right + 1) // 2 without adjusting the boundaries, which can leave the interval stuck.',
    ],
  },
};
