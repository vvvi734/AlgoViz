import type { Lesson } from './types';

/**
 * Tournament selection sort course aligned 1:1 with the real Python
 * `lesson_step` values: init, build, select, output, update, done.
 *
 * The stable identity of a record is `originalIndex`; the tree compares the
 * pair `(value, originalIndex)` so equal keys are never conflated.
 */
export const tournamentSortLesson: Lesson = {
  lessonId: 'tree-selection-sort',
  algorithmId: 'tournament',
  contentVersion: '1.0.0',
  title: {
    zh: '树形选择排序：选择树、赢家与路径更新',
    en: 'Tournament selection sort: winner tree and ancestor updates',
  },
  oneLiner: {
    zh: '先把所有记录放进叶节点并自底向上建树，根节点保存当前最小值；每输出一个赢家，只重算它到根的路径，而不是重新扫描全表。',
    en: 'Put every record in a leaf, build the tree bottom-up so the root holds the minimum, and after each output recompute only the winner’s root path instead of rescanning the whole array.',
  },
  overview: {
    zh: '树形选择排序也叫锦标赛排序。它把 n 条记录放在完全二叉树的叶节点，内部节点保存两个孩子中较优的候选；因此根节点就是当前最小记录。输出根节点后，把对应叶标记为失效，再沿该叶到根的路径逐层比较兄弟候选，更新 O(log n) 个祖先即可得到下一个最小值。相比简单选择排序每轮线性扫描 n 条记录，树形选择把“找下一个最小值”的代价降到树高。代价是需要 2n-1 个节点的选择树。本实现比较 (关键字, 原始下标)：相等关键字时原始下标更小者胜出，所以输出序列是稳定的。',
    en: 'Tournament selection sort places n records in the leaves of a complete binary tree. Each internal node stores the better of its two children, so the root is the current minimum. After outputting the root, mark its leaf inactive and recompute only that leaf-to-root path, comparing sibling winners level by level; only O(log n) ancestors change. Compared with simple selection sort, which rescans n records every round, this reduces the cost of finding the next minimum to the tree height, at the price of a 2n-1 node tree. This implementation compares (key, originalIndex), so the earlier record wins an equal-key tie and the output is stable.',
  },
  intuition: {
    zh: '把比赛想成淘汰赛：每条记录是一名选手，第一轮两两比赛，胜者进入上一层；一层层打上去，根节点就是冠军。冠军被“取走”后，不需要让所有人重赛，只需要让冠军原来所在的那条晋级路线重打一遍：它的兄弟、叔伯、直到根节点依次重新比较。',
    en: 'Think of a knockout tournament: records are players, the first round pairs them, winners advance, and the root is the champion. Once the champion is removed you do not replay every match; only the champion’s original advancement path is replayed, comparing its sibling, then the sibling of that winner, up to the root.',
  },
  prerequisites: {
    zh: ['理解完全二叉树的层与槽位编号', '知道内部节点保存的是“候选记录”而不是关键字副本', '能沿父链从叶走到根'],
    en: ['Understanding complete-tree levels and slot numbering', 'Knowing an internal node stores a candidate record, not just a copied key', 'Following a parent chain from a leaf to the root'],
  },
  complexity: {
    time: '建树 O(n)；每输出一个记录更新 O(log n)，共 O(n log n)',
    space: 'O(n) 选择树（2n-1 个节点；补齐到 2 的幂时不超过 4n）',
    note: {
      zh: '选择树有 2n-1 个节点，建树时每个内部节点比较一次，O(n)。之后每轮输出根节点并沿叶到根更新，路径长度是 O(log n)，n 轮共 O(n log n)。比较次数与输入初始顺序无关；空间需要保存整棵树和每条记录的原始身份。把叶容量补齐到 2 的幂会有填充叶，但不改变渐进界。',
      en: 'The tree has 2n-1 nodes and each internal node compares once during construction, O(n). Each round outputs the root and updates one leaf-to-root path of length O(log n), so n rounds cost O(n log n). The comparison count is independent of the input order. Space stores the whole tree plus each record’s stable identity. Padding leaves up to a power of two do not change the asymptotic bound.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 登记记录与原始身份', en: '① Register records and stable identities' },
      explanation: {
        zh: '真实 Python 先读入整数数组，为每条记录分配稳定身份 A、B、C……并记录 originalIndex。相同关键字的记录仍是不同对象；后续比较使用 (value, originalIndex)，不是只比较数值。',
        en: 'Real Python reads the integer array, assigns each record a stable identity A, B, C…, and records its originalIndex. Records with equal keys remain distinct objects; later comparisons use (value, originalIndex), not the bare value.',
      },
      tip: {
        zh: '稳定性不能只看 (3,3) 这样的纯数字；必须能区分“先出现的 3”和“后出现的 3”。',
        en: 'Stability cannot be shown by bare numbers such as (3,3); you must distinguish the earlier 3 from the later 3.',
      },
    },
    {
      stepId: 'build',
      title: { zh: '② 叶节点就位，自底向上建树', en: '② Place leaves and build bottom-up' },
      explanation: {
        zh: '记录按输入次序放进叶节点；叶数补齐到 2 的幂，空槽是填充叶，不是关键字 0。每个内部节点比较左右孩子的赢家，把较优记录上送。全部内部节点填完后，根节点就是当前最小记录。',
        en: 'Records enter leaves in input order; leaves are padded to a power of two, and empty slots are padding leaves rather than key 0. Each internal node compares its two child winners and promotes the better record. When every internal node is filled, the root is the current minimum.',
      },
      tip: {
        zh: '填充叶没有记录，不能被当成值为 0 的真实元素。',
        en: 'A padding leaf has no record and must never be treated as a real key 0.',
      },
    },
    {
      stepId: 'select',
      title: { zh: '③ 根节点给出当前赢家', en: '③ The root exposes the current winner' },
      explanation: {
        zh: '当前根节点保存的 recordId 就是剩余记录中的最小者。相等关键字时，originalIndex 较小者胜出，因此相同键保持输入相对次序。根节点不是“最近比较的节点”，而是整棵树结果的唯一出口。',
        en: 'The recordId stored at the root is the smallest remaining record. On equal keys the smaller originalIndex wins, preserving input order among equal keys. The root is the single exit for the whole tree, not merely the most recently compared node.',
      },
      tip: {
        zh: '输出前不要重新扫描数组；根节点已经是当前最小值。',
        en: 'Do not rescan the array before output; the root already is the current minimum.',
      },
    },
    {
      stepId: 'output',
      title: { zh: '④ 输出赢家，形成有序前缀', en: '④ Output the winner into the sorted prefix' },
      explanation: {
        zh: '根节点赢家被追加到输出序列，形成稳定升序前缀。此时对应叶仍标记为 active，下一帧 update 才把它置为失效；这是为了让学生先看清“谁被输出”，再看“谁被移除”。',
        en: 'The root winner is appended to the output sequence, growing the stable ascending prefix. Its leaf is still active in this frame; the next update frame deactivates it, so the learner first sees who was output and then what was removed.',
      },
      tip: {
        zh: '输出帧与移除帧分开，避免“输出了但树还没变”的状态混淆。',
        en: 'Keeping output and removal in separate frames avoids the confusing state where a record was output but the tree has not changed yet.',
      },
    },
    {
      stepId: 'update',
      title: { zh: '⑤ 标记叶失效，只重算祖先路径', en: '⑤ Deactivate the leaf and recompute only ancestors' },
      explanation: {
        zh: '把赢家叶置为 inactive，然后从该叶的父节点开始逐层重算，直到根。每一层只比较左右孩子当前保存的候选；失效记录会被过滤，因此空子树会把另一个孩子整体上送。其他分支完全没有被访问。',
        en: 'Mark the winner leaf inactive, then recompute from its parent up to the root. Each level compares the candidates currently stored by its two children; inactive records are filtered out, so an empty subtree promotes the other child wholesale. Every other branch is untouched.',
      },
      tip: {
        zh: '只更新受到影响的路径，是树形选择优于“每轮全表扫描”的核心。',
        en: 'Updating only the affected path is the core advantage over rescanning the whole table every round.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑥ 全部输出，树为空', en: '⑥ All records output, tree exhausted' },
      explanation: {
        zh: 'n 条记录全部进入输出序列后，所有叶都失效、根节点为空。输出序列按关键字升序，且相等关键字保持原始相对次序。总比较次数由建树和 n 条路径更新组成，不随输入顺序剧烈波动。',
        en: 'After all n records enter the output sequence, every leaf is inactive and the root is empty. The output is ascending by key, and equal keys keep their original relative order. Total comparisons consist of the build plus n path updates and do not swing with input order.',
      },
      tip: {
        zh: '记忆重点：叶放记录 → 内部节点存赢家 → 根输出 → 只重算叶到根。',
        en: 'Memory hook: records in leaves → winners in internal nodes → root output → recompute only the leaf-to-root path.',
      },
    },
  ],
  commonMistakes: {
    zh: [
      '把内部节点存成关键字副本，丢失原始身份，无法解释稳定性。',
      '填充叶被当作值为 0 的真实记录参与比较。',
      '输出赢家后重新扫描全部叶节点，退化成简单选择排序。',
      '只更新赢家叶的父节点，没有继续更新到根。',
      '把失效叶从树中删除并改变节点编号，导致父子链断裂。',
      '直接比较数值而忽略 originalIndex，相等关键字次序反转。',
    ],
    en: [
      'Storing only copied keys in internal nodes and losing stable identities, making stability impossible to explain.',
      'Treating padding leaves as real records with value 0.',
      'Rescanning every leaf after each output, which degenerates to simple selection sort.',
      'Updating only the winner leaf’s parent instead of continuing to the root.',
      'Deleting the inactive leaf and renumbering nodes, which breaks parent-child links.',
      'Comparing bare values and ignoring originalIndex, reversing equal-key order.',
    ],
  },
};
