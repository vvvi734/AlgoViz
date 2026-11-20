import { expect, selectAlgorithm, collapseAlgorithmGuide, test, type Page } from './fixtures';

const CASES = [
  { id: 'huffman', frame: 28, total: 29, visual: 'huffman-visual', shot: 'huffman' },
  { id: 'inorder', frame: 10, total: 30, visual: 'tree-visual', shot: 'tree' },
  { id: 'floyd-warshall', frame: 35, total: 87, visual: 'floyd-stage', shot: 'floyd' },
  { id: 'critical-path', frame: 14, total: 22, visual: 'critical-stage', shot: 'aoe' },
] as const;

async function openAt(page: Page, item: (typeof CASES)[number]) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await selectAlgorithm(page, item.id);
  await expect(page.getByTestId(item.visual)).toBeVisible({ timeout: 60_000 });
  await collapseAlgorithmGuide(page);
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, item.frame);
  await expect(page.getByTestId('progress')).toHaveText(`${item.frame + 1} / ${item.total}`);
  await page.waitForTimeout(120);
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
}

test.describe('UIX-V02 visual guide and stage de-cluttering', () => {
  test('guide stays compact inside key state on all four priority pages', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const item of CASES) {
      await openAt(page, item);
      const guide = page.getByTestId('visual-guide');
      await expect(guide).toBeVisible();
      await expect(guide).toHaveAttribute('data-algorithm', item.id);
      await expect(guide.locator('.visual-guide-body dl div')).toHaveCount(2);
      await expect(guide).toContainText('先看');
      await expect(guide).toContainText('画面说明');
      await expect(guide).toContainText('分区');
      await expect(guide).not.toContainText('当前做什么');
      await expect(guide).not.toContainText('为什么这样做');

      const guideBox = await guide.boundingBox();
      const operationBox = await page.getByTestId('current-step').boundingBox();
      expect(guideBox).not.toBeNull();
      expect(operationBox).not.toBeNull();
      expect((guideBox?.y ?? 0) < (operationBox?.y ?? 0)).toBe(true);
      const guideHeight = guideBox?.height ?? 0;
      expect(guideHeight).toBeGreaterThan(18);
      expect(guideHeight).toBeLessThan(210);

      const longText = await page.evaluate(() =>
        [...document.querySelectorAll('.stage p, .stage small')]
          .filter((el) => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && (el.textContent ?? '').trim().length > 24;
          })
          .map((el) => (el.textContent ?? '').trim().slice(0, 80)),
      );
      expect(longText).toHaveLength(0);
      await expectNoPageOverflow(page);
    }
  });

  test('Huffman keeps all six code rows visible in a compact result grid', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1366, height: 768 });
    await openAt(page, CASES[0]);

    await expect(page.getByTestId('huffman-code-row')).toHaveCount(6);
    const panelBox = await page.getByTestId('huffman-code-panel').boundingBox();
    expect(panelBox).not.toBeNull();
    const rows = await page.getByTestId('huffman-code-row').all();
    for (const row of rows) {
      const rowBox = await row.boundingBox();
      expect(rowBox).not.toBeNull();
      expect((rowBox?.y ?? 0) + (rowBox?.height ?? 0)).toBeLessThanOrEqual((panelBox?.y ?? 0) + (panelBox?.height ?? 0) + 1);
      expect((rowBox?.x ?? 0) + (rowBox?.width ?? 0)).toBeLessThanOrEqual((panelBox?.x ?? 0) + (panelBox?.width ?? 0) + 1);
    }

    await expect(page.getByTestId('huffman-fixed-bits')).toContainText('300');
    await expect(page.getByTestId('huffman-tree-panel').locator('.huffman-panel-head')).toHaveCount(0);
    await expectNoPageOverflow(page);
  });

  test('priority stage canvases drop duplicated titles, legends and hints', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    await openAt(page, CASES[1]);
    await expect(page.locator('.tree-legend')).toHaveCount(0);
    await expect(page.getByTestId('tree-scroll-hint')).toBeHidden();
    const treeCanvas = await page.locator('.tree-canvas').boundingBox();
    expect(treeCanvas?.height ?? 0).toBeGreaterThan(240);

    await openAt(page, CASES[2]);
    await expect(page.locator('.g1-head')).toHaveCount(0);
    const toolbar = await page.locator('.g1-toolbar').boundingBox();
    expect(toolbar?.height ?? 0).toBeLessThanOrEqual(34);
    await expect(page.getByTestId('floyd-current-strip')).toBeVisible();

    await openAt(page, CASES[3]);
    await expect(page.locator('.critical-stage .mst-legend')).toHaveCount(0);
    await expect(page.getByTestId('critical-event-row')).toHaveCount(6);
    await expect(page.getByTestId('critical-activity-row')).toHaveCount(7);
    await expect(page.getByTestId('critical-result')).toContainText('11');
    await expectNoPageOverflow(page);
  });

  test('narrow screen keeps the guide first and the stage usable', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openAt(page, CASES[0]);

    const guideBox = await page.getByTestId('visual-guide').boundingBox();
    const lessonBox = await page.getByTestId('current-step').boundingBox();
    expect((guideBox?.y ?? 0) < (lessonBox?.y ?? 0)).toBe(true);
    const treeBox = await page.getByTestId('huffman-tree-panel').boundingBox();
    const queueBox = await page.getByTestId('huffman-queue-panel').boundingBox();
    expect(treeBox?.width ?? 0).toBeGreaterThan(280);
    expect(queueBox?.y ?? 0).toBeGreaterThan(treeBox?.y ?? 0);
    await expect(page.getByTestId('huffman-code-row')).toHaveCount(6);
    await expectNoPageOverflow(page);
  });
});
