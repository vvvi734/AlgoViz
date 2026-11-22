import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/stage7b/after');
mkdirSync(SHOT_DIR, { recursive: true });

async function openApp(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgo(page: Page, id: string) {
  await chooseAlgorithm(page, id);
}

/** Values in ascending physical slot order; empty slots are not items. */
async function stackValues(page: Page): Promise<string[]> {
  return page.locator('[data-testid="array-stack-slot"]').evaluateAll((nodes) =>
    nodes
      .map((node) => node.getAttribute('data-value') ?? '')
      .filter(Boolean),
  );
}

/** Values in ascending physical slot order; circular slots may wrap. */
async function queueValues(page: Page): Promise<string[]> {
  return page.locator('[data-testid="circular-queue-slot"]').evaluateAll((nodes) =>
    nodes
      .map((node) => node.getAttribute('data-value') ?? '')
      .filter(Boolean),
  );
}

async function setFrame(page: Page, frame: number, total = 8) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / ${total}`);
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function captureStates(
  page: Page,
  prefix: string,
  shotStates: Array<{ name: string; assert: () => Promise<void> }>,
) {
  for (const theme of ['light', 'dark'] as const) {
    await page.selectOption('[data-testid="theme-select"]', theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await expectNoPageOverflow(page);
      for (const state of shotStates) {
        await state.assert();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: resolve(SHOT_DIR, `${prefix}-${state.name}-${viewport.width}-${theme}.png`),
          fullPage: viewport.width === 390,
        });
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

test.describe('Stage 7B — AlgoViz brand and real stack/queue animation', () => {
  test('brand is AlgoViz while the legacy theme key still loads', async ({ page }) => {
    await openApp(page);
    await expect(page).toHaveTitle(/AlgoViz/);
    await expect(page.locator('[data-testid="brand-name"]')).toContainText('AlgoViz');
    await expect(page.locator('[data-testid="brand-name"]')).toContainText('交互式数据结构与算法学习平台');
    expect(await page.locator('body').innerText()).not.toContain('AlgoLens');

    await page.evaluate(() => {
      window.localStorage.setItem('algolens.code.bubble.js', 'const LEGACY_DRAFT = 1;');
      window.localStorage.setItem('algolens-theme', 'light');
    });
    await page.reload();
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await openCodePanel(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('array stack: real Python frames, LIFO values, peek/pop and rollback + screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgo(page, 'stack');
    // Selecting stack auto-runs the Python preset. The default storage is the
    // sequential array, so top is an index into fixed capacity slots.
    await expect(page.locator('[data-testid="array-stack-visual"]')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 8');
    await expect(page.locator('[data-testid="run-feedback"]')).not.toContainText('执行出错');

    // Frame 0: explicit empty stack — every capacity slot is free and top = -1.
    await expect(page.locator('[data-testid="array-stack-top"]')).toHaveText('top = -1');
    expect(await stackValues(page)).toEqual([]);
    await expect(page.locator('[data-testid="array-stack-slot"][data-status="free"]')).not.toHaveCount(0);
    await expect(page.locator('[data-testid="array-stack-leaving"]')).toHaveCount(0);

    // Frames 1-3: push 3, 5, 8. Values live in ascending slots; top = 2 holds 8.
    for (let i = 0; i < 3; i += 1) await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('4 / 8');
    expect(await stackValues(page)).toEqual(['3', '5', '8']);
    await expect(page.locator('[data-testid="array-stack-top"]')).toHaveText('top = 2');
    await expect(page.locator('[data-testid="array-stack-slot"][data-status="top"]')).toHaveAttribute('data-value', '8');
    await expect(page.locator('[data-testid="array-stack-slot"][data-status="filled"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="array-stack-visual"] .structure-op')).toContainText('PUSH');
    await expect(page.locator('[data-testid="step-desc"]')).toContainText(/push 8/i);

    await captureStates(page, 'stack', [
      {
        name: 'push',
        assert: async () => {
          expect(await stackValues(page)).toEqual(['3', '5', '8']);
        },
      },
    ]);

    // Frame 4: the official fourth push fills the stack with 11 at TOP.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('5 / 8');
    expect(await stackValues(page)).toEqual(['3', '5', '8', '11']);
    await expect(page.locator('[data-testid="array-stack-top"]')).toHaveText('top = 3');

    // Frame 5: peek highlights 11 without removing the value.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="array-stack-visual"] .structure-op')).toContainText('PEEK');
    expect(await stackValues(page)).toEqual(['3', '5', '8', '11']);
    await expect(page.locator('[data-testid="array-stack-slot"][data-status="top"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="array-stack-leaving"]')).toHaveCount(0);

    // Frame 6: pop removes 11; 8 becomes TOP and the removed block is separate.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="array-stack-visual"] .structure-op')).toContainText('POP');
    expect(await stackValues(page)).toEqual(['3', '5', '8']);
    await expect(page.locator('[data-testid="array-stack-top"]')).toHaveText('top = 2');
    await expect(page.locator('[data-testid="array-stack-leaving"]')).toContainText('11');
    await expect(page.locator('[data-testid="array-stack-slot"][data-status="top"]')).toHaveAttribute('data-value', '8');

    await captureStates(page, 'stack', [
      {
        name: 'pop',
        assert: async () => {
          expect(await stackValues(page)).toEqual(['3', '5', '8']);
          await expect(page.locator('[data-testid="array-stack-leaving"]')).toContainText('11');
        },
      },
    ]);

    // Scrub back to peek: 11 must be restored, not replayed.
    await page.click('[data-testid="prev-btn"]');
    expect(await stackValues(page)).toEqual(['3', '5', '8', '11']);
    await expect(page.locator('[data-testid="array-stack-leaving"]')).toHaveCount(0);

    // Empty-state screenshots: scrub back to frame 0.
    await setFrame(page, 0);
    await expect(page.locator('[data-testid="array-stack-top"]')).toHaveText('top = -1');
    expect(await stackValues(page)).toEqual([]);
    await captureStates(page, 'stack', [
      {
        name: 'empty',
        assert: async () => {
          await expect(page.locator('[data-testid="array-stack-top"]')).toHaveText('top = -1');
          expect(await stackValues(page)).toEqual([]);
        },
      },
    ]);
  });

  test('circular queue: real Python frames, FIFO values, front/dequeue and rollback + responsive screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgo(page, 'queue');
    await expect(page.locator('[data-testid="circular-queue-visual"]')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 10');
    await expect(page.locator('[data-testid="run-feedback"]')).not.toContainText('执行出错');

    // Empty: front == rear == 0 and every physical slot is free.
    await expect(page.locator('[data-testid="circular-front"]')).toHaveText('front = 0');
    await expect(page.locator('[data-testid="circular-rear"]')).toHaveText('rear = 0');
    expect(await queueValues(page)).toEqual([]);
    await expect(page.locator('[data-testid="circular-queue-slot"][data-status="free"]')).not.toHaveCount(0);

    for (let i = 0; i < 3; i += 1) await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('4 / 10');
    expect(await queueValues(page)).toEqual(['3', '5', '8']);
    await expect(page.locator('[data-testid="circular-front"]')).toHaveText('front = 0');
    await expect(page.locator('[data-testid="circular-rear"]')).toHaveText('rear = 3');
    await expect(page.locator('[data-testid="circular-queue-slot"][data-status="front"]')).toHaveAttribute('data-value', '3');
    await expect(page.locator('[data-testid="circular-queue-slot"][data-rear="true"]')).toHaveAttribute('data-slot', '3');
    await expect(page.locator('[data-testid="circular-queue-visual"] .structure-op')).toContainText('ENQUEUE');
    await expect(page.locator('[data-testid="step-desc"]')).toContainText(/enqueue 8/i);

    await captureStates(page, 'queue', [
      {
        name: 'enqueue',
        assert: async () => {
          expect(await queueValues(page)).toEqual(['3', '5', '8']);
        },
      },
    ]);

    // Reduced motion at the enqueue frame: the entering slot must not animate.
    const entering = page.locator('[data-testid="circular-queue-slot"][data-value="8"]');
    expect(await entering.evaluate((node) => getComputedStyle(node).animationName)).not.toBe('none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await entering.evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Frame 4: the official fourth enqueue stores 11 in physical slot 3; REAR
    // advances to the next free slot 4, so the rear marker itself has no value.
    await page.click('[data-testid="next-btn"]');
    expect(await queueValues(page)).toEqual(['3', '5', '8', '11']);
    await expect(page.locator('[data-testid="circular-queue-slot"][data-rear="true"]')).toHaveAttribute('data-slot', '4');
    await expect(page.locator('[data-testid="circular-queue-slot"][data-rear="true"]')).toHaveAttribute('data-value', '');
    await expect(page.locator('[data-testid="circular-queue-slot"][data-slot="3"]')).toHaveAttribute('data-value', '11');

    // Frame 5: FRONT highlights 3; count and order unchanged.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="circular-queue-visual"] .structure-op')).toContainText('FRONT');
    expect(await queueValues(page)).toEqual(['3', '5', '8', '11']);
    await expect(page.locator('[data-testid="circular-queue-slot"][data-status="front"]')).toHaveAttribute('data-active', 'true');

    // Frame 6: dequeue removes 3 at FRONT; 5 becomes FRONT and 11 stays in
    // physical slot 3 while REAR remains the next free slot 4.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="circular-queue-visual"] .structure-op')).toContainText('DEQUEUE');
    expect(await queueValues(page)).toEqual(['5', '8', '11']);
    await expect(page.locator('[data-testid="circular-queue-leaving"]')).toContainText('3');
    await expect(page.locator('[data-testid="circular-queue-slot"][data-status="front"]')).toHaveAttribute('data-value', '5');
    await expect(page.locator('[data-testid="circular-queue-slot"][data-rear="true"]')).toHaveAttribute('data-slot', '4');
    await expect(page.locator('[data-testid="circular-queue-slot"][data-slot="3"]')).toHaveAttribute('data-value', '11');

    await captureStates(page, 'queue', [
      {
        name: 'dequeue',
        assert: async () => {
          expect(await queueValues(page)).toEqual(['5', '8', '11']);
          await expect(page.locator('[data-testid="circular-queue-leaving"]')).toContainText('3');
        },
      },
    ]);

    // Rollback restores 3 at FRONT.
    await page.click('[data-testid="prev-btn"]');
    expect(await queueValues(page)).toEqual(['3', '5', '8', '11']);
    await expect(page.locator('[data-testid="circular-queue-leaving"]')).toHaveCount(0);

    // Empty state.
    await setFrame(page, 0, 10);
    await expect(page.locator('[data-testid="circular-front"]')).toHaveText('front = 0');
    await expect(page.locator('[data-testid="circular-rear"]')).toHaveText('rear = 0');
    await captureStates(page, 'queue', [
      {
        name: 'empty',
        assert: async () => {
          expect(await queueValues(page)).toEqual([]);
          await expect(page.locator('[data-testid="circular-queue-slot"][data-status="free"]')).not.toHaveCount(0);
        },
      },
    ]);
  });

  test('1024 and 390 keep the structure canvas, current state and no page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openApp(page);
    await selectAlgo(page, 'stack');
    await expect(page.locator('[data-testid="array-stack-visual"]')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 8');
    for (let i = 0; i < 3; i += 1) await page.click('[data-testid="next-btn"]');
    const progress = await page.locator('[data-testid="progress"]').textContent();
    expect(await stackValues(page)).toEqual(['3', '5', '8']);

    await expectNoPageOverflow(page);
    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    expect(stage?.width ?? 0).toBeGreaterThan(300);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoPageOverflow(page);
    await expect(page.locator('[data-testid="mobile-algo-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="array-stack-visual"]')).toBeVisible();
    expect(await stackValues(page)).toEqual(['3', '5', '8']);
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progress ?? '4 / 8');
  });
});
