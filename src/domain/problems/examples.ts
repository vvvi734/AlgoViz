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
  if (language === 'python') {
    return `# ${name}\ndef solve(input):\n    # TODO: implement your solution\n    pass`;
  }
  if (language === 'cpp') {
    return `#include <bits/stdc++.h>\nusing namespace std;\n// ${name}\n// Read a JSON input line from stdin and print the JSON result.\nint main(){\n  // TODO\n  return 0;\n}`;
  }
  return `#include <stdio.h>\n// ${name}\n// Read the test input from stdin and print the result.\nint main(void){\n  // TODO\n  return 0;\n}`;
}
