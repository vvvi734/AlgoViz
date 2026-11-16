/**
 * Monaco theming. The editor reads its colours from the SAME CSS variables the
 * rest of the app uses (defined in `styles/tokens.css`), so Light / Dark /
 * System always match the surrounding UI. Callers must invoke this AFTER the
 * `<html data-theme>` attribute has been updated, which the component ensures
 * by deferring one macrotask.
 */
import type { Monaco } from './monaco-setup';
import type { ResolvedTheme } from '../../theme/resolve';

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** (Re)define the single `algolens` theme from the current token values. */
export function applyAlgoLensTheme(monaco: Monaco, theme: ResolvedTheme): void {
  const bg = readCssVar('--code-bg', '#1e1e1e');
  const fg = readCssVar('--code-fg', '#d4d4d4');
  const muted = readCssVar('--muted', '#858585');
  const txt = readCssVar('--txt', '#c6c6c6');
  const accent = readCssVar('--accent', '#087a69');
  const accent2 = readCssVar('--accent-2', '#569cd6');
  const warn = readCssVar('--warn', '#ce9178');
  const red = readCssVar('--red', '#f14c4c');
  const edge = readCssVar('--edge', '#404040');
  const selection = readCssVar('--code-selection', '#264f78');
  const lineHighlight = readCssVar('--code-line-highlight', '#ffffff08');
  const panel = readCssVar('--panel', '#252526');

  monaco.editor.defineTheme('algolens', {
    base: theme === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: muted, fontStyle: 'italic' },
      { token: 'keyword', foreground: accent2 },
      { token: 'string', foreground: warn },
      { token: 'number', foreground: accent },
      { token: 'type', foreground: accent2 },
      { token: 'identifier', foreground: fg },
      { token: 'delimiter', foreground: fg },
    ],
    colors: {
      'editor.background': bg,
      'editor.foreground': fg,
      'editorLineNumber.foreground': muted,
      'editorLineNumber.activeForeground': txt,
      'editorCursor.foreground': accent,
      'editor.selectionBackground': selection,
      'editor.inactiveSelectionBackground': selection,
      'editor.lineHighlightBackground': lineHighlight,
      'editor.lineHighlightBorder': '#00000000',
      'editorIndentGuide.background1': edge,
      'editorBracketMatch.background': lineHighlight,
      'editorError.foreground': red,
      'editorWarning.foreground': warn,
      'editorGutter.background': bg,
      'editorWidget.background': panel,
      'editorWidget.border': edge,
      'scrollbarSlider.background': edge,
      'scrollbarSlider.hoverBackground': edge,
      'minimap.background': bg,
    },
  });

  monaco.editor.setTheme('algolens');
}
