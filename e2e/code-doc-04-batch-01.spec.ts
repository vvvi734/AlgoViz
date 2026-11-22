import { expect, openAdvancedPanels, openCodePanel, selectAlgorithm, test } from './fixtures';

const cases = [
  {
    id: 'kmp',
    cFile: 'kmp.c',
    zh: 'next[0] = -1 是哨兵而不是真实 border：模式串首字符之前没有更短前缀可以回退。',
    en: '-1 is a sentinel, not a real border: at the first pattern character there is no shorter prefix to fall back to.',
  },
  {
    id: 'articulation',
    cFile: 'articulation.c',
    zh: '对非根 u，low[v] >= disc[u] 表示 v 子树没有任何返祖边能绕过 u；删除 u 就会把这棵子树分离出去。',
    en: "For a non-root u, low[v] >= disc[u] means no back edge from v's subtree can bypass u, so removing u separates that subtree.",
  },
];

test('CODE-DOC-04-BATCH-01 representative display and copy', async ({ page }) => {
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
