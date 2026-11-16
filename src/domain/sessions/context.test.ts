import { describe, expect, it } from 'vitest';
import type { TraceEvent } from '../trace/schema';
import { bubbleSortLesson } from '../lessons/bubbleSort';
import { buildLearningContext, parseLearningContext, serializeLearningContext } from './context';

const event = (step: number, lessonStepId?: string, extra: Partial<TraceEvent> = {}): TraceEvent => ({
  schemaVersion: 1,
  step,
  eventType: 'step',
  visualType: 'array',
  state: { type: 'array', values: [3, 1, 2], focus: [0, 1] },
  message: `FRAME ${step}`,
  sourceLocation: { line: 8 },
  variables: [
    { name: 'i', type: 'int', value: 0 },
    { name: 'arr', type: 'list', value: [3, 1, 2] },
  ],
  ...(lessonStepId ? { lessonStepId } : {}),
  ...extra,
});

const build = (overrides: Partial<Parameters<typeof buildLearningContext>[0]> = {}) =>
  buildLearningContext({
    locale: 'zh',
    algorithmId: 'bubble',
    lessonId: bubbleSortLesson.lessonId,
    lesson: bubbleSortLesson,
    event: event(3, 'compare'),
    stepIndex: 3,
    totalEvents: 12,
    exportedAt: '2026-11-16T04:05:06.000Z',
    ...overrides,
  });

describe('learning context (.algocontext.json)', () => {
  it('exports the real frame together with the matched teaching stage', () => {
    const result = build();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.stepIndex).toBe(3);
    expect(result.value.event.step).toBe(3);
    expect(result.value.lessonStepId).toBe('compare');
    expect(result.value.lessonStep?.title.zh).toContain('比较');
    expect(result.value.source).toBeUndefined();

    const reparsed = parseLearningContext(serializeLearningContext(result.value));
    expect(reparsed.ok).toBe(true);
    if (reparsed.ok) expect(reparsed.value).toEqual(result.value);
  });

  it('omits the course copy when the frame carries no teaching stage', () => {
    const result = build({ event: event(1), stepIndex: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.lessonStepId).toBeUndefined();
      expect(result.value.lessonStep).toBeUndefined();
    }
  });

  it('refuses a step index that disagrees with the embedded frame', () => {
    const result = build({ stepIndex: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0].code).toBe('context-invalid');
  });

    it('refuses a frame the trace schema rejects', () => {
    const broken = { ...event(3, 'compare'), schemaVersion: 2 } as unknown as TraceEvent;
    const result = build({ event: broken });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0].code).toBe('context-invalid');
  });

  it('includes the source only when asked', () => {
    const withSource = build({ source: 'arr = [3, 1, 2]\n' });
    expect(withSource.ok).toBe(true);
    if (withSource.ok) expect(withSource.value.source).toBe('arr = [3, 1, 2]\n');
    const tooLong = build({ source: 'x'.repeat(40_001) });
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) expect(tooLong.errors[0].code).toBe('source-too-large');
  });

  it('rejects tampered files: wrong index, wrong version, oversized payload', () => {
    const good = build();
    expect(good.ok).toBe(true);
    if (!good.ok) return;

    const tampered = parseLearningContext(JSON.stringify({ ...good.value, stepIndex: 9 }));
    expect(tampered.ok).toBe(false);
    if (!tampered.ok) expect(tampered.errors[0].code).toBe('context-invalid');

    const wrongVersion = parseLearningContext(JSON.stringify({ ...good.value, contextFormatVersion: 2 }));
    expect(wrongVersion.ok).toBe(false);
    if (!wrongVersion.ok) expect(wrongVersion.errors[0].code).toBe('context-format-version');

    const oversized = parseLearningContext(JSON.stringify({ ...good.value, padding: 'x'.repeat(200_000) }));
    expect(oversized.ok).toBe(false);
    if (!oversized.ok) expect(oversized.errors[0].code).toBe('context-too-large');

    const broken = parseLearningContext('nope');
    expect(broken.ok).toBe(false);
    if (!broken.ok) expect(broken.errors[0].code).toBe('context-json');
  });
});
