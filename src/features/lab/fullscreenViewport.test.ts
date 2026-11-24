import { describe, expect, it } from 'vitest';
import {
  FULLSCREEN_MAX_ZOOM,
  FULLSCREEN_MIN_ZOOM,
  adjacentZoom,
  clampPan,
  clampZoom,
  computeFitView,
  formatZoomPercent,
  zoomAroundPoint,
} from './fullscreenViewport';

describe('fullscreenViewport', () => {
  it('clamps zoom to the supported range and repairs non-finite input', () => {
    expect(clampZoom(Number.NaN)).toBe(1);
    expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(1);
    expect(clampZoom(-10)).toBe(FULLSCREEN_MIN_ZOOM);
    expect(clampZoom(0)).toBe(FULLSCREEN_MIN_ZOOM);
    expect(clampZoom(99)).toBe(FULLSCREEN_MAX_ZOOM);
    expect(clampZoom(1.25)).toBe(1.25);
  });

  it('moves through accessible zoom stops without skipping or overshooting', () => {
    expect(adjacentZoom(1, 'in')).toBe(1.25);
    expect(adjacentZoom(1, 'out')).toBe(0.75);
    expect(adjacentZoom(0.5, 'out')).toBe(0.5);
    expect(adjacentZoom(3, 'in')).toBe(3);
    expect(adjacentZoom(1.24, 'in')).toBe(1.25);
    expect(adjacentZoom(1.24, 'out')).toBe(1);
  });

  it('keeps the world point under the pointer anchored while zooming', () => {
    const first = zoomAroundPoint(1, { x: 0, y: 0 }, 2, { x: 120, y: -40 }, { width: 1000, height: 700 });
    expect(first.zoom).toBe(2);
    expect(first.pan.x).toBeCloseTo(-120, 5);
    expect(first.pan.y).toBeCloseTo(40, 5);

    const second = zoomAroundPoint(2, first.pan, 1, { x: 120, y: -40 }, { width: 1000, height: 700 });
    expect(second.zoom).toBe(1);
    expect(second.pan.x).toBeCloseTo(0, 5);
    expect(second.pan.y).toBeCloseTo(0, 5);
  });

  it('clamps pan so a visible part of the stage always remains reachable', () => {
    expect(clampPan({ x: 10_000, y: -10_000 }, { width: 1000, height: 700 }, 2)).toEqual({
      x: 940,
      y: -640,
    });
  });

  it('fits wide content and tall content with padding, not by returning 100%', () => {
    const wide = computeFitView(
      { width: 1200, height: 800 },
      { width: 1800, height: 400, centerX: 0, centerY: 0 },
      40,
    );
    expect(wide.zoom).toBeCloseTo(1120 / 1800, 5);
    expect(wide.zoom).toBeLessThan(1);

    const tall = computeFitView(
      { width: 1200, height: 800 },
      { width: 300, height: 1200, centerX: 0, centerY: 0 },
      40,
    );
    expect(tall.zoom).toBeCloseTo(720 / 1200, 5);
    expect(tall.zoom).toBeLessThan(1);

    // A structure larger than the 50% floor stays visible and recoverable
    // rather than dropping to an unusable microscopic ratio.
    const enormous = computeFitView(
      { width: 1200, height: 800 },
      { width: 2400, height: 2000, centerX: 0, centerY: 0 },
      40,
    );
    expect(enormous.zoom).toBe(0.5);
  });

  it('centres off-centre content after fitting it', () => {
    const view = computeFitView(
      { width: 1000, height: 600 },
      { width: 400, height: 300, centerX: 150, centerY: -80 },
      20,
    );
    expect(view.zoom).toBe(1.8666666666666667);
    expect(view.pan.x).toBeCloseTo(-280, 5);
    expect(view.pan.y).toBeCloseTo(149.33333333333334, 5);
  });

  it('never emits zero, NaN or Infinity for a missing/small canvas', () => {
    for (const viewport of [
      { width: 0, height: 0 },
      { width: Number.NaN, height: 600 },
      { width: 1000, height: Number.POSITIVE_INFINITY },
    ]) {
      const view = computeFitView(viewport, { width: 100, height: 100, centerX: 0, centerY: 0 });
      expect(view.zoom).toBe(1);
      expect(view.pan).toEqual({ x: 0, y: 0 });
    }
    expect(formatZoomPercent(Number.NaN)).toBe('100%');
    expect(formatZoomPercent(99)).toBe('300%');
  });
});
