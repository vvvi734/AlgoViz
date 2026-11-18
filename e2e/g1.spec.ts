import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgorithm(page: Page, id: string, total: number) {
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

async function runInput(page: Page, input: unknown, total: number) {
  await openCodePanel(page);
  await page.fill('#run-input', JSON.stringify(input));
  await page.click('[data-testid="run-btn"]');
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
}

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('G1 — Floyd-Warshall and Bellman-Ford', () => {
  test('Floyd-Warshall: real matrix, current k/i/j, update, path and sidebar-independent playback', async ({ page }) => {
    await openApp(page);
    await selectAlgorithm(page, 'floyd-warshall', 87);
    await expect(page.locator('[data-testid="floyd-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="g1-graph-svg"]')).toHaveAttribute('data-node-count', '5');
    await expect(page.locator('[data-testid="g1-graph-svg"]')).toHaveAttribute('data-edge-count', '7');
    await expect(page.locator('[data-testid="g1-node"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="floyd-cell"]')).toHaveCount(25);
    await expect(page.locator('[data-testid="floyd-stage"]')).toHaveAttribute('data-operation', 'init');

    await setFrame(page, 37, 87);
    await expect(page.locator('[data-testid="floyd-stage"]')).toHaveAttribute('data-operation', 'update');
    await expect(page.locator('[data-testid="floyd-current-strip"]')).toContainText('A → B');
    await expect(page.locator('[data-testid="floyd-current-strip"]')).toContainText('4 → -1');
    await expect(page.locator('[data-testid="floyd-current-strip"]')).toHaveAttribute('data-updated', 'true');
    await expect(page.locator('[data-testid="floyd-cell"][data-row-node-id="A"][data-column-node-id="B"]')).toHaveAttribute('data-value', '-1');
    await expect(page.locator('[data-testid="floyd-path"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="g1-node"][data-role="k"]')).toHaveAttribute('data-node-id', 'C');
    await expect(page.locator('[data-testid="g1-node"][data-role="i"]')).toHaveAttribute('data-node-id', 'A');
    await expect(page.locator('[data-testid="g1-node"][data-role="j"]')).toHaveAttribute('data-node-id', 'B');

    await page.click('[data-testid="sidebar-collapse"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('38 / 87');
    await expect(page.locator('[data-testid="floyd-cell"][data-row-node-id="A"][data-column-node-id="B"]')).toHaveAttribute('data-value', '-1');
    await page.click('[data-testid="sidebar-expand"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('38 / 87');

    await setFrame(page, 86, 87);
    await expect(page.locator('[data-testid="floyd-stage"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="floyd-path"]')).toContainText('A');
    await expect(page.locator('[data-testid="floyd-path"]')).toContainText('C');
    await expect(page.locator('[data-testid="floyd-path"]')).toContainText('E');
    await expect(page.locator('[data-testid="floyd-path"]')).toContainText('2');
    await expect(page.locator('[data-testid="floyd-negative-cycle"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');
  });

  test('Floyd-Warshall: negative cycle and unreachable target remain explicit', async ({ page }) => {
    await openApp(page);
    await selectAlgorithm(page, 'floyd-warshall', 87);
    await expect(page.locator('[data-testid="floyd-stage"]')).toBeVisible({ timeout: 60_000 });

    await runInput(page, {
      start: 'A', target: 'C', directed: true,
      nodes: ['A', 'B', 'C'],
      edges: [['A', 'B', 2], ['B', 'C', -3], ['C', 'B', 1], ['A', 'C', 5]],
    }, 18);
    await expect(page.locator('[data-testid="floyd-stage"]')).toBeVisible();
    await setFrame(page, 17, 18);
    await expect(page.locator('[data-testid="floyd-negative-cycle"]')).toBeVisible();
    await expect(page.locator('[data-testid="floyd-negative-cycle"]')).toContainText('B');
    await expect(page.locator('[data-testid="floyd-path"]')).toContainText('负权环');
    await expect(page.locator('[data-testid="floyd-cell"][data-row-node-id="B"][data-column-node-id="B"]')).toHaveAttribute('data-value', '-2');

    await runInput(page, {
      start: 'A', target: 'D', directed: true,
      nodes: ['A', 'B', 'C', 'D'],
      edges: [['A', 'B', 3], ['C', 'D', 1]],
    }, 42);
    await setFrame(page, 41, 42);
    await expect(page.locator('[data-testid="floyd-negative-cycle"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="floyd-path"]')).toContainText('不可达');
    await expect(page.locator('[data-testid="floyd-cell"][data-row-node-id="A"][data-column-node-id="D"]')).toHaveAttribute('data-value', '');
    await expectNoOverflow(page);
  });

  test('Bellman-Ford: real relax, early exit, path and unreachable negative cycle guard', async ({ page }) => {
    await openApp(page);
    await selectAlgorithm(page, 'bellman-ford', 35);
    await expect(page.locator('[data-testid="bellman-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 35');
    await expect(page.locator('[data-testid="g1-graph-svg"]')).toHaveAttribute('data-node-count', '5');
    await expect(page.locator('[data-testid="g1-graph-svg"]')).toHaveAttribute('data-edge-count', '7');
    await expect(page.locator('[data-testid="bellman-distance-row"]')).toHaveCount(5);

    await setFrame(page, 7, 35);
    await expect(page.locator('[data-testid="bellman-stage"]')).toHaveAttribute('data-operation', 'relax');
    await expect(page.locator('[data-testid="bellman-relax-strip"]')).toContainText('B');
    await expect(page.locator('[data-testid="bellman-relax-strip"]')).toContainText('4');
    await expect(page.locator('[data-testid="bellman-relax-strip"]')).toContainText('-1');
    await expect(page.locator('[data-testid="bellman-distance-row"][data-node-id="B"]')).toHaveAttribute('data-distance', '-1');
    await expect(page.locator('[data-testid="bellman-distance-row"][data-node-id="B"]')).toHaveAttribute('data-previous-id', 'C');
    await expect(page.locator('[data-testid="bellman-path"]')).toHaveCount(0);

    await setFrame(page, 33, 35);
    await expect(page.locator('[data-testid="bellman-early-exit"]')).toBeVisible();
    await expect(page.locator('[data-testid="bellman-stage"]')).toHaveAttribute('data-operation', 'early-exit');

    await setFrame(page, 34, 35);
    await expect(page.locator('[data-testid="bellman-stage"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="bellman-path"]')).toContainText('A');
    await expect(page.locator('[data-testid="bellman-path"]')).toContainText('E');
    await expect(page.locator('[data-testid="bellman-path"]')).toContainText('2');

    await runInput(page, {
      start: 'A', target: 'D', directed: true,
      nodes: ['A', 'B', 'C', 'D'],
      edges: [['A', 'B', 2], ['C', 'D', -2], ['D', 'C', 1]],
    }, 19);
    await setFrame(page, 18, 19);
    await expect(page.locator('[data-testid="bellman-negative-cycle"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="bellman-path"]')).toContainText('不可达');
    await expect(page.locator('[data-testid="bellman-distance-row"][data-node-id="C"]')).toHaveAttribute('data-distance', '');
    await expectNoOverflow(page);
  });
});
