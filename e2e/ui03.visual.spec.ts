import { expect, openCodePanel, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/ui03');
mkdirSync(SHOT_DIR, { recursive: true });

async function openDijkstra(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await page.getByTestId('algo-dijkstra').click();
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', {
    timeout: 60_000,
  });
  await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 46', { timeout: 60_000 });
  await expect(page.locator('#code-lang')).toHaveValue('python');
}

test.describe('UI-03 visual evidence', () => {
  test('captures desktop collapsed, desktop expanded and mobile expanded', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);
    await page.selectOption('[data-testid="theme-select"]', 'light');

    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'false');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(SHOT_DIR, 'code-dock-collapsed-1440-light.png'),
      fullPage: true,
    });

    await openCodePanel(page);
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('.monaco-editor')).toContainText('def dijkstra');
    await page.waitForTimeout(650);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(SHOT_DIR, 'code-dock-expanded-1440-light.png'),
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'true');
    await page.waitForTimeout(350);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(SHOT_DIR, 'code-dock-expanded-390-light.png'),
      fullPage: true,
    });
    await expect(page.locator('[data-testid="mobile-algo-select"]')).toBeVisible();
  });
});
