import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AlgorithmSidebar } from './AlgorithmSidebar';
import { I18nProvider } from '../../i18n/I18nProvider';
import { catalog, groups } from '../../domain/algorithms/examples';

/**
 * UI-01 directory tests.
 *
 * The expected sections are computed from the registry itself, so these tests
 * keep working when an algorithm or a group is added — they assert the mapping
 * rule (catalog[].group → section), not a frozen list of names.
 */
function expectedSections(): Array<{ id: string; count: number }> {
  return groups
    .map(([id]) => ({ id, count: Object.values(catalog).filter((entry) => entry.group === id).length }))
    .filter((section) => section.count > 0);
}

function Harness({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());
  return (
    <I18nProvider>
      <AlgorithmSidebar
        catalog={catalog}
        groups={groups}
        currentAlgo="bubble"
        onSelect={vi.fn()}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        isGroupOpen={(groupId) => !closed.has(groupId)}
        onToggleGroup={(groupId) =>
          setClosed((current) => {
            const next = new Set(current);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
          })
        }
        onOpenGroup={(groupId) =>
          setClosed((current) => {
            if (!current.has(groupId)) return current;
            const next = new Set(current);
            next.delete(groupId);
            return next;
          })
        }
      />
    </I18nProvider>
  );
}

describe('AlgorithmSidebar — registry-driven groups (UI-01)', () => {
  it('renders one section per populated registry group, never a hardcoded list', () => {
    render(<Harness />);
    for (const section of expectedSections()) {
      const head = screen.getByTestId(`group-${section.id}`);
      expect(head).toBeTruthy();
      // The count badge is derived from the catalogue at render time.
      expect(within(head).getByText(String(section.count))).toBeTruthy();
    }
    expect(screen.getAllByTestId(/^algo-/)).toHaveLength(Object.keys(catalog).length);
  });

  it('starts fully expanded and folds only the clicked section', () => {
    render(<Harness />);
    const sort = screen.getByTestId('group-sort');
    const search = screen.getByTestId('group-search');
    expect(sort.getAttribute('aria-expanded')).toBe('true');
    expect(search.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(sort);

    expect(sort.getAttribute('aria-expanded')).toBe('false');
    const panel = document.getElementById('alg-group-sort');
    expect(panel?.getAttribute('data-open')).toBe('false');
    // Folded content leaves the tab order / hit testing.
    expect(panel?.hasAttribute('inert')).toBe(true);
    // Other sections stay open: multiple sections may be expanded at once.
    expect(search.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('alg-group-search')?.getAttribute('data-open')).toBe('true');

    fireEvent.click(sort);
    expect(sort.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('alg-group-sort')?.getAttribute('data-open')).toBe('true');
  });

  it('marks the selected algorithm and the section that holds it', () => {
    render(<Harness />);
    const bubble = screen.getByTestId('algo-bubble');
    expect(bubble.className).toContain('active');
    expect(bubble.getAttribute('aria-current')).toBe('true');
    expect(screen.getByTestId('group-sort').getAttribute('data-has-current')).toBe('true');
    expect(screen.getByTestId('group-search').getAttribute('data-has-current')).toBe('false');
    // Exactly one item is current.
    expect(screen.getAllByTestId(/^algo-/).filter((item) => item.getAttribute('aria-current') === 'true')).toHaveLength(1);
  });

  it('uses native buttons so every control is keyboard operable', () => {
    render(<Harness />);
    for (const button of [
      screen.getByTestId('group-sort'),
      screen.getByTestId('algo-bubble'),
      screen.getByTestId('sidebar-collapse'),
    ]) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.hasAttribute('disabled')).toBe(false);
    }
  });

  it('collapses to a compact rail that still exposes groups and the current algorithm', () => {
    const { rerender } = render(<Harness />);
    fireEvent.click(screen.getByTestId('sidebar-collapse'));
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('true');
    expect(screen.getByTestId('sidebar-expand')).toBeTruthy();
    expect(screen.queryByTestId('sidebar-collapse')).toBeNull();

    for (const section of expectedSections()) {
      expect(screen.getByTestId(`rail-group-${section.id}`)).toBeTruthy();
    }
    expect(screen.getByTestId('rail-current').textContent).toContain(catalog.bubble.icon);

    // Clicking a rail shortcut expands the directory again.
    fireEvent.click(screen.getByTestId('rail-group-search'));
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('false');

    rerender(<Harness />);
  });

  it('keeps group state presentation-only: no selection callback on fold', () => {
    const onSelect = vi.fn();
    render(
      <I18nProvider>
        <AlgorithmSidebar
          catalog={catalog}
          groups={groups}
          currentAlgo="bubble"
          onSelect={onSelect}
          collapsed={false}
          onToggleCollapsed={vi.fn()}
          isGroupOpen={() => true}
          onToggleGroup={vi.fn()}
          onOpenGroup={vi.fn()}
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByTestId('group-sort'));
    fireEvent.click(screen.getByTestId('group-graph'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
