import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';

// The execution path is mocked; the single LabController playhead stays real.
vi.mock('../runtime/execute', () => {
  const frames = [
    { state: { type: 'array', values: [3, 1, 2], focus: [0] }, message: 'STEP ONE' },
    { state: { type: 'array', values: [1, 3, 2], focus: [1] }, message: 'STEP TWO' },
    { state: { type: 'array', values: [1, 2, 3], done: true }, message: 'STEP THREE' },
  ];
  return {
    runForLanguage: vi.fn(async () => ({ frames })),
    isVisualResult: (value: unknown) => typeof value === 'object' && value !== null && 'frames' in value,
  };
});

function renderApp() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>,
  );
}

async function ready() {
  await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
}

describe('UI-03 compact run bar', () => {
  it('keeps input, random and run visible without a source editor or a second playhead', async () => {
    renderApp();
    await ready();

    // Start one owned run so a late mount-time result cannot rewind the frame
    // while this test is stepping the shared playhead.
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
    await waitFor(() =>
      expect(screen.getByTestId('run-feedback').textContent).toMatch(/动画已生成|Visualization ready/),
    );

    fireEvent.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('progress').textContent).toBe('2 / 3');

    const dock = screen.getByTestId('code-dock');
    expect(dock.getAttribute('data-expanded')).toBe('true');
    expect(screen.getByTestId('code-dock-body')).toBeTruthy();
    expect(screen.getByTestId('run-btn')).toBeTruthy();
    expect(screen.queryByTestId('code-dock-toggle')).toBeNull();
    expect(screen.queryByTestId('code-editor')).toBeNull();

    const input = screen.getByTestId('run-input') as HTMLInputElement;
    const before = input.value;
    fireEvent.change(input, { target: { value: '[9,8,7]' } });
    expect(input.value).toBe('[9,8,7]');
    expect(screen.getByTestId('progress').textContent).toBe('2 / 3');

    fireEvent.click(screen.getByTestId('random-btn'));
    expect(input.value).not.toBe('[9,8,7]');
    expect(input.value).not.toBe(before);
    expect(screen.getByTestId('progress').textContent).toBe('2 / 3');
  });
});
