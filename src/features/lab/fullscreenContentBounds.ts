/**
 * Measures what a student can actually see inside the shared VisualStage.
 *
 * The stage itself is always viewport-sized, so fitting its wrapper would
 * almost always look like "100%". This walks the rendered marks instead: SVG
 * primitives, painted HTML nodes, tables and text labels. Container divs with
 * no visible paint are skipped, which keeps a flex wrapper's empty width from
 * wasting the fullscreen canvas.
 */
import type { ContentMetrics } from './fullscreenViewport';

const SVG_MARK_TAGS = new Set([
  'rect',
  'circle',
  'ellipse',
  'path',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'image',
  'use',
  'foreignobject',
]);

const SVG_CONTAINER_TAGS = new Set([
  'svg',
  'g',
  'defs',
  'clippath',
  'mask',
  'pattern',
  'marker',
  'symbol',
  'lineargradient',
  'radialgradient',
  'stop',
]);

const HTML_PAINT_TAGS = new Set(['canvas', 'img', 'picture', 'video', 'iframe', 'input']);

function isElement(node: Element): node is HTMLElement | SVGElement {
  return 'getBoundingClientRect' in node;
}

function hasVisibleBox(rect: DOMRect): boolean {
  return Number.isFinite(rect.width) && Number.isFinite(rect.height) &&
    (rect.width > 0.5 || rect.height > 0.5);
}

function hasBorder(style: CSSStyleDeclaration): boolean {
  const widths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
  return widths.some((width) => Number.parseFloat(width) > 0);
}

/**
 * A drawable primitive is either an SVG mark or an HTML node that paints its
 * own background/border/box. Text-only leaves are included so labels and
 * captions participate in the fitted bounds.
 */
function isVisualCandidate(element: Element, view: Window): boolean {
  const tag = element.tagName.toLowerCase();
  if (['script', 'style', 'template', 'noscript'].includes(tag)) return false;
  if (SVG_CONTAINER_TAGS.has(tag)) return false;
  // Definitions and symbol masters are never painted at their declaration
  // site; measuring them would enlarge fit around invisible content.
  if (element.closest('defs, clipPath, mask, pattern, marker, symbol')) return false;

  const style = view.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.visibility === 'collapse' ||
    style.opacity === '0'
  ) {
    return false;
  }

  if (SVG_MARK_TAGS.has(tag)) return true;
  if (HTML_PAINT_TAGS.has(tag)) return true;

  const hasText = element.childElementCount === 0 && Boolean(element.textContent?.trim());
  if (hasText) return true;

  if (style.backgroundColor && style.backgroundColor !== 'transparent' &&
      !style.backgroundColor.startsWith('rgba(0, 0, 0, 0')) {
    return true;
  }
  if (style.backgroundImage && style.backgroundImage !== 'none') return true;
  if (hasBorder(style)) return true;
  return false;
}

export function measureVisualContent(
  stage: HTMLElement | null,
  zoom: number,
): ContentMetrics | null {
  if (!stage || typeof window === 'undefined') return null;
  const stageRect = stage.getBoundingClientRect();
  if (!Number.isFinite(stageRect.width) || !Number.isFinite(stageRect.height) ||
      stageRect.width <= 0 || stageRect.height <= 0) {
    return null;
  }

  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  let count = 0;

  const elements = stage.querySelectorAll('*');
  for (const element of elements) {
    if (!isElement(element)) continue;
    if (!isVisualCandidate(element, window)) continue;
    const rect = element.getBoundingClientRect();
    if (!hasVisibleBox(rect)) continue;
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
    count += 1;
  }

  if (count === 0 || !Number.isFinite(left) || !Number.isFinite(top) ||
      !Number.isFinite(right) || !Number.isFinite(bottom)) {
    return null;
  }

  const stageCenterX = stageRect.left + stageRect.width / 2;
  const stageCenterY = stageRect.top + stageRect.height / 2;
  const contentWidth = (right - left) / safeZoom;
  const contentHeight = (bottom - top) / safeZoom;
  if (!Number.isFinite(contentWidth) || !Number.isFinite(contentHeight) ||
      contentWidth <= 0 || contentHeight <= 0) {
    return null;
  }

  return {
    width: contentWidth,
    height: contentHeight,
    centerX: ((left + right) / 2 - stageCenterX) / safeZoom,
    centerY: ((top + bottom) / 2 - stageCenterY) / safeZoom,
  };
}
