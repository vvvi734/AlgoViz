import { expect, selectAlgorithm, test, type Page } from './fixtures';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOT_DIR = resolve(process.cwd(), 'docs/f2');
mkdirSync(SHOT_DIR, { recursive: true });

async function openHash(page: Page, algorithm: 'hash-chain' | 'hash-probe', total: number) {
  await page.goto('/?view=lab');
  await expect(page.locator('[data-testid="code-dock"]')).toBeVisible({ timeout: 45_000 });
  await selectAlgorithm(page, algorithm);
  const visual = page.locator('[data-testid="hash-visual"]');
  await expect(visual).toBeVisible({ timeout: 90_000 });
  await expect(visual).toHaveAttribute('data-algorithm', algorithm === 'hash-chain' ? 'chaining' : 'probing');
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 90_000 });
  await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'init');
  return visual;
}

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

async function chainState(page: Page) {
  return page.evaluate(() => ({
    buckets: Array.from(document.querySelectorAll('[data-testid="hash-bucket"]')).map((node) => {
      const el = node as HTMLElement;
      return [el.dataset.index, el.dataset.headId, el.dataset.active].join('|');
    }),
    nodes: Array.from(document.querySelectorAll('[data-testid="hash-node"]')).map((node) => {
      const el = node as HTMLElement;
      return [el.dataset.id, el.dataset.key, el.dataset.next, el.dataset.position, el.dataset.status].join('|');
    }),
    removed: document.querySelector('[data-testid="hash-removed"]')?.textContent ?? '',
    hint: document.querySelector('[data-testid="hash-hint"]')?.textContent ?? '',
  }));
}

async function probeState(page: Page) {
  return page.evaluate(() => ({
    slots: Array.from(document.querySelectorAll('[data-testid="hash-slot"]')).map((node) => {
      const el = node as HTMLElement;
      return [el.dataset.index, el.dataset.state, el.dataset.key, el.dataset.id, el.dataset.marks].join('|');
    }),
    path: Array.from(document.querySelectorAll('[data-testid="hash-probe-chip"]')).map((node) => {
      const el = node as HTMLElement;
      return [el.dataset.index, el.dataset.step, el.className.includes('is-current')].join('|');
    }),
    removed: document.querySelector('[data-testid="hash-removed"]')?.textContent ?? '',
    hint: document.querySelector('[data-testid="hash-hint"]')?.textContent ?? '',
  }));
}

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

test.describe('F2 — real Python chaining and linear probing', () => {
  test('chaining: real bucket chains, duplicate, all three delete positions and relinking', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const visual = await openHash(page, 'hash-chain', 60);
    const guide = await ensureGuide(page);
    await expect(guide).toContainText('链地址法');
    await expect(guide).toContainText('装载因子');
    await expect(guide).toContainText('冲突');

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('hash-empty-note')).toBeVisible();
    await expect(page.locator('[data-testid="hash-bucket"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="hash-node"]')).toHaveCount(0);
    await expect(page.getByTestId('hash-count')).toContainText('0 / 7');

    await setFrame(page, 12, 60);
    await expect(visual).toHaveAttribute('data-operation', 'insert');
    await expect(visual).toHaveAttribute('data-key', '15');
    await expect(visual).toHaveAttribute('data-bucket-index', '1');
    await expect(page.getByTestId('hash-formula')).toContainText('15 % 7 = 1');
    await expect(page.getByTestId('hash-conflict')).toContainText('桶 1');
    await expect(page.getByTestId('hash-count')).toContainText('3 / 7');
    await expect(page.getByTestId('hash-load-factor')).toContainText('0.429');
    await expect(page.locator('[data-testid="hash-node"]')).toHaveCount(3);
    const nodes = page.locator('[data-testid="hash-node"]');
    await expect(nodes.nth(0)).toHaveAttribute('data-id', 'n3');
    await expect(nodes.nth(0)).toHaveAttribute('data-key', '15');
    await expect(nodes.nth(0)).toHaveAttribute('data-next', 'n2');
    await expect(nodes.nth(1)).toHaveAttribute('data-id', 'n2');
    await expect(nodes.nth(1)).toHaveAttribute('data-key', '8');
    await expect(nodes.nth(1)).toHaveAttribute('data-next', 'n1');
    await expect(nodes.nth(2)).toHaveAttribute('data-id', 'n1');
    await expect(nodes.nth(2)).toHaveAttribute('data-position', 'tail');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'resolve');
    await expect(page.getByTestId('current-step-message')).toContainText('next');
    await page.screenshot({ path: resolve(SHOT_DIR, 'chain-collision-1440-light.png'), fullPage: true });

    await setFrame(page, 17, 60);
    await expect(visual).toHaveAttribute('data-operation', 'duplicate');
    await expect(visual).toHaveAttribute('data-result', 'duplicate');
    await expect(page.getByTestId('hash-count')).toContainText('3 / 7');
    await expect(page.locator('[data-testid="hash-node"][data-id="n2"]')).toHaveAttribute('data-status', 'duplicate');
    await expect(page.getByTestId('hash-hint')).toContainText('键唯一');

    await setFrame(page, 33, 60);
    await expect(visual).toHaveAttribute('data-operation', 'delete-middle');
    await expect(visual).toHaveAttribute('data-result', 'deleted');
    await expect(page.getByTestId('hash-removed')).toContainText('n2');
    await expect(page.getByTestId('hash-count')).toContainText('2 / 7');
    await expect(page.locator('[data-testid="hash-node"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="hash-node"][data-id="n3"]')).toHaveAttribute('data-next', 'n1');
    await expect(page.locator('[data-testid="hash-node"][data-id="n1"]')).toHaveAttribute('data-position', 'tail');
    await expect(page.getByTestId('hash-hint')).toContainText('前驱');
    await page.screenshot({ path: resolve(SHOT_DIR, 'chain-delete-middle-1440-light.png'), fullPage: true });

    const before = await chainState(page);
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('35 / 60');
    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('34 / 60');
    expect(await chainState(page)).toEqual(before);

    await setFrame(page, 43, 60);
    await expect(visual).toHaveAttribute('data-operation', 'delete-tail');
    await expect(page.getByTestId('hash-removed')).toContainText('n1');
    await expect(page.getByTestId('hash-removed')).toContainText('尾');
    await expect(page.getByTestId('hash-count')).toContainText('1 / 7');
    await expect(page.locator('[data-testid="hash-node"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="hash-node"][data-id="n3"]')).toHaveAttribute('data-next', '');
    await expect(page.getByTestId('hash-hint')).toContainText('NULL');
    await page.screenshot({ path: resolve(SHOT_DIR, 'chain-delete-tail-1440-light.png'), fullPage: true });

    await setFrame(page, 51, 60);
    await expect(visual).toHaveAttribute('data-operation', 'delete-head');
    await expect(page.getByTestId('hash-removed')).toContainText('n3');
    await expect(page.locator('[data-testid="hash-node"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="hash-bucket-empty"]')).toHaveCount(7);

    await setFrame(page, 59, 60);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('hash-count')).toContainText('1 / 7');
    await expect(page.getByTestId('hash-load-factor')).toContainText('0.143');
    await expect(page.locator('[data-testid="hash-node"][data-id="n4"]')).toHaveAttribute('data-key', '22');
    await expect(page.locator('[data-testid="hash-node"][data-id="n4"]')).toHaveAttribute('data-position', 'only');

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await expect(page.getByTestId('hash-bucket')).toHaveCount(7);
  });

  test('probing: tri-state slots, tombstone continuation, wraparound, full table and reuse', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const visual = await openHash(page, 'hash-probe', 182);
    const guide = await ensureGuide(page);
    await expect(guide).toContainText('线性探测');
    await expect(guide).toContainText('DELETED');
    await expect(guide).toContainText('聚集');

    await expect(visual).toHaveAttribute('data-operation', 'init');
    await expect(page.getByTestId('hash-empty-note')).toBeVisible();
    await expect(page.locator('[data-testid="hash-slot"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="hash-slot"][data-state="empty"]')).toHaveCount(7);
    await expect(page.getByTestId('hash-count')).toContainText('0 / 7');

    await setFrame(page, 15, 182);
    await expect(visual).toHaveAttribute('data-operation', 'insert');
    await expect(visual).toHaveAttribute('data-key', '15');
    await expect(visual).toHaveAttribute('data-hash-index', '1');
    await expect(page.getByTestId('hash-formula')).toContainText('15 % 7 = 1');
    await expect(page.locator('[data-testid="hash-probe-chip"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="hash-slot"][data-index="3"]')).toHaveAttribute('data-state', 'occupied');
    await expect(page.locator('[data-testid="hash-slot"][data-index="3"]')).toHaveAttribute('data-key', '15');
    await expect(page.locator('[data-testid="hash-slot"][data-index="3"]')).toHaveAttribute('data-marks', /current/);
    await expect(page.getByTestId('hash-count')).toContainText('3 / 7');
    await expect(page.getByTestId('hash-operation')).toContainText('线性探测：写入槽位');
    await expect(page.getByTestId('current-step-message')).toContainText('槽');
    await expect(page.getByTestId('current-step-message')).not.toContainText('next');
    await page.screenshot({ path: resolve(SHOT_DIR, 'probe-collision-1440-light.png'), fullPage: true });

    await setFrame(page, 41, 182);
    await expect(visual).toHaveAttribute('data-operation', 'found');
    await expect(visual).toHaveAttribute('data-key', '15');
    await expect(visual).toHaveAttribute('data-result', 'found');
    await expect(page.getByTestId('hash-count')).toContainText('2 / 7');
    await expect(page.getByTestId('hash-load-factor')).toContainText('0.286');
    await expect(page.locator('[data-testid="hash-slot"][data-index="2"]')).toHaveAttribute('data-state', 'deleted');
    await expect(page.locator('[data-testid="hash-slot"][data-index="3"]')).toHaveAttribute('data-state', 'occupied');
    await expect(page.locator('[data-testid="hash-slot"][data-index="3"]')).toHaveAttribute('data-key', '15');
    const chips = page.locator('[data-testid="hash-probe-chip"]');
    await expect(chips).toHaveCount(3);
    await expect(chips.nth(0)).toHaveAttribute('data-index', '1');
    await expect(chips.nth(1)).toHaveAttribute('data-index', '2');
    await expect(chips.nth(2)).toHaveAttribute('data-index', '3');
    await expect(page.getByTestId('hash-tombstone-note')).toContainText('DELETED');
    await expect(page.getByTestId('lesson-active-step')).toHaveAttribute('data-step-id', 'result');
    await expect(page.getByTestId('current-step-message')).not.toBeEmpty();
    await page.screenshot({ path: resolve(SHOT_DIR, 'probe-tombstone-1440-light.png'), fullPage: true });

    const before = await probeState(page);
    await page.getByTestId('next-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('43 / 182');
    await page.getByTestId('prev-btn').click();
    await expect(page.locator('[data-testid="progress"]')).toHaveText('42 / 182');
    expect(await probeState(page)).toEqual(before);

    await setFrame(page, 106, 182);
    await expect(visual).toHaveAttribute('data-operation', 'table-full');
    await expect(visual).toHaveAttribute('data-result', 'full');
    await expect(page.getByTestId('hash-result')).toContainText('表满');
    await expect(page.getByTestId('hash-count')).toContainText('7 / 7');
    await expect(page.locator('[data-testid="hash-slot"][data-state="occupied"]')).toHaveCount(7);
    const fullChips = page.locator('[data-testid="hash-probe-chip"]');
    await expect(fullChips).toHaveCount(7);
    for (const [step, index] of ['3', '4', '5', '6', '0', '1', '2'].entries()) {
      await expect(fullChips.nth(step)).toHaveAttribute('data-index', index);
    }
    await expect(page.getByTestId('hash-conflict')).toContainText('冲突');
    await expect(page.getByTestId('hash-hint')).toContainText('不能死循环');
    await page.screenshot({ path: resolve(SHOT_DIR, 'probe-tablefull-1440-light.png'), fullPage: true });

    await setFrame(page, 165, 182);
    await expect(visual).toHaveAttribute('data-operation', 'insert');
    await expect(visual).toHaveAttribute('data-key', '31');
    await expect(visual).toHaveAttribute('data-reused-deleted', 'true');
    await expect(page.locator('[data-testid="hash-slot"][data-index="3"]')).toHaveAttribute('data-marks', /reused/);
    await expect(page.locator('[data-testid="hash-slot"][data-index="3"]')).toHaveAttribute('data-key', '31');
    await expect(page.getByTestId('hash-reuse-note')).toContainText('复用 DELETED 槽 3');
    await expect(page.getByTestId('hash-hint')).toContainText('优先复用');
    await expect(page.getByTestId('hash-count')).toContainText('6 / 7');

    await setFrame(page, 181, 182);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(page.getByTestId('hash-count')).toContainText('7 / 7');
    await expect(page.getByTestId('hash-load-factor')).toContainText('1.000');
    const keys = await page.locator('[data-testid="hash-slot"]').evaluateAll((slots) =>
      slots
        .filter((slot) => (slot as HTMLElement).dataset.state === 'occupied')
        .map((slot) => (slot as HTMLElement).dataset.key)
        .sort((a, b) => Number(a) - Number(b)),
    );
    expect(keys).toEqual(['1', '3', '10', '17', '22', '31', '38']);
    await expect(page.locator('[data-testid="hash-slot"][data-state="occupied"]')).toHaveCount(7);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await expect(page.locator('[data-testid="hash-slot"]')).toHaveCount(7);
  });
});
