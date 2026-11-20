import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/stage7e/after');
mkdirSync(SHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
];
const THEMES = ['light', 'dark'] as const;

async function openApp(page: Page, id: 'bfs' | 'dfs') {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, id);
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', id, { timeout: 60_000 });
  await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 51', { timeout: 60_000 });
}

async function setFrame(page: Page, frame: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / 51`);
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function captureStates(
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
          fullPage: viewport.width !== 1440,
        });
      }
    }
  }
}

test.describe('Stage 7E visual evidence', () => {
  test('captures real BFS queue and DFS stack states at 1440/1024/390 in light/dark', async ({ page }) => {
    test.setTimeout(900_000);
    await openApp(page, 'bfs');
    await captureStates(page, 'graph-bfs', [
      {
        name: 'init',
        frame: 0,
        assert: async () => {
          await expect(page.locator('[data-testid="graph-node"][data-state="undiscovered"]')).toHaveCount(7);
          await expect(page.locator('[data-testid="graph-edge"]')).toHaveCount(7);
        },
      },
      {
        name: 'start-enqueued',
        frame: 1,
        assert: async () => {
          expect(await page.locator('[data-testid="queue-item"]').evaluateAll((items) =>
            items.map((item) => item.getAttribute('data-node-id')),
          )).toEqual(['A']);
          await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-in-frontier', 'true');
        },
      },
      {
        name: 'first-dequeue',
        frame: 2,
        assert: async () => {
          await expect(page.locator('[data-testid="queue-leaving"]')).toHaveAttribute('data-node-id', 'A');
          await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-state', 'pending');
          await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-current', 'true');
          await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-visited', 'false');
        },
      },
      {
        name: 'discover-neighbor',
        frame: 5,
        assert: async () => {
          await expect(page.locator('[data-testid="graph-edge"][data-active="true"]')).toHaveAttribute('data-edge-id', 'e1');
          await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-state', 'pending');
        },
      },
      {
        name: 'queue-multiple',
        frame: 9,
        assert: async () => {
          expect(await page.locator('[data-testid="queue-item"]').evaluateAll((items) =>
            items.map((item) => item.getAttribute('data-node-id')),
          )).toEqual(['B', 'C']);
          await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-visit-index', '1');
        },
      },
      {
        name: 'skip-discovered',
        frame: 13,
        assert: async () => {
          await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'skip');
          await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-visit-index', '1');
        },
      },
      { name: 'done', frame: 50 },
    ]);

    // A genuine rewind, not a fresh run: frame 9 has B/C queued, frame 3 does not.
    await page.selectOption('[data-testid="theme-select"]', 'light');
    await page.setViewportSize({ width: 1440, height: 900 });
    await setFrame(page, 9);
    expect(await page.locator('[data-testid="queue-item"]').count()).toBe(2);
    await setFrame(page, 3);
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-state', 'undiscovered');
    await captureStates(page, 'graph-bfs', [{ name: 'rollback-queue', frame: 3 }]);

    await openApp(page, 'dfs');
    await captureStates(page, 'graph-dfs', [
      {
        name: 'init',
        frame: 0,
        assert: async () => {
          await expect(page.locator('[data-testid="stack-visual"]')).toBeVisible();
          await expect(page.locator('[data-testid="queue-visual"]')).toHaveCount(0);
        },
      },
      {
        name: 'multiple-pushes',
        frame: 17,
        assert: async () => {
          expect(await page.locator('[data-testid="stack-item"]').evaluateAll((items) =>
            items.map((item) => item.getAttribute('data-node-id')),
          )).toEqual(['D', 'E', 'C']);
        },
      },
      {
        name: 'deep-path',
        frame: 32,
        assert: async () => {
          await expect(page.locator('[data-testid="graph-node"][data-node-id="E"]')).toHaveAttribute('data-visit-index', '4');
          await expect(page.locator('[data-testid="graph-node"][data-node-id="F"]')).toHaveAttribute('data-visit-index', '5');
          expect(await page.locator('[data-testid="stack-item"]').evaluateAll((items) =>
            items.map((item) => item.getAttribute('data-node-id')),
          )).toEqual(['C']);
        },
      },
      {
        name: 'pop-other-branch',
        frame: 44,
        assert: async () => {
          await expect(page.locator('[data-testid="stack-item"]')).toHaveCount(0);
          await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-state', 'pending');
          await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-current', 'true');
          await expect(page.locator('[data-testid="graph-node"][data-visited="true"]')).toHaveCount(6);
        },
      },
      { name: 'done', frame: 50 },
      {
        name: 'final-order',
        frame: 50,
        assert: async () => {
          await expect(page.locator('[data-testid="graph-visit-list"] li')).toHaveCount(7);
          expect(await page.locator('[data-testid="graph-visit-list"] li').evaluateAll((items) =>
            items.map((item) => item.getAttribute('data-node-label')),
          )).toEqual(['A', 'B', 'D', 'E', 'F', 'G', 'C']);
        },
      },
    ]);

    await page.selectOption('[data-testid="theme-select"]', 'light');
    await page.setViewportSize({ width: 1440, height: 900 });
    await setFrame(page, 44);
    await expect(page.locator('[data-testid="stack-item"]')).toHaveCount(0);
    await setFrame(page, 20);
    expect(await page.locator('[data-testid="stack-item"]').evaluateAll((items) =>
      items.map((item) => item.getAttribute('data-node-id')),
    )).toEqual(['E', 'C']);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-state', 'pending');
    await captureStates(page, 'graph-dfs', [{ name: 'rollback-stack', frame: 20 }]);
  });
});
