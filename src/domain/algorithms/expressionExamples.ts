/**
 * Chapter 3 expression presets.
 *
 * Python is the primary teaching program and emits every frame. JavaScript is
 * kept as a second executable preset so the language switch never shows fake
 * frames. Both use the same tokenisation, precedence and operand-pop order.
 */

export const INFIX_TO_POSTFIX_DEFAULT_INPUT = '(3 + 4) * 2';
export const POSTFIX_EVAL_DEFAULT_INPUT = '3 4 + 2 *';

export const INFIX_TO_POSTFIX_PYTHON = `import re

raw = input if isinstance(input, str) else input.get("expression", "")
tokens = re.findall(r"\\d+|[()+\\-*/]", raw)
clean = re.sub(r"\\s+", "", raw)

operator_stack = []   # entries: {"id", "value"}
postfix = []
sequence = 0

def emit(operation, message, line, lesson, index, target=None, error=None):
    payload = {
        "kind": "expression",
        "algorithm": "infix-to-postfix",
        "operation": operation,
        "tokens": tokens,
        "index": index,
        "operatorStack": [{"id": item["id"], "value": item["value"]} for item in operator_stack],
        "output": postfix[:],
    }
    if target is not None:
        payload["targetId"] = target
    if error is not None:
        payload["error"] = error
    variables = {
        "i": index,
        "token": tokens[index] if 0 <= index < len(tokens) else None,
        "operators": [item["value"] for item in operator_stack],
        "postfix": postfix[:],
    }
    trace(
        {"type": "expression", "values": postfix[:]},
        message,
        line=line, variables=variables, lesson_step=lesson, structure=payload,
    )

def precedence(op):
    if op in ("+", "-"):
        return 1
    if op in ("*", "/"):
        return 2
    return 0

if "".join(tokens) != clean:
    emit("error", "表达式含不支持的字符 / unsupported character", 26, "error", -1,
         error="只允许非负整数、四位运算符和圆括号 / only integers, + - * / and parentheses")
elif not tokens:
    emit("error", "表达式为空 / empty expression", 26, "error", -1, error="empty expression")
else:
    emit("init", "开始扫描中缀表达式 / start scanning the infix expression", 28, "init", -1)
    for i, token in enumerate(tokens):
        if token.isdigit():
            postfix.append(token)
            emit("emit", "操作数 " + token + " 直接加入后缀 / operand goes straight to the suffix",
                 33, "operand", i)
        elif token == "(":
            sequence += 1
            operator_stack.append({"id": "op" + str(sequence), "value": token})
            emit("push", "左括号入栈，等待与之匹配的右括号 / push the left parenthesis",
                 37, "lparen", i, target="op" + str(sequence))
        elif token == ")":
            while operator_stack and operator_stack[-1]["value"] != "(":
                item = operator_stack.pop()
                postfix.append(item["value"])
                emit("pop", "右括号到达：先弹出栈顶运算符 " + item["value"] + " / pop before the right parenthesis",
                     42, "rparen", i, target=item["id"])
            if operator_stack:
                left = operator_stack.pop()
                emit("pop", "弹出左括号，只丢弃不输出 / pop the left parenthesis without emitting it",
                     45, "rparen", i, target=left["id"])
        else:
            while (operator_stack and operator_stack[-1]["value"] != "(" and
                   precedence(operator_stack[-1]["value"]) >= precedence(token)):
                item = operator_stack.pop()
                postfix.append(item["value"])
                emit("pop", "栈顶 " + item["value"] + " 的优先级不低于 " + token +
                     "，同级运算符左结合，所以先弹出 / top binds at least as tightly, pop it first",
                     51, "precedence", i, target=item["id"])
            sequence += 1
            operator_stack.append({"id": "op" + str(sequence), "value": token})
            emit("push", "运算符 " + token + " 入栈 / push operator " + token,
                 55, "push", i, target="op" + str(sequence))
    while operator_stack:
        item = operator_stack.pop()
        if item["value"] == "(":
            emit("error", "括号不匹配 / unmatched parenthesis", 59, "error", len(tokens),
                 error="unmatched parenthesis")
            break
        postfix.append(item["value"])
        emit("pop", "扫描结束，弹出剩余运算符 " + item["value"] + " / flush the remaining operator",
             61, "finish", len(tokens), target=item["id"])
    else:
        emit("done", "转换完成：" + " ".join(postfix) + " / conversion complete", 64, "done", len(tokens))
`;

export const INFIX_TO_POSTFIX_JS = `
const raw = typeof input === 'string' ? input : String(input && input.expression || '');
const tokens = raw.match(/\\d+|[()+\\-*/]/g) || [];
const clean = raw.replace(/\\s+/g, '');
const operators = [];
const postfix = [];
let sequence = 0;
const prec = (op) => (op === '+' || op === '-') ? 1 : (op === '*' || op === '/') ? 2 : 0;
function emit(op, message, index, target, error) {
  const payload = { kind: 'expression', algorithm: 'infix-to-postfix', operation: op,
    tokens, index, operatorStack: operators.map((x) => ({ id: x.id, value: x.value })), output: postfix.slice() };
  if (target !== undefined) payload.targetId = target;
  if (error !== undefined) payload.error = error;
  trace({ type: 'expression', values: postfix.slice() }, message, payload);
}
if (tokens.join('') !== clean) {
  emit('error', 'unsupported character', -1, undefined, 'only integers, + - * / and parentheses');
} else if (tokens.length === 0) {
  emit('error', 'empty expression', -1, undefined, 'empty expression');
} else {
  emit('init', 'start scanning the infix expression', -1);
  tokens.forEach((token, i) => {
    if (/\\d+/.test(token)) {
      postfix.push(token);
      emit('emit', 'operand ' + token + ' goes straight to the suffix', i);
    } else if (token === '(') {
      sequence += 1;
      operators.push({ id: 'op' + sequence, value: token });
      emit('push', 'push the left parenthesis', i, 'op' + sequence);
    } else if (token === ')') {
      while (operators.length && operators[operators.length - 1].value !== '(') {
        const item = operators.pop();
        postfix.push(item.value);
        emit('pop', 'pop ' + item.value + ' before the right parenthesis', i, item.id);
      }
      if (operators.length) {
        const left = operators.pop();
        emit('pop', 'discard the left parenthesis', i, left.id);
      }
    } else {
      while (operators.length && operators[operators.length - 1].value !== '(' &&
        prec(operators[operators.length - 1].value) >= prec(token)) {
        const item = operators.pop();
        postfix.push(item.value);
        emit('pop', 'top ' + item.value + ' binds at least as tightly; pop it first', i, item.id);
      }
      sequence += 1;
      operators.push({ id: 'op' + sequence, value: token });
      emit('push', 'push operator ' + token, i, 'op' + sequence);
    }
  });
  while (operators.length) {
    const item = operators.pop();
    if (item.value === '(') {
      emit('error', 'unmatched parenthesis', tokens.length, undefined, 'unmatched parenthesis');
      return;
    }
    postfix.push(item.value);
    emit('pop', 'flush the remaining operator ' + item.value, tokens.length, item.id);
  }
  emit('done', 'conversion complete: ' + postfix.join(' '), tokens.length);
}
`;

export const POSTFIX_EVAL_JS = `
const raw = typeof input === 'string' ? input : String(input && input.expression || '');
const tokens = raw.trim() === '' ? [] : raw.trim().split(/\\s+/);
const stack = [];
let sequence = 0;
const trunc = (x) => x < 0 ? Math.ceil(x) : Math.floor(x);
function emit(op, message, index, target, operands, result, error) {
  const payload = { kind: 'expression', algorithm: 'postfix-eval', operation: op,
    tokens, index, operatorStack: [], operandStack: stack.map((x) => ({ id: x.id, value: x.value })) };
  if (target !== undefined) payload.targetId = target;
  if (operands !== undefined) payload.operands = operands;
  if (result !== undefined) payload.result = result;
  if (error !== undefined) payload.error = error;
  trace({ type: 'expression', values: stack.map((x) => x.value) }, message, payload);
}
if (tokens.length === 0) {
  emit('error', 'empty postfix expression', -1, undefined, undefined, undefined, 'empty expression');
} else {
  emit('init', 'start scanning the postfix expression', -1);
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (/\\d+/.test(token)) {
      sequence += 1;
      stack.push({ id: 'v' + sequence, value: Number(token) });
      emit('push', 'push operand ' + token, i, 'v' + sequence);
    } else if (token === '+' || token === '-' || token === '*' || token === '/') {
      if (stack.length < 2) {
        emit('error', 'operator ' + token + ' needs two operands', i, undefined, undefined, undefined, 'operand shortage');
        return;
      }
      const right = stack.pop();
      const left = stack.pop();
      if (token === '/' && right.value === 0) {
        emit('error', 'division by zero', i, undefined,
          { right: { id: right.id, value: right.value }, left: { id: left.id, value: left.value }, operator: token, result: 0 },
          undefined, 'division by zero');
        return;
      }
      let value = 0;
      if (token === '+') value = left.value + right.value;
      else if (token === '-') value = left.value - right.value;
      else if (token === '*') value = left.value * right.value;
      else value = trunc(left.value / right.value);
      sequence += 1;
      stack.push({ id: 'v' + sequence, value });
      emit('apply', 'pop right then left, push the result', i, 'v' + sequence,
        { right: { id: right.id, value: right.value }, left: { id: left.id, value: left.value }, operator: token, result: value }, value);
    } else {
      emit('error', 'invalid token: ' + token, i, undefined, undefined, undefined, 'invalid token');
      return;
    }
  }
  if (stack.length === 1) {
    emit('done', 'evaluation complete: ' + stack[0].value, tokens.length, undefined, undefined, stack[0].value);
  } else if (stack.length > 1) {
    emit('error', 'too many operands', tokens.length, undefined, undefined, undefined, 'operand surplus');
  } else {
    emit('error', 'operand shortage', tokens.length, undefined, undefined, undefined, 'operand shortage');
  }
}
`;

export const INFIX_TO_POSTFIX_ENTRY = {
  group: 'ds',
  icon: '()',
  name: ['中缀转后缀 · 运算符栈', 'Infix to postfix · operator stack'],
  desc: [
    '用运算符栈按优先级和左结合性把中缀表达式转换成后缀表达式；官方示例 (3 + 4) * 2 → 3 4 + 2 *。',
    'Convert infix to postfix with an operator stack, respecting precedence, left associativity and parentheses; official (3 + 4) * 2 → 3 4 + 2 *.',
  ],
  time: 'O(n)',
  space: 'O(n)',
  input: INFIX_TO_POSTFIX_DEFAULT_INPUT,
  code: INFIX_TO_POSTFIX_JS,
};

export const POSTFIX_EVAL_ENTRY = {
  group: 'ds',
  icon: '∑',
  name: ['后缀表达式求值 · 操作数栈', 'Postfix evaluation · operand stack'],
  desc: [
    '从左到右扫描后缀表达式，操作数入栈，运算符弹出两个操作数计算后压回；官方示例 3 4 + 2 * → 14。',
    'Scan postfix left to right: push operands, pop two values for an operator and push the result; official 3 4 + 2 * → 14.',
  ],
  time: 'O(n)',
  space: 'O(n)',
  input: POSTFIX_EVAL_DEFAULT_INPUT,
  code: POSTFIX_EVAL_JS,
};

export function expressionPythonExample(algorithmId: string): string | undefined {
  if (algorithmId === 'infix-to-postfix') return INFIX_TO_POSTFIX_PYTHON;
  if (algorithmId === 'postfix-eval') return POSTFIX_EVAL_PYTHON;
  return undefined;
}

export function expressionDefaultInput(algorithmId: string): unknown | undefined {
  if (algorithmId === 'infix-to-postfix') return INFIX_TO_POSTFIX_DEFAULT_INPUT;
  if (algorithmId === 'postfix-eval') return POSTFIX_EVAL_DEFAULT_INPUT;
  return undefined;
}

export const POSTFIX_EVAL_PYTHON = `raw = input if isinstance(input, str) else input.get("expression", "")
tokens = raw.split()
operand_stack = []   # entries: {"id", "value", "number"}
sequence = 0

def emit(operation, message, line, lesson, index, target=None, operands=None, result=None, error=None):
    payload = {
        "kind": "expression",
        "algorithm": "postfix-eval",
        "operation": operation,
        "tokens": tokens,
        "index": index,
        "operatorStack": [],
        "operandStack": [{"id": item["id"], "value": item["number"]} for item in operand_stack],
    }
    if target is not None:
        payload["targetId"] = target
    if operands is not None:
        payload["operands"] = operands
    if result is not None:
        payload["result"] = result
    if error is not None:
        payload["error"] = error
    variables = {
        "i": index,
        "token": tokens[index] if 0 <= index < len(tokens) else None,
        "stack": [item["number"] for item in operand_stack],
    }
    if operands is not None:
        variables["left"] = operands["left"]["value"]
        variables["right"] = operands["right"]["value"]
        variables["result"] = operands["result"]
    trace(
        {"type": "expression", "values": [item["number"] for item in operand_stack]},
        message,
        line=line, variables=variables, lesson_step=lesson, structure=payload,
    )

def trunc_div(left, right):
    # C/C++ integer division truncates toward zero; Python // would floor negatives.
    return int(left / right)

if not tokens:
    emit("error", "后缀表达式为空 / empty postfix expression", 29, "error", -1,
         error="empty expression")
else:
    emit("init", "开始扫描后缀表达式 / start scanning the postfix expression", 31, "init", -1)
    for i, token in enumerate(tokens):
        if token.isdigit():
            sequence += 1
            value = int(token)
            operand_stack.append({"id": "v" + str(sequence), "value": value, "number": value})
            emit("push", "操作数 " + token + " 入栈 / push operand " + token,
                 37, "operand", i, target="v" + str(sequence))
        elif token in ("+", "-", "*", "/"):
            if len(operand_stack) < 2:
                emit("error", "运算符 " + token + " 缺少两个操作数 / operator needs two operands",
                     40, "error", i, error="operand shortage")
                break
            right = operand_stack.pop()
            left = operand_stack.pop()
            if token == "/" and right["number"] == 0:
                emit("error", "除数为零 / division by zero", 42, "error", i,
                     operands={"right": {"id": right["id"], "value": right["number"]},
                               "left": {"id": left["id"], "value": left["number"]},
                               "operator": token, "result": 0},
                     error="division by zero")
                break
            if token == "+":
                value = left["number"] + right["number"]
            elif token == "-":
                value = left["number"] - right["number"]
            elif token == "*":
                value = left["number"] * right["number"]
            else:
                value = trunc_div(left["number"], right["number"])
            sequence += 1
            operand_stack.append({"id": "v" + str(sequence), "value": value, "number": value})
            emit("apply", "弹出右操作数 " + str(right["number"]) + "，再弹出左操作数 " +
                 str(left["number"]) + "，计算后压回结果 " + str(value) +
                 " / pop right then left, push the result",
                 48, "apply", i, target="v" + str(sequence),
                 operands={"right": {"id": right["id"], "value": right["number"]},
                           "left": {"id": left["id"], "value": left["number"]},
                           "operator": token, "result": value},
                 result=value)
        else:
            emit("error", "非法 token：" + token + " / invalid token", 55, "error", i,
                 error="invalid token")
            break
    else:
        if len(operand_stack) == 1:
            emit("done", "求值完成，结果是 " + str(operand_stack[0]["number"]) +
                 " / evaluation complete", 59, "done", len(tokens),
                 result=operand_stack[0]["number"])
        elif len(operand_stack) > 1:
            emit("error", "操作数过多：栈中还有 " + str(len(operand_stack)) +
                 " 个值 / too many operands", 62, "error", len(tokens), error="operand surplus")
        else:
            emit("error", "操作数不足 / operand shortage", 62, "error", len(tokens), error="operand shortage")
`;
