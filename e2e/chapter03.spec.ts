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

async function currentFrame(page: Page): Promise<number> {
  const progress = (await page.getByTestId('progress').textContent()) ?? '0 / 0';
  return Number(progress.split('/')[0].trim()) - 1;
}

async function seekFrame(page: Page, frame: number, total: number) {
  let current = await currentFrame(page);
  if (frame < current || current < 0) {
    await page.locator('[aria-label="Reset"]').click();
    current = 0;
  }
  while (current < frame) {
    await page.getByTestId('next-btn').click();
    current += 1;
  }
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`);
}

async function seekMatching(page: Page, testId: string, operation: string) {
  const total = await totalFrames(page);
  for (let index = 0; index < total; index += 1) {
    await seekFrame(page, index, total);
    const visual = page.getByTestId(testId);
    if ((await visual.getAttribute('data-operation')) === operation) return;
  }
  throw new Error(`no ${testId} frame with operation ${operation}`);
}

async function seekLast(page: Page) {
  const total = await totalFrames(page);
  await seekFrame(page, total - 1, total);
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

async function runCurrent(page: Page) {
  await page.getByTestId('run-btn').click();
  await waitGenerated(page);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

test.describe('CHAPTER-03 — storage variants and expression applications', () => {
  test('linked stack and linked queue render real pointer traces', async ({ page }) => {
    test.setTimeout(300_000);

    await openAlgorithm(page, 'stack', 'array-stack-visual');
    await seekMatching(page, 'array-stack-visual', 'peek');
    await expect(page.getByTestId('array-stack-slot').first()).toHaveAttribute('data-value', '3');
    await page.getByTestId('array-stack-visual').screenshot({
      path: 'test-results/chapter03-array-stack.png',
    });
    await page.getByTestId('structure-storage').selectOption('linked');
    await resetToOneOperation(page);
    await setOperation(page, 0, 'push', { value: '3' });
    await addOperation(page, 'push', { value: '5' });
    await addOperation(page, 'push', { value: '8' });
    await addOperation(page, 'peek');
    await addOperation(page, 'pop');
    await runCurrent(page);
    await expect(page.getByTestId('linked-stack-visual')).toBeVisible();

    await seekMatching(page, 'linked-stack-visual', 'peek');
    await expect(page.getByTestId('linked-stack-top')).toContainText('8');
    await expect(page.getByTestId('linked-stack-node')).toHaveCount(3);
    await expect(page.getByTestId('linked-stack-node').first()).toHaveAttribute('data-value', '8');
    await page.getByTestId('linked-stack-visual').screenshot({
      path: 'test-results/chapter03-linked-stack.png',
    });

    await seekMatching(page, 'linked-stack-visual', 'pop');
    await expect(page.getByTestId('linked-stack-leaving')).toContainText('8');
    await expect(page.getByTestId('linked-stack-node')).toHaveCount(2);
    await expect(page.getByTestId('linked-stack-node').first()).toHaveAttribute('data-value', '5');
    await expect(page.getByTestId('linked-stack-top')).toContainText('5');

    await openAlgorithm(page, 'queue', 'circular-queue-visual');
    await seekMatching(page, 'circular-queue-visual', 'front');
    await expect(page.getByTestId('circular-queue-slot').first()).toHaveAttribute('data-status', 'front');
    await page.getByTestId('circular-queue-visual').screenshot({
      path: 'test-results/chapter03-circular-queue.png',
    });
    await page.getByTestId('structure-storage').selectOption('linked');
    await resetToOneOperation(page);
    await setOperation(page, 0, 'enqueue', { value: '3' });
    await addOperation(page, 'enqueue', { value: '8' });
    await addOperation(page, 'enqueue', { value: '5' });
    await addOperation(page, 'front');
    await addOperation(page, 'dequeue');
    await runCurrent(page);
    await expect(page.getByTestId('linked-queue-visual')).toBeVisible();

    await seekMatching(page, 'linked-queue-visual', 'front');
    await expect(page.getByTestId('linked-queue-front')).toContainText('head');
    await expect(page.getByTestId('linked-queue-node')).toHaveCount(3);
    await expect(page.getByTestId('linked-queue-node').first()).toHaveAttribute('data-value', '3');
    await expect(page.getByTestId('linked-queue-head')).toHaveCount(1);

    await seekMatching(page, 'linked-queue-visual', 'dequeue');
    await expect(page.getByTestId('linked-queue-leaving')).toContainText('3');
    await expect(page.getByTestId('linked-queue-node')).toHaveCount(2);
    await expect(page.getByTestId('linked-queue-node').first()).toHaveAttribute('data-value', '8');
    await expect(page.getByTestId('linked-queue-front')).toContainText('head');
    await page.getByTestId('linked-queue-visual').screenshot({
      path: 'test-results/chapter03-linked-queue.png',
    });
  });

  test('infix to postfix and postfix evaluation execute the official and custom examples', async ({ page }) => {
    test.setTimeout(300_000);

    await openAlgorithm(page, 'infix-to-postfix', 'expression-visual');
    await expect(page.getByTestId('expression-visual')).toHaveAttribute('data-algorithm', 'infix-to-postfix');
    await seekLast(page);
    await expect(
      page.getByTestId('expression-output').locator('.expression-output-token'),
    ).toHaveText(['3', '4', '+', '2', '*']);
    await expect(page.getByTestId('expression-visual')).toHaveAttribute('data-operation', 'done');
    await page.getByTestId('expression-visual').screenshot({
      path: 'test-results/chapter03-infix-to-postfix.png',
    });

    await page.getByTestId('guided-mode-custom').click();
    await page.getByTestId('expression-input').fill('10 - 2 * 3');
    await runCurrent(page);
    await seekLast(page);
    await expect(
      page.getByTestId('expression-output').locator('.expression-output-token'),
    ).toHaveText(['10', '2', '3', '*', '-']);
    await expect(page.getByTestId('expression-visual')).not.toHaveAttribute('data-operation', 'error');

    await openAlgorithm(page, 'postfix-eval', 'expression-visual');
    await expect(page.getByTestId('expression-visual')).toHaveAttribute('data-algorithm', 'postfix-eval');
    await seekLast(page);
    await expect(page.getByTestId('expression-result')).toContainText('14');
    await expect(page.getByTestId('expression-visual')).toHaveAttribute('data-operation', 'done');
    await page.getByTestId('expression-visual').screenshot({
      path: 'test-results/chapter03-postfix-eval.png',
    });

    await page.getByTestId('guided-mode-custom').click();
    await page.getByTestId('expression-input').fill('10 2 3 * -');
    await runCurrent(page);
    await seekLast(page);
    await expect(page.getByTestId('expression-result')).toContainText('4');

    await page.getByTestId('guided-mode-custom').click();
    await page.getByTestId('expression-input').fill('3 0 /');
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await seekLast(page);
    await expect(page.getByTestId('expression-error')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('expression-error')).toContainText(/除数为零|division by zero/i);
    await expect(page.getByTestId('expression-visual')).toHaveAttribute('data-operation', 'error');
  });
});
