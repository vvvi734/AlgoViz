import type { CodeLanguage } from '../domain/algorithms/types';
import type { RunMode, TestCaseResult, TraceFrame, VisualRunResult, TestRunResult } from '../domain/trace/types';
import { executeJs } from './js/client';
import { executePython } from './python/pyodide';
import { executeNative } from './native/client';

export interface ExecutorMessages {
  jsTimeout: string;
  pythonTimeout: string;
}

/**
 * Single dispatch point for all teaching languages. Adding a language only
 * requires a new adapter here plus a Trace Event adapter in Issue 05.
 */
export function runForLanguage(
  mode: RunMode,
  code: string,
  input: unknown,
  tests: Array<[unknown, unknown]> | null,
  language: CodeLanguage,
  messages: ExecutorMessages,
): Promise<VisualRunResult | TestRunResult> {
  switch (language) {
    case 'js':
      return executeJs(mode, code, input, tests, messages.jsTimeout);
    case 'python':
      return executePython(mode, code, input, tests, messages.pythonTimeout);
    case 'cpp':
    case 'c':
      return executeNative(mode, code, input, tests, language);
  }
}

export function isVisualResult(value: VisualRunResult | TestRunResult): value is VisualRunResult {
  return 'frames' in value;
}

export type { TraceFrame, TestCaseResult };
