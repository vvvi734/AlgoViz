import { test, expect } from '@playwright/test';

test('RELEASE-RECHECK — initial textbook entry defers Monaco and Pyodide', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const monacoRequests: string[] = [];
  const pyodideRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/monaco-setup|editor\.worker/i.test(request.url())) monacoRequests.push(request.url());
    if (/pyodide/i.test(request.url())) pyodideRequests.push(request.url());
  });

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 45_000 });
  await page.waitForTimeout(1_500);

  expect(monacoRequests).toEqual([]);
  expect(pyodideRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);

  const timing = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return {
      domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      loadMs: navigation ? Math.round(navigation.loadEventEnd) : null,
      viewportScrollWidth: document.documentElement.scrollWidth,
      viewportClientWidth: document.documentElement.clientWidth,
    };
  });
  expect(timing.viewportScrollWidth).toBeLessThanOrEqual(timing.viewportClientWidth + 1);
  console.log(`INITIAL_LOAD=${JSON.stringify(timing)}`);
});

test('RELEASE-RECHECK — all 60 official inputs execute in the production preview', async ({ page }) => {
  test.setTimeout(900_000);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 60_000 });

  const select = page.getByTestId('mobile-algo-select');
  await expect(select).toBeVisible();
  const ids = await select.locator('option').evaluateAll((options) =>
    options
      .map((option) => (option as HTMLOptionElement).value)
      .filter((value) => value && !value.startsWith('concept:')),
  );
  expect(ids).toHaveLength(60);

  const results: Array<{ id: string; frames: number }> = [];
  for (const id of ids) {
    await select.selectOption(id);
    await expect(page.getByTestId('guided-input')).toHaveAttribute('data-algorithm', id, { timeout: 10_000 });

    const run = page.getByTestId('run-btn');
    await expect(run).toBeEnabled({ timeout: 30_000 });
    await run.click();

    await expect
      .poll(async () => (await page.getByTestId('run-feedback').textContent())?.trim() ?? '', {
        timeout: 120_000,
        intervals: [300, 600, 1_000],
      })
      .toMatch(/动画已生成|Visualization ready|错误|Error/);

    const feedback = (await page.getByTestId('run-feedback').textContent())?.trim() ?? '';
    expect(feedback, `${id}: ${feedback}`).toMatch(/动画已生成|Visualization ready/);

    const progress = (await page.getByTestId('progress').textContent())?.trim() ?? '';
    expect(progress, id).toMatch(/^1 \/ \d+$/);
    results.push({ id, frames: Number(progress.split('/')[1]?.trim()) });
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  console.log(`OFFICIAL_COVERAGE=${JSON.stringify(results)}`);
});

test('RELEASE-RECHECK — playback stop/reset, algorithm cancellation and real Worker init', async ({ page }) => {
  test.setTimeout(300_000);
  const pyodideResponses: string[] = [];
  page.on('response', (response) => {
    if (/pyodide/i.test(response.url())) pyodideResponses.push(response.url());
  });

  // Count real Worker constructions without replacing Worker.prototype. Every
  // structured trace is produced inside one of these workers, so a positive
  // count is evidence that this is not a preconstructed JavaScript trace.
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    const holder = window as unknown as { __releaseWorkerCount: number };
    holder.__releaseWorkerCount = 0;
    const CountingWorker = new Proxy(NativeWorker, {
      construct(target, args) {
        holder.__releaseWorkerCount += 1;
        return Reflect.construct(target, args);
      },
    });
    Object.defineProperty(window, 'Worker', { configurable: true, value: CountingWorker });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 60_000 });
  const select = page.getByTestId('mobile-algo-select');

  await select.selectOption('bubble');
  await expect(page.getByTestId('progress')).toHaveText('1 / 25', { timeout: 60_000 });
  await page.getByTestId('play-btn').click();
  await page.waitForTimeout(600);
  await expect(page.getByTestId('play-btn')).toHaveText(/暂停|Pause/);
  await page.getByTestId('play-btn').click();
  await expect(page.getByTestId('play-btn')).toHaveText(/播放|Play/);
  const pausedAt = (await page.getByTestId('progress').textContent())?.trim() ?? '';
  await page.waitForTimeout(500);
  expect((await page.getByTestId('progress').textContent())?.trim()).toBe(pausedAt);

  await page.getByTestId('restart-btn').click();
  await expect(page.getByTestId('progress')).toHaveText('1 / 25');

  // Starting the old trace then switching algorithm must stop that playback;
  // the new trace owns the timeline from frame one.
  await page.getByTestId('play-btn').click();
  await page.waitForTimeout(300);
  await select.selectOption('insertion');
  await expect(page.getByTestId('progress')).toHaveText('1 / 33', { timeout: 60_000 });
  await page.waitForTimeout(500);
  await expect(page.getByTestId('progress')).toHaveText('1 / 33');

  // Invalid teaching input must be reported by the real Python program, not
  // accepted as a fake one-frame success.
  await select.selectOption('binary');
  await expect(page.getByTestId('progress')).toHaveText('1 / 10', { timeout: 60_000 });
  await page.locator('#run-input').fill('3, 1, 2');
  await page.locator('[data-testid="binary-target"]').fill('2');
  await page.getByTestId('run-btn').click();
  await expect(page.getByTestId('search-invalid')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('search-invalid')).toContainText('不是升序');
  await expect(page.getByTestId('progress')).toHaveText('1 / 1');

  expect(await page.evaluate(() => (window as unknown as { __releaseWorkerCount: number }).__releaseWorkerCount)).toBeGreaterThan(0);
  expect(pyodideResponses.some((url) => /pyodide\.js/i.test(url))).toBe(true);
  expect(pyodideResponses.some((url) => /\.wasm/i.test(url))).toBe(true);
});
