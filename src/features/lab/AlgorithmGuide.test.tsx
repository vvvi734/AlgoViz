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
  const onStart = vi.fn();
  render(
    <I18nProvider>
      <AlgorithmGuide guide={guide} algorithmName={name} onStart={onStart} />
    </I18nProvider>,
  );
  return onStart;
}

describe('UX-SIMPLIFY-02 AlgorithmGuide review sheet', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows core idea, the complete flow, complexity/conditions and memory without a details drawer', () => {
    renderGuide();

    expect(screen.getByTestId('guide-title').textContent).toContain('算法复习提纲');
    expect(screen.getByTestId('guide-title').textContent).toContain('Dijkstra');
    expect(screen.getByTestId('guide-core-headline').textContent).toContain('贪心选最近');
    expect(screen.getByTestId('guide-core').textContent).toContain('最小堆');

    const stages = within(screen.getByTestId('guide-stage-list')).getAllByRole('listitem');
    expect(stages).toHaveLength(7);
    expect(stages[0].textContent).toContain('初始化距离表和候选堆');
    expect(stages[4].textContent).toContain('能变小才松弛');
    expect(screen.getByTestId('guide-flow-count').textContent).toContain('7 步');
    expect(screen.getByText('复杂度与适用条件')).toBeTruthy();
    expect(screen.getByText('O((V + E) log V)')).toBeTruthy();
    expect(screen.getByText('边权必须非负', { exact: false })).toBeTruthy();
    expect(screen.getByText('常见错误与记忆重点')).toBeTruthy();
    expect(screen.getByTestId('guide-memory').textContent).toContain('选最近');

    expect(screen.queryByTestId('guide-details-toggle')).toBeNull();
    expect(screen.queryByTestId('guide-details')).toBeNull();
    expect(screen.queryByText('完整执行步骤')).toBeNull();
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

  it('uses every real step for a long course instead of a fallback line', () => {
    const linkedGuide = buildAlgorithmGuide(
      'linked',
      lessonRegistry.byAlgorithm('linked'),
      ALGORITHM_CATALOG.linked,
    );
    renderGuide(linkedGuide, '单向链表');

    expect(within(screen.getByTestId('guide-stage-list')).getAllByRole('listitem')).toHaveLength(8);
    expect(screen.getByTestId('guide-stage-list').textContent).toContain('解除引用');
    expect(screen.queryByTestId('guide-flow-fallback')).toBeNull();
    expect(screen.getByTestId('guide-core').textContent).toContain('next');
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
    expect(screen.getByTestId('guide-core-headline').textContent).toContain('Greedy');
    expect(screen.getByTestId('guide-stage-list').textContent).toContain('Initialise the distance table and candidate heap');
    expect(screen.getByText('Complexity and applicability')).toBeTruthy();
    expect(screen.getByText('Common mistakes & memory')).toBeTruthy();
    expect(screen.getByTestId('guide-memory').textContent).toContain('nearest');
  });
});
