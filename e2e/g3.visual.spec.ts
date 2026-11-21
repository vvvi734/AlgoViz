import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/g3');
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

test.describe('G3 visual evidence', () => {
  test('captures Kahn and AOE desktop and mobile states', async ({ page }) => {
    test.setTimeout(600_000);

    await openAlgorithm(page, 'topological', 32);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await setFrame(page, 5, 32);
    await expect(page.locator('[data-testid="topo-indegree-change"]')).toContainText('C: 2 → 1');
    await expect(page.locator('[data-testid="topo-edge"][data-edge-id="e1"]')).toHaveAttribute('data-removed', 'true');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'topo-decrement-1440-light.png'), fullPage: true });

    await setFrame(page, 31, 32);
    await expect(page.locator('[data-testid="topo-final-order"]')).toContainText('A → B → D → C → E → F → G');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'topo-done-1440-light.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'topo-done-390-light.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAlgorithm(page, 'critical-path', 22);
    await setFrame(page, 8, 22);
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="F"]')).toHaveAttribute('data-ve', '11');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'critical-ve-1440-light.png'), fullPage: true });

    await setFrame(page, 17, 22);
    await expect(page.locator('[data-testid="critical-activity-row"][data-edge-id="e3"]')).toHaveAttribute('data-slack', '1');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'critical-activity-1440-light.png'), fullPage: true });

    await setFrame(page, 21, 22);
    await expect(page.locator('[data-testid="critical-duration"]')).toContainText('11');
    await expect(page.locator('[data-testid="critical-path-item"]')).toHaveCount(2);
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'critical-done-1440-light.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'critical-done-390-light.png'), fullPage: true });
  });
});
