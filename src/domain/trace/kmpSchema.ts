import { z } from 'zod';

/** KMP uses a deliberately explicit, zero-based lps convention. */
export const KMP_PHASES = ['build', 'search'] as const;
export const KMP_OPERATIONS = [
  'init',
  'build-start',
  'build-compare',
  'build-fallback',
  'build-record',
  'build-complete',
  'search-start',
  'search-compare',
  'search-advance',
  'search-fallback',
  'search-miss',
  'match-found',
  'search-done',
] as const;

export type KmpPhase = (typeof KMP_PHASES)[number];
export type KmpOperation = (typeof KMP_OPERATIONS)[number];

export const KMP_MAX_TEXT = 24;
export const KMP_MAX_PATTERN = 12;

const OPERATION_PHASE: Record<KmpOperation, KmpPhase> = {
  init: 'build',
  'build-start': 'build',
  'build-compare': 'build',
  'build-fallback': 'build',
  'build-record': 'build',
  'build-complete': 'build',
  'search-start': 'search',
  'search-compare': 'search',
  'search-advance': 'search',
  'search-fallback': 'search',
  'search-miss': 'search',
  'match-found': 'search',
  'search-done': 'search',
};

/** The single LPS definition every frame and diagram in this course uses. */
export function computeKmpLps(pattern: string): number[] {
  const lps = Array.from({ length: pattern.length }, () => 0);
  let length = 0;
  for (let i = 1; i < pattern.length; i += 1) {
    while (length > 0 && pattern[i] !== pattern[length]) {
      length = lps[length - 1];
    }
    if (pattern[i] === pattern[length]) length += 1;
    lps[i] = length;
  }
  return lps;
}

const integer = z.number().int().finite();

export const kmpSnapshotSchema = z
  .object({
    kind: z.literal('kmp'),
    phase: z.enum(KMP_PHASES),
    operation: z.enum(KMP_OPERATIONS),
    /** Main string, at most 24 Unicode code points. */
    text: z.string().max(KMP_MAX_TEXT),
    /** Pattern string, at most 12 Unicode code points. */
    pattern: z.string().min(1).max(KMP_MAX_PATTERN),
    /** lps[k] = longest proper prefix of pattern[0..k] that is also its suffix. */
    lps: z.array(integer.min(0).max(KMP_MAX_PATTERN)).max(KMP_MAX_PATTERN),
    /** Number of leading lps entries already final. Uncomputed entries stay 0. */
    lpsReady: integer.min(0).max(KMP_MAX_PATTERN),
    i: integer.nullable(),
    j: integer.nullable(),
    matched: z.boolean().nullable(),
    fallbackFrom: integer.nullable(),
    fallbackTo: integer.nullable(),
    /** Every match start found so far, in ascending order. */
    matches: z.array(integer.min(0)).max(KMP_MAX_TEXT),
    /** Last complete match, retained for highlighting while the search continues. */
    currentMatchStart: integer.nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const issue = (path: string[], message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const n = snapshot.text.length;
    const m = snapshot.pattern.length;
    const canonical = computeKmpLps(snapshot.pattern);

    if (OPERATION_PHASE[snapshot.operation] !== snapshot.phase) {
      issue(['phase'], `${snapshot.operation} belongs to another phase`);
    }
    if (snapshot.lps.length !== m) {
      issue(['lps'], `lps length ${snapshot.lps.length} != pattern length ${m}`);
    }
    if (snapshot.lpsReady < 0 || snapshot.lpsReady > m) {
      issue(['lpsReady'], `lpsReady ${snapshot.lpsReady} outside 0..${m}`);
    }
    for (let index = 0; index < m; index += 1) {
      if (index < snapshot.lpsReady) {
        if (snapshot.lps[index] !== canonical[index]) {
          issue(['lps', String(index)], `lps[${index}] ${snapshot.lps[index]} != canonical ${canonical[index]}`);
        }
      } else if (snapshot.lps[index] !== 0) {
        issue(['lps', String(index)], `uncomputed lps[${index}] must stay 0`);
      }
    }

    if (snapshot.i !== null) {
      if (snapshot.phase === 'build' && snapshot.operation !== 'init') {
        if (snapshot.i < 1 || snapshot.i > m) issue(['i'], `build i ${snapshot.i} outside 1..${m}`);
      }
      if (snapshot.phase === 'search' && (snapshot.i < 0 || snapshot.i > n)) {
        issue(['i'], `search i ${snapshot.i} outside 0..${n}`);
      }
    }
    if (snapshot.j !== null && (snapshot.j < 0 || snapshot.j > m)) {
      issue(['j'], `j ${snapshot.j} outside 0..${m}`);
    }
    if (snapshot.operation === 'init') {
      if (snapshot.i !== null || snapshot.j !== null) issue([], 'init must not have live pointers');
      if (snapshot.lpsReady !== 0) issue(['lpsReady'], 'init starts with no lps entries');
    } else if (snapshot.i === null || snapshot.j === null) {
      issue([], `${snapshot.operation} must have both pointers`);
    }

    if (snapshot.operation === 'build-start') {
      if (snapshot.lpsReady !== 1) issue(['lpsReady'], 'build-start has lps[0] ready');
      if (snapshot.i !== 1 || snapshot.j !== 0) issue(['i'], 'build-start begins at i=1, j=0');
    }
    if (snapshot.operation === 'build-record') {
      if (snapshot.i === null) return;
      if (snapshot.lpsReady !== snapshot.i + 1) {
        issue(['lpsReady'], `build-record ready ${snapshot.lpsReady} != i + 1`);
      }
      if (snapshot.lps[snapshot.i] !== snapshot.j) {
        issue(['lps', String(snapshot.i)], 'recorded lps[i] must equal the live j');
      }
    }
    if (snapshot.operation === 'build-complete') {
      if (snapshot.lpsReady !== m) issue(['lpsReady'], 'build-complete needs the full table');
      if (snapshot.i !== m) issue(['i'], 'build-complete points past the pattern');
    }
    if (snapshot.operation === 'build-compare') {
      if (snapshot.i === null || snapshot.j === null) return;
      if (snapshot.i >= m || snapshot.j >= m) issue([], 'build comparison pointers must be inside the pattern');
      if (snapshot.matched !== (snapshot.pattern[snapshot.i] === snapshot.pattern[snapshot.j])) {
        issue(['matched'], 'build comparison result disagrees with the two characters');
      }
    }
    if (snapshot.operation === 'search-compare') {
      if (snapshot.i === null || snapshot.j === null) return;
      if (snapshot.i >= n || snapshot.j >= m) issue([], 'search comparison pointers must be inside their strings');
      if (snapshot.matched !== (snapshot.text[snapshot.i] === snapshot.pattern[snapshot.j])) {
        issue(['matched'], 'search comparison result disagrees with the two characters');
      }
    }
    if (snapshot.operation === 'match-found') {
      if (snapshot.i === null || snapshot.j === null) return;
      if (snapshot.j !== m) issue(['j'], 'match-found must have j=m');
      if (snapshot.currentMatchStart === null) issue(['currentMatchStart'], 'match-found needs a start');
      else if (snapshot.i !== snapshot.currentMatchStart + m) {
        issue(['i'], 'match-found i must point just after the match');
      }
      if (snapshot.matched !== true) issue(['matched'], 'match-found must record equality');
    }
    if (snapshot.operation === 'search-start' && (snapshot.i !== 0 || snapshot.j !== 0)) {
      issue([], 'search-start begins at i=0, j=0');
    }
    if (snapshot.operation === 'search-done' && snapshot.i !== n) {
      issue(['i'], 'search-done must point past the text');
    }
    if (snapshot.j !== null && snapshot.operation === 'search-fallback' && snapshot.j >= m) {
      issue(['j'], 'search fallback must keep j below m');
    }

    const fallbackOperation =
      snapshot.operation === 'build-fallback' || snapshot.operation === 'search-fallback';
    if (fallbackOperation) {
      const from = snapshot.fallbackFrom;
      const to = snapshot.fallbackTo;
      if (from === null || to === null) {
        issue([], 'fallback frame needs fallbackFrom and fallbackTo');
      } else {
        if (from <= 0 || from > m || to < 0 || to >= from) {
          issue(['fallbackFrom'], `invalid fallback ${from} -> ${to}`);
        } else if (snapshot.j !== to) {
          issue(['j'], 'fallback frame j must equal fallbackTo');
        } else if (to !== canonical[from - 1]) {
          issue(['fallbackTo'], `lps[${from - 1}] is ${canonical[from - 1]}, not ${to}`);
        }
      }
      if (snapshot.matched !== false) issue(['matched'], 'fallback frame must be a mismatch');
    } else if (snapshot.fallbackFrom !== null || snapshot.fallbackTo !== null) {
      issue([], 'fallback fields belong only to fallback frames');
    }

    const starts = snapshot.matches;
    for (let index = 0; index < starts.length; index += 1) {
      const start = starts[index];
      if (start + m > n) issue(['matches', String(index)], `match ${start} exceeds the text`);
      if (snapshot.text.slice(start, start + m) !== snapshot.pattern) {
        issue(['matches', String(index)], `match ${start} does not equal the pattern`);
      }
      if (index > 0 && start <= starts[index - 1]) {
        issue(['matches', String(index)], 'matches must be strictly increasing');
      }
    }
    if (snapshot.currentMatchStart !== null) {
      if (!starts.includes(snapshot.currentMatchStart)) {
        issue(['currentMatchStart'], 'current match must appear in matches');
      }
      if (snapshot.currentMatchStart !== starts[starts.length - 1]) {
        issue(['currentMatchStart'], 'current match must be the latest match');
      }
    }
  });

export type KmpSnapshot = z.infer<typeof kmpSnapshotSchema>;
