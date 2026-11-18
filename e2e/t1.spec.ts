import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/t1');
mkdirSync(SHOT_DIR, { recursive: true });

async function openAlgorithm(page: Page, total: number) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, 'bst');
  await expect(page.locator('[data-testid="bst-visual"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
}

async function setFrame(page: Page, frame: number, total: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / ${total}`);
}

async function selectPreset(page: Page, preset: string, total: number) {
  await page.getByTestId(`bst-preset-${preset}`).click();
  await expect(page.locator('[data-testid="bst-picker"]')).toHaveAttribute('data-selected', preset);
  await expect(page.locator('[data-testid="bst-preset-pending"]')).toBeVisible();
  await page.getByTestId('run-btn').click();
  await expect(page.locator('[data-testid="bst-picker"]')).toHaveAttribute('data-actual', preset, { timeout: 60_000 });
  await expect(page.locator('[data-testid="bst-preset-pending"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
}

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function activeIds(page: Page): Promise<string[]> {
  return page.locator('[data-testid="bst-node"][data-active="true"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-node-id') ?? ''),
  );
}

async function nodeIds(page: Page): Promise<string[]> {
  return page.locator('[data-testid="bst-node"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-node-id') ?? ''),
  );
}

async function edgePairs(page: Page): Promise<string[]> {
  return page.locator('[data-testid="bst-edge"]').evaluateAll((edges) =>
    edges.map((edge) => `${edge.getAttribute('data-from-id')}>${edge.getAttribute('data-to-id')}`),
  );
}

test.describe('T1 — BST search, insert and three delete cases', () => {
  test('runs the real Python presets, scrubs backward and captures deletion evidence', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAlgorithm(page, 8);

    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-command', 'find');
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-root-id', 'b1');
    await expect(page.locator('[data-testid="bst-node"]')).toHaveCount(7);
    expect(await nodeIds(page)).toEqual(['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7']);
    expect(await edgePairs(page)).toEqual(['b1>b2', 'b1>b3', 'b2>b4', 'b2>b5', 'b3>b6', 'b3>b7']);
    await expect(page.locator('[data-testid="bst-inorder-item"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="bst-target"]')).toContainText('40');

    await setFrame(page, 5, 8);
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-operation', 'inspect');
    expect(await activeIds(page)).toEqual(['b5']);
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b5"]')).toHaveAttribute('data-target', 'false');
    await expect(page.locator('[data-testid="bst-compared-item"]')).toHaveCount(3);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'compare');

    await setFrame(page, 6, 8);
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-result', 'found');
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b5"]')).toHaveAttribute('data-target', 'true');
    await expect(page.locator('[data-testid="bst-result"]')).toContainText('查找成功');
    await expect(page.locator('[data-testid="bst-path"]')).toHaveAttribute('data-current-id', 'b5');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'found');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-find-found-1440-light.png'), fullPage: true });

    await setFrame(page, 1, 8);
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-operation', 'inspect');
    expect(await activeIds(page)).toEqual(['b1']);
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b5"]')).toHaveAttribute('data-target', 'false');
    await expect(page.locator('[data-testid="bst-compared-item"]')).toHaveCount(1);

    await selectPreset(page, 'insert', 9);
    await setFrame(page, 7, 9);
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-result', 'inserted');
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b8"]')).toHaveAttribute('data-value', '35');
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b8"]')).toHaveAttribute('data-inserted', 'true');
    expect(await edgePairs(page)).toContain('b5>b8');
    await expect(page.locator('[data-testid="bst-pointer"]')).toContainText('40');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'insert');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-insert-attach-1440-light.png'), fullPage: true });

    await selectPreset(page, 'delete-leaf', 9);
    await setFrame(page, 7, 9);
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-delete-case', 'leaf');
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b4"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="bst-removed"]')).toHaveAttribute('data-removed-id', 'b4');
    await expect(page.locator('[data-testid="bst-removed"]')).toContainText('b2');
    await expect(page.locator('[data-testid="bst-case-leaf"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="bst-node"]')).toHaveCount(6);
    expect(await edgePairs(page)).not.toContain('b2>b4');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'delete-leaf');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-delete-leaf-1440-light.png'), fullPage: true });

    await selectPreset(page, 'delete-one', 9);
    await setFrame(page, 7, 9);
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-delete-case', 'one-child');
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b6"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="bst-removed"]')).toHaveAttribute('data-removed-id', 'b6');
    await expect(page.locator('[data-testid="bst-pointer"]')).toContainText('b3');
    await expect(page.locator('[data-testid="bst-pointer"]')).toContainText('b8');
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b8"]')).toHaveCount(1);
    expect(await edgePairs(page)).toContain('b3>b8');
    expect(await edgePairs(page)).not.toContain('b3>b6');
    await expect(page.locator('[data-testid="bst-case-one-child"]')).toHaveAttribute('data-active', 'true');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-delete-one-1440-light.png'), fullPage: true });

    await selectPreset(page, 'delete-two', 9);
    await setFrame(page, 5, 9);
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b6"]')).toHaveAttribute('data-successor', 'true');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'successor');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-delete-two-successor-1440-light.png'), fullPage: true });

    await setFrame(page, 6, 9);
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b6"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="bst-removed"]')).toHaveAttribute('data-role', 'successor');
    await expect(page.locator('[data-testid="bst-removed"]')).toHaveText(/b6[\s\S]*60/);
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b1"]')).toHaveCount(1);
    expect(await edgePairs(page)).toContain('b3>b8');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'successor-detach');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-delete-two-detach-1440-light.png'), fullPage: true });

    await setFrame(page, 7, 9);
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-root-id', 'b6');
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b1"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b6"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="bst-removed"]')).toHaveAttribute('data-role', 'target');
    await expect(page.locator('[data-testid="bst-root-change"]')).toHaveAttribute('data-old-root', 'b1');
    await expect(page.locator('[data-testid="bst-root-change"]')).toHaveAttribute('data-new-root', 'b6');
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b6"]')).toHaveAttribute('data-role', 'root');
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b3"]')).toHaveCount(1);
    expect(await edgePairs(page)).toContain('b3>b8');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'transplant');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-delete-two-transplant-1440-light.png'), fullPage: true });

    await setFrame(page, 8, 9);
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-result', 'deleted');
    await expect(page.locator('[data-testid="bst-case-two-child"]')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');

    await setFrame(page, 5, 9);
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-root-id', 'b1');
    await expect(page.locator('[data-testid="bst-node"][data-node-id="b6"]')).toHaveAttribute('data-successor', 'true');
    await setFrame(page, 7, 9);
    await expect(page.locator('[data-testid="bst-visual"]')).toHaveAttribute('data-root-id', 'b6');
    await expect(page.locator('[data-testid="bst-root-change"]')).toHaveAttribute('data-new-root', 'b6');

    await setFrame(page, 8, 9);
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-delete-two-done-390-light.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.getByRole('button', { name: 'Switch language' })).toBeVisible();
    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.locator('[data-testid="bst-op-label"]')).toContainText('operation complete');
    await expect(page.locator('[data-testid="bst-result"]')).toContainText('Deleted');
    await expect(page.getByTestId('lesson-active-step')).toContainText('BST operation complete');
  });
});
