import { describe, expect, it } from 'vitest';
import { PYTHON_TRACE_HELPER, PYTHON_VISUAL_BOOTSTRAP } from './pyodide';
import { framesToTraceDocument } from '../../domain/trace/adapter';
import { parseTraceDocument } from '../../domain/trace/schema';
import type { RawTraceFrame } from '../../domain/trace/types';

describe('Python trace() runtime contract', () => {
  it('keeps the legacy two-argument call working', () => {
    // The signature must default message/line/variables so `trace(state)` and
    // `trace(state, message)` from the old presets keep running unchanged.
    expect(PYTHON_TRACE_HELPER).toContain("def trace(state, message='', line=None, variables=None)");
    expect(PYTHON_TRACE_HELPER).toContain("frame = {'state': _snapshot(state), 'message': str(message)}");
  });

  it('records optional line and variables metadata', () => {
    expect(PYTHON_TRACE_HELPER).toContain("frame['line'] = int(line)");
    expect(PYTHON_TRACE_HELPER).toContain("frame['variables'] = _snapshot_variables(variables)");
  });

  it('deep-copies values so mutable lists cannot pollute earlier frames', () => {
    expect(PYTHON_TRACE_HELPER).toContain('def _snapshot(value)');
    expect(PYTHON_TRACE_HELPER).toContain('return [_snapshot(item) for item in value]');
    expect(PYTHON_TRACE_HELPER).toContain('return str(value)');
  });

  it('injects input and trace into the user namespace', () => {
    expect(PYTHON_VISUAL_BOOTSTRAP).toContain('exec(user_code, {"input": input, "trace": trace})');
  });

  it('turns Python-emitted frames into validated events with line + variables', () => {
    // Mimics exactly what the Python worker posts after
    // trace(..., line=8, variables={'i': i, 'arr': arr.copy()}).
    const frames: RawTraceFrame[] = [
      {
        state: { type: 'array', values: [2, 1], focus: [0, 1] },
        message: 'swap',
        line: 8,
        variables: [
          { name: 'i', type: 'int', value: 0 },
          { name: 'arr', type: 'list', value: [2, 1] },
        ],
      },
    ];
    const parsed = parseTraceDocument(framesToTraceDocument(frames, 'arr = list(input)'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.document.events[0].sourceLocation?.line).toBe(8);
    expect(parsed.document.events[0].variables?.[0].name).toBe('i');
  });
});
