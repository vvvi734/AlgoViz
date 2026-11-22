import { useLayoutEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { LabView } from '../features/lab/LabView';
import { useLabController } from '../features/lab/useLabController';
import { builtinLessonCatalog } from '../domain/lessons/catalog';
import { useI18n } from '../i18n/I18nProvider';
import { resetScrollToTop } from './viewport';

const DEFAULT_CONCEPT_ID = 'data-structure-basics';

/**
 * The app now opens as a textbook reader. A `?view=lab` URL keeps the internal
 * algorithm workspace available for regression tests and deep links; it is not
 * exposed in the primary navigation.
 */
function initialConceptId(): string | null {
  if (typeof window === 'undefined') return DEFAULT_CONCEPT_ID;
  return new URLSearchParams(window.location.search).get('view') === 'lab'
    ? null
    : DEFAULT_CONCEPT_ID;
}

export function App({
  initialConcept = initialConceptId(),
}: {
  initialConcept?: string | null;
} = {}) {
  const { t } = useI18n();
  const lab = useLabController();

  // Reloads are fresh reading sessions: the first paint must show the concept
  // hero's top edge, not a browser-restored or nested-scroller position.
  useLayoutEffect(() => {
    resetScrollToTop();
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      return;
    }
    const frame = window.requestAnimationFrame(resetScrollToTop);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="app" data-view="learn">
      <TopBar />

      <div className="app-view app-view-learn">
        <LabView lab={lab} lessons={builtinLessonCatalog} initialConceptId={initialConcept} />
      </div>

      <footer className="footer">{t('footer')}</footer>
    </div>
  );
}
