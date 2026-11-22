import { test, expect, type Page } from '@playwright/test';

async function openApp(page: Page) {
  await page.goto('/?view=lab');
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 60_000 });
}

async function openChapter(page: Page, chapterId: string) {
  const sidebar = page.getByTestId('sidebar');
  if ((await sidebar.getAttribute('data-collapsed')) === 'true') {
    await page.getByTestId('sidebar-expand').click();
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false');
  }
  const chapter = page.getByTestId(`chapter-${chapterId}`);
  if ((await chapter.getAttribute('aria-expanded')) !== 'true') await chapter.click();
  await expect(chapter).toHaveAttribute('aria-expanded', 'true');
}

async function openTopic(page: Page, topicId: string) {
  const topic = page.getByTestId(`topic-${topicId}`);
  const parentId = await topic.getAttribute('data-parent-topic');
  if (parentId) {
    const parent = page.getByTestId(`topic-${parentId}`);
    if ((await parent.count()) > 0 && (await parent.isVisible())) {
      if ((await parent.getAttribute('aria-expanded')) === 'false') await parent.click();
      await expect(parent).toHaveAttribute('aria-expanded', 'true');
    }
  }
  await expect(topic).toBeVisible();
  if ((await topic.getAttribute('aria-expanded')) === null) {
    if ((await topic.getAttribute('data-kind')) === 'concept') await topic.click();
    return;
  }
  if ((await topic.getAttribute('aria-expanded')) !== 'true') await topic.click();
  await expect(topic).toHaveAttribute('aria-expanded', 'true');
}

async function selectAlgo(page: Page, id: string) {
  const mobile = page.getByTestId('mobile-algo-select');
  if (await mobile.isVisible()) {
    await mobile.selectOption(id);
    return;
  }
  const item = page.getByTestId(`algo-${id}`);
  await expect(item).toHaveCount(1);
  const chapterId = await item.getAttribute('data-chapter');
  const topicId = await item.getAttribute('data-topic');
  if (!chapterId || !topicId) throw new Error(`missing path for ${id}`);
  await openChapter(page, chapterId);
  await openTopic(page, topicId);
  await item.click();
}

async function waitTrace(page: Page, pattern: RegExp, timeout = 120_000) {
  await expect(page.getByTestId('progress')).toHaveText(pattern, { timeout });
}

async function waitGenerated(page: Page) {
  await expect(page.getByTestId('run-feedback')).toContainText(/动画已生成|Visualization ready/, {
    timeout: 180_000,
  });
  await waitTrace(page, /^1 \/ \d+$/, 180_000);
}

async function noOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
}

test('RELEASE-01 production preview with real Pyodide CDN', async ({ page }) => {
  test.setTimeout(600_000);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const pyodideResponses: Array<{ url: string; status: number }> = [];
  const monacoResponses: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (/monaco-setup|editor\.worker/i.test(response.url())) monacoResponses.push(response.url());
    if (/pyodide/i.test(response.url())) {
      pyodideResponses.push({ url: response.url(), status: response.status() });
    }
  });

  await test.step('home, title, favicon and twelve chapters', async () => {
    await openApp(page);
    await expect(page).toHaveTitle(/AlgoViz/);
    await expect(page.locator('.textbook-chapter-head')).toHaveCount(12);
    const faviconStatus = await page.evaluate(async () => (await fetch('./favicon.svg')).status);
    expect(faviconStatus).toBe(200);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', './favicon.svg');
    expect(monacoResponses).toEqual([]);
  });

  await test.step('theory topic opens without a player', async () => {
    await openChapter(page, 'ch7-graph');
    await openTopic(page, 'graph-basics');
    await expect(page.getByTestId('concept-title')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('concept-diagram')).toBeVisible();
    await expect(page.getByTestId('play-btn')).toHaveCount(0);
  });

  await test.step('bubble official, custom and random inputs plus playback', async () => {
    await selectAlgo(page, 'bubble');
    await waitTrace(page, /^1 \/ 25$/);
    await expect(page.locator('[data-testid="visual-stage"] .bar')).toHaveCount(6);

    await page.getByTestId('next-btn').click();
    await waitTrace(page, /^2 \/ 25$/);
    await page.getByTestId('prev-btn').click();
    await waitTrace(page, /^1 \/ 25$/);

    await page.getByTestId('play-btn').click();
    await page.waitForTimeout(400);
    await page.getByTestId('play-btn').click();
    const played = Number((await page.getByTestId('progress').textContent())?.split('/')[0]?.trim());
    expect(played).toBeGreaterThan(1);

    const scrub = page.getByTestId('scrub');
    await scrub.fill('10');
    await waitTrace(page, /^11 \/ 25$/);

    // Custom input crosses the real Pyodide path; the CDN response is captured.
    await page.locator('#run-input').fill('8, 3, 5, 1, 7');
    await expect(page.getByTestId('guided-mode-custom')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expect(page.locator('[data-testid="visual-stage"] .bar')).toHaveCount(5);
    expect(await page.locator('[data-testid="visual-stage"] .bar span').allTextContents()).toEqual([
      '8',
      '3',
      '5',
      '1',
      '7',
    ]);

    // Random input also executes real Python and paints its generated length.
    await page.getByTestId('guided-mode-random').click();
    await page.getByTestId('guided-random-scenario').selectOption('reversed');
    const randomValues = (await page.locator('#run-input').inputValue()).split(/[,\s]+/).filter(Boolean);
    expect(randomValues.length).toBeGreaterThanOrEqual(8);
    await page.getByTestId('run-btn').click();
    await waitGenerated(page);
    await expect(page.locator('[data-testid="visual-stage"] .bar')).toHaveCount(randomValues.length);
  });

  await test.step('official tree and graph traces execute', async () => {
    await selectAlgo(page, 'inorder');
    await waitTrace(page, /^1 \/ \d+$/, 120_000);
    await expect(page.getByTestId('tree-node')).toHaveCount(7);

    await selectAlgo(page, 'bfs');
    await waitTrace(page, /^1 \/ \d+$/, 120_000);
    await expect(page.locator('[data-testid="graph-node"]')).not.toHaveCount(0);
    await expect(page.locator('[data-testid="graph-visual"]')).toHaveAttribute('data-algorithm', 'bfs');
  });

  await test.step('read-only C/C++/Python panel, bilingual comments and copy', async () => {
    await selectAlgo(page, 'bubble');
    const toggle = page.getByTestId('workspace-tabs-toggle');
    await expect(toggle).toBeVisible({ timeout: 30_000 });
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
    await expect(page.getByTestId('reference-code-panel')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('reference-file-name')).toHaveText('bubble_sort.c');
    await expect(page.getByTestId('reference-code-viewer')).toHaveAttribute('data-readonly', 'true');
    await expect(page.locator('[data-testid="reference-code-viewer"] .monaco-editor')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('[data-testid="reference-code-viewer"] [contenteditable="true"]')).toHaveCount(0);
    expect(monacoResponses.some((url) => /monaco-setup/i.test(url))).toBe(true);

    await page.getByTestId('reference-lang-cpp').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('bubble_sort.cpp');
    await page.getByTestId('reference-lang-python').click();
    await expect(page.getByTestId('reference-file-name')).toHaveText('bubble_sort.py');
    await expect(page.getByTestId('reference-lang-python')).toHaveAttribute('aria-selected', 'true');

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByTestId('reference-lang-c').click();
    await expect(page.getByTestId('reference-copy')).toBeEnabled();
    await page.getByTestId('reference-copy').click();
    await expect(page.getByTestId('reference-copy')).toContainText(/已复制|Copied/i);
    const chineseCopy = await page.evaluate(() => navigator.clipboard.readText());
    expect(chineseCopy.length).toBeGreaterThan(200);
    expect(chineseCopy).toMatch(/[\u4e00-\u9fff]/);

    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('reference-code-panel')).toHaveAttribute('data-comment-language', 'en');
    await page.getByTestId('reference-copy').click();
    await expect(page.getByTestId('reference-copy')).toContainText(/Copied|已复制/i);
    const englishCopy = await page.evaluate(() => navigator.clipboard.readText());
    expect(englishCopy.length).toBeGreaterThan(200);
    expect(englishCopy).not.toMatch(/[\u4e00-\u9fff]/);
    await page.getByRole('button', { name: /切换语言|Switch language/ }).click();
    await expect(page.getByTestId('reference-code-panel')).toHaveAttribute('data-comment-language', 'zh');
  });

  await test.step('mobile width and refresh', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await noOverflow(page);
    await expect(page.getByTestId('mobile-algo-select')).toBeVisible();
    await expect(page.getByTestId('next-btn')).toBeVisible();

    await page.reload();
    await openApp(page);
    await expect(page).toHaveTitle(/AlgoViz/);
    await expect(page.locator('.textbook-chapter-head')).toHaveCount(12);
  });

  await test.step('no blocking console/page errors and real CDN evidence', async () => {
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(pyodideResponses.length).toBeGreaterThan(0);
    expect(pyodideResponses.some((item) => item.status >= 200 && item.status < 400)).toBe(true);
    expect(pyodideResponses.some((item) => /pyodide\.js/i.test(item.url))).toBe(true);
    expect(pyodideResponses.some((item) => /\.wasm/i.test(item.url))).toBe(true);
  });
});
