import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { VISUAL_GUIDE_ALGORITHMS, VisualGuide } from './VisualGuide';

function renderGuide(algorithmId: string) {
  return render(
    <I18nProvider>
      <VisualGuide algorithmId={algorithmId} />
    </I18nProvider>,
  );
}

describe('UIX-V02 VisualGuide', () => {
  it('keeps a collapsed symbol summary plus two optional reading notes for Huffman', () => {
    renderGuide('huffman');
    const guide = screen.getByTestId('visual-guide');

    expect(guide.dataset.algorithm).toBe('huffman');
    expect(guide.textContent).toContain('画面');
    expect(guide.textContent).toContain('黄=当前合并');
    expect(guide.textContent).toContain('先看');
    expect(guide.textContent).toContain('分区');
    expect(screen.getByTestId('visual-guide-note').textContent).toContain('建树只看堆');
    expect(guide.querySelectorAll('.visual-guide-body dl div')).toHaveLength(2);
    expect(guide.textContent).not.toContain('当前做什么');
    expect(guide.textContent).not.toContain('为什么这样做');
  });

  it.each(VISUAL_GUIDE_ALGORITHMS)('covers %s without an empty panel', (algorithmId) => {
    renderGuide(algorithmId);
    expect(screen.getByTestId('visual-guide').dataset.algorithm).toBe(algorithmId);
    expect(screen.getByTestId('visual-guide-note').textContent.trim().length).toBeGreaterThan(0);
  });

  it('stays absent for algorithms without a visual guide', () => {
    renderGuide('bubble');
    expect(screen.queryByTestId('visual-guide')).toBeNull();
  });
});
