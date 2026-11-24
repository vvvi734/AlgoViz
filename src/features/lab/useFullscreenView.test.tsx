import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFullscreenView } from './useFullscreenView';

function Harness() {
  const view = useFullscreenView();
  return (
    <>
      <span data-testid="open-state">{String(view.open)}</span>
      <span data-testid="mode-state">{view.mode}</span>
      <button data-testid="open-view" type="button" onClick={view.openView}>open</button>
      <button data-testid="close-view" type="button" onClick={view.close}>close</button>
    </>
  );
}

function text(testId: string): string {
  return screen.getByTestId(testId).textContent ?? '';
}

type FullscreenRoot = HTMLElement & {
  requestFullscreen?: () => Promise<void>;
};

type FullscreenTestDocument = Document & {
  exitFullscreen?: () => Promise<void>;
  fullscreenElement?: Element | null;
};

const originalRequestDescriptor = Object.getOwnPropertyDescriptor(document.documentElement, 'requestFullscreen');
const originalExitDescriptor = Object.getOwnPropertyDescriptor(document, 'exitFullscreen');
const originalElementDescriptor = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');

afterEach(() => {
  const root = document.documentElement as FullscreenRoot;
  if (originalRequestDescriptor) {
    Object.defineProperty(root, 'requestFullscreen', originalRequestDescriptor);
  } else {
    Reflect.deleteProperty(root, 'requestFullscreen');
  }

  const doc = document as FullscreenTestDocument;
  if (originalExitDescriptor) {
    Object.defineProperty(doc, 'exitFullscreen', originalExitDescriptor);
  } else {
    Reflect.deleteProperty(doc, 'exitFullscreen');
  }

  if (originalElementDescriptor) {
    Object.defineProperty(doc, 'fullscreenElement', originalElementDescriptor);
  } else {
    Reflect.deleteProperty(doc, 'fullscreenElement');
  }
});

function installRequest(request?: () => Promise<void>): void {
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    configurable: true,
    value: request,
  });
}

function installExit(exit?: () => Promise<void>): void {
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: exit,
  });
}

describe('useFullscreenView', () => {
  it('uses the native Fullscreen API when the browser accepts it', async () => {
    const request = vi.fn(() => Promise.resolve());
    const exit = vi.fn(() => Promise.resolve());
    installRequest(request);
    installExit(exit);
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    });
    render(<Harness />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('open-view'));
      await Promise.resolve();
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(text('open-state')).toBe('true');
    expect(text('mode-state')).toBe('native');

    fireEvent.click(screen.getByTestId('close-view'));
    expect(exit).toHaveBeenCalledTimes(1);
    expect(text('open-state')).toBe('false');
  });

  it('keeps the overlay usable when the API is missing', async () => {
    const exit = vi.fn(() => Promise.resolve());
    installRequest(undefined);
    installExit(exit);
    render(<Harness />);

    fireEvent.click(screen.getByTestId('open-view'));
    expect(text('open-state')).toBe('true');
    expect(text('mode-state')).toBe('overlay');
    fireEvent.click(screen.getByTestId('close-view'));
    expect(exit).not.toHaveBeenCalled();
  });

  it('falls back when the browser rejects requestFullscreen', async () => {
    const request = vi.fn(() => Promise.reject(new Error('denied')));
    installRequest(request);
    render(<Harness />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('open-view'));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(text('open-state')).toBe('true');
    expect(text('mode-state')).toBe('overlay');
  });

  it('closes the matching overlay when the browser itself leaves fullscreen', async () => {
    installRequest(vi.fn(() => Promise.resolve()));
    let nativeElement: Element | null = null;
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => nativeElement,
    });
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('open-view'));
      await Promise.resolve();
    });
    expect(text('open-state')).toBe('true');

    await act(async () => {
      nativeElement = document.documentElement;
      document.dispatchEvent(new Event('fullscreenchange'));
      await Promise.resolve();
    });
    expect(text('mode-state')).toBe('native');

    await act(async () => {
      nativeElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(text('open-state')).toBe('false');
    expect(text('mode-state')).toBe('overlay');
  });
});
