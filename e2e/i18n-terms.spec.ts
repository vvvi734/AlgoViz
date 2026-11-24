import { mkdirSync } from 'node:fs';
import { expect, test } from './fixtures';

const SHOT_DIR = 'test-results/i18n-terms01';
mkdirSync(SHOT_DIR, { recursive: true });

async function choose(page: import('@playwright/test').Page, id: string) {
  // The select is the same control at every viewport; using its DOM event keeps
  // navigation independent of whether the mobile select is currently visible.
  await page.getByTestId('mobile-algo-select').evaluate((element, value) => {
    const select = element as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, id);
}

async function ensureGuideOpen(page: import('@playwright/test').Page) {
  const toggle = page.getByTestId('guide-toggle');
  await expect(toggle).toBeVisible();
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
}

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow, 'document horizontal overflow').toBeLessThanOrEqual(1);
}

const REQUIRED_PAGES = [
  { id: 'concept:adt', name: 'ADT', type: 'concept' as const },
  { id: 'dijkstra', name: 'Dijkstra', type: 'algorithm' as const },
  { id: 'bfs', name: 'BFS', type: 'algorithm' as const },
  { id: 'dfs', name: 'DFS', type: 'algorithm' as const },
  { id: 'concept:b-tree', name: 'B-tree', type: 'concept' as const },
  { id: 'quick', name: 'Quick Sort', type: 'algorithm' as const },
  { id: 'concept:sparse-matrix', name: 'Sparse Matrix', type: 'concept' as const },
  { id: 'concept:static-tree-table', name: 'Static Tree Table', type: 'concept' as const },
];

test.describe('I18N-TERMS-01 — Chinese terminology and bilingual regression', () => {
  test('renders the reviewed Chinese glosses on the required pages at 390 and 1280', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/?view=lab');
    await expect(page.getByTestId('lab-title')).toBeVisible({ timeout: 45_000 });

    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });

      for (const destination of REQUIRED_PAGES) {
        await choose(page, destination.id);
        const term = page.getByTestId('term-glossary');
        const title = destination.type === 'concept'
          ? page.getByTestId('concept-title')
          : page.getByTestId('lab-title');
        await expect(title).toBeVisible({ timeout: 45_000 });

        if (destination.type === 'algorithm') await ensureGuideOpen(page);
        await expect(term).toBeVisible({ timeout: 45_000 });
        await expectNoHorizontalOverflow(page);
        await page.screenshot({
          path: `${SHOT_DIR}/${width}-${destination.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
          fullPage: true,
        });
      }
    }
  });

  test('home, ADT, Dijkstra, BFS and DFS expose exact reviewed forms', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/');
    await expect(page.getByTestId('concept-title')).toContainText('数据结构');
    await expect(page.getByTestId('term-glossary')).toContainText('数据结构（Data Structure）');

    await choose(page, 'concept:adt');
    await expect(page.getByTestId('concept-title')).toContainText('抽象数据类型（ADT）');
    await expect(page.getByTestId('term-glossary')).toContainText(
      'ADT（Abstract Data Type，抽象数据类型）',
    );
    await expect(page.getByTestId('term-glossary')).toContainText('isEmpty（判空）');

    await choose(page, 'concept:linear-list');
    await expect(page.getByTestId('term-glossary')).toContainText(
      '线性表（Linear List',
    );
    await expect(page.getByTestId('term-glossary')).toContainText(
      'ADT（Abstract Data Type，抽象数据类型）',
    );

    await choose(page, 'concept:sparse-matrix');
    await expect(page.getByTestId('term-glossary')).toContainText(
      'CSR（Compressed Sparse Row，压缩稀疏行）',
    );
    await expect(page.getByTestId('term-glossary')).toContainText('三元组表（Triple Table');

    await choose(page, 'concept:static-tree-table');
    await expect(page.getByTestId('term-glossary')).toContainText(
      'ASL（Average Search Length，平均查找长度）',
    );
    await expect(page.getByTestId('term-glossary')).toContainText(
      'WPL（Weighted Path Length，带权路径长度）',
    );

    await choose(page, 'dijkstra');
    await expect(page.getByTestId('lab-title')).toContainText('Dijkstra（迪杰斯特拉）');
    await ensureGuideOpen(page);
    await expect(page.getByTestId('term-glossary')).toContainText('松弛操作（Relaxation）');
    await expect(page.getByTestId('term-glossary')).toContainText(
      'settled（已确定，最短距离已锁定）',
    );
    await expect(page.getByTestId('term-glossary')).toContainText('dist（Distance');
    await expect(page.getByTestId('term-glossary')).toContainText('previous / predecessor');
    await expect(page.locator('.lab-head .tag.green')).toHaveText('图算法');

    await choose(page, 'bfs');
    await expect(page.getByTestId('lab-title')).toContainText(
      '广度优先搜索（BFS，Breadth-First Search）',
    );
    await ensureGuideOpen(page);
    await expect(page.getByTestId('term-glossary')).toContainText(
      'FIFO（First In First Out，先进先出）',
    );
    await expect(page.getByTestId('term-glossary')).toContainText('discovered（已发现，已入队）');

    await choose(page, 'dfs');
    await expect(page.getByTestId('lab-title')).toContainText(
      '深度优先搜索（DFS，Depth-First Search）',
    );
    await ensureGuideOpen(page);
    await expect(page.getByTestId('term-glossary')).toContainText(
      'LIFO（Last In First Out，后进先出）',
    );
  });

  test('keeps English mode free of Chinese glosses and preserves the original names', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/?view=lab');
    await expect(page.getByTestId('lab-title')).toBeVisible({ timeout: 45_000 });

    await choose(page, 'dijkstra');
    await expect(page.getByTestId('lab-title')).toContainText('Dijkstra');
    await ensureGuideOpen(page);
    await expect(page.getByTestId('term-glossary')).toBeVisible();

    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('lab-title')).toHaveText('Dijkstra shortest path');
    await expect(page.getByTestId('term-glossary')).toHaveCount(0);
    await expect(page.locator('.lab-head .tag.green')).toHaveText('GRAPH');
    await expect(page.getByText('术语说明')).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `${SHOT_DIR}/1280-dijkstra-en.png`, fullPage: true });
  });

  test('holds every required viewport without horizontal overflow', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 45_000 });

    for (const width of [360, 390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await choose(page, 'concept:data-structure-basics');
      await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 45_000 });
      await expectNoHorizontalOverflow(page);
      await page.screenshot({ path: `${SHOT_DIR}/${width}-home.png`, fullPage: true });

      await choose(page, 'dijkstra');
      await expect(page.getByTestId('lab-title')).toBeVisible({ timeout: 45_000 });
      await ensureGuideOpen(page);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({ path: `${SHOT_DIR}/${width}-dijkstra.png`, fullPage: true });

      await choose(page, 'concept:adt');
      await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 45_000 });
      await expectNoHorizontalOverflow(page);
    }
  });

  test('Dijkstra still executes a real trace after the glossary is added', async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto('/?view=lab');
    await expect(page.getByTestId('lab-title')).toBeVisible({ timeout: 45_000 });
    await choose(page, 'dijkstra');
    await ensureGuideOpen(page);
    await expect(page.getByTestId('term-glossary')).toContainText('松弛操作（Relaxation）');
    await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 120_000 });
  });
});
