import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { safeGet, safeSet } from '../../runtime/storage';
import type { TextbookPath } from '../../domain/algorithms/textbook';

/**
 * UX-03 directory preferences.
 *
 * The textbook directory has two independent, presentation-only levels:
 *   chapter (nine book chapters + an extension chapter)
 *   topic   (knowledge points inside a chapter)
 *
 * Only *open* ids are stored. This is deliberately additive to the UI-01 key
 * (`algolens-sidebar`), whose `collapsed` flag is still honoured. The legacy
 * `closedGroups` field cannot be mapped one-to-one onto chapters (one old group
 * could span two book chapters), so it is ignored; the current algorithm's path
 * is opened on mount, and every other chapter starts folded. No other learner
 * key is read, rewritten or cleared.
 */
const STORAGE_KEY = 'algolens-sidebar';

export interface SidebarPreferences {
  collapsed: boolean;
  openChapters: string[];
  openTopics: string[];
}

const EMPTY: SidebarPreferences = { collapsed: false, openChapters: [], openTopics: [] };

function readIdList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 80,
      ),
    ),
  ).slice(0, max);
}

/** Tolerant parse: anything unexpected falls back to the default layout. */
export function parseSidebarPreferences(raw: string | null): SidebarPreferences {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as Partial<SidebarPreferences> | null;
    if (!value || typeof value !== 'object') return EMPTY;
    return {
      collapsed: value.collapsed === true,
      openChapters: readIdList(value.openChapters, 16),
      openTopics: readIdList(value.openTopics, 96),
    };
  } catch {
    return EMPTY;
  }
}

export interface SidebarPreferenceController {
  collapsed: boolean;
  toggleCollapsed: () => void;
  isChapterOpen: (chapterId: string) => boolean;
  toggleChapter: (chapterId: string) => void;
  openChapter: (chapterId: string) => void;
  isTopicOpen: (topicId: string) => boolean;
  toggleTopic: (topicId: string) => void;
  openTopic: (topicId: string) => void;
  /** Open both levels of the current algorithm's primary directory path. */
  openPath: (path: TextbookPath | null) => void;
}

function withId(current: ReadonlySet<string>, id: string, open: boolean): ReadonlySet<string> {
  const has = current.has(id);
  if (has === open) return current;
  const next = new Set(current);
  if (open) next.add(id);
  else next.delete(id);
  return next;
}

export function useSidebarPreferences(currentPath?: TextbookPath | null): SidebarPreferenceController {
  const initial = useRef<{
    collapsed: boolean;
    openChapters: ReadonlySet<string>;
    openTopics: ReadonlySet<string>;
  } | null>(null);

  if (initial.current === null) {
    const stored = parseSidebarPreferences(safeGet(STORAGE_KEY));
    initial.current = {
      collapsed: stored.collapsed,
      openChapters: new Set(stored.openChapters),
      openTopics: new Set(stored.openTopics),
    };
    if (currentPath) {
      (initial.current.openChapters as Set<string>).add(currentPath.chapterId);
      (initial.current.openTopics as Set<string>).add(currentPath.topicId);
    }
  }

  const [collapsed, setCollapsed] = useState(initial.current.collapsed);
  const [openChapters, setOpenChapters] = useState<ReadonlySet<string>>(initial.current.openChapters);
  const [openTopics, setOpenTopics] = useState<ReadonlySet<string>>(initial.current.openTopics);

  // Selecting an algorithm (desktop click, mobile select, AI import) must reveal
  // its chapter and topic. If the learner later folds that path by hand, this
  // effect does not fire again until the selected algorithm actually changes.
  const chapterId = currentPath?.chapterId ?? null;
  const topicId = currentPath?.topicId ?? null;
  useEffect(() => {
    if (!chapterId || !topicId) return;
    setOpenChapters((current) => withId(current, chapterId, true));
    setOpenTopics((current) => withId(current, topicId, true));
  }, [chapterId, topicId]);

  // Write only our own key. `safeSet` swallows quota/private-mode failures.
  useEffect(() => {
    safeSet(
      STORAGE_KEY,
      JSON.stringify({
        collapsed,
        openChapters: [...openChapters],
        openTopics: [...openTopics],
      } satisfies SidebarPreferences),
    );
  }, [collapsed, openChapters, openTopics]);

  const toggleCollapsed = useCallback(() => setCollapsed((value) => !value), []);
  const isChapterOpen = useCallback((id: string) => openChapters.has(id), [openChapters]);
  const toggleChapter = useCallback((id: string) => {
    setOpenChapters((current) => withId(current, id, !current.has(id)));
  }, []);
  const openChapter = useCallback((id: string) => {
    setOpenChapters((current) => withId(current, id, true));
  }, []);
  const isTopicOpen = useCallback((id: string) => openTopics.has(id), [openTopics]);
  const toggleTopic = useCallback((id: string) => {
    setOpenTopics((current) => withId(current, id, !current.has(id)));
  }, []);
  const openTopic = useCallback((id: string) => {
    setOpenTopics((current) => withId(current, id, true));
  }, []);
  const openPath = useCallback((path: TextbookPath | null) => {
    if (!path) return;
    setOpenChapters((current) => withId(current, path.chapterId, true));
    setOpenTopics((current) => withId(current, path.topicId, true));
  }, []);

  return useMemo(
    () => ({
      collapsed,
      toggleCollapsed,
      isChapterOpen,
      toggleChapter,
      openChapter,
      isTopicOpen,
      toggleTopic,
      openTopic,
      openPath,
    }),
    [
      collapsed,
      toggleCollapsed,
      isChapterOpen,
      toggleChapter,
      openChapter,
      isTopicOpen,
      toggleTopic,
      openTopic,
      openPath,
    ],
  );
}
