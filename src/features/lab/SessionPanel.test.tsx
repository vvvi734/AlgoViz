import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { builtinLessonCatalog } from '../../domain/lessons/catalog';
import { sessionIssue } from '../../domain/sessions/types';
import type { SessionTransferController } from './useSessionTransfer';
import { SessionPanel } from './SessionPanel';

function controller(overrides: Partial<SessionTransferController> = {}): SessionTransferController {
  return {
    preview: null,
    issues: [],
    notice: null,
    applied: null,
    busy: false,
    canExport: true,
    importFile: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    exportContext: vi.fn(() => true),
    dismiss: vi.fn(),
    ...overrides,
  };
}

function renderPanel(session: SessionTransferController) {
  return render(
    <I18nProvider>
      <SessionPanel session={session} lessons={builtinLessonCatalog} />
    </I18nProvider>,
  );
}

const bubbleLesson = builtinLessonCatalog.byId('bubble-sort-basics')!;

describe('SessionPanel', () => {
  it('shows an empty panel with export disabled and no frame to export', () => {
    const view = renderPanel(controller({ canExport: false }));
    expect(screen.getByTestId('session-panel')).toBeTruthy();
    const exportButton = screen.getByTestId('session-export') as HTMLButtonElement;
    expect(exportButton.disabled).toBe(true);
    expect(view.getByTestId('session-export-warn').textContent).toMatch(/代码|code/i);
    expect(screen.queryByTestId('session-preview')).toBeNull();
    expect(screen.queryByTestId('session-issues')).toBeNull();
  });

  it('passes the picked file to the controller', () => {
    const session = controller();
    renderPanel(session);
    const input = screen.getByTestId('session-file-input') as HTMLInputElement;
    const file = new File(['{}'], 'fake.algosession.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(session.importFile).toHaveBeenCalledWith(file);
  });

  it('renders a preview and applies only when the user confirms', () => {
    const confirm = vi.fn();
    const cancel = vi.fn();
    const session = controller({
      preview: {
        session: {
          sessionFormatVersion: 1,
          lessonId: 'bubble-sort-basics',
          algorithmId: 'bubble',
          locale: 'zh',
          selectedStepId: 'compare',
          source: 'arr = [3, 1]',
          lessonOrigin: { kind: 'builtin' },
          createdAt: '2026-11-16T00:00:00.000Z',
        },
        lesson: bubbleLesson,
        hasSource: true,
        algorithmName: { zh: '冒泡排序', en: 'Bubble sort' },
      },
      confirm,
      cancel,
    });
    renderPanel(session);

    expect(screen.getByTestId('session-preview-algorithm').textContent).toContain('冒泡排序');
    expect(screen.getByTestId('session-preview-lesson').textContent).toContain(bubbleLesson.title.zh);
    expect(screen.getByTestId('session-preview-step').textContent).toBeTruthy();
    expect(screen.getByTestId('session-preview-source').textContent).toMatch(/Python|源码|source/i);
    expect(confirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('session-preview-apply'));
    expect(confirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('session-preview-cancel'));
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('renders validation issues with a stable test id per code', () => {
    const session = controller({
      issues: [
        sessionIssue('origin-pack-missing', { pack: 'algolens-search-basics' }),
        sessionIssue('step-unknown', { stepId: 'nope', lessonId: 'bubble-sort-basics' }),
      ],
    });
    renderPanel(session);
    expect(screen.getByTestId('session-issue-origin-pack-missing').textContent).toContain('algolens-search-basics');
    expect(screen.getByTestId('session-issue-step-unknown').textContent).toContain('nope');
  });

  it('shows the applied summary and the export notice', () => {
    const session = controller({
      applied: { lessonId: 'bubble-sort-basics', stepId: 'compare' },
      notice: { key: 'sessionExportedSource' },
    });
    renderPanel(session);
    expect(screen.getByTestId('session-applied').textContent).toContain(bubbleLesson.title.zh);
    expect(screen.getByTestId('session-applied-step').textContent).toBeTruthy();
    expect(screen.getByTestId('session-notice').textContent).toBeTruthy();
  });

  it('exports with the include-source checkbox state', () => {
    const exportContext = vi.fn(() => true);
    renderPanel(controller({ exportContext }));
    fireEvent.click(screen.getByTestId('session-export'));
    expect(exportContext).toHaveBeenCalledWith({ includeSource: false });
    fireEvent.click(screen.getByTestId('session-export-source'));
    fireEvent.click(screen.getByTestId('session-export'));
    expect(exportContext).toHaveBeenLastCalledWith({ includeSource: true });
  });
});
