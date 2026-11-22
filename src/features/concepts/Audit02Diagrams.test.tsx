import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { conceptById } from '../../domain/concepts/catalog';
import { ConceptDiagram } from './ConceptDiagram';
import { ConceptView } from './ConceptView';
import { ExternalSortConceptDiagram, type ExternalSortConceptDiagramKind } from './ExternalSortConceptDiagrams';
import { FileStructureConceptDiagram, type FileStructureDiagramKind } from './FileStructureConceptDiagrams';

function renderDiagram(kind: Parameters<typeof ConceptDiagram>[0]['kind']) {
  const result = render(<ConceptDiagram kind={kind} lang="zh" />);
  return result.container;
}

function renderFileDiagram(kind: FileStructureDiagramKind) {
  const result = render(<FileStructureConceptDiagram kind={kind} lang="zh" />);
  return result.container;
}

function renderExternalDiagram(kind: ExternalSortConceptDiagramKind) {
  const result = render(<ExternalSortConceptDiagram kind={kind} lang="zh" />);
  return result.container;
}

function attrNumber(element: Element | null | undefined, attribute: string): number {
  const value = element?.getAttribute(attribute);
  if (value === null || value === undefined || value.trim() === '') {
    throw new Error(`missing numeric attribute ${attribute}`);
  }
  return Number(value);
}

afterEach(() => {
  cleanup();
  window.localStorage.removeItem('algolens-lang');
});

describe('AUDIT-02 SVG and concept regressions', () => {
  it('P1-03 renders the four external-sort memory rows at computed y positions', () => {
    const container = renderExternalDiagram('external-sort');
    const rows = Array.from(container.querySelectorAll('[data-testid="external-memory-row"]'));
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.getAttribute('y'))).toEqual(['118', '152', '186', '220']);
    expect(container.innerHTML).not.toContain('118 + row * 34');
  });

  it('P1-01 keeps B2 visible and points the current-read arrow at key 105 in B1', () => {
    const container = renderFileDiagram('sequential-file');
    expect(Array.from(container.querySelectorAll('[data-file-key]')).map((node) => node.getAttribute('data-file-key'))).toEqual([
      '101', '102', '103', '104', '105', '106', '107', '108',
    ]);
    const b2 = container.querySelector('[data-file-block="B2"]');
    expect(b2?.textContent).toContain('107');
    expect(b2?.textContent).toContain('108');
    for (const blockId of ['B0', 'B1', 'B2']) {
      const block = container.querySelector(`[data-file-block="${blockId}"]`);
      const blockRect = block?.querySelector('rect');
      const blockLeft = attrNumber(blockRect, 'x');
      const blockRight = blockLeft + attrNumber(blockRect, 'width');
      for (const chip of Array.from(block?.querySelectorAll('[data-file-key]') ?? [])) {
        expect(attrNumber(chip, 'x')).toBeGreaterThanOrEqual(blockLeft);
        expect(attrNumber(chip, 'x') + attrNumber(chip, 'width')).toBeLessThanOrEqual(blockRight);
      }
    }

    const chip = container.querySelector('[data-file-key="105"]');
    const arrow = container.querySelector('[data-testid="sequential-current-arrow"]');
    const d = arrow?.getAttribute('d') ?? '';
    const end = d.match(/L\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
    expect(end).not.toBeNull();
    const chipX = attrNumber(chip, 'x');
    const chipWidth = attrNumber(chip, 'width');
    const chipBottom = attrNumber(chip, 'y') + attrNumber(chip, 'height');
    expect(Number(end?.[1])).toBe(chipX + chipWidth / 2);
    expect(Number(end?.[2])).toBe(chipBottom);
    expect(arrow?.getAttribute('data-current-key')).toBe('105');
  });

  it('P1-11 gives every dense-indexed record an entry and keeps sparse entries block-based', () => {
    const container = renderFileDiagram('indexed-file');
    const dense = Array.from(container.querySelectorAll('[data-dense-entry]'));
    expect(dense.map((node) => [node.getAttribute('data-key'), node.getAttribute('data-block')])).toEqual([
      ['101', 'B0'], ['102', 'B0'], ['103', 'B0'],
      ['104', 'B1'], ['105', 'B1'], ['106', 'B1'],
      ['107', 'B2'], ['108', 'B2'],
    ]);
    const sparse = Array.from(container.querySelectorAll('[data-sparse-entry]'));
    expect(sparse.map((node) => [node.getAttribute('data-key'), node.getAttribute('data-block')])).toEqual([
      ['101', 'B0'], ['104', 'B1'], ['107', 'B2'],
    ]);
    expect(container.querySelector('[data-data-block="B2"]')?.textContent).toContain('108');
  });

  it('P1-04 preserves every category and region chain relation', () => {
    const container = renderFileDiagram('multi-table-file');
    const records = Array.from(container.querySelectorAll('[data-record-id]')).map((record) => [
      record.getAttribute('data-record-id'),
      record.getAttribute('data-category-next'),
      record.getAttribute('data-region-next'),
    ]);
    expect(records).toEqual([
      ['R1', 'R3', 'R2'],
      ['R2', '∅', '∅'],
      ['R3', '∅', '∅'],
    ]);
    expect(Array.from(container.querySelectorAll('[data-chain-head]')).map((head) => head.getAttribute('data-chain-head'))).toEqual([
      '类别X:R1,R3',
      '类别Y:R2',
      '地区东:R1,R2',
      '地区西:R3',
    ]);
  });

  it('P1-05 lays the four comparison premises in one full-width column', () => {
    const container = renderFileDiagram('file-comparison');
    const premises = Array.from(container.querySelectorAll('[data-premise]'));
    expect(premises).toHaveLength(4);
    const cells = premises.map((group) => group.querySelector('rect'));
    expect(cells.map((cell) => cell?.getAttribute('x'))).toEqual(['354', '354', '354', '354']);
    expect(cells.map((cell) => cell?.getAttribute('y'))).toEqual(['94', '146', '198', '250']);
    expect(cells.map((cell) => cell?.getAttribute('width'))).toEqual(['554', '554', '554', '554']);
  });

  it('P1-06 keeps bucket 6 above the hash explanation band', () => {
    const container = renderDiagram('hashing-basics');
    const buckets = Array.from(container.querySelectorAll('[data-bucket-index]'));
    expect(buckets).toHaveLength(7);
    const bucket6 = container.querySelector('[data-bucket-index="6"]');
    const bucketRect = bucket6?.querySelector('rect');
    const noteBand = container.querySelector('[data-testid="hashing-note-band"]');
    const bucketBottom = attrNumber(bucketRect, 'y') + attrNumber(bucketRect, 'height');
    expect(attrNumber(noteBand, 'y')).toBeGreaterThan(bucketBottom);
  });

  it('P1-07 keeps all four adjacency-list rows above the explanation text', () => {
    const container = renderDiagram('graph-adjacency-list');
    const rows = Array.from(container.querySelectorAll('[data-vertex-row]'));
    expect(rows.map((row) => row.getAttribute('data-vertex-row'))).toEqual(['A', 'B', 'C', 'D']);
    const dRow = container.querySelector('[data-vertex-row="D"] rect');
    const explanation = Array.from(container.querySelectorAll('.diagram-note'))
      .find((node) => (node.textContent ?? '').includes('B 的边表'));
    const band = container.querySelector('.diagram-band');
    expect(explanation).toBeTruthy();
    expect(attrNumber(explanation ?? null, 'y')).toBeGreaterThan(
      attrNumber(dRow, 'y') + attrNumber(dRow, 'height'),
    );
    expect(attrNumber(band, 'y')).toBeGreaterThan(attrNumber(explanation ?? null, 'y'));
  });

  it('P1-08 separates the C-string note from the cells and keeps next = NULL inside its block', () => {
    const container = renderDiagram('string-storage');
    const cNote = container.querySelector('[data-testid="string-c-terminator"]');
    const firstCell = container.querySelector('.diagram-cell');
    expect(attrNumber(cNote, 'y')).toBeLessThan(attrNumber(firstCell, 'y'));

    const tailPointer = container.querySelector('[data-testid="string-tail-pointer"]');
    const tailBlock = tailPointer?.closest('[data-testid="string-block"]');
    const blockRect = tailBlock?.querySelector('rect');
    const blockRight = attrNumber(blockRect, 'x') + attrNumber(blockRect, 'width');
    expect(attrNumber(tailPointer, 'x')).toBeLessThanOrEqual(blockRight);
  });

  it('P1-09 presents every merge-cost equation inside the diagram', () => {
    const container = renderExternalDiagram('external-comparison');
    const band = container.querySelector('[data-testid="external-cost-band"]');
    expect(attrNumber(band, 'x') + attrNumber(band, 'width')).toBeLessThanOrEqual(940);
    const text = container.textContent ?? '';
    for (const equation of ['3 + 5 = 8', '8 + 8 = 16', '16 + 11 = 27', '8 + 16 + 27 = 51']) {
      expect(text).toContain(equation);
    }
  });

  it('P1-10 binds the capacity lesson to a length/capacity diagram instead of the 2-D array diagram', () => {
    window.localStorage.setItem('algolens-lang', 'zh');
    const concept = conceptById('sequential-list-capacity');
    expect(concept?.diagram).toBe('sequential-capacity');
    if (!concept) throw new Error('missing sequential-list-capacity');
    const { container } = render(
      <I18nProvider>
        <ConceptView concept={concept} />
      </I18nProvider>,
    );

    const before = container.querySelector('[data-testid="sequential-capacity-before"]');
    const after = container.querySelector('[data-testid="sequential-capacity-after"]');
    expect(before?.getAttribute('data-length')).toBe('5');
    expect(before?.getAttribute('data-capacity')).toBe('8');
    expect(after?.getAttribute('data-length')).toBe('5');
    expect(after?.getAttribute('data-capacity')).toBe('16');
    expect(Array.from(before?.querySelectorAll('[data-slot-state]') ?? [])).toHaveLength(8);
    expect(Array.from(before?.querySelectorAll('[data-slot-state="used"]') ?? [])).toHaveLength(5);
    expect(Array.from(before?.querySelectorAll('[data-slot-state="free"]') ?? [])).toHaveLength(3);
    expect(Array.from(after?.querySelectorAll('[data-slot-state="used"]') ?? [])).toHaveLength(5);
    expect(Array.from(after?.querySelectorAll('[data-slot-state="free"]') ?? [])).toHaveLength(11);
    expect(container.querySelector('[data-testid="sequential-capacity-trigger"]')?.textContent).toContain(
      '仅当 length == capacity',
    );
    expect(container.querySelector('[data-testid="sequential-capacity-old-block"]')?.textContent).toContain('已释放');
    expect(container.textContent).not.toContain('A[2][3]');
  });

  it('P2-03 aligns the static-tree ASL notes at the left edge', () => {
    const container = renderDiagram('static-tree-table');
    const notes = Array.from(container.querySelectorAll('[data-testid="static-tree-asl-notes"]'));
    expect(notes).toHaveLength(1);
    expect(notes[0]?.getAttribute('x')).toBe('48');
  });
});
