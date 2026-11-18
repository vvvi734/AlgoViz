import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/t3');
mkdirSync(SHOT_DIR, { recursive: true });

async function openAlgorithm(page: Page, total: number) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, 'heap');
  await expect(page.locator('[data-testid="heap-visual"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
  await expect(page.locator('[data-testid="heap-picker"]')).toBeVisible();
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

async function selectPreset(page: Page, preset: string, total: number) {
  await page.getByTestId(`heap-preset-${preset}`).click();
  await expect(page.locator('[data-testid="heap-picker"]')).toHaveAttribute('data-selected', preset);
  await expect(page.getByTestId('heap-preset-pending')).toBeVisible();
  await page.getByTestId('run-btn').click();
  await expect(page.locator('[data-testid="heap-picker"]')).toHaveAttribute('data-actual', preset, { timeout: 60_000 });
  await expect(page.getByTestId('heap-preset-pending')).toHaveCount(0);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
}

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function slotValues(page: Page): Promise<number[]> {
  return page.locator('[data-testid="heap-slot"]').evaluateAll((slots) =>
    slots.map((slot) => Number(slot.getAttribute('data-value'))),
  );
}

async function treeBySlot(page: Page): Promise<Array<{ id: string; value: number; slot: number }>> {
  return page.locator('[data-testid="heap-node"]').evaluateAll((nodes) =>
    nodes
      .map((node) => ({
        id: node.getAttribute('data-node-id') ?? '',
        value: Number(node.getAttribute('data-value')),
        slot: Number(node.getAttribute('data-slot')),
      }))
      .sort((a, b) => a.slot - b.slot),
  );
}

function heapOrdered(values: number[]): boolean {
  for (let parent = 0; parent < values.length; parent += 1) {
    for (const child of [2 * parent + 1, 2 * parent + 2]) {
      if (child < values.length && values[parent] < values[child]) return false;
    }
  }
  return true;
}

test.describe('T3 — real max heap build, push, extract and in-place heap sort', () => {
  test('builds a max heap from the last non-leaf and keeps tree slots equal to the array', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAlgorithm(page, 17);

    const visual = page.locator('[data-testid="heap-visual"]');
    await expect(visual).toHaveAttribute('data-command', 'build');
    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(visual).toHaveAttribute('data-total', '7');
    await expect(visual).toHaveAttribute('data-heap-size', '7');
    await expect(visual).toHaveAttribute('data-layout-width', '280');
    await expect(visual).toHaveAttribute('data-layout-height', '274');
    await expect(page.locator('[data-testid="heap-node"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="heap-slot"]')).toHaveCount(7);
    expect(await slotValues(page)).toEqual([4, 9, 2, 7, 5, 9, 1]);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');
    await expectNoOverflow(page);

    await setFrame(page, 2, 17);
    await expect(visual).toHaveAttribute('data-operation', 'heapify-node');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h3"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h1"]')).toHaveAttribute('data-on-path', 'true');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'heapify');

    await setFrame(page, 3, 17);
    await expect(visual).toHaveAttribute('data-operation', 'compare-children');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h6"]')).toHaveAttribute('data-compared', 'true');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-compared', 'true');
    await expect(page.locator('[data-testid="heap-slot"][data-slot="2"]')).toHaveAttribute('data-node-id', 'h3');
    await expect(page.locator('[data-testid="heap-slot"][data-slot="6"]')).toHaveAttribute('data-node-id', 'h7');

    await setFrame(page, 5, 17);
    await expect(visual).toHaveAttribute('data-operation', 'swap');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h6"]')).toHaveAttribute('data-slot', '2');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h3"]')).toHaveAttribute('data-slot', '5');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h6"]')).toHaveAttribute('data-swapping', 'true');
    await expect(page.locator('[data-testid="heap-slot"][data-slot="2"]')).toHaveAttribute('data-node-id', 'h6');
    await expect(page.locator('[data-testid="heap-slot"][data-slot="5"]')).toHaveAttribute('data-node-id', 'h3');
    expect(await treeBySlot(page)).toEqual([
      { id: 'h1', value: 4, slot: 0 },
      { id: 'h2', value: 9, slot: 1 },
      { id: 'h6', value: 9, slot: 2 },
      { id: 'h4', value: 7, slot: 3 },
      { id: 'h5', value: 5, slot: 4 },
      { id: 'h3', value: 2, slot: 5 },
      { id: 'h7', value: 1, slot: 6 },
    ]);
    await page.screenshot({ path: resolve(SHOT_DIR, 'heap-build-1440-light.png'), fullPage: true });

    await setFrame(page, 3, 17);
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h6"]')).toHaveAttribute('data-slot', '5');
    await setFrame(page, 5, 17);
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h6"]')).toHaveAttribute('data-slot', '2');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h3"]')).toHaveAttribute('data-slot', '5');

    await setFrame(page, 16, 17);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-heap-size', '7');
    const finalValues = await slotValues(page);
    expect(finalValues).toEqual([9, 7, 9, 4, 5, 2, 1]);
    expect(heapOrdered(finalValues)).toBe(true);
    expect((await treeBySlot(page)).map((node) => node.value)).toEqual(finalValues);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expectNoOverflow(page);
  });

  test('appends a larger value and sifts it to the root without changing element identity', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAlgorithm(page, 17);
    await selectPreset(page, 'push', 7);

    const visual = page.locator('[data-testid="heap-visual"]');
    await expect(visual).toHaveAttribute('data-command', 'push');
    await expect(visual).toHaveAttribute('data-total', '6');
    expect(await slotValues(page)).toEqual([9, 8, 6, 3, 7, 2]);

    await setFrame(page, 1, 7);
    await expect(visual).toHaveAttribute('data-operation', 'push-append');
    await expect(visual).toHaveAttribute('data-total', '7');
    await expect(visual).toHaveAttribute('data-heap-size', '7');
    await expect(page.locator('[data-testid="heap-node"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-slot', '6');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-value', '10');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-added', 'true');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h3"]')).toHaveAttribute('data-on-path', 'true');
    await expect(page.locator('[data-testid="heap-slot"][data-slot="6"]')).toHaveAttribute('data-node-id', 'h7');
    expect(await slotValues(page)).toEqual([9, 8, 6, 3, 7, 2, 10]);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'insert');

    await setFrame(page, 3, 7);
    await expect(visual).toHaveAttribute('data-operation', 'swap');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-slot', '2');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h3"]')).toHaveAttribute('data-slot', '6');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-swapping', 'true');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h3"]')).toHaveAttribute('data-swapping', 'true');
    await page.screenshot({ path: resolve(SHOT_DIR, 'heap-push-1440-light.png'), fullPage: true });

    await setFrame(page, 5, 7);
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-slot', '0');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h1"]')).toHaveAttribute('data-slot', '2');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-value', '10');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h1"]')).toHaveAttribute('data-value', '9');

    await setFrame(page, 6, 7);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-heap-size', '7');
    await expect(page.locator('[data-testid="heap-root"]')).toContainText('#0 · 10');
    expect(await slotValues(page)).toEqual([10, 8, 9, 3, 7, 2, 6]);
    expect(heapOrdered(await slotValues(page))).toBe(true);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expectNoOverflow(page);
  });

  test('removes the maximum, records the real replacement and restores the heap', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAlgorithm(page, 17);
    await selectPreset(page, 'extract', 10);

    const visual = page.locator('[data-testid="heap-visual"]');
    await expect(visual).toHaveAttribute('data-command', 'extract');
    await expect(visual).toHaveAttribute('data-total', '7');
    expect(await slotValues(page)).toEqual([9, 8, 6, 3, 7, 2, 5]);

    await setFrame(page, 1, 10);
    await expect(visual).toHaveAttribute('data-operation', 'extract-select');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h1"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h1"]')).toHaveAttribute('data-value', '9');
    await expect(page.locator('[data-testid="heap-root"]')).toContainText('#0 · 9');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'extract');

    await setFrame(page, 2, 10);
    await expect(visual).toHaveAttribute('data-operation', 'replace-root');
    await expect(visual).toHaveAttribute('data-total', '6');
    await expect(visual).toHaveAttribute('data-heap-size', '6');
    await expect(page.locator('[data-testid="heap-node"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="heap-slot"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h1"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-slot', '0');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-value', '5');
    await expect(page.getByTestId('heap-removed')).toHaveAttribute('data-removed-id', 'h1');
    await expect(page.getByTestId('heap-removed')).toContainText('9');
    await expect(page.getByTestId('heap-replacement')).toContainText('#6 → #0');
    await expect(page.locator('[data-testid="heap-slot"][data-slot="0"]')).toHaveAttribute('data-node-id', 'h7');
    await page.screenshot({ path: resolve(SHOT_DIR, 'heap-extract-1440-light.png'), fullPage: true });

    await setFrame(page, 5, 10);
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h2"]')).toHaveAttribute('data-slot', '0');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h7"]')).toHaveAttribute('data-slot', '1');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h2"]')).toHaveAttribute('data-value', '8');

    await setFrame(page, 9, 10);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('heap-removed')).toHaveAttribute('data-removed-id', 'h1');
    expect(await slotValues(page)).toEqual([8, 7, 6, 3, 5, 2]);
    expect(heapOrdered(await slotValues(page))).toBe(true);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expectNoOverflow(page);
  });

  test('sorts in place, grows the sorted suffix and excludes it from later heap adjustments', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAlgorithm(page, 17);
    await selectPreset(page, 'sort', 45);

    const visual = page.locator('[data-testid="heap-visual"]');
    await expect(visual).toHaveAttribute('data-command', 'sort');
    await expect(visual).toHaveAttribute('data-total', '7');
    expect(await slotValues(page)).toEqual([5, 1, 9, 3, 9, 2, 6]);

    await setFrame(page, 15, 45);
    await expect(visual).toHaveAttribute('data-operation', 'build-done');
    const built = await slotValues(page);
    expect(heapOrdered(built)).toBe(true);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'build');

    await setFrame(page, 16, 45);
    await expect(visual).toHaveAttribute('data-operation', 'sort-select');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h5"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h5"]')).toHaveAttribute('data-value', '9');
    await expect(page.locator('[data-testid="heap-root"]')).toContainText('#0 · 9');

    await setFrame(page, 17, 45);
    await expect(visual).toHaveAttribute('data-operation', 'swap-to-end');
    await expect(visual).toHaveAttribute('data-heap-size', '6');
    await expect(visual).toHaveAttribute('data-sorted-from', '6');
    await expect(page.locator('[data-testid="heap-node"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="heap-slot"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="heap-node"][data-node-id="h5"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="heap-slot"][data-slot="6"]')).toHaveAttribute('data-node-id', 'h5');
    await expect(page.locator('[data-testid="heap-slot"][data-slot="6"]')).toHaveAttribute('data-value', '9');
    await expect(page.locator('[data-testid="heap-slot"][data-slot="6"]')).toHaveAttribute('data-sorted', 'true');
    await expect(page.locator('[data-testid="heap-slot"][data-sorted="true"]')).toHaveCount(1);
    await expect(page.getByTestId('heap-sorted-divider')).toBeVisible();
    await expect(page.getByTestId('heap-sorted-suffix')).toContainText('9');
    await expect(page.getByTestId('heap-sorted-from')).toContainText('#6');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'sort');
    const expectedAfterFirstSwap = [built[6], ...built.slice(1, 6)].sort((a, b) => a - b);
    expect((await treeBySlot(page)).map((node) => node.value).sort((a, b) => a - b)).toEqual(
      expectedAfterFirstSwap,
    );
    expect((await slotValues(page))[6]).toBe(built[0]);
    await page.screenshot({ path: resolve(SHOT_DIR, 'heap-sort-1440-light.png'), fullPage: true });

    await page.getByTestId('theme-select').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-testid="heap-visual"]')).toBeVisible();
    await page.screenshot({ path: resolve(SHOT_DIR, 'heap-sort-1440-dark.png'), fullPage: true });
    await page.getByTestId('theme-select').selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await expect(page.locator('[data-testid="heap-visual"]')).toBeVisible();
    await expect(page.locator('[data-testid="heap-array-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="heap-node"]')).toHaveCount(6);
    await page.screenshot({ path: resolve(SHOT_DIR, 'heap-sort-390-light.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });

    await setFrame(page, 15, 45);
    await expect(page.locator('[data-testid="heap-slot"][data-sorted="true"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="heap-node"]')).toHaveCount(7);
    await setFrame(page, 17, 45);
    await expect(page.locator('[data-testid="heap-slot"][data-sorted="true"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="heap-node"]')).toHaveCount(6);

    await setFrame(page, 28, 45);
    await expect(visual).toHaveAttribute('data-heap-size', '4');
    await expect(visual).toHaveAttribute('data-sorted-from', '4');
    await expect(page.locator('[data-testid="heap-slot"][data-sorted="true"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="heap-node"]')).toHaveCount(4);
    expect(await slotValues(page)).toHaveLength(7);

    await setFrame(page, 44, 45);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-heap-size', '0');
    await expect(visual).toHaveAttribute('data-sorted-from', '0');
    await expect(page.locator('[data-testid="heap-node"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="heap-slot"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="heap-slot"][data-sorted="true"]')).toHaveCount(7);
    expect(await slotValues(page)).toEqual([1, 2, 3, 5, 6, 9, 9]);
    await expect(page.getByTestId('heap-sorted-suffix')).toContainText('1 → 2 → 3 → 5 → 6 → 9 → 9');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expect(page.getByTestId('heap-range-empty')).toBeVisible();
    await expectNoOverflow(page);
  });
});
