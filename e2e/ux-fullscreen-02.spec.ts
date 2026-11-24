import { mkdirSync, writeFileSync } from 'node:fs';
import type { Locator } from '@playwright/test';
import { expect, selectAlgorithm, test, type Page } from './fixtures';

const SCREENSHOT_DIR = 'test-results/fullscreen02';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function waitForAlgorithm(page: Page, id: string, total?: number): Promise<number> {
  await selectAlgorithm(page, id);
  await expect(page.getByTestId('visual-stage')).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('[data-testid="progress"]').first()).toHaveText(
    total === undefined ? /^1 \/ \d+$/ : new RegExp(`^1 / ${total}$`),
    { timeout: 90_000 },
  );
  const progress = (await page.locator('[data-testid="progress"]').first().textContent()) ?? '1 / 0';
  return Number(progress.split('/')[1]?.trim());
}

async function disableNativeFullscreen(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const name of ['requestFullscreen', 'webkitRequestFullscreen']) {
      Object.defineProperty(document.documentElement, name, { configurable: true, value: undefined });
    }
  });
}

async function openFullscreen(page: Page) {
  const opener = page.getByTestId('fullscreen-open-btn');
  await expect(opener).toBeEnabled({ timeout: 60_000 });
  await opener.click();
  const workspace = page.getByTestId('fullscreen-workspace');
  await expect(workspace).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('fullscreen-canvas')).toHaveAttribute('data-zoom', '1');
  return workspace;
}

async function aimAtZoom(page: Page, target: number): Promise<void> {
  await page.getByTestId('fullscreen-zoom-value').click();
  await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('100%');
  if (target > 1) {
    const sequence = [1.25, 1.5, 1.75, 2];
    for (const stop of sequence) {
      await page.getByTestId('fullscreen-zoom-in').click();
      if (Math.abs(stop - target) < 0.01) break;
    }
  } else if (target < 1) {
    await page.getByTestId('fullscreen-zoom-out').click();
    if (target < 0.75) await page.getByTestId('fullscreen-zoom-out').click();
  }
  await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText(`${target * 100}%`);
}

async function panShapeIntoCanvas(page: Page, shapeSelector: string): Promise<void> {
  const delta = await page.evaluate((selector) => {
    const canvas = document.querySelector('[data-testid="fullscreen-canvas"]')?.getBoundingClientRect();
    const shape = document.querySelector<SVGGraphicsElement>(`.fullscreen-world ${selector}`)?.getBoundingClientRect();
    if (!canvas || !shape) return null;
    const dx = (canvas.left + canvas.width / 2) - (shape.left + shape.width / 2);
    const dy = (canvas.top + canvas.height / 2) - (shape.top + shape.height / 2);
    return { dx, dy, canvas };
  }, shapeSelector);
  if (!delta || (Math.abs(delta.dx) < 40 && Math.abs(delta.dy) < 40)) return;
  const startX = delta.dx >= 0 ? 40 : 1240;
  const startY = delta.canvas.top + delta.canvas.height * 0.55;
  const endX = Math.min(1270, Math.max(10, startX + delta.dx));
  const endY = Math.min(880, Math.max(10, startY + delta.dy));
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(120);
}


async function armKeyProbe(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as Window & { __fs02Key?: { key: string; prevented: boolean } }).__fs02Key = undefined;
    document.addEventListener('keydown', (event) => {
      (window as Window & { __fs02Key?: { key: string; prevented: boolean } }).__fs02Key = {
        key: event.key,
        prevented: event.defaultPrevented,
      };
    });
  });
}

async function lastKey(page: Page): Promise<{ key: string; prevented: boolean }> {
  return await page.evaluate(
    () =>
      (window as Window & { __fs02Key?: { key: string; prevented: boolean } }).__fs02Key ?? {
        key: '',
        prevented: false,
      },
  );
}

async function progressIn(locator: Locator): Promise<string> {
  return (await locator.getByTestId('progress').textContent())?.trim() ?? '';
}

test.describe('UX-FULLSCREEN-02', () => {
  test('keyboard: arrows/Space map to the existing player, R/Home/End are gone, page scroll is protected', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);
    const total = await waitForAlgorithm(page, 'bubble', 25);
    await page.setViewportSize({ width: 1280, height: 900 });
    await armKeyProbe(page);

    const stagePanel = page.locator('.stage-panel');
    const workbench = page.getByTestId('lab-workbench');

    // Reading the page owns the body: Up/Down must scroll, not reset/jump.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('ArrowDown');
    let probe = await lastKey(page);
    expect(probe.key).toBe('ArrowDown');
    expect(probe.prevented).toBe(false);
    expect(await progressIn(stagePanel)).toBe(`1 / ${total}`);

    await page.keyboard.press('ArrowUp');
    probe = await lastKey(page);
    expect(probe.key).toBe('ArrowUp');
    expect(probe.prevented).toBe(false);
    expect(await progressIn(stagePanel)).toBe(`1 / ${total}`);

    // An explicitly focused player surface owns all five keys.
    await workbench.focus();
    await page.keyboard.press('ArrowDown');
    probe = await lastKey(page);
    expect(probe.prevented).toBe(true);
    expect(await progressIn(stagePanel)).toBe(`${total} / ${total}`);
    await page.keyboard.press('ArrowLeft');
    expect(await progressIn(stagePanel)).toBe(`${total - 1} / ${total}`);
    await page.keyboard.press('ArrowUp');
    expect(await progressIn(stagePanel)).toBe(`1 / ${total}`);
    await page.keyboard.press('ArrowRight');
    expect(await progressIn(stagePanel)).toBe(`2 / ${total}`);

    // Removed keys do nothing even while the player surface owns focus.
    await workbench.focus();
    for (const key of ['r', 'R', 'Home', 'End']) {
      await page.keyboard.press(key);
      probe = await lastKey(page);
      expect(probe.prevented).toBe(false);
      expect(await progressIn(stagePanel)).toBe(`2 / ${total}`);
    }

    // Text input and Monaco retain their native arrow handling.
    await page.locator('#run-input').focus();
    await page.keyboard.press('ArrowUp');
    probe = await lastKey(page);
    expect(probe.prevented).toBe(false);
    expect(await progressIn(stagePanel)).toBe(`2 / ${total}`);

    await page.getByTestId('workspace-tabs-toggle').click();
    await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'true');
    const monacoInput = page.locator('.monaco-editor textarea').first();
    if (await monacoInput.count()) {
      await monacoInput.focus({ timeout: 5_000 }).catch(() => undefined);
      await page.keyboard.press('ArrowDown');
      probe = await lastKey(page);
      expect(probe.prevented).toBe(false);
      expect(await progressIn(stagePanel)).toBe(`2 / ${total}`);
    }

    // Space reuses the one playback controller and pauses before Up.
    await workbench.focus();
    await page.keyboard.press('Space');
    await expect(stagePanel.getByTestId('play-btn')).toContainText('暂停');
    await page.waitForTimeout(80);
    await page.keyboard.press('ArrowUp');
    expect(await progressIn(stagePanel)).toBe(`1 / ${total}`);
    await expect(stagePanel.getByTestId('play-btn')).toContainText('播放');
    await page.waitForTimeout(500);
    expect(await progressIn(stagePanel)).toBe(`1 / ${total}`);

    // Boundary frames never go out of range, and a key advances exactly once.
    await page.keyboard.press('ArrowLeft');
    expect(await progressIn(stagePanel)).toBe(`1 / ${total}`);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    expect(await progressIn(stagePanel)).toBe(`${total} / ${total}`);

    // Entering fullscreen keeps the exact frame; all shortcuts now use the
    // fullscreen workspace as the playback surface.
    const frameBeforeEntry = await progressIn(stagePanel);
    const workspace = await openFullscreen(page);
    expect(await progressIn(workspace)).toBe(frameBeforeEntry);
    await page.getByTestId('fullscreen-canvas').focus();

    await page.keyboard.press('ArrowLeft');
    expect(await progressIn(workspace)).toBe(`${total - 1} / ${total}`);
    await page.keyboard.press('ArrowRight');
    expect(await progressIn(workspace)).toBe(`${total} / ${total}`);
    await page.keyboard.press('ArrowUp');
    expect(await progressIn(workspace)).toBe(`1 / ${total}`);
    expect(await page.getByTestId('fullscreen-zoom-value').textContent()).toBe('100%');

    for (const key of ['r', 'R', 'Home', 'End']) {
      await page.keyboard.press(key);
      probe = await lastKey(page);
      expect(probe.prevented).toBe(false);
      expect(await progressIn(workspace)).toBe(`1 / ${total}`);
    }

    await page.keyboard.press('Space');
    await expect(workspace.getByTestId('play-btn')).toContainText('暂停');
    await page.keyboard.press('ArrowDown');
    expect(await progressIn(workspace)).toBe(`${total} / ${total}`);
    await expect(workspace.getByTestId('play-btn')).toContainText('播放');

    // Up resets animation, never zoom.
    await aimAtZoom(page, 1.5);
    await page.getByTestId('fullscreen-canvas').focus();
    await page.keyboard.press('ArrowUp');
    expect(await progressIn(workspace)).toBe(`1 / ${total}`);
    expect(await page.getByTestId('fullscreen-zoom-value').textContent()).toBe('150%');

    // The speed range keeps native arrow keys.
    await workspace.getByTestId('speed').focus();
    await page.keyboard.press('ArrowUp');
    probe = await lastKey(page);
    expect(probe.prevented).toBe(false);
    expect(await progressIn(workspace)).toBe(`1 / ${total}`);

    // 50% remains available for general visuals; further zoom-out is a no-op.
    await aimAtZoom(page, 0.5);
    await expect(page.getByTestId('fullscreen-zoom-out')).toBeDisabled();
    await page.keyboard.press('-');
    expect(await page.getByTestId('fullscreen-zoom-value').textContent()).toBe('50%');

    // A repeated Space keydown must not toggle twice.
    await page.getByTestId('fullscreen-canvas').focus();
    const beforeRepeat = await progressIn(workspace);
    await page.evaluate(() => {
      const target = document.activeElement ?? document.body;
      target.dispatchEvent(new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        bubbles: true,
        cancelable: true,
        repeat: true,
      }));
    });
    expect(await progressIn(workspace)).toBe(beforeRepeat);
    await expect(workspace.getByTestId('play-btn')).toContainText('播放');

    await page.getByTestId('fullscreen-exit').click();
    await expect(workspace).toHaveCount(0);
    expect(await progressIn(stagePanel)).toBe(`1 / ${total}`);
    await expect(page.getByTestId('run-input')).not.toHaveValue('');
  });

  test('visual scaling: shapes grow/shrink while every teaching text family keeps its rendered size', async ({ page }) => {
    test.setTimeout(600_000);
    const rows: Array<Record<string, unknown>> = [];

    const cases = [
      {
        id: 'bubble',
        shape: '.bar-item:first-child .bar',
        text: '.bar-item:first-child .bar span',
        rangeText: true,
        centered: false,
        minZoom: 0.5,
      },
      {
        id: 'linked',
        shape: '.linked-node',
        text: '.linked-node-data',
        rangeText: true,
        centered: false,
        preSteps: 2,
        minZoom: 0.75,
        pointers: ['.linked-head', '.linked-node-next-target'],
      },
      {
        id: 'inorder',
        shape: '.tree-node',
        text: '.tree-node-value',
        rangeText: true,
        centered: true,
        minZoom: 0.5,
      },
      {
        id: 'bfs',
        shape: '.graph-node[data-node-id="A"] .graph-node-body',
        text: '.graph-node[data-node-id="A"] .graph-node-label',
        rangeText: false,
        centered: true,
        minZoom: 0.5,
      },
      {
        id: 'dijkstra',
        shape: '.graph-node[data-node-id="A"] .graph-node-body',
        text: '[data-testid="graph-edge-weight"] text',
        rangeText: false,
        centered: false,
        minZoom: 0.5,
      },
      {
        id: 'bplus-tree',
        shape: '.bplus-node rect',
        text: '[data-testid="bplus-key"] text',
        rangeText: false,
        centered: false,
        minZoom: 0.75,
      },
      {
        id: 'free-list',
        shape: '.mem-segment',
        text: '.mem-segment-label',
        rangeText: false,
        centered: false,
        minZoom: 0.5,
      },
    ];

    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);

    for (const item of cases) {
      const total = await waitForAlgorithm(page, item.id);
      await page.setViewportSize({ width: 1280, height: 900 });
      const stagePanel = page.locator('.stage-panel');
      for (let step = 0; step < (item.preSteps ?? 0); step += 1) {
        await stagePanel.getByTestId('next-btn').click();
      }
      const beforeEntry = await progressIn(stagePanel);
      const runInput = page.locator('#run-input');
      const hasRunInput = (await runInput.count()) > 0;
      const inputBefore = hasRunInput ? await runInput.inputValue() : null;
      const workspace = await openFullscreen(page);
      expect(await progressIn(workspace)).toBe(beforeEntry);

      const metrics: Record<string, any> = {};
      for (const zoom of [1, 1.5, 2, item.minZoom]) {
        await aimAtZoom(page, zoom);
        await page.waitForTimeout(80);
        const measured = await page.evaluate(
          ({ shapeSelector, textSelector, useRange, pointerSelectors }) => {
            const root = document.querySelector('.fullscreen-world');
            const shape = root?.querySelector<SVGGraphicsElement>(shapeSelector);
            const text = root?.querySelector<Element>(textSelector);
            if (!shape || !text) return null;
            const pointerSizes = pointerSelectors.map((selector) => {
              const pointer = root?.querySelector<HTMLElement>(selector);
              if (!pointer) return null;
              const rect = pointer.getBoundingClientRect();
              return {
                w: rect.width,
                h: rect.height,
                fontPx: Number.parseFloat(getComputedStyle(pointer).fontSize),
                baseFont: Number.parseFloat(pointer.getAttribute('data-fullscreen-base-font') ?? '0'),
              };
            });
            const shapeRect = shape.getBoundingClientRect();
            const textRect = (() => {
              if (!useRange || !(text instanceof HTMLElement)) return text.getBoundingClientRect();
              const range = document.createRange();
              range.selectNodeContents(text);
              const rects = [...range.getClientRects()];
              if (!rects.length) return text.getBoundingClientRect();
              const left = Math.min(...rects.map((rect) => rect.left));
              const top = Math.min(...rects.map((rect) => rect.top));
              const right = Math.max(...rects.map((rect) => rect.right));
              const bottom = Math.max(...rects.map((rect) => rect.bottom));
              return new DOMRect(left, top, right - left, bottom - top);
            })();
            return {
              shape: {
                w: shapeRect.width,
                h: shapeRect.height,
                cx: shapeRect.left + shapeRect.width / 2,
                cy: shapeRect.top + shapeRect.height / 2,
              },
              text: {
                w: textRect.width,
                h: textRect.height,
                cx: textRect.left + textRect.width / 2,
                cy: textRect.top + textRect.height / 2,
              },
              fontPx: Number.parseFloat(getComputedStyle(text).fontSize),
              baseFont: Number.parseFloat(text.getAttribute('data-fullscreen-base-font') ?? '0'),
              pointerSizes,
            };
          },
          {
            shapeSelector: item.shape,
            textSelector: item.text,
            useRange: item.rangeText,
            pointerSelectors: item.pointers ?? [],
          },
        );
        expect(measured, `${item.id} @ ${zoom}`).not.toBeNull();
        metrics[String(zoom)] = measured;
        if (item.id === 'linked') await panShapeIntoCanvas(page, item.shape);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${item.id}-${String(zoom * 100)}.png` });
      }

      const base = metrics['1'];
      rows.push({
        algorithm: item.id,
        zoom: 1,
        textWidth: +base.text.w.toFixed(2),
        textHeight: +base.text.h.toFixed(2),
        boxWidth: +base.shape.w.toFixed(2),
        boxHeight: +base.shape.h.toFixed(2),
        localFont: +base.fontPx.toFixed(2),
      });
      for (const zoom of [1.5, 2, item.minZoom]) {
        const current = metrics[String(zoom)];
        if (item.id === 'linked') {
          const clipping = await page.evaluate(() => {
            const next = document.querySelector<HTMLElement>('.fullscreen-world .linked-node-next');
            if (!next) return null;
            const container = next.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(next);
            const rects = [...range.getClientRects()];
            if (!rects.length) return null;
            const left = Math.min(...rects.map((rect) => rect.left));
            const right = Math.max(...rects.map((rect) => rect.right));
            return { left, right, containerLeft: container.left, containerRight: container.right };
          });
          expect(clipping, 'linked next annotation exists').not.toBeNull();
          expect(clipping!.left, `linked next left clipping @ ${zoom}`).toBeGreaterThanOrEqual(
            clipping!.containerLeft - 1,
          );
          expect(clipping!.right, `linked next right clipping @ ${zoom}`).toBeLessThanOrEqual(
            clipping!.containerRight + 1,
          );
        }
        expect(Math.abs(current.text.w - base.text.w), `${item.id} text width @ ${zoom}`).toBeLessThanOrEqual(2.5);
        expect(Math.abs(current.text.h - base.text.h), `${item.id} text height @ ${zoom}`).toBeLessThanOrEqual(2.5);
        expect(current.fontPx, `${item.id} local font @ ${zoom}`).toBeCloseTo(current.baseFont / zoom, 2);
        expect(current.shape.w / base.shape.w, `${item.id} shape width @ ${zoom}`).toBeCloseTo(zoom, 2);
        expect(current.shape.h / base.shape.h, `${item.id} shape height @ ${zoom}`).toBeCloseTo(zoom, 2);
        if (item.pointers?.length) {
          for (let index = 0; index < item.pointers.length; index += 1) {
            const pointerBase = base.pointerSizes[index];
            const pointerCurrent = current.pointerSizes[index];
            expect(pointerBase, `${item.id} ${item.pointers[index]} base`).not.toBeNull();
            expect(pointerCurrent, `${item.id} ${item.pointers[index]} @ ${zoom}`).not.toBeNull();
            // Letter-spacing is part of the artwork's tracking, so width can
            // gain a few pixels; the glyph height and local font prove that the
            // text itself is not scaled by the parent transform.
            expect(Math.abs(pointerCurrent.h - pointerBase.h), `${item.id} ${item.pointers[index]} height @ ${zoom}`)
              .toBeLessThanOrEqual(2.5);
            expect(Math.abs(pointerCurrent.w - pointerBase.w), `${item.id} ${item.pointers[index]} width @ ${zoom}`)
              .toBeLessThanOrEqual(8);
            expect(pointerCurrent.fontPx, `${item.id} ${item.pointers[index]} font @ ${zoom}`)
              .toBeCloseTo(pointerCurrent.baseFont / zoom, 2);
          }
        }
        if (item.centered) {
          expect(Math.abs(current.text.cx - current.shape.cx), `${item.id} label x @ ${zoom}`).toBeLessThanOrEqual(4);
          expect(Math.abs(current.text.cy - current.shape.cy), `${item.id} label y @ ${zoom}`).toBeLessThanOrEqual(4);
        }
        rows.push({
          algorithm: item.id,
          zoom,
          textWidth: +current.text.w.toFixed(2),
          textHeight: +current.text.h.toFixed(2),
          boxWidth: +current.shape.w.toFixed(2),
          boxHeight: +current.shape.h.toFixed(2),
          localFont: +current.fontPx.toFixed(2),
        });
      }

      // The dense-text floor stops further zoom-out; general visuals stay at 50%.
      if (item.minZoom > 0.5) {
        await expect(page.getByTestId('fullscreen-zoom-out')).toBeDisabled();
        await page.keyboard.press('-');
        expect(await page.getByTestId('fullscreen-zoom-value').textContent()).toBe('75%');
      }

      // Fit still finds the complete structure after arbitrary zoom/pan.
      if (item.id === 'bplus-tree') {
        await page.getByTestId('fullscreen-fit').click();
        const fitted = await page.evaluate(() => {
          const canvas = document.querySelector('[data-testid="fullscreen-canvas"]')?.getBoundingClientRect();
          const art = document.querySelector('.fullscreen-world [data-testid="bplus-tree-visual"] svg')?.getBoundingClientRect();
          if (!canvas || !art) return null;
          return {
            zoom: document.querySelector('[data-testid="fullscreen-canvas"]')?.getAttribute('data-zoom'),
            withinCanvas:
              art.left >= canvas.left - 2 &&
              art.right <= canvas.right + 2 &&
              art.top >= canvas.top - 2 &&
              art.bottom <= canvas.bottom + 2,
          };
        });
        expect(fitted).not.toBeNull();
        expect(fitted?.withinCanvas, 'B+ tree fit').toBe(true);
      }
      expect(await progressIn(workspace)).toBe(beforeEntry);
      if (hasRunInput) {
        expect(await page.locator('#run-input').inputValue()).toBe(inputBefore);
      }
      await page.getByTestId('fullscreen-exit').click();
      await expect(workspace).toHaveCount(0);
      expect(await progressIn(stagePanel)).toBe(beforeEntry);
      if (hasRunInput) {
        expect(await page.locator('#run-input').inputValue()).toBe(inputBefore);
      }
    }

    writeFileSync(`${SCREENSHOT_DIR}/metrics.json`, JSON.stringify(rows, null, 2));
  });

  test('compact hints: five keys on one desktop row, wrapped without overflow at 390px, bilingual labels', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);
    await waitForAlgorithm(page, 'bubble', 25);
    await page.setViewportSize({ width: 1280, height: 900 });
    const workspace = await openFullscreen(page);

    const hint = workspace.getByTestId('keyboard-hint');
    await expect(hint).toBeVisible();
    const items = hint.locator('.keyboard-hint-item');
    await expect(items).toHaveCount(5);
    expect(await items.allTextContents()).toEqual([
      '←上一帧',
      '→下一帧',
      '↑重置',
      '↓末帧',
      'Space播放/暂停',
    ]);
    const allHintText = (await hint.textContent()) ?? '';
    expect(allHintText).not.toMatch(/\bR\b|\bHome\b|\bEnd\b/);

    const desktopBoxes = await items.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top };
      }),
    );
    const tops = desktopBoxes.map((box) => box.top);
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
    for (let index = 1; index < desktopBoxes.length; index += 1) {
      const gap = desktopBoxes[index].left - desktopBoxes[index - 1].right;
      expect(gap).toBeGreaterThanOrEqual(4);
      expect(gap).toBeLessThanOrEqual(9);
    }

    const controlSizes = await page.evaluate(() => {
      const play = document.querySelector('[data-testid="play-btn"]')?.getBoundingClientRect();
      const zoomIn = document.querySelector('[data-testid="fullscreen-zoom-in"]')?.getBoundingClientRect();
      return {
        play: play ? { w: play.width, h: play.height } : null,
        zoom: zoomIn ? { w: zoomIn.width, h: zoomIn.height } : null,
      };
    });
    expect(controlSizes.play?.h).toBeGreaterThanOrEqual(30);
    expect(controlSizes.zoom?.w).toBeGreaterThanOrEqual(28);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/hints-1280.png` });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    const workspaceVisible = await workspace.isVisible();
    expect(workspaceVisible).toBe(true);
    const mobile = await page.evaluate(() => {
      const hint = document.querySelector('[data-testid="keyboard-hint"]');
      const items = hint ? [...hint.querySelectorAll('.keyboard-hint-item')] : [];
      const rects = items.map((node) => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      return {
        viewport: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        visible: hint ? getComputedStyle(hint).display !== 'none' : false,
        rows: new Set(rects.map((rect) => Math.round(rect.top))).size,
        allInside: rects.every((rect) => rect.left >= -0.5 && rect.right <= window.innerWidth + 0.5),
        itemCount: rects.length,
        maxRight: Math.max(...rects.map((rect) => rect.right)),
        playHeight:
          document.querySelector('[data-testid="play-btn"]')?.getBoundingClientRect().height ?? 0,
      };
    });
    expect(mobile.visible).toBe(true);
    expect(mobile.itemCount).toBe(5);
    expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.viewport + 1);
    expect(mobile.allInside).toBe(true);
    expect(mobile.maxRight).toBeLessThanOrEqual(mobile.viewport + 1);
    expect(mobile.playHeight).toBeGreaterThanOrEqual(30);
    expect(mobile.rows).toBeGreaterThanOrEqual(1);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/hints-390.png` });

    await page.getByTestId('fullscreen-exit').click();
    await expect(workspace).toHaveCount(0);
    const normalHint = page.locator('.stage-panel').getByTestId('keyboard-hint');
    await expect(normalHint).toBeVisible();
    await expect(normalHint.locator('.keyboard-hint-item')).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);

    await page.evaluate(() => window.localStorage.setItem('algolens-lang', 'en'));
    await page.reload();
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('.stage-panel').getByTestId('keyboard-hint')).toContainText('Previous frame');
    await expect(page.locator('.stage-panel').getByTestId('keyboard-hint')).toContainText('Next frame');
    await expect(page.locator('.stage-panel').getByTestId('keyboard-hint')).toContainText('Reset');
    await expect(page.locator('.stage-panel').getByTestId('keyboard-hint')).toContainText('Last frame');
    await expect(page.locator('.stage-panel').getByTestId('keyboard-hint')).toContainText('Play/Pause');
  });
});
