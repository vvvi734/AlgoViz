import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { buildBfModel } from '../../domain/visualization/bfModel';
import { bfSnapshotSchema, type BfSnapshot } from '../../domain/trace/bfSchema';
import { BfVisual } from './BfVisual';

afterEach(cleanup);

const base = {
  kind: 'bf' as const,
  text: 'ABABABCABABABC',
  pattern: 'ABABC',
  start: null,
  j: null,
  compareIndex: null,
  matched: null,
  nextStart: null,
  seen: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0],
  checkedCandidates: 0,
  comparisonCount: 6,
  matches: [],
  currentMatchStart: null,
};

function renderSnapshot(partial: Partial<BfSnapshot>) {
  const snapshot = bfSnapshotSchema.parse({ ...base, ...partial });
  render(
    <I18nProvider>
      <BfVisual model={buildBfModel(snapshot)} />
    </I18nProvider>,
  );
  return snapshot;
}

describe('BF visual', () => {
  it('renders the live candidate, pattern alignment and comparison counters', () => {
    renderSnapshot({
      operation: 'compare',
      start: 4,
      j: 4,
      compareIndex: 8,
      matched: false,
      checkedCandidates: 5,
    });
    const visual = screen.getByTestId('bf-visual');
    expect(visual.getAttribute('data-operation')).toBe('compare');
    expect(visual.getAttribute('data-start')).toBe('4');
    expect(visual.getAttribute('data-j')).toBe('4');
    expect(visual.getAttribute('data-alignment')).toBe('4');
    expect(screen.getAllByTestId('bf-text-cell')).toHaveLength(14);
    expect(screen.getAllByTestId('bf-pattern-cell')).toHaveLength(5);
    expect(screen.getAllByTestId('bf-text-cell')[8].getAttribute('data-tone')).toBe('mismatch');
    expect(screen.getAllByTestId('bf-pattern-cell')[4].getAttribute('data-tone')).toBe('mismatch');
    expect(screen.getByTestId('bf-status').textContent).toContain('T[8]');
  });

  it('shows a rescanned badge when the same text cell has been compared twice', () => {
    renderSnapshot({
      operation: 'compare',
      start: 4,
      j: 4,
      compareIndex: 8,
      matched: false,
      checkedCandidates: 5,
      seen: [1, 0, 1, 0, 1, 0, 1, 1, 2, 0, 0, 0, 0, 0],
      comparisonCount: 7,
    });
    const cell = screen.getAllByTestId('bf-text-cell')[8];
    expect(cell.getAttribute('data-seen')).toBe('2');
    expect(screen.getByTestId('bf-seen-badge').textContent).toBe('×2');
    expect(screen.getByTestId('bf-status').textContent).toContain('重新扫描');
  });

  it('marks a complete match and keeps both match chips', () => {
    renderSnapshot({
      operation: 'match-found',
      start: 9,
      j: 5,
      compareIndex: 13,
      matched: true,
      nextStart: 10,
      checkedCandidates: 10,
      seen: [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
      comparisonCount: 9,
      matches: [2, 9],
      currentMatchStart: 9,
    });
    expect(screen.getByTestId('bf-match-banner').textContent).toContain('s = 9');
    const chips = screen.getAllByTestId('bf-match-chip');
    expect(chips.map((chip) => chip.getAttribute('data-start'))).toEqual(['2', '9']);
    expect(chips[1].className).toContain('is-current');
    expect(screen.getAllByTestId('bf-text-cell').slice(9, 14).every(
      (cell) => cell.getAttribute('data-tone') === 'found',
    )).toBe(true);
  });

  it('explains the next candidate after a mismatch and disables an out-of-range start', () => {
    renderSnapshot({
      operation: 'mismatch',
      text: 'ABABABCABABABX',
      start: 9,
      j: 4,
      compareIndex: 13,
      matched: false,
      nextStart: 10,
      checkedCandidates: 10,
      seen: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1],
      comparisonCount: 7,
    });
    expect(screen.getByTestId('bf-status').textContent).toContain('整体右移一格');
    expect(screen.getByTestId('bf-status').textContent).toContain('没有合法起点');
  });

  it('renders the empty-text done state without inventing candidates', () => {
    renderSnapshot({
      operation: 'done',
      text: '',
      pattern: 'A',
      seen: [],
      checkedCandidates: 0,
      comparisonCount: 0,
      matches: [],
      currentMatchStart: null,
    });
    expect(screen.getByTestId('bf-status').textContent).toContain('空主串');
    expect(screen.getByTestId('bf-matches').textContent).toContain('空主串');
    expect(screen.queryAllByTestId('bf-match-chip')).toHaveLength(0);
  });
});
