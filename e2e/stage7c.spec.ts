import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/stage7c/after');
mkdirSync(SHOT_DIR, { recursive: true });

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
}

async function selectAlgo(page: Page, id: string) {
  await chooseAlgorithm(page, id);
}

async function setFrame(page: Page, frame: number, total = 22) {
  await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`${frame + 1} / ${total}`);
}

async function nodeValues(page: Page, testId = 'linked-node'): Promise<string[]> {
  return page.locator(`[data-testid="${testId}"]`).evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-value') ?? ''),
  );
}

async function nodeIds(page: Page, testId = 'linked-node'): Promise<string[]> {
  return page.locator(`[data-testid="${testId}"]`).evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-node-id') ?? ''),
  );
}

async function edgePairs(page: Page): Promise<Array<[string, string]>> {
  return page.locator('[data-testid="linked-edge"]').evaluateAll((edges) =>
    edges.map((edge) => [edge.getAttribute('data-from-id') ?? '', edge.getAttribute('data-to-id') ?? ''] as [string, string]),
  );
}

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

async function captureStates(
  page: Page,
  prefix: string,
  states: Array<{ name: string; frame: number; assert?: () => Promise<void> }>,
) {
  for (const theme of ['light', 'dark'] as const) {
    await page.selectOption('[data-testid="theme-select"]', theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await expectNoPageOverflow(page);
      for (const state of states) {
        await setFrame(page, state.frame);
        await state.assert?.();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: resolve(SHOT_DIR, `${prefix}-${state.name}-${viewport.width}-${theme}.png`),
          fullPage: viewport.width === 390,
        });
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

test.describe('Stage 7C — real singly linked-list visualization', () => {
  test('builds 3 -> 8 -> 5 and shows create, set-next and predecessor insertion', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'linked');
    await expect(page.locator('[data-testid="linked-visual"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 22', { timeout: 60_000 });
    await expect(page.locator('[data-testid="linked-empty"]')).toContainText('HEAD');
    expect(await nodeIds(page)).toEqual([]);

    await setFrame(page, 8);
    expect(await nodeIds(page)).toEqual(['n3', 'n2', 'n1']);
    expect(await nodeValues(page)).toEqual(['3', '8', '5']);
    expect(await edgePairs(page)).toEqual([['n3', 'n2'], ['n2', 'n1']]);
    await expect(page.locator('[data-testid="linked-head"]')).toHaveAttribute('data-node-id', 'n3');
    await expect(page.locator('[data-testid="linked-null"]')).toHaveText('NULL');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'insert');

    await setFrame(page, 10);
    expect(await nodeIds(page)).toEqual(['n3', 'n2', 'n1']);
    expect(await nodeIds(page, 'linked-detached-node')).toEqual(['n4']);
    await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveAttribute('data-status', 'temporary');
    await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveAttribute('data-next-id', 'null');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'create');

    await setFrame(page, 11);
    expect(await nodeIds(page)).toEqual(['n3', 'n2', 'n1']);
    await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveAttribute('data-next-id', 'n2');
    await expect(page.locator('[data-testid="linked-change"]')).toHaveAttribute('data-node-id', 'n4');
    await expect(page.locator('[data-testid="linked-change"]')).toHaveAttribute('data-after-next-id', 'n2');

    await setFrame(page, 12);
    expect(await nodeIds(page)).toEqual(['n3', 'n4', 'n2', 'n1']);
    expect(await nodeValues(page)).toEqual(['3', '6', '8', '5']);
    expect(await edgePairs(page)).toEqual([
      ['n3', 'n4'],
      ['n4', 'n2'],
      ['n2', 'n1'],
    ]);
    await expect(page.locator('[data-testid="linked-change"]')).toHaveAttribute('data-node-id', 'n3');
    await expect(page.locator('[data-testid="linked-change"]')).toHaveAttribute('data-before-next-id', 'n2');
    await expect(page.locator('[data-testid="linked-change"]')).toHaveAttribute('data-after-next-id', 'n4');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'insert');
  });

  test('bypasses the deleted node, clears its next and restores state on scrub back', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'linked');
    await expect(page.locator('[data-testid="linked-visual"]')).toBeVisible({ timeout: 60_000 });
    await setFrame(page, 15);
    expect(await nodeIds(page)).toEqual(['n3', 'n4', 'n2', 'n1']);
    expect(await nodeValues(page)).toEqual(['3', '6', '8', '5']);
    await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveCount(0);

    await setFrame(page, 16);
    expect(await nodeIds(page)).toEqual(['n3', 'n4', 'n1']);
    expect(await nodeValues(page)).toEqual(['3', '6', '5']);
    expect(await edgePairs(page)).toEqual([['n3', 'n4'], ['n4', 'n1']]);
    expect(await nodeIds(page, 'linked-detached-node')).toEqual(['n2']);
    await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveAttribute('data-next-id', 'n1');
    await expect(page.locator('[data-testid="linked-change"]')).toHaveAttribute('data-node-id', 'n4');
    await expect(page.locator('[data-testid="linked-change"]')).toHaveAttribute('data-before-next-id', 'n2');
    await expect(page.locator('[data-testid="linked-change"]')).toHaveAttribute('data-after-next-id', 'n1');

    await setFrame(page, 17);
    expect(await nodeIds(page)).toEqual(['n3', 'n4', 'n1']);
    await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveAttribute('data-next-id', 'null');
    await expect(page.locator('[data-testid="linked-change"]')).toHaveAttribute('data-node-id', 'n2');
    await expect(page.locator('[data-testid="linked-change"]')).toHaveAttribute('data-after-next-id', 'null');

    await setFrame(page, 15);
    expect(await nodeIds(page)).toEqual(['n3', 'n4', 'n2', 'n1']);
    expect(await nodeValues(page)).toEqual(['3', '6', '8', '5']);
    await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveCount(0);
  });

  test('traverses from HEAD to NULL with real variables, line and lesson step', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'linked');
    await expect(page.locator('[data-testid="linked-visual"]')).toBeVisible({ timeout: 60_000 });

    for (const [frame, expected] of [[18, 'n3'], [19, 'n4'], [20, 'n1']] as const) {
      await setFrame(page, frame);
      await expect(page.locator('[data-testid="linked-node"][data-active="true"]')).toHaveAttribute('data-node-id', expected);
      await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'traverse');
      await expect(page.locator('[data-testid="current-step-message"]')).toContainText('访问');
      await expect(page.locator('[data-testid="variables-watch"]')).toContainText(expected);
      await expect(page.locator('.algolens-active-line')).toHaveCount(1);
    }
    await page.getByRole('tab', { name: '变量与调用栈' }).click();
    await expect(page.locator('[data-testid="variables-watch"]')).toBeVisible();
    await page.getByTestId('sync-source-toggle').click();
    await expect(page.locator('[data-testid="code-position"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="code-position"] .codeline.active .lineno')).toHaveText('146');
    await expect(page.locator('.algolens-active-line')).toHaveCount(1);
    await setFrame(page, 21);
    await expect(page.locator('[data-testid="linked-node"][data-active="true"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'done');
  });

  test('keeps equal values distinct and returns to stack/queue without stale linked DOM', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'linked');
    await expect(page.locator('[data-testid="linked-visual"]')).toBeVisible({ timeout: 60_000 });

    await openCodePanel(page);
    await page.fill('#run-input', JSON.stringify([
      ['insert_head', 3],
      ['insert_head', 5],
      ['insert_head', 3],
    ]));
    await page.click('[data-testid="run-btn"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 10', { timeout: 60_000 });
    await setFrame(page, 8, 10);
    expect(await nodeIds(page)).toEqual(['n3', 'n2', 'n1']);
    expect(await nodeValues(page)).toEqual(['3', '5', '3']);
    await expect(page.locator('[data-testid="linked-node"][data-node-id="n1"]')).toHaveAttribute('data-value', '3');
    await expect(page.locator('[data-testid="linked-node"][data-node-id="n3"]')).toHaveAttribute('data-value', '3');
    await expect(page.locator('[data-testid="linked-node"][data-node-id="n1"]')).toHaveAttribute('data-next-id', 'null');
    await expect(page.locator('[data-testid="linked-node"][data-node-id="n3"]')).toHaveAttribute('data-next-id', 'n2');

    await selectAlgo(page, 'stack');
    await expect(page.locator('[data-testid="stack-visual"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="linked-visual"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 7', { timeout: 60_000 });
    await setFrame(page, 4, 7);
    expect(await page.locator('[data-testid="stack-item"]').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-value') ?? ''),
    )).toEqual(['8', '5', '3']);

    await selectAlgo(page, 'queue');
    await expect(page.locator('[data-testid="queue-visual"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 7', { timeout: 60_000 });
    await setFrame(page, 5, 7);
    expect(await page.locator('[data-testid="queue-item"]').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-value') ?? ''),
    )).toEqual(['5', '8']);
  });

  test('1440/1024/390 light/dark screenshots for every linked-list teaching state', async ({ page }) => {
    test.setTimeout(240_000);
    await openApp(page);
    await selectAlgo(page, 'linked');
    await expect(page.locator('[data-testid="linked-visual"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 22', { timeout: 60_000 });

    await captureStates(page, 'linked', [
      { name: 'empty', frame: 0, assert: async () => {
        await expect(page.locator('[data-testid="linked-empty"]')).toContainText('HEAD');
      } },
      { name: 'initial', frame: 8 },
      { name: 'create', frame: 10, assert: async () => {
        await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveAttribute('data-status', 'temporary');
      } },
      { name: 'next-connected', frame: 11, assert: async () => {
        await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveAttribute('data-next-id', 'n2');
      } },
      { name: 'inserted', frame: 12, assert: async () => {
        expect(await nodeIds(page)).toEqual(['n3', 'n4', 'n2', 'n1']);
      } },
      { name: 'delete-before', frame: 15 },
      { name: 'delete-bypass', frame: 16, assert: async () => {
        await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveAttribute('data-next-id', 'n1');
      } },
      { name: 'delete-after', frame: 17, assert: async () => {
        await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveAttribute('data-next-id', 'null');
      } },
      { name: 'traverse', frame: 19, assert: async () => {
        await expect(page.locator('[data-testid="linked-node"][data-active="true"]')).toHaveAttribute('data-node-id', 'n4');
      } },
      { name: 'rollback-restored', frame: 15, assert: async () => {
        await expect(page.locator('[data-testid="linked-detached-node"]')).toHaveCount(0);
      } },
    ]);
  });

  test('1024 and 390 keep the linked canvas readable with no page overflow and reduced motion', async ({ page }) => {
    await openApp(page);
    await selectAlgo(page, 'linked');
    await expect(page.locator('[data-testid="linked-visual"]')).toBeVisible({ timeout: 60_000 });
    await setFrame(page, 12);

    for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await expectNoPageOverflow(page);
      await expect(page.locator('[data-testid="linked-visual"]')).toBeVisible();
      await expect(page.locator('[data-testid="scrub"]')).toBeVisible();
      await expect(page.locator('[data-testid="code-dock"]')).toBeVisible();
      if (viewport.width === 390) {
        await expect(page.locator('[data-testid="linked-scroll-hint"]')).toBeVisible();
      } else {
        await expect(page.locator('[data-testid="linked-scroll-hint"]')).toBeHidden();
      }
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setFrame(page, 16);
    await expect(page.locator('[data-testid="linked-change"]')).toBeVisible();
    await expect(page.locator('[data-testid="linked-detached-node"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-step-message"]')).toContainText('previous.next');
  });
});
