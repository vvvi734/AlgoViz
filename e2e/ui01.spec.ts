import { expect, test, type Page } from './fixtures';

/**
 * UI-01 — grouped, collapsible algorithm directory.
 *
 * These are real-browser tests: the grouping is derived from the generated
 * registry, so the assertions read section headers from the DOM instead of
 * assuming a fixed list in the test.
 */

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId('progress')).toContainText('/');
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('UI-01 — collapsible grouped directory', () => {
  test('folds and reopens one section without closing the others', async ({ page }) => {
    await openApp(page);

    const sort = page.getByTestId('group-sort');
    const search = page.getByTestId('group-search');
    await expect(sort).toHaveAttribute('aria-expanded', 'true');

    await sort.click();
    await expect(sort).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#alg-group-sort')).toHaveAttribute('data-open', 'false');
    await expect(page.getByTestId('algo-bubble')).toBeHidden();

    // A second section stays open: several sections may be expanded at once.
    await expect(search).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('group-graph')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#alg-group-search')).toHaveAttribute('data-open', 'true');
    await expect(page.locator('#alg-group-graph')).toHaveAttribute('data-open', 'true');

    await sort.click();
    await expect(sort).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('algo-bubble')).toBeVisible();
  });

  test('collapses the whole directory to a rail and keeps the playhead', async ({ page }) => {
    await openApp(page);

    const total = (await page.getByTestId('progress').textContent())?.split('/')[1]?.trim();
    expect(total).toBeTruthy();
    await page.getByTestId('next-btn').click();
    const progressBefore = await page.getByTestId('progress').textContent();
    expect(progressBefore).toContain('2 /');

    const widthBefore = (await page.locator('.lab-main').boundingBox())?.width ?? 0;

    await page.getByTestId('sidebar-collapse').click();
    await expect(page.locator('.lab-shell')).toHaveClass(/nav-collapsed/);
    await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');
    await expect(page.getByTestId('sidebar-expand')).toBeVisible();
    await expect(page.getByTestId('sidebar-collapse')).toHaveCount(0);
    // Wait for the 220px → 64px column transition before measuring.
    await page.waitForTimeout(320);

    // The main learning area takes the freed space.
    const widthAfter = (await page.locator('.lab-main').boundingBox())?.width ?? 0;
    expect(widthAfter).toBeGreaterThan(widthBefore + 100);
    // Playback state is untouched by a pure layout change.
    await expect(page.getByTestId('progress')).toHaveText(progressBefore ?? '');

    await page.getByTestId('sidebar-expand').click();
    await expect(page.locator('.lab-shell')).not.toHaveClass(/nav-collapsed/);
    await expect(page.getByTestId('sidebar-collapse')).toBeVisible();
    await expect(page.getByTestId('progress')).toHaveText(progressBefore ?? '');
  });

  test('keeps selection visible, keyboard operable, and survives reload', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId('algo-bubble')).toHaveAttribute('aria-current', 'true');

    // Keyboard: native buttons respond to Enter and Space.
    await page.getByTestId('group-sort').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('group-sort')).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Space');
    await expect(page.getByTestId('group-sort')).toHaveAttribute('aria-expanded', 'true');

    await page.getByTestId('algo-insertion').click();
    await expect(page.getByTestId('algo-insertion')).toHaveAttribute('aria-current', 'true');
    await expect(page.getByTestId('algo-bubble')).not.toHaveAttribute('aria-current', 'true');
    await expect(page.getByTestId('lab-title')).toHaveText('插入排序');

    await page.getByTestId('sidebar-collapse').click();
    await expect(page.locator('.lab-shell')).toHaveClass(/nav-collapsed/);
    await page.reload();
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('.lab-shell')).toHaveClass(/nav-collapsed/);
    await expect(page.getByTestId('sidebar-expand')).toBeVisible();
  });

  test('keeps 1440px tidy without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await expectNoPageOverflow(page);
    await page.getByTestId('sidebar-collapse').click();
    await page.waitForTimeout(320);
    await expectNoPageOverflow(page);
  });

  test('keeps the existing selector on a 390px phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);

    await expect(page.locator('.lab-sidebar-wrap')).toBeHidden();
    const mobile = page.getByTestId('mobile-algo-select');
    await expect(mobile).toBeVisible();
    await mobile.selectOption('insertion');
    await expect(page.getByTestId('lab-title')).toHaveText('插入排序');
    await expectNoPageOverflow(page);
  });
});
