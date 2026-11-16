import { describe, expect, it } from 'vitest';
import { PYTHON_RECURSION_HELPER, PYTHON_SNAPSHOT_HELPER, PYTHON_TRACE_HELPER, PYTHON_VISUAL_BOOTSTRAP } from './pyodide';
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
    expect(PYTHON_TRACE_HELPER).toContain("frame['variables'] = _snapshot_variables(explicit)");
  });

  it('deep-copies values so mutable lists cannot pollute earlier frames', () => {
    expect(PYTHON_SNAPSHOT_HELPER).toContain('def _snapshot(value)');
    expect(PYTHON_SNAPSHOT_HELPER).toContain('return [_snapshot(item) for item in value]');
    expect(PYTHON_SNAPSHOT_HELPER).toContain('return str(value)');
  });

  it('injects input, trace, tracked and stack_state into the user namespace', () => {
    expect(PYTHON_VISUAL_BOOTSTRAP).toContain(
      "exec(compile(user_code, USER_FILENAME, 'exec'), {'input': input, 'trace': trace, 'tracked': tracked, 'stack_state': stack_state})",
    );
  });

  it('wraps user code so failures become structured diagnostics', () => {
    expect(PYTHON_VISUAL_BOOTSTRAP).toContain('except SyntaxError as err');
    expect(PYTHON_VISUAL_BOOTSTRAP).toContain('except BaseException as err');
    expect(PYTHON_VISUAL_BOOTSTRAP).toContain('def _post_diagnostic(');
    expect(PYTHON_VISUAL_BOOTSTRAP).toContain("payload['line'] = int(line)");
    expect(PYTHON_VISUAL_BOOTSTRAP).toContain('postDiagnostic(json.dumps(payload, ensure_ascii=False))');
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

describe('Python recursion tracer contract (Stage 3)', () => {
  it('ships a tracked decorator that hands out distinct frame ids and emits call/return events', () => {
    expect(PYTHON_RECURSION_HELPER).toContain('def tracked(fn)');
    expect(PYTHON_RECURSION_HELPER).toContain("_FRAME_SEQ[0] += 1");
    expect(PYTHON_RECURSION_HELPER).toContain("fid = 'f' + str(_FRAME_SEQ[0])");
    expect(PYTHON_RECURSION_HELPER).toContain("_emit_call(fn.__name__, frame, arg_dict, fn.__code__.co_firstlineno)");
    expect(PYTHON_RECURSION_HELPER).toContain("frame['returnValue'] = _snapshot(retval)");
    expect(PYTHON_RECURSION_HELPER).toContain("frame['status'] = 'returning'");
  });

  it('captures the caller frame id / depth into the frame and cleans up on exception', () => {
    expect(PYTHON_RECURSION_HELPER).toContain("'depth': len(_CALL_STACK)");
    expect(PYTHON_RECURSION_HELPER).toContain('_CALL_STACK.append(frame)');
    expect(PYTHON_RECURSION_HELPER).toContain('_CALL_STACK.pop()');
  });

  it('attaches a full call-stack snapshot and auto-captured locals inside trace()', () => {
    expect(PYTHON_TRACE_HELPER).toContain('caller = sys._getframe(1)');
    expect(PYTHON_TRACE_HELPER).toContain("frame['callStack'] = _call_stack_snapshot()");
    expect(PYTHON_TRACE_HELPER).toContain("_CALL_STACK[-1]['locals'] = vars_out");
    // Outside a tracked frame, legacy explicit-variable behaviour is preserved.
    expect(PYTHON_TRACE_HELPER).toContain("elif explicit:");
  });

  it('filters out non-serialisable / callable locals so frames stay JSON-safe', () => {
    expect(PYTHON_RECURSION_HELPER).toContain('_EXCLUDED_LOCAL_TYPES');
    expect(PYTHON_RECURSION_HELPER).toContain('json.dumps(_snapshot(v))');
  });
});
