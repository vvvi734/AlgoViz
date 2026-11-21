import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/g1');
mkdirSync(SHOT_DIR, { recursive: true });

async function openAlgorithm(page: Page, id: string, total: number) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, id);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
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

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('G1 visual evidence', () => {
  test('captures Floyd and Bellman-Ford desktop and mobile states', async ({ page }) => {
    test.setTimeout(600_000);

    await openAlgorithm(page, 'floyd-warshall', 87);
    await setFrame(page, 37, 87);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'floyd-update-1440-light.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'floyd-update-390-light.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await setFrame(page, 86, 87);
    await expect(page.locator('[data-testid="floyd-path"]')).toContainText('A→C→B→D→E');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'floyd-done-1440-light.png'), fullPage: true });

    await openAlgorithm(page, 'bellman-ford', 35);
    await setFrame(page, 7, 35);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bellman-relax-1440-light.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bellman-relax-390-light.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await setFrame(page, 34, 35);
    await expect(page.locator('[data-testid="bellman-path"]')).toContainText('A→C→B→D→E');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bellman-done-1440-light.png'), fullPage: true });
  });
});
