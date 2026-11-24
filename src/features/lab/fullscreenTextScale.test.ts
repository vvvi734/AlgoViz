import { afterEach, describe, expect, it } from 'vitest';
import {
  applyFullscreenTextScale,
  resetFullscreenTextScale,
  scopedTextFontSize,
} from './fullscreenTextScale';

function root(): HTMLElement {
  const element = document.createElement('div');
  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('fullscreenTextScale', () => {
  it('computes the exact local font size needed to cancel world zoom', () => {
    expect(scopedTextFontSize(14, 1)).toBe(14);
    expect(scopedTextFontSize(14, 2)).toBe(7);
    expect(scopedTextFontSize(14, 1.5)).toBeCloseTo(9.333333, 5);
    expect(scopedTextFontSize(14, 0.5)).toBe(28);
    expect(scopedTextFontSize(Number.NaN, 2)).toBe(0);
    expect(scopedTextFontSize(14, 0)).toBe(14);
  });

  it('scales HTML text owners but not node shapes', () => {
    const stage = root();
    stage.innerHTML = `
      <div class="node" style="font-size:19px"><span class="node-value" style="font-size:14px">42</span></div>
      <div class="node-shape"></div>
    `;
    const label = stage.querySelector<HTMLElement>('.node-value')!;
    const shape = stage.querySelector<HTMLElement>('.node-shape')!;

    expect(applyFullscreenTextScale(stage, 2)).toBeGreaterThan(0);
    expect(label.style.fontSize).toBe('7px');
    expect(label.getAttribute('data-fullscreen-base-font')).toBe('14');
    expect(shape.style.fontSize).toBe('');
  });

  it('caches the original size across zoom changes instead of compounding', () => {
    const stage = root();
    stage.innerHTML = '<span style="font-size:14px">14px label</span>';
    const label = stage.querySelector<HTMLElement>('span')!;

    applyFullscreenTextScale(stage, 2);
    expect(label.style.fontSize).toBe('7px');
    applyFullscreenTextScale(stage, 0.5);
    expect(label.style.fontSize).toBe('28px');
    applyFullscreenTextScale(stage, 1.5);
    expect(label.style.fontSize).toBe('9.333333333333334px');
    expect(label.getAttribute('data-fullscreen-base-font')).toBe('14');
  });

  it('picks up text created by a new frame without disturbing existing labels', () => {
    const stage = root();
    stage.innerHTML = '<span class="old" style="font-size:14px">old</span>';
    applyFullscreenTextScale(stage, 2);
    const oldLabel = stage.querySelector<HTMLElement>('.old')!;
    expect(oldLabel.style.fontSize).toBe('7px');

    const next = document.createElement('span');
    next.className = 'new';
    next.style.fontSize = '16px';
    next.textContent = 'new';
    stage.append(next);
    applyFullscreenTextScale(stage, 2);

    expect(oldLabel.style.fontSize).toBe('7px');
    expect(next.style.fontSize).toBe('8px');
    expect(next.getAttribute('data-fullscreen-base-font')).toBe('16');
  });

  it('inverse-scales SVG text and skips tooltip <title> nodes', () => {
    const stage = root();
    stage.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
        <g class="node" transform="translate(60 40)">
          <circle r="20"></circle>
          <text class="node-label" x="0" y="4" style="font-size:14px">A</text>
          <title>tooltip</title>
        </g>
      </svg>
    `;
    const svgText = stage.querySelector<SVGTextElement>('text')!;
    applyFullscreenTextScale(stage, 2);
    expect(svgText.style.fontSize).toBe('7px');
    expect(svgText.getAttribute('data-fullscreen-base-font')).toBe('14');

    // <title> remains untouched because it produces no painted glyph.
    const title = stage.querySelector<SVGTitleElement>('title')!;
    expect(title.getAttribute('data-fullscreen-base-font')).toBeNull();
  });

  it('resets inline typography before a viewport re-measure', () => {
    const stage = root();
    stage.innerHTML = '<span style="font-size:14px">42</span>';
    const label = stage.querySelector<HTMLElement>('span')!;
    applyFullscreenTextScale(stage, 2);
    expect(label.style.fontSize).toBe('7px');
    expect(stage.dataset.fullscreenTextZoom).toBe('2');

    resetFullscreenTextScale(stage);
    // The original inline declaration is restored, not deleted.
    expect(label.style.fontSize).toBe('14px');
    expect(label.getAttribute('data-fullscreen-base-font')).toBeNull();
    expect(stage.dataset.fullscreenTextZoom).toBeUndefined();

    applyFullscreenTextScale(stage, 0.5);
    expect(label.style.fontSize).toBe('28px');
  });
});
