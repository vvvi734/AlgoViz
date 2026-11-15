import type { Lang } from '../../i18n/types';

/**
 * Categories shipped in v0.2. The three-way split
 * (university / data structures / 408 exam) is Issue 10 and is NOT implemented.
 */
export type ProblemCategory = 'university' | 'postgrad';
export type ProblemDifficulty = 'easy' | 'mid';

export type TestCase = [unknown, unknown];

export interface PracticeProblem {
  id: string;
  cat: ProblemCategory;
  diff: ProblemDifficulty;
  name: string[];
  desc: string[];
  starter: string;
  tests: TestCase[];
  /** Three progressive hints, each [zh, en]. */
  hints: string[][];
}

export interface TestResult {
  pass: boolean;
  actual: unknown;
  expected: unknown;
}

export const PROBLEM_CATEGORY_LABELS: Record<ProblemCategory, [string, string]> = {
  university: ['大学基础', 'University'],
  postgrad: ['考研强化', 'Postgrad exams'],
};

export function problemCategoryLabel(cat: ProblemCategory, lang: Lang): string {
  return PROBLEM_CATEGORY_LABELS[cat]?.[lang === 'zh' ? 0 : 1] ?? cat;
}
