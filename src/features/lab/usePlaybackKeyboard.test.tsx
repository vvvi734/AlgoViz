import { StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TraceEvent } from '../../domain/trace/schema';
import { usePlayback } from './usePlayback';
import { usePlaybackKeyboard } from './usePlaybackKeyboard';

function makeEvents(length: number): TraceEvent[] {
  return Array.from({ length }, (_, index) => ({
    step: index + 1,
    message: `step ${index + 1}`,
  })) as unknown as TraceEvent[];
}

const EVENTS = makeEvents(5);
const NEXT_TRACE = makeEvents(4);

function KeyboardHarness({ events, enabled = true }: { events: TraceEvent[]; enabled?: boolean }) {
  const playback = usePlayback(events);
  usePlaybackKeyboard(playback, enabled);
  return (
    <>
      <span data-testid="frame">{playback.index}</span>
      <span data-testid="playing">{String(playback.playing)}</span>
      <span data-testid="total">{playback.frameCount}</span>
    </>
  );
}

function renderKeyboard(events: TraceEvent[] = EVENTS, enabled = true) {
  return render(
    <StrictMode>
      <KeyboardHarness events={events} enabled={enabled} />
    </StrictMode>,
  );
}

function press(target: EventTarget, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

function frame(): number {
  return Number(screen.getByTestId('frame').textContent);
}

function playing(): boolean {
  return screen.getByTestId('playing').textContent === 'true';
}

afterEach(() => {
  document.querySelectorAll('[data-keyboard-fixture]').forEach((node) => node.remove());
});

describe('usePlaybackKeyboard', () => {
  it('maps arrows, Home and End and clamps at both frame boundaries', () => {
    renderKeyboard();
    expect(frame()).toBe(0);

    let event = press(document.body, 'ArrowLeft');
    expect(event.defaultPrevented).toBe(true);
    expect(frame()).toBe(0);

    press(document.body, 'ArrowRight');
    expect(frame()).toBe(1);
    press(document.body, 'ArrowRight');
    expect(frame()).toBe(2);
    press(document.body, 'ArrowLeft');
    expect(frame()).toBe(1);

    press(document.body, 'Home');
    expect(frame()).toBe(0);
    press(document.body, 'End');
    expect(frame()).toBe(4);
    event = press(document.body, 'ArrowRight');
    expect(event.defaultPrevented).toBe(true);
    expect(frame()).toBe(4);
  });

  it('uses the existing play/pause and reset transitions', () => {
    renderKeyboard();

    press(document.body, 'Space');
    expect(playing()).toBe(true);
    press(document.body, 'ArrowRight');
    expect(frame()).toBe(1);
    expect(playing()).toBe(false);

    press(document.body, 'End');
    expect(frame()).toBe(4);
    expect(playing()).toBe(false);

    press(document.body, 'Space');
    expect(frame()).toBe(0);
    expect(playing()).toBe(true);

    press(document.body, 'R');
    expect(frame()).toBe(0);
    expect(playing()).toBe(false);
  });

  it('ignores browser and IME shortcuts', () => {
    renderKeyboard();
    press(document.body, 'End');
    expect(frame()).toBe(4);

    let event = press(document.body, 'r', { ctrlKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(4);

    event = press(document.body, 'r', { altKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(4);

    event = press(document.body, 'ArrowRight', { isComposing: true });
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(4);

    event = press(document.body, 'ArrowRight', { metaKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(4);
  });

  it('does not flip play or reset repeatedly while a key is held', () => {
    const intervalSpy = vi.spyOn(window, 'setInterval');
    renderKeyboard();

    press(document.body, 'Space');
    expect(playing()).toBe(true);
    expect(intervalSpy).toHaveBeenCalledTimes(1);

    const repeatedSpace = press(document.body, ' ', { repeat: true });
    expect(repeatedSpace.defaultPrevented).toBe(true);
    expect(playing()).toBe(true);
    expect(intervalSpy).toHaveBeenCalledTimes(1);

    press(document.body, 'Space');
    expect(playing()).toBe(false);

    press(document.body, 'ArrowRight');
    press(document.body, 'ArrowRight');
    expect(frame()).toBe(2);
    press(document.body, 'Space');
    expect(playing()).toBe(true);

    const repeatedReset = press(document.body, 'r', { repeat: true });
    expect(repeatedReset.defaultPrevented).toBe(true);
    expect(frame()).toBe(2);
    expect(playing()).toBe(true);

    press(document.body, 'R');
    expect(frame()).toBe(0);
    expect(playing()).toBe(false);
  });

  it('keeps text entry, contenteditable, Monaco and reference code native', () => {
    renderKeyboard();
    press(document.body, 'ArrowRight');
    press(document.body, 'ArrowRight');
    expect(frame()).toBe(2);

    const input = document.createElement('input');
    input.dataset.keyboardFixture = 'input';
    document.body.append(input);
    input.focus();
    let event = press(input, 'ArrowRight');
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(2);

    const textarea = document.createElement('textarea');
    textarea.dataset.keyboardFixture = 'textarea';
    document.body.append(textarea);
    textarea.focus();
    event = press(textarea, ' ');
    expect(event.defaultPrevented).toBe(false);
    event = press(textarea, 'r');
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(2);
    expect(playing()).toBe(false);

    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    editable.dataset.keyboardFixture = 'editable';
    document.body.append(editable);
    editable.focus();
    event = press(editable, 'ArrowRight');
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(2);

    const monaco = document.createElement('div');
    monaco.className = 'monaco-editor';
    monaco.dataset.keyboardFixture = 'monaco';
    monaco.tabIndex = 0;
    document.body.append(monaco);
    monaco.focus();
    event = press(monaco, 'ArrowRight');
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(2);

    const reference = document.createElement('div');
    reference.dataset.testid = 'reference-code-panel';
    reference.dataset.keyboardFixture = 'reference';
    reference.tabIndex = 0;
    document.body.append(reference);
    reference.focus();
    event = press(reference, 'Home');
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(2);
  });

  it('blocks the player while a modal is open', () => {
    renderKeyboard();
    const modal = document.createElement('div');
    modal.dataset.keyboardFixture = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    document.body.append(modal);

    const event = press(document.body, 'ArrowRight');
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(0);
  });

  it('leaves arrows and Home/End to a focused horizontal scroll region', () => {
    renderKeyboard();
    const scroller = document.createElement('div');
    scroller.dataset.keyboardFixture = 'scroller';
    scroller.tabIndex = 0;
    scroller.style.overflowX = 'auto';
    Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 120 });
    Object.defineProperty(scroller, 'scrollWidth', { configurable: true, value: 320 });
    document.body.append(scroller);
    scroller.focus();

    const arrow = press(scroller, 'ArrowRight');
    expect(arrow.defaultPrevented).toBe(false);
    const home = press(scroller, 'Home');
    expect(home.defaultPrevented).toBe(false);
    expect(frame()).toBe(0);

    press(scroller, 'R');
    expect(frame()).toBe(0);
  });

  it('does not treat a page-level scroll ancestor as the playback surface', () => {
    renderKeyboard();
    const pageScroller = document.createElement('div');
    pageScroller.dataset.keyboardFixture = 'page-scroller';
    pageScroller.style.overflowX = 'auto';
    Object.defineProperty(pageScroller, 'clientWidth', { configurable: true, value: 120 });
    Object.defineProperty(pageScroller, 'scrollWidth', { configurable: true, value: 320 });
    const workspace = document.createElement('div');
    workspace.dataset.keyboardFixture = 'workspace';
    workspace.tabIndex = -1;
    pageScroller.append(workspace);
    document.body.append(pageScroller);
    workspace.focus();

    const event = press(workspace, 'ArrowRight');
    expect(event.defaultPrevented).toBe(true);
    expect(frame()).toBe(1);
  });

  it('does nothing without a trace and respects the disabled page scope', () => {
    const empty = renderKeyboard([]);
    let event = press(document.body, 'ArrowRight');
    expect(event.defaultPrevented).toBe(false);
    event = press(document.body, 'Home');
    expect(event.defaultPrevented).toBe(false);
    event = press(document.body, 'Space');
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(0);
    expect(playing()).toBe(false);
    empty.unmount();

    renderKeyboard(EVENTS, false);
    event = press(document.body, 'ArrowRight');
    expect(event.defaultPrevented).toBe(false);
    expect(frame()).toBe(0);
  });

  it('does not duplicate actions after a trace switch and cleans up on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const view = renderKeyboard(EVENTS);
    press(document.body, 'ArrowRight');
    expect(frame()).toBe(1);

    view.rerender(
      <StrictMode>
        <KeyboardHarness events={NEXT_TRACE} />
      </StrictMode>,
    );
    expect(frame()).toBe(0);
    press(document.body, 'ArrowRight');
    expect(frame()).toBe(1);

    const addedHandlers = addSpy.mock.calls
      .filter(([type]) => type === 'keydown')
      .map(([, handler]) => handler);
    expect(addedHandlers.length).toBeGreaterThan(0);

    view.unmount();
    const removedHandlers = removeSpy.mock.calls
      .filter(([type]) => type === 'keydown')
      .map(([, handler]) => handler);
    expect(removedHandlers.length).toBeGreaterThan(0);
    expect(addedHandlers.some((handler) => removedHandlers.includes(handler))).toBe(true);
  });
});
