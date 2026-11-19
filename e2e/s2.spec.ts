import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/s2');
mkdirSync(SHOT_DIR, { recursive: true });

async function openSorting(page: Page, algorithm: 'quick' | 'merge', total: number) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, algorithm);
  const visual = page.locator('[data-testid="sorting-visual"]');
  await expect(visual).toBeVisible({ timeout: 60_000 });
  await expect(visual).toHaveAttribute('data-algorithm', algorithm);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
  await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');
  return visual;
}

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

async function barState(page: Page): Promise<string[]> {
  return page.locator('[data-testid="sorting-bar"]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const element = node as HTMLElement;
      return [
        element.getAttribute('data-value'),
        element.getAttribute('data-marks'),
        element.getAttribute('data-sorted'),
      ].join('|');
    }),
  );
}

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function expectAllSorted(page: Page, total: number) {
  const bars = page.locator('[data-testid="sorting-bar"]');
  await expect(bars).toHaveCount(total);
  for (let index = 0; index < total; index += 1) {
    await expect(bars.nth(index)).toHaveAttribute('data-sorted', 'true');
  }
  const values = await bars.evaluateAll((nodes) => nodes.map((node) => Number((node as HTMLElement).dataset.value)));
  expect(values).toEqual([...values].sort((a, b) => a - b));
}

test.describe('S2 — real Python quick sort and merge sort', () => {
  test('quick: Lomuto pivot, real swap, placement, recursion and final order', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const visual = await openSorting(page, 'quick', 32);

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="sorting-bar"]')).toHaveCount(8);

    await setFrame(page, 4, 32);
    await expect(visual).toHaveAttribute('data-operation', 'quick-swap');
    await expect(visual).toHaveAttribute('data-phase', 'move');
    await expect(visual).toHaveAttribute('data-pivot', '7');
    await expect(visual).toHaveAttribute('data-boundary', '1');
    await expect(visual).toHaveAttribute('data-compare', '1');
    await expect(page.getByTestId('sorting-pivot')).toContainText('p7');
    await expect(page.getByTestId('sorting-boundary')).toContainText('i = 1');
    await expect(page.locator('[data-testid="sorting-bar"][data-swap="true"]')).toHaveCount(2);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'quick-swap');
    await page.screenshot({ path: resolve(SHOT_DIR, 'quick-swap-1440-light.png'), fullPage: true });

    const before = await barState(page);
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('6 / 32');
    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('5 / 32');
    expect(await barState(page)).toEqual(before);

    await setFrame(page, 12, 32);
    await expect(visual).toHaveAttribute('data-operation', 'quick-place');
    await expect(visual).toHaveAttribute('data-phase', 'place');
    await expect(visual).toHaveAttribute('data-pivot', '3');
    await expect(visual).toHaveAttribute('data-boundary', '3');
    await expect(visual).toHaveAttribute('data-inserted-at', '3');
    await expect(visual).toHaveAttribute('data-finalized-count', '1');
    await expect(page.getByTestId('sorting-range')).toContainText('[0, 7]');
    await expect(page.locator('[data-testid="sorting-bar"][data-index="3"]')).toHaveAttribute('data-final', 'true');
    await expect(page.locator('[data-testid="sorting-bar"][data-index="3"]')).toHaveAttribute('data-value', '4');
    await page.screenshot({ path: resolve(SHOT_DIR, 'quick-place-1440-light.png'), fullPage: true });

    await setFrame(page, 13, 32);
    await expect(visual).toHaveAttribute('data-operation', 'quick-range');
    await expect(page.getByTestId('sorting-range')).toContainText('[0, 2]');
    await expect(visual).toHaveAttribute('data-pivot', '2');

    await setFrame(page, 31, 32);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-phase', 'done');
    await expect(visual).toHaveAttribute('data-finalized-count', '8');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expectAllSorted(page, 8);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'quick-done-390-light.png'), fullPage: true });
  });

  test('merge: real split, buffer append, write-back and stable final order', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const visual = await openSorting(page, 'merge', 110);

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="sorting-bar"]')).toHaveCount(8);

    await setFrame(page, 2, 110);
    await expect(visual).toHaveAttribute('data-operation', 'merge-split');
    await expect(page.getByTestId('sorting-range')).toContainText('[0, 7]');
    await expect(page.getByTestId('sorting-split')).toContainText('mid = 3');

    await setFrame(page, 13, 110);
    await expect(visual).toHaveAttribute('data-operation', 'merge-write');
    await expect(visual).toHaveAttribute('data-phase', 'buffer');
    await expect(visual).toHaveAttribute('data-buffer-length', '1');
    await expect(page.getByTestId('sorting-range')).toContainText('[0, 1]');
    await expect(page.getByTestId('sorting-split')).toContainText('mid = 0');
    await expect(page.getByTestId('sorting-left')).toContainText('p0');
    await expect(page.getByTestId('sorting-right')).toContainText('p2');
    await expect(page.getByTestId('sorting-buffer')).toHaveAttribute('data-length', '1');
    await expect(page.getByTestId('sorting-buffer-slot').first()).toHaveAttribute('data-value', '3');
    await expect(page.getByTestId('sorting-buffer-slot').first()).toHaveAttribute('data-written', 'true');
    await expect(page.locator('[data-testid="sorting-bar"][data-index="1"]')).toHaveAttribute('data-marks', /buffer-source/);
    await expect(page.locator('[data-testid="sorting-bar"][data-index="1"]')).toHaveAttribute('data-value', '3');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'merge-compare');
    await page.screenshot({ path: resolve(SHOT_DIR, 'merge-write-1440-light.png'), fullPage: true });

    const before = await barState(page);
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('15 / 110');
    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('14 / 110');
    expect(await barState(page)).toEqual(before);

    await setFrame(page, 100, 110);
    await expect(visual).toHaveAttribute('data-operation', 'merge-writeback');
    await expect(visual).toHaveAttribute('data-phase', 'writeback');
    await expect(visual).toHaveAttribute('data-write-at', '0');
    await expect(visual).toHaveAttribute('data-buffer-length', '8');
    await expect(page.getByTestId('sorting-buffer')).toHaveAttribute('data-capacity', '8');
    await expect(page.getByTestId('sorting-buffer-slot')).toHaveCount(8);
    await expect(page.locator('[data-testid="sorting-bar"][data-index="0"]')).toHaveAttribute('data-marks', /write-target/);
    await expect(page.locator('[data-testid="sorting-bar"][data-index="0"]')).toHaveAttribute('data-value', '1');
    await expect(page.getByTestId('sorting-merged-ranges')).toContainText('[0, 3]');
    await expect(page.getByTestId('sorting-merged-ranges')).toContainText('[4, 7]');
    await page.screenshot({ path: resolve(SHOT_DIR, 'merge-writeback-1440-light.png'), fullPage: true });

    await setFrame(page, 109, 110);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-phase', 'done');
    await expect(visual).toHaveAttribute('data-sorted-count', '8');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'merge-writeback');
    await expectAllSorted(page, 8);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'merge-done-390-light.png'), fullPage: true });
  });
});
