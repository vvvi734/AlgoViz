import { afterEach } from 'vitest';

type Listener = (event: MediaQueryListEvent) => void;

interface MockMediaQueryList extends MediaQueryList {
  setMatches: (value: boolean) => void;
}

const listeners = new Set<Listener>();
let dark = true;

function makeQuery(media: string): MockMediaQueryList {
  const query = {
    media,
    get matches() { return dark; },
    onchange: null,
    addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
    addListener: (listener: Listener) => listeners.add(listener),
    removeListener: (listener: Listener) => listeners.delete(listener),
    dispatchEvent: () => true,
    setMatches: (value: boolean) => {
      dark = value;
      for (const listener of listeners) {
        listener({ matches: value, media } as MediaQueryListEvent);
      }
    },
  } as unknown as MockMediaQueryList;
  return query;
}

const queries = new Map<string, MockMediaQueryList>();

/**
 * The MCP protocol tests run in the node environment (no DOM) while sharing
 * this setup file, so every browser-only fixture is guarded instead of
 * dragging jsdom into them.
 */
const hasDom = typeof window !== 'undefined';

if (hasDom) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (media: string) => {
      if (!queries.has(media)) queries.set(media, makeQuery(media));
      return queries.get(media)!;
    },
  });
}

/** Test helper: emulate an OS-level light/dark switch. */
export function setSystemDark(value: boolean): void {
  dark = value;
  for (const query of queries.values()) query.setMatches(value);
}

export function systemIsDark(): boolean {
  return dark;
}

afterEach(() => {
  if (!hasDom) return;
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-theme-preference');
  document.documentElement.style.colorScheme = '';
  setSystemDark(true);
});
