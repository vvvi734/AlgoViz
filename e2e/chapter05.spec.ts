import {
  expect,
  openCodePanel,
  openTextbookChapter,
  openTextbookTopic,
  selectAlgorithm as chooseAlgorithm,
  test,
  type Page,
} from './fixtures';

async function waitGenerated(page: Page) {
  await expect(page.getByTestId('run-feedback')).toContainText(/动画已生成|Visualization ready/, {
    timeout: 90_000,
  });
}

async function totalFrames(page: Page): Promise<number> {
  const max = Number(
    await page.locator('[data-testid="scrub"]').evaluate((node) => (node as HTMLInputElement).max),
  );
  return max + 1;
}

async function currentFrame(page: Page): Promise<number> {
  const progress = (await page.getByTestId('progress').textContent()) ?? '0 / 0';
  return Number(progress.split('/')[0].trim()) - 1;
}

async function seekFrame(page: Page, frame: number, total: number) {
  let current = await currentFrame(page);
  if (frame < current || current < 0) {
    await page.getByTestId('restart-btn').click();
    current = 0;
  }
  while (current < frame) {
    await page.getByTestId('next-btn').click();
    current += 1;
  }
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`);
}

async function seekMatching(page: Page, testId: string, operation: string) {
  const total = await totalFrames(page);
  for (let index = 0; index < total; index += 1) {
    await seekFrame(page, index, total);
    const visual = page.getByTestId(testId);
    if ((await visual.getAttribute('data-operation')) === operation) return index;
  }
  throw new Error(`no ${testId} frame with operation ${operation}`);
}

async function seekLast(page: Page) {
  const total = await totalFrames(page);
  await seekFrame(page, total - 1, total);
  return total;
}

async function openAlgorithm(page: Page, id: string, visualTestId: string) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, id);
  await openCodePanel(page);
  await expect(page.getByTestId('guided-input')).toHaveAttribute('data-algorithm', id);
  await expect(page.getByTestId(visualTestId)).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

async function runExpression(page: Page, expression: string) {
  await page.getByTestId('gl-expression').fill(expression);
  await page.getByTestId('run-btn').click();
  await waitGenerated(page);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

test.describe('CHAPTER-05 — arrays, compressed matrices and generalized lists', () => {
  test('GL depth follows real Python recursion and the textbook depth convention', async ({ page }) => {
    test.setTimeout(300_000);

    await openAlgorithm(page, 'gl-depth', 'gl-visual');
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-mode', 'depth');
    await expect(page.getByTestId(/gl-node-n/)).toHaveCount(9);
    await expect(page.getByTestId('gl-depth-ledger')).toBeVisible();

    await seekMatching(page, 'gl-visual', 'atom-return');
    await expect(page.getByTestId('gl-status')).toContainText('0');

    await seekMatching(page, 'gl-visual', 'done');
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-result-depth', '3');
    await expect(page.getByTestId('gl-result-depth')).toContainText('3');
    await expect(page.getByTestId('gl-depth-n0')).toContainText('3');
    await expect(page.getByTestId('gl-done-banner')).toBeVisible();
    await page.getByTestId('gl-visual').screenshot({ path: 'test-results/chapter05-gl-depth.png' });

    await runExpression(page, '()');
    await seekLast(page);
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-result-depth', '1');
    await expect(page.getByTestId('gl-done-banner')).toContainText('1');

    await runExpression(page, '(())');
    await seekLast(page);
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-result-depth', '2');
    await expect(page.getByTestId(/gl-node-n/)).toHaveCount(2);

    await page.getByTestId('gl-expression').fill('(a,,b)');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/逗号|comma|括号|parenthes/i, {
      timeout: 30_000,
    });
    await expect(page.getByTestId('run-feedback')).toHaveClass(/error/);

    await runExpression(page, '(a, (b, c))');
    await seekMatching(page, 'gl-visual', 'atom-return');
    await runExpression(page, '(a, b)');
    await seekLast(page);
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-result-depth', '1');
    await expect(page.getByTestId(/gl-node-n/)).toHaveCount(3);
  });

  test('GL copy builds independent nodes and keeps reset and stepping coherent', async ({ page }) => {
    test.setTimeout(300_000);

    await openAlgorithm(page, 'gl-copy', 'gl-visual');
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-mode', 'copy');
    await expect(page.getByTestId('gl-copy-empty')).toBeVisible();
    await expect(page.getByTestId(/gl-node-n/)).toHaveCount(9);

    await seekMatching(page, 'gl-visual', 'alloc-list');
    await expect(page.getByTestId('gl-node-c0')).toHaveAttribute('data-source', 'n0');

    await seekMatching(page, 'gl-visual', 'done');
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-copied', '9');
    await expect(page.getByTestId(/gl-node-c/)).toHaveCount(9);
    await expect(page.getByTestId('gl-copied-count')).toContainText('9');
    await expect(page.getByTestId('gl-node-c0')).toHaveAttribute('data-tone', 'copied');
    await expect(page.getByTestId('gl-node-c1')).toHaveAttribute('data-tone', 'copied');
    await expect(page.getByTestId('gl-done-banner')).toContainText('(a,(b,c),((d),e))');
    await page.getByTestId('gl-visual').screenshot({ path: 'test-results/chapter05-gl-copy.png' });

    await page.getByTestId('restart-btn').click();
    await expect(page.getByTestId('gl-copy-empty')).toBeVisible();
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-copied', '0');

    await runExpression(page, '()');
    await seekLast(page);
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-copied', '1');
    await expect(page.getByTestId('gl-done-banner')).toContainText('()');

    await runExpression(page, '(())');
    await seekLast(page);
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-copied', '2');
    await expect(page.getByTestId('gl-node-c0')).toBeVisible();

    await runExpression(page, '(a, (b, c))');
    await seekMatching(page, 'gl-visual', 'copy-atom');
    await runExpression(page, '()');
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-copied', '0');
    await seekLast(page);
    await expect(page.getByTestId('gl-visual')).toHaveAttribute('data-copied', '1');
  });

  test('compressed matrix concept pages and sparse transpose stay intact', async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await openTextbookChapter(page, 'ch5-array');
    await openTextbookTopic(page, 'array-matrix');
    await page.getByTestId('topic-array-basics').click();
    await expect(page.getByTestId('array-memory')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('array-memory')).toHaveAttribute('data-order', 'row');
    await page.getByTestId('array-order-column').click();
    await expect(page.getByTestId('array-memory')).toHaveAttribute('data-order', 'column');
    await page.getByTestId('array-cell-1-2').click();
    await expect(page.getByTestId('array-address')).toContainText('1028');
    await page.getByTestId('array-order-row').click();
    await expect(page.getByTestId('array-address')).toContainText('1024');
    await page.getByTestId('array-memory').screenshot({ path: 'test-results/chapter05-array-memory.png' });

    await openTextbookTopic(page, 'generalized-list-group');
    await page.getByTestId('topic-generalized-list').click();
    await expect(page.getByTestId('concept-page')).toContainText('表尾');
    await page.getByTestId('concept-diagram').screenshot({ path: 'test-results/chapter05-gl-definition.png' });

    await page.getByTestId('topic-generalized-list-storage').click();
    await expect(page.getByTestId('concept-page')).toContainText('tag');
    await page.getByTestId('concept-diagram').screenshot({ path: 'test-results/chapter05-gl-storage.png' });

    await page.getByTestId('topic-m-variable-polynomial').click();
    await expect(page.getByTestId('concept-page')).toContainText('P(x,y,z)');
    await page.getByTestId('concept-diagram').screenshot({ path: 'test-results/chapter05-polynomial.png' });

    await page.getByTestId('topic-special-matrices').click();
    await expect(page.getByTestId('concept-page')).toContainText('对称');
    await page.getByTestId('concept-diagram').screenshot({ path: 'test-results/chapter05-special-matrices.png' });

    await openAlgorithm(page, 'sparse-transpose', 'sparse-transpose-visual');
    await expect(page.getByTestId('sparse-original')).toBeVisible();
    await seekMatching(page, 'sparse-transpose-visual', 'done');
    await expect(page.getByTestId('sparse-result-triples')).toBeVisible();
  });
});
