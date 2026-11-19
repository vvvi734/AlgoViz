import { test as base, expect, type Page } from '@playwright/test';
import { useLocalPyodide } from './pyodide-local';

/**
 * Every browser test gets the real Pyodide 0.27.7 distribution from the local
 * npm package. The app's CDN URL is untouched; only the transport is local, so
 * workers, Python execution and Trace stay real even when jsDelivr is blocked.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await useLocalPyodide(page);
    await use(page);
  },
});

export { expect };
export type { Page };

/**
 * UI-03: the code dock is collapsed by default. Tests that need to read or
 * type into Monaco must explicitly open it first; playback must not change.
 */
export async function openCodePanel(page: Page) {
  const toggle = page.getByTestId('code-dock-toggle');
  await expect(toggle).toBeVisible({ timeout: 45_000 });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
}

/**
 * UX-01 adds an expanded guide above the old workspace. Tests that measure the
 * pre-existing first-screen layout fold it first so they keep verifying the
 * two-column workspace and dock rather than the new guide height.
 */
export async function collapseAlgorithmGuide(page: Page) {
  const toggle = page.getByTestId('guide-toggle');
  if ((await toggle.count()) === 0) return;
  await expect(toggle).toBeVisible();
  if ((await toggle.getAttribute('aria-expanded')) === 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('algorithm-guide')).toHaveCount(0);
}

/**
 * UX-02 folds the course step list by default so the rail stays short. Tests
 * that jump by step id open this disclosure first; the jump still uses the same
 * real trace frames and the same playback controller.
 */
export async function openLessonStepNav(page: Page) {
  await expect(page.getByTestId('rail-stage-jumps')).toBeVisible({ timeout: 45_000 });
}

/**
 * CORE-REFINE-01: the advanced disclosure now owns only the C / C++ / Python
 * reference-code viewer. Variables, the call stack and the trace state stay
 * in the always-visible learning rail; open this before reading reference code.
 */
export async function openAdvancedPanels(page: Page) {
  const toggle = page.getByTestId('workspace-tabs-toggle');
  await expect(toggle).toBeVisible({ timeout: 45_000 });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'true');
}

/**
 * UX-03: the directory opens only the current algorithm's chapter/topic. A
 * desktop click must therefore find an algorithm's authored path and expand it
 * first. The mobile select remains a single, real `selectOption` call.
 */
export async function openTextbookChapter(page: Page, chapterId: string) {
  const sidebar = page.getByTestId('sidebar');
  if ((await sidebar.getAttribute('data-collapsed')) === 'true') {
    await page.getByTestId('sidebar-expand').click();
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false');
  }
  const chapter = page.getByTestId(`chapter-${chapterId}`);
  await expect(chapter).toBeVisible();
  if ((await chapter.getAttribute('aria-expanded')) !== 'true') {
    await chapter.click();
  }
  await expect(chapter).toHaveAttribute('aria-expanded', 'true');
}

export async function openTextbookTopic(page: Page, topicId: string) {
  const topic = page.getByTestId(`topic-${topicId}`);
  await expect(topic).toBeVisible();
  // UX-03B: a one-algorithm topic is already a direct entry; there is no
  // disclosure to open. Multi-algorithm topics keep the original contract.
  if ((await topic.getAttribute('data-direct')) === 'true') return;
  if ((await topic.getAttribute('aria-expanded')) !== 'true') {
    await topic.click();
  }
  await expect(topic).toHaveAttribute('aria-expanded', 'true');
}

/** Choose a real registry algorithm through the current textbook directory. */
export async function selectAlgorithm(page: Page, id: string) {
  const mobile = page.getByTestId('mobile-algo-select');
  if (await mobile.isVisible()) {
    await mobile.selectOption(id);
    return;
  }

  const item = page.getByTestId(`algo-${id}`);
  await expect(item).toHaveCount(1);
  const chapterId = await item.getAttribute('data-chapter');
  const topicId = await item.getAttribute('data-topic');
  if (!chapterId || !topicId) throw new Error(`algorithm ${id} is not in the textbook directory`);
  await openTextbookChapter(page, chapterId);
  await openTextbookTopic(page, topicId);
  await expect(item).toBeVisible();
  await item.click();
}
