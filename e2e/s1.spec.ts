import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/s1');
mkdirSync(SHOT_DIR, { recursive: true });

async function openSorting(page: Page, algorithm: 'selection' | 'insertion' | 'shell', total: number) {
  await page.goto('/?view=lab');
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

test.describe('S1 — real Python selection, insertion and Shell sort', () => {
  test('selection: candidate, real swap, jump/back consistency and final order', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const visual = await openSorting(page, 'selection', 40);

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="sorting-bar"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="sorting-key"]')).toHaveCount(0);

    await setFrame(page, 6, 40);
    await expect(visual).toHaveAttribute('data-operation', 'select-candidate');
    await expect(visual).toHaveAttribute('data-phase', 'candidate');
    await expect(visual).toHaveAttribute('data-candidate', '3');
    await expect(visual).toHaveAttribute('data-compare', '3');
    await expect(page.locator('[data-testid="sorting-bar"][data-candidate="true"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="sorting-bar"][data-candidate="true"]')).toHaveAttribute('data-value', '1');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'select-candidate');
    await page.screenshot({ path: resolve(SHOT_DIR, 'selection-candidate-1440-light.png'), fullPage: true });

    const before = await barState(page);
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('8 / 40');
    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('7 / 40');
    expect(await barState(page)).toEqual(before);

    await setFrame(page, 9, 40);
    await expect(visual).toHaveAttribute('data-operation', 'select-swap');
    await expect(visual).toHaveAttribute('data-sorted-count', '1');
    await expect(page.locator('[data-testid="sorting-bar"][data-sorted="true"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="sorting-bar"][data-index="0"]')).toHaveAttribute('data-value', '1');

    await setFrame(page, 39, 40);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-phase', 'done');
    await expect(visual).toHaveAttribute('data-sorted-count', '6');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expectAllSorted(page, 6);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'selection-done-390-light.png'), fullPage: true });
  });

  test('insertion: key, real right shift with duplicate, placement and final order', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const visual = await openSorting(page, 'insertion', 33);

    await setFrame(page, 1, 33);
    await expect(visual).toHaveAttribute('data-operation', 'insert-key');
    await expect(page.getByTestId('sorting-key')).toHaveAttribute('data-value', '3');
    await expect(page.getByTestId('sorting-key')).toHaveAttribute('data-origin', '1');
    await expect(page.locator('[data-testid="sorting-bar"][data-index="1"]')).toHaveAttribute('data-key', 'true');

    await setFrame(page, 3, 33);
    await expect(visual).toHaveAttribute('data-operation', 'insert-shift');
    await expect(visual).toHaveAttribute('data-phase', 'move');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'insert-shift');
    await expect(page.locator('[data-testid="sorting-bar"][data-shift-source="true"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="sorting-bar"][data-shift-target="true"]')).toHaveCount(1);
    const shifted = await page.locator('[data-testid="sorting-bar"][data-shift-source="true"]').evaluate((node) => ({
      value: (node as HTMLElement).dataset.value,
      index: (node as HTMLElement).dataset.index,
    }));
    expect(shifted.value).toBe('7');
    expect(shifted.index).toBe('0');
    await expect(page.locator('[data-testid="sorting-bar"][data-shift-target="true"]')).toHaveAttribute('data-value', '7');
    await page.screenshot({ path: resolve(SHOT_DIR, 'insertion-shift-1440-light.png'), fullPage: true });

    const before = await barState(page);
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('5 / 33');
    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('4 / 33');
    expect(await barState(page)).toEqual(before);

    await setFrame(page, 4, 33);
    await expect(visual).toHaveAttribute('data-operation', 'insert-place');
    await expect(visual).toHaveAttribute('data-inserted-at', '0');
    await expect(visual).toHaveAttribute('data-sorted-count', '2');
    await expect(page.locator('[data-testid="sorting-bar"][data-index="0"]')).toHaveAttribute('data-value', '3');
    await expect(page.locator('[data-testid="sorting-bar"][data-index="0"]')).toHaveAttribute('data-placed', 'true');

    await setFrame(page, 32, 33);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-sorted-count', '6');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expectAllSorted(page, 6);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'insertion-done-390-light.png'), fullPage: true });
  });

  test('Shell: gap sequence, lane shift, gap=1 finish and final order', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const visual = await openSorting(page, 'shell', 70);

    await setFrame(page, 1, 70);
    await expect(visual).toHaveAttribute('data-operation', 'gap-change');
    await expect(visual).toHaveAttribute('data-gap', '4');
    await expect(page.getByTestId('sorting-gap')).toContainText('4');
    await expect(page.getByTestId('sorting-meta')).toContainText('4 → 2 → 1');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'gap-change');

    await setFrame(page, 5, 70);
    await expect(visual).toHaveAttribute('data-operation', 'shell-shift');
    await expect(visual).toHaveAttribute('data-gap', '4');
    await expect(visual).toHaveAttribute('data-lane', '1');
    await expect(page.getByTestId('sorting-key')).toHaveAttribute('data-value', '2');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'shell-shift');
    await expect(page.locator('[data-testid="sorting-bar"][data-shift-source="true"]')).toHaveAttribute('data-value', '3');
    await expect(page.locator('[data-testid="sorting-bar"][data-shift-target="true"]')).toHaveAttribute('data-value', '3');
    await page.screenshot({ path: resolve(SHOT_DIR, 'shell-shift-1440-light.png'), fullPage: true });

    const before = await barState(page);
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('7 / 70');
    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('6 / 70');
    expect(await barState(page)).toEqual(before);

    await setFrame(page, 13, 70);
    await expect(visual).toHaveAttribute('data-operation', 'gap-done');
    await expect(visual).toHaveAttribute('data-gap', '4');
    await expect(visual).toHaveAttribute('data-sorted-count', '0');

    await setFrame(page, 69, 70);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-phase', 'done');
    await expect(visual).toHaveAttribute('data-gap', '');
    await expect(visual).toHaveAttribute('data-sorted-count', '8');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expectAllSorted(page, 8);
    await expect(page.getByTestId('sorting-meta')).toContainText('4 → 2 → 1');

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'shell-done-390-light.png'), fullPage: true });
  });
});
