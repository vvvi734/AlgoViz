import { expect, selectAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/l1b');
mkdirSync(SHOT_DIR, { recursive: true });

async function openApp(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
}

async function setFrame(page: Page, frame: number, total: number) {
  await page.getByTestId('scrub').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`, { timeout: 30_000 });
}

async function slotValues(page: Page): Promise<Array<string | null>> {
  return page.getByTestId(/^seqlist-slot-/).evaluateAll((nodes) =>
    nodes.map((node) => {
      const value = node.getAttribute('data-value');
      return value === 'null' ? null : value;
    }),
  );
}

async function slotIndexes(page: Page): Promise<number[]> {
  return page.getByTestId(/^seqlist-slot-/).evaluateAll((nodes) =>
    nodes.map((node) => Number(node.getAttribute('data-index'))),
  );
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: resolve(SHOT_DIR, name), fullPage: true });
}

test.describe('L1B — real fixed-capacity sequential-list visualization', () => {
  test('inserts 25 at index 2 through real right-to-left moves and rollback', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'seqlist');
    const visual = page.getByTestId('seqlist-visual');
    await expect(visual).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('progress')).toHaveText('1 / 8', { timeout: 60_000 });
    await expect(page.getByTestId('seqlist-phase')).toContainText('完成帧');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');
    await expect(page.getByTestId('seqlist-length')).toHaveText('5');
    await expect(page.getByTestId('seqlist-capacity')).toHaveText('8');
    expect(await slotIndexes(page)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(await slotValues(page)).toEqual(['10', '20', '30', '40', '50', null, null, null]);
    await expect(page.getByTestId('seqlist-slot-5')).toHaveAttribute('data-occupied', 'false');
    await expectNoPageOverflow(page);

    await setFrame(page, 2, 8);
    await expect(visual).toHaveAttribute('data-operation', 'insert');
    await expect(visual).toHaveAttribute('data-action', 'shift-right');
    await expect(visual).toHaveAttribute('data-phase', 'intermediate');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'insert');
    await expect(page.getByTestId('seqlist-slot-4')).toHaveAttribute('data-source', 'true');
    await expect(page.getByTestId('seqlist-slot-5')).toHaveAttribute('data-target', 'true');
    await expect(page.getByTestId('seqlist-slot-5')).toHaveAttribute('data-occupied', 'false');
    await expect(page.getByTestId('seqlist-slot-5')).toHaveAttribute('data-value', '50');
    await expect(page.getByTestId('seqlist-change')).toContainText('slots[5]');
    await expect(page.getByTestId('seqlist-change')).toContainText('null');
    await expect(page.getByTestId('seqlist-change')).toContainText('50');
    await expect(page.getByTestId('seqlist-length')).toHaveText('5');
    await shot(page, 'insert-middle-1440-light.png');

    await setFrame(page, 5, 8);
    await expect(visual).toHaveAttribute('data-action', 'write');
    await expect(page.getByTestId('seqlist-slot-2')).toHaveAttribute('data-target', 'true');
    await expect(page.getByTestId('seqlist-slot-2')).toHaveAttribute('data-value', '25');
    await expect(page.getByTestId('seqlist-change')).toContainText('slots[2]');

    await setFrame(page, 6, 8);
    await expect(visual).toHaveAttribute('data-action', 'complete');
    await expect(page.getByTestId('seqlist-length')).toHaveText('6');
    expect(await slotValues(page)).toEqual(['10', '20', '25', '30', '40', '50', null, null]);
    await expect(page.getByTestId('seqlist-slot-6')).toHaveAttribute('data-occupied', 'false');

    await setFrame(page, 3, 8);
    await expect(visual).toHaveAttribute('data-phase', 'intermediate');
    await expect(page.getByTestId('seqlist-length')).toHaveText('5');
    await expect(page.getByTestId('seqlist-slot-5')).toHaveAttribute('data-value', '50');
    await expect(page.getByTestId('seqlist-slot-5')).toHaveAttribute('data-occupied', 'false');

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoPageOverflow(page);
    const scroller = await page.getByTestId('seqlist-scroller').evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
  });

  test('deletes index 1 through real left-to-right moves, clears the tail and updates the counter', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'seqlist');
    const visual = page.getByTestId('seqlist-visual');
    await expect(visual).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('progress')).toHaveText('1 / 8', { timeout: 60_000 });

    await page.getByTestId('seqlist-preset-delete-middle').click();
    await expect(page.getByTestId('seqlist-picker')).toHaveAttribute('data-selected', 'delete-middle');
    await expect(page.getByTestId('seqlist-picker')).toHaveAttribute('data-actual', 'insert-middle');
    await expect(page.getByTestId('seqlist-preset-pending')).toBeVisible();
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('1 / 9', { timeout: 60_000 });
    await expect(page.getByTestId('seqlist-picker')).toHaveAttribute('data-actual', 'delete-middle');

    await setFrame(page, 2, 9);
    await expect(visual).toHaveAttribute('data-action', 'save');
    await expect(page.getByTestId('seqlist-slot-1')).toHaveAttribute('data-removed', 'true');
    await expect(page.getByTestId('seqlist-slot-1')).toHaveAttribute('data-value', '20');
    await expect(page.getByTestId('seqlist-length')).toHaveText('5');

    await setFrame(page, 3, 9);
    await expect(visual).toHaveAttribute('data-action', 'shift-left');
    await expect(page.getByTestId('seqlist-slot-2')).toHaveAttribute('data-source', 'true');
    await expect(page.getByTestId('seqlist-slot-1')).toHaveAttribute('data-target', 'true');
    await expect(page.getByTestId('seqlist-change')).toContainText('slots[1]');
    await expect(page.getByTestId('seqlist-change')).toContainText('30');
    await expect(page.getByTestId('seqlist-length')).toHaveText('5');
    await shot(page, 'delete-middle-1440-light.png');

    await setFrame(page, 6, 9);
    await expect(visual).toHaveAttribute('data-action', 'clear');
    await expect(page.getByTestId('seqlist-slot-4')).toHaveAttribute('data-target', 'true');
    await expect(page.getByTestId('seqlist-slot-4')).toHaveAttribute('data-value', 'null');
    await expect(page.getByTestId('seqlist-length')).toHaveText('4');

    await setFrame(page, 7, 9);
    await expect(visual).toHaveAttribute('data-action', 'complete');
    expect(await slotValues(page)).toEqual(['10', '30', '40', '50', null, null, null, null]);
    await expect(page.getByTestId('seqlist-slot-4')).toHaveAttribute('data-occupied', 'false');

    await setFrame(page, 8, 9);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expectNoPageOverflow(page);
  });

  test('rejects full insertion and empty deletion without changing the fixed slots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'seqlist');
    const visual = page.getByTestId('seqlist-visual');
    await expect(visual).toBeVisible({ timeout: 60_000 });

    await page.getByTestId('seqlist-preset-full-insert').click();
    await expect(page.getByTestId('seqlist-picker')).toHaveAttribute('data-selected', 'full-insert');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('1 / 3', { timeout: 60_000 });
    await setFrame(page, 2, 3);
    await expect(visual).toHaveAttribute('data-action', 'reject');
    await expect(page.getByTestId('seqlist-error')).toContainText('满表');
    await expect(page.getByTestId('seqlist-length')).toHaveText('8');
    await expect(page.getByTestId('seqlist-capacity')).toHaveText('8');
    await expect(page.getByTestId('seqlist-slot-0')).toHaveAttribute('data-value', '1');
    await expectNoPageOverflow(page);
    await shot(page, 'full-insert-1440-light.png');

    await page.getByTestId('seqlist-preset-empty-delete').click();
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('1 / 2', { timeout: 60_000 });
    await setFrame(page, 1, 2);
    await expect(visual).toHaveAttribute('data-action', 'reject');
    await expect(page.getByTestId('seqlist-error')).toContainText('空表');
    await expect(page.getByTestId('seqlist-length')).toHaveText('0');
    expect(await slotValues(page)).toEqual([null, null, null, null, null, null, null, null]);
    await shot(page, 'empty-delete-1440-light.png');
  });
});
