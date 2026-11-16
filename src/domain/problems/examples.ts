import { PROBLEM_CATALOG } from './catalog.generated';
import type { PracticeProblem } from './types';
import type { CodeLanguage } from '../algorithms/types';

export const problems: PracticeProblem[] = PROBLEM_CATALOG;

export function findProblem(id: string): PracticeProblem {
  return problems.find((p) => p.id === id) ?? problems[0];
}

/** Code scaffold shown for a problem in the selected language. */
export function practiceTemplate(problem: PracticeProblem, language: CodeLanguage): string {
  if (language === 'js') return problem.starter;
  const name = problem.name[1];
  return `# ${name}\ndef solve(input):\n    # TODO: implement your solution\n    pass`;
}
