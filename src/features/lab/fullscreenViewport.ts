/**
 * Pure geometry for the immersive algorithm viewport.
 *
 * The visible canvas is a transform around the *shared* VisualStage, never a
 * second renderer. Keeping the maths out of React makes every boundary
 * (50%–300%, NaN, zero-sized canvases) testable and lets pointer movement update
 * only the CSS transform instead of re-rendering a large tree or table.
 */

export const FULLSCREEN_MIN_ZOOM = 0.5;
export const FULLSCREEN_MAX_ZOOM = 3;
export const FULLSCREEN_ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3] as const;

export interface ViewportSize {
  width: number;
  height: number;
}

export interface PanOffset {
  x: number;
  y: number;
}

/**
 * Content dimensions and centre, expressed relative to the centre of the
 * untransformed VisualStage at zoom 1.
 */
export interface ContentMetrics {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface FitView {
  zoom: number;
  pan: PanOffset;
}

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(FULLSCREEN_MAX_ZOOM, Math.max(FULLSCREEN_MIN_ZOOM, value));
}

/** Snap inward to the next/previous accessible zoom stop. */
export function adjacentZoom(current: number, direction: 'in' | 'out'): number {
  const safe = clampZoom(current);
  const epsilon = 0.001;
  if (direction === 'in') {
    return FULLSCREEN_ZOOM_LEVELS.find((level) => level > safe + epsilon) ?? FULLSCREEN_MAX_ZOOM;
  }
  for (let index = FULLSCREEN_ZOOM_LEVELS.length - 1; index >= 0; index -= 1) {
    if (FULLSCREEN_ZOOM_LEVELS[index] < safe - epsilon) return FULLSCREEN_ZOOM_LEVELS[index];
  }
  return FULLSCREEN_MIN_ZOOM;
}

/** Show at least a useful sliver of the scaled stage so a pan can never lose it. */
export function panLimit(viewport: ViewportSize, zoom: number): PanOffset {
  const safeZoom = clampZoom(zoom);
  const minimumVisibleX = Math.min(120, Math.max(48, finite(viewport.width) * 0.18));
  const minimumVisibleY = Math.min(120, Math.max(48, finite(viewport.height) * 0.18));
  return {
    x: Math.max(0, (finite(viewport.width) * safeZoom - minimumVisibleX) / 2),
    y: Math.max(0, (finite(viewport.height) * safeZoom - minimumVisibleY) / 2),
  };
}

export function clampPan(pan: PanOffset, viewport: ViewportSize, zoom: number): PanOffset {
  const limit = panLimit(viewport, zoom);
  return {
    x: Math.min(limit.x, Math.max(-limit.x, finite(pan.x))),
    y: Math.min(limit.y, Math.max(-limit.y, finite(pan.y))),
  };
}

/**
 * Zoom without letting the world point under the pointer jump. `anchor` is
 * measured from the viewport centre, the same origin as the CSS transform.
 */
export function zoomAroundPoint(
  currentZoom: number,
  currentPan: PanOffset,
  nextZoom: number,
  anchor: PanOffset,
  viewport: ViewportSize,
): FitView {
  const from = clampZoom(currentZoom);
  const to = clampZoom(nextZoom);
  const ratio = to / from;
  return {
    zoom: to,
    pan: clampPan(
      {
        x: finite(anchor.x) - (finite(anchor.x) - finite(currentPan.x)) * ratio,
        y: finite(anchor.y) - (finite(anchor.y) - finite(currentPan.y)) * ratio,
      },
      viewport,
      to,
    ),
  };
}

/**
 * Fit the measured visual content, not merely the stage wrapper. The content is
 * centred after scaling, so wide tables and tall trees both use the canvas.
 * A zero-sized measurement safely degrades to the 100% baseline.
 */
export function computeFitView(
  viewport: ViewportSize,
  content: ContentMetrics | null,
  padding = 32,
): FitView {
  if (
    !content ||
    !Number.isFinite(content.width) ||
    !Number.isFinite(content.height) ||
    content.width <= 0 ||
    content.height <= 0 ||
    !Number.isFinite(viewport.width) ||
    !Number.isFinite(viewport.height) ||
    viewport.width <= 0 ||
    viewport.height <= 0
  ) {
    return { zoom: 1, pan: { x: 0, y: 0 } };
  }

  const horizontalPadding = Math.max(8, Math.min(80, finite(padding)));
  const verticalPadding = Math.max(8, Math.min(80, finite(padding, 32)));
  const availableWidth = Math.max(1, viewport.width - horizontalPadding * 2);
  const availableHeight = Math.max(1, viewport.height - verticalPadding * 2);
  const fitZoom = Math.min(availableWidth / content.width, availableHeight / content.height);
  const zoom = clampZoom(fitZoom);
  return {
    zoom,
    pan: clampPan(
      {
        x: -finite(content.centerX) * zoom,
        y: -finite(content.centerY) * zoom,
      },
      viewport,
      zoom,
    ),
  };
}

export function formatZoomPercent(zoom: number): string {
  return `${Math.round(clampZoom(zoom) * 100)}%`;
}

export function viewportSizeFromElement(element: HTMLElement | null): ViewportSize {
  if (!element) return { width: 0, height: 0 };
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(0, finite(rect.width)),
    height: Math.max(0, finite(rect.height)),
  };
}
