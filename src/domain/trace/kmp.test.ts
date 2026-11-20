import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/kmp-default-frames.json';
import rawEdge from '../../test/fixtures/kmp-edge-frames.json';
import { buildKmpModel } from '../visualization/kmpModel';
import { computeKmpLps, kmpSnapshotSchema, structureSchema, type KmpSnapshot } from './schema';
import type { TraceState } from './types';

type Frame = { state: TraceState; structure: KmpSnapshot; lessonStepId: string };
const defaults = rawDefault as unknown as Frame[];
const edges = rawEdge as unknown as Record<string, Frame[]>;

function parse(frames: Frame[]): KmpSnapshot[] {
  return frames.map((frame) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    const typed = kmpSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return frame.structure;
  });
}

describe('STR-01 real Python KMP fixtures', () => {
  it('accepts every default and edge frame as a KMP snapshot', () => {
    parse(defaults);
    for (const frames of Object.values(edges)) parse(frames);
    expect(defaults).toHaveLength(47);
    const edgeCount = Object.values(edges).reduce((sum, frames) => sum + frames.length, 0);
    expect(edgeCount).toBe(281);
  });

  it('uses the documented zero-based lps convention and finds 2 and 9', () => {
    const frames = parse(defaults);
    expect(computeKmpLps('ABABC')).toEqual([0, 0, 1, 2, 0]);
    const complete = frames.find((snapshot) => snapshot.operation === 'build-complete')!;
    expect(complete.lps).toEqual([0, 0, 1, 2, 0]);
    expect(complete.lpsReady).toBe(5);

    const found = frames.filter((snapshot) => snapshot.operation === 'match-found');
    expect(found).toHaveLength(2);
    expect(found[0].currentMatchStart).toBe(2);
    expect(found[1].currentMatchStart).toBe(9);
    expect(found[1].matches).toEqual([2, 9]);

    const final = frames.at(-1)!;
    expect(final.operation).toBe('search-done');
    expect(final.i).toBe(14);
    expect(final.matches).toEqual([2, 9]);
    expect(final.currentMatchStart).toBe(9);
  });

  it('derives the build fallback from lps[j-1], then keeps i fixed during search fallback', () => {
    const frames = parse(defaults);
    const buildFallback = frames.find((snapshot) => snapshot.operation === 'build-fallback')!;
    expect(buildFallback.i).toBe(4);
    expect(buildFallback.fallbackFrom).toBe(2);
    expect(buildFallback.fallbackTo).toBe(0);
    expect(buildFallback.j).toBe(0);
    expect(buildFallback.matched).toBe(false);

    const searchFallback = frames.find((snapshot) => snapshot.operation === 'search-fallback')!;
    expect(searchFallback.i).toBe(4);
    expect(searchFallback.fallbackFrom).toBe(4);
    expect(searchFallback.fallbackTo).toBe(2);
    expect(searchFallback.j).toBe(2);
    expect(searchFallback.matched).toBe(false);

    // After the fallback only j moves, so the very next comparison reuses i=4.
    const after = frames[frames.indexOf(searchFallback) + 1];
    expect(after.operation).toBe('search-compare');
    expect(after.i).toBe(4);
  });

  it('supports overlapping, partial, missing, single-character and repeated cases', () => {
    expect(parse(edges.overlap!).at(-1)!.matches).toEqual([0, 1, 2]);
    expect(parse(edges.partial_fallback!).at(-1)!.matches).toEqual([2]);
    expect(parse(edges.no_match!).at(-1)!.matches).toEqual([]);
    expect(parse(edges.single_hit!).at(-1)!.matches).toEqual([0]);
    expect(parse(edges.single_miss!).at(-1)!.matches).toEqual([]);
    expect(parse(edges.repeated!).at(-1)!.matches).toEqual([0, 1, 2]);
    expect(parse(edges.text_shorter!).at(-1)!.matches).toEqual([]);
    expect(parse(edges.empty_text!).at(-1)!.matches).toEqual([]);
  });

  it('rejects inconsistent lps, pointers and fallback values', () => {
    const init = defaults[0].structure;
    expect(kmpSnapshotSchema.safeParse({ ...init, lpsReady: 1 }).success).toBe(false);
    expect(kmpSnapshotSchema.safeParse({ ...init, i: 0 }).success).toBe(false);

    const comparison = defaults.find((frame) => frame.structure.operation === 'build-compare')!.structure;
    expect(kmpSnapshotSchema.safeParse({ ...comparison, matched: !comparison.matched }).success).toBe(false);

    const fallback = defaults.find((frame) => frame.structure.operation === 'search-fallback')!.structure;
    expect(kmpSnapshotSchema.safeParse({ ...fallback, fallbackTo: 0 }).success).toBe(false);
  });
});

describe('STR-01 KMP visual model', () => {
  it('shows the full lps table only after it is ready', () => {
    const frames = parse(defaults);
    const before = frames[1];
    const modelBefore = buildKmpModel(before);
    expect(modelBefore.operation).toBe('build-start');
    expect(modelBefore.lpsCells.map((cell) => cell.value)).toEqual([0, null, null, null, null]);

    const complete = frames.find((snapshot) => snapshot.operation === 'build-complete')!;
    const modelComplete = buildKmpModel(complete);
    expect(modelComplete.lpsCells.map((cell) => cell.value)).toEqual([0, 0, 1, 2, 0]);
    expect(modelComplete.boardColumns).toBe(5);
  });

  it('highlights the fallback cell, the realigned compare cell and the unchanged i', () => {
    const frames = parse(defaults);
    const fallback = frames.find((snapshot) => snapshot.operation === 'search-fallback')!;
    const model = buildKmpModel(fallback);
    expect(model.alignment).toBe(2);
    expect(model.i).toBe(4);
    expect(model.j).toBe(2);
    expect(model.textCells[4].tone).toBe('mismatch');
    expect(model.patternCells[2].tone).toBe('compare');
    expect(model.patternCells[4].tone).toBe('fallback');
  });

  it('marks the full match range and keeps a historical start visible', () => {
    const frames = parse(defaults);
    const found = frames.find((snapshot) => snapshot.operation === 'match-found')!;
    const modelFound = buildKmpModel(found);
    expect(modelFound.matches).toEqual([2]);
    expect(modelFound.textCells.slice(2, 7).every((cell) => cell.tone === 'found')).toBe(true);
    expect(modelFound.patternCells.every((cell) => cell.tone === 'found')).toBe(true);

    const next = frames[frames.indexOf(found) + 1];
    const modelNext = buildKmpModel(next);
    expect(modelNext.textCells[2].tone).toBe('start');
    expect(modelNext.textCells[7].tone).toBe('match');
  });

  it('keeps the last match aligned on search-done and avoids an off-canvas pattern', () => {
    const final = parse(defaults).at(-1)!;
    const model = buildKmpModel(final);
    expect(model.alignment).toBe(9);
    expect(model.boardColumns).toBe(14);
    expect(model.textCells.slice(9, 14).every((cell) => cell.tone === 'found')).toBe(true);
  });

  it('marks the compared character when j=0 forces i forward', () => {
    const frames = parse(edges.no_match!);
    const miss = frames.find((snapshot) => snapshot.operation === 'search-miss')!;
    const model = buildKmpModel(miss);
    expect(miss.i).toBe(1);
    expect(model.i).toBe(1);
    expect(model.textCells[0].tone).toBe('mismatch');
  });
});
