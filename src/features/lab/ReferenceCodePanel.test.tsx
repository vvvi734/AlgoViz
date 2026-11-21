import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n } from '../../i18n/I18nProvider';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ReferenceCodePanel } from './ReferenceCodePanel';

function LanguageToggle() {
  const { toggleLang, lang } = useI18n();
  return (
    <button type="button" data-testid="test-toggle-language" onClick={toggleLang}>
      {lang}
    </button>
  );
}

function panel(algorithmId: string, algorithmName: string) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ReferenceCodePanel algorithmId={algorithmId} algorithmName={algorithmName} />
        <LanguageToggle />
      </ThemeProvider>
    </I18nProvider>
  );
}

function renderPanel(algorithmId = 'binary', algorithmName = '二分查找') {
  return render(panel(algorithmId, algorithmName));
}

async function waitForCode() {
  await waitFor(() => expect(screen.getByTestId('reference-code-fallback')).toBeTruthy());
  return screen.getByTestId('reference-code-fallback').textContent ?? '';
}

describe('ReferenceCodePanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('defaults to C, shows read-only source with line numbers and file metadata', async () => {
    renderPanel();
    expect(screen.getByTestId('reference-lang-c').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('reference-file-name').textContent).toBe('binary_search.c');
    await waitForCode();
    expect(screen.getByTestId('reference-code-viewer').getAttribute('data-readonly')).toBe('true');
    expect(screen.getByTestId('reference-code-fallback').textContent).toContain('int Binary_Search');
    expect(screen.getByTestId('reference-code-fallback').textContent).toContain('01');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByTestId('run-btn')).toBeNull();
  });

  it('switches C / C++ / Python and shows the matching implementation', async () => {
    renderPanel();
    await waitForCode();

    fireEvent.click(screen.getByTestId('reference-lang-cpp'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('binary_search.cpp');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('std::vector<int>'),
    );

    fireEvent.click(screen.getByTestId('reference-lang-python'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('binary_search.py');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('def binary_search'),
    );
    expect(screen.getByTestId('reference-code-fallback').textContent).not.toContain('trace(');
  });

  it('copies the complete current source, not just the visible text', async () => {
    renderPanel();
    await waitForCode();
    fireEvent.click(screen.getByTestId('reference-copy'));
    await waitFor(() => expect(screen.getByTestId('reference-copy').textContent).toContain('已复制'));
    const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = String(writeText.mock.calls[0][0]);
    expect(copied).toContain('int Binary_Search');
    expect(copied).toContain('int main(void)');
  });

  it('copies internal annotations in the current UI language', async () => {
    renderPanel('binary', '二分查找');
    await waitForCode();

    fireEvent.click(screen.getByTestId('reference-copy'));
    await waitFor(() => expect(screen.getByTestId('reference-copy').textContent).toContain('已复制'));
    const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    const zhCopy = String(writeText.mock.calls[0][0]);
    expect(zhCopy).toContain('查找窗口是闭区间');
    expect(zhCopy).not.toContain('The window is inclusive');
    expect(zhCopy).toContain('int Binary_Search');

    fireEvent.click(screen.getByTestId('test-toggle-language'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('Binary search in C11'),
    );
    fireEvent.click(screen.getByTestId('reference-copy'));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    const enCopy = String(writeText.mock.calls[1][0]);
    expect(enCopy).toContain('The window is inclusive');
    expect(enCopy).not.toContain('查找窗口是闭区间');
    expect(enCopy).toContain('int Binary_Search');
  });

  it('switches between the principle and shared convenience implementations', async () => {
    renderPanel('bubble', '冒泡排序');
    await waitForCode();
    expect(screen.getByTestId('reference-file-name').textContent).toBe('bubble_sort.c');
    expect(screen.getByTestId('reference-impl-principle').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('reference-impl-convenience').getAttribute('aria-selected')).toBe('false');
    expect(screen.getByTestId('reference-purpose').textContent).toContain('原理实现');

    fireEvent.click(screen.getByTestId('reference-impl-convenience'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('builtin_sorting.c');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('compare_int'),
    );
    expect(screen.getByTestId('reference-purpose').textContent).toContain('简洁实现');
    expect(screen.getByTestId('reference-source').textContent).toContain('实现说明');
    expect(screen.getByTestId('reference-source').textContent).toContain('共享便捷示例');
    expect(screen.getByTestId('reference-source').textContent).not.toContain('许可');

    fireEvent.click(screen.getByTestId('reference-lang-cpp'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('builtin_sorting.cpp');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('std::sort'),
    );
    expect(screen.getByTestId('reference-impl-convenience').getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByTestId('reference-lang-python'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('builtin_sorting.py');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('in_place.sort()'),
    );
  });

  it('falls back to the principle version when the next algorithm has no convenience code', async () => {
    const { rerender } = renderPanel('bubble', '冒泡排序');
    await waitForCode();
    fireEvent.click(screen.getByTestId('reference-impl-convenience'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('compare_int'),
    );

    rerender(panel('merge', '归并排序'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('void MergeSort'),
    );
    expect(screen.getByTestId('reference-file-name').textContent).toBe('merge_sort.c');
    expect(screen.queryByTestId('reference-implementation-tabs')).toBeNull();
  });

  it('keeps the chosen language when switching to another algorithm that supports it', async () => {
    const { rerender } = renderPanel('binary', '二分查找');
    await waitForCode();
    fireEvent.click(screen.getByTestId('reference-lang-python'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('def binary_search'),
    );

    rerender(panel('linked', '单向链表'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('singly_linked_list.py');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('class SinglyLinkedList'),
    );
    expect(screen.getByTestId('reference-lang-python').getAttribute('aria-selected')).toBe('true');
  });

  it('switches comments with the UI language without changing the algorithm or selection', async () => {
    renderPanel('binary', '二分查找');
    await waitForCode();
    expect(screen.getByTestId('reference-lang-c').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('reference-code-fallback').textContent).toContain('AlgoViz 参考代码');
    expect(screen.getByTestId('reference-code-fallback').textContent).toContain('int Binary_Search');

    fireEvent.click(screen.getByTestId('reference-lang-cpp'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('std::vector<int>'),
    );
    const zhCode = screen.getByTestId('reference-code-fallback').textContent ?? '';
    expect(zhCode).toContain('思路：');
    expect(zhCode).toContain('二分查找');

    fireEvent.click(screen.getByTestId('test-toggle-language'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('AlgoViz reference implementation'),
    );
    expect(screen.getByTestId('reference-code-fallback').textContent).toContain('binary_search_index');
    expect(screen.getByTestId('reference-code-fallback').textContent).not.toContain('思路：');
    expect(screen.getByTestId('reference-lang-cpp').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('reference-file-name').textContent).toBe('binary_search.cpp');
  });

  it('copies the complete source with comments in the current UI language', async () => {
    renderPanel('binary', '二分查找');
    await waitForCode();
    fireEvent.click(screen.getByTestId('test-toggle-language'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('Binary search in C11'),
    );

    fireEvent.click(screen.getByTestId('reference-copy'));
    await waitFor(() => expect(screen.getByTestId('reference-copy').textContent).toContain('Copied'));
    const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    const copied = String(writeText.mock.calls[0][0]);
    expect(copied).toContain('Binary search in C11');
    expect(copied).not.toContain('教材');
    expect(copied).toContain('int Binary_Search');
    expect(copied).toContain('int main(void)');
  });

  it('keeps the convenience implementation selected while comments change language', async () => {
    renderPanel('bubble', '冒泡排序');
    await waitForCode();
    fireEvent.click(screen.getByTestId('reference-impl-convenience'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('compare_int'),
    );
    expect(screen.getByTestId('reference-impl-convenience').getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByTestId('test-toggle-language'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('qsort'),
    );
    expect(screen.getByTestId('reference-impl-convenience').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('reference-file-name').textContent).toBe('builtin_sorting.c');
  });

  it('shows an explicit unavailable state instead of borrowing another algorithm code', () => {
    renderPanel('unknown-algorithm', '未知算法');
    expect(screen.getByTestId('reference-code-unavailable').textContent).toContain('暂未收录');
    expect(screen.queryByTestId('reference-lang-c')).toBeNull();
    expect(screen.queryByTestId('reference-code-viewer')).toBeNull();
  });
});
