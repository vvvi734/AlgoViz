import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WorkspaceTabs, type WorkspaceTabId } from './WorkspaceTabs';

function Harness() {
  const [active, setActive] = useState<WorkspaceTabId>('state');
  return (
    <WorkspaceTabs
      active={active}
      onChange={setActive}
      labels={{ state: 'State', mentor: 'Mentor', tools: 'Tools' }}
      panels={{
        state: <input aria-label="draft" data-testid="persistent-input" />,
        mentor: <div>mentor panel</div>,
        tools: <div>tools panel</div>,
      }}
    />
  );
}

describe('WorkspaceTabs (UI-02)', () => {
  it('mounts every secondary panel once and only hides inactive ones', () => {
    render(<Harness />);
    expect(screen.getByTestId('workspace-panel-state').hidden).toBe(false);
    expect(screen.getByTestId('workspace-panel-mentor').hidden).toBe(true);
    expect(screen.getByTestId('persistent-input')).toBeTruthy();
  });

  it('keeps hidden panel state when the user switches tabs', () => {
    render(<Harness />);
    const input = screen.getByTestId('persistent-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'kept draft' } });
    fireEvent.click(screen.getByTestId('workspace-tab-mentor'));
    fireEvent.click(screen.getByTestId('workspace-tab-state'));
    expect((screen.getByTestId('persistent-input') as HTMLInputElement).value).toBe('kept draft');
  });

  it('supports ArrowRight / ArrowLeft and moves focus with the selection', () => {
    render(<Harness />);
    const state = screen.getByTestId('workspace-tab-state');
    state.focus();
    fireEvent.keyDown(state, { key: 'ArrowRight' });
    expect(screen.getByTestId('workspace-tab-mentor').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(screen.getByTestId('workspace-tab-mentor'));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowLeft' });
    expect(screen.getByTestId('workspace-tab-state').getAttribute('aria-selected')).toBe('true');
  });
});
