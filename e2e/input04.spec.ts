import { expect, openCodePanel, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

async function waitGenerated(page: Page) {
  await expect(page.getByTestId('run-feedback')).toContainText(/动画已生成|Visualization ready/, {
    timeout: 90_000,
  });
}

async function totalFrames(page: Page): Promise<number> {
  const max = Number(
    await page.locator('[data-testid="scrub"]').evaluate((node) => (node as HTMLInputElement).max),
  );
  return max + 1;
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

async function seekMatching(
  page: Page,
  testId: string,
  attributes: Record<string, string>,
): Promise<number> {
  const visual = page.getByTestId(testId);
  const total = await totalFrames(page);
  for (let index = 0; index < total; index += 1) {
    await setFrame(page, index, total);
    const matches = await visual.evaluate((node, expected) => {
      const element = node as HTMLElement;
      return Object.entries(expected).every(([key, value]) => element.dataset[key] === value);
    }, attributes);
    if (matches) return index;
  }
  throw new Error(`no frame matched ${testId} ${JSON.stringify(attributes)}`);
}

async function seekLast(page: Page) {
  const total = await totalFrames(page);
  await setFrame(page, total - 1, total);
}

async function seekLinkedTraverse(page: Page) {
  const visual = page.getByTestId('linked-visual');
  const total = await totalFrames(page);
  for (let index = 0; index < total; index += 1) {
    await setFrame(page, index, total);
    if ((await visual.getAttribute('data-operation')) !== 'visit') continue;
    if ((await page.getByTestId('linked-node').count()) !== 3) continue;
    if ((await page.getByTestId('linked-change').count()) !== 0) continue;
    const reachable = await page.getByTestId('linked-node').evaluateAll((nodes) =>
      nodes.every((node) => (node as HTMLElement).dataset.reachable === 'true'),
    );
    if (reachable) return;
  }
  throw new Error('no three-node linked traversal frame found');
}

async function openAlgorithm(page: Page, id: string, visualTestId: string) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, id);
  await openCodePanel(page);
  await expect(page.getByTestId('guided-input')).toHaveAttribute('data-algorithm', id);
  await expect(page.getByTestId(visualTestId)).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

async function runCurrent(page: Page) {
  await page.getByTestId('run-btn').click();
  await waitGenerated(page);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

async function resetToOneOperation(page: Page) {
  while ((await page.getByTestId('structure-op-row').count()) > 1) {
    await page.getByTestId('structure-row-remove').last().click();
  }
}

async function setOperation(
  page: Page,
  index: number,
  op: string,
  fields: Partial<Record<'value' | 'index' | 'anchor', string>> = {},
) {
  const row = page.getByTestId('structure-op-row').nth(index);
  await row.getByTestId('structure-op-type').selectOption(op);
  for (const [field, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    await row.getByTestId(`structure-op-${field}`).fill(value);
  }
}

async function addOperation(
  page: Page,
  op: string,
  fields: Partial<Record<'value' | 'index' | 'anchor', string>> = {},
) {
  await page.getByTestId('structure-add').click();
  const index = (await page.getByTestId('structure-op-row').count()) - 1;
  await setOperation(page, index, op, fields);
}

test.describe('INPUT-04 — real structured-sequence traces', () => {
  test('singly, doubly and circular lists execute custom end and middle operations', async ({ page }) => {
    test.setTimeout(300_000);

    await openAlgorithm(page, 'linked', 'linked-visual');
    await resetToOneOperation(page);
    await setOperation(page, 0, 'insert_head', { value: '5' });
    await addOperation(page, 'insert_tail', { value: '8' });
    await addOperation(page, 'insert_after', { anchor: '5', value: '6' });
    await addOperation(page, 'traverse');
    await addOperation(page, 'delete', { value: '6' });
    await addOperation(page, 'delete', { value: '5' });
    await addOperation(page, 'delete', { value: '8' });
    await runCurrent(page);

    await seekLinkedTraverse(page);
    await expect(page.getByTestId('linked-node')).toHaveCount(3);
    await expect(page.getByTestId('linked-node').nth(0)).toHaveAttribute('data-value', '5');
    await expect(page.getByTestId('linked-node').nth(1)).toHaveAttribute('data-value', '6');
    await expect(page.getByTestId('linked-node').nth(2)).toHaveAttribute('data-value', '8');
    await expect(page.getByTestId('linked-edge')).toHaveCount(2);

    await seekLast(page);
    await expect(page.getByTestId('linked-empty')).toBeVisible();
    await expect(page.getByTestId('linked-visual')).toHaveAttribute('data-head-id', '');

    await openAlgorithm(page, 'doubly', 'adv-linked-visual');
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-kind', 'doubly-linked-list');
    await resetToOneOperation(page);
    await setOperation(page, 0, 'insert_head', { value: '3' });
    await addOperation(page, 'insert_tail', { value: '9' });
    await addOperation(page, 'find', { value: '9' });
    await addOperation(page, 'delete_head');
    await addOperation(page, 'delete_tail');
    await runCurrent(page);

    await seekMatching(page, 'adv-linked-visual', { operation: 'found' });
    await expect(page.getByTestId('adv-node')).toHaveCount(2);
    await expect(page.getByTestId('adv-search-result')).toBeVisible();
    await expect(page.getByTestId('adv-node').nth(0).getByTestId('adv-node-next')).toHaveAttribute('data-target-id', 'n2');
    await expect(page.getByTestId('adv-node').nth(1).getByTestId('adv-node-prev')).toHaveAttribute('data-target-id', 'n1');

    await seekLast(page);
    await expect(page.getByTestId('adv-empty')).toBeVisible();

    await openAlgorithm(page, 'circular', 'adv-linked-visual');
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-kind', 'circular-linked-list');
    await resetToOneOperation(page);
    await setOperation(page, 0, 'insert_head', { value: '3' });
    await addOperation(page, 'insert_tail', { value: '9' });
    await addOperation(page, 'traverse_circle');
    await addOperation(page, 'delete_head');
    await addOperation(page, 'delete_tail');
    await addOperation(page, 'traverse_circle');
    await runCurrent(page);

    await seekMatching(page, 'adv-linked-visual', { operation: 'visit' });
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-head-id', 'n1');
    await expect(page.getByTestId('adv-linked-visual')).toHaveAttribute('data-tail-id', 'n2');
    await expect(page.getByTestId('adv-circular-edge')).toHaveCount(1);
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-from-id', 'n2');
    await expect(page.getByTestId('adv-circular-edge')).toHaveAttribute('data-to-id', 'n1');

    await seekLast(page);
    await expect(page.getByTestId('adv-empty')).toBeVisible();
  });

  test('sequential list executes several operations with real shifts and a final inherited state', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'seqlist', 'seqlist-visual');

    await resetToOneOperation(page);
    await page.getByTestId('structure-initial-values').fill('10, 20, 30, 40, 50');
    await setOperation(page, 0, 'insert', { index: '0', value: '5' });
    await addOperation(page, 'delete', { index: '4' });
    await addOperation(page, 'search', { value: '30' });
    await addOperation(page, 'traverse');
    await runCurrent(page);

    await seekMatching(page, 'seqlist-visual', { operation: 'insert', action: 'complete' });
    await expect(page.getByTestId('seqlist-length')).toHaveText('6');
    await expect(page.getByTestId('seqlist-slot-0')).toHaveAttribute('data-value', '5');
    await expect(page.getByTestId('seqlist-slot-5')).toHaveAttribute('data-value', '50');

    await seekMatching(page, 'seqlist-visual', { operation: 'delete', action: 'shift-left' });
    await expect(page.getByTestId('seqlist-slot-4')).toHaveAttribute('data-value', '50');
    await expect(page.getByTestId('seqlist-slot-5')).toHaveAttribute('data-value', '50');

    await seekMatching(page, 'seqlist-visual', { operation: 'search', action: 'complete' });
    await expect(page.getByTestId('seqlist-result')).toBeVisible();
    await expect(page.getByTestId('seqlist-slot-3')).toHaveAttribute('data-focus', 'true');

    await seekLast(page);
    await expect(page.getByTestId('seqlist-length')).toHaveText('5');
    await expect(page.getByTestId('seqlist-slot-0')).toHaveAttribute('data-value', '5');
    await expect(page.getByTestId('seqlist-slot-4')).toHaveAttribute('data-value', '50');
    await expect(page.getByTestId('seqlist-slot-5')).toHaveAttribute('data-occupied', 'false');
  });

  test('stack is LIFO, queue is FIFO, and a random clear scenario runs', async ({ page }) => {
    test.setTimeout(300_000);

    await openAlgorithm(page, 'stack', 'array-stack-visual');
    await resetToOneOperation(page);
    await setOperation(page, 0, 'push', { value: '3' });
    await addOperation(page, 'push', { value: '8' });
    await addOperation(page, 'push', { value: '5' });
    await addOperation(page, 'peek');
    await addOperation(page, 'pop');
    await runCurrent(page);

    await seekMatching(page, 'array-stack-visual', { operation: 'peek' });
    await expect(page.getByTestId('array-stack-slot').nth(2)).toHaveAttribute('data-value', '5');
    await expect(page.getByTestId('array-stack-slot').nth(2)).toHaveAttribute('data-status', 'top');
    await expect(page.getByTestId('array-stack-slot').nth(2)).toHaveClass(/is-peek/);
    await expect(page.getByTestId('array-stack-top')).toHaveText('top = 2');

    await seekMatching(page, 'array-stack-visual', { operation: 'pop' });
    await expect(page.getByTestId('array-stack-leaving')).toContainText('5');
    await expect(page.getByTestId('array-stack-slot').nth(2)).toHaveAttribute('data-status', 'free');
    await expect(page.getByTestId('array-stack-slot').nth(1)).toHaveAttribute('data-value', '8');
    await expect(page.getByTestId('array-stack-slot').nth(1)).toHaveAttribute('data-status', 'top');
    await expect(page.getByTestId('array-stack-top')).toHaveText('top = 1');

    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('clear');
    await runCurrent(page);
    await seekLast(page);
    await expect(page.getByTestId('array-stack-top')).toHaveText('top = -1');
    for (let slot = 0; slot < 4; slot += 1) {
      await expect(page.getByTestId('array-stack-slot').nth(slot)).toHaveAttribute('data-status', 'free');
    }

    await openAlgorithm(page, 'queue', 'circular-queue-visual');
    await resetToOneOperation(page);
    await setOperation(page, 0, 'enqueue', { value: '3' });
    await addOperation(page, 'enqueue', { value: '8' });
    await addOperation(page, 'enqueue', { value: '5' });
    await addOperation(page, 'front');
    await addOperation(page, 'dequeue');
    await runCurrent(page);

    await seekMatching(page, 'circular-queue-visual', { operation: 'front' });
    await expect(page.getByTestId('circular-queue-slot').nth(0)).toHaveAttribute('data-value', '3');
    await expect(page.getByTestId('circular-queue-slot').nth(0)).toHaveAttribute('data-status', 'front');
    await expect(page.getByTestId('circular-queue-slot').nth(0)).toHaveClass(/is-front/);
    await expect(page.getByTestId('circular-front')).toHaveText('front = 0');

    await seekMatching(page, 'circular-queue-visual', { operation: 'dequeue' });
    await expect(page.getByTestId('circular-queue-leaving')).toContainText('3');
    await expect(page.getByTestId('circular-queue-slot').nth(0)).toHaveAttribute('data-status', 'free');
    await expect(page.getByTestId('circular-queue-slot').nth(1)).toHaveAttribute('data-value', '8');
    await expect(page.getByTestId('circular-queue-slot').nth(1)).toHaveAttribute('data-status', 'front');
    await expect(page.getByTestId('circular-front')).toHaveText('front = 1');
  });
});
