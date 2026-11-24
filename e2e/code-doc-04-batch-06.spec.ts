import { expect, openAdvancedPanels, openCodePanel, selectAlgorithm, test } from './fixtures';

// Four representative BATCH-06 algorithms: a stable exchange sort, a tree
// tournament, an external multiway merge, and a file index with overflow chains.
const cases = [
  {
    id: 'bubble',
    cFile: 'bubble_sort.c',
    zh: '一整趟没有交换说明剩余前缀的每一对相邻元素都有序；由传递性可知整个前缀已经有序，停止不会漏排。',
    en: 'A pass without a swap means every adjacent pair in the remaining prefix is ordered; by transitivity the whole prefix is sorted, so stopping loses no work.',
  },
  {
    id: 'tournament',
    cFile: 'tournament_sort.c',
    zh: '遍历从赢家叶结点之父开始，而不是从叶开始：叶状态已经由 active[] 表示。',
    en: "The walk starts at the parent of the winner's leaf, not at the leaf: the leaf itself is already represented by active[].",
  },
  {
    id: 'multiway',
    cFile: 'multiway_merge.c',
    zh: '最后一次写出在循环之外，因为最后一块通常不满；丢掉它会丢失记录。',
    en: 'The final flush is outside the loop because the last block is usually partial; dropping it would lose records.',
  },
  {
    id: 'isam',
    cFile: 'isam_file.c',
    zh: '主块末键只是最大值的起点；真实最大值可能位于该块的溢出链中。',
    en: "The main block's last key is only a starting maximum; the true maximum may live in this block's overflow chain.",
  },
];

test('CODE-DOC-04-BATCH-06 representative display and copy', async ({ page }) => {
  test.setTimeout(360_000);
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 60_000 });
  await openCodePanel(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  for (const item of cases) {
    await selectAlgorithm(page, item.id);
    await openAdvancedPanels(page);
    await expect(page.getByTestId('reference-code-panel')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('reference-file-name')).toHaveText(item.cFile, { timeout: 60_000 });
    await expect(page.getByTestId('reference-code-panel')).toHaveAttribute(
      'data-comment-language',
      'zh',
    );
    await expect(page.locator('[data-testid="reference-code-viewer"] .monaco-editor')).toBeVisible({
      timeout: 60_000,
    });

    await page.getByTestId('reference-copy').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(item.zh);
    const zhCopy = await page.evaluate(() => navigator.clipboard.readText());
    expect(zhCopy).not.toContain(item.en);

    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('reference-code-panel')).toHaveAttribute(
      'data-comment-language',
      'en',
    );
    await page.getByTestId('reference-copy').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(item.en);
    const enCopy = await page.evaluate(() => navigator.clipboard.readText());
    expect(enCopy).not.toMatch(/[\u4e00-\u9fff]/);

    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('reference-code-panel')).toHaveAttribute(
      'data-comment-language',
      'zh',
    );
  }
});
