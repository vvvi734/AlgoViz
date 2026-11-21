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
      // React's value tracker remembers the last programmatic value. After a
      // re-run resets the trace, seeking to the same frame would be skipped as a
      // no-op, so nudge the range to the opposite end before applying the target.
      if (input.value === String(value)) apply(value === 0 ? 1 : 0);
      apply(value);
    }, frame);
    // A freshly installed trace queued the playback reset effect; a seek made
    // in that same commit window can be overwritten. Re-apply until it sticks.
    await page.waitForTimeout(80);
    const label = await page.getByTestId('progress').textContent();
    if (label === `${frame + 1} / ${total}`) return;
  }
  await expect(page.getByTestId('progress')).toHaveText(`${frame + 1} / ${total}`);
}

async function seekLast(page: Page) {
  const total = await totalFrames(page);
  await setFrame(page, total - 1, total);
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

async function seekLastMatching(
  page: Page,
  testId: string,
  attributes: Record<string, string>,
): Promise<number> {
  const visual = page.getByTestId(testId);
  const total = await totalFrames(page);
  for (let index = total - 1; index >= 0; index -= 1) {
    await setFrame(page, index, total);
    const matches = await visual.evaluate((node, expected) => {
      const element = node as HTMLElement;
      return Object.entries(expected).every(([key, value]) => element.dataset[key] === value);
    }, attributes);
    if (matches) return index;
  }
  throw new Error(`no frame matched ${testId} ${JSON.stringify(attributes)}`);
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
  // The new event array mounts in the same commit as the "ready" status, while
  // usePlayback still has to flush its effect that resets the playhead. Wait
  // two frames so a subsequent seek is not overwritten by that reset.
  await settle(page);
}

async function frameValues(page: Page, testId: string, attributes: Record<string, string>) {
  return page.getByTestId(testId).evaluateAll((nodes, expected) =>
    nodes
      .filter((node) => {
        const element = node as HTMLElement;
        return Object.entries(expected).every(([key, value]) => element.dataset[key] === value);
      })
      .map((node) => (node as HTMLElement).dataset.value ?? ''),
    attributes,
  );
}

async function heapValues(page: Page): Promise<number[]> {
  return page.getByTestId('heap-slot').evaluateAll((nodes) =>
    nodes
      .map((node) => ({
        slot: Number((node as HTMLElement).dataset.slot),
        value: Number((node as HTMLElement).dataset.value),
      }))
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => entry.value),
  );
}

function isMaxHeap(values: number[]): boolean {
  return values.every((value, index) => index === 0 || values[Math.floor((index - 1) / 2)]! >= value);
}

test.describe('INPUT-05 — real custom tree, heap and Huffman traces', () => {
  test('traversal: custom null slots drive preorder and level-order node/queue output', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'inorder', 'tree-visual');

    await page.getByTestId('tree-nodes').fill('4, 2, 6, null, 3');
    await page.getByTestId('tree-mode-preorder').click();
    await runCurrent(page);
    await expect(page.getByTestId('tree-visual')).toHaveAttribute('data-traversal', 'preorder');
    await expect(page.getByTestId('tree-node')).toHaveCount(4);
    await expect(page.getByTestId('tree-node').filter({ hasText: '3' })).toHaveCount(1);

    await seekLast(page);
    const labels = await page.getByTestId('tree-node').evaluateAll((nodes) =>
      Object.fromEntries(
        nodes.map((node) => [
          (node as HTMLElement).dataset.nodeId,
          (node as HTMLElement).dataset.value,
        ]),
      ),
    );
    const visited = await page.getByTestId('tree-visited-item').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).dataset.nodeId),
    );
    expect(visited.map((id) => labels[id ?? ''])).toEqual(['4', '2', '3', '6']);

    await page.getByTestId('tree-mode-levelorder').click();
    await runCurrent(page);
    await expect(page.getByTestId('tree-visual')).toHaveAttribute('data-traversal', 'levelorder');
    await expect(page.getByTestId('tree-queue')).toBeVisible();
    await seekLast(page);
    const levelOrder = await page.getByTestId('tree-visited-item').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).dataset.nodeId),
    );
    expect(levelOrder.map((id) => labels[id ?? ''])).toEqual(['4', '2', '6', '3']);
    await expect(page.getByTestId('tree-queue')).toHaveAttribute('data-queue-count', '0');
  });

  test('BST: leaf, one-child and two-child deletes expose real cases and final nodes', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'bst', 'bst-visual');

    await page.getByTestId('tree-command').selectOption('delete');
    await page.getByTestId('tree-sequence').fill('50, 30, 70, 20');
    await page.getByTestId('tree-target').fill('30');
    await runCurrent(page);
    await seekMatching(page, 'bst-visual', { operation: 'delete-one', deleteCase: 'one-child' });
    await expect(page.getByTestId('bst-case-one-child')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('bst-removed')).toBeVisible();
    await seekLast(page);
    expect(await frameValues(page, 'bst-node', {})).toEqual(expect.arrayContaining(['20', '50', '70']));
    expect(await frameValues(page, 'bst-node', {})).toHaveLength(3);
    await expect(page.getByTestId('bst-result')).toHaveAttribute('data-result', 'deleted');

    await page.getByTestId('tree-sequence').fill('50, 30, 70, 20, 40, 60, 80');
    await page.getByTestId('tree-target').fill('50');
    await runCurrent(page);
    await seekMatching(page, 'bst-visual', { operation: 'transplant', deleteCase: 'two-child' });
    await expect(page.getByTestId('bst-case-two-child')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('bst-visual')).toHaveAttribute('data-successor-id', /.+/);
    await seekLast(page);
    const after = await frameValues(page, 'bst-node', {});
    expect(after).toHaveLength(6);
    expect(after).not.toContain('50');
    expect(after).toEqual(expect.arrayContaining(['60', '70', '80', '20', '30', '40']));
    await expect(page.getByTestId('bst-root')).toContainText('60');

    await page.getByTestId('tree-sequence').fill('50, 30, 70, 20, 40, 60, 80');
    await page.getByTestId('tree-target').fill('20');
    await runCurrent(page);
    await seekMatching(page, 'bst-visual', { operation: 'delete-leaf', deleteCase: 'leaf' });
    await expect(page.getByTestId('bst-case-leaf')).toHaveAttribute('data-active', 'true');
    await seekLast(page);
    const leafAfter = await frameValues(page, 'bst-node', {});
    expect(leafAfter).toHaveLength(6);
    expect(leafAfter).not.toContain('20');
    expect(leafAfter).toEqual(expect.arrayContaining(['50', '30', '70', '40', '60', '80']));
  });

  test('AVL: four custom insertion sequences produce LL / RR / LR / RL with valid heights', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'avl', 'avl-visual');

    const cases = [
      { sequence: '30, 20, 40, 10', target: '5', rotation: 'LL' },
      { sequence: '30, 20, 40, 50', target: '60', rotation: 'RR' },
      { sequence: '50, 30, 70, 20, 40, 60, 80, 10, 25', target: '27', rotation: 'LR' },
      { sequence: '50, 30, 70, 80, 60', target: '55', rotation: 'RL' },
    ];

    for (const item of cases) {
      await page.getByTestId('tree-sequence').fill(item.sequence);
      await page.getByTestId('tree-target').fill(item.target);
      await runCurrent(page);
      await seekMatching(page, 'avl-visual', { rotationCase: item.rotation, rotationPhase: 'before' });
      await expect(page.getByTestId('avl-rotation-chip')).toHaveAttribute('data-case', item.rotation);
      await expect(page.getByTestId('avl-visual')).not.toHaveAttribute('data-imbalance-id', '');
      await seekLastMatching(page, 'avl-visual', { rotationCase: item.rotation, rotationPhase: 'after' });
      await expect(page.getByTestId('avl-rotation-chip')).toHaveAttribute('data-case', item.rotation);
      const balance = await page.getByTestId('avl-node').evaluateAll((nodes) =>
        nodes.map((node) => Number((node as HTMLElement).dataset.balance)),
      );
      expect(balance.every((value) => value >= -1 && value <= 1)).toBe(true);
      const heights = await page.getByTestId('avl-node').evaluateAll((nodes) =>
        nodes.map((node) => Number((node as HTMLElement).dataset.height)),
      );
      expect(heights.every((value) => value >= 1)).toBe(true);
      await seekLast(page);
      await expect(page.getByTestId('avl-visual')).toHaveAttribute('data-result', 'inserted');
      await expect(page.getByTestId('avl-node')).toHaveCount(item.sequence.split(',').length + 1);
    }
  });

  test('B-tree: child split keeps the root and root split grows a new root', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'btree', 'btree-visual');

    async function splitFrames() {
      const total = await totalFrames(page);
      const frames: Array<{ index: number; rootId: string; promoted: number; left: number; right: number }> = [];
      for (let index = 0; index < total; index += 1) {
        await setFrame(page, index, total);
        if ((await page.getByTestId('btree-visual').getAttribute('data-operation')) !== 'split') continue;
        frames.push({
          index,
          rootId: (await page.getByTestId('btree-visual').getAttribute('data-root-id')) ?? '',
          promoted: await page.getByTestId('btree-promoted').count(),
          left: await page.locator('[data-testid="btree-node"][data-split-left="true"]').count(),
          right: await page.locator('[data-testid="btree-node"][data-split-right="true"]').count(),
        });
      }
      return frames;
    }

    await page.getByTestId('tree-command').selectOption('insert');
    await page.getByTestId('tree-sequence').fill('10, 20, 30, 40, 50, 60, 70');
    await page.getByTestId('tree-target').fill('80');
    await runCurrent(page);
    const child = await splitFrames();
    const childBefore = child.find((frame) => frame.promoted === 0);
    const childAfter = child.find((frame) => frame.promoted === 1 && frame.left === 1 && frame.right === 1);
    expect(childBefore).toBeTruthy();
    expect(childAfter).toBeTruthy();
    expect(childBefore!.rootId).toBe(childAfter!.rootId);

    await page.getByTestId('tree-sequence').fill('10, 20, 30');
    await page.getByTestId('tree-target').fill('40');
    await runCurrent(page);
    const root = await splitFrames();
    const rootBefore = root.find((frame) => frame.promoted === 0);
    const rootAfter = root.find((frame) => frame.promoted === 1);
    expect(rootBefore).toBeTruthy();
    expect(rootAfter).toBeTruthy();
    expect(rootBefore!.rootId).not.toBe(rootAfter!.rootId);
    await setFrame(page, rootAfter!.index, await totalFrames(page));
    await expect(page.locator('[data-testid="btree-node"][data-new-root="true"]')).toHaveCount(1);

    await seekLast(page);
    const nodes = await page.getByTestId('btree-node').evaluateAll((items) =>
      items.map((node) => {
        const element = node as HTMLElement;
        const keys = Array.from(element.querySelectorAll('[data-testid="btree-key"]')).map((key) =>
          Number((key as HTMLElement).dataset.keyValue),
        );
        return {
          leaf: element.dataset.leaf === 'true',
          depth: Number(element.dataset.depth),
          keys,
        };
      }),
    );
    expect(nodes.every((node) => node.keys.length <= 3)).toBe(true);
    expect(nodes.every((node) => node.keys.every((key, index) => index === 0 || node.keys[index - 1]! < key))).toBe(true);
    const leafDepths = nodes.filter((node) => node.leaf).map((node) => node.depth);
    expect(new Set(leafDepths).size).toBe(1);
  });

  test('heap: push sifts up and extract sifts down with real swaps and heap intervals', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'heap', 'heap-visual');

    async function swapCount() {
      const total = await totalFrames(page);
      let count = 0;
      for (let index = 0; index < total; index += 1) {
        await setFrame(page, index, total);
        if ((await page.getByTestId('heap-visual').getAttribute('data-operation')) === 'swap') count += 1;
      }
      return count;
    }

    await page.getByTestId('heap-operation').selectOption('push');
    await page.getByTestId('heap-values').fill('5, 3, 4, 1, 2');
    await page.getByTestId('heap-value').fill('10');
    await runCurrent(page);
    await expect(page.getByTestId('heap-visual')).toHaveAttribute('data-command', 'push');
    expect(await swapCount()).toBeGreaterThanOrEqual(2);
    await seekLast(page);
    const pushed = await heapValues(page);
    expect(pushed).toEqual([10, 3, 5, 1, 2, 4]);
    expect(isMaxHeap(pushed)).toBe(true);
    await expect(page.getByTestId('heap-visual')).toHaveAttribute('data-heap-size', '6');

    await page.getByTestId('heap-operation').selectOption('extract');
    await page.getByTestId('heap-values').fill('9, 7, 8, 3, 2, 1, 0');
    await runCurrent(page);
    await expect(page.getByTestId('heap-visual')).toHaveAttribute('data-command', 'extract');
    expect(await swapCount()).toBeGreaterThanOrEqual(2);
    await seekLast(page);
    const extracted = await heapValues(page);
    expect(extracted).toEqual([8, 7, 1, 3, 2, 0]);
    expect(isMaxHeap(extracted)).toBe(true);
    await expect(page.getByTestId('heap-visual')).toHaveAttribute('data-heap-size', '6');
  });

  test('Huffman: custom weights rebuild WPL, codes, equal ties and the single-symbol boundary', async ({ page }) => {
    test.setTimeout(300_000);
    await openAlgorithm(page, 'huffman', 'huffman-visual');

    await page.getByTestId('huffman-symbols').fill('A: 5\nB: 9\nC: 12\nD: 13');
    await runCurrent(page);
    await seekLast(page);
    await expect(page.getByTestId('huffman-visual')).toHaveAttribute('data-total-weight', '39');
    await expect(page.getByTestId('huffman-visual')).toHaveAttribute('data-wpl', '78');
    await expect(page.getByTestId('huffman-visual')).toHaveAttribute('data-total-bits', '78');
    await expect(page.getByTestId('huffman-code-row')).toHaveCount(4);
    const bits = await page.getByTestId('huffman-code-row').evaluateAll((rows) =>
      rows.map((row) => (row as HTMLElement).dataset.code ?? ''),
    );
    expect(bits.map((code) => code.length)).toEqual([2, 2, 2, 2]);
    expect(new Set(bits).size).toBe(4);

    await page.getByTestId('huffman-symbols').fill('A: 5\nB: 5\nC: 5\nD: 5');
    await runCurrent(page);
    await seekLast(page);
    await expect(page.getByTestId('huffman-visual')).toHaveAttribute('data-wpl', '40');
    const firstCodes = await page.getByTestId('huffman-code-row').evaluateAll((rows) =>
      rows.map((row) => (row as HTMLElement).dataset.code ?? ''),
    );
    await runCurrent(page);
    await seekLast(page);
    const secondCodes = await page.getByTestId('huffman-code-row').evaluateAll((rows) =>
      rows.map((row) => (row as HTMLElement).dataset.code ?? ''),
    );
    expect(secondCodes).toEqual(firstCodes);

    await page.getByTestId('huffman-symbols').fill('Z: 7');
    await runCurrent(page);
    await seekLast(page);
    await expect(page.getByTestId('huffman-visual')).toHaveAttribute('data-wpl', '0');
    await expect(page.getByTestId('huffman-visual')).toHaveAttribute('data-total-bits', '7');
    await expect(page.getByTestId('huffman-single-note')).toBeVisible();
    await expect(page.getByTestId('huffman-code-row')).toHaveCount(1);
    await expect(page.getByTestId('huffman-code-row')).toContainText('0');
  });
});
