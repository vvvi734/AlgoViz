import type { AlgorithmFlow } from '../flowTypes';
import { flowEdge, flowEnd, flowNode, flowSection, loopEdge } from './flowDsl';

/**
 * Flowcharts for the two expression-stack algorithms.
 *
 * These are loops with real token classification and precedence branches, not a
 * row of step cards. Every loop edge points back to an earlier row so the
 * layout engine can route it through its gutter and number it in the legend.
 */

const INFIX_TO_POSTFIX_FLOW: AlgorithmFlow = {
  algorithmId: 'infix-to-postfix',
  sections: [
    flowSection(
      'convert',
      ['主流程：中缀 → 后缀', 'Main flow: infix → postfix'],
      [
        '扫描 token：操作数直接输出；左括号入栈；右括号弹到左括号；运算符先弹掉优先级不低于自己的栈顶，再入栈。扫描完清空栈。',
        'Scan tokens: operands emit directly; a left parenthesis is pushed; a right parenthesis pops back to it; an operator first pops tops with greater-or-equal precedence, then pushes. Flush the stack at the end.',
      ],
      [
        flowNode('infix-start', 'start', 0, 0, ['开始：读入中缀表达式', 'Start: read the infix expression']),
        flowNode('infix-init', 'operation', 1, 0, ['运算符栈 = 空；后缀 = 空；i = 0', 'operator_stack = []; postfix = []; i = 0']),
        flowNode('infix-loop', 'decision', 2, 0, ['i < token 数量？', 'Is i < token count?']),
        flowNode('infix-number', 'decision', 3, 0, ['当前 token 是操作数？', 'Is the current token an operand?']),
        flowNode('infix-emit', 'operation', 4, -1, ['后缀追加该完整数字；i++', 'Append the whole number to postfix; i++']),
        flowNode('infix-lparen', 'decision', 5, 0, ['当前 token 是 ( ？', 'Is the current token ( ?']),
        flowNode('infix-push-lparen', 'operation', 6, -1, ['左括号入栈；i++', 'Push the left parenthesis; i++']),
        flowNode('infix-rparen', 'decision', 7, 0, ['当前 token 是 ) ？', 'Is the current token ) ?']),
        flowNode('infix-pop-to-lparen', 'operation', 8, -1, ['弹出并输出运算符，直到栈顶是 (；再丢弃 (', 'Pop and emit until top is (; then discard (']),
        flowNode('infix-unmatched', 'decision', 9, -1, ['找到匹配的左括号？', 'Was a matching ( found?']),
        flowEnd('infix-error-end', 10, -1, 'failure', ['报错：括号不匹配', 'Error: unbalanced parentheses']),
        flowNode('infix-top-priority', 'decision', 8, 1, ['栈顶是运算符且优先级 ≥ 当前？', 'Top is an operator with precedence ≥ current?']),
        flowNode('infix-pop-top', 'operation', 9, 1, ['弹出栈顶并追加到后缀；继续比较', 'Pop top into postfix; compare again']),
        flowNode('infix-push-op', 'operation', 10, 0, ['当前运算符入栈；i++', 'Push the current operator; i++']),
        flowNode('infix-flush-check', 'decision', 11, 1, ['运算符栈非空？', 'Is the operator stack non-empty?']),
        flowNode('infix-flush', 'operation', 12, 1, ['弹出栈顶并追加到后缀', 'Pop the top and append to postfix']),
        flowNode('infix-leftover', 'decision', 13, 0, ['剩余栈顶是左括号？', 'Is the remaining top a left parenthesis?']),
        flowEnd('infix-leftover-error', 14, -1, 'failure', ['报错：仍有未匹配的 (', 'Error: unmatched ( remains']),
        flowEnd('infix-done', 14, 0, 'success', ['输出后缀表达式', 'Output the postfix expression']),
      ],
      [
        flowEdge('infix-start', 'infix-init'),
        flowEdge('infix-init', 'infix-loop'),
        flowEdge('infix-loop', 'infix-number', 'yes'),
        flowEdge('infix-loop', 'infix-flush-check', 'no'),
        flowEdge('infix-number', 'infix-emit', 'yes'),
        flowEdge('infix-number', 'infix-lparen', 'no'),
        flowEdge('infix-lparen', 'infix-push-lparen', 'yes'),
        flowEdge('infix-lparen', 'infix-rparen', 'no'),
        flowEdge('infix-rparen', 'infix-pop-to-lparen', 'yes'),
        flowEdge('infix-rparen', 'infix-top-priority', 'no'),
        flowEdge('infix-pop-to-lparen', 'infix-unmatched'),
        flowEdge('infix-unmatched', 'infix-error-end', 'no'),
        loopEdge('infix-unmatched', 'infix-loop', ['匹配成功：处理下一个 token', 'Matched: next token'], 'yes'),
        flowEdge('infix-top-priority', 'infix-pop-top', 'yes'),
        flowEdge('infix-top-priority', 'infix-push-op', 'no'),
        flowEdge('infix-flush-check', 'infix-flush', 'yes'),
        flowEdge('infix-flush-check', 'infix-leftover', 'no'),
        flowEdge('infix-leftover', 'infix-leftover-error', 'yes'),
        flowEdge('infix-leftover', 'infix-done', 'no'),
        loopEdge('infix-pop-top', 'infix-top-priority', ['回跳：继续比较新栈顶', 'Back: compare the new top']),
        loopEdge('infix-emit', 'infix-loop', ['回跳：处理下一个 token', 'Back: next token']),
        loopEdge('infix-push-lparen', 'infix-loop', ['回跳：处理下一个 token', 'Back: next token']),
        loopEdge('infix-pop-to-lparen', 'infix-loop', ['回跳：处理下一个 token', 'Back: next token']),
        loopEdge('infix-push-op', 'infix-loop', ['回跳：处理下一个 token', 'Back: next token']),
        loopEdge('infix-flush', 'infix-flush-check', ['回跳：继续清空', 'Back: keep flushing']),
      ],
    ),
  ],
};

const POSTFIX_EVAL_FLOW: AlgorithmFlow = {
  algorithmId: 'postfix-eval',
  sections: [
    flowSection(
      'evaluate',
      ['主流程：扫描后缀并求值', 'Main flow: scan postfix and evaluate'],
      [
        '数字入操作数栈；运算符要求至少两个值，先弹右、再弹左，按“左 op 右”计算后压回。结束后必须恰好剩一个值。',
        'Push numbers. An operator needs at least two values: pop right, pop left, compute “left op right” and push back. Exactly one value must remain at the end.',
      ],
      [
        flowNode('postfix-start', 'start', 0, 0, ['开始：读入后缀表达式', 'Start: read the postfix expression']),
        flowNode('postfix-init', 'operation', 1, 0, ['操作数栈 = 空；i = 0', 'operand_stack = []; i = 0']),
        flowNode('postfix-loop', 'decision', 2, 0, ['i < token 数量？', 'Is i < token count?']),
        flowNode('postfix-number', 'decision', 3, 0, ['当前 token 是数字？', 'Is the current token a number?']),
        flowNode('postfix-push', 'operation', 4, -1, ['转换为整数后压栈；i++', 'Convert to an integer and push; i++']),
        flowNode('postfix-operator', 'decision', 5, 0, ['当前 token 是 + − * / ？', 'Is the current token + − * / ?']),
        flowEnd('postfix-token-error', 6, -1, 'failure', ['报错：非法 token', 'Error: invalid token']),
        flowNode('postfix-two-values', 'decision', 7, 1, ['栈中至少有两个值？', 'Are there at least two values?']),
        flowEnd('postfix-shortage-error', 8, 1, 'failure', ['报错：操作数不足', 'Error: operand shortage']),
        flowNode('postfix-pop-right', 'operation', 8, 0, ['right = pop()；先弹出的是右操作数', 'right = pop(); the first pop is the right operand']),
        flowNode('postfix-pop-left', 'operation', 9, 0, ['left = pop()；后弹出的是左操作数', 'left = pop(); the second pop is the left operand']),
        flowNode('postfix-divide-zero', 'decision', 10, 0, ['是 / 且 right == 0 ？', 'Is it / with right == 0?']),
        flowEnd('postfix-zero-error', 11, -1, 'failure', ['报错：除数为零', 'Error: division by zero']),
        flowNode('postfix-compute', 'operation', 11, 0, ['value = left op right；压回栈；i++', 'value = left op right; push it back; i++']),
        flowNode('postfix-end-check', 'decision', 12, 1, ['循环结束，栈中恰好一个值？', 'Loop done; exactly one value on the stack?']),
        flowEnd('postfix-surplus-error', 13, 1, 'failure', ['报错：操作数过多', 'Error: too many operands']),
        flowEnd('postfix-empty-error', 13, -1, 'failure', ['报错：操作数不足', 'Error: operand shortage']),
        flowEnd('postfix-done', 14, 0, 'success', ['输出栈顶唯一结果', 'Output the single remaining value']),
      ],
      [
        flowEdge('postfix-start', 'postfix-init'),
        flowEdge('postfix-init', 'postfix-loop'),
        flowEdge('postfix-loop', 'postfix-number', 'yes'),
        flowEdge('postfix-loop', 'postfix-end-check', 'no'),
        flowEdge('postfix-number', 'postfix-push', 'yes'),
        flowEdge('postfix-number', 'postfix-operator', 'no'),
        flowEdge('postfix-operator', 'postfix-token-error', 'no'),
        flowEdge('postfix-operator', 'postfix-two-values', 'yes'),
        flowEdge('postfix-two-values', 'postfix-shortage-error', 'no'),
        flowEdge('postfix-two-values', 'postfix-pop-right', 'yes'),
        flowEdge('postfix-pop-right', 'postfix-pop-left'),
        flowEdge('postfix-pop-left', 'postfix-divide-zero'),
        flowEdge('postfix-divide-zero', 'postfix-zero-error', 'yes'),
        flowEdge('postfix-divide-zero', 'postfix-compute', 'no'),
        flowEdge('postfix-end-check', 'postfix-done', 'yes'),
        flowEdge('postfix-end-check', 'postfix-surplus-error', 'no'),
        flowEdge('postfix-end-check', 'postfix-empty-error', 'no'),
        loopEdge('postfix-push', 'postfix-loop', ['回跳：处理下一个 token', 'Back: next token']),
        loopEdge('postfix-compute', 'postfix-loop', ['回跳：处理下一个 token', 'Back: next token']),
      ],
    ),
  ],
};

export const EXPRESSION_FLOWS: Record<string, AlgorithmFlow> = {
  'infix-to-postfix': INFIX_TO_POSTFIX_FLOW,
  'postfix-eval': POSTFIX_EVAL_FLOW,
};
