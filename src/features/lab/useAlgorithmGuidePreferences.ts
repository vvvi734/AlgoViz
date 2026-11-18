import { useCallback, useState } from 'react';
import { safeGet, safeSet } from '../../runtime/storage';

/**
 * UX-01 guide folding is a per-algorithm presentation preference.
 *
 * Storing the *collapsed* ids (rather than an `expanded` boolean) makes the
 * required default fall out naturally: an algorithm not in the list is open,
 * including the first time it is selected. Switching algorithms therefore never
 * needs an effect to reset the panel, which avoids a one-frame flash and, more
 * importantly, never touches the trace or playhead.
 */
export const GUIDE_COLLAPSED_KEY = 'algoviz-ux01-guide-collapsed';

export function parseCollapsedGuideIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [
      ...new Set(
        value.filter(
          (item): item is string => typeof item === 'string' && item.length > 0 && item.length <= 80,
        ),
      ),
    ];
  } catch {
    return [];
  }
}

export function useAlgorithmGuidePreferences(currentAlgo: string) {
  const [collapsedIds, setCollapsedIds] = useState<string[]>(() =>
    parseCollapsedGuideIds(safeGet(GUIDE_COLLAPSED_KEY)),
  );

  const isOpen = !collapsedIds.includes(currentAlgo);

  const toggle = useCallback(() => {
    setCollapsedIds((previous) => {
      const next = previous.includes(currentAlgo)
        ? previous.filter((id) => id !== currentAlgo)
        : [...previous, currentAlgo];
      safeSet(GUIDE_COLLAPSED_KEY, JSON.stringify(next));
      return next;
    });
  }, [currentAlgo]);

  return { isOpen, toggle };
}
