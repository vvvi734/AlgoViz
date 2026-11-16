import { describe, expect, it } from 'vitest';
import type { TraceEvent } from '../trace/schema';
import { bubbleSortLesson } from './bubbleSort';
import {
  countStepFrames,
  countUnlinkedFrames,
  findFrameForStep,
  lessonStepIdOf,
  resolveStep,
  stepIndexForEvent,
} from './sync';

function event(step: number, lessonStepId?: string): TraceEvent {
  return {
    schemaVersion: 1,
    step,
    eventType: 'step',
    visualType: 'array',
    state: { type: 'array', values: [step] },
    message: `frame ${step}`,
    ...(lessonStepId ? { lessonStepId } : {}),
  };
}

/** Real bubble shape: compare/swap repeat inside every pass. */
const run: TraceEvent[] = [
  event(0, 'init'),
  event(1, 'compare'),
  event(2, 'swap'),
  event(3, 'compare'),
  event(4, 'swap'),
  event(5, 'pass'),
  event(6, 'compare'),
  event(7, 'done'),
];

describe('lesson ⇄ trace sync helpers', () => {
  it('reads the recorded step id and ignores empty / missing values', () => {
    expect(lessonStepIdOf(event(0, 'compare'))).toBe('compare');
    expect(lessonStepIdOf(event(0))).toBeUndefined();
    expect(lessonStepIdOf(event(0, ''))).toBeUndefined();
    expect(lessonStepIdOf(undefined)).toBeUndefined();
  });

  it('resolves a recorded id against the course, and returns null for foreign ids', () => {
    expect(resolveStep(bubbleSortLesson, 'compare')?.stepId).toBe('compare');
    expect(resolveStep(bubbleSortLesson, 'not-in-course')).toBeNull();
    expect(resolveStep(bubbleSortLesson, undefined)).toBeNull();
    expect(resolveStep(undefined, 'compare')).toBeNull();
  });

  it('maps a frame to its step index, -1 when unlinked or unknown', () => {
    expect(stepIndexForEvent(bubbleSortLesson, event(0, 'init'))).toBe(0);
    expect(stepIndexForEvent(bubbleSortLesson, event(0, 'compare'))).toBe(1);
    expect(stepIndexForEvent(bubbleSortLesson, event(0, 'done'))).toBe(4);
    expect(stepIndexForEvent(bubbleSortLesson, event(0))).toBe(-1);
    expect(stepIndexForEvent(bubbleSortLesson, event(0, 'stale-pack-step'))).toBe(-1);
    expect(stepIndexForEvent(undefined, event(0, 'compare'))).toBe(-1);
    expect(stepIndexForEvent(bubbleSortLesson, undefined)).toBe(-1);
  });

  it('counts every real occurrence of a repeated step, not just the first', () => {
    expect(countStepFrames(run, 'compare')).toBe(3);
    expect(countStepFrames(run, 'swap')).toBe(2);
    expect(countStepFrames(run, 'done')).toBe(1);
    expect(countStepFrames(run, 'ghost')).toBe(0);
    expect(countStepFrames([], 'compare')).toBe(0);
  });

  it('jumps to the next occurrence after the current frame', () => {
    expect(findFrameForStep(run, 'compare', 0)).toBe(1);
    expect(findFrameForStep(run, 'compare', 1)).toBe(3);
    expect(findFrameForStep(run, 'compare', 3)).toBe(6);
    expect(findFrameForStep(run, 'swap', 1)).toBe(2);
    expect(findFrameForStep(run, 'done', 0)).toBe(7);
  });

  it('wraps back to the first occurrence when nothing follows (no fake frames)', () => {
    // Last compare (frame 6): wrap to the first compare (frame 1).
    expect(findFrameForStep(run, 'compare', 6)).toBe(1);
    // At the final frame there is nothing after any step, so wrap per step.
    expect(findFrameForStep(run, 'pass', 7)).toBe(5);
    // Wrapping is per-step validity: step 0 is a legal target, not a fake one.
    expect(findFrameForStep(run, 'init', 7)).toBe(0);
    expect(run[0].lessonStepId).toBe('init');
  });

  it('returns null when the run never recorded that step', () => {
    expect(findFrameForStep(run, 'ghost', 0)).toBeNull();
    expect(findFrameForStep([], 'compare', 0)).toBeNull();
    expect(findFrameForStep(run, '', 0)).toBeNull();
  });

  it('never throws on an out-of-range or non-finite cursor', () => {
    expect(findFrameForStep(run, 'compare', 999)).toBe(1); // nothing after → wrap
    expect(findFrameForStep(run, 'init', -5)).toBe(0); // clamps to before the start
    expect(findFrameForStep(run, 'init', Number.NaN)).toBe(0);
  });

  it('counts frames that carry no usable lesson link (legacy / JS traces)', () => {
    expect(countUnlinkedFrames(run)).toBe(0);
    expect(countUnlinkedFrames([event(0), event(1, 'compare'), event(2, '')])).toBe(2);
    expect(countUnlinkedFrames([])).toBe(0);
  });
});
