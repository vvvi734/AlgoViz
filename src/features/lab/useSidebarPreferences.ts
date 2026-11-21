import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { safeGet, safeSet } from '../../runtime/storage';
import {
  migrateTextbookId,
  migrateTextbookTopicId,
  type TextbookPath,
} from '../../domain/algorithms/textbook';

/**
 * UX-03 directory preferences.
 *
 * The textbook directory has two independent, presentation-only levels:
 *   chapter (twelve book chapters; the extension chapter is hidden when empty)
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

function readIdList(
  value: unknown,
  max: number,
  migrate: (id: string) => string,
): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 80)
        .map(migrate),
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
      // TEXTBOOK-01: pre-migration preferences may still use the old nine-
      // chapter ids. Resolve aliases on read instead of discarding a learner's
      // open chapters; the next write persists the new ids.
      openChapters: readIdList(value.openChapters, 16, migrateTextbookId),
      openTopics: readIdList(value.openTopics, 96, migrateTextbookTopicId),
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
  /** Open one chapter and every supplied second/third-level group beneath it. */
  openChapterTree: (chapterId: string, topicIds: readonly string[]) => void;
  isTopicOpen: (topicId: string) => boolean;
  toggleTopic: (topicId: string) => void;
  openTopic: (topicId: string) => void;
  /** Open both levels of the current algorithm's primary directory path. */
  openPath: (path: TextbookPath | null) => void;
  /** Open every supplied chapter and topic id, preserving authored order. */
  expandAll: (chapterIds: readonly string[], topicIds: readonly string[]) => void;
  /** Fold every chapter and topic, leaving only the first-level directory. */
  collapseAll: () => void;
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

  // Selecting an algorithm (desktop click, mobile select) must reveal its
  // chapter and topic. If the learner later folds that path by hand, this
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
  const openChapterTree = useCallback((chapterId: string, topicIds: readonly string[]) => {
    setOpenChapters((current) => withId(current, chapterId, true));
    setOpenTopics((current) => {
      const next = new Set(current);
      for (const id of topicIds) next.add(id);
      return next;
    });
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
  const expandAll = useCallback((chapterIds: readonly string[], topicIds: readonly string[]) => {
    setOpenChapters(new Set(chapterIds));
    setOpenTopics(new Set(topicIds));
  }, []);
  const collapseAll = useCallback(() => {
    setOpenChapters(new Set());
    setOpenTopics(new Set());
  }, []);

  return useMemo(
    () => ({
      collapsed,
      toggleCollapsed,
      isChapterOpen,
      toggleChapter,
      openChapter,
      openChapterTree,
      isTopicOpen,
      toggleTopic,
      openTopic,
      openPath,
      expandAll,
      collapseAll,
    }),
    [
      collapsed,
      toggleCollapsed,
      isChapterOpen,
      toggleChapter,
      openChapter,
      openChapterTree,
      isTopicOpen,
      toggleTopic,
      openTopic,
      openPath,
      expandAll,
      collapseAll,
    ],
  );
}
