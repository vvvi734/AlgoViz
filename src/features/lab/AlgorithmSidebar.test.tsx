import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AlgorithmSidebar } from './AlgorithmSidebar';
import { I18nProvider } from '../../i18n/I18nProvider';
import { catalog } from '../../domain/algorithms/examples';
import { buildTextbookNavigation, textbookAlgorithmIds } from '../../domain/algorithms/textbook';

/**
 * UX-03 directory tests.
 *
 * They assert the authored chapter → topic mapping and the disclosure contract,
 * not a frozen list of hand-written labels. Counts come from the live registry.
 */
function Harness({
  initialCollapsed = false,
  selected = 'bubble',
  onSelect = vi.fn(),
}: {
  initialCollapsed?: boolean;
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [openChapters, setOpenChapters] = useState<ReadonlySet<string>>(new Set(['ch9-sort']));
  const [openTopics, setOpenTopics] = useState<ReadonlySet<string>>(new Set(['bubble-sort']));
  return (
    <I18nProvider>
      <AlgorithmSidebar
        catalog={catalog}
        currentAlgo={selected}
        onSelect={onSelect}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        isChapterOpen={(id) => openChapters.has(id)}
        onToggleChapter={(id) =>
          setOpenChapters((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        onOpenChapter={(id) =>
          setOpenChapters((current) => {
            if (current.has(id)) return current;
            const next = new Set(current);
            next.add(id);
            return next;
          })
        }
        isTopicOpen={(id) => openTopics.has(id)}
        onToggleTopic={(id) =>
          setOpenTopics((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })}
      />
    </I18nProvider>
  );
}

const nav = buildTextbookNavigation(catalog);

describe('AlgorithmSidebar — textbook chapters (UX-03)', () => {
  it('renders all nine book chapters in source order plus every algorithm', () => {
    render(<Harness />);
    const chapters = screen.getAllByTestId(/^chapter-/);
    expect(chapters).toHaveLength(9);
    for (const chapter of nav) {
      expect(screen.getByTestId(`chapter-${chapter.id}`)).toBeTruthy();
      const count = chapter.algorithmCount;
      if (count > 0) {
        expect(within(screen.getByTestId(`chapter-${chapter.id}`)).getByText(String(count))).toBeTruthy();
      } else {
        expect(within(screen.getByTestId(`chapter-${chapter.id}`)).getByText('待完善')).toBeTruthy();
      }
    }
    expect(screen.getAllByTestId(/^algo-/)).toHaveLength(Object.keys(catalog).length);
    expect(textbookAlgorithmIds(nav)).toHaveLength(Object.keys(catalog).length);
  });

  it('starts with only the current path open; other chapters stay folded', () => {
    render(<Harness />);
    const sort = screen.getByTestId('chapter-ch9-sort');
    const search = screen.getByTestId('chapter-ch8-search');
    expect(sort.getAttribute('aria-expanded')).toBe('true');
    expect(search.getAttribute('aria-expanded')).toBe('false');

    const searchBody = document.getElementById('chapter-ch8-search-body');
    expect(searchBody?.getAttribute('data-open')).toBe('false');
    expect(searchBody?.hasAttribute('inert')).toBe(true);

    // The current topic is open; a sibling topic is not.
    expect(screen.getByTestId('topic-bubble-sort').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('topic-quick-sort').getAttribute('aria-expanded')).toBe('false');
  });

  it('allows multiple chapters and topics to be open without closing siblings', () => {
    render(<Harness />);
    const sort = screen.getByTestId('chapter-ch9-sort');
    const search = screen.getByTestId('chapter-ch8-search');
    fireEvent.click(search);
    expect(search.getAttribute('aria-expanded')).toBe('true');
    expect(sort.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByTestId('topic-bst'));
    expect(screen.getByTestId('topic-bst').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('topic-bubble-sort').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('algo-bst')).toBeTruthy();

    fireEvent.click(search);
    expect(search.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('chapter-ch8-search-body')?.hasAttribute('inert')).toBe(true);
    expect(sort.getAttribute('aria-expanded')).toBe('true');
  });

  it('marks exactly one current algorithm and its chapter/topic path', () => {
    render(<Harness />);
    const bubble = screen.getByTestId('algo-bubble');
    expect(bubble.className).toContain('active');
    expect(bubble.getAttribute('aria-current')).toBe('true');
    expect(bubble.getAttribute('data-chapter')).toBe('ch9-sort');
    expect(bubble.getAttribute('data-topic')).toBe('bubble-sort');
    expect(screen.getByTestId('chapter-ch9-sort').getAttribute('data-has-current')).toBe('true');
    expect(screen.getByTestId('topic-bubble-sort').getAttribute('data-has-current')).toBe('true');
    expect(screen.getByTestId('chapter-ch7-graph').getAttribute('data-has-current')).toBe('false');
    expect(screen.getAllByTestId(/^algo-/).filter((item) => item.getAttribute('aria-current') === 'true')).toHaveLength(1);
  });

  it('renders planned topics as non-interactive rows with no algorithm target', () => {
    render(<Harness />);
    const huffman = screen.getByTestId('topic-huffman');
    expect(huffman.tagName).toBe('DIV');
    expect(huffman.getAttribute('aria-disabled')).toBe('true');
    expect(huffman.textContent).toContain('待完善');
    expect(within(huffman).queryByTestId(/^algo-/)).toBeNull();
    expect(screen.getByTestId('chapter-ch5-string').textContent).toContain('待完善');
  });

  it('uses native buttons and keeps folding presentation-only', () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    for (const button of [
      screen.getByTestId('chapter-ch9-sort'),
      screen.getByTestId('topic-bubble-sort'),
      screen.getByTestId('algo-bubble'),
      screen.getByTestId('sidebar-collapse'),
      screen.getByTestId('topic-quick-sort'),
    ]) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.hasAttribute('disabled')).toBe(false);
    }
    fireEvent.click(screen.getByTestId('chapter-ch9-sort'));
    fireEvent.click(screen.getByTestId('topic-quick-sort'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('collapses to a chapter rail and re-expands the chosen chapter', () => {
    render(<Harness initialCollapsed />);
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('true');
    expect(screen.getByTestId('sidebar-expand')).toBeTruthy();
    expect(screen.queryByTestId('sidebar-collapse')).toBeNull();

    expect(screen.getByTestId('rail-chapter-ch7-graph')).toBeTruthy();
    expect(screen.getByTestId('rail-chapter-ch9-sort').getAttribute('data-has-current')).toBe('true');
    expect(screen.getByTestId('rail-current').textContent).toContain(catalog.bubble.icon);

    fireEvent.click(screen.getByTestId('rail-chapter-ch7-graph'));
    expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe('false');
    expect(screen.getByTestId('chapter-ch7-graph').getAttribute('aria-expanded')).toBe('true');
  });
});
