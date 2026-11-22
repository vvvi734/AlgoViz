import { expect, openAdvancedPanels, openTextbookChapter, openTextbookTopic, selectAlgorithm, test, type Page } from './fixtures';

async function setFrame(page: Page, frame: number, total: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / ${total}`);
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('MATRIX-01 — arrays, special matrices and sparse fast transpose', () => {
  test('three static concept pages explain mapping, compression and triplets without a player', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await openTextbookChapter(page, 'ch5-array');
    await openTextbookTopic(page, 'array-matrix');
    await page.getByTestId('topic-array-basics').click();
    await expect(page.getByTestId('concept-title')).toContainText('数组与多维数组');
    await expect(page.getByTestId('concept-definition')).toContainText('顺序存储');
    await expect(page.getByTestId('concept-page')).toContainText('行优先');
    await expect(page.getByTestId('concept-page')).toContainText('列优先');
    await expect(page.getByTestId('concept-diagram')).toContainText('1000 + (i*4 + j)*4');
    await page.getByTestId('array-order-column').click();
    await expect(page.getByTestId('concept-diagram')).toContainText('1000 + (j*3 + i)*4');
    await page.getByTestId('array-order-row').click();
    await expect(page.getByTestId('play-btn')).toHaveCount(0);

    await page.getByTestId('topic-special-matrices').click();
    await expect(page.getByTestId('concept-title')).toContainText('特殊矩阵');
    await expect(page.getByTestId('concept-page')).toContainText('i(i+1)/2 + j');
    await expect(page.getByTestId('concept-diagram')).toContainText('k=9');
    await expect(page.getByTestId('concept-diagram')).toContainText('三对角');
    await expect(page.getByTestId('play-btn')).toHaveCount(0);

    await page.getByTestId('topic-sparse-matrix').click();
    await expect(page.getByTestId('concept-title')).toContainText('稀疏矩阵');
    await expect(page.getByTestId('concept-page')).toContainText('num');
    await expect(page.getByTestId('concept-page')).toContainText('cpot');
    await expect(page.getByTestId('concept-diagram')).toContainText('(row, col, value)');
    await expect(page.getByTestId('concept-diagram')).toContainText('CSR');
    await expect(page.getByTestId('play-btn')).toHaveCount(0);

    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('concept-title')).toContainText('Sparse matrices and triplet representation');
    await expect(page.getByTestId('concept-page')).toContainText('Compressed sparse row');
    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expectNoPageOverflow(page);
  });

  test('real Python fast transpose: count, cpot, write and a clean backwards jump', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'sparse-transpose');

    const visual = page.getByTestId('sparse-transpose-visual');
    await expect(visual).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 35', { timeout: 90_000 });
    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');
    await expect(page.getByTestId('sparse-written')).toContainText('0/6');

    await setFrame(page, 8, 35);
    await expect(visual).toHaveAttribute('data-operation', 'count-complete');
    await expect(page.getByTestId('sparse-num')).toHaveText([
      '2', '1', '3', '0', '0',
    ]);
    await expect(page.getByTestId('sparse-cpot')).toHaveText([
      '—', '—', '—', '—', '—',
    ]);

    await setFrame(page, 14, 35);
    await expect(visual).toHaveAttribute('data-operation', 'cpot-complete');
    await expect(page.getByTestId('sparse-cpot')).toHaveText([
      '0', '2', '3', '6', '6',
    ]);
    await expect(page.getByTestId('sparse-written')).toContainText('0/6');

    await setFrame(page, 17, 35);
    await expect(visual).toHaveAttribute('data-operation', 'place-write');
    await expect(visual).toHaveAttribute('data-source-index', '0');
    await expect(visual).toHaveAttribute('data-target-index', '0');
    await expect(page.getByTestId('sparse-source-chip')).toContainText('src #0');
    await expect(page.getByTestId('sparse-source-chip')).toContainText('dst #0');
    await expect(page.getByTestId('sparse-written')).toContainText('1/6');

    await setFrame(page, 19, 35);
    await expect(visual).toHaveAttribute('data-operation', 'place-read');
    await expect(visual).toHaveAttribute('data-source-index', '1');
    await expect(visual).toHaveAttribute('data-target-index', '3');
    await expect(page.locator('[data-testid="sparse-original-cell"][data-row="0"][data-col="2"]')).toHaveAttribute(
      'data-tone',
      'source',
    );
    await expect(page.locator('[data-testid="sparse-result-cell"][data-row="2"][data-col="0"]')).toHaveAttribute(
      'data-tone',
      'target',
    );
    await expect(
      page.locator('[data-testid="sparse-result-triples-row"][data-index="3"]'),
    ).toHaveAttribute('data-tone', 'target');
    await expect(page.getByTestId('sparse-written')).toContainText('1/6');

    await setFrame(page, 33, 35);
    await expect(visual).toHaveAttribute('data-operation', 'place-update');
    await expect(visual).toHaveAttribute('data-source-index', '5');
    await expect(page.getByTestId('sparse-cpot').nth(2)).toHaveText('6');
    await expect(page.getByTestId('sparse-written')).toContainText('6/6');

    await setFrame(page, 34, 35);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('sparse-written')).toContainText('6/6');
    await expect(
      page.locator('[data-testid="sparse-result-triples-row"][data-index="3"]'),
    ).toHaveAttribute('data-tone', 'done');
    await expect(
      page.locator('[data-testid="sparse-result-cell"][data-row="2"][data-col="0"]'),
    ).toHaveAttribute('data-value', '7');

    // The two triplet tables must stay readable inside the canvas: native
    // table layout avoids the width explosion the old block/fixed hybrid
    // caused, and the last row must not be clipped by the stage.
    const sourceTable = page.getByTestId('sparse-source-triples');
    const resultTable = page.getByTestId('sparse-result-triples');
    for (const table of [sourceTable, resultTable]) {
      await expect(table).toBeVisible();
      await expect(table.locator('tbody tr')).toHaveCount(6);
      const tableBox = await table.boundingBox();
      expect(tableBox?.width).toBeLessThan(400);
    }
    const stageBox = await visual.boundingBox();
    const lastSourceRow = page.locator('[data-testid="sparse-source-triples-row"][data-index="5"]');
    const lastResultRow = page.locator('[data-testid="sparse-result-triples-row"][data-index="5"]');
    const lastSourceBox = await lastSourceRow.boundingBox();
    const lastResultBox = await lastResultRow.boundingBox();
    if (!stageBox || !lastSourceBox || !lastResultBox) throw new Error('missing sparse table geometry');
    expect(lastSourceBox.y + lastSourceBox.height).toBeLessThanOrEqual(stageBox.y + stageBox.height + 1);
    expect(lastResultBox.y + lastResultBox.height).toBeLessThanOrEqual(stageBox.y + stageBox.height + 1);

    await setFrame(page, 2, 35);
    await expect(visual).toHaveAttribute('data-operation', 'count-scan');
    await expect(visual).toHaveAttribute('data-source-index', '0');
    await expect(visual).toHaveAttribute('data-target-index', '');
    await expect(page.getByTestId('sparse-written')).toContainText('0/6');
    await expect(page.getByTestId('sparse-cpot').nth(2)).toHaveText('—');
    await expect(
      page.locator('[data-testid="sparse-result-cell"][data-row="2"][data-col="0"]'),
    ).toHaveAttribute('data-tone', 'zero');

    await expectNoPageOverflow(page);

    await openAdvancedPanels(page);
    const panel = page.getByTestId('reference-code-panel');
    await expect(panel).toHaveAttribute('data-algorithm-id', 'sparse-transpose');
    await page.getByTestId('reference-lang-c').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('sparse_transpose.c');
    await expect(page.getByTestId('reference-code-viewer')).toHaveAttribute('data-readonly', 'true');
    await expect(page.getByTestId('reference-copy')).toBeEnabled();

    await page.getByTestId('reference-lang-cpp').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('sparse_transpose.cpp');
    await page.getByTestId('reference-impl-convenience').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('sparse_transpose_sort.cpp');
    await expect(page.getByTestId('reference-source')).toContainText('O(t log t)');

    await page.getByTestId('reference-lang-python').click();
    await page.getByTestId('reference-impl-principle').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('sparse_transpose.py');
    await page.getByTestId('reference-impl-convenience').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('sparse_transpose_sort.py');
    await expect(page.getByTestId('reference-source')).toContainText('O(t log t)');
  });
});


