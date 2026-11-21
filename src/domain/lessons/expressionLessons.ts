import type { Lesson } from './types';

/**
 * Two linked courses for the stack applications. Both keep the official
 * examples visible: `(3 + 4) * 2` → `3 4 + 2 *` → `14`.
 *
 * Step ids are exactly the `lesson_step=` values emitted by the Python presets
 * in `expressionExamples.ts`; a step that never appears in the official trace
 * is still a legal step and simply won't be highlighted on that run.
 */
export const infixToPostfixLesson: Lesson = {
  lessonId: 'infix-to-postfix-operator-stack',
  algorithmId: 'infix-to-postfix',
  contentVersion: '1.0.0',
  title: { zh: '中缀转后缀：运算符栈的调度', en: 'Infix to postfix: scheduling with an operator stack' },
  oneLiner: {
    zh: '操作数直接输出；运算符按优先级、结合性和括号规则延迟输出。',
    en: 'Operands go straight out; operators are delayed by precedence, associativity and parentheses.',
  },
  overview: {
    zh: '中缀表达式把运算符写在两个操作数之间，例如 (3 + 4) * 2；后缀表达式把运算符写在操作数之后，例如 3 4 + 2 *。后缀形式没有括号，计算顺序完全由 token 顺序决定，因此适合用栈求值。转换时用一个运算符栈暂存还不能确定输出时机的运算符：操作数直接进入结果，左括号入栈，右括号把栈中运算符弹到左括号，普通运算符则先弹掉所有优先级更高或同级左结合的栈顶，再入栈。',
    en: 'Infix puts an operator between operands, e.g. (3 + 4) * 2; postfix puts it after them, e.g. 3 4 + 2 *. Postfix needs no parentheses and fixes evaluation order by token order, so a stack can evaluate it. Conversion keeps an operator stack for operators whose output must wait: operands go straight to the result, a left parenthesis is pushed, a right parenthesis pops back to the matching left one, and an ordinary operator first pops every higher-precedence or equal-precedence left-associative top before it is pushed.',
  },
  intuition: {
    zh: '把运算符想成“还没轮到的任务”。乘除比加减急，所以看到 + 时，如果栈顶是 *，必须先把 * 输出；同级运算符从左往右算，所以看到第二个 - 时，前一个 - 也要先输出。左括号像一道闸门，闸门内的运算符不能越过它；右括号落下时，闸门内积压的任务全部释放。',
    en: 'Think of operators as tasks waiting for their turn. Multiplication has priority, so when + arrives and * is on top, * must be emitted first. Equal precedence evaluates left to right, so a second - forces the first - out. A left parenthesis is a gate: operators inside cannot cross it; when the right parenthesis closes the gate, all tasks inside are released.',
  },
  prerequisites: {
    zh: ['知道 + − * / 的优先级', '理解同级运算符左结合', '知道栈的 push/pop 与栈顶读取'],
    en: ['Precedence of + − * /', 'Left associativity at equal precedence', 'Stack push/pop and reading TOP'],
  },
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: {
      zh: '每个 token 最多入栈一次、出栈一次，因此总时间是 O(n)。最坏情况如 a + b + c + ... 的运算符栈可增长到 O(n)，后缀结果也需要 O(n) 空间。',
      en: 'Every token is pushed and popped at most once, so total time is O(n). In the worst case, e.g. a + b + c + ..., the operator stack grows to O(n); the postfix output also needs O(n) space.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 初始化：两个空容器', en: '① Initialise: two empty containers' },
      explanation: {
        zh: '准备一个空的运算符栈和一个空的输出序列，从左到右扫描中缀 token。此时还没有任何运算符需要决定去留。',
        en: 'Start with an empty operator stack and an empty output list, then scan the infix tokens left to right. No operator has needed a decision yet.',
      },
      tip: { zh: '官方示例 (3 + 4) * 2 会被切成 (、3、+、4、)、*、2。', en: 'The official example (3 + 4) * 2 becomes (, 3, +, 4, ), *, 2.' },
    },
    {
      stepId: 'operand',
      title: { zh: '② 操作数：直接输出', en: '② Operand: emit immediately' },
      explanation: {
        zh: '数字不会被其他运算符阻挡，遇到就追加到后缀结果。多位数必须作为一个完整 token 处理，不能拆成单个数字。',
        en: 'A number is never blocked by an operator; append it to the postfix output. A multi-digit number stays one token and is never split into digits.',
      },
      tip: { zh: '输出的是 3、4、2 这样的完整数，不是字符 3、4、2 的拼接。', en: 'The output holds whole numbers such as 3, 4, 2, not concatenated digits.' },
    },
    {
      stepId: 'lparen',
      title: { zh: '③ 左括号：入栈当闸门', en: '③ Left parenthesis: push as a gate' },
      explanation: {
        zh: '左括号本身不进入后缀结果，它只是一个边界标记。压入栈后，后面的运算符不能把它弹掉，直到遇到匹配的右括号。',
        en: 'A left parenthesis never enters the postfix result; it is a boundary marker. Once pushed, later operators cannot pop past it until its matching right parenthesis arrives.',
      },
      tip: { zh: '左括号的优先级只在“挡住弹栈”时起作用。', en: 'The left parenthesis only matters as a barrier to popping.' },
    },
    {
      stepId: 'push',
      title: { zh: '④ 运算符入栈：暂时没有冲突', en: '④ Push an operator: no conflict yet' },
      explanation: {
        zh: '当栈为空、栈顶是左括号，或栈顶优先级更低时，新运算符暂时不需要让路，可以直接入栈。例如看到 * 时，栈顶如果是 +，* 的优先级更高，可以先压着。',
        en: 'When the stack is empty, the top is a left parenthesis, or the top has lower precedence, the incoming operator does not need to wait and is pushed. Seeing * above + is such a case: * binds tighter and can wait on the stack.',
      },
      tip: { zh: '入栈不代表永远不输出，只是输出时机还没到。', en: 'Pushing does not mean “never emitted”; its turn simply has not come.' },
    },
    {
      stepId: 'precedence',
      title: { zh: '⑤ 先弹栈顶：为什么不能直接压入', en: '⑤ Pop first: why not push directly' },
      explanation: {
        zh: '如果栈顶运算符的优先级高于新运算符，或两者同级，就必须先弹出栈顶并输出。原因有两条：高优先级的运算必须先生效；同级运算符按左结合，左边的必须先算。例如 8 - 3 - 2 中，第二个 - 到达时必须先输出第一个 -，否则会算成 8 - (3 - 2)。',
        en: 'If the top operator has higher precedence, or equal precedence, it must be popped and emitted before the new operator is pushed. Two reasons: tighter binding must reduce first, and equal-precedence operators are left-associative. In 8 - 3 - 2, the second - forces the first - out; otherwise it would compute 8 - (3 - 2).',
      },
      tip: { zh: '这就是“同级左结合”在动画里最直观的一步：栈顶先出。', en: 'This is left associativity made visible: the existing top leaves first.' },
    },
    {
      stepId: 'rparen',
      title: { zh: '⑥ 右括号：弹到左括号为止', en: '⑥ Right parenthesis: pop back to the left one' },
      explanation: {
        zh: '右括号到达时，依次弹出并输出栈顶运算符，直到遇见左括号；左括号随后弹出但只丢弃，不进入后缀结果。这样括号内的表达式已经全部转成后缀，括号本身不再需要。',
        en: 'When a right parenthesis arrives, pop and emit operators until the left parenthesis is found. The left parenthesis is then popped and discarded, not emitted. The parenthesised subexpression is now fully postfix, so the parentheses are no longer needed.',
      },
      tip: { zh: '如果弹不到左括号，说明括号不匹配，必须报错。', en: 'If no left parenthesis is found, the parentheses are unbalanced and must be reported.' },
    },
    {
      stepId: 'finish',
      title: { zh: '⑦ 扫描结束：清空剩余运算符', en: '⑦ End of scan: flush remaining operators' },
      explanation: {
        zh: '中缀 token 扫描完后，栈中可能还压着运算符。按栈顶顺序依次弹出并追加到后缀结果，直到栈空。若剩下左括号，说明括号不匹配。',
        en: 'After the last infix token, operators may remain on the stack. Pop them in top order and append to the postfix result until empty. A left parenthesis left behind means unbalanced parentheses.',
      },
      tip: { zh: '官方示例最后剩下 *，弹出后得到 3 4 + 2 *。', en: 'The official example leaves * behind; popping it yields 3 4 + 2 *.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑧ 完成：后缀串可以直接交给求值器', en: '⑧ Done: the postfix string is ready for evaluation' },
      explanation: {
        zh: '输出的后缀序列不再含括号，运算符出现在其操作数之后。下一步可以把 3 4 + 2 * 输入后缀求值课程，得到 14。',
        en: 'The postfix sequence has no parentheses and every operator follows its operands. Feed 3 4 + 2 * into the evaluation course to obtain 14.',
      },
      tip: { zh: '转换只改变书写顺序，不改变表达式的值。', en: 'Conversion changes notation, not the value of the expression.' },
    },
  ],
  commonMistakes: {
    zh: [
      '逐字符扫描数字，把 12 拆成 1 和 2；必须按 token 读取多位整数。',
      '看到运算符就无条件入栈，忘记先弹出优先级更高或同级左结合的栈顶。',
      '把左括号输出到后缀结果；左括号只用于界定，必须丢弃。',
      '右括号只弹一个运算符就停止，必须一直弹到左括号。',
      '扫描结束忘记清空运算符栈。',
      '支持了一元负号却没有正确处理，导致 -3 + 4 被误读；本课程明确拒绝一元负号。',
    ],
    en: [
      'Scanning digits one by one and splitting 12 into 1 and 2; read numbers as whole tokens.',
      'Pushing every operator without popping a higher-precedence or equal-precedence left-associative top first.',
      'Emitting the left parenthesis into the postfix result; it is only a boundary and must be discarded.',
      'Stopping after one pop at a right parenthesis instead of popping back to the left one.',
      'Forgetting to flush the operator stack after the scan.',
      'Claiming unary-minus support without correct handling, so -3 + 4 is misread; this course explicitly rejects unary minus.',
    ],
  },
};

export const postfixEvalLesson: Lesson = {
  lessonId: 'postfix-eval-operand-stack',
  algorithmId: 'postfix-eval',
  contentVersion: '1.0.0',
  title: { zh: '后缀表达式求值：操作数栈', en: 'Postfix evaluation: the operand stack' },
  oneLiner: {
    zh: '操作数入栈；遇到运算符弹出两个值，先出的是右操作数。',
    en: 'Push operands; an operator pops two values, and the first popped is the right operand.',
  },
  overview: {
    zh: '后缀表达式把运算符放在两个操作数之后，因此扫描到一个运算符时，它需要的两个操作数已经算好并保存在栈顶。求值器从左到右扫描：数字入操作数栈；运算符先弹出右操作数，再弹出左操作数，按“左 op 右”计算，把结果压回栈。扫描结束后栈中应恰好剩一个值，那就是整个表达式的值。',
    en: 'Postfix puts an operator after its two operands, so when an operator is read, both operands are already computed and waiting on the stack. Scan left to right: push numbers; for an operator pop the right operand first, then the left, compute “left op right” and push the result. At the end exactly one value must remain: the value of the whole expression.',
  },
  intuition: {
    zh: '后缀串 3 4 + 2 * 像一条逆波兰指令流：先把 3、4 压栈，看到 + 就弹出 4（右）和 3（左），算出 7 压回；再压 2，看到 * 弹出 2（右）和 7（左），得到 14。每个运算符都只关心栈顶两个值，不需要括号，也不需要知道整个表达式。',
    en: 'The postfix stream 3 4 + 2 * is a sequence of Reverse Polish instructions: push 3 and 4; + pops 4 (right) and 3 (left), computes 7 and pushes it; push 2; * pops 2 (right) and 7 (left), producing 14. Each operator only needs the top two values, with no parentheses and no global view.',
  },
  prerequisites: {
    zh: ['知道栈的 push/pop', '理解“先弹出的是右操作数”', '知道整数除法向零截断的约定'],
    en: ['Stack push/pop', 'The first popped value is the right operand', 'Integer division truncates toward zero'],
  },
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: {
      zh: '每个 token 处理一次，数字入栈一次，运算符弹两个压一个，因此时间是 O(n)。最坏情况如 1 2 3 ... 全是操作数时，操作数栈可达到 O(n) 深度。',
      en: 'Each token is handled once: a number is pushed once, an operator pops two and pushes one, so time is O(n). In the worst case, e.g. 1 2 3 ... all operands, the stack grows to O(n).',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 初始化：空操作数栈', en: '① Initialise: empty operand stack' },
      explanation: {
        zh: '准备一个空栈，从左到右读取后缀 token。栈里保存的是已经算好的数值，而不是原始 token。',
        en: 'Start with an empty stack and read postfix tokens left to right. The stack stores computed numbers, not raw tokens.',
      },
      tip: { zh: '官方示例 3 4 + 2 * 以空格分隔 token。', en: 'The official example 3 4 + 2 * separates tokens with spaces.' },
    },
    {
      stepId: 'operand',
      title: { zh: '② 操作数：压入栈', en: '② Operand: push it' },
      explanation: {
        zh: '遇到数字就转换成整数并压栈。多位数仍然是一个 token，例如 12 只压一次，不会压入 1 和 2。',
        en: 'A number is converted to an integer and pushed. A multi-digit number is one token: 12 is pushed once, never as 1 and 2.',
      },
      tip: { zh: '栈中元素按从底到顶显示，最后压入的在栈顶。', en: 'The stack is drawn bottom to top; the newest value is at TOP.' },
    },
    {
      stepId: 'apply',
      title: { zh: '③ 运算符：先右后左，计算后压回', en: '③ Operator: right first, left second, push the result' },
      explanation: {
        zh: '遇到运算符时，若栈中不足两个值就报“操作数不足”。否则先弹出右操作数，再弹出左操作数；减法和除法必须用“左 − 右”“左 / 右”。例如 12 3 - 中，先弹出 3 作为右操作数，再弹出 12 作为左操作数，结果是 9；如果顺序颠倒会得到 -9。',
        en: 'On an operator, fewer than two stack values means “operand shortage”. Otherwise pop the right operand first, then the left. Subtraction and division must use “left − right” and “left / right”. In 12 3 -, 3 is popped as the right operand and 12 as the left, giving 9; reversing them gives -9.',
      },
      tip: { zh: '动画的“本次计算”面板会明确标出先弹出的右操作数和后弹出的左操作数。', en: 'The computation panel labels the first-popped right operand and the second-popped left operand.' },
    },
    {
      stepId: 'done',
      title: { zh: '④ 扫描结束：栈中应只剩一个值', en: '④ End: exactly one value must remain' },
      explanation: {
        zh: '所有 token 处理完后，如果栈中恰好一个值，它就是结果；如果多于一个，说明缺少运算符；如果为空，说明操作数不足。除数为零、非法 token 和多位数格式错误都必须明确报错，不能返回一个猜测值。',
        en: 'After all tokens, exactly one value is the result. More than one means missing operators; zero means too few operands. Division by zero, invalid tokens and malformed multi-digit input must be reported explicitly, never replaced by a guessed value.',
      },
      tip: { zh: '官方示例最终栈中只有 14。', en: 'The official example ends with only 14 on the stack.' },
    },
    {
      stepId: 'error',
      title: { zh: '⑤ 错误：操作数不足、过多与除零', en: '⑤ Errors: shortage, surplus and division by zero' },
      explanation: {
        zh: '后缀求值的错误必须在真实执行中暴露：运算符前不足两个值、扫描结束后剩余多个值、除数为零、token 非法，都会终止并给出原因。错误帧同样来自 Python 的真实执行，不是前端伪造。',
        en: 'Postfix errors must surface during the real run: fewer than two values before an operator, several values left at the end, division by zero, or an invalid token all stop execution with a reason. Error frames also come from real Python execution, not frontend fabrication.',
      },
      tip: { zh: '在自定义输入里试 8 0 /，可以看到除零错误帧。', en: 'Try 8 0 / in custom input to see the division-by-zero frame.' },
    },
  ],
  commonMistakes: {
    zh: [
      '弹出两个操作数时先取左、后取右，导致减法和除法结果符号/商错误。',
      '把后缀表达式的多位数按字符拆分，12 被当成 1 和 2。',
      '操作数不足时仍继续计算，访问空栈。',
      '扫描结束不检查栈大小，直接取栈顶当作结果。',
      '用浮点除法或 Python 的 // 代替明确的整数除法约定，导致负数结果与 C/C++ 不一致。',
      '除数为零时不报错，返回 0 或 inf。',
    ],
    en: [
      'Taking the left operand before the right, which breaks subtraction and division.',
      'Splitting a multi-digit postfix token into characters, so 12 becomes 1 and 2.',
      'Continuing after an operand shortage and reading an empty stack.',
      'Taking the top as the result without checking that exactly one value remains.',
      'Using floating division or Python // instead of an explicit integer rule, making negative results disagree with C/C++.',
      'Returning 0 or inf instead of reporting division by zero.',
    ],
  },
};
