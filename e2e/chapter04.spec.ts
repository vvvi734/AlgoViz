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
    await page.getByTestId('restart-btn').click();
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

async function runPair(page: Page, text: string, pattern: string, patternId: string) {
  await page.getByTestId('run-input').fill(text);
  await page.getByTestId(patternId).fill(pattern);
  await page.getByTestId('run-btn').click();
  await waitGenerated(page);
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
}

test.describe('CHAPTER-04 — strings, storage and pattern matching', () => {
  test('BF compares aligned characters, rescans text cells and reports overlaps', async ({ page }) => {
    test.setTimeout(300_000);

    await openAlgorithm(page, 'bf', 'bf-visual');
    await expect(page.getByTestId('bf-text-cell')).toHaveCount(14);
    await expect(page.getByTestId('bf-pattern-cell')).toHaveCount(5);
    await expect(page.getByTestId('bf-visual')).toHaveAttribute('data-match-count', '0');

    await seekMatching(page, 'bf-visual', 'compare');
    await expect(page.getByTestId('bf-status')).toContainText('T[');
    await expect(page.getByTestId('bf-pattern-row')).toBeVisible();

    await seekMatching(page, 'bf-visual', 'match-found');
    await expect(page.getByTestId('bf-match-banner')).toContainText('s =');
    await expect(page.getByTestId('bf-match-chip').first()).toHaveAttribute('data-start', '2');
    await page.getByTestId('bf-visual').screenshot({ path: 'test-results/chapter04-bf-match.png' });

    await runPair(page, 'AAAAA', 'AAA', 'bf-pattern');
    await seekLast(page);
    await expect(page.getByTestId('bf-match-chip')).toHaveCount(3);
    await expect(page.getByTestId('bf-match-chip').nth(1)).toHaveAttribute('data-start', '1');
    await page.getByTestId('bf-visual').screenshot({ path: 'test-results/chapter04-bf-overlap.png' });

    await runPair(page, '', 'A', 'bf-pattern');
    await seekLast(page);
    await expect(page.getByTestId('bf-status')).toContainText('空主串');
    await expect(page.getByTestId('bf-match-chip')).toHaveCount(0);
  });

  test('BF rejects an empty pattern while KMP keeps its LPS teaching table', async ({ page }) => {
    test.setTimeout(300_000);

    await openAlgorithm(page, 'bf', 'bf-visual');
    await page.getByTestId('run-input').fill('ABAB');
    await page.getByTestId('bf-pattern').fill('');
    await page.getByTestId('run-btn').click();
    await expect(page.getByTestId('run-feedback')).toContainText(/模式串|pattern/i, {
      timeout: 30_000,
    });

    await openAlgorithm(page, 'kmp', 'kmp-visual');
    await expect(page.getByTestId('kmp-lps-cell')).toHaveCount(5);
    await expect(page.getByTestId('kmp-pattern')).toBeVisible();
    await seekMatching(page, 'kmp-visual', 'match-found');
    await expect(page.getByTestId('kmp-match-banner')).toContainText('2');
    await expect(page.getByTestId('kmp-match-chip').first()).toHaveAttribute('data-start', '2');
  });
});
