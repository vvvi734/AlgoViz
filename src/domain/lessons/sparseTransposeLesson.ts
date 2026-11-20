import type { Lesson } from './types';

/**
 * MATRIX-01 sparse fast-transpose course.
 *
 * Step ids are exactly the `lesson_step` values emitted by
 * `SPARSE_TRANSPOSE_PYTHON` in `sparseTransposeExamples.ts`. The lesson
 * deliberately explains the invariants without repeating the animation's
 * concrete preset values.
 */
export const sparseTransposeLesson: Lesson = {
  lessonId: 'sparse-transpose-fast',
  algorithmId: 'sparse-transpose',
  contentVersion: '1.0.0',
  title: {
    zh: '稀疏矩阵快速转置：num 与 cpot 的一次定位',
    en: 'Fast sparse transpose: placing every triplet with num and cpot',
  },
  oneLiner: {
    zh: '在不重新排序三元组的前提下，先统计每一列的非零个数 num，再递推每一列的起始槽 cpot，把每个元素一次写入转置表的最终位置。',
    en: 'Without re-sorting the triplet list, count each column into num, derive each column’s starting slot in cpot, and write every entry once into its final position.',
  },
  overview: {
    zh: '稀疏矩阵用三元组表只记录非零元素。若逐条交换 row 与 col，得到的记录不再按转置矩阵的行优先顺序排列；若再排序，代价会升高。快速转置把问题拆成三步：第一遍扫描统计原矩阵每一列的非零个数 num；由 num 递推出每一列在结果表中的起始槽 cpot；第二遍扫描按源三元组的行优先顺序，把每个元素直接放到 cpot 指向的槽，并让该列的 cpot 前移。结果表天然按转置矩阵的行优先排列，时间 O(t+c)，额外辅助空间 O(c)，结果表本身占 O(t)。',
    en: 'A sparse matrix stores only non-zeros in a triplet list. Swapping row and col entry by entry destroys the row-major order of the transpose; sorting again costs more. Fast transpose splits the work into three stages: a first scan counts non-zeros per original column into num; num yields each column’s starting slot cpot in the result; a second scan places each source triplet directly into the slot cpot points to, then advances that column’s cpot. The result is already row-major for the transpose. Time is O(t+c), extra working space O(c), and the result table itself is O(t).',
  },
  intuition: {
    zh: '把结果三元组表想成由若干“列块”拼成：原矩阵第 0 列的所有元素构成转置矩阵第 0 行，应该占据结果表最前面的一段；第 1 列紧接其后，依此类推。num 决定每个块有多长，cpot 决定每个块从哪里开始。cpot 是一组会移动的书签：每写入一个元素，对应列的书签就向后挪一格，因此同一列的下一个元素不会和上一个冲突。源表只读一遍，结果表只写一遍。',
    en: 'Think of the result list as consecutive column blocks: every entry of original column 0 forms transpose row 0 and occupies the first block, column 1 follows, and so on. num gives each block’s length; cpot gives its start. cpot entries are moving bookmarks: after writing one entry, that column’s bookmark advances one slot, so the next entry of the same column cannot collide with it. The source is read once and the result written once.',
  },
  prerequisites: {
    zh: [
      '理解稀疏矩阵、三元组 (row, col, value) 与行优先顺序',
      '能从原矩阵的“列”解释转置矩阵的“行”',
      '会写一维数组的前缀和 / 递推',
      '清楚 0 基下标与 1 基教材写法的区别',
      '理解“结果表空间”和“额外辅助空间”不是同一件事',
    ],
    en: [
      'Sparse matrices, (row, col, value) triplets and row-major order',
      'Why a column of the original becomes a row of the transpose',
      'Prefix sums and simple recurrences over a 1D array',
      'The difference between 0-based indices and 1-based textbook forms',
      'Why result storage and extra working storage are different costs',
    ],
  },
  complexity: {
    time: 'O(t + c)',
    space: 'O(c)',
    note: {
      zh: '第一遍扫描 t 个三元组统计 num，是 O(t)；递推 c 列得到 cpot，是 O(c)；第二遍再扫描 t 个三元组并写入结果，是 O(t)。总计 O(t+c)。额外辅助空间只有 num、cpot 等长度为 c 的数组，是 O(c)；结果三元组表本身有 t 条记录，属于输出空间 O(t)，不应算进辅助空间。空矩阵或空列时仍要正确返回空结果。',
      en: 'The first scan over t triplets counts num in O(t); the recurrence over c columns builds cpot in O(c); the second scan over t triplets writes the result in O(t), for O(t+c) total. Extra working space is the length-c num/cpot arrays, O(c). The result triplet list itself has t records and is output storage O(t), not auxiliary space. Empty matrices and empty column sets must still return a correct empty result.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 读入矩阵尺寸与三元组表', en: '① Read the matrix shape and triplet list' },
      explanation: {
        zh: '真实 Python 先读取行数、列数与非零三元组，检查坐标不越界、值非零、三元组严格行优先且坐标唯一。随后建立稠密视图只用于展示；算法本身只在三元组表上工作。',
        en: 'Real Python reads row count, column count and non-zero triplets, checking bounds, non-zero values, strict row-major order and unique coordinates. A dense view is built for display only; the algorithm itself works on the triplet list.',
      },
      tip: { zh: '原矩阵的行列数决定 num/cpot 的长度，不能被三元组条数替代。', en: 'The original shape fixes num/cpot lengths; the triplet count does not.' },
    },
    {
      stepId: 'count-start',
      title: { zh: '② num 清零：准备按列计数', en: '② Clear num: prepare per-column counting' },
      explanation: {
        zh: 'num 的长度等于原矩阵的列数 c。之所以统计“列”，是因为原矩阵第 j 列的所有非零元素，转置后正好组成转置矩阵的第 j 行，也就是结果三元组表中的一个连续块。',
        en: 'num has one entry per original column c. Columns are counted because original column j becomes transpose row j after the transpose, i.e. one contiguous block of the result triplet list.',
      },
      tip: { zh: '统计列而不是统计行：转置把列变成行。', en: 'Count columns, not rows: transposing turns columns into rows.' },
    },
    {
      stepId: 'count-scan',
      title: { zh: '③ 扫描三元组：num[col] 加一', en: '③ Scan a triplet: increment num[col]' },
      explanation: {
        zh: '循环遍历每一条源三元组，只读取它的列号 col，并让 num[col] 加一。每条三元组恰好访问一次，所以这一段是 O(t)；此时还不写结果表。',
        en: 'The loop visits every source triplet, reads only its column col and increments num[col]. Each triplet is visited once, so this stage is O(t); the result list is not written yet.',
      },
      tip: { zh: '源三元组的行号在这里不参与计数。', en: 'The source row number plays no role in this count.' },
    },
    {
      stepId: 'count-complete',
      title: { zh: '④ num 完成：每列长度已知', en: '④ num complete: every column length is known' },
      explanation: {
        zh: '扫描结束后，num[c] 等于原矩阵第 c 列的非零元素个数，也就是结果表中第 c 个列块的长度。所有 num 之和必须等于非零元素总数 t；若不等，说明扫描或输入有错。',
        en: 'After the scan, num[c] is the number of non-zeros in original column c, i.e. the length of result block c. The sum of all num entries must equal the total non-zero count t; otherwise the scan or input is wrong.',
      },
      tip: { zh: '先验不变量：sum(num) = t。', en: 'Invariant to check first: sum(num) = t.' },
    },
    {
      stepId: 'cpot-start',
      title: { zh: '⑤ cpot[0] = 0：第一个列块从 0 开始', en: '⑤ cpot[0] = 0: the first block starts at 0' },
      explanation: {
        zh: '结果表使用 0 基槽号。第 0 列前面没有任何列块，因此它的起始槽是 0。若矩阵没有列（c=0），则不存在 cpot[0]，直接得到一个空结果表。',
        en: 'Result slots are 0-based. Nothing precedes column block 0, so its starting slot is 0. If the matrix has no columns (c=0), cpot[0] does not exist and the result is empty.',
      },
      tip: { zh: '空列数要单独处理，不能访问 cpot[0]。', en: 'Handle c=0 separately; never read cpot[0] when there are no columns.' },
    },
    {
      stepId: 'cpot-compute',
      title: { zh: '⑥ 递推 cpot[c] = cpot[c−1] + num[c−1]', en: '⑥ Recur: cpot[c] = cpot[c−1] + num[c−1]' },
      explanation: {
        zh: '第 c 列前面依次放着第 0 到第 c−1 列的全部元素，因此它的起点等于前一列起点加上前一列长度。这个递推有严格的数据依赖：cpot[c] 必须等 cpot[c−1] 与 num[c−1] 都确定后才能算。',
        en: 'Blocks 0 through c−1 sit before block c, so its start equals the previous start plus the previous block length. The recurrence has a strict data dependency: cpot[c] cannot be computed until cpot[c−1] and num[c−1] are known.',
      },
      tip: { zh: '加的是 num[c−1]，不是 num[c]。', en: 'Add num[c−1], not num[c].' },
    },
    {
      stepId: 'cpot-complete',
      title: { zh: '⑦ cpot 完成：每个列块都有起点', en: '⑦ cpot complete: every block has a start' },
      explanation: {
        zh: '所有 cpot 项确定后，最后一列的起点加上它的长度应当等于 t，也就是结果表的长度。若结果表为空，所有起点都应落在 0，不能出现越界槽号。',
        en: 'Once every cpot entry is fixed, the last column’s start plus its length must equal t, the result length. For an empty result, every start must be 0 and no slot may go out of bounds.',
      },
      tip: { zh: '边界检查：cpot[c−1] + num[c−1] = t。', en: 'Boundary check: cpot[c−1] + num[c−1] = t.' },
    },
    {
      stepId: 'place-start',
      title: { zh: '⑧ 重新扫描源表，准备直接放置', en: '⑧ Rescan the source and prepare direct placement' },
      explanation: {
        zh: '进入第二阶段：结果表先分配 t 个空槽，cpot 作为可变的“下一空槽”指针使用。源表仍按行优先顺序读取，这个顺序保证同一列内的元素先后关系不会被破坏。',
        en: 'Stage two begins: the result list allocates t empty slots and cpot becomes a mutable next-free-slot pointer. The source is still read in row-major order, which preserves the relative order of entries within each column.',
      },
      tip: { zh: 'cpot 此时不是只读的起点表，而是会移动的写入指针。', en: 'cpot is no longer a read-only start table; it is a moving write pointer.' },
    },
    {
      stepId: 'place-read',
      title: { zh: '⑨ 读取源三元组，计算 q = cpot[col]', en: '⑨ Read a source triplet and compute q = cpot[col]' },
      explanation: {
        zh: '取出当前源三元组的 row、col、value，记 q = cpot[col]。q 就是这条元素在结果表中的最终槽：该列之前的列块已经全部占满，而该列已经写入的元素也已由 cpot 前移跳过。此步只读，不修改结果表和 cpot。',
        en: 'Read the current source triplet’s row, col and value, then set q = cpot[col]. q is this entry’s final result slot: earlier column blocks are already full, and entries already written in this column were skipped by advancing cpot. This step only reads; it changes neither the result nor cpot.',
      },
      tip: { zh: 'q 是结果槽号，不是源三元组的下标。', en: 'q is a result slot, not the source triplet index.' },
    },
    {
      stepId: 'place-write',
      title: { zh: '⑩ 写入 (col, row, value)', en: '⑩ Write (col, row, value)' },
      explanation: {
        zh: '转置把原坐标 (row, col) 变成 (col, row)，值不变。把新三元组写到 result[q]，不移动其他元素，也不重新排序；q 已由列块布局保证正确。',
        en: 'Transposing changes (row, col) into (col, row) while keeping the value. Write the new triplet to result[q] without moving other entries or sorting again; the column-block layout already guarantees q is correct.',
      },
      tip: { zh: '交换的是坐标，不是值；写入位置由 q 决定。', en: 'Coordinates swap, values do not; q decides where to write.' },
    },
    {
      stepId: 'place-update',
      title: { zh: '⑪ cpot[col] = q + 1：该列指针前移', en: '⑪ cpot[col] = q + 1: advance that column' },
      explanation: {
        zh: '刚写过的槽 q 已被占用，因此把该列的 cpot 改为 q+1，指向下一个空槽。若不更新，同一列的下一条元素会覆盖刚写入的记录；只更新当前列，其他列的指针不动。',
        en: 'Slot q is now occupied, so cpot for that column becomes q+1, the next free slot. Without the update, the next entry of the same column would overwrite the record just written; only the current column moves.',
      },
      tip: { zh: '写与更新分开：先确认写入成功，再移动指针。', en: 'Keep write and update separate: confirm the write, then move the pointer.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑫ 完成：结果表已按转置行优先排列', en: '⑫ Done: the result is row-major for the transpose' },
      explanation: {
        zh: '源表扫描结束后，每个结果槽都已写入一次。由于列块按 col 从 0 到 c−1 排列，同一列内又按源表行优先顺序写入，结果表正好是转置矩阵的行优先三元组表。时间复杂度 O(t+c)，额外辅助空间 O(c)，结果表空间 O(t)。',
        en: 'After the source scan, every result slot has been written exactly once. Column blocks are ordered by col from 0 to c−1, and within a block entries follow the source row-major order, so the result is exactly the transpose’s row-major triplet list. Time O(t+c), extra working space O(c), result storage O(t).',
      },
      tip: { zh: '不要用“交换后排序”的 O(t log t) 或逐列扫描的 O(t·c) 替代本算法。', en: 'Do not substitute a swap-then-sort O(t log t) or a per-column scan O(t·c) for this algorithm.' },
    },
  ],
  commonMistakes: {
    zh: [
      '把 num 统计成每一行的非零个数；转置后行的长度来自原矩阵的列。',
      'cpot 递推时错写成加 num[c]，正确项是 num[c−1]。',
      '第二遍扫描前忘记把 cpot 重置为起始位置，或把 cpot 当成只读数组。',
      '写入后不更新 cpot[col]，导致同一列的后一个元素覆盖前一个。',
      '把结果槽号 q 与源三元组下标 k 混为一谈。',
      '只交换 row/col 就认为结果已按行优先，遗漏必要的定位步骤。',
      '把结果表 O(t) 也算进额外辅助空间，或把时间误写成 O(m·n)。',
      '忽略空矩阵、空列、单行/单列与矩形矩阵的边界。',
      '把 1 基教材的 next/cpot 记法与这里 0 基的 cpot 混用。',
    ],
    en: [
      'Counting non-zeros per row instead of per column; transpose row lengths come from original columns.',
      'Using num[c] in the cpot recurrence instead of num[c−1].',
      'Forgetting to treat cpot as a mutable cursor during placement, or failing to initialise it.',
      'Not advancing cpot[col] after a write, so the next entry in that column overwrites the previous one.',
      'Confusing result slot q with source triplet index k.',
      'Assuming a bare row/col swap already yields row-major output and skipping the placement logic.',
      'Counting the O(t) result table as auxiliary space, or reporting O(m·n) time.',
      'Ignoring empty matrices, empty column sets, single-row/column and rectangular shapes.',
      'Mixing a 1-based textbook cpot/next convention with the 0-based cpot used here.',
    ],
  },
};
