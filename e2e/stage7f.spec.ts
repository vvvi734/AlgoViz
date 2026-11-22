import {
  expect,
  fillGraphDraft,
  selectAlgorithm as chooseAlgorithm,
  test,
  type GraphE2EDraft,
  type Page,
} from './fixtures';

const TOTAL = 46;

async function openApp(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectDijkstra(page: Page) {
  await chooseAlgorithm(page, 'dijkstra');
  await expect(page.locator('[data-testid="graph-visual"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', { timeout: 60_000 });
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${TOTAL}`, { timeout: 60_000 });
}

async function setFrame(page: Page, frame: number, total = TOTAL) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / ${total}`);
}

async function pqKeys(page: Page): Promise<string[]> {
  return page.locator('[data-testid="graph-pq-entry"]').evaluateAll((items) =>
    items.map((item) => `${item.getAttribute('data-distance')}:${item.getAttribute('data-node-id')}:${item.getAttribute('data-stale')}`),
  );
}

function distanceRow(page: Page, nodeId: string) {
  return page.locator(`[data-testid="dijkstra-distance-row"][data-node-id="${nodeId}"]`);
}

async function runGraphInput(page: Page, input: GraphE2EDraft, total: number) {
  await fillGraphDraft(page, input);
  await page.click('[data-testid="run-btn"]');
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 90_000 });
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', { timeout: 60_000 });
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('Stage 7F — real heapq Dijkstra, weighted graph, distance table and priority queue', () => {
  test('shows real weighted edges, min-heap pushes, relaxation and a stale entry from one trace', async ({ page }) => {
    await openApp(page);
    await selectDijkstra(page);

    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="graph-edge"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="graph-edge-weight"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="dijkstra-distance-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="dijkstra-distance-row"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="graph-priority-queue-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="queue-visual"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="stack-visual"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-node"][data-start="true"]')).toHaveAttribute('data-node-id', 'A');
    await expect(page.locator('[data-testid="graph-node"][data-target="true"]')).toHaveAttribute('data-node-id', 'G');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="G"]')).toHaveAttribute('data-distance', '');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="G"] [data-testid="graph-node-distance"]')).toHaveText('d=∞');

    const weights = await page.locator('[data-testid="graph-edge"]').evaluateAll((edges) =>
      edges.map((edge) => `${edge.getAttribute('data-from-id')}-${edge.getAttribute('data-to-id')}:${edge.getAttribute('data-weight')}`),
    );
    expect(weights).toEqual(['A-B:2', 'A-C:2', 'B-D:4', 'B-E:1', 'C-F:4', 'E-F:1', 'F-G:3']);

    await setFrame(page, 1);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'push');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-distance', '0');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"] [data-testid="graph-node-distance"]')).toHaveText('d=0');
    await expect(distanceRow(page, 'A')).toHaveAttribute('data-distance', '0');
    await expect(distanceRow(page, 'B')).toHaveAttribute('data-distance', '');
    await expect(page.locator('[data-testid="graph-pq-size"]')).toContainText('1');
    expect(await pqKeys(page)).toEqual(['0:A:false']);

    await setFrame(page, 5);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'relax');
    await expect(page.locator('[data-testid="dijkstra-relax-old"]')).toHaveText('∞');
    await expect(page.locator('[data-testid="dijkstra-relax-new"]')).toHaveText('2');
    await expect(page.locator('[data-testid="dijkstra-relax-strip"]')).toContainText('B');
    await expect(page.locator('[data-testid="dijkstra-relax-strip"]')).toContainText('— → A');
    await expect(distanceRow(page, 'B')).toHaveAttribute('data-distance', '2');
    await expect(distanceRow(page, 'B')).toHaveAttribute('data-previous-id', 'A');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-in-frontier', 'true');
    await expect(page.locator('[data-testid="graph-edge"][data-active="true"]')).toHaveAttribute('data-edge-id', 'e1');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="B"]')).toHaveAttribute('data-neighbor', 'true');
    expect(await pqKeys(page)).toEqual(['2:B:false']);

    await setFrame(page, 21);
    await expect(page.locator('[data-testid="dijkstra-relax-old"]')).toHaveText('∞');
    await expect(page.locator('[data-testid="dijkstra-relax-new"]')).toHaveText('6');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-distance', '6');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-previous-id', 'C');

    await setFrame(page, 27);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'relax');
    await expect(page.locator('[data-testid="dijkstra-relax-old"]')).toHaveText('6');
    await expect(page.locator('[data-testid="dijkstra-relax-new"]')).toHaveText('4');
    await expect(page.locator('[data-testid="dijkstra-relax-strip"]')).toContainText('C → E');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-distance', '4');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-previous-id', 'E');
    await expect(page.locator('[data-testid="graph-edge"][data-active="true"]')).toHaveAttribute('data-edge-id', 'e6');
    expect(await pqKeys(page)).toEqual(['4:F:false', '6:D:false', '6:F:true']);

    await setFrame(page, 40);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'stale');
    await expect(page.locator('[data-testid="graph-pq-removed"]')).toHaveAttribute('data-stale', 'true');
    await expect(page.locator('[data-testid="graph-pq-removed"]')).toContainText('(6, F)');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="F"]')).toHaveAttribute('data-settled', 'true');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-distance', '4');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-settled', 'true');
    await expect(page.locator('[data-testid="graph-pq-entry"]')).toHaveCount(1);
    expect(await pqKeys(page)).toEqual(['7:G:false']);

    await setFrame(page, 45);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="dijkstra-path"]')).toContainText('A');
    await expect(page.locator('[data-testid="dijkstra-path"]')).toContainText('B');
    await expect(page.locator('[data-testid="dijkstra-path"]')).toContainText('E');
    await expect(page.locator('[data-testid="dijkstra-path"]')).toContainText('F');
    await expect(page.locator('[data-testid="dijkstra-path"]')).toContainText('G');
    await expect(page.locator('[data-testid="dijkstra-path-distance"]')).toContainText('7');
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-path-distance', '7');
    await expect(page.locator('[data-testid="graph-node"][data-settled="true"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="graph-node"][data-on-path="true"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="graph-edge"][data-on-path="true"]')).toHaveCount(4);
    expect(await page.locator('[data-testid="dijkstra-distance-row"]').evaluateAll((rows) =>
      rows.map((row) => `${row.getAttribute('data-node-id')}:${row.getAttribute('data-distance')}:${row.getAttribute('data-previous-id')}`),
    )).toEqual(['A:0:', 'B:2:A', 'C:2:A', 'D:6:B', 'E:3:B', 'F:4:E', 'G:7:F']);

    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
  });

  test('restores graph, table and heap together on backward jumps, then reruns from scratch', async ({ page }) => {
    await openApp(page);
    await selectDijkstra(page);

    await setFrame(page, 45);
    await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="graph-node"][data-node-id="F"]')).toHaveAttribute('data-settled', 'true');

    await setFrame(page, 27);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'relax');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-distance', '4');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-previous-id', 'E');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-settled', 'false');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="F"]')).toHaveAttribute('data-settled', 'false');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="D"]')).toHaveAttribute('data-settled', 'false');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="G"]')).toHaveAttribute('data-settled', 'false');
    await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-edge"][data-on-path="true"]')).toHaveCount(0);
    expect(await pqKeys(page)).toEqual(['4:F:false', '6:D:false', '6:F:true']);

    await setFrame(page, 21);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'relax');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-distance', '6');
    await expect(distanceRow(page, 'F')).toHaveAttribute('data-previous-id', 'C');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="F"]')).toHaveAttribute('data-settled', 'false');
    await expect(page.locator('[data-testid="graph-node"][data-node-id="E"]')).toHaveAttribute('data-in-frontier', 'true');
    expect(await pqKeys(page)).toEqual(['3:E:false', '6:D:false', '6:F:false']);

    await setFrame(page, 3);
    await expect(page.locator('[data-testid="graph-node"][data-settled="true"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="graph-node"][data-node-id="A"]')).toHaveAttribute('data-settled', 'true');
    await expect(distanceRow(page, 'A')).toHaveAttribute('data-distance', '0');
    await expect(distanceRow(page, 'B')).toHaveAttribute('data-distance', '');
    await expect(page.locator('[data-testid="graph-pq-entry"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-pq-empty"]')).toBeVisible();

    await setFrame(page, 45);
    await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toBeVisible();

    await page.click('[data-testid="run-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${TOTAL}`, { timeout: 60_000 });
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'init');
    await expect(page.locator('[data-testid="graph-node"][data-settled="true"]')).toHaveCount(0);
    await expect(distanceRow(page, 'A')).toHaveAttribute('data-distance', '');
    await expect(page.locator('[data-testid="graph-pq-empty"]')).toBeVisible();

    await expectNoPageOverflow(page);
  });

  test('runs disconnected, equal-distance, single-node and negative-weight inputs in real Pyodide', async ({ page }) => {
    await openApp(page);
    await selectDijkstra(page);

    await runGraphInput(page, {
      start: 'A',
      target: 'D',
      directed: false,
      nodes: ['A', 'B', 'C', 'D'],
      edges: [['A', 'B', 1], ['C', 'D', 1]],
    }, 11);
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="graph-edge"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="dijkstra-distance-row"]')).toHaveCount(4);
    await setFrame(page, 10, 11);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="dijkstra-path-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="dijkstra-path-empty"]')).toContainText(/不可达|unreachable/i);
    await expect(page.locator('[data-testid="dijkstra-path-distance"]')).toHaveCount(0);
    await expect(distanceRow(page, 'D')).toHaveAttribute('data-distance', '');
    await expect(distanceRow(page, 'D')).toHaveAttribute('data-settled', 'false');
    await expect(page.locator('[data-testid="graph-node"][data-settled="true"]')).toHaveCount(2);

    await runGraphInput(page, {
      start: 'A',
      target: 'C',
      directed: false,
      nodes: ['A', 'B', 'C', 'D'],
      edges: [['A', 'B', 1], ['A', 'C', 1], ['B', 'D', 1], ['C', 'D', 1]],
    }, 27);
    await setFrame(page, 26, 27);
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="B"]')).toHaveAttribute('data-distance', '1');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="C"]')).toHaveAttribute('data-distance', '1');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="B"]')).toHaveAttribute('data-previous-id', 'A');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="C"]')).toHaveAttribute('data-previous-id', 'A');
    await setFrame(page, 26, 27);
    await expect(page.locator('[data-testid="dijkstra-path"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="dijkstra-path-distance"]')).toContainText('1');
    await expect(page.locator('[data-testid="graph-node"][data-settled="true"]')).toHaveCount(4);

    await runGraphInput(page, {
      start: 'A',
      target: 'A',
      directed: false,
      nodes: ['A'],
      edges: [],
    }, 5);
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="graph-edge"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-pq-empty"]')).toBeVisible();
    await setFrame(page, 4, 5);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-operation', 'done');
    await expect(page.locator('[data-testid="dijkstra-path"]')).toContainText('A');
    await expect(page.locator('[data-testid="dijkstra-path-distance"]')).toContainText('0');

    await fillGraphDraft(page, {
      target: 'B',
      nodes: ['A', 'B'],
      edges: [['A', 'B', -1]],
    });
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/non-negative|negative|非负|负权/i, { timeout: 60_000 });
    await expect(page.getByTestId('run-feedback')).toHaveClass(/error/);
    // Rejected drafts clear the previous trace rather than leaving a stale
    // Dijkstra canvas that looks like a valid result.
    await expect(page.locator('[data-testid="progress"]')).toHaveText('0 / 0');
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="graph-node"]')).toHaveCount(0);
  });
});
