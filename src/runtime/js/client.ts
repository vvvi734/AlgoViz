import type { RunMode, TestCaseResult, TraceFrame, VisualRunResult, TestRunResult } from '../../domain/trace/types';
import type { JsProgramRequest, JsProgramResult } from './program';

export const JS_WORKER_TIMEOUT_MS = 3000;

/**
 * Runs user JavaScript in a short-lived, time-limited Worker. If the runtime
 * never completes (infinite loop), the Worker is terminated and its Blob-free
 * module URL is discarded by the GC.
 */
export function executeJs(
  mode: RunMode,
  code: string,
  input: unknown,
  tests: Array<[unknown, unknown]> | null,
  timeoutMessage: string,
): Promise<VisualRunResult | TestRunResult> {
  const request: JsProgramRequest = { mode, code, input, tests };
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    let ended = false;
    const cleanup = () => {
      if (ended) return;
      ended = true;
      clearTimeout(timer);
      worker.terminate();
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(timeoutMessage));
    }, JS_WORKER_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<JsProgramResult>) => {
      cleanup();
      const data = event.data;
      if (!data.ok) return reject(new Error(data.error));
      if (data.mode === 'visual') return resolve({ frames: data.frames as TraceFrame[] });
      resolve({ result: data.result as TestCaseResult[] });
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || 'Worker error'));
    };
    worker.postMessage(request);
  });
}
