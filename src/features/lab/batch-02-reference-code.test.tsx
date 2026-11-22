import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n } from '../../i18n/I18nProvider';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ReferenceCodePanel } from './ReferenceCodePanel';

const reviewedAlgorithms = [
  {
    id: 'infix-to-postfix',
    name: '中缀转后缀',
    zh: '扫描结束后不会再有 token 决定剩余顺序；必须清空栈，让低优先级运算符也进入输出。',
    en: 'After the scan no later token can decide the remaining order; flush the stack so lower-priority operators still reach the output.',
  },
  {
    id: 'sparse-transpose',
    name: '稀疏矩阵转置',
    zh: 'q 是本列的下一个空闲槽，而不是全局写指针；每列都有独立移动的游标，因此各列可以分别回填。',
    en: "q is this column's next free slot, not a global write counter. Every column has its own moving cursor, so columns can be filled independently.",
  },
  {
    id: 'threaded-inorder',
    name: '中序线索二叉树',
    zh: '线索目标放在独立字段中，真实左/右孩子永不被覆盖；ltag/rtag 告诉遍历哪个指针才是有效的。',
    en: 'Thread targets live in separate fields, so a real left/right child is never overwritten. ltag/rtag tell traversal which pointer is meaningful.',
  },
  {
    id: 'block-search',
    name: '分块查找',
    zh: '块内并未保证有序，因此只能线性扫描判等；在这里用二分会假设一种索引从未承诺过的顺序。',
    en: 'Inside a block the values are not promised sorted, so only a linear equality scan is valid. A binary search here would assume an ordering the index never guarantees.',
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

describe('BATCH-02 reference code viewer and copy', () => {
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
