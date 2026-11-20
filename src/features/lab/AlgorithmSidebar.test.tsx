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
  conceptId = null,
  onSelect = vi.fn(),
  onSelectConcept = vi.fn(),
}: {
  initialCollapsed?: boolean;
  selected?: string;
  conceptId?: string | null;
  onSelect?: (id: string) => void;
  onSelectConcept?: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [openChapters, setOpenChapters] = useState<ReadonlySet<string>>(new Set(['ch9-sort']));
  const [openTopics, setOpenTopics] = useState<ReadonlySet<string>>(new Set(['bubble-sort']));
  return (
    <I18nProvider>
      <AlgorithmSidebar
        catalog={catalog}
        currentAlgo={selected}
        currentConceptId={conceptId}
        onSelect={onSelect}
        onSelectConcept={onSelectConcept}
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
        onExpandAll={(chapters, topics) => {
          setOpenChapters(new Set(chapters));
          setOpenTopics(new Set(topics));
        }}
        onCollapseAll={() => {
          setOpenChapters(new Set());
          setOpenTopics(new Set());
        }}
      />
    </I18nProvider>
  );
}

const nav = buildTextbookNavigation(catalog);

describe('AlgorithmSidebar — textbook chapters (UX-03)', () => {
  it('renders every authored chapter in source order plus every algorithm', () => {
    render(<Harness />);
    const chapters = screen.getAllByTestId(/^chapter-/);
    expect(chapters).toHaveLength(nav.length);
    for (const chapter of nav) {
      expect(screen.getByTestId(`chapter-${chapter.id}`)).toBeTruthy();
      const count = chapter.algorithmCount;
      const pendingOnly = chapter.topics.every((topic) => topic.category === 'pending');
      if (count > 0) {
        expect(within(screen.getByTestId(`chapter-${chapter.id}`)).getByText(String(count))).toBeTruthy();
      } else if (pendingOnly) {
        expect(within(screen.getByTestId(`chapter-${chapter.id}`)).getByText('待完善')).toBeTruthy();
      } else {
        expect(within(screen.getByTestId(`chapter-${chapter.id}`)).queryByText('待完善')).toBeNull();
      }
    }
    expect(screen.getAllByTestId(/^algo-/)).toHaveLength(Object.keys(catalog).length);
    expect(textbookAlgorithmIds(nav)).toHaveLength(Object.keys(catalog).length);
    expect(screen.getByTestId('sidebar').querySelectorAll('.alg-icon')).toHaveLength(0);
    expect(screen.getByTestId('sidebar').querySelector('.textbook-direct-algorithm')).toBeNull();
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

    // The current direct entry is visible because only its chapter needs to open.
    expect(screen.getByTestId('topic-bubble-sort').getAttribute('data-direct')).toBe('true');
    expect(screen.getByTestId('topic-bubble-sort').getAttribute('data-kind')).toBe('algorithm');
    expect(screen.getByTestId('topic-bubble-sort').hasAttribute('aria-expanded')).toBe(false);
    expect(screen.getByTestId('topic-quick-sort').getAttribute('data-direct')).toBe('true');
  });

  it('renders a single-algorithm topic as one direct row, not a duplicate hierarchy', () => {
    render(<Harness />);
    const bubbleTopic = screen.getByTestId('topic-bubble-sort');
    expect(bubbleTopic.getAttribute('data-direct')).toBe('true');
    expect(bubbleTopic.getAttribute('data-has-current')).toBe('true');
    expect(bubbleTopic.querySelector('.textbook-topic-head')).toBeNull();
    expect(within(bubbleTopic).getAllByText('冒泡排序')).toHaveLength(1);
    expect(within(bubbleTopic).getByTestId('algo-bubble')).toBeTruthy();
    expect(within(bubbleTopic).getAllByTestId(/^algo-/)).toHaveLength(1);
  });

  it('keeps multi-algorithm topics expandable and collapses them independently', () => {
    render(<Harness />);
    const shortest = screen.getByTestId('topic-shortest-path');
    expect(shortest.tagName).toBe('BUTTON');
    expect(shortest.getAttribute('data-kind')).toBe('group');
    expect(shortest.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(shortest);
    expect(shortest.getAttribute('aria-expanded')).toBe('true');
    const children = within(screen.getByTestId('topic-shortest-path').closest('section')!).getAllByTestId(/^algo-/);
    expect(children).toHaveLength(3);
    for (const child of children) {
      expect(child.getAttribute('data-kind')).toBe('algorithm');
      expect(child.getAttribute('data-category')).toBe('visual');
      expect(child.querySelector('.textbook-category.is-visual')?.textContent).toBe('▶');
      expect(child.textContent?.startsWith('▶')).toBe(true);
    }
    fireEvent.click(shortest);
    expect(shortest.getAttribute('aria-expanded')).toBe('false');
  });

  it('allows multiple chapters and topics to be open without closing siblings', () => {
    render(<Harness />);
    const sort = screen.getByTestId('chapter-ch9-sort');
    const search = screen.getByTestId('chapter-ch8-search');
    fireEvent.click(search);
    expect(search.getAttribute('aria-expanded')).toBe('true');
    expect(sort.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('topic-bst').getAttribute('data-direct')).toBe('true');
    expect(screen.getByTestId('algo-bst')).toBeTruthy();

    fireEvent.click(screen.getByTestId('chapter-ch7-graph'));
    fireEvent.click(screen.getByTestId('topic-mst'));
    expect(screen.getByTestId('topic-mst').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('algo-prim')).toBeTruthy();
    expect(screen.getByTestId('algo-bubble')).toBeTruthy();

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

  it('opens authored concept lessons and keeps un-authored concepts static', () => {
    const onSelectConcept = vi.fn();
    render(<Harness onSelectConcept={onSelectConcept} />);
    const mergeSort = screen.getByTestId('topic-merge-sort');
    expect(mergeSort.getAttribute('data-kind')).toBe('algorithm');
    expect(mergeSort.getAttribute('data-category')).toBe('visual');
    expect(screen.getByTestId('algo-merge')).toBeTruthy();
    expect(within(mergeSort).queryByText('可视化')).toBeNull();
    expect(mergeSort.querySelector('.textbook-category.is-visual')?.textContent).toBe('▶');

    const shellSort = screen.getByTestId('topic-shell-sort');
    expect(shellSort.getAttribute('data-kind')).toBe('algorithm');
    expect(screen.getByTestId('algo-shell')).toBeTruthy();

    const huffman = screen.getByTestId('topic-huffman');
    expect(huffman.getAttribute('data-kind')).toBe('algorithm');
    expect(huffman.getAttribute('data-category')).toBe('visual');
    expect(screen.getByTestId('algo-huffman')).toBeTruthy();

    const graphBasics = screen.getByTestId('topic-graph-basics');
    expect(graphBasics.tagName).toBe('BUTTON');
    expect(graphBasics.getAttribute('data-kind')).toBe('concept');
    expect(graphBasics.getAttribute('data-category')).toBe('theory');
    expect(graphBasics.getAttribute('aria-disabled')).toBeNull();
    expect(within(graphBasics).queryByText('理论')).toBeNull();
    expect(graphBasics.querySelector('.textbook-category.is-theory')?.textContent).toBe('▤');
    expect(graphBasics.getAttribute('data-concept-id')).toBe('graph-basics');
    fireEvent.click(graphBasics);
    expect(onSelectConcept).toHaveBeenCalledWith('graph-basics');

    const unAuthored = screen.getByTestId('topic-string-storage');
    expect(unAuthored.tagName).toBe('DIV');
    expect(unAuthored.getAttribute('aria-disabled')).toBe('true');
    expect(unAuthored.getAttribute('data-category')).toBe('pending');
    expect(unAuthored.textContent).toContain('待完善');
    expect(unAuthored.querySelector('.textbook-category')).toBeNull();
    expect(within(unAuthored).queryByRole('button')).toBeNull();

    const planned = screen.getByTestId('topic-threaded-tree');
    expect(planned.getAttribute('data-category')).toBe('pending');
    expect(planned.textContent).toContain('待完善');
    expect(planned.querySelector('.textbook-category')).toBeNull();

    const group = screen.getByTestId('topic-shortest-path');
    expect(group.getAttribute('data-category')).toBe('visual');
    expect(within(group).queryByText('可视化')).toBeNull();
    expect(group.querySelector('.textbook-category.is-visual')?.textContent).toBe('▶');
  });

  it('marks the two new tree theory lessons without making static SVGs visual', () => {
    render(<Harness />);
    const storage = screen.getByTestId('topic-tree-basics');
    expect(storage.getAttribute('data-kind')).toBe('concept');
    expect(storage.getAttribute('data-category')).toBe('theory');
    expect(storage.getAttribute('data-concept-id')).toBe('tree-storage');
    expect(within(storage).queryByText('理论')).toBeNull();
    expect(storage.querySelector('.textbook-category.is-theory')?.textContent).toBe('▤');
    expect(storage.textContent?.startsWith('▤')).toBe(true);

    const conversion = screen.getByTestId('topic-forest-conversion');
    expect(conversion.getAttribute('data-kind')).toBe('concept');
    expect(conversion.getAttribute('data-category')).toBe('theory');
    expect(conversion.getAttribute('data-concept-id')).toBe('forest-conversion');
    expect(within(conversion).queryByText('理论')).toBeNull();
    expect(conversion.querySelector('.textbook-category.is-theory')?.textContent).toBe('▤');

    const traversal = screen.getByTestId('topic-binary-tree-traversal');
    expect(traversal.getAttribute('data-category')).toBe('visual');
    expect(within(traversal).queryByText('可视化')).toBeNull();
    expect(traversal.querySelector('.textbook-category.is-visual')?.textContent).toBe('▶');
    expect(traversal.textContent?.startsWith('▶')).toBe(true);
    expect(traversal.querySelector('.textbook-direct-algorithm')).toBeNull();
    expect(traversal.querySelector('.alg-icon')).toBeNull();
  });

  it('uses one toggle to collapse every open branch, then expand all', () => {
    render(<Harness />);
    const sort = screen.getByTestId('chapter-ch9-sort');
    const graph = screen.getByTestId('chapter-ch7-graph');
    const search = screen.getByTestId('chapter-ch8-search');
    const toggle = screen.getByTestId('sidebar-toggle-all');
    expect(toggle.getAttribute('data-expanded')).toBe('true');
    expect(toggle.textContent).toContain('全部收起');

    fireEvent.click(toggle);
    expect(sort.getAttribute('aria-expanded')).toBe('false');
    expect(graph.getAttribute('aria-expanded')).toBe('false');
    expect(search.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByTestId('topic-bubble-sort').getAttribute('data-has-current')).toBe('true');
    expect(screen.getByTestId('sidebar-toggle-all').getAttribute('data-expanded')).toBe('false');
    expect(screen.getByTestId('sidebar-toggle-all').textContent).toContain('全部展开');

    fireEvent.click(screen.getByTestId('sidebar-toggle-all'));
    for (const chapter of nav) {
      expect(screen.getByTestId(`chapter-${chapter.id}`).getAttribute('aria-expanded')).toBe('true');
    }
    expect(screen.getByTestId('topic-shortest-path').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('topic-mst').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('algo-prim')).toBeTruthy();
  });

  it('uses native buttons and keeps folding presentation-only', () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    for (const button of [
      screen.getByTestId('chapter-ch9-sort'),
      screen.getByTestId('algo-bubble'),
      screen.getByTestId('algo-quick'),
      screen.getByTestId('sidebar-collapse'),
    ]) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.hasAttribute('disabled')).toBe(false);
    }
    fireEvent.click(screen.getByTestId('algo-quick'));
    expect(onSelect).toHaveBeenCalledWith('quick');
    onSelect.mockClear();
    fireEvent.click(screen.getByTestId('chapter-ch9-sort'));
    fireEvent.click(screen.getByTestId('sidebar-collapse'));
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
