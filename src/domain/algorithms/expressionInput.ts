/**
 * Input model for the two expression-stack algorithms.
 *
 * The parser is deliberately strict: non-negative integers, the four binary
 * operators and round parentheses only. Multi-digit numbers are consumed as one
 * token, never assembled digit by digit. Unary minus and implicit multiplication
 * are rejected with an explicit error instead of being accepted by accident.
 *
 * Evaluation uses integer arithmetic with division truncated toward zero. That
 * is the same rule used by the Python trace and the C/C++ reference programs.
 */
import type { GuidedBuildResult, GuidedInputError } from './guidedInput';

export const EXPRESSION_GUIDED_INPUT_ALGORITHMS = [
  'infix-to-postfix',
  'postfix-eval',
] as const;
export type ExpressionGuidedInputAlgorithm = (typeof EXPRESSION_GUIDED_INPUT_ALGORITHMS)[number];

export type ExpressionOperation = '+' | '-' | '*' | '/';
const OPERATORS: readonly ExpressionOperation[] = ['+', '-', '*', '/'];

export const EXPRESSION_LIMITS = {
  MAX_TOKENS: 80,
  MAX_NUMBER_DIGITS: 6,
  MAX_OPERATIONS: 20,
} as const;

export function isExpressionGuidedInputAlgorithm(id: string): id is ExpressionGuidedInputAlgorithm {
  return (EXPRESSION_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

function isOperator(token: string): token is ExpressionOperation {
  return (OPERATORS as readonly string[]).includes(token);
}

function isNumberToken(token: string): boolean {
  return /^\d+$/u.test(token);
}

function error(key: string, detail?: string): { ok: false; error: GuidedInputError & { detail?: string } } {
  return { ok: false, error: { key, ...(detail ? { detail } : {}) } };
}

function numberValue(token: string): number | null {
  if (!isNumberToken(token) || token.length > EXPRESSION_LIMITS.MAX_NUMBER_DIGITS) return null;
  const value = Number(token);
  return Number.isSafeInteger(value) ? value : null;
}

export interface TokenizeResult {
  ok: true;
  tokens: string[];
}

/**
 * Turn the visible expression into tokens. Whitespace is skipped, so `(3 + 4)`
 * and `( 3 + 4 )` produce the same stream; `34` is one token, not `3` and `4`.
 */
export function tokenizeInfix(source: string): TokenizeResult | { ok: false; error: GuidedInputError & { detail?: string } } {
  const text = source.trim();
  if (text === '') return error('expressionErrorEmpty');
  const tokens: string[] = [];
  let index = 0;
  while (index < text.length) {
    const char = text[index]!;
    if (/\s/u.test(char)) {
      index += 1;
      continue;
    }
    if (/\d/u.test(char)) {
      let end = index;
      while (end < text.length && /\d/u.test(text[end]!)) end += 1;
      const token = text.slice(index, end);
      if (numberValue(token) === null) return error('expressionErrorNumber', token);
      tokens.push(token);
      index = end;
      continue;
    }
    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '(' || char === ')') {
      tokens.push(char);
      index += 1;
      continue;
    }
    return error('expressionErrorToken', char);
  }
  if (tokens.length > EXPRESSION_LIMITS.MAX_TOKENS) return error('expressionErrorTooLong');
  return { ok: true, tokens };
}

/**
 * Syntactic validation with a single `expectOperand` flag. It catches missing
 * operands (`3 +`), doubled operators (`3 + * 4`), empty parentheses and
 * unbalanced parentheses before any stale animation can play.
 */
export function validateInfix(tokens: string[]): { ok: true } | { ok: false; error: GuidedInputError } {
  let expectOperand = true;
  let balance = 0;
  for (const token of tokens) {
    if (isNumberToken(token)) {
      if (!expectOperand) return error('expressionErrorMissingOperator');
      expectOperand = false;
    } else if (token === '(') {
      if (!expectOperand) return error('expressionErrorMissingOperator');
      balance += 1;
    } else if (token === ')') {
      if (expectOperand) return error('expressionErrorMissingOperand');
      balance -= 1;
      if (balance < 0) return error('expressionErrorParentheses');
      expectOperand = false;
    } else if (isOperator(token)) {
      if (expectOperand) return error('expressionErrorMissingOperand');
      expectOperand = true;
    } else {
      return error('expressionErrorToken', token);
    }
  }
  if (balance !== 0) return error('expressionErrorParentheses');
  if (expectOperand) return error('expressionErrorMissingOperand');
  return { ok: true };
}

export function infixToPostfix(tokens: string[]): string[] {
  const output: string[] = [];
  const operators: string[] = [];
  const precedence = (token: string): number =>
    token === '+' || token === '-' ? 1 : token === '*' || token === '/' ? 2 : 0;
  for (const token of tokens) {
    if (isNumberToken(token)) {
      output.push(token);
    } else if (token === '(') {
      operators.push(token);
    } else if (token === ')') {
      while (operators.length && operators[operators.length - 1] !== '(') {
        output.push(operators.pop()!);
      }
      operators.pop();
    } else {
      // All four operators are left-associative: an equal-precedence operator
      // already on the stack must be reduced before the new one is pushed.
      while (
        operators.length &&
        operators[operators.length - 1] !== '(' &&
        precedence(operators[operators.length - 1]!) >= precedence(token)
      ) {
        output.push(operators.pop()!);
      }
      operators.push(token);
    }
  }
  while (operators.length) output.push(operators.pop()!);
  return output;
}

export function tokenizePostfix(source: string): { ok: true; tokens: string[] } | { ok: false; error: GuidedInputError } {
  const text = source.trim();
  if (text === '') return error('expressionErrorEmpty');
  const tokens = text.split(/\s+/u).filter(Boolean);
  if (tokens.length > EXPRESSION_LIMITS.MAX_TOKENS) return error('expressionErrorTooLong');
  for (const token of tokens) {
    if (!isNumberToken(token) && !isOperator(token)) return error('expressionErrorToken', token);
    if (isNumberToken(token) && numberValue(token) === null) return error('expressionErrorNumber', token);
  }
  let operands = 0;
  for (const token of tokens) {
    if (isNumberToken(token)) {
      operands += 1;
    } else {
      if (operands < 2) return error('expressionErrorOperandShortage');
      operands -= 1;
    }
  }
  if (operands > 1) return error('expressionErrorOperandSurplus');
  if (operands === 0) return error('expressionErrorOperandShortage');
  return { ok: true, tokens };
}

export type PostfixEvaluation =
  | { ok: true; value: number }
  | { ok: false; error: string };

/**
 * Reference evaluator used by tests and random generation. The Python program
 * has the same pop order: `right = pop()`, then `left = pop()`.
 */
export function evaluatePostfix(tokens: string[]): PostfixEvaluation {
  const stack: number[] = [];
  for (const token of tokens) {
    if (isNumberToken(token)) {
      const value = numberValue(token);
      if (value === null) return { ok: false, error: 'expressionErrorNumber' };
      stack.push(value);
      continue;
    }
    if (!isOperator(token)) return { ok: false, error: 'expressionErrorToken' };
    if (stack.length < 2) return { ok: false, error: 'expressionErrorOperandShortage' };
    const right = stack.pop()!;
    const left = stack.pop()!;
    if (token === '/' && right === 0) return { ok: false, error: 'expressionErrorDivideByZero' };
    let value = 0;
    if (token === '+') value = left + right;
    else if (token === '-') value = left - right;
    else if (token === '*') value = left * right;
    else value = Math.trunc(left / right);
    if (!Number.isFinite(value) || !Number.isSafeInteger(value)) {
      return { ok: false, error: 'expressionErrorNumberRange' };
    }
    stack.push(value);
  }
  if (stack.length !== 1) return { ok: false, error: 'expressionErrorOperandSurplus' };
  return { ok: true, value: stack[0]! };
}

export type ExpressionBuildResult = GuidedBuildResult & { normalized?: string };

export function buildExpressionInput(
  id: ExpressionGuidedInputAlgorithm,
  source: string,
): ExpressionBuildResult {
  if (id === 'infix-to-postfix') {
    const tokenized = tokenizeInfix(source);
    if (!tokenized.ok) return tokenized;
    const valid = validateInfix(tokenized.tokens);
    if (!valid.ok) return valid;
    return { ok: true, input: tokenized.tokens.join(' '), normalized: tokenized.tokens.join(' ') };
  }
  const tokenized = tokenizePostfix(source);
  if (!tokenized.ok) return tokenized;
  return { ok: true, input: tokenized.tokens.join(' '), normalized: tokenized.tokens.join(' ') };
}

export function expressionDraftFromInput(input: unknown): string {
  if (typeof input === 'string') return input;
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    const expression = (input as { expression?: unknown }).expression;
    if (typeof expression === 'string') return expression;
  }
  return '';
}

function randInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function numberText(random: () => number, multiDigit: boolean): string {
  if (multiDigit) return String(randInt(random, 10, 99));
  return String(randInt(random, 1, 9));
}

function templateExpression(
  scenario: string,
  random: () => number,
  multiDigit: boolean,
): string {
  const a = numberText(random, multiDigit);
  const b = numberText(random, multiDigit);
  const c = numberText(random, multiDigit);
  if (scenario === 'precedence') return `${a} + ${b} * ${c}`;
  if (scenario === 'parentheses') return `( ${a} + ${b} ) * ${c}`;
  if (scenario === 'left-assoc') return `${a} - ${b} - ${c}`;
  if (scenario === 'division') return `( ${a} + ${b} ) / ${c}`;
  return `${a} * ( ${b} - ${c} )`;
}

function randomExpressionTree(random: () => number, depth: number): string {
  if (depth <= 0) return numberText(random, random() < 0.5);
  const operator = OPERATORS[randInt(random, 0, OPERATORS.length - 1)]!;
  const left = randomExpressionTree(random, depth - 1);
  const right = randomExpressionTree(random, depth - 1);
  const wrapped = random() < 0.45;
  const expression = `${left} ${operator} ${right}`;
  return wrapped ? `( ${expression} )` : expression;
}

export function randomExpressionDraft(
  id: ExpressionGuidedInputAlgorithm,
  scenario: string,
  random: () => number = Math.random,
): string {
  if (id === 'postfix-eval') {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const infix = randomExpressionTree(random, randInt(random, 1, 3));
      const tokens = tokenizeInfix(infix);
      if (!tokens.ok || !validateInfix(tokens.tokens).ok) continue;
      const postfix = infixToPostfix(tokens.tokens);
      const evaluated = evaluatePostfix(postfix);
      if (evaluated.ok) {
        return postfix.join(' ');
      }
    }
    return '3 4 + 2 *';
  }
  const multiDigit = scenario === 'multi-digit';
  const scenarioName = scenario === 'random' ? 'random' : scenario;
  if (scenarioName === 'random') {
    return randomExpressionTree(random, randInt(random, 1, 3));
  }
  return templateExpression(scenarioName, random, multiDigit);
}

export const EXPRESSION_RANDOM_SCENARIOS = [
  { id: 'precedence', label: ['优先级：先乘除后加减', 'Precedence: ×/÷ before +/−'] },
  { id: 'parentheses', label: ['括号改变顺序', 'Parentheses change the order'] },
  { id: 'left-assoc', label: ['同级左结合', 'Equal precedence, left associative'] },
  { id: 'multi-digit', label: ['多位整数', 'Multi-digit integers'] },
  { id: 'division', label: ['含除法的括号式', 'Parenthesised division'] },
  { id: 'random', label: ['随机嵌套表达式', 'Random nested expression'] },
] as const;
