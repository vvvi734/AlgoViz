import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  advance,
  clampIndex,
  clampPlayback,
  goTo,
  initialPlayback,
  progressLabel,
  reset,
  speedToMs,
  stepBackward,
  stepForward,
  togglePlay,
  type PlaybackState,
} from '../../domain/trace/player';
import type { TraceEvent } from '../../domain/trace/schema';

/** React binding for the pure playback state machine. */
export function usePlayback(events: TraceEvent[]) {
  const [state, setState] = useState<PlaybackState>(initialPlayback);
  const [speed, setSpeed] = useState(3);
  const frameCount = events.length;

  // A new trace always restarts at frame 0, stopped.
  //
  // The reset signal is the array IDENTITY of `events`, not its length: `events`
  // is the lab controller's React state value, so its identity changes exactly
  // once per execution — a successful run installs a fresh validated event array,
  // a failed run installs a fresh empty one — and stays stable across ordinary
  // re-renders (theme switch, language switch, typing, unrelated panel state).
  // That is what makes "new trace restarts" and "user scrubbing survives
  // re-renders" both true. A lengths-only signal would miss same-length traces.
  //
  // NEVER write `[frames]` here. `frames` is declared by lib.dom as
  // `declare var frames: WindowProxy`, so such a dependency type-checks and runs,
  // silently watches window.frames (a constant), and the reset never fires.
  // Run during the commit phase, before the first frame is painted or a
  // keyboard/mouse step can be handled. A passive effect here can arrive after
  // the user's first "next" click and overwrite it with frame 0.
  useLayoutEffect(() => {
    setState(initialPlayback);
  }, [events]);

  // Hard invariant: the index is always inside [0, frameCount - 1]. This covers
  // traces that shrink without the reset above applying first (an error swaps in
  // an empty trace) and guarantees `events[index]` is never undefined.
  // `clampPlayback` returns the same object when the index is already valid, so
  // this can never loop or reset a legitimate position.
  useEffect(() => {
    setState((current) => clampPlayback(current, frameCount));
  }, [frameCount]);

  // The only timer in the app. It is torn down whenever playback stops, the
  // trace changes, or the speed changes — so a timer from a previous trace can
  // never move the new one.
  useEffect(() => {
    if (!state.playing || frameCount <= 1) return;
    const timer = window.setInterval(() => {
      setState((current) => advance(current, frameCount));
    }, speedToMs(speed));
    return () => window.clearInterval(timer);
  }, [state.playing, speed, frameCount]);

  const stop = useCallback(() => setState((s) => ({ ...s, playing: false })), []);
  const toggle = useCallback(() => setState((s) => togglePlay(s, frameCount)), [frameCount]);
  const next = useCallback(() => setState((s) => ({ ...stepForward(s, frameCount), playing: false })), [frameCount]);
  const prev = useCallback(() => setState((s) => stepBackward(s, frameCount)), [frameCount]);
  const seek = useCallback((index: number) => setState((s) => ({ ...goTo(s, frameCount, index), playing: false })), [frameCount]);
  const restart = useCallback(() => setState(reset(initialPlayback)), []);
  const changeSpeed = useCallback((value: number) => setSpeed(value), []);

  // Read through the clamp as well: the render that first sees a shorter trace
  // happens before the effect above commits, and it must not index out of range.
  const index = clampIndex(state.index, frameCount);

  return useMemo(() => ({
    index,
    playing: state.playing,
    speed,
    progress: progressLabel({ index, playing: state.playing }, frameCount),
    frameCount,
    toggle,
    next,
    prev,
    seek,
    restart,
    stop,
    setSpeed: changeSpeed,
  }), [index, state.playing, speed, frameCount, toggle, next, prev, seek, restart, stop, changeSpeed]);
}

export type Playback = ReturnType<typeof usePlayback>;
