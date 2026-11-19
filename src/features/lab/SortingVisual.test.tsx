import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/sorting-default-frames.json';
import rawEdge from '../../test/fixtures/sorting-edge-frames.json';
import { I18nProvider } from '../../i18n/I18nProvider';
import type { TraceEvent } from '../../domain/trace/schema';
import type { TraceState } from '../../domain/trace/types';
import { VisualStage } from './VisualStage';

type Frame = { state: TraceState; structure: TraceEvent['structure']; lessonStepId: string };
const defaults = rawDefault as unknown as Record<string, Frame[]>;
const edges = rawEdge as unknown as Record<string, Record<string, Frame[]>>;

function frameAt(algorithm: string, predicate: (frame: Frame) => boolean): Frame {
  const frame = defaults[algorithm]!.find(predicate);
  if (!frame) throw new Error(`missing ${algorithm} frame`);
  return frame;
}

function renderFrame(frame: Frame, step = 0) {
  const event = {
    schemaVersion: 1,
    step,
    eventType: 'step',
    visualType: 'array',
    state: frame.state,
    message: '',
    lessonStepId: frame.lessonStepId,
    structure: frame.structure,
  } as TraceEvent;
  return render(
    <I18nProvider>
      <VisualStage event={event} />
    </I18nProvider>,
  );
}

function bars(): HTMLElement[] {
  return screen.getAllByTestId('sorting-bar');
}

describe('SortingVisual — one shared array renderer', () => {
  it('renders selection compare / candidate / sorted marks from the real frame', () => {
    const frame = frameAt('selection', (value) => value.structure?.kind === 'sorting' && value.structure.operation === 'select-candidate');
    renderFrame(frame);
    expect(screen.getByTestId('sorting-visual').getAttribute('data-algorithm')).toBe('selection');
    expect(screen.getByTestId('sorting-visual').getAttribute('data-phase')).toBe('candidate');
    expect(bars().map((bar) => bar.getAttribute('data-value'))).toEqual(
      (frame.state.values as number[]).map(String),
    );
    const candidate = frame.structure!.kind === 'sorting' ? frame.structure.candidate : null;
    expect(bars()[candidate!]!.getAttribute('data-candidate')).toBe('true');
    expect(bars()[candidate!]!.getAttribute('data-marks')).toContain('candidate');
    expect(screen.getByTestId('sorting-candidate')).toBeTruthy();
    expect(screen.getByTestId('sorting-operation').textContent).toContain('最小候选');
  });

  it('renders insertion shift as a real duplicate with source and target marks', () => {
    const frame = frameAt('insertion', (value) => value.structure?.kind === 'sorting' && value.structure.operation === 'insert-shift');
    renderFrame(frame);
    expect(screen.getByTestId('sorting-key')).toBeTruthy();
    const shifted = frame.structure!.kind === 'sorting' ? frame.structure.shifted : null;
    expect(bars()[shifted!.from]!.getAttribute('data-shift-source')).toBe('true');
    expect(bars()[shifted!.to]!.getAttribute('data-shift-target')).toBe('true');
    expect(bars()[shifted!.from]!.getAttribute('data-value')).toBe(bars()[shifted!.to]!.getAttribute('data-value'));
    expect(screen.getByTestId('sorting-operation').textContent).toContain('右移');
  });

  it('shows the current gap, lane and key for Shell sort', () => {
    const frame = frameAt('shell', (value) => value.structure?.kind === 'sorting' && value.structure.operation === 'shell-compare' && value.structure.gap === 4);
    renderFrame(frame);
    expect(screen.getByTestId('sorting-gap').textContent).toContain('4');
    expect(screen.getByTestId('sorting-lane')).toBeTruthy();
    expect(screen.getByTestId('sorting-key')).toBeTruthy();
    expect(screen.getByTestId('sorting-meta').textContent).toContain('4 → 2 → 1');
    for (const bar of bars()) {
      const index = Number(bar.getAttribute('data-index'));
      if (index % 4 === 0 && index !== (frame.structure!.kind === 'sorting' ? frame.structure.compare : -1)) {
        expect(bar.getAttribute('data-lane')).toBe('true');
      }
    }
  });

  it('renders an explicit empty state without inventing bars', () => {
    const frame = edges.empty.selection!.at(-1)!;
    renderFrame(frame);
    expect(screen.getByTestId('sorting-empty')).toBeTruthy();
    expect(screen.queryAllByTestId('sorting-bar')).toHaveLength(0);
    expect(screen.getByTestId('sorting-visual').getAttribute('data-empty')).toBe('true');
  });
});
