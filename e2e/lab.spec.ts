import { expect, openCodePanel, openLessonStepNav, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

test.describe('Stage 3 — Python recursion in the real browser', () => {
  test('Stage 3 — Python factorial recursion: real Pyodide call stack, result 24', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await openCodePanel(page);

    await chooseAlgorithm(page, 'factorial');

    // First run downloads Pyodide (~10 MB) and executes the real recursion.
    await expect(page.locator('[data-testid="call-stack"]')).toBeVisible({ timeout: 120_000 });

    // factorial(4) begins: at least one frame, and stepping forward pushes more.
    await expect(page.locator('[data-testid="call-frame-f1"]')).toBeVisible();

    // Step down until the inner frame appears. Stage 3B added a real `recurse`
    // event before the deeper call, so the exact number of steps between two
    // calls is data-driven — assert the behaviour, not a fixed ordinal.
    let stepsDown = 0;
    for (; stepsDown < 6; stepsDown += 1) {
      if ((await page.locator('[data-testid="call-frame-f2"]').count()) > 0) break;
      await page.click('[data-testid="next-btn"]');
    }
    await expect(page.locator('[data-testid="call-frame-f2"]')).toBeVisible();

    // The variables watch shows the per-frame `n`.
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('n');

    // The compact run bar has no source editor, so only the real trace state is asserted.

    // Rewind restores the historical (smaller) call stack.
    for (let i = 0; i < stepsDown; i += 1) await page.click('[data-testid="prev-btn"]');
    await expect(page.locator('[data-testid="call-frame-f2"]')).toHaveCount(0);

    // Scrub to the last event: the call stack is cleared and `answer` = 24.
    const last = await page.locator('[data-testid="scrub"]').evaluate((el) => (el as HTMLInputElement).max);
    await page.locator('[data-testid="scrub"]').fill(String(last));
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('24');
    await expect(page.locator('[data-testid="current-step-message"]')).toContainText('完成');
  });

  test('Stage 3 — Python Fibonacci recursion: real Pyodide branches, result 3', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await openCodePanel(page);

    await chooseAlgorithm(page, 'fib');

    await expect(page.locator('[data-testid="call-stack"]')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('[data-testid="call-frame-f1"]')).toBeVisible();

    // fib(4) recurses into several branches, each a distinct frame.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="call-frame-f2"]')).toBeVisible({ timeout: 15_000 });
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="call-frame-f3"]')).toBeVisible({ timeout: 15_000 });

    // Scrub to the end: fib(4) = 3.
    const last = await page.locator('[data-testid="scrub"]').evaluate((el) => (el as HTMLInputElement).max);
    await page.locator('[data-testid="scrub"]').fill(String(last));
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('3');
  });
});

/**
 * Stage 3B — the teaching panel is driven by the SAME cursor as the timeline,
 * and its highlight comes from `lesson_step=` recorded by the real Python run.
 * No mocked frames here: these tests require the actual Pyodide download.
 */
test.describe('Stage 3B — teaching steps synced with real Pyodide execution', () => {
  test('factorial recursion: lesson stages track the real call stack, answer stays 24', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await openCodePanel(page);

    await chooseAlgorithm(page, 'factorial');

    await expect(page.locator('[data-testid="lesson-title"]')).toContainText('递归阶乘');
    // Frame 0 is the decorator-emitted `call` event of factorial(4).
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute(
      'data-step-id',
      'call',
      { timeout: 120_000 },
    );
    await expect(page.locator('[data-testid="call-frame-f1"]')).toBeVisible();

    // Jump to the first `combine` frame: the call stack must still be on screen
    // and the variables must belong to that depth, not to a guessed state.
    await openLessonStepNav(page);
    await page.click('[data-testid="lesson-step-combine"]');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'combine');
    await expect(page.locator('[data-testid="call-stack"]')).toBeVisible();
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('n');

    // End of the trace: `done` stage, real answer 24, stack cleared.
    const last = await page.locator('[data-testid="scrub"]').evaluate((el) => (el as HTMLInputElement).max);
    await page.locator('[data-testid="scrub"]').fill(String(last));
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('24');
    await expect(page.locator('[data-testid="call-stack"]')).toHaveCount(0);

    // Backward: returning to frame 0 restores the `call` stage and the stack.
    await page.locator('[data-testid="scrub"]').fill('0');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'call');
    await expect(page.locator('[data-testid="call-frame-f1"]')).toBeVisible();
  });
});

/**
 * Regression for the Stage-3 timeline bug: the reset effect watched the DOM
 * global `window.frames` instead of the event array, so a scrubbed index survived
 * an algorithm switch and could point past the end of the new trace.
 *
 * Uses only JavaScript presets, so this test needs no Pyodide download.
 */
test.describe('Stage 3 fix — switching traces resets the timeline', () => {
  test('scrubbing the 25-frame bubble sort then switching to the 10-frame binary search lands on frame 1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });

    // Bubble sort is the longest legacy trace: 25 frames.
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 25');

    const last = await page.locator('[data-testid="scrub"]').evaluate((el) => (el as HTMLInputElement).max);
    await page.locator('[data-testid="scrub"]').fill(String(last));
    await expect(page.locator('[data-testid="progress"]')).toHaveText('25 / 25');

    // F1 binary search runs the real 10-frame Python trace, so index 24 is
    // out of range for it and the playhead must reset to frame 1.
    await chooseAlgorithm(page, 'binary');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 10');

    // The stage still renders a real frame instead of the empty placeholder.
    await expect(page.locator('[data-testid="visual-stage"] .empty')).toHaveCount(0);
    await expect(page.locator('[data-testid="visual-stage"] .bar')).toHaveCount(7);
    await expect(page.locator('[data-testid="step-desc"]')).toContainText('初始化闭区间');
    await expect(page.locator('[data-testid="step-number"]')).toContainText('1');
  });
});
