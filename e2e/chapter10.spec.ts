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

test.describe('TEXTBOOK-10 — tournament sort and LSD radix sort', () => {
  test('tournament sort builds a winner tree, updates only the affected path and keeps equal keys stable', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const total = await openAlgorithm(page, 'tournament', 'tournament-visual');
    const visual = page.getByTestId('tournament-visual');

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('tournament-node')).toHaveCount(15);
    await expect(page.getByTestId('tournament-record')).toHaveCount(8);

    await setFrame(page, total - 1, total);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'sorted');
    await expect(page.locator('[data-testid="tournament-output"] > [data-record-id]')).toHaveCount(8);
    const output = page.getByTestId('tournament-output');
    await expect(output).toContainText('1');
    await expect(output).toContainText('11');
    await expect(output.locator('[data-record-id]').last()).toContainText('11');

    await page.getByTestId('run-input').fill('3, 1, 3, 2, 1, 3, 2, 1');
    const duplicateTotal = await runAgain(page);
    await setFrame(page, duplicateTotal - 1, duplicateTotal);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'sorted');
    await expect(page.locator('[data-testid="tournament-output"] > [data-record-id]')).toHaveCount(8);
    const chips = page.locator('[data-testid="tournament-output"] > [data-record-id]');
    await expect(chips.nth(0)).toHaveAttribute('data-record-id', 'B');
    await expect(chips.nth(1)).toHaveAttribute('data-record-id', 'E');
    await expect(chips.nth(2)).toHaveAttribute('data-record-id', 'H');
    await expect(chips.nth(3)).toHaveAttribute('data-record-id', 'D');
    await expect(chips.nth(4)).toHaveAttribute('data-record-id', 'G');
    await expect(chips.nth(5)).toHaveAttribute('data-record-id', 'A');
    await expect(chips.nth(6)).toHaveAttribute('data-record-id', 'C');
    await expect(chips.nth(7)).toHaveAttribute('data-record-id', 'F');
  });

  test('radix sort distributes and collects stable buckets, rejects negatives and restores the official example', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const total = await openAlgorithm(page, 'radix', 'radix-visual');
    const visual = page.getByTestId('radix-visual');

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('radix-record')).toHaveCount(8);
    await expect(page.getByTestId('radix-bucket')).toHaveCount(10);

    await setFrame(page, total - 1, total);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'sorted');
    await expect(page.getByTestId('radix-result')).toContainText(
      '2·G → 24·F → 45·B → 66·H → 75·C → 90·D → 170·A → 802·E',
    );

    await page.getByTestId('run-input').fill('21, 12, 21, 12, 3, 21');
    const duplicateTotal = await runAgain(page);
    await setFrame(page, duplicateTotal - 1, duplicateTotal);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('radix-result')).toContainText(
      '3·E → 12·B → 12·D → 21·A → 21·C → 21·F',
    );

    await page.getByTestId('run-input').fill('-1, 5');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/非负|negative|0/i, { timeout: 90_000 });
    await expect(visual).toHaveCount(0);

    await page.getByTestId('guided-mode-official').click();
    await expect(page.getByTestId('run-feedback')).toContainText(
      /动画已生成|Visualization ready/,
      { timeout: 90_000 },
    );
    await expect(visual).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 90_000 });
  });
});
