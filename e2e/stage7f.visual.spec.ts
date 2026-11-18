import { expect, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/stage7f/after');
mkdirSync(SHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
];
const THEMES = ['light', 'dark'] as const;

async function openDijkstra(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  const mobile = page.locator('[data-testid="mobile-algo-select"]');
  if (await mobile.isVisible()) await mobile.selectOption('dijkstra');
  else await page.click('[data-testid="algo-dijkstra"]');
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', { timeout: 60_000 });
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

async function capture(
  page: Page,
  prefix: string,
  states: Array<{ name: string; frame: number; assert?: () => Promise<void> }>,
) {
  for (const theme of THEMES) {
    await page.selectOption('[data-testid="theme-select"]', theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await expectNoPageOverflow(page);
      for (const state of states) {
        await setFrame(page, state.frame);
        await state.assert?.();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: resolve(SHOT_DIR, `${prefix}-${state.name}-${viewport.width}-${theme}.png`),
          fullPage: true,
        });
      }
    }
  }
}

test.describe('Stage 7F visual evidence', () => {
  test('captures real Dijkstra heap, relaxation, stale entry and final path at three widths in light/dark', async ({ page }) => {
    test.setTimeout(900_000);
    await openDijkstra(page);
    await capture(page, 'dijkstra', [
      {
        name: 'init',
        frame: 0,
        assert: async () => {
          await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(7);
          await expect(page.locator('[data-testid="graph-edge"]')).toHaveCount(7);
          await expect(page.locator('[data-testid="dijkstra-distance-row"]')).toHaveCount(7);
        },
      },
      {
        name: 'start-push',
        frame: 1,
        assert: async () => {
          await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-distance', '0');
          await expect(page.locator('[data-testid="graph-pq-entry"]')).toHaveCount(1);
        },
      },
      {
        name: 'first-relax',
        frame: 5,
        assert: async () => {
          await expect(page.locator('[data-testid="dijkstra-relax-old"]')).toHaveText('∞');
          await expect(page.locator('[data-testid="dijkstra-relax-new"]')).toHaveText('2');
          await expect(page.locator('[data-testid="graph-pq-entry"]')).toHaveCount(1);
        },
      },
      {
        name: 'equal-distances',
        frame: 7,
        assert: async () => {
          await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="B"]')).toHaveAttribute('data-distance', '2');
          await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="C"]')).toHaveAttribute('data-distance', '2');
        },
      },
      {
        name: 'relax-improves-f',
        frame: 27,
        assert: async () => {
          await expect(page.locator('[data-testid="dijkstra-relax-old"]')).toHaveText('6');
          await expect(page.locator('[data-testid="dijkstra-relax-new"]')).toHaveText('4');
          await expect(page.locator('[data-testid="graph-pq-entry"]')).toHaveCount(3);
        },
      },
      {
        name: 'stale-entry',
        frame: 40,
        assert: async () => {
          await expect(page.locator('[data-testid="graph-pq-removed"]')).toHaveAttribute('data-stale', 'true');
          await expect(page.locator('[data-testid="graph-pq-entry"]')).toHaveCount(1);
        },
      },
      {
        name: 'done',
        frame: 45,
        assert: async () => {
          await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toBeVisible();
          await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-path-distance', '7');
        },
      },
      {
        name: 'done-path-detail',
        frame: 45,
        assert: async () => {
          await expect(page.locator('[data-testid="dijkstra-path"]')).toContainText('E');
          await expect(page.locator('[data-testid="dijkstra-path-distance"]')).toContainText('7');
        },
      },
    ]);

    // Prove a real backward jump restores graph, table and heap together.
    await page.selectOption('[data-testid="theme-select"]', 'light');
    await page.setViewportSize({ width: 1440, height: 900 });
    await setFrame(page, 45);
    await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="graph-pq-entry"]')).toHaveCount(0);
    await setFrame(page, 21);
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="F"]')).toHaveAttribute('data-distance', '6');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="G"]')).toHaveAttribute('data-settled', 'false');
    await expect(page.locator('[data-testid="graph-pq-entry"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toHaveCount(0);
    await capture(page, 'dijkstra', [{ name: 'rollback-frame-21', frame: 21 }]);

    // At 390px the weighted graph keeps a readable minimum width and scrolls
    // inside its own canvas. Capture the right edge as explicit evidence that
    // the clipped nodes are reachable, not lost.
    await page.setViewportSize({ width: 390, height: 844 });
    await setFrame(page, 45);
    for (const theme of THEMES) {
      await page.selectOption('[data-testid="theme-select"]', theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.locator('.graph-canvas-scroll').evaluate((node) => {
        node.scrollLeft = node.scrollWidth;
      });
      await page.screenshot({
        path: resolve(SHOT_DIR, `dijkstra-graph-scrolled-right-390-${theme}.png`),
        fullPage: true,
      });
    }
    await page.locator('.graph-canvas-scroll').evaluate((node) => {
      node.scrollLeft = 0;
    });

    // Bilingual acceptance: one English, done-state series through the same course.
    await setFrame(page, 45);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await page.getByLabel('Switch language').click();
    await expect(page.getByTestId('lesson-title')).toContainText(/Dijkstra|shortest/i);
    await capture(page, 'dijkstra-en', [
      {
        name: 'done',
        frame: 45,
        assert: async () => {
          await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toBeVisible();
          await expect(page.locator('[data-testid="graph-pq-empty"]')).toBeVisible();
        },
      },
    ]);
  });
});
