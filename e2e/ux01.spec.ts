import { expect, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/ux01');
mkdirSync(SHOT_DIR, { recursive: true });

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgorithm(page: Page, id: string, group: string) {
  const mobile = page.locator('[data-testid="mobile-algo-select"]');
  if (await mobile.isVisible()) {
    await mobile.selectOption(id);
    return;
  }
  const item = page.locator(`[data-testid="algo-${id}"]`);
  if (!(await item.isVisible())) {
    const groupToggle = page.locator(`[data-testid="group-${group}"]`);
    if ((await groupToggle.getAttribute('aria-expanded')) !== 'true') await groupToggle.click();
  }
  await item.click();
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

async function openDijkstra(page: Page) {
  await openApp(page);
  await selectAlgorithm(page, 'dijkstra', 'graph');
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', {
    timeout: 60_000,
  });
  await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 46', { timeout: 60_000 });
}

test.describe('UX-01 — top collapsible algorithm guide', () => {
  test('desktop guide opens by default, preserves the playhead and covers three graph algorithms', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);

    const guide = page.locator('[data-testid="algorithm-guide"]');
    await expect(guide).toBeVisible();
    await expect(page.locator('[data-testid="guide-toggle"]')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-testid="guide-title"]')).toContainText(/Dijkstra/);
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('算法导学');
    await expect(page.locator('[data-testid="guide-problem"]')).toContainText('带权图');
    await expect(page.locator('[data-testid="guide-core"]')).toContainText('最小堆');
    await expect(page.locator('[data-testid="guide-diagram-dijkstra"]')).toBeVisible();
    await expect(page.locator('.guide-step-list li')).toHaveCount(7);
    await expect(page.locator('[data-testid="guide-memory"]')).toContainText('距离表');
    await expect(page.locator('[data-testid="guide-source"]')).toContainText('原创导学');
    await expectNoPageOverflow(page);

    await setFrame(page, 10, 46);
    const progressBefore = await page.locator('[data-testid="progress"]').textContent();

    // Keyboard collapse: the guide is a native button, so Enter must work.
    const toggle = page.locator('[data-testid="guide-toggle"]');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(guide).toHaveCount(0);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');
    await page.screenshot({ path: resolve(SHOT_DIR, 'guide-collapsed-1440-light.png'), fullPage: true });

    // Space expands it again, with no seek or rerun.
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Dijkstra');
    await expect(page.locator('[data-testid="guide-problem"]')).toContainText('带权图');
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');
    await page.screenshot({ path: resolve(SHOT_DIR, 'guide-expanded-1440-light.png'), fullPage: true });

    // Fold Dijkstra through the in-panel button; the per-algorithm preference survives navigation.
    await page.locator('[data-testid="guide-collapse"]').click();
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveCount(0);

    await selectAlgorithm(page, 'topological', 'graph');
    await expect(page.locator('[data-testid="topo-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="lab-title"]')).toContainText('拓扑');
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('拓扑');
    await expect(page.locator('[data-testid="guide-diagram-kahn"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-problem"]')).toContainText('依赖');
    await expect(page.locator('[data-testid="guide-memory"]')).toContainText('入度表');

    await selectAlgorithm(page, 'dijkstra', 'graph');
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', {
      timeout: 60_000,
    });
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveCount(0);
    await page.locator('[data-testid="guide-toggle"]').click();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Dijkstra');

    await selectAlgorithm(page, 'scc', 'graph');
    await expect(page.locator('[data-testid="scc-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="lab-title"]')).toContainText('Kosaraju');
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Kosaraju');
    await expect(page.locator('[data-testid="guide-diagram-kosaraju"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-problem"]')).toContainText('强连通分量');
    await expect(page.locator('[data-testid="guide-core"]')).toContainText('转置图');
    await expectNoPageOverflow(page);

    // English guide and theme switching keep the same panel/content.
    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Algorithm guide');
    await expect(page.getByText('What problem does it solve?')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Core idea', level: 3 })).toBeVisible();
    await page.selectOption('[data-testid="theme-select"]', 'dark');
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await page.selectOption('[data-testid="theme-select"]', 'system');
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await expectNoPageOverflow(page);

    // A catalog-only algorithm must show a safe fallback, not invented steps.
    await selectAlgorithm(page, 'insertion', 'sort');
    await expect(page.locator('[data-testid="lab-title"]')).toContainText('Insertion');
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveAttribute('data-source', 'catalog');
    await expect(page.locator('[data-testid="guide-no-steps"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-catalog-note"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-memory"]')).toHaveCount(0);
  });

  test('390 mobile guide is readable, folds without resetting the trace and has no horizontal overflow', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);

    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('冒泡排序');
    await expectNoPageOverflow(page);

    const progressBefore = await page.locator('[data-testid="progress"]').textContent();
    const toggle = page.locator('[data-testid="guide-toggle"]');
    await toggle.click();
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');

    await toggle.click();
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-problem"]')).toBeVisible();
    await expectNoPageOverflow(page);

    await selectAlgorithm(page, 'scc', 'graph');
    await expect(page.locator('[data-testid="scc-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="lab-title"]')).toContainText('Kosaraju');
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Kosaraju');
    await expect(page.locator('[data-testid="guide-diagram-kosaraju"]')).toBeVisible();
    const stepColumns = await page.locator('.guide-step-list').evaluate(
      (node) => getComputedStyle(node).gridTemplateColumns.split(' ').length,
    );
    expect(stepColumns).toBe(1);
    await expectNoPageOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'guide-expanded-390-light.png') });
  });
});
