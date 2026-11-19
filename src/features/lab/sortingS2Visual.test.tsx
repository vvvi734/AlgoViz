import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/sorting-s2-default-frames.json';
import edgeFrames from '../../test/fixtures/sorting-s2-edge-frames.json';
import type { TraceEvent } from '../../domain/trace/schema';
import type { TraceState } from '../../domain/trace/types';
import { I18nProvider } from '../../i18n/I18nProvider';
import { VisualStage } from './VisualStage';

type Frame = { state: TraceState; structure: TraceEvent['structure']; lessonStepId: string };
const defaults = defaultFrames as unknown as Record<'quick' | 'merge', Frame[]>;
const edges = edgeFrames as unknown as Record<string, Record<'quick' | 'merge', Frame[]>>;

function renderFrame(frame: Frame) {
  return render(
    <I18nProvider>
      <VisualStage
        event={{
          schemaVersion: 1,
          step: 0,
          eventType: 'step',
          visualType: 'array',
          state: frame.state,
          message: '',
          lessonStepId: frame.lessonStepId,
          structure: frame.structure,
        } as TraceEvent}
      />
    </I18nProvider>,
  );
}

describe('S2 divide-and-conquer sorting visuals', () => {
  it('renders the real quick range, pivot, boundary, finalized slots and placed swap', () => {
    const frame = defaults.quick.find((entry) => entry.structure?.kind === 'sorting' && entry.structure.operation === 'quick-place')!;
    renderFrame(frame);
    const snapshot = frame.structure as Extract<TraceEvent['structure'], { kind: 'sorting' }>;
    expect(screen.getByTestId('sorting-visual').getAttribute('data-algorithm')).toBe('quick');
    expect(screen.getByTestId('sorting-visual').getAttribute('data-phase')).toBe('place');
    expect(screen.getByTestId('sorting-range').textContent).toContain(`[${snapshot.range!.low}, ${snapshot.range!.high}]`);
    expect(screen.getByTestId('sorting-pivot').textContent).toContain(`p${snapshot.pivot}`);
    expect(screen.getByTestId('sorting-boundary').textContent).toContain(`i = ${snapshot.boundary}`);
    expect(screen.getByTestId('sorting-swap').textContent).toContain(`p${snapshot.swapped![0]} ⇄ p${snapshot.swapped![1]}`);
    const bars = screen.getAllByTestId('sorting-bar');
    expect(bars[snapshot.pivot!]!.getAttribute('data-pivot')).toBe('true');
    expect(bars[snapshot.pivot!]!.getAttribute('data-final')).toBe('true');
    expect(bars[snapshot.insertedAt!]!.getAttribute('data-swap')).toBe('true');
    for (const index of snapshot.finalized) {
      expect(bars[index]!.getAttribute('data-final')).toBe('true');
    }
  });

  it('renders a real merge buffer, left/right candidates and a real write target', () => {
    const frame = defaults.merge.find((entry) => entry.structure?.kind === 'sorting' && entry.structure.operation === 'merge-write')!;
    renderFrame(frame);
    const snapshot = frame.structure as Extract<TraceEvent['structure'], { kind: 'sorting' }>;
    const buffer = screen.getByTestId('sorting-buffer');
    expect(buffer.getAttribute('data-length')).toBe(String(snapshot.buffer.length));
    expect(screen.getByTestId('sorting-left').textContent).toContain(`p${snapshot.left}`);
    expect(screen.getByTestId('sorting-right').textContent).toContain(`p${snapshot.right}`);
    const slots = screen.getAllByTestId('sorting-buffer-slot');
    expect(slots).toHaveLength(snapshot.range!.high - snapshot.range!.low + 1);
    expect(slots[snapshot.bufferWrite!.index]!.getAttribute('data-value')).toBe(String(snapshot.bufferWrite!.value));
    expect(slots[snapshot.bufferWrite!.index]!.getAttribute('data-written')).toBe('true');
    const bars = screen.getAllByTestId('sorting-bar');
    expect(bars[snapshot.bufferWrite!.source]!.getAttribute('data-marks')).toContain('buffer-source');
    expect(screen.getByTestId('sorting-operation').textContent).toContain('缓冲区');
  });

  it('renders a real merge write-back slot and keeps the finalized range visible', () => {
    const frame = defaults.merge.find((entry) => entry.structure?.kind === 'sorting' && entry.structure.operation === 'merge-writeback')!;
    renderFrame(frame);
    const snapshot = frame.structure as Extract<TraceEvent['structure'], { kind: 'sorting' }>;
    const bars = screen.getAllByTestId('sorting-bar');
    expect(screen.getByTestId('sorting-visual').getAttribute('data-phase')).toBe('writeback');
    expect(bars[snapshot.writeAt!]!.getAttribute('data-marks')).toContain('write-target');
    expect(bars[snapshot.writeAt!]!.getAttribute('data-value')).toBe(String(snapshot.buffer[snapshot.writeAt! - snapshot.range!.low]));
    expect(screen.getByTestId('sorting-merged-ranges').textContent).toContain(`[${snapshot.range!.low}, ${snapshot.split}]`);
  });

  it('renders an explicit empty quick/merge frame without inventing bars', () => {
    const frame = edges.empty!.merge[0]!;
    renderFrame(frame);
    expect(screen.getByTestId('sorting-empty')).toBeTruthy();
    expect(screen.queryAllByTestId('sorting-bar')).toHaveLength(0);
    expect(screen.getByTestId('sorting-visual').getAttribute('data-algorithm')).toBe('merge');
  });
});
