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
  return Number(first?.split('/')?.[1]?.trim());
}

async function lastFrame(page: Page, total: number) {
  await page.getByTestId('next-btn').click();
  await expect(page.getByTestId('progress')).toHaveText(`2 / ${total}`, { timeout: 30_000 });
  for (let frame = 2; frame < total; frame += 1) {
    await expect(page.getByTestId('next-btn')).toBeEnabled({ timeout: 30_000 });
    await page.getByTestId('next-btn').click();
    await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`, { timeout: 30_000 });
  }
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

test.describe('TEXTBOOK-12 — files', () => {
  test('indexed file reads one block after probing a dense or sparse index', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const total = await openAlgorithm(page, 'file-index', 'file-index-visual');
    const visual = page.getByTestId('file-index-visual');
    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('file-index-entry')).toHaveCount(8);
    await expect(page.getByTestId('file-index-block')).toHaveCount(3);

    await lastFrame(page, total);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'found');
    await expect(page.getByTestId('file-index-result')).toContainText(/106|R6/);

    await page.getByTestId('file-index-kind').selectOption('sparse');
    await page.getByTestId('file-index-block-capacity').fill('2');
    await page.getByTestId('file-index-records').fill('201, A\n202, B\n203, C\n204, D\n205, E');
    await page.getByTestId('file-index-target-key').fill('204');
    const customTotal = await runAgain(page);
    await expect(page.getByTestId('file-index-entry')).toHaveCount(3);
    await expect(page.getByTestId('file-index-block')).toHaveCount(3);
    await lastFrame(page, customTotal);
    await expect(visual).toHaveAttribute('data-result', 'found');
    await expect(page.getByTestId('file-index-result')).toContainText(/204/);
  });

  test('ISAM inserts into a full block’s overflow chain and finds the new record again', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const total = await openAlgorithm(page, 'isam', 'isam-visual');
    const visual = page.getByTestId('isam-visual');
    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('isam-block')).toHaveCount(3);
    await expect(page.getByTestId('isam-overflow-node')).toHaveCount(0);

    await lastFrame(page, total);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'inserted');
    await expect(page.getByTestId('isam-overflow-node')).toHaveCount(1);
    await expect(page.getByTestId('isam-result')).toContainText(/105|插入|inserted/i);

    await page.getByTestId('isam-command').selectOption('find');
    await page.getByTestId('isam-block-capacity').fill('2');
    await page.getByTestId('isam-records').fill('201, A\n202, B\n203, C\n204, D');
    await page.getByTestId('isam-target-key').fill('203');
    const customTotal = await runAgain(page);
    await lastFrame(page, customTotal);
    await expect(visual).toHaveAttribute('data-result', 'found');
    await expect(page.getByTestId('isam-result')).toContainText(/R3/);
  });

  test('inverted index builds postings and applies AND/OR without inventing ids', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const total = await openAlgorithm(page, 'inverted-index', 'inverted-index-visual');
    const visual = page.getByTestId('inverted-index-visual');
    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('inverted-record')).toHaveCount(4);
    await expect(page.getByTestId('inverted-term')).toHaveCount(4);

    await lastFrame(page, total);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'matched');
    await expect(page.locator('.inverted-match-box span.is-matched')).toHaveCount(1);
    await expect(page.locator('.inverted-match-box span.is-matched')).toHaveText('R2');

    await page.getByTestId('inverted-mode').selectOption('or');
    await page.getByTestId('inverted-input-editor').getByTestId('inverted-records').fill('R1: 图, 树\nR2: 图, 算法\nR3: 排序');
    await page.getByTestId('inverted-query-terms').fill('算法, 排序');
    const customTotal = await runAgain(page);
    await expect(page.getByTestId('inverted-record')).toHaveCount(3);
    await lastFrame(page, customTotal);
    await expect(visual).toHaveAttribute('data-result', 'matched');
    await expect(page.locator('.inverted-match-box span.is-matched')).toHaveCount(2);
    await expect(page.getByTestId('inverted-result')).toContainText(/2/);
  });
});
