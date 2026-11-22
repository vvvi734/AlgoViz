import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAlgorithmGuidePreferences } from './useAlgorithmGuidePreferences';

function renderGuide(algorithmId: string) {
  return renderHook(
    ({ id }: { id: string }) => useAlgorithmGuidePreferences(id),
    { initialProps: { id: algorithmId } },
  );
}

describe('useAlgorithmGuidePreferences', () => {
  it('opens an unseen course by default', () => {
    const { result } = renderGuide('bubble');
    expect(result.current.isOpen).toBe(true);
  });

  it('keeps a per-course fold during the same session', () => {
    const { result, rerender } = renderGuide('bubble');
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);

    rerender({ id: 'insertion' });
    expect(result.current.isOpen).toBe(true);

    rerender({ id: 'bubble' });
    expect(result.current.isOpen).toBe(false);
  });

  it('starts every course open again after a remount', () => {
    const first = renderGuide('bubble');
    act(() => first.result.current.toggle());
    expect(first.result.current.isOpen).toBe(false);
    first.unmount();

    const second = renderGuide('bubble');
    expect(second.result.current.isOpen).toBe(true);
  });
});
