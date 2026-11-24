/**
 * Keeps teaching text at its original visual size while the fullscreen world
 * scales the algorithm artwork.
 *
 * The shared VisualStage mixes two rendering models:
 * - HTML nodes, cells and labels (sorting, linked lists, trees, memory tables);
 * - SVG primitives and <text> nodes (graphs, B/B+ trees, diagrams).
 *
 * Scaling the world with CSS `transform: scale()` unavoidably scales both, so
 * each text node receives the inverse font size. `getComputedStyle` is read
 * before that element is touched and cached on the DOM node, which preserves
 * every component's own typography (including the tree visual's existing
 * internal fit compensation). Because only `font-size` changes, shape borders,
 * node boxes, edges and layout positions still scale with the world, and text
 * remains attached to the node it belongs to.
 */

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const BASE_FONT_ATTRIBUTE = 'data-fullscreen-base-font';
const INLINE_FONT_ATTRIBUTE = 'data-fullscreen-inline-font';
const INLINE_PRIORITY_ATTRIBUTE = 'data-fullscreen-inline-priority';

/** The font size an element needs locally so the scaled world renders it at `base`. */
export function scopedTextFontSize(baseFontPx: number, zoom: number): number {
  if (!Number.isFinite(baseFontPx) || baseFontPx <= 0) return 0;
  if (!Number.isFinite(zoom) || zoom <= 0) return baseFontPx;
  return baseFontPx / zoom;
}

function hasDirectText(element: Element): boolean {
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())) return true;
  }
  return false;
}

function isSvgText(element: Element): boolean {
  return element.namespaceURI === SVG_NAMESPACE && element.tagName.toLowerCase() === 'text';
}

function isCandidate(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  if (tag === 'script' || tag === 'style' || tag === 'template' || tag === 'noscript') return false;
  // Text inside SVG titles is tooltip metadata, not painted glyphs.
  if (element.closest('title')) return false;
  return isSvgText(element) || hasDirectText(element);
}

function baseFontSize(element: Element): number | null {
  const stored = element.getAttribute(BASE_FONT_ATTRIBUTE);
  if (stored) {
    const parsed = Number.parseFloat(stored);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const computed = element.ownerDocument.defaultView?.getComputedStyle(element).fontSize ?? '';
  const parsed = Number.parseFloat(computed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  element.setAttribute(BASE_FONT_ATTRIBUTE, String(parsed));
  // Some visuals set a font size inline (for example responsive overrides).
  // Preserve that exact declaration so reset can restore CSS instead of
  // accidentally deleting the element's own style.
  const inline = (element as HTMLElement).style;
  element.setAttribute(INLINE_FONT_ATTRIBUTE, inline.getPropertyValue('font-size'));
  element.setAttribute(INLINE_PRIORITY_ATTRIBUTE, inline.getPropertyPriority('font-size'));
  return parsed;
}

/**
 * Apply inverse typography to every painted text owner under the fullscreen
 * world. Runtime caching keeps the original CSS size even after a previous
 * zoom has written an inline size.
 */
export function applyFullscreenTextScale(root: HTMLElement | null, zoom: number): number {
  if (!root) return 0;
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  let updated = 0;

  for (const element of root.querySelectorAll('*')) {
    if (!isCandidate(element)) continue;
    const base = baseFontSize(element);
    if (!base) continue;
    const scoped = scopedTextFontSize(base, safeZoom);
    if (scoped <= 0) continue;
    // Author `!important` rules exist (for example the B+ tree role labels);
    // inline important is the only declaration that can stay inverse there.
    (element as HTMLElement).style.setProperty('font-size', `${scoped}px`, 'important');
    updated += 1;
  }

  root.dataset.fullscreenTextZoom = String(safeZoom);
  return updated;
}

/**
 * Drop the cached inline sizes so a viewport/style change can be re-read.
 * The next apply call recomputes from the real CSS before painting.
 */
export function resetFullscreenTextScale(root: HTMLElement | null): void {
  if (!root) return;
  for (const element of root.querySelectorAll(`[${BASE_FONT_ATTRIBUTE}]`)) {
    const inline = (element as HTMLElement).style;
    const original = element.getAttribute(INLINE_FONT_ATTRIBUTE) ?? '';
    const priority = element.getAttribute(INLINE_PRIORITY_ATTRIBUTE) ?? '';
    if (original) {
      inline.setProperty('font-size', original, priority);
    } else {
      inline.removeProperty('font-size');
    }
    element.removeAttribute(BASE_FONT_ATTRIBUTE);
    element.removeAttribute(INLINE_FONT_ATTRIBUTE);
    element.removeAttribute(INLINE_PRIORITY_ATTRIBUTE);
  }
  delete root.dataset.fullscreenTextZoom;
}
