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

async function runInput(page: Page, input: unknown): Promise<number> {
  await openCodePanel(page);
  await page.fill('#run-input', JSON.stringify(input));
  await page.click('[data-testid="run-btn"]');
  await expect(page.locator('[data-testid="run-feedback"]')).toContainText('动画已生成', { timeout: 90_000 });
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

test.describe('G4 — connected components and Kosaraju SCC', () => {
  test('undirected components: discovery, stack, C ids and four final groups stay synchronized', async ({ page }) => {
    await openApp(page);
    await selectAlgorithm(page, 'components', 50);
    await expect(page.locator('[data-testid="cc-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="cc-graph-svg"]')).toHaveAttribute('data-node-count', '8');
    await expect(page.locator('[data-testid="cc-graph-svg"]')).toHaveAttribute('data-edge-count', '5');
    await expect(page.locator('[data-testid="g4-node"]')).toHaveCount(8);
    await expect(page.locator('[data-testid="cc-edge"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="cc-stage"]')).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="g4-component-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="g4-stack-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="g4-node-row"][data-node-id="H"]')).toHaveAttribute('data-state', 'undiscovered');

    await setFrame(page, 1, 50);
    await expect(page.locator('[data-testid="cc-stage"]')).toHaveAttribute('data-operation', 'start-component');
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="g4-component-row"][data-component-id="1"]')).toContainText('C1');
    await expect(page.locator('[data-testid="g4-node"][data-node-id="A"]')).toHaveAttribute('data-start', 'true');
    await expect(page.locator('[data-testid="g4-node"][data-node-id="A"]')).toHaveAttribute('data-component-id', '1');
    await expect(page.locator('[data-testid="g4-node"][data-node-id="A"]')).toHaveAttribute('data-state', 'discovered');
    await expect(page.locator('[data-testid="g4-stack-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="g4-stack-item"][data-node-id="A"]')).toBeVisible();

    await setFrame(page, 5, 50);
    await expect(page.locator('[data-testid="cc-stage"]')).toHaveAttribute('data-operation', 'discover');
    await expect(page.locator('[data-testid="g4-component-row"][data-component-id="1"]')).toContainText('B');
    await expect(page.locator('[data-testid="g4-node"][data-node-id="B"]')).toHaveAttribute('data-state', 'discovered');
    await expect(page.locator('[data-testid="g4-stack-item"]')).toHaveCount(0);

    await setFrame(page, 9, 50);
    await expect(page.locator('[data-testid="g4-stack-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="g4-stack-item"][data-node-id="C"]')).toBeVisible();
    await expect(page.locator('[data-testid="g4-component-row"][data-component-id="1"]')).toContainText('C');

    await setFrame(page, 13, 50);
    await expect(page.locator('[data-testid="cc-stage"]')).toHaveAttribute('data-operation', 'skip');
    await expect(page.locator('[data-testid="g4-stack-item"]')).toHaveCount(1);

    await setFrame(page, 49, 50);
    await expect(page.locator('[data-testid="cc-stage"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="g4-component-count"]')).toContainText('4');
    await expect(page.locator('[data-testid="cc-result"]')).toContainText('C1={A,B,C}');
    await expect(page.locator('[data-testid="cc-result"]')).toContainText('C4={H}');
    await expect(page.locator('[data-testid="g4-node-row"][data-node-id="H"]')).toHaveAttribute('data-component-id', '4');
    await expect(page.locator('[data-testid="g4-stack-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');

    await page.click('[data-testid="prev-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('49 / 50');
    await expect(page.locator('[data-testid="cc-stage"]')).toHaveAttribute('data-operation', 'complete-component');
    await page.click('[data-testid="next-btn"]');
    await setFrame(page, 1, 50);
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(1);
    await setFrame(page, 49, 50);
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(4);
    await expectNoOverflow(page);
  });

  test('Kosaraju: first pass, transpose, second pass order and five SCCs agree', async ({ page }) => {
    test.setTimeout(300_000);
    await openApp(page);
    await selectAlgorithm(page, 'scc', 60);
    await expect(page.locator('[data-testid="scc-stage"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="scc-graph-svg"]')).toHaveAttribute('data-node-count', '8');
    await expect(page.locator('[data-testid="scc-graph-svg"]')).toHaveAttribute('data-edge-count', '7');
    await expect(page.locator('[data-testid="g4-node"]')).toHaveCount(8);
    await expect(page.locator('[data-testid="scc-edge"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-phase', 'first-pass');
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-reversed', 'false');
    await expect(page.locator('[data-testid="g4-component-empty"]')).toBeVisible();

    await setFrame(page, 1, 60);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-operation', 'start-first');
    await expect(page.locator('[data-testid="g4-node"][data-node-id="A"]')).toHaveAttribute('data-start', 'true');
    await expect(page.locator('[data-testid="g4-stack-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="scc-finish-chip"]')).toHaveCount(0);

    await setFrame(page, 14, 60);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-operation', 'finish');
    await expect(page.locator('[data-testid="scc-finish-chip"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="scc-finish-chip"][data-node-id="E"]')).toBeVisible();
    await expect(page.locator('[data-testid="g4-node"][data-node-id="E"]')).toHaveAttribute('data-finish-index', '1');

    await setFrame(page, 26, 60);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-operation', 'reverse');
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-phase', 'reverse');
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-reversed', 'true');
    await expect(page.locator('[data-testid="scc-edge"]')).toHaveCount(7);
    const reversedFlags = await page.locator('[data-testid="scc-edge"]').evaluateAll((edges) =>
      edges.map((edge) => (edge as HTMLElement).dataset.reversed));
    expect(new Set(reversedFlags)).toEqual(new Set(['true']));
    await expect(page.locator('[data-testid="scc-second-chip"]')).toHaveCount(8);
    await expect(page.locator('[data-testid="scc-second-chip"]').first()).toContainText('H');
    await expect(page.locator('[data-testid="scc-finish-chip"]')).toHaveCount(8);
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(0);

    await setFrame(page, 27, 60);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-phase', 'second-pass');
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="g4-component-row"][data-component-id="1"]')).toContainText('C1');
    await expect(page.locator('[data-testid="g4-node"][data-node-id="H"]')).toHaveAttribute('data-component-id', '1');
    await expect(page.locator('[data-testid="g4-node"][data-node-id="H"]')).toHaveAttribute('data-current', 'true');

    await setFrame(page, 29, 60);
    await expect(page.locator('[data-testid="g4-component-row"][data-component-id="1"]')).toHaveAttribute('data-complete', 'true');

    await setFrame(page, 59, 60);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-phase', 'done');
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="g4-component-count"]')).toContainText('5');
    await expect(page.locator('[data-testid="scc-finish-chip"]')).toHaveCount(8);
    await expect(page.locator('[data-testid="scc-second-chip"]')).toHaveCount(8);
    await expect(page.locator('[data-testid="scc-result"]')).toContainText('C1={H}');
    await expect(page.locator('[data-testid="scc-result"]')).toContainText('C5={D,E}');
    await expect(page.locator('[data-testid="scc-result"]')).toContainText('SCC');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');

    await page.click('[data-testid="prev-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('59 / 60');
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-operation', 'complete-component');
    await page.click('[data-testid="next-btn"]');
    await setFrame(page, 26, 60);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-reversed', 'true');
    await setFrame(page, 59, 60);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-phase', 'done');
    await expectNoOverflow(page);
  });

  test('empty graphs render an explicit empty state instead of a broken canvas', async ({ page }) => {
    test.setTimeout(300_000);
    await openApp(page);
    await selectAlgorithm(page, 'components', 50);
    const ccTotal = await runInput(page, { nodes: [], edges: [] });
    expect(ccTotal).toBeGreaterThanOrEqual(2);
    await expect(page.locator('[data-testid="g4-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="cc-stage"]')).toHaveCount(0);

    await selectAlgorithm(page, 'scc', 60);
    const sccTotal = await runInput(page, { nodes: [], edges: [] });
    expect(sccTotal).toBeGreaterThanOrEqual(2);
    await expect(page.locator('[data-testid="g4-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveCount(0);
    await expectNoOverflow(page);
  });

  test('SCC separates a one-way chain from a directed cycle', async ({ page }) => {
    test.setTimeout(300_000);
    await openApp(page);
    await selectAlgorithm(page, 'scc', 60);

    const chain = await runInput(page, {
      nodes: ['A', 'B', 'C'],
      edges: [['A', 'B'], ['B', 'C']],
    });
    await setFrame(page, chain - 1, chain);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-phase', 'done');
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="scc-result"]')).toContainText('C1={A}');
    await expect(page.locator('[data-testid="scc-result"]')).toContainText('C3={C}');

    const cycle = await runInput(page, {
      nodes: ['A', 'B', 'C'],
      edges: [['A', 'B'], ['B', 'C'], ['C', 'A']],
    });
    await setFrame(page, cycle - 1, cycle);
    await expect(page.locator('[data-testid="scc-stage"]')).toHaveAttribute('data-phase', 'done');
    await expect(page.locator('[data-testid="g4-component-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="scc-result"]')).toContainText('C1={A,C,B}');
    await expect(page.locator('[data-testid="scc-result"]')).not.toContainText('C2=');
    await expectNoOverflow(page);
  });
});
