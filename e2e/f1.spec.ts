import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/f1');
mkdirSync(SHOT_DIR, { recursive: true });

async function openSearch(page: Page, algorithm: 'linear' | 'binary', total: number) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, algorithm);
  const visual = page.locator('[data-testid="search-visual"]');
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

async function searchState(page: Page): Promise<string[]> {
  return page.locator('[data-testid="search-bar"]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const element = node as HTMLElement;
      return [element.dataset.value, element.dataset.marks].join('|');
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

test.describe('F1 — real Python sequential and binary search', () => {
  test('linear: left-to-right scan, checked/current/pending marks and first match', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const visual = await openSearch(page, 'linear', 12);

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="search-bar"]')).toHaveCount(6);

    await setFrame(page, 10, 12);
    await expect(visual).toHaveAttribute('data-operation', 'scan-compare');
    await expect(visual).toHaveAttribute('data-index', '4');
    await expect(page.getByTestId('search-target')).toContainText('目标 7');
    await expect(page.getByTestId('search-checked-count')).toContainText('4 / 6');
    await expect(page.locator('[data-testid="search-bar"][data-index="4"]')).toHaveAttribute('data-marks', /current/);
    await expect(page.locator('[data-testid="search-bar"][data-index="4"]')).toHaveAttribute('data-value', '7');
    for (const index of [0, 1, 2, 3]) {
      await expect(page.locator(`[data-testid="search-bar"][data-index="${index}"]`)).toHaveAttribute('data-marks', /checked/);
    }
    await expect(page.locator('[data-testid="search-bar"][data-index="5"]')).toHaveAttribute('data-marks', /pending/);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'scan-compare');
    await page.screenshot({ path: resolve(SHOT_DIR, 'linear-compare-1440-light.png'), fullPage: true });

    const before = await searchState(page);
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('12 / 12');
    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('11 / 12');
    expect(await searchState(page)).toEqual(before);

    await setFrame(page, 11, 12);
    await expect(visual).toHaveAttribute('data-operation', 'found');
    await expect(visual).toHaveAttribute('data-result', '4');
    await expect(page.getByTestId('search-result')).toContainText('索引 4');
    await expect(page.locator('[data-testid="search-bar"][data-index="4"]')).toHaveAttribute('data-marks', /found/);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await page.screenshot({ path: resolve(SHOT_DIR, 'linear-found-1440-light.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
  });

  test('binary: L/R/MID range, real half exclusion, found and invalid input', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const visual = await openSearch(page, 'binary', 10);

    await expect(visual).toHaveAttribute('data-operation', 'binary-init');
    await expect(page.getByTestId('search-left')).toContainText('L = 0');
    await expect(page.getByTestId('search-right')).toContainText('R = 6');
    await expect(page.getByTestId('search-range')).toContainText('[0, 6]');

    await setFrame(page, 3, 10);
    await expect(visual).toHaveAttribute('data-operation', 'binary-exclude-left');
    await expect(visual).toHaveAttribute('data-left', '4');
    await expect(visual).toHaveAttribute('data-right', '6');
    await expect(visual).toHaveAttribute('data-excluded-count', '4');
    await expect(page.getByTestId('search-range')).toContainText('[4, 6]');
    await expect(page.getByTestId('search-left')).toContainText('L = 4');
    await expect(page.getByTestId('search-right')).toContainText('R = 6');
    const bars = page.locator('[data-testid="search-bar"]');
    for (const index of [0, 1, 2]) {
      await expect(bars.nth(index)).toHaveAttribute('data-marks', /excluded/);
    }
    for (const index of [4, 5, 6]) {
      await expect(bars.nth(index)).toHaveAttribute('data-marks', /range/);
    }
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'binary-narrow');
    await page.screenshot({ path: resolve(SHOT_DIR, 'binary-narrow-1440-light.png'), fullPage: true });

    const before = await searchState(page);
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('5 / 10');
    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('4 / 10');
    expect(await searchState(page)).toEqual(before);

    await setFrame(page, 9, 10);
    await expect(visual).toHaveAttribute('data-operation', 'binary-found');
    await expect(visual).toHaveAttribute('data-result', '4');
    await expect(visual).toHaveAttribute('data-mid', '4');
    await expect(page.getByTestId('search-result')).toContainText('索引 4');
    await expect(page.locator('[data-testid="search-bar"][data-index="4"]')).toHaveAttribute('data-marks', /found/);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await page.screenshot({ path: resolve(SHOT_DIR, 'binary-found-1440-light.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await openCodePanel(page);
    await page.locator('#run-input').fill('{"nums":[3,1,2],"target":2}');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('search-invalid')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('search-invalid')).toContainText('不是升序');
    await expect(visual).toHaveAttribute('data-operation', 'invalid');
    await expect(visual).toHaveAttribute('data-phase', 'invalid');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 1');
    await expect(page.getByTestId('search-range')).toHaveCount(0);
    await expect(page.getByTestId('search-left')).toHaveCount(0);
    await expect(page.getByTestId('search-mid')).toHaveCount(0);
    await expect(page.locator('[data-testid="search-bar"]')).toHaveCount(3);
  });
});
