import { useRef, useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TraceEvent } from '../../domain/trace/schema';
import { I18nProvider } from '../../i18n/I18nProvider';
import { FullscreenWorkspace } from './FullscreenWorkspace';
import { usePlayback } from './usePlayback';
import { usePlaybackKeyboard } from './usePlaybackKeyboard';

function makeEvents(length: number): TraceEvent[] {
  return Array.from({ length }, (_, index) => ({
    step: index + 1,
    message: `step ${index + 1}`,
  })) as unknown as TraceEvent[];
}

const EVENTS = makeEvents(5);

function text(element: HTMLElement | null): string {
  return element?.textContent ?? '';
}

function inputValue(element: HTMLElement | null): string {
  return (element as HTMLInputElement | null)?.value ?? '';
}

function Harness() {
  const playback = usePlayback(EVENTS);
  usePlaybackKeyboard(playback, true);
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <input data-testid="outside-input" defaultValue="8, 3, 1" />
      <span data-testid="outside-frame">{playback.index}</span>
      <button data-testid="outside-next" type="button" onClick={playback.next}>outside next</button>
      <button data-testid="outside-play" type="button" onClick={playback.toggle}>outside play</button>
      <button
        ref={opener}
        data-testid="outside-open"
        type="button"
        onClick={() => setOpen(true)}
      >open</button>
      {open ? (
        <FullscreenWorkspace
          event={EVENTS[playback.index]}
          events={EVENTS}
          playback={playback}
          algorithmId="bubble"
          algorithmName="Bubble Sort"
          mode="overlay"
          onClose={() => setOpen(false)}
          returnFocusRef={opener}
        />
      ) : null}
    </>
  );
}

function renderHarness(container?: HTMLElement) {
  return render(
    <I18nProvider>
      <Harness />
    </I18nProvider>,
    container ? { container } : undefined,
  );
}

function openWorkspace(): HTMLElement {
  fireEvent.click(screen.getByTestId('outside-open'));
  const workspace = screen.getByTestId('fullscreen-workspace');
  expect(workspace).toBeTruthy();
  return workspace;
}

afterEach(() => {
  document.body.className = '';
  document.documentElement.className = '';
});

describe('FullscreenWorkspace', () => {
  it('uses the exact same Playback and frame before, during and after fullscreen', () => {
    renderHarness();
    fireEvent.click(screen.getByTestId('outside-next'));
    fireEvent.click(screen.getByTestId('outside-next'));
    expect(text(screen.getByTestId('outside-frame'))).toBe('2');

    openWorkspace();
    expect(text(screen.getByTestId('progress'))).toBe('3 / 5');
    expect(inputValue(screen.getByTestId('outside-input'))).toBe('8, 3, 1');

    fireEvent.click(screen.getByTestId('next-btn'));
    expect(text(screen.getByTestId('progress'))).toBe('4 / 5');
    expect(text(screen.getByTestId('outside-frame'))).toBe('3');

    fireEvent.click(screen.getByTestId('prev-btn'));
    expect(text(screen.getByTestId('progress'))).toBe('3 / 5');
    fireEvent.click(screen.getByTestId('fullscreen-exit'));
    expect(screen.queryByTestId('fullscreen-workspace')).toBeNull();
    expect(text(screen.getByTestId('outside-frame'))).toBe('2');
    expect(inputValue(screen.getByTestId('outside-input'))).toBe('8, 3, 1');
  });

  it('hands the new playback keys to the existing player while the modal is open', () => {
    renderHarness();
    openWorkspace();
    const workspace = screen.getByTestId('fullscreen-workspace');
    const toolbar = workspace.querySelector<HTMLElement>('.fullscreen-toolbar-focus')!;
    toolbar.focus();
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(text(screen.getByTestId('progress'))).toBe('2 / 5');
    fireEvent.keyDown(toolbar, { key: 'ArrowDown' });
    expect(text(screen.getByTestId('progress'))).toBe('5 / 5');
    fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
    expect(text(screen.getByTestId('progress'))).toBe('4 / 5');
    fireEvent.keyDown(toolbar, { key: 'ArrowUp' });
    expect(text(screen.getByTestId('progress'))).toBe('1 / 5');
    fireEvent.keyDown(toolbar, { key: ' ' });
    expect(text(screen.getByTestId('play-btn'))).toContain('暂停');
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(text(screen.getByTestId('play-btn'))).toContain('播放');

    for (const key of ['Home', 'End', 'r']) {
      fireEvent.keyDown(toolbar, { key });
      expect(text(screen.getByTestId('progress'))).toBe('2 / 5');
    }
  });

  it('never creates a second playback timer when the workspace mounts', () => {
    const intervalSpy = vi.spyOn(window, 'setInterval');
    renderHarness();
    fireEvent.click(screen.getByTestId('outside-play'));
    const callsWhilePlaying = intervalSpy.mock.calls.length;
    expect(callsWhilePlaying).toBeGreaterThan(0);

    openWorkspace();
    // The workspace is now mounted while the one existing interval is running.
    expect(intervalSpy.mock.calls.length).toBe(callsWhilePlaying);
    expect(text(screen.getByTestId('play-btn'))).toContain('暂停');

    // A manual step still uses the shared Playback, stops playback, and does
    // not install another interval.
    fireEvent.click(screen.getByTestId('next-btn'));
    expect(intervalSpy.mock.calls.length).toBe(callsWhilePlaying);
    expect(text(screen.getByTestId('play-btn'))).toContain('播放');
  });

  it('steps through bounded zoom stops, resets to 100 and reports percentages', () => {
    renderHarness();
    openWorkspace();
    const value = () => text(screen.getByTestId('fullscreen-zoom-value'));
    expect(value()).toBe('100%');

    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(screen.getByTestId('fullscreen-zoom-in'));
    }
    expect(value()).toBe('200%');

    fireEvent.click(screen.getByTestId('fullscreen-zoom-out'));
    expect(value()).toBe('175%');

    fireEvent.click(screen.getByTestId('fullscreen-zoom-value'));
    expect(value()).toBe('100%');
    expect(screen.getByTestId('fullscreen-canvas').getAttribute('data-pan-x')).toBe('0');

    for (let index = 0; index < 20; index += 1) {
      fireEvent.click(screen.getByTestId('fullscreen-zoom-out'));
    }
    expect(value()).toBe('50%');
    expect((screen.getByTestId('fullscreen-zoom-out') as HTMLButtonElement).disabled).toBe(true);

    for (let index = 0; index < 20; index += 1) {
      fireEvent.click(screen.getByTestId('fullscreen-zoom-in'));
    }
    expect(value()).toBe('300%');
    expect((screen.getByTestId('fullscreen-zoom-in') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('fullscreen-world').style.transform).not.toMatch(/NaN|Infinity/);
  });

  it('supports keyboard zoom, reset and pan without stealing shortcuts from inputs', () => {
    renderHarness();
    openWorkspace();
    const workspace = screen.getByTestId('fullscreen-workspace');
    const value = () => text(screen.getByTestId('fullscreen-zoom-value'));
    const canvas = screen.getByTestId('fullscreen-canvas');
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 0, y: 0, left: 0, top: 0, width: 1000, height: 600,
        right: 1000, bottom: 600,
        toJSON: () => ({ width: 1000, height: 600 }),
      }),
    });
    fireEvent(window, new Event('resize'));

    fireEvent.keyDown(workspace, { key: '+', code: 'Equal', shiftKey: true });
    expect(value()).toBe('125%');
    fireEvent.keyDown(workspace, { key: '-', code: 'Minus' });
    expect(value()).toBe('100%');
    fireEvent.keyDown(workspace, { key: '0', code: 'Digit0' });
    expect(value()).toBe('100%');

    fireEvent.keyDown(canvas, { key: 'ArrowLeft', shiftKey: true });
    expect(canvas.getAttribute('data-pan-x')).not.toBe('0');
    fireEvent.click(screen.getByTestId('fullscreen-zoom-value'));
    expect(canvas.getAttribute('data-pan-x')).toBe('0');

    fireEvent.keyDown(screen.getByTestId('speed'), { key: '+', code: 'Equal', shiftKey: true });
    expect(value()).toBe('100%');
  });

  it('exits on Escape, restores body scrolling and returns focus to the opener', async () => {
    const app = document.createElement('div');
    app.className = 'app';
    document.body.append(app);
    renderHarness(app);
    openWorkspace();
    expect(app.hasAttribute('inert')).toBe(true);
    expect(document.body.classList.contains('fullscreen-scroll-lock')).toBe(true);

    fireEvent.keyDown(screen.getByTestId('fullscreen-workspace'), { key: 'Escape' });
    expect(screen.queryByTestId('fullscreen-workspace')).toBeNull();
    expect(app.hasAttribute('inert')).toBe(false);
    expect(document.body.classList.contains('fullscreen-scroll-lock')).toBe(false);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId('outside-open')));
    app.remove();
  });

  it('traps Tab focus inside the immersive workspace', () => {
    renderHarness();
    openWorkspace();
    const first = screen.getByTestId('fullscreen-zoom-out');
    const last = screen.getByTestId('speed');
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('ends a mouse pan when the pointer is cancelled or leaves the canvas', () => {
    renderHarness();
    openWorkspace();
    const canvas = screen.getByTestId('fullscreen-canvas');
    const pointer = (type: string, clientX: number, clientY: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX,
        clientY,
      });
      Object.defineProperty(event, 'pointerId', { value: 7 });
      Object.defineProperty(event, 'pointerType', { value: 'mouse' });
      return event;
    };

    fireEvent(canvas, pointer('pointerdown', 100, 100));
    fireEvent(canvas, pointer('pointermove', 170, 145));
    expect(canvas.classList.contains('is-panning')).toBe(true);
    fireEvent(canvas, pointer('pointercancel', 170, 145));
    expect(canvas.classList.contains('is-panning')).toBe(false);

    fireEvent(canvas, pointer('pointerdown', 100, 100));
    fireEvent(canvas, pointer('pointermove', 170, 145));
    expect(canvas.classList.contains('is-panning')).toBe(true);
    fireEvent(canvas, pointer('pointerout', 190, 160));
    expect(canvas.classList.contains('is-panning')).toBe(false);
  });

  it('fits safely when layout cannot be measured and leaves readable 100% state', () => {
    renderHarness();
    openWorkspace();
    fireEvent.click(screen.getByTestId('fullscreen-fit'));
    expect(text(screen.getByTestId('fullscreen-zoom-value'))).toBe('100%');
    expect(screen.getByTestId('fullscreen-world').style.transform).not.toMatch(/NaN|Infinity/);
    expect(screen.getByTestId('fullscreen-canvas').getAttribute('data-pan-x')).toBe('0');
  });

  it('renders English controls without a separate language state', () => {
    window.localStorage.setItem('algolens-lang', 'en');
    renderHarness();
    expect(text(screen.getByTestId('outside-open'))).toBe('open');
    openWorkspace();
    expect(text(screen.getByTestId('fullscreen-exit'))).toBe('✕Exit fullscreen');
    expect(text(screen.getByTestId('fullscreen-fit'))).toBe('⛶Fit to screen');
    expect(screen.getByTestId('fullscreen-zoom-out').getAttribute('aria-label')).toBe('Zoom out');
    expect(screen.getByTestId('fullscreen-zoom-in').getAttribute('aria-label')).toBe('Zoom in');
    expect(screen.getByTestId('fullscreen-fit').getAttribute('aria-label')).toBe('Fit to screen');
    expect(screen.getByTestId('fullscreen-exit').getAttribute('aria-label')).toBe('Exit fullscreen');
    expect(screen.getByTestId('fullscreen-zoom-value').getAttribute('aria-label')).toBe('Reset zoom · 100%');
    expect(text(screen.getByTestId('fullscreen-pan-hint'))).toContain('Drag to pan');
  });
});
