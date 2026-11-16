/**
 * LEGACY trace shape, kept verbatim for the v0.2 refactor regression baseline.
 *
 * Runners still emit this loose shape; `src/domain/trace/adapter.ts` normalises
 * it into the unified, validated Trace Event Schema (`schema.ts`). Python adds
 * the optional `line` / `variables` metadata below; JS keeps emitting the bare
 * `{state,message}` form.
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

/** A variable snapshot attached to a Python trace step (before validation). */
export interface RawVariableSnapshot {
  name: string;
  type: string;
  value: unknown;
  scope?: string;
}

/** Frame produced by the Python runner: legacy fields + optional source metadata. */
export interface RawTraceFrame extends TraceFrame {
  line?: number;
  column?: number;
  variables?: RawVariableSnapshot[];
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
  frames: RawTraceFrame[];
}

export interface TestRunResult {
  result: TestCaseResult[];
}

export function isTraceFrame(value: unknown): value is TraceFrame {
  if (!value || typeof value !== 'object') return false;
  const frame = value as Partial<TraceFrame>;
  return !!frame.state && typeof frame.state === 'object' && typeof frame.message === 'string';
}
