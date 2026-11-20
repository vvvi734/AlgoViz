import { describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/kmp-default-frames.json';
import edgeFrames from '../../test/fixtures/kmp-edge-frames.json';
import { catalog } from '../algorithms/examples';
import { buildAlgorithmGuide } from '../guides/buildGuide';
import { COURSE_GUIDES } from '../guides/courseGuides';
import { buildFrameInsight } from './frameInsight';
import { kmpLesson } from './kmpLesson';
import { lessonRegistry, validateLessonsAgainstCatalog } from './registry';
import type { Lesson } from './types';
import type { TraceEvent } from '../trace/schema';

const defaults = defaultFrames as unknown as Array<{ lessonStepId: string; structure: unknown; state: unknown }>;
const edges = edgeFrames as unknown as Record<string, Array<{ lessonStepId: string; structure: unknown; state: unknown }>>;
const stepIds = kmpLesson.steps.map((step) => step.stepId);

function eventAt(index: number): TraceEvent {
  const frame = defaults[index]!;
  return {
    schemaVersion: 1,
    step: index,
    eventType: 'step',
    visualType: 'array',
    state: frame.state,
    message: '',
    lessonStepId: frame.lessonStepId,
    structure: frame.structure,
  } as TraceEvent;
}

function checkLesson(lesson: Lesson) {
  expect(lesson.steps).toHaveLength(13);
  expect(new Set(stepIds).size).toBe(13);
  expect(lesson.oneLiner.zh).not.toBe(lesson.oneLiner.en);
  expect(lesson.overview.zh).toContain('lps');
  expect(lesson.overview.zh).toContain('O(n+m)');
  expect(lesson.intuition.zh).toContain('边框');
  expect(lesson.complexity.time).toBe('O(n + m)');
  expect(lesson.complexity.space).toBe('O(m)');
  expect(lesson.complexity.note.zh).toContain('辅助空间');
  expect(lesson.commonMistakes.zh.length).toBeGreaterThanOrEqual(4);
  expect(lesson.commonMistakes.en.length).toBe(lesson.commonMistakes.zh.length);
  for (const step of lesson.steps) {
    expect(step.title.zh).not.toBe(step.title.en);
    expect(step.explanation.zh.length).toBeGreaterThan(30);
    expect(step.explanation.en.length).toBeGreaterThan(30);
    expect(step.tip?.zh.length).toBeGreaterThan(0);
    expect(step.tip?.en.length).toBeGreaterThan(0);
  }
}

describe('STR-01 KMP lesson and guide', () => {
  it('registers one KMP course against the catalog', () => {
    expect(lessonRegistry.byAlgorithm('kmp')).toBe(kmpLesson);
    expect(lessonRegistry.byId('kmp-pattern-matching')).toBe(kmpLesson);
    const validation = validateLessonsAgainstCatalog(lessonRegistry.lessons, Object.keys(catalog));
    expect(validation.ok, validation.errors.join('\n')).toBe(true);
  });

  it('has 13 bilingual stages with precise loops, fallbacks and complexity', () => {
    checkLesson(kmpLesson);
    expect(stepIds).toEqual([
      'init',
      'build-start',
      'build-compare',
      'build-fallback',
      'build-record',
      'build-complete',
      'search-start',
      'search-compare',
      'search-advance',
      'search-fallback',
      'search-miss',
      'match-found',
      'search-done',
    ]);
    expect(kmpLesson.steps[3].explanation.zh).toContain('lps[j-1]');
    expect(kmpLesson.steps[9].explanation.zh).toContain('i 保持不动');
    expect(kmpLesson.steps[11].explanation.zh).toContain('lps[m-1]');
    expect(kmpLesson.steps[12].explanation.zh).toContain('重叠');
  });

  it('maps every real default and edge frame to an authored lesson step', () => {
    const ids = new Set(stepIds);
    for (const frame of defaults) expect(ids).toContain(frame.lessonStepId);
    for (const frames of Object.values(edges)) {
      for (const frame of frames) expect(ids).toContain(frame.lessonStepId);
    }
    const emitted = new Set(defaults.map((frame) => frame.lessonStepId));
    expect([...emitted].sort()).toEqual(stepIds.filter((id) => id !== 'search-miss').sort());
    const allEmitted = new Set([
      ...defaults.map((frame) => frame.lessonStepId),
      ...Object.values(edges).flat().map((frame) => frame.lessonStepId),
    ]);
    expect([...allEmitted].sort()).toEqual([...stepIds].sort());
  });

  it('authors a guide with explicit build loop, search loop and the 0-based convention', () => {
    const guide = buildAlgorithmGuide('kmp', kmpLesson, catalog.kmp);
    expect(guide.flowKind).toBe('algorithm');
    expect(guide.stages).toHaveLength(6);
    expect(guide.intro?.zh).toContain('O(nm)');
    expect(guide.definition?.zh).toContain('lps[k]');
    expect(guide.plain?.zh).toContain('边框');
    expect(guide.conditions.zh.join(' ')).toContain('next / nextval');
    expect(guide.conditions.zh.join(' ')).toContain('O(n+m)');
    expect(guide.complexity).toMatchObject({ time: 'O(n + m)', space: 'O(m)' });
    expect(guide.stages[1].summary?.zh).toContain('lps[j-1]');
    expect(guide.stages[3].summary?.zh).toContain('lps[m-1]');
    expect(guide.stages[4].summary?.zh).toContain('i 不动');
    expect(COURSE_GUIDES.kmp).toBeTruthy();
  });

  it('keeps the right-rail insight in sync with real fallback and match frames', () => {
    const fallbackIndex = defaults.findIndex(
      (frame) => (frame.structure as { operation?: string }).operation === 'search-fallback',
    );
    const insight = buildFrameInsight(kmpLesson, eventAt(fallbackIndex), eventAt(fallbackIndex - 1), 'zh');
    expect(insight?.semantic).toBe(true);
    expect(insight?.action).toContain('j = lps[3]');
    expect(insight?.action).toContain('i=4');
    expect(insight?.changes.some((change) => change.label.includes('回退'))).toBe(true);

    const foundIndex = defaults.findIndex(
      (frame) => (frame.structure as { operation?: string }).operation === 'match-found',
    );
    const found = buildFrameInsight(kmpLesson, eventAt(foundIndex), eventAt(foundIndex - 1), 'zh');
    expect(found?.action).toContain('s=2');
    expect(found?.why).toContain('lps[m-1]');
  });
});
