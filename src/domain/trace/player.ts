/**
 * Pure playback state machine. The React layer only owns the interval timer;
 * every transition lives here so animation behaviour can be regression-tested
 * without a DOM, a Worker, or fake timers.
 */
export interface PlaybackState {
  index: number;
  playing: boolean;
}

export const initialPlayback: PlaybackState = { index: 0, playing: false };

export const SPEED_MS: Record<number, number> = { 1: 850, 2: 600, 3: 390, 4: 230, 5: 120 };

export function speedToMs(speed: number): number {
  return SPEED_MS[speed] ?? 390;
}

export function maxIndex(frameCount: number): number {
  return Math.max(0, frameCount - 1);
}

export function clampIndex(index: number, frameCount: number): number {
  return Math.min(Math.max(0, Math.trunc(index) || 0), maxIndex(frameCount));
}

export function canPlay(frameCount: number): boolean {
  return frameCount > 1;
}

export function goTo(state: PlaybackState, frameCount: number, index: number): PlaybackState {
  return { ...state, index: clampIndex(index, frameCount) };
}

export function stepForward(state: PlaybackState, frameCount: number): PlaybackState {
  return { ...state, index: clampIndex(state.index + 1, frameCount) };
}

export function stepBackward(state: PlaybackState, frameCount: number): PlaybackState {
  return { ...state, index: clampIndex(state.index - 1, frameCount), playing: false };
}

export function reset(_state: PlaybackState): PlaybackState {
  return { index: 0, playing: false };
}

/** Play/pause toggle. Starting from the last frame restarts from frame 0. */
export function togglePlay(state: PlaybackState, frameCount: number): PlaybackState {
  if (state.playing) return { ...state, playing: false };
  if (!canPlay(frameCount)) return state;
  return { index: state.index >= maxIndex(frameCount) ? 0 : state.index, playing: true };
}

/** One timer tick. Reaching the final frame stops playback automatically. */
export function advance(state: PlaybackState, frameCount: number): PlaybackState {
  if (!state.playing) return state;
  if (state.index >= maxIndex(frameCount)) return { ...state, playing: false };
  const index = state.index + 1;
  return { index, playing: index < maxIndex(frameCount) };
}

export function progressLabel(state: PlaybackState, frameCount: number): string {
  return `${frameCount ? state.index + 1 : 0} / ${frameCount}`;
}

/**
 * Force a playback state back inside `[0, maxIndex(frameCount)]`.
 *
 * Returns the SAME object when nothing needs fixing, so it is safe to feed
 * straight into a React state updater (`setState(current => clampPlayback(...))`)
 * without causing an extra render on every commit.
 *
 * An index past the end means the trace it referred to no longer exists, so
 * playback is stopped as well — resuming would silently rewind to frame 0.
 */
export function clampPlayback(state: PlaybackState, frameCount: number): PlaybackState {
  const max = maxIndex(frameCount);
  if (state.index >= 0 && state.index <= max) return state;
  return {
    index: Math.min(Math.max(0, Math.trunc(state.index) || 0), max),
    playing: false,
  };
}
