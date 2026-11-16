import type { RunMode, RawTraceFrame, TestCaseResult, VisualRunResult, TestRunResult } from '../../domain/trace/types';
import { ExecutionError, type ExecutionDiagnostic } from '../../domain/trace/diagnostic';

/** Pyodide is loaded on demand from a CDN; nothing is bundled into the app. */
export const PYODIDE_VERSION = '0.27.7';
export const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`;
export const PYODIDE_TIMEOUT_MS = 30000;

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
 * Backwards-compatible trace(): `trace(state, message)` still works; new calls
 * may pass `line` and a `variables` dict whose values are snapshotted at call
 * time. Line numbers are recorded explicitly — nothing is guessed.
 */
export const PYTHON_TRACE_HELPER = [
  PYTHON_SNAPSHOT_HELPER,
  'def _snapshot_variables(variables):',
  "    return [{'name': str(k), 'type': type(v).__name__, 'value': _snapshot(v)} for k, v in (variables or {}).items()]",
  "def trace(state, message='', line=None, variables=None):",
  "    frame = {'state': _snapshot(state), 'message': str(message)}",
  '    if line is not None:',
  "        frame['line'] = int(line)",
  '    if variables:',
  "        frame['variables'] = _snapshot_variables(variables)",
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
  "    exec(compile(user_code, USER_FILENAME, 'exec'), {'input': input, 'trace': trace})",
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
  ok: boolean;
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
    const timer = setTimeout(() => {
      cleanup();
      reject(new ExecutionError(timeoutMessage));
    }, PYODIDE_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      cleanup();
      const data = event.data;
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
    worker.postMessage({ mode, code, input, tests });
  });
}
