import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/ux01b/after');
mkdirSync(SHOT_DIR, { recursive: true });

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function selectAlgorithm(page: Page, id: string, _group: string) {
  await chooseAlgorithm(page, id);
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

test.describe('UX-01B — compact guide hierarchy', () => {
  test('desktop: three layers, a reachable animation top and stable playback across folds', async ({ page }) => {
    test.setTimeout(360_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);

    const guide = page.locator('[data-testid="algorithm-guide"]');
    await expect(guide).toBeVisible();
    await expect(page.locator('[data-testid="guide-toggle"]')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('一句话理解');
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Dijkstra');
    await expect(page.locator('[data-testid="guide-problem"]')).toContainText('带权图');
    await expect(page.locator('[data-testid="guide-core-headline"]')).toContainText('贪心选最近');
    await expect(page.locator('[data-testid="guide-core"]')).toContainText('最小堆');
    await expect(page.locator('[data-testid="guide-memory"]')).toContainText('选最近，做松弛');
    await expect(page.locator('[data-testid="guide-stage-list"] li')).toHaveCount(4);
    await expect(page.locator('[data-testid="guide-details"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="guide-details-toggle"]')).toHaveAttribute('aria-expanded', 'false');

    await page.evaluate(() => window.scrollTo(0, 0));
    const layout = await page.evaluate(() => {
      const guide = document.querySelector('[data-testid="algorithm-guide"]') as HTMLElement;
      const primary = document.querySelector('[data-testid="lab-workbench"]') as HTMLElement;
      const g = guide.getBoundingClientRect();
      const p = primary.getBoundingClientRect();
      return {
        guideHeight: g.height,
        guideBottom: g.bottom,
        primaryTop: p.top,
        viewportHeight: window.innerHeight,
      };
    });
    expect(layout.guideHeight).toBeLessThan(620);
    expect(layout.primaryTop).toBeLessThan(layout.viewportHeight);
    expect(layout.guideBottom).toBeLessThan(820);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(SHOT_DIR, 'dijkstra-expanded-1440-light.png') });

    await page.locator('[data-testid="guide-details-toggle"]').click();
    await expect(page.locator('[data-testid="guide-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-details"] .guide-step-list li')).toHaveCount(7);
    await expect(page.locator('[data-testid="guide-details"]')).toContainText('O((V + E) log V)');
    await expect(page.locator('[data-testid="guide-details"]')).toContainText('适用条件与关键限制');
    await expect(page.locator('[data-testid="guide-details"]')).toContainText('常见错误');
    await expect(page.locator('[data-testid="guide-source"]')).toContainText('原创导学');
    await page.screenshot({ path: resolve(SHOT_DIR, 'dijkstra-details-1440-light.png') });
    await page.locator('[data-testid="guide-details-toggle"]').click();
    await expect(page.locator('[data-testid="guide-details"]')).toHaveCount(0);

    await setFrame(page, 10, 46);
    const progressBefore = await page.locator('[data-testid="progress"]').textContent();
    await page.locator('[data-testid="guide-start"]').click();
    await expect(guide).toHaveCount(0);
    await expect(page.locator('[data-testid="guide-toggle"]')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(SHOT_DIR, 'dijkstra-collapsed-1440-light.png') });

    const toggle = page.locator('[data-testid="guide-toggle"]');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(guide).toBeVisible();
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Dijkstra');

    await selectAlgorithm(page, 'topological', 'graph');
    await expect(page.locator('[data-testid="topo-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('拓扑');
    await expect(page.locator('[data-testid="guide-core-headline"]')).toContainText('入度归零');
    await expect(page.locator('[data-testid="guide-memory"]')).toContainText('零入度');
    await expect(page.locator('[data-testid="guide-flow-count"]')).toContainText('4 个阶段');
    await expect(page.locator('[data-testid="guide-stage-list"] li')).toHaveCount(4);
    await expect(page.locator('[data-testid="guide-details"]')).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(SHOT_DIR, 'kahn-expanded-1440-light.png') });

    // Per-algorithm preference: Kahn stays folded while Kosaraju opens, then
    // Kahn is still folded when the learner navigates back to it.
    await page.locator('[data-testid="guide-toggle"]').click();
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveCount(0);

    await selectAlgorithm(page, 'scc', 'graph');
    await expect(page.locator('[data-testid="scc-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Kosaraju');
    await expect(page.locator('[data-testid="guide-core-headline"]')).toContainText('两遍 DFS');
    await expect(page.locator('[data-testid="guide-memory"]')).toContainText('转置图');
    await expect(page.locator('[data-testid="guide-flow-count"]')).toContainText('5 个阶段');
    await expect(page.locator('[data-testid="guide-stage-list"] li')).toHaveCount(5);
    await expect(page.locator('[data-testid="guide-details"]')).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(SHOT_DIR, 'kosaraju-expanded-1440-light.png') });

    await selectAlgorithm(page, 'topological', 'graph');
    await expect(page.locator('[data-testid="topo-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveCount(0);
    await page.locator('[data-testid="guide-toggle"]').click();
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();

    await selectAlgorithm(page, 'scc', 'graph');
    await expect(page.locator('[data-testid="scc-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();

    // English + dark: the three-layer copy and the static sketch remain bilingual.
    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('One-line understanding');
    await expect(page.locator('[data-testid="guide-core-headline"]')).toContainText('Two DFS passes');
    await expect(page.locator('[data-testid="guide-stage-list"]')).toContainText('Build the transpose');
    await expect(page.locator('[data-testid="guide-diagram-kosaraju"]')).toContainText('Transpose');
    await expect(page.locator('[data-testid="guide-memory"]')).toContainText('Postorder');
    await page.selectOption('[data-testid="theme-select"]', 'dark');
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(SHOT_DIR, 'kosaraju-expanded-1440-dark.png') });
    await page.selectOption('[data-testid="theme-select"]', 'system');
    await expectNoPageOverflow(page);

    // A catalog-only algorithm stays short, safe and free of empty stage cards.
    await selectAlgorithm(page, 'binary', 'search');
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveAttribute('data-source', 'catalog');
    await expect(page.locator('[data-testid="guide-no-steps"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-catalog-note"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-stage-list"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="guide-memory"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="guide-details-toggle"]')).toHaveCount(0);
    await expectNoPageOverflow(page);
  });

  test('390 mobile: the guide is readable, detailed and folds without resetting the trace', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    await selectAlgorithm(page, 'scc', 'graph');
    await expect(page.locator('[data-testid="scc-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Kosaraju');
    await expect(page.locator('[data-testid="guide-stage-list"] li')).toHaveCount(5);
    await expectNoPageOverflow(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(SHOT_DIR, 'kosaraju-expanded-390-light.png') });

    await page.locator('[data-testid="guide-details-toggle"]').click();
    await expect(page.locator('[data-testid="guide-details"]')).toBeVisible();
    const stepColumns = await page.locator('.guide-step-list').evaluate(
      (node) => getComputedStyle(node).gridTemplateColumns.split(' ').length,
    );
    expect(stepColumns).toBe(1);
    await page.locator('[data-testid="guide-details-toggle"]').click();

    const progressBefore = await page.locator('[data-testid="progress"]').textContent();
    const toggle = page.locator('[data-testid="guide-toggle"]');
    await toggle.click();
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');
    await expectNoPageOverflow(page);
  });
});
