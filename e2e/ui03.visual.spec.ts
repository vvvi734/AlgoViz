import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/ui03');
mkdirSync(SHOT_DIR, { recursive: true });

async function openDijkstra(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, 'dijkstra');
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', {
    timeout: 60_000,
  });
  await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 46', { timeout: 60_000 });
}

test.describe('UI-03 visual evidence', () => {
  test('captures the compact run bar and the open reference sheet', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);
    await page.selectOption('[data-testid="theme-select"]', 'light');
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'true');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(SHOT_DIR, 'runbar-1440-light.png'),
      fullPage: true,
    });

    await openCodePanel(page);
    await page.getByTestId('workspace-tabs-toggle').click();
    await expect(page.locator('[data-testid="workspace-panel-reference"]')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(SHOT_DIR, 'runbar-reference-1440-light.png'),
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(SHOT_DIR, 'runbar-390-light.png'),
      fullPage: true,
    });
  });
});
