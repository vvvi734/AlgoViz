import { mkdirSync } from 'node:fs';
import { expect, selectAlgorithm, test, type Page } from './fixtures';

const SCREENSHOT_DIR = 'test-results/layout-02';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.getByTestId('theme-select').selectOption(theme);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

async function openTournament(page: Page, width: number, theme: 'light' | 'dark') {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await setTheme(page, theme);
  await selectAlgorithm(page, 'tournament');
  await expect(page.getByTestId('tournament-visual')).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('[data-testid="progress"]').first()).toHaveText(/^1 \/ \d+$/, {
    timeout: 90_000,
  });
  await expect(page.getByTestId('tournament-visual')).toHaveAttribute('data-leaf-count', '8');
  await expect(page.getByTestId('tournament-node')).toHaveCount(15);
}

async function advanceToCompleteTree(page: Page) {
  const visual = page.getByTestId('tournament-visual');
  const progress = page.locator('[data-testid="progress"]').first();
  for (let step = 0; step < 12; step += 1) {
    if ((await visual.getAttribute('data-operation')) === 'select') return;
    const before = await progress.textContent();
    await page.getByTestId('next-btn').click();
    await expect.poll(async () => progress.textContent()).not.toBe(before);
  }
  throw new Error('tournament never reached the select frame');
}

type Geometry = {
  theme: string | null;
  viewBox: { x: number; y: number; width: number; height: number } | null;
  stage: RectProbe;
  visual: RectProbe;
  treePanel: RectProbe;
  tree: RectProbe;
  scroll: RectProbe;
  hintVisible: boolean;
  treeOverflows: string | null;
  nodes: Array<{ id: string; leaf: boolean; level: number; x: number; y: number; width: number }>;
  pageOverflow: boolean;
  viewportWidth: number;
};

type RectProbe = {
  x: number;
  y: number;
  width: number;
  height: number;
  clientWidth: number;
  scrollWidth: number;
  scrollLeft: number;
  overflowX: string;
};

async function geometryOf(page: Page): Promise<Geometry> {
  return await page.evaluate(() => {
    const probe = (element: Element | null): RectProbe => {
      if (!element) {
        return { x: 0, y: 0, width: 0, height: 0, clientWidth: 0, scrollWidth: 0, scrollLeft: 0, overflowX: '' };
      }
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        scrollLeft: element.scrollLeft,
        overflowX: getComputedStyle(element).overflowX,
      };
    };
    const svg = document.querySelector('.sort10-tree');
    const rawViewBox = svg?.getAttribute('viewBox')?.split(/\s+/).map(Number) ?? null;
    const viewBox = rawViewBox && rawViewBox.length === 4
      ? { x: rawViewBox[0], y: rawViewBox[1], width: rawViewBox[2], height: rawViewBox[3] }
      : null;
    const nodes = [...document.querySelectorAll('[data-testid="tournament-node"]')].map((element) => {
      const match = element.getAttribute('transform')?.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
      const rect = element.getBoundingClientRect();
      return {
        id: element.getAttribute('data-node-id') ?? '',
        leaf: element.getAttribute('data-leaf') === 'true',
        level: Number(element.getAttribute('data-level')),
        x: Number(match?.[1]),
        y: Number(match?.[2]),
        width: rect.width,
      };
    });
    const hint = document.querySelector('[data-testid="tournament-tree-scroll-hint"]');
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      viewBox,
      stage: probe(document.querySelector('[data-testid="visual-stage"]')),
      visual: probe(document.querySelector('[data-testid="tournament-visual"]')),
      treePanel: probe(document.querySelector('.sort10-tree-panel')),
      tree: probe(document.querySelector('.sort10-tree')),
      scroll: probe(document.querySelector('[data-testid="tournament-tree-scroll"]')),
      hintVisible: hint ? getComputedStyle(hint).display !== 'none' : false,
      treeOverflows: document.querySelector('[data-testid="tournament-visual"]')?.getAttribute('data-tree-overflows') ?? null,
      nodes,
      pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
}

function expectViewBoxAndRelations(geometry: Geometry) {
  expect(geometry.viewBox).not.toBeNull();
  expect(geometry.nodes).toHaveLength(15);
  expect(geometry.nodes.filter((node) => node.leaf)).toHaveLength(8);
  const vb = geometry.viewBox!;

  for (const node of geometry.nodes) {
    expect(node.x - 29).toBeGreaterThanOrEqual(vb.x - 0.01);
    expect(node.x + 29).toBeLessThanOrEqual(vb.x + vb.width + 0.01);
    expect(node.y - 19).toBeGreaterThanOrEqual(vb.y - 0.01);
    expect(node.y + 19).toBeLessThanOrEqual(vb.y + vb.height + 0.01);
  }

  const leaves = geometry.nodes.filter((node) => node.leaf).sort((a, b) => a.x - b.x);
  expect(leaves.map((node) => node.x)).toEqual([62.5, 187.5, 312.5, 437.5, 562.5, 687.5, 812.5, 937.5]);
  const root = geometry.nodes.find((node) => node.level === 3 && node.id.startsWith('N'));
  expect(root?.x).toBe(500);

  const byId = new Map(geometry.nodes.map((node) => [node.id, node]));
  for (const node of geometry.nodes.filter((candidate) => !candidate.leaf)) {
    const level = node.level;
    const slot = Number(node.id.split('-')[1]);
    const leftId = level === 1 ? `L${slot * 2}` : `N${level - 1}-${slot * 2}`;
    const rightId = level === 1 ? `L${slot * 2 + 1}` : `N${level - 1}-${slot * 2 + 1}`;
    expect(byId.has(leftId), `${node.id} left child ${leftId}`).toBe(true);
    expect(byId.has(rightId), `${node.id} right child ${rightId}`).toBe(true);
    expect(node.x).toBeCloseTo((byId.get(leftId)!.x + byId.get(rightId)!.x) / 2, 8);
    expect(node.y).toBeLessThan(byId.get(leftId)!.y);
  }

  expect(geometry.visual.x).toBeGreaterThanOrEqual(geometry.stage.x - 1);
  expect(geometry.visual.x + geometry.visual.width).toBeLessThanOrEqual(
    geometry.stage.x + geometry.stage.width + 1,
  );
  expect(geometry.stage.scrollWidth).toBeLessThanOrEqual(geometry.stage.clientWidth + 1);
  expect(geometry.pageOverflow).toBe(false);
}

test.describe('LAYOUT-02 — tournament tree geometry and responsive scrolling', () => {
  test('1600px keeps the full tree inside the SVG and needs no horizontal scroll', async ({ page }) => {
    test.setTimeout(300_000);
    await openTournament(page, 1600, 'dark');
    await expect(page.getByTestId('tournament-tree-scroll-hint')).toHaveCount(0);
    await expect(page.getByTestId('tournament-visual')).toHaveAttribute('data-tree-overflows', 'false');
    await expectViewBoxAndRelations(await geometryOf(page));

    await page.getByTestId('tournament-visual').screenshot({
      path: `${SCREENSHOT_DIR}/layout-02-1600-dark-first-frame.png`,
    });

    await advanceToCompleteTree(page);
    const geometry = await geometryOf(page);
    expectViewBoxAndRelations(geometry);
    expect(geometry.hintVisible).toBe(false);
    expect(geometry.scroll.scrollWidth).toBeLessThanOrEqual(geometry.scroll.clientWidth + 1);
    await page.getByTestId('tournament-visual').screenshot({
      path: `${SCREENSHOT_DIR}/layout-02-1600-dark-full-tree.png`,
    });

    await setTheme(page, 'light');
    expect((await geometryOf(page)).theme).toBe('light');
    await page.getByTestId('tournament-visual').screenshot({
      path: `${SCREENSHOT_DIR}/layout-02-1600-light-full-tree.png`,
    });
    await setTheme(page, 'dark');
  });

  test('1280px with the guide open stays inside the stage and exposes internal scrolling', async ({ page }) => {
    test.setTimeout(300_000);
    await openTournament(page, 1280, 'dark');
    await expect(page.locator('[data-testid="learn-view"]')).toHaveClass(/guide-open/);
    await expect(page.getByTestId('tournament-visual')).toHaveAttribute('data-tree-overflows', 'true');
    await expect(page.getByTestId('tournament-tree-scroll-hint')).toBeVisible();

    const openGeometry = await geometryOf(page);
    expectViewBoxAndRelations(openGeometry);
    expect(openGeometry.stage.overflowX).toBe('hidden');
    expect(openGeometry.scroll.scrollWidth).toBeGreaterThan(openGeometry.scroll.clientWidth);
    expect(openGeometry.treePanel.overflowX).toBe('visible');
    await page.getByTestId('tournament-visual').screenshot({
      path: `${SCREENSHOT_DIR}/layout-02-1280-guide-open-dark-left.png`,
    });

    const scroll = page.getByTestId('tournament-tree-scroll');
    await scroll.focus();
    const beforeKeyboardScroll = await scroll.evaluate((element) => element.scrollLeft);
    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => scroll.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(beforeKeyboardScroll);

    await scroll.evaluate((element) => {
      element.scrollLeft = element.scrollWidth - element.clientWidth;
    });
    const scrolledGeometry = await geometryOf(page);
    expect(scrolledGeometry.scroll.scrollLeft).toBeGreaterThan(0);
    const box = await scroll.boundingBox();
    const lastLeaf = await page.locator('[data-node-id="L7"]').boundingBox();
    expect(box).not.toBeNull();
    expect(lastLeaf).not.toBeNull();
    expect(lastLeaf!.x).toBeGreaterThanOrEqual(box!.x - 1);
    expect(lastLeaf!.x + lastLeaf!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
    await page.getByTestId('tournament-visual').screenshot({
      path: `${SCREENSHOT_DIR}/layout-02-1280-guide-open-dark-right.png`,
    });

    await page.getByTestId('guide-toggle').click();
    await expect(page.locator('[data-testid="learn-view"]')).not.toHaveClass(/guide-open/);
    const collapsedGeometry = await geometryOf(page);
    expectViewBoxAndRelations(collapsedGeometry);
    expect(collapsedGeometry.stage.scrollWidth).toBeLessThanOrEqual(collapsedGeometry.stage.clientWidth + 1);
    await page.getByTestId('tournament-visual').screenshot({
      path: `${SCREENSHOT_DIR}/layout-02-1280-guide-collapsed-dark.png`,
    });
  });

  test('390px mobile keeps the chart in a component scroll region and switches themes', async ({ page }) => {
    test.setTimeout(300_000);
    await openTournament(page, 390, 'dark');
    await expect(page.getByTestId('tournament-visual')).toHaveAttribute('data-tree-overflows', 'true');
    await expect(page.getByTestId('tournament-tree-scroll-hint')).toBeVisible();
    const geometry = await geometryOf(page);
    expectViewBoxAndRelations(geometry);
    expect(geometry.scroll.scrollWidth).toBeGreaterThan(geometry.scroll.clientWidth);
    await page.getByTestId('visual-stage').screenshot({
      path: `${SCREENSHOT_DIR}/layout-02-390-dark.png`,
    });

    await setTheme(page, 'light');
    expect((await geometryOf(page)).theme).toBe('light');
    await page.getByTestId('visual-stage').screenshot({
      path: `${SCREENSHOT_DIR}/layout-02-390-light.png`,
    });
    await setTheme(page, 'dark');
  });

  test('768px tablet uses the same internal scroll and returns to light without layout regressions', async ({ page }) => {
    test.setTimeout(300_000);
    await openTournament(page, 768, 'light');
    await expect(page.getByTestId('tournament-visual')).toHaveAttribute('data-tree-overflows', 'true');
    await expect(page.getByTestId('tournament-tree-scroll-hint')).toBeVisible();
    const geometry = await geometryOf(page);
    expectViewBoxAndRelations(geometry);
    await page.getByTestId('visual-stage').screenshot({
      path: `${SCREENSHOT_DIR}/layout-02-768-light.png`,
    });
    await setTheme(page, 'dark');
    expect((await geometryOf(page)).theme).toBe('dark');
    await page.getByTestId('visual-stage').screenshot({
      path: `${SCREENSHOT_DIR}/layout-02-768-dark.png`,
    });
  });

  test('fullscreen keeps the tournament tree available at 100%, 200% and 50%', async ({ page }) => {
    test.setTimeout(300_000);
    await openTournament(page, 1280, 'dark');
    await advanceToCompleteTree(page);
    const frameBeforeFullscreen = await page.getByTestId('progress').first().textContent();
    await page.getByTestId('fullscreen-open-btn').click();
    const workspace = page.getByTestId('fullscreen-workspace');
    await expect(workspace).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(workspace.getByTestId('tournament-node')).toHaveCount(15);
    await expect(workspace.getByTestId('progress')).toHaveText(frameBeforeFullscreen ?? '');
    await workspace.screenshot({ path: `${SCREENSHOT_DIR}/layout-02-fullscreen-100.png` });

    for (let index = 0; index < 4; index += 1) await page.getByTestId('fullscreen-zoom-in').click();
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('200%');
    await expect(workspace.locator('.tournament-visual')).toBeVisible();
    await workspace.screenshot({ path: `${SCREENSHOT_DIR}/layout-02-fullscreen-200.png` });

    await page.getByTestId('fullscreen-zoom-value').click();
    await page.getByTestId('fullscreen-zoom-out').click();
    await page.getByTestId('fullscreen-zoom-out').click();
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('50%');
    await workspace.screenshot({ path: `${SCREENSHOT_DIR}/layout-02-fullscreen-50.png` });

    await page.getByTestId('fullscreen-fit').click();
    await page.getByTestId('fullscreen-exit').click();
    await expect(workspace).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByTestId('tournament-visual')).toBeVisible();
  });
});
