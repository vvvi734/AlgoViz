import { expect, openAdvancedPanels, openTextbookChapter, selectAlgorithm, test, type Page } from './fixtures';

async function ensureGuide(page: Page) {
  const guide = page.getByTestId('algorithm-guide');
  if ((await guide.count()) === 0) {
    const toggle = page.getByTestId('guide-toggle');
    await expect(toggle).toBeVisible({ timeout: 45_000 });
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  }
  await expect(page.getByTestId('algorithm-guide')).toBeVisible({ timeout: 45_000 });
  return page.getByTestId('algorithm-guide');
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

test.describe('STR-01 — strings concept and real Python KMP', () => {
  test('concept page explains strings and pattern matching without a player', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await openTextbookChapter(page, 'ch4-string');
    await page.getByTestId('topic-string-basics').click();

    await expect(page.getByTestId('concept-page')).toBeVisible();
    await expect(page.getByTestId('concept-title')).toContainText('串的定义与模式匹配基础');
    await expect(page.getByTestId('concept-definition')).toContainText('有限序列');
    await expect(page.getByTestId('concept-definition')).toContainText('空串');
    await expect(page.getByTestId('concept-definition')).toContainText('位置');
    await expect(page.getByTestId('concept-page')).toContainText('朴素匹配');
    await expect(page.getByTestId('concept-page')).toContainText('KMP');
    await expect(page.getByTestId('concept-diagram').locator('svg')).toBeVisible();
    await expect(page.getByTestId('concept-diagram')).toContainText('ABABABC');
    await expect(page.getByTestId('concept-diagram')).toContainText('lps[3] = 2');
    await expect(page.getByTestId('play-btn')).toHaveCount(0);
    await expect(page.getByTestId('step-description')).toHaveCount(0);
    await expect(page.getByTestId('reference-code-panel')).toHaveCount(0);

    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('concept-title')).toContainText('Strings and the foundations of pattern matching');
    await expect(page.getByTestId('concept-page')).toContainText('Naive matching');
    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
  });

  test('KMP: real Python lps build, fallback, two matches and all three reference languages', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/?view=lab');
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await selectAlgorithm(page, 'kmp');

    const visual = page.getByTestId('kmp-visual');
    await expect(visual).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 47', { timeout: 90_000 });
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');
    await expect(visual).toHaveAttribute('data-phase', 'build');
    await expect(visual).toHaveAttribute('data-operation', 'init');

    const guide = await ensureGuide(page);
    await expect(guide).toContainText('KMP');
    await expect(guide).toContainText('lps');
    await expect(guide).toContainText('O(n+m)');
    await expect(guide).toContainText('next');

    await setFrame(page, 1, 47);
    await expect(visual).toHaveAttribute('data-operation', 'build-start');
    await expect(visual).toHaveAttribute('data-lps-ready', '1');
    await expect(page.getByTestId('kmp-i')).toContainText('1');
    await expect(page.getByTestId('kmp-j')).toContainText('0');

    await setFrame(page, 9, 47);
    await expect(visual).toHaveAttribute('data-operation', 'build-fallback');
    await expect(visual).toHaveAttribute('data-fallback-from', '2');
    await expect(visual).toHaveAttribute('data-fallback-to', '0');
    await expect(page.getByTestId('kmp-fallback')).toContainText('j = lps[2 - 1] = 0');
    await expect(page.locator('[data-testid="kmp-pattern-cell"][data-index="2"]')).toHaveAttribute('data-tone', 'fallback');

    await setFrame(page, 12, 47);
    await expect(visual).toHaveAttribute('data-operation', 'build-complete');
    await expect(visual).toHaveAttribute('data-lps-ready', '5');
    await expect(visual).toHaveAttribute('data-lps', '0,0,1,2,0');
    await expect(page.getByTestId('kmp-matches')).toHaveCount(0);

    await setFrame(page, 23, 47);
    await expect(visual).toHaveAttribute('data-phase', 'search');
    await expect(visual).toHaveAttribute('data-operation', 'search-fallback');
    await expect(visual).toHaveAttribute('data-i', '4');
    await expect(visual).toHaveAttribute('data-j', '2');
    await expect(visual).toHaveAttribute('data-alignment', '2');
    await expect(page.getByTestId('kmp-i')).toContainText('4');
    await expect(page.getByTestId('kmp-j')).toContainText('2');
    await expect(page.getByTestId('kmp-fallback')).toContainText('j = lps[4 - 1] = 2');
    await expect(page.getByTestId('kmp-fallback')).toContainText('i = 4');
    await expect(page.getByTestId('kmp-fallback')).toContainText('不回退');
    await expect(page.locator('[data-testid="kmp-text-cell"][data-index="4"]')).toHaveAttribute('data-tone', 'mismatch');
    await expect(page.locator('[data-testid="kmp-search-pattern-cell"][data-index="4"]')).toHaveAttribute('data-tone', 'fallback');

    await setFrame(page, 29, 47);
    await expect(visual).toHaveAttribute('data-operation', 'match-found');
    await expect(page.getByTestId('kmp-match-banner')).toContainText('s = 2');
    await expect(page.getByTestId('kmp-match-chip')).toHaveCount(1);
    await expect(page.locator('[data-testid="kmp-text-cell"][data-index="2"]')).toHaveAttribute('data-tone', 'found');

    await setFrame(page, 45, 47);
    await expect(page.getByTestId('kmp-match-chip')).toHaveCount(2);
    await expect(page.getByTestId('kmp-match-chip').nth(1)).toHaveAttribute('data-start', '9');
    await expect(visual).toHaveAttribute('data-match-count', '2');

    await setFrame(page, 46, 47);
    await expect(visual).toHaveAttribute('data-operation', 'search-done');
    await expect(visual).toHaveAttribute('data-matches', '2,9');
    await expect(page.getByTestId('kmp-match-chip')).toHaveCount(2);
    await expect(page.locator('[data-testid="kmp-text-cell"][data-index="9"]')).toHaveAttribute('data-tone', 'found');
    await expect(page.locator('[data-testid="kmp-text-cell"][data-index="2"]')).toHaveAttribute('data-tone', 'start');

    // Jump backwards: the build phase must not keep the search chips or pointers.
    await setFrame(page, 2, 47);
    await expect(visual).toHaveAttribute('data-phase', 'build');
    await expect(visual).toHaveAttribute('data-operation', 'build-compare');
    await expect(page.getByTestId('kmp-matches')).toHaveCount(0);
    await expect(page.getByTestId('kmp-match-banner')).toHaveCount(0);
    await expect(page.getByTestId('kmp-fallback')).toHaveCount(0);
    await expect(page.getByTestId('kmp-i')).toContainText('1');

    await expectNoPageOverflow(page);

    await openAdvancedPanels(page);
    const panel = page.getByTestId('reference-code-panel');
    await expect(panel).toHaveAttribute('data-algorithm-id', 'kmp');
    await expect(page.getByTestId('reference-lang-c')).toBeVisible();
    await page.getByTestId('reference-lang-c').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('kmp.c');
    await expect(page.getByTestId('reference-code-host')).toBeVisible();
    await expect(page.getByTestId('reference-code-viewer')).toHaveAttribute('data-readonly', 'true');
    await expect(page.getByTestId('reference-copy')).toBeEnabled();

    await page.getByTestId('reference-lang-cpp').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('kmp.cpp');
    await expect(page.getByTestId('reference-copy')).toBeEnabled();
    await page.getByTestId('reference-impl-convenience').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('kmp_find_builtin.cpp');
    await expect(page.getByTestId('reference-source')).toContainText('不保证内部采用 KMP');

    await page.getByTestId('reference-lang-python').click();
    await page.getByTestId('reference-impl-principle').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('kmp.py');
    await expect(page.getByTestId('reference-copy')).toBeEnabled();
    await page.getByTestId('reference-impl-convenience').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('kmp_find_builtin.py');
    await expect(page.getByTestId('reference-source')).toContainText('不保证内部采用 KMP');
  });
});
