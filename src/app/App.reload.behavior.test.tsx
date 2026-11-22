import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';

vi.mock('../runtime/execute', () => {
  const frames = [
    { state: { type: 'array', values: [3, 1, 2] }, message: 'STEP ONE' },
    { state: { type: 'array', values: [1, 2, 3], done: true }, message: 'STEP TWO' },
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

async function waitForConcept() {
  await waitFor(() =>
    expect(screen.getByTestId('concept-title').textContent).toBe('数据结构的基本概念'),
  );
}

describe('a reload is a fresh textbook session', () => {
  it('returns to the concept hero top with an open first-level-only directory on every mount', async () => {
    const first = renderApp();
    await waitForConcept();
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('false');
    expect(screen.getByTestId('chapter-ch1-intro').getAttribute('aria-expanded')).toBe('false');
    expect(
      document.getElementById('chapter-ch1-intro-body')?.getAttribute('data-open'),
    ).toBe('false');

    // Simulate the learner opening a chapter, folding the directory and
    // scrolling down, then reloading: only the first-level directory and the
    // concept hero top may come back.
    fireEvent.click(screen.getByTestId('chapter-ch1-intro'));
    expect(screen.getByTestId('chapter-ch1-intro').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByTestId('sidebar-collapse'));
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('true');
    const main = document.querySelector<HTMLElement>('.lab-main');
    expect(main).not.toBeNull();
    main!.scrollTop = 640;
    document.documentElement.scrollTop = 320;
    document.body.scrollTop = 320;
    first.unmount();

    renderApp();
    await waitForConcept();
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('false');
    expect(screen.getByTestId('chapter-ch1-intro').getAttribute('aria-expanded')).toBe('false');
    expect(
      document.getElementById('chapter-ch1-intro-body')?.getAttribute('data-open'),
    ).toBe('false');
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.scrollTop).toBe(0);
    expect(document.querySelector<HTMLElement>('.lab-main')?.scrollTop).toBe(0);
  });
});
