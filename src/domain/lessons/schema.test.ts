import { describe, expect, it } from 'vitest';
import { LANGUAGE_EXAMPLES } from '../algorithms/languageExamples.generated';
import { bubbleSortLesson } from './bubbleSort';
import { factorialLesson } from './factorial';
import { parseLesson, validateLesson, validateLessonSet } from './schema';
import type { Lesson } from './types';

/** Deep copy so each test mutates its own draft. */
function draftOf(lesson: Lesson): Lesson {
  return JSON.parse(JSON.stringify(lesson)) as Lesson;
}

function errorText(input: unknown): string {
  const result = validateLesson(input);
  return result.ok ? '' : result.errors.join(' | ');
}

describe('Lesson schema (Stage 3B)', () => {
  it('accepts the two bundled courses', () => {
    expect(validateLesson(bubbleSortLesson).ok).toBe(true);
    expect(validateLesson(factorialLesson).ok).toBe(true);
  });

  it('rejects a lesson without teaching steps', () => {
    const draft = draftOf(bubbleSortLesson) as Partial<Lesson>;
    delete draft.steps;
    expect(validateLesson(draft).ok).toBe(false);
    expect(errorText(draft)).toMatch(/steps/);
  });

  it('rejects an empty steps array', () => {
    const draft = draftOf(bubbleSortLesson);
    draft.steps = [];
    expect(validateLesson(draft).ok).toBe(false);
    expect(errorText(draft)).toMatch(/at least one teaching step/);
  });

  it('rejects duplicate stepId because it makes the highlight ambiguous', () => {
    const draft = draftOf(bubbleSortLesson);
    draft.steps[1].stepId = draft.steps[0].stepId;
    expect(validateLesson(draft).ok).toBe(false);
    expect(errorText(draft)).toMatch(/duplicate stepId/);
  });

  it('requires zh and en to describe the same number of prerequisites / mistakes', () => {
    const draft = draftOf(factorialLesson);
    draft.prerequisites.zh.push('额外前置');
    expect(validateLesson(draft).ok).toBe(false);
    expect(errorText(draft)).toMatch(/prerequisites must have the same number/);

    const other = draftOf(factorialLesson);
    other.commonMistakes.en.push('one more mistake');
    expect(validateLesson(other).ok).toBe(false);
    expect(errorText(other)).toMatch(/commonMistakes must have the same number/);
  });

  it('rejects an algorithmId that is not a lowercase stable id', () => {
    const draft = draftOf(bubbleSortLesson);
    draft.algorithmId = 'Bubble Sort';
    expect(validateLesson(draft).ok).toBe(false);
    expect(errorText(draft)).toMatch(/algorithmId/);
  });

  it('rejects a non-stable stepId and a malformed contentVersion', () => {
    const badStep = draftOf(bubbleSortLesson);
    badStep.steps[0].stepId = 'Init!';
    expect(validateLesson(badStep).ok).toBe(false);
    expect(errorText(badStep)).toMatch(/stepId/);

    const badVersion = draftOf(bubbleSortLesson);
    badVersion.contentVersion = '1.0';
    expect(validateLesson(badVersion).ok).toBe(false);
    expect(errorText(badVersion)).toMatch(/contentVersion/);
  });

  it('keeps step ids language-neutral: one id, both languages present', () => {
    for (const lesson of [bubbleSortLesson, factorialLesson]) {
      const ids = lesson.steps.map((step) => step.stepId);
      expect(new Set(ids).size).toBe(ids.length);
      for (const step of lesson.steps) {
        expect(step.title.zh.length).toBeGreaterThan(0);
        expect(step.title.en.length).toBeGreaterThan(0);
        expect(step.explanation.zh.length).toBeGreaterThan(0);
        expect(step.explanation.en.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps course step ids exactly in sync with the Python presets', () => {
    // The join key only works if the authoring side and the runner agree.
    // Every course id must be recorded by the shipped Python example, and every
    // recorded id must exist in the course (checked in both directions).
    for (const [lesson, algoKey] of [
      [bubbleSortLesson, 'bubble'],
      [factorialLesson, 'factorial'],
    ] as const) {
      const python = LANGUAGE_EXAMPLES.python?.[algoKey] ?? '';
      // body frames record `lesson_step=`, the `@tracked` decorator records
      // `call_step=` / `return_step=` — both are real execution-time claims.
      const recorded = new Set(
        [...python.matchAll(/(?:lesson_step|call_step|return_step)='([a-z0-9_-]+)'/g)].map((match) => match[1]),
      );
      expect(recorded.size).toBeGreaterThan(0);
      expect([...recorded].sort()).toEqual(lesson.steps.map((step) => step.stepId).sort());
    }
  });

  it('parseLesson throws on invalid input and returns the lesson on valid input', () => {
    expect(() => parseLesson({ lessonId: 'broken' })).toThrow();
    expect(parseLesson(bubbleSortLesson).lessonId).toBe('bubble-sort-basics');
  });

  it('validateLessonSet rejects two courses claiming one algorithm or one id', () => {
    expect(validateLessonSet([bubbleSortLesson, factorialLesson]).ok).toBe(true);

    const sameAlgorithm = [...[bubbleSortLesson, { ...draftOf(factorialLesson), algorithmId: 'bubble' }]];
    const result = validateLessonSet(sameAlgorithm);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/duplicate algorithmId/);

    const sameId = [bubbleSortLesson, { ...draftOf(factorialLesson), lessonId: bubbleSortLesson.lessonId }];
    expect(validateLessonSet(sameId).errors.join(' ')).toMatch(/duplicate lessonId/);
  });
});
