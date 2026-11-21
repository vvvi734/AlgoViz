import { expect, test, type Page } from './fixtures';

const MOBILE_SELECT = '[data-testid="mobile-algo-select"]';

async function openPhone(page: Page) {
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
}

async function openAlgorithm(page: Page, id: string, stage: string): Promise<number> {
  await page.locator(MOBILE_SELECT).selectOption(id);
  await expect(page.getByTestId(stage)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 90_000 });
  const first = await page.getByTestId('progress').textContent();
  return Number(first?.split('/')[1]?.trim());
}

async function setFrame(page: Page, frame: number, total: number) {
  const progress = page.getByTestId('progress');
  const text = (await progress.textContent()) ?? '';
  const current = Number(text.split('/')[0]?.trim()) - 1;
  await expect(page.getByTestId('next-btn')).toBeEnabled({ timeout: 90_000 });
  for (let index = current; index < frame; index += 1) {
    await page.getByTestId('next-btn').click();
    await expect(progress).toHaveText(`${index + 2} / ${total}`, { timeout: 30_000 });
  }
  await expect(progress).toHaveText(`${frame + 1} / ${total}`, { timeout: 30_000 });
}

async function runAgain(page: Page): Promise<number> {
  const feedback = page.getByTestId('run-feedback');
  const before = (await feedback.textContent()) ?? '';
  await page.getByTestId('run-btn').click();
  await expect.poll(async () => feedback.textContent(), { timeout: 90_000 }).not.toBe(before);
  await expect(feedback).toContainText(/动画已生成|Visualization ready/, { timeout: 90_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 90_000 });
  const first = await page.getByTestId('progress').textContent();
  return Number(first?.split('/')?.[1]?.trim());
}

test.describe('TEXTBOOK-11 — external sorting', () => {
  test('multiway merge reads one block per run, selects buffer heads and flushes full output blocks', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const total = await openAlgorithm(page, 'multiway', 'multiway-visual');
    const visual = page.getByTestId('multiway-visual');

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('multiway-run')).toHaveCount(2);
    await expect(page.getByTestId('multiway-record')).toHaveCount(6);
    await expect(page.getByTestId('multiway-candidate')).toHaveCount(0);
    await expect(page.getByTestId('multiway-output-buffer-record')).toHaveCount(0);

    await setFrame(page, 2, total);
    await expect(page.getByTestId('multiway-candidate')).toHaveCount(2);

    await setFrame(page, total - 1, total);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'sorted');
    const output = page.locator('[data-testid="multiway-output"] [data-record-id]');
    await expect(output).toHaveCount(6);
    await expect(output.nth(0)).toHaveAttribute('data-value', '1');
    await expect(output.nth(1)).toHaveAttribute('data-value', '2');
    await expect(output.nth(2)).toHaveAttribute('data-value', '5');
    await expect(output.nth(3)).toHaveAttribute('data-value', '6');
    await expect(output.nth(4)).toHaveAttribute('data-value', '9');
    await expect(output.nth(5)).toHaveAttribute('data-value', '10');

    await page.getByTestId('multiway-k').fill('3');
    await page.getByTestId('multiway-runs-input').fill('2, 5, 9\n1, 6, 10\n0, 7, 8');
    const customTotal = await runAgain(page);
    await expect(visual).toHaveAttribute('data-k', '3');
    await expect(page.getByTestId('multiway-run')).toHaveCount(3);
    await setFrame(page, customTotal - 1, customTotal);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="multiway-output"] [data-record-id]')).toHaveCount(9);

    await page.getByTestId('multiway-k').fill('5');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/2|4|k/i, { timeout: 90_000 });
    await expect(visual).toHaveCount(0);
  });

  test('replacement selection freezes smaller keys, closes runs and unfreezes for the next run', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const total = await openAlgorithm(page, 'replacement', 'replacement-visual');
    const visual = page.getByTestId('replacement-visual');

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(visual).toHaveAttribute('data-workspace-capacity', '3');
    await expect(page.getByTestId('replacement-slot')).toHaveCount(3);
    await expect(page.getByTestId('replacement-input-record')).toHaveCount(9);

    await setFrame(page, total - 1, total);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'runs-ready');
    await expect(page.getByTestId('replacement-run')).toHaveCount(2);
    await expect(page.locator('[data-testid="replacement-runs"] [data-record-id]')).toHaveCount(9);
    const runs = page.getByTestId('replacement-run');
    await expect(runs.nth(0)).toContainText('4');
    await expect(runs.nth(1)).toContainText('5');

    await page.getByTestId('run-input').fill('7, 6, 5, 4, 3, 2, 1');
    await page.getByTestId('replacement-workspace-capacity').fill('2');
    const reversedTotal = await runAgain(page);
    await setFrame(page, reversedTotal - 1, reversedTotal);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('replacement-run')).toHaveCount(4);
    await expect(page.locator('[data-testid="replacement-runs"] [data-record-id]')).toHaveCount(7);

    await page.getByTestId('replacement-workspace-capacity').fill('1');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/2|6|容量|capacity/i, { timeout: 90_000 });
    await expect(visual).toHaveCount(0);
  });

  test('optimal merge tree charges every internal weight and adds a marked virtual zero leaf for k=3', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const total = await openAlgorithm(page, 'optimal-merge', 'optimal-visual');
    const visual = page.getByTestId('optimal-visual');

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(visual).toHaveAttribute('data-total-cost', '0');
    await expect(page.getByTestId('optimal-node')).toHaveCount(4);
    await expect(page.getByTestId('optimal-real-weights').locator('.ext-weight-chip')).toHaveCount(4);

    await setFrame(page, total - 1, total);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'built');
    await expect(visual).toHaveAttribute('data-total-cost', '51');
    await expect(page.getByTestId('optimal-node')).toHaveCount(7);
    const root = page.locator('[data-testid="optimal-node"][data-node-id="T2"]');
    await expect(root).toHaveAttribute('data-weight', '27');
    await expect(root).toHaveAttribute('data-leaf', 'false');

    await page.getByTestId('run-input').fill('4, 5, 9, 10, 12, 15');
    await page.getByTestId('optimal-k').fill('3');
    const virtualTotal = await runAgain(page);
    await expect(visual).toHaveAttribute('data-k', '3');
    await expect(visual).toHaveAttribute('data-virtual-count', '1');
    await expect(page.getByTestId('optimal-virtual-note')).toBeVisible();
    const virtualNode = page.locator('[data-testid="optimal-node"][data-virtual="true"]');
    await expect(virtualNode).toHaveCount(1);
    await expect(virtualNode).toHaveAttribute('data-weight', '0');
    await setFrame(page, virtualTotal - 1, virtualTotal);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-total-cost', '92');
    await expect(visual).toHaveAttribute('data-virtual-count', '1');

    await page.getByTestId('run-input').fill('0, 4, 5');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/1|999|权重|weight/i, { timeout: 90_000 });
    await expect(visual).toHaveCount(0);
  });
});
