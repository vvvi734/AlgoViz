import type { RunMode, TestCaseResult, TraceFrame, VisualRunResult, TestRunResult } from '../../domain/trace/types';
import type { CodeLanguage } from '../../domain/algorithms/types';
import { safeGet } from '../storage';

export const EXECUTE_API_STORAGE_KEY = 'algolens-execute-api';
export const DEFAULT_EXECUTE_API = '/api/execute';
export const NATIVE_TIMEOUT_MS = 15000;

/** Rejects non-HTTP(S) URLs and plaintext HTTP to remote hosts. */
export function validateHttpUrl(value: string, base: string): URL {
  const url = new URL(value, base);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Only HTTP(S) URLs are permitted');
  const isLocal = ['localhost', '127.0.0.1', window.location.hostname].includes(url.hostname);
  if (url.protocol === 'http:' && !isLocal) throw new Error('Use HTTPS for remote endpoints');
  return url;
}

/**
 * C/C++ are sent to an externally deployed, sandboxed executor. This repo
 * intentionally does NOT ship that service (Issue 08) and never compiles
 * untrusted code inside the web server process.
 */
export async function executeNative(
  mode: RunMode,
  code: string,
  input: unknown,
  tests: Array<[unknown, unknown]> | null,
  language: CodeLanguage,
): Promise<VisualRunResult | TestRunResult> {
  const endpoint = safeGet(EXECUTE_API_STORAGE_KEY) || DEFAULT_EXECUTE_API;
  const url = validateHttpUrl(endpoint, window.location.href);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NATIVE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, language, code, input, tests }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} — /api/execute not configured`);
    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      frames?: TraceFrame[];
      result?: TestCaseResult[];
    };
    if (data.ok === false) throw new Error(data.error || 'Execution failed');
    if (mode === 'visual') {
      if (!Array.isArray(data.frames)) throw new Error('Expected frames[]');
      return { frames: data.frames };
    }
    if (!Array.isArray(data.result)) throw new Error('Expected result[]');
    return { result: data.result };
  } finally {
    clearTimeout(timeout);
  }
}
