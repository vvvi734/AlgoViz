import { describe, expect, it } from 'vitest';
import { measureVisualContent } from './fullscreenContentBounds';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({ left, top, width, height }),
  } as DOMRect;
}

function stubRect(element: Element, next: DOMRect): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => next,
  });
}

describe('measureVisualContent', () => {
  it('measures visible marks, excludes transparent flex wrappers, and ignores hidden/def content', () => {
    const stage = document.createElement('div');
    stage.innerHTML = `
      <div class="full-width-wrapper" style="width: 100%">
        <svg width="100%" height="300">
          <defs><rect class="definition-mark"></defs>
          <rect class="mark-a" width="300" height="200"></rect>
          <text class="mark-b">hello</text>
        </svg>
        <span class="label">A label</span>
        <span class="hidden-label" style="display:none">not visible</span>
      </div>
      <div class="painted-node" style="background: rgb(20, 40, 80); border: 1px solid red; width: 200px; height: 100px"></div>
    `;
    document.body.append(stage);
    stubRect(stage, rect(0, 0, 1000, 600));
    stubRect(stage.querySelector('.mark-a')!, rect(100, 80, 300, 200));
    stubRect(stage.querySelector('.mark-b')!, rect(500, 200, 400, 300));
    stubRect(stage.querySelector('.definition-mark')!, rect(0, 0, 1000, 600));
    stubRect(stage.querySelector('.hidden-label')!, rect(0, 0, 1000, 600));
    stubRect(stage.querySelector('.label')!, rect(120, 300, 100, 20));
    stubRect(stage.querySelector('.painted-node')!, rect(150, 360, 200, 100));

    const metrics = measureVisualContent(stage, 1);
    expect(metrics).toEqual({
      width: 800,
      height: 420,
      centerX: 0,
      centerY: -10,
    });
    stage.remove();
  });

  it('returns null rather than NaN when nothing measurable exists', () => {
    const stage = document.createElement('div');
    document.body.append(stage);
    stubRect(stage, rect(0, 0, 1000, 600));
    expect(measureVisualContent(stage, 1)).toBeNull();
    stage.remove();
  });

  it('returns null for an unmounted or zero-sized stage', () => {
    expect(measureVisualContent(null, 1)).toBeNull();
    const stage = document.createElement('div');
    stubRect(stage, rect(0, 0, 0, 0));
    expect(measureVisualContent(stage, 1)).toBeNull();
  });
});
