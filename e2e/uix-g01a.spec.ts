import { collapseAlgorithmGuide, expect, selectAlgorithm, test, type Page } from './fixtures';

/**
 * UIX-G01A — Prim / Kruskal canvas readability.
 *
 * The acceptance signal is the painted geometry, not the viewBox alone:
 * node diameter, rendered weight/label text height, containment in the graph
 * scroll port, label collisions, page overflow, table legibility, and the
 * shared playback / lesson-step state at representative frames.
 */

type Box = { x: number; y: number; width: number; height: number; bottom: number; right: number };
type Algorithm = 'prim' | 'kruskal';

const VIEWPORTS = [
  { width: 1440, height: 900, node: 45, weight: 11.5, label: 13 },
  { width: 1366, height: 768, node: 41, weight: 9.5, label: 11 },
  { width: 390, height: 844, node: 30, weight: 7.5, label: 8.5 },
] as const;

async function openApp(page: Page) {
  await page.goto('/?view=lab');
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
  await page.waitForTimeout(80);
}

async function measure(page: Page, algorithm: Algorithm) {
  return page.evaluate((algo) => {
    const box = (el: Element | null): Box | null => {
      const r = el?.getBoundingClientRect();
      return r ? { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right } : null;
    };
    const inside = (inner: Box | null, outer: Box | null) => {
      if (!inner || !outer) return false;
      return inner.x >= outer.x - 1 && inner.y >= outer.y - 1 && inner.right <= outer.right + 1 && inner.bottom <= outer.bottom + 1;
    };
    const overlaps = (a: Box | null, b: Box | null) =>
      Boolean(a && b && Math.min(a.right, b.right) > Math.max(a.x, b.x) && Math.min(a.bottom, b.bottom) > Math.max(a.y, b.y));

    const stage = document.querySelector(`[data-testid="${algo}-stage"]`) as HTMLElement | null;
    const svg = document.querySelector(
      algo === 'prim' ? '[data-testid="prim-graph-svg"]' : '[data-testid="kruskal-graph-svg"]',
    ) as SVGSVGElement | null;
    const scroller = stage?.querySelector('.mst-graph-scroll') as HTMLElement | null;
    const card = stage?.querySelector('.mst-graph-card') as HTMLElement | null;
    const side = stage?.querySelector('.mst-side') as HTMLElement | null;
    const vb = svg?.viewBox.baseVal;
    const svgBox = svg?.getBoundingClientRect();
    const scale =
      svgBox && vb && vb.width > 0 && vb.height > 0
        ? Math.min(svgBox.width / vb.width, svgBox.height / vb.height)
        : null;

    const nodes = Array.from(svg?.querySelectorAll('[data-testid="mst-node"]') ?? []) as SVGGElement[];
    const nodeData = nodes.map((node) => {
      const body = node.querySelector('.mst-node-body') as SVGCircleElement | null;
      const label = node.querySelector('.mst-node-label') as SVGTextElement | null;
      return {
        id: node.getAttribute('data-node-id') ?? '',
        box: box(node),
        bodyBox: box(body),
        diameter: body && scale ? 2 * body.r.baseVal.value * scale : null,
        labelHeight: label ? label.getBoundingClientRect().height : null,
      };
    });

    const weights = Array.from(svg?.querySelectorAll('.mst-edge-weight') ?? []).map((group) => {
      const edge = group.closest('[data-testid="mst-edge"]');
      const text = group.querySelector('text') as SVGTextElement | null;
      return {
        edgeId: edge?.getAttribute('data-edge-id') ?? '',
        groupBox: box(group),
        textHeight: text ? text.getBoundingClientRect().height : null,
        inside: inside(box(group), box(scroller)),
      };
    });

    const weightOverlaps: string[] = [];
    for (let i = 0; i < weights.length; i += 1) {
      for (let j = i + 1; j < weights.length; j += 1) {
        if (overlaps(weights[i].groupBox, weights[j].groupBox)) {
          weightOverlaps.push(`${weights[i].edgeId}/${weights[j].edgeId}`);
        }
      }
    }
    const nodeWeightOverlaps: string[] = [];
    for (const node of nodeData) {
      for (const weight of weights) {
        if (overlaps(node.bodyBox, weight.groupBox)) nodeWeightOverlaps.push(`${node.id}/${weight.edgeId}`);
      }
    }

    const pqEntry = stage?.querySelector('[data-testid="prim-pq-entry"]') as HTMLElement | null;
    const sortedEntry = stage?.querySelector('[data-testid="kruskal-sorted-edge"]') as HTMLElement | null;
    const sortedState = sortedEntry?.querySelector('.mst-sorted-state') as HTMLElement | null;
    const parentCell = stage?.querySelector('[data-testid="kruskal-parent-row"] td') as HTMLElement | null;
    const tableWrap = stage?.querySelector('.mst-parent-table-wrap') as HTMLElement | null;

    return {
      operation: stage?.getAttribute('data-operation') ?? '',
      stage: box(stage),
      graphCard: box(card),
      graphScroll: box(scroller),
      graphScrollSize: scroller
        ? {
            clientWidth: scroller.clientWidth,
            scrollWidth: scroller.scrollWidth,
            clientHeight: scroller.clientHeight,
            scrollHeight: scroller.scrollHeight,
          }
        : null,
      graphSvg: box(svg),
      viewBox: svg?.getAttribute('viewBox') ?? null,
      viewBoxWidth: vb?.width ?? null,
      viewBoxHeight: vb?.height ?? null,
      scale,
      nodes: nodeData,
      nodeDiameterMin: Math.min(...nodeData.map((node) => node.diameter ?? Infinity)),
      nodeLabelMin: Math.min(...nodeData.map((node) => node.labelHeight ?? Infinity)),
      weights,
      weightMinHeight: Math.min(...weights.map((weight) => weight.textHeight ?? Infinity)),
      weightOverlaps,
      nodeWeightOverlaps,
      nodesOutside: nodeData.filter((node) => !inside(node.box, box(scroller))).map((node) => node.id),
      weightsOutside: weights.filter((weight) => !weight.inside).map((weight) => weight.edgeId),
      side: box(side),
      sideScroll: side ? { clientHeight: side.clientHeight, scrollHeight: side.scrollHeight } : null,
      sorted: {
        count: stage?.querySelectorAll('[data-testid="kruskal-sorted-edge"]').length ?? 0,
        font: sortedEntry ? Number.parseFloat(getComputedStyle(sortedEntry).fontSize) : null,
        rowHeight: sortedEntry?.getBoundingClientRect().height ?? null,
        stateFont: sortedState ? Number.parseFloat(getComputedStyle(sortedState).fontSize) : null,
      },
      parent: {
        count: stage?.querySelectorAll('[data-testid="kruskal-parent-row"]').length ?? 0,
        font: parentCell ? Number.parseFloat(getComputedStyle(parentCell).fontSize) : null,
        rowHeight: parentCell?.closest('tr')?.getBoundingClientRect().height ?? null,
        wrapHeight: tableWrap?.clientHeight ?? null,
      },
      pq: {
        count: stage?.querySelectorAll('[data-testid="prim-pq-entry"]').length ?? 0,
        font: pqEntry ? Number.parseFloat(getComputedStyle(pqEntry).fontSize) : null,
        rowHeight: pqEntry?.getBoundingClientRect().height ?? null,
      },
      page: {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      },
    };
  }, algorithm);
}

type Metrics = Awaited<ReturnType<typeof measure>>;

function expectReadable(data: Metrics, viewport: (typeof VIEWPORTS)[number], algorithm: Algorithm) {
  const label = `${algorithm} ${viewport.width}`;
  expect(data.nodes, `${label}: five real nodes`).toHaveLength(5);
  expect(data.weights, `${label}: six real weighted edges`).toHaveLength(6);
  expect(data.nodeDiameterMin, `${label}: node diameter`).toBeGreaterThanOrEqual(viewport.node);
  expect(data.weightMinHeight, `${label}: rendered weight height`).toBeGreaterThanOrEqual(viewport.weight);
  expect(data.nodeLabelMin, `${label}: rendered node label height`).toBeGreaterThanOrEqual(viewport.label);
  expect(data.nodesOutside, `${label}: nodes outside scroll port`).toEqual([]);
  expect(data.weightsOutside, `${label}: weights outside scroll port`).toEqual([]);
  expect(data.weightOverlaps, `${label}: weight labels overlap`).toEqual([]);
  expect(data.nodeWeightOverlaps, `${label}: weight labels overlap nodes`).toEqual([]);
  expect(data.page.scrollWidth, `${label}: page horizontal overflow`).toBeLessThanOrEqual(viewport.width + 1);
  expect(data.viewBoxWidth, `${label}: fitted viewBox width`).toBeLessThan(580);
  expect(data.viewBoxHeight, `${label}: fitted viewBox height`).toBeLessThan(380);
  expect(data.graphCard!.width, `${label}: graph card has a real canvas`).toBeGreaterThan(280);
  if (algorithm === 'prim') {
    if (data.pq.count > 0) {
      expect(data.pq.font, `${label}: priority queue font`).toBeGreaterThanOrEqual(12);
      expect(data.pq.rowHeight, `${label}: priority queue row`).toBeGreaterThanOrEqual(27);
    }
  } else {
    expect(data.sorted.count, `${label}: full sorted edge table`).toBe(6);
    expect(data.sorted.font, `${label}: sorted table font`).toBeGreaterThanOrEqual(12);
    expect(data.sorted.rowHeight, `${label}: sorted table row`).toBeGreaterThanOrEqual(27);
    expect(data.parent.count, `${label}: all union-find rows`).toBe(5);
    expect(data.parent.font, `${label}: union-find font`).toBeGreaterThanOrEqual(12);
    expect(data.parent.rowHeight, `${label}: union-find row`).toBeGreaterThanOrEqual(18);
  }
  expect(data.sideScroll).not.toBeNull();
  expect(data.stage).not.toBeNull();
}

async function expectSharedChrome(page: Page, algorithm: Algorithm) {
  if (algorithm === 'kruskal') {
    await expect(page.getByTestId('visual-guide')).toHaveCount(1);
    await expect(page.getByTestId('visual-guide')).toBeVisible();
    await page.getByTestId('visual-guide').locator('summary').click();
    await expect(page.getByTestId('visual-guide-note')).toBeVisible();
  } else {
    // UIX-V02 deliberately renders no empty guide for Prim; the legend is its
    // compact symbol key and the canvas carries no long hint paragraph.
    await expect(page.getByTestId('visual-guide')).toHaveCount(0);
  }
  await expect(page.locator('.mst-graph-card .mst-hint')).toHaveCount(0);
  await expect(page.locator('.mst-graph-card .mst-graph-title')).toHaveCount(0);
  await expect(page.locator('.mst-graph-card .mst-legend')).toHaveCount(1);
}

test.describe('UIX-G01A — MST readability', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.width}×${viewport.height}: nodes, weights, tables and shared playback stay readable`, async ({ page }) => {
      test.setTimeout(360_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openApp(page);

      await selectAlgorithm(page, 'prim');
      await expect(page.getByTestId('prim-stage')).toBeVisible({ timeout: 180_000 });
      await expect(page.getByTestId('progress')).toHaveText('1 / 21', { timeout: 180_000 });
      await collapseAlgorithmGuide(page);

      await setFrame(page, 5, 21);
      const primSelect = await measure(page, 'prim');
      expectReadable(primSelect, viewport, 'prim');
      await expect(page.getByTestId('prim-stage')).toHaveAttribute('data-operation', 'select-edge');
      await expect(page.getByTestId('prim-current-edge')).toContainText('A–B');
      await expect(page.getByTestId('prim-total-weight')).toContainText('2');
      await expect(page.locator('[data-testid="mst-edge"][data-state="selected"]')).not.toHaveCount(0);
      await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'select');
      await expect(page.getByTestId('lesson-step-select')).toHaveAttribute('data-active', 'true');
      await expectSharedChrome(page, 'prim');

      const beforePlay = await page.getByTestId('progress').innerText();
      await page.getByTestId('play-btn').click();
      await expect(page.getByTestId('play-btn')).toContainText('暂停');
      await expect(page.getByTestId('progress')).not.toHaveText(beforePlay, { timeout: 10_000 });
      await page.getByTestId('play-btn').click();
      await expect(page.getByTestId('play-btn')).toContainText('播放');
      const pausedAt = await page.getByTestId('progress').innerText();
      await page.waitForTimeout(200);
      await expect(page.getByTestId('progress')).toHaveText(pausedAt);

      await setFrame(page, 20, 21);
      await expect(page.getByTestId('prim-stage')).toHaveAttribute('data-operation', 'done');
      await expect(page.getByTestId('prim-total-weight')).toContainText('6');
      await expect(page.locator('[data-testid="mst-edge"][data-state="selected"]')).toHaveCount(4);
      await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
      expectReadable(await measure(page, 'prim'), viewport, 'prim');

      await page.getByTestId('prev-btn').click();
      await expect(page.getByTestId('progress')).toHaveText('20 / 21');
      await expect(page.getByTestId('prim-stage')).toHaveAttribute('data-operation', 'skip');
      await page.getByTestId('next-btn').click();
      await expect(page.getByTestId('progress')).toHaveText('21 / 21');
      await expect(page.getByTestId('prim-stage')).toHaveAttribute('data-operation', 'done');

      await setFrame(page, 8, 21);
      await expect(page.getByTestId('prim-current-edge')).toContainText('A–C');
      await expect(page.getByTestId('prim-total-weight')).toContainText('4');
      await expect(page.locator('[data-testid="mst-node"][data-node-id="C"][data-in-tree="true"]')).toHaveCount(1);

      await selectAlgorithm(page, 'kruskal');
      await expect(page.getByTestId('kruskal-stage')).toBeVisible({ timeout: 180_000 });
      await expect(page.getByTestId('progress')).toHaveText('1 / 15', { timeout: 180_000 });
      await collapseAlgorithmGuide(page);

      await setFrame(page, 7, 15);
      const kruskalUnion = await measure(page, 'kruskal');
      expectReadable(kruskalUnion, viewport, 'kruskal');
      await expect(page.getByTestId('kruskal-stage')).toHaveAttribute('data-operation', 'union');
      await expect(page.getByTestId('kruskal-current-edge')).toContainText('B–C');
      await expect(page.getByTestId('kruskal-total-weight')).toContainText('4');
      await expect(page.getByTestId('kruskal-sorted-edge')).toHaveCount(6);
      await expect(page.getByTestId('kruskal-parent-row')).toHaveCount(5);
      await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'union');
      await expect(page.getByTestId('lesson-step-union')).toHaveAttribute('data-active', 'true');
      await expectSharedChrome(page, 'kruskal');

      await setFrame(page, 11, 15);
      await expect(page.getByTestId('kruskal-stage')).toHaveAttribute('data-operation', 'reject-edge');
      await expect(page.getByTestId('kruskal-current-edge')).toContainText('A–C');
      await expect(page.getByTestId('kruskal-cycle-badge')).toHaveAttribute('data-cycle', 'true');
      await expect(page.getByTestId('kruskal-total-weight')).toContainText('6');
      await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'reject-edge');
      await expect(page.getByTestId('lesson-step-reject-edge')).toHaveAttribute('data-active', 'true');
      expectReadable(await measure(page, 'kruskal'), viewport, 'kruskal');

      await setFrame(page, 14, 15);
      await expect(page.getByTestId('kruskal-stage')).toHaveAttribute('data-operation', 'done');
      await expect(page.getByTestId('kruskal-total-weight')).toContainText('6');
      await expect(page.locator('[data-testid="mst-edge"][data-state="selected"]')).toHaveCount(4);
      await expect(page.locator('[data-testid="mst-edge"][data-state="rejected"]')).toHaveCount(2);
      await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
      expectReadable(await measure(page, 'kruskal'), viewport, 'kruskal');

      await page.getByTestId('prev-btn').click();
      await expect(page.getByTestId('progress')).toHaveText('14 / 15');
      await expect(page.getByTestId('kruskal-stage')).toHaveAttribute('data-operation', 'reject-edge');
      await page.getByTestId('next-btn').click();
      await expect(page.getByTestId('progress')).toHaveText('15 / 15');
      await expect(page.getByTestId('kruskal-stage')).toHaveAttribute('data-operation', 'done');
    });
  }
});
