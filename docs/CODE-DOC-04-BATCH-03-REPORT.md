# CODE-DOC-04-BATCH-03 最终报告

## 1. 结论

BATCH-03 已完成。按教材章序从 60 个正式算法中排除前置已完成的 16 个后，本批实际领取并处理：

`seqlist`、`linked`、`doubly`、`stack`、`factorial`、`fib`、`queue`、`inorder`、`huffman`、`bfs`、`dfs`

累计完成数由 16/60 增至 **27/60**，剩余 33 个尚未完成；未进入 BATCH-04。本批只修改 11 个算法的 33 份 principle 源码注释、对应双语 annotation、专项测试与进度/报告文档，没有修改有效代码、Trace、SVG、课程目录或其他算法。

## 2. 前置阶段核验

六个 CODE-DOC-04 前置算法均有实际教学提交：

| 算法 | 提交 |
| --- | --- |
| `free-list` | `4270cc2` |
| `circular` | `f55b961` |
| `kmp` | `74f50e2` |
| `articulation` | `e5b2a28` |
| `radix` | `b9341a5` |
| `replacement` | `a13aafd` |

BATCH-02 的 10 个算法均有实际提交：

| 算法 | 提交 |
| --- | --- |
| `static-linked-list`、`polynomial-add` | `158a730` |
| `infix-to-postfix`、`postfix-eval`、`bf` | `50d4d99` |
| `sparse-transpose`、`gl-depth`、`gl-copy` | `39edf5e` |
| `threaded-inorder`、`block-search` | `05ccb1a` |

开始本批前运行 `batch-01-teaching.test.ts`、`batch-02-teaching.test.ts`、`free-list-teaching.test.ts`、`localization.test.ts`、`comment-fact.test.ts`，结果为 5 files / 66 tests 通过。`docs/CODE_DOC_04_PROGRESS.md` 当时不存在，本批新建。

## 3. 范围、排序与领取

- `src/domain/reference-code/registry.ts` 的 `REFERENCE_CODE` 恰好包含 60 个顶层正式算法，每个都有 C/C++/Python principle 文件。
- `src/domain/algorithms/catalog.generated.ts` 只有 35 个旧目录算法，不足以作为本批范围依据。
- 实际章序从 `src/domain/algorithms/textbook.ts` 构造 `buildTextbookNavigation` 得到，按“第 1–12 章章序 → 章节目录实际出现顺序 → 算法 ID”稳定排序，并按第一次出现去重。
- 排除 6 个前置算法与 BATCH-02 的 10 个后，按序领取前 11 个，未猜测任何 ID。

| 章 | 本批算法 |
| --- | --- |
| CH2 线性表 | `seqlist`、`linked`、`doubly` |
| CH3 栈与递归 | `stack`、`factorial`、`fib`、`queue` |
| CH6 树与二叉树 | `inorder`、`huffman` |
| CH7 图 | `bfs`、`dfs` |

## 4. 三语言源码路径

根目录为 `src/domain/reference-code/`。

| 算法 | C | C++ | Python |
| --- | --- | --- | --- |
| `seqlist` | `sources/seqlist/seqlist.c` | `sources/seqlist/seqlist.cpp` | `sources/seqlist/seqlist.py` |
| `linked` | `sources/linked/singly_linked_list.c` | `sources/linked/singly_linked_list.cpp` | `sources/linked/singly_linked_list.py` |
| `doubly` | `sources/doubly/doubly_linked_list.c` | `sources/doubly/doubly_linked_list.cpp` | `sources/doubly/doubly_linked_list.py` |
| `stack` | `sources/stack/stack.c` | `sources/stack/stack.cpp` | `sources/stack/stack.py` |
| `factorial` | `sources/factorial/factorial.c` | `sources/factorial/factorial.cpp` | `sources/factorial/factorial.py` |
| `fib` | `sources/fib/fib.c` | `sources/fib/fib.cpp` | `sources/fib/fib.py` |
| `queue` | `sources/queue/queue.c` | `sources/queue/queue.cpp` | `sources/queue/queue.py` |
| `inorder` | `sources/inorder/inorder.c` | `sources/inorder/inorder.cpp` | `sources/inorder/inorder.py` |
| `huffman` | `sources/huffman/huffman.c` | `sources/huffman/huffman.cpp` | `sources/huffman/huffman.py` |
| `bfs` | `sources/bfs/bfs.c` | `sources/bfs/bfs.cpp` | `sources/bfs/bfs.py` |
| `dfs` | `sources/dfs/dfs.c` | `sources/dfs/dfs.cpp` | `sources/dfs/dfs.py` |

## 5. 教学难点与真实中文内部注释

| 算法 | 主要教学难点 | 源码中的真实中文注释（annotation `zh`） |
| --- | --- | --- |
| `seqlist` | `length` 是有效元素数而非容量；插入允许 `index == length` 追加，删除不允许；插入从尾向前搬、删除从前往后搬；`length` 最后发布；`PrintList` 只输出 `[0, length)`。 | “插入允许 index == length 表示追加，但 length == capacity 时必须拒绝：合法范围同时受有效元素数和物理数组容量约束。” |
| `linked` | C 版只有 `head`，C++ 版有 `head_/tail_/length_` 与裸指针独占语义；改链必须先保存后继；头插/头删是特例；C++ 删除尾结点后要回退 `tail_`；Python `find_prev` 返回 `None` 同时表示“未找到”和“前驱为空”。 | “先分配再接入；next 立即置 NULL，避免半成品结点暴露未初始化链接。” |
| `doubly` | 相邻结点必须同时满足 `a.next == b` 与 `b.prev == a`；头/尾删除必须同步外部 `head/tail`；C++ `unique_ptr` 拥有后继、`tail_` 是非拥有观察者；`remove` 必须先保存 `prev` 与 `was_tail`，再做可能销毁结点的移动赋值。 | “两个端点必须一起清空；本实现没有计数，这两个 NULL 就完整描述了空表状态。” |
| `stack` | `top` 是当前栈顶下标，不是元素数或下一个空槽；`push` 先判满、再自增、再写入；`pop` 先读、再减；`peek` 不减；C++ `optional` 区分空与真实 0，Python 用 `None`。 | “判满依据是 top 而不是元素计数：top == capacity-1 时再自增就会写出数组边界。” |
| `factorial` | 0/1 是递归基；乘法必须等子调用返回；C/C++ 无符号参数排除负数，但 64 位会溢出；Python 无固定位宽，但受递归深度限制。 | “无符号参数排除负数输入；64 位返回值也把精确阶乘限制在较小的教学范围。” |
| `fib` | `F(0)=0`、`F(1)=1`；两个分支独立且无缓存，调用树指数增长而活动栈深度只有 O(n)；C/C++ 64 位很快溢出；Python 大整数仍受递归限制。 | “无符号参数排除负 n；超出较小教学范围后，64 位结果会迅速溢出。” |
| `queue` | `front` 指队首、`rear` 指下一个空位；牺牲一个槽，`front == rear` 为空、`(rear+1)%capacity == front` 为满；最多 `capacity-1` 个元素；入队先判满、写 `rear`、再取模；出队先读 `front`、再取模。 | “front 与 rear 从同一位置开始；这个相等关系就是空队列，因此无需额外计数字段。” |
| `inorder` | 空指针/`None` 是空子树出口；左递归必须先返回；访问根位于两次递归之间；右递归在根之后，因此 BST 得到升序；全程只读不改链接。 | “NULL 表示空子树，直接返回且不访问 value 或孩子链接；这个递归基终止每一次下降。” |
| `huffman` | 最小堆按 `(frequency, order)` 比较；`push` 追加后上浮，0 基父下标 `(i-1)/2`；`pop` 保存根、末尾叶填根、再下沉；合并循环两弹一压使森林减少一棵树；叶子路径生成 0/1 前缀码；后序释放树；C++ `reserve` 防止 `vector` 扩容使 `MinHeap` 引用失效。 | “频率是主键；插入序号用于打破平局，因此相同权值也会得到确定的树形。” |
| `bfs` | 入队时标记 `visited`，避免重复入队；FIFO 保证按距离非降；固定数组队列用 `head/tail` 区分取出与插入；C 版邻接矩阵 O(V²)，C++/Python 邻接表 O(V+E)；只从一个起点遍历一个连通分量。 | “队列中只保存已发现的顶点；visited 在入队时置位，所以同一顶点不可能再次入队。” |
| `dfs` | 进入顶点即标记；打印位置决定前序；一次递归返回前会穷尽该邻居的整条分支；父结点返回后继续扫描其他邻居；递归深度可达 V；只遍历起点所在分量。 | “visited 由所有递归帧共享；调用者分配并清零，函数只读写不复制。” |

## 6. 双语注释质量

本批新增 **219** 条英文教学注释及对应中文 annotation，覆盖 33 份 principle 源码：

| 算法 | 新增条数 |
| --- | ---: |
| `seqlist` | 18 |
| `linked` | 15 |
| `doubly` | 21 |
| `stack` | 20 |
| `factorial` | 7 |
| `fib` | 9 |
| `queue` | 24 |
| `inorder` | 12 |
| `huffman` | 27 |
| `bfs` | 38 |
| `dfs` | 28 |
| **合计** | **219** |

质量约束与结果：

- 每条 `en` 必须与源码中一条独立 `//` 或 `#` 教学注释完全相等，且在对应文件中恰好出现一次；`localization.test` 已逐条通过。
- 每条 `zh` 都由对应源码语境改写，不是全局模板；中文视图实际包含该译文，英文视图不残留中文。
- 英文视图删除中文块注释与中文行注释后，有效代码与源码一致；中文视图替换英文教学注释后，有效代码同样一致。
- BATCH-03 专项测试检查 33 个文件、每个文件至少 3 条 annotation、全部 anchor 存在、代表译文渲染、模板标签清零；结果为 35 tests 通过。
- 清理了 `huffman.c/.cpp/.py` 中与新注释重复的旧 `Min-heap ordering...` 行；修正了 `huffman.py::node_less` 原先把平局说成“按字符稳定排序”的错误，实际按 `order` 比较。

## 7. 三个复杂算法的实际阅读抽查

### 7.1 `huffman.c`：堆弹出与森林合并

```c
HNode *heap_pop(MinHeap *heap)
{
    HNode *top = heap->items[0];
    --heap->size;
    if (heap->size == 0)
    {
        return top;
    }
    // Shrink first, then copy the current last live node into the root; the saved top remains the returned minimum.
    heap->items[0] = heap->items[heap->size];
    int index = 0;
    while (1)
    {
        int left = index * 2 + 1;
        int right = left + 1;
        // Sift-down compares the current node with both children and swaps with the smaller one; stopping when neither child is smaller restores heap order.
        int smallest = index;
        if (left < heap->size && node_less(heap->items[left], heap->items[smallest]))
        {
            smallest = left;
        }
        if (right < heap->size && node_less(heap->items[right], heap->items[smallest]))
        {
            smallest = right;
        }
        if (smallest == index)
        {
            break;
        }
        HNode *temp = heap->items[index];
        heap->items[index] = heap->items[smallest];
        heap->items[smallest] = temp;
        index = smallest;
    }
    return top;
}

int order = count;
// Merge the two least frequent nodes repeatedly; the final tree gives shorter codes to more frequent symbols.
while (heap.size > 1)
{
    HNode *first = heap_pop(&heap);
    HNode *second = heap_pop(&heap);
    HNode *parent = make_node(first->frequency + second->frequency, '\0', order++);
    parent->left = first;
    parent->right = second;
    heap_push(&heap, parent);
}
```

抽查结论：`heap_pop` 先保存根、再缩短 `size`，空堆分支正确；非空时把最后一个有效叶填到根并下沉，`left/right` 边界检查与“当前结点也参与比较”的 `smallest` 初始化正确。合并循环在 `size > 1` 时每次取两个最小结点，森林规模严格减少一棵树。发现的 NULL 检查缺口见第 10 节。

### 7.2 `doubly_linked_list.cpp`：`remove`

```cpp
void remove(Node *node)
{
    // Capture prev and the tail relation before moving node->next: the move may destroy node once ownership is reassigned.
    Node *prev = node->prev;
    bool was_tail = (tail_ == node);
    // Moving next out of node makes the successor owned by the local variable; the later assignment transfers it to prev or head_.
    std::unique_ptr<Node> next = std::move(node->next);
    if (next)
    {
        next->prev = prev;
    }
    // tail_ must retreat before the final owning assignment may delete node; after deletion node->prev is unreadable.
    if (was_tail)
    {
        tail_ = prev;
    }
    if (prev)
    {
        prev->next = std::move(next);
    }
    else
    {
        head_ = std::move(next);
    }
}
```

抽查结论：`prev` 与 `was_tail` 在移动前快照，避免最后一个拥有者被替换后读已释放字段；`next->prev` 先修补，`tail_` 在最终赋值前回退；`prev` 为空则改 `head_`，否则接回前驱。头/尾/中间三种删除路径都保持 `a.next == b` 与 `b.prev == a`。

### 7.3 `bfs.py`：完整核心函数

```python
def bfs(graph: list[list[int]], start: int) -> list[int]:
    # One boolean per vertex; the list length also fixes the valid index range.
    visited = [False] * len(graph)
    # Mark the start before the loop; the invariant is 'queued implies visited'.
    visited[start] = True
    # deque gives O(1) popleft; a list pop(0) would shift the remaining frontier.
    pending: deque[int] = deque([start])
    # Order records dequeue order, which is also nondecreasing distance order for an unweighted graph.
    order: list[int] = []

    # The loop ends when the frontier is empty, meaning the start component has been exhausted.
    while pending:
        # popleft removes the oldest discovery; this FIFO step is what distinguishes BFS from DFS.
        vertex = pending.popleft()
        # Record on removal, not on discovery, so the output matches the processing order.
        order.append(vertex)
        # Only stored neighbors are scanned; absent entries mean no edge.
        for neighbor in graph[vertex]:
            # The guard prevents a second enqueue; without it the queue can grow without bound on cycles.
            if not visited[neighbor]:
                visited[neighbor] = True
                pending.append(neighbor)
    return order
```

抽查结论：起点在循环前标记并入队；每次从 `popleft` 取最早发现顶点，记录的是处理顺序；邻居在 `append` 前标记，因此环上不会重复入队。队列按发现顺序排列，无权图上的距离非降性质成立。

## 8. 验证结果

| 项目 | 结果 |
| --- | --- |
| 有效代码一致性 | 33/33 份源码去注释 token 与起始基线 `976002f` 完全一致，输出 `EFFECTIVE_CODE_BASELINE_OK files=33` |
| C 编译 | 11/11 通过，`gcc -std=c11 -Wall -Wextra -Wpedantic -Werror` |
| C++ 编译 | 11/11 通过，`g++ -std=c++17 -Wall -Wextra -Wpedantic -Werror` |
| Python 语法 | 11/11 通过 `python -m py_compile` |
| BATCH-03 专项测试 | `batch-03-teaching.test.ts` 35/35 通过 |
| 查看器显示与复制 | `batch-03-reference-code.test.tsx` 4/4 通过（顺序表、栈、哈夫曼、BFS） |
| 相关单测 | 7 files / 105 tests 通过（localization、comment-fact、batch-01/02/03、两批 viewer） |
| 全量单测 | 153 files / 1418 tests 通过 |
| 代表性 Playwright | `code-doc-04-batch-03.spec.ts` 1 passed（5.5s，顺序表/栈/哈夫曼/BFS 的中英显示与剪贴板复制） |
| `npm run typecheck` | 通过 |
| `npm run build` | 通过（Vite 生产构建；仅有 zod 依赖注释的 Rollup 非阻断提示） |

## 9. 范围保护与 Git 交付

- 只修改 11 个算法的 33 份注释、`batch-03-annotations.ts`、`annotations.ts`（清理 BFS/DFS 旧的 base anchor）、专项测试、进度与报告。
- 未修改任何算法有效代码、Trace、SVG、课程目录或其他算法。
- 未创建分支、worktree、Tag；未部署；全部提交直接推送 `main`。
- 未跟踪目录 `图论/` 全程保持未跟踪，未被暂存、提交、移动或删除。

| 组 | 算法 | 提交 | 推送 |
| --- | --- | --- | --- |
| 1 | `seqlist`、`linked`、`doubly` | `a9b2401` | `976002f..a9b2401 main -> main` |
| 2 | `stack`、`factorial`、`fib`、`queue` | `12697a8` | `a9b2401..12697a8 main -> main` |
| 3 | `inorder`、`huffman` | `d9e7323` | `12697a8..d9e7323 main -> main` |
| 4 | `bfs`、`dfs` | `04f83b5` | `d9e7323..04f83b5 main -> main` |
| 测试 | BATCH-03 专项/查看器/Playwright | `a265eb6` | `04f83b5..a265eb6 main -> main` |
| 校正 | `huffman.c` 的 `heap_pop` 缩小/复制顺序注释与中文 annotation | `eb7a24d` | `a265eb6..eb7a24d main -> main` |

## 10. 未修改的实现风险

1. `huffman.c`：`main` 的 `heap_push(&heap, make_node(...))` 未检查 `make_node` 的 NULL 返回；分配失败会解引用空指针。
2. `huffman.c`：合并循环的 `parent = make_node(...)` 同样未检查 NULL，随后直接写 `parent->left` / `parent->right`。
3. `huffman.c`：`MinHeap` 固定数组容量，未做运行时容量检查；当前示例在容量内，换更大输入可能越界。
4. `bfs.c` / `dfs.c`：`start` 未做范围检查，依赖调用方；`main` 只传合法值。
5. `seqlist.c::ListErase`：`removed` 未做 NULL 检查，依赖调用方提供有效输出指针。
6. `doubly_linked_list.c::list_remove`：假定 `node` 非空且属于该链表，未做归属校验。

以上均只登记，未在本批修复。

## 11. 进度清单

- 文件：`docs/CODE_DOC_04_PROGRESS.md`
- 内容：60 个正式算法的真实 ID、章序、三语言源码路径、教学深化状态、批次、提交哈希、质量复核状态。
- 统计：**27/60 已完成且有证据**；0 个本批进行中；33 个尚未完成；0 个阻断。
- 说明：完成数按实际教学提交哈希计数，不按 annotation 条数虚增；convenience 文件未混入 60 项总数。
