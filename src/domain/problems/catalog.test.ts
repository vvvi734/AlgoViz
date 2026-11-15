import { describe, expect, it } from 'vitest';
import { problems, findProblem, practiceTemplate } from './examples';
import { CODE_LANGUAGES } from '../algorithms/types';

describe('practice bank (current scope: 2 sample categories, 8 original problems)', () => {
  it('has 8 problems with unique ids', () => {
    expect(problems).toHaveLength(8);
    expect(new Set(problems.map((p) => p.id)).size).toBe(8);
  });

  it('documents that only university/postgrad exist so far', () => {
    expect(new Set(problems.map((p) => p.cat))).toEqual(new Set(['university', 'postgrad']));
  });

  it('gives every problem public tests and three bilingual progressive hints', () => {
    for (const problem of problems) {
      expect(problem.tests.length, problem.id).toBeGreaterThan(0);
      expect(problem.hints, problem.id).toHaveLength(3);
      for (const hint of problem.hints) {
        expect(hint).toHaveLength(2);
        expect(hint[0].trim()).not.toBe('');
        expect(hint[1].trim()).not.toBe('');
      }
      expect(problem.name).toHaveLength(2);
      expect(problem.desc).toHaveLength(2);
      expect(problem.starter).toContain('solve');
    }
  });

  it('produces a scaffold in all four languages', () => {
    for (const language of CODE_LANGUAGES) {
      const code = practiceTemplate(problems[0], language);
      expect(code.length, language).toBeGreaterThan(0);
    }
    expect(practiceTemplate(problems[0], 'js')).toBe(problems[0].starter);
    expect(practiceTemplate(problems[0], 'python')).toContain('def solve');
    expect(practiceTemplate(problems[0], 'cpp')).toContain('#include');
    expect(practiceTemplate(problems[0], 'c')).toContain('#include <stdio.h>');
  });

  it('falls back to the first problem for unknown ids', () => {
    expect(findProblem('does-not-exist').id).toBe(problems[0].id);
  });
});
