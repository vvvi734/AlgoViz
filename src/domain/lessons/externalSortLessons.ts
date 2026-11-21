import type { Lesson } from './types';

/**
 * TEXTBOOK-11 courses. Step ids match the exact `lesson_step` strings emitted
 * by the real Python programs, so playback highlighting never guesses a phase.
 */
export const multiwayMergeLesson: Lesson = {
  lessonId: 'multiway-balanced-merge',
  algorithmId: 'multiway',
  contentVersion: '1.0.0',
  title: {
    zh: '多路平衡归并：k 个候选、缓冲区与模拟写块',
    en: 'Multiway balanced merge: k candidates, buffers and simulated block writes',
  },
  oneLiner: {
    zh: '每个已有序的归并段只暴露缓冲区头作为候选，反复选最小并推进对应段，直到完整有序文件写出。',
    en: 'Each sorted run exposes only its buffer head; repeatedly choose the minimum, advance that run, and finish with one complete sorted file.',
  },
  overview: {
    zh: '外部排序的归并阶段不再重排记录，而是同时维护 k 个已有序段。每段有一个 FIFO 输入缓冲区，只有队首能参与比较；记录被取出后，缓冲区空位才按数据块继续读取。选出的最小记录先进入共享输出缓冲区，满一块后整体写出，并累计一次模拟写块。本课程支持 2–4 路、每段最多 6 条记录，读块数由块大小和缓冲区容量真实推导，写块数由输出缓冲区满块次数推导。所有 I/O 都是教学模型中的事件，不是浏览器访问真实磁盘。',
    en: 'The merge phase does not re-sort records; it maintains k sorted runs. Each run has a FIFO input buffer and only its head is comparable. After a record leaves, the freed space is refilled by the next block. The minimum enters a shared output buffer; a full buffer is written as one simulated block and increments the write count. This course supports 2–4 runs with at most six records each. Read counts are genuinely derived from block size and buffer capacity, and write counts from full output-buffer flushes. All I/O is a teaching-model event, not real browser disk access.',
  },
  intuition: {
    zh: '把 k 个归并段想成 k 条排队通道，每条通道一次只让队首进入候选区。比较 k 个队首，最矮（关键字最小）的那个先通过并进入输出通道；它身后的下一位补上来。若输出通道攒满一块，就整块搬走。某条通道空了且没有后续记录时，它退出候选，其他通道继续。',
    en: 'Think of k runs as k queues, each exposing only its head to the candidate area. Compare the k heads; the smallest passes into the output channel and the next record behind it moves up. When the output channel accumulates a full block, the block is moved out. A queue with no buffered or remaining records leaves the candidate set while the others continue.',
  },
  prerequisites: {
    zh: ['理解归并段内部已经有序', '知道 FIFO 输入缓冲区与输出缓冲区的作用', '能比较 (关键字, 原始下标) 并解释稳定性'],
    en: ['Understanding that each run is already sorted', 'Knowing the roles of FIFO input buffers and the output buffer', 'Comparing (key, originalIndex) and explaining stability'],
  },
  complexity: {
    time: 'O(n × k)；败者树可降至 O(n log k)',
    space: 'O(k × B + B) 个缓冲区槽位，外加输出序列',
    note: {
      zh: '本课程展示的是最直接的线性候选扫描：输出 n 条记录，每条最多比较 k 个候选，因此 O(nk)。教材中的败者树把内部节点保存为比较败者，候选变化后只更新叶到根的一条路径，可将每条记录的选出代价降到 O(log k)，但需要额外树空间。缓冲区容量 B 影响模拟读块次数，不改变最终次序。',
      en: 'This course shows the direct linear scan: n outputs with at most k candidates each, hence O(nk). The textbook loser tree stores comparison losers in internal nodes and updates only one leaf-to-root path after a candidate changes, reducing selection to O(log k) at the cost of tree space. Buffer capacity B changes simulated read counts, never the final order.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 登记 k 个已有序归并段', en: '① Register k sorted runs' },
      explanation: {
        zh: '真实 Python 先检查恰好有 k 段、每段都已非降序，再为记录分配 A、B、C… 的稳定身份。此时各输入缓冲区为空，输出缓冲区为空，读写块计数为 0。段内有序是算法前置条件，不满足会被拒绝而不是悄悄重排。',
        en: 'Real Python first checks that there are exactly k runs and each is non-decreasing, then assigns stable identities A, B, C… Input and output buffers start empty and read/write counts are zero. Internal run order is a precondition; invalid input is rejected rather than silently reordered.',
      },
      tip: {
        zh: '候选不是整段的第一个元素，而是“当前输入缓冲区的队首”。',
        en: 'A candidate is the head of the current input buffer, not necessarily the first element of the whole run.',
      },
    },
    {
      stepId: 'read',
      title: { zh: '② 模拟读块，填充输入缓冲区', en: '② Simulate a block read into an input buffer' },
      explanation: {
        zh: '从某段尚未读入的记录中取 min(块大小, 缓冲区剩余容量, 剩余记录数) 条，追加到该段缓冲区尾部，并把 cursor 前移。每发生一次这样的搬运，模拟读块计数加一。缓冲区满后不会再读，直到有记录被取走腾出空间。',
        en: 'Take min(block size, free buffer capacity, remaining records) records from a run and append them to its buffer, advancing the cursor. Each such transfer increments the simulated read count. A full buffer is not read again until an output frees space.',
      },
      tip: {
        zh: '缓冲区容量为 1 时，每输出一条就要再读一条，读块事件会明显增多。',
        en: 'With capacity 1, every output triggers another read, so read events increase sharply.',
      },
    },
    {
      stepId: 'compare',
      title: { zh: '③ 比较所有未耗尽段的缓冲区头', en: '③ Compare every unfinished run’s buffer head' },
      explanation: {
        zh: '收集每个非空缓冲区的队首，形成候选集合。比较键是 (关键字, originalIndex)：关键字更小者优先；关键字相等时原始下标更小者优先，因此重复关键字仍保持输入次序。已经耗尽的段没有候选，不再参与比较。',
        en: 'Collect the head of every non-empty buffer as the candidate set. The key is (value, originalIndex): a smaller value wins, and equal values are decided by the smaller original index, preserving input order. An exhausted run has no candidate and leaves the comparison.',
      },
      tip: {
        zh: '候选集合可能少于 k：空段会消失，这是正常状态，不是错误。',
        en: 'The candidate set may contain fewer than k entries because empty runs disappear; this is normal.',
      },
    },
    {
      stepId: 'select',
      title: { zh: '④ 选出全局最小候选', en: '④ Select the global minimum candidate' },
      explanation: {
        zh: '线性扫描候选集合，记录当前最小者。此帧只标出赢家，还没有把它移出缓冲区；下一帧 output 才真正推进对应段，便于先看清“选了谁”再看“谁被消费”。本实现没有把普通最小堆命名为败者树；若要复用树形结构，必须实现“内部节点保存败者、只更新一条路径”的真实语义。',
        en: 'Scan the candidate set and record the minimum. This frame only marks the winner; the next output frame actually advances its run, so the learner first sees who was chosen and then what was consumed. This implementation does not rename a min-heap a loser tree; any tree reuse must implement the real semantics of storing losers and updating one path.',
      },
      tip: {
        zh: '赢家必须来自某个缓冲区的队首；不能直接从段中间挑选。',
        en: 'The winner must be some buffer head; it can never be picked from the middle of a run.',
      },
    },
    {
      stepId: 'output',
      title: { zh: '⑤ 写入输出缓冲区，推进对应段', en: '⑤ Append to the output buffer and advance the run' },
      explanation: {
        zh: '赢家从所属缓冲区队首移除，追加到输出缓冲区，该段 cursor 与当前候选随之更新。若输出缓冲区达到容量，就把整块移入已写出区域，模拟写块计数加一。若该段缓冲区空了但还有未读记录，立即再读一块补充。',
        en: 'Remove the winner from its buffer head, append it to the output buffer, and refresh that run’s cursor and candidate. When the output buffer reaches capacity, the whole block moves to the written region and the simulated write count increases. If the run’s buffer is empty but records remain, refill it immediately.',
      },
      tip: {
        zh: '输出缓冲区不是最终结果本身；满块写出后记录才进入“已写出”区域。',
        en: 'The output buffer is not the final result; records enter the written region only when a block is flushed.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑥ 所有段耗尽，完整有序文件写出', en: '⑥ Every run is exhausted and the sorted file is complete' },
      explanation: {
        zh: '当候选集合为空时归并结束。若输出缓冲区还有残余记录，必须再写一个不完整块，不能丢弃尾部。最终断言检查输出条数等于输入总数，并且按 (关键字, 原始下标) 非降序。读块数与写块数只是模拟事件，用于比较不同 k、块大小和缓冲区容量下的 I/O 规模。',
        en: 'Merging ends when no candidate remains. Any residual output-buffer records must be flushed as a final partial block, never dropped. The final assertion checks that output length equals the input total and is non-decreasing by (value, originalIndex). Read/write counts are simulated events for comparing I/O across k, block size and buffer capacity.',
      },
      tip: {
        zh: '多路归并减少的是“归并趟数”的潜力；本课程的单趟演示固定 mergePasses = 1。',
        en: 'Multiway merging reduces the potential number of passes; this single-pass demo fixes mergePasses = 1.',
      },
    },
  ],
  commonMistakes: {
    zh: [
      '把整个归并段都当作候选，而不是只看输入缓冲区头。',
      '候选为空时继续取记录，导致访问越界或死循环。',
      '某段耗尽后仍保留它的旧候选。',
      '只按关键字比较，忽略 originalIndex，重复键次序反转。',
      '把输出缓冲区的当前内容直接当成最终已写出结果。',
      '最后一个不满块没有写出，尾部记录丢失。',
      '把普通最小堆或树形选择树直接称为败者树，却没有“保存败者、单路径更新”的结构。',
    ],
    en: [
      'Treating every record in a run as a candidate instead of only the input-buffer head.',
      'Taking records after the candidate set is empty, causing an invalid access or infinite loop.',
      'Keeping an exhausted run’s stale candidate in the comparison.',
      'Comparing bare keys and ignoring originalIndex, reversing duplicate order.',
      'Treating the current output buffer as the final written result.',
      'Dropping the final partial output block and losing tail records.',
      'Calling an ordinary min-heap or winner tree a loser tree without storing losers and updating one path.',
    ],
  },
};

export const replacementSelectionLesson: Lesson = {
  lessonId: 'replacement-selection-runs',
  algorithmId: 'replacement',
  contentVersion: '1.0.0',
  title: {
    zh: '置换选择排序：用冻结与解冻生成更长的初始归并段',
    en: 'Replacement selection: longer initial runs through freezing and unfreezing',
  },
  oneLiner: {
    zh: '工作区固定，但新读入的记录只要不小于上次输出就仍能进入当前段，因此一个段可以超过工作区容量。',
    en: 'The workspace is fixed, yet a newly read record can stay in the current run whenever it is not below the last output, so a run may exceed the workspace capacity.',
  },
  overview: {
    zh: '置换选择用于生成初始归并段。工作区一开始装入前 M 条记录，全部可输出；每次选可输出集合中的最小值写出，空槽再读入下一条。新记录若小于上次输出，就无法保持当前段非降序，被标记为 frozen；否则继续 eligible。可输出集合为空时封段，解冻全部冻结记录并清空阈值，开始下一段。随机输入下平均段长约为 2M，基本有序输入可能形成一个很长的段。实现始终保留原始身份，相等关键字按 originalIndex 稳定决胜。',
    en: 'Replacement selection builds initial runs. The workspace starts with the first M records, all eligible. Repeatedly emit the minimum eligible record and refill the freed slot. A new record below the last output cannot preserve non-decreasing order and is frozen; otherwise it stays eligible. When nothing is eligible, close the run, unfreeze every frozen record, clear the threshold, and start the next run. Random input averages about 2M per run, while nearly ordered input may produce one very long run. Stable identities are preserved and equal keys break by originalIndex.',
  },
  intuition: {
    zh: '想象工作区是一张只能放 M 张牌的小桌。你不断取走桌上最小且不小于“上次取出值”的牌，再从牌堆补一张。补来的牌如果比刚取走的值小，就先扣在桌角（冻结），这一轮不能再出；等桌上没有可出的牌时，把扣着的牌全部翻回来，开始新的一轮。',
    en: 'Imagine a table holding only M cards. Repeatedly remove the smallest card that is not below the last removed value, then draw one replacement. If the new card is smaller than the last removed value, place it face-down (frozen) and exclude it this round. When no playable card remains, turn every frozen card face-up and start a new round.',
  },
  prerequisites: {
    zh: ['理解初始归并段与段内有序', '知道工作区容量限制的是同时驻留记录数', '能解释“上次输出”作为当前段阈值'],
    en: ['Understanding initial runs and internal order', 'Knowing workspace capacity limits resident records', 'Explaining the last output as the current-run threshold'],
  },
  complexity: {
    time: '每条输出线性扫描工作区 O(M)，共 n 条，O(n × M)',
    space: 'O(M) 工作区 + O(n) 输入与输出段',
    note: {
      zh: '本实现每个输出在至多 M 个可输出记录中线性选最小，n 条记录合计 O(nM)。工作区容量 M 是固定上限，不随 n 增长，因此可视为 O(n) 常数因子。置换选择的收益体现在段数 m：段越长，后续 k 路归并的趟数 s = ⌈log_k m⌉ 越少。',
      en: 'Each output scans at most M eligible records, so n records cost O(nM). M is a fixed bound independent of n, making this O(n) with a constant factor. The benefit appears in the run count m: longer runs reduce later passes s = ⌈log_k m⌉.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 装入首批记录，阈值开放', en: '① Load the first batch; the threshold is open' },
      explanation: {
        zh: '工作区有固定 M 个槽位。前 min(M, n) 条记录依次放入并标记 eligible；剩余槽位标记 empty。lastOutput = null 表示当前段还没有输出，因此所有已装入记录都可参与第一次选择。',
        en: 'The workspace has exactly M slots. The first min(M, n) records enter as eligible; remaining slots are empty. lastOutput = null means the current run has emitted nothing, so every loaded record can join the first selection.',
      },
      tip: {
        zh: '空槽是真实状态，不能被当作关键字 0 的记录。',
        en: 'An empty slot is a real state, not a record with key 0.',
      },
    },
    {
      stepId: 'select',
      title: { zh: '② 选择并输出可输出集合的最小值', en: '② Select and emit the minimum eligible record' },
      explanation: {
        zh: '在 eligible 记录中按 (关键字, originalIndex) 选最小，记录 currentId 后输出：从槽位移除，追加到 currentRun，lastOutput 更新为该值，槽位变空。相等关键字允许继续留在当前段，并由 originalIndex 保持稳定次序。本实现把“选中”和“输出”放在同一个教学步骤，避免把尚未写出的 candidate 当成已完成。',
        en: 'Choose the minimum eligible record by (value, originalIndex), mark currentId, then emit it: remove it from its slot, append to currentRun, update lastOutput, and leave the slot empty. Equal keys may stay in the run and originalIndex preserves stable order. Selection and output share one teaching step so an un-emitted candidate is never mistaken for a completed output.',
      },
      tip: {
        zh: '阈值是“上次输出值”，不是工作区当前最小值；二者不能混用。',
        en: 'The threshold is the last output value, not the current workspace minimum.',
      },
    },
    {
      stepId: 'read',
      title: { zh: '③ 读入下一条并判断能否继续当前段', en: '③ Read the next record and test eligibility' },
      explanation: {
        zh: '若输入仍未耗尽，把下一条记录放入刚空出的槽位，并把 inputIndex 前移。比较它的关键字与 lastOutput：不小于阈值则标记 eligible，可以继续进入当前段；小于阈值则暂时标记 frozen。读入帧先展示新记录与它的初始判定。',
        en: 'If input remains, place the next record into the freed slot and advance inputIndex. Compare its key with lastOutput: at least the threshold means eligible for this run; below it means frozen. The read frame first shows the new record and its initial classification.',
      },
      tip: {
        zh: '“小于”才冻结；相等关键字可以继续，不需要另起一段。',
        en: 'Only a smaller key freezes; an equal key may continue and needs no new run.',
      },
    },
    {
      stepId: 'freeze',
      title: { zh: '④ 冻结低于阈值的新记录', en: '④ Freeze a record below the threshold' },
      explanation: {
        zh: '冻结只改变可输出状态，记录仍留在原槽位。它不能参与当前段，因为一旦输出就会破坏 currentRun 的非降序；它也不会被丢弃，等当前段结束、阈值清零后重新变为 eligible。',
        en: 'Freezing changes only eligibility; the record stays in its slot. It cannot join the current run because emitting it would break non-decreasing order, but it is not discarded: after the run closes and the threshold clears, it becomes eligible again.',
      },
      tip: {
        zh: '冻结记录仍占工作区槽位，工作区并不是“空的”。',
        en: 'Frozen records still occupy workspace slots; the workspace is not empty.',
      },
    },
    {
      stepId: 'segment',
      title: { zh: '⑤ 封段、解冻并开始下一段', en: '⑤ Close the run, unfreeze, and start the next one' },
      explanation: {
        zh: '当 eligible 集合为空时，若 currentRun 非空就整体移入 runs 并发出封段事件。若有 frozen 记录，则全部改回 eligible、lastOutput 置 null、当前段清空，准备下一段。若既无 frozen 也无输入剩余，则所有记录都已归入某个段，可以结束。',
        en: 'When no eligible record remains, a non-empty currentRun is moved into runs and the segment closes. If frozen records exist, they all become eligible, lastOutput clears, and the current run empties for the next segment. If neither frozen records nor input remain, every record already belongs to some run and the process can finish.',
      },
      tip: {
        zh: '解冻后必须清空阈值，否则新段仍会被上一段的输出值错误限制。',
        en: 'Unfreezing must clear the threshold; otherwise the previous run’s last output would wrongly constrain the new run.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '⑥ 输入耗尽，所有初始段有序且覆盖全部记录', en: '⑥ Input exhausted; every run is sorted and the record multiset is preserved' },
      explanation: {
        zh: '结束时工作区为空、当前段为空。真实 Python 断言每条 run 内部按 (关键字, originalIndex) 非降序，并断言所有 run 的记录条数之和等于输入 n。段长可能不同，也可能超过工作区容量 M；这不是错误，而是置换选择的核心效果。',
        en: 'At the end the workspace and current run are empty. Real Python asserts every run is non-decreasing by (value, originalIndex) and the total records across runs equals n. Run lengths may differ and may exceed M; this is the intended effect, not an error.',
      },
      tip: {
        zh: '判断正确性不能只看“段内有序”，还要检查所有输入记录恰好出现一次。',
        en: 'Correctness requires both internal order and exactly one occurrence of every input record.',
      },
    },
  ],
  commonMistakes: {
    zh: [
      '把输入数组按固定长度切片，再假装运行置换选择。',
      '新记录小于阈值时仍强行输出，破坏当前段有序。',
      '冻结记录被直接删除，最终缺少记录。',
      '封段后忘记解冻，或解冻后忘记清空 lastOutput。',
      '把空槽当作关键字 0 参与最小值比较。',
      '只检查段内有序，没有验证所有段合起来与原输入的多重集合相同。',
      '把“段长超过工作区容量”误判为内存越界。',
    ],
    en: [
      'Slicing the input into fixed chunks and pretending replacement selection ran.',
      'Forcing a below-threshold record into the run and breaking its order.',
      'Deleting frozen records so the final runs lose records.',
      'Forgetting to unfreeze after closing a run, or forgetting to clear lastOutput after unfreezing.',
      'Treating an empty slot as key 0 during minimum selection.',
      'Checking only internal run order without verifying the multiset equals the original input.',
      'Mistaking a run longer than the workspace for a memory overflow.',
    ],
  },
};

export const optimalMergeTreeLesson: Lesson = {
  lessonId: 'optimal-merge-tree',
  algorithmId: 'optimal-merge',
  contentVersion: '1.0.0',
  title: {
    zh: '最佳归并树：k 路贪心合并、总代价与虚拟零权重叶',
    en: 'Optimal merge tree: k-way greedy combines, total cost and virtual zero-weight leaves',
  },
  oneLiner: {
    zh: '以归并段长度为权重，每次合并 k 个最轻的根；总代价是所有内部节点权重之和，满 k 叉树不足时要补虚拟零权重叶。',
    en: 'Weight runs by length, combine the k lightest roots each time, and charge the sum of all internal-node weights; add zero-weight virtual leaves when the full k-ary shape needs them.',
  },
  overview: {
    zh: '平衡归并只关心段数，不关心段长。当初始段长度差异明显时，先合并短段能减少它们被重复处理的次数。最佳归并树按贪心策略每次取 k 个权重最小的根，父节点权重为子权重之和，并把它放回森林；重复到只剩一个根。总归并代价是所有内部节点权重之和，不是根权重。真实叶数 n 与 k 路满树可能不匹配，需补 d = ((k−1) − ((n−1) mod (k−1))) mod (k−1) 个零权重虚拟叶。虚拟叶只占结构位置，必须与真实段区分。',
    en: 'Balanced merging counts runs but ignores their lengths. When lengths differ, merging short runs first avoids repeatedly processing them. The optimal merge tree greedily takes the k lightest roots, gives the parent the sum of their weights, and returns it to the forest until one root remains. Total cost is the sum of all internal weights, not the root weight. The real leaf count n may not fit a full k-ary tree, so d = ((k−1) − ((n−1) mod (k−1))) mod (k−1) zero-weight virtual leaves are added. They occupy slots and must be distinguished from real runs.',
  },
  intuition: {
    zh: '短段像小包裹，长段像大箱子。每次把最轻的 k 个包裹捆成一件，捆扎的代价按合并后的总重量计算；小包裹越早被捆，参与的后续次数越少。把所有包裹捆成一件时，所有捆扎重量之和就是总代价。若最后凑不满 k 件一捆，就放入几个重量为 0 的空占位盒，它们不增加重量。',
    en: 'Short runs are light parcels and long runs are heavy boxes. Bundle the k lightest parcels at a time, charging the combined weight; early bundling of light parcels reduces their later handling. When everything becomes one bundle, the sum of all bundle weights is the total cost. If the final level cannot supply k items, insert zero-weight placeholder boxes that add no weight.',
  },
  prerequisites: {
    zh: ['理解初始归并段长度可以作为权重', '知道归并代价按被处理记录条数计算', '会计算满 k 叉树的叶数与内部节点关系'],
    en: ['Understanding run length as a weight', 'Knowing merge cost counts processed records', 'Computing leaves and internal nodes of a full k-ary tree'],
  },
  complexity: {
    time: 'O(n × k)；用堆可降至 O(n log n)',
    space: 'O(n) 个树节点（含虚拟叶）',
    note: {
      zh: '每次合并需要从当前森林中选 k 个最小根；本实现直接排序森林，规模很小时足够直观。总节点数为 n + d 个叶加内部节点，接近 2n 量级。若用优先队列，每次取 k 个最小根并插入父节点可降到 O(n log n)，但小规模教学不必引入堆。',
      en: 'Each combine selects k lightest roots from the current forest; this implementation sorts the forest directly, which is clear at small scale. Total nodes are n + d leaves plus internal nodes, about 2n. A priority queue could take k minima and insert the parent in O(n log n), but small teaching cases do not need a heap.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 建立真实叶，必要时补虚拟叶', en: '① Create real leaves and add virtual leaves if needed' },
      explanation: {
        zh: '每个初始归并段生成长度为权重的真实叶 S0、S1…。然后按 d 公式补入权重 0 的虚拟叶 V0…，使总叶数能被 k 路满树容纳。此时森林包含所有叶，尚未发生任何合并，累计代价为 0。',
        en: 'Each initial run becomes a real leaf S0, S1… weighted by its length. Add d zero-weight virtual leaves V0… so the total leaf count fits a full k-ary tree. The forest contains every leaf, no combine has occurred, and total cost is zero.',
      },
      tip: {
        zh: 'n = 1 时 d = 0，森林已经只有一个根，不需要合并，总代价为 0。',
        en: 'For n = 1, d = 0 and the forest already has one root; no combine is needed and total cost is 0.',
      },
    },
    {
      stepId: 'combine',
      title: { zh: '② 取 k 个最轻根，构造父节点并计代价', en: '② Take the k lightest roots, build a parent, and charge its weight' },
      explanation: {
        zh: '从森林中按 (权重, 真实优先, 节点 id) 选 k 个根。新内部节点 T 的子节点就是这 k 个根，权重为它们的和。把选中的根移出森林、把 T 放回，累计代价增加 T 的权重。相等权重时优先真实节点、再按 id，保证运行可复现。',
        en: 'Select k roots by (weight, real-before-virtual, node id). The new internal node T has exactly those children and weight equal to their sum. Remove the selected roots, insert T, and add T’s weight to the total. Equal weights prefer real nodes first, then id, making runs reproducible.',
      },
      tip: {
        zh: '一次合并的代价是“父节点权重”，累计代价要加上它，而不是用父权重替换累计值。',
        en: 'One combine costs the parent weight; add it to the running total instead of replacing the total.',
      },
    },
    {
      stepId: 'done',
      title: { zh: '③ 森林只剩一个根，总代价等于内部权重和', en: '③ One root remains; total cost equals the sum of internal weights' },
      explanation: {
        zh: '当森林长度为 1 时构造结束。真实 Python 断言每个内部节点恰有 k 个孩子、父权重等于孩子和、每个节点至多一个父节点、forestIds 恰好是无父节点集合、totalCost 等于所有内部权重之和。虚拟叶数量必须与 d 公式一致，且它们权重为 0、不代表真实归并段。',
        en: 'Construction ends when the forest has one root. Real Python asserts every internal node has exactly k children, each parent weight equals its children’s sum, every node has at most one parent, forestIds is exactly the parentless set, and totalCost equals the sum of all internal weights. Virtual leaves must match d, weigh 0, and represent no real run.',
      },
      tip: {
        zh: '最佳归并树与哈夫曼树共享贪心思想，但这里权重是归并段长度、目标是归并代价，不能直接称为哈夫曼编码。',
        en: 'The optimal merge tree shares Huffman’s greedy idea, but weights are run lengths and the objective is merge cost; it is not Huffman coding.',
      },
    },
  ],
  commonMistakes: {
    zh: [
      '每次只取 k 个最小根，却忽略满 k 叉树所需的虚拟叶，最后森林无法合并成一个根。',
      '把虚拟零权重叶当成真实长度为 0 的归并段。',
      '把根节点权重当作总代价，漏加较低层内部节点的权重。',
      '相等权重时采用不稳定次序，导致同一输入产生不同树结构。',
      '对 n = 1 仍强行合并，或要求存在内部节点。',
      '把该构造直接命名为哈夫曼编码，混淆权重含义与目标。',
    ],
    en: [
      'Taking k lightest roots without adding the virtual leaves needed by a full k-ary tree, leaving an unmergeable forest.',
      'Treating a virtual zero-weight leaf as a real zero-length run.',
      'Reporting the root weight as total cost and omitting lower internal weights.',
      'Using an unstable tie order so the same input produces different trees.',
      'Forcing a combine for n = 1 or requiring an internal node that cannot exist.',
      'Calling the construction Huffman coding and confusing weight meaning and objective.',
    ],
  },
};

export const EXTERNAL_SORT_LESSONS: readonly Lesson[] = [
  multiwayMergeLesson,
  replacementSelectionLesson,
  optimalMergeTreeLesson,
];
