import { expect, openAdvancedPanels, openCodePanel, selectAlgorithm, test } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectAccessible(
  page: import('@playwright/test').Page,
  label: string,
  selector?: string,
): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (selector) builder = builder.include(selector);
  const results = await builder.analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
    `${label} accessibility violations`,
  ).toEqual([]);
}

test.describe('FINAL-QA — accessibility smoke checks', () => {
  test('home textbook directory has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 45_000 });
    await expectAccessible(page, 'home');
  });

  test('rich theory page and mobile directory remain readable', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('mobile-algo-select')).toBeVisible({ timeout: 45_000 });
    await page.getByTestId('mobile-algo-select').selectOption('concept:file-comparison');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('concept-diagram')).toBeVisible();
    await expectAccessible(page, 'mobile theory');

    await page.setViewportSize({ width: 1280, height: 900 });
    await expectAccessible(page, 'desktop theory');
  });

  test('algorithm, guided input and read-only reference panel are accessible', async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await openCodePanel(page);
    await selectAlgorithm(page, 'bubble');
    await expect(page.getByTestId('progress')).toHaveText(/^1 \/ 25$/, { timeout: 90_000 });
    await expectAccessible(page, 'algorithm and input');

    await openAdvancedPanels(page);
    await expect(page.getByTestId('reference-code-panel')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('reference-file-name')).toContainText('.c', { timeout: 60_000 });
    await expectAccessible(page, 'reference panel', '[data-testid="reference-code-panel"]');
  });
});
