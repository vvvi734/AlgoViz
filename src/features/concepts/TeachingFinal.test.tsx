import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CONCEPT_PAGES, conceptById } from '../../domain/concepts/catalog';
import { I18nProvider } from '../../i18n/I18nProvider';
import { ConceptView } from './ConceptView';

const FORMULA_GAP_PAGES = [
  'adt',
  'algorithm-cases',
  'array-basics',
  'b-tree',
  'complexity',
  'forest-conversion',
  'graph-basics',
  'hashing-basics',
  'linear-list',
  'sorting-basics',
  'sparse-matrix',
  'special-matrices',
  'stack-queue-storage',
  'static-tree-table',
  'storage-structures',
  'string-basics',
  'tree-storage',
  'tree-terms',
] as const;

const P2_04_ADDED_FORMULA_EN = [
  'T(n) = O(f(n)): ignore constant factors and lower-order terms',
  'address(a[i]) = base address + i × element size',
  'n0 = n2 + 1; depth k holds at most 2^k − 1 nodes',
  '2n pointer fields = (n−1) child links + (n+1) null pointers',
  '0-based array indices: left child 2i+1, right child 2i+2, parent ⌊(i−1)/2⌋',
  'Σ deg(v) = 2|E| (undirected graph); simple undirected graph |E| ≤ n(n−1)/2',
  'ADT = (data objects, data relationships, operation set)',
  'Sequential search: best 1 comparison, worst n comparisons (target absent also counts as worst case)',
  'a(i−1) → ai → a(i+1), where 1 < i < n',
  'Worst-case lower bound for comparison sorting: Ω(n log n)',
  'Common ADT operations: StrAssign, StrCompare, StrLength, Concat, SubString, Index, StrInsert, StrDelete',
  'T = "ABABABCABABABC", P = "ABABC" → 0-based match starts 2 and 9',
  'On mismatch: j ← lps[j − 1], i unchanged',
  'A[i][j]: 0 ≤ i < R, 0 ≤ j < C (0-based in this course)',
  'row-major position = i*C + j; column-major position = j*R + i (0-based)',
  'row-major Loc(i,j) = base + (i*C + j)*w',
  'number of elements in a symmetric matrix: n(n+1)/2 (including the main diagonal)',
  '0-based lower triangle: k = i(i+1)/2 + j (i ≥ j)',
  'tridiagonal (0-based): k = 2i + j, |i−j| ≤ 1',
  'first identify the triangle, then the base index, then substitute into the formula',
  'nonzero fraction δ = t / (m×n)',
  '(row, col, value) table; t records occupy 3t numeric values',
  'CSR storage: row_ptr(m+1) + col_idx(t) + values(t)',
  'cpot[c] = cpot[c−1] + num[c−1] (0-based)',
  'k₁ < k₂ < … < kₜ; keys in cᵢ lie in (kᵢ, kᵢ₊₁), with -∞ / +∞ at the ends',
  'm = 4: a full node with 3 keys → left 1 key + promoted 1 key + right 1 key',
  'top == -1 (empty)\ntop == MAXSIZE - 1 (full)\npush ++top; pop top--',
  'A → B → C → D; B → E → F; D → G; all other firstChild = NULL',
  'tree preorder = binary-tree preorder; tree postorder = binary-tree inorder; forest preorder/inorder = binary-tree preorder/inorder',
  'WPL = Σ w_i·depth_i\nASL_succ = WPL / Σ w_i  (when w_i = p_i)\nASL_fail = Σ q_j·c_j',
  'h(k) = k mod p        (choose a suitable prime p)\nh(k) = ⌊m·(k·A mod 1)⌋  (0 < A < 1)\nα = n / m',
  'chaining (simplified model): ASL_succ ≈ 1 + α/2,  ASL_fail ≈ α\nopen addressing with linear probing: ASL grows nonlinearly with α\nα = n/m',
] as const;

const CJK = /[\u3400-\u9fff]/;


function renderConcept(id: string) {
  const concept = conceptById(id);
  if (!concept) throw new Error(`missing concept ${id}`);
  return render(
    <I18nProvider>
      <ConceptView concept={concept} />
    </I18nProvider>,
  );
}

function formulaSections() {
  return CONCEPT_PAGES.flatMap((page) =>
    page.sections
      .filter((section) => section.formula)
      .map((section) => ({ page, section, formula: section.formula! })),
  );
}

function mathTokens(formula: string): string[] {
  return (
    formula.match(
      /[A-Za-z][A-Za-z0-9_\u2080-\u208e\u2070-\u2079\u1d62-\u1d6a]*|[\u0391-\u03c9\u03b1-\u03c9][A-Za-z0-9_\u2080-\u208e\u2070-\u2079\u1d62-\u1d6a]*|\d+/g,
    ) ?? []
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.removeItem('algolens-lang');
});

describe('TEACHING-FINAL P2-04 formula bilingual coverage', () => {
  it('fills every Chinese formula gap with a non-empty English rendering', () => {
    const gaps = formulaSections().filter(({ formula }) => CJK.test(formula));
    expect(gaps).toHaveLength(54);

    const reviewed = new Set<string>(P2_04_ADDED_FORMULA_EN);
    const matched = gaps.filter(({ section }) => reviewed.has(section.formulaEn ?? ''));
    expect(matched).toHaveLength(32);
    expect(new Set(matched.map(({ page }) => page.id))).toEqual(new Set(FORMULA_GAP_PAGES));

    for (const { page, section, formula } of gaps) {
      const rendered = section.formulaEn?.trim();
      expect(rendered, `${page.id}/${section.title[0]}`).toBeTruthy();
      expect(rendered, `${page.id}/${section.title[0]}`).not.toMatch(CJK);
      expect(rendered, `${page.id}/${section.title[0]}`).not.toBe(formula);
    }
  });

  it('keeps variable names, numeric bases and Greek symbols from every formula', () => {
    for (const { page, section, formula } of formulaSections()) {
      if (!section.formulaEn) continue;
      const rendered = section.formulaEn;
      for (const token of mathTokens(formula)) {
        expect(rendered, `${page.id}/${section.title[0]} lost token ${token}`).toContain(token);
      }
    }
  });

  it('renders every formula in English with the reviewed formulaEn text and no Chinese', () => {
    window.localStorage.setItem('algolens-lang', 'en');
    for (const concept of CONCEPT_PAGES) {
      const { container } = renderConcept(concept.id);
      const expected = concept.sections
        .filter((section) => section.formula)
        .map((section) => (section.formulaEn ?? section.formula!).trim());
      const rendered = Array.from(container.querySelectorAll('.concept-formula'))
        .map((node) => (node.textContent ?? '').trim());
      expect(rendered, `${concept.id}/formulas`).toEqual(expected);
      expect(rendered.join('\n'), `${concept.id}/formulas still Chinese`).not.toMatch(CJK);
      cleanup();
    }
  });
});

describe('TEACHING-FINAL P2-07 sorting comparison diagram', () => {
  it('binds the lesson to the dedicated LSD/MSD chained-bucket diagram', () => {
    const concept = conceptById('sorting-comparison');
    expect(concept?.diagram).toBe('sorting-comparison');
    renderConcept('sorting-comparison');

    const svg = screen.getByTestId('sorting-comparison-svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 760 500');
    const text = svg.textContent ?? '';
    for (const phrase of ['LSD', 'MSD', '桶', '链', 'C(21)', 'A(23)', 'tail', '选择条件']) {
      expect(text, phrase).toContain(phrase);
    }
    expect(text).not.toContain('不稳定排序');
    expect(text).not.toContain('Stable sort');

    const pass2Bucket2 = screen.getByTestId('sorting-comparison-pass2-bucket-2');
    expect(pass2Bucket2.textContent).toContain('C 21');
    expect(pass2Bucket2.textContent).toContain('A 23');
    expect(pass2Bucket2.textContent).toContain('尾');
    const orderedKeys = Array.from(pass2Bucket2.querySelectorAll('[data-record-key]'))
      .map((node) => node.getAttribute('data-record-key'));
    expect(orderedKeys).toEqual(['21', '23']);
  });

  it('keeps all diagram text nodes inside the declared viewBox', () => {
    const { container } = renderConcept('sorting-comparison');
    const svg = container.querySelector('[data-testid="sorting-comparison-svg"]');
    expect(svg).not.toBeNull();
    for (const node of Array.from(svg?.querySelectorAll('text') ?? [])) {
      const x = Number(node.getAttribute('x'));
      const y = Number(node.getAttribute('y'));
      expect(Number.isFinite(x), node.textContent ?? '').toBe(true);
      expect(Number.isFinite(y), node.textContent ?? '').toBe(true);
      expect(x, node.textContent ?? '').toBeGreaterThanOrEqual(0);
      expect(x, node.textContent ?? '').toBeLessThanOrEqual(760);
      expect(y, node.textContent ?? '').toBeGreaterThan(0);
      expect(y, node.textContent ?? '').toBeLessThanOrEqual(500);
    }
  });

  it('renders the English diagram without Chinese text and with the same bucket chain', () => {
    window.localStorage.setItem('algolens-lang', 'en');
    renderConcept('sorting-comparison');
    const svg = screen.getByTestId('sorting-comparison-svg');
    const text = svg.textContent ?? '';
    expect(text).not.toMatch(CJK);
    expect(text).toContain('LSD');
    expect(text).toContain('MSD');
    expect(text).toContain('bucket 2');
    expect(text).toContain('head C');
    expect(text).toContain('tail A');
    expect(text).toContain('Selection conditions');
    expect(screen.getByTestId('sorting-comparison-pass2-bucket-2').textContent).toContain(
      'C 21',
    );
  });
});
