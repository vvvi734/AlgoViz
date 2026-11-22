import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { useLocalPyodide } from './pyodide-local';

/**
 * Every browser test gets the real Pyodide 0.27.7 distribution from the local
 * npm package. The app's CDN URL is untouched; only the transport is local, so
 * workers, Python execution and Trace stay real even when jsDelivr is blocked.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await useLocalPyodide(page);
    await use(page);
  },
});

export { expect };
export type { Page };

/**
 * The run bar is always open now. Tests that need the JSON input simply wait
 * for the dock and its visible input; there is no editor to expand.
 */
export async function openCodePanel(page: Page) {
  await expect(page.getByTestId('code-dock')).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('#run-input')).toBeVisible({ timeout: 45_000 });
}

/**
 * UX-01 adds an expanded guide above the old workspace. Tests that measure the
 * pre-existing first-screen layout fold it first so they keep verifying the
 * two-column workspace and dock rather than the new guide height.
 */
export async function collapseAlgorithmGuide(page: Page) {
  const toggle = page.getByTestId('guide-toggle');
  if ((await toggle.count()) === 0) return;
  await expect(toggle).toBeVisible();
  if ((await toggle.getAttribute('aria-expanded')) === 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('algorithm-guide')).toHaveCount(0);
}

/**
 * UX-02 folds the course step list by default so the rail stays short. Tests
 * that jump by step id open this disclosure first; the jump still uses the same
 * real trace frames and the same playback controller.
 */
export async function openLessonStepNav(page: Page) {
  await expect(page.getByTestId('rail-stage-jumps')).toBeVisible({ timeout: 45_000 });
}

/**
 * CORE-REFINE-01: the advanced disclosure now owns only the C / C++ / Python
 * reference-code viewer. Variables, the call stack and the trace state stay
 * in the always-visible learning rail; open this before reading reference code.
 */
export async function openAdvancedPanels(page: Page) {
  const toggle = page.getByTestId('workspace-tabs-toggle');
  await expect(toggle).toBeVisible({ timeout: 45_000 });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('workspace-tabs')).toHaveAttribute('data-expanded', 'true');
}

export type GraphE2EDraft = {
  nodes: string[];
  edges: Array<[string, string] | [string, string, number] | { from: string; to: string; weight?: number }>;
  start?: string;
  target?: string;
  directed?: boolean;
};

/**
 * INPUT-06 replaced the graph JSON textarea with a node/edge table. Exercise the
 * same controls a learner uses instead of writing JSON into the first node label
 * (which is what `#run-input` now points at for graph courses).
 */
export async function fillGraphDraft(page: Page, draft: GraphE2EDraft) {
  await expect(page.getByTestId('graph-input-editor')).toBeVisible({ timeout: 45_000 });

  // The direction is fixed by the algorithm for directed/undirected lessons.
  // Only an optional-direction graph exposes the checkbox; preserve its
  // product default unless the test explicitly needs a direction.
  const directed = page.getByTestId('graph-directed');
  if (draft.directed !== undefined && (await directed.count()) > 0) {
    await directed.setChecked(draft.directed);
  }

  const removeNode = page.getByTestId('graph-node-remove');
  while ((await removeNode.count()) > 0) {
    await removeNode.first().click();
  }

  for (const node of draft.nodes) {
    await page.getByTestId('graph-add-node').click();
    await page.getByTestId('graph-node-input').last().fill(node);
  }

  for (const edge of draft.edges) {
    const from = Array.isArray(edge) ? edge[0] : edge.from;
    const to = Array.isArray(edge) ? edge[1] : edge.to;
    const weight = Array.isArray(edge) ? edge[2] : edge.weight;
    await page.getByTestId('graph-add-edge').click();
    await page.getByTestId('graph-edge-from').last().selectOption(from);
    await page.getByTestId('graph-edge-to').last().selectOption(to);
    if (weight !== undefined) {
      await page.getByTestId('graph-input-edge-weight').last().fill(String(weight));
    }
  }

  if (draft.start !== undefined && (await page.getByTestId('graph-start').count()) > 0) {
    await page.getByTestId('graph-start').selectOption(draft.start);
  }
  if (draft.target !== undefined && (await page.getByTestId('graph-target').count()) > 0) {
    await page.getByTestId('graph-target').selectOption(draft.target);
  }
}

export async function runGraphDraft(page: Page, draft: GraphE2EDraft, total: number) {
  await fillGraphDraft(page, draft);
  await page.getByTestId('run-btn').click();
  await expect(page.locator('[data-testid="progress"]')).toHaveText(`1 / ${total}`, { timeout: 60_000 });
}

/**
 * Run a graph draft and read the real frame count. Use this when a fixture's
 * trace length is a product result rather than a hard-coded test constant.
 */
export async function runGraphDraftResult(page: Page, draft: GraphE2EDraft): Promise<number> {
  await fillGraphDraft(page, draft);
  await page.getByTestId('run-btn').click();
  await expect(page.locator('[data-testid="run-feedback"]')).toContainText(
    /动画已生成|Visualization ready/,
    { timeout: 90_000 },
  );
  await expect(page.locator('[data-testid="progress"]')).toHaveText(/^1 \/ \d+$/, {
    timeout: 90_000,
  });
  const progress = (await page.locator('[data-testid="progress"]').textContent()) ?? '1 / 0';
  return Number(progress.split('/')[1]?.trim());
}

/**
 * Expand one real disclosure button. Chapter/topic bodies animate from 0fr to
 * 1fr; a click issued while the surrounding layout is still moving can miss the
 * button and leave `aria-expanded="false"`. Retry once, then wait for the 200 ms
 * open transition so the next row is physically stable before it is clicked.
 * The expanded state is still asserted; this does not relax a test.
 */
async function expandDisclosure(page: Page, control: Locator) {
  if ((await control.getAttribute('aria-expanded')) === 'true') return;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await control.click();
    try {
      await expect(control).toHaveAttribute('aria-expanded', 'true', { timeout: 2_000 });
      await page.waitForTimeout(250);
      return;
    } catch (error) {
      if (attempt === 1) throw error;
      await page.waitForTimeout(250);
    }
  }
}

/**
 * UX-03: the directory opens only the current algorithm's chapter/topic. A
 * desktop click must therefore find an algorithm's authored path and expand it
 * first. The mobile select remains a single, real `selectOption` call.
 */
export async function openTextbookChapter(page: Page, chapterId: string) {
  const sidebar = page.getByTestId('sidebar');
  if ((await sidebar.getAttribute('data-collapsed')) === 'true') {
    await page.getByTestId('sidebar-expand').click();
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false');
  }
  const chapter = page.getByTestId(`chapter-${chapterId}`);
  await expect(chapter).toBeVisible();
  await expandDisclosure(page, chapter);
  await expect(chapter).toHaveAttribute('aria-expanded', 'true');
}

export async function openTextbookTopic(page: Page, topicId: string) {
  const topic = page.getByTestId(`topic-${topicId}`);

  // A third-level algorithm/concept row can only be visible after its parent
  // group is open. Open that parent first instead of assuming every row is
  // top-level (the textbook gained a third hierarchy level).
  const parentId = await topic.getAttribute('data-parent-topic');
  if (parentId) {
    const parent = page.getByTestId(`topic-${parentId}`);
    if ((await parent.count()) > 0 && (await parent.isVisible())) {
      await expandDisclosure(page, parent);
      await expect(parent).toHaveAttribute('aria-expanded', 'true');
    }
  }

  await expect(topic).toBeVisible();
  // Direct rows have no disclosure at all. Only real disclosure groups expose
  // `aria-expanded`; both top-level and third-level direct rows simply return.
  if ((await topic.getAttribute('aria-expanded')) === null) return;
  await expandDisclosure(page, topic);
  await expect(topic).toHaveAttribute('aria-expanded', 'true');
}

/** Choose a real registry algorithm through the current textbook directory. */
export async function selectAlgorithm(page: Page, id: string) {
  const mobile = page.getByTestId('mobile-algo-select');
  if (await mobile.isVisible()) {
    await mobile.selectOption(id);
    return;
  }

  const item = page.getByTestId(`algo-${id}`);
  await expect(item).toHaveCount(1);
  const chapterId = await item.getAttribute('data-chapter');
  const topicId = await item.getAttribute('data-topic');
  if (!chapterId || !topicId) throw new Error(`algorithm ${id} is not in the textbook directory`);
  await openTextbookChapter(page, chapterId);
  await openTextbookTopic(page, topicId);
  await expect(item).toBeVisible();
  await item.click();
}
