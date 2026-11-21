import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

async function waitGenerated(page: Page) {
  await expect(page.getByTestId('run-feedback')).toContainText(/动画已生成|Visualization ready/, {
    timeout: 90_000,
  });
}

async function setFrame(page: Page, frame: number, total: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`);
}

async function totalFrames(page: Page): Promise<number> {
  const max = Number(
    await page.locator('[data-testid="scrub"]').evaluate((node) => (node as HTMLInputElement).max),
  );
  return max + 1;
}

async function seekMatching(
  page: Page,
  testId: 'search-visual' | 'hash-visual',
  attributes: Record<string, string>,
): Promise<number> {
  const visual = page.getByTestId(testId);
  const total = await totalFrames(page);
  for (let index = 0; index < total; index += 1) {
    await setFrame(page, index, total);
    const matches = await visual.evaluate((node, expected) => {
      const element = node as HTMLElement;
      return Object.entries(expected).every(([key, value]) => element.dataset[key] === value);
    }, attributes);
    if (matches) return index;
  }
  throw new Error(`no frame matched ${JSON.stringify(attributes)}`);
}

async function openAlgorithm(page: Page, id: 'linear' | 'hash-chain' | 'hash-probe') {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, id);
  await openCodePanel(page);
  await expect(page.getByTestId(id === 'linear' ? 'search-visual' : 'hash-visual')).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('guided-input')).toHaveAttribute('data-algorithm', id);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

async function runCurrent(page: Page) {
  await page.getByTestId('run-btn').click();
  await waitGenerated(page);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

test.describe('INPUT-03 — real linear-search and hash traces', () => {
  test('linear: unsorted duplicate values return the first match, and an empty array is a real run', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'linear');
    await page.locator('#run-input').fill('6, 3, 7, 3, 9');
    await page.getByTestId('linear-target').fill('3');
    await runCurrent(page);

    await page.getByTestId('lesson-step-done').click();
    const visual = page.getByTestId('search-visual');
    await expect(visual).toHaveAttribute('data-algorithm', 'linear');
    await expect(visual).toHaveAttribute('data-operation', 'found');
    await expect(visual).toHaveAttribute('data-result', '1');
    await expect(visual).toHaveAttribute('data-total', '5');
    await expect(page.getByTestId('search-result')).toContainText('索引 1');
    await expect(page.getByTestId('search-bar').nth(0)).toHaveAttribute('data-marks', /checked/);

    await page.locator('#run-input').fill('');
    await page.getByTestId('linear-target').fill('5');
    await runCurrent(page);
    await seekMatching(page, 'search-visual', { operation: 'not-found' });
    await expect(visual).toHaveAttribute('data-total', '0');
    await expect(visual).toHaveAttribute('data-result', '-1');
    await expect(page.getByTestId('search-empty')).toBeVisible();
    await expect(page.getByTestId('search-result')).toContainText(/未找到|Not found/);

    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('first');
    const target = await page.getByTestId('linear-target').inputValue();
    const nums = (await page.locator('#run-input').inputValue()).split(/[,\s]+/).filter(Boolean);
    expect(nums[0]).toBe(target);
    await runCurrent(page);
    await seekMatching(page, 'search-visual', { operation: 'found', result: '0' });
  });

  test('chaining: delete-middle relinks real nodes and random delete-head runs a new trace', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'hash-chain');
    await page.getByTestId('hash-operations').fill('insert 1\ninsert 8\ninsert 15\ndelete 8\nfind 15');
    await runCurrent(page);

    await seekMatching(page, 'hash-visual', { operation: 'delete-middle', key: '8' });
    await expect(page.getByTestId('hash-removed')).toContainText('中间');
    await expect(page.locator('[data-testid="hash-node"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="hash-node"][data-key="15"]')).toHaveAttribute('data-next', /n/);
    await expect(page.locator('[data-testid="hash-node"][data-key="1"]')).toHaveAttribute('data-position', 'tail');

    await seekMatching(page, 'hash-visual', { operation: 'found', key: '15' });
    await expect(page.getByTestId('hash-result')).toContainText(/查找成功|Search successful/i);
    await expect(page.getByTestId('hash-count')).toContainText('2 / 7');

    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('delete-head');
    const randomOps = (await page.getByTestId('hash-operations').inputValue()).split('\n');
    expect(randomOps.filter((line) => line.startsWith('insert '))).toHaveLength(3);
    await runCurrent(page);
    await seekMatching(page, 'hash-visual', { operation: 'delete-head' });
    await expect(page.getByTestId('hash-removed')).toContainText('桶头');
    await expect(page.getByTestId('hash-count')).toContainText('2 / 7');

    await page.getByTestId('guided-mode-official').click();
    await waitGenerated(page);
    expect((await page.getByTestId('hash-operations').inputValue()).split('\n').length).toBeGreaterThan(10);
  });

  test('probing: tombstone continues the probe, is reused, and table-full is reported', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'hash-probe');
    await page.getByTestId('hash-operations').fill(
      'insert 1\ninsert 8\ninsert 15\ndelete 8\nfind 15\ninsert 22',
    );
    await runCurrent(page);

    await seekMatching(page, 'hash-visual', { operation: 'delete', key: '8' });
    await expect(page.locator('[data-testid="hash-slot"][data-index="2"]')).toHaveAttribute('data-state', 'deleted');
    await expect(page.getByTestId('hash-tombstone-note')).toContainText('DELETED');

    await seekMatching(page, 'hash-visual', { operation: 'found', key: '15' });
    await expect(page.getByTestId('hash-result')).toContainText(/查找成功|Search successful/i);
    await expect(page.locator('[data-testid="hash-slot"][data-index="2"]')).toHaveAttribute('data-state', 'deleted');
    const chips = page.locator('[data-testid="hash-probe-chip"]');
    await expect(chips).toHaveCount(3);
    await expect(chips.nth(1)).toHaveAttribute('data-index', '2');

    await seekMatching(page, 'hash-visual', { operation: 'insert', key: '22' });
    await expect(page.getByTestId('hash-visual')).toHaveAttribute('data-reused-deleted', 'true');
    await expect(page.locator('[data-testid="hash-slot"][data-index="2"]')).toHaveAttribute('data-key', '22');
    await expect(page.getByTestId('hash-reuse-note')).toBeVisible();

    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('table-full');
    const ops = (await page.getByTestId('hash-operations').inputValue()).split('\n');
    expect(ops.filter((line) => line.startsWith('insert '))).toHaveLength(8);
    await runCurrent(page);
    await seekMatching(page, 'hash-visual', { operation: 'table-full' });
    await expect(page.getByTestId('hash-result')).toContainText(/表满|full/i);
    await expect(page.locator('[data-testid="hash-slot"][data-state="occupied"]')).toHaveCount(7);
    await expect(page.getByTestId('hash-load-factor')).toContainText('1.000');
  });
});
