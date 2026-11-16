import { describe, expect, it } from 'vitest';
import { framesToTraceDocument, inferEventType, inferVisualType } from './adapter';
import { parseTraceDocument } from './schema';
import type { RawTraceFrame } from './types';

describe('legacy frame → Trace Event adapter', () => {
  it('normalises legacy frames into validated events without fabricating data', () => {
    const frames: RawTraceFrame[] = [
      { state: { type: 'array', values: [3, 1, 2], focus: [0] }, message: 'start' },
      { state: { type: 'array', values: [1, 2, 3], done: true }, message: 'done' },
    ];
    const document = framesToTraceDocument(frames, 'const a = [...input];');
    const parsed = parseTraceDocument(document);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const [first, last] = parsed.document.events;
    expect(first.visualType).toBe('array');
    expect(first.eventType).toBe('step');
    expect(first.sourceLocation).toBeUndefined();
    expect(first.variables).toBeUndefined();
    expect(first.callStack).toBeUndefined();
    expect(last.eventType).toBe('done');
    expect(parsed.document.source).toContain('const a');
  });

  it('preserves Python line / variables metadata through the pipeline', () => {
    const frames: RawTraceFrame[] = [
      {
        state: { type: 'array', values: [3, 1, 2], focus: [0] },
        message: 'swap',
        line: 8,
        variables: [
          { name: 'i', type: 'int', value: 0 },
          { name: 'arr', type: 'list', value: [3, 1, 2] },
        ],
      },
    ];
    const parsed = parseTraceDocument(framesToTraceDocument(frames));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const evt = parsed.document.events[0];
    expect(evt.sourceLocation).toEqual({ line: 8 });
    expect(evt.variables).toEqual([
      { name: 'i', type: 'int', value: 0 },
      { name: 'arr', type: 'list', value: [3, 1, 2] },
    ]);
  });

  it('drops non-integer line numbers instead of emitting a bogus location', () => {
    const frames: RawTraceFrame[] = [
      { state: { type: 'array', values: [1] }, message: 'x', line: 2.7 },
      { state: { type: 'array', values: [1] }, message: 'y', line: -1 },
    ];
    const parsed = parseTraceDocument(framesToTraceDocument(frames));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.document.events[0].sourceLocation).toBeUndefined();
    expect(parsed.document.events[1].sourceLocation).toBeUndefined();
  });

  it('maps unknown state types to a safe visual type while keeping the raw state', () => {
    expect(inferVisualType({ type: 'matrix' })).toBe('array');
    expect(inferVisualType({ type: 'array' })).toBe('array');
    expect(inferVisualType({ type: 'graph' })).toBe('graph');
    expect(inferEventType({ type: 'array', done: true })).toBe('done');
    expect(inferEventType({ type: 'array' })).toBe('step');
  });

  it('maps a raw call stack into validated call frames', () => {
    const frames: RawTraceFrame[] = [
      {
        state: { type: 'stack', values: ['factorial', 'factorial'] },
        message: 'return',
        line: 6,
        callStack: [
          {
            name: 'factorial', frameId: 'f1', depth: 0, status: 'running',
            arguments: [{ name: 'n', type: 'int', value: 4 }],
            locals: [{ name: 'n', type: 'int', value: 4 }],
          },
          {
            name: 'factorial', frameId: 'f2', depth: 1, status: 'returning', returnValue: 2,
            locals: [{ name: 'n', type: 'int', value: 2 }],
          },
        ],
      },
    ];
    const parsed = parseTraceDocument(framesToTraceDocument(frames));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const stack = parsed.document.events[0].callStack!;
    expect(stack[0].frameId).toBe('f1');
    expect(stack[0].arguments![0]).toEqual({ name: 'n', type: 'int', value: 4 });
    expect(stack[1].status).toBe('returning');
    expect(stack[1].returnValue).toBe(2);
  });

  it('omits callStack entirely when a frame carries none (legacy algorithms)', () => {
    const frames: RawTraceFrame[] = [{ state: { type: 'array', values: [1] }, message: 'x' }];
    const parsed = parseTraceDocument(framesToTraceDocument(frames));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.document.events[0].callStack).toBeUndefined();
  });

  it('caps messages to the schema limit', () => {
    const frames: RawTraceFrame[] = [{ state: { type: 'array', values: [] }, message: 'x'.repeat(500) }];
    const parsed = parseTraceDocument(framesToTraceDocument(frames));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.document.events[0].message).toHaveLength(240);
  });
});
