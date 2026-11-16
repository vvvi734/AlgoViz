/**
 * Pack fixtures for tests.
 *
 * They reuse the real built-in lesson content so a fixture is schema-valid by
 * construction, then re-target it at `binary` — the algorithm the official
 * example pack uses.
 */
import { zipSync } from 'fflate';
import { bubbleSortLesson } from '../domain/lessons/bubbleSort';
import type { Lesson } from '../domain/lessons/types';

export function lessonFixture(overrides: Partial<Lesson> = {}): Lesson {
  return {
    ...bubbleSortLesson,
    lessonId: 'pack-course',
    algorithmId: 'binary',
    ...overrides,
  };
}

export function manifestFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    packFormatVersion: 1,
    packId: 'fixture-pack',
    version: '1.0.0',
    name: { zh: '样例知识包', en: 'Fixture pack' },
    description: { zh: '用于测试的知识包。', en: 'A pack used by tests.' },
    author: 'AlgoLens tests',
    license: 'MIT',
    requiredTraceSchema: 1,
    lessons: ['lessons/pack-course.json'],
    examples: [{ path: 'examples/pack-course.py', lessonId: 'pack-course', language: 'python' }],
    ...overrides,
  };
}

export interface PackFileOptions {
  manifest?: Record<string, unknown>;
  lesson?: Lesson;
  python?: string;
  license?: string;
  extra?: Record<string, string>;
}

/** Text files of a valid pack, keyed by exact ZIP path. */
export function packFileSet(options: PackFileOptions = {}): Record<string, string> {
  const lesson = options.lesson ?? lessonFixture();
  const files: Record<string, string> = {
    'manifest.json': JSON.stringify(options.manifest ?? manifestFixture()),
    LICENSE: options.license ?? 'MIT License\nCopyright (c) tests\n',
    'lessons/pack-course.json': JSON.stringify(lesson),
    'examples/pack-course.py': options.python ?? "trace({'type': 'array', 'values': [1]}, 'frame', lesson_step='init')\n",
  };
  return { ...files, ...(options.extra ?? {}) };
}

/** Build real ZIP bytes (deflate) from a path → text map. */
export function zipOf(files: Record<string, string>, level: 0 | 1 | 6 | 9 = 9): Uint8Array {
  const encoder = new TextEncoder();
  const entries: Record<string, Uint8Array> = {};
  for (const [name, text] of Object.entries(files)) entries[name] = encoder.encode(text);
  return zipSync(entries, { level });
}
