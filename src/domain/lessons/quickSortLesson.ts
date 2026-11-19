import type { Lesson } from './types';

/**
 * Quick sort course matched to the real Python `lesson_step` values:
 * init, quick-partition, quick-swap, quick-place, done.
 *
 * `quick-return` frames deliberately share `quick-place`: a singleton return
 * and an empty child return are both part of the same "range finished" stage.
 */
export const quickSortLesson: Lesson = {
  lessonId: 'quick-sort-basics',
  algorithmId: 'quick',
  contentVersion: '1.0.0',
  title: { zh: '快速排序：末尾 pivot 的 Lomuto 分区', en: 'Quick sort: Lomuto partition with the last pivot' },
  oneLiner: {
    zh: '选区间末尾元素作 pivot，用 Lomuto 扫描把不大于 pivot 的值换到左侧，pivot 归位后递归左右子区间。',
    en: 'Choose the last element of a range as pivot, use Lomuto scanning to move values ≤ pivot to the left, place the pivot, then recurse on both child ranges.',
  },
  overview: {
    zh: '快速排序是原地分治排序：每次分区确定一个 pivot 的最终位置，并把它左侧变成不大于 pivot、右侧变成大于 pivot 的两个子区间。这里使用 Lomuto 方案，pivot 固定取区间末尾。平均与通常期望时间复杂度是 O(n log n)，但最坏可退化到 O(n²)（例如已排序数组仍总取末尾 pivot）；递归栈平均 O(log n)、最坏 O(n)。标准原地快速排序通常不稳定，相等元素可能在分区交换中跨越。',
    en: 'Quick sort is an in-place divide-and-conquer sort: each partition fixes one pivot and produces a left child ≤ pivot and a right child > pivot. This course uses Lomuto with the last slot as pivot. Average and typical expected time is O(n log n), but the worst case is O(n²) when the last pivot is repeatedly extreme (for example an already sorted array); the recursion stack is O(log n) average and O(n) worst. The standard in-place version is usually unstable because equal keys can cross during partition swaps.',
  },
  intuition: {
    zh: '把当前区间想成一条待分拣的带子。末尾的 pivot 是一把标尺：扫描指针 j 从左往右看，每遇到一个不大于 pivot 的元素，就把它换到边界 i 的位置，然后 i 右移。扫描结束后，i 左侧都不大于 pivot；再把 pivot 与 i 交换，pivot 就落在最终位置。接着对 i 左边和右边分别重复，直到区间只剩一个元素或为空。',
    en: 'Treat the current range as a belt to be partitioned. The last element is the pivot ruler: scan pointer j moves right; each value ≤ pivot is swapped to boundary i, then i advances. After the scan everything left of i is ≤ pivot. Swap the pivot with i and it reaches its final slot. Repeat on the left and right children until a range has one element or is empty.',
  },
  prerequisites: {
    zh: ['会写递归函数并理解递归终止条件', '能跟踪数组下标 low、high、i、j', '知道交换两个数组元素需要临时变量'],
    en: ['Writing recursive functions with a base case', 'Tracking array indices low, high, i and j', 'Knowing a swap needs a temporary variable'],
  },
  complexity: {
    time: '平均及通常期望 O(n log n)；最坏 O(n²)',
    space: '递归栈平均 O(log n)；最坏 O(n)',
    note: {
      zh: '理想情况下每次分区把区间分成两半，递归深度约 log n，每层总扫描 O(n)，所以平均 O(n log n)。若每次 pivot 都是极值，分区只缩小一个元素，递归深度 n，最坏 O(n²)。Lomuto 原地分区只使用常数个下标变量，额外空间来自递归栈：平均 O(log n)，最坏 O(n)。标准原地交换通常不稳定。',
      en: 'In the ideal case each partition splits the range in half, recursion depth is about log n and each level scans O(n), giving O(n log n) average. If every pivot is extreme, each partition removes only one element, recursion depth is n and the worst case is O(n²). Lomuto uses only constant index variables; the extra space is the recursion stack: O(log n) average, O(n) worst. The standard in-place swap version is usually unstable.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 读入数组，准备递归', en: '① Read the array and prepare recursion' },
      explanation: {
        zh: '真实 Python 读入数组，尚未发生比较或交换。快速排序从整个区间 [0, n-1] 开始，后续每个子区间都用同一套 Lomuto 规则处理。',
        en: 'Real Python reads the array before any comparison or swap. Quick sort starts with the whole range [0, n-1]; every child range later uses the same Lomuto rule.',
      },
      tip: { zh: '快速排序的“快”来自分治，不来自某一次交换。', en: 'Quick sort is fast because of divide and conquer, not because of one swap.' },
    },
    {
      stepId: 'quick-partition',
      title: { zh: '② 进入区间，选末尾 pivot 并扫描', en: '② Enter the range, choose the last pivot, scan' },
      explanation: {
        zh: '对非空区间 [low, high] 取 a[high] 为 pivot，边界 i 从 low 开始。扫描指针 j 从 low 到 high-1，每次比较 a[j] 与 pivot；这一步只读取，不修改数组。i 始终表示“下一个不大于 pivot 的位置”，所以 i 左侧是已确认的 ≤ pivot 区域。',
        en: 'For a non-empty range [low, high], take a[high] as pivot and start boundary i at low. Scan j from low to high-1, comparing a[j] with the pivot; this step only reads. Boundary i is the next slot for a value ≤ pivot, so everything left of i is the confirmed ≤ pivot region.',
      },
      tip: { zh: 'i 是分界，不是当前比较位置；j 才在向前扫描。', en: 'i is the partition boundary; j is the scan pointer.' },
    },
    {
      stepId: 'quick-swap',
      title: { zh: '③ 真实交换到边界，i 右移', en: '③ Real swap to the boundary, advance i' },
      explanation: {
        zh: '当 a[j] ≤ pivot 时，把 a[j] 与 a[i] 真正交换，然后 i 右移一格。只有实际改变位置时才记录交换帧；如果 i 与 j 相同，代码不产生无意义的自交换动画。交换后，≤ pivot 的区域扩大一格，j 继续向右。',
        en: 'When a[j] ≤ pivot, really swap a[j] with a[i], then advance i. A swap frame is emitted only when positions actually change; when i and j are the same, no meaningless self-swap animation is fabricated. The ≤ pivot region grows and j continues right.',
      },
      tip: { zh: '不要把快速排序写成相邻冒泡交换；这里交换的是 j 与边界 i。', en: 'Do not animate quick sort as adjacent bubble swaps; the exchange is between j and boundary i.' },
    },
    {
      stepId: 'quick-place',
      title: { zh: '④ pivot 归位，递归左右子区间', en: '④ Place the pivot and recurse on both children' },
      explanation: {
        zh: '扫描结束后，把 pivot 与 a[i] 交换，pivot 落到 i。此时 i 左侧全部 ≤ pivot，右侧全部 > pivot，所以 i 是最终位置。随后递归处理 [low, i-1] 和 [i+1, high]；单元素区间直接返回，空区间不产生比较。',
        en: 'After the scan, swap the pivot with a[i] so it lands at i. Everything left is ≤ pivot and everything right is > pivot, so i is final. Recurse on [low, i-1] and [i+1, high]; a singleton returns immediately and an empty range produces no comparison.',
      },
      tip: { zh: 'pivot 归位后不再参与任何递归，这是分区正确性的核心。', en: 'Once placed, the pivot never enters recursion again — that is the core partition invariant.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑤ 排序完成，检查多重集与稳定性', en: '⑤ Complete, check multiset and stability' },
      explanation: {
        zh: '所有递归区间处理完，整个数组升序。排序前后元素多重集一致；标准 Lomuto 原地版本通常不稳定，相等元素的相对次序可能改变。',
        en: 'When every recursive range is done, the whole array is ascending and the value multiset is unchanged. The standard in-place Lomuto version is usually unstable, so equal keys may change relative order.',
      },
      tip: { zh: '记忆重点：末尾 pivot + Lomuto；平均 O(n log n)，最坏 O(n²)，递归栈最坏 O(n)，通常不稳定。', en: 'Memory hook: last-slot pivot + Lomuto; O(n log n) average, O(n²) worst, O(n) worst stack, usually unstable.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把 pivot 取成首元素却仍按“末尾 pivot”的解释讲，分区不变量与代码不一致。',
      '比较条件写成 a[j] < pivot 而不是 ≤ pivot，导致重复值分布与 Lomuto 边界定义不符。',
      '把 i 当成扫描指针，或忘记在交换后把 i 右移，边界与实际分区脱节。',
      '递归时把 pivot 自己再次包含进子区间，造成重复处理甚至无限递归。',
      '只展示相邻交换或预先写好的动画帧，而不是真实 Python 比较、交换与归位。',
      '误以为快速排序任何情况都是 O(n log n)，忽略已排序输入取末尾 pivot 的最坏 O(n²)。',
    ],
    en: [
      'Using the first element as pivot while still claiming a last-pivot Lomuto invariant.',
      'Comparing with a[j] < pivot instead of ≤ pivot, which breaks the duplicate-value partition boundary.',
      'Treating i as the scan pointer, or forgetting to advance i after a swap.',
      'Including the placed pivot in a child range again, causing duplicate work or infinite recursion.',
      'Showing adjacent swaps or prewritten frames instead of the real Python comparison, swap and placement.',
      'Assuming quick sort is always O(n log n) and forgetting the O(n²) worst case on sorted input with a last pivot.',
    ],
  },
};
