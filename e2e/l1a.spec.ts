import { expect, selectAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'test-results/evidence/l1a');
mkdirSync(SHOT_DIR, { recursive: true });

async function openApp(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
}

async function setFrame(page: Page, frame: number, total: number) {
  await page.getByTestId('scrub').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`, { timeout: 30_000 });
}

async function nodeIds(page: Page): Promise<string[]> {
  return page.getByTestId('adv-node').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-node-id') ?? ''),
  );
}

async function nodeValues(page: Page): Promise<string[]> {
  return page.getByTestId('adv-node').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-value') ?? ''),
  );
}

async function nextPairs(page: Page): Promise<Array<[string, string]>> {
  return page.getByTestId('adv-next-edge').evaluateAll((edges) =>
    edges.map((edge) => [edge.getAttribute('data-from-id') ?? '', edge.getAttribute('data-to-id') ?? ''] as [string, string]),
  );
}

async function prevPairs(page: Page): Promise<Array<[string, string]>> {
  return page.getByTestId('adv-prev-edge').evaluateAll((edges) =>
    edges.map((edge) => [edge.getAttribute('data-from-id') ?? '', edge.getAttribute('data-to-id') ?? ''] as [string, string]),
  );
}

async function detachedIds(page: Page): Promise<string[]> {
  return page.getByTestId('adv-detached-card').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-node-id') ?? ''),
  );
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: resolve(SHOT_DIR, name), fullPage: true });
}

test.describe('L1A — real doubly and circular linked-list visualization', () => {
  test('doubly keeps prev/next identity through insert, traversal, delete and rollback', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'doubly');
    await expect(page.getByTestId('adv-linked-visual')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('progress')).toHaveText('1 / 89', { timeout: 60_000 });
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-kind', 'doubly-linked-list');
    await expect(page.getByTestId('adv-empty')).toContainText('head = None');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');
    await shot(page, 'doubly-empty-1440-light.png');

    await setFrame(page, 3, 89);
    expect(await nodeIds(page)).toEqual(['n1']);
    expect(await nodeValues(page)).toEqual(['5']);
    await expect(page.getByTestId('adv-head-marker')).toContainText('HEAD · TAIL');
    expect(await nextPairs(page)).toEqual([]);
    expect(await prevPairs(page)).toEqual([]);

    await setFrame(page, 11, 89);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n2']);
    expect(await nodeValues(page)).toEqual(['3', '5', '7']);
    expect(await nextPairs(page)).toEqual([['n3', 'n1'], ['n1', 'n2']]);
    expect(await prevPairs(page)).toEqual([['n1', 'n3'], ['n2', 'n1']]);
    await expect(page.getByTestId('adv-head-marker')).toHaveAttribute('data-node-id', 'n3');
    await expect(page.getByTestId('adv-tail-marker')).toHaveAttribute('data-node-id', 'n2');

    await setFrame(page, 16, 89);
    await expect(page.getByTestId('adv-phase')).toContainText('中间帧');
    await expect(page.getByTestId('adv-linked-change')).toHaveAttribute('data-node-id', 'n2');
    await expect(page.getByTestId('adv-linked-change')).toHaveAttribute('data-field', 'prev');
    expect(await detachedIds(page)).toEqual(['n4']);
    await expect(page.getByTestId('adv-detached-card')).toHaveAttribute('data-prev-id', 'null');
    expect(await prevPairs(page)).toEqual([['n1', 'n3']]);

    await setFrame(page, 18, 89);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n4', 'n2']);
    expect(await nodeValues(page)).toEqual(['3', '5', '6', '7']);
    expect(await nextPairs(page)).toEqual([['n3', 'n1'], ['n1', 'n4'], ['n4', 'n2']]);
    expect(await prevPairs(page)).toEqual([['n1', 'n3'], ['n4', 'n1'], ['n2', 'n4']]);

    await setFrame(page, 22, 89);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n4', 'n2', 'n5']);
    expect(await nodeValues(page)).toEqual(['3', '5', '6', '7', '8']);
    expect(await nextPairs(page)).toEqual([['n3', 'n1'], ['n1', 'n4'], ['n4', 'n2'], ['n2', 'n5']]);
    expect(await prevPairs(page)).toEqual([['n1', 'n3'], ['n4', 'n1'], ['n2', 'n4'], ['n5', 'n2']]);
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-head-id', 'n3');
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-tail-id', 'n5');
    await expect(page.getByTestId('adv-tail-marker')).toHaveAttribute('data-node-id', 'n5');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'insert-tail');
    await shot(page, 'doubly-five-1440-light.png');

    await setFrame(page, 23, 89);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'traverse-forward');
    await expect(page.locator('[data-testid="adv-node"][data-active="true"]')).toHaveAttribute('data-node-id', 'n3');
    await setFrame(page, 27, 89);
    await expect(page.locator('[data-testid="adv-node"][data-active="true"]')).toHaveAttribute('data-node-id', 'n5');

    await setFrame(page, 32, 89);
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'traverse-reverse');
    await expect(page.locator('[data-testid="adv-node"][data-active="true"]')).toHaveAttribute('data-node-id', 'n3');

    await setFrame(page, 35, 89);
    await expect(page.getByTestId('adv-search-result')).toHaveAttribute('data-found', 'true');
    await expect(page.getByTestId('adv-search-result')).toHaveAttribute('data-search-value', '6');
    await expect(page.getByTestId('adv-search-result')).toContainText('n4');
    await setFrame(page, 41, 89);
    await expect(page.getByTestId('adv-search-result')).toHaveAttribute('data-found', 'false');

    await setFrame(page, 45, 89);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n2', 'n5']);
    expect(await detachedIds(page)).toEqual(['n4']);
    expect(await nextPairs(page)).toEqual([['n3', 'n1'], ['n1', 'n2'], ['n2', 'n5']]);
    expect(await prevPairs(page)).toEqual([['n1', 'n3'], ['n5', 'n2']]);
    await expect(page.getByTestId('adv-linked-change')).toHaveAttribute('data-node-id', 'n1');
    await expect(page.getByTestId('adv-linked-change')).toHaveAttribute('data-field', 'next');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'delete-middle');
    await shot(page, 'doubly-delete-middle-1440-light.png');

    await setFrame(page, 49, 89);
    await expect(page.getByTestId('adv-phase')).toContainText('完成帧');
    expect(await detachedIds(page)).toEqual(['n4']);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n2', 'n5']);

    await setFrame(page, 50, 89);
    expect(await nodeIds(page)).toEqual(['n1', 'n2', 'n5']);
    await expect(page.getByTestId('adv-head-marker')).toHaveAttribute('data-node-id', 'n1');
    await expect(page.getByTestId('adv-tail-marker')).toHaveAttribute('data-node-id', 'n5');
    expect(await prevPairs(page)).toEqual([['n2', 'n1'], ['n5', 'n2']]);

    await setFrame(page, 59, 89);
    expect(await nodeIds(page)).toEqual(['n1', 'n2']);
    await setFrame(page, 65, 89);
    expect(await nodeIds(page)).toEqual(['n2']);
    await expect(page.getByTestId('adv-head-marker')).toContainText('HEAD · TAIL');
    await setFrame(page, 70, 89);
    await expect(page.getByTestId('adv-empty')).toContainText('head = None');
    expect(await nodeIds(page)).toEqual([]);
    expect(await detachedIds(page)).toEqual(['n1', 'n2', 'n3', 'n4', 'n5']);

    await setFrame(page, 22, 89);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n4', 'n2', 'n5']);
    await setFrame(page, 45, 89);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n2', 'n5']);
    await setFrame(page, 88, 89);
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('adv-empty')).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await setFrame(page, 22, 89);
    await expectNoPageOverflow(page);
    const scrollAt1440 = await page.locator('.linked-scroller').evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    expect(scrollAt1440.scrollWidth).toBeLessThanOrEqual(scrollAt1440.clientWidth + 1);

    await page.setViewportSize({ width: 1024, height: 768 });
    await expectNoPageOverflow(page);
    const scrollAt1024 = await page.locator('.linked-scroller').evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    expect(scrollAt1024.clientWidth).toBeGreaterThan(600);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoPageOverflow(page);
    await expect(page.getByTestId('adv-linked-visual')).toBeVisible();
    const scrollAt390 = await page.locator('.linked-scroller').evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    expect(scrollAt390.scrollWidth).toBeGreaterThan(scrollAt390.clientWidth);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expectNoPageOverflow(page);
  });

  test('circular keeps the real tail.next return edge, a full lap and empty boundaries', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    await selectAlgorithm(page, 'circular');
    await expect(page.getByTestId('adv-linked-visual')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('progress')).toHaveText('1 / 80', { timeout: 60_000 });
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-kind', 'circular-linked-list');
    await expect(page.getByTestId('adv-empty')).toContainText('head = tail = None');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');

    await setFrame(page, 3, 80);
    expect(await nodeIds(page)).toEqual(['n1']);
    await expect(page.getByTestId('adv-phase')).toContainText('中间帧');
    await expect(page.getByTestId('adv-circular-edge')).toHaveCount(0);
    await expect(page.getByTestId('adv-head-marker')).toContainText('HEAD · TAIL');

    await setFrame(page, 4, 80);
    expect(await nodeIds(page)).toEqual(['n1']);
    expect(await nodeValues(page)).toEqual(['5']);
    await expect(page.getByTestId('adv-circular-edge')).toHaveCount(1);
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-from-id', 'n1');
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-to-id', 'n1');
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-head-id', 'n1');
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-tail-id', 'n1');
    await expect(page.getByTestId('adv-head-marker')).toContainText('HEAD · TAIL');
    await shot(page, 'circular-single-1440-light.png');

    await setFrame(page, 8, 80);
    expect(await nodeIds(page)).toEqual(['n1', 'n2']);
    expect(await nextPairs(page)).toEqual([['n1', 'n2']]);
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-from-id', 'n2');
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-to-id', 'n1');
    await expect(page.getByTestId('adv-tail-marker')).toHaveAttribute('data-node-id', 'n2');

    await setFrame(page, 12, 80);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n2']);
    expect(await nodeValues(page)).toEqual(['3', '5', '7']);
    await expect(page.getByTestId('adv-head-marker')).toHaveAttribute('data-node-id', 'n3');
    await expect(page.getByTestId('adv-tail-marker')).toHaveAttribute('data-node-id', 'n2');

    await setFrame(page, 18, 80);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n4', 'n2']);
    expect(await nodeValues(page)).toEqual(['3', '5', '6', '7']);
    expect(await nextPairs(page)).toEqual([['n3', 'n1'], ['n1', 'n4'], ['n4', 'n2']]);
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-from-id', 'n2');
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-to-id', 'n3');

    await setFrame(page, 22, 80);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n4', 'n2', 'n5']);
    expect(await nodeValues(page)).toEqual(['3', '5', '6', '7', '8']);
    expect(await nextPairs(page)).toEqual([['n3', 'n1'], ['n1', 'n4'], ['n4', 'n2'], ['n2', 'n5']]);
    await expect(page.getByTestId('adv-circular-edge')).toHaveCount(1);
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-from-id', 'n5');
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-to-id', 'n3');
    await expect(page.getByTestId('adv-head-marker')).toHaveAttribute('data-node-id', 'n3');
    await expect(page.getByTestId('adv-tail-marker')).toHaveAttribute('data-node-id', 'n5');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'insert-tail');
    await shot(page, 'circular-five-1440-light.png');

    const walkIds = new Set<string>();
    for (let frame = 23; frame <= 27; frame += 1) {
      await setFrame(page, frame, 80);
      await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'traverse-circle');
      const active = await page.locator('[data-testid="adv-node"][data-active="true"]').getAttribute('data-node-id');
      expect(['n3', 'n1', 'n4', 'n2', 'n5']).toContain(active);
      expect(walkIds.has(active!)).toBe(false);
      walkIds.add(active!);
    }
    expect(walkIds.size).toBe(5);

    await setFrame(page, 31, 80);
    await expect(page.getByTestId('adv-search-result')).toHaveAttribute('data-found', 'true');
    await expect(page.getByTestId('adv-search-result')).toHaveAttribute('data-search-value', '6');
    await expect(page.getByTestId('adv-search-result')).toContainText('n4');
    await setFrame(page, 37, 80);
    await expect(page.getByTestId('adv-search-result')).toHaveAttribute('data-found', 'false');
    await expect(page.getByTestId('adv-search-result')).toContainText('回到起点仍未命中');

    await setFrame(page, 42, 80);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n2', 'n5']);
    expect(await detachedIds(page)).toEqual(['n4']);
    expect(await nextPairs(page)).toEqual([['n3', 'n1'], ['n1', 'n2'], ['n2', 'n5']]);
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-from-id', 'n5');
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-to-id', 'n3');

    await setFrame(page, 44, 80);
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n2', 'n5']);
    await setFrame(page, 45, 80);
    await expect(page.getByTestId('adv-head-marker')).toHaveAttribute('data-node-id', 'n1');
    await expect(page.getByTestId('adv-tail-marker')).toHaveAttribute('data-node-id', 'n5');
    await setFrame(page, 48, 80);
    expect(await nodeIds(page)).toEqual(['n1', 'n2', 'n5']);

    await setFrame(page, 52, 80);
    expect(await nodeIds(page)).toEqual(['n1', 'n2']);
    await setFrame(page, 58, 80);
    expect(await nodeIds(page)).toEqual(['n2']);
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-from-id', 'n2');
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-to-id', 'n2');
    await expect(page.getByTestId('adv-head-marker')).toContainText('HEAD · TAIL');

    await setFrame(page, 62, 80);
    await expect(page.getByTestId('adv-empty')).toContainText('head = tail = None');
    expect(await nodeIds(page)).toEqual([]);
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-tail-id', '');
    await shot(page, 'circular-empty-1440-light.png');

    await setFrame(page, 66, 80);
    expect(await nodeIds(page)).toEqual(['n6']);
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-from-id', 'n6');
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-to-id', 'n6');
    await setFrame(page, 79, 80);
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('adv-empty')).toBeVisible();

    await setFrame(page, 22, 80);
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-from-id', 'n5');
    await setFrame(page, 45, 80);
    await expect(page.getByTestId('adv-tail-marker')).toHaveAttribute('data-node-id', 'n5');
    await setFrame(page, 62, 80);
    expect(await nodeIds(page)).toEqual([]);
  });

  test('both canvases keep Chinese/English and light/dark semantics', async ({ page }) => {
    await openApp(page);
    await selectAlgorithm(page, 'doubly');
    await expect(page.getByTestId('adv-linked-visual')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('progress')).toHaveText('1 / 89', { timeout: 60_000 });
    await setFrame(page, 22, 89);
    const language = page.getByRole('button', { name: 'Switch language' });
    await language.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('adv-phase')).toContainText('Complete frame');
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-node-count', '5');

    await page.getByTestId('theme-select').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByTestId('adv-linked-visual')).toBeVisible();
    expect(await nodeIds(page)).toEqual(['n3', 'n1', 'n4', 'n2', 'n5']);

    await language.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await page.getByTestId('theme-select').selectOption('light');

    await selectAlgorithm(page, 'circular');
    await expect(page.getByTestId('adv-linked-visual')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('progress')).toHaveText('1 / 80', { timeout: 60_000 });
    await setFrame(page, 4, 80);
    await language.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('adv-circular-edge')).toHaveCount(1);
    await expect(page.locator('.linked-legend')).toContainText('return next → HEAD');
    await page.getByTestId('theme-select').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByTestId('adv-circular-edge')).toHaveCount(1);
    await language.click();
    await page.getByTestId('theme-select').selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  });
});
