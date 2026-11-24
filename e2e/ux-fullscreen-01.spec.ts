import { mkdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import {
  collapseAlgorithmGuide,
  expect,
  selectAlgorithm,
  test,
  type Page,
} from './fixtures';

const SCREENSHOT_DIR = 'test-results/fullscreen01';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function waitForAlgorithm(page: Page, id: string, total?: number): Promise<number> {
  await selectAlgorithm(page, id);
  await expect(page.getByTestId('visual-stage')).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('progress')).toHaveText(
    total === undefined ? /^1 \/ \d+$/ : new RegExp(`^1 / ${total}$`),
    { timeout: 90_000 },
  );
  const progress = (await page.getByTestId('progress').textContent()) ?? '1 / 0';
  return Number(progress.split('/')[1]?.trim());
}

async function disableNativeFullscreen(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const name of ['requestFullscreen', 'webkitRequestFullscreen']) {
      Object.defineProperty(document.documentElement, name, {
        configurable: true,
        value: undefined,
      });
    }
  });
}

async function openFullscreen(page: Page, method: 'click' | 'keyboard' = 'click') {
  const opener = page.getByTestId('fullscreen-open-btn');
  await expect(opener).toBeEnabled({ timeout: 60_000 });
  if (method === 'keyboard') {
    await opener.focus();
    await page.keyboard.press('Enter');
  } else {
    await opener.click();
  }
  const workspace = page.getByTestId('fullscreen-workspace');
  await expect(workspace).toBeVisible({ timeout: 10_000 });
  await expect(workspace.getByTestId('visual-stage')).toBeVisible();
  await expect(page.getByTestId('fullscreen-canvas')).toHaveAttribute('data-zoom', '1');
  return workspace;
}

async function zoomValue(page: Page): Promise<number> {
  const value = await page.getByTestId('fullscreen-canvas').getAttribute('data-zoom');
  return Number(value);
}

async function clickZoomIn(page: Page, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const button = page.getByTestId('fullscreen-zoom-in');
    if (await button.isDisabled()) return;
    await button.click();
  }
}

async function clickZoomOut(page: Page, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const button = page.getByTestId('fullscreen-zoom-out');
    if (await button.isDisabled()) return;
    await button.click();
  }
}

test.describe('UX-FULLSCREEN-01', () => {
  test('native fullscreen keeps the exact frame, input and trace across entry and exit', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    const total = await waitForAlgorithm(page, 'bubble', 25);
    await page.setViewportSize({ width: 1280, height: 900 });

    const stagePanel = page.locator('.stage-panel');
    for (let index = 0; index < 11; index += 1) {
      await stagePanel.getByTestId('next-btn').click();
    }
    await expect(stagePanel.getByTestId('progress')).toHaveText(`12 / ${total}`);
    const inputBefore = await page.getByTestId('run-input').inputValue();

    const workspace = await openFullscreen(page);
    await expect(workspace.getByTestId('progress')).toHaveText(`12 / ${total}`);
    await expect(page.getByTestId('run-input')).toHaveValue(inputBefore);
    await expect(workspace).toHaveAttribute('data-mode', /native|overlay/);

    await workspace.getByTestId('next-btn').click();
    await workspace.getByTestId('next-btn').click();
    await expect(workspace.getByTestId('progress')).toHaveText(`14 / ${total}`);
    await expect(stagePanel.getByTestId('progress')).toHaveText(`14 / ${total}`);

    await workspace.getByTestId('scrub').evaluate((node, value) => {
      const input = node as HTMLInputElement;
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      nativeSetter?.call(input, String(value));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, 17);
    await expect(workspace.getByTestId('progress')).toHaveText(`18 / ${total}`);
    await expect(stagePanel.getByTestId('progress')).toHaveText(`18 / ${total}`);

    await page.getByTestId('fullscreen-exit').click();
    await expect(workspace).toHaveCount(0, { timeout: 10_000 });
    await expect(stagePanel.getByTestId('progress')).toHaveText(`18 / ${total}`);
    await expect(page.getByTestId('run-input')).toHaveValue(inputBefore);
    await expect(page.getByTestId('lab-workbench')).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  });

  test('uses the real Fullscreen API and syncs when the browser exits it', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await waitForAlgorithm(page, 'bubble', 25);
    await page.setViewportSize({ width: 1280, height: 900 });

    const supported = await page.evaluate(() => typeof document.documentElement.requestFullscreen === 'function');
    test.skip(!supported, 'This browser does not expose the Fullscreen API');

    const workspace = await openFullscreen(page);
    await expect(workspace).toHaveAttribute('data-mode', 'native', { timeout: 10_000 });
    expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);

    await page.evaluate(() => document.exitFullscreen());
    await expect(workspace).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByTestId('lab-workbench')).toBeVisible();
    await expect(page.getByTestId('fullscreen-open-btn')).toBeVisible();
    await expect(page.getByTestId('fullscreen-open-btn')).toBeFocused();
  });

  test('falls back to the modal overlay and exits with Escape without touching playback', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);
    const total = await waitForAlgorithm(page, 'inorder');
    const workspace = await openFullscreen(page);
    await expect(workspace).toHaveAttribute('data-mode', 'overlay');
    expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);

    await clickZoomIn(page, 2);
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('150%');
    await page.keyboard.press('Escape');
    await expect(workspace).toHaveCount(0);
    await expect(page.getByTestId('lab-workbench')).toBeVisible();
    await expect(page.getByTestId('progress')).toHaveText(`1 / ${total}`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('fullscreen-scroll-lock'))).toBe(false);
    await expect(page.getByTestId('fullscreen-open-btn')).toBeFocused();
  });

  test('reuses playback shortcuts and supports the zoom keys inside fullscreen', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);
    const total = await waitForAlgorithm(page, 'bubble', 25);
    await page.setViewportSize({ width: 1280, height: 900 });

    const workspace = await openFullscreen(page);
    await page.getByTestId('fullscreen-canvas').focus();
    await page.keyboard.press('ArrowRight');
    await expect(workspace.getByTestId('progress')).toHaveText(`2 / ${total}`);
    await page.keyboard.press('End');
    await expect(workspace.getByTestId('progress')).toHaveText(`${total} / ${total}`);
    await page.keyboard.press('Home');
    await expect(workspace.getByTestId('progress')).toHaveText(`1 / ${total}`);
    await page.keyboard.press('Space');
    await expect(workspace.getByTestId('play-btn')).toContainText('暂停');
    await page.keyboard.press('Space');
    await expect(workspace.getByTestId('play-btn')).toContainText('播放');

    await page.keyboard.press('Shift+=');
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('125%');
    await page.keyboard.press('-');
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('100%');
    await page.keyboard.press('Shift+ArrowRight');
    expect(await page.getByTestId('fullscreen-canvas').getAttribute('data-pan-x')).not.toBe('0');
    await page.keyboard.press('0');
    expect(await page.getByTestId('fullscreen-canvas').getAttribute('data-pan-x')).toBe('0');

    await clickZoomIn(page, 2);
    await page.keyboard.press('r');
    await expect(workspace.getByTestId('progress')).toHaveText(`1 / ${total}`);
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('150%');
    await page.keyboard.press('0');
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('100%');

    await page.keyboard.press('Escape');
    await expect(workspace).toHaveCount(0);
  });

  test('keeps the fullscreen entry off pure theory pages', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await page.getByTestId('mobile-algo-select').selectOption('concept:file-comparison');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('fullscreen-open-btn')).toHaveCount(0);
  });

  test('zooms, pans, refits, rejects non-finite geometry and captures the wide B+ tree', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);
    const total = await waitForAlgorithm(page, 'bplus-tree');
    await page.setViewportSize({ width: 1280, height: 900 });
    await collapseAlgorithmGuide(page);
    await page.locator('.stage-panel').scrollIntoViewIfNeeded();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/normal-1280.png` });
    const workspace = await openFullscreen(page);
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('100%');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fullscreen-100-1280.png` });

    await clickZoomIn(page, 2);
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('150%');
    expect(await zoomValue(page)).toBe(1.5);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fullscreen-150-bplus.png` });

    const wheelResult = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLElement>('[data-testid="fullscreen-canvas"]')!;
      const rect = canvas.getBoundingClientRect();
      const plain = new WheelEvent('wheel', {
        deltaY: -180,
        clientX: rect.left + rect.width * 0.7,
        clientY: rect.top + rect.height * 0.45,
        bubbles: true,
        cancelable: true,
      });
      canvas.dispatchEvent(plain);
      const before = Number(canvas.dataset.zoom);
      const withCtrl = new WheelEvent('wheel', {
        deltaY: -180,
        ctrlKey: true,
        clientX: rect.left + rect.width * 0.7,
        clientY: rect.top + rect.height * 0.45,
        bubbles: true,
        cancelable: true,
      });
      canvas.dispatchEvent(withCtrl);
      return {
        plainPrevented: plain.defaultPrevented,
        ctrlPrevented: withCtrl.defaultPrevented,
        before,
        after: Number(canvas.dataset.zoom),
      };
    });
    expect(wheelResult.plainPrevented).toBe(false);
    expect(wheelResult.ctrlPrevented).toBe(true);
    expect(wheelResult.after).toBeGreaterThan(wheelResult.before);

    await page.getByTestId('fullscreen-zoom-value').click();
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('100%');
    await clickZoomIn(page, 20);
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('300%');
    await expect(page.getByTestId('fullscreen-zoom-in')).toBeDisabled();
    await clickZoomOut(page, 40);
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('50%');
    await expect(page.getByTestId('fullscreen-zoom-out')).toBeDisabled();

    await page.getByTestId('fullscreen-zoom-value').click();
    await clickZoomIn(page, 4);
    const beforePan = await page.getByTestId('fullscreen-canvas').evaluate((canvas) => ({
      x: Number((canvas as HTMLElement).dataset.panX),
      y: Number((canvas as HTMLElement).dataset.panY),
    }));
    await page.getByTestId('fullscreen-canvas').evaluate((canvas) => {
      const rect = canvas.getBoundingClientRect();
      const base = {
        bubbles: true,
        cancelable: true,
        pointerId: 41,
        pointerType: 'mouse',
        button: 0,
        clientX: rect.left + 80,
        clientY: rect.top + 80,
      };
      canvas.dispatchEvent(new PointerEvent('pointerdown', base));
      canvas.dispatchEvent(new PointerEvent('pointermove', { ...base, clientX: base.clientX + 70, clientY: base.clientY + 45 }));
      canvas.dispatchEvent(new PointerEvent('pointerup', { ...base, clientX: base.clientX + 70, clientY: base.clientY + 45 }));
    });
    const afterPan = await page.getByTestId('fullscreen-canvas').evaluate((canvas) => ({
      x: Number((canvas as HTMLElement).dataset.panX),
      y: Number((canvas as HTMLElement).dataset.panY),
    }));
    expect(afterPan.x).toBeGreaterThan(beforePan.x);
    expect(afterPan.y).toBeGreaterThan(beforePan.y);
    await expect(workspace.getByTestId('progress')).toHaveText(`1 / ${total}`);

    await page.getByTestId('fullscreen-fit').click();
    expect(await zoomValue(page)).toBeGreaterThanOrEqual(0.5);
    expect(await zoomValue(page)).toBeLessThanOrEqual(3);
    expect(await zoomValue(page)).toBeGreaterThan(1.1);
    expect(Number.isFinite(await zoomValue(page))).toBe(true);
    const nodeBounds = await workspace.getByTestId('bplus-node').evaluateAll((nodes) => {
      const canvas = document.querySelector<HTMLElement>('[data-testid="fullscreen-canvas"]')!;
      const canvasRect = canvas.getBoundingClientRect();
      return nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          canvasLeft: canvasRect.left,
          canvasRight: canvasRect.right,
          canvasTop: canvasRect.top,
          canvasBottom: canvasRect.bottom,
        };
      });
    });
    expect(nodeBounds.length).toBeGreaterThanOrEqual(4);
    for (const bounds of nodeBounds) {
      expect(bounds.left).toBeGreaterThanOrEqual(bounds.canvasLeft - 1);
      expect(bounds.right).toBeLessThanOrEqual(bounds.canvasRight + 1);
      expect(bounds.top).toBeGreaterThanOrEqual(bounds.canvasTop - 1);
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.canvasBottom + 1);
    }
    const beforeNodeClick = await page.getByTestId('fullscreen-canvas').evaluate((canvas) => ({
      zoom: (canvas as HTMLElement).dataset.zoom,
      panX: (canvas as HTMLElement).dataset.panX,
      panY: (canvas as HTMLElement).dataset.panY,
    }));
    await workspace.getByTestId('bplus-node').first().click();
    await expect(workspace.getByTestId('progress')).toHaveText(`1 / ${total}`);
    const afterNodeClick = await page.getByTestId('fullscreen-canvas').evaluate((canvas) => ({
      zoom: (canvas as HTMLElement).dataset.zoom,
      panX: (canvas as HTMLElement).dataset.panX,
      panY: (canvas as HTMLElement).dataset.panY,
    }));
    expect(afterNodeClick).toEqual(beforeNodeClick);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fullscreen-fit-bplus.png` });
    const fitAttributes = await page.getByTestId('fullscreen-canvas').evaluate((canvas) => ({
      zoom: (canvas as HTMLElement).dataset.zoom,
      panX: (canvas as HTMLElement).dataset.panX,
      panY: (canvas as HTMLElement).dataset.panY,
    }));
    expect(fitAttributes.zoom).not.toMatch(/NaN|Infinity/);
    expect(fitAttributes.panX).not.toMatch(/NaN|Infinity/);
    expect(fitAttributes.panY).not.toMatch(/NaN|Infinity/);

    await page.getByTestId('fullscreen-zoom-value').click();
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('100%');
    expect(await page.getByTestId('fullscreen-canvas').getAttribute('data-pan-x')).toBe('0');
    expect(await page.getByTestId('fullscreen-canvas').getAttribute('data-pan-y')).toBe('0');
  });

  test('covers sorting, linked list, tree, graph, string, indexed, memory and file structures', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);

    const cases = [
      'bubble',
      'circular',
      'inorder',
      'bfs',
      'kmp',
      'bplus-tree',
      'btree',
      'free-list',
      'multiway',
      'file-index',
    ];
    for (const id of cases) {
      await waitForAlgorithm(page, id);
      const workspace = await openFullscreen(page);
      await expect(workspace.getByTestId('visual-stage')).toBeVisible();
      await expect(workspace).toHaveAttribute('data-mode', 'overlay');

      await clickZoomIn(page, 1);
      await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('125%');
      const before = (await workspace.getByTestId('progress').textContent()) ?? '1 / 0';
      const beforeFrame = Number(before.split('/')[0]?.trim());
      const totalFrames = Number(before.split('/')[1]?.trim());
      if (beforeFrame < totalFrames) {
        await workspace.getByTestId('next-btn').click();
        await expect(workspace.getByTestId('progress')).toHaveText(`${beforeFrame + 1} / ${totalFrames}`);
      }
      await page.getByTestId('fullscreen-fit').click();
      expect(await zoomValue(page)).toBeGreaterThanOrEqual(0.5);
      expect(await zoomValue(page)).toBeLessThanOrEqual(3);
      await page.getByTestId('fullscreen-exit').click();
      await expect(workspace).toHaveCount(0);
      await expect(page.getByTestId('lab-workbench')).toBeVisible();
    }
  });

  test('remains usable at 390, 768 and 1440 with wide and tall structures', async ({ page }) => {
    test.setTimeout(420_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);

    await waitForAlgorithm(page, 'bfs');
    const bfsTotal = Number(
      ((await page.getByTestId('progress').textContent()) ?? '1 / 0').split('/')[1]?.trim(),
    );
    await collapseAlgorithmGuide(page);
    await page.locator('.stage-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/normal-390-bfs.png` });
    let workspace = await openFullscreen(page);
    await expect(page.getByTestId('fullscreen-zoom-value')).toBeVisible();
    await expect(page.getByTestId('fullscreen-fit')).toBeVisible();
    await expect(page.getByTestId('fullscreen-exit')).toBeVisible();
    await expect(page.getByTestId('fullscreen-fit')).toHaveAttribute('aria-label', '适应屏幕');
    await expect(page.getByTestId('fullscreen-exit')).toHaveAttribute('aria-label', '退出全屏');
    await expect(workspace.locator('.timeline-hint')).toBeHidden();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= 391),
    ).toBe(true);
    const bounds390 = await page.getByTestId('fullscreen-workspace').evaluate((workspaceElement) => {
      const rect = workspaceElement.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    });
    expect(bounds390.left).toBeGreaterThanOrEqual(0);
    expect(bounds390.right).toBeLessThanOrEqual(390.5);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fullscreen-390-bfs.png` });
    await page.getByTestId('fullscreen-fit').click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fullscreen-390-bfs-fit.png` });
    const graphFit = await workspace.getByTestId('graph-canvas-scroll').evaluate((scroller) => ({
      scrollWidth: scroller.scrollWidth,
      clientWidth: scroller.clientWidth,
    }));
    expect(graphFit.scrollWidth).toBeLessThanOrEqual(graphFit.clientWidth + 1);

    await workspace.getByTestId('scrub').evaluate((node, value) => {
      const input = node as HTMLInputElement;
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      nativeSetter?.call(input, String(value));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, bfsTotal - 1);
    await expect(workspace.getByTestId('progress')).toHaveText(`${bfsTotal} / ${bfsTotal}`);
    const mobileLayout = await workspace.evaluate((root) => {
      const canvas = root.querySelector('[data-testid="fullscreen-canvas"]')?.getBoundingClientRect();
      const bottom = root.querySelector('[data-testid="fullscreen-bottom"]')?.getBoundingClientRect();
      return {
        canvasHeight: canvas?.height ?? 0,
        canvasBottom: canvas?.bottom ?? 0,
        bottomTop: bottom?.top ?? 0,
        bottomBottom: bottom?.bottom ?? 0,
        viewportHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    expect(mobileLayout.canvasHeight).toBeGreaterThan(200);
    expect(mobileLayout.canvasBottom).toBeLessThanOrEqual(mobileLayout.bottomTop + 1);
    expect(mobileLayout.bottomBottom).toBeLessThanOrEqual(mobileLayout.viewportHeight + 1);
    expect(mobileLayout.scrollWidth).toBeLessThanOrEqual(391);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByTestId('fullscreen-fit').click();
    expect(await zoomValue(page)).toBeGreaterThanOrEqual(0.5);
    expect(await zoomValue(page)).toBeLessThanOrEqual(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= 1441)).toBe(true);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fullscreen-1440-bfs.png` });
    await page.getByTestId('fullscreen-exit').click();
    await expect(workspace).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await waitForAlgorithm(page, 'free-list');
    workspace = await openFullscreen(page);
    await page.getByTestId('fullscreen-fit').click();
    expect(await zoomValue(page)).toBeGreaterThanOrEqual(0.5);
    expect(await zoomValue(page)).toBeLessThanOrEqual(3);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= 391),
    ).toBe(true);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fullscreen-390-free-list.png` });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.getByTestId('fullscreen-fit').click();
    await expect(page.getByTestId('fullscreen-toolbar')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= 769)).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByTestId('fullscreen-fit').click();
    await expect(page.getByTestId('fullscreen-bottom')).toBeVisible();
    await page.getByTestId('fullscreen-exit').click();
    await expect(workspace).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await waitForAlgorithm(page, 'bplus-tree');
    workspace = await openFullscreen(page);
    await page.getByTestId('fullscreen-fit').click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fullscreen-390-bplus-fit.png` });
    const bplusFit = await workspace.locator('.bplus-canvas-scroll').evaluate((scroller) => ({
      scrollWidth: scroller.scrollWidth,
      clientWidth: scroller.clientWidth,
    }));
    expect(bplusFit.scrollWidth).toBeLessThanOrEqual(bplusFit.clientWidth + 1);
    await page.getByTestId('fullscreen-exit').click();
    await expect(workspace).toHaveCount(0);
  });

  test('has bilingual labels, trapped focus, Escape exit and no WCAG A/AA violations', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/?view=lab');
    await page.evaluate(() => window.localStorage.setItem('algolens-lang', 'en'));
    await page.reload();
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);
    await waitForAlgorithm(page, 'bubble', 25);

    const workspace = await openFullscreen(page, 'keyboard');
    await expect(page.getByTestId('fullscreen-exit')).toContainText('Exit fullscreen');
    await expect(page.getByTestId('fullscreen-fit')).toContainText('Fit to screen');
    await expect(page.getByTestId('fullscreen-zoom-in')).toHaveAttribute('aria-label', 'Zoom in');
    await expect(page.getByTestId('fullscreen-zoom-out')).toHaveAttribute('aria-label', 'Zoom out');
    await expect(page.getByTestId('fullscreen-pan-hint')).toContainText('Drag to pan');

    expect(
      await page.evaluate(() => {
        const active = document.activeElement;
        const toolbar = document.querySelector('.fullscreen-toolbar-focus');
        return Boolean(active && toolbar && toolbar.contains(active));
      }),
    ).toBe(true);
    for (let index = 0; index < 12; index += 1) await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => Boolean(document.activeElement?.closest('[data-testid="fullscreen-workspace"]'))),
    ).toBe(true);

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('[data-testid="fullscreen-workspace"]')
      .analyze();
    expect(
      axe.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) })),
      'fullscreen accessibility violations',
    ).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(workspace).toHaveCount(0);
    await expect(page.getByTestId('fullscreen-open-btn')).toBeFocused();
  });

  test('does not install a second playback interval when entering fullscreen while playing', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);
    const total = await waitForAlgorithm(page, 'bubble', 25);
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.evaluate(() => {
      const original = window.setInterval.bind(window);
      const marker = window as Window & { __fullscreenIntervalCalls?: number };
      marker.__fullscreenIntervalCalls = 0;
      window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
        marker.__fullscreenIntervalCalls = (marker.__fullscreenIntervalCalls ?? 0) + 1;
        return original(handler, timeout, ...args);
      }) as typeof window.setInterval;
    });

    await page.locator('.stage-panel').getByTestId('play-btn').click();
    await expect(page.locator('.stage-panel').getByTestId('play-btn')).toHaveText(/暂停/);
    await page.waitForTimeout(300);
    const intervalsBefore = await page.evaluate(() => (window as Window & { __fullscreenIntervalCalls?: number }).__fullscreenIntervalCalls ?? 0);
    expect(intervalsBefore).toBeGreaterThan(0);

    const workspace = await openFullscreen(page);
    await expect(workspace.getByTestId('play-btn')).toHaveText(/暂停/);
    const intervalsAfter = await page.evaluate(() => (window as Window & { __fullscreenIntervalCalls?: number }).__fullscreenIntervalCalls ?? 0);
    expect(intervalsAfter).toBe(intervalsBefore);

    const frameBefore = Number(((await workspace.getByTestId('progress').textContent()) ?? '1 / 0').split('/')[0]?.trim());
    await workspace.getByTestId('next-btn').click();
    await expect(workspace.getByTestId('play-btn')).toHaveText(/播放/);
    await workspace.getByTestId('fullscreen-exit').click();
    const progressAfter = (await page.locator('.stage-panel').getByTestId('progress').textContent()) ?? '1 / 0';
    const frameAfter = Number(progressAfter.split('/')[0]?.trim());
    expect(frameAfter).toBeGreaterThanOrEqual(frameBefore);
    expect(frameAfter).toBeLessThanOrEqual(total);
    expect(intervalsAfter).toBe(intervalsBefore);
  });
});

test.describe('UX-FULLSCREEN-01 touch', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('opens, zooms, pans and exits with touch', async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await disableNativeFullscreen(page);
    const total = await waitForAlgorithm(page, 'bfs');

    await page.getByTestId('fullscreen-open-btn').tap();
    const workspace = page.getByTestId('fullscreen-workspace');
    await expect(workspace).toBeVisible();
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('100%');

    await page.getByTestId('fullscreen-zoom-in').tap();
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('125%');
    await page.getByTestId('fullscreen-zoom-out').tap();
    await expect(page.getByTestId('fullscreen-zoom-value')).toHaveText('100%');
    await page.getByTestId('fullscreen-fit').tap();

    expect(await zoomValue(page)).toBeGreaterThanOrEqual(0.5);
    expect(await zoomValue(page)).toBeLessThanOrEqual(3);
    const beforePan = await page.getByTestId('fullscreen-canvas').getAttribute('data-pan-x');
    await page.getByTestId('fullscreen-canvas').evaluate((canvas) => {
      const rect = canvas.getBoundingClientRect();
      const touches = (x: number, y: number) => [
        new Touch({ identifier: 3, target: canvas, clientX: x, clientY: y }),
      ];
      const start = touches(rect.left + 70, rect.top + rect.height * 0.68);
      canvas.dispatchEvent(new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: start,
        targetTouches: start,
        changedTouches: start,
      }));
      const move = touches(rect.left + 130, rect.top + rect.height * 0.68 + 35);
      canvas.dispatchEvent(new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: move,
        targetTouches: move,
        changedTouches: move,
      }));
      canvas.dispatchEvent(new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        touches: [],
        targetTouches: [],
        changedTouches: move,
      }));
    });
    expect(await page.getByTestId('fullscreen-canvas').getAttribute('data-pan-x')).not.toBe(beforePan);
    await expect(workspace.getByTestId('progress')).toHaveText(new RegExp(`^1 / ${total}$`));

    await page.getByTestId('fullscreen-exit').tap();
    await expect(workspace).toHaveCount(0);
    await expect(page.getByTestId('lab-workbench')).toBeVisible();
  });
});
