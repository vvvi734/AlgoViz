import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { parseSidebarPreferences, useSidebarPreferences } from './useSidebarPreferences';

/**
 * UX-03 preference persistence.
 *
 * Only `algolens-sidebar` is touched. The old UI-01 key keeps its name; the
 * new shape stores open chapter/topic ids and still honours `collapsed`.
 */
describe('useSidebarPreferences', () => {
  it('falls back to a closed-directory default for missing or malformed storage', () => {
    expect(parseSidebarPreferences(null)).toEqual({ collapsed: false, openChapters: [], openTopics: [] });
    expect(parseSidebarPreferences('not json')).toEqual({ collapsed: false, openChapters: [], openTopics: [] });
    expect(parseSidebarPreferences('{"collapsed":"yes","openChapters":"ch1"}')).toEqual({
      collapsed: false,
      openChapters: [],
      openTopics: [],
    });
    expect(
      parseSidebarPreferences(
        '{"collapsed":true,"openChapters":["ch7-graph","ch7-graph",7,""],"openTopics":["mst","mst",null]}',
      ),
    ).toEqual({
      collapsed: true,
      openChapters: ['ch7-graph'],
      openTopics: ['mst'],
    });
  });

  it('honours legacy collapsed while ignoring the old closedGroups schema', () => {
    expect(parseSidebarPreferences('{"collapsed":true,"closedGroups":["graph"]}')).toEqual({
      collapsed: true,
      openChapters: [],
      openTopics: [],
    });
  });

  it('migrates pre-TEXTBOOK-01 chapter and topic ids on read', () => {
    expect(
      parseSidebarPreferences(
        JSON.stringify({
          collapsed: false,
          openChapters: ['ch2-algorithm', 'ch3-linear', 'ch8-search', 'ch9-sort'],
          openTopics: ['recursion-extension', 'avl'],
        }),
      ),
    ).toEqual({
      collapsed: false,
      openChapters: ['ch1-intro', 'ch2-linear', 'ch9-search', 'ch10-sort'],
      openTopics: ['recursion-examples', 'avl'],
    });
  });

  it('persists chapter/topic open state without touching other learner keys', () => {
    window.localStorage.setItem('algolens-code-language', 'python');
    window.localStorage.setItem('algolens-theme', 'light');

    const { result } = renderHook(() => useSidebarPreferences());
    act(() => result.current.toggleCollapsed());
    act(() => result.current.toggleChapter('ch10-sort'));
    act(() => result.current.toggleTopic('bubble-sort'));

    expect(JSON.parse(window.localStorage.getItem('algolens-sidebar') ?? '{}')).toEqual({
      collapsed: true,
      openChapters: ['ch10-sort'],
      openTopics: ['bubble-sort'],
    });
    expect(window.localStorage.getItem('algolens-code-language')).toBe('python');
    expect(window.localStorage.getItem('algolens-theme')).toBe('light');

    act(() => result.current.openTopic('bubble-sort'));
    expect(result.current.isTopicOpen('bubble-sort')).toBe(true);
    // openTopic never closes an already-open topic (idempotent).
    act(() => result.current.openTopic('bubble-sort'));
    expect(result.current.isTopicOpen('bubble-sort')).toBe(true);
  });

  it('opens a whole chapter tree atomically while leaving siblings closed', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useSidebarPreferences());
    act(() => result.current.openChapterTree('ch7-graph', ['graph-traversal', 'mst', 'shortest-path']));
    expect(result.current.isChapterOpen('ch7-graph')).toBe(true);
    expect(result.current.isTopicOpen('graph-traversal')).toBe(true);
    expect(result.current.isTopicOpen('mst')).toBe(true);
    expect(result.current.isTopicOpen('shortest-path')).toBe(true);
    expect(result.current.isTopicOpen('hash-search')).toBe(false);
    expect(result.current.isChapterOpen('ch9-search')).toBe(false);
  });

  it('restores saved chapter/topic state on the next mount', () => {
    window.localStorage.setItem(
      'algolens-sidebar',
      JSON.stringify({
        collapsed: true,
        openChapters: ['ch7-graph', 'ch9-search'],
        openTopics: ['mst', 'bst'],
      }),
    );
    const { result } = renderHook(() => useSidebarPreferences());
    expect(result.current.collapsed).toBe(true);
    expect(result.current.isChapterOpen('ch7-graph')).toBe(true);
    expect(result.current.isChapterOpen('ch10-sort')).toBe(false);
    expect(result.current.isTopicOpen('mst')).toBe(true);
    expect(result.current.isTopicOpen('bubble-sort')).toBe(false);
  });

  it('opens the current path once, without fighting a later manual close', () => {
    const { result, rerender } = renderHook(
      ({ chapterId, topicId }: { chapterId: string; topicId: string }) =>
        useSidebarPreferences({ chapterId, topicId }),
      { initialProps: { chapterId: 'ch7-graph', topicId: 'mst' } },
    );
    expect(result.current.isChapterOpen('ch7-graph')).toBe(true);
    expect(result.current.isTopicOpen('mst')).toBe(true);

    // Learner folds the current chapter: no new path change, so it stays shut.
    act(() => result.current.toggleChapter('ch7-graph'));
    expect(result.current.isChapterOpen('ch7-graph')).toBe(false);

    // Selecting another algorithm opens its new path and leaves the old fold alone.
    rerender({ chapterId: 'ch9-search', topicId: 'avl' });
    expect(result.current.isChapterOpen('ch9-search')).toBe(true);
    expect(result.current.isTopicOpen('avl')).toBe(true);
    expect(result.current.isChapterOpen('ch7-graph')).toBe(false);
  });
});
