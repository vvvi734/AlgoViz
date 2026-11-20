import { describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/search-default-frames.json';
import edgeFrames from '../../test/fixtures/search-edge-frames.json';
import { catalog, defaultInputFor, exampleFor } from '../algorithms/examples';
import { buildAlgorithmGuide } from '../guides/buildGuide';
import { binarySearchLesson } from './binarySearchLesson';
import { linearSearchLesson } from './linearSearchLesson';
import { lessonRegistry, validateLessonsAgainstCatalog } from './registry';
import type { Lesson } from './types';

type Frame = { lessonStepId: string };

const defaults = defaultFrames as unknown as Record<'linear' | 'binary', Frame[]>;
const edges = edgeFrames as unknown as Record<'linear' | 'binary', Record<string, Frame[]>>;

function checkLesson(lesson: Lesson, algorithm: 'linear' | 'binary') {
  expect(lesson.steps.length).toBeGreaterThanOrEqual(3);
  expect(lesson.steps.length).toBeLessThanOrEqual(5);
  expect(lesson.oneLiner.zh.length).toBeGreaterThan(0);
  expect(lesson.oneLiner.en.length).toBeGreaterThan(0);
  expect(lesson.complexity.time).toBeTruthy();
  expect(lesson.complexity.space).toBeTruthy();
  expect(new Set(lesson.steps.map((step) => step.stepId)).size).toBe(lesson.steps.length);
  for (const step of lesson.steps) {
    expect(step.title.zh).not.toBe(step.title.en);
    expect(step.explanation.zh.length).toBeGreaterThan(20);
    expect(step.explanation.en.length).toBeGreaterThan(20);
  }
  const stepIds = new Set(lesson.steps.map((step) => step.stepId));
  const frames = [...defaults[algorithm], ...Object.values(edges[algorithm]!).flat()];
  for (const frame of frames) expect(stepIds).toContain(frame.lessonStepId);
}

describe('F1 search lessons', () => {
  it('registers both real courses without duplicate algorithm entries', () => {
    expect(lessonRegistry.byAlgorithm('linear')).toBe(linearSearchLesson);
    expect(lessonRegistry.byAlgorithm('binary')).toBe(binarySearchLesson);
    expect(lessonRegistry.has('linear')).toBe(true);
    expect(lessonRegistry.has('binary')).toBe(true);
    const validation = validateLessonsAgainstCatalog(lessonRegistry.lessons, Object.keys(catalog));
    expect(validation.ok, validation.errors.join('\n')).toBe(true);
  });

  it('keeps five complete bilingual stages for each course', () => {
    checkLesson(linearSearchLesson, 'linear');
    checkLesson(binarySearchLesson, 'binary');
    expect(linearSearchLesson.title.zh).toContain('顺序查找');
    expect(binarySearchLesson.title.zh).toContain('二分查找');
    expect(linearSearchLesson.overview.zh).toContain('O(1)');
    expect(linearSearchLesson.overview.zh).toContain('O(n)');
    expect(binarySearchLesson.overview.zh).toContain('O(log n)');
    expect(binarySearchLesson.overview.zh).toContain('O(1)');
    expect(binarySearchLesson.prerequisites.zh.some((text) => text.includes('升序'))).toBe(true);
    expect(binarySearchLesson.commonMistakes.zh.some((text) => text.includes('偷偷'))).toBe(true);
  });

  it('maps every real frame to a real stage instead of a zero-stage panel', () => {
    const linearIds = new Set(linearSearchLesson.steps.map((step) => step.stepId));
    expect([...linearIds]).toEqual(['init', 'scan-start', 'scan-compare', 'scan-next', 'done']);
    const binaryIds = new Set(binarySearchLesson.steps.map((step) => step.stepId));
    expect([...binaryIds]).toEqual(['init', 'binary-mid', 'binary-compare', 'binary-narrow', 'done']);
    expect(defaults.binary[0]!.lessonStepId).toBe('init');
    expect(edges.binary.unsorted![0]!.lessonStepId).toBe('init');
  });

  it('serves the official Python examples and inputs through the existing catalog', () => {
    expect(exampleFor('linear', 'python')).toContain('Linear search');
    expect(exampleFor('linear', 'python')).toContain('emit("scan-start"');
    expect(exampleFor('binary', 'python')).toContain('Iterative binary search');
    expect(exampleFor('binary', 'python')).toContain('while left <= right');
    expect(defaultInputFor('linear')).toEqual({ nums: [6, 3, 9, 2, 7, 4], target: 7 });
    expect(defaultInputFor('binary')).toEqual({ nums: [1, 3, 5, 7, 9, 11, 13], target: 9 });
  });

  it('builds an authored horizontal flow rather than a zero-stage fallback', () => {
    const linearGuide = buildAlgorithmGuide('linear', linearSearchLesson, catalog.linear);
    const binaryGuide = buildAlgorithmGuide('binary', binarySearchLesson, catalog.binary);
    expect(linearGuide.source).toBe('curated');
    expect(binaryGuide.source).toBe('curated');
    expect(linearGuide.stages).toHaveLength(4);
    expect(binaryGuide.stages).toHaveLength(5);
    expect(linearGuide.stages?.[0]?.title.zh).toContain('索引');
    expect(binaryGuide.stages?.[2]?.title.zh).toContain('中点');
  });
});
