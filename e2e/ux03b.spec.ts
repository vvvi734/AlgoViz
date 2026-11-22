import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  expect,
  openTextbookChapter,
  selectAlgorithm,
  test,
  type Page,
} from './fixtures';

/**
 * UX-03B acceptance: the textbook outline keeps its chapter order and every
 * registry entry, but one-algorithm topics become direct rows. Multi-algorithm
 * topics remain disclosures. Concepts and planned algorithms stay static.
 */
const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/ux03b/after');
mkdirSync(SHOT_DIR, { recursive: true });

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

test.describe('UX-03B — compact textbook navigation', () => {
  test('collapses every single-algorithm topic and keeps multi-algorithm topics expandable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);

    const bubble = page.getByTestId('topic-bubble-sort');
    await expect(bubble).toHaveAttribute('data-kind', 'algorithm');
    await expect(bubble).toHaveAttribute('data-parent-topic', 'exchange-sort');
    expect(await bubble.getAttribute('data-direct')).toBeNull();
    await expect(bubble).toHaveAttribute('data-has-current', 'true');
    await expect(bubble.locator('.textbook-topic-head')).toHaveCount(0);
    await expect(bubble.getByText('冒泡排序', { exact: true })).toHaveCount(1);
    await expect(bubble.locator('[data-testid^="algo-"]')).toHaveCount(1);
    await expect(page.getByTestId('algo-bubble')).toHaveAttribute('aria-current', 'true');
    await expect(page.getByTestId('topic-exchange-sort')).toHaveAttribute('aria-expanded', 'true');

    // Direct top-level topics still expose exactly one algorithm each; nested
    // subtopics are intentionally not marked data-direct.
    const directTopics = page.locator('.textbook-nav .textbook-topic[data-direct="true"]');
    expect(await directTopics.count()).toBeGreaterThan(0);
    const directCounts = await directTopics.evaluateAll((nodes) =>
      nodes.map((node) => node.querySelectorAll('[data-testid^="algo-"]').length),
    );
    expect(new Set(directCounts)).toEqual(new Set([1]));

    // Multi-algorithm groups keep one disclosure and all their children.
    const groups = page.locator('.textbook-nav .textbook-topic[data-kind="group"]');
    expect(await groups.count()).toBeGreaterThan(0);
    expect(await groups.evaluateAll((nodes) =>
      nodes.every((node) => node.querySelectorAll('.textbook-topic-head').length === 1),
    )).toBe(true);
    await openTextbookChapter(page, 'ch7-graph');
    const shortest = page.getByTestId('topic-shortest-path');
    await expect(shortest).toHaveAttribute('aria-expanded', 'false');
    await shortest.click();
    await expect(shortest).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('algo-dijkstra')).toBeVisible();
    await expect(page.getByTestId('algo-floyd-warshall')).toBeVisible();
    await expect(page.getByTestId('algo-bellman-ford')).toBeVisible();

    // BST and AVL are nested rows under the search-tree group; selecting one
    // reaches the real algorithm page without an intermediate algorithm topic.
    await openTextbookChapter(page, 'ch9-search');
    await page.getByTestId('topic-tree-search').click();
    await expect(page.getByTestId('topic-bst')).toHaveAttribute('data-parent-topic', 'tree-search');
    await expect(page.getByTestId('topic-avl')).toHaveAttribute('data-parent-topic', 'tree-search');
    await expect(page.getByTestId('algo-bst')).toHaveCount(1);
    await expect(page.getByTestId('algo-avl')).toHaveCount(1);
    await selectAlgorithm(page, 'bst');
    await expect(page.getByTestId('lab-title')).toContainText('二叉搜索树');
    await expect(page.getByTestId('algo-bst')).toHaveAttribute('aria-current', 'true');

    // Concept rows open the authored read-only lesson; they are still distinct
    // from algorithm rows and never fake an algorithm target.
    await openTextbookChapter(page, 'ch1-intro');
    const concept = page.getByTestId('topic-intro-concepts');
    await expect(concept).toHaveAttribute('data-kind', 'concept');
    await expect(concept).toHaveAttribute('data-concept-id', 'data-structure-basics');
    await expect(concept).toHaveAttribute('data-category', 'theory');
    await expect(concept).toHaveAttribute('aria-label', /理论专题|Theory topic/i);
    await expect(concept.locator('[data-testid^="algo-"]')).toHaveCount(0);

    await openTextbookChapter(page, 'ch10-sort');
    const merge = page.getByTestId('topic-merge-sort');
    await expect(merge).toHaveAttribute('data-kind', 'algorithm');
    await expect(merge).toHaveAttribute('data-direct', 'true');
    await expect(merge).toContainText('归并排序');
    await expect(merge.locator('button')).toHaveCount(1);
    await expect(page.getByTestId('algo-merge')).toHaveCount(1);

    // KMP is now a real dynamic algorithm, not a planned placeholder.
    await openTextbookChapter(page, 'ch4-string');
    await page.getByTestId('topic-pattern-matching').click();
    await expect(page.getByTestId('topic-pattern-matching')).toHaveAttribute('aria-expanded', 'true');
    const kmp = page.getByTestId('topic-kmp');
    await expect(kmp).toHaveAttribute('data-kind', 'algorithm');
    await expect(kmp).toHaveAttribute('data-parent-topic', 'pattern-matching');
    await expect(kmp.locator('[data-testid="algo-kmp"]')).toHaveCount(1);
    await expect(page.getByTestId('algo-kmp')).toBeVisible();
    await expect(kmp).not.toHaveAttribute('aria-disabled', 'true');

    // The compact tree still contains every registered algorithm exactly once.
    await expect(page.locator('[data-testid^="algo-"]')).toHaveCount(60);
  });

  test('keeps playback and selection intact while folding or reloading the directory', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);

    await page.getByTestId('next-btn').click();
    await page.getByTestId('next-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('3 / 25');

    await page.getByTestId('chapter-ch10-sort').click();
    await expect(page.getByTestId('chapter-ch10-sort')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('progress')).toHaveText('3 / 25');
    await page.getByTestId('chapter-ch10-sort').click();

    await page.getByTestId('sidebar-collapse').click();
    await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');
    await expect(page.getByTestId('progress')).toHaveText('3 / 25');
    await page.getByTestId('sidebar-expand').click();
    await expect(page.getByTestId('progress')).toHaveText('3 / 25');

    // A saved preference with old topic ids remains compatible: chapters and
    // parent groups restore; the nested bst row becomes visible under tree-search.
    await page.evaluate(() => {
      localStorage.setItem(
        'algolens-sidebar',
        JSON.stringify({
          collapsed: false,
          openChapters: ['ch7-graph', 'ch9-search'],
          openTopics: ['shortest-path', 'tree-search'],
        }),
      );
    });
    await page.reload();
    await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('chapter-ch7-graph')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('chapter-ch9-search')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('topic-shortest-path')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('topic-tree-search')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('topic-bst')).toHaveAttribute('data-parent-topic', 'tree-search');
    await expect(page.getByTestId('algo-bst')).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test('captures 1440 desktop before/after and 390 mobile navigation evidence', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'desktop-1440x900-light.png') });
    await page.getByTestId('sidebar').screenshot({
      path: resolve(SHOT_DIR, 'sidebar-1440x900-light.png'),
    });

    await openTextbookChapter(page, 'ch7-graph');
    await page.getByTestId('topic-shortest-path').click();
    await page.waitForTimeout(250);
    await page.getByTestId('sidebar').screenshot({
      path: resolve(SHOT_DIR, 'graph-groups-1440x900-light.png'),
    });

    // Bilingual status labels remain explicit in the compact tree.
    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('sidebar')).toContainText('Textbook directory');
    await expect(page.getByTestId('topic-shortest-path')).toContainText('Shortest paths');
    await expect(page.getByTestId('topic-graph-basics')).toContainText(/Graph definition and terminology/i);
    await expect(page.getByTestId('topic-shortest-path')).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('topic-graph-basics')).toContainText('图的定义和术语');
    await expect(page.getByTestId('topic-graph-basics')).toHaveAttribute('aria-label', /理论专题/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    await expect(page.locator('.lab-sidebar-wrap')).toBeHidden();
    await expect(page.getByTestId('mobile-algo-select')).toBeVisible();
    await expect(page.getByTestId('mobile-algo-select')).toHaveValue('bubble');
    await expectNoPageOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'mobile-390-light.png'), fullPage: true });

    // Mobile selection opens the existing lesson directly; the compact tree
    // does not add an intermediate topic step on phones either.
    await page.getByTestId('mobile-algo-select').selectOption('dijkstra');
    await expect(page.getByTestId('lab-title')).toContainText('Dijkstra');
    await expectNoPageOverflow(page);
  });
});
