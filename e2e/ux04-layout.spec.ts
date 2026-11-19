import { collapseAlgorithmGuide, expect, openAdvancedPanels, selectAlgorithm, test, type Page } from './fixtures';

/**
 * UX-04 desktop one-screen acceptance.
 *
 * These assertions check real geometry: topbar, title, textbook directory,
 * the complete visual stage, the explanation rail, playback controls, code
 * dock and the advanced-panel disclosure must all sit inside the viewport.
 * Graph/tree nodes are checked individually against their scroll container, so
 * passing `scrollWidth` alone can never hide a clipped node.
 */

const SHOT_DIR = 'docs/ux04/after';
const DESKTOP = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const ALGORITHMS = [
  {
    id: 'dijkstra',
    marker: '[data-testid="graph-visual"][data-algorithm="dijkstra"]',
    frame: 27,
    scroller: '.graph-canvas-scroll',
    node: '[data-testid="graph-node"]',
  },
  {
    id: 'scc',
    marker: '[data-testid="scc-stage"]',
    frame: 27,
    scroller: '.mst-graph-scroll',
    node: '[data-testid="g4-node"]',
  },
  {
    id: 'topological',
    marker: '[data-testid="topo-stage"]',
    frame: 5,
    scroller: '.mst-graph-scroll',
    node: '[data-testid="topo-node"]',
  },
  {
    id: 'bst',
    marker: '[data-testid="bst-visual"]',
    frame: 5,
    scroller: '.tree-scroller',
    node: '[data-testid="bst-node"]',
  },
  {
    id: 'avl',
    marker: '[data-testid="avl-visual"]',
    frame: 12,
    scroller: '.tree-scroller',
    node: '[data-testid="avl-node"]',
  },
] as const;

type AlgorithmCase = (typeof ALGORITHMS)[number];

async function setFrame(page: Page, frame: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="step-number"]')).toContainText(String(frame + 1));
  await page.waitForTimeout(120);
}

async function openAlgorithm(page: Page, algo: AlgorithmCase) {
  await selectAlgorithm(page, algo.id);
  await expect(page.locator(algo.marker)).toBeVisible({ timeout: 180_000 });
  await expect(page.locator('[data-testid="step-number"]')).not.toContainText('0');
  await expect(page.locator('[data-testid="progress"]')).toContainText('/');
  await collapseAlgorithmGuide(page);
  await setFrame(page, algo.frame);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function panelsInsideViewport(page: Page, width: number, height: number) {
  const data = await page.evaluate(() => {
    const read = (selector: string) => {
      const node = document.querySelector<HTMLElement>(selector);
      if (!node) return { selector, missing: true };
      const box = node.getBoundingClientRect();
      return {
        selector,
        missing: false,
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        left: Math.round(box.left),
        right: Math.round(box.right),
      };
    };
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: {
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientHeight: document.documentElement.clientHeight,
        clientWidth: document.documentElement.clientWidth,
      },
      panels: [
        '.topbar',
        '[data-testid="nav-learn"]',
        '[data-testid="lab-title"]',
        '[data-testid="sidebar"]',
        '.stage-panel',
        '[data-testid="current-step"]',
        '.stage-playback',
        '[data-testid="code-dock"]',
        '[data-testid="workspace-tabs-toggle"]',
      ].map(read),
    };
  });

  expect(data.viewport).toEqual({ width, height });
  expect(data.document.scrollHeight).toBeLessThanOrEqual(height + 1);
  expect(data.document.scrollWidth).toBeLessThanOrEqual(width + 1);
  expect(data.document.clientHeight).toBe(height);

  for (const panel of data.panels) {
    expect(panel.missing, `${panel.selector} should exist`).toBe(false);
    expect(panel.top, `${panel.selector} top`).toBeGreaterThanOrEqual(-1);
    expect(panel.left, `${panel.selector} left`).toBeGreaterThanOrEqual(-1);
    expect(panel.bottom, `${panel.selector} bottom`).toBeLessThanOrEqual(height + 1);
    expect(panel.right, `${panel.selector} right`).toBeLessThanOrEqual(width + 1);
  }
}

async function graphNodesInsideScroller(
  page: Page,
  scroller: string,
  nodeSelector: string,
  allowHorizontalScroll = false,
) {
  const data = await page.evaluate(
    ({ scrollerSelector, node }) => {
      const container = document.querySelector<HTMLElement>(scrollerSelector);
      if (!container) return { missingContainer: true, nodes: [] };
      const box = container.getBoundingClientRect();
      const style = getComputedStyle(container);
      const nodes = Array.from(document.querySelectorAll<SVGElement>(node)).map((element, index) => {
        const nodeBox = element.getBoundingClientRect();
        return {
          index,
          top: Math.round(nodeBox.top),
          bottom: Math.round(nodeBox.bottom),
          left: Math.round(nodeBox.left),
          right: Math.round(nodeBox.right),
        };
      });
      return {
        missingContainer: false,
        container: {
          top: Math.round(box.top),
          bottom: Math.round(box.bottom),
          left: Math.round(box.left),
          right: Math.round(box.right),
          scrollLeft: container.scrollLeft,
          scrollWidth: container.scrollWidth,
          clientWidth: container.clientWidth,
          overflowX: style.overflowX,
        },
        nodes,
      };
    },
    { scrollerSelector: scroller, node: nodeSelector },
  );

  expect(data.missingContainer, `${scroller} should exist`).toBe(false);
  expect(data.nodes.length, `${nodeSelector} should render at least one node`).toBeGreaterThan(0);
  for (const node of data.nodes) {
    expect(node.top, `${nodeSelector}[${node.index}] top`).toBeGreaterThanOrEqual(data.container.top - 2);
    expect(node.bottom, `${nodeSelector}[${node.index}] bottom`).toBeLessThanOrEqual(data.container.bottom + 2);
    if (allowHorizontalScroll) {
      expect(data.container.overflowX, `${scroller} must scroll horizontally`).toBe('auto');
      const leftOffset = node.left - data.container.left + data.container.scrollLeft;
      const rightOffset = node.right - data.container.left + data.container.scrollLeft;
      expect(leftOffset, `${nodeSelector}[${node.index}] content left`).toBeGreaterThanOrEqual(-2);
      expect(rightOffset, `${nodeSelector}[${node.index}] content right`).toBeLessThanOrEqual(
        data.container.scrollWidth + 2,
      );
    } else {
      expect(node.left, `${nodeSelector}[${node.index}] left`).toBeGreaterThanOrEqual(data.container.left - 2);
      expect(node.right, `${nodeSelector}[${node.index}] right`).toBeLessThanOrEqual(data.container.right + 2);
    }
  }
}

test.describe('UX-04 — desktop one-screen learning', () => {
  test('1366×768 keeps navigation, directory, graph, explanation, playback and disclosures in one viewport', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    for (const algo of ALGORITHMS) {
      await openAlgorithm(page, algo);
      await panelsInsideViewport(page, 1366, 768);
      await graphNodesInsideScroller(page, algo.scroller, algo.node, algo.scroller === '.tree-scroller');
    }
  });

  test('1440×900 has no unnecessary whole-page scroll for every graph and tree lesson', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    for (const algo of ALGORITHMS) {
      await openAlgorithm(page, algo);
      await panelsInsideViewport(page, 1440, 900);
      await graphNodesInsideScroller(page, algo.scroller, algo.node, algo.scroller === '.tree-scroller');
    }
  });

  test('1920×1080 uses the extra desktop height without Hiding content', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    for (const algo of ALGORITHMS.filter((item) => ['dijkstra', 'scc', 'bst'].includes(item.id))) {
      await openAlgorithm(page, algo);
      await panelsInsideViewport(page, 1920, 1080);
      await graphNodesInsideScroller(page, algo.scroller, algo.node, algo.scroller === '.tree-scroller');
    }
  });

  test('guide opens normally and "start animation" returns to playback without resetting the frame or rerunning Python', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.locator('[data-testid="graph-visual"][data-algorithm="dijkstra"]')).toBeVisible({ timeout: 180_000 });
    await collapseAlgorithmGuide(page);
    await setFrame(page, 12);

    await page.getByTestId('guide-toggle').click();
    await expect(page.getByTestId('algorithm-guide')).toBeVisible();
    await expect(page.getByTestId('guide-start')).toBeVisible();
    const progress = await page.getByTestId('progress').innerText();
    const step = await page.getByTestId('step-number').innerText();
    const feedback = await page.getByTestId('run-feedback').innerText();

    await page.getByTestId('guide-start').click();
    await expect(page.getByTestId('algorithm-guide')).toHaveCount(0);
    await expect(page.getByTestId('play-btn')).toBeVisible();
    const playback = await page.locator('.stage-playback').boundingBox();
    expect(playback).not.toBeNull();
    expect(playback!.y).toBeGreaterThanOrEqual(0);
    expect(playback!.y + playback!.height).toBeLessThanOrEqual(768 + 1);
    expect(await page.getByTestId('progress').innerText()).toBe(progress);
    expect(await page.getByTestId('step-number').innerText()).toBe(step);
    expect(await page.getByTestId('run-feedback').innerText()).toBe(feedback);
    await expect(page.getByTestId('algorithm-guide')).toHaveCount(0);
  });

  test('advanced panels start collapsed, expand to reference code and Trace state, and preserve frame state across the toggle', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.locator('[data-testid="graph-visual"][data-algorithm="dijkstra"]')).toBeVisible({ timeout: 180_000 });
    await collapseAlgorithmGuide(page);
    await expect(page.getByTestId('progress')).toContainText('/');
    await expect(page.getByTestId('step-number')).not.toContainText('0');
    await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'false');
    await expect(page.getByTestId('workspace-tabs-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('workspace-panel-state')).toBeHidden();
    const progress = await page.getByTestId('progress').innerText();
    const current = await page.getByTestId('current-step').innerText();

    await openAdvancedPanels(page);
    await expect(page.getByTestId('workspace-panel-reference')).toBeVisible();
    await expect(page.getByTestId('variables-watch')).toContainText('distances');
    await page.getByTestId('workspace-tab-tools').click();
    await expect(page.getByTestId('workspace-panel-tools')).toBeVisible();
    await page.getByTestId('workspace-tabs-toggle').click();
    await expect(page.getByTestId('workspace-panel-tools')).toBeHidden();
    expect(await page.getByTestId('progress').innerText()).toBe(progress);
    expect(await page.getByTestId('current-step').innerText()).toBe(current);

    await openAdvancedPanels(page);
    await expect(page.getByTestId('workspace-panel-tools')).toBeVisible();
    await page.getByTestId('workspace-tab-state').click();
    await expect(page.getByTestId('workspace-panel-state')).toBeVisible();
    await expect(page.getByTestId('variables-watch')).toContainText('distances');
  });

  test('previous, next and scrub update the same current explanation and keep playback visible', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.locator('[data-testid="graph-visual"][data-algorithm="dijkstra"]')).toBeVisible({ timeout: 180_000 });
    await collapseAlgorithmGuide(page);
    await setFrame(page, 9);
    const before = await page.getByTestId('current-step').innerText();

    await page.getByTestId('next-btn').click();
    await expect(page.getByTestId('step-number')).toContainText('11');
    const afterNext = await page.getByTestId('current-step').innerText();
    expect(afterNext).not.toBe(before);

    await page.getByTestId('prev-btn').click();
    await expect(page.getByTestId('step-number')).toContainText('10');
    expect(await page.getByTestId('current-step').innerText()).toBe(before);

    await setFrame(page, 21);
    await expect(page.getByTestId('step-number')).toContainText('22');
    expect(await page.getByTestId('current-step').innerText()).not.toBe(afterNext);
    const playback = await page.locator('.stage-playback').boundingBox();
    expect(playback!.y).toBeGreaterThanOrEqual(0);
    expect(playback!.y + playback!.height).toBeLessThanOrEqual(769);
  });

  test('collapsing the textbook sidebar does not reset trace, frame or playback', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.locator('[data-testid="graph-visual"][data-algorithm="dijkstra"]')).toBeVisible({ timeout: 180_000 });
    await collapseAlgorithmGuide(page);
    await setFrame(page, 15);
    const progress = await page.getByTestId('progress').innerText();
    const current = await page.getByTestId('current-step').innerText();

    await page.getByTestId('sidebar-collapse').click();
    await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');
    expect(await page.getByTestId('progress').innerText()).toBe(progress);
    expect(await page.getByTestId('current-step').innerText()).toBe(current);
    await expect(page.getByTestId('play-btn')).toBeVisible();
    await page.getByTestId('sidebar-expand').click();
    await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
    expect(await page.getByTestId('progress').innerText()).toBe(progress);
  });

  test('1024px stays horizontally clean and lets the page scroll to playback', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.locator('[data-testid="graph-visual"][data-algorithm="dijkstra"]')).toBeVisible({ timeout: 180_000 });
    await collapseAlgorithmGuide(page);
    const data = await page.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(data.width).toBe(1024);
    expect(data.scrollWidth).toBeLessThanOrEqual(1025);
    await page.locator('.stage-playback').scrollIntoViewIfNeeded();
    await expect(page.locator('.stage-playback')).toBeInViewport();
    await expect(page.getByTestId('play-btn')).toBeVisible();
  });

  test('390px mobile scrolls vertically, keeps advanced panels collapsed and never overflows horizontally', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.locator('[data-testid="graph-visual"][data-algorithm="dijkstra"]')).toBeVisible({ timeout: 180_000 });
    await collapseAlgorithmGuide(page);
    const data = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    expect(data.innerWidth).toBe(390);
    expect(data.scrollWidth).toBeLessThanOrEqual(391);
    expect(data.scrollHeight).toBeGreaterThan(data.clientHeight);
    await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'false');
    await page.getByTestId('workspace-tabs-toggle').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('workspace-tabs-toggle')).toBeVisible();
    await openAdvancedPanels(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
    await page.getByTestId('workspace-tab-tools').click();
    await expect(page.getByTestId('workspace-panel-tools')).toBeVisible();
    await page.getByTestId('workspace-tabs-toggle').click();
    await expect(page.getByTestId('workspace-panel-tools')).toBeHidden();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
  });
});
