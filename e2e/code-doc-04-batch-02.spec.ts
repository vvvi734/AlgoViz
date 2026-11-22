import { expect, openAdvancedPanels, openCodePanel, selectAlgorithm, test } from './fixtures';

const cases = [
  {
    id: 'infix-to-postfix',
    cFile: 'infix_to_postfix.c',
    zh: '扫描结束后不会再有 token 决定剩余顺序；必须清空栈，让低优先级运算符也进入输出。',
    en: 'After the scan no later token can decide the remaining order; flush the stack so lower-priority operators still reach the output.',
  },
  {
    id: 'sparse-transpose',
    cFile: 'sparse_transpose.c',
    zh: 'q 是本列的下一个空闲槽，而不是全局写指针；每列都有独立移动的游标，因此各列可以分别回填。',
    en: "q is this column's next free slot, not a global write counter. Every column has its own moving cursor, so columns can be filled independently.",
  },
  {
    id: 'threaded-inorder',
    cFile: 'threaded_inorder.c',
    zh: '线索目标放在独立字段中，真实左/右孩子永不被覆盖；ltag/rtag 告诉遍历哪个指针才是有效的。',
    en: 'Thread targets live in separate fields, so a real left/right child is never overwritten. ltag/rtag tell traversal which pointer is meaningful.',
  },
  {
    id: 'block-search',
    cFile: 'block_search.c',
    zh: '块内并未保证有序，因此只能线性扫描判等；在这里用二分会假设一种索引从未承诺过的顺序。',
    en: 'Inside a block the values are not promised sorted, so only a linear equality scan is valid. A binary search here would assume an ordering the index never guarantees.',
  },
];

test('CODE-DOC-04-BATCH-02 representative display and copy', async ({ page }) => {
  test.setTimeout(300_000);
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
