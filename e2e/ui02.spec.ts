import { collapseAlgorithmGuide, expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

/**
 * UI-02 — the learning workspace is now "animation left, synchronized lesson
 * right". These tests use the real Dijkstra trace (real Pyodide worker) and
 * assert the rail follows the single LabController playhead, never a second one.
 */

async function openApp(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgo(page: Page, id: string) {
  await chooseAlgorithm(page, id);
}

async function openDijkstra(page: Page) {
  await openApp(page);
  await selectAlgo(page, 'dijkstra');
  await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dijkstra', {
    timeout: 60_000,
  });
  await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 46', { timeout: 60_000 });
  // UX-01 keeps its guide above this legacy layout; fold it to measure the
  // already-specified two-column workspace and first-screen rail position.
  await collapseAlgorithmGuide(page);
}

async function setFrame(page: Page, frame: number, total = 46) {
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

test.describe('UI-02 — left animation, right synchronized explanation', () => {
  test('A. 1440 puts the stage left and a readable lesson rail right, with code docked below', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);

    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    const rail = await page.locator('[data-testid="explanation-rail"]').boundingBox();
    const current = await page.locator('[data-testid="current-step"]').boundingBox();
    const lesson = await page.locator('[data-testid="lesson-panel"]').boundingBox();
    const primary = await page.locator('.lab-primary').boundingBox();
    const dock = await page.locator('[data-testid="code-dock"]').boundingBox();
    expect(stage && rail && current && lesson && primary && dock).toBeTruthy();
    if (!stage || !rail || !current || !lesson || !primary || !dock) return;

    expect(rail.x).toBeGreaterThan(stage.x + stage.width - 10);
    expect(rail.width).toBeGreaterThanOrEqual(390);
    expect(lesson.width).toBeGreaterThanOrEqual(380);
    // The rail can grow as the expanded guide renders; the current-step block
    // must stay inside the rail and inside the 900px viewport, not at a fixed
    // offset from the rail origin.
    expect(current.y).toBeGreaterThanOrEqual(rail.y - 1);
    expect(current.y + current.height).toBeLessThanOrEqual(Math.min(900, rail.y + rail.height) + 1);
    expect(current.y + current.height).toBeLessThanOrEqual(900);
    // UI-03: the source editor left the rail; the compact run bar sits below both columns.
    await expect(page.locator('[data-testid="explanation-rail"] .monaco-editor')).toHaveCount(0);
    expect(dock.y).toBeGreaterThan(primary.y + primary.height - 12);
    expect(dock.width).toBeGreaterThan(stage.width + rail.width - 10);
    await expect(page.locator('[data-testid="code-dock"]')).toHaveAttribute('data-expanded', 'true');

    await expect(page.locator('[data-testid="lesson-title"]')).toContainText(/Dijkstra|最短路径/i);
    await expect(page.locator('[data-testid="current-step-title"]')).toContainText(/带权图|Weighted graph/i);
    await expect(page.locator('[data-testid="lesson-frame"]')).toContainText('1/46');
    await expect(page.locator('[data-testid="current-step-message"]')).toContainText('∞');
    await expect(page.locator('[data-testid="stage-step-peek"]')).toBeVisible();
    await expect(page.locator('[data-testid="dijkstra-distance-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="graph-priority-queue-panel"]')).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test('B. the rail follows relax, rollback, stale and final-path frames from the same trace', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);

    await setFrame(page, 27);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'relax');
    await expect(page.locator('[data-testid="current-step-title"]')).toContainText(/松弛|Relax/i);
    await expect(page.locator('[data-testid="lesson-frame"]')).toContainText('28/46');
    await expect(page.locator('[data-testid="lesson-step-relax"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="lesson-step-done"]')).toHaveAttribute('data-active', 'false');
    await expect(page.locator('[data-testid="dijkstra-relax-old"]')).toHaveText('6');
    await expect(page.locator('[data-testid="dijkstra-relax-new"]')).toHaveText('4');
    await expect(page.locator('[data-testid="current-step-message"]')).not.toBeEmpty();

    // Arbitrary backward jump: graph, table, heap and explanation all return together.
    await setFrame(page, 21);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'relax');
    await expect(page.locator('[data-testid="lesson-frame"]')).toContainText('22/46');
    await expect(page.locator('[data-testid="dijkstra-relax-old"]')).toHaveText('∞');
    await expect(page.locator('[data-testid="dijkstra-relax-new"]')).toHaveText('6');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="F"]')).toHaveAttribute('data-distance', '6');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="F"]')).toHaveAttribute('data-previous-id', 'C');
    await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toHaveCount(0);

    await setFrame(page, 40);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'stale');
    await expect(page.locator('[data-testid="current-step-title"]')).toContainText(/过期|Stale/i);
    await expect(page.locator('[data-testid="graph-pq-removed"]')).toHaveAttribute('data-stale', 'true');
    await expect(page.locator('[data-testid="lesson-step-stale"]')).toHaveAttribute('data-active', 'true');

    await setFrame(page, 45);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');
    await expect(page.locator('[data-testid="current-step-title"]')).toContainText(/堆空|Empty heap/i);
    await expect(page.locator('[data-testid="lesson-frame"]')).toContainText('46/46');
    await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toBeVisible();

    // The rail has no private index: jumping back again updates the visible copy.
    await setFrame(page, 3);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'settle');
    await expect(page.locator('[data-testid="dijkstra-path-summary"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="lesson-frame"]')).toContainText('4/46');
  });

  test('C. collapsing the algorithm directory keeps the playhead and the two-column layout intact', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDijkstra(page);
    await setFrame(page, 27);

    await page.click('[data-testid="sidebar-collapse"]');
    await expect(page.locator('[data-testid="learn-view"]')).toHaveClass(/nav-collapsed/);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('28 / 46');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="F"]')).toHaveAttribute('data-distance', '4');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'relax');

    const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    const rail = await page.locator('[data-testid="explanation-rail"]').boundingBox();
    expect(stage && rail).toBeTruthy();
    if (stage && rail) expect(rail.x).toBeGreaterThan(stage.x + stage.width - 10);
    await expectNoPageOverflow(page);

    await page.click('[data-testid="sidebar-expand"]');
    await expect(page.locator('[data-testid="learn-view"]')).not.toHaveClass(/nav-collapsed/);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('28 / 46');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'relax');
    await expect(page.locator('[data-testid="dijkstra-relax-new"]')).toHaveText('4');
  });

  test('D. BFS/DFS, tree and linked list keep their own visuals and their rail step', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);

    await selectAlgo(page, 'bfs');
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'bfs', { timeout: 60_000 });
    await setFrame(page, 11, 51);
    await expect(page.locator('[data-testid="graph-frontier-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'visit');
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(1);

    await selectAlgo(page, 'dfs');
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'dfs', { timeout: 60_000 });
    await setFrame(page, 9, 51);
    await expect(page.locator('[data-testid="stack-visual"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'push');
    await expect(page.locator('[data-testid="current-step-title"]')).toContainText(/压栈|Push/i);

    await selectAlgo(page, 'linked');
    await expect(page.locator('[data-testid="linked-visual"]')).toBeVisible({ timeout: 60_000 });
    await setFrame(page, 12, 22);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'insert');
    await expect(page.locator('[data-testid="current-step-title"]')).toContainText(/插入|Insert/i);

    await selectAlgo(page, 'inorder');
    await expect(page.locator('[data-testid="tree-visual"]')).toBeVisible({ timeout: 60_000 });
    await setFrame(page, 5, 30);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'enter');
    await expect(page.locator('[data-testid="current-step-title"]')).toContainText(/进入|Enter/i);
    await expectNoPageOverflow(page);
  });

  test('E. every algorithm now has a real course; fib no longer falls back to an empty rail', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgo(page, 'fib');
    await expect(page.locator('[data-testid="lab-title"]')).toContainText('斐波那契');
    await expect(page.locator('[data-testid="visual-stage"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-no-lesson"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="lesson-unlinked"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="lesson-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="rail-stage-jumps"]')).not.toHaveCount(0);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test('F. 1366 stays two-column and 1024/390 stack without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openDijkstra(page);

    const wideStage = await page.locator('[data-testid="visual-stage"]').boundingBox();
    const wideRail = await page.locator('[data-testid="explanation-rail"]').boundingBox();
    expect(wideStage && wideRail).toBeTruthy();
    if (wideStage && wideRail) {
      expect(wideRail.x).toBeGreaterThan(wideStage.x + wideStage.width - 10);
      expect(wideRail.width).toBeGreaterThanOrEqual(390);
    }
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
    await expectNoPageOverflow(page);

    for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const stage = await page.locator('[data-testid="visual-stage"]').boundingBox();
      const rail = await page.locator('[data-testid="explanation-rail"]').boundingBox();
      const current = await page.locator('[data-testid="current-step"]').boundingBox();
      expect(stage && rail && current).toBeTruthy();
      if (!stage || !rail || !current) continue;
      expect(rail.y).toBeGreaterThan(stage.y + stage.height - 10);
      expect(current.y).toBeGreaterThan(rail.y);
      await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
      await expectNoPageOverflow(page);
      if (viewport.width === 390) {
        await expect(page.locator('[data-testid="mobile-algo-select"]')).toBeVisible();
      }
    }
  });
});
