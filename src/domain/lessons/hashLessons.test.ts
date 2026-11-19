import { describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/hash-default-frames.json';
import edgeFrames from '../../test/fixtures/hash-edge-frames.json';
import { ALGORITHM_CATALOG } from '../algorithms/catalog.generated';
import { defaultInputFor, exampleFor } from '../algorithms/examples';
import { TEXTBOOK_CHAPTERS } from '../algorithms/textbook';
import { buildAlgorithmGuide } from '../guides/buildGuide';
import { hashChainingLesson } from './hashChainingLesson';
import { hashProbingLesson } from './hashProbingLesson';
import { lessonRegistry, validateLessonsAgainstCatalog } from './registry';
import type { Lesson } from './types';

type Frame = { lessonStepId: string };
const defaults = defaultFrames as unknown as Record<'hash-chain' | 'hash-probe', Frame[]>;
const edges = edgeFrames as unknown as Record<'hash-chain' | 'hash-probe', Record<string, Frame[]>>;

function checkLesson(lesson: Lesson, algorithm: 'hash-chain' | 'hash-probe') {
  expect(lesson.steps).toHaveLength(5);
  expect(lesson.oneLiner.zh.length).toBeGreaterThan(0);
  expect(lesson.oneLiner.en.length).toBeGreaterThan(0);
  expect(lesson.complexity.time).toMatch(/O\(1/);
  expect(lesson.complexity.time).toContain('O(n)');
  expect(new Set(lesson.steps.map((step) => step.stepId)).size).toBe(5);
  for (const step of lesson.steps) {
    expect(step.title.zh).not.toBe(step.title.en);
    expect(step.explanation.zh.length).toBeGreaterThan(30);
    expect(step.explanation.en.length).toBeGreaterThan(30);
  }
  const stepIds = new Set(lesson.steps.map((step) => step.stepId));
  const frames = [...defaults[algorithm], ...Object.values(edges[algorithm]!).flat()];
  for (const frame of frames) expect(stepIds).toContain(frame.lessonStepId);
}

describe('F2 hash lessons', () => {
  it('registers both courses without duplicate algorithm entries', () => {
    expect(lessonRegistry.byAlgorithm('hash-chain')).toBe(hashChainingLesson);
    expect(lessonRegistry.byAlgorithm('hash-probe')).toBe(hashProbingLesson);
    expect(lessonRegistry.has('hash-chain')).toBe(true);
    expect(lessonRegistry.has('hash-probe')).toBe(true);
    const validation = validateLessonsAgainstCatalog(lessonRegistry.lessons, Object.keys(ALGORITHM_CATALOG));
    expect(validation.ok, validation.errors.join('\n')).toBe(true);
  });

  it('keeps five complete bilingual stages per course', () => {
    checkLesson(hashChainingLesson, 'hash-chain');
    checkLesson(hashProbingLesson, 'hash-probe');
    expect(hashChainingLesson.title.zh).toContain('链地址法');
    expect(hashProbingLesson.title.zh).toContain('线性探测');
    expect(hashChainingLesson.overview.zh).toContain('装载因子');
    expect(hashChainingLesson.overview.zh).toContain('冲突');
    expect(hashProbingLesson.overview.zh).toContain('EMPTY');
    expect(hashProbingLesson.overview.zh).toContain('DELETED');
    expect(hashProbingLesson.overview.zh).toContain('聚集');
    expect(hashProbingLesson.overview.zh).toContain('回绕');
    expect(hashChainingLesson.complexity.note.zh).toContain('最坏');
    expect(hashProbingLesson.complexity.note.zh).toContain('最坏');
  });

  it('maps every real frame to one of the five real stages', () => {
    expect(hashChainingLesson.steps.map((step) => step.stepId)).toEqual([
      'init', 'hash', 'collision', 'resolve', 'result',
    ]);
    expect(hashProbingLesson.steps.map((step) => step.stepId)).toEqual([
      'init', 'hash', 'probe', 'resolve', 'result',
    ]);
    for (const frame of defaults['hash-chain']) {
      expect(new Set(hashChainingLesson.steps.map((step) => step.stepId))).toContain(frame.lessonStepId);
    }
    for (const frame of defaults['hash-probe']) {
      expect(new Set(hashProbingLesson.steps.map((step) => step.stepId))).toContain(frame.lessonStepId);
    }
  });

  it('serves the official Python example and unique-key input through the catalog', () => {
    const chain = exampleFor('hash-chain', 'python');
    expect(chain).toContain('Separate chaining');
    expect(chain).toContain('class Node');
    expect(chain).toContain('self.next = next_node');
    expect(chain).toContain('if same:');
    const probe = exampleFor('hash-probe', 'python');
    expect(probe).toContain('Linear probing');
    expect(probe).toContain('TOMBSTONE = object()');
    expect(probe).toContain('first_deleted');
    const chainInput = defaultInputFor('hash-chain') as { tableSize: number; operations: unknown[][] };
    expect(chainInput.tableSize).toBe(7);
    expect(chainInput.operations.slice(0, 3)).toEqual([['insert', 1], ['insert', 8], ['insert', 15]]);
    const probeInput = defaultInputFor('hash-probe') as { tableSize: number; operations: unknown[][] };
    expect(probeInput.tableSize).toBe(7);
    expect(probeInput.operations.slice(0, 3)).toEqual([['insert', 1], ['insert', 8], ['insert', 15]]);
    expect(dataOperations(defaultInputFor('hash-chain'))).toContain('find');
    expect(probeInput.operations).toContainEqual(['insert', 31]);
    expect(probeInput.operations).toContainEqual(['delete', 24]);
  });

  it('builds an authored horizontal flow rather than a metadata-only fallback', () => {
    const chain = buildAlgorithmGuide('hash-chain', hashChainingLesson, ALGORITHM_CATALOG['hash-chain']);
    const probe = buildAlgorithmGuide('hash-probe', hashProbingLesson, ALGORITHM_CATALOG['hash-probe']);
    expect(chain.source).toBe('curated');
    expect(probe.source).toBe('curated');
    expect(chain.stages).toHaveLength(4);
    expect(probe.stages).toHaveLength(5);
    expect(chain.stages?.[0]?.title.zh).toContain('桶号');
    expect(probe.stages?.[1]?.title.zh).toContain('探测');
    expect(chain.pitfalls.zh.some((text) => text.includes('O(1)'))).toBe(true);
    expect(probe.pitfalls.zh.some((text) => text.includes('EMPTY'))).toBe(true);
  });

  it('upgrades the existing textbook hash topic without changing chapter order', () => {
    const chapter = TEXTBOOK_CHAPTERS.find((entry) => entry.id === 'ch8-search');
    expect(chapter).toBeTruthy();
    const topic = chapter!.topics.find((entry) => entry.id === 'hash-search');
    expect(topic).toBeTruthy();
    expect(topic!.planned).not.toBe(true);
    expect(topic!.algorithms).toEqual([{ id: 'hash-chain' }, { id: 'hash-probe' }]);
    const duplicate = chapter!.topics.filter((entry) => entry.id === 'hash-search');
    expect(duplicate).toHaveLength(1);
    expect(chapter!.topics.map((entry) => entry.id).slice(-2)).toEqual(['multiway-tree', 'hash-search']);
  });

  it('uses one unique-key policy in the courses and metadata', () => {
    expect(hashChainingLesson.steps[4]!.explanation.zh).toContain('duplicate');
    expect(hashChainingLesson.steps[4]!.explanation.zh).toContain('不覆盖');
    expect(hashProbingLesson.steps[4]!.explanation.zh).toContain('duplicate');
    expect(ALGORITHM_CATALOG['hash-chain']!.desc[0]).toContain('重复');
    expect(ALGORITHM_CATALOG['hash-probe']!.desc[0]).toContain('重复');
  });
});

function dataOperations(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  const operations = (value as { operations?: unknown }).operations;
  if (!Array.isArray(operations)) return [];
  return operations.map((entry) => (Array.isArray(entry) ? String(entry[0]) : ''));
}
