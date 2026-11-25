import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const tokens = read('src/styles/tokens.css');
const darkLayer = read('src/styles/diagram-theme-dark.css');
const main = read('src/main.tsx');

const LIGHT_MARKER = ":root[data-theme='light']";
const [darkBlock, lightBlock] = tokens.split(LIGHT_MARKER);

function declares(block: string, name: string): boolean {
  return new RegExp(`--${name}\\s*:`).test(block);
}

describe('DARK-DIAGRAM-01 dark theme contract', () => {
  it('declares the shared legacy aliases in both themes', () => {
    const aliases = [
      'line',
      'line-soft',
      'ink',
      'text',
      'text-muted',
      'surface-soft',
      'accent-soft',
      'accent-contrast',
      'positive',
      'positive-soft',
      'positive-strong',
      'diagram-violet',
    ];
    for (const alias of aliases) {
      expect(declares(darkBlock, alias), `dark --${alias}`).toBe(true);
      expect(declares(lightBlock, alias), `light --${alias}`).toBe(true);
    }
  });

  it('does not hardcode colours in the dark diagram layer', () => {
    const literal = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;
    expect(darkLayer.match(literal) ?? []).toEqual([]);
  });

  it('only targets dark mode and never uses blanket inversion', () => {
    expect(darkLayer).not.toContain("data-theme='light'");
    expect(darkLayer).not.toMatch(/filter\s*:\s*invert/i);
    const selectors = darkLayer.match(/^:root\[data-theme='dark'\][^{]+/gm) ?? [];
    expect(selectors.length).toBeGreaterThan(40);
    expect(selectors.every((selector) => selector.trim().length > 0)).toBe(true);
  });

  it('covers all chapter diagram families that previously used fixed light colours', () => {
    const families = [
      '.ext-io-strip',
      '.file-block',
      '.inverted-term',
      '.search-visual-head',
      '.bplus-node rect',
      '.key-tree-dictionary',
      '.sort10-node rect',
      '.sort10-bucket',
      '.gl-node-box',
      '.array-cell.is-selected',
      '.btree-promoted text',
    ];
    for (const selector of families) {
      expect(darkLayer, selector).toContain(selector);
    }
  });

  it('loads the dark layer after the base styles', () => {
    expect(main).toContain("import './styles/diagram-theme-dark.css';");
    expect(main.indexOf("diagram-theme-dark.css")).toBeGreaterThan(main.indexOf("fullscreen01.css"));
  });
});
