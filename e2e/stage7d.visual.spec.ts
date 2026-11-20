import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/stage7d/after');
mkdirSync(SHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
];
const THEMES = ['light', 'dark'] as const;

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, 'inorder');
  await expect(page.locator('[data-testid="tree-visual"]')).toBeVisible({ timeout: 60_000 });
}

async function setFrame(page: Page, frame: number, total = 30) {
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

async function runMode(page: Page, mode: 'preorder' | 'inorder' | 'postorder') {
  const picker = page.locator('[data-testid="tree-mode-picker"]');
  if ((await picker.getAttribute('data-actual')) !== mode) {
    await page.getByTestId(`tree-mode-${mode}`).click();
    await expect(page.locator('[data-testid="tree-mode-pending"]')).toBeVisible();
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 30', { timeout: 60_000 });
  }
  await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-traversal', mode);
}

async function captureStates(
  page: Page,
  prefix: string,
  states: Array<{ name: string; frame: number; assert?: () => Promise<void> }>,
  total = 30,
) {
  for (const theme of THEMES) {
    await page.selectOption('[data-testid="theme-select"]', theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await expectNoPageOverflow(page);
      for (const state of states) {
        await setFrame(page, state.frame, total);
        await state.assert?.();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: resolve(SHOT_DIR, `${prefix}-${state.name}-${viewport.width}-${theme}.png`),
          fullPage: viewport.width === 390,
        });
      }
    }
  }
}

test.describe('Stage 7D visual evidence', () => {
  test('captures real inorder, preorder, postorder and edge states at 1440/1024/390 in light/dark', async ({ page }) => {
    test.setTimeout(600_000);
    await openApp(page);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 30', { timeout: 60_000 });

    await runMode(page, 'inorder');
    await captureStates(page, 'tree-inorder', [
      { name: 'init', frame: 0 },
      {
        name: 'deep-call-stack',
        frame: 5,
        assert: async () => {
          await expect(page.locator('[data-testid="tree-node"][data-active="true"]')).toHaveAttribute('data-node-id', 'n4');
          await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-operation', 'enter');
        },
      },
      { name: 'leftmost-visit', frame: 6 },
      { name: 'leftmost-return', frame: 7 },
      { name: 'root-visit', frame: 14 },
      { name: 'order', frame: 28 },
    ]);

    await runMode(page, 'preorder');
    await captureStates(page, 'tree-preorder', [
      { name: 'root-enter', frame: 1 },
      { name: 'root-visit', frame: 2 },
      { name: 'left-subtree', frame: 8 },
      { name: 'order', frame: 28 },
      { name: 'rollback', frame: 8 },
    ]);

    await runMode(page, 'postorder');
    await captureStates(page, 'tree-postorder', [
      { name: 'left-done', frame: 12 },
      { name: 'root-visit', frame: 26 },
      { name: 'order', frame: 28 },
    ]);

    for (const [name, input, total] of [
      ['empty', '[]', 3],
      ['single', '[4]', 6],
      ['equal-values', '[7,7,7]', 14],
    ] as const) {
      await openCodePanel(page);
      await page.fill('#run-input', input);
      await page.getByTestId('run-btn').click();
      await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
      await expect(page.locator('[data-testid="tree-node"]')).toHaveCount(name === 'empty' ? 0 : name === 'single' ? 1 : 3);
      await captureStates(page, `tree-${name}`, [{ name, frame: 0 }], total);
    }

    // Recursion-stack evidence: the tree canvas and the real three-frame stack
    // must be in the same captured run, not two unrelated screenshots.
    await openCodePanel(page);
    await page.fill('#run-input', '[4, 2, 6, 1, 3, 5, 7]');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 30', { timeout: 60_000 });
    await setFrame(page, 5, 30);
    await expect(page.locator('[data-testid^="call-frame-f"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="variables-watch"]')).toBeVisible();
    for (const theme of THEMES) {
      await page.selectOption('[data-testid="theme-select"]', theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      for (const width of [1440, 390] as const) {
        await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
        await expectNoPageOverflow(page);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: resolve(SHOT_DIR, `tree-inorder-call-stack-${width}-${theme}.png`),
          fullPage: true,
        });
      }
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.selectOption('[data-testid="theme-select"]', 'light');
  });
});
