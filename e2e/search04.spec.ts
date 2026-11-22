import type { Locator } from '@playwright/test';
import {
  expect,
  openAdvancedPanels,
  openTextbookChapter,
  selectAlgorithm,
  test,
  type Page,
} from './fixtures';

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

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

function nodeByAttribute(page: Page, attribute: string, value: string) {
  return page.locator(`[data-testid="btree-node"][${attribute}="${value}"]`);
}

async function nodeKeys(node: Locator): Promise<string[]> {
  return node.locator('[data-testid="btree-key"]').allTextContents();
}

test.describe('SEARCH-04 — B-tree concept pages and real order-4 trace', () => {
  test('B-tree and B+ tree are static comparison pages with no player', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await openTextbookChapter(page, 'ch9-search');
    // Chapter 9 groups dynamic search structures under "tree-search"; the
    // nested B-tree page is hidden until that parent topic is expanded.
    await page.getByTestId('topic-tree-search').click();

    await page.getByTestId('topic-multiway-tree').click();
    await expect(page.getByTestId('concept-title')).toContainText('B 树（B-Tree）');
    await expect(page.getByTestId('concept-definition')).toContainText('m = 4');
    await expect(page.getByTestId('concept-page')).toContainText('最多 4 个孩子');
    await expect(page.getByTestId('concept-page')).toContainText('非根至少 1 个关键字');
    await expect(page.getByTestId('concept-page')).toContainText('叶子同层');
    await expect(page.getByTestId('concept-page')).toContainText('下降前分裂');
    await expect(page.getByTestId('concept-diagram')).toContainText('4 阶 B 树');
    await expect(page.getByTestId('concept-diagram')).toContainText('50');
    await expect(page.getByTestId('play-btn')).toHaveCount(0);
    await expect(page.getByTestId('step-description')).toHaveCount(0);
    await expect(page.getByTestId('code-editor')).toHaveCount(0);

    await page.getByTestId('topic-bplus-tree').click();
    await expect(page.getByTestId('concept-title')).toContainText('B+ 树（B+ Tree）');
    await expect(page.getByTestId('concept-page')).toContainText('内部节点');
    await expect(page.getByTestId('concept-page')).toContainText('叶子 next');
    await expect(page.getByTestId('concept-page')).toContainText('范围查询');
    await expect(page.getByTestId('concept-page')).toContainText('数据库索引');
    await expect(page.getByTestId('concept-diagram')).toContainText('内部节点只做索引');
    await expect(page.getByTestId('concept-diagram')).toContainText('叶子 next 链');
    await expect(page.getByTestId('play-btn')).toHaveCount(0);
    await expect(page.getByTestId('step-description')).toHaveCount(0);

    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('concept-title')).toContainText('B+ tree');
    await expect(page.getByTestId('concept-page')).toContainText('range query');
    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expectNoPageOverflow(page);
  });

  test('real Pyodide find, duplicate policy, split, root split and three-language sources', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'btree');

    const visual = page.getByTestId('btree-visual');
    await expect(visual).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 7', { timeout: 120_000 });
    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');
    await expect(page.getByTestId('btree-picker')).toHaveAttribute('data-selected', 'find-hit');
    await expect(page.getByTestId('btree-picker')).toContainText('下降前分裂满节点');
    await expect(page.getByTestId('btree-picker')).toContainText('重复键拒绝');

    const root = page.locator('[data-testid="btree-node"][data-active="true"]');
    await expect(root).toHaveCount(1);
    expect(await nodeKeys(root)).toEqual(['20', '40']);
    const rootBox = await root.locator('.btree-node-box').boundingBox();
    if (!rootBox) throw new Error('missing B-tree root box');
    const keyFont = await root.locator('[data-testid="btree-key"]').first().evaluate((node) => {
      const text = node.querySelector('text');
      return text ? parseFloat(getComputedStyle(text).fontSize) : 0;
    });
    expect(keyFont).toBeGreaterThanOrEqual(18);

    await setFrame(page, 2, 7);
    await expect(visual).toHaveAttribute('data-operation', 'inspect');
    await expect(page.locator('.btree-key-compare')).toHaveCount(1);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'inspect');

    await setFrame(page, 5, 7);
    await expect(visual).toHaveAttribute('data-operation', 'found');
    await expect(visual).toHaveAttribute('data-result', 'found');
    const foundNode = page.locator('[data-testid="btree-node"][data-active="true"]');
    await expect(foundNode).toHaveCount(1);
    expect(await nodeKeys(foundNode)).toEqual(['30']);

    await setFrame(page, 6, 7);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-result', 'found');

    // Playback and scrubbing both drive the same attached-tree snapshot.
    await setFrame(page, 0, 7);
    await expect(root).toHaveCount(1);
    expect(await nodeKeys(root)).toEqual(['20', '40']);
    await page.getByTestId('play-btn').click();
    await expect(page.locator('[data-testid="progress"]')).not.toHaveText('1 / 7', { timeout: 10_000 });
    await page.getByTestId('play-btn').click();
    await expect(page.getByTestId('btree-node').first()).toBeVisible();
    await setFrame(page, 0, 7);
    expect(await nodeKeys(root)).toEqual(['20', '40']);

    // Missing search: the path ends at a leaf and reports not-found.
    await page.getByTestId('btree-preset-find-miss').click();
    await expect(page.getByTestId('btree-preset-pending')).toBeVisible();
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 7', { timeout: 120_000 });
    await expect(page.getByTestId('btree-picker')).toHaveAttribute('data-actual', 'find-miss');
    await setFrame(page, 5, 7);
    await expect(visual).toHaveAttribute('data-operation', 'not-found');
    await expect(visual).toHaveAttribute('data-result', 'not-found');

    // Selecting an official preset only rewrites input; Run owns the Trace.
    await page.getByTestId('btree-preset-insert-split').click();
    await expect(page.getByTestId('btree-picker')).toHaveAttribute('data-selected', 'insert-split');
    await expect(page.getByTestId('btree-picker')).toHaveAttribute('data-actual', 'find-miss');
    await expect(page.getByTestId('btree-preset-pending')).toBeVisible();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('6 / 7');

    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 10', { timeout: 120_000 });
    await expect(page.getByTestId('btree-picker')).toHaveAttribute('data-actual', 'insert-split');
    await expect(page.getByTestId('btree-preset-pending')).toHaveCount(0);

    await setFrame(page, 5, 10);
    await expect(visual).toHaveAttribute('data-operation', 'split');
    const fullNode = nodeByAttribute(page, 'data-split-before', 'true');
    await expect(fullNode).toHaveCount(1);
    expect(await nodeKeys(fullNode)).toEqual(['50', '60', '70']);
    await expect(page.getByTestId('btree-split-badge')).toHaveText(['满节点 · 分裂前']);

    await setFrame(page, 6, 10);
    await expect(visual).toHaveAttribute('data-operation', 'split');
    const left = nodeByAttribute(page, 'data-split-left', 'true');
    const right = nodeByAttribute(page, 'data-split-right', 'true');
    await expect(left).toHaveCount(1);
    await expect(right).toHaveCount(1);
    expect(await nodeKeys(left)).toEqual(['50']);
    expect(await nodeKeys(right)).toEqual(['70']);
    const splitRoot = page.locator(`[data-testid="btree-node"][data-node-id="${await visual.getAttribute('data-root-id')}"]`);
    expect(await nodeKeys(splitRoot)).toEqual(['20', '40', '60']);
    await expect(page.getByTestId('btree-promoted')).toContainText('60');
    await expect(page.getByTestId('btree-promoted')).toContainText('上升关键字');
    await expect(page.getByTestId('btree-split-badge')).toHaveText(['原节点', '新节点']);
    const promotedBox = await page.getByTestId('btree-promoted').boundingBox();
    const leftBox = await left.locator('.btree-node-box').boundingBox();
    const rightBox = await right.locator('.btree-node-box').boundingBox();
    if (!promotedBox || !leftBox || !rightBox) throw new Error('missing split geometry');
    expect(leftBox.y).toBe(rightBox.y);
    expect(leftBox.x + leftBox.width).toBeLessThan(rightBox.x);
    expect(promotedBox.y + promotedBox.height).toBeLessThan(leftBox.y);

    await setFrame(page, 8, 10);
    await expect(visual).toHaveAttribute('data-operation', 'insert');
    const insertedNode = page.locator('[data-testid="btree-node"][data-active="true"]');
    await expect(insertedNode).toHaveCount(1);
    expect(await nodeKeys(insertedNode)).toEqual(['45', '50']);
    await expect(page.getByTestId('btree-node')).toHaveCount(5);

    // Root split: the promoted middle key becomes the new root, old root and
    // the new sibling are labelled as two children of that root.
    await page.getByTestId('btree-preset-insert-root-split').click();
    await expect(page.getByTestId('btree-preset-pending')).toBeVisible();
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 9', { timeout: 120_000 });
    await expect(page.getByTestId('btree-picker')).toHaveAttribute('data-actual', 'insert-root-split');

    await setFrame(page, 5, 9);
    await expect(visual).toHaveAttribute('data-operation', 'split');
    const newRoot = nodeByAttribute(page, 'data-new-root', 'true');
    await expect(newRoot).toHaveCount(1);
    expect(await nodeKeys(newRoot)).toEqual(['20']);
    await expect(page.getByTestId('btree-promoted')).toContainText('20');
    await expect(page.getByTestId('btree-promoted')).toContainText('新根');
    await expect(page.getByTestId('btree-split-badge')).toHaveText(['原根', '新节点']);

    await setFrame(page, 7, 9);
    await expect(visual).toHaveAttribute('data-operation', 'insert');
    const rootInserted = page.locator('[data-testid="btree-node"][data-active="true"]');
    await expect(rootInserted).toHaveCount(1);
    expect(await nodeKeys(rootInserted)).toEqual(['30', '40']);

    await setFrame(page, 0, 9);
    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('btree-node')).toHaveCount(1);
    expect(await nodeKeys(page.locator('[data-testid="btree-node"][data-active="true"]'))).toEqual(['10', '20', '30']);
    await expectNoPageOverflow(page);

    await openAdvancedPanels(page);
    await expect(page.getByTestId('reference-code-panel')).toHaveAttribute('data-algorithm-id', 'btree');
    await page.getByTestId('reference-lang-c').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('btree.c');
    await expect(page.getByTestId('reference-code-viewer')).toHaveAttribute('data-readonly', 'true');
    await expect(page.getByTestId('reference-copy')).toBeEnabled();
    await expect(page.getByTestId('reference-code-viewer')).toContainText('BTreeNode');

    await page.getByTestId('reference-lang-cpp').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('btree.cpp');
    await expect(page.getByTestId('reference-code-viewer')).toContainText('split_child');

    await page.getByTestId('reference-lang-python').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('btree.py');
    await expect(page.getByTestId('reference-code-viewer')).toContainText('MAX_KEYS');
    await expectNoPageOverflow(page);
  });
});
