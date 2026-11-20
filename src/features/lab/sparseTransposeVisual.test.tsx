import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/sparse-transpose-default-frames.json';
import edgeFrames from '../../test/fixtures/sparse-transpose-edge-frames.json';
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

function frameAt(operation: string, sourceIndex?: number): Frame {
  const frame = defaults.find(
    (candidate) =>
      candidate.structure?.kind === 'sparse-transpose' &&
      candidate.structure.operation === operation &&
      (sourceIndex === undefined || candidate.structure.sourceIndex === sourceIndex),
  );
  if (!frame) throw new Error(`missing frame ${operation}/${sourceIndex ?? '*'}`);
  return frame;
}

describe('MATRIX-01 sparse transpose visual', () => {
  it('shows the original matrix, result matrix, triplets and aux table', () => {
    renderFrame(frameAt('count-scan', 1));
    expect(screen.getByTestId('sparse-transpose-visual').getAttribute('data-operation')).toBe(
      'count-scan',
    );
    expect(screen.getAllByTestId('sparse-original-cell')).toHaveLength(20);
    expect(screen.getAllByTestId('sparse-result-cell')).toHaveLength(20);
    expect(screen.getAllByTestId('sparse-source-triples-row')).toHaveLength(6);
    expect(screen.getAllByTestId('sparse-result-triples-row')).toHaveLength(6);
    expect(screen.getAllByTestId('sparse-aux-col')).toHaveLength(5);
    expect(screen.getAllByTestId('sparse-num')).toHaveLength(5);
    expect(screen.getAllByTestId('sparse-cpot')).toHaveLength(5);
    expect(screen.getAllByTestId('sparse-cpot').map((cell) => cell.textContent)).toEqual([
      '—', '—', '—', '—', '—',
    ]);
    expect(screen.getAllByTestId('sparse-num').map((cell) => cell.textContent)).toEqual([
      '1', '0', '1', '0', '0',
    ]);
    // Counting the source triplets must not light a future output slot: no
    // target has been selected until the placement phase begins.
    expect(
      screen
        .getAllByTestId('sparse-result-cell')
        .every((cell) => cell.getAttribute('data-tone') !== 'target'),
    ).toBe(true);

    const sourceCell = screen
      .getAllByTestId('sparse-original-cell')
      .find((cell) => cell.getAttribute('data-row') === '0' && cell.getAttribute('data-col') === '2')!;
    expect(sourceCell.getAttribute('data-tone')).toBe('source');
    expect(sourceCell.getAttribute('data-value')).toBe('7');
    expect(
      screen
        .getAllByTestId('sparse-source-triples-row')
        .find((row) => row.getAttribute('data-index') === '1')!
        .getAttribute('data-tone'),
    ).toBe('source');
  });

  it('shows the source to target slot before the write and fills it after', () => {
    renderFrame(frameAt('place-read', 1));
    expect(screen.getByTestId('sparse-operation').textContent).toContain('cpot[col]');
    expect(screen.getByTestId('sparse-source-chip').textContent).toContain('src #1');
    expect(screen.getByTestId('sparse-source-chip').textContent).toContain('dst #3');
    expect(screen.getByTestId('sparse-written').textContent).toContain('1/6');

    const pending = screen
      .getAllByTestId('sparse-result-cell')
      .find((cell) => cell.getAttribute('data-row') === '2' && cell.getAttribute('data-col') === '0')!;
    expect(pending.getAttribute('data-tone')).toBe('target');
    expect(pending.getAttribute('data-value')).toBe('');
    expect(pending.textContent).toBe('?');
    const targetRow = screen
      .getAllByTestId('sparse-result-triples-row')
      .find((row) => row.getAttribute('data-index') === '3')!;
    expect(targetRow.getAttribute('data-tone')).toBe('target');
    expect(targetRow.getAttribute('data-row')).toBe('2');
    expect(targetRow.getAttribute('data-col')).toBe('0');
    expect(targetRow.getAttribute('data-value')).toBe('');

    cleanup();
    renderFrame(frameAt('place-write', 1));
    expect(screen.getByTestId('sparse-written').textContent).toContain('2/6');
    const filled = screen
      .getAllByTestId('sparse-result-cell')
      .find((cell) => cell.getAttribute('data-row') === '2' && cell.getAttribute('data-col') === '0')!;
    expect(filled.getAttribute('data-tone')).toBe('target');
    expect(filled.getAttribute('data-value')).toBe('7');
    expect(filled.textContent).toBe('7');
  });

  it('marks the updated cpot cursor after the write', () => {
    renderFrame(frameAt('place-update', 1));
    const cpot = screen.getAllByTestId('sparse-cpot');
    expect(cpot[2].textContent).toBe('4');
    const aux = screen.getAllByTestId('sparse-aux-col');
    expect(aux[2].getAttribute('data-active')).toBe('true');
    expect(aux[2].getAttribute('data-updated')).toBe('true');
    expect(cpot[2].className).toContain('is-updated');
  });

  it('renders a complete result table and every final matrix value', () => {
    const final = defaults.at(-1)!;
    renderFrame(final);
    expect(screen.getByTestId('sparse-operation').textContent).toContain('完成');
    expect(screen.getByTestId('sparse-written').textContent).toContain('6/6');
    expect(screen.getAllByTestId('sparse-result-triples-row')).toHaveLength(6);
    const values = screen
      .getAllByTestId('sparse-result-cell')
      .filter((cell) => cell.getAttribute('data-tone') === 'value');
    expect(values).toHaveLength(6);
    expect(screen.getAllByTestId('sparse-result-triples-row').every(
      (row) => row.getAttribute('data-tone') === 'done',
    )).toBe(true);
    expect(screen.getAllByTestId('sparse-source-triples-row').every(
      (row) => row.getAttribute('data-tone') === 'done',
    )).toBe(true);
    expect(screen.getByTestId('sparse-operation').textContent).not.toContain('读取');
  });

  it('keeps the empty matrix free of fake cells and players', () => {
    renderFrame(edges.empty_zero_dims.at(-1)!);
    expect(screen.queryAllByTestId('sparse-original-cell')).toHaveLength(0);
    expect(screen.queryAllByTestId('sparse-result-cell')).toHaveLength(0);
    expect(screen.queryAllByTestId('sparse-source-triples-row')).toHaveLength(0);
    expect(screen.getByTestId('sparse-transpose-visual').textContent).toBeTruthy();
    expect(screen.queryByTestId('sparse-transpose-player')).toBeNull();
    expect(screen.getByTestId('sparse-written').textContent).toContain('0/0');
    expect(screen.getAllByTestId('sparse-aux').length).toBe(1);
  });
});
