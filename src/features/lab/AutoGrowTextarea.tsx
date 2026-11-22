import {
  useLayoutEffect,
  useRef,
  type TextareaHTMLAttributes,
} from 'react';

type AutoGrowTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> & {
  value: string;
  /** Minimum visible lines; the field never collapses below this height. */
  minRows?: number;
  /** Maximum visible lines; longer input scrolls inside the field. */
  maxRows?: number;
};

/**
 * A textarea that grows with its value instead of hiding a long list in one
 * clipped line. Height is measured after every value change and on window
 * resize; once the `maxRows` ceiling is reached the field itself scrolls.
 */
export function AutoGrowTextarea({
  className = '',
  minRows = 1,
  maxRows = 8,
  value,
  spellCheck = false,
  autoComplete = 'off',
  ...props
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof window === 'undefined') return;

    const resize = () => {
      const computed = window.getComputedStyle(element);
      const lineHeight = Number.parseFloat(computed.lineHeight);
      const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
      const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0;
      const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
      const borderBottom = Number.parseFloat(computed.borderBottomWidth) || 0;
      const line = Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : 22;
      const chrome = paddingTop + paddingBottom + borderTop + borderBottom;
      const low = Math.max(1, minRows) * line + chrome;
      const high = Math.max(Math.max(1, minRows), maxRows) * line + chrome;

      element.style.resize = 'none';
      // Reset before measuring so a previous manual height cannot make the
      // content look shorter than it really is.
      element.style.height = 'auto';
      const content = element.scrollHeight;
      const next = Math.min(Math.max(content, low), high);
      element.style.height = `${next}px`;
      element.style.overflowY = content > high + 1 ? 'auto' : 'hidden';
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [value, minRows, maxRows]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={minRows}
      value={value}
      spellCheck={spellCheck}
      autoComplete={autoComplete}
      className={`input code-dock-input auto-grow-input${className ? ` ${className}` : ''}`}
    />
  );
}
