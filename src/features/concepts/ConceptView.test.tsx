import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { CONCEPT_PAGES, conceptById } from '../../domain/concepts/catalog';
import { ConceptView } from './ConceptView';

function renderConcept(id: string) {
  const concept = conceptById(id);
  if (!concept) throw new Error(`missing concept ${id}`);
  render(
    <I18nProvider>
      <ConceptView concept={concept} />
    </I18nProvider>,
  );
}

describe('ConceptView (CORE-REFINE-01)', () => {
  it('renders every authored concept as a static knowledge page with no player or editor', () => {
    for (const concept of CONCEPT_PAGES) {
      renderConcept(concept.id);
      expect(screen.getByTestId('concept-page')).toBeTruthy();
      expect(screen.getByTestId('concept-title').textContent).toContain(concept.title[0]);
      expect(screen.getByTestId('concept-diagram')).toBeTruthy();
      expect(screen.getByTestId('concept-definition')).toBeTruthy();
      expect(screen.getByTestId('concept-takeaway')).toBeTruthy();
      expect(screen.queryByTestId('play-btn')).toBeNull();
      expect(screen.queryByTestId('step-description')).toBeNull();
      expect(screen.queryByTestId('code-editor')).toBeNull();
      expect(screen.queryByTestId('reference-code-panel')).toBeNull();
      expect(document.querySelectorAll('button[aria-label*="play" i]')).toHaveLength(0);
      cleanup();
    }
  });

  it('shows formulas, comparisons and definitions where authored', () => {
    renderConcept('complexity');
    expect(document.querySelector('.concept-formula')?.textContent).toContain('T(n) = O(f(n))');
    expect(screen.getByTestId('concept-comparison')).toBeTruthy();
    expect(screen.getByTestId('concept-definition').textContent).toContain('时间复杂度');
  });

  it('has a diagram for each concept kind', () => {
    for (const concept of CONCEPT_PAGES) {
      renderConcept(concept.id);
      expect(screen.getByTestId('concept-diagram').querySelector('svg')).not.toBeNull();
      cleanup();
    }
  });
});
