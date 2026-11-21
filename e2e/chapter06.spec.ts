import { expect, selectAlgorithm, test, type Page } from './fixtures';

async function totalFrames(page: Page): Promise<number> {
  const max = Number(
    await page.locator('[data-testid="scrub"]').evaluate((node) => (node as HTMLInputElement).max),
  );
  return max + 1;
}

async function seekLast(page: Page) {
  const total = await totalFrames(page);
  const progress = page.getByTestId('progress');
  let current = Number(((await progress.textContent()) ?? '0 / 0').split('/')[0].trim()) - 1;
  if (current < 0) {
    await page.locator('[aria-label="Reset"]').click();
    current = 0;
  }
  while (current < total - 1) {
    await page.getByTestId('next-btn').click();
    current += 1;
  }
  await expect(progress).toHaveText(`${total} / ${total}`);
}

test.describe('CHAPTER-06 — threaded binary tree', () => {
  test('threads and traverses the inorder tree from a real Python trace', async ({ page }) => {
    test.setTimeout(300_000);

    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'threaded-inorder');
    await expect(page.getByTestId('guided-input')).toHaveAttribute('data-algorithm', 'threaded-inorder');
    await expect(page.getByTestId('threaded-tree-visual')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('threaded-node')).toHaveCount(5);
    await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);

    await seekLast(page);
    await expect(page.getByTestId('threaded-tree-visual')).toHaveAttribute('data-phase', 'done');
    await expect(page.getByTestId('threaded-count')).toHaveAttribute('data-count', '6');
    await expect(page.getByTestId('threaded-visited')).toHaveAttribute(
      'data-visited-ids',
      'n4,n2,n5,n1,n3',
    );
    await expect(page.getByTestId('threaded-child-edge')).toHaveCount(4);
    await expect(page.getByTestId('threaded-thread-edge')).toHaveCount(6);
  });

  test('keeps the directory arrow only on the real secondary group', async ({ page }) => {
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });

    const chapter = page.getByTestId('chapter-ch6-tree');
    if ((await chapter.getAttribute('aria-expanded')) !== 'true') await chapter.click();

    const threadedGroup = page.getByTestId('topic-threaded-tree-group');
    await expect(threadedGroup).toHaveAttribute('aria-expanded', 'false');
    await expect(threadedGroup.locator('.textbook-topic-chevron')).toHaveCount(1);

    await expect(page.getByTestId('topic-tree-basics').locator('.textbook-topic-chevron')).toHaveCount(0);
    await expect(page.getByTestId('topic-huffman').locator('.textbook-topic-chevron')).toHaveCount(0);
    await expect(page.getByTestId('topic-huffman')).not.toHaveAttribute('aria-expanded');
    await expect(page.getByTestId('topic-huffman')).toContainText('哈夫曼');
    await expect(page.getByTestId('algo-huffman')).toBeVisible();

    const theoryTitle = page.getByTestId('topic-tree-basics').locator('.textbook-topic-name');
    const visualTitle = page.getByTestId('topic-huffman').locator('.textbook-direct-title');
    const titleStyle = (locator: typeof theoryTitle) => locator.evaluate((node) => {
      const style = getComputedStyle(node);
      return { color: style.color, fontSize: style.fontSize, fontWeight: style.fontWeight };
    });
    expect(await titleStyle(theoryTitle)).toEqual(await titleStyle(visualTitle));

    await threadedGroup.click();
    await expect(threadedGroup).toHaveAttribute('aria-expanded', 'true');
    const theoryLeaf = page.getByTestId('topic-threaded-tree').locator('.textbook-subtopic-name');
    const visualLeaf = page.getByTestId('algo-threaded-inorder').locator('.alg-name');
    await expect(theoryLeaf).toBeVisible();
    await expect(visualLeaf).toBeVisible();
    expect(await titleStyle(theoryLeaf)).toEqual(await titleStyle(visualLeaf));
  });
});
