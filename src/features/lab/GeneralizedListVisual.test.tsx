import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { generalizedListSnapshotSchema } from '../../domain/trace/generalizedListSchema';
import { buildGeneralizedListModel } from '../../domain/visualization/glModel';
import fixture from '../../test/fixtures/generalized-list-python-frames.json';
import type { RawTraceFrame } from '../../domain/trace/types';
import { GeneralizedListVisual } from './GeneralizedListVisual';

afterEach(cleanup);

const scenarios = fixture as unknown as Record<string, RawTraceFrame[]>;

function renderStep(expression: string, step: string) {
  const frame = scenarios[expression]!.find((item) => item.lessonStepId === step);
  expect(frame, `${expression}/${step}`).toBeTruthy();
  const snapshot = generalizedListSnapshotSchema.parse(frame!.structure);
  const model = buildGeneralizedListModel(snapshot);
  render(
    <I18nProvider>
      <GeneralizedListVisual model={model} />
    </I18nProvider>,
  );
  return { snapshot, model };
}

describe('generalized-list visual', () => {
  it('shows the original tree, depth ledger and live formula while descending', () => {
    const { snapshot, model } = renderStep('depth-default', 'enter');
    const visual = screen.getByTestId('gl-visual');
    expect(visual.dataset.mode).toBe('depth');
    expect(visual.dataset.operation).toBe('enter');
    expect(visual.dataset.active).toBe(snapshot.activeId);
    expect(screen.queryByTestId('gl-copy-panel')).toBeNull();
    expect(screen.getAllByTestId(/gl-node-n/)).toHaveLength(9);
    expect(screen.queryAllByTestId(/gl-depth-row-n/)).toHaveLength(0);
    expect(screen.getByTestId('gl-depth-ledger').textContent).toContain('还没有');
    expect(screen.getByTestId(`gl-node-${snapshot.activeId}`).dataset.tone).toBe('active');
    expect(screen.getByTestId('gl-level').textContent).toContain(String(model.depthLevel));
    cleanup();

    const returned = renderStep('depth-default', 'return');
    expect(screen.getAllByTestId(/gl-depth-row-n/).length).toBeGreaterThan(0);
    expect(screen.getByTestId('gl-depth-formula').textContent).toContain(String(returned.model.maxChildDepth));
  });

  it('shows atom-return depth 0 and the final depth 3', () => {
    renderStep('depth-default', 'atom-return');
    expect(screen.getByTestId('gl-operation').textContent).toContain('0');
    expect(screen.getAllByTestId(/gl-depth-n/).length).toBeGreaterThan(0);
    cleanup();

    renderStep('depth-default', 'done');
    expect(screen.getByTestId('gl-visual').dataset.resultDepth).toBe('3');
    expect(screen.getByTestId('gl-result-depth').textContent).toContain('3');
    expect(screen.getByTestId('gl-done-banner').textContent).toContain('3');
    expect(screen.getByTestId('gl-depth-n0').textContent).toContain('3');
  });

  it('shows an empty copy tree before allocation and a linked copy node afterwards', () => {
    renderStep('copy-default', 'enter');
    expect(screen.getByTestId('gl-visual').dataset.mode).toBe('copy');
    expect(screen.getByTestId('gl-copy-panel')).toBeTruthy();
    expect(screen.getByTestId('gl-copy-empty')).toBeTruthy();
    cleanup();

    renderStep('copy-default', 'alloc-list');
    expect(screen.queryByTestId('gl-copy-empty')).toBeNull();
    expect(screen.getAllByTestId(/gl-node-c/)).toHaveLength(1);
    expect(screen.getByTestId('gl-node-c0').getAttribute('data-source')).toBe('n0');
    expect(screen.getByTestId('gl-copied-count').textContent).toContain('1');
  });

  it('shows two structurally equivalent trees of nine nodes after copying', () => {
    renderStep('copy-default', 'done');
    const visual = screen.getByTestId('gl-visual');
    expect(visual.dataset.copied).toBe('9');
    expect(screen.getByTestId('gl-done-banner').textContent).toContain('(a,(b,c),((d),e))');
    expect(screen.getAllByTestId(/gl-node-n/)).toHaveLength(9);
    expect(screen.getAllByTestId(/gl-node-c/)).toHaveLength(9);
    expect(screen.getByTestId('gl-node-c0').getAttribute('data-tone')).toBe('copied');
    expect(screen.getByTestId('gl-node-c1').getAttribute('data-tone')).toBe('copied');
  });
});
