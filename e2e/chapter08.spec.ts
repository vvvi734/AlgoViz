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

async function removeBuddyRowsDownTo(page: Page, count: number) {
  const removes = page.locator('[data-testid^="buddy-row-"][data-testid$="-remove"]');
  while ((await removes.count()) > count) {
    const before = await removes.count();
    await removes.last().click();
    await expect(removes).toHaveCount(before - 1);
  }
  await expect(removes).toHaveCount(count);
}

test.describe('TEXTBOOK-08 — dynamic storage, buddy and garbage collection', () => {
  test('free-space list runs real Python, switches policy, rewinds and rejects bad capacity', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const firstTotal = await openAlgorithm(page, 'free-list', 'free-stage');

    await expect(page.getByTestId('free-stage')).toHaveAttribute('data-policy', 'first-fit');
    await expect(page.getByTestId('free-stage')).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('free-memory-svg')).toBeVisible();

    await setFrame(page, firstTotal - 1, firstTotal);
    await expect(page.getByTestId('free-stage')).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('free-stats')).toContainText('2');
    await expect(page.getByTestId('free-stats')).toContainText('48');

    await page.click('[data-testid="prev-btn"]');
    await expect(page.getByTestId('progress')).toHaveText(`${firstTotal - 1} / ${firstTotal}`);
    await expect(page.getByTestId('free-stage')).toHaveAttribute('data-operation', /merge|release|done/);
    await page.click('[data-testid="next-btn"]');
    await expect(page.getByTestId('free-stage')).toHaveAttribute('data-operation', 'done');

    await page.getByTestId('free-policy').selectOption('best-fit');
    const bestTotal = await runAgain(page);
    expect(bestTotal).not.toBe(firstTotal);
    await expect(page.getByTestId('free-stage')).toHaveAttribute('data-policy', 'best-fit');
    await setFrame(page, bestTotal - 1, bestTotal);
    await expect(page.getByTestId('free-stage')).toHaveAttribute('data-operation', 'done');

    await page.getByTestId('free-capacity').fill('7');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/8.*128|capacity/i);
    await expect(page.getByTestId('free-stage')).toHaveCount(0);
  });

  test('buddy system splits to a target level, merges upward and keeps alignment visible', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    const total = await openAlgorithm(page, 'buddy-system', 'buddy-stage');

    await expect(page.getByTestId('buddy-stage')).toHaveAttribute('data-max-level', '5');
    await expect(page.getByTestId('buddy-stage')).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('buddy-memory-svg')).toBeVisible();
    await expect(page.getByTestId('buddy-tree-svg')).toBeVisible();

    await removeBuddyRowsDownTo(page, 3);
    await page.getByTestId('buddy-row-0-op').selectOption('alloc');
    await page.getByTestId('buddy-row-0-id').fill('A');
    await page.getByTestId('buddy-row-0-size').fill('3');
    await page.getByTestId('buddy-row-1-op').selectOption('alloc');
    await page.getByTestId('buddy-row-1-id').fill('B');
    await page.getByTestId('buddy-row-1-size').fill('5');
    await page.getByTestId('buddy-row-2-op').selectOption('free');
    await page.getByTestId('buddy-row-2-id').fill('A');

    const editedTotal = await runAgain(page);
    expect(editedTotal).toBeGreaterThan(5);
    await setFrame(page, editedTotal - 1, editedTotal);
    await expect(page.getByTestId('buddy-stage')).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('buddy-state')).toContainText(/合并起点|Merge start/);

    await page.getByTestId('buddy-capacity').fill('24');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/2 的幂|power of two/i);
    await expect(page.getByTestId('buddy-stage')).toHaveCount(0);

    await page.reload();
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await openAlgorithm(page, 'buddy-system', 'buddy-stage');
    await page.getByTestId('guided-mode-random').click();
    await expect(page.getByTestId('guided-random-scenario')).toBeVisible();
    await page.getByTestId('guided-random-scenario').selectOption('merge-multi');
    await page.getByTestId('random-btn').click();
    await expect(page.getByTestId('buddy-stage')).toBeVisible({ timeout: 30_000 });
    const randomTotal = await runAgain(page);
    await setFrame(page, randomTotal - 1, randomTotal);
    await expect(page.locator('[data-testid="buddy-tree-svg"] [data-node-id]')).toHaveCount(1);
  });

  test('mark-sweep keeps roots, reclaims cycles, and compaction refreshes references', async ({ page }) => {
    test.setTimeout(420_000);
    await openPhone(page);
    const sweepTotal = await openAlgorithm(page, 'garbage-collection', 'gc-stage');

    await expect(page.getByTestId('gc-stage')).toHaveAttribute('data-mode', 'mark-sweep');
    await expect(page.getByTestId('gc-graph-svg')).toBeVisible();
    await expect(page.getByTestId('gc-memory-svg')).toBeVisible();
    await expect(page.getByTestId('gc-marked-set')).toContainText('A');

    await setFrame(page, sweepTotal - 1, sweepTotal);
    await expect(page.getByTestId('gc-stage')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="gc-graph-svg"] [data-node-id="A"]')).toHaveAttribute(
      'data-status',
      'allocated',
    );
    await expect(page.locator('[data-testid="gc-graph-svg"] [data-node-id="E"]')).toHaveAttribute(
      'data-status',
      'free',
    );
    await expect(page.locator('[data-testid="gc-graph-svg"] [data-node-id="H"]')).toHaveAttribute(
      'data-status',
      'free',
    );

    await page.getByTestId('gc-mode').selectOption('compaction');
    const compactTotal = await runAgain(page);
    await expect(page.getByTestId('gc-stage')).toHaveAttribute('data-mode', 'compaction');
    await setFrame(page, compactTotal - 1, compactTotal);
    await expect(page.getByTestId('gc-stage')).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('gc-stats')).toContainText('54');
    await expect(page.getByTestId('gc-stats')).toContainText('D: 52→30');
    await expect(page.locator('[data-testid="gc-graph-svg"] [data-node-id="E"]')).toHaveAttribute(
      'data-status',
      'free',
    );

    const refs = page.locator('[data-testid="gc-graph-svg"] [data-ref-id]');
    const refCount = await refs.count();
    expect(refCount).toBe(4);
    await expect(page.locator('[data-testid="gc-graph-svg"] [data-from="A"][data-to="B"]')).toHaveCount(1);

    await page.click('[data-testid="prev-btn"]');
    await expect(page.getByTestId('progress')).toHaveText(`${compactTotal - 1} / ${compactTotal}`);
    await page.click('[data-testid="next-btn"]');
    await expect(page.getByTestId('gc-stage')).toHaveAttribute('data-operation', 'done');
  });
});
