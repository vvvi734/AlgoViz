import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from './fixtures';

const ARTIFACTS = resolve(process.cwd(), 'test-results/topbar-github');
mkdirSync(ARTIFACTS, { recursive: true });

/**
 * TOPBAR-GITHUB-01 — the local-first badge is gone and the public repo is
 * reachable from one labelled, keyboard-focusable GitHub icon.
 */
test('top bar drops LOCAL FIRST and exposes the GitHub repository link', async ({ page }) => {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('brand-name')).toBeVisible();

  await expect(page.getByTestId('offline-badge')).toHaveCount(0);
  expect(await page.locator('text=LOCAL FIRST').count()).toBe(0);

  const link = page.getByTestId('github-link');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://github.com/vvvi734/AlgoViz');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAccessibleName('GitHub 仓库');
  await expect(link.locator('svg')).toBeVisible();

  const box = await link.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(40);
  expect(box!.height).toBeGreaterThanOrEqual(40);
  await page.screenshot({ path: resolve(ARTIFACTS, 'topbar-1280x900.png') });

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileBox = await link.boundingBox();
  expect(mobileBox).not.toBeNull();
  expect(mobileBox!.width).toBeGreaterThanOrEqual(44);
  expect(mobileBox!.height).toBeGreaterThanOrEqual(44);
  expect(mobileBox!.x).toBeGreaterThanOrEqual(0);
  expect(mobileBox!.x + mobileBox!.width).toBeLessThanOrEqual(391);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(391);
  await page.screenshot({ path: resolve(ARTIFACTS, 'topbar-390x844.png') });
});

test('GitHub link label follows the English interface', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('algolens-lang', 'en'));
  await page.goto('/?view=lab');
  await expect(page.getByTestId('brand-name')).toBeVisible();
  await expect(page.getByTestId('github-link')).toHaveAccessibleName('GitHub repository');
  expect(await page.getByTestId('github-link').innerText()).toBe('');
});
