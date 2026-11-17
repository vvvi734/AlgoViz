import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { safeGet, safeSet } from '../../runtime/storage';

/**
 * UI-01 directory preferences.
 *
 * Two independent, presentation-only preferences live here:
 *  - `collapsed`: the whole directory collapses to a compact icon rail;
 *  - `closedGroups`: which sections the learner folded shut.
 *
 * They are deliberately NOT part of the lab controller: changing them must
 * never touch the selected algorithm, the trace, the playhead or the editor.
 *
 * Storage is additive and namespaced: a brand-new key holds a small JSON
 * object, so existing keys (`algolens-theme`, `algolens-code-language`,
 * `algolens.code.*`) are never read, rewritten or cleared. New groups default
 * to *open* because only explicitly closed ids are persisted — a section added
 * by a later registry change therefore shows up expanded instead of hidden.
 */
const STORAGE_KEY = 'algolens-sidebar';

export interface SidebarPreferences {
  collapsed: boolean;
  closedGroups: string[];
}

const EMPTY: SidebarPreferences = { collapsed: false, closedGroups: [] };

/** Tolerant parse: anything unexpected falls back to the default layout. */
export function parseSidebarPreferences(raw: string | null): SidebarPreferences {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as Partial<SidebarPreferences> | null;
    if (!value || typeof value !== 'object') return EMPTY;
    const collapsed = value.collapsed === true;
    const closedGroups = Array.isArray(value.closedGroups)
      ? Array.from(
          new Set(
            value.closedGroups.filter(
              (id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 64,
            ),
          ),
        ).slice(0, 32)
      : [];
    return { collapsed, closedGroups };
  } catch {
    return EMPTY;
  }
}

export interface SidebarPreferenceController {
  collapsed: boolean;
  toggleCollapsed: () => void;
  isGroupOpen: (groupId: string) => boolean;
  toggleGroup: (groupId: string) => void;
  /** Expand a section without toggling it shut (used when selecting an algorithm). */
  openGroup: (groupId: string) => void;
}

export function useSidebarPreferences(): SidebarPreferenceController {
  const initial = useRef<SidebarPreferences | null>(null);
  if (initial.current === null) initial.current = parseSidebarPreferences(safeGet(STORAGE_KEY));

  const [collapsed, setCollapsed] = useState(initial.current.collapsed);
  const [closedGroups, setClosedGroups] = useState<ReadonlySet<string>>(
    () => new Set(initial.current?.closedGroups ?? []),
  );

  // Write only our own key. `safeSet` swallows quota/private-mode failures, so
  // an unwritable storage never blocks the UI.
  useEffect(() => {
    safeSet(STORAGE_KEY, JSON.stringify({ collapsed, closedGroups: [...closedGroups] } satisfies SidebarPreferences));
  }, [collapsed, closedGroups]);

  const toggleCollapsed = useCallback(() => setCollapsed((value) => !value), []);

  const toggleGroup = useCallback((groupId: string) => {
    setClosedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const openGroup = useCallback((groupId: string) => {
    setClosedGroups((current) => {
      if (!current.has(groupId)) return current;
      const next = new Set(current);
      next.delete(groupId);
      return next;
    });
  }, []);

  const isGroupOpen = useCallback((groupId: string) => !closedGroups.has(groupId), [closedGroups]);

  return useMemo(
    () => ({ collapsed, toggleCollapsed, isGroupOpen, toggleGroup, openGroup }),
    [collapsed, toggleCollapsed, isGroupOpen, toggleGroup, openGroup],
  );
}
