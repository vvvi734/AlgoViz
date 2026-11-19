import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import type { Lesson } from '../../domain/lessons/types';
import type { TraceEvent } from '../../domain/trace/schema';
import { LearningRail } from './LearningRail';

const lesson: Lesson = {
  lessonId: 'dijkstra-test',
  algorithmId: 'dijkstra',
  contentVersion: '1',
  title: { zh: 'Dijkstra 最短路径', en: 'Dijkstra shortest path' },
  oneLiner: { zh: '单源最短路。', en: 'Single-source shortest path.' },
  overview: { zh: '按距离逐步确定最短路径。', en: 'Settle shortest distances one by one.' },
  intuition: { zh: '每次取出未确定节点中距离最小者并松弛它的出边。', en: 'Take the closest unsettled node and relax its edges.' },
  prerequisites: { zh: ['边权非负'], en: ['Non-negative edge weights'] },
  complexity: {
    time: 'O((V+E) log V)',
    space: 'O(V)',
    note: { zh: '优先队列优化。', en: 'Priority-queue implementation.' },
  },
  steps: [
    {
      stepId: 'relax',
      title: { zh: '松弛出边', en: 'Relax outgoing edges' },
      explanation: { zh: '用更短的候选距离更新邻居。', en: 'Update neighbours with a shorter candidate.' },
    },
    {
      stepId: 'done',
      title: { zh: '完成', en: 'Done' },
      explanation: { zh: '所有节点距离已确定。', en: 'Every distance is settled.' },
    },
  ],
  commonMistakes: { zh: ['忽略非负权条件'], en: ['Ignoring non-negative weights'] },
};

function event(
  step: number,
  lessonStepId: string,
  message: string,
  variables: { name: string; type: string; value: unknown }[],
): TraceEvent {
  return {
    schemaVersion: 1,
    step,
    eventType: 'step',
    visualType: 'graph',
    state: { type: 'graph' },
    message,
    variables,
    lessonStepId,
  } as unknown as TraceEvent;
}

const events = [
  event(0, 'relax', '初始化距离表：dist[A]=0，其余为 ∞。', [
    { name: 'dist', type: 'dict', value: { A: 0, B: null, E: null } },
  ]),
  event(1, 'done', '松弛 B→E：dist[E] 从 ∞ 更新为 3。', [
    { name: 'dist', type: 'dict', value: { A: 0, B: 2, E: 3 } },
    { name: 'u', type: 'str', value: 'B' },
  ]),
];

function renderRail(currentEvent: TraceEvent | undefined, eventsList = events, index = 1) {
  const onSeek = vi.fn();
  const onSelectFrame = vi.fn();
  render(
    <I18nProvider>
      <LearningRail
        algorithmId="dijkstra"
        lesson={lesson}
        events={eventsList}
        index={index}
        currentEvent={currentEvent}
        selectedFrameId={null}
        onSelectFrame={onSelectFrame}
        onSeek={onSeek}
      />
    </I18nProvider>,
  );
  return { onSeek, onSelectFrame };
}

describe('UX-SIMPLIFY-02 LearningRail', () => {
  it('shows key state and one current operation from the current frame', () => {
    renderRail(events[1]);
    expect(screen.getByTestId('key-state')).toBeTruthy();
    expect(screen.getByTestId('lesson-title').textContent).toContain('Dijkstra');
    expect(screen.getByTestId('variables-watch').textContent).toContain('dist');
    expect(screen.getByTestId('current-step-title')).toBeTruthy();
    expect(screen.getByTestId('current-step-message').textContent).toContain('dist[E]');
    expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('done');
  });

  it('keeps stage jumps compact and seeks to a real linked frame', () => {
    const { onSeek } = renderRail(events[1]);
    const jumps = screen.getByTestId('rail-stage-jumps');
    expect(jumps.querySelectorAll('button')).toHaveLength(2);
    expect(screen.getByTestId('lesson-step-done').dataset.active).toBe('true');
    expect(screen.getByTestId('lesson-step-relax').dataset.active).toBe('false');
    fireEvent.click(screen.getByTestId('lesson-step-relax'));
    expect(onSeek).toHaveBeenCalledWith(0);
  });

  it('does not render an empty call stack card for algorithms without one', () => {
    renderRail(events[1]);
    expect(screen.queryByTestId('call-stack-panel')).toBeNull();
  });

  it('renders the real call stack only while the frame has frames', () => {
    const recursive = {
      ...events[1],
      callStack: [
        { name: 'fact', frameId: 'f1', depth: 0 },
        { name: 'fact', frameId: 'f2', depth: 1 },
      ],
    } as unknown as TraceEvent;
    const { onSelectFrame } = renderRail(recursive, [recursive], 0);
    expect(screen.getByTestId('call-stack-panel')).toBeTruthy();
    expect(screen.getByTestId('call-frame-f2')).toBeTruthy();
    fireEvent.click(screen.getByTestId('call-frame-f2'));
    expect(onSelectFrame).toHaveBeenCalledWith('f2');
  });

  it('uses the unlinked state when no frame carries a course step', () => {
    const unlinked = { ...events[1], lessonStepId: undefined } as unknown as TraceEvent;
    renderRail(unlinked, [unlinked], 0);
    expect(screen.queryByTestId('lesson-active-step')).toBeNull();
    expect(screen.getByTestId('lesson-unlinked')).toBeTruthy();
    expect(screen.getByTestId('lesson-unlinked').textContent).toContain('dist[E]');
  });
});
