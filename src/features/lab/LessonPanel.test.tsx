import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { bubbleSortLesson } from '../../domain/lessons/bubbleSort';
import { factorialLesson } from '../../domain/lessons/factorial';
import type { TraceEvent } from '../../domain/trace/schema';
import { LessonPanel } from './LessonPanel';

function event(step: number, lessonStepId?: string, extra: Partial<TraceEvent> = {}): TraceEvent {
  return {
    schemaVersion: 1,
    step,
    eventType: 'step',
    visualType: 'array',
    state: { type: 'array', values: [step] },
    message: `FRAME ${step}`,
    ...(lessonStepId ? { lessonStepId } : {}),
    ...extra,
  };
}

/** Real bubble shape: compare/swap repeat across passes, no `ghost` frames. */
const run: TraceEvent[] = [
  event(0, 'init', { message: '开始 / Start' }),
  event(1, 'compare', { message: '比较 / Compare 1' }),
  event(2, 'swap', { message: '交换 / Swap 1' }),
  event(3, 'compare', { message: '比较 / Compare 2' }),
  event(4, 'swap', { message: '交换 / Swap 2' }),
  event(5, 'pass', { message: '完成一轮 / Pass complete' }),
  event(6, 'compare', { message: '比较 / Compare 3' }),
  event(7, 'done', { message: '排序完成 / Sorted' }),
];

function renderPanel(options: {
  lesson?: typeof bubbleSortLesson | undefined;
  events?: TraceEvent[];
  index?: number;
  currentEvent?: TraceEvent;
  onSeek?: (index: number) => void;
} = {}) {
  const events = options.events ?? run;
  const index = options.index ?? 0;
  return render(
    <I18nProvider>
      <LessonPanel
        lesson={'lesson' in options ? options.lesson : bubbleSortLesson}
        events={events}
        index={index}
        currentEvent={options.currentEvent ?? events[index]}
        onSeek={options.onSeek ?? vi.fn()}
      />
    </I18nProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  window.localStorage.clear();
});

describe('LessonPanel (Stage 3B)', () => {
  it('renders course copy from data, with the content version', () => {
    renderPanel();
    expect(screen.getByTestId('lesson-title').textContent).toBe(bubbleSortLesson.title.zh);
    expect(screen.getByTestId('lesson-version').textContent).toBe(`v${bubbleSortLesson.contentVersion}`);
    expect(screen.getByTestId('lesson-oneliner').textContent).toBe(bubbleSortLesson.oneLiner.zh);
    expect(screen.getByTestId('lesson-overview').textContent).toContain(bubbleSortLesson.intuition.zh);
    // All five teaching stages are listed.
    for (const step of bubbleSortLesson.steps) {
      expect(screen.getByTestId(`lesson-step-${step.stepId}`)).toBeTruthy();
    }
  });

  it('highlights the step the current frame recorded', () => {
    renderPanel({ index: 3 });
    expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('compare');
    expect(screen.getByTestId('lesson-step-compare').dataset.active).toBe('true');
    expect(screen.getByTestId('lesson-step-swap').dataset.active).toBe('false');
  });

  it('keeps the same step active across repeated occurrences of that stage', () => {
    // Frame 3 and frame 6 are different events, both recorded as `compare`.
    renderPanel({ index: 6, currentEvent: run[6] });
    expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('compare');
    expect(screen.getByTestId('lesson-step-compare').dataset.active).toBe('true');
  });

  it('shows the frame count badge for a repeated step', () => {
    renderPanel();
    expect(screen.getByTestId('lesson-step-compare').textContent).toContain('3');
    expect(screen.getByTestId('lesson-step-swap').textContent).toContain('2');
  });

  it('jumps to a real frame when a step is clicked', () => {
    const onSeek = vi.fn();
    renderPanel({ index: 0, onSeek });
    fireEvent.click(screen.getByTestId('lesson-step-swap'));
    // Next swap after frame 0 is frame 2 — a real recorded frame, not a guess.
    expect(onSeek).toHaveBeenCalledWith(2);
  });

  it('disables a step the current run never recorded instead of faking a jump', () => {
    const onSeek = vi.fn();
    const withoutPass = run.filter((item) => item.lessonStepId !== 'pass');
    renderPanel({ events: withoutPass, onSeek });
    const button = screen.getByTestId('lesson-step-pass') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onSeek).not.toHaveBeenCalled();
  });

  it('explains an unlinked frame (JavaScript demo) without inventing a stage', () => {
    renderPanel({ index: 0, currentEvent: event(0, undefined, { message: 'JS frame' }) });
    expect(screen.queryByTestId('lesson-active-step')).toBeNull();
    expect(screen.getByTestId('lesson-unlinked').textContent).toContain('没有记录教学阶段');
  });

  it('reports an id that the course does not define, and does not crash', () => {
    renderPanel({ index: 0, currentEvent: event(0, 'stale-pack-step') });
    expect(screen.queryByTestId('lesson-active-step')).toBeNull();
    expect(screen.getByTestId('lesson-unlinked').textContent).toContain('stale-pack-step');
  });

  it('shows the current message and variables of the same frame', () => {
    renderPanel({
      index: 1,
      currentEvent: event(1, 'compare', {
        message: '比较 / Compare',
        variables: [{ name: 'i', type: 'int', value: 0 }],
      }),
    });
    expect(screen.getByTestId('lesson-message').textContent).toContain('比较 / Compare');
    expect(screen.getByTestId('lesson-vars').textContent).toContain('i = 0');
  });

  it('renders an explicit empty state for an algorithm without a course', () => {
    renderPanel({ lesson: undefined });
    expect(screen.getByTestId('lesson-no-lesson')).toBeTruthy();
    expect(screen.getByTestId('lesson-no-lesson').textContent).toContain('尚未提供教学课程');
    expect(screen.queryByTestId('lesson-steps')).toBeNull();
  });

  it('switches language for copy but keeps the same step ids', () => {
    window.localStorage.setItem('algolens-lang', 'en');
    renderPanel({ index: 3 });
    expect(screen.getByTestId('lesson-title').textContent).toBe(bubbleSortLesson.title.en);
    expect(screen.getByTestId('lesson-steps').textContent).toContain(
      bubbleSortLesson.steps[1].title.en,
    );
    expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('compare');
  });

  it('uses the factorial course for recursion without assuming a frame layout', () => {
    const factorialRun = [
      event(0, 'call', { visualType: 'stack' }),
      event(1, 'check', { visualType: 'stack' }),
      event(2, 'recurse', { visualType: 'stack' }),
      event(3, 'combine', { visualType: 'stack' }),
      event(4, 'return', { visualType: 'stack' }),
      event(5, 'done', { visualType: 'stack' }),
    ];
    renderPanel({ lesson: factorialLesson, events: factorialRun, index: 3 });
    expect(screen.getByTestId('lesson-title').textContent).toBe(factorialLesson.title.zh);
    for (const step of factorialLesson.steps) {
      expect(screen.getByTestId(`lesson-step-${step.stepId}`)).toBeTruthy();
    }
    expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('combine');
  });
});
