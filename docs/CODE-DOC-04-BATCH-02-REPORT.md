# CODE-DOC-04-BATCH-02 教学注释深化报告

## 1. 范围与注册表核对

本报告只覆盖以下 10 个已注册算法，未处理剩余 44 个算法，也未进入 SAFETY-01 或 TEACHING-FINAL。

| 算法 ID | 中文名 | C / C++ / Python 文件 |
| --- | --- | --- |
| static-linked-list | 静态链表 | static_linked_list.c / .cpp / .py |
| polynomial-add | 一元多项式相加 | polynomial_add.c / .cpp / .py |
| infix-to-postfix | 中缀转后缀 | infix_to_postfix.c / .cpp / .py |
| postfix-eval | 后缀表达式求值 | postfix_eval.c / .cpp / .py |
| bf | BF 字符串匹配 | bf.c / .cpp / .py |
| sparse-transpose | 稀疏矩阵转置 | sparse_transpose.c / .cpp / .py |
| gl-depth | 广义表深度 | gl_depth.c / .cpp / .py |
| gl-copy | 广义表深复制 | gl_copy.c / .cpp / .py |
| threaded-inorder | 中序线索二叉树 | threaded_inorder.c / .cpp / .py |
| block-search | 分块查找 | block_search.c / .cpp / .py |

文件映射已由 `src/domain/reference-code/registry.ts` 核实。`sparse_transpose_sort.*` 是共享便捷实现，未在本轮修改。实际处理 30 份源码，和去重后的注册表一致。

当前各文件的双语 annotation 数量（含历史条目）：

| 算法 | C | C++ | Python | 合计 |
| --- | ---: | ---: | ---: | ---: |
| static-linked-list | 10 | 10 | 9 | 29 |
| polynomial-add | 8 | 8 | 8 | 24 |
| infix-to-postfix | 8 | 8 | 7 | 23 |
| postfix-eval | 9 | 8 | 8 | 25 |
| bf | 7 | 7 | 8 | 22 |
| sparse-transpose | 8 | 8 | 7 | 23 |
| gl-depth | 9 | 9 | 9 | 27 |
| gl-copy | 9 | 9 | 9 | 27 |
| threaded-inorder | 14 | 12 | 12 | 38 |
| block-search | 8 | 8 | 8 | 24 |

数量不是验收依据。专项测试逐条验证每个 annotation 的英文锚点仍存在于源码，并验证中英文实际本地化文本、去注释后的有效代码一致。

## 2. 注释质量方法

1. 先逐文件检查已有注释，区分有效教学解释、纯函数头模板和重复说明。
2. 把解释放在关键判断、循环、递归和数据结构更新旁边，而不是集中在文件头。
3. 每个非平凡函数至少回答：为什么用这个结构、变量为何存在、判断为何正确、循环/递归维护什么、更新顺序为何不能交换、边界如何处理。
4. 三语言分别解释 C 的指针/数组边界/内存、C++ 的容器/所有权/引用、Python 的列表/字典/对象引用/索引更新；算法思想一致，但注释不批量复制。
5. 删除本轮发现的 `作用：` 与 `Purpose:` 函数头模板标签，并删除 group 4 中与相邻新注释重复的旧模板；保留的多语言行由现有本地化机制按 UI 语言筛选，不会同时显示。
6. 不修改有效代码、函数签名、变量/数据结构、输入输出、Trace、SVG、CSS、课程目录或播放器。

## 3. 逐算法教学审查

### 3.1 static-linked-list

最重要的三个难点：

- `cur` 是数组下标而不是机器地址；逻辑后继变化不搬动数组元素。
- 数据链与空闲链互不重叠，`free_head` 是唯一可分配凭据；借结点必须先读 `nodes[new_index].cur` 再改 `free_head`。
- 插入必须先让新结点接住后继，再改 `head` 或前驱 `cur`；删除必须先解数据链，再把结点压回空闲链头。

体现难点的函数：`static_insert`、`static_delete`、`static_init`。

关键代码块：`free_head` 借出分支；`nodes[new_index].cur = successor` 与 `head`/前驱重接分支；删除时的前驱重接与空闲链头回收分支。

为什么足够：学生能看到“游标是下标”的结构定义、空闲链为何不能从数据链扫描、两次链接的先后依赖，以及数组物理顺序与逻辑顺序为何可以不同。边界 `position` 越界、空闲表耗尽、`position=1` 的头哨兵均在相邻注释中说明。

### 3.2 polynomial-add

最重要的三个难点：

- 指数是排序键；两条降序链使合并只需比较两个头结点。
- 指数相等才合并系数；系数和为 0 时省略结点，但两个游标都必须前进。
- 某一条链先结束时，剩余链本身已降序，可以逐项追加；`tail` 必须保持指向结果尾结点。

体现难点的函数：`add_polynomials`，以及 C 的 `append_term`、C++ 的 `tail_`、Python 的 `__post_init__`。

关键代码块：指数比较三分支、同指数零和分支、两个剩余链追加循环、C++ `unique_ptr` 所有权与 `tail_` 非拥有游标。

为什么足够：注释把“为什么按指数组织”“为什么零系数不建结点却仍要前进”“为什么剩余链可以直接接上”分别放在对应分支旁，并明确结果仍保持降序。

### 3.3 infix-to-postfix

最重要的三个难点：

- 运算符栈只保存输出顺序尚未确定的运算符；操作数可以直接输出。
- 左括号是弹栈屏障；右括号必须弹到匹配左括号，并把括号本身丢弃。
- `>=` 而不是 `>` 保证左结合；扫描结束必须清栈，残留左括号表示括号不匹配。

体现难点的函数：`Precedence`、`InfixToPostfix`。

关键代码块：完整数字串读取、右括号弹栈、运算符优先级循环、输入结束清栈。

为什么足够：学生能看到 `8-3-2` 为什么先输出第一个减号、`12` 为什么不能拆成 `1` 和 `2`，以及括号为何不能当普通运算符输出。当前实现只接受数字、四个二元运算符和括号；不支持一元负号、幂运算、变量或负数字面量，注释没有声称支持。

### 3.4 postfix-eval

最重要的三个难点：

- 操作数栈保存尚未被运算符消费的值；数字必须整 token 入栈。
- 运算符先弹出右操作数，再弹出左操作数；减法和除法不能交换顺序。
- 每次二元运算把两个操作数替换为一个结果；合法表达式结束时栈中恰好一个值。

体现难点的函数：`EvalPostfix`。

关键代码块：数字入栈分支、`top < 1` 下溢检查、先右后左弹出、除零检查、结果重新入栈、最终 `top == 0` 检查。

为什么足够：注释不仅说明“弹两个”，还解释了两个值的角色和不可交换性；栈下溢、除零、多余操作数都由当前实现的实际返回/错误文本描述，没有把演示代码说成完整表达式解析器。

### 3.5 bf

最重要的三个难点：

- 候选起点 `s` 的范围是 `0..n-m`；每个候选都从 `j=0` 重新比较。
- 失配后只右移候选起点，不复用已经匹配的前缀，因此可能重复比较已知字符。
- 最坏时间是 `O(nm)`；空模式串、模式串长于主串、输出容量不足都有明确约定。

体现难点的函数：`bf_find_all`。

关键代码块：候选起点循环、内层比较循环、失配重置、匹配计数与容量检查。

为什么足够：注释明确区分 BF 与 KMP 的差别，说明为什么 BF 不会遗漏匹配位置，也说明输出容量不足时返回 `-1` 而不是静默丢结果。

### 3.6 sparse-transpose

最重要的三个难点：

- 三元组只存非零元素；转置交换行列坐标，非零个数不变。
- `num[c]` 统计源列非零数，`cpot[c] = cpot[c-1] + num[c-1]` 是列起始位置的前缀和。
- 按源三元组原有行优先顺序扫描，`q = cpot[col]` 是该列下一个写槽；写入后必须立即 `++cpot[col]`，否则同列下一条覆盖刚写入项。

体现难点的函数：`fast_transpose`。

关键代码块：Phase 1 计数、Phase 2 前缀和、Phase 3 的 `q` 写入与游标推进。

为什么足够：学生能看到目标位置不是全局写指针，而是每列独立游标；也能理解为什么按原行优先顺序回填可以直接得到目标行优先结果。当前实现确实是快速转置，报告不虚构普通转置步骤。

### 3.7 gl-depth

最重要的三个难点：

- 原子深度为 0；真实空表 `()` 深度为 1。
- 递归沿 `head` 进入子表，循环沿 `next` 遍历同层兄弟；二者不能混为同一层。
- 当前层深度是子表最大深度加 1；取最大值而不是求和，才表示嵌套层数。

体现难点的函数：`gl_depth`。

关键代码块：原子返回、空表约定、`best` 初始化、`head` 递归、`next` 循环、`best + 1` 返回。

为什么足够：注释把广义表长度与深度分开解释，并明确 `()` 的深度约定，避免把“元素个数”误当“嵌套层数”。

### 3.8 gl-copy

最重要的三个难点：

- 复制容器不等于深复制节点；每个源结点都必须分配新结点。
- 先分配新父结点，再递归复制子表；`tail` 指向下一个链接槽，先接孩子再推进。
- 原表与副本不能共享可变节点；失败时必须释放已经构造的半成品。

体现难点的函数：`copy_one`、`append_child`。

关键代码块：父结点分配、原子文本复制、子表递归与 `tail` 重接、失败释放分支。

为什么足够：注释说明了节点独立性、兄弟顺序如何保持、空表如何处理；也明确 `copy_one` 只复制一个结点及其子树，不复制源结点的 `next`，不是任意有环图复制。

### 3.9 threaded-inorder

最重要的三个难点：

- 真实孩子指针与 `left_thread/right_thread` 分离；`ltag/rtag` 只标记线索字段是否有效，不能把线索当真实孩子。
- 当前结点无真实左孩子时写入前驱；只有前驱无真实右孩子时，才把当前结点写入前驱的后继线索。
- 中序顺序决定前驱/后继；`prev` 必须在两条链接都处理完后再推进；尾结点需要单独补空后继线索。

体现难点的函数：`thread_walk`、`thread_inorder`、`inorder_by_threads`、`leftmost`。

关键代码块：空左孩子写前驱、前驱空右孩子写后继、`prev = node`、尾结点补线索、`rtag==1` 走线索/`rtag==0` 进入真实右子树。

为什么足够：学生能看到前驱和后继为什么不会漏、为什么不能覆盖真实孩子、为什么最后一个结点要单独处理，以及线索遍历与普通中序递归的区别。

### 3.10 block-search

最重要的三个难点：

- 数据保持原顺序；`block_size` 只把连续前缀切块，不排序。
- 索引项保存 `max/start/length`；只有块最大值严格递增且后块所有值都大于前块最大值时，按 `max` 选块才正确。
- 先顺序扫描索引，进入第一个 `target <= max` 的块；块内只做线性扫描，不假设块内有序。

体现难点的函数：`build_index`、`block_search`。

关键代码块：向上取整的块数、索引前提校验、首个满足 `max` 的块、块内线性扫描、未命中返回 `-1`。

为什么足够：注释明确这不是二分查找或哈希查找，也说明了块大小和索引方式为何影响效率；找不到目标时不会误入最后一块。

### 3.11 每个算法至少一条真实中文注释

以下文本均来自 `annotations.ts` 的 `zh` 字段，并在中文本地化代码中实际出现：

| 算法 | 真实中文内部注释 |
| --- | --- |
| static-linked-list | 必须先把目标结点从数据链解下，再把它压入空闲链头；否则同一结点会同时被数据链和空闲链引用。 |
| polynomial-add | B 用尽后，A 的剩余项本身已经降序；逐项复制即可保持顺序，也正确处理了两条链长度不等的情况。 |
| infix-to-postfix | 扫描结束后不会再有 token 决定剩余顺序；必须清空栈，让低优先级运算符也进入输出。 |
| postfix-eval | 合法后缀表达式最后恰好剩一个值；top < 0 表示操作数不足，top > 0 表示还有多余操作数未被消费。 |
| bf | 候选上界 s ≤ n−m 保证每个 s+j 都是合法主串下标，因此循环可一直走到 m，无需在内部再加边界检查。 |
| sparse-transpose | q 是本列的下一个空闲槽，而不是全局写指针；每列都有独立移动的游标，因此各列可以分别回填。 |
| gl-depth | 加一是在计算当前列表这一层括号；取最大值而不是求和，才使结果表示深度而不是元素个数。 |
| gl-copy | 递归复制失败会留下部分连接的子树；返回 NULL 前必须沿真实孩子边释放它，避免调用方拿到半成品链。 |
| threaded-inorder | 线索目标放在独立字段中，真实左/右孩子永不被覆盖；ltag/rtag 告诉遍历哪个指针才是有效的。 |
| block-search | 块内并未保证有序，因此只能线性扫描判等；在这里用二分会假设一种索引从未承诺过的顺序。 |

## 4. 关键代码与双语注释

### 4.1 infix-to-postfix：运算符优先级处理

C 源码片段（`src/domain/reference-code/sources/infix-to-postfix/infix_to_postfix.c`）：

```c
static int Precedence(char op)
{
    if (op == '+' || op == '-')
    {
        return 1;
    }
    if (op == '*' || op == '/')
    {
        return 2;
    }
    return 0;
}

else if (token == '+' || token == '-' || token == '*' || token == '/')
{
    // 同级运算符左结合：>= 而不是 >，否则 8 - 3 - 2 会算错。
    // Use >= for left associativity; > would make 8 - 3 - 2 wrong.
    while (top >= 0 && operators[top] != '(' && Precedence(operators[top]) >= Precedence(token))
    {
        char popped[2] = {operators[top--], '\0'};
        if (!AppendToken(out, capacity, popped))
        {
            return false;
        }
    }
    if (top + 1 >= MAX_EXPR)
    {
        return false;
    }
    // Push the incoming operator only after the while has emitted every greater-or-equal top; pushing first would reverse its operands.
    operators[++top] = token;
}
```

对应的中文内部注释已经存在于同一代码块：

> 同级运算符左结合：>= 而不是 >，否则 `8 - 3 - 2` 会算错。

对应的英文教学注释：

> Use >= for left associativity; > would make `8 - 3 - 2` wrong.

> Push the incoming operator only after the while has emitted every greater-or-equal top; pushing first would reverse its operands.

中文 annotation：

> 只有 while 已输出所有优先级不低于自己的栈顶后才压入新运算符；先压栈会颠倒操作数顺序。

### 4.2 sparse-transpose：目标位置计算

C 源码片段（`src/domain/reference-code/sources/sparse-transpose/sparse_transpose.c`）：

```c
/* Phase 1: num[c] counts non-zeros in original column c. */
for (k = 0; k < src->count; ++k)
{
    ++num[src->data[k].col];
}

/* Phase 2: cpot[c] is the first result slot of column c. */
// Column 0 owns the first result slot. There is no earlier column whose entries must be reserved, so its start is exactly zero.
cpot[0] = 0;
for (c = 1; c < src->cols; ++c)
{
    // Each column starts after all previous columns: the previous start plus the previous count is the prefix sum that gives this column its first slot.
    cpot[c] = cpot[c - 1] + num[c - 1];
}

/* Phase 3: place each source triplet directly into its final slot. */
// Scan the source in its existing row-major order. Within one source column, entries appear in increasing source row, which becomes increasing destination column; direct placement therefore produces row-major output.
for (k = 0; k < src->count; ++k)
{
    // q is this column's next free slot, not a global write counter. Every column has its own moving cursor, so columns can be filled independently.
    int q = cpot[src->data[k].col];
    dst->data[q].row = src->data[k].col;
    dst->data[q].col = src->data[k].row;
    dst->data[q].value = src->data[k].value;
    // Advance the cursor after the write. The current triple occupies q; the next triple from the same column must go to q+1, otherwise entries would overwrite each other.
    ++cpot[src->data[k].col];
}
```

对应的中文教学注释：

> `q` 是本列的下一个空闲槽，而不是全局写指针；每列都有独立移动的游标，因此各列可以分别回填。

> 写入后再推进游标：当前三元组占据 `q`，同列下一条必须写到 `q+1`，否则会互相覆盖。

对应的英文教学注释：

> q is this column's next free slot, not a global write counter. Every column has its own moving cursor, so columns can be filled independently.

> Advance the cursor after the write. The current triple occupies q; the next triple from the same column must go to q+1, otherwise entries would overwrite each other.

### 4.3 threaded-inorder：前驱/后继线索更新

C 源码片段（`src/domain/reference-code/sources/threaded-inorder/threaded_inorder.c`）：

```c
thread_walk(node->left, state);

// A missing real left child is exactly the slot that can store the predecessor. prev is NULL only for the first in-order node, and that NULL is itself the correct no-predecessor thread.
if (node->left == NULL)
{
    node->ltag = 1;
    node->left_thread = state->prev;
}
// The current node is the predecessor's successor only when the predecessor has no real right child. If it has a right child, the successor lies inside that subtree, so this thread must not be written.
if (state->prev != NULL && state->prev->right == NULL)
{
    state->prev->rtag = 1;
    state->prev->right_thread = node;
}

// Advance prev only after both links are handled. The next node must see this node as its predecessor, while this node's successor may be written when the next node is visited.
state->prev = node;
state->last = node;
thread_walk(node->right, state);
```

对应的中文教学注释：

> 缺少真实左孩子，正好可以用这个位置保存前驱；只有中序第一个结点的 `prev` 为 `NULL`，而这个 `NULL` 本身就是正确的“无前驱”线索。

> 只有前驱没有真实右孩子时，当前结点才是它的中序后继；若前驱有右子树，后继在右子树内部，不能在这里写后继线索。

> 两条线索都处理完才推进 `prev`；下一个结点要把当前结点当作前驱，而当前结点的后继可能在下一次访问时才写入。

对应的英文教学注释：

> A missing real left child is exactly the slot that can store the predecessor. prev is NULL only for the first in-order node, and that NULL is itself the correct no-predecessor thread.

> The current node is the predecessor's successor only when the predecessor has no real right child. If it has a right child, the successor lies inside that subtree, so this thread must not be written.

> Advance prev only after both links are handled. The next node must see this node as its predecessor, while this node's successor may be written when the next node is visited.

## 5. 三语言对应关系

- C：重点解释数组下标、真实指针与线索字段的分离、边界检查、`malloc/free` 与失败路径。
- C++：重点解释 `std::vector`、`std::unique_ptr` 所有权、裸线索指针不拥有结点、引用传递的 `prev/last`、`std::invalid_argument` 失败路径。
- Python：重点解释列表下标、对象引用、`None` 终止、`pre[0]/last[0]` 的共享状态、`ValueError`/递归行为。

三个语言的主体逻辑一致，但注释按各自实现写，没有把 C 注释批量复制到 Python。中文与英文共用同一份算法源码，annotation 只替换注释，不维护第二份算法逻辑。

### 5.1 注释映射与显示覆盖审计

逐文件已对比三类来源：双语行注释对、独立英文行注释、以及 Python/C++ 的块注释与模块说明。`applyChineseAnnotations` 只处理独立 `//`/`#` 行，块注释与双语邻接行由 `selectReferenceComments` 按语言筛选，因此“未进入 annotation”不一定等于显示遗漏。

- 直接写在源码中的中英文成对注释、混合语言块注释和 Python 模块 docstring 都能按 UI 语言保留对应语言，不属于丢失。
- 审计发现并删除了若干重复的函数头短句：`static_linked_list.cpp`、`static_linked_list.py`、`polynomial_add.py`、`infix_to_postfix.py`、`gl_depth.c/.cpp`、`gl_copy.cpp`。删除的只是与相邻详细注释重复的英文行，算法代码未变。
- 为此前只有英文的实质说明补了中文映射：`postfix_eval.c` 的“C 向零截断”、`postfix_eval.py` 的“Python // 向下取整”和 `threaded_inorder.c` 的“线索边不拥有目标结点”。这三处现在在中英文视图中都有对应说明。
- 仍为源文独有、未加 annotation 的行注释限于：文件头/编译命令、演示输入数据、`main` 打印说明、以及已被相邻详细注释覆盖的短函数头。它们不承载关键算法步骤；关键插入/合并/优先级/求值/匹配/转置/深度/复制/线索/查找分支均有当前语言的解释。

## 6. 验证结果

### 6.1 有效代码一致性

`verify-integrity.mjs` 结果：

```json
{"compared":211,"failures":[]}
```

这覆盖仓库全部 211 份注册源码，本轮 30 份全部包含在内。多轮删除模板标签、调整注释后均重新运行，结果保持 0 failure。

### 6.2 编译与运行

对 10 个算法的全部 C、C++ 源码使用 `gcc -std=c11 -Wall -Wextra` 与 `g++ -std=c++17 -Wall -Wextra` 编译，并运行生成的程序；全部 20 个可执行文件退出码为 0，警告日志为空。

对 10 个 Python 文件执行 `python -m py_compile` 并运行；全部退出码为 0。

代表性输出：

```text
tagged pointers = 6
threaded inorder: 1 2 3 4 6

find 38: index=7, index comparisons=2, block comparisons=4
find 60: index=-1, index comparisons=2, block comparisons=4
```

### 6.3 双语 annotation 专项测试

`src/domain/reference-code/batch-02-teaching.test.ts`：31/31 通过。逐条覆盖 30 个目标，验证：

- annotation 的英文锚点仍存在于源码；
- 中文实际出现在中文本地化文本；
- 英文文本不含 CJK；
- 中文/英文去注释后的有效代码完全一致；
- 30 份源码不再含 `作用：`、`// Purpose:`、`# Purpose:` 模板标签。

`batch-01-teaching.test.ts`、`localization.test.ts`、`comment-fact.test.ts` 同时通过。

### 6.4 查看器显示与复制

`src/features/lab/batch-02-reference-code.test.tsx` 覆盖 `infix-to-postfix`、`sparse-transpose`、`threaded-inorder`、`block-search` 四个代表算法：

- 中文 UI 显示中文注释，不显示对应英文；
- 复制结果包含中文注释，不含英文；
- 切换英文后显示英文注释，不混入 CJK；
- 复制结果包含英文注释且不含 CJK；
- 复制的仍是完整源码，不是只读可视区域。

`ReferenceCodePanel.test.tsx` 原有 17 个测试同时通过。

### 6.5 Playwright

`e2e/code-doc-04-batch-02.spec.ts` 通过 1/1。真实 Edge 浏览器、真实构建产物、真实剪贴板读取，覆盖上述四个算法的中文显示/复制、英文显示/复制和语言切回。

### 6.6 全量回归

- `npm run typecheck`：通过。
- `npm run build`：通过；只有 `node_modules/zod` 的 Rollup 注释位置警告，与本次改动无关。
- 全量 Vitest：147 个测试文件、1325 个测试全部通过。
- 未重新执行 60 算法完整 Pyodide 矩阵，未重新执行 AUDIT-02 SVG 专项回归，符合本轮范围。

## 7. 发现但未修改的实现风险

以下只记录位置和复现条件，没有修改有效代码：

1. `sparse_transpose.c` 的 `fast_transpose` 在 `++num[src->data[k].col]` 处信任三元组列坐标；若 `src->cols=5` 而某三元组 `col=7`，会对 `num` 产生越界写。`sparse_transpose.cpp` 的 `num[source.triples[k].col]++` 同样没有边界检查。Python 版在 `fast_transpose` 前显式检查 `0 <= col < cols`，会抛出 `ValueError`，不存在该越界。
2. `gl_depth.c/.cpp/.py` 与 `gl_copy.c/.cpp/.py` 的递归没有深度上限；极深的嵌套广义表可能耗尽 C 调用栈，Python 会抛出 `RecursionError`。这是演示型递归实现的固有限制，本轮未加入深度守卫。
3. `static_linked_list.c` 的 `static_init` 在输入 `count > CAPACITY` 时静默截断到容量，既不返回错误也不报告截断；这是固定容量演示实现的约定，未改为失败返回。

## 8. 仍然存在的教学解释缺口

- `main`、`print_*`、`free_poly`、`__repr__`、简单 getter/构造函数等辅助代码只保留简短职责说明，没有再写逐行教学块；它们不承载算法不变量。
- `threaded_inorder.c` 的 `count_tags` 与 C++ 的 `count_tags` 只有结构性计数解释，没有逐步展开递归栈；它用于自检，不是核心线索化逻辑。
- `block_search` 的索引前提校验解释了“为什么必须严格递增”，但没有单独讨论不同块大小对比较次数的影响；这属于复杂度分析，不是本轮注释必须覆盖的代码路径。
- 未发现关键算法函数仍然只有函数头、内部完全没有解释的情况。插入/删除、合并、优先级、求值、匹配、转置、深度/复制、线索化/遍历、建索引/查找这些承载难点的函数，均有贴近代码块的说明。

## 9. 提交与停止条件

已提交并推送的算法组：

- `158a730`：group 1，static-linked-list + polynomial-add
- `50d4d99`：group 2，infix-to-postfix + postfix-eval + bf
- `39edf5e`：group 3，sparse-transpose + gl-depth + gl-copy
- `05ccb1a`：group 4，threaded-inorder + block-search
- `9a1ac72`：模板标签与重复函数头清理
- `433c7a4`：双语专项测试、查看器测试、Playwright 用例与本报告
- `e2592a2`：逐算法中文注释锚点审计
- 最终清理提交：删除重复函数头短句，补齐 postfix 整除语义与 threaded 释放所有权的中文映射，并更新本报告的显示覆盖审计。哈希见本轮最终交付回复。

本轮到此停止：不处理剩余 44 个算法，不进入 SAFETY-01 或 TEACHING-FINAL，不创建 v1.0.0 Tag，不执行部署。
