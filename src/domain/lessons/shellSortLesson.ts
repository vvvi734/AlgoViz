import type { Lesson } from './types';

/**
 * Shell sort with the deterministic n//2, n//4, …, 1 gap sequence, matched to
 * the real Python `lesson_step` values: init, gap-change, shell-compare,
 * shell-shift, shell-place, gap-done, done.
 */
export const shellSortLesson: Lesson = {
  lessonId: 'shell-sort-basics',
  algorithmId: 'shell',
  contentVersion: '1.0.0',
  title: { zh: '希尔排序：按 gap 分组做插入排序', en: 'Shell sort: insertion sort inside gap lanes' },
  oneLiner: {
    zh: '用逐渐减小的 gap 把数组分成多条子序列，每条子序列内部做插入排序；gap 最终减到 1，完成全局排序。',
    en: 'Use a shrinking gap to split the array into lanes, insertion-sort each lane, and finish at gap 1 to sort the whole array.',
  },
  overview: {
    zh: '希尔排序是插入排序的改进：插入排序在“几乎有序”的数组上很快，但逆序元素每次只能移动一格。希尔排序先用较大的 gap 让元素一次跨很远，把数组变得“大体有序”；再逐步缩小 gap，让每条子序列更密。最后 gap=1 时就是普通插入排序，负责收尾并保证全局有序。复杂度取决于间隔序列，不能笼统说所有希尔排序都是 O(n log n)；本课使用 n//2 折半序列，最坏是 O(n²)，平均通常优于普通插入排序。标准实现通常不稳定。',
    en: 'Shell sort improves insertion sort: insertion sort is fast on nearly sorted arrays, but a reversed value can move only one slot per step. Shell sort first uses a large gap so values move far in one jump and the array becomes roughly ordered; then it shrinks the gap so each lane gets denser. The final gap=1 pass is ordinary insertion sort, which finishes the job and guarantees global order. The cost depends on the gap sequence — not every Shell sort is O(n log n). This course uses the n//2 halving sequence, whose worst case is O(n²), with an average usually better than plain insertion sort. The standard implementation is usually unstable.',
  },
  intuition: {
    zh: '把数组按“下标除以 gap 的余数”分成 gap 条 lane。gap=4 时，p0、p4、p8… 是一条 lane，p1、p5、p9… 是另一条。每条 lane 单独做插入排序，但元素每次只和同 lane 的前一个元素比较，移动时也按 gap 跳。所有 lane 处理完后，把 gap 减半，lane 变多、每条变密；到 gap=1 只剩一条 lane，就是普通的直接插入排序。',
    en: 'Split the array into gap lanes by index modulo gap. With gap=4, p0, p4, p8… form one lane and p1, p5, p9… another. Each lane runs its own insertion sort, comparing only with the previous element in the same lane and moving by one gap. When every lane is done, halve the gap: there are more lanes and each is denser. At gap=1 only one lane remains, which is exactly ordinary insertion sort.',
  },
  prerequisites: {
    zh: ['理解直接插入排序的 key、右移与写回', '会用下标对 gap 取余来划分 lane', '知道 gap 序列必须最终包含 1'],
    en: ['Understanding insertion sort’s key, shift and write-back', 'Using index modulo gap to identify a lane', 'Knowing the gap sequence must eventually contain 1'],
  },
  complexity: {
    time: '取决于间隔序列（本课 n//2 折半序列最坏 O(n²)）',
    space: 'O(1)',
    note: {
      zh: '希尔排序没有唯一的时间复杂度：间隔序列决定元素能跨多远、逆序对消除得多快。常见教材中的 n/2、n/4、…、1 序列最坏为 O(n²)；某些更精细的序列可以达到更好的平均表现，但不能把“希尔排序”整体笼统写成 O(n log n)。本实现只使用 gap、i、j、key 等常数变量，额外空间 O(1)。',
      en: 'Shell sort has no single time complexity: the gap sequence determines how far values jump and how quickly inversions disappear. The common n/2, n/4, …, 1 sequence has an O(n²) worst case; some refined sequences achieve better average behaviour, but “Shell sort” as a whole must not be labelled O(n log n) without naming the sequence. This implementation stores only gap, i, j and key, so extra space is O(1).',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 初始化与 gap 序列', en: '① Initialise and build the gap sequence' },
      explanation: {
        zh: '读入数组并生成确定性的 gap 序列：n//2、n//4、…、1。n<2 时没有 gap，数组天然有序；空数组直接完成。',
        en: 'Read the array and build the deterministic gap sequence n//2, n//4, …, 1. For n<2 there is no gap and the array is already sorted; an empty array finishes immediately.',
      },
      tip: { zh: '本课固定使用折半序列，保证最终一定到达 gap=1。', en: 'This course always halves the gap, so the sequence must reach gap=1.' },
    },
    {
      stepId: 'gap-change',
      title: { zh: '② 切换到当前 gap', en: '② Switch to the current gap' },
      explanation: {
        zh: '一轮开始时记录当前 gap。gap 越大，lane 越稀疏、元素一次跨得越远；gap 越小，lane 越密，越接近普通插入排序。',
        en: 'At the start of a pass the current gap is recorded. A larger gap gives sparser lanes and longer jumps; a smaller gap gives denser lanes closer to ordinary insertion sort.',
      },
      tip: { zh: '先大 gap 粗调，再小 gap 细调；顺序反过来不会得到同样的中间状态。', en: 'Large gaps coarsely rearrange, small gaps refine; reversing the order would not produce the same intermediate states.' },
    },
    {
      stepId: 'shell-compare',
      title: { zh: '③ 跨 gap 比较', en: '③ Compare across the gap' },
      explanation: {
        zh: '对每个 i，key=a[i]，lane=i%gap，j=i-gap。比较 a[j] 与 key；这里只和同一条 lane 的前一个元素比较，绝不会跨 lane。',
        en: 'For each i, key=a[i], lane=i%gap and j=i-gap. Compare a[j] with the key; this only looks at the previous element in the same lane and never crosses lanes.',
      },
      tip: { zh: '看画面里的 lane 标记：正在比较的两个元素一定同余。', en: 'Watch the lane marks: the two compared slots always have the same residue modulo gap.' },
    },
    {
      stepId: 'shell-shift',
      title: { zh: '④ 按 gap 右移', en: '④ Shift right by one gap' },
      explanation: {
        zh: '若 a[j] > key，执行 a[j+gap] = a[j]，元素按 gap 整体右移，空位也向左跳 gap。中间帧出现的重复值同样是真实状态。',
        en: 'If a[j] > key, execute a[j+gap] = a[j]: the value moves right by exactly one gap and the hole jumps left by the same distance. The duplicate in the intermediate frame is again the real state.',
      },
      tip: { zh: '移动距离是 gap，不是 1；写成 j+1 会把不同 lane 混在一起。', en: 'The move distance is gap, not 1; writing j+1 would mix different lanes.' },
    },
    {
      stepId: 'shell-place',
      title: { zh: '⑤ key 写回当前 lane', en: '⑤ Write the key back into its lane' },
      explanation: {
        zh: '循环停止后，a[j+gap] = key。key 落在同一条 lane 的空位，当前 lane 的这一段重新有序，其他 lane 不受影响。',
        en: 'When the loop stops, a[j+gap] = key. The key fills the hole in its lane, that segment of the lane is sorted again, and other lanes are untouched.',
      },
      tip: { zh: '写回后检查下标：insertedAt 必须与 key 的原位置同余。', en: 'After writing, check the index: insertedAt must have the same residue as the key’s origin.' },
    },
    {
      stepId: 'gap-done',
      title: { zh: '⑥ 当前 gap 轮完成', en: '⑥ The current gap pass is complete' },
      explanation: {
        zh: '所有 lane 都处理完后，本轮 gap 结束。gap>1 时数组只做到“gap 有序”，还不能保证全局有序；把 gap 减半，进入下一轮。',
        en: 'After every lane is processed, this gap pass ends. With gap>1 the array is only gap-sorted, not globally sorted; halve the gap and continue.',
      },
      tip: { zh: 'gap>1 结束时不要误报“已排好”，真正的保证来自 gap=1。', en: 'Do not claim “sorted” when gap>1 ends; the guarantee comes from gap=1.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑦ gap=1 完成，全局有序', en: '⑦ gap=1 completes the global order' },
      explanation: {
        zh: 'gap=1 时只有一条 lane，所有元素都参与普通插入排序，因此最终数组升序。排序前后元素多重集保持不变。',
        en: 'With gap=1 there is one lane, every element participates in ordinary insertion sort, and the final array is ascending. The multiset of values is unchanged.',
      },
      tip: { zh: '希尔排序通常不稳定；相同 key 的先后顺序可能在跨 gap 移动中改变。', en: 'Shell sort is usually unstable; equal keys can change relative order during gap moves.' },
    },
  ],
  commonMistakes: {
    zh: [
      'gap 序列漏掉 1，数组只是“gap 有序”，并不保证全局有序。',
      '移动时写 j+1 而不是 j+gap，把不同 lane 的元素混在一起，破坏子序列独立性。',
      '把 a[j] 与 key 的比较写成跨 lane 的相邻比较，误把希尔排序当成普通插入排序。',
      '笼统声称希尔排序是 O(n log n)；实际复杂度依赖间隔序列，n//2 折半序列最坏 O(n²)。',
    ],
    en: [
      'Omitting gap=1, which leaves the array merely gap-sorted rather than globally sorted.',
      'Moving by j+1 instead of j+gap, mixing different lanes and destroying lane independence.',
      'Comparing across lanes instead of within the same gap lane, which turns Shell sort into ordinary insertion sort.',
      'Claiming Shell sort is O(n log n) in general; the cost depends on the gap sequence, and the n//2 halving sequence has an O(n²) worst case.',
    ],
  },
};
