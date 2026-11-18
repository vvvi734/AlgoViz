import { expect, openCodePanel, test, type Page } from './fixtures';

/**
 * UI-03 — the Monaco editor is a full-width, collapsed-by-default code dock
 * below the two-column lab. These tests use the real Dijkstra trace and verify
 * that presentation changes never own a second playhead.
 */

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('[data-testid="progress"]')).toContainText('/');
}

async function selectAlgo(page: Page, id: string) {
  const mobile = page.locator('[data-testid="mobile-algo-select"]');
  if (await mobile.isVisible()) await mobile.selectOption(id);
  else await page.click(`[data-testid="algo-${id}"]`);
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

test.describe('UI-03 — bottom code dock', () => {
  test('A. 1440 defaults to a collapsed, full-width dock below both columns', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);

    const primary = await page.locator('.lab-primary').boundingBox();
    const dock = await page.locator('[data-testid="code-dock"]').boundingBox();
    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    const rail = await page.locator('[data-testid="explanation-rail"]').boundingBox();
    expect(primary && dock && stage && rail).toBeTruthy();
    if (!primary || !dock || !stage || !rail) return;

    expect(dock.y).toBeGreaterThan(primary.y + primary.height - 12);
    expect(dock.width).toBeGreaterThanOrEqual(primary.width - 2);
    expect(dock.height).toBeLessThan(160);
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'false');
    await expect(page.locator('[data-testid="code-dock-toggle"]')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-testid="code-dock-body"]')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.monaco-editor')).toBeHidden();
    await expect(page.locator('[data-testid="run-btn"]')).toBeVisible();
    await expect(page.locator('#code-lang')).toBeVisible();
    await expect(page.locator('#code-lang')).toHaveValue('python');
    await expect(page.locator('[data-testid="code-dock-title"]')).toContainText('Python');
    await expectNoPageOverflow(page);
  });

  test('B. expanding and collapsing keeps the Monaco draft and never resets the trace', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 25', { timeout: 60_000 });
    const progressBefore = await page.locator('[data-testid="progress"]').textContent();

    await openCodePanel(page);
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'true');
    await expect(page.locator('[data-testid="code-dock-body"]')).toHaveAttribute('aria-hidden', 'false');
    const editorBox = await page.locator('.monaco-editor').first().boundingBox();
    expect(editorBox?.height ?? 0).toBeGreaterThan(240);

    const marker = 'const UI03_KEEP_DRAFT = 303;';
    await page.locator('.monaco-editor').first().click();
    await page.keyboard.press('Control+a');
    await page.keyboard.insertText(marker);
    await expect(page.locator('.monaco-editor')).toContainText('UI03_KEEP_DRAFT');

    await page.getByTestId('code-dock-toggle').click();
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'false');
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');

    await openCodePanel(page);
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'true');
    await expect(page.locator('.monaco-editor')).toContainText('UI03_KEEP_DRAFT');
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');
  });

  test('C. Dijkstra relax state survives dock and sidebar toggles', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);
    await setFrame(page, 27);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'relax');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="F"]')).toHaveAttribute('data-distance', '4');
    await expect(page.locator('[data-testid="graph-pq-entry"]')).toHaveCount(3);

    await openCodePanel(page);
    await expect(page.locator('.monaco-editor')).toBeVisible();
    await page.getByTestId('code-dock-toggle').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('28 / 46');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'relax');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="F"]')).toHaveAttribute('data-distance', '4');

    // The two collapses are independent: neither one owns the playhead.
    await page.getByTestId('sidebar-collapse').click();
    await expect(page.locator('[data-testid="learn-view"]')).toHaveClass(/nav-collapsed/);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('28 / 46');
    await openCodePanel(page);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('28 / 46');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="F"]')).toHaveAttribute('data-distance', '4');
    await expect(page.locator('[data-testid="graph-priority-queue-panel"]')).toBeVisible();
    await page.getByTestId('sidebar-expand').click();
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'true');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('28 / 46');
    await expectNoPageOverflow(page);
  });

  test('D. the run action works from the collapsed header', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openApp(page);
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'false');
    await expect(page.locator('[data-testid="run-btn"]')).toBeVisible();
    // Run from a later frame so the header action visibly restarts the same trace.
    await page.getByTestId('next-btn').click();
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('3 / 25');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 25', { timeout: 60_000 });
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'false');
    await expect(page.locator('[data-testid="code-dock-status"]')).not.toHaveText('');
    await expectNoPageOverflow(page);
  });

  test('E. 390px opens with the keyboard, edits, and collapses with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openDijkstra(page);

    const toggle = page.getByTestId('code-dock-toggle');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
    const editor = await page.locator('.monaco-editor').first().boundingBox();
    expect(editor?.width ?? 0).toBeLessThanOrEqual(390);
    expect(editor?.height ?? 0).toBeGreaterThan(200);

    await page.locator('.monaco-editor').first().click();
    await page.keyboard.press('Control+a');
    await page.keyboard.insertText('const UI03_MOBILE = 390;');
    await expect(page.locator('.monaco-editor')).toContainText('UI03_MOBILE');

    const input = page.locator('#run-input');
    await input.focus();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expectNoPageOverflow(page);
  });

  test('F. 1366 keeps the two columns and expanded dock inside the viewport', async ({ page }) => {
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

  test('G. switching algorithms while Monaco initializes never leaves stale source', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await page.getByTestId('algo-dijkstra').click();
    await openCodePanel(page);
    await expect(page.locator('#code-lang')).toHaveValue('python');
    await expect(page.locator('.monaco-editor')).toContainText('def dijkstra', { timeout: 45_000 });
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', {
      timeout: 60_000,
    });
  });
});
