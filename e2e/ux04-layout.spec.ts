import { collapseAlgorithmGuide, expect, openAdvancedPanels, selectAlgorithm, test, type Page } from './fixtures';

/**
 * GLOBAL-SCROLL acceptance.
 *
 * The learn view is one document. The directory, learning rail and lesson
 * steps may be taller than the viewport; they must not become nested scroll
 * boxes. Canvas panning inside a graph/tree remains a local browsing surface.
 */

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

async function openDijkstra(page: Page) {
  await selectAlgorithm(page, 'dijkstra');
  await expect(page.locator('[data-testid="graph-visual"][data-algorithm="dijkstra"]')).toBeVisible({
    timeout: 180_000,
  });
  await collapseAlgorithmGuide(page);
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
}

test.describe('GLOBAL-SCROLL — one document scroll', () => {
  test('1440 keeps a bounded catalogue with a pinned header and scrolling chapter list', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    const directoryToggle = page.getByTestId('sidebar-toggle-all');
    if ((await directoryToggle.getAttribute('data-expanded')) === 'true') {
      await directoryToggle.click();
    }
    await directoryToggle.click();
    await expect(directoryToggle).toHaveAttribute('data-expanded', 'true');
    await page.waitForTimeout(250);

    const data = await page.evaluate(() => {
      const node = document.querySelector<HTMLElement>('[data-testid="sidebar"]');
      const nav = document.querySelector<HTMLElement>('.textbook-nav');
      const head = document.querySelector<HTMLElement>('.sidebar-head');
      if (!node || !nav || !head) return null;
      const style = getComputedStyle(node);
      const navStyle = getComputedStyle(nav);
      const box = node.getBoundingClientRect();
      return {
        innerHeight: window.innerHeight,
        height: Math.round(box.height),
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        overflowY: style.overflowY,
        navOverflowY: navStyle.overflowY,
        navClientHeight: nav.clientHeight,
        navScrollHeight: nav.scrollHeight,
        headTop: Math.round(head.getBoundingClientRect().top),
        headBorder: getComputedStyle(head).backgroundColor,
      };
    });

    expect(data).not.toBeNull();
    expect(data!.height).toBeLessThan(data!.innerHeight);
    expect(data!.top).toBeGreaterThanOrEqual(0);
    expect(data!.bottom).toBeLessThanOrEqual(data!.innerHeight + 1);
    expect(data!.overflowY).toBe('hidden');
    expect(data!.navOverflowY).toBe('auto');
    expect(data!.navScrollHeight).toBeGreaterThan(data!.navClientHeight + 100);
    expect(data!.headBorder).not.toBe('rgba(0, 0, 0, 0)');

    // Wheel over the chapter list scrolls the list; the page and title stay put.
    const box = await page.getByTestId('sidebar').boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 220);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(300);
    const independent = await page.evaluate(() => ({
      windowY: window.scrollY,
      sidebarScrollTop: document.querySelector('[data-testid="sidebar"]')?.scrollTop ?? 0,
      navScrollTop: document.querySelector<HTMLElement>('.textbook-nav')?.scrollTop ?? 0,
      headTop: Math.round(document.querySelector<HTMLElement>('.sidebar-head')?.getBoundingClientRect().top ?? -1),
    }));
    expect(independent.windowY).toBe(0);
    expect(independent.sidebarScrollTop).toBe(0);
    expect(independent.navScrollTop).toBeGreaterThan(0);
    expect(independent.headTop).toBe(data!.headTop);

    // Global page scrolling leaves the whole catalogue below the sticky top bar.
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(250);
    const fixed = await page.evaluate(() => ({
      windowY: window.scrollY,
      sidebarTop: Math.round(
        document.querySelector('[data-testid="sidebar"]')?.getBoundingClientRect().top ?? 0,
      ),
      topbarHeight: Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--topbar-height'),
      ) || 0,
    }));
    expect(fixed.windowY).toBeGreaterThan(0);
    expect(fixed.sidebarTop).toBeGreaterThanOrEqual(Math.round(fixed.topbarHeight) + 8);
    expect(fixed.sidebarTop).toBeLessThanOrEqual(Math.round(fixed.topbarHeight) + 18);
  });

  test('1366, 1024 and 390 keep vertical page scroll only', async ({ page }) => {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/?view=lab');
      await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
      await openDijkstra(page);
      const sizes = await horizontalOverflow(page);
      expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);

      await page.locator('.stage-playback').scrollIntoViewIfNeeded();
      await expect(page.locator('.stage-playback')).toBeVisible();
      const dock = await page.locator('[data-testid="code-dock"]').boundingBox();
      expect(dock?.width ?? 0).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('guide start keeps the frame, trace and run feedback', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.locator('[data-testid="graph-visual"][data-algorithm="dijkstra"]')).toBeVisible({ timeout: 180_000 });
    await collapseAlgorithmGuide(page);
    await setFrame(page, 12);

    await page.getByTestId('guide-toggle').click();
    await expect(page.getByTestId('algorithm-guide')).toBeVisible();
    const progress = await page.getByTestId('progress').innerText();
    const step = await page.getByTestId('step-number').innerText();
    const feedback = await page.getByTestId('run-feedback').innerText();

    await page.getByTestId('guide-start').click();
    await expect(page.getByTestId('algorithm-guide')).toHaveCount(0);
    expect(await page.getByTestId('progress').innerText()).toBe(progress);
    expect(await page.getByTestId('step-number').innerText()).toBe(step);
    expect(await page.getByTestId('run-feedback').innerText()).toBe(feedback);
  });

  test('open reference keeps the frame and the compact run bar', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.locator('[data-testid="graph-visual"][data-algorithm="dijkstra"]')).toBeVisible({ timeout: 180_000 });
    await collapseAlgorithmGuide(page);
    const progress = await page.getByTestId('progress').innerText();
    const current = await page.getByTestId('current-step').innerText();

    await openAdvancedPanels(page);
    await expect(page.getByTestId('workspace-panel-reference')).toBeVisible();
    await expect(page.getByTestId('reference-code-panel')).toBeVisible();
    await expect(page.getByTestId('run-btn')).toBeVisible();
    expect(await page.getByTestId('progress').innerText()).toBe(progress);
    expect(await page.getByTestId('current-step').innerText()).toBe(current);

    // The run bar stays in the document; it is not a floating sticky header.
    const dockPosition = await page.getByTestId('code-dock').evaluate((node) => getComputedStyle(node).position);
    expect(dockPosition).not.toBe('sticky');

    // The reference sheet is globally expanded, like the teaching guide.
    await expect(page.locator('[data-testid="reference-code-viewer"] .monaco-editor')).toBeVisible({
      timeout: 20_000,
    });
    const viewer = await page.getByTestId('reference-code-viewer').evaluate((node) => ({
      height: Math.round(node.getBoundingClientRect().height),
      overflowY: getComputedStyle(node).overflowY,
    }));
    expect(viewer.height).toBeGreaterThan(700);
    expect(viewer.overflowY).toBe('visible');

    // Wheel over the code scrolls the page, not a nested code box.
    await page.getByTestId('reference-code-viewer').scrollIntoViewIfNeeded();
    const beforeWheel = await page.evaluate(() => window.scrollY);
    const codeBox = await page.getByTestId('reference-code-viewer').boundingBox();
    expect(codeBox).not.toBeNull();
    await page.mouse.move((codeBox?.x ?? 0) + 280, (codeBox?.y ?? 0) + 160);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(350);
    const afterWheel = await page.evaluate(() => window.scrollY);
    expect(afterWheel).toBeGreaterThan(beforeWheel + 100);
  });

  test('collapsing the directory never resets the trace or frame', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await openDijkstra(page);
    await setFrame(page, 27);
    const progress = await page.getByTestId('progress').innerText();

    await page.getByTestId('sidebar-collapse').click();
    await expect(page.locator('[data-testid="learn-view"]')).toHaveClass(/nav-collapsed/);
    expect(await page.getByTestId('progress').innerText()).toBe(progress);
    await page.getByTestId('sidebar-expand').click();
    expect(await page.getByTestId('progress').innerText()).toBe(progress);
  });
});
