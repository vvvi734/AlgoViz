import {
  expect,
  openCodePanel,
  selectAlgorithm,
  test,
  type Page,
} from './fixtures';

async function prepare(page: Page, algorithm: 'factorial' | 'fib') {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await openCodePanel(page);
  await selectAlgorithm(page, algorithm);
  await expect(page.getByTestId('recursion-n')).toHaveValue('4');
  await waitForRunStart(page);
  await waitForNodeCount(page, algorithm === 'factorial' ? 4 : 9);
}

async function waitForTrace(page: Page) {
  await expect
    .poll(async () => Number(await page.getByTestId('scrub').getAttribute('max')), { timeout: 120_000 })
    .toBeGreaterThan(0);
}

async function waitForRunStart(page: Page) {
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 120_000 });
  await waitForTrace(page);
}

async function waitForNodeCount(page: Page, count: number) {
  await expect.poll(async () => treeNodes(page).count(), { timeout: 120_000 }).toBe(count);
}

async function jumpToEnd(page: Page) {
  const scrub = page.getByTestId('scrub');
  await waitForTrace(page);
  // A new trace commits before React's passive reset effect. Give it one
  // frame so a seek cannot be overwritten by that effect a tick later.
  await page.waitForTimeout(200);
  const last = Number((await scrub.getAttribute('max')) ?? '0');
  // Clicking the far right of a range input is a real pointer interaction and
  // reliably lands on the final frame. Keyboard/fill can leave React's
  // controlled value at 0 while the browser paints the thumb at max.
  const box = await scrub.boundingBox();
  if (!box) throw new Error('timeline slider is not visible');
  const y = box.height / 2;
  // Seek to the start first. If the controlled thumb was left at max by the
  // previous trace, clicking max alone produces no DOM value change and React
  // never receives the event.
  // Seek to the middle first. If the controlled thumb was left at max by the
  // previous trace, clicking max alone produces no DOM value change and React
  // never receives the event.
  await scrub.click({ position: { x: box.width / 2, y } });
  await scrub.click({ position: { x: Math.max(8, box.width - 8), y } });
  await expect(page.getByTestId('progress')).toHaveText(`${last + 1} / ${last + 1}`);
}

async function runN(page: Page, n: number, expectedNodes?: number) {
  await page.getByTestId('recursion-n').fill(String(n));
  await expect(page.getByTestId('guided-mode-custom')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('run-btn').click();
  await waitForRunStart(page);
  if (expectedNodes !== undefined) await waitForNodeCount(page, expectedNodes);
}

function treeNodes(page: Page) {
  return page.locator('[data-testid="recursion-tree"] [data-testid^="recursion-node-"]');
}

test.describe('RECUR-01 — real recursive Python, shared input pipeline', () => {
  test('factorial(0/1/3), random fill, invalid rejection and official restore', async ({ page }) => {
    await prepare(page, 'factorial');

    await jumpToEnd(page);
    await expect(page.getByTestId('recursion-result')).toContainText('24');
    await expect(treeNodes(page)).toHaveCount(4);
    await expect(page.locator('[data-testid="call-stack"] [data-testid^="call-frame-"]')).toHaveCount(0);
    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="call-stack"] [data-testid^="call-frame-"]').first()).toBeVisible();
    await expect(page.getByTestId('recursion-result')).toHaveCount(0);

    await runN(page, 0, 1);
    await jumpToEnd(page);
    await expect(treeNodes(page)).toHaveCount(1);
    await expect(page.getByTestId('recursion-result')).toContainText('1');

    await runN(page, 1, 1);
    await jumpToEnd(page);
    await expect(treeNodes(page)).toHaveCount(1);
    await expect(page.getByTestId('recursion-result')).toContainText('1');

    await runN(page, 3, 3);
    await jumpToEnd(page);
    await expect(treeNodes(page)).toHaveCount(3);
    await expect(page.getByTestId('recursion-result')).toContainText('6');
    await expect(page.getByTestId('recursion-stack-depth')).toContainText('0');

    await runN(page, 10, 10);
    await jumpToEnd(page);
    await expect(treeNodes(page)).toHaveCount(10);
    await expect(page.getByTestId('recursion-result')).toContainText('3628800');

    const beforeRandom = await page.getByTestId('progress').textContent();
    const beforeRandomMax = await page.getByTestId('scrub').getAttribute('max');
    await page.getByTestId('random-btn').click();
    await expect(page.getByTestId('guided-mode-random')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.getByTestId('progress').textContent()).toBe(beforeRandom);
    expect(await page.getByTestId('scrub').getAttribute('max')).toBe(beforeRandomMax);
    const randomN = Number(await page.getByTestId('recursion-n').inputValue());
    expect(Number.isInteger(randomN)).toBe(true);
    expect(randomN).toBeGreaterThanOrEqual(0);
    expect(randomN).toBeLessThanOrEqual(10);
    await page.getByTestId('run-btn').click();
    await waitForRunStart(page);
    const randomFactorial = Array.from({ length: randomN }, (_, index) => index + 1).reduce(
      (product, value) => product * value,
      1,
    );
    await jumpToEnd(page);
    await expect(page.getByTestId('recursion-result')).toContainText(String(randomFactorial));

    const beforeInvalid = await page.getByTestId('scrub').getAttribute('max');
    await page.getByTestId('recursion-n').fill('11');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('0 / 0');
    await expect(page.getByTestId('recursion-visual')).toHaveCount(0);
    await expect(page.getByTestId('run-feedback')).toContainText('0 到 10');
    expect(await page.getByTestId('scrub').getAttribute('max')).not.toBe(beforeInvalid);

    await page.getByTestId('guided-mode-official').click();
    await expect(page.getByTestId('recursion-n')).toHaveValue('4');
    await waitForRunStart(page);
    await waitForNodeCount(page, 4);
    await jumpToEnd(page);
    await expect(page.getByTestId('recursion-result')).toContainText('24');
  });

  test('naive Fibonacci(0/1/5), repeated subproblems, playback recovery and official restore', async ({ page }) => {
    await prepare(page, 'fib');

    await jumpToEnd(page);
    await expect(treeNodes(page)).toHaveCount(9);
    await expect(page.getByTestId('recursion-result')).toContainText('3');
    await expect(page.getByTestId('recursion-repeat-note')).toContainText('fib(2) × 2');

    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="call-stack"] [data-testid^="call-frame-"]').first()).toBeVisible();
    await expect(page.getByTestId('recursion-result')).toHaveCount(0);
    await expect(page.locator('[data-testid="recursion-tree"] [data-current="true"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="recursion-tree"] [data-current="true"]')).toHaveAttribute(
      'data-status',
      'returning',
    );
    await page.getByTestId('next-btn').click();
    await expect(page.getByTestId('recursion-result')).toContainText('3');

    await runN(page, 0, 1);
    await jumpToEnd(page);
    await expect(treeNodes(page)).toHaveCount(1);
    await expect(page.getByTestId('recursion-result')).toContainText('0');

    await runN(page, 1, 1);
    await jumpToEnd(page);
    await expect(treeNodes(page)).toHaveCount(1);
    await expect(page.getByTestId('recursion-result')).toContainText('1');

    await runN(page, 5, 15);
    await jumpToEnd(page);
    await expect(treeNodes(page)).toHaveCount(15);
    await expect(page.getByTestId('recursion-result')).toContainText('5');
    await expect(page.getByTestId('recursion-repeat-note')).toContainText('fib(2) × 3');
    await expect(page.getByTestId('recursion-repeat-note')).toContainText('fib(3) × 2');

    await runN(page, 8, 67);
    await jumpToEnd(page);
    await expect(treeNodes(page)).toHaveCount(67);
    await expect(page.getByTestId('recursion-result')).toContainText('21');
    await expect(page.getByTestId('recursion-repeat-note')).toContainText('fib(2) × 13');
    await expect(page.getByTestId('recursion-repeat-note')).toContainText('fib(6) × 2');

    const beforeRandom = await page.getByTestId('progress').textContent();
    await page.getByTestId('random-btn').click();
    expect(await page.getByTestId('progress').textContent()).toBe(beforeRandom);
    const randomN = Number(await page.getByTestId('recursion-n').inputValue());
    expect(Number.isInteger(randomN)).toBe(true);
    expect(randomN).toBeGreaterThanOrEqual(0);
    expect(randomN).toBeLessThanOrEqual(8);
    await page.getByTestId('run-btn').click();
    await waitForRunStart(page);
    const fibRandom = Number(await page.getByTestId('recursion-n').inputValue());
    await jumpToEnd(page);
    await expect(page.getByTestId('recursion-result')).toContainText(
      ({ 0: '0', 1: '1', 2: '1', 3: '2', 4: '3', 5: '5', 6: '8', 7: '13', 8: '21' } as Record<number, string>)[fibRandom],
    );

    await page.getByTestId('recursion-n').fill('9');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('0 / 0');
    await expect(page.getByTestId('recursion-visual')).toHaveCount(0);
    await expect(page.getByTestId('run-feedback')).toContainText('0 到 8');

    await page.getByTestId('guided-mode-official').click();
    await expect(page.getByTestId('recursion-n')).toHaveValue('4');
    await waitForRunStart(page);
    await waitForNodeCount(page, 9);
    await jumpToEnd(page);
    await expect(page.getByTestId('recursion-result')).toContainText('3');
  });

  test('language switch keeps the recursion state and renders the English canvas', async ({ page }) => {
    await prepare(page, 'factorial');
    await runN(page, 3, 3);
    await jumpToEnd(page);

    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.getByText('Factorial recursion · call graph')).toBeVisible();
    await expect(page.getByTestId('recursion-n')).toHaveValue('3');
    await expect(page.getByTestId('recursion-result')).toContainText('6');
    await expect(treeNodes(page)).toHaveCount(3);
  });

  test('mobile keeps the full Fibonacci tree readable in a scrollable canvas', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepare(page, 'fib');
    await jumpToEnd(page);

    const canvas = page.getByTestId('recursion-canvas');
    await expect(canvas).toBeVisible();
    await expect(treeNodes(page)).toHaveCount(9);
    await expect(page.getByTestId('recursion-result')).toContainText('3');
    const root = await page.getByTestId('recursion-node-f1').boundingBox();
    expect(root?.width ?? 0).toBeGreaterThanOrEqual(80);
    const scrolls = await canvas.evaluate(
      (element) => element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
    );
    expect(scrolls).toBe(true);
  });
});
