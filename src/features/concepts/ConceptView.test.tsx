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

  it('keeps the ASL and block-search calculations tied to their diagrams', () => {
    renderConcept('asl-decision-tree');
    const aslText = Array.from(document.querySelectorAll('.concept-formula'))
      .map((node) => node.textContent ?? '')
      .join('\n');
    expect(aslText).toContain('17/7');
    expect(aslText).toContain('ASL_fail');
    expect(screen.getByTestId('concept-diagram').querySelector('svg')).not.toBeNull();
    expect(screen.getByTestId('concept-comparison').textContent).toContain('哈希查找');
    cleanup();

    renderConcept('indexed-search');
    const blockText = Array.from(document.querySelectorAll('.concept-formula'))
      .map((node) => node.textContent ?? '')
      .join('\n');
    expect(blockText).toContain('√n');
    expect(screen.getByTestId('concept-comparison').textContent).toContain('块间');
    expect(screen.getByTestId('concept-diagram').querySelector('svg')).not.toBeNull();
  });

  it('keeps the circular queue states and four storage layouts visible in the SVG', () => {
    renderConcept('circular-queue');
    const circularText = screen.getByTestId('concept-diagram').textContent ?? '';
    expect(circularText).toContain('front = 2');
    expect(circularText).toContain('rear = 0');
    expect(circularText).toContain('(5 + 1) % 6 = 0 = front');
    expect(circularText).toContain('capacity - 1');
    expect(circularText).toContain('rear + 1 = 6');
    expect(circularText).toContain('假溢出');
    cleanup();

    renderConcept('stack-queue-storage');
    const storageText = screen.getByTestId('concept-diagram').textContent ?? '';
    expect(storageText).toContain('top = 2');
    expect(storageText).toContain('front = 2');
    expect(storageText).toContain('rear = 5');
    expect(storageText).toContain('rear = front');
    expect(screen.getByTestId('concept-definition').textContent).toContain('头结点');
  });

  it('keeps the three tree storage layouts on the same A-G example', () => {
    renderConcept('tree-storage');
    const diagram = screen.getByTestId('concept-diagram');
    const text = diagram.textContent ?? '';
    expect(diagram.querySelectorAll('svg')).toHaveLength(3);
    expect(text).toContain('parent[1] = 0 → A');
    expect(text).toContain('孩子链表');
    expect(text).toContain('firstChild');
    expect(text).toContain('nextSibling');
    expect(text).toContain('NULL');
    expect(text).toContain('找双亲 O(1)');
    expect(screen.getByTestId('concept-definition').textContent).toContain('双亲表示法');
    expect(screen.getByTestId('concept-definition').textContent).toContain('孩子兄弟表示法');
    expect(screen.getByTestId('concept-comparison').textContent).toContain('孩子兄弟表示法');
  });

  it('shows tree, forest and reverse conversion with correct link meanings', () => {
    renderConcept('forest-conversion');
    const diagram = screen.getByTestId('concept-diagram');
    const text = diagram.textContent ?? '';
    expect(diagram.querySelectorAll('svg')).toHaveLength(3);
    expect(text).toContain('注意：B 的右孩子是 C');
    expect(text).toContain('A → H → J');
    expect(text).toContain('断开 ①');
    expect(text).toContain('节点数仍为 10');
    expect(text).toContain('nextSibling');
    const formulas = Array.from(document.querySelectorAll('.concept-formula'))
      .map((node) => node.textContent ?? '')
      .join('\n');
    expect(formulas).toContain('left(v) = firstChild(v)');
    expect(formulas).toContain('树的后根 = 二叉树中序');
    expect(screen.getByTestId('concept-comparison').textContent).toContain('下一棵树的根');
  });

  it('has a diagram for each concept kind', () => {
    for (const concept of CONCEPT_PAGES) {
      renderConcept(concept.id);
      expect(screen.getByTestId('concept-diagram').querySelector('svg')).not.toBeNull();
      cleanup();
    }
  });
});
