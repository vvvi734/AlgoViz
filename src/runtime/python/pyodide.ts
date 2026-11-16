import type { RunMode, RawTraceFrame, TestCaseResult, VisualRunResult, TestRunResult } from '../../domain/trace/types';
import { ExecutionError, type ExecutionDiagnostic } from '../../domain/trace/diagnostic';

/** Pyodide is loaded on demand from a CDN; nothing is bundled into the app. */
export const PYODIDE_VERSION = '0.27.7';
export const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`;
export const PYODIDE_TIMEOUT_MS = 30000;
/** CDN download + interpreter boot gets its own budget; user code keeps 30 s. */
export const PYODIDE_INIT_TIMEOUT_MS = 120000;

/**
 * Python-side snapshot helper: deep-copies JSON-compatible values and converts
 * anything non-serialisable (sets, custom objects, …) to a string, so a later
 * mutation of the original list can never corrupt an already-recorded frame.
 */
export const PYTHON_SNAPSHOT_HELPER = [
  'def _snapshot(value):',
  '    if isinstance(value, bool):',
  '        return value',
  '    if isinstance(value, list) or isinstance(value, tuple):',
  '        return [_snapshot(item) for item in value]',
  '    if isinstance(value, dict):',
  '        return {str(k): _snapshot(v) for k, v in value.items()}',
  '    if isinstance(value, (int, float)) or value is None or isinstance(value, str):',
  '        return value',
  '    return str(value)',
].join('\n');

/**
 * Recursion / call-stack tracing helpers. `@tracked` instruments a Python
 * function so its entry, return value and the current stack are captured as
 * real trace events; `stack_state()` is a convenience for emitting a stack of
 * function names as the visual `state`. Frames are kept as JSON snapshots (via
 * `_snapshot`) so a later mutation can never pollute an earlier event.
 *
 * Frame identity: `_FRAME_SEQ` hands out monotonically increasing `fN` ids, so
 * the same function called at different recursion depths is always a distinct
 * frame. `sys._getframe` is only read transiently inside `trace()` — the frame
 * object is never stored, avoiding reference cycles / leaks.
 */
export const PYTHON_RECURSION_HELPER = [
  '_CALL_STACK = []',
  '_FRAME_SEQ = [0]',
  "_EXCLUDED_LOCAL_TYPES = ('module', 'function', 'type', 'method', 'builtin_function_or_method', 'classmethod', 'staticmethod')",
  'def _snapshot_variables(variables, scope=None):',
  '    items = []',
  '    for k, v in (variables or {}).items():',
  '        name = str(k)',
  "        if name.startswith('_'):",
  '            continue',
  "        item = {'name': name, 'type': type(v).__name__, 'value': _snapshot(v)}",
  '        if scope:',
  "            item['scope'] = str(scope)",
  '        items.append(item)',
  '    return items',
  'def _filter_locals(locals_dict):',
  '    out = {}',
  '    for k, v in (locals_dict or {}).items():',
  '        name = str(k)',
  "        if name.startswith('_'):",
  '            continue',
  '        if type(v).__name__ in _EXCLUDED_LOCAL_TYPES:',
  '            continue',
  '        try:',
  '            json.dumps(_snapshot(v))',
  '        except Exception:',
  '            continue',
  '        out[name] = v',
  '    return out',
  'def _call_stack_snapshot():',
  '    return [_snapshot(f) for f in _CALL_STACK]',
  'def _stack_names():',
  "    return [_snapshot(f['name']) for f in _CALL_STACK]",
  'def stack_state():',
  "    return {'type': 'stack', 'values': _stack_names()}",
  'def _fmt_args(arg_dict):',
  "    return ', '.join(str(k) + '=' + repr(_snapshot(v)) for k, v in arg_dict.items())",
  'def _post_frame(frame):',
  "    postFrame(json.dumps(frame, ensure_ascii=False))",
  'def _emit_call(fn_name, frame, arg_dict, call_line, lesson_step=None):',
  "    payload = {'state': stack_state(), 'message': '调用 / call ' + fn_name + '(' + _fmt_args(arg_dict) + ')', 'line': call_line, 'variables': frame['arguments'], 'callStack': _call_stack_snapshot()}",
  '    if lesson_step:',
  "        payload['lessonStepId'] = str(lesson_step)",
  '    _post_frame(payload)',
  'def _emit_return(fn_name, frame, retval, ret_line, lesson_step=None):',
  "    frame['status'] = 'returning'",
  "    frame['returnValue'] = _snapshot(retval)",
  "    payload = {'state': stack_state(), 'message': '返回 / return ' + fn_name + ' = ' + repr(_snapshot(retval)), 'line': ret_line, 'variables': _snapshot_variables({'return': retval}), 'callStack': _call_stack_snapshot()}",
  '    if lesson_step:',
  "        payload['lessonStepId'] = str(lesson_step)",
  '    _post_frame(payload)',
  'def tracked(fn=None, *, call_step=None, return_step=None):',
  '    def decorate(target):',
  '        def wrapper(*args, **kwargs):',
  '            _FRAME_SEQ[0] += 1',
  "            fid = 'f' + str(_FRAME_SEQ[0])",
  '            arg_names = target.__code__.co_varnames[:len(args)]',
  '            arg_dict = dict(zip(arg_names, args))',
  '            arg_dict.update(kwargs)',
  "            frame = {'frameId': fid, 'name': target.__name__, 'depth': len(_CALL_STACK), 'arguments': _snapshot_variables(arg_dict), 'locals': _snapshot_variables(arg_dict), 'status': 'running'}",
  '            _CALL_STACK.append(frame)',
  '            _emit_call(target.__name__, frame, arg_dict, target.__code__.co_firstlineno, call_step)',
  '            try:',
  '                result = target(*args, **kwargs)',
  '            except BaseException:',
  '                _CALL_STACK.pop()',
  '                raise',
  "            ret_line = frame.get('line', target.__code__.co_firstlineno)",
  '            _emit_return(target.__name__, frame, result, ret_line, return_step)',
  '            _CALL_STACK.pop()',
  '            return result',
  '        wrapper.__name__ = target.__name__',
  '        return wrapper',
  '    if fn is None:',
  '        return decorate',
  '    return decorate(fn)',
].join('\n');

/**
 * Backwards-compatible trace(): `trace(state, message)` still works; new calls
 * may pass `line` and a `variables` dict whose values are snapshotted at call
 * time. Line numbers are recorded explicitly — nothing is guessed.
 *
 * When called inside a `@tracked` function it also (a) auto-captures the
 * caller's local variables from the real runtime frame, (b) updates that call
 * frame's `locals`, and (c) attaches a full `callStack` snapshot to the event.
 * Outside any tracked frame it falls back to the legacy explicit-variables path.
 *
 * Stage 3B: `lesson_step=` records which teaching stage this frame belongs to
 * (e.g. `compare`). It is optional and purely additive — an author writes it
 * where the pedagogy is known; nothing is ever inferred from the message text.
 */
export const PYTHON_TRACE_HELPER = [
  "def trace(state, message='', line=None, variables=None, lesson_step=None, structure=None):",
  "    frame = {'state': _snapshot(state), 'message': str(message)}",
  '    if line is not None:',
  "        frame['line'] = int(line)",
  '    explicit = variables or {}',
  '    if _CALL_STACK:',
  '        try:',
  '            caller = sys._getframe(1)',
  '            auto = _filter_locals(caller.f_locals)',
  '        except Exception:',
  '            auto = {}',
  '        merged = dict(auto)',
  '        for k, v in explicit.items():',
  '            merged[str(k)] = v',
  '        vars_out = _snapshot_variables(merged)',
  "        _CALL_STACK[-1]['locals'] = vars_out",
  '        if line is not None:',
  "            _CALL_STACK[-1]['line'] = int(line)",
  "        frame['variables'] = vars_out",
  "        frame['callStack'] = _call_stack_snapshot()",
  '    elif explicit:',
  "        frame['variables'] = _snapshot_variables(explicit)",
  '    if lesson_step is not None:',
  "        frame['lessonStepId'] = str(lesson_step)",
  '    if structure is not None:',
  "        frame['structure'] = _snapshot(structure)",
  "    postFrame(json.dumps(frame, ensure_ascii=False))",
].join('\n');

/**
 * The visual runner wraps the user code so a failure can be turned into a
 * structured diagnostic (type / category / line / column) instead of an opaque
 * string. `compile(..., '<algo>', ...)` gives user frames a stable filename so
 * the line number maps back to the exact user-source line Monaco renders.
 */
export const PYTHON_VISUAL_BOOTSTRAP = [
  'import json, sys, traceback',
  'from js import postFrame, postDiagnostic',
  'input = json.loads(input_json)',
  PYTHON_SNAPSHOT_HELPER,
  PYTHON_RECURSION_HELPER,
  PYTHON_TRACE_HELPER,
  "USER_FILENAME = '<algo>'",
  'def _post_diagnostic(category, error_type, message, line=None, column=None, tb_text=""):',
  "    payload = {'severity': 'error', 'category': category, 'message': str(message), 'errorType': str(error_type)}",
  '    if line is not None:',
  "        payload['line'] = int(line)",
  '    if column is not None:',
  "        payload['column'] = int(column)",
  '    if tb_text:',
  "        payload['traceback'] = str(tb_text)",
  "    postDiagnostic(json.dumps(payload, ensure_ascii=False))",
  'try:',
  "    exec(compile(user_code, USER_FILENAME, 'exec'), {'input': input, 'trace': trace, 'tracked': tracked, 'stack_state': stack_state})",
  'except SyntaxError as err:',
  "    _post_diagnostic('syntax', type(err).__name__, err.msg or str(err), getattr(err, 'lineno', None), getattr(err, 'offset', None), traceback.format_exc())",
  'except BaseException as err:',
  '    tb = traceback.extract_tb(sys.exc_info()[2])',
  '    frames = [f for f in tb if f.filename == USER_FILENAME]',
  '    line = frames[-1].lineno if frames else None',
  "    _post_diagnostic('runtime', type(err).__name__, str(err), line, None, traceback.format_exc())",
].join('\n');

const PYTHON_TEST_BOOTSTRAP = [
  'import json',
  'ns = {}',
  'exec(user_code, ns)',
  "assert callable(ns.get('solve')), 'Define solve(input)'",
  'results = []',
  'for arg, expected in json.loads(tests_json):',
  '    try:',
  "        actual = ns['solve'](arg)",
  "        results.append({'pass': actual == expected, 'actual': actual, 'expected': expected})",
  '    except Exception as err:',
  "        results.append({'pass': False, 'actual': str(err), 'expected': expected})",
  'json.dumps(results, ensure_ascii=False)',
].join('\n');

interface WorkerReply {
  type?: 'ready';
  ok?: boolean;
  frames?: RawTraceFrame[];
  result?: TestCaseResult[];
  error?: string;
  diagnostic?: ExecutionDiagnostic;
}

export function buildWorkerSource(): string {
  // A classic worker (not a module worker) because Pyodide's loader uses
  // importScripts. Python snippets are injected as JSON strings so no nested
  // template-literal escaping is needed.
  return [
    `importScripts(${JSON.stringify(PYODIDE_CDN)});`,
    'let runtime;',
    'self.onmessage = async ({ data }) => {',
    '  try {',
    "    if (data.type === 'init') {",
    '      runtime = runtime || await loadPyodide();',
    "      self.postMessage({ type: 'ready' });",
    '      return;',
    '    }',
    '    runtime = runtime || await loadPyodide();',
    '    const frames = [];',
    '    let diagnostic = null;',
    '    self.postFrame = (raw) => {',
    "      if (frames.length >= 500) throw Error('Too many steps');",
    '      frames.push(JSON.parse(raw));',
    '    };',
    '    self.postDiagnostic = (raw) => {',
    '      diagnostic = JSON.parse(raw);',
    '    };',
    "    runtime.globals.set('input_json', JSON.stringify(data.input));",
    "    runtime.globals.set('user_code', data.code);",
    "    runtime.globals.set('tests_json', JSON.stringify(data.tests || []));",
    "    if (data.mode === 'visual') {",
    `      await runtime.runPythonAsync(${JSON.stringify(PYTHON_VISUAL_BOOTSTRAP)});`,
    "      if (diagnostic) {",
    "        self.postMessage({ ok: false, error: diagnostic.message || 'Python error', diagnostic });",
    '      } else {',
    '        self.postMessage({ ok: true, frames });',
    '      }',
    '    } else {',
    `      const result = await runtime.runPythonAsync(${JSON.stringify(PYTHON_TEST_BOOTSTRAP)});`,
    '      self.postMessage({ ok: true, result: JSON.parse(result) });',
    '    }',
    '  } catch (err) {',
    '    self.postMessage({ ok: false, error: String(err) });',
    '  }',
    '};',
  ].join('\n');
}

export function executePython(
  mode: RunMode,
  code: string,
  input: unknown,
  tests: Array<[unknown, unknown]> | null,
  timeoutMessage: string,
): Promise<VisualRunResult | TestRunResult> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buildWorkerSource()], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    let ended = false;
    const cleanup = () => {
      if (ended) return;
      ended = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
    };
    let timer = setTimeout(() => {
      cleanup();
      reject(new ExecutionError(timeoutMessage));
    }, PYODIDE_INIT_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const data = event.data;
      if (data.type === 'ready') {
        if (ended) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          cleanup();
          reject(new ExecutionError(timeoutMessage));
        }, PYODIDE_TIMEOUT_MS);
        worker.postMessage({ type: 'run', mode, code, input, tests });
        return;
      }
      cleanup();
      if (!data.ok) {
        return reject(new ExecutionError(data.error || 'Pyodide error', data.diagnostic));
      }
      if (mode === 'visual') {
        if (!Array.isArray(data.frames)) return reject(new ExecutionError('Expected frames[]'));
        return resolve({ frames: data.frames });
      }
      if (!Array.isArray(data.result)) return reject(new ExecutionError('Expected result[]'));
      resolve({ result: data.result });
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new ExecutionError(event.message || 'Pyodide worker error'));
    };
    worker.postMessage({ type: 'init' });
  });
}
