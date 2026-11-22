import { describe, expect, it } from 'vitest';
import { REFERENCE_ANNOTATIONS } from './annotations';
import { REFERENCE_CODE_ALGORITHMS } from './registry';

const rawSources = import.meta.glob('./sources/**/*.{c,cpp,py}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function sourceOf(fileName: string): string {
  const hit = Object.entries(rawSources).find(([path]) => path.endsWith(`/${fileName}`));
  if (!hit) throw new Error(`missing ${fileName}`);
  return hit[1];
}

function commentsOf(fileName: string): string {
  return sourceOf(fileName)
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
        return trimmed;
      }
      return '';
    })
    .join('\n');
}

const reviewedFacts: Array<{
  file: string;
  absence?: RegExp[];
  presence?: RegExp[];
  why: string;
}> = [
  {
    file: 'circular_linked_list.c',
    absence: [/length\s*=\s*0/i, /length\s*(?:置|设|初始)/i],
    presence: [/head/, /tail/, /no `length` field/i],
    why: '循环链表只有 head/tail，文件头不能宣称 length',
  },
  {
    file: 'circular_linked_list.cpp',
    absence: [/length_\s*=\s*0/i, /length_\s*(?:置|设|初始)/i],
    presence: [/head_/, /tail_/, /no `length_`/i],
    why: 'C++ 循环链表只有 head_/tail_',
  },
  {
    file: 'circular_linked_list.py',
    absence: [/self\.length/i, /length\s*=\s*0/i],
    presence: [/head/, /tail/],
    why: 'Python 循环链表只有 head/tail',
  },
  {
    file: 'singly_linked_list.c',
    absence: [/(?:tail|length)\s*=\s*(?:NULL|0|nullptr)/i],
    presence: [/没有 tail 和 length 字段/],
    why: '单链表 C 版没有 tail/length 字段',
  },
  {
    file: 'doubly_linked_list.c',
    absence: [/length\s*=\s*0/i, /length\s*(?:置|设|初始)/i],
    why: '双向链表 C 版没有 length 字段',
  },
  {
    file: 'doubly_linked_list.cpp',
    absence: [/length_\s*=\s*0/i, /length_\s*(?:置|设|初始)/i],
    why: '双向链表 C++ 版没有 length_ 字段',
  },
  {
    file: 'hash_probe.c',
    absence: [/(?:用|使用|需要|维护|处理)墓碑/],
    presence: [/没有墓碑状态/],
    why: 'hash_probe 教学版没有删除与 DELETED 状态',
  },
  {
    file: 'hash_probe.cpp',
    absence: [/(?:用|使用|需要|维护|处理)墓碑/],
    presence: [/没有墓碑状态/],
    why: 'hash_probe 教学版没有删除与 DELETED 状态',
  },
  {
    file: 'hash_probe_builtin.cpp',
    presence: [/std::unordered_map/],
    absence: [/(?:使用|采用|实现)线性探测/, /墓碑状态/, /DELETED/],
    why: '标准库对照使用 unordered_map，不能描述手写线性探测',
  },
  {
    file: 'bst_builtin.cpp',
    presence: [/std::set/],
    absence: [/(?:执行|实现|需要)旋转/, /rebalance/i],
    why: '标准库 set 不暴露手写平衡过程',
  },
  {
    file: 'doubly_linked_list_builtin.cpp',
    presence: [/std::list/],
    why: '标准库对照使用 std::list',
  },
  {
    file: 'hash_chain_builtin.cpp',
    presence: [/std::unordered_map/],
    why: '标准库对照使用 unordered_map',
  },
  {
    file: 'max_heap_builtin.cpp',
    presence: [/std::priority_queue/],
    why: '标准库对照使用 priority_queue',
  },
  {
    file: 'queue_builtin.cpp',
    presence: [/std::queue/],
    why: '标准库对照使用 std::queue',
  },
  {
    file: 'seqlist_builtin.cpp',
    presence: [/std::vector/],
    why: '标准库对照使用 std::vector',
  },
  {
    file: 'stack_builtin.cpp',
    presence: [/std::stack/],
    why: '标准库对照使用 std::stack',
  },
  {
    file: 'kmp_find_builtin.cpp',
    presence: [/std::string::find/],
    absence: [/(?:构造|建立|使用)LPS/i, /(?:构造|建立|使用) lps/],
    why: '标准库 find 不暴露 LPS 构造',
  },
  {
    file: 'components.c',
    presence: [/print|打印/i],
    absence: [/returns? (?:the )?vertex set/i],
    why: '连通分量实现打印顶点并返回数量',
  },
  {
    file: 'components.cpp',
    presence: [/print|打印/i],
    absence: [/returns? (?:the )?vertex set/i],
    why: '连通分量实现打印顶点并返回数量',
  },
  {
    file: 'scc.c',
    presence: [/print|打印/i],
    absence: [/returns? (?:the )?vertex set/i],
    why: 'SCC 实现按 Kosaraju 顺序打印',
  },
  {
    file: 'scc.cpp',
    presence: [/print|打印/i],
    absence: [/returns? (?:the )?vertex set/i],
    why: 'SCC 实现按 Kosaraju 顺序打印',
  },
  {
    file: 'sparse_transpose.c',
    absence: [/(?:实现|调用|先做)普通转置/, /(?:实现|调用) ordinary transpose/i],
    why: '文件只实现快速转置',
  },
  {
    file: 'sparse_transpose.cpp',
    absence: [/(?:实现|调用|先做)普通转置/, /(?:实现|调用) ordinary transpose/i],
    why: '文件只实现快速转置',
  },
  {
    file: 'topological_sort.c',
    presence: [/O\(V\^2\)/],
    absence: [/Time O\(V \+ E\)/],
    why: '邻接矩阵拓扑排序每轮扫描全部列，是 O(V²)',
  },
  {
    file: 'bfs.c',
    presence: [/O\(V\^2\)/],
    why: '邻接矩阵 BFS 是 O(V²)，可以对比邻接表的 O(V+E)',
  },
  {
    file: 'dfs.c',
    presence: [/O\(V\^2\)/],
    why: '邻接矩阵 DFS 是 O(V²)',
  },
  {
    file: 'kruskal.c',
    presence: [/print|打印/i],
    absence: [/returns? (?:the )?(?:selected|chosen)/i],
    why: 'Kruskal 打印结果并返回 void',
  },
  {
    file: 'kruskal.cpp',
    presence: [/print|打印/i],
    absence: [/returns? (?:the )?(?:selected|chosen)/i],
    why: 'Kruskal 打印结果并返回 void',
  },
  {
    file: 'threaded_inorder.c',
    presence: [/left_thread/, /right_thread/],
    why: '线索存在独立字段，不能声称复用空孩子指针',
  },
  {
    file: 'threaded_inorder.cpp',
    presence: [/left_thread/, /right_thread/],
    why: '线索存在独立字段，不能声称复用空孩子指针',
  },
  {
    file: 'threaded_inorder.py',
    presence: [/left_thread/, /right_thread/],
    why: '线索存在独立字段，不能声称复用空孩子指针',
  },
  {
    file: 'hash_chain.c',
    presence: [/prepend|头插/i],
    why: 'C 版真实操作是桶头插入',
  },
  {
    file: 'hash_chain.cpp',
    presence: [/append|追加/i],
    why: 'C++ 版真实操作是 vector 尾追加',
  },
  {
    file: 'hash_chain.py',
    presence: [/append|追加/i],
    why: 'Python 版真实操作是 list 尾追加',
  },
  {
    file: 'static_linked_list.c',
    presence: [/data\/cur/, /static_init/, /cur=NULL_INDEX/],
    absence: [/data\/next/, /next=-1/, /malloc\/salloc/],
    why: '静态链表字段是 cur，不是 next；构建入口是 static_init',
  },
  {
    file: 'static_linked_list.cpp',
    presence: [/Cell/, /data\/cur/, /initialise/, /cur=kNull/],
    absence: [/Node 的 data\/next/, /next=-1/, /malloc\/salloc/],
    why: '静态链表字段是 cur，单元类型是 Cell；构建入口是 initialise',
  },
  {
    file: 'dijkstra.c',
    presence: [/邻接矩阵/, /辅助空间 O\(V\)/],
    absence: [/非负权邻接表/],
    why: 'Dijkstra C 版使用邻接矩阵，不能说成邻接表',
  },
  {
    file: 'bfs.c',
    presence: [/邻接矩阵/],
    absence: [/邻接表/],
    why: 'BFS C 版使用邻接矩阵',
  },
  {
    file: 'dfs.c',
    presence: [/邻接矩阵/],
    absence: [/邻接表/],
    why: 'DFS C 版使用邻接矩阵',
  },
  {
    file: 'scc.c',
    presence: [/O\(V²\)/],
    why: 'SCC C 版使用邻接矩阵，复杂度应写 O(V²)',
  },
  {
    file: 'prim.c',
    presence: [/矩阵本身 O\(V²\)/],
    why: 'Prim C 版矩阵本身占 O(V²) 空间',
  },
];

describe('reference comment facts', () => {
  it('keeps reviewed header claims aligned with the real symbols and operations', () => {
    for (const fact of reviewedFacts) {
      const comments = commentsOf(fact.file);
      for (const pattern of fact.absence ?? []) {
        expect(comments, `${fact.file}: ${fact.why}`).not.toMatch(pattern);
      }
      for (const pattern of fact.presence ?? []) {
        expect(comments, `${fact.file}: ${fact.why}`).toMatch(pattern);
      }
    }
  });

  it('does not call a non-static function static in any reviewed comment', () => {
    for (const [path, source] of Object.entries(rawSources)) {
      expect(source, path).not.toMatch(/静态函数|static function/);
    }
  });

  it('only describes a leaf flag where the B+ tree really stores one', () => {
    for (const [path, source] of Object.entries(rawSources)) {
      if (/bplus[-_]tree/.test(path)) continue;
      expect(source, path).not.toMatch(/leaf flag/i);
    }
  });

  it('keeps every registered source annotation non-empty and the nine P2-05 files substantial', () => {
    const sources = Object.keys(rawSources)
      .map((path) => path.split('/').pop() ?? path)
      .sort();
    expect(Object.keys(REFERENCE_ANNOTATIONS).sort()).toEqual(sources);
    expect(REFERENCE_CODE_ALGORITHMS).toHaveLength(60);

    const p205Files = [
      'bf.c', 'bf.cpp', 'bf.py',
      'gl_depth.c', 'gl_depth.cpp', 'gl_depth.py',
      'gl_copy.c', 'gl_copy.cpp', 'gl_copy.py',
      'multiway_merge.c', 'multiway_merge.cpp', 'multiway_merge.py',
      'replacement_selection.c', 'replacement_selection.cpp', 'replacement_selection.py',
      'optimal_merge_tree.c', 'optimal_merge_tree.cpp', 'optimal_merge_tree.py',
      'indexed_file.c', 'indexed_file.cpp', 'indexed_file.py',
      'isam_file.c', 'isam_file.cpp', 'isam_file.py',
      'inverted_index.c', 'inverted_index.cpp', 'inverted_index.py',
    ];

    for (const [fileName, annotations] of Object.entries(REFERENCE_ANNOTATIONS)) {
      expect(annotations.length, fileName).toBeGreaterThan(0);
      for (const annotation of annotations) {
        expect(annotation.en.trim(), fileName).not.toHaveLength(0);
        expect(annotation.zh.trim(), fileName).not.toHaveLength(0);
      }
    }
    for (const fileName of p205Files) {
      expect(REFERENCE_ANNOTATIONS[fileName]?.length, fileName).toBeGreaterThanOrEqual(3);
    }
  });
});
