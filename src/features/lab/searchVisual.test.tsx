import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/search-default-frames.json';
import edgeFrames from '../../test/fixtures/search-edge-frames.json';
import type { TraceEvent } from '../../domain/trace/schema';
import type { TraceState } from '../../domain/trace/types';
import { I18nProvider } from '../../i18n/I18nProvider';
import { VisualStage } from './VisualStage';

type Frame = { state: TraceState; structure: TraceEvent['structure']; lessonStepId: string };
const defaults = defaultFrames as unknown as Record<'linear' | 'binary', Frame[]>;
const edges = edgeFrames as unknown as Record<'linear' | 'binary', Record<string, Frame[]>>;

afterEach(cleanup);

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

describe('F1 search visual', () => {
  it('renders a real linear comparison with checked, current and pending slots', () => {
    const frame = defaults.linear.find(
      (entry) => entry.structure?.kind === 'search' && entry.structure.operation === 'scan-compare' && entry.structure.index === 2,
    )!;
    renderFrame(frame);
    const snapshot = frame.structure as Extract<TraceEvent['structure'], { kind: 'search' }>;
    expect(screen.getByTestId('search-visual').getAttribute('data-algorithm')).toBe('linear');
    expect(screen.getByTestId('search-operation').textContent).toContain('比较当前元素');
    expect(screen.getByTestId('search-target').textContent).toContain('7');
    expect(screen.getByTestId('search-checked-count').textContent).toContain('2 / 6');
    expect(screen.getByTestId('search-hint').textContent).toContain('当前元素');
    const bars = screen.getAllByTestId('search-bar');
    expect(bars).toHaveLength(6);
    expect(bars[0]!.getAttribute('data-marks')).toContain('checked');
    expect(bars[1]!.getAttribute('data-marks')).toContain('checked');
    expect(bars[2]!.getAttribute('data-marks')).toContain('current');
    expect(bars[3]!.getAttribute('data-marks')).toContain('pending');
    expect(bars[2]!.getAttribute('data-value')).toBe(String(snapshot.elements[2]!.value));
  });

  it('highlights the found linear slot and reports its index', () => {
    const frame = defaults.linear.at(-1)!;
    renderFrame(frame);
    const snapshot = frame.structure as Extract<TraceEvent['structure'], { kind: 'search' }>;
    expect(screen.getByTestId('search-operation').textContent).toContain('找到目标');
    expect(screen.getByTestId('search-result').textContent).toContain(`索引 ${snapshot.result}`);
    const bars = screen.getAllByTestId('search-bar');
    expect(bars[4]!.getAttribute('data-marks')).toContain('found');
    for (let index = 0; index < 4; index += 1) {
      expect(bars[index]!.getAttribute('data-marks')).toContain('checked');
    }
  });

  it('renders live L/R/MID boundaries and a derived excluded half', () => {
    const midFrame = defaults.binary[1]!;
    renderFrame(midFrame);
    const midSnapshot = midFrame.structure as Extract<TraceEvent['structure'], { kind: 'search' }>;
    expect(screen.getByTestId('search-left').textContent).toContain('L = 0');
    expect(screen.getByTestId('search-right').textContent).toContain('R = 6');
    expect(screen.getByTestId('search-mid').textContent).toContain('MID = 3');
    expect(screen.getByTestId('search-range').textContent).toContain('[0, 6]');
    let bars = screen.getAllByTestId('search-bar');
    expect(bars[3]!.getAttribute('data-marks')).toContain('mid');
    expect(bars[3]!.getAttribute('data-marks')).toContain('range');
    expect(bars[0]!.getAttribute('data-marks')).toContain('left');
    expect(bars[6]!.getAttribute('data-marks')).toContain('right');
    expect(bars.every((bar) => !bar.getAttribute('data-marks')!.includes('excluded'))).toBe(true);

    const excludeFrame = defaults.binary.find(
      (entry) => entry.structure?.kind === 'search' && entry.structure.operation === 'binary-exclude-left',
    )!;
    cleanup();
    renderFrame(excludeFrame);
    const excludeSnapshot = excludeFrame.structure as Extract<TraceEvent['structure'], { kind: 'search' }>;
    bars = screen.getAllByTestId('search-bar');
    expect(screen.getByTestId('search-left').textContent).toContain(`L = ${excludeSnapshot.left}`);
    expect(bars[0]!.getAttribute('data-marks')).toContain('excluded');
    expect(bars[3]!.getAttribute('data-marks')).toContain('excluded');
    expect(bars[4]!.getAttribute('data-marks')).toContain('range');
    expect(screen.getByTestId('search-excluded-count').textContent).toContain(
      `${excludeSnapshot.elements.length - (excludeSnapshot.range!.high - excludeSnapshot.range!.low + 1)} / 7`,
    );
    expect(screen.getByTestId('search-mid').textContent).toContain(`MID = ${midSnapshot.mid}`);
  });

  it('renders binary success at mid and failure after left > right', () => {
    const foundFrame = defaults.binary.at(-1)!;
    renderFrame(foundFrame);
    const found = foundFrame.structure as Extract<TraceEvent['structure'], { kind: 'search' }>;
    expect(screen.getByTestId('search-result').textContent).toContain(`索引 ${found.result}`);
    const foundBars = screen.getAllByTestId('search-bar');
    expect(foundBars[found.result!]!.getAttribute('data-marks')).toContain('found');
    expect(screen.getByTestId('search-mid').textContent).toContain(`MID = ${found.mid}`);

    const failFrame = edges.binary.missing!.at(-1)!;
    cleanup();
    renderFrame(failFrame);
    const fail = failFrame.structure as Extract<TraceEvent['structure'], { kind: 'search' }>;
    expect(screen.getByTestId('search-result').textContent).toContain('-1');
    expect(screen.getByTestId('search-range-empty')).toBeTruthy();
    expect(screen.getByTestId('search-left').textContent).toContain(`L = ${fail.left}`);
    expect(screen.getByTestId('search-right').textContent).toContain(`R = ${fail.right}`);
    expect(screen.getByTestId('search-excluded-count').textContent).toContain('4 / 4');
  });

  it('shows an explicit unsorted warning without fake binary progress', () => {
    const frame = edges.binary.unsorted![0]!;
    renderFrame(frame);
    expect(screen.getByTestId('search-invalid').textContent).toContain('不是升序');
    expect(screen.getByTestId('search-visual').getAttribute('data-phase')).toBe('invalid');
    expect(screen.getByTestId('search-visual').getAttribute('data-excluded-count')).toBe('0');
    expect(screen.queryByTestId('search-range')).toBeNull();
    expect(screen.queryByTestId('search-left')).toBeNull();
    expect(screen.queryByTestId('search-mid')).toBeNull();
  });

  it('renders an explicit empty search state without inventing bars', () => {
    const frame = edges.linear.empty![0]!;
    renderFrame(frame);
    expect(screen.getByTestId('search-empty')).toBeTruthy();
    expect(screen.queryAllByTestId('search-bar')).toHaveLength(0);
    expect(screen.getByTestId('search-visual').getAttribute('data-algorithm')).toBe('linear');
  });
});
