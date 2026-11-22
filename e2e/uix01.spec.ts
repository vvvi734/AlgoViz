import { expect, selectAlgorithm, test, type Page } from './fixtures';
import { collapseAlgorithmGuide } from './fixtures';

const TOTALS: Record<string, number> = {
  bubble: 25,
  selection: 40,
  insertion: 33,
  shell: 70,
  quick: 32,
  merge: 110,
  linear: 12,
  binary: 10,
};

const FRAMES: Record<string, number> = {
  bubble: 2,
  selection: 9,
  insertion: 3,
  shell: 2,
  quick: 12,
  merge: 100,
  linear: 10,
  binary: 3,
};

async function setFrame(page: Page, frame: number, total: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / ${total}`);
}

async function openAlgorithm(page: Page, id: keyof typeof TOTALS) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await selectAlgorithm(page, id);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${TOTALS[id]}`, { timeout: 60_000 });
  await collapseAlgorithmGuide(page);
  await setFrame(page, FRAMES[id], TOTALS[id]);
}

type CanvasMetrics = {
  stage: { width: number; height: number; scrollHeight: number; overflow: string };
  array: { width: number; height: number; top: number; bottom: number };
  maxBar: number;
  railWidth: number;
  pageOverflow: boolean;
  clipped: string[];
  markOverlaps: string[];
};

async function readCanvas(page: Page): Promise<CanvasMetrics> {
  return page.evaluate(() => {
    const stage = document.querySelector('[data-testid="visual-stage"]');
    const array = stage?.querySelector('.bars');
    if (!stage || !array) throw new Error('array canvas missing');
    const stageRect = stage.getBoundingClientRect();
    const arrayRect = array.getBoundingClientRect();
    const bars = [...array.querySelectorAll<HTMLElement>('.bar-item > .bar, .sorting-bar-item > .bar')];
    const items = [...array.querySelectorAll<HTMLElement>('.bar-item, .sorting-bar-item')];
    const maxBar = bars.length ? Math.max(...bars.map((bar) => bar.getBoundingClientRect().height)) : 0;
    const clipped: string[] = [];
    const markOverlaps: string[] = [];

    for (const item of items) {
      const bar = item.querySelector<HTMLElement>('.bar');
      const label = item.querySelector<HTMLElement>('.bar-label, .search-index-label');
      const marks = item.querySelector<HTMLElement>('.sorting-bar-marks');
      if (!bar) continue;
      const barRect = bar.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      if (barRect.top < itemRect.top - 1 || barRect.bottom > itemRect.bottom + 1) {
        clipped.push(`bar ${item.dataset.index ?? '?'} escapes its slot`);
      }
      if (barRect.bottom > arrayRect.bottom + 1 || barRect.top < arrayRect.top - 1) {
        clipped.push(`bar ${item.dataset.index ?? '?'} escapes the array`);
      }
      if (label && label.getBoundingClientRect().top < barRect.bottom - 1) {
        clipped.push(`label ${item.dataset.index ?? '?'} overlaps the bar`);
      }
      if (marks && marks.getBoundingClientRect().bottom > barRect.top + 1) {
        clipped.push(`marks ${item.dataset.index ?? '?'} overlap the bar`);
      }
      if (marks) {
        const tags = [...marks.querySelectorAll<HTMLElement>('.sorting-mark')];
        for (let index = 1; index < tags.length; index += 1) {
          const previous = tags[index - 1].getBoundingClientRect();
          const current = tags[index].getBoundingClientRect();
          if (current.left < previous.right - 1) markOverlaps.push(`marks ${item.dataset.index ?? '?'} collide`);
        }
      }
    }

    const rail = document.querySelector('[data-testid="lesson-panel"]');
    const footer = stage.querySelector<HTMLElement>('.sorting-footer');
    if (footer && !stage.querySelector('.sorting-buffer-panel')) {
      const footerRect = footer.getBoundingClientRect();
      const paddingBottom = parseFloat(getComputedStyle(stage).paddingBottom);
      if (footerRect.bottom > stageRect.bottom - paddingBottom + 1) {
        clipped.push('sorting footer escapes the stage');
      }
    }
    return {
      stage: {
        width: stageRect.width,
        height: stageRect.height,
        scrollHeight: stage.scrollHeight,
        overflow: getComputedStyle(stage).overflowY,
      },
      array: { width: arrayRect.width, height: arrayRect.height, top: arrayRect.top, bottom: arrayRect.bottom },
      maxBar,
      railWidth: rail?.getBoundingClientRect().width ?? 0,
      pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clipped,
      markOverlaps,
    };
  });
}

async function expectPlaybackWorks(page: Page) {
  await page.getByTestId('next-btn').click();
  await expect(page.locator('[data-testid="progress"]')).toHaveText(/2 \/ /);
  await page.getByTestId('prev-btn').click();
  await expect(page.locator('[data-testid="progress"]')).toHaveText(/1 \/ /);
  await page.getByTestId('play-btn').click();
  await expect(page.getByTestId('play-btn')).toContainText(/暂停|Pause/, { timeout: 15_000 });
  await expect(page.locator('[data-testid="progress"]')).not.toHaveText(/1 \/ /, { timeout: 15_000 });
  await page.getByTestId('play-btn').click();
  await expect(page.getByTestId('play-btn')).toContainText(/播放|Play/);
}

test.describe('UIX-V01 — shared array canvas utilization', () => {
  test('desktop: bars fill the stage and never clip across all eight algorithms', async ({ page }) => {
    test.setTimeout(600_000);
    await page.goto('/?view=lab');
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.localStorage.clear());
      for (const id of Object.keys(TOTALS) as (keyof typeof TOTALS)[]) {
        await openAlgorithm(page, id);
        const metrics = await readCanvas(page);
        expect(metrics.pageOverflow, `${id} page overflow at ${viewport.width}`).toBe(false);
        expect(metrics.clipped, `${id} clipped at ${viewport.width}`).toEqual([]);
        expect(metrics.markOverlaps, `${id} marker collision at ${viewport.width}`).toEqual([]);
        expect(metrics.railWidth, `${id} explanation rail at ${viewport.width}`).toBeGreaterThanOrEqual(340);
        await expect(page.getByTestId('play-btn')).toBeVisible();
        if (viewport.width === 1440) {
          expect(metrics.array.height, `${id} array height`).toBeGreaterThanOrEqual(250);
          expect(metrics.maxBar, `${id} max bar`).toBeGreaterThanOrEqual(200);
        } else {
          expect(metrics.array.height, `${id} array height`).toBeGreaterThanOrEqual(205);
          expect(metrics.maxBar, `${id} max bar`).toBeGreaterThanOrEqual(165);
        }
      }
    }
  });

  test('mobile: fixed 220px array track stays usable and the merge buffer remains readable', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const id of ['insertion', 'merge', 'binary'] as const) {
      await openAlgorithm(page, id);
      const metrics = await readCanvas(page);
      expect(metrics.pageOverflow, `${id} mobile overflow`).toBe(false);
      expect(metrics.clipped, `${id} mobile clipping`).toEqual([]);
      expect(metrics.markOverlaps, `${id} mobile marker collision`).toEqual([]);
      expect(metrics.array.height, `${id} mobile array height`).toBe(220);
      expect(metrics.maxBar, `${id} mobile max bar`).toBeGreaterThanOrEqual(175);
      if (id === 'merge') {
        const slots = page.getByTestId('sorting-buffer-slot');
        expect(await slots.count()).toBeGreaterThanOrEqual(7);
        for (let index = 0; index < (await slots.count()); index += 1) {
          const height = await slots.nth(index).evaluate((node) => node.getBoundingClientRect().height);
          expect(height).toBeGreaterThanOrEqual(34);
        }
      }
    }
  });

  test('playback, language and theme still work with the taller bars', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openAlgorithm(page, 'bubble');
    await setFrame(page, 0, TOTALS.bubble);
    await expectPlaybackWorks(page);

    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByRole('button', { name: /切换语言|Switch language/ })).toHaveText(/中文 \/ EN/);
    let metrics = await readCanvas(page);
    expect(metrics.pageOverflow).toBe(false);
    expect(metrics.clipped).toEqual([]);
    expect(metrics.maxBar).toBeGreaterThanOrEqual(200);

    await page.getByTestId('theme-select').selectOption('dark');
    metrics = await readCanvas(page);
    expect(metrics.pageOverflow).toBe(false);
    expect(metrics.clipped).toEqual([]);
    expect(metrics.maxBar).toBeGreaterThanOrEqual(200);
  });
});
