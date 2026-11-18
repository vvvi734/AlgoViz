import { expect, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/t2');
mkdirSync(SHOT_DIR, { recursive: true });

async function openAlgorithm(page: Page, total: number) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  const mobile = page.locator('[data-testid="mobile-algo-select"]');
  if (await mobile.isVisible()) {
    await mobile.selectOption('avl');
  } else {
    const item = page.locator('[data-testid="algo-avl"]');
    if (!(await item.isVisible())) {
      const group = page.locator('[data-testid="group-tree"]');
      if ((await group.getAttribute('aria-expanded')) !== 'true') await group.click();
    }
    await item.click();
  }
  await expect(page.locator('[data-testid="avl-visual"]')).toBeVisible({ timeout: 60_000 });
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
  await page.getByTestId(`avl-preset-${preset}`).click();
  await expect(page.locator('[data-testid="avl-picker"]')).toHaveAttribute('data-selected', preset);
  await page.getByTestId('run-btn').click();
  await expect(page.locator('[data-testid="avl-picker"]')).toHaveAttribute('data-actual', preset, { timeout: 60_000 });
  await expect(page.locator('[data-testid="avl-preset-pending"]')).toHaveCount(0);
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
  return page.locator('[data-testid="avl-node"][data-active="true"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-node-id') ?? ''),
  );
}

async function nodeIds(page: Page): Promise<string[]> {
  return page.locator('[data-testid="avl-node"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-node-id') ?? ''),
  );
}

async function edgePairs(page: Page): Promise<string[]> {
  return page.locator('[data-testid="avl-edge"]').evaluateAll((edges) =>
    edges.map((edge) => `${edge.getAttribute('data-from-id')}>${edge.getAttribute('data-to-id')}`),
  );
}

async function allBalances(page: Page): Promise<number[]> {
  return page.locator('[data-testid="avl-node"]').evaluateAll((nodes) =>
    nodes.map((node) => Number(node.getAttribute('data-balance'))),
  );
}

test.describe('T2 — AVL insert, delete, imbalance detection and four rotations', () => {
  test('runs real Python rotations, preserves stable ids and captures rotation evidence', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAlgorithm(page, 15);

    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-command', 'insert');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-root-id', 'a1');
    await expect(page.locator('[data-testid="avl-node"]')).toHaveCount(4);
    expect(await nodeIds(page)).toEqual(['a1', 'a2', 'a3', 'a4']);
    expect(await edgePairs(page)).toEqual(['a1>a2', 'a1>a3', 'a2>a4']);
    await expect(page.locator('[data-testid="avl-inorder-item"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="avl-target"]')).toContainText('5');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a2"]')).toHaveAttribute('data-height', '2');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a2"]')).toHaveAttribute('data-balance', '1');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');
    await expectNoOverflow(page);

    await setFrame(page, 7, 15);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-operation', 'attach');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a5"]')).toHaveAttribute('data-inserted', 'true');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a5"]')).toHaveAttribute('data-value', '5');
    await expect(page.locator('[data-testid="avl-pointer"]')).toContainText('a4');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'insert');

    await setFrame(page, 10, 15);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-operation', 'imbalance');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-rotation-case', 'LL');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-imbalance-id', 'a2');
    await expect(page.locator('[data-testid="avl-rotation-chip"]')).toContainText('LL');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a2"]')).toHaveAttribute('data-imbalance', 'true');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'imbalance');

    await setFrame(page, 12, 15);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-operation', 'rotate-right');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-rotation-phase', 'after');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-root-id', 'a1');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a1"]')).toHaveAttribute('data-role', 'root');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a4"]')).toHaveAttribute('data-promoted', 'true');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a2"]')).toHaveAttribute('data-pivot', 'true');
    expect(await edgePairs(page)).toEqual(['a1>a4', 'a1>a3', 'a4>a5', 'a4>a2']);
    await expect(page.locator('[data-testid="avl-inorder-item"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a1"]')).toHaveAttribute('data-balance', '1');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a4"]')).toHaveAttribute('data-balance', '0');
    expect((await allBalances(page)).every((balance) => Math.abs(balance) <= 1)).toBe(true);
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'avl-insert-ll-1440-light.png'), fullPage: true });

    await setFrame(page, 7, 15);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-root-id', 'a1');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a5"]')).toHaveCount(1);
    await setFrame(page, 12, 15);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-root-id', 'a1');
    expect(await edgePairs(page)).toEqual(['a1>a4', 'a1>a3', 'a4>a5', 'a4>a2']);

    // RR: one real left rotation.
    await selectPreset(page, 'insert-rr', 15);
    await setFrame(page, 12, 15);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-rotation-case', 'RR');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-operation', 'rotate-left');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-root-id', 'a1');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'avl-insert-rr-1440-light.png'), fullPage: true });

    // LR: two real rotations; keep the intermediate first-after frame as the key shot.
    await selectPreset(page, 'insert-lr', 20);
    await setFrame(page, 15, 20);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-rotation-case', 'LR');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-operation', 'rotate-left');
    await expect(page.locator('[data-testid="avl-rotation-chip"]')).toContainText('1/2');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'rotate-left');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'avl-insert-lr-1440-light.png'), fullPage: true });

    await setFrame(page, 17, 20);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-operation', 'rotate-right');
    await expect(page.locator('[data-testid="avl-rotation-chip"]')).toContainText('2/2');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-rotation-phase', 'after');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'rotate-right');

    // RL: also two real rotations, final-after frame.
    await selectPreset(page, 'insert-rl', 17);
    await setFrame(page, 15, 17);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-rotation-case', 'RL');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-operation', 'rotate-left');
    await expect(page.locator('[data-testid="avl-rotation-chip"]')).toContainText('2/2');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-root-id', 'a5');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a5"]')).toHaveAttribute('data-role', 'root');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'avl-insert-rl-1440-light.png'), fullPage: true });

    // Deletion: leaf, one-child, two-child root, missing, and cascade rebalance.
    await selectPreset(page, 'delete-leaf', 14);
    await setFrame(page, 7, 14);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-delete-case', 'leaf');
    await expect(page.locator('[data-testid="avl-case-leaf"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a6"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="avl-removed"]')).toHaveAttribute('data-removed-id', 'a6');
    await expect(page.locator('[data-testid="avl-node"]')).toHaveCount(6);

    await selectPreset(page, 'delete-one', 11);
    await setFrame(page, 5, 11);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-delete-case', 'one-child');
    await expect(page.locator('[data-testid="avl-case-one-child"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="avl-removed"]')).toHaveAttribute('data-removed-id', 'a3');
    await expect(page.locator('[data-testid="avl-removed"]')).toHaveAttribute('data-role', 'target');
    expect(await edgePairs(page)).toContain('a1>a6');
    expect(await edgePairs(page)).not.toContain('a1>a3');

    await selectPreset(page, 'delete-two', 10);
    await setFrame(page, 4, 10);
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a6"]')).toHaveAttribute('data-successor', 'true');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'successor');
    await setFrame(page, 5, 10);
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a6"]')).toHaveCount(0);
    await setFrame(page, 6, 10);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-root-id', 'a6');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a1"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="avl-root-change"]')).toHaveAttribute('data-old-root', 'a1');
    await expect(page.locator('[data-testid="avl-root-change"]')).toHaveAttribute('data-new-root', 'a6');
    await expect(page.locator('[data-testid="avl-node"][data-node-id="a6"]')).toHaveAttribute('data-value', '60');

    await selectPreset(page, 'delete-cascade', 21);
    await setFrame(page, 19, 21);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-delete-case', 'leaf');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-rotation-case', 'LR');
    await expect(page.locator('[data-testid="avl-rotation-chip"]')).toContainText('2/2');
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-root-id', 'a4');
    await expectNoOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'avl-delete-cascade-rebalance-1440-light.png'), fullPage: true });

    await setFrame(page, 20, 21);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-result', 'deleted');
    expect((await allBalances(page)).every((balance) => Math.abs(balance) <= 1)).toBe(true);
    await expect(page.locator('[data-testid="avl-node"]')).toHaveCount(11);
    await expect(page.locator('[data-testid="avl-node"][data-value="12"]')).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await expect
      .poll(() =>
        page.locator('[data-testid="avl-scroller"]').evaluate((element) => (element as HTMLElement).scrollLeft),
      )
      .toBeGreaterThan(0);
    await page.screenshot({ path: resolve(SHOT_DIR, 'avl-delete-cascade-390-light.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });

    await selectPreset(page, 'delete-missing', 7);
    await setFrame(page, 6, 7);
    await expect(page.locator('[data-testid="avl-visual"]')).toHaveAttribute('data-result', 'missing');
    await expect(page.locator('[data-testid="avl-node"]')).toHaveCount(6);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');

    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.locator('[data-testid="avl-op-label"]')).toContainText('operation complete');
    await expect(page.locator('[data-testid="avl-result"]')).toContainText('Delete failed');
    await expect(page.getByTestId('lesson-active-step')).toContainText('AVL operation complete');
  });
});
