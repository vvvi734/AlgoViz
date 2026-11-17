import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { parseSidebarPreferences, useSidebarPreferences } from './useSidebarPreferences';

/**
 * UI-01 preference persistence.
 *
 * The key is new (`algolens-sidebar`) and namespaced, so existing learner data
 * (`algolens-theme`, `algolens-code-language`, drafts) must survive untouched.
 */
describe('useSidebarPreferences', () => {
  it('falls back to the expanded layout for missing or malformed storage', () => {
    expect(parseSidebarPreferences(null)).toEqual({ collapsed: false, closedGroups: [] });
    expect(parseSidebarPreferences('not json')).toEqual({ collapsed: false, closedGroups: [] });
    expect(parseSidebarPreferences('{"collapsed":"yes","closedGroups":"sort"}')).toEqual({
      collapsed: false,
      closedGroups: [],
    });
    expect(parseSidebarPreferences('{"collapsed":true,"closedGroups":["sort","sort",7,""]}')).toEqual({
      collapsed: true,
      closedGroups: ['sort'],
    });
  });

  it('persists collapse and folded sections without touching other keys', () => {
    window.localStorage.setItem('algolens-code-language', 'python');
    window.localStorage.setItem('algolens-theme', 'light');

    const { result } = renderHook(() => useSidebarPreferences());
    act(() => result.current.toggleCollapsed());
    act(() => result.current.toggleGroup('sort'));

    const stored = JSON.parse(window.localStorage.getItem('algolens-sidebar') ?? '{}');
    expect(stored).toEqual({ collapsed: true, closedGroups: ['sort'] });
    expect(window.localStorage.getItem('algolens-code-language')).toBe('python');
    expect(window.localStorage.getItem('algolens-theme')).toBe('light');

    act(() => result.current.openGroup('sort'));
    expect(result.current.isGroupOpen('sort')).toBe(true);
    // openGroup never closes an already-open section (idempotent).
    act(() => result.current.openGroup('sort'));
    expect(result.current.isGroupOpen('sort')).toBe(true);
  });

  it('restores the saved layout on the next mount', () => {
    window.localStorage.setItem(
      'algolens-sidebar',
      JSON.stringify({ collapsed: true, closedGroups: ['graph', 'recursion'] }),
    );
    const { result } = renderHook(() => useSidebarPreferences());
    expect(result.current.collapsed).toBe(true);
    expect(result.current.isGroupOpen('graph')).toBe(false);
    expect(result.current.isGroupOpen('sort')).toBe(true);
  });
});
