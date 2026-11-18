import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgorithm(page: Page, id: string, total: number) {
  await chooseAlgorithm(page, id);
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

/** Run a custom input and return the real frame count reported by the app. */
async function runInput(page: Page, input: unknown): Promise<number> {
  await openCodePanel(page);
  const before = await page.locator('[data-testid="progress"]').textContent();
  await page.fill('#run-input', JSON.stringify(input));
  await page.click('[data-testid="run-btn"]');
  await expect(page.locator('[data-testid="run-feedback"]')).toContainText('动画已生成', { timeout: 90_000 });
  if (before) await expect(page.locator('[data-testid="progress"]')).not.toHaveText(before);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(/^1 \/ \d+$/, { timeout: 90_000 });
  const text = await page.locator('[data-testid="progress"]').textContent();
  return Number(text?.split('/')[1]?.trim());
}

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('G2 — Prim and Kruskal minimum spanning trees', () => {
  test('Prim: real heap, growing tree, skipped edges, total weight and sidebar-independent playback', async ({ page }) => {
    await openApp(page);
    await selectAlgorithm(page, 'prim', 21);
    await expect(page.locator('[data-testid="prim-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="prim-graph-svg"]')).toHaveAttribute('data-node-count', '5');
    await expect(page.locator('[data-testid="prim-graph-svg"]')).toHaveAttribute('data-edge-count', '6');
    await expect(page.locator('[data-testid="mst-node"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="mst-edge"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="prim-total-weight"]')).toContainText('0');
    await expect(page.locator('[data-testid="prim-frontier-empty"]')).toBeVisible();

    await setFrame(page, 5, 21);
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-operation', 'select-edge');
    await expect(page.locator('[data-testid="prim-current-edge"]')).toHaveAttribute('data-edge-id', 'e2');
    await expect(page.locator('[data-testid="prim-current-edge"]')).toContainText('A–B');
    await expect(page.locator('[data-testid="prim-selected-edge"]')).toContainText('B');
    await expect(page.locator('[data-testid="prim-total-weight"]')).toContainText('2');
    await expect(page.locator('[data-testid="mst-node"][data-node-id="B"]')).toHaveAttribute('data-in-tree', 'true');
    await expect(page.locator('[data-testid="mst-edge"][data-edge-id="e2"]')).toHaveAttribute('data-state', 'selected');
    await expect(page.locator('[data-testid="prim-pq-entry"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="prim-pq-entry"][data-weight="2"]')).toHaveCount(1);

    await setFrame(page, 17, 21);
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-operation', 'skip');
    await expect(page.locator('[data-testid="prim-current-edge"]')).toHaveAttribute('data-edge-id', 'e1');
    await expect(page.locator('[data-testid="prim-frontier"]')).toContainText('已跳过边: 1');
    await expect(page.locator('[data-testid="mst-edge"][data-edge-id="e1"]')).toHaveAttribute('data-current', 'true');
    await expect(page.locator('[data-testid="mst-edge"][data-edge-id="e1"]')).toHaveAttribute('data-state', 'skipped');
    await expect(page.locator('[data-testid="mst-edge"][data-state="selected"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="prim-total-weight"]')).toContainText('6');

    await setFrame(page, 20, 21);
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="prim-result"]')).toContainText('单棵生成树');
    await expect(page.locator('[data-testid="prim-result"]')).toContainText('总权重 6');
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-forest', 'false');
    await expect(page.locator('[data-testid="prim-forest-alert"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');

    await page.click('[data-testid="sidebar-collapse"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('21 / 21');
    await expect(page.locator('[data-testid="prim-total-weight"]')).toContainText('6');
    await page.click('[data-testid="sidebar-expand"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('21 / 21');

    await page.click('[data-testid="prev-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('20 / 21');
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-operation', 'skip');
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('21 / 21');

    await setFrame(page, 0, 21);
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="prim-total-weight"]')).toContainText('0');
    await setFrame(page, 8, 21);
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-operation', 'select-edge');
    await expect(page.locator('[data-testid="prim-current-edge"]')).toContainText('A–C');
    await expect(page.locator('[data-testid="mst-node"][data-node-id="C"]')).toHaveAttribute('data-in-tree', 'true');
    await expect(page.locator('[data-testid="prim-total-weight"]')).toContainText('4');
  });

  test('Kruskal: sorted edges, union-find, accepted/rejected edges and total weight stay in sync', async ({ page }) => {
    await openApp(page);
    await selectAlgorithm(page, 'kruskal', 15);
    await expect(page.locator('[data-testid="kruskal-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="kruskal-graph-svg"]')).toHaveAttribute('data-node-count', '5');
    await expect(page.locator('[data-testid="kruskal-graph-svg"]')).toHaveAttribute('data-edge-count', '6');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="kruskal-sorted-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="kruskal-parent-row"]')).toHaveCount(5);

    await setFrame(page, 1, 15);
    await expect(page.locator('[data-testid="kruskal-stage"]')).toHaveAttribute('data-operation', 'sort');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-rank="1"]')).toHaveAttribute('data-edge-id', 'e4');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-rank="6"]')).toHaveAttribute('data-edge-id', 'e6');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-rank="1"]')).toContainText('C–D');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-rank="1"]')).toContainText('1');

    await setFrame(page, 2, 15);
    await expect(page.locator('[data-testid="kruskal-stage"]')).toHaveAttribute('data-operation', 'inspect-edge');
    await expect(page.locator('[data-testid="kruskal-current-edge"]')).toHaveAttribute('data-edge-id', 'e4');
    await expect(page.locator('[data-testid="kruskal-cycle-badge"]')).toHaveAttribute('data-cycle', 'false');
    await expect(page.locator('[data-testid="kruskal-current-roots"]')).toContainText('C');
    await expect(page.locator('[data-testid="kruskal-current-roots"]')).toContainText('D');
    await expect(page.locator('[data-testid="kruskal-component"]')).toHaveCount(5);

    await setFrame(page, 3, 15);
    await expect(page.locator('[data-testid="kruskal-stage"]')).toHaveAttribute('data-operation', 'union');
    await expect(page.locator('[data-testid="kruskal-union"]')).toBeVisible();
    await expect(page.locator('[data-testid="kruskal-union"]')).toContainText('C');
    await expect(page.locator('[data-testid="kruskal-union"]')).toContainText('D');
    await expect(page.locator('[data-testid="kruskal-union"]')).toContainText('5 → 4');
    await expect(page.locator('[data-testid="kruskal-component"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="kruskal-component"][data-root="C"]')).toContainText('C D');
    await expect(page.locator('[data-testid="kruskal-total-weight"]')).toContainText('1');
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('执行中');
    await expect(page.locator('[data-testid="kruskal-forest-alert"]')).toHaveCount(0);

    await setFrame(page, 7, 15);
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('执行中');
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('连通分量: 2');
    await expect(page.locator('[data-testid="kruskal-forest-alert"]')).toHaveCount(0);

    await setFrame(page, 11, 15);
    await expect(page.locator('[data-testid="kruskal-stage"]')).toHaveAttribute('data-operation', 'reject-edge');
    await expect(page.locator('[data-testid="kruskal-current-edge"]')).toHaveAttribute('data-edge-id', 'e3');
    await expect(page.locator('[data-testid="kruskal-cycle-badge"]')).toHaveAttribute('data-cycle', 'true');
    await expect(page.locator('[data-testid="kruskal-cycle-badge"]')).toContainText('会成环');
    await expect(page.locator('[data-testid="kruskal-current-roots"]')).toContainText('A');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-edge-id="e3"]')).toHaveAttribute('data-state', 'rejected');
    await expect(page.locator('[data-testid="mst-edge"][data-edge-id="e3"]')).toHaveAttribute('data-state', 'rejected');
    await expect(page.locator('[data-testid="kruskal-total-weight"]')).toContainText('6');
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('已拒绝边: 1');

    await setFrame(page, 14, 15);
    await expect(page.locator('[data-testid="kruskal-stage"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('总权重 6');
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('已选边: 4');
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('已拒绝边: 2');
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('单棵生成树');
    await expect(page.locator('[data-testid="kruskal-forest-alert"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="mst-edge"][data-state="selected"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="mst-edge"][data-state="rejected"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');

    await setFrame(page, 10, 15);
    await expect(page.locator('[data-testid="kruskal-stage"]')).toHaveAttribute('data-operation', 'inspect-edge');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-edge-id="e3"]')).toHaveAttribute('data-state', 'current');
    await setFrame(page, 11, 15);
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-edge-id="e3"]')).toHaveAttribute('data-state', 'rejected');
    await expectNoOverflow(page);
  });

  test('Prim and Kruskal agree on minimum total weight with different valid edge sets', async ({ page }) => {
    await openApp(page);
    await selectAlgorithm(page, 'prim', 21);
    await setFrame(page, 20, 21);
    await expect(page.locator('[data-testid="prim-total-weight"]')).toContainText('6');
    await expect(page.locator('[data-testid="prim-selected-edges"]')).toContainText('A–B');
    await expect(page.locator('[data-testid="prim-selected-edges"]')).toContainText('A–C');
    await expect(page.locator('[data-testid="prim-selected-edges"]')).not.toContainText('B–C');

    await selectAlgorithm(page, 'kruskal', 15);
    await setFrame(page, 14, 15);
    await expect(page.locator('[data-testid="kruskal-total-weight"]')).toContainText('6');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-edge-id="e4"]')).toHaveAttribute('data-state', 'selected');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-edge-id="e5"]')).toHaveAttribute('data-state', 'selected');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-edge-id="e1"]')).toHaveAttribute('data-state', 'selected');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-edge-id="e2"]')).toHaveAttribute('data-state', 'selected');
    await expect(page.locator('[data-testid="kruskal-sorted-edge"][data-edge-id="e3"]')).toHaveAttribute('data-state', 'rejected');
  });

  test('negative weights, single vertex, disconnected forests and directed graphs are handled explicitly', async ({ page }) => {
    test.setTimeout(300_000);
    await openApp(page);
    await selectAlgorithm(page, 'prim', 21);

    const negativeTotal = await runInput(page, {
      start: 'A', nodes: ['A', 'B', 'C'],
      edges: [['A', 'B', -4], ['B', 'C', -3], ['A', 'C', 2]],
    });
    await setFrame(page, negativeTotal - 1, negativeTotal);
    await expect(page.locator('[data-testid="prim-total-weight"]')).toContainText('-7');
    await expect(page.locator('[data-testid="mst-edge"][data-state="selected"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-forest', 'false');

    const singleTotal = await runInput(page, { start: 'A', nodes: ['A'], edges: [] });
    await setFrame(page, singleTotal - 1, singleTotal);
    await expect(page.locator('[data-testid="prim-total-weight"]')).toContainText('0');
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-forest', 'false');

    const forestTotal = await runInput(page, {
      start: 'A', nodes: ['A', 'B', 'C', 'D'],
      edges: [['A', 'B', 1], ['C', 'D', 2]],
    });
    await setFrame(page, forestTotal - 1, forestTotal);
    await expect(page.locator('[data-testid="prim-stage"]')).toHaveAttribute('data-forest', 'true');
    await expect(page.locator('[data-testid="prim-forest-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="prim-forest-alert"]')).toContainText('图不连通');
    await expect(page.locator('[data-testid="prim-total-weight"]')).toContainText('3');
    await expect(page.locator('[data-testid="mst-edge"][data-state="selected"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="prim-result"]')).not.toContainText('单棵生成树');

    await selectAlgorithm(page, 'kruskal', 15);
    const kruskalNegativeTotal = await runInput(page, {
      start: 'A', nodes: ['A', 'B', 'C'],
      edges: [['A', 'B', -4], ['B', 'C', -3], ['A', 'C', 2]],
    });
    await setFrame(page, kruskalNegativeTotal - 1, kruskalNegativeTotal);
    await expect(page.locator('[data-testid="kruskal-total-weight"]')).toContainText('-7');
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('已选边: 2');

    const kruskalForestTotal = await runInput(page, {
      start: 'A', nodes: ['A', 'B', 'C', 'D'],
      edges: [['A', 'B', 1], ['C', 'D', 2]],
    });
    await setFrame(page, kruskalForestTotal - 1, kruskalForestTotal);
    await expect(page.locator('[data-testid="kruskal-stage"]')).toHaveAttribute('data-forest', 'true');
    await expect(page.locator('[data-testid="kruskal-forest-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="kruskal-total-weight"]')).toContainText('3');
    await expect(page.locator('[data-testid="kruskal-result"]')).toContainText('连通分量: 2');
    await expect(page.locator('[data-testid="kruskal-result"]')).not.toContainText('单棵生成树');

    await page.fill('#run-input', JSON.stringify({
      start: 'A', directed: true, nodes: ['A', 'B'], edges: [['A', 'B', 1]],
    }));
    await page.click('[data-testid="run-btn"]');
    await expect(page.locator('[data-testid="run-feedback"]')).toContainText('directed graphs are not supported', { timeout: 90_000 });
    await expect(page.locator('[data-testid="run-feedback"]')).toContainText('ValueError');
    await expectNoOverflow(page);
  });
});
