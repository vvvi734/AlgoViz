import { describe, expect, it } from 'vitest';
import { LIMITS, parseTraceDocument, TRACE_SCHEMA_VERSION, type TraceEvent } from './schema';

function event(overrides: Partial<TraceEvent> = {}): TraceEvent {
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    step: 0,
    eventType: 'step',
    visualType: 'array',
    state: { type: 'array', values: [3, 1, 2], focus: [0] },
    message: 'compare',
    ...overrides,
  };
}

function doc(events: unknown[], source = 'code'): unknown {
  return { schemaVersion: TRACE_SCHEMA_VERSION, source, events };
}

describe('Trace Event Schema v1', () => {
  it('accepts a valid document', () => {
    const result = parseTraceDocument(doc([event()]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.events).toHaveLength(1);
    expect(result.document.events[0].visualType).toBe('array');
  });

  it('accepts a Python-style event with source location and variables', () => {
    const result = parseTraceDocument(doc([event({
      eventType: 'swap',
      sourceLocation: { line: 8 },
      variables: [
        { name: 'i', type: 'int', value: 1 },
        { name: 'arr', type: 'list', value: [1, 2, 3] },
        { name: 'done', type: 'bool', value: true },
      ],
    })]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.events[0].sourceLocation).toEqual({ line: 8 });
    expect(result.document.events[0].variables).toHaveLength(3);
  });

  it('rejects missing required fields', () => {
    const { schemaVersion, ...rest } = event();
    expect(parseTraceDocument(doc([rest])).ok).toBe(false);
    const { step, ...noStep } = event();
    expect(parseTraceDocument(doc([noStep])).ok).toBe(false);
    const { message, ...noMessage } = event();
    expect(parseTraceDocument(doc([noMessage])).ok).toBe(false);
  });

  it('rejects wrong field types', () => {
    expect(parseTraceDocument(doc([event({ step: 'zero' as unknown as number })])).ok).toBe(false);
    expect(parseTraceDocument(doc([event({ message: 42 as unknown as string })])).ok).toBe(false);
    expect(parseTraceDocument(doc([event({ visualType: 'matrix' as TraceEvent['visualType'] })])).ok).toBe(false);
  });

  it('rejects an unsupported schemaVersion', () => {
    expect(parseTraceDocument({ schemaVersion: 2, source: 'c', events: [event()] }).ok).toBe(false);
    expect(parseTraceDocument({ schemaVersion: '1', source: 'c', events: [event()] }).ok).toBe(false);
  });

  it('rejects illegal step numbers', () => {
    expect(parseTraceDocument(doc([event({ step: -1 })])).ok).toBe(false);
    expect(parseTraceDocument(doc([event({ step: 1.5 })])).ok).toBe(false);
  });

  it('rejects empty and over-limit event streams', () => {
    expect(parseTraceDocument({ schemaVersion: 1, source: 'c', events: [] }).ok).toBe(false);
    const tooMany = Array.from({ length: LIMITS.MAX_EVENTS + 1 }, (_, i) => event({ step: i }));
    expect(parseTraceDocument(doc(tooMany)).ok).toBe(false);
  });

  it('rejects oversized variable values and states', () => {
    const bigVar = event({ variables: [{ name: 'x', type: 'str', value: 'x'.repeat(3000) }] });
    expect(parseTraceDocument(doc([bigVar])).ok).toBe(false);
    const bigState = event({ state: { type: 'array', values: 'x'.repeat(10000) } });
    expect(parseTraceDocument(doc([bigState])).ok).toBe(false);
  });

  it('rejects non-serialisable values (NaN, undefined, functions)', () => {
    expect(parseTraceDocument(doc([event({ state: { type: 'array', values: [NaN] } })])).ok).toBe(false);
    expect(parseTraceDocument(doc([event({ state: { type: 'array', bad: undefined } as unknown as TraceEvent['state'] })])).ok).toBe(false);
    expect(parseTraceDocument(doc([event({ state: { type: 'array', fn: () => 1 } as unknown as TraceEvent['state'] })])).ok).toBe(false);
  });

  it('rejects invalid call stack frames', () => {
    expect(parseTraceDocument(doc([event({ callStack: [{ name: '', line: 1 }] })])).ok).toBe(false);
    expect(parseTraceDocument(doc([event({ callStack: [{ name: 'dfs', line: 0 }] })])).ok).toBe(false);
    expect(parseTraceDocument(doc([event({ callStack: [{ name: 'dfs', line: 1 }] })])).ok).toBe(true);
  });
});
