import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Resolve from the repo root (Vitest sets cwd there in CI and locally).
const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');
const app = readFileSync(resolve(process.cwd(), 'src/styles/app.css'), 'utf8') +
  '\n' + readFileSync(resolve(process.cwd(), 'src/styles/stage7a.css'), 'utf8') +
  '\n' + readFileSync(resolve(process.cwd(), 'src/styles/stage7b.css'), 'utf8');

const LIGHT_MARKER = ":root[data-theme='light']";
const [darkBlock, lightBlock] = tokens.split(LIGHT_MARKER);

function declared(block: string, name: string): boolean {
  return new RegExp(`--${name}\\s*:`, 'g').test(block);
}

describe('design token contract', () => {
  it('provides a light and a dark token block', () => {
    expect(darkBlock).toContain(':root');
    expect(lightBlock).toContain('color-scheme: light');
  });

  it('keeps every hardcoded colour inside tokens.css', () => {
    const literal = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;
    const offenders = app.match(literal) ?? [];
    expect(offenders).toEqual([]);
  });

  it('declares every token consumed by components in BOTH themes', () => {
    const used = new Set<string>();
    for (const match of app.matchAll(/var\(--([a-z0-9-]+)\)/g)) used.add(match[1]);
    expect(used.size).toBeGreaterThan(40);
    const missingDark = [...used].filter((name) => !declared(darkBlock, name));
    const missingLight = [...used].filter((name) => !declared(lightBlock, name));
    expect(missingDark).toEqual([]);
    expect(missingLight).toEqual([]);
  });

  it('gives the code editor its own token-driven palette in both themes', () => {
    for (const name of ['code-bg', 'code-fg', 'code-edge', 'code-edge-focus']) {
      expect(declared(darkBlock, name)).toBe(true);
      expect(declared(lightBlock, name)).toBe(true);
    }
    expect(app).toMatch(/\.codearea\s*\{[^}]*var\(--code-bg\)/);
    expect(app).toMatch(/\.codearea\s*\{[^}]*var\(--code-fg\)/);
  });

  it('has a mobile layout rule', () => {
    expect(app).toContain('@media (max-width: 760px)');
  });
});
