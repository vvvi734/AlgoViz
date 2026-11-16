import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDraft, draftKey, loadDraft, saveDraft } from './drafts';

describe('local code drafts', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('namespaces keys by algorithm and language', () => {
    expect(draftKey('bubble', 'python')).toBe('algolens.code.bubble.python');
    expect(draftKey('bubble', 'js')).not.toBe(draftKey('quick', 'js'));
  });

  it('saves and loads a draft', () => {
    expect(saveDraft('bubble', 'python', 'arr = list(input)')).toBe(true);
    expect(loadDraft('bubble', 'python')).toBe('arr = list(input)');
  });

  it('isolates drafts by algorithm and by language', () => {
    saveDraft('bubble', 'js', 'const a = [];');
    saveDraft('quick', 'js', 'const q = [];');
    saveDraft('bubble', 'python', 'arr = []');
    expect(loadDraft('bubble', 'js')).toBe('const a = [];');
    expect(loadDraft('quick', 'js')).toBe('const q = [];');
    expect(loadDraft('bubble', 'python')).toBe('arr = []');
  });

  it('returns null when no draft exists', () => {
    expect(loadDraft('missing', 'js')).toBeNull();
  });

  it('clears a draft', () => {
    saveDraft('bubble', 'js', 'x');
    clearDraft('bubble', 'js');
    expect(loadDraft('bubble', 'js')).toBeNull();
  });

  it('reports failure (returns false) when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(saveDraft('bubble', 'js', 'x')).toBe(false);
    spy.mockRestore();
  });
});
