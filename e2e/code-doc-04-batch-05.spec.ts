import { expect, openAdvancedPanels, openCodePanel, selectAlgorithm, test } from './fixtures';

// Four representative BATCH-05 algorithms: a scan with a sentinel result,
// two multi-level split decisions, and an open-addressing sentinel.
const cases = [
  {
    id: 'linear',
    cFile: 'linear_search.c',
    zh: '-1 不属于任何有效下标，因此真实命中下标 0 不会与失败值混淆。',
    en: '-1 lies outside every valid index, so a real match at index 0 is never confused with the failure value.',
  },
  {
    id: 'btree',
    cFile: 'btree.c',
    zh: '4 阶的中位下标是 1；它被移入父结点并从孩子中删除，两半不会同时保留它。',
    en: 'The median index is 1 for order 4; it is moved to the parent and removed from the child, so the two halves never both retain it.',
  },
  {
    id: 'bplus-tree',
    cFile: 'bplus_tree.c',
    zh: '溢出键存在后按 2/2 分裂：右叶保留 keys 2、3，左叶保留 keys 0、1，提升的分隔键仍留在右叶。',
    en: 'The split is 2/2 after the overflow key is present: right keeps keys 2 and 3, left keeps keys 0 and 1, and the promoted separator stays in the right leaf.',
  },
  {
    id: 'hash-probe',
    cFile: 'hash_probe.c',
    zh: 'EMPTY 哨兵是 -1，因此这种表示假设键非负；把 -1 当作真实键存入会让该槽与空槽无法区分。',
    en: 'The EMPTY sentinel is -1, so this representation assumes non-negative keys; storing -1 as a real key would make that slot indistinguishable from empty.',
  },
];

test('CODE-DOC-04-BATCH-05 representative display and copy', async ({ page }) => {
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
