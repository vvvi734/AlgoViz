import { expect, selectAlgorithm as chooseAlgorithm, test, type Page } from './fixtures';

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
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.locator('[data-testid="scrub"]').evaluate((node, value) => {
      const input = node as HTMLInputElement;
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      const apply = (next: number) => {
        nativeSetter?.call(input, String(next));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      if (input.value === String(value)) apply(value === 0 ? 1 : 0);
      apply(value);
    }, frame);
    await page.waitForTimeout(80);
    if ((await page.getByTestId('progress').textContent()) === `${frame + 1} / ${total}`) return;
  }
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`);
}

async function seekMatching(page: Page, testId: string, actions: string[]): Promise<number> {
  const visual = page.getByTestId(testId);
  const total = await totalFrames(page);
  for (let index = 0; index < total; index += 1) {
    await setFrame(page, index, total);
    const action = await visual.getAttribute('data-action');
    if (action !== null && actions.includes(action)) return index;
  }
  throw new Error(`no ${testId} frame with action ${actions.join(', ')}`);
}

async function seekLast(page: Page) {
  const total = await totalFrames(page);
  await setFrame(page, total - 1, total);
}

async function openAlgorithm(page: Page, id: string, visualTestId: string) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, id);
  await expect(page.getByTestId('guided-input')).toHaveAttribute('data-algorithm', id);
  await expect(page.getByTestId(visualTestId)).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('algorithm-flow')).toHaveAttribute('data-algorithm-id', id);
  await expect(page.getByTestId('guide-flow-pending')).toHaveCount(0);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

async function runCurrent(page: Page) {
  await page.getByTestId('run-btn').click();
  await waitGenerated(page);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

async function clearPolynomial(page: Page, prefix: 'a' | 'b') {
  while ((await page.getByTestId(`poly-remove-${prefix}`).count()) > 0) {
    await page.getByTestId(`poly-remove-${prefix}`).first().click();
  }
  await expect(page.getByTestId(`poly-row-${prefix}`)).toHaveCount(0);
}

async function addPolynomialTerm(page: Page, prefix: 'a' | 'b', coefficient: string, exponent: string) {
  await page.getByTestId(`poly-add-${prefix}`).click();
  const row = page.getByTestId(`poly-row-${prefix}`).last();
  await row.getByTestId(`poly-coefficient-${prefix}`).fill(coefficient);
  await row.getByTestId(`poly-exponent-${prefix}`).fill(exponent);
}

test.describe.configure({ timeout: 300_000 });

test.describe('TEXTBOOK-02 — chapter 2 real Pyodide traces', () => {
  test('static linked list: official cursors, custom reuse, full-capacity rejection and official restore', async ({
    page,
  }) => {
    await openAlgorithm(page, 'static-linked-list', 'static-linked-visual');
    await expect(page.getByTestId('static-linked-editor')).toBeVisible();
    await expect(page.getByTestId('static-capacity')).toHaveValue('8');
    await expect(page.getByTestId('static-values')).toHaveValue('10, 20, 30');
    await expect(page.getByTestId('static-operation-row')).toHaveCount(3);

    await seekLast(page);
    const visual = page.getByTestId('static-linked-visual');
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-head', '0');
    await expect(visual).toHaveAttribute('data-free-head', '1');
    await expect(visual).toHaveAttribute('data-logical', '0,3,2');
    await expect(visual).toHaveAttribute('data-free', '1,4,5,6,7');
    await expect(page.getByTestId('static-logical-node-0')).toHaveAttribute('data-value', '10');
    await expect(page.getByTestId('static-logical-node-3')).toHaveAttribute('data-value', '25');
    await expect(page.getByTestId('static-logical-node-2')).toHaveAttribute('data-value', '30');
    await expect(page.getByTestId('static-logical-node-1')).toHaveCount(0);
    await expect(page.getByTestId('static-slot-1')).toHaveAttribute('data-role', 'free-head');
    await expect(page.getByTestId('static-slot-1')).toHaveAttribute('data-data', '');
    await expect(page.getByTestId('static-slot-3')).toHaveAttribute('data-role', 'live');
    await expect(page.getByTestId('static-slot-3')).toHaveAttribute('data-data', '25');
    await expect(page.getByTestId('static-slot-3')).toHaveAttribute('data-cursor', '2');

    await page.getByTestId('static-capacity').fill('6');
    await page.getByTestId('static-values').fill('10, 20, 30');
    const first = page.getByTestId('static-operation-row').nth(0);
    await first.getByTestId('static-position').fill('1');
    await first.getByTestId('static-value').fill('5');
    const second = page.getByTestId('static-operation-row').nth(1);
    await second.getByTestId('static-position').fill('2');
    await expect(page.getByTestId('guided-mode-custom')).toHaveAttribute('aria-pressed', 'true');

    await runCurrent(page);
    await seekLast(page);
    await expect(visual).toHaveAttribute('data-operation', 'done');
    await expect(visual).toHaveAttribute('data-head', '3');
    await expect(visual).toHaveAttribute('data-free-head', '0');
    await expect(visual).toHaveAttribute('data-logical', '3,1,2');
    await expect(visual).toHaveAttribute('data-free', '0,4,5');
    await expect(page.getByTestId('static-logical-node-3')).toHaveAttribute('data-value', '5');
    await expect(page.getByTestId('static-logical-node-1')).toHaveAttribute('data-value', '20');
    await expect(page.getByTestId('static-logical-node-2')).toHaveAttribute('data-value', '30');
    await expect(page.getByTestId('static-slot-0')).toHaveAttribute('data-role', 'free-head');
    await expect(page.getByTestId('static-slot-0')).toHaveAttribute('data-cursor', '4');

    await page.getByTestId('static-capacity').fill('4');
    await page.getByTestId('static-values').fill('1, 2, 3, 4');
    const beforeInvalid = await totalFrames(page);
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/容量 4 已满|capacity 4 is full/, {
      timeout: 30_000,
    });
    await expect(page.getByTestId('progress')).toHaveText('0 / 0');
    expect(beforeInvalid).toBeGreaterThan(1);

    await page.getByTestId('guided-mode-official').click();
    await waitGenerated(page);
    await expect(page.getByTestId('guided-mode-official')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('static-capacity')).toHaveValue('8');
    await expect(page.getByTestId('static-values')).toHaveValue('10, 20, 30');
    await seekLast(page);
    await expect(visual).toHaveAttribute('data-logical', '0,3,2');

    await page.getByTestId('random-btn').click();
    await expect(page.getByTestId('guided-mode-random')).toHaveAttribute('aria-pressed', 'true');
    await runCurrent(page);
    await seekLast(page);
    await expect(visual).toBeVisible();
  });

  test('polynomial addition: official cancellation, custom merge/append, empty and invalid inputs', async ({
    page,
  }) => {
    await openAlgorithm(page, 'polynomial-add', 'polynomial-visual');
    await expect(page.getByTestId('polynomial-editor')).toBeVisible();
    const visual = page.getByTestId('polynomial-visual');

    await seekLast(page);
    await expect(visual).toHaveAttribute('data-action', 'complete');
    await expect(visual).toHaveAttribute('data-result', '4x³ + 2x² + 2');
    await expect(page.getByTestId('poly-chain-a')).toHaveAttribute('data-count', '3');
    await expect(page.getByTestId('poly-chain-b')).toHaveAttribute('data-count', '3');
    await expect(page.getByTestId('poly-chain-result')).toHaveAttribute('data-count', '3');
    await expect(page.getByTestId('poly-expression-result')).toHaveText('4x³ + 2x² + 2');

    await seekMatching(page, 'polynomial-visual', ['cancel']);
    await expect(page.getByTestId('poly-compare')).toContainText('4');
    await expect(page.getByTestId('poly-chain-result')).toHaveAttribute('data-count', '0');
    await expect(visual).toHaveAttribute('data-result', '0');

    await seekMatching(page, 'polynomial-visual', ['take-b']);
    await expect(visual).toHaveAttribute('data-result', '4x³');
    await seekMatching(page, 'polynomial-visual', ['take-a']);
    await expect(visual).toHaveAttribute('data-result', '4x³ + 2x²');

    await clearPolynomial(page, 'a');
    await clearPolynomial(page, 'b');
    await addPolynomialTerm(page, 'a', '2', '5');
    await addPolynomialTerm(page, 'a', '1', '2');
    await addPolynomialTerm(page, 'b', '-1', '5');
    await addPolynomialTerm(page, 'b', '4', '0');
    await expect(page.getByTestId('guided-mode-custom')).toHaveAttribute('aria-pressed', 'true');

    await runCurrent(page);
    await seekLast(page);
    await expect(visual).toHaveAttribute('data-result', 'x⁵ + x² + 4');
    await expect(page.getByTestId('poly-chain-result')).toHaveAttribute('data-count', '3');
    await expect(page.getByTestId('poly-expression-result')).toHaveText('x⁵ + x² + 4');

    await clearPolynomial(page, 'b');
    await addPolynomialTerm(page, 'b', '-1', '5');
    await clearPolynomial(page, 'a');
    await addPolynomialTerm(page, 'a', '1', '5');
    await runCurrent(page);
    await seekLast(page);
    await expect(visual).toHaveAttribute('data-result', '0');
    await expect(page.getByTestId('poly-chain-result')).toHaveAttribute('data-count', '0');

    await clearPolynomial(page, 'b');
    await clearPolynomial(page, 'a');
    await addPolynomialTerm(page, 'a', '3', '2');
    await runCurrent(page);
    await seekLast(page);
    await expect(visual).toHaveAttribute('data-result', '3x²');
    await expect(page.getByTestId('poly-chain-result')).toHaveAttribute('data-count', '1');

    await addPolynomialTerm(page, 'a', '2', '2');
    const beforeInvalid = await totalFrames(page);
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/重复指数|duplicate exponent/, {
      timeout: 30_000,
    });
    await expect(page.getByTestId('progress')).toHaveText('0 / 0');
    expect(beforeInvalid).toBeGreaterThan(1);

    await page.getByTestId('guided-mode-official').click();
    await waitGenerated(page);
    await seekLast(page);
    await expect(visual).toHaveAttribute('data-result', '4x³ + 2x² + 2');

    await page.getByTestId('random-btn').click();
    await expect(page.getByTestId('guided-mode-random')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('guided-random-scenario').selectOption('both-empty');
    await runCurrent(page);
    await seekLast(page);
    await expect(visual).toHaveAttribute('data-result', '0');
    await expect(page.getByTestId('poly-chain-result')).toHaveAttribute('data-count', '0');
  });
});
