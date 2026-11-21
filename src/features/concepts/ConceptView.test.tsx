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

  it('keeps the editorial reading order on the basics page and localizes its formula', () => {
    renderConcept('data-structure-basics');

    const order = [
      'concept-goal',
      'concept-diagram',
      'concept-key-concepts',
      'concept-definition',
      'concept-section-list',
      'concept-comparison',
      'concept-takeaway',
    ];
    const elements = order.map((id) => screen.getByTestId(id));
    for (let index = 0; index < elements.length - 1; index += 1) {
      expect(
        elements[index].compareDocumentPosition(elements[index + 1]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    window.localStorage.setItem('algolens-lang', 'en');
    cleanup();
    renderConcept('data-structure-basics');
    expect(document.querySelector('.concept-formula')?.textContent).toBe(
      'data structure = logical structure + storage structure + operations',
    );
    expect(screen.getByTestId('concept-page').textContent).not.toMatch(/[\u3400-\u9fff]/);
    window.localStorage.removeItem('algolens-lang');
    cleanup();
  });

  it('shows formulas, comparisons and definitions where authored', () => {
    renderConcept('complexity');
    expect(document.querySelector('.concept-formula')?.textContent).toContain('T(n) = O(f(n))');
    expect(screen.getByTestId('concept-comparison')).toBeTruthy();
    expect(screen.getByTestId('concept-definition').textContent).toContain('时间复杂度');
  });

  it('defines algorithms through the five required properties', () => {
    renderConcept('algorithm-definition');
    const page = screen.getByTestId('concept-page').textContent ?? '';
    for (const property of ['有穷性', '确定性', '可行性', '输入', '输出']) {
      expect(page).toContain(property);
    }
    expect(page).toContain('有限指令');
    const diagram = screen.getByTestId('concept-diagram').textContent ?? '';
    expect(diagram).toContain('每步有限时间');
    expect(diagram).toContain('明确结果');
    expect(document.querySelector('.concept-formula')?.textContent).toContain('合法输入');
  });

  it('turns naive matching into a reachable lesson and separates KMP notations', () => {
    renderConcept('naive-matching');
    expect(screen.getByTestId('concept-title').textContent).toContain('朴素模式匹配');
    expect(screen.getByTestId('concept-page').textContent).toContain('最坏 O(nm)');
    expect(screen.getByTestId('concept-diagram').querySelector('svg')).not.toBeNull();
    cleanup();

    renderConcept('string-basics');
    const formulas = Array.from(document.querySelectorAll('.concept-formula'))
      .map((node) => node.textContent ?? '')
      .join('\n');
    expect(formulas).toContain('[0, 0, 1, 2, 0]');
    expect(formulas).toContain('[0, 1, 1, 2, 3]');
    expect(formulas).toContain('[0, 1, 0, 1, 3]');
    expect(screen.getByTestId('concept-page').textContent).toContain('nextval');
  });

  it('keeps the sorting selection guidance tied to stability and space', () => {
    renderConcept('sorting-basics');
    const page = screen.getByTestId('concept-page').textContent ?? '';
    expect(page).toContain('直接插入排序常数小且额外空间 O(1)');
    expect(page).toContain('归并排序是稳妥选择');
    expect(page).toContain('快速排序平均 O(n log n)');
    expect(page).toContain('堆排序最坏也是 O(n log n)，额外空间 O(1)');
    expect(page).toContain('复杂度取决于增量序列');
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

  it('shows the threaded tree with child links, threads and ltag/rtag', () => {
    renderConcept('threaded-binary-tree');
    const diagram = screen.getByTestId('concept-diagram');
    const text = diagram.textContent ?? '';
    expect(diagram.querySelectorAll('svg')).toHaveLength(2);
    expect(text).toContain('中序：1 → 2 → 3 → 4 → 6');
    expect(text).toContain('ltag=1');
    expect(text).toContain('rtag=0');
    expect(text).toContain('∅ 前驱');
    expect(text).toContain('∅ 后继');
    expect(text).toContain('6 个空指针都按线索处理');
    expect(text).toContain('4 个指向真实前驱/后继');
    expect(screen.getByTestId('concept-definition').textContent).toContain('线索');
    expect(screen.getByTestId('concept-comparison').textContent).toContain('中序前驱');
  });

  it('renders the three TEXTBOOK-01 concept pages with matching diagrams and no player', () => {
    renderConcept('static-linked-list');
    let diagram = screen.getByTestId('concept-diagram');
    expect(diagram.textContent).toContain('head = 1');
    expect(diagram.textContent).toContain('freeHead = 4');
    expect(diagram.textContent).toContain('NULL');
    expect(screen.getByTestId('concept-page').textContent).toContain('游标');
    expect(screen.queryByTestId('play-btn')).toBeNull();
    cleanup();

    renderConcept('stack-recursion');
    diagram = screen.getByTestId('concept-diagram');
    expect(diagram.textContent).toContain('F(0)');
    expect(diagram.textContent).toContain('F(3)');
    expect(diagram.textContent).toContain('递归基');
    expect(screen.queryByTestId('reference-code-panel')).toBeNull();
    cleanup();

    renderConcept('string-storage');
    diagram = screen.getByTestId('concept-diagram');
    expect(diagram.textContent).toContain('MAXLEN = 8');
    expect(diagram.textContent).toContain('base');
    expect(diagram.textContent).toContain('next = NULL');
    expect(screen.getByTestId('concept-page').textContent).toContain('块链存储');
    expect(screen.getByTestId('concept-comparison').textContent).toContain('堆分配');
  });

  it('localizes the three new diagrams and teaching copy without leaking Chinese', () => {
    window.localStorage.setItem('algolens-lang', 'en');
    for (const id of ['static-linked-list', 'stack-recursion', 'string-storage']) {
      renderConcept(id);
      const page = screen.getByTestId('concept-page').textContent ?? '';
      expect(page, id).not.toMatch(/[\u3400-\u9fff]/);
      expect(screen.getByTestId('concept-diagram').querySelector('svg'), id).not.toBeNull();
      cleanup();
    }
    window.localStorage.removeItem('algolens-lang');
  });

  it('has a diagram for each concept kind', () => {
    for (const concept of CONCEPT_PAGES) {
      renderConcept(concept.id);
      expect(screen.getByTestId('concept-diagram').querySelector('svg')).not.toBeNull();
      cleanup();
    }
  });
});
