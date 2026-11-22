import { expect, selectAlgorithm, test, type Page } from './fixtures';

async function openApp(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
}

async function assertNoPageOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
}

test.describe('RELEASE-01 — responsive release gate', () => {
  test('representative pages keep 360/390/1440 page width and controls', async ({ page }) => {
    test.setTimeout(300_000);
    const algorithms = ['bubble', 'doubly', 'stack', 'queue', 'inorder', 'bfs', 'dijkstra', 'kmp'];

    for (const viewport of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await openApp(page);
      for (const id of algorithms) {
        await selectAlgorithm(page, id);
        await expect(page.getByTestId('visual-stage')).toBeVisible({ timeout: 60_000 });
        await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 60_000 });
        await assertNoPageOverflow(page);
        await expect(page.getByTestId('next-btn')).toBeVisible();
        const scrub = await page.getByTestId('scrub').boundingBox();
        expect(scrub).not.toBeNull();
        if (scrub) {
          expect(scrub.x).toBeGreaterThanOrEqual(0);
          expect(scrub.x + scrub.width).toBeLessThanOrEqual(viewport.width + 1);
        }
      }
    }
  });
});
