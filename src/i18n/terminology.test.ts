import { describe, expect, it } from 'vitest';
import {
  TERMINOLOGY,
  algorithmNameZh,
  algorithmShortNameZh,
  glossaryForAlgorithm,
  glossaryForConcept,
  terminologyEntry,
  textbookTitleZh,
} from './terminology';

describe('Chinese terminology dictionary', () => {
  it('keeps every term id unique and gives every entry a Chinese gloss', () => {
    const ids = TERMINOLOGY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of TERMINOLOGY) {
      expect(entry.english.trim()).not.toBe('');
      expect(entry.chinese.trim()).not.toBe('');
      expect(entry.labelZh).toMatch(/[\u3400-\u9fff]/);
    }
  });

  it('uses the reviewed textbook forms for high-risk abbreviations', () => {
    expect(terminologyEntry('adt')?.labelZh).toBe('ADT（Abstract Data Type，抽象数据类型）');
    expect(terminologyEntry('bfs')?.labelZh).toBe('BFS（Breadth-First Search，广度优先搜索）');
    expect(terminologyEntry('dfs')?.labelZh).toBe('DFS（Depth-First Search，深度优先搜索）');
    expect(terminologyEntry('lifo')?.labelZh).toBe('LIFO（Last In First Out，后进先出）');
    expect(terminologyEntry('fifo')?.labelZh).toBe('FIFO（First In First Out，先进先出）');
    expect(terminologyEntry('mst')?.labelZh).toBe('MST（Minimum Spanning Tree，最小生成树）');
    expect(terminologyEntry('lsd')?.labelZh).toContain('最低位优先');
    expect(terminologyEntry('msd')?.labelZh).toContain('最高位优先');
    expect(terminologyEntry('b-plus-tree')?.labelZh).toContain('B+ 树');
    expect(terminologyEntry('csr')?.labelZh).toBe(
      'CSR（Compressed Sparse Row，压缩稀疏行）',
    );
    expect(terminologyEntry('algorithm-cases')?.labelZh).toContain('Worst Case');
    expect(terminologyEntry('c-string')?.labelZh).toContain('C String');
    expect(terminologyEntry('and-or')?.labelZh).toBe(
      'AND（逻辑与，求交集）/ OR（逻辑或，求并集）',
    );
    expect(terminologyEntry('free-block-state')?.labelZh).toContain('both-free');
    expect(terminologyEntry('threaded-tags')?.labelZh).toContain('ltag');
    expect(terminologyEntry('union-find')?.labelZh).toContain('Disjoint Set Union');
    expect(terminologyEntry('distance')?.labelZh).toContain('dist（Distance');
  });

  it('does not invent a functional expansion for person-named algorithms', () => {
    expect(terminologyEntry('kmp')?.english).toBe('Knuth–Morris–Pratt');
    expect(terminologyEntry('kmp')?.english).not.toMatch(/search|match/i);
    expect(terminologyEntry('avl')?.english).toBe('Adelson-Velsky and Landis');
    expect(terminologyEntry('dijkstra')?.transliteration).toBe('迪杰斯特拉');
    expect(terminologyEntry('floyd')?.labelZh).toContain('弗洛伊德—沃舍尔');
  });

  it('adds a Chinese gloss to algorithm titles only in Chinese mode', () => {
    expect(algorithmNameZh('dijkstra', 'Dijkstra 最短路径', 'zh')).toContain('迪杰斯特拉');
    expect(algorithmNameZh('bfs', '广度优先搜索', 'zh')).toContain('Breadth-First Search');
    expect(algorithmNameZh('dfs', '深度优先搜索', 'zh')).toContain('Depth-First Search');
    expect(algorithmNameZh('kmp', 'KMP 模式匹配', 'zh')).toContain('Knuth–Morris–Pratt');
    expect(algorithmNameZh('hash-chain', '链地址法散列表', 'zh')).toContain('Chaining');

    expect(algorithmNameZh('dijkstra', 'Dijkstra 最短路径', 'en')).toBe('Dijkstra 最短路径');
    expect(algorithmNameZh('bfs', 'Breadth-first search', 'en')).toBe('Breadth-first search');
  });

  it('uses compact names for navigation so directory rows do not wrap', () => {
    expect(algorithmShortNameZh('bfs', 'BFS', 'zh')).toBe('广度优先搜索（BFS）');
    expect(algorithmShortNameZh('dfs', 'DFS', 'zh')).toBe('深度优先搜索（DFS）');
    expect(algorithmShortNameZh('dijkstra', 'Dijkstra', 'zh')).toBe('Dijkstra 最短路径');
    expect(algorithmShortNameZh('bplus-tree', 'B+ Tree', 'zh')).toBe('B+ 树');
    expect(algorithmShortNameZh('bfs', 'BFS', 'en')).toBe('BFS');
  });

  it('updates only reviewed Chinese textbook titles', () => {
    expect(textbookTitleZh('Dijkstra 算法')).toBe('Dijkstra（迪杰斯特拉）算法');
    expect(textbookTitleZh('Prim 算法')).toBe('Prim（普里姆）算法');
    expect(textbookTitleZh('m 元多项式的表示')).toBe('m 元多项式的表示');
    expect(textbookTitleZh('未登记的标题')).toBe('未登记的标题');
  });

  it('selects glossary entries per lesson without rewriting prose', () => {
    const adt = glossaryForConcept('adt');
    expect(adt.map((entry) => entry.id)).toEqual(['adt', 'stack-operations']);
    expect(adt[0].labelZh).toBe('ADT（Abstract Data Type，抽象数据类型）');

    const bstPage = glossaryForConcept('b-tree');
    expect(bstPage.some((entry) => entry.id === 'b-tree')).toBe(true);

    expect(glossaryForConcept('linear-list').map((entry) => entry.id)).toEqual([
      'linear-list',
      'adt',
    ]);
    expect(glossaryForConcept('sparse-matrix').map((entry) => entry.id)).toEqual([
      'triple-table',
      'csr',
    ]);
    expect(glossaryForConcept('string-storage').map((entry) => entry.id)).toEqual([
      'adt',
      'c-string',
      'block-linked-string',
    ]);
    expect(glossaryForConcept('static-tree-table').map((entry) => entry.id)).toEqual([
      'asl',
      'wpl',
      'bst',
      'avl',
    ]);

    const bfsPage = glossaryForAlgorithm('bfs');
    expect(bfsPage.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['fifo', 'frontier', 'bfs-state']),
    );

    const dijkstraPage = glossaryForAlgorithm('dijkstra');
    expect(dijkstraPage.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['relaxation', 'distance', 'dijkstra-state', 'previous']),
    );

    expect(glossaryForAlgorithm('components').map((entry) => entry.id)).toEqual([
      'dfs',
      'bfs',
    ]);
    expect(glossaryForAlgorithm('inorder').map((entry) => entry.id)).toEqual([
      'bst',
      'fifo',
    ]);
    expect(glossaryForAlgorithm('free-list').map((entry) => entry.id)).toEqual([
      'free-block-state',
    ]);
    expect(glossaryForAlgorithm('inverted-index').map((entry) => entry.id)).toEqual([
      'posting',
      'and-or',
    ]);
    expect(glossaryForAlgorithm('file-index').map((entry) => entry.id)).toEqual([
      'b-plus-tree',
    ]);

    expect(glossaryForAlgorithm('bubble')).toEqual([]);
    expect(glossaryForAlgorithm(null)).toEqual([]);
  });
});
