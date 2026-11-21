import { expect, selectAlgorithm, test } from './fixtures';

type LayoutMetrics = {
  docOverflow: number;
  pageOverflow: number;
  flowOverflow: number;
  desktopDisplay: string;
  mobileDisplay: string;
  nodeTextOverflow: string[];
};

async function readLayout(page: Parameters<typeof selectAlgorithm>[0]): Promise<LayoutMetrics> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const page = document.querySelector<HTMLElement>('.concept-page, .lab-shell');
    const flow = document.querySelector<HTMLElement>('.algorithm-flow');
    const desktop = document.querySelector<HTMLElement>('.algorithm-flow-desktop');
    const mobile = document.querySelector<HTMLElement>('.algorithm-flow-mobile');
    const nodeTextOverflow: string[] = [];
    for (const group of document.querySelectorAll<SVGGElement>('[data-node-kind]')) {
      const shape = group.querySelector<SVGPathElement>('.flow-node-shape')?.getBBox();
      if (!shape) continue;
      for (const text of group.querySelectorAll<SVGTextElement>('text')) {
        const box = text.getBBox();
        if (box.x < shape.x - 1 || box.x + box.width > shape.x + shape.width + 1) {
          nodeTextOverflow.push(
            `${group.dataset.nodeId}:${box.x.toFixed(1)}..${(box.x + box.width).toFixed(1)} / ${shape.x.toFixed(1)}..${(shape.x + shape.width).toFixed(1)}`,
          );
        }
      }
    }
    return {
      docOverflow: root.scrollWidth - root.clientWidth,
      pageOverflow: page ? page.scrollWidth - page.clientWidth : 0,
      flowOverflow: flow ? flow.scrollWidth - flow.clientWidth : 0,
      desktopDisplay: desktop ? getComputedStyle(desktop).display : 'missing',
      mobileDisplay: mobile ? getComputedStyle(mobile).display : 'missing',
      nodeTextOverflow,
    };
  });
}

test('VISUAL-02 theory and flow layout have no page overflow at desktop or mobile widths', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('concept-page')).toBeVisible({ timeout: 60_000 });

  for (const width of [1440, 1280, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.waitForTimeout(100);
    const metrics = await readLayout(page);
    expect(metrics.docOverflow, `concept doc @${width}`).toBeLessThanOrEqual(2);
    expect(metrics.pageOverflow, `concept page @${width}`).toBeLessThanOrEqual(2);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await selectAlgorithm(page, 'scc');
  await expect(page.getByTestId('algorithm-flow')).toBeVisible({ timeout: 120_000 });

  for (const width of [1440, 1280, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.waitForTimeout(100);
    const metrics = await readLayout(page);
    expect(metrics.docOverflow, `flow doc @${width}`).toBeLessThanOrEqual(2);
    expect(metrics.pageOverflow, `flow page @${width}`).toBeLessThanOrEqual(2);
    expect(metrics.flowOverflow, `flow block @${width}`).toBeLessThanOrEqual(2);
    expect(metrics.nodeTextOverflow, `flow node text @${width}`).toEqual([]);
    expect(metrics.desktopDisplay, `flow desktop @${width}`).toBe(width > 1100 ? 'block' : 'none');
    expect(metrics.mobileDisplay, `flow mobile @${width}`).toBe(width > 1100 ? 'none' : 'block');
  }
});
