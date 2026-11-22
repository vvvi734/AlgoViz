import { expect, openAdvancedPanels, openCodePanel, selectAlgorithm, test } from './fixtures';

const cases = [
  {
    id: 'seqlist',
    cFile: 'seqlist.c',
    zh: '插入允许 index == length 表示追加，但 length == capacity 时必须拒绝：合法范围同时受有效元素数和物理数组容量约束。',
    en: 'Insertion accepts index == length as append, but rejects length == capacity: the legal range is bounded by both the live count and the physical array.',
  },
  {
    id: 'stack',
    cFile: 'stack.c',
    zh: '判满依据是 top 而不是元素计数：top == capacity-1 时再自增就会写出数组边界。',
    en: 'The full check uses top, not a count: top == capacity-1 means the next increment would write past the array.',
  },
  {
    id: 'huffman',
    cFile: 'huffman.c',
    zh: '频率是主键；插入序号用于打破平局，因此相同权值也会得到确定的树形。',
    en: 'Frequency is primary; order breaks ties, so equal weights still produce a deterministic tree shape.',
  },
  {
    id: 'bfs',
    cFile: 'bfs.c',
    zh: '队列中只保存已发现的顶点；visited 在入队时置位，所以同一顶点不可能再次入队。',
    en: 'The queue holds only discovered vertices; visited is set at enqueue time, so no vertex can enter twice.',
  },
];

test('CODE-DOC-04-BATCH-03 representative display and copy', async ({ page }) => {
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
