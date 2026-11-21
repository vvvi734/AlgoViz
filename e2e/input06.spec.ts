import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

async function waitGenerated(page: Page) {
  await expect(page.getByTestId('run-feedback')).toContainText(/动画已生成|Visualization ready/, {
    timeout: 90_000,
  });
}

async function totalFrames(page: Page): Promise<number> {
  const max = Number(
    await page.locator('[data-testid="scrub"]').evaluate((node) => (node as HTMLInputElement).max),
  );
  return max + 1;
}

async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

async function setFrame(page: Page, frame: number, total: number) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
      const input = node as HTMLInputElement;
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      const apply = (next: number) => {
        nativeSetter?.call(input, String(next));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      if (input.value === String(value)) apply(value === 0 ? 1 : 0);
      apply(value);
    }, frame);
    await page.waitForTimeout(80);
    const label = await page.getByTestId('progress').textContent();
    if (label === `${frame + 1} / ${total}`) return;
  }
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`);
}

async function seekLast(page: Page) {
  const total = await totalFrames(page);
  await setFrame(page, total - 1, total);
}

async function seekMatching(
  page: Page,
  testId: string,
  attributes: Record<string, string>,
): Promise<number> {
  const visual = page.getByTestId(testId);
  const total = await totalFrames(page);
  for (let index = 0; index < total; index += 1) {
    await setFrame(page, index, total);
    const matches = await visual.evaluate((node, expected) => {
      const element = node as HTMLElement;
      return Object.entries(expected).every(([key, value]) => element.dataset[key] === value);
    }, attributes);
    if (matches) return index;
  }
  throw new Error(`no frame matched ${testId} ${JSON.stringify(attributes)}`);
}

async function runCurrent(page: Page) {
  await page.getByTestId('run-btn').click();
  await waitGenerated(page);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
  await settle(page);
}

async function openAlgorithm(page: Page, id: string, visualTestId: string) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, id);
  await openCodePanel(page);
  await expect(page.getByTestId('guided-input')).toHaveAttribute('data-algorithm', id);
  await expect(page.getByTestId(visualTestId)).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

async function switchAlgorithm(page: Page, id: string, visualTestId: string) {
  await chooseAlgorithm(page, id);
  await expect(page.getByTestId('guided-input')).toHaveAttribute('data-algorithm', id);
  await expect(page.getByTestId(visualTestId)).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

type Edge = [from: string, to: string, weight?: number | string];

async function setGraph(
  page: Page,
  nodes: string[],
  edges: Edge[],
  options: { directed?: boolean; start?: string; target?: string } = {},
) {
  if (options.directed !== undefined) {
    const toggle = page.getByTestId('graph-directed');
    const checked = await toggle.isChecked();
    if (checked !== options.directed) await toggle.click();
  }

  while ((await page.getByTestId('graph-node-remove').count()) > 0) {
    await page.getByTestId('graph-node-remove').first().click();
  }
  await expect(page.getByTestId('graph-node-input')).toHaveCount(0);

  for (let index = 0; index < nodes.length; index += 1) {
    await page.getByTestId('graph-add-node').click();
    await expect(page.getByTestId('graph-node-input')).toHaveCount(index + 1);
  }
  for (let index = 0; index < nodes.length; index += 1) {
    await page.getByTestId('graph-node-input').nth(index).fill(nodes[index]!);
  }

  await expect(page.getByTestId('graph-edge-from')).toHaveCount(0);
  for (let index = 0; index < edges.length; index += 1) {
    const [from, to, weight] = edges[index]!;
    await page.getByTestId('graph-add-edge').click();
    await expect(page.getByTestId('graph-edge-from')).toHaveCount(index + 1);
    await page.getByTestId('graph-edge-from').nth(index).selectOption(from);
    await page.getByTestId('graph-edge-to').nth(index).selectOption(to);
    if (weight !== undefined) {
      await page.getByTestId('graph-input-edge-weight').nth(index).fill(String(weight));
    }
  }

  if (options.start !== undefined) await page.getByTestId('graph-start').selectOption(options.start);
  if (options.target !== undefined) await page.getByTestId('graph-target').selectOption(options.target);
  await expect(page.getByTestId('guided-mode-custom')).toHaveAttribute('aria-pressed', 'true');
}

async function visitOrder(page: Page): Promise<string[]> {
  return page
    .getByTestId('graph-visit-list')
    .locator('li')
    .evaluateAll((items) => items.map((item) => (item as HTMLElement).dataset.nodeLabel ?? ''));
}

async function componentIds(page: Page, rowTestId: string): Promise<Record<string, string>> {
  return page.getByTestId(rowTestId).evaluateAll((rows) => {
    const result: Record<string, string> = {};
    for (const row of rows) {
      const element = row as HTMLElement;
      const id = element.dataset.nodeId;
      if (id) result[id] = element.dataset.componentId ?? '';
    }
    return result;
  });
}

async function componentGroups(page: Page): Promise<string[][]> {
  return page.getByTestId('g4-component-row').evaluateAll((rows) =>
    rows.map((row) => Array.from((row as HTMLElement).querySelectorAll('code')).map((code) => code.textContent ?? '')),
  );
}

test.describe.configure({ timeout: 300_000 });

test.describe('INPUT-06 — custom graph tables drive the real Python trace', () => {
  test('BFS and DFS follow directed custom edges deterministically', async ({ page }) => {
    await openAlgorithm(page, 'bfs', 'graph-visual');
    await setGraph(
      page,
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B'],
        ['A', 'C'],
        ['B', 'D'],
        ['C', 'D'],
      ],
      { directed: true, start: 'A' },
    );
    await runCurrent(page);
    await seekLast(page);

    await expect(page.getByTestId('graph-svg')).toHaveAttribute('data-node-count', '4');
    await expect(page.getByTestId('graph-svg')).toHaveAttribute('data-edge-count', '4');
    await expect(page.getByTestId('graph-edge').first()).toHaveAttribute('data-directed', 'true');
    expect(await visitOrder(page)).toEqual(['A', 'B', 'C', 'D']);

    await switchAlgorithm(page, 'dfs', 'graph-visual');
    await setGraph(
      page,
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B'],
        ['A', 'C'],
        ['B', 'D'],
        ['C', 'D'],
      ],
      { directed: true, start: 'A' },
    );
    await runCurrent(page);
    await seekLast(page);
    expect(await visitOrder(page)).toEqual(['A', 'B', 'D', 'C']);
  });

  test('connected components and Kosaraju rebuild their own partitions and reverse graph', async ({ page }) => {
    await openAlgorithm(page, 'components', 'cc-stage');
    await setGraph(
      page,
      ['A', 'B', 'C', 'D', 'E', 'F'],
      [
        ['A', 'B'],
        ['B', 'C'],
        ['D', 'E'],
      ],
    );
    await runCurrent(page);
    await seekLast(page);

    await expect(page.getByTestId('g4-component-row')).toHaveCount(3);
    const undirected = await componentIds(page, 'g4-node-row');
    expect(undirected.A).toBe(undirected.B);
    expect(undirected.B).toBe(undirected.C);
    expect(undirected.D).toBe(undirected.E);
    expect(undirected.A).not.toBe(undirected.D);
    expect(undirected.F).not.toBe(undirected.D);

    await switchAlgorithm(page, 'scc', 'scc-stage');
    await setGraph(
      page,
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B'],
        ['B', 'A'],
        ['B', 'C'],
        ['C', 'D'],
        ['D', 'C'],
      ],
    );
    await runCurrent(page);
    await seekMatching(page, 'scc-stage', { reversed: 'true' });
    await expect(page.getByTestId('scc-graph-svg')).toHaveAttribute('data-reversed', 'true');
    await seekLast(page);

    await expect(page.getByTestId('g4-component-row')).toHaveCount(2);
    const directedGroups = await componentGroups(page);
    expect(directedGroups).toContainEqual(['A', 'B']);
    expect(directedGroups).toContainEqual(['C', 'D']);
  });

  test('Dijkstra, Bellman-Ford and Floyd-Warshall rebuild distances for custom weighted graphs', async ({ page }) => {
    await openAlgorithm(page, 'dijkstra', 'graph-visual');
    await setGraph(
      page,
      ['A', 'B', 'C', 'D', 'E'],
      [
        ['A', 'B', 1],
        ['B', 'C', 2],
        ['A', 'C', 5],
        ['C', 'D', 3],
        ['A', 'D', 10],
      ],
      { start: 'A', target: 'D' },
    );
    await runCurrent(page);
    await seekLast(page);

    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="D"]')).toHaveAttribute(
      'data-distance',
      '6',
    );
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="E"]')).toHaveAttribute(
      'data-distance',
      '',
    );
    const shortestPath = await page
      .getByTestId('dijkstra-path')
      .locator('span[data-node-id]')
      .evaluateAll((items) => items.map((item) => (item as HTMLElement).dataset.nodeId ?? ''));
    expect(shortestPath).toEqual(['A', 'B', 'C', 'D']);

    await switchAlgorithm(page, 'bellman-ford', 'bellman-stage');
    await setGraph(
      page,
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B', 4],
        ['C', 'D', -3],
        ['D', 'C', -1],
      ],
      { directed: true, start: 'A', target: 'B' },
    );
    await runCurrent(page);
    await seekLast(page);

    await expect(
      page.locator('[data-testid="bellman-distance-row"][data-node-id="B"]'),
    ).toHaveAttribute('data-distance', '4');
    await expect(
      page.locator('[data-testid="bellman-distance-row"][data-node-id="C"]'),
    ).toHaveAttribute('data-distance', '');
    await expect(page.getByTestId('bellman-negative-cycle')).toHaveCount(0);

    await switchAlgorithm(page, 'floyd-warshall', 'floyd-stage');
    await setGraph(
      page,
      ['A', 'B', 'C', 'D', 'E'],
      [
        ['A', 'B', 2],
        ['B', 'C', 3],
        ['C', 'D', -4],
        ['D', 'C', 1],
      ],
      { directed: true, start: 'A', target: 'E' },
    );
    await runCurrent(page);
    await seekLast(page);

    await expect(page.getByTestId('floyd-negative-cycle')).toBeVisible();
    await expect(
      page.locator('[data-testid="floyd-cell"][data-row-node-id="E"][data-column-node-id="A"]'),
    ).toHaveAttribute('data-value', '');
  });

  test('Prim keeps a clear forest and Kruskal keeps stable equal-weight ordering', async ({ page }) => {
    await openAlgorithm(page, 'prim', 'prim-stage');
    await setGraph(
      page,
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B', 2],
        ['C', 'D', 3],
      ],
      { start: 'A' },
    );
    await runCurrent(page);
    await seekLast(page);

    await expect(page.getByTestId('prim-stage')).toHaveAttribute('data-forest', 'true');
    await expect(page.getByTestId('prim-forest-alert')).toBeVisible();
    await expect(page.getByTestId('prim-total-weight')).toContainText('5');
    await expect(page.getByTestId('prim-graph-svg')).toHaveAttribute('data-node-count', '4');

    await switchAlgorithm(page, 'kruskal', 'kruskal-stage');
    await setGraph(
      page,
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B', 1],
        ['A', 'C', 1],
        ['B', 'C', 1],
        ['C', 'D', 1],
      ],
    );
    await runCurrent(page);
    await seekLast(page);

    await expect(page.getByTestId('kruskal-total-weight')).toContainText('3');
    const sorted = await page
      .getByTestId('kruskal-sorted-edge')
      .evaluateAll((rows) => rows.map((row) => (row as HTMLElement).dataset.edgeId ?? ''));
    expect(sorted).toEqual(['e1', 'e2', 'e3', 'e4']);
  });

  test('Kahn stops on a cycle and AOE keeps its real critical path and slack', async ({ page }) => {
    await openAlgorithm(page, 'topological', 'topo-stage');
    await setGraph(
      page,
      ['A', 'B', 'C'],
      [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'A'],
      ],
    );
    await runCurrent(page);
    await seekLast(page);

    await expect(page.getByTestId('topo-stage')).toHaveAttribute('data-cycle', 'true');
    await expect(page.getByTestId('topo-cycle-alert')).toBeVisible();
    await expect(page.getByTestId('topo-order-chip')).toHaveCount(0);

    await switchAlgorithm(page, 'critical-path', 'critical-stage');
    await setGraph(
      page,
      ['A', 'B', 'C', 'D', 'E'],
      [
        ['A', 'B', 3],
        ['A', 'C', 2],
        ['B', 'D', 4],
        ['C', 'D', 2],
        ['D', 'E', 5],
      ],
    );
    await runCurrent(page);
    await seekLast(page);

    await expect(page.getByTestId('critical-stage')).toHaveAttribute('data-cycle', 'false');
    await expect(page.getByTestId('critical-duration')).toHaveText('12');
    await expect(page.getByTestId('critical-path-count')).toHaveText('1');
    await expect(page.locator('[data-testid="critical-path-item"]')).toHaveAttribute(
      'data-path',
      'A>B>D>E',
    );
    await expect(
      page.locator('[data-testid="critical-activity-row"][data-edge-id="e2"]'),
    ).toHaveAttribute('data-slack', '3');
    await expect(
      page.locator('[data-testid="critical-activity-row"][data-edge-id="e4"]'),
    ).toHaveAttribute('data-slack', '3');
  });
});
