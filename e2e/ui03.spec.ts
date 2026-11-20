import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

/**
 * UI-03 — the compact run bar is always open below the two-column lab.
 * It carries the default example, JSON input, random data and Run; it never
 * owns a second playhead and never renders an editable source panel.
 */

async function openApp(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('[data-testid="progress"]')).toContainText('/');
}

async function selectAlgo(page: Page, id: string) {
  await chooseAlgorithm(page, id);
}

async function openDijkstra(page: Page) {
  await openApp(page);
  await selectAlgo(page, 'dijkstra');
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', {
    timeout: 60_000,
  });
  await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 46', { timeout: 60_000 });
}

async function setFrame(page: Page, frame: number, total = 46) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / ${total}`);
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('UI-03 — compact run bar', () => {
  test('A. 1440 keeps one full-width run bar below both columns', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);
    await openCodePanel(page);

    const primary = await page.locator('.lab-primary').boundingBox();
    const dock = await page.locator('[data-testid="code-dock"]').boundingBox();
    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    const rail = await page.locator('[data-testid="explanation-rail"]').boundingBox();
    expect(primary && dock && stage && rail).toBeTruthy();
    if (!primary || !dock || !stage || !rail) return;

    expect(dock.y).toBeGreaterThan(primary.y + primary.height - 12);
    expect(dock.width).toBeGreaterThanOrEqual(primary.width - 2);
    expect(dock.height).toBeLessThan(200);
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'true');
    await expect(page.locator('[data-testid="code-dock-toggle"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="code-editor"]')).toHaveCount(0);
    await expect(page.locator('.monaco-editor')).toHaveCount(0);
    await expect(page.locator('[data-testid="run-btn"]')).toBeVisible();
    await expect(page.locator('#run-input')).toBeVisible();
    await expect(page.locator('[data-testid="random-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="code-dock-title"]')).toContainText('默认示例');
    await expectNoPageOverflow(page);
  });

  test('B. Dijkstra relax state survives sidebar toggles and a run', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);
    await setFrame(page, 27);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'relax');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="F"]')).toHaveAttribute('data-distance', '4');
    await expect(page.locator('[data-testid="graph-pq-entry"]')).toHaveCount(3);

    // The run bar is presentation only; collapsing the directory never resets.
    await page.getByTestId('sidebar-collapse').click();
    await expect(page.locator('[data-testid="learn-view"]')).toHaveClass(/nav-collapsed/);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('28 / 46');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="F"]')).toHaveAttribute('data-distance', '4');
    await page.getByTestId('sidebar-expand').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('28 / 46');
    await expectNoPageOverflow(page);
  });

  test('C. run from the bar restarts the same trace', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openApp(page);
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'true');
    await page.getByTestId('next-btn').click();
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('3 / 25');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 25', { timeout: 60_000 });
    await expect(page.locator('[data-testid="run-feedback"]')).not.toHaveText('');
    await expectNoPageOverflow(page);
  });

  test('D. 390px keeps the run bar reachable without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openDijkstra(page);
    await openCodePanel(page);
    await expect(page.locator('[data-testid="run-btn"]')).toBeVisible();
    const input = await page.locator('#run-input').boundingBox();
    expect(input?.width ?? 0).toBeLessThanOrEqual(390);
    await expectNoPageOverflow(page);
  });

  test('E. 1366 keeps the two columns and the run bar inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openDijkstra(page);
    await openCodePanel(page);
    const dock = await page.locator('[data-testid="code-dock"]').boundingBox();
    expect(dock?.width ?? 0).toBeLessThanOrEqual(1366);
    await expectNoPageOverflow(page);
    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    const rail = await page.locator('[data-testid="explanation-rail"]').boundingBox();
    expect(stage && rail).toBeTruthy();
    if (stage && rail) expect(rail.x).toBeGreaterThan(stage.x + stage.width - 10);
  });
});
