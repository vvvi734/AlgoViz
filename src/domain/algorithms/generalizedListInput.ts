/**
 * 广义表两门课程的共享输入契约。
 *
 * 输入只接受一个小规模括号表达式；官方、自定义和随机三种方式都走同一个
 * 解析器，保证 UI 预览、Python 解析和 Trace Schema 使用完全相同的语法。
 */
import {
  GL_MAX_EXPRESSION_LENGTH,
  parseGeneralizedList,
  type GeneralizedListParseError,
  type GeneralizedListParseResult,
} from '../generalizedList';

export const GENERALIZED_LIST_GUIDED_INPUT_ALGORITHMS = ['gl-depth', 'gl-copy'] as const;
export type GeneralizedListGuidedInputAlgorithm =
  (typeof GENERALIZED_LIST_GUIDED_INPUT_ALGORITHMS)[number];

export const GENERALIZED_LIST_DEFAULT_EXPRESSION = '(a, (b, c), ((d), e))';

export interface GeneralizedListInputFields {
  expression: string;
}

export const GENERALIZED_LIST_RANDOM_SCENARIOS = [
  {
    id: 'empty',
    label: ['空表', 'Empty list'] as const,
    expressions: ['()'],
  },
  {
    id: 'flat',
    label: ['单层列表', 'Flat list'] as const,
    expressions: ['(a, b, c)', '(x, y, z, w)'],
  },
  {
    id: 'nested',
    label: ['含嵌套子表', 'Nested sublists'] as const,
    expressions: ['(a, (b, c), d)', '(a, (b, (c, d)), e)'],
  },
  {
    id: 'deep',
    label: ['多层嵌套', 'Deep nesting'] as const,
    expressions: ['((a, b), (c, (d, e)))', '(a, ((b, c), (d, (e))))'],
  },
  {
    id: 'empty-sublist',
    label: ['含空子表', 'Contains empty sublists'] as const,
    expressions: ['((), a, (b))', '(a, (), ((), b))'],
  },
] as const;

export const GENERALIZED_LIST_GUIDED_INPUT = 'gl-depth' as const;

export function isGeneralizedListGuidedInputAlgorithm(
  id: string,
): id is GeneralizedListGuidedInputAlgorithm {
  return (GENERALIZED_LIST_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function emptyGeneralizedListDraft(): GeneralizedListInputFields {
  return { expression: GENERALIZED_LIST_DEFAULT_EXPRESSION };
}

export function generalizedListDraftFromInput(input: unknown): GeneralizedListInputFields {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return emptyGeneralizedListDraft();
  }
  const expression =
    typeof (input as { expression?: unknown }).expression === 'string'
      ? (input as { expression: string }).expression
      : GENERALIZED_LIST_DEFAULT_EXPRESSION;
  return { expression };
}

export type GeneralizedListBuildResult =
  | { ok: true; input: { expression: string } }
  | { ok: false; error: { key: string; max?: number } };

const ERROR_KEYS: Record<GeneralizedListParseError, string> = {
  GL_ERROR_EMPTY: 'guidedErrorGLEmpty',
  GL_ERROR_LENGTH: 'guidedErrorGLLength',
  GL_ERROR_SYNTAX: 'guidedErrorGLSyntax',
  GL_ERROR_ATOM: 'guidedErrorGLAtom',
  GL_ERROR_NODES: 'guidedErrorGLNodes',
  GL_ERROR_DEPTH: 'guidedErrorGLDepth',
};

export function buildGeneralizedListInput(
  fields: GeneralizedListInputFields,
): GeneralizedListBuildResult {
  const parsed: GeneralizedListParseResult = parseGeneralizedList(fields.expression);
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        key: ERROR_KEYS[parsed.error],
        max: parsed.error === 'GL_ERROR_LENGTH' ? GL_MAX_EXPRESSION_LENGTH : undefined,
      },
    };
  }
  return { ok: true, input: { expression: parsed.expression } };
}

/** 随机场景只从预先验证过的模板里抽取，避免生成器制造非法表达式。 */
export function randomGeneralizedListDraft(
  scenario: string,
  rng: () => number = Math.random,
): GeneralizedListInputFields {
  const template =
    GENERALIZED_LIST_RANDOM_SCENARIOS.find((item) => item.id === scenario) ??
    GENERALIZED_LIST_RANDOM_SCENARIOS[2];
  const choice = template.expressions[Math.floor(rng() * template.expressions.length)] ??
    template.expressions[0];
  return { expression: choice };
}
