/**
 * Learning-session and learning-context value types — Stage 5A.
 *
 * These two file formats are the *only* bridge between the local MCP Agent
 * plugin and the browser. Both are deliberately small, strictly validated and
 * free of anything the user did not explicitly choose to share (no keys, no
 * environment paths, no chat history).
 *
 * Shared by the web app (`src/features/lab`) and the MCP server
 * (`packages/mcp-server`), so the rules are stated once here.
 */
import type { TraceEvent } from '../trace/schema';

export const SESSION_FORMAT_VERSION = 1 as const;
export const CONTEXT_FORMAT_VERSION = 1 as const;

/** Where a course came from: the app itself, or an installed/configured pack. */
export type SessionLessonOrigin =
  | { kind: 'builtin' }
  /** `packId` is the pack the course belongs to; `version` is advisory. */
  | { kind: 'pack'; packId: string; version?: string };

export interface LearningSession {
  sessionFormatVersion: typeof SESSION_FORMAT_VERSION;
  /** Course the user wants to study. Must exist where the session is imported. */
  lessonId: string;
  /** Algorithm the course belongs to; kept explicit so the lab can select it. */
  algorithmId: string;
  /** UI language the Agent wrote the session in (does not change step ids). */
  locale: 'zh' | 'en';
  /** Optional teaching stage to surface after import (never fakes a frame). */
  selectedStepId?: string;
  /** Optional Python source the user may load — inert text, never auto-run. */
  source?: string;
  /** Optional sample input for the algorithm (JSON only). */
  input?: unknown;
  lessonOrigin: SessionLessonOrigin;
  /** Human-readable session name, e.g. "二分查找 · 周一晚复习". */
  sessionName?: string;
  /** ISO-8601 timestamp written by the producer. */
  createdAt: string;
}

/** One teaching stage as it appears in an exported context (localised copy). */
export interface ContextLessonStep {
  stepId: string;
  title: { zh: string; en: string };
  explanation: { zh: string; en: string };
  tip?: { zh: string; en: string };
}

export interface LearningContext {
  contextFormatVersion: typeof CONTEXT_FORMAT_VERSION;
  exportedAt: string;
  locale: 'zh' | 'en';
  algorithmId: string;
  lessonId?: string;
  /** Trace protocol version of the embedded event. */
  traceSchemaVersion: 1;
  /** 0-based index of the frame the user was looking at. */
  stepIndex: number;
  totalEvents: number;
  lessonStepId?: string;
  lessonStep?: ContextLessonStep;
  /**
   * The *real* trace event the browser had at that cursor. The MCP server
   * validates this with the same schema as the app — nothing is re-executed and
   * nothing is invented.
   */
  event: TraceEvent;
  /** Only present when the user explicitly asked to include the source. */
  source?: string;
}

/**
 * Hard limits. They mirror the trace limits where the two overlap so a context
 * can never smuggle a payload the app itself would reject.
 */
export const SESSION_LIMITS = {
  /** Size of an `.algosession.json` file on disk. */
  fileBytes: 96 * 1024,
  /** Python source carried by a session. */
  sourceChars: 40_000,
  /** Sample input JSON payload. */
  inputJsonBytes: 8 * 1024,
  sessionNameChars: 120,
} as const;

export const CONTEXT_LIMITS = {
  /** Size of an `.algocontext.json` file on disk. */
  fileBytes: 128 * 1024,
  /** Source snapshot, only when the user opts in. */
  sourceChars: 40_000,
} as const;

export type SessionIssueCode =
  | 'session-json'
  | 'session-invalid'
  | 'session-format-version'
  | 'session-too-large'
  | 'context-json'
  | 'context-invalid'
  | 'context-format-version'
  | 'context-too-large'
  | 'lesson-unknown'
  | 'lesson-algorithm-mismatch'
  | 'step-unknown'
  | 'algorithm-unknown'
  | 'origin-pack-missing'
  | 'source-too-large'
  | 'input-too-large'
  | 'name-too-long';

export interface SessionIssue {
  code: SessionIssueCode;
  /** Values interpolated into the localized message. */
  params?: Record<string, string>;
  /** Raw schema detail; shown as a secondary line, never as the only message. */
  detail?: string;
}

export type SessionResult<T> = { ok: true; value: T } | { ok: false; errors: SessionIssue[] };

export function sessionIssue(code: SessionIssueCode, params?: Record<string, string>, detail?: string): SessionIssue {
  return { code, ...(params ? { params } : {}), ...(detail ? { detail } : {}) };
}

export function sessionFail(code: SessionIssueCode, params?: Record<string, string>, detail?: string): SessionResult<never> {
  return { ok: false, errors: [sessionIssue(code, params, detail)] };
}

/** Compact one-line summary for CLI logs and MCP error payloads (not UI copy). */
export function describeSessionIssues(errors: readonly SessionIssue[]): string {
  return errors
    .map((error) => {
      const params = error.params
        ? ` (${Object.entries(error.params).map(([key, value]) => `${key}=${value}`).join(', ')})`
        : '';
      const detail = error.detail ? ` — ${error.detail}` : '';
      return `${error.code}${params}${detail}`;
    })
    .join('; ');
}
