import { describe, expect, it } from 'vitest';
import {
  advance,
  canPlay,
  clampIndex,
  goTo,
  initialPlayback,
  progressLabel,
  reset,
  speedToMs,
  stepBackward,
  stepForward,
  togglePlay,
} from './player';

const N = 5;

describe('playback state machine (legacy animation regression)', () => {
  it('clamps navigation to the available frame range', () => {
    expect(clampIndex(-3, N)).toBe(0);
    expect(clampIndex(99, N)).toBe(4);
    expect(clampIndex(2.9, N)).toBe(2);
    expect(clampIndex(2, 0)).toBe(0);
  });

  it('steps forward/backward and always stops on manual navigation', () => {
    const at2 = goTo(initialPlayback, N, 2);
    expect(stepForward({ ...at2, playing: true }, N)).toEqual({ index: 3, playing: true });
    expect(stepBackward({ ...at2, playing: true }, N)).toEqual({ index: 1, playing: false });
    expect(stepBackward({ index: 0, playing: true }, N)).toEqual({ index: 0, playing: false });
    expect(stepForward({ index: 4, playing: true }, N)).toEqual({ index: 4, playing: true });
  });

  it('toggles play/pause and restarts from the last frame', () => {
    expect(togglePlay(initialPlayback, N)).toEqual({ index: 0, playing: true });
    expect(togglePlay({ index: 2, playing: true }, N)).toEqual({ index: 2, playing: false });
    expect(togglePlay({ index: 4, playing: false }, N)).toEqual({ index: 0, playing: true });
    expect(togglePlay({ index: 0, playing: false }, 1)).toEqual({ index: 0, playing: false });
  });

  it('stops automatically when the timer reaches the final frame', () => {
    let state = { index: 3, playing: true };
    state = advance(state, N);
    expect(state).toEqual({ index: 4, playing: false });
    expect(advance(state, N)).toEqual({ index: 4, playing: false });
  });

  it('never advances while paused', () => {
    expect(advance({ index: 1, playing: false }, N)).toEqual({ index: 1, playing: false });
  });

  it('requires at least two frames to play', () => {
    expect(canPlay(0)).toBe(false);
    expect(canPlay(1)).toBe(false);
    expect(canPlay(2)).toBe(true);
  });

  it('reset, progress label and speed mapping match the legacy UI', () => {
    expect(reset({ index: 3, playing: true })).toEqual({ index: 0, playing: false });
    expect(progressLabel({ index: 1, playing: false }, 5)).toBe('2 / 5');
    expect(progressLabel(initialPlayback, 0)).toBe('0 / 0');
    expect([1, 2, 3, 4, 5].map(speedToMs)).toEqual([850, 600, 390, 230, 120]);
    expect(speedToMs(99)).toBe(390);
  });
});
