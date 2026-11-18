import { expect, openCodePanel, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/stage7b/after');
mkdirSync(SHOT_DIR, { recursive: true });

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgo(page: Page, id: string) {
  const mobile = page.locator('[data-testid="mobile-algo-select"]');
  if (await mobile.isVisible()) {
    await mobile.selectOption(id);
  } else {
    await page.click(`[data-testid="algo-${id}"]`);
  }
}

async function stackValues(page: Page): Promise<string[]> {
  return page.locator('[data-testid="stack-item"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-value') ?? ''),
  );
}

async function queueValues(page: Page): Promise<string[]> {
  return page.locator('[data-testid="queue-item"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-value') ?? ''),
  );
}

async function setFrame(page: Page, frame: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / 7`);
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
  test('brand is AlgoViz while legacy localStorage keys still load', async ({ page }) => {
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
    await expect(page.locator('.monaco-editor')).toContainText('LEGACY_DRAFT');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('stack: real Python frames, LIFO DOM order, peek/pop and rollback + screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgo(page, 'stack');
    // Selecting stack must auto-run the Python preset in Python, not the JS
    // legacy runner. Otherwise the first view is the old node list with an
    // "Invalid or unexpected token" error.
    await expect(page.locator('[data-testid="stack-visual"]')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 7');
    await expect(page.locator('[data-testid="run-feedback"]')).not.toContainText('执行出错');

    // Frame 0: real empty stack with no fabricated item.
    await expect(page.locator('[data-testid="stack-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="stack-item"]')).toHaveCount(0);

    // Frame 3: push 3, 5, 8 — DOM top→bottom is 8,5,3 (LIFO).
    for (let i = 0; i < 3; i += 1) await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('4 / 7');
    expect(await stackValues(page)).toEqual(['8', '5', '3']);
    await expect(page.locator('[data-testid="stack-item"]').first()).toHaveAttribute('data-role', 'top');
    await expect(page.locator('[data-testid="stack-item"]').first()).toHaveAttribute('data-element-id', 's3');
    await expect(page.locator('[data-testid="stack-op-label"]')).toContainText('PUSH');
    await expect(page.locator('[data-testid="step-desc"]')).toContainText('Push 8');
    await expect(page.locator('.algolens-active-line')).toHaveCount(1);

    await captureStates(page, 'stack', [
      {
        name: 'push',
        assert: async () => {
          expect(await stackValues(page)).toEqual(['8', '5', '3']);
        },
      },
    ]);

    // Frame 4: peek highlights TOP without removing.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="stack-op-label"]')).toContainText('PEEK');
    expect(await stackValues(page)).toEqual(['8', '5', '3']);
    await expect(page.locator('[data-testid="stack-item"]').first()).toHaveAttribute('data-active', 'true');

    // Frame 5: pop removes 8 and 5 becomes TOP; the removed block is separate.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="stack-op-label"]')).toContainText('POP');
    expect(await stackValues(page)).toEqual(['5', '3']);
    await expect(page.locator('[data-testid="stack-leaving"]')).toHaveAttribute('data-value', '8');
    await expect(page.locator('[data-testid="stack-item"]').first()).toHaveAttribute('data-role', 'top');

    await captureStates(page, 'stack', [
      {
        name: 'pop',
        assert: async () => {
          expect(await stackValues(page)).toEqual(['5', '3']);
          await expect(page.locator('[data-testid="stack-leaving"]')).toHaveAttribute('data-value', '8');
        },
      },
    ]);

    // Scrub back to peek: 8 must be restored, not replayed.
    await page.click('[data-testid="prev-btn"]');
    expect(await stackValues(page)).toEqual(['8', '5', '3']);
    await expect(page.locator('[data-testid="stack-leaving"]')).toHaveCount(0);

    // Empty-state screenshots: scrub back to frame 0.
    await setFrame(page, 0);
    await expect(page.locator('[data-testid="stack-empty"]')).toBeVisible();
    await captureStates(page, 'stack', [
      {
        name: 'empty',
        assert: async () => {
          await expect(page.locator('[data-testid="stack-empty"]')).toBeVisible();
          await expect(page.locator('[data-testid="stack-item"]')).toHaveCount(0);
        },
      },
    ]);
  });

  test('queue: real Python frames, FIFO DOM order, front/dequeue and rollback + responsive screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgo(page, 'queue');
    await expect(page.locator('[data-testid="queue-visual"]')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 7');
    await expect(page.locator('[data-testid="run-feedback"]')).not.toContainText('执行出错');

    await expect(page.locator('[data-testid="queue-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(0);

    for (let i = 0; i < 3; i += 1) await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('4 / 7');
    expect(await queueValues(page)).toEqual(['3', '5', '8']);
    await expect(page.locator('[data-testid="queue-item"]').first()).toHaveAttribute('data-role', 'front');
    await expect(page.locator('[data-testid="queue-item"]').last()).toHaveAttribute('data-role', 'rear');
    await expect(page.locator('[data-testid="queue-op-label"]')).toContainText('ENQUEUE');
    await expect(page.locator('[data-testid="step-desc"]')).toContainText('Enqueue 8');

    await captureStates(page, 'queue', [
      {
        name: 'enqueue',
        assert: async () => {
          expect(await queueValues(page)).toEqual(['3', '5', '8']);
        },
      },
    ]);

    // Reduced motion at the enqueue frame: the entering item must not animate.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const animationName = await page.locator('[data-testid="queue-item"]').last().evaluate(
      (node) => getComputedStyle(node).animationName,
    );
    expect(animationName).toBe('none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Frame 4: front highlights 3, length unchanged.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="queue-op-label"]')).toContainText('FRONT');
    expect(await queueValues(page)).toEqual(['3', '5', '8']);
    await expect(page.locator('[data-testid="queue-item"]').first()).toHaveAttribute('data-active', 'true');

    // Frame 5: dequeue removes 3 at FRONT; 5 becomes FRONT and 8 remains REAR.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="queue-op-label"]')).toContainText('DEQUEUE');
    expect(await queueValues(page)).toEqual(['5', '8']);
    await expect(page.locator('[data-testid="queue-leaving"]')).toHaveAttribute('data-value', '3');
    await expect(page.locator('[data-testid="queue-item"]').first()).toHaveAttribute('data-role', 'front');
    await expect(page.locator('[data-testid="queue-item"]').last()).toHaveAttribute('data-role', 'rear');

    await captureStates(page, 'queue', [
      {
        name: 'dequeue',
        assert: async () => {
          expect(await queueValues(page)).toEqual(['5', '8']);
          await expect(page.locator('[data-testid="queue-leaving"]')).toHaveAttribute('data-value', '3');
        },
      },
    ]);

    // Rollback restores 3 at FRONT.
    await page.click('[data-testid="prev-btn"]');
    expect(await queueValues(page)).toEqual(['3', '5', '8']);
    await expect(page.locator('[data-testid="queue-leaving"]')).toHaveCount(0);

    // Empty state.
    await setFrame(page, 0);
    await expect(page.locator('[data-testid="queue-empty"]')).toBeVisible();
    await captureStates(page, 'queue', [
      {
        name: 'empty',
        assert: async () => {
          await expect(page.locator('[data-testid="queue-empty"]')).toBeVisible();
          await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(0);
        },
      },
    ]);
      });

  test('1024 and 390 keep the structure canvas, current state and no page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openApp(page);
    await selectAlgo(page, 'stack');
    await expect(page.locator('[data-testid="stack-visual"]')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 7');
    for (let i = 0; i < 3; i += 1) await page.click('[data-testid="next-btn"]');
    const progress = await page.locator('[data-testid="progress"]').textContent();
    expect(await stackValues(page)).toEqual(['8', '5', '3']);

    await expectNoPageOverflow(page);
    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    expect(stage?.width ?? 0).toBeGreaterThan(300);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoPageOverflow(page);
    await expect(page.locator('[data-testid="mobile-algo-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="stack-visual"]')).toBeVisible();
    expect(await stackValues(page)).toEqual(['8', '5', '3']);
    await expect(page.locator('[data-testid="progress"]')).toHaveText(progress ?? '4 / 7');
  });
});
