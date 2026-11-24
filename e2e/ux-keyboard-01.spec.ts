import {
  collapseAlgorithmGuide,
  expect,
  openAdvancedPanels,
  selectAlgorithm,
  test,
  type Page,
} from './fixtures';

async function openAlgorithm(page: Page, id: string, stage: string): Promise<number> {
  await selectAlgorithm(page, id);
  const stageLocator = stage.startsWith('.') ? page.locator(stage).first() : page.getByTestId(stage);
  await expect(stageLocator).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/, { timeout: 90_000 });
  return totalFrames(page);
}

async function totalFrames(page: Page): Promise<number> {
  const progress = (await page.getByTestId('progress').textContent()) ?? '1 / 0';
  return Number(progress.split('/')[1]?.trim());
}

async function focusWorkspace(page: Page): Promise<void> {
  const workspace = page.getByTestId('lab-workbench');
  await workspace.focus();
  await expect(workspace).toBeFocused();
}

async function pressKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
}

test.describe('UX-KEYBOARD-01 playback shortcuts', () => {
  test('bubble sorting supports all keys, boundaries, pause and a clean reset', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    const total = await openAlgorithm(page, 'bubble', '.bars');
    await page.setViewportSize({ width: 1280, height: 900 });

    const hint = page.getByTestId('keyboard-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('上一帧');
    await expect(hint).toContainText('播放/暂停');
    await expect(hint).toContainText('重置');
    await expect(hint).toContainText('首帧');
    await expect(hint).toContainText('末帧');
    await expect(page.getByTestId('prev-btn')).toHaveAttribute('aria-keyshortcuts', 'ArrowLeft');
    await expect(page.getByTestId('next-btn')).toHaveAttribute('aria-keyshortcuts', 'ArrowRight');
    await expect(page.getByTestId('play-btn')).toHaveAttribute('aria-keyshortcuts', 'Space');
    await expect(page.getByTestId('restart-btn')).toHaveAttribute('aria-keyshortcuts', 'R');
    await expect(page.getByTestId('next-btn')).toHaveAttribute('title', '下一帧（→）');
    await expect(page.getByTestId('prev-btn')).toHaveAttribute('title', '上一帧（←）');

    await focusWorkspace(page);
    await pressKey(page, 'ArrowLeft');
    await expect(page.getByTestId('progress')).toHaveText(`1 / ${total}`);
    await pressKey(page, 'ArrowRight');
    await expect(page.getByTestId('progress')).toHaveText(`2 / ${total}`);
    await pressKey(page, 'ArrowLeft');
    await expect(page.getByTestId('progress')).toHaveText(`1 / ${total}`);

    await pressKey(page, 'End');
    await expect(page.getByTestId('progress')).toHaveText(`${total} / ${total}`);
    await pressKey(page, 'ArrowRight');
    await expect(page.getByTestId('progress')).toHaveText(`${total} / ${total}`);
    await pressKey(page, 'Home');
    await expect(page.getByTestId('progress')).toHaveText(`1 / ${total}`);

    await pressKey(page, 'Space');
    await expect(page.getByTestId('play-btn')).toHaveText(/暂停|Pause/);
    await pressKey(page, 'ArrowRight');
    await expect(page.getByTestId('play-btn')).toHaveText(/播放|Play/);

    const inputBefore = await page.getByTestId('run-input').inputValue();
    await pressKey(page, 'R');
    await expect(page.getByTestId('progress')).toHaveText(`1 / ${total}`);
    await expect(page.getByTestId('play-btn')).toHaveText(/播放|Play/);
    await expect(page.getByTestId('run-input')).toHaveValue(inputBefore);
    await page.waitForTimeout(900);
    await expect(page.getByTestId('progress')).toHaveText(`1 / ${total}`);

    await pressKey(page, 'Space');
    await expect(page.getByTestId('play-btn')).toHaveText(/暂停|Pause/);
    await pressKey(page, 'End');
    await expect(page.getByTestId('progress')).toHaveText(`${total} / ${total}`);
    await expect(page.getByTestId('play-btn')).toHaveText(/播放|Play/);
  });

  test('the shared player covers sorting, tree, graph and string traces', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });

    const cases = [
      // The browser bubble example renders the compact bar model, not SortingVisual.
      ['bubble', '.bars'],
      ['inorder', 'tree-visual'],
      ['bfs', 'graph-visual'],
      ['kmp', 'kmp-visual'],
    ] as const;

    for (const [algorithm, stage] of cases) {
      const total = await openAlgorithm(page, algorithm, stage);
      await focusWorkspace(page);
      await pressKey(page, 'ArrowRight');
      await expect(page.getByTestId('progress')).toHaveText(`2 / ${total}`);
      await pressKey(page, 'End');
      await expect(page.getByTestId('progress')).toHaveText(`${total} / ${total}`);
      await pressKey(page, 'Home');
      await expect(page.getByTestId('progress')).toHaveText(`1 / ${total}`);
    }

    // A course switch installs a new trace without leaving a second listener
    // behind: one ArrowRight must advance exactly one frame.
    await openAlgorithm(page, 'inorder', 'tree-visual');
    await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
    await focusWorkspace(page);
    await pressKey(page, 'ArrowRight');
    await expect(page.getByTestId('progress')).toHaveText(/^2 \/ \d+$/);
  });

  test('text inputs and the read-only Monaco viewer keep their native keys', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await openAlgorithm(page, 'bubble', '.bars');
    await focusWorkspace(page);
    await pressKey(page, 'ArrowRight');
    await pressKey(page, 'ArrowRight');
    await expect(page.getByTestId('progress')).toHaveText(/^3 \/ \d+$/);

    const input = page.getByTestId('run-input');
    await input.focus();
    await pressKey(page, 'End');
    const inputLength = await input.evaluate((node) => (node as HTMLTextAreaElement).value.length);
    let caret = await input.evaluate((node) => (node as HTMLTextAreaElement).selectionStart);
    expect(caret).toBe(inputLength);
    await pressKey(page, 'ArrowLeft');
    caret = await input.evaluate((node) => (node as HTMLTextAreaElement).selectionStart);
    expect(caret).toBe(inputLength - 1);
    await expect(page.getByTestId('progress')).toHaveText(/^3 \/ \d+/);

    const valueBeforeSpace = await input.inputValue();
    await pressKey(page, 'Space');
    await expect(page.getByTestId('play-btn')).toHaveText(/播放|Play/);
    await expect(page.getByTestId('progress')).toHaveText(/^3 \/ \d+/);
    expect((await input.inputValue()).length).toBeGreaterThan(valueBeforeSpace.length);

    const valueBeforeReset = await input.inputValue();
    await pressKey(page, 'r');
    await expect(page.getByTestId('progress')).toHaveText(/^3 \/ \d+/);
    await expect(page.getByTestId('play-btn')).toHaveText(/播放|Play/);
    expect(await input.inputValue()).not.toBe(valueBeforeReset);

    await openAdvancedPanels(page);
    await expect(page.getByTestId('reference-code-panel')).toBeVisible();
    const monaco = page.locator('.monaco-editor');
    await expect(monaco.first()).toBeVisible({ timeout: 45_000 });

    await monaco.first().click({ position: { x: 80, y: 40 } });
    await pressKey(page, 'ArrowRight');
    await expect(page.getByTestId('progress')).toHaveText(/^3 \/ \d+/);
    await pressKey(page, 'Space');
    await expect(page.getByTestId('play-btn')).toHaveText(/播放|Play/);
    await pressKey(page, 'R');
    await expect(page.getByTestId('progress')).toHaveText(/^3 \/ \d+/);

    await monaco.first().evaluate((node) => {
      node.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      }));
    });
    await expect(page.getByTestId('progress')).toHaveText(/^3 \/ \d+/);
  });

  test('shortcuts are scoped to algorithm pages and blocked by an open modal', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto('/');
    await expect(page.getByTestId('brand-name')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('play-btn')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Home');
    await page.keyboard.press('Space');
    await expect(page.getByTestId('play-btn')).toHaveCount(0);

    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    await openAlgorithm(page, 'bubble', '.bars');

    await page.evaluate(() => {
      const modal = document.createElement('div');
      modal.dataset.keyboardFixture = 'modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = '<button type="button">Modal action</button>';
      document.body.append(modal);
    });
    await page.getByRole('button', { name: 'Modal action' }).focus();
    await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+$/);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('End');
    await page.keyboard.press('R');
    await expect(page.getByTestId('progress')).toHaveText(/^1 \/ \d+/);
    await page.evaluate(() => document.querySelector('[data-keyboard-fixture="modal"]')?.remove());
  });

  test('390px keeps the hint readable, the language button native and graph panning intact', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?view=lab');
    await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
    const total = await openAlgorithm(page, 'bfs', 'graph-visual');
    await collapseAlgorithmGuide(page);

    const hint = page.getByTestId('keyboard-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('上一帧');
    const box = await hint.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(391);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);

    await focusWorkspace(page);
    await expect(page.getByTestId('play-btn')).toHaveText(/播放|Play/);
    const language = page.getByRole('button', { name: /切换语言|Switch language/ });
    await language.focus();
    await page.keyboard.press('Space');
    await expect(hint).toContainText('Previous');
    await expect(hint).toContainText('Play/Pause');
    await expect(page.getByTestId('prev-btn')).toHaveAttribute('title', 'Previous frame (←)');
    await expect(page.getByTestId('progress')).toHaveText(`1 / ${total}`);
    await expect(page.getByTestId('play-btn')).toHaveText(/Play/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);

    const scroller = page.getByTestId('graph-canvas-scroll');
    await scroller.focus();
    await expect(scroller).toBeFocused();
    const metrics = await scroller.evaluate((node) => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      scrollLeft: node.scrollLeft,
    }));
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
    await page.evaluate(() => {
      const probe = window as Window & { __keyboardArrowPrevented?: boolean };
      probe.__keyboardArrowPrevented = undefined;
      window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') probe.__keyboardArrowPrevented = event.defaultPrevented;
      }, { once: true });
    });
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('progress')).toHaveText(`1 / ${total}`);
    expect(await page.evaluate(() => (window as Window & { __keyboardArrowPrevented?: boolean }).__keyboardArrowPrevented)).toBe(false);
  });
});
