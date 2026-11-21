import { expect, test, type Page } from './fixtures';

const MOBILE_SELECT = '[data-testid="mobile-algo-select"]';

async function openPhone(page: Page) {
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
}

async function openConcept(page: Page, conceptId: string) {
  await page.locator(MOBILE_SELECT).selectOption(`concept:${conceptId}`);
  await expect(page.getByTestId('concept-page')).toBeVisible({ timeout: 30_000 });
}

async function openArticulation(page: Page): Promise<number> {
  await page.locator(MOBILE_SELECT).selectOption('articulation');
  await expect(page.getByTestId('ap-stage')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 90_000 });
  const first = await page.getByTestId('progress').textContent();
  return Number(first?.split('/')[1]?.trim());
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

async function removeNodesDownTo(page: Page, count: number) {
  const removes = page.getByTestId('graph-node-remove');
  while ((await removes.count()) > count) {
    const before = await removes.count();
    await removes.last().click();
    await expect(removes).toHaveCount(before - 1);
  }
  await expect(page.getByTestId('graph-node-input')).toHaveCount(count);
}

async function runEditedGraph(page: Page, nodeCount: number): Promise<number> {
  await page.getByTestId('run-btn').click();
  await expect(page.getByTestId('ap-graph-svg')).toHaveAttribute('data-node-count', String(nodeCount), {
    timeout: 90_000,
  });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 90_000 });
  const text = await page.getByTestId('progress').textContent();
  return Number(text?.split('/')[1]?.trim());
}

test.describe('TEXTBOOK-07 — chapter 7 storage, articulation and real Python trace', () => {
  test('four storage pages and the articulation page render authored SVGs', async ({ page }) => {
    test.setTimeout(180_000);
    await openPhone(page);

    await openConcept(page, 'graph-storage');
    await expect(page.getByTestId('concept-title')).toContainText('邻接矩阵');
    await expect(page.getByTestId('concept-diagram')).toContainText('边 B–D');
    await expect(page.getByTestId('concept-diagram')).toContainText('对称位置同时为 1');
    await expect(page.getByTestId('play-btn')).toHaveCount(0);

    await openConcept(page, 'graph-adjacency-list');
    await expect(page.getByTestId('concept-title')).toContainText('邻接表');
    await expect(page.getByTestId('concept-diagram')).toContainText('顶点表');
    await expect(page.getByTestId('concept-diagram')).toContainText('8 个边结点');

    await openConcept(page, 'graph-orthogonal-list');
    await expect(page.getByTestId('concept-title')).toContainText('十字链表');
    await expect(page.getByTestId('concept-diagram')).toContainText('firstin');
    await expect(page.getByTestId('concept-diagram')).toContainText('e2 同时被 A 的 firstout 链和 C 的 firstin 链引用');

    await openConcept(page, 'graph-adjacency-multilist');
    await expect(page.getByTestId('concept-title')).toContainText('邻接多重表');
    await expect(page.getByTestId('concept-diagram')).toContainText('ivex');
    await expect(page.getByTestId('concept-diagram')).toContainText('不是两份记录');

    await openConcept(page, 'graph-storage-comparison');
    await expect(page.getByTestId('concept-title')).toContainText('四种存储结构对比');
    await expect(page.getByTestId('concept-diagram')).toContainText('十字链表');
    await expect(page.getByTestId('concept-diagram')).toContainText('邻接多重表');

    await openConcept(page, 'articulation-basics');
    await expect(page.getByTestId('concept-title')).toContainText('关节点、桥与双连通性');
    await expect(page.getByTestId('concept-diagram')).toContainText('桥 C–D');
    await expect(page.getByTestId('concept-diagram')).toContainText('本身是含 2 个顶点的点双块');
  });

  test('articulation runs a real Python trace, reaches C/D and keeps playback reversible', async ({ page }) => {
    test.setTimeout(300_000);
    await openPhone(page);
    const total = await openArticulation(page);

    await expect(page.getByTestId('ap-graph-svg')).toHaveAttribute('data-node-count', '8');
    await expect(page.getByTestId('ap-graph-svg')).toHaveAttribute('data-edge-count', '8');
    await expect(page.getByTestId('ap-node')).toHaveCount(8);
    await expect(page.getByTestId('ap-edge')).toHaveCount(8);

    await setFrame(page, total - 1, total);
    await expect(page.getByTestId('ap-stage')).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('ap-stage')).toHaveAttribute('data-articulation-count', '2');
    await expect(page.getByTestId('ap-result')).toContainText('C, D');
    await expect(page.getByTestId('ap-result')).toContainText('e4');
    await expect(page.getByTestId('ap-result')).toContainText('e8');
    await expect(page.locator('[data-testid="ap-node"][data-node-id="C"]')).toHaveAttribute('data-cut', 'true');
    await expect(page.locator('[data-testid="ap-node"][data-node-id="D"]')).toHaveAttribute('data-cut', 'true');
    await expect(page.locator('[data-testid="ap-node"][data-node-id="A"]')).toHaveAttribute('data-cut', 'false');
    await expect(page.getByTestId('ap-stack-empty')).toBeVisible();

    await page.click('[data-testid="prev-btn"]');
    await expect(page.getByTestId('progress')).toHaveText(`${total - 1} / ${total}`);
    await expect(page.getByTestId('ap-stage')).toHaveAttribute('data-operation', /finish-node|done/);
    await page.click('[data-testid="next-btn"]');
    await expect(page.getByTestId('ap-stage')).toHaveAttribute('data-operation', 'done');
  });

  test('single-child chain and multi-child star exercise the two root conditions', async ({ page }) => {
    test.setTimeout(360_000);
    await openPhone(page);
    await openArticulation(page);

    // Chain A–B–C: the only DFS child of root A must not be treated as a cut.
    await removeNodesDownTo(page, 3);
    await expect(page.getByTestId('graph-edge-remove')).toHaveCount(3);
    await page.getByTestId('graph-edge-remove').nth(1).click(); // remove A–C, keep A–B and B–C
    await expect(page.getByTestId('graph-edge-remove')).toHaveCount(2);
    const chainTotal = await runEditedGraph(page, 3);
    await setFrame(page, chainTotal - 1, chainTotal);
    await expect(page.getByTestId('ap-stage')).toHaveAttribute('data-articulation-count', '1');
    await expect(page.getByTestId('ap-result')).toContainText('B');
    await expect(page.getByTestId('ap-result')).toContainText('根: A');
    await expect(page.getByTestId('ap-result')).toContainText('根树孩子=1');
    await expect(page.locator('[data-testid="ap-node"][data-node-id="B"]')).toHaveAttribute('data-cut', 'true');
    await expect(page.locator('[data-testid="ap-node"][data-node-id="A"]')).toHaveAttribute('data-cut', 'false');
    await expect(page.getByTestId('ap-result')).toContainText('e1');
    await expect(page.getByTestId('ap-result')).toContainText('e2');

    // Star S–A, S–B, S–C: root S has three DFS children and must become a cut.
    await page.reload();
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await openArticulation(page);
    await removeNodesDownTo(page, 3);
    await page.getByTestId('graph-node-input').nth(0).fill('S');
    await page.getByTestId('graph-node-input').nth(1).fill('A');
    await page.getByTestId('graph-node-input').nth(2).fill('B');
    await page.getByTestId('graph-add-node').click();
    await expect(page.getByTestId('graph-node-input')).toHaveCount(4);
    await page.getByTestId('graph-edge-from').nth(2).selectOption('S');
    await page.getByTestId('graph-edge-to').nth(2).selectOption('C');
    const starTotal = await runEditedGraph(page, 4);
    await setFrame(page, starTotal - 1, starTotal);
    await expect(page.getByTestId('ap-stage')).toHaveAttribute('data-articulation-count', '1');
    await expect(page.getByTestId('ap-result')).toContainText('根: S');
    await expect(page.getByTestId('ap-result')).toContainText('根树孩子=3');
  });
});
