import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AutoGrowTextarea } from './AutoGrowTextarea';

function Harness() {
  const [value, setValue] = useState('8, 3, 5, 1, 7');
  return (
    <AutoGrowTextarea
      data-testid="auto-grow-input"
      aria-label="run values"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      minRows={1}
      maxRows={4}
    />
  );
}

describe('AutoGrowTextarea', () => {
  it('renders a textarea, not a clipped one-line input', () => {
    render(<Harness />);
    const field = screen.getByTestId('auto-grow-input');
    expect(field.tagName).toBe('TEXTAREA');
    expect(field.className).toContain('auto-grow-input');
    expect(field.getAttribute('rows')).toBe('1');
  });

  it('grows with content up to maxRows and then scrolls internally', () => {
    render(<Harness />);
    const field = screen.getByTestId('auto-grow-input') as HTMLTextAreaElement;
    Object.defineProperty(field, 'scrollHeight', { configurable: true, value: 220 });
    fireEvent.change(field, {
      target: { value: '8, 3, 5, 1, 7, 9, 2, 6, 4, 10, 12, 15, 18, 21, 24, 27' },
    });

    const height = Number.parseInt(field.style.height, 10);
    expect(height).toBeGreaterThan(44);
    expect(field.style.overflowY).toBe('auto');
  });
});
