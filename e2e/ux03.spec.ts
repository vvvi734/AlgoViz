import { expect, openTextbookChapter, openTextbookTopic, selectAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * UX-03 acceptance — the directory is a textbook outline, not a flat filter.
 *
 * The assertions read the authored chapter order, topic order and each real
 * algorithm's primary placement from the DOM. No test id is invented from a
 * label: chapter/topic/algorithm ids are the stable ids from
 * `domain/algorithms/textbook.ts`.
 */
const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/ux03/evidence');
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

async function setFrame(page: Page, frame: number, total: number) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`);
}

test.describe('UX-03 — textbook navigation', () => {
  test('renders the fixed twelve-chapter order with chapter → topic → algorithm', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);

    const heads = page.locator('.textbook-nav .textbook-chapter-head');
    await expect(heads).toHaveCount(12);
    const chapterIds = await heads.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid')));
    expect(chapterIds).toEqual([
      'chapter-ch1-intro',
      'chapter-ch2-linear',
      'chapter-ch3-stack-queue',
      'chapter-ch4-string',
      'chapter-ch5-array',
      'chapter-ch6-tree',
      'chapter-ch7-graph',
      'chapter-ch8-dynamic-storage',
      'chapter-ch9-search',
      'chapter-ch10-sort',
      'chapter-ch11-external-sort',
      'chapter-ch12-files',
    ]);

    // The current path is the only default expansion: chapter 10, the
    // exchange-sort group, and bubble sort as one nested algorithm row.
    await expect(page.getByTestId('chapter-ch10-sort')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('topic-exchange-sort')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('topic-bubble-sort')).toHaveAttribute('data-parent-topic', 'exchange-sort');
    await expect(page.getByTestId('topic-bubble-sort')).toHaveAttribute('data-kind', 'algorithm');
    expect(await page.getByTestId('topic-bubble-sort').getAttribute('data-direct')).toBeNull();
    await expect(page.getByTestId('topic-bubble-sort').locator('[data-testid="algo-bubble"]')).toHaveCount(1);
    await expect(page.getByTestId('algo-bubble')).toHaveAttribute('aria-current', 'true');
    for (const id of ['ch7-graph', 'ch9-search', 'ch1-intro']) {
      await expect(page.getByTestId(`chapter-${id}`)).toHaveAttribute('aria-expanded', 'false');
    }

    // 60 shipped algorithms, each rendered once with exactly one primary home.
    const algorithms = page.locator('[data-testid^="algo-"]');
    await expect(algorithms).toHaveCount(60);
    const placements = await algorithms.evaluateAll((nodes) =>
      nodes.map((node) => ({
        id: node.getAttribute('data-testid'),
        chapter: node.getAttribute('data-chapter'),
        topic: node.getAttribute('data-topic'),
      })),
    );
    expect(new Set(placements.map((item) => item.id)).size).toBe(60);
    for (const item of placements) {
      expect(item.chapter).toBeTruthy();
      expect(item.topic).toBeTruthy();
    }

    // The graph chapter follows the book: connectivity, MST, DAG, shortest.
    await openTextbookChapter(page, 'ch7-graph');
    await expect(page.getByTestId('chapter-ch7-graph')).toHaveAttribute('data-has-current', 'false');
    const graphTopics = page.locator('#chapter-ch7-graph-body .textbook-topic');
    const topicIds = await graphTopics.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-topic')));
    expect(topicIds).toEqual([
      'graph-basics',
      'graph-storage',
      'graph-traversal',
      'graph-connectivity',
      'mst',
      'dag',
      'shortest-path',
    ]);
    const mstBox = await page.getByTestId('topic-mst').boundingBox();
    const shortestBox = await page.getByTestId('topic-shortest-path').boundingBox();
    expect(mstBox!.y).toBeLessThan(shortestBox!.y);

    // Authored concept topics open the read-only concept lesson; they never
    // masquerade as an algorithm target.
    await expect(page.getByTestId('topic-graph-basics')).toHaveAttribute('data-kind', 'concept');
    await expect(page.getByTestId('topic-graph-basics')).toHaveAttribute('data-concept-id', 'graph-basics');
    await expect(page.getByTestId('topic-graph-basics')).toHaveAttribute('data-category', 'theory');
    await expect(page.getByTestId('topic-graph-basics')).toHaveAttribute('aria-label', /理论专题|Theory topic/i);
    await expect(page.getByTestId('topic-graph-basics').locator('[data-testid^="algo-"]')).toHaveCount(0);

    // BST/AVL belong to 查找, while Huffman is now an authored 树 algorithm.
    await openTextbookChapter(page, 'ch6-tree');
    await expect(page.getByTestId('topic-huffman')).toHaveAttribute('data-kind', 'algorithm');
    await expect(page.getByTestId('topic-huffman')).toHaveAttribute('data-direct', 'true');
    await expect(page.getByTestId('algo-huffman')).toBeVisible();
    await openTextbookChapter(page, 'ch9-search');
    await openTextbookTopic(page, 'bst');
    await openTextbookTopic(page, 'avl');
    await expect(page.getByTestId('algo-bst')).toBeVisible();
    await expect(page.getByTestId('algo-avl')).toBeVisible();
    await expect(page.getByTestId('algo-bst')).toHaveAttribute('data-chapter', 'ch9-search');
    await expect(page.getByTestId('algo-avl')).toHaveAttribute('data-chapter', 'ch9-search');
    await openTextbookTopic(page, 'hash-search');
    await expect(page.getByTestId('algo-hash-chain')).toBeVisible();
    await expect(page.getByTestId('algo-hash-probe')).toBeVisible();
    await expect(page.getByTestId('algo-hash-chain')).toHaveAttribute('data-chapter', 'ch9-search');
    await expect(page.getByTestId('algo-hash-probe')).toHaveAttribute('data-chapter', 'ch9-search');
    await expectNoPageOverflow(page);
  });

  test('marks real extension algorithms without inventing a new chapter', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);

    // Factorial lives in chapter 3, under 3.3 栈与递归的实现.
    await selectAlgorithm(page, 'factorial');
    await expect(page.getByTestId('chapter-ch3-stack-queue')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('topic-recursion-examples')).toHaveAttribute('data-has-current', 'true');
    await expect(page.getByTestId('algo-factorial').locator('.textbook-extension')).toHaveText('扩展');
    await expect(page.getByTestId('algo-factorial')).toHaveAttribute('aria-current', 'true');

    // Bellman-Ford keeps its primary shortest-path home but carries a badge.
    await selectAlgorithm(page, 'bellman-ford');
    await expect(page.getByTestId('topic-shortest-path')).toHaveAttribute('data-has-current', 'true');
    await expect(page.getByTestId('algo-bellman-ford').locator('.textbook-extension')).toHaveText('扩展');

    // Dijkstra and Floyd share that topic; the current dot moves, not the row.
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.getByTestId('topic-shortest-path')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('algo-dijkstra')).toHaveAttribute('aria-current', 'true');
    await expect(page.getByTestId('algo-bellman-ford')).not.toHaveAttribute('aria-current', 'true');
    await expect(page.getByTestId('progress')).toHaveText('1 / 46', { timeout: 60_000 });

    // Playback still belongs to the one global player: pause/step does not
    // rewrite the directory's current path.
    await page.getByTestId('next-btn').click();
    await expect(page.getByTestId('progress')).toHaveText('2 / 46');
    await expect(page.getByTestId('algo-dijkstra')).toHaveAttribute('aria-current', 'true');
  });

  test('opens a chapter from the compact rail and localizes the whole directory', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);

    await page.getByTestId('sidebar-collapse').click();
    await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');
    await expect(page.locator('.rail-chapter')).toHaveCount(12);
    await expect(page.getByTestId('rail-chapter-ch10-sort')).toHaveAttribute('data-has-current', 'true');
    await expect(page.getByTestId('rail-current')).toBeVisible();

    await page.getByTestId('rail-chapter-ch7-graph').click();
    await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
    await expect(page.getByTestId('chapter-ch7-graph')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('progress')).toHaveText('1 / 25');

    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('sidebar')).toContainText('Textbook directory');
    await expect(page.getByTestId('chapter-ch7-graph')).toContainText('Graphs');
    await expect(page.getByTestId('chapter-ch10-sort')).toContainText('Internal sorting');
    await expect(page.getByTestId('topic-graph-basics')).toHaveAttribute('data-category', 'theory');
    await expect(page.getByTestId('topic-graph-basics')).toHaveAttribute('aria-label', /理论专题|Theory topic/i);
    await expect(page.getByTestId('topic-merge-sort')).toContainText('Merge sort');
    await expect(page.getByTestId('topic-bubble-sort')).toContainText(/Bubble sort/i);
    await expect(page.getByTestId('topic-graph-storage')).toContainText('Graph storage structures');
    await expectNoPageOverflow(page);
  });

  test('keeps a 390px chapter-grouped algorithm entry', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);

    await expect(page.locator('.lab-sidebar-wrap')).toBeHidden();
    const mobile = page.getByTestId('mobile-algo-select');
    await expect(mobile).toBeVisible();
    await expect(mobile.locator('optgroup')).toHaveCount(13);
    await expect(mobile.locator('optgroup').nth(6)).toHaveAttribute('label', '7. 图');
    await expect(mobile.locator('optgroup').nth(7)).toHaveAttribute('label', '8. 动态存储管理');
    await mobile.selectOption('dijkstra');
    await expect(page.getByTestId('lab-title')).toContainText('Dijkstra');
    await expectNoPageOverflow(page);
    await page.screenshot({ path: resolve(SHOT_DIR, 'mobile-390-graph-entry-light.png') });
  });

  test('captures real graph path, dark English and rail evidence', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'dijkstra');
    await expect(page.getByTestId('progress')).toHaveText('1 / 46', { timeout: 60_000 });
    await setFrame(page, 27, 46);
    await page.waitForTimeout(300);
    await page.screenshot({ path: resolve(SHOT_DIR, 'graph-dijkstra-frame-1440-light.png') });

    await openTextbookChapter(page, 'ch9-search');
    await openTextbookTopic(page, 'bst');
    await openTextbookTopic(page, 'avl');
    await expect(page.getByTestId('algo-bst')).toBeVisible();
    await expect(page.getByTestId('algo-avl')).toBeVisible();

    // Multi-chapter evidence: 7 and 8 both open with their topic rows visible.
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.getByTestId('chapter-ch1-intro').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: resolve(SHOT_DIR, 'multi-chapter-1440-light.png') });

    // Search-chapter evidence: BST and AVL entries under 查找, with the graph
    // chapter folded so the whole 08 chapter fits without internal scrolling.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByTestId('chapter-ch7-graph').click();
    await expect(page.getByTestId('chapter-ch7-graph')).toHaveAttribute('aria-expanded', 'false');
    await page.getByTestId('chapter-ch9-search').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: resolve(SHOT_DIR, 'search-chapter-1440-light.png') });

    await openTextbookChapter(page, 'ch7-graph');

    await page.selectOption('[data-testid="theme-select"]', 'dark');
    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByTestId('chapter-ch7-graph').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: resolve(SHOT_DIR, 'graph-path-1440-dark-en.png') });

    await page.getByTestId('sidebar-collapse').click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: resolve(SHOT_DIR, 'rail-dijkstra-1440-dark-en.png') });
  });
});
