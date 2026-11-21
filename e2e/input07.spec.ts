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

async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
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

async function seekLast(page: Page) {
  const total = await totalFrames(page);
  await setFrame(page, total - 1, total);
}

async function runCurrent(page: Page) {
  await page.getByTestId('run-btn').click();
  await waitGenerated(page);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
  await settle(page);
}

async function openSparse(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await chooseAlgorithm(page, 'sparse-transpose');
  await openCodePanel(page);
  await expect(page.getByTestId('guided-input')).toHaveAttribute('data-algorithm', 'sparse-transpose');
  await expect(page.getByTestId('sparse-transpose-visual')).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

async function clearTriples(page: Page) {
  while ((await page.getByTestId('sparse-triple-remove').count()) > 0) {
    await page.getByTestId('sparse-triple-remove').first().click();
  }
  await expect(page.getByTestId('sparse-triple-row')).toHaveCount(0);
}

async function setTriple(
  page: Page,
  index: number,
  row: string,
  col: string,
  value: string,
) {
  await page.getByTestId('sparse-triple-row-input').nth(index).fill(row);
  await page.getByTestId('sparse-triple-col-input').nth(index).fill(col);
  await page.getByTestId('sparse-triple-value-input').nth(index).fill(value);
}

type Triple = { row: string; col: string; value: string };

async function resultTriples(page: Page): Promise<Triple[]> {
  return page.getByTestId('sparse-result-triples-row').evaluateAll((rows) =>
    rows.map((row) => {
      const element = row as HTMLElement;
      return {
        row: element.dataset.row ?? '',
        col: element.dataset.col ?? '',
        value: element.dataset.value ?? '',
      };
    }),
  );
}

test.describe.configure({ timeout: 300_000 });

test.describe('INPUT-07 — sparse matrix shape and triple table drive the real Python trace', () => {
  test('custom 3 × 4 matrix transposes exactly, rejects duplicates and restores official data', async ({
    page,
  }) => {
    await openSparse(page);
    await expect(page.getByTestId('sparse-rows')).toHaveValue('4');
    await expect(page.getByTestId('sparse-cols')).toHaveValue('5');
    await expect(page.getByTestId('sparse-triple-row')).toHaveCount(6);

    await page.getByTestId('sparse-rows').fill('3');
    await page.getByTestId('sparse-cols').fill('4');
    await clearTriples(page);
    for (let index = 0; index < 4; index += 1) {
      await page.getByTestId('sparse-add-triple').click();
      await expect(page.getByTestId('sparse-triple-row')).toHaveCount(index + 1);
    }
    await setTriple(page, 0, '0', '0', '5');
    await setTriple(page, 1, '0', '3', '-2');
    await setTriple(page, 2, '1', '2', '4');
    await setTriple(page, 3, '2', '1', '7');
    await expect(page.getByTestId('guided-mode-custom')).toHaveAttribute('aria-pressed', 'true');

    await runCurrent(page);
    await seekLast(page);
    await expect(page.getByTestId('sparse-transpose-visual')).toHaveAttribute('data-phase', 'done');
    await expect(page.getByTestId('sparse-transpose-visual')).toHaveAttribute('data-total', '4');
    await expect(page.getByTestId('sparse-written')).toContainText(/4\s*\/\s*4|4 of 4/);
    await expect(page.getByTestId('sparse-result')).toHaveCount(1);

    const result = await resultTriples(page);
    expect(result).toEqual([
      { row: '0', col: '0', value: '5' },
      { row: '1', col: '2', value: '7' },
      { row: '2', col: '1', value: '4' },
      { row: '3', col: '0', value: '-2' },
    ]);
    await expect(
      page.locator('[data-testid="sparse-result-cell"][data-row="1"][data-col="2"]'),
    ).toHaveAttribute('data-value', '7');
    await expect(
      page.locator('[data-testid="sparse-result-cell"][data-row="2"][data-col="1"]'),
    ).toHaveAttribute('data-value', '4');
    await expect(
      page.locator('[data-testid="sparse-result-cell"][data-row="3"][data-col="0"]'),
    ).toHaveAttribute('data-value', '-2');

    await setTriple(page, 2, '0', '3', '4');
    const beforeInvalid = await totalFrames(page);
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/同一矩阵位置|重复|Duplicate|appear only once/, {
      timeout: 30_000,
    });
    await expect(page.getByTestId('run-feedback')).toContainText(/3|第三/, { timeout: 30_000 });
    await expect(page.getByTestId('progress')).toHaveText('0 / 0');
    expect(beforeInvalid).toBeGreaterThan(1);

    await page.getByTestId('random-btn').click();
    await expect(page.getByTestId('guided-mode-random')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('progress')).toHaveText('0 / 0');
    const randomCount = await page.getByTestId('sparse-triple-row').count();
    expect(randomCount).toBeGreaterThan(0);

    await runCurrent(page);
    await seekLast(page);
    await expect(page.getByTestId('sparse-transpose-visual')).toHaveAttribute(
      'data-total',
      String(randomCount),
    );
    await expect(page.getByTestId('sparse-result-triples-row')).toHaveCount(randomCount);

    await page.getByTestId('guided-mode-official').click();
    await waitGenerated(page);
    await expect(page.getByTestId('guided-mode-official')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('sparse-rows')).toHaveValue('4');
    await expect(page.getByTestId('sparse-cols')).toHaveValue('5');
    await expect(page.getByTestId('sparse-triple-row')).toHaveCount(6);
    await seekLast(page);
    await expect(page.getByTestId('sparse-transpose-visual')).toHaveAttribute('data-total', '6');
  });
});
