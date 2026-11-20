import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { collapseAlgorithmGuide, expect, selectAlgorithm, test, type Page } from './fixtures';

/**
 * UX-04C — graph canvas sizing.
 *
 * These checks measure the graph that is actually painted, not just the SVG
 * element: node diameter in screen pixels, the displayed node bounding box, the
 * compact viewBox, edge-weight containment, the stage/queue/playback geometry,
 * and layout stability across frame navigation. SVG width alone would have
 * passed the broken build, so it is never used as the acceptance signal.
 */

const AFTER = resolve(process.cwd(), 'docs/ux04c/after');
mkdirSync(AFTER, { recursive: true });

type Box = { x: number; y: number; width: number; height: number; bottom: number; right: number };

async function openApp(page: Page) {
  await page.goto('/');
  await page.getByTestId('code-dock').waitFor({ state: 'visible', timeout: 45_000 });
}

async function setFrame(page: Page, frame: number, total: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`, { timeout: 15_000 });
  await page.waitForTimeout(120);
}

async function openGraph(page: Page, id: string, total: number, frame: number) {
  await selectAlgorithm(page, id);
  await expect(page.getByTestId('graph-visual')).toBeVisible({ timeout: 180_000 });
  await expect(page.getByTestId('progress')).toHaveText(`1 / ${total}`, { timeout: 180_000 });
  await setFrame(page, frame, total);
  await collapseAlgorithmGuide(page);
  await page.waitForTimeout(120);
}

async function geometry(page: Page) {
  const data = await page.evaluate(() => {
    const box = (element: Element | null) => {
      const rect = element?.getBoundingClientRect();
      return rect
        ? {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            right: rect.right,
          }
        : null;
    };
    const svg = document.querySelector('[data-testid="graph-svg"]') as SVGSVGElement | null;
    const nodesGroup = svg?.querySelector('.graph-nodes') as SVGGElement | null;
    const nodeA = svg?.querySelector('[data-node-id="A"]') as SVGGElement | null;
    const body = nodeA?.querySelector('.graph-node-body') as SVGCircleElement | null;
    const label = nodeA?.querySelector('.graph-node-label') as SVGTextElement | null;
    const vb = svg?.viewBox.baseVal;
    const svgBox = svg?.getBoundingClientRect();
    const content = nodesGroup?.getBBox();
    const scale =
      svgBox && vb && vb.width > 0 && vb.height > 0
        ? Math.min(svgBox.width / vb.width, svgBox.height / vb.height)
        : null;
    return {
      svg: box(svg),
      canvas: box(document.querySelector('[data-testid="graph-canvas-scroll"]')),
      visual: box(document.querySelector('[data-testid="graph-visual"]')),
      stage: box(document.querySelector('.stage.has-structure')),
      queue: box(document.querySelector('[data-testid="graph-frontier-panel"]')),
      playback: box(document.querySelector('.stage-playback')),
      nodeA: box(nodeA),
      nodeBody: box(body),
      nodeDiameter: body && scale ? 2 * body.r.baseVal.value * scale : null,
      labelFontSize: label ? Number.parseFloat(getComputedStyle(label).fontSize) : null,
      viewBox: svg?.getAttribute('viewBox') ?? null,
      viewBoxWidth: vb?.width ?? null,
      viewBoxHeight: vb?.height ?? null,
      preserveAspectRatio: svg?.getAttribute('preserveAspectRatio') ?? 'default',
      scale,
      contentWidth: content && scale ? content.width * scale : null,
      contentHeight: content && scale ? content.height * scale : null,
      nodes: Array.from(svg?.querySelectorAll('[data-testid="graph-node"]') ?? []).map((node) => ({
        id: node.getAttribute('data-node-id') ?? '',
        transform: node.getAttribute('transform') ?? '',
        box: box(node),
      })),
      edgeWeights: Array.from(svg?.querySelectorAll('[data-testid="graph-edge-weight"]') ?? []).map((weight) => ({
        id: weight.getAttribute('data-edge-id') ?? '',
        box: box(weight),
      })),
      page: {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      },
    };
  });
  console.log(`[UX04C] ${JSON.stringify(data)}`);
  return data;
}

function expectInside(inner: Box, outer: Box, label: string, pad = 1) {
  expect(inner.x, `${label} left edge`).toBeGreaterThanOrEqual(outer.x - pad);
  expect(inner.y, `${label} top edge`).toBeGreaterThanOrEqual(outer.y - pad);
  expect(inner.right, `${label} right edge`).toBeLessThanOrEqual(outer.right + pad);
  expect(inner.bottom, `${label} bottom edge`).toBeLessThanOrEqual(outer.bottom + pad);
}

function expectNoPageOverflow(data: Awaited<ReturnType<typeof geometry>>, width: number) {
  expect(data.page.scrollWidth, 'page horizontal overflow').toBeLessThanOrEqual(width + 1);
}

async function capture(page: Page, name: string) {
  await page.screenshot({ path: resolve(AFTER, `${name}-full.png`), fullPage: true });
  await page.locator('.stage-panel').screenshot({ path: resolve(AFTER, `${name}-stage.png`) });
}

test('BFS: 1440×900 fills the canvas, keeps the FIFO queue and playback on screen, and never moves between frames', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page);
  await openGraph(page, 'bfs', 51, 9);

  const data = await geometry(page);
  expect(data.canvas, 'graph canvas exists').not.toBeNull();
  expect(data.stage, 'stage exists').not.toBeNull();
  expect(data.nodeDiameter, 'node body diameter').toBeGreaterThanOrEqual(40);
  expect(data.contentWidth, 'real node distribution width').toBeGreaterThanOrEqual(440);
  expect(data.contentHeight, 'real node distribution height').toBeGreaterThanOrEqual(240);
  expect(data.canvas!.height).toBeGreaterThanOrEqual(300);
  expect(data.svg!.height).toBeGreaterThanOrEqual(295);
  expect(data.viewBoxWidth!).toBeLessThan(560);
  expect(data.viewBoxHeight!).toBeLessThan(340);
  expect(data.viewBoxWidth! / data.viewBoxHeight!).toBeGreaterThan(1.5);
  expect(data.labelFontSize).toBeGreaterThanOrEqual(18);
  expect(data.nodes).toHaveLength(7);
  for (const node of data.nodes) expectInside(node.box!, data.canvas!, `node ${node.id}`);
  for (const weight of data.edgeWeights) expectInside(weight.box!, data.canvas!, `weight ${weight.id}`);
  expect(data.queue!.bottom).toBeLessThanOrEqual(data.stage!.bottom + 1);
  expect(data.playback!.height, 'playback stays whole').toBeGreaterThan(0);
  expectNoPageOverflow(data, 1440);

  await capture(page, 'bfs-1440x900-frame10');
  await page.locator('[data-testid="graph-visual"]').screenshot({
    path: resolve(AFTER, 'bfs-1440x900-frame10-graph.png'),
  });

  const before = await geometry(page);
  const layoutOf = (snapshot: Awaited<ReturnType<typeof geometry>>) => ({
    viewBox: snapshot.viewBox,
    nodes: snapshot.nodes.map((node) => [node.id, node.transform]),
  });
  const beforeLayout = layoutOf(before);

  await page.getByTestId('next-btn').click();
  await expect(page.getByTestId('step-number')).toContainText('11');
  const afterNext = await geometry(page);
  expect(layoutOf(afterNext)).toEqual(beforeLayout);
  const aBodyAfterNext = afterNext.nodeBody!;
  expect(
    Math.abs(aBodyAfterNext.x + aBodyAfterNext.width / 2 - (before.nodeBody!.x + before.nodeBody!.width / 2)),
  ).toBeLessThan(0.5);
  expect(
    Math.abs(aBodyAfterNext.y + aBodyAfterNext.height / 2 - (before.nodeBody!.y + before.nodeBody!.height / 2)),
  ).toBeLessThan(0.5);

  await page.getByTestId('prev-btn').click();
  await expect(page.getByTestId('step-number')).toContainText('10');
  expect(layoutOf(await geometry(page))).toEqual(beforeLayout);

  await setFrame(page, 20, 51);
  const afterJump = await geometry(page);
  expect(layoutOf(afterJump)).toEqual(beforeLayout);
  expect(afterJump.queue!.bottom, 'queue with a leaving chip still fits the stage').toBeLessThanOrEqual(
    afterJump.stage!.bottom + 1,
  );
  expect(await page.getByTestId('progress').innerText()).toBe('21 / 51');
});

test('BFS: 1366×768 keeps the compact queue fully visible and adapts when the directory is collapsed', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page);
  await openGraph(page, 'bfs', 51, 9);

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(180);
  const data = await geometry(page);
  expect(data.nodeDiameter, '1366 node body diameter').toBeGreaterThanOrEqual(30);
  expect(data.contentWidth, '1366 real node distribution width').toBeGreaterThanOrEqual(330);
  expect(data.canvas!.height).toBeGreaterThanOrEqual(215);
  expect(data.canvas!.height).toBeLessThanOrEqual(245);
  expect(data.svg!.height).toBeGreaterThanOrEqual(205);
  expect(data.queue!.bottom, 'queue is not clipped by the stage viewport').toBeLessThanOrEqual(data.stage!.bottom + 1);
  expect(data.queue!.height, 'queue keeps its chips readable').toBeGreaterThanOrEqual(40);
  expect(data.playback!.height, 'playback stays whole').toBeGreaterThan(0);
  expectNoPageOverflow(data, 1366);
  for (const node of data.nodes) expectInside(node.box!, data.canvas!, `node ${node.id}`);
  for (const weight of data.edgeWeights) expectInside(weight.box!, data.canvas!, `weight ${weight.id}`);

  await capture(page, 'bfs-1366x768-frame10');

  const progress = await page.getByTestId('progress').innerText();
  const canvasBefore = data.canvas!.width;
  await page.getByTestId('sidebar-collapse').click();
  await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');
  await page.waitForTimeout(180);
  const collapsed = await geometry(page);
  expect(collapsed.canvas!.width).toBeGreaterThan(canvasBefore + 80);
  expect(collapsed.viewBox).toBe(data.viewBox);
  expect(Math.abs(collapsed.nodeDiameter! - data.nodeDiameter!)).toBeLessThan(1);
  for (const node of collapsed.nodes) expectInside(node.box!, collapsed.canvas!, `collapsed node ${node.id}`);
  expectNoPageOverflow(collapsed, 1366);
  expect(await page.getByTestId('progress').innerText()).toBe(progress);
  await expect(page.getByTestId('play-btn')).toBeVisible();

  await page.getByTestId('sidebar-expand').click();
  await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
  expect(await page.getByTestId('progress').innerText()).toBe(progress);
});

test('Dijkstra: weighted graph, weights, distance table and priority queue stay readable at 1440 and 1366', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page);
  await openGraph(page, 'dijkstra', 46, 27);

  const desktop = await geometry(page);
  expect(desktop.nodeDiameter, 'Dijkstra 1440 node diameter').toBeGreaterThanOrEqual(33);
  expect(desktop.contentWidth, 'Dijkstra 1440 node distribution width').toBeGreaterThanOrEqual(380);
  expect(desktop.nodes).toHaveLength(7);
  expect(desktop.edgeWeights.length).toBeGreaterThanOrEqual(6);
  for (const node of desktop.nodes) expectInside(node.box!, desktop.canvas!, `Dijkstra node ${node.id}`);
  for (const weight of desktop.edgeWeights) expectInside(weight.box!, desktop.canvas!, `Dijkstra weight ${weight.id}`);
  await expect(page.getByTestId('dijkstra-distance-row')).toHaveCount(7);
  await expect(page.getByTestId('graph-priority-queue-panel')).toBeVisible();
  const table = await page.locator('.dijkstra-table-scroll').evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }));
  expect(table.scrollHeight, '1440 distance table shows every row').toBeLessThanOrEqual(table.clientHeight + 1);
  expect(desktop.playback!.height, 'Dijkstra playback stays whole').toBeGreaterThan(0);
  expectNoPageOverflow(desktop, 1440);
  await capture(page, 'dijkstra-1440x900-frame28');

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(180);
  const compact = await geometry(page);
  expect(compact.nodeDiameter, 'Dijkstra 1366 node diameter').toBeGreaterThanOrEqual(28);
  expect(compact.contentWidth, 'Dijkstra 1366 node distribution width').toBeGreaterThanOrEqual(340);
  expect(compact.svg!.height).toBeGreaterThanOrEqual(220);
  for (const node of compact.nodes) expectInside(node.box!, compact.canvas!, `Dijkstra compact node ${node.id}`);
  for (const weight of compact.edgeWeights) expectInside(weight.box!, compact.canvas!, `Dijkstra compact weight ${weight.id}`);
  await expect(page.getByTestId('dijkstra-distance-row')).toHaveCount(7);
  await expect(page.getByTestId('graph-priority-queue-panel')).toBeVisible();
  expect(compact.playback!.height, 'Dijkstra compact playback stays whole').toBeGreaterThan(0);
  expectNoPageOverflow(compact, 1366);

  const scroll = await page.locator('.dijkstra-table-scroll').evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }));
  expect(scroll.scrollHeight, '1366 distance table expands with the page instead of trapping rows').toBeLessThanOrEqual(
    scroll.clientHeight + 1,
  );
  await page.locator('.dijkstra-table-scroll').evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await page.waitForTimeout(80);
  const lastRow = await page.getByTestId('dijkstra-distance-row').last().boundingBox();
  const tableViewport = await page.locator('.dijkstra-table-scroll').boundingBox();
  expect(lastRow).not.toBeNull();
  expect(tableViewport).not.toBeNull();
  expect(lastRow!.y, 'last distance row is reachable').toBeGreaterThanOrEqual(tableViewport!.y - 1);
  expect(lastRow!.y + lastRow!.height).toBeLessThanOrEqual(tableViewport!.y + tableViewport!.height + 1);

  await capture(page, 'dijkstra-1366x768-frame28');
});

test('Kosaraju regression at 1440 and 390, plus DFS / Kahn / Prim / Kruskal smoke checks', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page);
  await selectAlgorithm(page, 'scc');
  await expect(page.getByTestId('scc-stage')).toBeVisible({ timeout: 180_000 });
  await expect(page.getByTestId('progress')).toHaveText('1 / 60', { timeout: 180_000 });
  await setFrame(page, 26, 60);
  await collapseAlgorithmGuide(page);
  await page.waitForTimeout(120);
  await capture(page, 'scc-1440x900-frame27');
  const desktop = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    playbackBottom: document.querySelector('.stage-playback')?.getBoundingClientRect().bottom ?? 0,
  }));
  expect(desktop.scrollWidth).toBeLessThanOrEqual(1441);
  expect(desktop.playbackBottom).toBeLessThanOrEqual(901);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const mobile = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(mobile.innerWidth).toBe(390);
  expect(mobile.scrollWidth).toBeLessThanOrEqual(391);
  await page.screenshot({ path: resolve(AFTER, 'scc-390x844-frame27-full.png'), fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(120);

  await selectAlgorithm(page, 'dfs');
  await expect(page.getByTestId('graph-visual')).toHaveAttribute('data-algorithm', 'dfs', { timeout: 180_000 });
  await expect(page.getByTestId('progress')).toHaveText('1 / 51', { timeout: 180_000 });
  await setFrame(page, 9, 51);
  await collapseAlgorithmGuide(page);
  const dfs = await geometry(page);
  expect(dfs.nodeDiameter, 'DFS node diameter').toBeGreaterThanOrEqual(40);
  expect(dfs.nodes).toHaveLength(7);
  await expect(page.getByTestId('stack-visual')).toBeVisible();
  for (const node of dfs.nodes) expectInside(node.box!, dfs.canvas!, `DFS node ${node.id}`);

  await selectAlgorithm(page, 'topological');
  await expect(page.getByTestId('topo-stage')).toBeVisible({ timeout: 180_000 });
  await expect(page.getByTestId('topo-node').first()).toBeVisible();
  await collapseAlgorithmGuide(page);
  expect((await page.evaluate(() => document.documentElement.scrollWidth))).toBeLessThanOrEqual(1441);

  await selectAlgorithm(page, 'prim');
  await expect(page.getByTestId('prim-stage')).toBeVisible({ timeout: 180_000 });
  await expect(page.getByTestId('mst-node')).toHaveCount(5);
  await expect(page.getByTestId('mst-edge')).toHaveCount(6);
  await collapseAlgorithmGuide(page);
  expect((await page.evaluate(() => document.documentElement.scrollWidth))).toBeLessThanOrEqual(1441);

  await selectAlgorithm(page, 'kruskal');
  await expect(page.getByTestId('kruskal-stage')).toBeVisible({ timeout: 180_000 });
  await expect(page.getByTestId('mst-node')).toHaveCount(5);
  await expect(page.getByTestId('mst-edge')).toHaveCount(6);
  await collapseAlgorithmGuide(page);
  expect((await page.evaluate(() => document.documentElement.scrollWidth))).toBeLessThanOrEqual(1441);
});
