import { fireEvent, render, screen, within } from '@testing-library/react';
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

function openDetails() {
  const toggle = screen.getByTestId('guide-details-toggle');
  fireEvent.click(toggle);
  return screen.getByTestId('guide-details');
}

describe('UX-01B AlgorithmGuide', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the one-line framing, core headline, 4 stages and memory before details', () => {
    renderGuide();

    expect(screen.getByTestId('guide-title').textContent).toContain('一句话理解');
    expect(screen.getByTestId('guide-title').textContent).toContain('Dijkstra');
    expect(screen.getByTestId('guide-problem').textContent).toContain('带权图');
    expect(screen.getByTestId('guide-core-headline').textContent).toContain('贪心选最近');
    expect(screen.getByTestId('guide-core').textContent).toContain('最小堆');
    expect(screen.getByTestId('guide-diagram-dijkstra')).toBeTruthy();

    const stages = within(screen.getByTestId('guide-stage-list')).getAllByRole('listitem');
    expect(stages).toHaveLength(4);
    expect(stages[0].textContent).toContain('初始化距离表');
    expect(stages[2].textContent).toContain('松弛出边');
    expect(screen.getByTestId('guide-memory').textContent).toContain('选最近');

    expect(screen.getByTestId('guide-details-toggle').getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('guide-details')).toBeNull();
  });

  it('keeps every full step and knowledge section in the expandable details', () => {
    renderGuide();
    const details = openDetails();

    expect(screen.getByTestId('guide-details-toggle').getAttribute('aria-expanded')).toBe('true');
    expect(within(details).getByText('完整执行步骤')).toBeTruthy();
    expect(details.textContent).toContain('初始化距离表和候选堆');
    expect(details.textContent).toContain('O((V + E) log V)');
    expect(details.textContent).toContain('适用条件与关键限制');
    expect(details.textContent).toContain('常见错误');
    expect(screen.getByTestId('guide-source').textContent).toContain('原创导学');

    fireEvent.click(screen.getByTestId('guide-details-toggle'));
    expect(screen.queryByTestId('guide-details')).toBeNull();
  });

  it('provides an explicit collapse action without any player controls', () => {
    const onCollapse = renderGuide();
    expect(screen.getByTestId('guide-start').textContent).toContain('开始看动画');
    expect(screen.queryByTestId('play-btn')).toBeNull();
    fireEvent.click(screen.getByTestId('guide-start'));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it('renders a safe catalog fallback without invented stages, details or memory', () => {
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
    expect(screen.queryByTestId('guide-details-toggle')).toBeNull();
    expect(screen.queryByText('完整执行步骤')).toBeNull();
    expect(screen.queryByText('算法整体流程')).toBeNull();
  });

  it('falls back to one compact line when a long course has no phase-sized stages', () => {
    const linkedGuide = buildAlgorithmGuide(
      'linked',
      lessonRegistry.byAlgorithm('linked'),
      ALGORITHM_CATALOG.linked,
    );
    renderGuide(linkedGuide, '单向链表');

    expect(screen.queryByTestId('guide-stage-list')).toBeNull();
    expect(screen.getByTestId('guide-flow-fallback').textContent).toContain('8 个步骤');
    expect(screen.getByTestId('guide-core').textContent).toContain('next');
    expect(screen.queryByTestId('guide-details')).toBeNull();

    openDetails();
    expect(screen.getByTestId('guide-details').textContent).toContain('解除引用');
  });

  it('renders an empty state when no guide metadata exists', () => {
    renderGuide(buildAlgorithmGuide('missing', undefined, undefined), '自定义算法');
    expect(screen.getByTestId('guide-empty').textContent).toContain('还没有可用的导学内容');
  });

  it('switches all guide headings and content to English', () => {
    window.localStorage.setItem('algolens-lang', 'en');
    renderGuide();
    expect(screen.getByTestId('guide-title').textContent).toContain('One-line understanding');
    expect(screen.getByTestId('guide-title').textContent).toContain('Dijkstra');
    expect(screen.getByTestId('guide-problem').textContent).toContain('weighted graph');
    expect(screen.getByTestId('guide-core-headline').textContent).toContain('Greedy');
    expect(screen.getByTestId('guide-stage-list').textContent).toContain('Initialise the distance table');
    expect(screen.getByTestId('guide-memory').textContent).toContain('nearest');

    openDetails();
    expect(screen.getByText('Complete execution steps')).toBeTruthy();
    expect(screen.getByText('Prerequisite knowledge')).toBeTruthy();
    expect(screen.getAllByText('Common mistakes').length).toBeGreaterThan(0);
  });
});
