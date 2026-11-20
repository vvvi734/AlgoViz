import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { collapseAlgorithmGuide, expect, selectAlgorithm, test } from './fixtures';

const SHOT_DIR = resolve(process.cwd(), 'docs/ux04/after');
mkdirSync(SHOT_DIR, { recursive: true });

async function setFrame(page: import('@playwright/test').Page, frame: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="step-number"]')).toContainText(String(frame + 1));
  await page.waitForTimeout(200);
}

async function openRealAlgorithm(
  page: import('@playwright/test').Page,
  id: string,
  marker: string,
  frame: number,
) {
  await selectAlgorithm(page, id);
  await expect(page.locator(marker)).toBeVisible({ timeout: 180_000 });
  await expect(page.locator('[data-testid="step-number"]')).not.toContainText('0');
  await collapseAlgorithmGuide(page);
  await setFrame(page, frame);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

test.describe('UX-04 after screenshots', () => {
  test('captures 1366 full page, desktop algorithms and 1920 proof', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });

    await openRealAlgorithm(page, 'dijkstra', '[data-testid="graph-visual"][data-algorithm="dijkstra"]', 27);
    await page.screenshot({ path: resolve(SHOT_DIR, 'dijkstra-1366x768.png') });
    await page.screenshot({ path: resolve(SHOT_DIR, 'full-1366x768.png'), fullPage: true });

    await openRealAlgorithm(page, 'scc', '[data-testid="scc-stage"]', 27);
    await page.screenshot({ path: resolve(SHOT_DIR, 'kosaraju-1366x768.png') });

    await openRealAlgorithm(page, 'topological', '[data-testid="topo-stage"]', 5);
    await page.screenshot({ path: resolve(SHOT_DIR, 'kahn-1366x768.png') });

    await openRealAlgorithm(page, 'bst', '[data-testid="bst-visual"]', 5);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-1366x768.png') });

    await openRealAlgorithm(page, 'avl', '[data-testid="avl-visual"]', 12);
    await page.screenshot({ path: resolve(SHOT_DIR, 'avl-rotation-1366x768.png') });

    await page.getByTestId('guide-toggle').click();
    await expect(page.getByTestId('algorithm-guide')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(SHOT_DIR, 'guide-open-1366x768.png') });
    await page.getByTestId('guide-start').click();
    await expect(page.getByTestId('algorithm-guide')).toHaveCount(0);

    await page.setViewportSize({ width: 1920, height: 1080 });
    await openRealAlgorithm(page, 'dijkstra', '[data-testid="graph-visual"][data-algorithm="dijkstra"]', 27);
    await page.screenshot({ path: resolve(SHOT_DIR, 'dijkstra-1920x1080.png') });
  });

  test('captures 1440 before/after comparison frames', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });

    await openRealAlgorithm(page, 'dijkstra', '[data-testid="graph-visual"][data-algorithm="dijkstra"]', 27);
    await page.screenshot({ path: resolve(SHOT_DIR, 'dijkstra-1440x900.png') });

    await openRealAlgorithm(page, 'scc', '[data-testid="scc-stage"]', 27);
    await page.screenshot({ path: resolve(SHOT_DIR, 'kosaraju-1440x900.png') });

    await openRealAlgorithm(page, 'topological', '[data-testid="topo-stage"]', 5);
    await page.screenshot({ path: resolve(SHOT_DIR, 'kahn-1440x900.png') });

    await openRealAlgorithm(page, 'bst', '[data-testid="bst-visual"]', 5);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-1440x900.png') });

    await openRealAlgorithm(page, 'avl', '[data-testid="avl-visual"]', 12);
    await page.screenshot({ path: resolve(SHOT_DIR, 'avl-1440x900.png') });
  });
});
