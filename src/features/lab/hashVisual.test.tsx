import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/hash-default-frames.json';
import edgeFrames from '../../test/fixtures/hash-edge-frames.json';
import type { TraceEvent } from '../../domain/trace/schema';
import type { TraceState } from '../../domain/trace/types';
import { I18nProvider } from '../../i18n/I18nProvider';
import { VisualStage } from './VisualStage';

type Frame = { state: TraceState; structure: TraceEvent['structure']; lessonStepId: string };
const defaults = defaultFrames as unknown as Record<'hash-chain' | 'hash-probe', Frame[]>;
const edges = edgeFrames as unknown as Record<'hash-chain' | 'hash-probe', Record<string, Frame[]>>;

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

describe('F2 hash visual', () => {
  it('renders chaining buckets with real nodes, next arrows and a collision badge', () => {
    const frame = defaults['hash-chain'].find(
      (entry) => entry.structure?.kind === 'hash' && entry.structure.operation === 'duplicate',
    )!;
    renderFrame(frame);
    const snapshot = frame.structure as Extract<TraceEvent['structure'], { kind: 'hash' }>;
    expect(screen.getByTestId('hash-visual').getAttribute('data-algorithm')).toBe('chaining');
    expect(screen.getByTestId('hash-operation').textContent).toContain('重复键');
    expect(screen.getByTestId('hash-formula').textContent).toContain('8 % 7 = 1');
    expect(screen.getByTestId('hash-conflict').textContent).toContain('冲突');
    expect(screen.getByTestId('hash-count').textContent).toContain('3 / 7');
    expect(screen.getByTestId('hash-load-factor').textContent).toContain('0.429');
    expect(screen.getAllByTestId('hash-bucket')).toHaveLength(7);
    const nodes = screen.getAllByTestId('hash-node');
    expect(nodes).toHaveLength(3);
    expect(nodes.map((node) => node.getAttribute('data-id'))).toEqual(['n3', 'n2', 'n1']);
    expect(nodes.map((node) => node.getAttribute('data-key'))).toEqual(['15', '8', '1']);
    expect(nodes.map((node) => node.getAttribute('data-position'))).toEqual(['head', 'middle', 'tail']);
    expect(nodes[1]!.getAttribute('data-status')).toBe('duplicate');
    expect(screen.getByTestId('hash-hint').textContent).toContain('键唯一');
    expect(snapshot.buckets[1]!.headId).toBe('n3');
  });

  it('renders a real tail deletion and keeps only the surviving head node', () => {
    const frame = defaults['hash-chain'].find(
      (entry) => entry.structure?.kind === 'hash' && entry.structure.operation === 'delete-tail',
    )!;
    renderFrame(frame);
    expect(screen.getByTestId('hash-operation').textContent).toContain('删除尾节点');
    expect(screen.getByTestId('hash-result').textContent).toContain('已删除');
    expect(screen.getByTestId('hash-removed').textContent).toContain('n1');
    expect(screen.getByTestId('hash-hint').textContent).toContain('前驱');
    const nodes = screen.getAllByTestId('hash-node');
    expect(nodes).toHaveLength(1);
    expect(nodes[0]!.getAttribute('data-id')).toBe('n3');
    expect(screen.getAllByTestId('hash-bucket-empty')).toHaveLength(6);
  });

  it('renders tri-state probing slots and a real probe path across a tombstone', () => {
    const frame = defaults['hash-probe'].find(
      (entry) => entry.structure?.kind === 'hash' && entry.structure.operation === 'found' && entry.structure.key === 15,
    )!;
    renderFrame(frame);
    const slots = screen.getAllByTestId('hash-slot');
    expect(slots).toHaveLength(7);
    expect(slots[2]!.getAttribute('data-state')).toBe('deleted');
    expect(slots[2]!.querySelector('.hash-slot-state')?.textContent).toBe('DELETED');
    expect(slots[3]!.getAttribute('data-state')).toBe('occupied');
    expect(slots[3]!.getAttribute('data-marks')).toContain('current');
    expect(slots[1]!.getAttribute('data-marks')).toContain('probe');
    expect(slots[2]!.getAttribute('data-marks')).toContain('probe');
    const chips = screen.getAllByTestId('hash-probe-chip');
    expect(chips.map((chip) => chip.getAttribute('data-index'))).toEqual(['1', '2', '3']);
    expect(chips.at(-1)!.className).toContain('is-current');
    expect(screen.getByTestId('hash-tombstone-note').textContent).toContain('DELETED');
    expect(screen.getByTestId('hash-result').textContent).toContain('查找成功');
  });

  it('renders empty, deleted and occupied slots differently and marks a reused tombstone', () => {
    const frame = defaults['hash-probe'].find(
      (entry) => entry.structure?.kind === 'hash'
        && entry.structure.operation === 'insert'
        && entry.structure.key === 22
        && entry.structure.reusedDeleted,
    )!;
    renderFrame(frame);
    expect(screen.getByTestId('hash-operation').textContent).toContain('线性探测：写入槽位');
    const slots = screen.getAllByTestId('hash-slot');
    expect(slots[2]!.getAttribute('data-marks')).toContain('reused');
    expect(slots[2]!.getAttribute('data-state')).toBe('occupied');
    expect(slots[2]!.getAttribute('data-key')).toBe('22');
    expect(screen.getByTestId('hash-reuse-note').textContent).toContain('复用 DELETED 槽 2');
    expect(screen.getByTestId('hash-hint').textContent).toContain('优先复用');
    const stateTexts = slots.map((slot) => slot.querySelector('.hash-slot-state')?.textContent ?? '');
    expect(stateTexts).toContain('EMPTY');
    expect(stateTexts).toContain('OCCUPIED');
  });

  it('renders a full table and an explicit insert failure without looping', () => {
    const frame = defaults['hash-probe'].find(
      (entry) => entry.structure?.kind === 'hash' && entry.structure.operation === 'table-full',
    )!;
    renderFrame(frame);
    expect(screen.getByTestId('hash-operation').textContent).toContain('表满');
    expect(screen.getByTestId('hash-result').textContent).toContain('表满');
    expect(screen.getByTestId('hash-conflict').textContent).toContain('冲突');
    expect(screen.getByTestId('hash-hint').textContent).toContain('不能死循环');
    const slots = screen.getAllByTestId('hash-slot');
    expect(slots.every((slot) => slot.getAttribute('data-state') === 'occupied')).toBe(true);
    const chips = screen.getAllByTestId('hash-probe-chip');
    expect(chips.map((chip) => chip.getAttribute('data-index'))).toEqual(['3', '4', '5', '6', '0', '1', '2']);
  });

  it('renders an explicit empty table without inventing nodes or slots', () => {
    const frame = edges['hash-chain'].empty![0]!;
    renderFrame(frame);
    expect(screen.getByTestId('hash-empty-note')).toBeTruthy();
    expect(screen.getAllByTestId('hash-bucket')).toHaveLength(7);
    expect(screen.queryAllByTestId('hash-node')).toHaveLength(0);
    expect(screen.getAllByTestId('hash-bucket-empty')).toHaveLength(7);
  });

  it('keeps the two hash canvases structurally different', () => {
    const chainFrame = defaults['hash-chain'][0]!;
    renderFrame(chainFrame);
    expect(screen.queryByTestId('hash-slots')).toBeNull();
    expect(screen.getByTestId('hash-buckets')).toBeTruthy();

    cleanup();
    const probeFrame = defaults['hash-probe'][0]!;
    renderFrame(probeFrame);
    expect(screen.queryByTestId('hash-buckets')).toBeNull();
    expect(screen.getByTestId('hash-slots')).toBeTruthy();
  });
});
