import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, openTextbookChapter, test } from './fixtures';

/**
 * UX-03 directory screenshots. Real Edge against the production build
 * (`vite preview`) with the default JavaScript demo — no mocked layout.
 */
const DIR = resolve(process.cwd(), 'test-results/evidence/ux03/nav');
mkdirSync(DIR, { recursive: true });

test.describe('UX-03 — directory screenshots', () => {
  test('current path, multiple open chapters and the collapsed rail', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await page.selectOption('[data-testid="theme-select"]', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // The default current algorithm is bubble sort: chapter 9 + its topic open.
    await page.getByTestId('chapter-ch10-sort').scrollIntoViewIfNeeded();
    await page.waitForTimeout(260);
    await page.screenshot({ path: resolve(DIR, 'current-path-1440-light.png') });

    // Open chapters 7 and 8 as well; all three stay open simultaneously.
    await openTextbookChapter(page, 'ch7-graph');
    await openTextbookChapter(page, 'ch9-search');
    await expect(page.getByTestId('chapter-ch10-sort')).toHaveAttribute('aria-expanded', 'true');
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.getByTestId('chapter-ch1-intro').scrollIntoViewIfNeeded();
    await page.waitForTimeout(260);
    await page.screenshot({ path: resolve(DIR, 'multi-chapter-1440-light.png') });
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.getByTestId('sidebar-collapse').click();
    await expect(page.locator('.lab-shell')).toHaveClass(/nav-collapsed/);
    await page.waitForTimeout(320);
    await page.selectOption('[data-testid="theme-select"]', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.waitForTimeout(120);
    await page.screenshot({ path: resolve(DIR, 'collapsed-rail-1440-dark.png') });
  });

  test('phone keeps a chapter-grouped selector instead of the directory', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await page.selectOption('[data-testid="theme-select"]', 'light');
    const mobile = page.getByTestId('mobile-algo-select');
    await expect(mobile).toBeVisible();
    await expect(mobile.locator('optgroup')).toHaveCount(13);
    await page.screenshot({ path: resolve(DIR, 'mobile-390-light.png') });
  });
});
