import { mkdirSync } from 'node:fs';
import { expect, selectAlgorithm, test, type Page } from './fixtures';

const SCREENSHOT_DIR = 'test-results/dark-diagram-01';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

type SurfaceKind = 'background' | 'fill';

type SurfaceProbe = {
  raw: string;
  nearWhite: boolean;
  luminance: number;
  alpha: number;
};

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.getByTestId('theme-select').selectOption(theme);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

async function prepare(page: Page) {
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await setTheme(page, 'dark');
}

async function openAlgorithm(page: Page, id: string): Promise<number> {
  await page.setViewportSize({ width: 700, height: 900 });
  await selectAlgorithm(page, id);
  await expect(page.getByTestId('visual-stage')).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('[data-testid="progress"]').first()).toHaveText(/^1 \/ \d+$/, {
    timeout: 90_000,
  });
  const progress = (await page.locator('[data-testid="progress"]').first().textContent()) ?? '1 / 0';
  return Number(progress.split('/')[1]?.trim());
}

async function probeSurface(page: Page, selector: string, kind: SurfaceKind = 'background'): Promise<SurfaceProbe> {
  const locator = page.locator(selector).first();
  await expect(locator).toBeAttached();
  return await locator.evaluate((element, surfaceKind) => {
    type Rgba = [number, number, number, number];

    const parse = (input: string): Rgba | null => {
      const value = input.trim();
      if (!value || value === 'transparent') return [0, 0, 0, 0];
      const hex = value.match(/^#([0-9a-f]{3,8})$/i);
      if (hex) {
        const raw = hex[1];
        if (raw.length === 3 || raw.length === 4) {
          return [
            parseInt(raw[0] + raw[0], 16),
            parseInt(raw[1] + raw[1], 16),
            parseInt(raw[2] + raw[2], 16),
            raw.length === 4 ? parseInt(raw[3] + raw[3], 16) / 255 : 1,
          ];
        }
        if (raw.length === 6 || raw.length === 8) {
          return [
            parseInt(raw.slice(0, 2), 16),
            parseInt(raw.slice(2, 4), 16),
            parseInt(raw.slice(4, 6), 16),
            raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1,
          ];
        }
      }
      const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
      if (rgb) {
        const parts = rgb[1].replace(/\//g, ' ').split(/[,\s]+/).filter(Boolean);
        const channel = (part: string) => (part.endsWith('%') ? Number(part.slice(0, -1)) * 2.55 : Number(part));
        return [channel(parts[0]), channel(parts[1]), channel(parts[2]), parts[3] === undefined ? 1 : Number(parts[3])];
      }
      const srgb = value.match(/^color\(srgb\s+([^)]+)\)$/i);
      if (srgb) {
        const parts = srgb[1].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
        return [Number(parts[0]) * 255, Number(parts[1]) * 255, Number(parts[2]) * 255, parts[3] === undefined ? 1 : Number(parts[3])];
      }
      return null;
    };

    const luminance = ([r, g, b]: number[]) => {
      const linear = (channel: number) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
    };

    const effectiveBackground = (node: Element | null): Rgba => {
      let current = node;
      while (current) {
        const parsed = parse(getComputedStyle(current).backgroundColor);
        if (parsed && parsed[3] >= 0.9) return parsed;
        current = current.parentElement;
      }
      return parse(getComputedStyle(document.documentElement).backgroundColor) ?? [10, 16, 32, 1];
    };

    const style = getComputedStyle(element);
    const rgba =
      surfaceKind === 'fill'
        ? parse(style.fill) ?? parse(style.getPropertyValue('fill')) ?? [0, 0, 0, 1]
        : effectiveBackground(element);
    return {
      raw: surfaceKind === 'fill' ? style.fill : style.backgroundColor,
      nearWhite: rgba[0] >= 235 && rgba[1] >= 235 && rgba[2] >= 235 && rgba[3] >= 0.9,
      luminance: luminance(rgba),
      alpha: rgba[3],
    };
  }, kind);
}

async function expectDarkSurface(page: Page, selector: string, kind: SurfaceKind = 'background') {
  const probe = await probeSurface(page, selector, kind);
  expect(probe.nearWhite, `${selector} must not keep a white ${kind}: ${probe.raw}`).toBe(false);
  expect(probe.luminance, `${selector} must remain a dark surface`).toBeLessThan(0.55);
}

async function expectTextContrast(
  page: Page,
  backgroundSelector: string,
  textSelector: string,
  backgroundKind: SurfaceKind = 'background',
) {
  const background = await probeSurface(page, backgroundSelector, backgroundKind);
  const foreground = await page.locator(textSelector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    const raw = element instanceof SVGElement ? style.fill : style.color;
    const match = raw.match(/^rgba?\(([^)]+)\)$/i) ?? raw.match(/^color\(srgb\s+([^)]+)\)$/i);
    if (!match) return null;
    const parts = match[1].replace(/\//g, ' ').split(/[,\s]+/).filter(Boolean).map(Number);
    const scale = raw.startsWith('color(') ? 255 : 1;
    const [r, g, b] = parts.map((part, index) => (index < 3 ? part * scale : part));
    const linear = (channel: number) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  });
  expect(foreground, `${textSelector} must expose a parsed colour`).not.toBeNull();
  const ratio = (Math.max(background.luminance, foreground!) + 0.05) / (Math.min(background.luminance, foreground!) + 0.05);
  expect(ratio, `${textSelector} contrast against ${backgroundSelector}`).toBeGreaterThan(3);
}

async function expectLineContrast(
  page: Page,
  surfaceSelector: string,
  lineSelector: string,
  surfaceKind: SurfaceKind = 'background',
) {
  const background = await probeSurface(page, surfaceSelector, surfaceKind);
  const stroke = await page.locator(lineSelector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    const raw = style.stroke;
    const match = raw.match(/^rgba?\(([^)]+)\)$/i) ?? raw.match(/^color\(srgb\s+([^)]+)\)$/i);
    if (!match) return null;
    const parts = match[1].replace(/\//g, ' ').split(/[,\s]+/).filter(Boolean).map(Number);
    const scale = raw.startsWith('color(') ? 255 : 1;
    const [r, g, b] = parts.map((part, index) => (index < 3 ? part * scale : part));
    const linear = (channel: number) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  });
  expect(stroke, `${lineSelector} must expose a parsed stroke`).not.toBeNull();
  const ratio = (Math.max(background.luminance, stroke!) + 0.05) / (Math.min(background.luminance, stroke!) + 0.05);
  expect(ratio, `${lineSelector} contrast against ${surfaceSelector}`).toBeGreaterThan(2.5);
}

async function resetDiagramScroll(page: Page) {
  await page.getByTestId('visual-stage').first().evaluate((element) => {
    let current: HTMLElement | null = element as HTMLElement;
    while (current) {
      if (current.scrollWidth > current.clientWidth) current.scrollLeft = 0;
      current = current.parentElement;
    }
  });
}

test.describe('DARK-DIAGRAM-01', () => {
  test('dark mode remaps every chapter diagram family and keeps labels readable', async ({ page }) => {
    test.setTimeout(420_000);
    await prepare(page);
    const cases: Array<{
      id: string;
      surface: string;
      kind?: SurfaceKind;
      text?: string;
      line?: string;
      lineSurface?: string;
    }> = [
      { id: 'file-index', surface: '.file-block', text: '.file-block > header b' },
      { id: 'isam', surface: '.file-record', text: '.file-record strong' },
      { id: 'inverted-index', surface: '.inverted-record', text: '.inverted-record > b' },
      { id: 'block-search', surface: '.block-cell', text: '.block-cell' },
      { id: 'bplus-tree', surface: '.bplus-node rect', kind: 'fill', text: '.bplus-node text', line: '.bplus-edge', lineSurface: '.bplus-canvas-scroll' },
      { id: 'key-tree', surface: '.key-tree-node-circle', kind: 'fill', text: '.key-tree-node-char', line: '.key-tree-edge', lineSurface: '.key-tree-canvas' },
      { id: 'tournament', surface: '.sort10-node rect', kind: 'fill', text: '.sort10-node text', line: '.sort10-tree line', lineSurface: '.sort10-tree-panel' },
      { id: 'radix', surface: '.sort10-bucket', text: '.sort10-bucket-head' },
      { id: 'multiway', surface: '.ext-run', text: '.ext-run-head b' },
      { id: 'replacement', surface: '.ext-tape-record', text: '.ext-tape-record b' },
      { id: 'optimal-merge', surface: '.ext-node rect', kind: 'fill', text: '.ext-node text' },
      { id: 'gl-depth', surface: '.gl-node-box', kind: 'fill', text: '.gl-node-label', line: '.gl-edge' },
      { id: 'gl-copy', surface: '.gl-node-box', kind: 'fill', text: '.gl-node-label' },
    ];

    for (const item of cases) {
      await openAlgorithm(page, item.id);
      await page.setViewportSize({ width: 1280, height: 1000 });
      await expectDarkSurface(page, item.surface, item.kind);
      if (item.text) {
        await expectTextContrast(page, item.surface, item.text, item.kind);
      }
      if (item.line) {
        await expectLineContrast(page, item.lineSurface ?? item.surface, item.line, item.kind);
      }
      await resetDiagramScroll(page);
      await page.locator('[data-testid="visual-stage"]').screenshot({
        path: `${SCREENSHOT_DIR}/dark-1280-${item.id}.png`,
      });
    }
  });

  test('360/390/768/1280/1440 keep both themes correct without page overflow', async ({ page }) => {
    test.setTimeout(420_000);
    await prepare(page);
    const cases: Array<{ id: string; surface: string; kind?: SurfaceKind }> = [
      { id: 'file-index', surface: '.file-block' },
      { id: 'tournament', surface: '.sort10-node rect', kind: 'fill' },
      { id: 'gl-depth', surface: '.gl-node-box', kind: 'fill' },
    ];

    for (const item of cases) {
      await openAlgorithm(page, item.id);
      for (const width of [360, 390, 768, 1280, 1440]) {
        await page.setViewportSize({ width, height: width < 768 ? 860 : 1000 });
        await expectDarkSurface(page, item.surface, item.kind);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `dark page overflow at ${width}px`).toBeLessThanOrEqual(1);
        await resetDiagramScroll(page);
        await page.locator('[data-testid="visual-stage"]').screenshot({
          path: `${SCREENSHOT_DIR}/viewport-${item.id}-${width}.png`,
        });
      }
    }

    await setTheme(page, 'light');
    for (const item of cases) {
      await openAlgorithm(page, item.id);
      for (const width of [360, 390, 768, 1280, 1440]) {
        await page.setViewportSize({ width, height: width < 768 ? 860 : 1000 });
        const probe = await probeSurface(page, item.surface, item.kind);
        expect(probe.luminance, `${item.surface} must stay light at ${width}px`).toBeGreaterThan(0.6);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `light page overflow at ${width}px`).toBeLessThanOrEqual(1);
        await resetDiagramScroll(page);
        await page.locator('[data-testid="visual-stage"]').screenshot({
          path: `${SCREENSHOT_DIR}/light-viewport-${item.id}-${width}.png`,
        });
      }
    }
  });

  test('theme switching preserves the current frame; fullscreen and 200%/50% zoom stay dark', async ({ page }) => {
    test.setTimeout(420_000);
    await prepare(page);
    await openAlgorithm(page, 'tournament');
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]').first()).toHaveText(/^2 \/ \d+$/);
    await resetDiagramScroll(page);
    await page.locator('[data-testid="visual-stage"]').screenshot({
      path: `${SCREENSHOT_DIR}/theme-switch-tournament-frame2-dark.png`,
    });

    await setTheme(page, 'light');
    await expect(page.locator('[data-testid="progress"]').first()).toHaveText(/^2 \/ \d+$/);
    await resetDiagramScroll(page);
    await page.locator('[data-testid="visual-stage"]').screenshot({
      path: `${SCREENSHOT_DIR}/theme-switch-tournament-frame2-light.png`,
    });
    await setTheme(page, 'dark');
    await expect(page.locator('[data-testid="progress"]').first()).toHaveText(/^2 \/ \d+$/);
    await expectDarkSurface(page, '.sort10-node rect', 'fill');
    await resetDiagramScroll(page);
    await page.locator('[data-testid="visual-stage"]').screenshot({
      path: `${SCREENSHOT_DIR}/theme-switch-tournament-frame2-return-dark.png`,
    });

    await openAlgorithm(page, 'file-index');
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.evaluate(() => {
      for (const name of ['requestFullscreen', 'webkitRequestFullscreen']) {
        Object.defineProperty(document.documentElement, name, { configurable: true, value: undefined });
      }
    });
    await page.getByTestId('fullscreen-open-btn').click();
    await expect(page.getByTestId('fullscreen-workspace')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expectDarkSurface(page, '.fullscreen-workspace');
    await expectDarkSurface(page, '.fullscreen-world .file-block');
    await page.getByTestId('fullscreen-workspace').screenshot({
      path: `${SCREENSHOT_DIR}/fullscreen-file-index-100.png`,
    });

    for (let step = 0; step < 4; step += 1) await page.getByTestId('fullscreen-zoom-in').click();
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('200%');
    await expectDarkSurface(page, '.fullscreen-world .file-block');
    await page.getByTestId('fullscreen-workspace').screenshot({
      path: `${SCREENSHOT_DIR}/fullscreen-file-index-200.png`,
    });
    await page.getByTestId('fullscreen-zoom-value').click();
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('100%');
    await page.getByTestId('fullscreen-zoom-out').click();
    await page.getByTestId('fullscreen-zoom-out').click();
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('50%');
    await expectDarkSurface(page, '.fullscreen-world .file-block');
    await page.getByTestId('fullscreen-workspace').screenshot({
      path: `${SCREENSHOT_DIR}/fullscreen-file-index-50.png`,
    });
    await page.getByTestId('fullscreen-fit').click();

    await page.getByTestId('fullscreen-exit').click();
    await expect(page.getByTestId('fullscreen-workspace')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expectDarkSurface(page, '.file-block');
    await page.locator('[data-testid="visual-stage"]').screenshot({
      path: `${SCREENSHOT_DIR}/after-exit-file-index-dark.png`,
    });
  });

  test('static concept diagrams and the interactive array diagram are dark-theme safe', async ({ page }) => {
    test.setTimeout(240_000);
    await prepare(page);
    await selectAlgorithm(page, 'concept:array-basics');
    await expect(page.getByTestId('concept-page')).toBeVisible({ timeout: 45_000 });
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.locator('.array-cell').first().click();
    await expect(page.locator('.array-cell.is-selected')).toHaveCount(1);
    await expectDarkSurface(page, '.array-cell.is-selected');
    await expectTextContrast(page, '.array-cell.is-selected', '.array-cell.is-selected .array-cell-index');
    await expectTextContrast(page, '[data-testid="concept-diagram"]', '.array-address');
    const address = await page.locator('.array-address').first().evaluate((element) => getComputedStyle(element).color);
    expect(address).not.toMatch(/rgb\(47,\s*111,\s*78\)/);
    await page.getByTestId('concept-page').screenshot({ path: `${SCREENSHOT_DIR}/concept-array-selected-dark.png` });

    await page.setViewportSize({ width: 700, height: 900 });
    for (const id of ['external-sort-basics', 'file-basics', 'search-basics', 'generalized-list-definition']) {
      await page.goto('/?view=lab');
      await page.setViewportSize({ width: 700, height: 900 });
      await expect(page.getByTestId('mobile-algo-select')).toBeVisible({ timeout: 45_000 });
      await setTheme(page, 'dark');
      await selectAlgorithm(page, `concept:${id}`);
      await expect(page.getByTestId('concept-page')).toBeVisible({ timeout: 45_000 });
      await expect(page.getByTestId('concept-page')).toContainText(/./, { timeout: 10_000 });
      await page.setViewportSize({ width: 1280, height: 1000 });
      const frame = await probeSurface(page, '[data-testid="concept-diagram"]');
      expect(frame.nearWhite, `concept ${id} frame`).toBe(false);
      const whiteSvgFills = await page
        .getByTestId('concept-diagram')
        .locator('svg *')
        .evaluateAll((elements) =>
          elements.filter((element) => getComputedStyle(element).fill === 'rgb(255, 255, 255)').length,
        );
      expect(whiteSvgFills, `concept ${id} white SVG fills`).toBe(0);
    }

    await setTheme(page, 'light');
    await expect(page.getByTestId('concept-page')).toBeVisible();
  });
});
