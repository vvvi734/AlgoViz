import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n } from '../../i18n/I18nProvider';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ReferenceCodePanel } from './ReferenceCodePanel';

const reviewedAlgorithms = [
  {
    id: 'seqlist',
    name: '顺序表',
    zh: '插入允许 index == length 表示追加，但 length == capacity 时必须拒绝：合法范围同时受有效元素数和物理数组容量约束。',
    en: 'Insertion accepts index == length as append, but rejects length == capacity: the legal range is bounded by both the live count and the physical array.',
  },
  {
    id: 'stack',
    name: '栈',
    zh: '判满依据是 top 而不是元素计数：top == capacity-1 时再自增就会写出数组边界。',
    en: 'The full check uses top, not a count: top == capacity-1 means the next increment would write past the array.',
  },
  {
    id: 'huffman',
    name: '哈夫曼树',
    zh: '频率是主键；插入序号用于打破平局，因此相同权值也会得到确定的树形。',
    en: 'Frequency is primary; order breaks ties, so equal weights still produce a deterministic tree shape.',
  },
  {
    id: 'bfs',
    name: '广度优先遍历',
    zh: '队列中只保存已发现的顶点；visited 在入队时置位，所以同一顶点不可能再次入队。',
    en: 'The queue holds only discovered vertices; visited is set at enqueue time, so no vertex can enter twice.',
  },
] as const;

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

async function waitForCode() {
  await waitFor(() => expect(screen.getByTestId('reference-code-fallback')).toBeTruthy());
}

describe('BATCH-03 reference code viewer and copy', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  for (const algorithm of reviewedAlgorithms) {
    it(`shows and copies ${algorithm.id} Chinese then English comments`, async () => {
      render(panel(algorithm.id, algorithm.name));
      await waitForCode();

      const zhCode = screen.getByTestId('reference-code-fallback').textContent ?? '';
      expect(zhCode).toContain(algorithm.zh);
      expect(zhCode).not.toContain(algorithm.en);

      fireEvent.click(screen.getByTestId('reference-copy'));
      await waitFor(() => expect(screen.getByTestId('reference-copy').textContent).toContain('已复制'));
      const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
      const zhCopy = String(writeText.mock.calls[0][0]);
      expect(zhCopy).toContain(algorithm.zh);
      expect(zhCopy).not.toContain(algorithm.en);

      fireEvent.click(screen.getByTestId('test-toggle-language'));
      await waitFor(() =>
        expect(screen.getByTestId('reference-code-fallback').textContent).toContain(algorithm.en),
      );

      const enCode = screen.getByTestId('reference-code-fallback').textContent ?? '';
      expect(enCode).toContain(algorithm.en);
      expect(enCode).not.toMatch(/[\u3400-\u9fff]/);

      fireEvent.click(screen.getByTestId('reference-copy'));
      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
      const enCopy = String(writeText.mock.calls[1][0]);
      expect(enCopy).toContain(algorithm.en);
      expect(enCopy).not.toMatch(/[\u3400-\u9fff]/);
      expect(enCopy).toContain('int main');
    });
  }
});
