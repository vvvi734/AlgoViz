import { expect, test, type Page } from './fixtures';

/**
 * Stage 7A — information architecture, state retention, responsive layout and
 * keyboard operation. Screenshots for visual review are captured separately by
 * `scripts/capture-ui.mjs`; these assertions guard the behaviour behind them.
 */

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
}

test.describe('Stage 7A — workspace UX', () => {
  test('A. desktop puts animation and Monaco side by side with the current step underneath', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);

    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    const editor = await page.locator('.monaco-editor').first().boundingBox();
    const current = await page.locator('[data-testid="current-step"]').boundingBox();
    expect(stage && editor && current).toBeTruthy();
    if (!stage || !editor || !current) return;

    // The code editor is beside the animation, not below a stack of cards.
    expect(editor.x).toBeGreaterThan(stage.x + stage.width - 10);
    expect(Math.abs(editor.y - stage.y)).toBeLessThan(80);
    // The current trace step is visible directly under the animation, fully
    // inside a 1440×900 first screen.
    expect(current.y).toBeGreaterThan(stage.y + stage.height - 10);
    expect(current.y + current.height).toBeLessThanOrEqual(900);

    await expect(page.locator('[data-testid="lesson-title"]')).toContainText('冒泡排序');
    await expect(page.locator('[data-testid="current-step-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-tab-lesson"]')).toHaveAttribute('aria-selected', 'true');
  });

  test('B. switching panels keeps the Monaco draft and never runs or resets the trace', async ({ page }) => {
    await openApp(page);
    const draft = 'const STAGE7_DRAFT = 707;';
    await page.locator('.monaco-editor').first().click();
    await page.keyboard.press('Control+a');
    await page.keyboard.insertText(draft);
    await expect(page.locator('.monaco-editor')).toContainText('STAGE7_DRAFT');

    const progress = await page.locator('[data-testid="progress"]').textContent();
    const feedback = await page.locator('[data-testid="run-feedback"]').textContent();
    await page.click('[data-testid="workspace-tab-mentor"]');
    await expect(page.locator('[data-testid="workspace-panel-mentor"]')).toBeVisible();
    await page.click('[data-testid="workspace-tab-state"]');
    await expect(page.locator('[data-testid="workspace-panel-state"]')).toBeVisible();
    await page.click('[data-testid="workspace-tab-lesson"]');

    await expect(page.locator('.monaco-editor')).toContainText('STAGE7_DRAFT');
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progress ?? '');
    // No execution feedback changed, and Monaco kept its draft: no run happened.
    await expect(page.locator('[data-testid="run-feedback"]')).toHaveText(feedback ?? '');
    await expect(page.locator('.algolens-active-line')).toHaveCount(0);
  });

  test('H. 1024 stacks animation, current step and code without page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openApp(page);

    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    const current = await page.locator('[data-testid="current-step"]').boundingBox();
    const editor = await page.locator('.monaco-editor').first().boundingBox();
    expect(stage && current && editor).toBeTruthy();
    if (!stage || !current || !editor) return;
    expect(current.y).toBeGreaterThan(stage.y + stage.height - 10);
    expect(current.y).toBeLessThan(editor.y);

    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    await expect(page.locator('[data-testid="mobile-algo-select"]')).toBeHidden();
  });

  test('H2. 390px uses the algorithm menu and has no page-level horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);

    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyHeight: document.body.scrollHeight,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    expect(layout.bodyHeight).toBeLessThan(3500);

    await expect(page.locator('[data-testid="mobile-algo-select"]')).toBeVisible();
    await page.selectOption('[data-testid="mobile-algo-select"]', 'binary');
    await expect(page.locator('[data-testid="lab-title"]')).toContainText('二分查找');
    await expect(page.locator('[data-testid="visual-stage"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-tabs"]')).toBeVisible();
  });

  test('I. tab strip supports arrow keys and Escape closes the More tools menu', async ({ page }) => {
    await openApp(page);
    await page.click('[data-testid="workspace-tab-lesson"]');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="workspace-tab-state"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="workspace-panel-state"]')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[data-testid="workspace-tab-lesson"]')).toHaveAttribute('aria-selected', 'true');

    await page.click('[data-testid="nav-more"]');
    await expect(page.locator('[data-testid="nav-more-menu"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="nav-more-menu"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="nav-more"]')).toBeFocused();
  });

  test('E. AI failure is restrained, expandable and never blocks the lab', async ({ page }) => {
    await page.route('**/api/providers', (route) => route.abort());
    await page.route('**/api/mentor', (route) => route.abort());
    await openApp(page);
    await page.click('[data-testid="workspace-tab-mentor"]');

    await expect(page.locator('[data-testid="mentor-status"]')).toContainText('AI 未连接');
    await expect(page.locator('[data-testid="mentor-error-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="mentor-error-detail-body"]')).toHaveCount(0);
    await page.click('[data-testid="mentor-error-details"]');
    await expect(page.locator('[data-testid="mentor-error-detail-body"]')).toContainText('Gateway');

    await expect(page.locator('[data-testid="run-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="visual-stage"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
  });
});
