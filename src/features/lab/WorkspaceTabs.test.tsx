import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
  it('collapses the advanced panel by default and mounts reference code on expand', () => {
    renderHarness();
    const tabs = screen.getByTestId('workspace-tabs');
    const toggle = screen.getByTestId('workspace-tabs-toggle');
    const body = tabs.querySelector<HTMLElement>('.workspace-tabs-body');
    expect(tabs.getAttribute('data-expanded')).toBe('false');
    expect(body?.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('reference-panel')).toBeNull();

    fireEvent.click(toggle);
    expect(tabs.getAttribute('data-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
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
});
