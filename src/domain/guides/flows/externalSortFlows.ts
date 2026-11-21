import type { AlgorithmFlow } from '../flowTypes';
import { flowEdge, flowEnd, flowNode, flowSection, loopEdge } from './flowDsl';

/**
 * TEXTBOOK-11 flows. Each section traces control decisions, not frame captions:
 * candidate exhaustion, buffer refills, run closure and forest reduction all
 * have explicit back edges and terminal states.
 */

const MULTIWAY_FLOW: AlgorithmFlow = {
  algorithmId: 'multiway',
  sections: [
    flowSection(
      'merge',
      ['主流程：k 路归并', 'Main flow: k-way merge'],
      ['初始化 k 个缓冲区后反复取候选最小值；输出缓冲区满时写出，段缓冲区空且仍有未读记录时补读，候选耗尽后写出尾块。', 'After initialising k buffers, repeatedly emit the smallest candidate; flush when the output buffer is full, refill a run buffer when empty input remains, and write the final partial block after candidates run out.'],
      [
        flowNode('mw-start', 'start', 0, 0, ['开始：k 路平衡归并', 'Start: k-way balanced merge']),
        flowNode('mw-init', 'operation', 1, 0, ['登记 k 个有序段，清空全部缓冲区', 'Register k sorted runs and clear all buffers']),
        flowNode('mw-loop', 'decision', 2, 0, ['还有候选记录吗？', 'Any candidate left?']),
        flowNode('mw-final-flush', 'operation', 3, 1, ['写出最后一个不满块', 'Write the final partial block']),
        flowEnd('mw-done', 4, 1, 'success', ['所有段耗尽：完整有序文件写出', 'All runs exhausted: the sorted file is complete']),
        flowNode('mw-compare', 'operation', 3, 0, ['比较各段缓冲区头，选最小候选', 'Compare buffer heads and choose the minimum']),
        flowNode('mw-output', 'operation', 4, 0, ['赢家进入输出缓冲区，对应段前进', 'Append the winner and advance its run']),
        flowNode('mw-buffer-full', 'decision', 5, 0, ['输出缓冲区满了吗？', 'Is the output buffer full?']),
        flowNode('mw-flush', 'operation', 5, 1, ['满块写出，模拟写块计数加一', 'Flush the block and increment the simulated write count']),
        flowNode('mw-run-empty', 'decision', 6, 0, ['该段缓冲区空且仍有未读记录吗？', 'Is the run buffer empty while records remain?']),
        flowNode('mw-read', 'operation', 7, 0, ['读入下一块，模拟读块计数加一', 'Read the next block and increment the simulated read count']),
      ],
      [
        flowEdge('mw-start', 'mw-init'),
        flowEdge('mw-init', 'mw-loop'),
        flowEdge('mw-loop', 'mw-final-flush', 'no'),
        flowEdge('mw-final-flush', 'mw-done'),
        flowEdge('mw-loop', 'mw-compare', 'yes'),
        flowEdge('mw-compare', 'mw-output'),
        flowEdge('mw-output', 'mw-buffer-full'),
        flowEdge('mw-buffer-full', 'mw-flush', 'yes'),
        loopEdge('mw-flush', 'mw-loop', ['写出后继续取下一个候选', 'After flushing, take the next candidate']),
        flowEdge('mw-buffer-full', 'mw-run-empty', 'no'),
        flowEdge('mw-run-empty', 'mw-read', 'yes'),
        loopEdge('mw-read', 'mw-loop', ['补读后继续比较候选', 'After refilling, compare candidates again']),
        loopEdge('mw-run-empty', 'mw-loop', ['缓冲区仍有记录：回到候选比较', 'The buffer still has records: return to candidate comparison'], 'no'),
      ],
    ),
  ],
};

const REPLACEMENT_FLOW: AlgorithmFlow = {
  algorithmId: 'replacement',
  sections: [
    flowSection(
      'runs',
      ['主流程：生成初始归并段', 'Main flow: build initial runs'],
      ['可输出集合为空时先封段，再解冻冻结记录；否则反复选最小值、输出、读入并判定是否冻结。', 'When the eligible set is empty, close the run and then unfreeze frozen records; otherwise repeatedly emit the minimum, read a replacement, and decide whether it freezes.'],
      [
        flowNode('rs-start', 'start', 0, 0, ['开始：置换选择', 'Start: replacement selection']),
        flowNode('rs-init', 'operation', 1, 0, ['工作区装入首批记录，阈值 open', 'Load the first workspace batch; threshold open']),
        flowNode('rs-loop', 'decision', 2, 0, ['还有可输出记录吗？', 'Any eligible record?']),
        flowNode('rs-have-current', 'decision', 3, 1, ['当前段非空吗？', 'Is the current run non-empty?']),
        flowNode('rs-close', 'operation', 4, -1, ['封段：当前段移入已完成集合', 'Close the run into the completed set']),
        flowNode('rs-have-frozen', 'decision', 5, 1, ['还有冻结记录吗？', 'Any frozen record left?']),
        flowNode('rs-unfreeze', 'operation', 6, 1, ['解冻全部记录，清空上次输出阈值', 'Unfreeze every record and clear the last-output threshold']),
        flowEnd('rs-done', 6, 0, 'success', ['输入耗尽且工作区清空：段全部生成', 'Input exhausted and workspace empty: all runs built']),
        flowNode('rs-select', 'operation', 3, 0, ['选可输出最小值，输出到当前段', 'Select the eligible minimum and emit it']),
        flowNode('rs-input', 'decision', 4, 0, ['输入还有剩余记录吗？', 'Any input record left?']),
        flowNode('rs-read', 'operation', 5, 0, ['读入下一条到刚空出的槽位', 'Read the next record into the freed slot']),
        flowNode('rs-threshold', 'decision', 6, -1, ['新记录小于上次输出吗？', 'Is the new record below the last output?']),
        flowNode('rs-freeze', 'operation', 7, -1, ['冻结到下一归并段', 'Freeze it for the next run']),
      ],
      [
        flowEdge('rs-start', 'rs-init'),
        flowEdge('rs-init', 'rs-loop'),
        flowEdge('rs-loop', 'rs-have-current', 'no'),
        flowEdge('rs-have-current', 'rs-close', 'yes'),
        flowEdge('rs-have-current', 'rs-have-frozen', 'no'),
        flowEdge('rs-close', 'rs-have-frozen'),
        flowEdge('rs-have-frozen', 'rs-unfreeze', 'yes'),
        loopEdge('rs-unfreeze', 'rs-loop', ['开始下一段，重新选择', 'Start the next run and select again']),
        flowEdge('rs-have-frozen', 'rs-done', 'no'),
        flowEdge('rs-loop', 'rs-select', 'yes'),
        flowEdge('rs-select', 'rs-input'),
        flowEdge('rs-input', 'rs-read', 'yes'),
        loopEdge('rs-input', 'rs-loop', ['输入耗尽：回到可输出检查', 'Input exhausted: return to eligibility check'], 'no'),
        flowEdge('rs-read', 'rs-threshold'),
        flowEdge('rs-threshold', 'rs-freeze', 'yes'),
        loopEdge('rs-freeze', 'rs-loop', ['冻结后继续选择', 'After freezing, continue selecting']),
        loopEdge('rs-threshold', 'rs-loop', ['不小于阈值：继续当前段', 'At least the threshold: continue the current run'], 'no'),
      ],
    ),
  ],
};

const OPTIMAL_FLOW: AlgorithmFlow = {
  algorithmId: 'optimal-merge',
  sections: [
    flowSection(
      'forest',
      ['主流程：构造最佳归并树', 'Main flow: build the optimal merge tree'],
      ['先登记真实叶并按公式补虚拟叶；森林多于一个根时反复取 k 个最轻根合并，父节点放回森林，直到只剩一个根。', 'Register real leaves and add virtual leaves by the formula; while more than one root remains, combine the k lightest roots and return the parent to the forest until one root is left.'],
      [
        flowNode('om-start', 'start', 0, 0, ['开始：构造最佳归并树', 'Start: build the optimal merge tree']),
        flowNode('om-real', 'operation', 1, 0, ['以真实归并段长度建立叶节点', 'Create leaves from real run lengths']),
        flowNode('om-virtual', 'operation', 2, 0, ['按 d 公式补零权重虚拟叶', 'Add zero-weight virtual leaves by d']),
        flowNode('om-loop', 'decision', 3, 0, ['森林中多于一个根吗？', 'Does the forest have more than one root?']),
        flowEnd('om-done', 3, 1, 'success', ['只剩一个根：返回总归并代价', 'One root remains: return total merge cost']),
        flowNode('om-select', 'operation', 4, 0, ['选取 k 个权重最小的根', 'Select the k lightest roots']),
        flowNode('om-combine', 'operation', 5, 0, ['构造父节点：权重 = 子权重之和', 'Build a parent whose weight is the children’s sum']),
        flowNode('om-cost', 'operation', 6, 0, ['累计代价加上父节点权重', 'Add the parent weight to the total cost']),
        flowNode('om-reinsert', 'operation', 7, 0, ['父节点放回森林，移除已选根', 'Return the parent and remove the selected roots']),
      ],
      [
        flowEdge('om-start', 'om-real'),
        flowEdge('om-real', 'om-virtual'),
        flowEdge('om-virtual', 'om-loop'),
        flowEdge('om-loop', 'om-done', 'no'),
        flowEdge('om-loop', 'om-select', 'yes'),
        flowEdge('om-select', 'om-combine'),
        flowEdge('om-combine', 'om-cost'),
        flowEdge('om-cost', 'om-reinsert'),
        loopEdge('om-reinsert', 'om-loop', ['森林缩小 k−1 个节点，继续判断', 'The forest shrinks by k−1 nodes; test again']),
      ],
    ),
  ],
};

export const EXTERNAL_SORT_FLOWS: Record<string, AlgorithmFlow> = {
  multiway: MULTIWAY_FLOW,
  replacement: REPLACEMENT_FLOW,
  'optimal-merge': OPTIMAL_FLOW,
};
