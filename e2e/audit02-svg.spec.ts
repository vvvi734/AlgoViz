import { expect, test, type Page } from './fixtures';
import type { Locator } from '@playwright/test';

type BBox = { x: number; y: number; width: number; height: number };
type Viewport = { width: number; height: number };

const VIEWPORTS: Viewport[] = [
  { width: 1280, height: 900 },
  { width: 1680, height: 1000 },
  { width: 390, height: 844 },
];

function overlaps(a: BBox, b: BBox, tolerance = 1): boolean {
  return (
    a.x + a.width > b.x + tolerance &&
    b.x + b.width > a.x + tolerance &&
    a.y + a.height > b.y + tolerance &&
    b.y + b.height > a.y + tolerance
  );
}

function containsBox(outer: BBox, inner: BBox, tolerance = 2): boolean {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  );
}

async function primeLanguage(page: Page, lang: 'zh' | 'en') {
  await page.addInitScript((value) => {
    window.localStorage.setItem('algolens-lang', value);
  }, lang);
}

async function openConcept(page: Page, id: string) {
  await page.setViewportSize(VIEWPORTS[2]);
  await page.goto('/?view=lab');
  const select = page.getByTestId('mobile-algo-select');
  await expect(select).toBeVisible({ timeout: 45_000 });
  await select.selectOption(`concept:${id}`);
  await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId('concept-diagram').locator('svg')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function setAndCheckViewport(page: Page, viewport: Viewport) {
  await page.setViewportSize(viewport);
  const frame = page.getByTestId('concept-diagram');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveCSS('overflow-x', 'auto');
  const metrics = await frame.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  if (viewport.width <= 390) {
    expect(metrics.scrollWidth, `diagram should remain horizontally scrollable at ${viewport.width}px`).toBeGreaterThan(
      metrics.clientWidth,
    );
    await frame.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    const atRight = await frame.evaluate((element) => ({
      scrollLeft: element.scrollLeft,
      max: element.scrollWidth - element.clientWidth,
    }));
    expect(atRight.scrollLeft).toBeGreaterThanOrEqual(Math.max(0, atRight.max - 1));
  }
}

async function elementBox(locator: Locator): Promise<BBox> {
  return locator.evaluate((element) => {
    const graphics = element as SVGGraphicsElement;
    const b = graphics.getBBox();
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  });
}

async function userBox(page: Page, selector: string): Promise<BBox> {
  return elementBox(page.locator(selector).first());
}

async function assertSvgInsideViewBox(page: Page, label: string) {
  const violations = await page.locator('[data-testid="concept-diagram"] svg').evaluate((svg) => {
    const viewBox = (svg as SVGSVGElement).viewBox.baseVal;
    const tolerance = 2;
    const bad: Array<Record<string, unknown>> = [];
    for (const element of Array.from(svg.querySelectorAll('text,rect'))) {
      if (element.closest('defs')) continue;
      if (!(element instanceof SVGGraphicsElement)) continue;
      const box = element.getBBox();
      if (box.width === 0 && box.height === 0) continue;
      const outside =
        box.x < viewBox.x - tolerance ||
        box.y < viewBox.y - tolerance ||
        box.x + box.width > viewBox.x + viewBox.width + tolerance ||
        box.y + box.height > viewBox.y + viewBox.height + tolerance;
      if (outside) {
        bad.push({
          tag: element.tagName,
          text: (element.textContent ?? '').slice(0, 48),
          box: { x: box.x, y: box.y, width: box.width, height: box.height },
          viewBox: { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height },
        });
      }
    }
    return bad;
  });
  expect(violations, `${label}: SVG text/rect outside viewBox`).toEqual([]);
}

async function assertDiagramAtAllViewports(page: Page, label: string, language = 'zh') {
  await assertSvgInsideViewBox(page, `${label} (${language}, initial 390px)`);
  for (const viewport of VIEWPORTS) {
    await setAndCheckViewport(page, viewport);
    await assertSvgInsideViewBox(page, `${label} (${language}, ${viewport.width}px)`);
  }
}

test.describe('AUDIT-02 — SVG geometry and readability', () => {
  test('P1-01/P1-11: sequential-file and indexed-file keep all keys and arrow semantics', async ({ page }) => {
    test.setTimeout(180_000);
    await primeLanguage(page, 'zh');
    await openConcept(page, 'sequential-file');
    await assertDiagramAtAllViewports(page, 'sequential-file');

    const sequential = await page.locator('[data-testid="concept-diagram"] svg').evaluate((svg) => {
      const arrow = svg.querySelector('[data-testid="sequential-current-arrow"]') as SVGPathElement;
      const chip = svg.querySelector('[data-file-key="105"]') as SVGGraphicsElement;
      const point = arrow.getPointAtLength(arrow.getTotalLength());
      const chipBox = chip.getBBox();
      const blocks = Array.from(svg.querySelectorAll('[data-file-block]')).map((block) => {
        const box = (block as SVGGraphicsElement).getBBox();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      });
      const range = svg.querySelector('[data-testid="sequential-range-card"]') as SVGGraphicsElement;
      const rangeBox = range.getBBox();
      return {
        point: { x: point.x, y: point.y },
        chip: { x: chipBox.x, y: chipBox.y, width: chipBox.width, height: chipBox.height },
        blocks,
        range: { x: rangeBox.x, y: rangeBox.y, width: rangeBox.width, height: rangeBox.height },
        key108: Boolean(svg.querySelector('[data-file-key="108"]')),
      };
    });
    expect(sequential.key108).toBe(true);
    expect(sequential.point.x).toBeGreaterThan(sequential.chip.x);
    expect(sequential.point.x).toBeLessThan(sequential.chip.x + sequential.chip.width);
    expect(sequential.point.y).toBeGreaterThanOrEqual(sequential.chip.y + sequential.chip.height - 1);
    expect(sequential.point.y).toBeLessThanOrEqual(sequential.chip.y + sequential.chip.height + 2);
    for (const block of sequential.blocks) {
      expect(overlaps(block, sequential.range), 'range card must not cover ordered blocks').toBe(false);
    }

    const lineStyles = await page.locator('[data-testid="sequential-current-arrow"]').evaluate((line) => {
      const marker = document.querySelector('marker[id="file-arrow-seq"]');
      const markerPath = marker?.querySelector('path');
      return {
        fill: getComputedStyle(line).fill,
        stroke: getComputedStyle(line).stroke,
        markerFill: markerPath ? getComputedStyle(markerPath).fill : '',
        markerWidth: marker?.getAttribute('markerWidth') ?? marker?.getAttribute('markerwidth') ?? '',
      };
    });
    expect(lineStyles.fill).toBe('none');
    expect(lineStyles.stroke).not.toBe('none');
    expect(lineStyles.markerFill).not.toBe('none');
    expect(lineStyles.markerWidth).toBe('7');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('mobile-algo-select').selectOption('concept:index-file');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 30_000 });
    await assertDiagramAtAllViewports(page, 'indexed-file');
    const indexed = await page.locator('[data-testid="concept-diagram"] svg').evaluate((svg) => {
      const arrow = svg.querySelector('[data-testid="indexed-sparse-arrow"]') as SVGPathElement;
      const block = svg.querySelector('[data-data-block="B1"]') as SVGGraphicsElement;
      const point = arrow.getPointAtLength(arrow.getTotalLength());
      const blockBox = block.getBBox();
      return {
        entries: Array.from(svg.querySelectorAll('[data-dense-entry]')).map((entry) => entry.getAttribute('data-key')),
        point: { x: point.x, y: point.y },
        block: { x: blockBox.x, y: blockBox.y, width: blockBox.width, height: blockBox.height },
      };
    });
    expect(indexed.entries).toEqual(['101', '102', '103', '104', '105', '106', '107', '108']);
    expect(indexed.point.x).toBeGreaterThanOrEqual(indexed.block.x);
    expect(indexed.point.x).toBeLessThanOrEqual(indexed.block.x + indexed.block.width);
    expect(indexed.point.y).toBeGreaterThanOrEqual(indexed.block.y - 8);
    expect(indexed.point.y).toBeLessThanOrEqual(indexed.block.y + 8);
  });

  test('P1-03/P1-09: external-sort rows and merge-cost text stay inside the frame', async ({ page }) => {
    test.setTimeout(180_000);
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await primeLanguage(page, 'zh');
    await openConcept(page, 'external-sort-basics');
    const rows = await page.locator('[data-testid="external-memory-row"]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('y')),
    );
    expect(rows).toEqual(['118', '152', '186', '220']);
    const titleAndBand = await page.locator('[data-testid="concept-diagram"] svg').evaluate((svg) => {
      const title = svg.querySelector('text.diagram-label-strong') as SVGGraphicsElement;
      const band = svg.querySelector('rect.diagram-band') as SVGGraphicsElement;
      const a = title.getBBox();
      const b = band.getBBox();
      return { title: { x: a.x, y: a.y, width: a.width, height: a.height }, band: { x: b.x, y: b.y, width: b.width, height: b.height } };
    });
    expect(overlaps(titleAndBand.title, titleAndBand.band)).toBe(false);
    await assertDiagramAtAllViewports(page, 'external-sort');
    expect(consoleErrors.filter((message) => /rect|attribute|Expected|SVG|number/i.test(message))).toEqual([]);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('mobile-algo-select').selectOption('concept:external-sort-comparison');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 30_000 });
    await assertDiagramAtAllViewports(page, 'external-comparison');
    const cost = await page.locator('[data-testid="concept-diagram"] svg').evaluate((svg) => {
      const band = svg.querySelector('[data-testid="external-cost-band"]') as SVGGraphicsElement;
      const bandBox = band.getBBox();
      const texts = Array.from(svg.querySelectorAll('text'))
        .filter((text) => text.textContent?.includes('总代价 ='))
        .map((text) => {
          const box = (text as SVGGraphicsElement).getBBox();
          return { x: box.x, y: box.y, width: box.width, height: box.height, content: text.textContent ?? '' };
        });
      return { band: { x: bandBox.x, y: bandBox.y, width: bandBox.width, height: bandBox.height }, texts };
    });
    expect(cost.texts.length).toBeGreaterThan(0);
    for (const text of cost.texts) {
      expect(containsBox(cost.band, text)).toBe(true);
      expect(text.content).toContain('8 + 16 + 27 = 51');
    }
  });

  test('P1-04/P1-05/P2-01: file comparison, multilist and basics do not overlap', async ({ page }) => {
    test.setTimeout(180_000);
    await primeLanguage(page, 'zh');
    await openConcept(page, 'file-comparison');
    await assertDiagramAtAllViewports(page, 'file-comparison');
    const premiseBoxes: BBox[] = [];
    const premises = page.locator('[data-testid="concept-diagram"] [data-premise]');
    for (let index = 0; index < (await premises.count()); index += 1) {
      premiseBoxes.push(await elementBox(premises.nth(index)));
    }
    expect(premiseBoxes).toHaveLength(4);
    for (let index = 1; index < premiseBoxes.length; index += 1) {
      expect(overlaps(premiseBoxes[index - 1], premiseBoxes[index])).toBe(false);
    }
    const premiseCard = await userBox(page, '[data-testid="file-comparison-premise-card"]');
    for (const box of premiseBoxes) expect(containsBox(premiseCard, box)).toBe(true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('mobile-algo-select').selectOption('concept:multi-table-file');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 30_000 });
    await assertDiagramAtAllViewports(page, 'multi-table-file');
    const recordR1 = await userBox(page, '[data-record-id="R1"]');
    const recordR2 = await userBox(page, '[data-record-id="R2"]');
    const recordR3 = await userBox(page, '[data-record-id="R3"]');
    expect(overlaps(recordR1, recordR2)).toBe(false);
    expect(overlaps(recordR2, recordR3)).toBe(false);
    const chainHead = await userBox(page, '[data-chain-head]');
    expect(overlaps(recordR1, chainHead)).toBe(false);
    const r1SecondRow = page.locator('[data-record-id="R1"] text').nth(2);
    const r1Region = page.locator('[data-record-id="R1"] text').nth(3);
    const categoryBox = await elementBox(r1SecondRow);
    const regionBox = await elementBox(r1Region);
    expect(overlaps(categoryBox, regionBox)).toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('mobile-algo-select').selectOption('concept:file-basics');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 30_000 });
    await assertDiagramAtAllViewports(page, 'file-basics');
    const r3 = await userBox(page, '[data-testid="file-basics-r3"]');
    const fieldNote = await userBox(page, '[data-testid="file-basics-fields"]');
    expect(overlaps(r3, fieldNote)).toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('mobile-algo-select').selectOption('concept:isam-vsam');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 30_000 });
    await assertDiagramAtAllViewports(page, 'isam-vsam');
  });

  test('P1-06/P1-07/P1-08/P2-03: hash, graph, string and static-tree layouts', async ({ page }) => {
    test.setTimeout(180_000);
    await primeLanguage(page, 'zh');
    await openConcept(page, 'hashing-basics');
    await assertDiagramAtAllViewports(page, 'hashing-basics');
    const bucket = await userBox(page, '[data-bucket-index="6"]');
    const hashNote = await userBox(page, '[data-testid="hashing-note-band"]');
    expect(overlaps(bucket, hashNote)).toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('mobile-algo-select').selectOption('concept:graph-adjacency-list');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 30_000 });
    await assertDiagramAtAllViewports(page, 'graph-adjacency-list');
    const dRow = await userBox(page, '[data-vertex-row="D"]');
    const allNotes = page.locator('[data-testid="concept-diagram"] svg .diagram-note');
    let graphExplanation: BBox | null = null;
    for (let index = 0; index < (await allNotes.count()); index += 1) {
      const text = (await allNotes.nth(index).textContent()) ?? '';
      if (text.includes('B 的边表')) {
        graphExplanation = await elementBox(allNotes.nth(index));
        break;
      }
    }
    expect(graphExplanation).not.toBeNull();
    expect(overlaps(dRow, graphExplanation as BBox)).toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('mobile-algo-select').selectOption('concept:string-storage');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 30_000 });
    await assertDiagramAtAllViewports(page, 'string-storage');
    const cNote = await userBox(page, '[data-testid="string-c-terminator"]');
    const firstCell = await userBox(page, '[data-testid="concept-diagram"] svg .diagram-cell');
    expect(overlaps(cNote, firstCell)).toBe(false);
    const tail = await userBox(page, '[data-testid="string-tail-pointer"]');
    const lastBlock = await userBox(page, '[data-testid="string-block"][data-block-index="2"]');
    expect(containsBox(lastBlock, tail)).toBe(true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('mobile-algo-select').selectOption('concept:static-tree-table');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 30_000 });
    await assertDiagramAtAllViewports(page, 'static-tree-table');
    const aslNote = await userBox(page, '[data-testid="static-tree-asl-notes"]');
    const treeCard = await userBox(page, '[data-testid="concept-diagram"] svg .diagram-box');
    expect(aslNote.x).toBeGreaterThanOrEqual(treeCard.x);
    expect(aslNote.x).toBeLessThanOrEqual(treeCard.x + treeCard.width);
  });

  test('P1-10: capacity page uses its own length/capacity diagram at every viewport', async ({ page }) => {
    test.setTimeout(120_000);
    await primeLanguage(page, 'zh');
    await openConcept(page, 'sequential-list-capacity');
    await expect(page.getByTestId('concept-diagram').getByTestId('sequential-capacity-before')).toBeVisible();
    await expect(page.getByTestId('concept-diagram').getByTestId('sequential-capacity-after')).toBeVisible();
    await expect(page.getByTestId('concept-diagram')).toContainText('length = 5');
    await expect(page.getByTestId('concept-diagram')).toContainText('capacity = 8');
    await expect(page.getByTestId('concept-diagram')).toContainText('capacity = 16');
    await expect(page.getByTestId('concept-page')).toContainText('仅当 length == capacity');
    await expect(page.getByTestId('concept-page')).not.toContainText('A[2][3]');
    await assertDiagramAtAllViewports(page, 'sequential-list-capacity');
    const beforeBoxes = await page.getByTestId('sequential-capacity-before').evaluate((group) => {
      const slots = Array.from(group.querySelectorAll('[data-slot-state]')).map((slot) => {
        const box = (slot as SVGGraphicsElement).getBBox();
        return { x: box.x, y: box.y, width: box.width, height: box.height, state: slot.getAttribute('data-slot-state') };
      });
      return slots;
    });
    expect(beforeBoxes).toHaveLength(8);
    expect(beforeBoxes.filter((slot) => slot.state === 'used')).toHaveLength(5);
    expect(beforeBoxes.filter((slot) => slot.state === 'free')).toHaveLength(3);

    await page.getByTestId('concept-diagram').screenshot({ path: 'test-results/audit02-sequential-capacity.png' });
  });

  test('English render keeps every corrected diagram inside its viewBox', async ({ page }) => {
    test.setTimeout(240_000);
    await primeLanguage(page, 'en');
    const pages: Array<[string, string]> = [
      ['sequential-file', 'current position'],
      ['index-file', 'Dense index'],
      ['file-comparison', 'Assumptions'],
      ['external-sort-comparison', 'cost breakdown'],
      ['string-storage', 'C string'],
      ['sequential-list-capacity', 'capacity'],
      ['hashing-basics', 'bucket array'],
      ['graph-adjacency-list', 'vertex table'],
      ['static-tree-table', 'decision tree'],
    ];
    for (const [id, fragment] of pages) {
      await openConcept(page, id);
      await expect(page.getByTestId('concept-diagram')).toContainText(fragment);
      await assertDiagramAtAllViewports(page, id, 'en');
    }
  });
});
