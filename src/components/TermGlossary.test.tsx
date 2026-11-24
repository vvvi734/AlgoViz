import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../i18n/I18nProvider';
import { TermGlossary } from './TermGlossary';

describe('TermGlossary', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the full English name and Chinese meaning in Chinese mode', () => {
    render(
      <I18nProvider>
        <TermGlossary conceptId="adt" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('term-glossary').textContent).toContain(
      'ADT（Abstract Data Type，抽象数据类型）',
    );
    expect(screen.getByTestId('term-glossary').textContent).toContain('术语说明');
  });

  it('shows algorithm-specific abbreviations without duplicating the title gloss', () => {
    render(
      <I18nProvider>
        <TermGlossary algorithmId="bfs" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('term-glossary').textContent).toContain('FIFO');
    expect(screen.getByTestId('term-glossary').textContent).toContain('discovered');
    expect(screen.getByTestId('term-glossary').textContent).not.toContain(
      'BFS（Breadth-First Search，广度优先搜索）',
    );
  });

  it('renders nothing in English mode', () => {
    window.localStorage.setItem('algolens-lang', 'en');
    const { container } = render(
      <I18nProvider>
        <TermGlossary algorithmId="kmp" />
      </I18nProvider>,
    );

    expect(container.querySelector('[data-testid="term-glossary"]')).toBeNull();
    expect(container.textContent).not.toContain('术语说明');
  });
});
