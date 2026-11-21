import { expect, test } from './fixtures';

test.describe('Sticky chrome and collapsed-directory navigation', () => {
  test('keeps the top bar and directory title frame fixed while content scrolls', async ({ page }) => {
    await page.goto('/?view=lab');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('brand-name')).toBeVisible();

    const topbar = page.locator('.topbar');
    const sidebar = page.getByTestId('sidebar');
    const topbarBox = await topbar.boundingBox();
    const sidebarBox = await sidebar.boundingBox();
    expect(topbarBox).not.toBeNull();
    expect(sidebarBox).not.toBeNull();
    expect(sidebarBox!.y).toBeGreaterThanOrEqual(topbarBox!.y + topbarBox!.height - 1);

    const head = sidebar.locator('.sidebar-head');
    await expect(head.getByTestId('sidebar-toggle-all')).toBeVisible();
    const headBefore = await head.boundingBox();
    const nav = sidebar.locator('.textbook-nav');
    await nav.evaluate((node) => {
      node.scrollTop = 600;
    });
    await expect.poll(async () => nav.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    const headAfter = await head.boundingBox();
    expect(headAfter!.y).toBeCloseTo(headBefore!.y, 0);

    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await expect(page.getByTestId('brand-name')).toBeInViewport();
    await expect(page.locator('.topbar')).toHaveCSS('position', 'sticky');
    const stuck = await topbar.boundingBox();
    expect(stuck!.y).toBeLessThanOrEqual(1);
  });

  test('expands the chosen chapter tree from the rail without touching the course', async ({ page }) => {
    await page.goto('/?view=lab');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 45_000 });

    const titleBefore = await page.getByTestId('lab-title').textContent();
    const scrollBefore = await page.evaluate(() => window.scrollY);

    await page.getByTestId('sidebar-collapse').click();
    await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');
    await page.getByTestId('rail-chapter-ch7-graph').click();

    await expect(page.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
    await expect(page.getByTestId('chapter-ch7-graph')).toHaveAttribute('aria-expanded', 'true');
    for (const topic of ['graph-traversal', 'graph-connectivity', 'mst', 'dag', 'shortest-path']) {
      await expect(page.getByTestId(`topic-${topic}`)).toHaveAttribute('aria-expanded', 'true');
    }
    await expect(page.getByTestId('algo-prim')).toBeVisible();

    const nav = page.getByTestId('sidebar').locator('.textbook-nav');
    await expect.poll(async () => nav.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await expect.poll(async () => Math.abs(await page.evaluate(() => {
      const list = document.querySelector<HTMLElement>('.textbook-nav');
      const chapter = document.querySelector<HTMLElement>('[data-chapter="ch7-graph"]');
      if (!list || !chapter) return Number.POSITIVE_INFINITY;
      return chapter.getBoundingClientRect().top - list.getBoundingClientRect().top;
    }))).toBeLessThanOrEqual(4);

    expect(await page.getByTestId('lab-title').textContent()).toBe(titleBefore);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  });

  test('keeps theory and visual directory marks in their accent colours', async ({ page }) => {
    await page.goto('/?view=lab');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 45_000 });
    await page.getByTestId('chapter-ch7-graph').click();
    await expect(page.getByTestId('chapter-ch7-graph')).toHaveAttribute('aria-expanded', 'true');

    const colors = await page.evaluate(() => {
      const resolve = (value: string) => {
        const probe = document.createElement('span');
        probe.style.color = value;
        document.body.appendChild(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const query = (category: string) => document.querySelector<HTMLElement>(
        `#chapter-ch7-graph-body [data-category="${category}"] .textbook-category`,
      );
      const theory = query('theory');
      const visual = query('visual');
      return {
        theory: theory ? getComputedStyle(theory).color : null,
        visual: visual ? getComputedStyle(visual).color : null,
        accent: resolve('var(--accent)'),
        accent2: resolve('var(--accent-2)'),
      };
    });

    expect(colors.theory).toBe(colors.accent);
    expect(colors.visual).toBe(colors.accent2);
    expect(colors.theory).not.toBe(colors.visual);
  });
});
