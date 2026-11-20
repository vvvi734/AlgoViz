import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/g4');
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

test.describe('G4 visual evidence', () => {
  test('captures connected-components and Kosaraju states', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });

    await openAlgorithm(page, 'components', 50);
    await setFrame(page, 9, 50);
    await expect(page.locator('[data-testid="cc-stage"]')).toHaveAttribute('data-operation', 'push');
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="g4-stack-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="g4-node"][data-node-id="C"]')).toHaveAttribute('data-component-id', '1');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'cc-stack-1440-light.png'), fullPage: true });

    await setFrame(page, 49, 50);
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="cc-result"]')).toContainText('C4={H}');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'cc-done-1440-light.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'cc-done-390-light.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAlgorithm(page, 'scc', 60);
    await setFrame(page, 26, 60);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-reversed', 'true');
    await expect(page.locator('[data-testid="scc-second-chip"]')).toHaveCount(8);
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'scc-reverse-1440-light.png'), fullPage: true });

    await setFrame(page, 29, 60);
    await expect(page.locator('[data-testid="g4-component-row"][data-component-id="1"]')).toHaveAttribute('data-complete', 'true');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'scc-second-pass-1440-light.png'), fullPage: true });

    await setFrame(page, 59, 60);
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="scc-result"]')).toContainText(/C5.*D.*E/);
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'scc-done-390-light.png'), fullPage: true });
  });
});
