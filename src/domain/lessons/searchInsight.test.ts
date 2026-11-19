import { describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/search-default-frames.json';
import edgeFrames from '../../test/fixtures/search-edge-frames.json';
import type { SearchSnapshot, TraceEvent } from '../trace/schema';
import type { TraceState } from '../trace/types';
import { binarySearchLesson } from './binarySearchLesson';
import { buildFrameInsight } from './frameInsight';
import { linearSearchLesson } from './linearSearchLesson';

type Frame = { state: TraceState; structure: SearchSnapshot; lessonStepId: string };
const defaults = defaultFrames as unknown as Record<'linear' | 'binary', Frame[]>;
const edges = edgeFrames as unknown as Record<'linear' | 'binary', Record<string, Frame[]>>;

function eventOf(frame: Frame): TraceEvent {
  return {
    schemaVersion: 1,
    step: 0,
    eventType: 'step',
    visualType: 'array',
    state: frame.state,
    message: '',
    lessonStepId: frame.lessonStepId,
    structure: frame.structure,
  } as TraceEvent;
}

describe('F1 search frame insight', () => {
  it('explains a real linear comparison with checked count and current value', () => {
    const index = defaults.linear.findIndex(
      (frame) => frame.structure.operation === 'scan-compare' && frame.structure.index === 2,
    );
    const frame = defaults.linear[index]!;
    const insight = buildFrameInsight(linearSearchLesson, eventOf(frame), eventOf(defaults.linear[index - 1]!), 'zh')!;
    expect(insight.semantic).toBe(true);
    expect(insight.action).toContain('a[2]=9');
    expect(insight.action).toContain('目标 7');
    expect(insight.why).toContain('不能按大小跳过');
    expect(insight.changes.some((change) => change.label === '已检查' && change.after === '2 / 6')).toBe(true);
    expect(insight.changes.some((change) => change.after?.includes('≠'))).toBe(true);
    expect(insight.memory).toBeTruthy();
  });

  it('explains binary boundary changes as a real range update', () => {
    const index = defaults.binary.findIndex((frame) => frame.structure.operation === 'binary-exclude-left');
    const frame = defaults.binary[index]!;
    const insight = buildFrameInsight(binarySearchLesson, eventOf(frame), eventOf(defaults.binary[index - 1]!), 'zh')!;
    expect(insight.semantic).toBe(true);
    expect(insight.action).toContain('排除左半区');
    expect(insight.action).toContain('left 变为 4');
    expect(insight.changes.some((change) => change.label === '查找区间' && change.before === '[0, 6]' && change.after === '[4, 6]')).toBe(true);
    expect(insight.changes.some((change) => change.label === '排除左半区' && change.after === 'p3..p3')).toBe(true);
    expect(insight.memory).toBeTruthy();
  });

  it('gives an honest unsorted warning instead of a fake action', () => {
    const frame = edges.binary.unsorted![0]!;
    const insight = buildFrameInsight(binarySearchLesson, eventOf(frame), undefined, 'en')!;
    expect(insight.semantic).toBe(true);
    expect(insight.action).toContain('not ascending');
    expect(insight.changes.some((change) => change.label === 'prerequisite' && change.tone === 'warning')).toBe(true);
    expect(insight.memory).toBeTruthy();
  });
});
