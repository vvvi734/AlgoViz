import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlayback } from './usePlayback';
import type { TraceEvent } from '../../domain/trace/schema';

/** Build a synthetic trace of `count` events; each call returns a NEW array. */
function makeTrace(count: number, label = 'STEP'): TraceEvent[] {
  return Array.from({ length: count }, (_, index): TraceEvent => ({
    schemaVersion: 1,
    step: index,
    eventType: 'step',
    visualType: 'array',
    state: { type: 'array', values: [index] },
    message: `${label} ${index}`,
  }));
}

function renderPlayback(initialEvents: TraceEvent[]) {
  return renderHook(({ events }) => usePlayback(events), { initialProps: { events: initialEvents } });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('usePlayback — trace identity resets the timeline (Stage 3 fix)', () => {
  it('scenario A: a shorter trace after scrubbing far forward restarts at frame 0', () => {
    const longTrace = makeTrace(20, 'LONG');
    const { result, rerender } = renderPlayback(longTrace);

    act(() => result.current.seek(12));
    expect(result.current.index).toBe(12);
    expect(result.current.progress).toBe('13 / 20');

    rerender({ events: makeTrace(5, 'SHORT') });

    // The old index (12) is outside the new trace (5 frames) — it must not survive.
    expect(result.current.index).toBe(0);
    expect(result.current.playing).toBe(false);
    expect(result.current.progress).toBe('1 / 5');
  });

  it('scenario A (boundary): index is valid and points at a real event after the swap', () => {
    const longTrace = makeTrace(20, 'LONG');
    const shortTrace = makeTrace(5, 'SHORT');
    const { result, rerender } = renderPlayback(longTrace);

    act(() => result.current.seek(19));
    rerender({ events: shortTrace });

    expect(result.current.index).toBeLessThan(shortTrace.length);
    expect(result.current.index).toBe(0);
  });

  it('scenario B: a timer from the previous trace cannot move the new trace', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderPlayback(makeTrace(20, 'LONG'));

    act(() => result.current.toggle());
    expect(result.current.playing).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2000); // speed 3 = 390 ms/tick
    });
    expect(result.current.index).toBeGreaterThan(0);

    rerender({ events: makeTrace(6, 'SHORT') });
    expect(result.current.playing).toBe(false);
    expect(result.current.index).toBe(0);

    // Any residual interval would keep advancing the index here.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.index).toBe(0);
    expect(result.current.playing).toBe(false);
  });

  it('scenario C: an empty trace is safe for every control', () => {
    const { result } = renderPlayback([]);

    expect(result.current.index).toBe(0);
    expect(result.current.progress).toBe('0 / 0');
    expect(result.current.frameCount).toBe(0);

    act(() => result.current.toggle());
    expect(result.current.playing).toBe(false);

    act(() => {
      result.current.next();
      result.current.prev();
      result.current.seek(99);
      result.current.seek(-5);
      result.current.restart();
    });

    expect(result.current.index).toBe(0);
    expect(result.current.playing).toBe(false);
  });

  it('scenario D: same frame count, different trace, still restarts at frame 0', () => {
    const { result, rerender } = renderPlayback(makeTrace(6, 'FIRST'));

    act(() => result.current.seek(4));
    expect(result.current.index).toBe(4);

    // Same length, different execution batch: length-based clamping alone would
    // leave index 4 in place, so identity must be the reset signal.
    rerender({ events: makeTrace(6, 'SECOND') });
    expect(result.current.index).toBe(0);
    expect(result.current.progress).toBe('1 / 6');
  });

  it('scenario E: unrelated re-renders keep the user position', () => {
    const trace = makeTrace(12, 'SAME');
    const { result, rerender } = renderPlayback(trace);

    act(() => result.current.seek(7));
    expect(result.current.index).toBe(7);

    // Same array reference — e.g. a theme or language re-render. No reset.
    rerender({ events: trace });
    expect(result.current.index).toBe(7);
    expect(result.current.progress).toBe('8 / 12');

    // Changing speed is not a new trace either.
    act(() => result.current.setSpeed(5));
    expect(result.current.index).toBe(7);
  });

  it('keeps playing position inside bounds when a shorter trace arrives mid-play', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderPlayback(makeTrace(15, 'LONG'));

    act(() => result.current.toggle());
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    const before = result.current.index;
    expect(before).toBeGreaterThan(2);

    rerender({ events: makeTrace(3, 'SHORT') });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.index).toBeLessThan(3);
    expect(result.current.playing).toBe(false);
  });
});
