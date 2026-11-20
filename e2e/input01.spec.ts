import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

async function waitGenerated(page: Page) {
  await expect(page.getByTestId('run-feedback')).toContainText(/动画已生成|Visualization ready/, {
    timeout: 90_000,
  });
}

async function totalFrames(page: Page): Promise<number> {
  const text = await page.getByTestId('progress').textContent();
  const total = Number((text ?? '').split('/')[1]?.trim());
  expect(Number.isFinite(total)).toBe(true);
  return total;
}

async function seekLast(page: Page) {
  const last = await page.locator('[data-testid="scrub"]').evaluate((node) => (node as HTMLInputElement).max);
  await page.locator('[data-testid="scrub"]').fill(last);
}

async function barValues(page: Page): Promise<string[]> {
  return page.locator('[data-testid="visual-stage"] .bar span').allTextContents();
}

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('INPUT-01 — guided inputs drive real traces', () => {
  test('bubble: custom values replace the official trace, random cases run, official restore survives', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await openCodePanel(page);
    await expect(page.getByTestId('progress')).toHaveText('1 / 25');

    // Move off frame 1, then prove generation starts the new trace at frame 1.
    await page.getByTestId('next-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('2 / 25');

    await page.locator('#run-input').fill('8, 3, 5, 1, 7');
    await expect(page.getByTestId('guided-mode-custom')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
    expect(await totalFrames(page)).toBeGreaterThan(4);
    await expect(page.locator('[data-testid="visual-stage"] .bar')).toHaveCount(5);
    expect(await barValues(page)).toEqual(['8', '3', '5', '1', '7']);
    await page.getByTestId('next-btn').click();
    await expect(page.getByTestId('progress')).toHaveText(`2 / ${await totalFrames(page)}`);

    // Random "reversed" must be a valid descending draft and must really run.
    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('reversed');
    const randomValues = (await page.locator('#run-input').inputValue())
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number);
    expect(randomValues.length).toBeGreaterThanOrEqual(8);
    expect(randomValues.length).toBeLessThanOrEqual(11);
    expect(randomValues.every((value, index) => index === 0 || randomValues[index - 1]! >= value)).toBe(true);
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expect(page.locator('[data-testid="visual-stage"] .bar')).toHaveCount(randomValues.length);
    expect(await barValues(page)).toEqual(randomValues.map(String));

    // The official example remains the same 25-frame teaching trace.
    await page.getByTestId('guided-mode-official').click();
    await waitGenerated(page);
    await expect(page.getByTestId('progress')).toHaveText('1 / 25');
    await expect(page.locator('[data-testid="visual-stage"] .bar')).toHaveCount(6);
    expect(await barValues(page)).toEqual(['5', '2', '8', '1', '6', '3']);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('run-btn')).toBeVisible();
    await expect(page.locator('#run-input')).toBeVisible();
    await expectNoOverflow(page);
  });

  test('binary: custom target changes the result, unsorted input is rejected, random target is consistent', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await chooseAlgorithm(page, 'binary');
    await expect(page.getByTestId('search-visual')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('progress')).toHaveText('1 / 10');

    await page.locator('#run-input').fill('1, 3, 5, 7, 9, 11, 13');
    await page.locator('[data-testid="binary-target"]').fill('5');
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expect(page.getByTestId('search-target')).toContainText('目标 5');
    await seekLast(page);
    await expect(page.getByTestId('search-result')).toContainText('索引 2');

    // The UI never sorts this array: the real Python program rejects it.
    await page.locator('#run-input').fill('3, 1, 2');
    await page.locator('[data-testid="binary-target"]').fill('2');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('search-invalid')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('search-invalid')).toContainText('不是升序');
    await expect(page.getByTestId('progress')).toHaveText('1 / 1');
    await expect(page.locator('[data-testid="search-bar"]')).toHaveCount(3);

    // Random not-found: the target must really be absent from the sorted array.
    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('not-found');
    const target = Number(await page.locator('[data-testid="binary-target"]').inputValue());
    const values = (await page.locator('#run-input').inputValue())
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number);
    expect(values.every((value, index) => index === 0 || values[index - 1]! <= value)).toBe(true);
    expect(values).not.toContain(target);
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expect(page.getByTestId('search-visual')).toBeVisible();
    await expect(page.getByTestId('search-bar')).toHaveCount(values.length);
    await expect(page.getByTestId('search-target')).toContainText(`目标 ${target}`);
    await seekLast(page);
    await expect(page.getByTestId('search-result')).toContainText(/未找到|Not found/);
  });

  test('KMP: a new pattern rebuilds LPS and drives the real search trace', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await chooseAlgorithm(page, 'kmp');
    await expect(page.getByTestId('kmp-visual')).toBeVisible({ timeout: 90_000 });

    await page.locator('#run-input').fill('AABAACAABAA');
    await page.locator('[data-testid="kmp-pattern"]').fill('AABAA');
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await seekLast(page);
    await expect(page.getByTestId('kmp-visual')).toHaveAttribute('data-lps', '0,1,0,1,2');
    await expect(page.getByTestId('kmp-visual')).toHaveAttribute('data-matches', '0,6');
    await expect(page.getByTestId('kmp-visual')).toHaveAttribute('data-operation', 'search-done');
    await expect(page.getByTestId('kmp-search-pattern-cell')).toHaveCount(5);
    await expect(page.getByTestId('kmp-text-cell')).toHaveCount(11);

    // A random overlapping case must produce more than one start from Python.
    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('overlap');
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await seekLast(page);
    const count = Number(await page.getByTestId('kmp-visual').getAttribute('data-match-count'));
    expect(count).toBeGreaterThan(1);
    await expect(page.getByTestId('kmp-search-pattern-cell')).toHaveCount(3);
  });
});
