import type { CodeLanguage } from '../domain/algorithms/types';
import type { RunMode, TestCaseResult, TraceFrame, VisualRunResult, TestRunResult } from '../domain/trace/types';
import { executeJs } from './js/client';
import { executePython } from './python/pyodide';

export interface ExecutorMessages {
  jsTimeout: string;
  pythonTimeout: string;
}

/**
 * Single dispatch point for the teaching languages. C/C++ were removed from the
 * roadmap, so this only routes JavaScript (Worker) and Python (Pyodide); both
 * run entirely inside the browser — no untrusted code is ever executed in a
 * server process.
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
  }
}

export function isVisualResult(value: VisualRunResult | TestRunResult): value is VisualRunResult {
  return 'frames' in value;
}

export type { TraceFrame, TestCaseResult };
