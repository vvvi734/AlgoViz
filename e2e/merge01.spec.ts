import { expect, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * MERGE-01 integration contract.
 *
 * UI-01 owns only sidebar presentation state; Stage 7F owns only the Dijkstra
 * trace/render state. This test is intentionally separate from both feature
 * suites: it proves they coexist in one page and one playback controller.
 */
const SHOT_DIR = resolve(process.cwd(), 'docs/merge01');
mkdirSync(SHOT_DIR, { recursive: true });

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId('progress')).toContainText('/');
}

async function setFrame(page: Page, frame: number, total: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`);
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('MERGE-01 — grouped collapsible directory + real Dijkstra', () => {
  test('discovers Dijkstra in the graph group and keeps its playhead through sidebar layout changes', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await page.selectOption('[data-testid="theme-select"]', 'light');

    // The directory is generated from the catalogue, so Dijkstra must be a
    // member of the graph group without any MERGE-01-specific hardcoding.
    const graphGroup = page.locator('#alg-group-graph');
    await expect(graphGroup).toHaveAttribute('data-open', 'true');
    await expect(graphGroup.getByTestId('algo-dijkstra')).toBeVisible();
    await expect(page.getByTestId('group-graph')).toHaveAttribute('data-has-current', 'false');

    await page.getByTestId('algo-dijkstra').click();
    await expect(page.getByTestId('graph-visual')).toHaveAttribute('data-algorithm', 'dijkstra', { timeout: 60_000 });
    await expect(page.getByTestId('progress')).toHaveText('1 / 46', { timeout: 60_000 });
    await expect(page.getByTestId('group-graph')).toHaveAttribute('data-has-current', 'true');

    // A real relaxation frame: F 6→4, previous C→E, and three heap entries.
    await setFrame(page, 27, 46);
    await expect(page.getByTestId('graph-visual')).toHaveAttribute('data-operation', 'relax');
    await expect(page.getByTestId('dijkstra-relax-old')).toHaveText('6');
    await expect(page.getByTestId('dijkstra-relax-new')).toHaveText('4');
    await expect(page.getByTestId('dijkstra-relax-strip')).toContainText('C → E');
    await expect(page.locator('[data-testid="dijkstra-distance-row"][data-node-id="F"]')).toHaveAttribute('data-distance', '4');
    await expect(page.getByTestId('graph-pq-entry')).toHaveCount(3);

    const progressBefore = await page.getByTestId('progress').textContent();
    expect(progressBefore).toBe('28 / 46');

    // Collapsing the whole directory is presentation-only. It must not remount
    // the lab, reset Dijkstra, or move the playhead.
    await page.getByTestId('sidebar-collapse').click();
    await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');
    await page.waitForTimeout(350);
    await expect(page.getByTestId('progress')).toHaveText('28 / 46');
    await expect(page.getByTestId('graph-visual')).toHaveAttribute('data-algorithm', 'dijkstra');
    await expect(page.getByTestId('dijkstra-distance-table')).toBeVisible();
    await expect(page.getByTestId('graph-priority-queue-panel')).toBeVisible();

    // Re-opening restores the directory without moving the playhead.
    await page.getByTestId('sidebar-expand').click();
    await expect(page.getByTestId('group-graph')).toHaveAttribute('data-has-current', 'true');
    await expect(page.locator('#alg-group-graph')).toHaveAttribute('data-open', 'true');
    await page.waitForTimeout(350);
    await expect(page.getByTestId('progress')).toHaveText('28 / 46');
    await expect(page.getByTestId('algo-dijkstra')).toHaveAttribute('aria-current', 'true');

    // Folding the containing group is also presentation-only, then restore it.
    await page.getByTestId('group-graph').click();
    await expect(page.getByTestId('group-graph')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('algo-dijkstra')).toBeHidden();
    await page.waitForTimeout(200);
    await expect(page.getByTestId('progress')).toHaveText('28 / 46');
    await page.getByTestId('group-graph').click();
    await expect(page.getByTestId('group-graph')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('algo-dijkstra')).toBeVisible();
    await expect(page.getByTestId('progress')).toHaveText('28 / 46');

    await expectNoPageOverflow(page);
    await page.screenshot({
      path: resolve(SHOT_DIR, 'expanded-dijkstra-1440-light.png'),
      fullPage: true,
    });
  });

  test('keeps Dijkstra playback stable when the directory is narrowed and reopened', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await page.selectOption('[data-testid="theme-select"]', 'dark');

    await page.getByTestId('algo-dijkstra').click();
    await expect(page.getByTestId('progress')).toHaveText('1 / 46', { timeout: 60_000 });

    // Advance via the real timeline, then collapse twice; the progress must not
    // be reset by the 220px → 64px layout transition.
    await page.getByTestId('next-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('2 / 46');
    await page.getByTestId('sidebar-collapse').click();
    await page.waitForTimeout(350);
    await expect(page.getByTestId('progress')).toHaveText('2 / 46');
    await page.getByTestId('sidebar-expand').click();
    await page.waitForTimeout(350);
    await expect(page.getByTestId('progress')).toHaveText('2 / 46');
    await expect(page.getByTestId('graph-node')).toHaveCount(7);
    await expect(page.getByTestId('dijkstra-distance-row')).toHaveCount(7);
  });
});
