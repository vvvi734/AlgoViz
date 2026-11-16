import { describe, expect, it } from 'vitest';
import { bubbleSortLesson } from '../lessons/bubbleSort';
import { buildLearningSession, parseLearningSession, serializeLearningSession } from './session';

const lesson = bubbleSortLesson;

const build = (overrides: Partial<Parameters<typeof buildLearningSession>[0]> = {}) =>
  buildLearningSession({
    lesson,
    locale: 'zh',
    origin: { kind: 'builtin' },
    createdAt: '2026-11-16T04:05:06.000Z',
    ...overrides,
  });

describe('learning session (.algosession.json)', () => {
  it('builds a session for a built-in course and round-trips through the parser', () => {
    const result = build({ selectedStepId: 'compare', source: 'print(1)\n', input: [3, 1, 2] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.lessonId).toBe('bubble-sort-basics');
    expect(result.value.algorithmId).toBe('bubble');
    expect(result.value.lessonOrigin).toEqual({ kind: 'builtin' });

    const reparsed = parseLearningSession(serializeLearningSession(result.value));
    expect(reparsed.ok).toBe(true);
    if (reparsed.ok) expect(reparsed.value).toEqual(result.value);
  });

  it('records a pack origin with its id', () => {
    const result = build({ origin: { kind: 'pack', packId: 'algolens-search-basics', version: '1.0.0' } });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.lessonOrigin).toEqual({ kind: 'pack', packId: 'algolens-search-basics', version: '1.0.0' });
  });

  it('rejects a step id the course does not contain', () => {
    const result = build({ selectedStepId: 'not-a-stage' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0].code).toBe('step-unknown');
  });

  it('rejects source and input that exceed the limits', () => {
    const tooLong = build({ source: 'x'.repeat(40_001) });
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) expect(tooLong.errors[0].code).toBe('source-too-large');

    const bigInput = build({ input: Array.from({ length: 2000 }, () => 12345) });
    expect(bigInput.ok).toBe(false);
    if (!bigInput.ok) expect(bigInput.errors[0].code).toBe('input-too-large');
  });

  it('accepts plain JSON input and rejects values that are not JSON', () => {
    const ok = build({ input: { arr: [3, 1, 2], i: 0 } });
    expect(ok.ok).toBe(true);

    // A function is not a JSON value; the session must not be written with it.
    const withFunction = build({ input: { bad: () => 1 } as unknown });
    expect(withFunction.ok).toBe(false);
    if (!withFunction.ok) expect(withFunction.errors[0].code).toBe('context-invalid');
  });

  it('refuses unknown keys such as an API key', () => {
    const parsed = parseLearningSession(
      JSON.stringify({
        sessionFormatVersion: 1,
        lessonId: 'bubble-sort-basics',
        algorithmId: 'bubble',
        locale: 'zh',
        lessonOrigin: { kind: 'builtin' },
        createdAt: '2026-11-16T04:05:06.000Z',
        apiKey: 'sk-should-never-be-here',
      }),
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors[0].code).toBe('session-invalid');
  });

  it('rejects broken JSON, a wrong format version and an oversized file', () => {
    const broken = parseLearningSession('{ not json');
    expect(broken.ok).toBe(false);
    if (!broken.ok) expect(broken.errors[0].code).toBe('session-json');

    const wrongVersion = parseLearningSession(
      JSON.stringify({
        sessionFormatVersion: 2,
        lessonId: 'bubble-sort-basics',
        algorithmId: 'bubble',
        locale: 'zh',
        lessonOrigin: { kind: 'builtin' },
        createdAt: '2026-11-16T04:05:06.000Z',
      }),
    );
    expect(wrongVersion.ok).toBe(false);
    if (!wrongVersion.ok) expect(wrongVersion.errors[0].code).toBe('session-format-version');

    const huge = parseLearningSession(JSON.stringify({ padding: 'x'.repeat(100_000) }));
    expect(huge.ok).toBe(false);
    if (!huge.ok) expect(huge.errors[0].code).toBe('session-too-large');
  });

  it('treats a missing locale and a bad timestamp as invalid', () => {
    const missingLocale = parseLearningSession(
      JSON.stringify({
        sessionFormatVersion: 1,
        lessonId: 'bubble-sort-basics',
        algorithmId: 'bubble',
        lessonOrigin: { kind: 'builtin' },
        createdAt: '2026-11-16T04:05:06.000Z',
      }),
    );
    expect(missingLocale.ok).toBe(false);

    const badTime = build({ createdAt: 'yesterday' });
    expect(badTime.ok).toBe(false);
    if (!badTime.ok) expect(badTime.errors[0].code).toBe('session-invalid');
  });
});
