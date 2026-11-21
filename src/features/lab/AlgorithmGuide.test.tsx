import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALGORITHM_CATALOG } from '../../domain/algorithms/catalog.generated';
import { buildAlgorithmGuide } from '../../domain/guides/buildGuide';
import { lessonRegistry } from '../../domain/lessons/registry';
import { I18nProvider } from '../../i18n/I18nProvider';
import { AlgorithmGuide } from './AlgorithmGuide';

const dijkstraGuide = buildAlgorithmGuide(
  'dijkstra',
  lessonRegistry.byAlgorithm('dijkstra'),
  ALGORITHM_CATALOG.dijkstra,
);

function renderGuide(guide = dijkstraGuide, name = 'Dijkstra') {
  const onStart = vi.fn();
  render(
    <I18nProvider>
      <AlgorithmGuide guide={guide} algorithmName={name} onStart={onStart} />
    </I18nProvider>,
  );
  return onStart;
}

describe('algorithm review sheet UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows intro, definition/plain reading, complexity/conditions, the horizontal flow and mistakes', () => {
    renderGuide();

    expect(screen.getByTestId('guide-title').textContent).toContain('算法复习提纲');
    expect(screen.getByTestId('guide-title').textContent).toContain('Dijkstra');
    expect(screen.getByTestId('guide-intro').textContent).toContain('BFS');
    expect(screen.getByTestId('guide-definition').textContent).toContain('非负边权');
    expect(screen.getByTestId('guide-plain').textContent).toContain('报价单');
    expect(screen.getByText('复杂度与适用条件')).toBeTruthy();
    expect(screen.getByTestId('guide-complexity').textContent).toContain('O((V + E) log V)');
    expect(screen.getByTestId('guide-conditions').textContent).toContain('边权必须非负');

    const main = screen.getByTestId('algorithm-flow-section-main');
    expect(main.querySelector('[data-node-id="dijkstra-init"]')?.textContent).toContain('dist[source] = 0');
    expect(main.querySelector('[data-node-id="dijkstra-stale"]')).toBeTruthy();
    expect(main.querySelector('[data-edge-from="dijkstra-skip"][data-edge-to="dijkstra-outer"]')).toBeTruthy();
    expect(screen.queryByTestId('guide-stage-list')).toBeNull();
    expect(screen.getByTestId('guide-flow-title').textContent).toBe('算法整体流程');
    expect(screen.getByText('常见错误与记忆重点')).toBeTruthy();
    expect(screen.getByTestId('guide-pitfalls').textContent).toContain('discovered');
    expect(screen.getByTestId('guide-memory').textContent).toContain('负权');

    // Frame-level Trace copy, the old source row and the details drawer are gone.
    expect(screen.queryByTestId('guide-source')).toBeNull();
    expect(screen.queryByTestId('guide-details-toggle')).toBeNull();
    expect(screen.queryByTestId('guide-details')).toBeNull();
    expect(screen.queryByText('完整执行步骤')).toBeNull();
  });

  it('uses “core operations” for a data-structure course and keeps stages abstract', () => {
    renderGuide(
      buildAlgorithmGuide(
        'linked',
        lessonRegistry.byAlgorithm('linked'),
        ALGORITHM_CATALOG.linked,
      ),
      '单向链表',
    );

    expect(screen.getByTestId('guide-flow-title').textContent).toBe('核心操作');
    expect(screen.getByTestId('guide-flow-kind').textContent).toContain('按操作组织');
    const sections = [
      'algorithm-flow-section-insert-head',
      'algorithm-flow-section-insert-tail',
      'algorithm-flow-section-insert-after',
      'algorithm-flow-section-delete',
      'algorithm-flow-section-traverse',
    ];
    for (const id of sections) expect(screen.getByTestId(id)).toBeTruthy();
    expect(screen.getByTestId('algorithm-flow-section-insert-head').textContent).toContain('操作：头插');
    expect(screen.getByTestId('algorithm-flow').textContent).not.toContain('演示结束');
    expect(screen.queryByTestId('guide-stage-list')).toBeNull();
  });

  it('renders the declarative flow for Kruskal instead of the linear stage cards', () => {
    renderGuide(
      buildAlgorithmGuide(
        'kruskal',
        lessonRegistry.byAlgorithm('kruskal'),
        ALGORITHM_CATALOG.kruskal,
      ),
      'Kruskal',
    );

    const flow = screen.getByTestId('algorithm-flow');
    expect(flow).toBeTruthy();
    expect(screen.queryByTestId('guide-stage-list')).toBeNull();

    const main = screen.getByTestId('algorithm-flow-section-main');
    expect(main.querySelector('[data-node-kind="decision"][data-node-id="connected"]')).toBeTruthy();
    expect(main.querySelector('[data-edge-from="connected"][data-edge-to="skip"]')).toBeTruthy();
    expect(main.querySelector('[data-edge-from="skip"][data-edge-to="edge-loop"]')).toBeTruthy();
    expect(main.textContent).toContain('最小生成森林');
  });

  it('renders KMP as two separated flow sections and merge sort with recursive calls', () => {
    renderGuide(
      buildAlgorithmGuide(
        'kmp',
        lessonRegistry.byAlgorithm('kmp'),
        ALGORITHM_CATALOG.kmp,
      ),
      'KMP',
    );
    expect(screen.getByTestId('algorithm-flow-section-lps')).toBeTruthy();
    expect(screen.queryByTestId('algorithm-flow-section-main')).toBeNull();
    expect(screen.getByTestId('algorithm-flow-section-match')).toBeTruthy();

    // Mobile reflow keeps every exit after the operations on the path; a
    // reader never sees "return the table" before the comparison that exits.
    const lps = screen.getByTestId('algorithm-flow-section-lps');
    const mobileIds = [...lps.querySelectorAll('.algorithm-flow-mobile .flow-mobile-node')]
      .map((node) => node.getAttribute('data-node-id'));
    expect(mobileIds.indexOf('lps-end')).toBeGreaterThan(mobileIds.indexOf('lps-compare'));
    expect(mobileIds[mobileIds.length - 1]).toBe('lps-end');

    renderGuide(
      buildAlgorithmGuide(
        'merge',
        lessonRegistry.byAlgorithm('merge'),
        ALGORITHM_CATALOG.merge,
      ),
      '归并排序',
    );
    const merge = screen.getByTestId('algorithm-flow-section-recursive-range');
    expect(merge.querySelector('[data-node-kind="call"]')).toBeTruthy();
    expect(merge.querySelector('[data-node-kind="subreturn"]')).toBeTruthy();
    expect(merge.textContent).toContain('左半');
  });

  it('provides an explicit start action without any player controls', () => {
    const onStart = renderGuide();
    expect(screen.getByTestId('guide-start').textContent).toContain('开始看动画');
    expect(screen.queryByTestId('play-btn')).toBeNull();
    fireEvent.click(screen.getByTestId('guide-start'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('renders a safe catalog fallback without invented stages or memory', () => {
    renderGuide(
      buildAlgorithmGuide('insertion', undefined, ALGORITHM_CATALOG.insertion),
      '插入排序',
    );
    expect(screen.getByTestId('algorithm-guide').getAttribute('data-source')).toBe('catalog');
    expect(screen.getByTestId('guide-problem').textContent).toContain('有序部分');
    expect(screen.getByTestId('guide-no-steps').textContent).toContain('不会补写');
    expect(screen.getByTestId('guide-catalog-note')).toBeTruthy();
    expect(screen.queryByTestId('guide-stage-list')).toBeNull();
    expect(screen.queryByTestId('guide-memory')).toBeNull();
    expect(screen.queryByText('算法整体流程')).toBeNull();
  });

  it('renders an empty state when no guide metadata exists', () => {
    renderGuide(buildAlgorithmGuide('missing', undefined, undefined), '自定义算法');
    expect(screen.getByTestId('guide-empty').textContent).toContain('还没有可用的导学内容');
  });

  it('switches all guide headings and content to English', () => {
    window.localStorage.setItem('algolens-lang', 'en');
    renderGuide();
    expect(screen.getByTestId('guide-title').textContent).toContain('Algorithm review sheet');
    expect(screen.getByTestId('guide-title').textContent).toContain('Dijkstra');
    expect(screen.getByTestId('guide-intro').textContent).toContain('BFS');
    expect(screen.getByTestId('guide-definition').textContent).toContain('non-negative');
    expect(screen.getByTestId('algorithm-flow').textContent).toContain('dist[source] = 0');
    expect(screen.queryByTestId('guide-stage-list')).toBeNull();
    expect(screen.getByText('Complexity and applicability')).toBeTruthy();
    expect(screen.getByText('Common mistakes & memory')).toBeTruthy();
    expect(screen.getByTestId('guide-memory').textContent).toContain('negative');
  });
});
