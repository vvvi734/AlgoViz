import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

/**
 * UX-01B — the review sheet in its simplified five-block form.
 *
 * The old three-layer guide had a headline, a detail drawer, a diagram caption
 * and a source row. UI-SIMPLIFY replaced those with intro, definition/plain,
 * complexity/conditions, a horizontal flow and pitfalls/memory. This spec keeps
 * the parts that are still real interactions: per-algorithm fold state, the
 * start button, bilingual copy, the catalog fallback and mobile readability.
 */

async function openApp(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function selectAlgorithm(page: Page, id: string) {
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
  await selectAlgorithm(page, 'dijkstra');
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', {
    timeout: 60_000,
  });
  await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 46', { timeout: 60_000 });
}

test.describe('UX-01B — simplified review sheet', () => {
  test('desktop: five blocks, horizontal flow, fold state and bilingual copy', async ({ page }) => {
    test.setTimeout(360_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);

    const guide = page.locator('[data-testid="algorithm-guide"]');
    await expect(guide).toBeVisible();
    await expect(page.locator('[data-testid="guide-toggle"]')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Dijkstra');
    await expect(page.locator('[data-testid="guide-intro"]')).toContainText('BFS');
    await expect(page.locator('[data-testid="guide-intro"]')).toContainText('边权');

    const definitionBlock = page.locator('[data-testid="guide-definition-block"]');
    await expect(definitionBlock).toBeVisible();
    await expect(page.locator('[data-testid="guide-definition"]')).toContainText('非负');
    await expect(page.locator('[data-testid="guide-plain"]')).not.toBeEmpty();

    const facts = page.locator('[data-testid="guide-facts"]');
    await expect(facts).toBeVisible();
    await expect(page.locator('[data-testid="guide-complexity"]')).toContainText('O');
    await expect(page.locator('[data-testid="guide-conditions"]')).toContainText('非负');

    await expect(page.locator('[data-testid="guide-flow-title"]')).toContainText('算法整体流程');
    await expect(page.locator('[data-testid="guide-stage-list"] li')).toHaveCount(6);
    const flowLayout = await page.locator('[data-testid="guide-stage-list"]').evaluate((node) => {
      const style = getComputedStyle(node);
      return { display: style.display, wrap: style.flexWrap, overflow: node.scrollWidth - node.clientWidth };
    });
    expect(flowLayout.display).toBe('flex');
    expect(flowLayout.wrap).toBe('wrap');
    expect(flowLayout.overflow).toBeLessThanOrEqual(1);

    await expect(page.locator('[data-testid="guide-pitfalls"] li')).toHaveCount(3);
    await expect(page.locator('[data-testid="guide-memory"]')).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 0));
    await expectNoPageOverflow(page);

    await setFrame(page, 10, 46);
    const progressBefore = await page.locator('[data-testid="progress"]').textContent();
    await page.locator('[data-testid="guide-start"]').click();
    await expect(guide).toHaveCount(0);
    await expect(page.locator('[data-testid="guide-toggle"]')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');

    await page.locator('[data-testid="guide-toggle"]').click();
    await expect(guide).toBeVisible();
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');

    await selectAlgorithm(page, 'topological');
    await expect(page.locator('[data-testid="topo-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('拓扑');
    await expect(page.locator('[data-testid="guide-stage-list"] li')).toHaveCount(6);
    await expect(page.locator('[data-testid="guide-conditions"]')).toContainText('DAG');

    // The fold preference is per algorithm: folding Kahn must not fold Kosaraju.
    await page.locator('[data-testid="guide-toggle"]').click();
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveCount(0);

    await selectAlgorithm(page, 'scc');
    await expect(page.locator('[data-testid="scc-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Kosaraju');
    await expect(page.locator('[data-testid="guide-stage-list"] li')).toHaveCount(6);
    await expectNoPageOverflow(page);

    await selectAlgorithm(page, 'topological');
    await expect(page.locator('[data-testid="topo-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveCount(0);
    await page.locator('[data-testid="guide-toggle"]').click();
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();

    await selectAlgorithm(page, 'scc');
    await expect(page.locator('[data-testid="scc-stage"]')).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Kosaraju');
    await expect(page.locator('[data-testid="guide-intro"]')).toContainText('Mutual reachability');
    await expect(page.locator('[data-testid="guide-stage-list"]')).toContainText('Build the transposed graph');
    await expect(page.locator('[data-testid="guide-memory"]')).toContainText('transpose');
    await expectNoPageOverflow(page);

    // A catalog-only algorithm has no authored flow and must not invent one.
    // Select it through the mobile menu: at this point the directory is scrolled
    // to the graph chapter and a direct desktop click can land on a stale node.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.selectOption('[data-testid="mobile-algo-select"]', 'fib');
    await expect(page.locator('[data-testid="lab-title"]')).toHaveText(/Fibonacci|斐波那契/);
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveAttribute('data-source', 'catalog');
    await expect(page.locator('[data-testid="guide-no-steps"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-catalog-note"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-stage-list"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="guide-pitfalls"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="guide-memory"]')).toHaveCount(0);
    await expectNoPageOverflow(page);
  });

  test('390 mobile: flow wraps in two columns, text stays readable and folding keeps the trace', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    await selectAlgorithm(page, 'scc');
    await expect(page.locator('[data-testid="scc-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="algorithm-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="guide-title"]')).toContainText('Kosaraju');
    await expect(page.locator('[data-testid="guide-stage-list"] li')).toHaveCount(6);

    const mobile = await page.evaluate(() => {
      const flow = document.querySelector('[data-testid="guide-stage-list"]') as HTMLElement;
      const intro = document.querySelector('[data-testid="guide-intro"]') as HTMLElement;
      const step = document.querySelector('[data-testid="guide-stage-list"] li') as HTMLElement;
      const flowStyle = getComputedStyle(flow);
      return {
        display: flowStyle.display,
        wrap: flowStyle.flexWrap,
        introFont: parseFloat(getComputedStyle(intro).fontSize),
        stepWidth: step.getBoundingClientRect().width,
        stepHeight: step.getBoundingClientRect().height,
        flowOverflow: flow.scrollWidth - flow.clientWidth,
      };
    });
    expect(mobile.display).toBe('flex');
    expect(mobile.wrap).toBe('wrap');
    expect(mobile.introFont).toBeGreaterThanOrEqual(14);
    expect(mobile.stepWidth).toBeGreaterThan(100);
    expect(mobile.stepHeight).toBeGreaterThan(0);
    expect(mobile.flowOverflow).toBeLessThanOrEqual(1);
    await expectNoPageOverflow(page);

    const progressBefore = await page.locator('[data-testid="progress"]').textContent();
    await page.locator('[data-testid="guide-toggle"]').click();
    await expect(page.locator('[data-testid="algorithm-guide"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progressBefore ?? '');
    await expectNoPageOverflow(page);
  });
});
