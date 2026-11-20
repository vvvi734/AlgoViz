import { expect, openTextbookChapter, openTextbookTopic, test, type Page } from './fixtures';

/**
 * UI-01 regression, upgraded to UX-03.
 *
 * The directory is now chapter → topic → algorithm. These real-browser tests
 * cover folding, the compact rail, keyboard operation, reload persistence,
 * overflow and the 390px selector. Content-specific evidence lives in
 * `ux03.spec.ts`.
 */

async function openApp(page: Page) {
  await page.goto('/?view=lab');
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

test.describe('UI-01/UX-03 — textbook directory', () => {
  test('folds one chapter without closing another', async ({ page }) => {
    await openApp(page);

    const sort = page.getByTestId('chapter-ch9-sort');
    const search = page.getByTestId('chapter-ch8-search');
    await expect(sort).toHaveAttribute('aria-expanded', 'true');
    await expect(search).toHaveAttribute('aria-expanded', 'false');

    await openTextbookChapter(page, 'ch8-search');
    await expect(search).toHaveAttribute('aria-expanded', 'true');
    await expect(sort).toHaveAttribute('aria-expanded', 'true');

    await sort.click();
    await expect(sort).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#chapter-ch9-sort-body')).toHaveAttribute('data-open', 'false');
    await expect(page.getByTestId('algo-bubble')).toBeHidden();

    // The second chapter stays open: several chapters may be expanded at once.
    await expect(search).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#chapter-ch8-search-body')).toHaveAttribute('data-open', 'true');

    await sort.click();
    await expect(sort).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('algo-bubble')).toBeVisible();
  });

  test('collapses the whole directory to a chapter rail and keeps the playhead', async ({ page }) => {
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
    await page.getByTestId('chapter-ch9-sort').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('chapter-ch9-sort')).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Space');
    await expect(page.getByTestId('chapter-ch9-sort')).toHaveAttribute('aria-expanded', 'true');

    await openTextbookTopic(page, 'insertion-sort');
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

  test('keeps a grouped selector on a 390px phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);

    await expect(page.locator('.lab-sidebar-wrap')).toBeHidden();
    const mobile = page.getByTestId('mobile-algo-select');
    await expect(mobile).toBeVisible();
    await expect(mobile.locator('optgroup')).toHaveCount(9);
    await expect(mobile.locator('optgroup').first()).toHaveAttribute('label', '1. 数据结构绪论');
    await mobile.selectOption('insertion');
    await expect(page.getByTestId('lab-title')).toHaveText('插入排序');
    await expectNoPageOverflow(page);
  });
});
