import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgo(page: Page, id: string) {
  await chooseAlgorithm(page, id);
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

async function selectMode(page: Page, mode: 'preorder' | 'inorder' | 'postorder') {
  await page.getByTestId(`tree-mode-${mode}`).click();
  await expect(page.locator('[data-testid="tree-mode-picker"]')).toHaveAttribute('data-selected', mode);
}

async function runCurrentMode(page: Page) {
  await page.getByTestId('run-btn').click();
  await expect(page.locator('[data-testid="tree-mode-pending"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 30', { timeout: 60_000 });
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function nodeIds(page: Page): Promise<string[]> {
  return page.locator('[data-testid="tree-node"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-node-id') ?? ''),
  );
}

async function edgePairs(page: Page): Promise<Array<[string, string]>> {
  return page.locator('[data-testid="tree-edge"]').evaluateAll((edges) =>
    edges.map((edge) => [
      edge.getAttribute('data-from-id') ?? '',
      edge.getAttribute('data-to-id') ?? '',
    ] as [string, string]),
  );
}

async function visitedIds(page: Page): Promise<string[]> {
  const value = await page.locator('[data-testid="tree-visited-sequence"]').getAttribute('data-visited-ids');
  return value ? value.split(',').filter(Boolean) : [];
}

async function activeId(page: Page): Promise<string | null> {
  return page.locator('[data-testid="tree-node"][data-active="true"]').getAttribute('data-node-id');
}

test.describe('Stage 7D — real binary-tree traversal and recursion stack', () => {
  test('inorder descends left, returns, and restores the real call stack on scrub back', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'inorder');
    await expect(page.locator('[data-testid="tree-visual"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="tree-node"]')).toHaveCount(7, { timeout: 60_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 30', { timeout: 60_000 });
    await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-traversal', 'inorder');
    await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-root-id', 'n1');

    expect(await nodeIds(page)).toEqual(['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7']);
    expect(await edgePairs(page)).toEqual([
      ['n1', 'n2'],
      ['n1', 'n3'],
      ['n2', 'n4'],
      ['n2', 'n5'],
      ['n3', 'n6'],
      ['n3', 'n7'],
    ]);
    const rootBox = await page.locator('[data-testid="tree-node"][data-node-id="n1"]').boundingBox();
    const leftBox = await page.locator('[data-testid="tree-node"][data-node-id="n2"]').boundingBox();
    const rightBox = await page.locator('[data-testid="tree-node"][data-node-id="n3"]').boundingBox();
    expect(rootBox && leftBox && rightBox).toBeTruthy();
    if (rootBox && leftBox && rightBox) {
      expect(leftBox.y).toBeGreaterThan(rootBox.y);
      expect(rightBox.y).toBeGreaterThan(rootBox.y);
      expect(leftBox.x).toBeLessThan(rootBox.x);
      expect(rightBox.x).toBeGreaterThan(rootBox.x);
    }

    await setFrame(page, 5);
    expect(await activeId(page)).toBe('n4');
    await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-operation', 'enter');
    await expect(page.locator('[data-testid="tree-path"]')).toHaveAttribute('data-current-id', 'n4');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'enter');

    const frames = page.locator('[data-testid^="call-frame-f"]');
    await expect(frames).toHaveCount(3);
    await expect(frames.nth(0)).toContainText('traverse');
    const variables = page.getByTestId('key-vars');
    await expect(variables).toContainText('node_id');
    await expect(variables).toContainText('n4');
    await page.locator('.key-vars-more summary').click();
    await expect(variables).toContainText('path');
    await expect(variables).toContainText('depth');
    await expect(page.getByTestId('variables-scope')).toContainText('深度 2');

    await setFrame(page, 7);
    expect(await activeId(page)).toBe('n4');
    await expect(variables).toContainText('n4');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'return');
    await setFrame(page, 8);
    expect(await activeId(page)).toBe('n2');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'visit');
    await expect(frames).toHaveCount(2);
    expect(await visitedIds(page)).toEqual(['n4', 'n2']);

    await setFrame(page, 5);
    expect(await activeId(page)).toBe('n4');
    expect(await visitedIds(page)).toEqual([]);
    await expect(frames).toHaveCount(3);
    await expect(variables).toContainText('n4');
  });

  test('preorder visits 4 2 1 3 6 5 7 with real visits and source lines', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'inorder');
    await expect(page.locator('[data-testid="tree-visual"]')).toBeVisible({ timeout: 60_000 });

    await selectMode(page, 'preorder');
    await expect(page.locator('[data-testid="tree-mode-pending"]')).toBeVisible();
    await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-traversal', 'inorder');
    await runCurrentMode(page);
    await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-traversal', 'preorder');

    await setFrame(page, 2);
    expect(await activeId(page)).toBe('n1');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'visit');
    await expect(page.locator('[data-testid="current-step-message"]')).toContainText(/访问节点 n1|visit n1/);
    await expect(page.locator('.algolens-active-line')).toHaveCount(1);

    await setFrame(page, 8);
    expect(await activeId(page)).toBe('n4');
    expect(await visitedIds(page)).toEqual(['n1', 'n2', 'n4']);
    await expect(page.getByTestId('variables-watch')).toContainText('n4');

    await setFrame(page, 12);
    expect(await activeId(page)).toBe('n5');
    expect(await visitedIds(page)).toEqual(['n1', 'n2', 'n4', 'n5']);
    await setFrame(page, 28);
    expect(await visitedIds(page)).toEqual(['n1', 'n2', 'n4', 'n5', 'n3', 'n6', 'n7']);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'order');
    await expect(page.locator('[data-testid="tree-visited-item"]')).toHaveCount(7);
  });

  test('postorder finishes both children before visiting the parent', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'inorder');
    await expect(page.locator('[data-testid="tree-visual"]')).toBeVisible({ timeout: 60_000 });

    await selectMode(page, 'postorder');
    await runCurrentMode(page);
    await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-traversal', 'postorder');

    await setFrame(page, 6);
    expect(await activeId(page)).toBe('n4');
    expect(await visitedIds(page)).toEqual(['n4']);
    await setFrame(page, 12);
    expect(await activeId(page)).toBe('n2');
    expect(await visitedIds(page)).toEqual(['n4', 'n5', 'n2']);
    await expect(page.locator('[data-testid="tree-node"][data-node-id="n2"]')).toHaveAttribute('data-order', '3');
    await setFrame(page, 24);
    expect(await activeId(page)).toBe('n3');
    expect(await visitedIds(page)).toEqual(['n4', 'n5', 'n2', 'n6', 'n7', 'n3']);
    await setFrame(page, 26);
    expect(await activeId(page)).toBe('n1');
    expect(await visitedIds(page)).toEqual(['n4', 'n5', 'n2', 'n6', 'n7', 'n3', 'n1']);
    await setFrame(page, 28);
    expect(await visitedIds(page)).toEqual(['n4', 'n5', 'n2', 'n6', 'n7', 'n3', 'n1']);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'order');
  });

  test('mode switching keeps the old trace until Run, then starts a fresh trace', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'inorder');
    await expect(page.locator('[data-testid="tree-visual"]')).toBeVisible({ timeout: 60_000 });

    await setFrame(page, 14);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'visit');
    await selectMode(page, 'postorder');
    await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-traversal', 'inorder');
    await expect(page.locator('[data-testid="tree-mode-picker"]')).toHaveAttribute('data-actual', 'inorder');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('15 / 30');

    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.getByTestId('lesson-active-step')).toContainText('Visit a node');
    await page.getByRole('button', { name: 'Switch language' }).click();

    await runCurrentMode(page);
    await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-traversal', 'postorder');
    await setFrame(page, 2);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('3 / 30');
    expect(await activeId(page)).toBe('n1');

    await selectMode(page, 'inorder');
    await runCurrentMode(page);
    await expect(page.locator('[data-testid="tree-visual"]')).toHaveAttribute('data-traversal', 'inorder');
    await setFrame(page, 29);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expect(page.locator('[data-testid="tree-node"][data-active="true"]')).toHaveCount(0);
  });

  test('empty, single-node and equal-value trees stay safe and identity-explicit', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'inorder');
    await expect(page.locator('[data-testid="tree-visual"]')).toBeVisible({ timeout: 60_000 });

    await openCodePanel(page);
    await page.fill('#run-input', '[]');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="tree-empty"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 3', { timeout: 60_000 });
    await expect(page.locator('[data-testid="tree-node"]')).toHaveCount(0);

    await page.fill('#run-input', '[4]');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="tree-node"]')).toHaveCount(1, { timeout: 60_000 });
    await expect(page.locator('[data-testid="tree-node"][data-node-id="n1"]')).toHaveAttribute('data-role', 'root');
    await expect(page.locator('[data-testid="tree-node"][data-node-id="n1"]')).toHaveAttribute('data-value', '4');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 6', { timeout: 60_000 });

    await page.fill('#run-input', '[7,7,7]');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="tree-node"]')).toHaveCount(3, { timeout: 60_000 });
    expect(await nodeIds(page)).toEqual(['n1', 'n2', 'n3']);
    expect(await edgePairs(page)).toEqual([['n1', 'n2'], ['n1', 'n3']]);
    await expect(page.locator('[data-testid="tree-node"][data-node-id="n2"]')).toHaveAttribute('data-value', '7');
    await expect(page.locator('[data-testid="tree-node"][data-node-id="n3"]')).toHaveAttribute('data-value', '7');
    await expect(page.locator('[data-testid="tree-node"][data-node-id="n1"]')).toHaveAttribute('data-role', 'root');
  });

  test('1024/390 keep the tree readable, reduced motion keeps state, stack regression is clean', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'inorder');
    await expect(page.locator('[data-testid="tree-visual"]')).toBeVisible({ timeout: 60_000 });
    await setFrame(page, 14);

    for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await expectNoPageOverflow(page);
      await expect(page.locator('[data-testid="tree-visual"]')).toBeVisible();
      await expect(page.locator('[data-testid="scrub"]')).toBeVisible();
      await expect(page.locator('[data-testid="code-dock"]')).toBeVisible();
      if (viewport.width === 390) {
        await expect(page.locator('[data-testid="tree-scroll-hint"]')).toBeVisible();
      } else {
        await expect(page.locator('[data-testid="tree-scroll-hint"]')).toBeHidden();
      }
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setFrame(page, 14);
    expect(await activeId(page)).toBe('n1');
    await expect(page.locator('[data-testid="tree-visited-sequence"]')).toHaveAttribute('data-visited-ids', 'n4,n2,n5,n1');
    await expect(page.locator('[data-testid="current-step-message"]')).toContainText(/访问节点 n1|visit n1/);

    await selectAlgo(page, 'stack');
    await expect(page.locator('[data-testid="stack-visual"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 7', { timeout: 60_000 });
    await expect(page.locator('[data-testid="tree-visual"]')).toHaveCount(0);
    await setFrame(page, 4, 7);
    await expect(page.locator('[data-testid="stack-item"]').first()).toBeVisible();
  });
});
