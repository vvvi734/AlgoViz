import { useEffect, useRef } from 'react';
import { canPlay } from '../../domain/trace/player';
import type { Playback } from './usePlayback';

type PlaybackShortcut = 'prev' | 'next' | 'toggle' | 'reset' | 'first' | 'last';

const TEXT_ENTRY_SELECTOR = [
  'input',
  'textarea',
  'select',
  '.monaco-editor',
  '[data-testid="reference-code-panel"]',
  '[data-testid="reference-code-viewer"]',
  '[role="textbox"]',
  '[role="searchbox"]',
  '[role="combobox"]',
  '[role="spinbutton"]',
  '[role="slider"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="tablist"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[role="listbox"]',
  '[role="option"]',
].join(',');

const ACTIVATION_SELECTOR = [
  'button',
  'a[href]',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
].join(',');

const MODAL_SELECTOR = 'dialog[open], [aria-modal="true"], [role="dialog"], [role="alertdialog"]';

function asElement(target: EventTarget | null): Element | null {
  return target && 'nodeType' in target && target.nodeType === Node.ELEMENT_NODE
    ? (target as Element)
    : null;
}

/** Text entry, code reading and controls whose own arrow-key semantics must win. */
function isTextEntryOrReader(target: EventTarget | null): boolean {
  const element = asElement(target);
  if (!element) return false;
  if (element.closest(TEXT_ENTRY_SELECTOR)) return true;

  const editable = element.closest('[contenteditable]');
  return Boolean(editable && editable.getAttribute('contenteditable')?.toLowerCase() !== 'false');
}

/** Space must keep activating buttons, links and native ARIA button controls. */
function isActivationControl(target: EventTarget | null): boolean {
  const element = asElement(target);
  return Boolean(element?.closest(ACTIVATION_SELECTOR));
}

function isVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  const view = element.ownerDocument.defaultView;
  const style = view?.getComputedStyle(element);
  return !style || (style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse');
}

/**
 * A modal owns the keyboard while it is open. Checking the document (not only
 * the focused target) also protects programs that leave focus on the page body.
 *
 * The immersive fullscreen workspace is also a dialog, but it hosts the same
 * player. A modal explicitly marked as a playback surface only stops blocking
 * when focus is genuinely inside it; unrelated dialogs still win.
 */
function hasOpenModal(doc: Document, target: EventTarget | null): boolean {
  const focused = asElement(target);
  return Array.from(doc.querySelectorAll(MODAL_SELECTOR)).some((modal) => {
    if (!isVisible(modal)) return false;
    return !(
      modal.getAttribute('data-keyboard-playback-surface') === 'true' &&
      focused &&
      modal.contains(focused)
    );
  });
}

/** Preserve arrow/Home/End/Space scrolling when a graph or code region owns focus. */
function isHorizontalScrollFocused(doc: Document): boolean {
  const element = doc.activeElement;
  if (!(element instanceof HTMLElement)) return false;
  const style = doc.defaultView?.getComputedStyle(element);
  return Boolean(
    style &&
      (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
      element.scrollWidth > element.clientWidth + 1,
  );
}

function shortcutFor(event: KeyboardEvent): PlaybackShortcut | null {
  if (event.code === 'Space' || event.key === ' ' || event.key === 'Space' || event.key === 'Spacebar') return 'toggle';
  if (event.key === 'ArrowLeft') return 'prev';
  if (event.key === 'ArrowRight') return 'next';
  if (event.key === 'Home') return 'first';
  if (event.key === 'End') return 'last';
  if (event.key.toLowerCase() === 'r') return 'reset';
  return null;
}

/**
 * Resolve a document keydown into one player command without reading React
 * state. Returning null means the event must keep its native browser behaviour.
 */
export function resolvePlaybackShortcut(
  event: KeyboardEvent,
  playback: Playback,
  doc: Document = document,
): PlaybackShortcut | null {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return null;
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return null;

  const command = shortcutFor(event);
  if (!command) return null;
  if (playback.frameCount <= 0) return null;
  if (isTextEntryOrReader(event.target)) return null;
  if (hasOpenModal(doc, event.target)) return null;

  if (command === 'toggle') {
    if (!canPlay(playback.frameCount)) return null;
    if (isActivationControl(event.target)) return null;
  }

  if (
    isHorizontalScrollFocused(doc) &&
    command !== 'reset'
  ) {
    return null;
  }

  return command;
}

/**
 * Execute one shortcut against the existing Playback object.
 *
 * The command calls the same prev/next/toggle/seek/restart functions as the
 * visible controls. It never replaces the trace, reruns Python, or creates a
 * second timer. `event.repeat` is ignored for state-changing Space/R presses.
 */
export function runPlaybackShortcut(
  event: KeyboardEvent,
  playback: Playback,
  doc: Document = document,
): boolean {
  const command = resolvePlaybackShortcut(event, playback, doc);
  if (!command) return false;

  event.preventDefault();
  if (event.repeat && (command === 'toggle' || command === 'reset')) return true;

  switch (command) {
    case 'prev':
      playback.prev();
      break;
    case 'next':
      playback.next();
      break;
    case 'toggle':
      playback.toggle();
      break;
    case 'reset':
      playback.restart();
      break;
    case 'first':
      playback.seek(0);
      break;
    case 'last':
      playback.seek(playback.frameCount - 1);
      break;
  }
  return true;
}

/**
 * Document-level shortcuts are scoped by `enabled`, which the workspace sets
 * only while a real algorithm canvas is visible. The handler reads the latest
 * Playback from a ref, so animation frames do not add/remove listeners and an
 * algorithm switch cannot leave a closure pointing at the previous trace.
 */
export function usePlaybackKeyboard(playback: Playback, enabled: boolean): void {
  const playbackRef = useRef(playback);
  playbackRef.current = playback;

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      runPlaybackShortcut(event, playbackRef.current);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
