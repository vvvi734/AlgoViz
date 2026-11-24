import { useCallback, useEffect, useRef, useState } from 'react';

export type FullscreenMode = 'native' | 'overlay';

type LegacyFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type LegacyFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function currentFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const legacyDocument = document as LegacyFullscreenDocument;
  return document.fullscreenElement ?? legacyDocument.webkitFullscreenElement ?? null;
}

/**
 * Opens one immersive view. Native Fullscreen API is attempted first from the
 * click itself (preserving transient user activation); any rejection or
 * missing API leaves the same modal overlay active, so the control never
 * becomes a dead end.
 *
 * Playback lives in the caller and is intentionally absent here.
 */
export function useFullscreenView() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<FullscreenMode>('overlay');
  const openRef = useRef(false);
  const requestIdRef = useRef(0);
  const wasNativeRef = useRef(false);

  const exitNative = useCallback(() => {
    if (typeof document === 'undefined') return;
    const legacyDocument = document as LegacyFullscreenDocument;
    if (!currentFullscreenElement()) return;
    try {
      if (typeof document.exitFullscreen === 'function') {
        void Promise.resolve(document.exitFullscreen()).catch(() => undefined);
      } else if (typeof legacyDocument.webkitExitFullscreen === 'function') {
        void Promise.resolve(legacyDocument.webkitExitFullscreen()).catch(() => undefined);
      }
    } catch {
      // The browser may already have left fullscreen. The overlay state below
      // is still closed, and the next fullscreenchange will agree with it.
    }
  }, []);

  const close = useCallback(() => {
    openRef.current = false;
    requestIdRef.current += 1;
    setOpen(false);
    setMode('overlay');
    wasNativeRef.current = false;
    exitNative();
  }, [exitNative]);

  const openView = useCallback(() => {
    if (typeof document === 'undefined' || openRef.current) return;
    openRef.current = true;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setOpen(true);
    setMode('overlay');

    const root = document.documentElement as LegacyFullscreenElement;
    let request: Promise<void> | void | undefined;
    try {
      if (typeof root.requestFullscreen === 'function') {
        request = root.requestFullscreen();
      } else if (typeof root.webkitRequestFullscreen === 'function') {
        request = root.webkitRequestFullscreen();
      }
    } catch {
      request = undefined;
    }

    if (!request) {
      // No usable API (notably some iOS browsers): the full-viewport overlay
      // remains open and behaves as a modal dialog.
      return;
    }

    void Promise.resolve(request)
      .then(() => {
        if (!openRef.current || requestId !== requestIdRef.current) {
          // The learner closed the view while the browser was still entering
          // fullscreen. Do not leave the whole page fullscreen behind them.
          if (currentFullscreenElement()) exitNative();
          return;
        }
        wasNativeRef.current = true;
        setMode('native');
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        // A refused request is a compatibility fallback, not a failure of the
        // feature: the overlay is already visible and usable.
        setMode('overlay');
      });
  }, [exitNative]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onFullscreenChange = () => {
      const element = currentFullscreenElement();
      if (element) {
        wasNativeRef.current = true;
        setMode('native');
        return;
      }

      setMode('overlay');
      if (openRef.current && wasNativeRef.current) {
        // Esc or the browser's own exit UI: close the matching overlay rather
        // than leaving an internal "we are still fullscreen" state behind.
        openRef.current = false;
        requestIdRef.current += 1;
        setOpen(false);
      }
      wasNativeRef.current = false;
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  return { open, mode, openView, close };
}
