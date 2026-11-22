import { useCallback, useState } from 'react';

/**
 * UX-01 guide folding is a session-only, per-algorithm presentation preference.
 *
 * Every mount starts with all guides open: a reload is a fresh reading session,
 * even if the learner folded a guide during the previous visit. Within one
 * session the collapsed ids are kept, so switching away and back to an algorithm
 * still honours the fold the learner chose. Storing the *collapsed* ids (rather
 * than an expanded boolean) makes the default fall out naturally: an algorithm
 * not in the list is open, including the first time it is selected.
 */
export function useAlgorithmGuidePreferences(currentAlgo: string) {
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);

  const isOpen = !collapsedIds.includes(currentAlgo);

  const toggle = useCallback(() => {
    setCollapsedIds((previous) =>
      previous.includes(currentAlgo)
        ? previous.filter((id) => id !== currentAlgo)
        : [...previous, currentAlgo],
    );
  }, [currentAlgo]);

  return { isOpen, toggle };
}
