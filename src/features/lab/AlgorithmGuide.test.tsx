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
  const onCollapse = vi.fn();
  render(
    <I18nProvider>
      <AlgorithmGuide guide={guide} algorithmName={name} onCollapse={onCollapse} />
    </I18nProvider>,
  );
  return onCollapse;
}

describe('UX-01 AlgorithmGuide', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the problem, core idea, real steps, complexity, conditions and memory hook', () => {
    renderGuide();

    expect(screen.getByTestId('guide-title').textContent).toContain('Dijkstra · 算法导学');
    expect(screen.getByTestId('guide-problem').textContent).toContain('带权图');
    expect(screen.getByTestId('guide-core').textContent).toContain('最小堆');
    expect(screen.getByTestId('guide-diagram-dijkstra')).toBeTruthy();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(5);
    expect(screen.getByText(/O\(\(V \+ E\) log V\)/)).toBeTruthy();
    expect(screen.getByText('适用条件与关键限制')).toBeTruthy();
    expect(screen.getByTestId('guide-memory').textContent).toContain('距离表');
    expect(screen.getByTestId('guide-source').textContent).toContain('原创导学');
  });

  it('provides an explicit collapse action without any player controls', () => {
    const onCollapse = renderGuide();
    expect(screen.getByTestId('guide-collapse').textContent).toContain('收起算法导学');
    expect(screen.queryByTestId('play-btn')).toBeNull();
    fireEvent.click(screen.getByTestId('guide-collapse'));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it('renders a safe catalog fallback without invented steps or memory copy', () => {
    renderGuide(
      buildAlgorithmGuide('insertion', undefined, ALGORITHM_CATALOG.insertion),
      '插入排序',
    );
    expect(screen.getByTestId('algorithm-guide').getAttribute('data-source')).toBe('catalog');
    expect(screen.getByTestId('guide-problem').textContent).toContain('有序部分');
    expect(screen.getByTestId('guide-no-steps').textContent).toContain('不会补写');
    expect(screen.getByTestId('guide-catalog-note')).toBeTruthy();
    expect(screen.queryByTestId('guide-memory')).toBeNull();
    expect(screen.queryByText('完整执行步骤')).not.toBeNull();
  });

  it('renders an empty state when no guide metadata exists', () => {
    renderGuide(buildAlgorithmGuide('missing', undefined, undefined), '自定义算法');
    expect(screen.getByTestId('guide-empty').textContent).toContain('还没有可用的导学内容');
  });

  it('switches all guide headings and content to English', () => {
    window.localStorage.setItem('algolens-lang', 'en');
    renderGuide();
    expect(screen.getByTestId('guide-title').textContent).toContain('Dijkstra · Algorithm guide');
    expect(screen.getByText('What problem does it solve?')).toBeTruthy();
    expect(screen.getByText('Complete execution steps')).toBeTruthy();
    expect(screen.getByTestId('guide-memory').textContent).toContain('distance table');
  });
});
