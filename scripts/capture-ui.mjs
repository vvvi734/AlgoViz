import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2] ?? 'docs/stage7a/before';
const base = process.env.ALGOLENS_URL ?? 'http://127.0.0.1:4173';
const viewports = [
  { name: '1920', width: 1920, height: 1080 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
];
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-quic'] });
const report = [];
for (const vp of viewports) {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await page.locator('.monaco-editor').waitFor({ timeout: 45_000 });
    await page.selectOption('#theme-select', theme);
    await page.waitForTimeout(600);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyHeight: document.body.scrollHeight,
      shell: (() => {
        const el = document.querySelector('.lab-shell');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), width: Math.round(r.width), columns: getComputedStyle(el).gridTemplateColumns };
      })(),
      primary: (() => {
        const el = document.querySelector('.lab-primary');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), width: Math.round(r.width), columns: getComputedStyle(el).gridTemplateColumns };
      })(),
      stage: (() => {
        const el = document.querySelector('[data-testid="visual-stage"]');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), width: Math.round(r.width), height: Math.round(r.height) };
      })(),
      code: (() => {
        const el = document.querySelector('.monaco-editor');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), width: Math.round(r.width), height: Math.round(r.height) };
      })(),
      currentStep: (() => {
        const el = document.querySelector('[data-testid="current-step"]');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { y: Math.round(r.y), height: Math.round(r.height) };
      })(),
      tabs: (() => {
        const el = document.querySelector('[data-testid="workspace-tabs"]');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { y: Math.round(r.y), height: Math.round(r.height) };
      })(),
    }));
    const file = path.join(outDir, `${vp.name}-${theme}.png`);
    await page.screenshot({ path: file, fullPage: false });
    await page.screenshot({ path: path.join(outDir, `${vp.name}-${theme}-full.png`), fullPage: true });
    report.push({ viewport: vp.name, theme, file, overflowX: metrics.scrollWidth > metrics.clientWidth, ...metrics, errors });
    if (theme === 'light') {
      await page.click('[data-testid="workspace-tab-mentor"]');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outDir, `${vp.name}-ai.png`), fullPage: false });
    }
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'metrics.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
