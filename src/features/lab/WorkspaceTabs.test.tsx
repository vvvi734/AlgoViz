import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { WorkspaceTabs } from './WorkspaceTabs';

function renderHarness() {
  return render(
    <I18nProvider>
      <WorkspaceTabs>
        <div data-testid="reference-panel">reference panel</div>
      </WorkspaceTabs>
    </I18nProvider>,
  );
}

describe('WorkspaceTabs (CORE-REFINE-01)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts with reference code collapsed and exposes a reference-code label', () => {
    renderHarness();
    const tabs = screen.getByTestId('workspace-tabs');
    const toggle = screen.getByTestId('workspace-tabs-toggle');
    const body = tabs.querySelector<HTMLElement>('.workspace-tabs-body');
    expect(tabs.getAttribute('data-expanded')).toBe('false');
    expect(body?.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent).toContain('展开参考代码');
    expect(toggle.textContent).not.toContain('高级面板');
    expect(screen.queryByTestId('reference-panel')).toBeNull();

    fireEvent.click(toggle);
    expect(tabs.getAttribute('data-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toContain('收起参考代码');
    expect(body?.hidden).toBe(false);
    expect(screen.getByTestId('reference-panel')).toBeTruthy();
  });

  it('unmounts the heavy viewer again when collapsed', () => {
    renderHarness();
    fireEvent.click(screen.getByTestId('workspace-tabs-toggle'));
    expect(screen.getByTestId('reference-panel')).toBeTruthy();
    fireEvent.click(screen.getByTestId('workspace-tabs-toggle'));
    expect(screen.queryByTestId('reference-panel')).toBeNull();
    expect(screen.getByTestId('workspace-tabs').getAttribute('data-expanded')).toBe('false');
  });

  it('shows the panel shortcut only while open and returns focus to the header toggle', () => {
    renderHarness();
    expect(screen.queryByTestId('reference-quick-collapse')).toBeNull();

    const toggle = screen.getByTestId('workspace-tabs-toggle');
    fireEvent.click(toggle);
    const shortcut = screen.getByTestId('reference-quick-collapse');
    expect(shortcut.tagName).toBe('BUTTON');
    expect(shortcut.textContent).toContain('收起代码');
    expect(shortcut.getAttribute('aria-controls')).toBe(
      screen.getByTestId('workspace-tabs-body').id,
    );

    fireEvent.click(shortcut);
    expect(screen.getByTestId('workspace-tabs').getAttribute('data-expanded')).toBe('false');
    expect(screen.getByTestId('workspace-tabs-body').hidden).toBe(true);
    expect(screen.queryByTestId('reference-quick-collapse')).toBeNull();
    expect(screen.queryByTestId('reference-panel')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('uses the English shortcut label in the English interface', () => {
    window.localStorage.setItem('algolens-lang', 'en');
    renderHarness();
    fireEvent.click(screen.getByTestId('workspace-tabs-toggle'));
    expect(screen.getByTestId('reference-quick-collapse').textContent).toContain('Collapse code');
    expect(screen.getByTestId('reference-quick-collapse').textContent).not.toContain('收起');
  });
});
