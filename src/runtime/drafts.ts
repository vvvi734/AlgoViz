/**
 * Local code drafts. User edits are persisted to localStorage keyed by
 * algorithm × language so different presets never clobber each other. Drafts
 * are kept completely separate from the executed-source snapshot used by the
 * trace pipeline (`useLabController.source`).
 *
 * localStorage is the right store for short code snippets and needs no server;
 * every write is guarded so private-mode / quota errors degrade to an in-memory
 * fallback instead of crashing the UI.
 */
import type { CodeLanguage } from '../domain/algorithms/types';
import { safeGet } from './storage';

const KEY_PREFIX = 'algolens.code.';

export function draftKey(algoId: string, language: CodeLanguage): string {
  return `${KEY_PREFIX}${algoId}.${language}`;
}

/** Load a saved draft, or `null` if none exists / storage is unavailable. */
export function loadDraft(algoId: string, language: CodeLanguage): string | null {
  const value = safeGet(draftKey(algoId, language));
  return value === null ? null : value;
}

/**
 * Persist a draft. Returns `true` when the value reached localStorage, `false`
 * when the write failed (quota / private mode) — callers use that to surface a
 * "save failed" state while still keeping the in-memory value.
 */
export function saveDraft(algoId: string, language: CodeLanguage, code: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(draftKey(algoId, language), code);
    return true;
  } catch {
    return false;
  }
}

/** Remove a saved draft (used by "restore default" to reset persistence). */
export function clearDraft(algoId: string, language: CodeLanguage): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(draftKey(algoId, language));
  } catch {
    /* best-effort */
  }
}
