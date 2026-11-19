import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { WorkspaceTabs, type WorkspaceTabId } from './WorkspaceTabs';

function Harness({ lazy = false }: { lazy?: boolean }) {
  const [active, setActive] = useState<WorkspaceTabId>('state');
  return (
    <WorkspaceTabs
      active={active}
      onChange={setActive}
      labels={{ reference: 'Reference', state: 'State', mentor: 'Mentor', tools: 'Tools' }}
      lazyPanels={lazy ? ['reference'] : undefined}
      panels={{
        reference: <div data-testid="reference-panel">reference panel</div>,
        state: <input aria-label="draft" data-testid="persistent-input" />,
        mentor: <div>mentor panel</div>,
        tools: <div>tools panel</div>,
      }}
    />
  );
}

function renderHarness(lazy = false) {
  return render(
    <I18nProvider>
      <Harness lazy={lazy} />
    </I18nProvider>,
  );
}

describe('WorkspaceTabs (UI-02, UX-04)', () => {
  it('collapses the advanced panel by default and mounts it on expand', () => {
    renderHarness();
    const tabs = screen.getByTestId('workspace-tabs');
    const toggle = screen.getByTestId('workspace-tabs-toggle');
    expect(tabs.getAttribute('data-expanded')).toBe('false');
    const body = tabs.querySelector<HTMLElement>('.workspace-tabs-body');
    expect(body?.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByTestId('workspace-panel-state').hidden).toBe(false);
    expect(body?.contains(screen.getByTestId('persistent-input'))).toBe(true);

    fireEvent.click(toggle);
    expect(tabs.getAttribute('data-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(body?.hidden).toBe(false);
    expect(screen.getByTestId('workspace-panel-state').hidden).toBe(false);
    expect(screen.getByTestId('workspace-panel-mentor').hidden).toBe(true);
  });

  it('keeps hidden panel state when the user switches tabs', () => {
    renderHarness();
    fireEvent.click(screen.getByTestId('workspace-tabs-toggle'));
    const input = screen.getByTestId('persistent-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'kept draft' } });
    fireEvent.click(screen.getByTestId('workspace-tab-mentor'));
    fireEvent.click(screen.getByTestId('workspace-tab-state'));
    expect((screen.getByTestId('persistent-input') as HTMLInputElement).value).toBe('kept draft');
  });

  it('supports ArrowRight / ArrowLeft and moves focus with the selection', () => {
    renderHarness();
    fireEvent.click(screen.getByTestId('workspace-tabs-toggle'));
    const state = screen.getByTestId('workspace-tab-state');
    state.focus();
    fireEvent.keyDown(state, { key: 'ArrowRight' });
    expect(screen.getByTestId('workspace-tab-mentor').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(screen.getByTestId('workspace-tab-mentor'));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowLeft' });
    expect(screen.getByTestId('workspace-tab-state').getAttribute('aria-selected')).toBe('true');
  });

  it('defers lazy panels until the advanced area is expanded', () => {
    renderHarness(true);
    expect(screen.queryByTestId('reference-panel')).toBeNull();
    fireEvent.click(screen.getByTestId('workspace-tabs-toggle'));
    expect(screen.getByTestId('reference-panel')).toBeTruthy();
  });
});
