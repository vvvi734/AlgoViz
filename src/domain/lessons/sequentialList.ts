import type { Lesson } from './types';

/**
 * L1B course for the fixed-capacity sequential list. Step ids are exactly the
 * `lesson_step=` values emitted by the real Python preset. Operation frames
 * share a step id; the right rail uses action/change to explain each sub-step.
 */
export const sequentialListLesson: Lesson = {
  lessonId: 'sequential-list-basics',
  algorithmId: 'seqlist',
  contentVersion: '1.0.0',
  title: { zh: '顺序表：固定容量连续槽位', en: 'Sequential list: fixed-capacity contiguous slots' },
  oneLiner: {
    zh: '顺序表把有效元素连续放在一段固定槽位里；按下标直接定位是 O(1)，插入和删除却要真实搬移元素。',
    en: 'A sequential list keeps its live elements in a contiguous block of fixed slots; indexing is O(1), while insertion and deletion must physically shift elements.',
  },
  overview: {
    zh: '顺序存储就是把逻辑上相邻的元素放到物理上相邻的槽位中。这里的底层 data 是一个长度恒为 capacity 的 Python 列表：索引 0 到 length-1 是有效元素，索引 length 到 capacity-1 是空闲槽位。capacity 描述“这块连续空间一共能放几个”，length 描述“现在真正放了几个”，两者不能混用。因为每个槽位到起始地址的偏移量可以由下标直接算出，访问 data[i] 不需要从头走，时间复杂度是 O(1)。但插入要在中间腾出一个槽位，只能从最后一个有效元素开始逐个向右复制；删除要填掉被删位置的空洞，只能从被删位置开始逐个向左复制。这也是顺序表与链表最核心的取舍：顺序表随机访问快、缓存友好，但中间插入删除要搬移 O(n) 个元素；链表改链只需改常数条引用，却不能按下标直接访问。本课程只讲固定容量数组，length 达到 capacity 后插入会被明确拒绝，不把动态扩容策略混进来。',
    en: 'Sequential storage places logically adjacent elements in physically adjacent slots. Here the underlying data is a Python list whose size is always capacity: indices 0 through length-1 are live elements, and indices length through capacity-1 are free slots. Capacity says how many cells the contiguous block can hold; length says how many are actually live, and the two must not be conflated. Because a slot’s offset from the start can be computed directly from its index, reading data[i] does not walk the prefix, so indexing is O(1). Insertion, however, must open a hole in the middle by copying from the last live element rightwards; deletion must fill the hole by copying leftwards from the removed position. That is the central trade-off against a linked list: the sequential list has fast random access and cache-friendly storage, but middle insertion/deletion moves O(n) elements, while a linked list relinks a constant number of references but cannot index directly. This lesson covers a fixed-capacity array only: insertion is rejected once length reaches capacity, and dynamic resizing is deliberately out of scope.',
  },
  intuition: {
    zh: '把顺序表想成一排编号固定的储物柜：柜子总数是 capacity，已经放了东西的是前 length 个，后面是空柜。想知道第 i 个柜子里是什么，直接走到第 i 个柜门即可，不用从第一个开始数，所以按下标访问很快。想在中间插入一件东西，必须先把第 i 个柜到最后一个已用柜里的东西依次往右挪一格，腾出第 i 个柜，再放新东西；想删除第 i 个柜里的东西，则要把它右边的每个已用柜依次往左挪一格，最后把最右边的旧副本清空。搬移顺序不能反：插入必须从后往前，删除必须从前往后，否则会把还没搬走的元素覆盖掉。',
    en: 'Picture a row of numbered lockers: capacity is the total number of lockers, the first length lockers hold real items, and the rest are free. To find the item in locker i, go straight to locker i instead of counting from the first one, which is why indexed access is fast. To insert in the middle, first move every occupied locker from i through the last live one one step right, opening locker i, then place the new item. To delete locker i, move each occupied locker to its right one step left, then clear the old duplicate at the far right. The copying direction cannot be reversed: insertion must go from the back towards the front, and deletion from the front towards the back, or an un-copied element would be overwritten.',
  },
  prerequisites: {
    zh: ['知道 Python 列表的下标从 0 开始', '理解“连续存储”与“逻辑相邻”的含义', '能读懂赋值语句 data[i + 1] = data[i] 的方向'],
    en: ['Python list indices start at 0', 'Contiguous storage versus logical adjacency', 'Reading the direction of an assignment such as data[i + 1] = data[i]'],
  },
  complexity: {
    time: '访问 O(1) · 查找/插入/删除 O(n)',
    space: 'O(capacity)',
    note: {
      zh: '这里的复杂度针对当前固定容量数组实现：按下标访问只做一次槽位定位，是 O(1)；按值查找最坏要看完全部 length 个有效元素，是 O(n)；在索引 i 插入要搬移 length-i 个元素，删除索引 i 要搬移 length-i-1 个元素，最坏都是 O(n)。空间固定为 capacity 个槽位，不随 length 增长而重新分配；本批次不实现动态扩容，所以不讨论摊还 O(1) 的扩容策略。',
      en: 'These costs describe the current fixed-capacity array implementation: indexed access locates one slot directly and is O(1); value search may inspect all length live elements and is O(n); insertion at index i moves length-i elements and deletion at index i moves length-i-1 elements, both O(n) in the worst case. Space is the fixed capacity slot block, not reallocated as length grows; dynamic resizing is not implemented in this batch, so amortised O(1) growth strategies are out of scope.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 连续槽位：capacity、length 与 data', en: '① Contiguous slots: capacity, length and data' },
      explanation: {
        zh: '初始化后 data 固定有 capacity 个槽位，默认示例是 8 个；前 length=5 个槽位依次是 10、20、30、40、50，后三个槽位是 None，属于空闲区。有效区是左闭右开区间 [0, length)，空闲区是 [length, capacity)。length 不是 Python 列表的 len(data)——len(data) 永远是 capacity；length 是业务上真正有效的元素个数。',
        en: 'After initialisation data has exactly capacity slots, eight in the default example; the first length=5 slots hold 10, 20, 30, 40 and 50, while the last three are None and belong to the free tail. The live prefix is the half-open range [0, length) and the free tail is [length, capacity). Length is not Python’s len(data) — len(data) is always capacity; length is the number of elements that are actually live.',
      },
      tip: { zh: '先看 length 与 capacity 两个数字，再判断哪些槽位能读。', en: 'Read length and capacity first, then decide which slots are readable.' },
    },
    {
      stepId: 'access',
      title: { zh: '② 按索引访问：一次定位，O(1)', en: '② Access by index: one direct lookup, O(1)' },
      explanation: {
        zh: '访问先检查 0 <= index < length。合法时直接读取 data[index]，不需要从头遍历，所以是 O(1)。下标等于 length 或更大时落在空闲区，即使槽位里还残留中间帧的临时值，也不能当作有效元素；负数或超过 capacity 的索引同样越界。越界访问会被拒绝，已有槽位不会被修改。',
        en: 'Access first checks 0 <= index < length. When valid it reads data[index] directly without walking the prefix, so it is O(1). An index equal to length or larger falls in the free tail; even if an intermediate frame left a temporary value there, it is not a live element. Negative indices and indices beyond capacity are also out of range. An invalid access is rejected without modifying any existing slot.',
      },
      tip: { zh: '随机访问 O(1) 的前提是下标合法；越界不是“读到 None”那么简单。', en: 'O(1) random access assumes a valid index; out of range is not just “reading None”.' },
    },
    {
      stepId: 'search',
      title: { zh: '③ 按值查找：逐个比较，通常 O(n)', en: '③ Search by value: compare slot by slot, usually O(n)' },
      explanation: {
        zh: '按值查找从索引 0 开始，把当前槽位元素与目标值比较：命中就记录命中索引并停止；不命中就把该索引加入已检查区域，继续下一个槽位。检查完 [0, length) 仍未命中就是查找失败。它不要求元素有序，最坏要比较 length 次，因此通常需要 O(n)。顺序表能 O(1) 按下标访问，不代表能 O(1) 按值找到某个值。',
        en: 'Value search starts at index 0 and compares the current slot with the target: a hit records the matching index and stops; a miss adds that index to the checked region and moves on. If the whole live prefix [0, length) is exhausted without a match, the search fails. The data need not be sorted, and the worst case compares length elements, so the cost is normally O(n). O(1) indexed access does not imply O(1) search by value.',
      },
      tip: { zh: '“按下标访问”和“按值查找”是两种不同的问题，复杂度也不同。', en: '“Access by index” and “search by value” are different questions with different costs.' },
    },
    {
      stepId: 'insert',
      title: { zh: '④ 指定位置插入：从后向前腾槽位', en: '④ Insert at a position: open the slot from back to front' },
      explanation: {
        zh: '插入先检查 0 <= index <= length 以及 length < capacity。通过检查后，从最后一个有效元素 data[length-1] 开始，依次执行 data[i+1] = data[i]，一直搬到 data[index]，把 index 位置腾空；然后把新元素写入 data[index]，最后 length += 1。搬移必须从后向前：如果先搬前面的元素，会把后面尚未搬走的值覆盖掉。索引等于 length 表示追加，循环不执行，直接写入第一个空闲槽位。满表时没有空闲槽位，插入被拒绝。',
        en: 'Insertion first checks 0 <= index <= length and length < capacity. Once valid, it starts at the last live element data[length-1] and runs data[i+1] = data[i] down through data[index], opening the index slot; then it writes the new value into data[index] and finally increments length. The copy must run from the back towards the front: copying an earlier element first would overwrite a later value that has not moved yet. An index equal to length means append, so the loop is empty and the value goes into the first free slot. A full table has no free slot, so insertion is rejected.',
      },
      tip: { zh: '插入后移：先搬最后，再搬前面；顺序反了就会丢元素。', en: 'Insertion shifts right: move the last element first; reversing the order loses data.' },
    },
    {
      stepId: 'delete',
      title: { zh: '⑤ 指定位置删除：从前向后填空洞', en: '⑤ Delete at a position: fill the hole from front to back' },
      explanation: {
        zh: '删除先检查 length > 0 与 0 <= index < length，并保存被删元素的值。然后从 index 开始执行 data[i] = data[i+1]，把右边每个有效元素依次向左搬一格，直到 data[length-1] 被搬到 length-2；接着 length -= 1，并把新的空闲区第一个槽位 data[length] 清成 None。搬移必须从前向后：如果先搬后面的元素，会把尚未读取的右邻值覆盖掉。删除最后一个元素时循环为空，仍需清空旧槽位并把 length 减一。空表删除会被拒绝。',
        en: 'Deletion first checks length > 0 and 0 <= index < length, and saves the removed value. It then runs data[i] = data[i+1] from index onwards, moving every live element on the right one slot left until data[length-1] lands in length-2; next it decrements length and clears the first free slot data[length] to None. The copy must run from the front towards the back: copying a later element first would overwrite the unread right neighbour. Deleting the last element leaves the loop empty but still clears the old slot and decrements length. Deletion from an empty table is rejected.',
      },
      tip: { zh: '删除前移：先搬靠左的，再搬靠右的；最后清空尾部旧副本。', en: 'Deletion shifts left: move the leftmost first; finish by clearing the old tail copy.' },
    },
    {
      stepId: 'traverse',
      title: { zh: '⑥ 遍历：只走 [0, length)', en: '⑥ Traversal: walk only [0, length)' },
      explanation: {
        zh: '遍历从索引 0 到 length-1 依次访问每个有效槽位，展示当前索引与元素。索引 length 及其后的槽位属于空闲区，不能因为槽里偶尔残留临时值就当成有效元素。遍历次数等于 length，所以是 O(n)。',
        en: 'Traversal visits every live slot from index 0 through length-1, showing the current index and value. Index length and everything after it belongs to the free tail; a temporary value left there by an intermediate frame does not make it live. The number of visits equals length, so traversal is O(n).',
      },
      tip: { zh: '循环上界是 length，不是 capacity；这是顺序表最常见的越界来源。', en: 'The loop bound is length, not capacity; this is the most common source of bugs.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑦ 完成帧与不变量：最终槽位必须真实', en: '⑦ Complete frame and invariants: final slots must be real' },
      explanation: {
        zh: '操作完成帧必须满足三个不变量：0 <= length <= capacity；[0, length) 内每个槽位都有真实元素；[length, capacity) 内每个槽位都是 None。中间帧允许出现临时重复值或空位，因为那正是逐个赋值的真实过程，但不能把它解释成操作已经完成。顺序表能随机访问，插入后移，删除前移；和链表相比，它用搬移换来了连续存储与 O(1) 下标访问。',
        en: 'A complete frame must satisfy three invariants: 0 <= length <= capacity; every slot in [0, length) holds a real element; every slot in [length, capacity) is None. Intermediate frames may contain temporary duplicates or holes because that is the real one-assignment-at-a-time process, but they must not be read as a finished operation. The sequential list supports random access; insertion shifts right and deletion shifts left. Compared with a linked list, it trades element movement for contiguous storage and O(1) indexing.',
      },
      tip: { zh: '记忆重点：顺序表能随机访问；插入后移，删除前移。', en: 'Memory line: random access; insertion shifts right, deletion shifts left.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把 capacity 当成当前元素个数，遍历到 capacity 或读取空闲槽位。',
      '插入时从 index 开始向右搬，覆盖尚未搬走的元素；正确顺序是从 length-1 向 index 递减。',
      '删除时从尾部开始向左搬，覆盖尚未读取的右邻元素；正确顺序是从 index 向 length-2 递增。',
      '先修改 length 再搬移，导致循环边界错位或漏搬元素。',
      '删除后忘记把 data[length] 清成 None，让空闲区残留旧值。',
      '误以为 index = length 非法：插入允许追加到第一个空闲槽位，访问和删除不允许。',
      '把顺序表的 O(1) 下标访问误说成按值查找也是 O(1)。',
      '在固定容量实现里假设会自动扩容；本批次满表插入必须被拒绝。',
    ],
    en: [
      'Treating capacity as the current element count and traversing into the free tail.',
      'Inserting by shifting right from index, overwriting an element that has not moved yet; the correct order is length-1 down to index.',
      'Deleting by shifting left from the tail, overwriting an unread right neighbour; the correct order is index up to length-2.',
      'Changing length before the shift loop, which corrupts the loop bounds or skips elements.',
      'Forgetting to clear data[length] after deletion, leaving stale values in the free tail.',
      'Assuming index = length is always illegal: insertion may append into the first free slot, while access and deletion may not.',
      'Confusing O(1) indexed access with O(1) search by value.',
      'Assuming automatic growth in a fixed-capacity implementation; this batch must reject insertion into a full table.',
    ],
  },
};
