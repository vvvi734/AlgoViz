import { createTraceCollector } from '../../domain/trace/collector';
import type { RawTraceFrame, RunMode, TestCaseResult } from '../../domain/trace/types';

export interface JsProgramRequest {
  mode: RunMode;
  code: string;
  input: unknown;
  tests: Array<[unknown, unknown]> | null;
}

export type JsProgramResult =
  | { ok: true; mode: 'visual'; frames: RawTraceFrame[] }
  | { ok: true; mode: 'test'; result: TestCaseResult[] }
  | { ok: false; error: string };

/**
 * Same semantics as the legacy Worker body, extracted so it can run inside a
 * Worker (browser) or directly (Vitest regression tests) with identical output.
 * NOTE: `new Function` is only ever evaluated inside a sandboxed Worker in the
 * browser; see src/runtime/js/client.ts.
 */
export function runJsProgram({ mode, code, input, tests }: JsProgramRequest): JsProgramResult {
  try {
    if (mode === 'visual') {
      const { frames, trace } = createTraceCollector();
      new Function('input', 'trace', '"use strict";\n' + code)(input, trace);
      return { ok: true, mode: 'visual', frames };
    }
    const solve = new Function('"use strict";\n' + code + '\nreturn typeof solve === "function" ? solve : null;')() as
      | ((arg: unknown) => unknown)
      | null;
    if (!solve) throw new Error('Define function solve(input)');
    const result = (tests ?? []).map(([arg, expected]): TestCaseResult => {
      try {
        const actual = solve(arg);
        return { pass: JSON.stringify(actual) === JSON.stringify(expected), actual, expected };
      } catch (error) {
        return { pass: false, actual: 'Error: ' + (error as Error).message, expected };
      }
    });
    return { ok: true, mode: 'test', result };
  } catch (error) {
    return { ok: false, error: String((error as Error)?.message ?? error) };
  }
}
