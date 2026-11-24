import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n } from '../../i18n/I18nProvider';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ReferenceCodePanel } from './ReferenceCodePanel';

const batchAlgorithms = [
  {
    id: 'circular',
    name: '循环链表',
    zh: '空环没有任何结点：head 与 tail 必须同时为 NULL；它们只是空表的两个入口，不是哨兵结点。',
    en: 'Both endpoints must be NULL: an empty ring has no sentinel node, and head/tail are two views of the same absence.',
  },
  {
    id: 'kmp',
    name: 'KMP 字符串匹配',
    zh: 'next[0] = -1 是哨兵而不是真实 border：模式串首字符之前没有更短前缀可以回退。',
    en: '-1 is a sentinel, not a real border: at the first pattern character there is no shorter prefix to fall back to.',
  },
  {
    id: 'articulation',
    name: '图的关节点',
    zh: '对非根 u，low[v] >= disc[u] 表示 v 子树没有任何返祖边能绕过 u；删除 u 就会把这棵子树分离出去。',
    en: "For a non-root u, low[v] >= disc[u] means no back edge from v's subtree can bypass u, so removing u separates that subtree.",
  },
  {
    id: 'radix',
    name: '基数排序',
    zh: '最高位处理完后，所有十进制位都按从低到高参与过排序；稳定性把低位次序一路带过来，因此 order 已经整体有序。',
    en: 'After the most significant pass, every decimal digit has been applied from least to most significant; stability carried lower-digit order forward, so order is fully sorted.',
  },
  {
    id: 'replacement',
    name: '置换选择排序',
    zh: '工作区只保存驻留候选记录；current 是独立的归并段缓冲，因此一段可以长于工作区容量。',
    en: 'The workspace holds only resident candidates; current is a separate run buffer, so a run may grow beyond the workspace capacity.',
  },
  {
    id: 'components',
    name: '连通分量',
    zh: '递归前先标记：无向边会指回调用者，提前标记才能避免沿这个环无限递归。',
    en: 'Mark before recursing: an undirected edge leads back to the caller, and marking early prevents that cycle from recursing forever.',
  },
  {
    id: 'scc',
    name: '强连通分量',
    zh: '邻居循环结束后才追加：这里记录的是完成顺序而不是发现顺序，Kosaraju 会倒着读它。',
    en: 'Append after the neighbour loop: this is finish order, not discovery order, and Kosaraju reads it backwards.',
  },
  {
    id: 'prim',
    name: 'Prim 最小生成树',
    zh: '每轮扫描所有顶点寻找最小 key，正是矩阵实现为 O(V²) 的原因。',
    en: 'Scanning every vertex to find the minimum key is why the matrix implementation is O(V^2).',
  },
  {
    id: 'kruskal',
    name: 'Kruskal 最小生成树',
    zh: '先排序是贪心的前提；按任意边序扫描可能先接受重边、后接受轻边。',
    en: 'Sorting first is the greedy precondition; scanning an arbitrary edge order can accept a heavy edge before a cheap one.',
  },
  {
    id: 'topological',
    name: '拓扑排序',
    zh: '所有入度为 0 的顶点在时刻 0 都已就绪；FIFO 只是合法的平局策略，不是唯一顺序。',
    en: 'All zero-indegree vertices are ready at time zero; FIFO order is a valid tie-break, not a required order.',
  },
  {
    id: 'critical-path',
    name: '关键路径',
    zh: '先真正求一次拓扑序；活动数组只是数据，并不保证边已按拓扑序出现。',
    en: 'Build a real topological order first; the activity array is data, not a promise that edges already appear in topological order.',
  },
  {
    id: 'dijkstra',
    name: 'Dijkstra 最短路径',
    zh: '这次线性扫描正是矩阵实现为 O(V²) 的原因；堆可以避免反复扫描所有顶点。',
    en: 'This linear scan is why the matrix implementation costs O(V^2); a heap would avoid rescanning all vertices.',
  },
  {
    id: 'floyd-warshall',
    name: 'Floyd-Warshall 全源最短路',
    zh: '两段都必须有限；把 INF 相加会溢出哨兵值并造出假路线。',
    en: 'Both halves must be finite; adding INF would overflow the sentinel and create a fake route.',
  },
  {
    id: 'bellman-ford',
    name: 'Bellman-Ford 最短路径',
    zh: '所有距离先设为未知；只有源点改为有限。',
    en: 'Every distance begins unknown; only the source is made finite.',
  },
  {
    id: 'buddy-system',
    name: '伙伴系统',
    zh: '从向上取整的目标级开始，寻找最小可用的空闲块。',
    en: 'Find the smallest free block at or above the rounded target level.',
  },
  {
    id: 'garbage-collection',
    name: '标记清除与存储紧缩',
    zh: '引用保存对象下标而不是原始地址；移动 start 改变的是由对象派生的地址，不是存储的下标。',
    en: 'References store object indices, not raw addresses; moving start changes the address derived from the object, not the stored index.',
  },
  {
    id: 'linear',
    name: '顺序查找',
    zh: '-1 不属于任何有效下标，因此真实命中下标 0 不会与失败值混淆。',
    en: '-1 lies outside every valid index, so a real match at index 0 is never confused with the failure value.',
  },
  {
    id: 'binary',
    name: '二分查找',
    zh: '非降序前提只写在契约里，这个 C 入口并不检查；它信任调用方，未排序数组会丢掉有效候选。',
    en: 'The non-decreasing precondition is documented but not checked here; this C entry trusts the caller, so an unsorted array would discard valid candidates.',
  },
  {
    id: 'bst',
    name: '二叉排序树',
    zh: '分配失败只会在空槽处返回 NULL；父节点不能把它当作已有子树的替代值发布。',
    en: 'A failed allocation returns NULL only at this empty slot; the parent must not publish it as a replacement for an existing subtree.',
  },
  {
    id: 'avl',
    name: '平衡二叉树',
    zh: '符号很重要：正值表示左重，只有正失衡才可能选择 LL 或 LR；只看绝对值不够。',
    en: 'The sign matters: positive means left-heavy, so only positive imbalance can select LL or LR; magnitude alone is not enough.',
  },
  {
    id: 'btree',
    name: 'B 树',
    zh: '4 阶的中位下标是 1；它被移入父结点并从孩子中删除，两半不会同时保留它。',
    en: 'The median index is 1 for order 4; it is moved to the parent and removed from the child, so the two halves never both retain it.',
  },
  {
    id: 'bplus-tree',
    name: 'B+ 树',
    zh: '溢出键存在后按 2/2 分裂：右叶保留 keys 2、3，左叶保留 keys 0、1，提升的分隔键仍留在右叶。',
    en: 'The split is 2/2 after the overflow key is present: right keeps keys 2 and 3, left keeps keys 0 and 1, and the promoted separator stays in the right leaf.',
  },
  {
    id: 'key-tree',
    name: '键树',
    zh: '根是显式字段而不是假定的下标：分配顺序可能变化，root 才是唯一合法入口。',
    en: 'The root is a field, not an assumed index: allocation order may change, and root is the only valid entry point.',
  },
  {
    id: 'hash-chain',
    name: '链地址法',
    zh: '清空桶头是操作的一部分：若仍指向已释放内存，后续 contains() 就是 use-after-free。',
    en: 'Clearing the head is part of the operation: leaving it pointing at freed memory turns a later contains() into a use-after-free.',
  },
  {
    id: 'hash-probe',
    name: '开放定址法',
    zh: 'EMPTY 哨兵是 -1，因此这种表示假设键非负；把 -1 当作真实键存入会让该槽与空槽无法区分。',
    en: 'The EMPTY sentinel is -1, so this representation assumes non-negative keys; storing -1 as a real key would make that slot indistinguishable from empty.',
  },
  {
    id: 'insertion',
    name: '直接插入排序',
    zh: '严格的 > 是稳定性决策：相等键会停止搬移，新键落在它们之后，相对次序得以保留。',
    en: 'The strict > is the stability decision: equal keys stop the shift, so the new key lands after them and their relative order survives.',
  },
  {
    id: 'shell',
    name: '希尔排序',
    zh: '希尔排序是对交错子序列做一系列插入排序；它不是稳定排序，因为较早的 gap 轮次可能让相等键互相越过。',
    en: 'Shell sort is a sequence of insertion sorts on interleaved subsequences; it is not a stable sort because earlier gap passes can move equal keys past each other.',
  },
  {
    id: 'bubble',
    name: '冒泡排序',
    zh: '一整趟没有交换说明剩余前缀的每一对相邻元素都有序；由传递性可知整个前缀已经有序，停止不会漏排。',
    en: 'A pass without a swap means every adjacent pair in the remaining prefix is ordered; by transitivity the whole prefix is sorted, so stopping loses no work.',
  },
  {
    id: 'quick',
    name: '快速排序',
    zh: '最终交换把基准放到 <= 区域之后；boundary+1 就是它的最终位置，后续递归必须排除它。',
    en: 'The final swap puts the pivot immediately after the <= region; boundary+1 is its final position, so later recursion must exclude it.',
  },
  {
    id: 'selection',
    name: '简单选择排序',
    zh: '扫描时严格 < 会保留相等键的首次出现；但最终交换仍可能让相等键互相越过。',
    en: 'Strict < keeps the first occurrence on equal keys during the scan, but the final swap can still move an equal key across another.',
  },
  {
    id: 'tournament',
    name: '树形选择排序',
    zh: '遍历从赢家叶结点之父开始，而不是从叶开始：叶状态已经由 active[] 表示。',
    en: "The walk starts at the parent of the winner's leaf, not at the leaf: the leaf itself is already represented by active[].",
  },
  {
    id: 'heap',
    name: '堆排序与优先队列',
    zh: '数组容量固定，堆满时返回失败而不是扩容；C++ 与 Python 版使用动态存储。',
    en: 'The array is fixed-size, so a full heap reports failure instead of growing; C++ and Python versions use dynamic storage.',
  },
  {
    id: 'merge',
    name: '归并排序',
    zh: '返回状态而不是静默留下未排序数组，让调用方能够区分分配失败与成功。',
    en: 'Returning a status instead of silently leaving the array unsorted lets the caller distinguish allocation failure from success.',
  },
  {
    id: 'multiway',
    name: '多路平衡归并',
    zh: '最后一次写出在循环之外，因为最后一块通常不满；丢掉它会丢失记录。',
    en: 'The final flush is outside the loop because the last block is usually partial; dropping it would lose records.',
  },
  {
    id: 'optimal-merge',
    name: '最佳归并树',
    zh: '每个内部结点的权重在归并计划中支付一次，因此总代价是它们之和，而不是最终根权重。',
    en: "Every internal node's weight is paid once in the merge schedule, so total cost is their sum, not the final root weight.",
  },
  {
    id: 'file-index',
    name: '索引文件',
    zh: '稀疏索引项是本块自己的最大键，不是下一块的最小键；用下一块首键会把边界相等键导向错误块。',
    en: "A sparse entry is the block's own maximum, not the next block's minimum; using the next block's first key would send equal boundary keys to the wrong block.",
  },
  {
    id: 'isam',
    name: 'ISAM 文件',
    zh: '主块末键只是最大值的起点；真实最大值可能位于该块的溢出链中。',
    en: "The main block's last key is only a starting maximum; the true maximum may live in this block's overflow chain.",
  },
  {
    id: 'inverted-index',
    name: '倒排索引',
    zh: 'NULL 表示该关键字从未出现；已存在但 postingCount 为 0 的表是另一种状态，尽管两者都没有记录。',
    en: 'NULL means the term was never seen; an existing table with postingCount 0 would be a different state even though neither contains records.',
  },
] as const;


function LanguageToggle() {
  const { toggleLang, lang } = useI18n();
  return (
    <button type="button" data-testid="test-toggle-language" onClick={toggleLang}>
      {lang}
    </button>
  );
}

function panel(algorithmId: string, algorithmName: string) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ReferenceCodePanel algorithmId={algorithmId} algorithmName={algorithmName} />
        <LanguageToggle />
      </ThemeProvider>
    </I18nProvider>
  );
}

function renderPanel(algorithmId = 'binary', algorithmName = '二分查找') {
  return render(panel(algorithmId, algorithmName));
}

async function waitForCode() {
  await waitFor(() => expect(screen.getByTestId('reference-code-fallback')).toBeTruthy());
  return screen.getByTestId('reference-code-fallback').textContent ?? '';
}

describe('ReferenceCodePanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('defaults to C, shows read-only source with line numbers and file metadata', async () => {
    renderPanel();
    expect(screen.getByTestId('reference-lang-c').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('reference-file-name').textContent).toBe('binary_search.c');
    await waitForCode();
    expect(screen.getByTestId('reference-code-viewer').getAttribute('data-readonly')).toBe('true');
    expect(screen.getByTestId('reference-code-fallback').textContent).toContain('int Binary_Search');
    expect(screen.getByTestId('reference-code-fallback').textContent).toContain('01');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByTestId('run-btn')).toBeNull();
  });

  it('switches C / C++ / Python and shows the matching implementation', async () => {
    renderPanel();
    await waitForCode();

    fireEvent.click(screen.getByTestId('reference-lang-cpp'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('binary_search.cpp');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('std::vector<int>'),
    );

    fireEvent.click(screen.getByTestId('reference-lang-python'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('binary_search.py');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('def binary_search'),
    );
    expect(screen.getByTestId('reference-code-fallback').textContent).not.toContain('trace(');
  });

  it('copies the complete current source, not just the visible text', async () => {
    renderPanel();
    await waitForCode();
    fireEvent.click(screen.getByTestId('reference-copy'));
    await waitFor(() => expect(screen.getByTestId('reference-copy').textContent).toContain('已复制'));
    const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = String(writeText.mock.calls[0][0]);
    expect(copied).toContain('int Binary_Search');
    expect(copied).toContain('int main(void)');
  });

  it('copies internal annotations in the current UI language', async () => {
    renderPanel('binary', '二分查找');
    await waitForCode();

    fireEvent.click(screen.getByTestId('reference-copy'));
    await waitFor(() => expect(screen.getByTestId('reference-copy').textContent).toContain('已复制'));
    const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    const zhCopy = String(writeText.mock.calls[0][0]);
    expect(zhCopy).toContain('查找窗口是闭区间');
    expect(zhCopy).not.toContain('The window is inclusive');
    expect(zhCopy).toContain('int Binary_Search');

    fireEvent.click(screen.getByTestId('test-toggle-language'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('Binary search in C11'),
    );
    fireEvent.click(screen.getByTestId('reference-copy'));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    const enCopy = String(writeText.mock.calls[1][0]);
    expect(enCopy).toContain('The window is inclusive');
    expect(enCopy).not.toContain('查找窗口是闭区间');
    expect(enCopy).toContain('int Binary_Search');
  });

  it('shows and copies free-list internal teaching comments in both UI languages', async () => {
    renderPanel('free-list', '空闲空间分配');
    await waitForCode();
    const zhCode = screen.getByTestId('reference-code-fallback').textContent ?? '';
    expect(zhCode).toContain('首次适应一旦遇到第一个足够大的块就可以停止');
    expect(zhCode).toContain('左合并后联合块位于 index-1');
    expect(zhCode).not.toContain('First Fit can stop at the first adequate block');

    fireEvent.click(screen.getByTestId('reference-copy'));
    await waitFor(() => expect(screen.getByTestId('reference-copy').textContent).toContain('已复制'));
    const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    const zhCopy = String(writeText.mock.calls[0][0]);
    expect(zhCopy).toContain('首次适应一旦遇到第一个足够大的块就可以停止');
    expect(zhCopy).toContain('左合并后联合块位于 index-1');
    expect(zhCopy).not.toContain('First Fit can stop at the first adequate block');

    fireEvent.click(screen.getByTestId('test-toggle-language'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain(
        'First Fit can stop at the first adequate block',
      ),
    );
    const enCode = screen.getByTestId('reference-code-fallback').textContent ?? '';
    expect(enCode).toContain('First Fit can stop at the first adequate block');
    expect(enCode).toContain('After a left merge the unified block sits at index-1');
    expect(enCode).not.toMatch(/[\u3400-\u9fff]/);

    fireEvent.click(screen.getByTestId('reference-copy'));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    const enCopy = String(writeText.mock.calls[1][0]);
    expect(enCopy).toContain('First Fit can stop at the first adequate block');
    expect(enCopy).toContain('After a left merge the unified block sits at index-1');
    expect(enCopy).not.toMatch(/[\u3400-\u9fff]/);
  });

  for (const algorithm of batchAlgorithms) {
    it(`shows and copies ${algorithm.id} internals in both UI languages`, async () => {
      renderPanel(algorithm.id, algorithm.name);
      await waitForCode();
      const zhCode = screen.getByTestId('reference-code-fallback').textContent ?? '';
      expect(zhCode).toContain(algorithm.zh);
      expect(zhCode).not.toContain(algorithm.en);

      fireEvent.click(screen.getByTestId('reference-copy'));
      await waitFor(() => expect(screen.getByTestId('reference-copy').textContent).toContain('已复制'));
      const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
      const zhCopy = String(writeText.mock.calls[0][0]);
      expect(zhCopy).toContain(algorithm.zh);
      expect(zhCopy).not.toContain(algorithm.en);

      fireEvent.click(screen.getByTestId('test-toggle-language'));
      await waitFor(() =>
        expect(screen.getByTestId('reference-code-fallback').textContent).toContain(algorithm.en),
      );
      const enCode = screen.getByTestId('reference-code-fallback').textContent ?? '';
      expect(enCode).toContain(algorithm.en);
      expect(enCode).not.toMatch(/[\u3400-\u9fff]/);

      fireEvent.click(screen.getByTestId('reference-copy'));
      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
      const enCopy = String(writeText.mock.calls[1][0]);
      expect(enCopy).toContain(algorithm.en);
      expect(enCopy).not.toMatch(/[\u3400-\u9fff]/);
    });
  }

  it('switches between the principle and shared convenience implementations', async () => {
    renderPanel('bubble', '冒泡排序');
    await waitForCode();
    expect(screen.getByTestId('reference-file-name').textContent).toBe('bubble_sort.c');
    expect(screen.getByTestId('reference-impl-principle').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('reference-impl-convenience').getAttribute('aria-selected')).toBe('false');
    expect(screen.getByTestId('reference-purpose').textContent).toContain('原理实现');

    fireEvent.click(screen.getByTestId('reference-impl-convenience'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('builtin_sorting.c');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('compare_int'),
    );
    expect(screen.getByTestId('reference-purpose').textContent).toContain('简洁实现');
    expect(screen.getByTestId('reference-source').textContent).toContain('实现说明');
    expect(screen.getByTestId('reference-source').textContent).toContain('共享便捷示例');
    expect(screen.getByTestId('reference-source').textContent).not.toContain('许可');

    fireEvent.click(screen.getByTestId('reference-lang-cpp'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('builtin_sorting.cpp');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('std::sort'),
    );
    expect(screen.getByTestId('reference-impl-convenience').getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByTestId('reference-lang-python'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('builtin_sorting.py');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('in_place.sort()'),
    );
  });

  it('falls back to the principle version when the next algorithm has no convenience code', async () => {
    const { rerender } = renderPanel('bubble', '冒泡排序');
    await waitForCode();
    fireEvent.click(screen.getByTestId('reference-impl-convenience'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('compare_int'),
    );

    rerender(panel('merge', '归并排序'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('int MergeSort'),
    );
    expect(screen.getByTestId('reference-file-name').textContent).toBe('merge_sort.c');
    expect(screen.queryByTestId('reference-implementation-tabs')).toBeNull();
  });

  it('keeps the chosen language when switching to another algorithm that supports it', async () => {
    const { rerender } = renderPanel('binary', '二分查找');
    await waitForCode();
    fireEvent.click(screen.getByTestId('reference-lang-python'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('def binary_search'),
    );

    rerender(panel('linked', '单向链表'));
    expect(screen.getByTestId('reference-file-name').textContent).toBe('singly_linked_list.py');
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('class SinglyLinkedList'),
    );
    expect(screen.getByTestId('reference-lang-python').getAttribute('aria-selected')).toBe('true');
  });

  it('switches comments with the UI language without changing the algorithm or selection', async () => {
    renderPanel('binary', '二分查找');
    await waitForCode();
    expect(screen.getByTestId('reference-lang-c').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('reference-code-fallback').textContent).toContain('中文导读');
    expect(screen.getByTestId('reference-code-fallback').textContent).toContain('int Binary_Search');

    fireEvent.click(screen.getByTestId('reference-lang-cpp'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('std::vector<int>'),
    );
    const zhCode = screen.getByTestId('reference-code-fallback').textContent ?? '';
    expect(zhCode).toContain('中文导读');
    expect(zhCode).toContain('二分查找');

    fireEvent.click(screen.getByTestId('test-toggle-language'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('AlgoViz reference implementation'),
    );
    expect(screen.getByTestId('reference-code-fallback').textContent).toContain('binary_search_index');
    expect(screen.getByTestId('reference-code-fallback').textContent).not.toContain('思路：');
    expect(screen.getByTestId('reference-lang-cpp').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('reference-file-name').textContent).toBe('binary_search.cpp');
  });

  it('copies the complete source with comments in the current UI language', async () => {
    renderPanel('binary', '二分查找');
    await waitForCode();
    fireEvent.click(screen.getByTestId('test-toggle-language'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('Binary search in C11'),
    );

    fireEvent.click(screen.getByTestId('reference-copy'));
    await waitFor(() => expect(screen.getByTestId('reference-copy').textContent).toContain('Copied'));
    const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    const copied = String(writeText.mock.calls[0][0]);
    expect(copied).toContain('Binary search in C11');
    expect(copied).not.toContain('教材');
    expect(copied).toContain('int Binary_Search');
    expect(copied).toContain('int main(void)');
  });

  it('keeps the convenience implementation selected while comments change language', async () => {
    renderPanel('bubble', '冒泡排序');
    await waitForCode();
    fireEvent.click(screen.getByTestId('reference-impl-convenience'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('compare_int'),
    );
    expect(screen.getByTestId('reference-impl-convenience').getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByTestId('test-toggle-language'));
    await waitFor(() =>
      expect(screen.getByTestId('reference-code-fallback').textContent).toContain('qsort'),
    );
    expect(screen.getByTestId('reference-impl-convenience').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('reference-file-name').textContent).toBe('builtin_sorting.c');
  });

  it('shows an explicit unavailable state instead of borrowing another algorithm code', () => {
    renderPanel('unknown-algorithm', '未知算法');
    expect(screen.getByTestId('reference-code-unavailable').textContent).toContain('暂未收录');
    expect(screen.queryByTestId('reference-lang-c')).toBeNull();
    expect(screen.queryByTestId('reference-code-viewer')).toBeNull();
  });
});
