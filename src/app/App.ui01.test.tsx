import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';

// Same approach as App.dom.test: the execution path is mocked so jsdom does not
// need a Worker. Playback, selection and persistence stay real.
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

function renderApp(initialConcept?: string | null) {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <App initialConcept={initialConcept} />
      </I18nProvider>
    </ThemeProvider>,
  );
}

async function ready() {
  await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
}

describe('UX-03 textbook directory does not touch learning state', () => {
  it('collapses and restores the sidebar while the playhead stays put', async () => {
    renderApp(null);
    await ready();

    fireEvent.click(screen.getByTestId('next-btn'));
    fireEvent.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('progress').textContent).toBe('3 / 3');

    // Folding the chapter that holds the current algorithm is also layout-only.
    fireEvent.click(screen.getByTestId('chapter-ch10-sort'));
    expect(screen.getByTestId('chapter-ch10-sort').getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByTestId('progress').textContent).toBe('3 / 3');
    expect(screen.getByTestId('step-desc').textContent).toBe('STEP THREE');
    fireEvent.click(screen.getByTestId('chapter-ch10-sort'));

    fireEvent.click(screen.getByTestId('sidebar-collapse'));
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('true');
    expect(screen.getByTestId('progress').textContent).toBe('3 / 3');
    expect(screen.getByTestId('step-desc').textContent).toBe('STEP THREE');

    fireEvent.click(screen.getByTestId('sidebar-expand'));
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('false');
    expect(screen.getByTestId('progress').textContent).toBe('3 / 3');
    expect(screen.getByTestId('step-desc').textContent).toBe('STEP THREE');
  });

  it('re-opens the chapter and topic that receive a newly selected algorithm', async () => {
    renderApp(null);
    await ready();

    fireEvent.click(screen.getByTestId('chapter-ch10-sort'));
    expect(screen.getByTestId('chapter-ch10-sort').getAttribute('aria-expanded')).toBe('false');

    // The mobile selector is the same registry-driven entry point on narrow
    // screens; choosing from it must reveal the algorithm's textbook path.
    fireEvent.change(screen.getByTestId('mobile-algo-select'), { target: { value: 'insertion' } });
    await waitFor(() => expect(screen.getByTestId('lab-title').textContent).toBe('插入排序'));
    expect(screen.getByTestId('chapter-ch10-sort').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('topic-insertion-sort').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('topic-direct-insertion')).toBeTruthy();
    expect(screen.getByTestId('algo-insertion').getAttribute('aria-current')).toBe('true');
  });

  it('opens a concept topic from the mobile directory selector', async () => {
    renderApp(null);
    await ready();

    fireEvent.change(screen.getByTestId('mobile-algo-select'), { target: { value: 'concept:adt' } });
    await waitFor(() => expect(screen.getByTestId('concept-page')).toBeTruthy());
    expect(screen.getByTestId('concept-title').textContent).toContain('抽象数据类型');
    expect((screen.getByTestId('mobile-algo-select') as HTMLSelectElement).value).toBe('concept:adt');

    fireEvent.change(screen.getByTestId('mobile-algo-select'), { target: { value: 'insertion' } });
    await waitFor(() => expect(screen.queryByTestId('concept-page')).toBeNull());
    expect(screen.getByTestId('visual-stage')).toBeTruthy();
  });

  it('restores the collapsed layout after a remount', async () => {
    const first = renderApp(null);
    await ready();
    fireEvent.click(screen.getByTestId('sidebar-collapse'));
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('true');
    first.unmount();

    renderApp(null);
    await ready();
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('true');
    expect(screen.getByTestId('sidebar-expand')).toBeTruthy();
  });
});
