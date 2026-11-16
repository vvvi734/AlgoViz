import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WorkspaceTabs, type WorkspaceTabId } from './WorkspaceTabs';

function Harness() {
  const [active, setActive] = useState<WorkspaceTabId>('lesson');
  return (
    <WorkspaceTabs
      active={active}
      onChange={setActive}
      labels={{ lesson: 'Lesson', state: 'State', mentor: 'Mentor', tools: 'Tools' }}
      panels={{
        lesson: <div>lesson panel</div>,
        state: <input aria-label="draft" data-testid="persistent-input" />,
        mentor: <div>mentor panel</div>,
        tools: <div>tools panel</div>,
      }}
    />
  );
}

describe('WorkspaceTabs (Stage 7A)', () => {
  it('mounts every panel once and only hides inactive ones', () => {
    render(<Harness />);
    expect(screen.getByTestId('workspace-panel-lesson').hidden).toBe(false);
    expect(screen.getByTestId('workspace-panel-state').hidden).toBe(true);
    expect(screen.getByTestId('persistent-input')).toBeTruthy();
  });

  it('keeps hidden panel state when the user switches tabs', () => {
    render(<Harness />);
    const input = screen.getByTestId('persistent-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'kept draft' } });
    fireEvent.click(screen.getByTestId('workspace-tab-state'));
    expect(screen.getByTestId('workspace-panel-state').hidden).toBe(false);
    fireEvent.click(screen.getByTestId('workspace-tab-mentor'));
    fireEvent.click(screen.getByTestId('workspace-tab-state'));
    expect((screen.getByTestId('persistent-input') as HTMLInputElement).value).toBe('kept draft');
  });

  it('supports ArrowRight / ArrowLeft and moves focus with the selection', () => {
    render(<Harness />);
    const lesson = screen.getByTestId('workspace-tab-lesson');
    lesson.focus();
    fireEvent.keyDown(lesson, { key: 'ArrowRight' });
    expect(screen.getByTestId('workspace-tab-state').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(screen.getByTestId('workspace-tab-state'));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowLeft' });
    expect(screen.getByTestId('workspace-tab-lesson').getAttribute('aria-selected')).toBe('true');
  });
});
