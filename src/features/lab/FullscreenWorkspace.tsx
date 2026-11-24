import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { TraceEvent } from '../../domain/trace/schema';
import type { Playback } from './usePlayback';
import { VisualStage } from './VisualStage';
import { Timeline } from './Timeline';
import { useI18n } from '../../i18n/I18nProvider';
import type { FullscreenMode } from './useFullscreenView';
import {
  FULLSCREEN_MAX_ZOOM,
  adjacentZoom,
  clampPan,
  clampZoom,
  computeFitView,
  formatZoomPercent,
  fullscreenMinZoomFor,
  viewportSizeFromElement,
  zoomAroundPoint,
  type PanOffset,
  type ViewportSize,
} from './fullscreenViewport';
import { measureVisualContent } from './fullscreenContentBounds';
import {
  applyFullscreenTextScale,
  resetFullscreenTextScale,
} from './fullscreenTextScale';

const NO_PAN_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'textarea',
  'select',
  'summary',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="slider"]',
  '[role="tab"]',
  '.monaco-editor',
  '[data-testid="graph-canvas-scroll"]',
  '[data-fullscreen-no-pan]',
].join(',');

const SHORTCUT_GUARD_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable]',
  '[role="textbox"]',
  '[role="searchbox"]',
  '[role="combobox"]',
  '[role="spinbutton"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '.monaco-editor',
].join(',');

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface FullscreenWorkspaceProps {
  event: TraceEvent | undefined;
  events: TraceEvent[];
  playback: Playback;
  algorithmId: string;
  algorithmName: string;
  mode: FullscreenMode;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}

function asElement(target: EventTarget | null): Element | null {
  return target && 'nodeType' in target && target.nodeType === Node.ELEMENT_NODE
    ? (target as Element)
    : null;
}

function isScrollable(element: Element): boolean {
  const view = element.ownerDocument.defaultView;
  if (!view) return false;
  const style = view.getComputedStyle(element);
  const canScrollX =
    (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
    element.scrollWidth > element.clientWidth + 1;
  const canScrollY =
    (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
    element.scrollHeight > element.clientHeight + 1;
  return canScrollX || canScrollY;
}

function startsInsideNoPan(target: EventTarget | null): boolean {
  const element = asElement(target);
  if (!element) return false;
  if (element.closest(NO_PAN_SELECTOR)) return true;

  // Preserve native horizontal scrolling from a wide graph or table: a drag
  // that starts inside one of those scrollers must keep scrolling, not pan.
  let ancestor: Element | null = element;
  while (ancestor) {
    if (isScrollable(ancestor)) return true;
    ancestor = ancestor.parentElement;
  }
  return false;
}

function isShortcutProtected(target: EventTarget | null): boolean {
  const element = asElement(target);
  if (!element) return false;
  if (element.closest(SHORTCUT_GUARD_SELECTOR)) return true;
  const editable = element.closest('[contenteditable]');
  return Boolean(editable && editable.getAttribute('contenteditable')?.toLowerCase() !== 'false');
}

function finiteDimension(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * One immersive view over the *same* VisualStage and Playback instance used by
 * the course page. It intentionally never calls usePlayback, never reads the
 * input, and never starts a timer: frame changes arrive as props from the one
 * player already mounted by LabView.
 */
export function FullscreenWorkspace({
  event,
  events,
  playback,
  algorithmId,
  algorithmName,
  mode,
  onClose,
  returnFocusRef,
}: FullscreenWorkspaceProps) {
  const { t } = useI18n();
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const zoomValueRef = useRef<HTMLButtonElement | null>(null);
  const zoomInRef = useRef<HTMLButtonElement | null>(null);
  const zoomOutRef = useRef<HTMLButtonElement | null>(null);
  const zoomRef = useRef(1);
  const panRef = useRef<PanOffset>({ x: 0, y: 0 });
  const viewportSizeRef = useRef<ViewportSize>({ width: 0, height: 0 });
  const fitModeRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pointerGestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPan: PanOffset;
    moved: boolean;
  } | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const textZoomRef = useRef<number | null>(null);
  const minZoom = fullscreenMinZoomFor(algorithmId);
  const titleId = useId();
  const helpId = useId();
  const panHintId = useId();

  const visualStage = useCallback(
    () => worldRef.current?.querySelector<HTMLElement>('[data-testid="visual-stage"]') ?? null,
    [],
  );

  /**
   * Text is re-typed at 1/zoom so the world transform only changes geometry.
   * New frame elements are picked up after each render; repeated pan events at
   * the same zoom deliberately do not rescan the DOM.
   */
  const syncTextScale = useCallback((force = false) => {
    const stage = visualStage();
    if (!stage) return;
    const zoom = zoomRef.current;
    if (!force && textZoomRef.current === zoom) return;
    applyFullscreenTextScale(stage, zoom);
    textZoomRef.current = zoom;
  }, [visualStage]);

  const refreshTextScale = useCallback(() => {
    const stage = visualStage();
    if (!stage) return;
    // CSS can change under a responsive breakpoint while the immersive view is
    // open; drop cached sizes before measuring/fitting the new viewport.
    resetFullscreenTextScale(stage);
    textZoomRef.current = null;
    syncTextScale(true);
  }, [syncTextScale, visualStage]);

  const applyTransform = useCallback(() => {
    const world = worldRef.current;
    const viewport = viewportRef.current;
    if (world) {
      const { x, y } = panRef.current;
      const zoom = zoomRef.current;
      world.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoom})`;
      world.dataset.zoom = String(zoom);
    }
    if (viewport) {
      viewport.dataset.zoom = String(zoomRef.current);
      viewport.dataset.panX = String(panRef.current.x);
      viewport.dataset.panY = String(panRef.current.y);
    }
    syncTextScale();

    const percent = formatZoomPercent(zoomRef.current);
    const value = zoomValueRef.current;
    if (value) {
      value.textContent = percent;
      value.setAttribute('aria-label', `${t('fullscreenResetZoom')} · ${percent}`);
    }
    if (zoomOutRef.current) zoomOutRef.current.disabled = zoomRef.current <= minZoom + 0.001;
    if (zoomInRef.current) zoomInRef.current.disabled = zoomRef.current >= FULLSCREEN_MAX_ZOOM - 0.001;
  }, [minZoom, t]);

  const commitView = useCallback((view: { zoom: number; pan: PanOffset }, fit: boolean) => {
    zoomRef.current = clampZoom(view.zoom, minZoom);
    panRef.current = clampPan(view.pan, viewportSizeRef.current, zoomRef.current);
    fitModeRef.current = fit;
    applyTransform();
  }, [applyTransform, minZoom]);

  const resetZoom = useCallback(() => {
    commitView({ zoom: 1, pan: { x: 0, y: 0 } }, false);
  }, [commitView]);

  const stepZoom = useCallback((direction: 'in' | 'out') => {
    const next = adjacentZoom(zoomRef.current, direction, minZoom);
    if (Math.abs(next - zoomRef.current) < 0.001) return;
    commitView({ zoom: next, pan: panRef.current }, false);
  }, [commitView, minZoom]);

  const fitToScreen = useCallback(() => {
    const viewport = viewportRef.current;
    const stage = worldRef.current?.querySelector<HTMLElement>('[data-testid="visual-stage"]') ?? null;
    const size = viewportSizeFromElement(viewport);
    viewportSizeRef.current = size;
    const content = measureVisualContent(stage, zoomRef.current);
    const padding = Math.min(64, Math.max(20, Math.min(size.width, size.height) * 0.055));
    const fit = computeFitView(size, content, padding, minZoom);
    commitView(fit, true);
  }, [commitView, minZoom]);

  const movePan = useCallback((x: number, y: number) => {
    const next = clampPan({ x, y }, viewportSizeRef.current, zoomRef.current);
    panRef.current = next;
    fitModeRef.current = false;
    applyTransform();
  }, [applyTransform]);

  const nudgePan = useCallback((x: number, y: number) => {
    movePan(panRef.current.x + x, panRef.current.y + y);
  }, [movePan]);

  const wheelZoom = useCallback((event: WheelEvent) => {
    if (!event.ctrlKey || event.defaultPrevented) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const anchor = {
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2),
    };
    const factor = Math.exp(-event.deltaY * 0.0015);
    const next = clampZoom(zoomRef.current * finiteDimension(factor, 1), minZoom);
    if (Math.abs(next - zoomRef.current) < 0.0001) return;
    const view = zoomAroundPoint(
      zoomRef.current,
      panRef.current,
      next,
      anchor,
      viewportSizeRef.current,
      minZoom,
    );
    commitView(view, false);
  }, [commitView, minZoom]);

  const finishPointerGesture = useCallback(() => {
    const viewport = viewportRef.current;
    if (pointerGestureRef.current?.moved) suppressClickRef.current = true;
    pointerGestureRef.current = null;
    viewport?.classList.remove('is-panning');
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    if (startsInsideNoPan(event.target)) return;
    suppressClickRef.current = false;
    pointerGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPan: { ...panRef.current },
      moved: false,
    };
    viewportRef.current?.focus({ preventScroll: true });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = pointerGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.moved && Math.hypot(dx, dy) >= 5) {
      gesture.moved = true;
      viewportRef.current?.classList.add('is-panning');
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Some synthetic pointers cannot be captured; movement still works
        // while the pointer remains over the viewport.
      }
    }
    if (!gesture.moved) return;
    event.preventDefault();
    movePan(gesture.startPan.x + dx, gesture.startPan.y + dy);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = pointerGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Capture may already have been released by the browser.
      }
    }
    finishPointerGesture();
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const onWorkspaceKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key === 'Tab') {
      const root = workspaceRef.current;
      if (!root) return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !focusable.includes(active as HTMLElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (isShortcutProtected(event.target)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const amount = 48;
      if (event.key === 'ArrowLeft') nudgePan(-amount, 0);
      if (event.key === 'ArrowRight') nudgePan(amount, 0);
      if (event.key === 'ArrowUp') nudgePan(0, -amount);
      if (event.key === 'ArrowDown') nudgePan(0, amount);
      return;
    }

    if (event.key === '+' || (event.key === '=' && event.shiftKey) || event.code === 'NumpadAdd') {
      event.preventDefault();
      stepZoom('in');
      return;
    }
    if (event.key === '-' || event.code === 'NumpadSubtract') {
      event.preventDefault();
      stepZoom('out');
      return;
    }
    if (event.key === '0' || event.code === 'Numpad0') {
      event.preventDefault();
      resetZoom();
    }
  };

  // Apply the initial 100% view and focus the toolbar before first paint. The
  // previous focus is captured first so closing restores the entry point.
  useLayoutEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    viewportSizeRef.current = viewportSizeFromElement(viewportRef.current);
    applyTransform();
    toolbarRef.current?.focus({ preventScroll: true });
    // Mount only: a later language re-render must not steal focus back to the
    // toolbar or record the toolbar itself as the return target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every new trace frame can create fresh HTML/SVG text nodes. Only new nodes
  // read a base size; existing labels keep the cached value from zoom 1.
  useLayoutEffect(() => {
    syncTextScale(true);
  }, [event, playback.index, syncTextScale]);

  // Lock only this immersive surface: the page gets its exact overflow state
  // back on exit, and the inert app cannot receive focus behind the dialog.
  useEffect(() => {
    const app = document.querySelector<HTMLElement>('.app');
    const hadInert = app?.hasAttribute('inert') ?? false;
    app?.setAttribute('inert', '');
    document.body.classList.add('fullscreen-scroll-lock');
    document.documentElement.classList.add('fullscreen-scroll-lock');

    return () => {
      document.body.classList.remove('fullscreen-scroll-lock');
      document.documentElement.classList.remove('fullscreen-scroll-lock');
      if (app && !hadInert) app.removeAttribute('inert');
      const returnTarget = returnFocusRef.current ?? previousFocusRef.current;
      if (returnTarget && returnTarget.isConnected) {
        requestAnimationFrame(() => returnTarget.focus({ preventScroll: true }));
      }
    };
  }, [returnFocusRef]);

  // Keep focus inside the immersive modal even if a script or browser tries
  // to move it to the obscured course page.
  useEffect(() => {
    const root = workspaceRef.current;
    if (!root) return;
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !root.contains(event.target)) {
        toolbarRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);

  // Ctrl+wheel zooms only over the canvas; plain wheel remains native for any
  // internal scroller and never changes page scroll.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener('wheel', wheelZoom, { passive: false });
    return () => viewport.removeEventListener('wheel', wheelZoom);
  }, [wheelZoom]);

  // Touch drags outside an internal scroller pan the canvas. The listener is
  // deliberately non-passive so the gesture does not become a page/browser
  // pan before the first move.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let gesture: {
      identifier: number;
      startX: number;
      startY: number;
      startPan: PanOffset;
      moved: boolean;
    } | null = null;

    const clear = () => {
      viewport.classList.remove('is-panning');
      gesture = null;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || startsInsideNoPan(event.target)) {
        gesture = null;
        return;
      }
      const touch = event.touches[0];
      gesture = {
        identifier: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        startPan: { ...panRef.current },
        moved: false,
      };
      suppressClickRef.current = false;
      viewport.focus({ preventScroll: true });
      event.preventDefault();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!gesture) return;
      const touch = Array.from(event.touches).find((item) => item.identifier === gesture!.identifier);
      if (!touch) {
        clear();
        return;
      }
      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;
      if (!gesture.moved && Math.hypot(dx, dy) >= 6) {
        gesture.moved = true;
        viewport.classList.add('is-panning');
      }
      if (!gesture.moved) return;
      event.preventDefault();
      movePan(gesture.startPan.x + dx, gesture.startPan.y + dy);
    };

    const onTouchEnd = () => {
      if (gesture?.moved) suppressClickRef.current = true;
      clear();
    };

    viewport.addEventListener('touchstart', onTouchStart, { passive: false });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd);
    viewport.addEventListener('touchcancel', clear);
    return () => {
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
      viewport.removeEventListener('touchcancel', clear);
    };
  }, [movePan]);

  // Re-fit while the learner stays in Fit mode; otherwise only clamp a pan that
  // a smaller window would have made unreachable.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const sync = () => {
      viewportSizeRef.current = viewportSizeFromElement(viewportRef.current);
      refreshTextScale();
      if (fitModeRef.current) {
        if (resizeFrameRef.current !== null) return;
        resizeFrameRef.current = requestAnimationFrame(() => {
          resizeFrameRef.current = null;
          fitToScreen();
        });
      } else {
        panRef.current = clampPan(panRef.current, viewportSizeRef.current, zoomRef.current);
        applyTransform();
      }
    };

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(sync);
      observer.observe(viewport);
    }
    window.addEventListener('resize', sync);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', sync);
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, [applyTransform, fitToScreen, refreshTextScale]);

  const workspace = (
    <div
      ref={workspaceRef}
      className="fullscreen-workspace"
      data-testid="fullscreen-workspace"
      data-mode={mode}
      data-keyboard-playback-surface="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={`${helpId} ${panHintId}`}
      onKeyDown={onWorkspaceKeyDown}
    >
      <header className="fullscreen-topbar" data-testid="fullscreen-toolbar">
        <div
          className="fullscreen-toolbar-focus"
          ref={toolbarRef}
          tabIndex={-1}
          role="group"
          aria-label={t('fullscreenToolbarLabel')}
        >
          <div className="fullscreen-brand" aria-label="AlgoViz">
            <img
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
            <span>AlgoViz</span>
          </div>
          <span className="fullscreen-title-divider" aria-hidden="true" />
          <div className="fullscreen-algorithm">
            <span className="fullscreen-algorithm-label">{t('fullscreenAlgorithmLabel')}</span>
            <h2 id={titleId} title={algorithmName}>{algorithmName}</h2>
          </div>
          <span className="fullscreen-pan-hint" id={panHintId} data-testid="fullscreen-pan-hint">
            {t('fullscreenDragHint')} · {t('fullscreenPanKeyboardHint')}
          </span>

          <div className="fullscreen-zoom-controls" role="group" aria-label={t('fullscreenZoomControls')}>
            <button
              ref={zoomOutRef}
              type="button"
              className="btn small fullscreen-tool-btn"
              aria-label={t('fullscreenZoomOut')}
              aria-keyshortcuts="-"
              title={t('fullscreenZoomOut')}
              data-testid="fullscreen-zoom-out"
              onClick={() => stepZoom('out')}
            >−</button>
            <button
              ref={zoomValueRef}
              type="button"
              className="btn small fullscreen-zoom-value"
              aria-keyshortcuts="0"
              title={t('fullscreenResetZoom')}
              data-testid="fullscreen-zoom-value"
              onClick={resetZoom}
            >100%</button>
            <button
              ref={zoomInRef}
              type="button"
              className="btn small fullscreen-tool-btn"
              aria-label={t('fullscreenZoomIn')}
              aria-keyshortcuts="+"
              title={t('fullscreenZoomIn')}
              data-testid="fullscreen-zoom-in"
              onClick={() => stepZoom('in')}
            >+</button>
            <button
              type="button"
              className="btn small fullscreen-fit-btn"
              aria-label={t('fullscreenFit')}
              title={t('fullscreenFit')}
              data-testid="fullscreen-fit"
              onClick={fitToScreen}
            >
              <span aria-hidden="true">⛶</span>
              <span className="fullscreen-fit-label">{t('fullscreenFit')}</span>
            </button>
          </div>

          <button
            type="button"
            className="btn small fullscreen-exit-btn"
            aria-label={t('fullscreenExit')}
            title={t('fullscreenExit')}
            aria-keyshortcuts="Escape"
            data-testid="fullscreen-exit"
            onClick={onClose}
          >
            <span aria-hidden="true">✕</span>
            <span>{t('fullscreenExit')}</span>
          </button>
        </div>
      </header>

      <main
        className="fullscreen-canvas-wrap"
        data-testid="fullscreen-canvas"
        ref={viewportRef}
        tabIndex={0}
        role="region"
        aria-label={t('fullscreenCanvasLabel')}
        aria-describedby={helpId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={() => finishPointerGesture()}
        onLostPointerCapture={() => finishPointerGesture()}
        onClickCapture={onClickCapture}
      >
        <div className="fullscreen-world" ref={worldRef} data-testid="fullscreen-world">
          <VisualStage
            event={event}
            events={events}
            index={playback.index}
            algorithmId={algorithmId}
          />
        </div>
        <p id={helpId} className="fullscreen-sr-only">
          {t('fullscreenCanvasHelp')}
        </p>
      </main>

      <footer className="fullscreen-bottom" data-testid="fullscreen-bottom">
        <Timeline events={events} playback={playback} />
        <div className="fullscreen-zoom-shortcuts" role="group" aria-label={t('fullscreenZoomShortcutsLabel')}>
          <span>{t('fullscreenZoomShortcutHint')}</span>
        </div>
      </footer>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(workspace, document.body);
}
