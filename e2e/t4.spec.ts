import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/t4');
mkdirSync(SHOT_DIR, { recursive: true });

async function openAlgorithm(page: Page, total: number) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, 'huffman');
  await expect(page.locator('[data-testid="huffman-visual"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
  await expect(page.locator('[data-testid="huffman-picker"]')).toBeVisible();
}

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

async function selectPreset(page: Page, preset: string, total: number) {
  await page.getByTestId(`huffman-preset-${preset}`).click();
  await expect(page.locator('[data-testid="huffman-picker"]')).toHaveAttribute('data-selected', preset);
  await expect(page.getByTestId('huffman-preset-pending')).toBeVisible();
  await page.getByTestId('run-btn').click();
  await expect(page.locator('[data-testid="huffman-picker"]')).toHaveAttribute('data-actual', preset, { timeout: 60_000 });
  await expect(page.getByTestId('huffman-preset-pending')).toHaveCount(0);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
}

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function setTreeScroll(page: Page, ratio: number) {
  await page.locator('[data-testid="huffman-tree-scroll"]').evaluate((node, value) => {
    const element = node as HTMLElement;
    element.scrollTop = (element.scrollHeight - element.clientHeight) * value;
  }, ratio);
}

test.describe('T4 — real heapq Huffman build and prefix coding', () => {
  test('pops the two minima, creates a real parent and requeues it, then encodes the finished tree', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAlgorithm(page, 29);

    const visual = page.locator('[data-testid="huffman-visual"]');
    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(visual).toHaveAttribute('data-preset', 'official');
    await expect(visual).toHaveAttribute('data-phase', 'build');
    await expect(visual).toHaveAttribute('data-roots', '6');
    await expect(visual).toHaveAttribute('data-node-count', '6');
    await expect(visual).toHaveAttribute('data-leaf-count', '6');
    await expect(visual).toHaveAttribute('data-total-weight', '100');
    await expect(visual).toHaveAttribute('data-layout-width', '808');
    await expect(page.locator('[data-testid="huffman-node"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="huffman-queue-entry"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(0);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');
    await expectNoOverflow(page);

    await setFrame(page, 1, 29);
    await expect(visual).toHaveAttribute('data-operation', 'merge-select');
    await expect(page.locator('[data-testid="huffman-queue-picked"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="huffman-queue-entry"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="huffman-node"][data-node-id="n1"]')).toHaveAttribute('data-picked', 'true');
    await expect(page.locator('[data-testid="huffman-node"][data-node-id="n2"]')).toHaveAttribute('data-picked', 'true');
    await expect(page.locator('[data-testid="huffman-node"]')).toHaveCount(6);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'merge-select');
    await page.screenshot({ path: resolve(SHOT_DIR, 'huffman-merge-select-1440-light.png'), fullPage: true });

    await setFrame(page, 2, 29);
    await expect(visual).toHaveAttribute('data-operation', 'merge-create');
    await expect(visual).toHaveAttribute('data-node-count', '7');
    await expect(page.locator('[data-testid="huffman-node"][data-node-id="n7"]')).toHaveAttribute('data-created', 'true');
    await expect(page.locator('[data-testid="huffman-node"][data-node-id="n7"]')).toHaveAttribute('data-weight', '14');
    await expect(page.locator('[data-testid="huffman-edge"][data-to-id="n1"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="huffman-edge"][data-to-id="n2"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="huffman-queue-created"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="huffman-queue-created"]')).toHaveAttribute('data-node-id', 'n7');
    await expect(page.locator('[data-testid="huffman-queue-entry"]')).toHaveCount(4);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'merge-create');

    await setFrame(page, 3, 29);
    await expect(visual).toHaveAttribute('data-operation', 'merge-requeue');
    await expect(page.locator('[data-testid="huffman-node"][data-node-id="n7"]')).toHaveAttribute('data-created', 'true');
    await expect(page.locator('[data-testid="huffman-queue-created"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="huffman-queue-entry"][data-node-id="n7"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="huffman-queue-entry"]')).toHaveCount(5);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'merge-requeue');

    await setFrame(page, 16, 29);
    await expect(visual).toHaveAttribute('data-operation', 'build-done');
    await expect(visual).toHaveAttribute('data-roots', '1');
    await expect(visual).toHaveAttribute('data-node-count', '11');
    await expect(visual).toHaveAttribute('data-leaf-count', '6');
    await expect(visual).toHaveAttribute('data-wpl', '224');
    await expect(visual).toHaveAttribute('data-total-bits', '224');
    await expect(visual).toHaveAttribute('data-fixed-bits', '300');
    await expect(page.locator('[data-testid="huffman-node"]')).toHaveCount(11);
    await expect(page.locator('[data-testid="huffman-queue-entry"]')).toHaveCount(1);
    await expect(page.getByTestId('huffman-queue-root-only')).toBeVisible();
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="huffman-node"][data-root="true"]')).toHaveAttribute('data-node-id', 'n11');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'build-done');
    await setTreeScroll(page, 0);
    await page.screenshot({ path: resolve(SHOT_DIR, 'huffman-build-done-1440-light.png'), fullPage: true });
    await setTreeScroll(page, 1);
    await page.locator('[data-testid="huffman-visual"]').screenshot({
      path: resolve(SHOT_DIR, 'huffman-build-done-tree-bottom-1440-light.png'),
    });

    await setFrame(page, 18, 29);
    await expect(visual).toHaveAttribute('data-operation', 'encode-leaf');
    await expect(visual).toHaveAttribute('data-phase', 'encode');
    await expect(page.locator('[data-testid="huffman-node"][data-node-id="n6"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="huffman-node"][data-node-id="n11"]')).toHaveAttribute('data-on-path', 'true');
    await expect(page.locator('[data-testid="huffman-edge"][data-to-id="n6"]')).toHaveAttribute('data-on-path', 'true');
    await expect(page.getByTestId('huffman-active-path')).toHaveAttribute('data-prefix', '0');
    await expect(page.getByTestId('huffman-active-path')).toContainText('n11 → F');
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveAttribute('data-symbol', 'F');
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveAttribute('data-code', '0');
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'encode-leaf');
    await page.screenshot({ path: resolve(SHOT_DIR, 'huffman-encode-path-1440-light.png'), fullPage: true });

    await setFrame(page, 28, 29);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-phase', 'done');
    await expect(visual).toHaveAttribute('data-wpl', '224');
    await expect(visual).toHaveAttribute('data-total-bits', '224');
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="huffman-code-row"][data-symbol="F"]')).toHaveAttribute('data-code', '0');
    await expect(page.locator('[data-testid="huffman-code-row"][data-symbol="F"]')).toHaveAttribute('data-length', '1');
    await expect(page.locator('[data-testid="huffman-code-row"][data-symbol="A"]')).toHaveAttribute('data-code', '1100');
    await expect(page.locator('[data-testid="huffman-code-row"][data-symbol="A"]')).toHaveAttribute('data-length', '4');
    const contributions = await page.locator('[data-testid="huffman-code-row"]').evaluateAll((rows) =>
      rows.reduce((sum, row) => sum + Number(row.getAttribute('data-contribution')), 0),
    );
    expect(contributions).toBe(224);
    await expect(page.getByTestId('huffman-fixed-bits')).toContainText('3');
    await expect(page.getByTestId('huffman-fixed-bits')).toContainText('300');
    const clippedCodeRows = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="huffman-code-panel"]')!;
      const panelBox = panel.getBoundingClientRect();
      return [...document.querySelectorAll('[data-testid="huffman-code-row"]')].some((row) => {
        const rowBox = row.getBoundingClientRect();
        return rowBox.top < panelBox.top || rowBox.bottom > panelBox.bottom;
      });
    });
    expect(clippedCodeRows).toBe(false);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'huffman-final-table-1440-light.png'), fullPage: true });

    await page.getByTestId('theme-select').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.screenshot({ path: resolve(SHOT_DIR, 'huffman-final-table-1440-dark.png'), fullPage: true });
    await page.getByTestId('theme-select').selectOption('light');

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await expect(visual).toBeVisible();
    await expect(page.locator('[data-testid="huffman-node"]')).toHaveCount(11);
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(6);
    await page.screenshot({ path: resolve(SHOT_DIR, 'huffman-final-table-390-light.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });

    await setFrame(page, 16, 29);
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="huffman-node"]')).toHaveCount(11);
    await expect(page.getByTestId('huffman-queue-root-only')).toBeVisible();
    await setFrame(page, 18, 29);
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(1);
    await setFrame(page, 2, 29);
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="huffman-node"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="huffman-queue-entry"]')).toHaveCount(4);
    await setFrame(page, 0, 29);
    await expect(page.locator('[data-testid="huffman-queue-picked"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="huffman-queue-entry"]')).toHaveCount(6);
    await expect(visual).toHaveAttribute('data-operation', 'init');
  });

  test('keeps equal weights, a single symbol and empty input honest', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAlgorithm(page, 29);

    await selectPreset(page, 'equal', 19);
    const visual = page.locator('[data-testid="huffman-visual"]');
    await expect(visual).toHaveAttribute('data-preset', 'equal');
    await expect(visual).toHaveAttribute('data-node-count', '4');
    await setFrame(page, 18, 19);
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(4);
    const lengths = await page.locator('[data-testid="huffman-code-row"]').evaluateAll((rows) =>
      rows.map((row) => Number(row.getAttribute('data-length'))),
    );
    expect(lengths).toEqual([2, 2, 2, 2]);
    await expect(visual).toHaveAttribute('data-wpl', '32');
    await expect(visual).toHaveAttribute('data-fixed-bits', '32');

    await selectPreset(page, 'single', 5);
    await expect(visual).toHaveAttribute('data-preset', 'single');
    await expect(visual).toHaveAttribute('data-single-symbol', 'true');
    await setFrame(page, 4, 5);
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveAttribute('data-symbol', 'Z');
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveAttribute('data-code', '0');
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveAttribute('data-length', '1');
    await expect(visual).toHaveAttribute('data-wpl', '0');
    await expect(visual).toHaveAttribute('data-total-bits', '7');
    await expect(page.getByTestId('huffman-single-note')).toBeVisible();
    await expect(page.getByTestId('huffman-single-note')).toContainText('WPL=0');
    await page.screenshot({ path: resolve(SHOT_DIR, 'huffman-single-symbol-1440-light.png'), fullPage: true });

    await selectPreset(page, 'empty', 2);
    await expect(visual).toHaveAttribute('data-preset', 'empty');
    await expect(visual).toHaveAttribute('data-node-count', '0');
    await setFrame(page, 1, 2);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-leaf-count', '0');
    await expect(visual).toHaveAttribute('data-wpl', '0');
    await expect(visual).toHaveAttribute('data-total-bits', '0');
    await expect(page.getByTestId('huffman-empty')).toBeVisible();
    await expect(page.locator('[data-testid="huffman-queue-entry"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="huffman-code-row"]')).toHaveCount(0);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
  });
});
