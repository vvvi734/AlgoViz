import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

async function waitGenerated(page: Page) {
  await expect(page.getByTestId('run-feedback')).toContainText(/动画已生成|Visualization ready/, {
    timeout: 90_000,
  });
}

async function seekLast(page: Page) {
  const last = await page.locator('[data-testid="scrub"]').evaluate((node) => (node as HTMLInputElement).max);
  await page.locator('[data-testid="scrub"]').fill(last);
}

async function sortingValues(page: Page, algorithm: string): Promise<number[]> {
  if (algorithm === 'heap') {
    return page
      .locator('[data-testid="heap-slot"]')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => ({
            slot: Number(node.getAttribute('data-slot')),
            value: Number(node.getAttribute('data-value')),
          }))
          .sort((a, b) => a.slot - b.slot)
          .map((item) => item.value),
      );
  }
  return page
    .locator('[data-testid="sorting-bar"]')
    .evaluateAll((nodes) =>
      nodes
        .map((node) => ({
          index: Number(node.getAttribute('data-index')),
          value: Number(node.getAttribute('data-value')),
        }))
        .sort((a, b) => a.index - b.index)
        .map((item) => item.value),
    );
}

async function openAlgorithm(page: Page, id: string) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, id);
  await openCodePanel(page);
  await expect(page.getByTestId(id === 'heap' ? 'heap-visual' : 'sorting-visual')).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('guided-input')).toHaveAttribute('data-algorithm', id);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

async function runValues(page: Page, values: string) {
  await page.locator('#run-input').fill(values);
  await expect(page.getByTestId('guided-mode-custom')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('run-btn').click();
  await waitGenerated(page);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

async function expectFinalSorted(page: Page, id: string, expected: number[]) {
  await seekLast(page);
  expect(await sortingValues(page, id)).toEqual(expected);
}

async function restoreOfficial(page: Page, official: string) {
  await page.getByTestId('guided-mode-official').click();
  await waitGenerated(page);
  await expect(page.locator('#run-input')).toHaveValue(official);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

const CUSTOM = '9, -4, 0, 4, 4, -2';
const CUSTOM_SORTED = [-4, -2, 0, 4, 4, 9];

test.describe('INPUT-02 — real sorting traces from custom and random arrays', () => {
  test('selection: candidate, compare and swap come from the new Python trace', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'selection');
    await runValues(page, CUSTOM);
    await page.getByTestId('lesson-step-select-swap').click();
    const visual = page.getByTestId('sorting-visual');
    await expect(visual).toHaveAttribute('data-operation', 'select-swap');
    await expect(page.getByTestId('sorting-candidate')).toBeVisible();
    await expect(page.getByTestId('variables-watch')).toContainText(/candidate|候选/);
    await expectFinalSorted(page, 'selection', CUSTOM_SORTED);

    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('reversed');
    const random = (await page.locator('#run-input').inputValue()).split(/[,\s]+/).filter(Boolean).map(Number);
    expect(random.length).toBeGreaterThanOrEqual(8);
    expect(random.every((value, index) => index === 0 || random[index - 1]! >= value)).toBe(true);
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expectFinalSorted(page, 'selection', [...random].sort((a, b) => a - b));

    await restoreOfficial(page, '6, 4, 9, 1, 7, 2');
  });

  test('insertion: key, shift and insert states come from the new Python trace', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'insertion');
    await runValues(page, CUSTOM);
    await page.getByTestId('lesson-step-insert-shift').click();
    await expect(page.getByTestId('sorting-visual')).toHaveAttribute('data-operation', 'insert-shift');
    await expect(page.getByTestId('sorting-key')).toBeVisible();
    await expect(page.getByTestId('variables-watch')).toContainText('key');
    await expectFinalSorted(page, 'insertion', CUSTOM_SORTED);

    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('reversed');
    const random = (await page.locator('#run-input').inputValue()).split(/[,\s]+/).filter(Boolean).map(Number);
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expectFinalSorted(page, 'insertion', [...random].sort((a, b) => a - b));

    await restoreOfficial(page, '7, 3, 5, 1, 9, 2');
  });

  test('shell: gap, lane and gap sequence are regenerated for the new array', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'shell');
    await runValues(page, CUSTOM);
    await page.getByTestId('lesson-step-gap-change').click();
    await expect(page.getByTestId('sorting-visual')).toHaveAttribute('data-gap', '3');
    await expect(page.getByTestId('sorting-gap')).toContainText('3');
    await expect(page.getByTestId('sorting-meta')).toContainText('3 → 1');
    await expect(page.getByTestId('variables-watch')).toContainText('gap');
    await expectFinalSorted(page, 'shell', CUSTOM_SORTED);

    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('reversed');
    const random = (await page.locator('#run-input').inputValue()).split(/[,\s]+/).filter(Boolean).map(Number);
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expectFinalSorted(page, 'shell', [...random].sort((a, b) => a - b));

    await restoreOfficial(page, '8, 3, 7, 4, 9, 2, 6, 1');
  });

  test('quick: pivot, range and boundary are regenerated from the new trace', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'quick');
    await runValues(page, CUSTOM);
    await page.getByTestId('lesson-step-quick-partition').click();
    const visual = page.getByTestId('sorting-visual');
    await expect(visual).toHaveAttribute('data-operation', 'quick-range');
    await expect(visual).toHaveAttribute('data-range-low', '0');
    await expect(visual).toHaveAttribute('data-range-high', '5');
    await expect(visual).toHaveAttribute('data-pivot', '5');
    await expect(page.getByTestId('sorting-pivot')).toBeVisible();
    await expect(page.getByTestId('sorting-boundary')).toBeVisible();
    await expect(page.getByTestId('variables-watch')).toContainText('pivot');
    await expectFinalSorted(page, 'quick', CUSTOM_SORTED);

    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('reversed');
    const random = (await page.locator('#run-input').inputValue()).split(/[,\s]+/).filter(Boolean).map(Number);
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expectFinalSorted(page, 'quick', [...random].sort((a, b) => a - b));

    await restoreOfficial(page, '8, 3, 1, 7, 5, 2, 9, 4');
  });

  test('merge: split, left/right indexes and the temporary buffer are regenerated', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'merge');
    await runValues(page, CUSTOM);
    await page.getByTestId('lesson-step-merge-compare').click();
    const visual = page.getByTestId('sorting-visual');
    await expect(visual).toHaveAttribute('data-operation', 'merge-start');
    await expect(visual).toHaveAttribute('data-range-low', '0');
    await expect(visual).toHaveAttribute('data-range-high', '1');
    await expect(visual).toHaveAttribute('data-split', '0');
    await expect(page.getByTestId('sorting-left')).toBeVisible();
    await expect(page.getByTestId('sorting-right')).toBeVisible();
    await expect(page.getByTestId('sorting-buffer')).toBeVisible();
    await page.getByTestId('next-btn').click();
    await expect(visual).toHaveAttribute('data-operation', 'merge-compare');
    await page.getByTestId('next-btn').click();
    await expect(visual).toHaveAttribute('data-operation', 'merge-write');
    await expect(visual).toHaveAttribute('data-buffer-length', '1');
    await expect(page.getByTestId('sorting-buffer-slot').first()).toHaveAttribute('data-filled', 'true');
    await expect(page.getByTestId('variables-watch')).toContainText('rangeHigh');
    await expectFinalSorted(page, 'merge', CUSTOM_SORTED);

    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('reversed');
    const random = (await page.locator('#run-input').inputValue()).split(/[,\s]+/).filter(Boolean).map(Number);
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expectFinalSorted(page, 'merge', [...random].sort((a, b) => a - b));

    await restoreOfficial(page, '7, 3, 5, 1, 9, 2, 8, 4');
  });

  test('heap: in-place sort shrinks the heap range while the sorted suffix grows', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'heap');
    await page.getByTestId('heap-operation').selectOption('sort');
    await runValues(page, CUSTOM);
    const visual = page.getByTestId('heap-visual');
    await expect(visual).toHaveAttribute('data-command', 'sort');
    await expect(visual).toHaveAttribute('data-heap-size', '6');
    await page.getByTestId('lesson-step-sort').click();
    await page.getByTestId('next-btn').click();
    await expect(visual).toHaveAttribute('data-operation', 'swap-to-end');
    await expect(visual).toHaveAttribute('data-heap-size', '5');
    await expect(visual).toHaveAttribute('data-sorted-from', '5');
    await expect(page.getByTestId('variables-watch')).toContainText('heap_size');
    await expectFinalSorted(page, 'heap', CUSTOM_SORTED);

    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('sort');
    const random = (await page.locator('#run-input').inputValue()).split(/[,\s]+/).filter(Boolean).map(Number);
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expectFinalSorted(page, 'heap', [...random].sort((a, b) => a - b));

    await restoreOfficial(page, '4, 9, 2, 7, 5, 9, 1');
    await expect(page.getByTestId('heap-picker')).toHaveAttribute('data-selected', 'build');
  });
});
