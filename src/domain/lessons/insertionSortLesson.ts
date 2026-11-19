import type { Lesson } from './types';

/**
 * Direct insertion sort, matched to the real Python `lesson_step` values:
 * init, insert-key, insert-compare, insert-shift, insert-place, done.
 */
export const insertionSortLesson: Lesson = {
  lessonId: 'insertion-sort-basics',
  algorithmId: 'insertion',
  contentVersion: '1.0.0',
  title: { zh: '直接插入排序：取 key、右移、插入', en: 'Direct insertion sort: lift, shift, insert' },
  oneLiner: {
    zh: '维护一个始终有序的前缀，把当前 key 向左比较；较大元素逐个右移，最后把 key 写入空位。',
    en: 'Maintain an always-sorted prefix, compare the current key leftwards, shift larger values right one by one, then write the key into the hole.',
  },
  overview: {
    zh: '插入排序像整理手里的扑克牌：左手始终是一叠有序牌，右手拿起下一张 key，向左找到它该待的位置，再把中间较大的牌依次向右挪一格，最后把 key 插进空位。核心动作是“右移 + 插入”，不是相邻元素的连续冒泡交换。因为只有严格大于 key 的元素才移动，相等元素保持原有相对顺序，所以直接插入排序稳定。',
    en: 'Insertion sort is like sorting cards in your hand: the left hand is always an ordered stack, the right hand lifts the next key, finds where it belongs, shifts the larger cards one slot right, and inserts the key into the hole. The core operation is shift-then-insert, not repeated bubble swaps. Only values strictly greater than the key move, so equal keys keep their relative order and direct insertion sort is stable.',
  },
  intuition: {
    zh: '从第二个元素开始，把 a[0..i-1] 看成一个已经有序的区间。取出 a[i] 作为 key，原位置暂时空出。然后从 i-1 向左看：比 key 大的元素往右挪一格，空位跟着左移；遇到不大于 key 的元素就停下。最后 key 正好落进这个空位，有序前缀扩展到 i+1。',
    en: 'Start at the second element and treat a[0..i-1] as an already sorted range. Lift a[i] as the key, leaving its slot empty. Walk left from i-1: every value larger than the key moves one slot right and the hole follows; stop at a value not larger than the key. The key then fills that hole, and the sorted prefix grows to i+1.',
  },
  prerequisites: {
    zh: ['理解数组下标与区间边界', '知道 while 循环何时停止', '能区分“交换两个元素”和“把一个元素右移、另一个写入空位”'],
    en: ['Array indices and interval boundaries', 'Knowing when a while-loop stops', 'Distinguishing a two-element swap from “shift one value right, write another into the hole”'],
  },
  complexity: {
    time: '最好 O(n)，平均 O(n²)，最坏 O(n²)',
    space: 'O(1)',
    note: {
      zh: '如果输入已经有序，每个 key 只比较一次就停下，总比较 n-1 次，所以最好 O(n)。逆序时第 i 个 key 要与前面 i 个元素全部比较并右移，比较和移动都是 1+2+…+(n-1) = n(n-1)/2，最坏 O(n²)；平均也是 O(n²)。只用了 key、i、j 等常数空间，O(1)。',
      en: 'If the input is already sorted, each key stops after one comparison, so there are n-1 comparisons and the best case is O(n). In reverse order, key i compares with and shifts all i preceding values, giving 1+2+…+(n-1) = n(n-1)/2 comparisons and moves — worst case O(n²), and the average is also O(n²). Only key, i and j are stored, so space is O(1).',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 初始化', en: '① Initialise' },
      explanation: {
        zh: '读入数组。单个元素天然有序，因此从第二轮开始，a[0] 就是初始的有序前缀。',
        en: 'Read the array. A single element is trivially sorted, so a[0] is the initial sorted prefix and insertion starts at index 1.',
      },
      tip: { zh: '插入排序从不假设整个数组有序，只维护“左边这一段”有序。', en: 'Insertion sort never assumes the whole array is sorted; only the left prefix is maintained.' },
    },
    {
      stepId: 'insert-key',
      title: { zh: '② 取出 key，空出原位置', en: '② Lift the key and open its slot' },
      explanation: {
        zh: '把 a[i] 的值保存到 key，原位置在逻辑上成为空位。数组画面仍显示旧值，直到某次右移或最终写回把它覆盖；渲染器不会伪造“洞已填好”的状态。',
        en: 'Save a[i] into the key; its slot is now logically empty. The rendered array still shows the old value until a shift or the final write overwrites it; the renderer never pretends the hole is already filled.',
      },
      tip: { zh: 'key 是本次插入的唯一待插值，后续比较都拿它作基准。', en: 'The key is the only value being inserted; every later comparison is against it.' },
    },
    {
      stepId: 'insert-compare',
      title: { zh: '③ 向左比较', en: '③ Compare leftwards' },
      explanation: {
        zh: '从 j = i-1 开始，比较 a[j] 与 key。只要 a[j] > key，就需要把 a[j] 右移；一旦 a[j] ≤ key，说明找到了插入点，循环停止。',
        en: 'Start at j = i-1 and compare a[j] with the key. While a[j] > key, a[j] must shift right; as soon as a[j] ≤ key, the insertion point is found and the loop stops.',
      },
      tip: { zh: '条件是严格大于，不是大于等于；相等时停下才能保持稳定。', en: 'The condition is strictly greater, not greater-or-equal; stopping on equality is what preserves stability.' },
    },
    {
      stepId: 'insert-shift',
      title: { zh: '④ 较大元素右移一格', en: '④ Shift a larger value right' },
      explanation: {
        zh: '执行 a[j+1] = a[j]，把较大的值复制到右边一格，空位从 j+1 移到 j。中间帧会出现两个相同的值，这是真实的移动过程。',
        en: 'Execute a[j+1] = a[j], copying the larger value one slot right so the hole moves from j+1 to j. The intermediate frame really contains a duplicate; that is the honest state during the move.',
      },
      tip: { zh: '右移不是交换：不要写 a[j], a[j+1] = a[j+1], a[j]，那会破坏 key 的空位语义。', en: 'A shift is not a swap: do not write a[j], a[j+1] = a[j+1], a[j], which would destroy the hole semantics.' },
    },
    {
      stepId: 'insert-place',
      title: { zh: '⑤ 把 key 写入空位', en: '⑤ Write the key into the hole' },
      explanation: {
        zh: '循环停止后，j+1 就是 key 的正确位置。执行 a[j+1] = key，有序前缀从 i 个元素扩展到 i+1 个，并重新保持非递减。',
        en: 'When the loop stops, j+1 is the key’s correct slot. Execute a[j+1] = key; the sorted prefix grows from i to i+1 elements and is non-decreasing again.',
      },
      tip: { zh: '所有比 key 大的元素都已经右移，空位左边一定不大于 key。', en: 'All values larger than the key have shifted right, so the slot before the hole is not larger than the key.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑥ 排序完成', en: '⑥ Sorting complete' },
      explanation: {
        zh: '当 i 走到 n-1 并完成插入，整个数组就是有序前缀。结果升序，排序前后元素多重集不变。',
        en: 'After i reaches n-1 and its insertion completes, the whole array is the sorted prefix. The result is ascending and the multiset of values is unchanged.',
      },
      tip: { zh: '插入排序对近乎有序的小数组很快，常被用作高级排序的小区间收尾。', en: 'Insertion sort is fast on nearly sorted small arrays and is often used to finish small ranges inside faster sorts.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把右移写成相邻交换，导致 key 被反复搬动，动画也不再是插入排序。',
      '比较条件写成 a[j] >= key，遇到相等元素继续右移，破坏稳定性。',
      'while 循环结束后把 key 写到 a[j] 而不是 a[j+1]，差一位导致覆盖错误。',
      '忘记 key 已经保存，右移后仍从 a[i] 读取“当前待插入值”，读到的是被覆盖的数据。',
    ],
    en: [
      'Implementing the shift as adjacent swaps, which moves the key repeatedly and is no longer insertion sort.',
      'Using a[j] >= key, so equal values keep shifting and stability is lost.',
      'Writing the key to a[j] instead of a[j+1] after the loop, overwriting the wrong slot.',
      'Forgetting that the key was saved and reading a[i] after shifts, which now contains overwritten data.',
    ],
  },
};
