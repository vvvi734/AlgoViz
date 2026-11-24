import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { collapseAlgorithmGuide, expect, openAdvancedPanels, test, type Page } from './fixtures';

/**
 * UX-COLLAPSE-01 — panel-local quick collapse.
 *
 * The shortcuts must stay reachable while reading a long guide or reference
 * sheet, but they are owned by their panel: no fixed viewport button, no
 * cross-panel state changes and no loss of the selected code language.
 */

const ARTIFACTS = resolve(process.cwd(), 'test-results/ux-collapse-01');
mkdirSync(ARTIFACTS, { recursive: true });

async function openLab(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId('algorithm-guide')).toBeVisible({ timeout: 45_000 });
}

async function scrollPanelToMiddle(page: Page, testId: string) {
  await page.getByTestId(testId).evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    window.scrollTo({
      top: Math.max(0, absoluteTop + rect.height * 0.45 - window.innerHeight * 0.45),
      behavior: 'auto',
    });
  });
  await page.waitForTimeout(220);
}

async function shortcutGeometry(page: Page, testId: string) {
  return page.getByTestId(testId).evaluate((node) => {
    const button = node as HTMLElement;
    const rail = button.parentElement as HTMLElement;
    const rect = button.getBoundingClientRect();
    const railStyle = getComputedStyle(rail);
    const topbar = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--topbar-height'),
    ) || 72;
    return {
      position: railStyle.position,
      railPointerEvents: railStyle.pointerEvents,
      buttonPointerEvents: getComputedStyle(button).pointerEvents,
      buttonPosition: getComputedStyle(button).position,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      },
      topbar,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
    };
  });
}

async function focusState(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    const rect = active?.getBoundingClientRect();
    const topbar = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--topbar-height'),
    ) || 72;
    return {
      testId: active?.getAttribute('data-testid') ?? null,
      tag: active?.tagName ?? null,
      top: rect?.top ?? null,
      bottom: rect?.bottom ?? null,
      innerHeight: window.innerHeight,
      topbar,
      scrollY: window.scrollY,
    };
  });
}

async function scrollStability(page: Page) {
  const first = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(180);
  const second = await page.evaluate(() => window.scrollY);
  return { first, second };
}

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

async function pickNonDefaultLanguage(page: Page) {
  const order = ['reference-lang-python', 'reference-lang-cpp'];
  for (const testId of order) {
    const tab = page.getByTestId(testId);
    if (await tab.isEnabled()) {
      await tab.click();
      await expect(page.getByTestId('reference-code-panel')).toHaveAttribute('data-language', testId.endsWith('python') ? 'python' : 'cpp');
      return testId.endsWith('python') ? 'python' : 'cpp';
    }
  }
  throw new Error('No non-default reference language is available');
}

async function copyReferenceSource(page: Page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByTestId('reference-copy').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).not.toBe('');
  return page.evaluate(() => navigator.clipboard.readText());
}

test.describe('UX-COLLAPSE-01 — panel-local shortcuts', () => {
  test('guide shortcut works from the middle, returns focus and leaves the reference panel closed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openLab(page);

    const guideToggle = page.getByTestId('guide-toggle');
    await expect(guideToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(guideToggle).toHaveAttribute('aria-controls', 'algorithm-guide');
    await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'false');
    await expect(page.getByTestId('reference-code-panel')).toHaveCount(0);
    const progress = page.getByTestId('progress');
    const progressBefore = (await progress.count()) > 0 ? await progress.innerText() : null;

    await scrollPanelToMiddle(page, 'algorithm-guide');
    const geometry = await shortcutGeometry(page, 'guide-quick-collapse');
    expect(geometry.position, 'rail is panel-local sticky, never fixed').toBe('sticky');
    expect(geometry.railPointerEvents).toBe('none');
    expect(geometry.buttonPointerEvents).toBe('auto');
    expect(geometry.buttonPosition).not.toBe('fixed');
    expect(geometry.rect.width).toBeGreaterThanOrEqual(112);
    expect(geometry.rect.height).toBeGreaterThanOrEqual(40);
    expect(geometry.rect.right).toBeLessThanOrEqual(geometry.innerWidth + 1);
    expect(geometry.rect.x).toBeGreaterThanOrEqual(0);
    expect(geometry.rect.bottom).toBeLessThanOrEqual(geometry.innerHeight + 1);
    expect(geometry.rect.bottom).toBeGreaterThan(geometry.innerHeight - 32);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.innerWidth + 1);
    await expect(page.getByTestId('guide-quick-collapse')).toHaveAccessibleName('收起导学');
    expect(await page.getByTestId('guide-quick-collapse').getAttribute('aria-expanded')).toBeNull();
    expect(
      await page.getByTestId('guide-quick-collapse').evaluate((node) => node.closest('[data-testid="algorithm-guide"]') !== null),
    ).toBe(true);
    expect(
      await page.getByTestId('guide-quick-collapse').evaluate((node) => node.closest('[data-testid="lab-workbench"]') !== null),
    ).toBe(false);
    await page.screenshot({ path: resolve(ARTIFACTS, 'guide-quick-1280x900.png') });

    await page.getByTestId('guide-quick-collapse').press('Enter');
    await expect(page.getByTestId('algorithm-guide')).toHaveCount(0);
    await expect(guideToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'false');
    if (progressBefore !== null) expect(await progress.innerText()).toBe(progressBefore);

    const focus = await focusState(page);
    expect(focus.testId).toBe('guide-toggle');
    expect(focus.top ?? -1).toBeGreaterThanOrEqual(focus.topbar - 2);
    expect(focus.bottom ?? 0).toBeLessThanOrEqual(focus.innerHeight + 1);
    const stability = await scrollStability(page);
    expect(Math.abs(stability.second - stability.first)).toBeLessThanOrEqual(2);

    await guideToggle.click();
    await expect(page.getByTestId('algorithm-guide')).toBeVisible();
    await expect(page.getByTestId('guide-quick-collapse')).toBeVisible();
  });

  test('reference shortcut collapses and reopens with the same language, readonly Monaco and copy result', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openLab(page);
    await collapseAlgorithmGuide(page);
    await openAdvancedPanels(page);
    await expect(page.getByTestId('reference-code-panel')).toBeVisible();
    await expect(page.locator('[data-testid="reference-code-viewer"] .monaco-editor')).toBeVisible({
      timeout: 20_000,
    });

    const language = await pickNonDefaultLanguage(page);
    const beforeCopy = await copyReferenceSource(page);
    expect(beforeCopy.length).toBeGreaterThan(100);
    await expect(page.getByTestId('reference-code-viewer')).toHaveAttribute('data-readonly', 'true');
    expect(await page.getByTestId('reference-quick-collapse').evaluate((node) => node.closest('[data-testid="reference-code-viewer"]'))).toBeNull();

    const copyBox = await page.getByTestId('reference-copy').boundingBox();
    const languageTabsBox = await page.locator('.reference-language-tabs').boundingBox();
    const quickBox = await page.getByTestId('reference-quick-collapse').boundingBox();
    expect(copyBox).not.toBeNull();
    expect(languageTabsBox).not.toBeNull();
    expect(quickBox).not.toBeNull();
    expect(overlaps(quickBox!, copyBox!)).toBe(false);
    expect(overlaps(quickBox!, languageTabsBox!)).toBe(false);

    await scrollPanelToMiddle(page, 'reference-code-panel');
    const geometry = await shortcutGeometry(page, 'reference-quick-collapse');
    expect(geometry.position, 'rail is panel-local sticky').toBe('sticky');
    expect(geometry.railPointerEvents).toBe('none');
    expect(geometry.buttonPointerEvents).toBe('auto');
    expect(geometry.buttonPosition).not.toBe('fixed');
    expect(geometry.rect.height).toBeGreaterThanOrEqual(40);
    expect(geometry.rect.right).toBeLessThanOrEqual(geometry.innerWidth + 1);
    expect(geometry.rect.bottom).toBeLessThanOrEqual(geometry.innerHeight + 1);
    expect(geometry.rect.bottom).toBeGreaterThan(geometry.innerHeight - 32);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.innerWidth + 1);
    await expect(page.getByTestId('reference-quick-collapse')).toHaveAccessibleName('收起代码');
    await page.screenshot({ path: resolve(ARTIFACTS, 'reference-quick-1280x900.png') });

    await page.getByTestId('reference-quick-collapse').press('Space');
    await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'false');
    await expect(page.getByTestId('workspace-tabs-body')).toBeHidden();
    await expect(page.getByTestId('reference-code-panel')).toHaveCount(0);

    const focus = await focusState(page);
    expect(focus.testId).toBe('workspace-tabs-toggle');
    expect(focus.top ?? -1).toBeGreaterThanOrEqual(focus.topbar - 2);
    expect(focus.bottom ?? 0).toBeLessThanOrEqual(focus.innerHeight + 1);
    const stability = await scrollStability(page);
    expect(Math.abs(stability.second - stability.first)).toBeLessThanOrEqual(2);

    await page.getByTestId('workspace-tabs-toggle').click();
    await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'true');
    await expect(page.getByTestId('reference-code-panel')).toHaveAttribute('data-language', language);
    await expect(page.getByTestId(`reference-lang-${language}`)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="reference-code-viewer"] .monaco-editor')).toBeVisible({
      timeout: 20_000,
    });
    expect(await page.getByTestId('reference-code-viewer').getAttribute('data-readonly')).toBe('true');

    const afterCopy = await copyReferenceSource(page);
    expect(afterCopy).toBe(beforeCopy);
  });

  test('both panels can stay open and each shortcut controls only its own panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openLab(page);
    await openAdvancedPanels(page);
    await expect(page.getByTestId('algorithm-guide')).toBeVisible();
    await expect(page.getByTestId('reference-code-panel')).toBeVisible();
    expect(await page.getByTestId('guide-quick-collapse').count()).toBe(1);
    expect(await page.getByTestId('reference-quick-collapse').count()).toBe(1);

    await scrollPanelToMiddle(page, 'algorithm-guide');
    const guideAction = await shortcutGeometry(page, 'guide-quick-collapse');
    const referenceAction = await shortcutGeometry(page, 'reference-quick-collapse');
    expect(overlaps(guideAction.rect, referenceAction.rect)).toBe(false);
    expect(guideAction.rect.bottom).toBeLessThanOrEqual(guideAction.innerHeight + 1);
    expect(referenceAction.rect.y).toBeGreaterThan(guideAction.innerHeight);

    await page.getByTestId('guide-quick-collapse').click();
    await expect(page.getByTestId('algorithm-guide')).toHaveCount(0);
    await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'true');
    await expect(page.getByTestId('reference-code-panel')).toBeVisible();

    await page.getByTestId('guide-toggle').click();
    await expect(page.getByTestId('algorithm-guide')).toBeVisible();
    await expect(page.getByTestId('reference-code-panel')).toBeVisible();

    await scrollPanelToMiddle(page, 'reference-code-panel');
    const reopenedGuide = await page.getByTestId('guide-quick-collapse').boundingBox();
    const referenceShortcut = await page.getByTestId('reference-quick-collapse').boundingBox();
    expect(reopenedGuide).not.toBeNull();
    expect(referenceShortcut).not.toBeNull();
    expect(overlaps(reopenedGuide!, referenceShortcut!)).toBe(false);
    expect(referenceShortcut!.y).toBeGreaterThan(0);
    expect(referenceShortcut!.y + referenceShortcut!.height).toBeLessThanOrEqual(901);

    await page.getByTestId('reference-quick-collapse').click();
    await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'false');
    await expect(page.getByTestId('reference-code-panel')).toHaveCount(0);
    await expect(page.getByTestId('algorithm-guide')).toBeVisible();
    await expect(page.getByTestId('guide-toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  test('360 / 390 / 768 / 1280 / 1440 keep the shortcuts inside the viewport without page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openLab(page);

    for (const width of [360, 390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: width <= 390 ? 844 : width <= 768 ? 900 : 900 });
      if ((await page.getByTestId('algorithm-guide').count()) === 0) {
        await page.getByTestId('guide-toggle').click();
        await expect(page.getByTestId('algorithm-guide')).toBeVisible();
      }
      await scrollPanelToMiddle(page, 'algorithm-guide');
      const geometry = await shortcutGeometry(page, 'guide-quick-collapse');
      expect(geometry.position, `${width}px guide shortcut is sticky`).toBe('sticky');
      expect(geometry.rect.x, `${width}px guide shortcut left edge`).toBeGreaterThanOrEqual(0);
      expect(geometry.rect.right, `${width}px guide shortcut right edge`).toBeLessThanOrEqual(width + 1);
      expect(geometry.rect.bottom, `${width}px guide shortcut bottom edge`).toBeLessThanOrEqual(geometry.innerHeight + 1);
      expect(geometry.rect.height, `${width}px guide shortcut touch height`).toBeGreaterThanOrEqual(width <= 768 ? 44 : 40);
      expect(geometry.scrollWidth, `${width}px no horizontal page overflow`).toBeLessThanOrEqual(width + 1);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await scrollPanelToMiddle(page, 'algorithm-guide');
    await page.getByTestId('guide-quick-collapse').click();
    await expect(page.getByTestId('algorithm-guide')).toHaveCount(0);
    const focus390 = await focusState(page);
    expect(focus390.testId).toBe('guide-toggle');
    await page.getByTestId('guide-toggle').click();
    await openAdvancedPanels(page);
    await scrollPanelToMiddle(page, 'reference-code-panel');
    const reference390 = await shortcutGeometry(page, 'reference-quick-collapse');
    expect(reference390.rect.x).toBeGreaterThanOrEqual(0);
    expect(reference390.rect.right).toBeLessThanOrEqual(391);
    expect(reference390.rect.bottom).toBeLessThanOrEqual(reference390.innerHeight + 1);
    expect(reference390.rect.height).toBeGreaterThanOrEqual(44);
    expect(reference390.scrollWidth).toBeLessThanOrEqual(391);
    await page.screenshot({ path: resolve(ARTIFACTS, 'reference-quick-390x844.png') });
    await page.getByTestId('reference-quick-collapse').click();
    await expect(page.getByTestId('reference-code-panel')).toHaveCount(0);
    const referenceFocus390 = await focusState(page);
    expect(referenceFocus390.testId).toBe('workspace-tabs-toggle');
  });

  test('English interface exposes both shortcuts in English, with no Chinese residue', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('algolens-lang', 'en'));
    await page.setViewportSize({ width: 1280, height: 900 });
    await openLab(page);
    await expect(page.getByTestId('guide-quick-collapse')).toHaveAccessibleName('Collapse guide');
    expect(await page.getByTestId('guide-quick-collapse').innerText()).not.toContain('收起');
    await openAdvancedPanels(page);
    await expect(page.getByTestId('reference-quick-collapse')).toHaveAccessibleName('Collapse code');
    expect(await page.getByTestId('reference-quick-collapse').innerText()).not.toContain('收起');
  });
});
