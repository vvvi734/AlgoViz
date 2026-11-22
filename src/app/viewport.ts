/**
 * A fresh reading session starts at the top of the page.
 *
 * The concept reader is a nested scroller (`.lab-main`) on wide screens, so
 * resetting only `documentElement` is not enough: the textbook hero could stay
 * scrolled even though the window itself is already at 0. Resetting both the
 * document and the known lab scroll containers keeps reload, course switches
 * and concept changes visually identical.
 */
export function resetScrollToTop(): void {
  if (typeof document === 'undefined') return;

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0;

  document
    .querySelectorAll<HTMLElement>('.lab-main, .lab-shell, .concept-page')
    .forEach((element) => {
      element.scrollTop = 0;
    });
}
