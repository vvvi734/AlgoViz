/**
 * Monaco setup (runtime). This module is only ever loaded via a dynamic
 * `import()` from `loader.ts`, so the ~4 MB editor stays in its own lazy chunk
 * instead of the first-paint bundle, and Vitest never evaluates it (tests use
 * the textarea fallback in `MonacoEditor`).
 */
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/editor/editor.worker?worker';

/** The runtime `monaco` namespace (also usable as a type). */
export type Monaco = typeof monaco;

/**
 * Boot the editor: wire the Web Worker (bundled locally — no CDN) and return
 * the namespace. Python/JavaScript highlighting use Monaco's tokenisers and do
 * not need per-language workers.
 */
export function setupMonaco(): Monaco {
  (self as unknown as { MonacoEnvironment?: { getWorker: () => Worker } }).MonacoEnvironment = {
    getWorker: () => new editorWorker(),
  };
  return monaco;
}
