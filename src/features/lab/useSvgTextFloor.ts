import { useEffect, type RefObject } from 'react';

type SvgText = SVGTextElement & { dataset: DOMStringMap };

/**
 * UX-SIMPLIFY-02: a `font-size` in SVG user units is not a screen size.
 *
 * Every algorithm SVG scales its `viewBox` to the card width. This hook reads
 * the actual screen CTM and lifts each text node to 12px (labels) or 16px
 * (node values/weights) after scaling, while preserving any larger authored
 * size. It is intentionally DOM-level so it covers all current and future SVGs
 * without every visual component computing its own magic number.
 */
export function useSvgTextFloor(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    let disposed = false;

    const applyAll = () => {
      frame = 0;
      if (disposed) return;
      const svgs = root.querySelectorAll<SVGSVGElement>('svg');
      for (const svg of svgs) {
        resizeObserver?.observe(svg);
        const ctm = svg.getScreenCTM();
        if (!ctm) continue;
        const scale = Math.min(Math.abs(ctm.a), Math.abs(ctm.d));
        if (!Number.isFinite(scale) || scale <= 0) continue;

        const texts = svg.querySelectorAll<SvgText>('text');
        for (const text of texts) {
          // Read the text's own screen matrix, not only the root SVG: tree and
          // node groups may add another `scale(...)` of their own.
          const textCtm = text.getScreenCTM() ?? ctm;
          const textScale = Math.min(Math.abs(textCtm.a), Math.abs(textCtm.d));
          if (!Number.isFinite(textScale) || textScale <= 0) continue;

          if (!text.dataset.fontBase) {
            const computed = Number.parseFloat(getComputedStyle(text).fontSize);
            if (!Number.isFinite(computed) || computed <= 0) continue;
            text.dataset.fontBase = String(computed);
          }
          const base = Number.parseFloat(text.dataset.fontBase);
          if (!Number.isFinite(base)) continue;
          const className = typeof text.className === 'string'
            ? text.className
            : text.className.baseVal;
          const valueTier = /(?:^|\s)(?:[a-z0-9-]*-value|[a-z0-9-]*-weight|[a-z0-9-]*-symbol)(?:\s|$)/.test(
            className,
          );
          const floor = (valueTier ? 16 : 12) / textScale;
          const target = Math.max(base, floor);
          const current = Number.parseFloat(text.style.fontSize || '0');
          if (!Number.isFinite(current) || Math.abs(current - target) > 0.05) {
            text.style.fontSize = `${target}px`;
          }
        }
      }
    };

    const schedule = () => {
      if (disposed || frame) return;
      frame = window.requestAnimationFrame(applyAll);
    };

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(schedule)
      : null;
    root.querySelectorAll('svg').forEach((svg) => resizeObserver?.observe(svg));
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'childList') {
          schedule();
          return;
        }
      }
    });
    mutationObserver.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);

    // Initial paint and a second pass after layout has settled.
    schedule();
    const late = window.setTimeout(schedule, 120);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(late);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [rootRef]);
}
