import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/g2');
mkdirSync(SHOT_DIR, { recursive: true });

async function openAlgorithm(page: Page, id: string, total: number) {
  await page.goto('/');
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

test.describe('G2 visual evidence', () => {
  test('captures Prim and Kruskal desktop and mobile states', async ({ page }) => {
    test.setTimeout(600_000);

    await openAlgorithm(page, 'prim', 21);
    await setFrame(page, 5, 21);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator('[data-testid="prim-selected-edge"]')).toContainText('B');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'prim-select-1440-light.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'prim-select-390-light.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await setFrame(page, 17, 21);
    await expect(page.locator('[data-testid="prim-current-edge"]')).toContainText('已跳过');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'prim-skip-1440-light.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await setFrame(page, 20, 21);
    await expect(page.locator('[data-testid="prim-result"]')).toContainText('总权重 6');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'prim-done-1440-light.png'), fullPage: true });

    await openAlgorithm(page, 'kruskal', 15);
    await setFrame(page, 7, 15);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator('[data-testid="kruskal-union"]')).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'kruskal-union-1440-light.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'kruskal-union-390-light.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await setFrame(page, 11, 15);
    await expect(page.locator('[data-testid="kruskal-cycle-badge"]')).toContainText('会成环');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'kruskal-reject-1440-light.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await setFrame(page, 14, 15);
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('总权重 6');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'kruskal-done-1440-light.png'), fullPage: true });
  });
});
