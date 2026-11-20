import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/kmp-default-frames.json';
import edgeFrames from '../../test/fixtures/kmp-edge-frames.json';
import type { TraceEvent } from '../../domain/trace/schema';
import type { TraceState } from '../../domain/trace/types';
import { I18nProvider } from '../../i18n/I18nProvider';
import { VisualStage } from './VisualStage';

type Frame = { state: TraceState; structure: TraceEvent['structure']; lessonStepId: string };
const defaults = defaultFrames as unknown as Frame[];
const edges = edgeFrames as unknown as Record<string, Frame[]>;

afterEach(cleanup);

function eventFor(frame: Frame): TraceEvent {
  return {
    schemaVersion: 1,
    step: 0,
    eventType: 'step',
    visualType: 'array',
    state: frame.state,
    message: '',
    lessonStepId: frame.lessonStepId,
    structure: frame.structure,
  } as TraceEvent;
}

function renderFrame(frame: Frame) {
  return render(
    <I18nProvider>
      <VisualStage event={eventFor(frame)} />
    </I18nProvider>,
  );
}

function frameAt(operation: string, index = 0): Frame {
  const matches = defaults.filter((frame) => frame.structure?.kind === 'kmp' && frame.structure.operation === operation);
  const frame = matches[index];
  if (!frame) throw new Error(`missing frame ${operation}/${index}`);
  return frame;
}

describe('STR-01 KMP visual', () => {
  it('renders phase A with pattern cells, real lps values and pending entries', () => {
    const start = frameAt('build-start');
    renderFrame(start);
    expect(screen.getByTestId('kmp-visual').getAttribute('data-phase')).toBe('build');
    expect(screen.getByTestId('kmp-operation').textContent).toContain('lps[0]');
    expect(screen.getAllByTestId('kmp-pattern-cell')).toHaveLength(5);
    expect(screen.getAllByTestId('kmp-lps-cell')).toHaveLength(5);
    expect(screen.getAllByTestId('kmp-lps-cell').map((cell) => cell.getAttribute('data-value'))).toEqual([
      '0', '', '', '', '',
    ]);
    expect(screen.getByTestId('kmp-i').textContent).toContain('1');
    expect(screen.getByTestId('kmp-j').textContent).toContain('0');
  });

  it('shows a complete lps table and the recorded value on build-record', () => {
    renderFrame(frameAt('build-complete'));
    expect(screen.getByTestId('kmp-visual').getAttribute('data-lps-ready')).toBe('5');
    expect(screen.getAllByTestId('kmp-lps-cell').map((cell) => cell.getAttribute('data-value'))).toEqual([
      '0', '0', '1', '2', '0',
    ]);
    expect(screen.getAllByTestId('kmp-pattern-cell').map((cell) => cell.getAttribute('data-char'))).toEqual([
      'A', 'B', 'A', 'B', 'C',
    ]);

    cleanup();
    const records = defaults.filter(
      (frame) => frame.structure?.kind === 'kmp' && frame.structure.operation === 'build-record',
    );
    renderFrame(records[1]!);
    expect(screen.getByTestId('kmp-visual').getAttribute('data-operation')).toBe('build-record');
    expect(screen.getAllByTestId('kmp-lps-cell')[2].getAttribute('data-value')).toBe('1');
  });

  it('uses the exact lps fallback formula and highlights the compared cells', () => {
    renderFrame(frameAt('build-fallback'));
    const visual = screen.getByTestId('kmp-visual');
    expect(visual.getAttribute('data-fallback-from')).toBe('2');
    expect(visual.getAttribute('data-fallback-to')).toBe('0');
    expect(screen.getByTestId('kmp-fallback').textContent).toContain('j = lps[2 - 1] = 0');
    expect(screen.getAllByTestId('kmp-pattern-cell')[2].getAttribute('data-tone')).toBe('fallback');
    expect(screen.getAllByTestId('kmp-pattern-cell')[0].getAttribute('data-tone')).toBe('compare');
  });

  it('renders phase B text and pattern, live i/j, realignment and a non-backtracking mismatch', () => {
    const fallback = defaults.find(
      (frame) => frame.structure?.kind === 'kmp' && frame.structure.operation === 'search-fallback',
    )!;
    renderFrame(fallback);
    const visual = screen.getByTestId('kmp-visual');
    expect(visual.getAttribute('data-phase')).toBe('search');
    expect(visual.getAttribute('data-i')).toBe('4');
    expect(visual.getAttribute('data-j')).toBe('2');
    expect(visual.getAttribute('data-alignment')).toBe('2');
    expect(screen.getByTestId('kmp-i').textContent).toContain('4');
    expect(screen.getByTestId('kmp-j').textContent).toContain('2');
    expect(screen.getByTestId('kmp-fallback').textContent).toContain('j = lps[4 - 1] = 2');
    expect(screen.getByTestId('kmp-fallback').textContent).toContain('i = 4');
    expect(screen.getByTestId('kmp-fallback').textContent).toContain('不回退');
    expect(screen.getAllByTestId('kmp-text-cell')).toHaveLength(14);
    expect(screen.getAllByTestId('kmp-text-cell')[4].getAttribute('data-tone')).toBe('mismatch');
    expect(screen.getAllByTestId('kmp-search-pattern-cell')[2].getAttribute('data-tone')).toBe('compare');
    expect(screen.getAllByTestId('kmp-search-pattern-cell')[4].getAttribute('data-tone')).toBe('fallback');
  });

  it('marks the found range and continues to a second, overlapping-capable match', () => {
    renderFrame(frameAt('match-found', 0));
    expect(screen.getByTestId('kmp-match-banner').textContent).toContain('s = 2');
    expect(screen.getAllByTestId('kmp-match-chip')).toHaveLength(1);
    expect(screen.getAllByTestId('kmp-text-cell').slice(2, 7).every(
      (cell) => cell.getAttribute('data-tone') === 'found',
    )).toBe(true);
    expect(screen.getAllByTestId('kmp-search-pattern-cell').every(
      (cell) => cell.getAttribute('data-tone') === 'found',
    )).toBe(true);

    cleanup();
    renderFrame(frameAt('match-found', 1));
    const chips = screen.getAllByTestId('kmp-match-chip');
    expect(chips.map((chip) => chip.getAttribute('data-start'))).toEqual(['2', '9']);
    expect(chips[1].className).toContain('is-current');
  });

  it('keeps chips and highlights synchronized after jumps between phases and the final frame', () => {
    renderFrame(frameAt('build-compare', 0));
    expect(screen.getAllByTestId('kmp-lps-cell').map((cell) => cell.getAttribute('data-value'))).toEqual([
      '0', '', '', '', '',
    ]);

    cleanup();
    renderFrame(defaults.at(-1)!);
    const final = screen.getByTestId('kmp-visual');
    expect(final.getAttribute('data-operation')).toBe('search-done');
    expect(final.getAttribute('data-match-count')).toBe('2');
    expect(final.getAttribute('data-matches')).toBe('2,9');
    expect(screen.getAllByTestId('kmp-match-chip')).toHaveLength(2);
    expect(screen.getAllByTestId('kmp-text-cell').slice(9, 14).every(
      (cell) => cell.getAttribute('data-tone') === 'found',
    )).toBe(true);
  });

  it('renders the compared character on a j=0 miss and explains the i advance', () => {
    const miss = edges.no_match!.find(
      (frame) => frame.structure?.kind === 'kmp' && frame.structure.operation === 'search-miss',
    )!;
    renderFrame(miss);
    expect(screen.getAllByTestId('kmp-text-cell')[0].getAttribute('data-tone')).toBe('mismatch');
    expect(screen.getByTestId('kmp-operation').textContent).toContain('i 前进');
  });
});
