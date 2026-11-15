/**
 * LEGACY trace shape, kept verbatim for the v0.2 refactor regression baseline.
 *
 * This is NOT the unified Trace Event Schema required by the roadmap:
 * Issue 05 introduces a versioned, validated event protocol shared by
 * JS / Python / C / C++ adapters. Until then, all runners emit this shape.
 */
export interface TraceState {
  type: string;
  values?: unknown[];
  focus?: Array<number | string>;
  visited?: Array<number | string>;
  range?: [number, number];
  done?: boolean;
  [key: string]: unknown;
}

export interface TraceFrame {
  state: TraceState;
  message: string;
}

export const MAX_FRAMES = 500;
export const MESSAGE_LIMIT = 240;

export interface TestCaseResult {
  pass: boolean;
  actual: unknown;
  expected: unknown;
}

export type RunMode = 'visual' | 'test';

export interface RunRequest {
  mode: RunMode;
  code: string;
  input: unknown;
  tests: Array<[unknown, unknown]> | null;
  language: string;
}

export interface VisualRunResult {
  frames: TraceFrame[];
}

export interface TestRunResult {
  result: TestCaseResult[];
}

export function isTraceFrame(value: unknown): value is TraceFrame {
  if (!value || typeof value !== 'object') return false;
  const frame = value as Partial<TraceFrame>;
  return !!frame.state && typeof frame.state === 'object' && typeof frame.message === 'string';
}
