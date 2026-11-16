import { describe, expect, it } from 'vitest';
import { buildMentorContext, describeMentorContext } from './context';
import type { Lesson } from '../lessons/types';
import type { TraceEvent } from '../trace/schema';

const event: TraceEvent = {
  schemaVersion: 1,
  step: 1,
  eventType: 'compare',
  visualType: 'array',
  state: { type: 'array', items: [2, 1] },
  message: 'compare 2 and 1',
  sourceLocation: { line: 4 },
  variables: [
    { name: 'i', type: 'int', value: 0 },
    { name: 'j', type: 'int', value: 1 },
  ],
  callStack: [{ name: 'bubble_sort', depth: 0 }],
  lessonStepId: 'compare',
};

const lesson: Lesson = {
  lessonId: 'bubble-sort-basics',
  algorithmId: 'bubble-sort',
  contentVersion: '1',
  title: { zh: '冒泡排序', en: 'Bubble sort' },
  oneLiner: { zh: '一句话', en: 'One line' },
  overview: { zh: '概览', en: 'Overview' },
  intuition: { zh: '思路', en: 'Idea' },
  prerequisites: { zh: [], en: [] },
  complexity: { time: 'O(n²)', space: 'O(1)', note: { zh: '备注', en: 'Note' } },
  steps: [
    {
      stepId: 'compare',
      title: { zh: '比较相邻元素', en: 'Compare neighbours' },
      explanation: { zh: '比较左边和右边。', en: 'Compare left and right.' },
    },
  ],
  commonMistakes: { zh: [], en: [] },
};

describe('buildMentorContext', () => {
  it('uses the frame under the cursor and the matching lesson stage', () => {
    const context = buildMentorContext({
      algorithmId: 'bubble-sort',
      lesson,
      event,
      totalEvents: 5,
      locale: 'zh',
      traceStale: false,
    });
    expect(context.stepIndex).toBe(event.step);
    expect(context.event).toBe(event);
    expect(context.lessonStepId).toBe('compare');
    expect(context.lessonStepTitle).toBe('比较相邻元素');
    expect(context.lessonStepExplanation).toContain('比较左边');
    expect(context.source).toBeUndefined();
  });

  it('omits lesson copy for another algorithm and never invents variables', () => {
    const context = buildMentorContext({
      algorithmId: 'selection-sort',
      lesson,
      event,
      totalEvents: 5,
      locale: 'en',
      traceStale: true,
    });
    expect(context.lessonId).toBeUndefined();
    expect(context.event.variables?.map((variable) => variable.name)).toEqual(['i', 'j']);
    expect(context.traceStale).toBe(true);
  });

  it('only includes source when explicitly supplied and within limits', () => {
    const context = buildMentorContext({
      algorithmId: 'bubble-sort',
      event,
      totalEvents: 5,
      locale: 'en',
      traceStale: false,
      source: 'print("hi")',
    });
    expect(context.source).toBe('print("hi")');

    const huge = buildMentorContext({
      algorithmId: 'bubble-sort',
      event,
      totalEvents: 5,
      locale: 'en',
      traceStale: false,
      source: 'x'.repeat(41_000),
    });
    expect(huge.source).toBeUndefined();
  });

  it('rejects a frame outside the trace', () => {
    expect(() =>
      buildMentorContext({
        algorithmId: 'bubble-sort',
        event,
        totalEvents: 1,
        locale: 'zh',
        traceStale: false,
      }),
    ).toThrow(/outside/);
  });

  it('describes exactly what will be sent', () => {
    const context = buildMentorContext({
      algorithmId: 'bubble-sort',
      lesson,
      event,
      totalEvents: 5,
      locale: 'zh',
      traceStale: true,
      source: 'x = 1',
    });
    const lines = describeMentorContext(context, 'zh');
    expect(lines.join('|')).toContain('真实帧：2/5');
    expect(lines.join('|')).toContain('i, j');
    expect(lines.join('|')).toContain('代码已修改');
  });
});
