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

/**
 * Loose call-frame shape emitted by the Python recursion tracer (before the
 * adapter normalises it into the validated `CallFrame`). Mirrors the schema
 * fields but keeps `unknown` values until the adapter validates them.
 */
export interface RawCallFrame {
  name?: string;
  frameId?: string;
  line?: number;
  depth?: number;
  arguments?: RawVariableSnapshot[];
  locals?: RawVariableSnapshot[];
  returnValue?: unknown;
  status?: string;
}

/** Frame produced by the Python runner: legacy fields + optional source metadata. */
export interface RawTraceFrame extends TraceFrame {
  line?: number;
  column?: number;
  variables?: RawVariableSnapshot[];
  /** Full call-stack snapshot at this step (recursion demos). */
  callStack?: RawCallFrame[];
  /**
   * Teaching stage recorded at execution time (`trace(..., lesson_step=...)`).
   * Absent for runners that never emit one — the adapter must not invent it.
   */
  lessonStepId?: string;
  /**
   * Stage 7B optional stack/queue semantics emitted by the Python runner. Kept
   * `unknown` until the adapter validates it; JS legacy frames never carry it.
   */
  structure?: unknown;
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
