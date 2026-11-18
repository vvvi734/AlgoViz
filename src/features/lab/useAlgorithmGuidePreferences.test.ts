import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { GUIDE_COLLAPSED_KEY, parseCollapsedGuideIds, useAlgorithmGuidePreferences } from './useAlgorithmGuidePreferences';

describe('UX-01 collapsed-guide preference parsing', () => {
  it('accepts a string array and removes duplicates', () => {
    expect(parseCollapsedGuideIds('["dijkstra","scc","dijkstra"]')).toEqual(['dijkstra', 'scc']);
  });

  it('returns an empty list for missing, malformed or non-array values', () => {
    expect(parseCollapsedGuideIds(null)).toEqual([]);
    expect(parseCollapsedGuideIds('')).toEqual([]);
    expect(parseCollapsedGuideIds('{')).toEqual([]);
    expect(parseCollapsedGuideIds('{"dijkstra":true}')).toEqual([]);
    expect(parseCollapsedGuideIds('[1,null,""]')).toEqual([]);
  });
});

describe('UX-01 useAlgorithmGuidePreferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('opens an unseen algorithm, folds per algorithm and persists the folded ids', () => {
    const { result, rerender } = renderHook(
      ({ algorithmId }) => useAlgorithmGuidePreferences(algorithmId),
      { initialProps: { algorithmId: 'dijkstra' } },
    );

    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
    expect(JSON.parse(window.localStorage.getItem(GUIDE_COLLAPSED_KEY) ?? '[]')).toEqual(['dijkstra']);

    rerender({ algorithmId: 'topological' });
    expect(result.current.isOpen).toBe(true);
    rerender({ algorithmId: 'dijkstra' });
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(GUIDE_COLLAPSED_KEY) ?? '[]')).toEqual([]);
  });
});
