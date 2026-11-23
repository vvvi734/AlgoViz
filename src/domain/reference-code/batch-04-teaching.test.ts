import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { REFERENCE_ANNOTATIONS } from './annotations';
import { BATCH_04_ANNOTATIONS } from './batch-04-annotations';
import { localizeReferenceSource, stripReferenceComments } from './localization';
import {
  loadReferenceCode,
  REFERENCE_CODE,
  type ReferenceLanguage,
} from './registry';

const algorithms = [
  'components',
  'scc',
  'prim',
  'kruskal',
  'topological',
  'critical-path',
  'dijkstra',
  'floyd-warshall',
  'bellman-ford',
  'buddy-system',
  'garbage-collection',
] as const;

const languages: ReferenceLanguage[] = ['c', 'cpp', 'python'];

const expectedFiles = [
  'bellman_ford.c', 'bellman_ford.cpp', 'bellman_ford.py',
  'buddy_system.c', 'buddy_system.cpp', 'buddy_system.py',
  'components.c', 'components.cpp', 'components.py',
  'critical_path.c', 'critical_path.cpp', 'critical_path.py',
  'dijkstra.c', 'dijkstra.cpp', 'dijkstra.py',
  'floyd_warshall.c', 'floyd_warshall.cpp', 'floyd_warshall.py',
  'garbage_collection.c', 'garbage_collection.cpp', 'garbage_collection.py',
  'kruskal.c', 'kruskal.cpp', 'kruskal.py',
  'prim.c', 'prim.cpp', 'prim.py',
  'scc.c', 'scc.cpp', 'scc.py',
  'topological_sort.c', 'topological_sort.cpp', 'topological_sort.py',
].sort();

const folders: Record<(typeof algorithms)[number], string> = {
  components: 'components',
  scc: 'scc',
  prim: 'prim',
  kruskal: 'kruskal',
  topological: 'topological',
  'critical-path': 'critical-path',
  dijkstra: 'dijkstra',
  'floyd-warshall': 'floyd-warshall',
  'bellman-ford': 'bellman-ford',
  'buddy-system': 'buddy-system',
  'garbage-collection': 'garbage-collection',
};

// Four hand-reviewed probes: one graph traversal, one AOE network, one dynamic
// allocator, and one collector whose reference representation is easy to misread.
const representative: Record<string, { en: string; zh: string }> = {
  'components.c': {
    en: 'The matrix scan checks every column, including the edge back to the parent; the visited test is what stops that walk.',
    zh: '矩阵扫描会检查所有列，包括指回父结点的边；真正阻止沿这条边绕回去的是 visited 判断。',
  },
  'critical_path.c': {
    en: 'This C version assumes ACTIVITIES is already in topological order; a random edge order would use unfinished predecessors.',
    zh: '这个 C 版假定 ACTIVITIES 已按拓扑序排列；任意边序会用到尚未完成的前驱。',
  },
  'buddy_system.py': {
    en: 'This expression rounds request up to its level; request 3 becomes level 2 (size 4).',
    zh: '这个表达式把请求向上取整到级别；请求 3 变成 2 级（大小 4）。',
  },
  'garbage_collection.c': {
    en: 'References store object indices, not raw addresses; moving start changes the address derived from the object, not the stored index.',
    zh: '引用保存对象下标而不是原始地址；移动 start 改变的是由对象派生的地址，不是存储的下标。',
  },
};

function codeOnly(source: string, language: ReferenceLanguage): string {
  return stripReferenceComments(source, language)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .join('\n');
}

function localize(
  source: string,
  algorithmId: string,
  fileName: string,
  language: ReferenceLanguage,
  lang: 'zh' | 'en',
): string {
  return localizeReferenceSource(source, {
    algorithmId,
    algorithmName: algorithmId,
    language,
    implementation: 'principle',
    fileName,
    lang,
  });
}

function isStandaloneComment(source: string, language: ReferenceLanguage, en: string): boolean {
  const prefix = language === 'python' ? '# ' : '// ';
  return source
    .split('\n')
    .some((line) => line.trim() === `${prefix}${en}`);
}

function headSource(algorithmId: (typeof algorithms)[number], fileName: string): string {
  const relative = `src/domain/reference-code/sources/${folders[algorithmId]}/${fileName}`;
  return execFileSync('git', ['show', `HEAD:${relative}`], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

describe('CODE-DOC-04-BATCH-04 teaching annotations', () => {
  it('registers exactly the 33 principle files from the 11 claimed algorithms', () => {
    expect(Object.keys(BATCH_04_ANNOTATIONS).sort()).toEqual(expectedFiles);
    expect(Object.keys(BATCH_04_ANNOTATIONS)).toHaveLength(33);
    expect(new Set(expectedFiles).size).toBe(33);
  });

  for (const algorithmId of algorithms) {
    for (const language of languages) {
      const file = REFERENCE_CODE[algorithmId]?.files[language];
      if (!file) throw new Error(`${algorithmId}/${language}: missing principle file`);
      const fileName = file.fileName;

      it(`keeps ${fileName} deep, bilingual, anchored and code-identical`, async () => {
        const source = await loadReferenceCode(algorithmId, language);
        expect(source, fileName).not.toBeNull();

        const batch = BATCH_04_ANNOTATIONS[fileName] ?? [];
        expect(batch.length, fileName).toBeGreaterThanOrEqual(5);
        expect(new Set(batch.map((item) => item.en)).size, fileName).toBe(batch.length);
        expect(new Set(batch.map((item) => item.zh)).size, fileName).toBe(batch.length);

        for (const annotation of batch) {
          expect(annotation.zh, `${fileName} empty Chinese`).toMatch(/[\u3400-\u9fff]/);
          expect(annotation.en, `${fileName} template English`).not.toMatch(
            /^(Purpose:|Step \d|This line (simply )?)/,
          );
          expect(annotation.zh, `${fileName} template Chinese`).not.toMatch(
            /^(作用：|第\d步|这一行)/,
          );
          expect(
            isStandaloneComment(source!, language, annotation.en),
            `${fileName} stale or inline anchor: ${annotation.en}`,
          ).toBe(true);
        }

        const merged = REFERENCE_ANNOTATIONS[fileName] ?? [];
        expect(merged.length, `${fileName} merged`).toBeGreaterThanOrEqual(5);
        expect(new Set(merged.map((item) => item.en)).size, `${fileName} merged uniqueness`).toBe(
          merged.length,
        );
        for (const annotation of batch) {
          expect(merged.some((item) => item.en === annotation.en), `${fileName} not merged`).toBe(
            true,
          );
        }

        const probe = representative[fileName] ?? batch[0];
        expect(batch.some((item) => item.en === probe.en), `${fileName} probe`).toBe(true);

        const zh = localize(source!, algorithmId, fileName, language, 'zh');
        const en = localize(source!, algorithmId, fileName, language, 'en');
        const annotation = batch.find((item) => item.en === probe.en);
        expect(annotation, `${fileName} missing annotation`).toBeDefined();
        expect(zh, `${fileName}/zh`).toContain(annotation!.zh);
        expect(zh, `${fileName}/zh still English`).not.toContain(annotation!.en);
        expect(en, `${fileName}/en`).toContain(annotation!.en);
        expect(en, `${fileName}/en still Chinese`).not.toMatch(/[\u3400-\u9fff]/);

        expect(codeOnly(zh, language), `${fileName}/zh`).toBe(
          codeOnly(source!, language),
        );
        expect(codeOnly(en, language), `${fileName}/en`).toBe(
          codeOnly(source!, language),
        );
        expect(codeOnly(source!, language), `${fileName}/HEAD`).toBe(
          codeOnly(headSource(algorithmId, fileName), language),
        );
      });
    }
  }

  it('does not accept a batch made only of file headers or generic labels', () => {
    const all = Object.values(BATCH_04_ANNOTATIONS).flat();
    expect(all.length).toBeGreaterThanOrEqual(180);
    expect(all.filter((item) => /^(Purpose:|作用：)/.test(item.en) || /^作用：/.test(item.zh)))
      .toHaveLength(0);
    expect(all.filter((item) => /^(Step \d|第\d步)/.test(item.en) || /^第\d步/.test(item.zh)))
      .toHaveLength(0);
  });
});
