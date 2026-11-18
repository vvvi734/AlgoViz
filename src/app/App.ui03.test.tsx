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

describe('UI-03 code dock is presentation-only', () => {
  it('starts collapsed, preserves the draft and never moves the playhead', async () => {
    renderApp();
    await ready();

    fireEvent.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('progress').textContent).toBe('2 / 3');

    const dock = screen.getByTestId('code-dock');
    const body = screen.getByTestId('code-dock-body');
    const toggle = screen.getByTestId('code-dock-toggle');
    expect(dock.getAttribute('data-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(body.getAttribute('aria-hidden')).toBe('true');

    // The header owns the single primary run action even while collapsed.
    expect(screen.getByTestId('run-btn')).toBeTruthy();

    fireEvent.click(toggle);
    expect(dock.getAttribute('data-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(body.getAttribute('aria-hidden')).toBe('false');

    const editor = screen.getByTestId('code-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'const UI03_DRAFT = 303;' } });
    expect(editor.value).toContain('UI03_DRAFT');

    fireEvent.click(toggle);
    expect(dock.getAttribute('data-expanded')).toBe('false');
    expect(screen.getByTestId('progress').textContent).toBe('2 / 3');

    fireEvent.click(toggle);
    expect(dock.getAttribute('data-expanded')).toBe('true');
    expect((screen.getByTestId('code-editor') as HTMLTextAreaElement).value).toContain('UI03_DRAFT');
    expect(screen.getByTestId('progress').textContent).toBe('2 / 3');
    expect(screen.getByTestId('step-desc').textContent).toBe('STEP TWO');
  });
});
