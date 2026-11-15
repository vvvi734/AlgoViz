import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  advance,
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
import type { TraceFrame } from '../../domain/trace/types';

/** React binding for the pure playback state machine. */
export function usePlayback(frames: TraceFrame[]) {
  const [state, setState] = useState<PlaybackState>(initialPlayback);
  const [speed, setSpeed] = useState(3);
  const frameCount = frames.length;

  // A new run always starts at frame 0 with playback stopped.
  useEffect(() => {
    setState(initialPlayback);
  }, [frames]);

  useEffect(() => {
    if (!state.playing) return;
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

  return useMemo(() => ({
    index: state.index,
    playing: state.playing,
    speed,
    progress: progressLabel(state, frameCount),
    frameCount,
    toggle,
    next,
    prev,
    seek,
    restart,
    stop,
    setSpeed: changeSpeed,
  }), [state, speed, frameCount, toggle, next, prev, seek, restart, stop, changeSpeed]);
}

export type Playback = ReturnType<typeof usePlayback>;
