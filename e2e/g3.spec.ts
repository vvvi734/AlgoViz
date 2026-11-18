import { expect, openCodePanel, test, type Page } from './fixtures';

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgorithm(page: Page, id: string, total: number) {
  const mobile = page.locator('[data-testid="mobile-algo-select"]');
  if (await mobile.isVisible()) {
    await mobile.selectOption(id);
  } else {
    const item = page.locator(`[data-testid="algo-${id}"]`);
    if (!(await item.isVisible())) {
      const group = page.locator('[data-testid="group-graph"]');
      if ((await group.getAttribute('aria-expanded')) !== 'true') await group.click();
    }
    await item.click();
  }
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

test.describe('G3 — Kahn topological sort and AOE critical path', () => {
  test('Kahn: indegrees, FIFO queue, decrement, enqueue and final order stay synchronized', async ({ page }) => {
    await openApp(page);
    await selectAlgorithm(page, 'topological', 32);
    await expect(page.locator('[data-testid="topo-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="topo-graph-svg"]')).toHaveAttribute('data-node-count', '7');
    await expect(page.locator('[data-testid="topo-graph-svg"]')).toHaveAttribute('data-edge-count', '8');
    await expect(page.locator('[data-testid="topo-node"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="topo-edge"]')).toHaveCount(8);
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="topo-indegree-row"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="topo-indegree-row"][data-node-id="C"]')).toHaveAttribute('data-indegree', '2');
    await expect(page.locator('[data-testid="topo-queue-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="topo-order-chip"]')).toHaveCount(0);

    await setFrame(page, 1, 32);
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-operation', 'enqueue');
    await expect(page.locator('[data-testid="topo-queue-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="topo-queue-item"]')).toContainText('A');
    await expect(page.locator('[data-testid="topo-node"][data-node-id="A"]')).toHaveAttribute('data-in-queue', 'true');
    await expect(page.locator('[data-testid="topo-node"][data-node-id="A"]')).toHaveAttribute('data-indegree', '0');

    await setFrame(page, 3, 32);
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-operation', 'dequeue');
    await expect(page.locator('[data-testid="topo-queue-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="topo-order-chip"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="topo-order-chip"]')).toContainText('A');
    await expect(page.locator('[data-testid="topo-node"][data-node-id="A"]')).toHaveAttribute('data-processed', 'true');

    await setFrame(page, 5, 32);
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-operation', 'decrement');
    await expect(page.locator('[data-testid="topo-indegree-change"]')).toContainText('C: 2 → 1');
    await expect(page.locator('[data-testid="topo-edge"][data-edge-id="e1"]')).toHaveAttribute('data-state', 'current');
    await expect(page.locator('[data-testid="topo-edge"][data-edge-id="e1"]')).toHaveAttribute('data-removed', 'true');
    await expect(page.locator('[data-testid="topo-edge"][data-edge-id="e2"]')).toHaveAttribute('data-state', 'idle');
    await expect(page.locator('[data-testid="topo-indegree-row"][data-node-id="C"]')).toHaveAttribute('data-indegree', '1');

    await setFrame(page, 8, 32);
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-operation', 'enqueue-node');
    await expect(page.locator('[data-testid="topo-queue-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="topo-queue-item"][data-node-id="D"]')).toContainText('D');
    await expect(page.locator('[data-testid="topo-queue-item"][data-node-id="B"]')).toContainText('B');
    await expect(page.locator('[data-testid="topo-node"][data-node-id="D"]')).toHaveAttribute('data-indegree', '0');
    await expect(page.locator('[data-testid="topo-node"][data-node-id="D"]')).toHaveAttribute('data-in-queue', 'true');

    await setFrame(page, 31, 32);
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="topo-order-chip"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="topo-final-order"]')).toContainText('A → B → D → C → E → F → G');
    await expect(page.locator('[data-testid="topo-cycle-value"]')).toContainText('无');
    await expect(page.locator('[data-testid="topo-result"]')).toContainText('完整');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');

    await page.click('[data-testid="prev-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('31 / 32');
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-operation', 'dequeue');
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('32 / 32');
    await setFrame(page, 12, 32);
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-operation', 'enqueue-node');
    await expect(page.locator('[data-testid="topo-order-chip"]')).toHaveCount(2);
    await setFrame(page, 31, 32);
    await expect(page.locator('[data-testid="topo-final-order"]')).toContainText('A → B → D → C → E → F → G');
    await expectNoOverflow(page);
  });

  test('Kahn: disconnected DAG, multiple valid orders, directed cycle and single vertex', async ({ page }) => {
    test.setTimeout(360_000);
    await openApp(page);
    await selectAlgorithm(page, 'topological', 32);

    const disconnected = await runInput(page, {
      nodes: ['A', 'B', 'C', 'D'],
      edges: [['A', 'B'], ['C', 'D']],
    });
    await setFrame(page, disconnected - 1, disconnected);
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-cycle', 'false');
    await expect(page.locator('[data-testid="topo-order-chip"]')).toHaveCount(4);
    const order = await page.locator('[data-testid="topo-order-chip"]').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).dataset.nodeId ?? ''),
    );
    expect(new Set(order)).toEqual(new Set(['A', 'B', 'C', 'D']));
    // This E2E intentionally does not pin one valid order. It checks every
    // dependency instead: A before B and C before D.
    expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'));
    expect(order.indexOf('C')).toBeLessThan(order.indexOf('D'));

    const cycle = await runInput(page, {
      nodes: ['A', 'B', 'C'],
      edges: [['A', 'B'], ['B', 'C'], ['C', 'A']],
    });
    await setFrame(page, cycle - 1, cycle);
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-cycle', 'true');
    await expect(page.locator('[data-testid="topo-cycle-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="topo-cycle-alert"]')).toContainText('有向环');
    await expect(page.locator('[data-testid="topo-cycle-value"]')).toContainText('检测到');
    await expect(page.locator('[data-testid="topo-order-chip"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="topo-result"]')).toContainText('A B C');

    const single = await runInput(page, { nodes: ['A'], edges: [] });
    await setFrame(page, single - 1, single);
    await expect(page.locator('[data-testid="topo-stage"]')).toHaveAttribute('data-cycle', 'false');
    await expect(page.locator('[data-testid="topo-order-chip"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="topo-final-order"]')).toContainText('A');
    await expectNoOverflow(page);
  });

  test('AOE: ve, vl, activity slack, critical activities and multiple critical paths agree', async ({ page }) => {
    test.setTimeout(360_000);
    await openApp(page);
    await selectAlgorithm(page, 'critical-path', 22);
    await expect(page.locator('[data-testid="critical-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="critical-graph-svg"]')).toHaveAttribute('data-node-count', '6');
    await expect(page.locator('[data-testid="critical-graph-svg"]')).toHaveAttribute('data-edge-count', '7');
    await expect(page.locator('[data-testid="critical-node"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="critical-edge"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="critical-stage"]')).toHaveAttribute('data-phase', 'init');
    await expect(page.locator('[data-testid="critical-event-row"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="critical-activity-row"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="critical-paths-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="critical-duration"]')).toContainText('—');

    await setFrame(page, 3, 22);
    await expect(page.locator('[data-testid="critical-stage"]')).toHaveAttribute('data-phase', 've');
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="B"]')).toHaveAttribute('data-ve', '3');
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="B"]')).toHaveAttribute('data-vl', '');
    await expect(page.locator('[data-testid="critical-phase-step"][data-phase="ve"]')).toHaveAttribute('data-active', 'true');

    await setFrame(page, 8, 22);
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="F"]')).toHaveAttribute('data-ve', '11');
    await setFrame(page, 9, 22);
    await expect(page.locator('[data-testid="critical-stage"]')).toHaveAttribute('data-phase', 'vl');
    await expect(page.locator('[data-testid="critical-duration"]')).toContainText('11');
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="F"]')).toHaveAttribute('data-vl', '11');
    await setFrame(page, 13, 22);
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="B"]')).toHaveAttribute('data-vl', '3');

    await setFrame(page, 14, 22);
    await expect(page.locator('[data-testid="critical-stage"]')).toHaveAttribute('data-phase', 'activity');
    await expect(page.locator('[data-testid="critical-activity-row"][data-edge-id="e1"]')).toHaveAttribute('data-slack', '0');
    await expect(page.locator('[data-testid="critical-activity-row"][data-edge-id="e1"]')).toHaveAttribute('data-critical', 'true');
    await setFrame(page, 17, 22);
    await expect(page.locator('[data-testid="critical-activity-row"][data-edge-id="e3"]')).toHaveAttribute('data-slack', '1');
    await expect(page.locator('[data-testid="critical-activity-row"][data-edge-id="e3"]')).toHaveAttribute('data-critical', 'false');
    await expect(page.locator('[data-testid="critical-activity-row"][data-edge-id="e3"]')).toContainText('B→D');

    await setFrame(page, 21, 22);
    await expect(page.locator('[data-testid="critical-stage"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="critical-duration"]')).toContainText('11');
    await expect(page.locator('[data-testid="critical-path-count"]')).toContainText('2');
    await expect(page.locator('[data-testid="critical-path-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="critical-path-item"][data-path="A>B>E>F"]')).toContainText('A → B → E → F');
    await expect(page.locator('[data-testid="critical-path-item"][data-path="A>C>D>E>F"]')).toContainText('A → C → D → E → F');
    await expect(page.locator('[data-testid="critical-edge"][data-edge-id="e1"]')).toHaveAttribute('data-on-path', 'true');
    await expect(page.locator('[data-testid="critical-edge"][data-edge-id="e3"]')).toHaveAttribute('data-state', 'slack');
    await expect(page.locator('[data-testid="critical-edge"][data-edge-id="e3"]')).toHaveAttribute('data-critical', 'false');
    await expect(page.locator('[data-testid="critical-result"]')).toContainText('11');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');

    await page.click('[data-testid="prev-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('21 / 22');
    await expect(page.locator('[data-testid="critical-stage"]')).toHaveAttribute('data-phase', 'activity');
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('22 / 22');
    await setFrame(page, 13, 22);
    await expect(page.locator('[data-testid="critical-stage"]')).toHaveAttribute('data-phase', 'vl');
    await setFrame(page, 21, 22);
    await expect(page.locator('[data-testid="critical-path-item"]')).toHaveCount(2);
    await expectNoOverflow(page);
  });

  test('AOE: multiple sources/sinks, non-negative durations and cycle rejection are explicit', async ({ page }) => {
    test.setTimeout(360_000);
    await openApp(page);
    await selectAlgorithm(page, 'critical-path', 22);

    const multiSource = await runInput(page, {
      nodes: ['A', 'B', 'C', 'D'],
      edges: [['A', 'C', 2], ['B', 'C', 3], ['C', 'D', 1]],
    });
    await setFrame(page, multiSource - 1, multiSource);
    await expect(page.locator('[data-testid="critical-duration"]')).toContainText('4');
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="A"]')).toHaveAttribute('data-ve', '0');
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="B"]')).toHaveAttribute('data-ve', '0');
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="A"]')).toHaveAttribute('data-vl', '1');
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="B"]')).toHaveAttribute('data-vl', '0');
    await expect(page.locator('[data-testid="critical-path-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="critical-path-item"]')).toContainText('B → C → D');
    await expect(page.locator('[data-testid="critical-activity-row"][data-edge-id="e1"]')).toHaveAttribute('data-critical', 'false');

    const multiSink = await runInput(page, {
      nodes: ['A', 'B', 'C'],
      edges: [['A', 'B', 2], ['A', 'C', 5]],
    });
    await setFrame(page, multiSink - 1, multiSink);
    await expect(page.locator('[data-testid="critical-duration"]')).toContainText('5');
    await expect(page.locator('[data-testid="critical-event-row"][data-node-id="B"]')).toHaveAttribute('data-vl', '5');
    await expect(page.locator('[data-testid="critical-activity-row"][data-edge-id="e1"]')).toHaveAttribute('data-slack', '3');
    await expect(page.locator('[data-testid="critical-path-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="critical-path-item"]')).toContainText('A → C');

    await page.fill('#run-input', JSON.stringify({ nodes: ['A', 'B'], edges: [['A', 'B', -1]] }));
    await page.click('[data-testid="run-btn"]');
    await expect(page.locator('[data-testid="run-feedback"]')).toContainText('non-negative', { timeout: 90_000 });
    await expect(page.locator('[data-testid="run-feedback"]')).toContainText('ValueError');

    await page.fill('#run-input', JSON.stringify({ directed: false, nodes: ['A', 'B'], edges: [['A', 'B']] }));
    await page.click('[data-testid="run-btn"]');
    await expect(page.locator('[data-testid="run-feedback"]')).toContainText('requires a directed graph', { timeout: 90_000 });
    await expectNoOverflow(page);
  });
});
