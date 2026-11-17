import { expect, test } from './fixtures';

/**
 * UI-01 screenshots. Real Edge run against the production build (`vite preview`)
 * with the default JavaScript demo — no mocked layout, no storybook.
 */
const DIR = 'docs/ui01';

test.describe('UI-01 — directory screenshots', () => {
  test('expanded, section-folded and collapsed states at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await page.selectOption('[data-testid="theme-select"]', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.screenshot({ path: `${DIR}/sidebar-expanded-1440-light.png` });

    // Fold two sections that sit in the first screenful, so the screenshot
    // shows both open and folded groups without scrolling the page.
    await page.getByTestId('group-search').click();
    await page.getByTestId('group-ds').click();
    await page.waitForTimeout(260);
    await page.evaluate(() => window.scrollTo(0, 0));
    // Move hover/focus off the just-clicked header so the screenshot shows the
    // resting state rather than a hover pill.
    await page.getByTestId('lab-title').click();
    await page.mouse.move(2, 2);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    // Let the 150ms hover background transition finish.
    await page.waitForTimeout(260);
    await page.screenshot({ path: `${DIR}/sidebar-groups-folded-1440-light.png` });

    await page.getByTestId('sidebar-collapse').click();
    await expect(page.locator('.lab-shell')).toHaveClass(/nav-collapsed/);
    await page.waitForTimeout(320);
    await page.screenshot({ path: `${DIR}/sidebar-collapsed-1440-light.png` });

    await page.selectOption('[data-testid="theme-select"]', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${DIR}/sidebar-collapsed-1440-dark.png` });
  });

  test('phone keeps the selector instead of the directory', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await page.selectOption('[data-testid="theme-select"]', 'light');
    await expect(page.getByTestId('mobile-algo-select')).toBeVisible();
    await page.screenshot({ path: `${DIR}/sidebar-mobile-390-light.png` });
  });
});
