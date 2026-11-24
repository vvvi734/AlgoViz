import { expect, openAdvancedPanels, openCodePanel, selectAlgorithm, test } from './fixtures';

// Four representative BATCH-04 algorithms: traversal with an undirected back
// edge, a precondition that differs between languages, dynamic splitting, and
// a collector whose references are indices rather than raw addresses.
const cases = [
  {
    id: 'components',
    cFile: 'components.c',
    zh: '递归前先标记：无向边会指回调用者，提前标记才能避免沿这个环无限递归。',
    en: 'Mark before recursing: an undirected edge leads back to the caller, and marking early prevents that cycle from recursing forever.',
  },
  {
    id: 'critical-path',
    cFile: 'critical_path.c',
    zh: '先真正求一次拓扑序；活动数组只是数据，并不保证边已按拓扑序出现。',
    en: 'Build a real topological order first; the activity array is data, not a promise that edges already appear in topological order.',
  },
  {
    id: 'buddy-system',
    cFile: 'buddy_system.c',
    zh: '从向上取整的目标级开始，寻找最小可用的空闲块。',
    en: 'Find the smallest free block at or above the rounded target level.',
  },
  {
    id: 'garbage-collection',
    cFile: 'garbage_collection.c',
    zh: '引用保存对象下标而不是原始地址；移动 start 改变的是由对象派生的地址，不是存储的下标。',
    en: 'References store object indices, not raw addresses; moving start changes the address derived from the object, not the stored index.',
  },
];

test('CODE-DOC-04-BATCH-04 representative display and copy', async ({ page }) => {
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
