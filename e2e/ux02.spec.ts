import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { collapseAlgorithmGuide, expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/ux02/after');
mkdirSync(SHOT_DIR, { recursive: true });

async function openApp(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgorithm(page: Page, id: string, total: number, _group: 'graph' | 'tree' = 'graph') {
  await chooseAlgorithm(page, id);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
  await collapseAlgorithmGuide(page);
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

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('UX-02 — compact, frame-synchronised teaching rail', () => {
  test('Dijkstra: four parts stay in sync across relax, rollback, stale and the live step jump', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'dijkstra', 46);

    // Default rail: key state plus one current operation, with no duplicate
    // course-detail or step-list panels.
    await expect(page.getByTestId('key-state')).toBeVisible();
    await expect(page.getByTestId('current-step')).toBeVisible();
    await expect(page.getByTestId('current-step-title')).toContainText(/带权图|Weighted graph/i);
    await expect(page.getByTestId('current-step-message')).toContainText('∞');
    await expect(page.getByTestId('lesson-overview')).toHaveCount(0);
    await expect(page.getByTestId('lesson-steps')).toHaveCount(0);

    await setFrame(page, 27, 46);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'relax');
    await expect(page.getByTestId('current-step-title')).toContainText(/松弛|Relax/i);
    await expect(page.getByTestId('lesson-frame')).toContainText('28/46');
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();
    await page.screenshot({ path: resolve(SHOT_DIR, 'dijkstra-relax-1440-light.png') });

    // Backward scrub must replace every part, not only the title.
    await setFrame(page, 21, 46);
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();
    await page.getByTestId('next-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('23 / 46');
    await page.getByTestId('prev-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('22 / 46');

    await setFrame(page, 40, 46);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'stale');
    await expect(page.getByTestId('current-step-title')).toContainText(/过期|Stale/i);
    await expect(page.getByTestId('current-step-message')).toContainText(/已过期|过期|stale|skip/i);

    await setFrame(page, 45, 46);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expect(page.getByTestId('current-step-title')).toContainText(/堆空|Empty heap/i);
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();
    await page.screenshot({ path: resolve(SHOT_DIR, 'dijkstra-done-1440-light.png') });

    // The compact stage strip still seeks to a real frame, without a second
    // duplicate step list.
    await page.getByTestId('lesson-step-relax').click();
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'relax');
    await expect(page.getByTestId('current-step-title')).toContainText(/松弛|Relax/i);
    await expect(page.getByTestId('lesson-active-step')).toHaveCount(1);
  });

  test('Kahn: indegree, enqueue and dequeue all come from the real snapshot', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'topological', 32);
    await expect(page.locator('[data-testid="topo-stage"]')).toBeVisible({ timeout: 60_000 });

    await setFrame(page, 5, 32);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'decrement');
    await expect(page.getByTestId('current-step-title')).toContainText(/移除依赖|Remove dependency/i);
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();
    await page.screenshot({ path: resolve(SHOT_DIR, 'kahn-decrement-1440-light.png') });

    await setFrame(page, 8, 32);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'enqueue');
    await expect(page.getByTestId('current-step-title')).toContainText(/入队|enters the queue/i);
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();

    await setFrame(page, 9, 32);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'dequeue');
    await expect(page.getByTestId('current-step-title')).toContainText(/出队|Dequeue/i);
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();

    await setFrame(page, 31, 32);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expect(page.getByTestId('current-step-title')).toContainText(/拓扑排序完成|Topological sort complete/i);
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();
  });

  test('Kosaraju: first pass, transpose, second pass and component completion stay readable', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'scc', 60);
    await expect(page.locator('[data-testid="scc-stage"]')).toBeVisible({ timeout: 60_000 });

    await setFrame(page, 14, 60);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'finish');
    await expect(page.getByTestId('current-step-title')).toContainText(/完成|finishes/i);
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();

    await setFrame(page, 26, 60);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'reverse');
    await expect(page.getByTestId('current-step-title')).toContainText(/转置图|transpose/i);
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();

    await setFrame(page, 27, 60);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'start-second');
    await expect(page.getByTestId('current-step-title')).toContainText(/第二遍 DFS|Second DFS pass/i);
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();
    await page.screenshot({ path: resolve(SHOT_DIR, 'kosaraju-second-1440-light.png') });

    await setFrame(page, 59, 60);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expect(page.getByTestId('current-step-title')).toContainText(/SCC 划分完成|SCC partition complete/i);
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();
  });

  test('BST: search comparison and result use real tree fields; 390px stays readable', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'bst', 8, 'tree');
    await expect(page.locator('[data-testid="bst-visual"]')).toBeVisible({ timeout: 60_000 });

    await setFrame(page, 5, 8);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'compare');
    await expect(page.getByTestId('current-step-title')).toContainText(/比较|Compare/i);
    await expect(page.getByTestId('current-step-message')).toContainText(/40|b5/);

    await setFrame(page, 7, 8);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'done');
    await expect(page.getByTestId('current-step-title')).toContainText(/BST 操作完成|BST operation complete/i);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-find-1440-light.png') });

    await page.setViewportSize({ width: 390, height: 844 });
    await setFrame(page, 5, 8);
    await expect(page.getByTestId('current-step')).toBeVisible();
    await expect(page.getByTestId('current-step-title')).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'bst-compare-390-light.png'), fullPage: true });
  });

  test('Dijkstra English/Dark: key state and current operation localise without losing the frame', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'dijkstra', 46);

    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.getByTestId('current-step-title')).toContainText(/Initialise weighted graph|Relax/i);
    await setFrame(page, 27, 46);
    await expect(page.getByTestId('current-step-title')).toContainText(/Relax/i);
    await expect(page.getByTestId('current-step-message')).toContainText(/strictly smaller|distance/i);

    await page.selectOption('#theme-select', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expectNoPageOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'dijkstra-relax-1440-dark-en.png') });
  });
});
