import { collapseAlgorithmGuide, expect, openAdvancedPanels, openCodePanel, selectAlgorithm, test, type Page } from './fixtures';

/**
 * Stage 7A information architecture, state retention and keyboard operation,
 * updated by UI-03: animation left, explanation rail right, and a full-width
 * code dock below both columns.
 */

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await collapseAlgorithmGuide(page);
}

test.describe('Stage 7A — workspace UX (UI-03 layout)', () => {
  test('A. desktop puts animation left, lesson right and a collapsed code dock below', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);

    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    const stagePanel = await page.locator('.stage-panel').boundingBox();
    const rail = await page.locator('[data-testid="explanation-rail"]').boundingBox();
    const current = await page.locator('[data-testid="current-step"]').boundingBox();
    const primary = await page.locator('.lab-primary').boundingBox();
    const dock = await page.locator('[data-testid="code-dock"]').boundingBox();
    expect(stage && stagePanel && rail && current && primary && dock).toBeTruthy();
    if (!stage || !stagePanel || !rail || !current || !primary || !dock) return;

    // The rail is a real second column, not a card under the animation.
    expect(rail.x).toBeGreaterThan(stage.x + stage.width - 10);
    expect(Math.abs(rail.y - stagePanel.y)).toBeLessThan(24);
    // The current frame is at the top of the rail and fully on the first screen.
    expect(current.y).toBeGreaterThanOrEqual(rail.y);
    expect(current.y + current.height).toBeLessThanOrEqual(900);
    // UI-03: the editor is no longer inside the rail; the dock spans below both.
    await expect(page.locator('[data-testid="explanation-rail"] .monaco-editor')).toHaveCount(0);
    expect(dock.y).toBeGreaterThan(primary.y + primary.height - 12);
    expect(dock.width).toBeGreaterThan(stage.width + rail.width - 10);
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'false');
    await expect(page.locator('[data-testid="code-dock-toggle"]')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.monaco-editor')).toBeHidden();
    await expect(page.locator('[data-testid="run-btn"]')).toBeVisible();

    await expect(page.locator('[data-testid="lesson-title"]')).toContainText('冒泡排序');
    await expect(page.locator('[data-testid="current-step-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-tab-reference"]')).toHaveAttribute('aria-selected', 'true');
  });

  test('B. switching panels keeps the Monaco draft and never runs or resets the trace', async ({ page }) => {
    await openApp(page);
    await openCodePanel(page);
    const draft = 'const STAGE7_DRAFT = 707;';
    await page.locator('.monaco-editor').first().click();
    await page.keyboard.press('Control+a');
    await page.keyboard.insertText(draft);
    await expect(page.locator('.monaco-editor')).toContainText('STAGE7_DRAFT');

    const progress = await page.locator('[data-testid="progress"]').textContent();
    const feedback = await page.locator('[data-testid="run-feedback"]').textContent();
    await openAdvancedPanels(page);
    await page.click('[data-testid="workspace-tab-mentor"]');
    await expect(page.locator('[data-testid="workspace-panel-mentor"]')).toBeVisible();
    await page.click('[data-testid="workspace-tab-state"]');
    await expect(page.locator('[data-testid="workspace-panel-state"]')).toBeVisible();
    await page.click('[data-testid="workspace-tab-tools"]');
    await expect(page.locator('[data-testid="workspace-panel-tools"]')).toBeVisible();

    await expect(page.locator('.monaco-editor')).toContainText('STAGE7_DRAFT');
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progress ?? '');
    // No execution feedback changed, and Monaco kept its draft: no run happened.
    await expect(page.locator('[data-testid="run-feedback"]')).toHaveText(feedback ?? '');
    await expect(page.locator('.algolens-active-line')).toHaveCount(0);
  });

  test('H. 1024 stacks animation, then the explanation rail, then the collapsed code dock without page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openApp(page);

    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    const current = await page.locator('[data-testid="current-step"]').boundingBox();
    const dock = await page.locator('[data-testid="code-dock"]').boundingBox();
    expect(stage && current && dock).toBeTruthy();
    if (!stage || !current || !dock) return;
    expect(current.y).toBeGreaterThan(stage.y + stage.height - 10);
    expect(current.y).toBeLessThan(dock.y);
    expect(dock.width).toBeGreaterThan(600);
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'false');

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
    await page.selectOption('[data-testid="mobile-algo-select"]', 'fib');
    await expect(page.locator('[data-testid="lab-title"]')).toContainText('斐波那契');
    await expect(page.locator('[data-testid="visual-stage"]')).toBeVisible();
    // UI-SIMPLIFY-02: `fib` has no built-in course, so the rail shows the
    // explicit empty state plus the frame-level current operation, never a
    // fabricated lesson-linked step.
    await expect(page.locator('[data-testid="lesson-no-lesson"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-unlinked"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveCount(0);

    await page.selectOption('[data-testid="mobile-algo-select"]', 'bubble');
    await expect(page.locator('[data-testid="lab-title"]')).toContainText('冒泡排序');
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-tabs"]')).toBeVisible();
  });

  test('I. tab strip supports arrow keys and Escape closes the More tools menu', async ({ page }) => {
    await openApp(page);
    await openAdvancedPanels(page);
    await page.click('[data-testid="workspace-tab-state"]');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="workspace-tab-mentor"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="workspace-panel-mentor"]')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[data-testid="workspace-tab-state"]')).toHaveAttribute('aria-selected', 'true');

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
    await openAdvancedPanels(page);
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

  test('J. reference code opens as a read-only C / C++ / Python viewer', async ({ page }) => {
    await openApp(page);
    await selectAlgorithm(page, 'binary');
    await openAdvancedPanels(page);

    await expect(page.locator('[data-testid="workspace-tab-reference"]')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.locator('[data-testid="reference-code-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="reference-file-name"]')).toHaveText('binary_search.c');
    await expect(page.locator('[data-testid="reference-code-viewer"] .monaco-editor')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-testid="reference-code-viewer"]')).toHaveAttribute(
      'data-readonly',
      'true',
    );
    await expect(page.locator('[data-testid="reference-code-viewer"] [contenteditable="true"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="reference-code-panel"] [data-testid="run-btn"]')).toHaveCount(0);
    const tokenClasses = await page.locator('.reference-code-viewer .view-lines .view-line span').evaluateAll(
      (nodes) => nodes.map((node) => node.className).filter((name) => name.startsWith('mtk')),
    );
    expect(new Set(tokenClasses).size).toBeGreaterThan(1);

    await page.click('[data-testid="reference-lang-cpp"]');
    await expect(page.locator('[data-testid="reference-file-name"]')).toHaveText('binary_search.cpp');
    await page.click('[data-testid="reference-lang-python"]');
    await expect(page.locator('[data-testid="reference-file-name"]')).toHaveText('binary_search.py');
    await expect(page.locator('[data-testid="reference-lang-python"]')).toHaveAttribute('aria-selected', 'true');

    // Switching algorithms keeps the reference code in sync, and the runnable
    // Python dock remains a separate surface.
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.locator('[data-testid="reference-file-name"]')).toHaveText('dijkstra.py');
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'false');

    // CODE-02: a sort page can switch from the hand-written version to the
    // shared language-native convenience resource without leaving the viewer.
    await page.click('[data-testid="reference-lang-c"]');
    await selectAlgorithm(page, 'bubble');
    await expect(page.locator('[data-testid="reference-file-name"]')).toHaveText('bubble_sort.c');
    await expect(page.locator('[data-testid="reference-implementation-tabs"]')).toBeVisible();
    await page.click('[data-testid="reference-impl-convenience"]');
    await expect(page.locator('[data-testid="reference-code-panel"]')).toHaveAttribute(
      'data-implementation',
      'convenience',
    );
    await expect(page.locator('[data-testid="reference-file-name"]')).toHaveText('builtin_sorting.c');
    await expect(page.locator('[data-testid="reference-code-viewer"] .monaco-editor')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-testid="reference-source"]')).toContainText('共享便捷示例');
  });
});
