import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

/**
 * UI-02 visual evidence, captured from the built app in real Edge with the real
 * Pyodide Dijkstra trace. Every image is a browser screenshot, not a mock.
 */

const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/ui02');
mkdirSync(SHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
];
const THEMES = ['light', 'dark'] as const;

async function openDijkstra(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, 'dijkstra');
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', {
    timeout: 60_000,
  });
  await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 46', { timeout: 60_000 });
}

async function setFrame(page: Page, frame: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / 46`);
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function shot(page: Page, name: string, fullPage = true) {
  await page.mouse.move(0, 0);
  // Let Chromium recompute the hover target after a viewport or scroll change.
  await page.waitForTimeout(120);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(SHOT_DIR, `${name}.png`), fullPage });
}

test.describe('UI-02 visual evidence', () => {
  test('captures the synchronized Dijkstra rail at 1440/1366/1024/390 in light and dark', async ({ page }) => {
    test.setTimeout(300_000);
    await openDijkstra(page);
    await setFrame(page, 27);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'relax');
    await expect(page.locator('[data-testid="current-step-title"]')).toContainText(/松弛|Relax/i);

    // UX-03 opens the current path; the graph chapter and shortest-path topic
    // are open and Dijkstra stays visible. Earlier open chapters remain open.
    await expect(page.getByTestId('chapter-ch7-graph')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('topic-shortest-path')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('algo-dijkstra')).toBeVisible();

    for (const theme of THEMES) {
      await page.selectOption('[data-testid="theme-select"]', theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize(viewport);
        await expectNoPageOverflow(page);
        await expect(page.locator('[data-testid="visual-stage"]')).toBeVisible();
        await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
        // Desktop evidence stays a clean first screen; the stacked narrow
        // layouts are captured full-page so the rail and editor are visible.
        await shot(page, `dijkstra-relax-${viewport.width}-${theme}`, viewport.width < 1280);
      }
    }

    // The 1440 first screen is the primary "animation and current explanation
    // visible together" acceptance image.
    await page.selectOption('[data-testid="theme-select"]', 'light');
    await page.setViewportSize({ width: 1440, height: 900 });
    await setFrame(page, 27);
    await shot(page, 'dijkstra-relax-1440-light-firstscreen', false);

    await setFrame(page, 45);
    await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');
    await shot(page, 'dijkstra-done-1440-light-firstscreen', false);
    await shot(page, 'dijkstra-done-1440-light');

    // No-course example in the same right rail, after the Fibonacci run
    // replaces the Dijkstra trace. `fib` intentionally has no built-in lesson.
    await chooseAlgorithm(page, 'fib');
    await expect(page.locator('[data-testid="lab-title"]')).toContainText('斐波那契');
    await expect(page.locator('[data-testid="lesson-no-lesson"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-unlinked"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.locator('[data-testid="visual-stage"]')).toBeVisible();
    await shot(page, 'no-course-rail-1440-light-firstscreen', false);
  });
});
