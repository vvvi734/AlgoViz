/**
 * Lazy, side-effect-free entry point for the Monaco editor.
 *
 * `loadMonaco()` resolves exactly one shared editor instance; callers get the
 * same namespace every time, so the app never boots two copies. Keeping the
 * heavy import behind a function is what allows the editor to be code-split
 * away from the initial bundle.
 */
import type { CodeLanguage } from '../../domain/algorithms/types';

export type { Monaco } from './monaco-setup';
import type { Monaco } from './monaco-setup';

let monacoPromise: Promise<Monaco> | null = null;

/** Load (and cache) the Monaco namespace. Safe to call repeatedly. */
export function loadMonaco(): Promise<Monaco> {
  monacoPromise ??= import('./monaco-setup').then((module) => module.setupMonaco());
  return monacoPromise;
}

/** Map a teaching language to Monaco's language id. */
export function toMonacoLanguage(language: CodeLanguage): string {
  return language === 'python' ? 'python' : 'javascript';
}

/**
 * Monaco cannot run in jsdom (no layout, no worker), so tests render a plain
 * textarea with identical semantics. The real editor is used everywhere else.
 */
export function isMonacoEnabled(): boolean {
  return import.meta.env.MODE !== 'test';
}
