import { describe, expect, it } from 'vitest';
import { framesToTraceDocument } from './adapter';
import { parseTraceDocument, traceEventSchema } from './schema';
import type { RawTraceFrame } from './types';

const legacyEvent = {
  schemaVersion: 1 as const,
  step: 0,
  eventType: 'compare' as const,
  visualType: 'array' as const,
  state: { type: 'array', values: [3, 1] },
  message: '比较 / Compare',
};

describe('Trace ⇄ teaching-step field (Stage 3B, backward compatible)', () => {
  it('validates legacy events that never heard of lessonStepId', () => {
    expect(traceEventSchema.safeParse(legacyEvent).success).toBe(true);
  });

  it('accepts a recorded step id and rejects an empty one', () => {
    expect(traceEventSchema.safeParse({ ...legacyEvent, lessonStepId: 'compare' }).success).toBe(true);
    expect(traceEventSchema.safeParse({ ...legacyEvent, lessonStepId: '' }).success).toBe(false);
  });

  it('passes a real frame id through the adapter verbatim', () => {
    const frames: RawTraceFrame[] = [
      { state: { type: 'array', values: [1, 2] }, message: 'swap', line: 8, lessonStepId: 'swap' },
      { state: { type: 'array', values: [2, 1] }, message: 'legacy frame' },
    ];
    const parsed = parseTraceDocument(framesToTraceDocument(frames, 'arr = list(input)'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.document.events[0].lessonStepId).toBe('swap');
    // The unlinked frame stays unlinked — the adapter must not invent a stage.
    expect(parsed.document.events[1].lessonStepId).toBeUndefined();
  });

  it('does not derive a step from message text or event type', () => {
    // A frame whose message literally says "compare" (the teaching word) must
    // still be unlinked: only the runner may claim a stage.
    const frames: RawTraceFrame[] = [{ state: { type: 'array', values: [] }, message: 'compare' }];
    const parsed = parseTraceDocument(framesToTraceDocument(frames, ''));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.document.events[0].lessonStepId).toBeUndefined();
  });
});
