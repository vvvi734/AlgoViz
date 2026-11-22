import { mkdirSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

type Lang = 'zh' | 'en';
type Viewport = { width: number; height: number };

const VIEWPORTS: Viewport[] = [
  { width: 1280, height: 900 },
  { width: 1680, height: 1000 },
  { width: 390, height: 844 },
];

const FORMULA_GAP_PAGES = [
  'adt',
  'algorithm-cases',
  'array-basics',
  'b-tree',
  'complexity',
  'forest-conversion',
  'graph-basics',
  'hashing-basics',
  'linear-list',
  'sorting-basics',
  'sparse-matrix',
  'special-matrices',
  'stack-queue-storage',
  'static-tree-table',
  'storage-structures',
  'string-basics',
  'tree-storage',
  'tree-terms',
] as const;

const CJK = /[\u3400-\u9fff]/;
const SHOT_DIR = 'test-results/teaching-final';

async function primeLanguage(page: Page, lang: Lang) {
  await page.addInitScript((value) => {
    window.localStorage.setItem('algolens-lang', value);
  }, lang);
}

async function openAtMobileDirectory(page: Page, conceptId: string) {
  await page.setViewportSize(VIEWPORTS[2]);
  await page.goto('/?view=lab');
  const select = page.getByTestId('mobile-algo-select');
  await expect(select).toBeVisible({ timeout: 45_000 });
  await select.selectOption(`concept:${conceptId}`);
  await expect(page.getByTestId('concept-page')).toHaveAttribute('data-concept-id', conceptId, {
    timeout: 45_000,
  });
  await expect(page.getByTestId('concept-title')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function selectConcept(page: Page, conceptId: string) {
  const select = page.getByTestId('mobile-algo-select');
  await expect(select).toBeVisible();
  await select.selectOption(`concept:${conceptId}`);
  await expect(page.getByTestId('concept-page')).toHaveAttribute('data-concept-id', conceptId, {
    timeout: 20_000,
  });
}

async function svgGeometry(page: Page) {
  return page.locator('[data-testid="sorting-comparison-svg"]').evaluate((svg) => {
    const viewBox = (svg as SVGSVGElement).viewBox.baseVal;
    const outside: Array<Record<string, unknown>> = [];
    const texts: Array<{ text: string; x: number; y: number; width: number; height: number }> = [];
    for (const element of Array.from(svg.querySelectorAll('text, rect, line, polygon'))) {
      if (!(element instanceof SVGGraphicsElement)) continue;
      const box = element.getBBox();
      if (box.width === 0 && box.height === 0) continue;
      if (
        box.x < viewBox.x - 2 ||
        box.y < viewBox.y - 2 ||
        box.x + box.width > viewBox.x + viewBox.width + 2 ||
        box.y + box.height > viewBox.y + viewBox.height + 2
      ) {
        outside.push({
          tag: element.tagName,
          text: (element.textContent ?? '').slice(0, 48),
          box: { x: box.x, y: box.y, width: box.width, height: box.height },
        });
      }
      if (element.tagName.toLowerCase() === 'text') {
        texts.push({
          text: (element.textContent ?? '').trim(),
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        });
      }
    }
    const overlaps: Array<[string, string]> = [];
    for (let i = 0; i < texts.length; i += 1) {
      for (let j = i + 1; j < texts.length; j += 1) {
        const a = texts[i];
        const b = texts[j];
        const overlap =
          a.x + a.width > b.x + 1 &&
          b.x + b.width > a.x + 1 &&
          a.y + a.height > b.y + 1 &&
          b.y + b.height > a.y + 1;
        if (overlap) {
          overlaps.push([a.text, b.text]);
        }
      }
    }
    return { outside, overlaps };
  });
}

async function assertSvgGeometry(page: Page) {
  const result = await svgGeometry(page);
  expect(result.outside, 'SVG text/rect/line/polygon outside viewBox').toEqual([]);
  expect(result.overlaps, 'SVG text labels overlap').toEqual([]);
}

async function assertDiagramAtViewport(page: Page, lang: Lang, viewport: Viewport) {
  await page.setViewportSize(viewport);
  const frame = page.getByTestId('concept-diagram');
  await expect(frame).toBeVisible();
  await frame.scrollIntoViewIfNeeded();
  await expect(page.getByTestId('sorting-comparison-svg')).toBeVisible();
  await expect(frame).toHaveCSS('overflow-x', 'auto');
  await assertSvgGeometry(page);

  const metrics = await frame.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  if (viewport.width <= 390) {
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
    const visibleLeft = await page
      .getByTestId('sorting-comparison-selection')
      .evaluate((element) => {
        const text = element.getBoundingClientRect();
        const frameRect = element.closest('[data-testid="concept-diagram"]')!.getBoundingClientRect();
        return { textLeft: text.left, frameLeft: frameRect.left };
      });
    expect(visibleLeft.textLeft).toBeGreaterThanOrEqual(visibleLeft.frameLeft - 2);

    await frame.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    const visibleRight = await page
      .getByTestId('sorting-comparison-selection')
      .evaluate((element) => {
        const text = element.getBoundingClientRect();
        const frameRect = element.closest('[data-testid="concept-diagram"]')!.getBoundingClientRect();
        return { textRight: text.right, frameRight: frameRect.right, textLeft: text.left };
      });
    expect(visibleRight.textRight).toBeLessThanOrEqual(visibleRight.frameRight + 2);
    expect(visibleRight.textLeft).toBeLessThan(visibleRight.frameRight);
    await page.screenshot({
      path: `${SHOT_DIR}/sorting-comparison-${lang}-${viewport.width}-right.png`,
    });
    await frame.evaluate((element) => {
      element.scrollLeft = 0;
    });
  } else {
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  }

  await page.screenshot({
    path: `${SHOT_DIR}/sorting-comparison-${lang}-${viewport.width}-left.png`,
  });
}

for (const lang of ['zh', 'en'] as const) {
  test(`TEACHING-FINAL P2-07 browser render (${lang})`, async ({ page }) => {
    test.setTimeout(180_000);
    mkdirSync(SHOT_DIR, { recursive: true });
    await primeLanguage(page, lang);
    await openAtMobileDirectory(page, 'sorting-comparison');

    const title = await page.getByTestId('concept-title').textContent();
    expect(title ?? '').toContain(lang === 'zh' ? '排序方法选择' : 'Choosing');
    const svgText = await page.getByTestId('sorting-comparison-svg').textContent();
    if (lang === 'en') {
      expect(svgText ?? '').not.toMatch(CJK);
      expect(svgText ?? '').toContain('Selection conditions');
    } else {
      expect(svgText ?? '').toContain('选择条件');
    }

    for (const viewport of VIEWPORTS) {
      await assertDiagramAtViewport(page, lang, viewport);
    }
  });

  test(`TEACHING-FINAL P2-04 browser formula coverage (${lang})`, async ({ page }) => {
    test.setTimeout(180_000);
    mkdirSync(SHOT_DIR, { recursive: true });
    await primeLanguage(page, lang);
    await openAtMobileDirectory(page, 'complexity');

    for (const conceptId of FORMULA_GAP_PAGES) {
      await selectConcept(page, conceptId);
      const formulas = await page.locator('.concept-formula code').allTextContents();
      expect(formulas.length, `${conceptId} formula count`).toBeGreaterThan(0);
      const normalized = formulas.map((formula) => formula.trim());
      expect(normalized.every((formula) => formula.length > 0), `${conceptId} empty formula`).toBe(
        true,
      );
      const formulaLayout = await page.locator('.concept-formula').evaluateAll((nodes) =>
        nodes.map((node) => ({
          scrollWidth: node.scrollWidth,
          clientWidth: node.clientWidth,
          text: (node.textContent ?? '').trim().slice(0, 40),
        })),
      );
      expect(
        formulaLayout.every((box) => box.scrollWidth <= box.clientWidth + 1),
        `${conceptId} formula box horizontally clipped: ${JSON.stringify(formulaLayout)}`,
      ).toBe(true);
      if (lang === 'en') {
        expect(normalized.join('\n'), `${conceptId} English formula still has Chinese`).not.toMatch(CJK);
      } else {
        expect(normalized.join('\n'), `${conceptId} Chinese formula missing`).toMatch(CJK);
      }
    }

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(VIEWPORTS[2]);
      await selectConcept(page, 'complexity');
      await page.setViewportSize(viewport);
      const formula = page.locator('.concept-formula code').first();
      await expect(formula).toBeVisible();
      await formula.scrollIntoViewIfNeeded();
      const text = (await formula.textContent())?.trim() ?? '';
      expect(text.length).toBeGreaterThan(0);
      if (lang === 'en') expect(text).not.toMatch(CJK);
      const layout = await page.locator('.concept-formula').first().evaluate((node) => ({
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      }));
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
      expect(layout.scrollHeight).toBeLessThanOrEqual(layout.clientHeight + 1);
      await page.screenshot({
        path: `${SHOT_DIR}/complexity-formula-${lang}-${viewport.width}.png`,
      });
    }
  });
}
