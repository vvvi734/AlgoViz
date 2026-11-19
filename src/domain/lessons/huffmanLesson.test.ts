import { describe, expect, it } from 'vitest';
import { huffmanLesson } from './huffmanLesson';
import { validateLesson } from './schema';
import rawDefault from '../../test/fixtures/huffman-default-frames.json';
import rawEdge from '../../test/fixtures/huffman-edge-frames.json';

type Frame = { lessonStepId?: string; structure: { operation: string; result: string | null } };
const official = (rawDefault as unknown as { official: Frame[] }).official;
const equal = (rawEdge as unknown as { equal: Frame[] }).equal;
const single = (rawEdge as unknown as { single: Frame[] }).single;
const empty = (rawEdge as unknown as { empty: Frame[] }).empty;

describe('T4 Huffman course', () => {
  it('is valid bilingual content with one step per emitted lesson_step', () => {
    const result = validateLesson(huffmanLesson);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(huffmanLesson.algorithmId).toBe('huffman');
    expect(huffmanLesson.steps.map((step) => step.stepId)).toEqual([
      'init',
      'merge-select',
      'merge-create',
      'merge-requeue',
      'build-done',
      'encode-start',
      'encode-left',
      'encode-right',
      'encode-leaf',
      'done',
    ]);
    for (const step of huffmanLesson.steps) {
      expect(step.title.zh.length).toBeGreaterThan(0);
      expect(step.title.en.length).toBeGreaterThan(0);
      expect(step.explanation.zh.length).toBeGreaterThan(0);
      expect(step.explanation.en.length).toBeGreaterThan(0);
    }
  });

  it('covers every step id that the real official trace emits', () => {
    const lessonSteps = new Set(huffmanLesson.steps.map((step) => step.stepId));
    const emitted = new Set(official.map((frame) => frame.lessonStepId));
    expect(emitted.size).toBe(10);
    for (const step of emitted) expect(lessonSteps.has(step!)).toBe(true);
    // Edge runs use the same join keys: no frame may point at a missing course step.
    for (const frames of [equal, single, empty]) {
      for (const frame of frames) expect(lessonSteps.has(frame.lessonStepId ?? '')).toBe(true);
    }
  });

  it('teaches WPL, optimality, the heap, prefix codes, the fixed comparison and the mnemonic', () => {
    const joined = [
      huffmanLesson.complexity.note.zh,
      huffmanLesson.complexity.note.en,
      ...huffmanLesson.steps.flatMap((step) => [step.explanation.zh, step.explanation.en, step.tip?.zh ?? '', step.tip?.en ?? '']),
    ].join('\n');
    for (const term of ['WPL', '带权路径长度', '最优', '最小堆', '前缀', '定长', 'O(n log n)']) {
      expect(joined).toContain(term);
    }
    expect(joined).toContain('两小合一，重复建树；左零右一，走到叶子');
    expect(joined).toContain('Merge the two smallest');
  });

  it('keeps the non-unique-code and single-symbol caveats explicit', () => {
    const text = huffmanLesson.steps.map((step) => `${step.explanation.zh}\n${step.explanation.en}`).join('\n');
    expect(text).toContain('编码不唯一');
    expect(text).toContain('not unique');
    expect(text).toContain('理论深度 0');
    expect(text).toContain('实际采用');
    expect(huffmanLesson.commonMistakes.zh.length).toBe(huffmanLesson.commonMistakes.en.length);
  });
});
