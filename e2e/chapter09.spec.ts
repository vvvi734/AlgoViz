import { expect, test, type Page } from './fixtures';

const MOBILE_SELECT = '[data-testid="mobile-algo-select"]';

async function openPhone(page: Page) {
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
}

async function openAlgorithm(page: Page, id: string, stage: string): Promise<number> {
  await page.locator(MOBILE_SELECT).selectOption(id);
  await expect(page.getByTestId(stage)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 90_000 });
  const first = await page.getByTestId('progress').textContent();
  return Number(first?.split('/')[1]?.trim());
}

async function setFrame(page: Page, frame: number, total: number) {
  const progress = page.getByTestId('progress');
  const text = (await progress.textContent()) ?? '';
  const current = Number(text.split('/')[0]?.trim()) - 1;
  await expect(page.getByTestId('next-btn')).toBeEnabled({ timeout: 90_000 });
  for (let index = current; index < frame; index += 1) {
    await page.getByTestId('next-btn').click();
    await expect(progress).toHaveText(`${index + 2} / ${total}`, { timeout: 30_000 });
  }
  await expect(progress).toHaveText(`${frame + 1} / ${total}`, { timeout: 30_000 });
}

async function runAgain(page: Page): Promise<number> {
  const feedback = page.getByTestId('run-feedback');
  const before = (await feedback.textContent()) ?? '';
  await page.getByTestId('run-btn').click();
  await expect.poll(async () => feedback.textContent(), { timeout: 90_000 }).not.toBe(before);
  await expect(feedback).toContainText(/动画已生成|Visualization ready/, { timeout: 90_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 90_000 });
  const first = await page.getByTestId('progress').textContent();
  return Number(first?.split('/')?.[1]?.trim());
}

test.describe('TEXTBOOK-09 — block search, B-tree delete, B+ tree and key tree', () => {
  test('block search selects the first covering index block and rejects a silent reorder', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const firstTotal = await openAlgorithm(page, 'block-search', 'block-search-visual');

    await expect(page.getByTestId('block-search-picker')).toHaveAttribute('data-actual', 'hit-middle');
    await page.getByTestId('block-search-picker-hit-middle').click();
    await expect(page.getByTestId('block-search-picker')).toHaveAttribute('data-selected', 'hit-middle');
    const total = await runAgain(page);

    await setFrame(page, total - 2, total);
    await expect(page.getByTestId('block-search-visual')).toHaveAttribute('data-operation', 'found');
    await expect(page.locator('[data-testid="block-index-row"][data-selected="true"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="block-index-row"][data-selected="true"]')).toHaveAttribute(
      'data-index',
      '1',
    );
    await expect(page.locator('[data-testid="block-row"][data-selected="true"]')).toHaveAttribute(
      'data-block-index',
      '1',
    );
    await expect(
      page.locator('[data-testid="block-cell"][data-value="38"][data-matched="true"]'),
    ).toHaveCount(1);

    await setFrame(page, total - 1, total);
    await expect(page.getByTestId('block-search-visual')).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('block-search-visual')).toHaveAttribute('data-result', 'found');

    await page.getByTestId('run-input').fill('1, 5, 3, 4');
    await page.getByTestId('block-size').fill('2');
    await page.getByTestId('block-search-target').fill('4');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(
      /最大值|maximum|重排|reorder/i,
      { timeout: 90_000 },
    );
    await expect(page.getByTestId('block-search-visual')).toHaveCount(0);
  });

  test('B-tree delete repairs nodes, shrinks an empty root and keeps every invariant', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const firstTotal = await openAlgorithm(page, 'btree', 'btree-visual');

    await page.getByTestId('btree-preset-delete-root-shrink').click();
    await expect(page.getByTestId('btree-picker')).toHaveAttribute('data-selected', 'delete-root-shrink');
    const total = await runAgain(page);

    await setFrame(page, 2, total);
    await expect(page.getByTestId('btree-delete-banner')).toHaveAttribute('data-action', 'root-shrink');
    await expect(page.getByTestId('btree-visual')).toHaveAttribute('data-operation', 'root-shrink');

    await setFrame(page, total - 1, total);
    const visual = page.getByTestId('btree-visual');
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'deleted');
    await expect(page.locator('[data-testid="btree-key"][data-key-value="17"]')).toHaveCount(0);
    await expect(page.getByTestId('btree-node')).toHaveCount(4);
    const leaves = page.locator('[data-testid="btree-node"][data-leaf="true"]');
    await expect(leaves).toHaveCount(3);
    for (const leaf of await leaves.all()) {
      await expect(leaf).toHaveAttribute('data-depth', '1');
    }

    await page.click('[data-testid="prev-btn"]');
    await expect(page.getByTestId('progress')).toHaveText(`${total - 1} / ${total}`);
    await page.click('[data-testid="next-btn"]');
    await expect(visual).toHaveAttribute('data-operation', 'done');

    await page.getByTestId('btree-preset-delete-missing').click();
    const missTotal = await runAgain(page);
    await setFrame(page, missTotal - 1, missTotal);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'not-found');
  });

  test('B+ tree range scan follows the leaf chain and reports only the in-range records', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    await openAlgorithm(page, 'bplus-tree', 'bplus-tree-visual');

    await page.getByTestId('bplus-picker-range-query').click();
    await expect(page.getByTestId('bplus-picker')).toHaveAttribute('data-selected', 'range-query');
    const total = await runAgain(page);
    await setFrame(page, total - 1, total);

    const visual = page.getByTestId('bplus-tree-visual');
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'range');
    await expect(visual).toContainText('20, 25, 30');
    await expect(visual).toContainText(/p2 → p4|p2.*p4/);
    await expect(page.locator('[data-testid="bplus-node"][data-leaf="true"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="bplus-node"][data-leaf="false"]')).toHaveCount(1);
  });

  test('key tree shares prefixes, marks a complete word and inserts only missing suffixes', async ({ page }) => {
    test.setTimeout(420_000);
    await openPhone(page);
    await openAlgorithm(page, 'key-tree', 'key-tree-visual');

    await page.getByTestId('key-tree-picker-shared-prefix-hit').click();
    const hitTotal = await runAgain(page);
    await setFrame(page, hitTotal - 1, hitTotal);
    const visual = page.getByTestId('key-tree-visual');
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'found');
    await expect(
      page.locator('[data-testid="key-tree-node"][data-char="e"][data-terminal="true"]'),
    ).toHaveCount(1);

    const nodesBefore = await page.getByTestId('key-tree-node').count();
    await page.getByTestId('key-tree-picker-insert-new-branch').click();
    const insertTotal = await runAgain(page);
    await setFrame(page, insertTotal - 1, insertTotal);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'inserted');
    await expect(page.getByTestId('key-tree-node')).toHaveCount(nodesBefore + 1);
    await expect(visual.locator('.key-tree-chips')).toContainText('dot');
  });
});
