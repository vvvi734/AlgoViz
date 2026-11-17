import { expect, test, type Page } from './fixtures';

/**
 * Stage 6A browser E2E.
 *
 * The Gateway is a real HTTP process started by Playwright, but its provider is
 * `ALGOLENS_AI_MOCK=1` (a deterministic fixture). These tests prove the browser
 * wiring, real-frame selection, request/step attribution and the two guardrails;
 * they are NOT a real Ollama or cloud-model integration test.
 */

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
}

async function runBubbleToCompare(page: Page): Promise<void> {
  await page.selectOption('#code-lang', 'python');
  await expect(page.locator('.monaco-editor')).toContainText('lesson_step');
  await page.click('[data-testid="run-btn"]');
  await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'init', {
    timeout: 120_000,
  });
  await page.click('[data-testid="lesson-step-compare"]');
  await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'compare');
}

test.describe('Stage 6A — AI mentor with a real trace', () => {
  test('explains the frame on screen using its real variables', async ({ page }) => {
    await openApp(page);
    await runBubbleToCompare(page);
    await page.click('[data-testid="workspace-tab-mentor"]');

    await expect(page.locator('[data-testid="mentor-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="mentor-status"]')).toContainText('AI 网关已连接');
    await expect(page.locator('[data-testid="mentor-context"]')).toContainText('真实帧');

    await page.click('[data-testid="mentor-explain-step"]');
    await expect(page.locator('[data-testid="mentor-answer-body-0"]')).toBeVisible({ timeout: 30_000 });

    const body = page.locator('[data-testid="mentor-answer-body-0"]');
    await expect(body).toContainText('真实帧中观察到');
    await expect(body).toContainText('arr = [5,2,8,1,6,3]');
    await expect(body).toContainText('i = 0');
    await expect(page.locator('[data-testid="mentor-answer-0"]')).toContainText('模拟数据');

    // The frame attribution on the card is the frame that was on screen.
    const frameLabel = await page.locator('[data-testid="step-number"]').textContent();
    const frameNumber = frameLabel?.match(/\d+/)?.[0];
    expect(frameNumber).toBeTruthy();
    await expect(page.locator('[data-testid="mentor-answer-0"]')).toContainText(`帧 ${frameNumber}/`);
  });

  test('hides a leaked full solution at Level 1 and shows it only after Level 5 confirmation', async ({ page }) => {
    await openApp(page);
    await runBubbleToCompare(page);
    await page.click('[data-testid="workspace-tab-mentor"]');

    await expect(page.locator('[data-testid="mentor-provider"]')).toHaveValue('mock');
    await page.selectOption('[data-testid="mentor-model"]', 'mock-leak');

    await page.click('[data-testid="mentor-explain-step"]');
    const body = page.locator('[data-testid="mentor-answer-body-0"]');
    await expect(body).toBeVisible({ timeout: 30_000 });
    await expect(body).not.toContainText('def bubble_sort');
    await expect(body).not.toContainText('```');
    await expect(body).toContainText('已按当前提示等级隐藏');

    await page.selectOption('[data-testid="mentor-level"]', '5');
    await expect(page.locator('[data-testid="mentor-level5-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="mentor-send"]')).toBeDisabled();
    await page.check('[data-testid="mentor-level5-ack"]');
    await expect(page.locator('[data-testid="mentor-send"]')).toBeEnabled();
    await page.click('[data-testid="mentor-send"]');

    await expect(page.locator('[data-testid="mentor-answer-body-1"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="mentor-answer-body-1"]')).toContainText('def bubble_sort');
    await expect(page.locator('[data-testid="mentor-answer-1"]')).toContainText('完整解法');
  });

  test('keeps the lab usable and shows a labelled local hint when the Gateway is absent', async ({ page }) => {
    await page.route('**/api/providers', (route) => route.abort());
    await page.route('**/api/mentor', (route) => route.abort());

    await openApp(page);
    await page.click('[data-testid="workspace-tab-mentor"]');
    await expect(page.locator('[data-testid="mentor-status"]')).toContainText('AI 未连接');
    await expect(page.locator('[data-testid="mentor-local-hint"]')).toContainText('本地教学提示（非 AI）');
    await expect(page.locator('[data-testid="mentor-send"]')).toHaveCount(0);

    await runBubbleToCompare(page);
    await page.click('[data-testid="workspace-tab-state"]');
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('arr');
    await expect(page.locator('[data-testid="step-desc"]')).toContainText('比较');
  });
});
