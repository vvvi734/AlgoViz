import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

const BFS_TOTAL = 51;
const DFS_TOTAL = 51;

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgo(page: Page, id: string) {
  await chooseAlgorithm(page, id);
}

async function waitForGraph(page: Page, algorithm: 'bfs' | 'dfs', total = 51) {
  await expect(page.locator('[data-testid="graph-visual"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', algorithm, { timeout: 60_000 });
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
}

async function setFrame(page: Page, frame: number, total = 51) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / ${total}`);
}

async function graphNodeIds(page: Page): Promise<string[]> {
  return page.locator('[data-testid="graph-node"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-node-id') ?? ''),
  );
}

async function edgePairs(page: Page): Promise<Array<[string, string]>> {
  return page.locator('[data-testid="graph-edge"]').evaluateAll((edges) =>
    edges.map((edge) => [
      edge.getAttribute('data-from-id') ?? '',
      edge.getAttribute('data-to-id') ?? '',
    ] as [string, string]),
  );
}

async function queueNodeIds(page: Page): Promise<string[]> {
  return page.locator('[data-testid="queue-item"]').evaluateAll((items) =>
    items.map((item) => item.getAttribute('data-node-id') ?? ''),
  );
}

async function stackNodeIds(page: Page): Promise<string[]> {
  return page.locator('[data-testid="stack-item"]').evaluateAll((items) =>
    items.map((item) => item.getAttribute('data-node-id') ?? ''),
  );
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function showLesson(page: Page) {
  // UI-02: the course lives in the always-visible right rail; no tab to open.
  await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
}

async function showVariables(page: Page) {
  const more = page.locator('.key-vars-more summary');
  if (await more.count()) await more.click();
}

test.describe('Stage 7E — real graph BFS/DFS, same-frame frontier and playback', () => {
  test('BFS uses a real queue, highlights real edges, and restores that frame on scrub back', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'bfs');
    await waitForGraph(page, 'bfs', BFS_TOTAL);

    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-frontier-kind', 'queue');
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="graph-edge"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="queue-visual"]')).toBeVisible();
    await expect(page.locator('[data-testid="stack-visual"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-node"][data-start="true"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="graph-node"][data-start="true"]')).toHaveAttribute('data-node-id', 'A');
    expect(await graphNodeIds(page)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(await edgePairs(page)).toEqual([
      ['A', 'B'],
      ['A', 'C'],
      ['B', 'D'],
      ['B', 'E'],
      ['C', 'F'],
      ['E', 'F'],
      ['F', 'G'],
    ]);

    const a = await page.locator('[data-testid="graph-node"][data-node-id="A"]').boundingBox();
    const b = await page.locator('[data-testid="graph-node"][data-node-id="B"]').boundingBox();
    const c = await page.locator('[data-testid="graph-node"][data-node-id="C"]').boundingBox();
    expect(a && b && c).toBeTruthy();
    if (a && b && c) {
      expect(a.y).toBeLessThan(b.y);
      expect(b.x).toBeLessThan(a.x);
      expect(c.x).toBeGreaterThan(a.x);
      expect(Math.abs(b.y - c.y)).toBeLessThan(8);
    }

    await setFrame(page, 1, BFS_TOTAL);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-state', 'pending');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-current', 'true');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-visited', 'false');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-in-frontier', 'true');
    expect(await queueNodeIds(page)).toEqual(['A']);
    await expect(page.locator('[data-testid="graph-frontier-order"]')).toHaveText('A');

    await setFrame(page, 2, BFS_TOTAL);
    await expect(page.locator('[data-testid="queue-leaving"]')).toHaveAttribute('data-node-id', 'A');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-state', 'pending');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-visited', 'false');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-visit-index', '');

    await setFrame(page, 3, BFS_TOTAL);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-state', 'visited');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-current', 'true');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-visited', 'true');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-visit-index', '1');
    await expect(page.locator('[data-testid="graph-node"][data-visit-index="1"]')).toHaveCount(1);

    await setFrame(page, 4, BFS_TOTAL);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-current-edge-id', 'e1');
    await expect(page.locator('[data-testid="graph-edge"][data-active="true"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="graph-edge"][data-active="true"]')).toHaveAttribute('data-edge-id', 'e1');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-neighbor', 'true');

    await setFrame(page, 5, BFS_TOTAL);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-state', 'pending');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-in-frontier', 'false');
    await setFrame(page, 9, BFS_TOTAL);
    expect(await queueNodeIds(page)).toEqual(['B', 'C']);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-in-frontier', 'true');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-in-frontier', 'true');

    await setFrame(page, 11, BFS_TOTAL);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-visit-index', '2');
    await expect(page.locator('[data-testid="graph-node"][data-state="visited"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="graph-node"][data-current="true"]')).toHaveAttribute('data-node-id', 'B');
    expect(await queueNodeIds(page)).toEqual(['C']);
    await expect(page.locator('[data-testid="graph-current-node"]')).toContainText('B');
    await showVariables(page);
    await expect(page.getByTestId('key-vars')).toContainText('queue');
    await expect(page.getByTestId('key-vars')).toContainText('frontier_size');
    await expect(page.getByTestId('key-vars')).toContainText('C');
    await showLesson(page);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'visit');

    await setFrame(page, 19, BFS_TOTAL);
    expect(await queueNodeIds(page)).toEqual(['C', 'D', 'E']);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="D"]')).toHaveAttribute('data-in-frontier', 'true');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="D"]')).toHaveAttribute('data-visited', 'false');

    await showVariables(page);

    await setFrame(page, 13, BFS_TOTAL);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'skip');
    await expect(page.locator('[data-testid="graph-neighbor-node"]')).toContainText('A');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'skip');

    await setFrame(page, 9, BFS_TOTAL);
    expect(await queueNodeIds(page)).toEqual(['B', 'C']);
    await setFrame(page, 3, BFS_TOTAL);
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(0);
    expect(await queueNodeIds(page)).toEqual([]);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-state', 'undiscovered');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-state', 'undiscovered');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-visit-index', '1');
    await showLesson(page);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'visit');

    await setFrame(page, 50, BFS_TOTAL);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="graph-node"][data-state="visited"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="graph-node"][data-state="current"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-visit-list"] li')).toHaveCount(7);
    expect(await page.locator('[data-testid="graph-visit-list"] li').evaluateAll((items) =>
      items.map((item) => `${item.getAttribute('data-visit-index')}:${item.getAttribute('data-node-label')}`),
    )).toEqual(['1:A', '2:B', '3:C', '4:D', '5:E', '6:F', '7:G']);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
  });

  test('DFS uses an explicit LIFO stack, parks C, and restores it after arbitrary jumps', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'dfs');
    await waitForGraph(page, 'dfs', DFS_TOTAL);

    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-frontier-kind', 'stack');
    await expect(page.locator('[data-testid="stack-visual"]')).toBeVisible();
    await expect(page.locator('[data-testid="queue-visual"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(7);

    await setFrame(page, 6, DFS_TOTAL);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-state', 'pending');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-in-frontier', 'true');
    expect(await stackNodeIds(page)).toEqual(['C']);

    await setFrame(page, 9, DFS_TOTAL);
    expect(await stackNodeIds(page)).toEqual(['B', 'C']);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-in-frontier', 'true');
    await expect(page.locator('[data-testid="graph-current-node"]')).toContainText('A');
    await showLesson(page);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'push');

    await setFrame(page, 17, DFS_TOTAL);
    expect(await stackNodeIds(page)).toEqual(['D', 'E', 'C']);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="D"]')).toHaveAttribute('data-state', 'pending');
    await expect(page.locator('[data-testid="graph-current-node"]')).toContainText('B');

    await setFrame(page, 20, DFS_TOTAL);
    await expect(page.locator('[data-testid="stack-leaving"]')).toHaveAttribute('data-node-id', 'D');
    expect(await stackNodeIds(page)).toEqual(['E', 'C']);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="D"]')).toHaveAttribute('data-state', 'pending');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="D"]')).toHaveAttribute('data-current', 'true');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="D"]')).toHaveAttribute('data-visit-index', '');
    await expect(page.locator('[data-testid="graph-node"][data-visited="true"]')).toHaveCount(2);

    await setFrame(page, 32, DFS_TOTAL);
    expect(await stackNodeIds(page)).toEqual(['C']);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="F"]')).toHaveAttribute('data-visit-index', '5');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="F"]')).toHaveAttribute('data-state', 'visited');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="F"]')).toHaveAttribute('data-current', 'true');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-state', 'pending');
    await showVariables(page);
    await expect(page.getByTestId('key-vars')).toContainText('stack');
    await expect(page.getByTestId('key-vars')).toContainText('frontier_size');
    await showLesson(page);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'visit');

    await setFrame(page, 44, DFS_TOTAL);
    await expect(page.locator('[data-testid="stack-item"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-state', 'pending');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-current', 'true');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-visit-index', '');
    await expect(page.locator('[data-testid="graph-node"][data-visited="true"]')).toHaveCount(6);

    await setFrame(page, 50, DFS_TOTAL);
    await expect(page.locator('[data-testid="graph-node"][data-state="visited"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-visit-index', '7');
    expect(await page.locator('[data-testid="graph-visit-list"] li').evaluateAll((items) =>
      items.map((item) => item.getAttribute('data-node-label')),
    )).toEqual(['A', 'B', 'D', 'E', 'F', 'G', 'C']);

    await setFrame(page, 0, DFS_TOTAL);
    await expect(page.locator('[data-testid="stack-item"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-node"][data-state="undiscovered"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="graph-node"][data-state="current"]')).toHaveCount(0);
  });

  test('BFS/DFS switching starts a fresh trace and never reuses old frames', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'bfs');
    await waitForGraph(page, 'bfs', BFS_TOTAL);
    await setFrame(page, 37, BFS_TOTAL);
    await expect(page.locator('[data-testid="graph-node"][data-state="visited"]')).toHaveCount(5);

    await selectAlgo(page, 'dfs');
    await waitForGraph(page, 'dfs', DFS_TOTAL);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-frontier-kind', 'stack');
    await expect(page.locator('[data-testid="stack-visual"]')).toBeVisible();
    await expect(page.locator('[data-testid="queue-visual"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-node"][data-state="visited"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-node"][data-visited="true"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-visit-list"] li')).toHaveCount(0);

    await selectAlgo(page, 'bfs');
    await waitForGraph(page, 'bfs', BFS_TOTAL);
    await expect(page.locator('[data-testid="queue-visual"]')).toBeVisible();
    await expect(page.locator('[data-testid="stack-visual"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-visit-list"] li')).toHaveCount(0);
  });

  test('empty, single-node, disconnected and duplicate-edge graphs stay safe', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'bfs');
    await waitForGraph(page, 'bfs', BFS_TOTAL);

    await openCodePanel(page);
    await page.fill('#run-input', '{"start":null,"nodes":[],"edges":[]}');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="graph-empty"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 2', { timeout: 60_000 });
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(0);
    await setFrame(page, 1, 2);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'done');

    await page.fill('#run-input', '{"start":"A","nodes":["A"],"edges":[]}');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(1, { timeout: 60_000 });
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-isolated', 'true');
    await expect(page.locator('[data-testid="graph-edge"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 5', { timeout: 60_000 });

    await page.fill('#run-input', '{"start":"A","nodes":["A","B","C"],"edges":[["A","B"]]}');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(3, { timeout: 60_000 });
    await setFrame(page, 11, 12);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-state', 'undiscovered');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="C"]')).toHaveAttribute('data-visit-index', '');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-visit-index', '1');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-visit-index', '2');

    await page.fill('#run-input', '{"start":"A","nodes":["A","B","C"],"edges":[["A","B"],["A","B"],["B","C"]]}');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(3, { timeout: 60_000 });
    await expect(page.locator('[data-testid="graph-edge"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 19', { timeout: 60_000 });
  });

  test('invalid graph input is reported and the previous valid graph is not faked', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'bfs');
    await waitForGraph(page, 'bfs', BFS_TOTAL);
    await openCodePanel(page);
    await page.fill('#run-input', '{"start":"Z","nodes":["A","B"],"edges":[["A","B"]]}');
    await page.getByTestId('run-btn').click();
    await expect(page.locator('[data-testid="run-feedback"]')).toContainText(/start must name an existing node/);
    await expect(page.locator('[data-testid="run-feedback"]')).toHaveClass(/error/);
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('0 / 0');
  });

  test('1024/390 keep the graph readable, scroll inside the canvas, and reduced motion preserves state', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'bfs');
    await waitForGraph(page, 'bfs', BFS_TOTAL);
    await setFrame(page, 11, BFS_TOTAL);

    for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await expectNoPageOverflow(page);
      await expect(page.locator('[data-testid="graph-visual"]')).toBeVisible();
      await expect(page.locator('[data-testid="graph-frontier-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="scrub"]')).toBeVisible();
      await expect(page.locator('[data-testid="code-dock"]')).toBeVisible();
      if (viewport.width === 390) {
        await expect(page.locator('[data-testid="graph-scroll-hint"]')).toBeVisible();
        const canvas = page.locator('.graph-canvas-scroll');
        const sizes = await canvas.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
        expect(sizes.scrollWidth).toBeGreaterThan(sizes.clientWidth);
      }
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setFrame(page, 19, BFS_TOTAL);
    expect(await queueNodeIds(page)).toEqual(['C', 'D', 'E']);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-visit-index', '2');
    await expect(page.locator('[data-testid="graph-edge"][data-active="true"]')).toHaveCount(1);
    const reducedAnimation = await page.locator('[data-testid="graph-edge"][data-active="true"]').evaluate(
      (edge) => getComputedStyle(edge).animationName,
    );
    expect(reducedAnimation).toBe('none');
  });
});
