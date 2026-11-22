# SAFETY-02：五算法输入边界与错误路径专项核查

## 1. 基线与范围

| 项 | 实际值 |
|---|---|
| 起始 `HEAD` / `origin/main` | `c0adbaec8d80cbb8b125224f6e7120b6fb321667` |
| 分支 / 工作区 | 直接在 `main` 修改；未创建分支、worktree，未重置历史 |
| 受保护未跟踪目录 | `图论/`；未删除、移动、覆盖、暂存或提交 |
| 核查算法 | `free-list`、`kmp`、`articulation`、`radix`、`replacement` 的 C / C++ / Python 参考实现 |
| 未做 | 未重做 CODE-DOC-04，未重构其他算法，未创建 Tag，未部署，未改版本号 |

核查以“实际源码行为”为准，不以既有注释、旧审计结论或测试编译成功作为安全证据。所有旧行为先读 `HEAD` 原始实现并做静态/动态核对，再决定是否修改。

## 2. 结论总表

分类口径：

- **确认缺陷**：在课程契约内的有效输入或正常重复调用下可触发，且会越界、污染状态、静默丢失结果或无法区分失败。
- **边界保护**：只在绕过文档契约的非法调用下触发；仍需入口拒绝，避免越界或破坏数据结构。
- **合法差异**：不同 API 返回类型、固定数组与动态容器、矩阵与邻接表等设计差异，不强行统一。
- **误报 / 保留**：静态看起来危险，但当前路径不可达或已有显式检查；保留实现并说明限制。

| 区域 | 登记风险 | 分类 | 结论 |
|---|---|---|---|
| free-list | C `insert_block` 在 `count == MAX_BLOCKS` 时搬移并写 `blocks[count]` | 确认缺陷 | 旧代码第 24 次 1 字节分配后 `count=25`，越界写；现返回 0 且块表不变 |
| free-list | C `request <= 0`、`request == 0` | 边界保护 | 旧代码可写出负数/零大小 used 块或扩大剩余块；现入口返回 0 |
| free-list | C `init_memory` 接受 `<8` 或 `>128` | 边界保护 | 旧代码可写入负/零根块；现拒绝且不改旧表 |
| free-list | C 4 字符 ID 被 `snprintf` 静默截断 | 确认缺陷（非法 ID 触发） | `LONG` 变 `LON`，`release("LONG")` 永远失败，`release("LON")` 可能误释放；现拒绝长度 ≥4 |
| free-list | 三语言重复 ID | 边界保护 | 旧 C/C++/Python 都接受，产生两个同标签 used 块；现入口拒绝 |
| free-list | C `release_block(NULL)` | 边界保护 | 旧代码直接 `strcmp`；现空/NULL 返回 0 |
| free-list | C++/Python 非法容量、ID、request | 边界保护 | 旧代码无入口校验；现 C++ 抛 `invalid_argument`，Python 抛 `ValueError` |
| free-list | C++/Python 固定描述符容量 | 合法差异 | 动态容器无 `MAX_BLOCKS` 数组越界；C 保留 24 描述符教学上限 |
| KMP | C `malloc` 失败返回 0，与正常零匹配混淆 | 确认缺陷 | 失败注入旧代码返回 0；现返回 -1，正常匹配保持 ≥0 |
| KMP | 三语言空模式串返回不同 | 合法差异 | C 计数 API 返回 0；C++ 起点列表返回空列表；Python 抛 `ValueError`；未强制同型 |
| KMP | C `NULL` 参数 | 边界保护 | 现入口返回 -1，避免进入 `strlen` |
| articulation | C/C++/Python 全局 `disc/low/timer/articulation/bridge` 不重置 | 确认缺陷 | 第二次调用旧状态抑制 DFS；现每次调用全量清零，`parent` 置 -1 |
| articulation | C `add_edge` 端点越界直接写矩阵 | 边界保护 | 现返回 0，不写；C++ 返回 `false` |
| articulation | C++ 矩阵形状错误 | 边界保护 | 新增 `hasGraphShape`；`find` 拒绝错误 8×8 形状且保留上一结果 |
| articulation | Python 全局图邻接项为非法顶点 | 边界保护 | `add_edge` 拒绝非 int/bool/越界；`find` 校验每行且邻接项为 0..7 int |
| articulation | C 固定 8 顶点与 UI 10 顶点不同 | 合法差异 | 参考实现是独立演示限制；不宣称与 UI 输入上限一致 |
| articulation | C 矩阵 O(V²) 与 Python 邻接表 O(V+E) | 合法差异 | 两种合法图存储方式，未统一 |
| radix | C `RadixSort` 无入口校验，`n > 16` 越界写固定数组 | 边界保护 | 旧代码 `n=17` 可越界；现返回 0，校验先于写入 |
| radix | C `DigitAt` 对负数得到负桶下标 | 边界保护 | 现入口拒绝 `0..9999` 之外值，负值不进入桶下标 |
| radix | C++ `RadixSort` 绕过 `main` 校验 | 边界保护 | 现返回 `bool`，拒绝空、>16、负值、>9999 |
| radix | 大整数导致数位因子溢出 | 合法输入无风险 | 合法 0..9999 最多 4 趟，`power` 到 10000；非法大整数入口拒绝 |
| radix | 空输入、负数、超量三语言错误类型不同 | 合法差异 | C/C++ 返回失败状态，Python 抛 `ValueError`；都明确拒绝 |
| radix | 稳定收集顺序 | 无缺陷 | 桶内 FIFO；重复 45 的 `(45,1)` 保持在 `(45,2)` 前 |
| replacement | C `n > 20`、`capacity > 6` 越界写固定数组 | 边界保护 | 旧代码 capacity 7 + n 9 只输出 7 条并丢 2 条；现入口返回 -1 |
| replacement | C `CloseRun`/`RunResult` 固定容量 | 边界保护 | `CloseRun` 改 `int`，校验 `currentLength 0..20`、`runCount 0..19`；失败返回 -1，不截断 |
| replacement | C++ 负容量 `length_error`、字符串字面量异常未捕获 | 确认缺陷（错误传播） | 现入口抛 `invalid_argument`，不变量抛 `runtime_error`，`main` 捕获并返回 1 |
| replacement | Python 空槽生成器 `StopIteration` | 误报 / 防御性保留 | 合法 2..6/1..20 下每次输出恰好留下一个空槽，静态不可达；仍改为 `next(..., None)` + 明确 `ValueError` |
| replacement | C `EmptySlot` 返回 -1 被当作有效下标 | 误报 | 第 152 行已有 `if (empty < 0) return -1`；未作为下标使用 |
| replacement | 所有候选冻结、连续开启新段 | 边界保护 | 合法批次有显式失败路径；n20/cap2 产生 10 段、覆盖且有序 |

## 3. 确认缺陷与修复证据

### 3.1 free-list C `insert_block` 描述符越界

旧 `insert_block` 为 `void`，在 `count == MAX_BLOCKS(24)` 时仍从 `count` 起搬移并写 `blocks[count]`。动态复现使用容量 128、连续申请 1 字节：第 24 次分裂后 `count=25`，已越过 `blocks[0..23]`。当前回归 harness 在修复后报告：

```text
DESCRIPTOR_LIMIT=23 ALLOCATED=23 COUNT=24 COVERS=1
```

即第 24 次分配被拒绝，`allocated=23`、`count=24`，空闲/已用分区仍完整覆盖 128 字节。修复没有提高 `MAX_BLOCKS`，只在入口拒绝并保持块表不变；该 24 描述符上限是教学表限制，不是 128 字节容量上限。

### 3.2 free-list C 非法容量与非法 request

旧 `init_memory(total)` 无校验，`total <= 0` 会写入负/零根块，`total > 128` 也会接受。旧 `allocate_block` 对 `request == 0` 产生零大小 used 块；对 `request < 0` 产生比原区间更大的“剩余块”，并把 chosen 大小改成负数。当前回归 harness 验证：

```text
CAP8=1 CAP=8
BAD_LOW=0
BAD_LOW_KEEPS=1,64,1
BAD_HIGH=0
BAD_HIGH_KEEPS=1,64,1
ZERO_REQUEST=0
NEGATIVE_REQUEST=0
COUNT_AFTER_INVALID=1 SIZE=64
```

`init_memory` 失败时旧表保留；非法分配在写任何描述符前返回。

### 3.3 free-list ID 截断与重复 ID

C 旧代码用 `snprintf(..., MAX_LABEL=4, "%s", id)`：`LONG` 实际存成 `LON`，`release("LONG")` 永远失败，`release("LON")` 可能释放另一块。现 C 拒绝 `NULL`、空串和长度 ≥4；C++/Python 同步拒绝长度 >3，避免三语言契约分叉。重复 ID 旧三语言均接受，C 的 release 只能逐个释放，C++/Python 可连续 release 两次；现在全部在入口拒绝。回归输出：

```text
NULL_ID=0
EMPTY_ID=0
LONG_ID=0
DUP1=1 DUP2=0
UNKNOWN_RELEASE=0 NULL_RELEASE=0
MERGE_COUNT=1 MERGE_SIZE=64 MERGE_FREE=1 MERGE_COVERS=1
```

C++/Python 对非法 ID、容量、request 分别抛 `invalid_argument` / `ValueError`；空间不足仍返回 `false` / `False`，没有把“拒绝非法参数”和“没有足够连续空间”混为一谈。

### 3.4 KMP C 分配失败

旧 C `KMP` 在 `malloc` 失败时返回 0，与正常“零次匹配”相同。失败注入 harness 在修复后输出：

```text
OVERLAP=4
NO_MATCH=0
EMPTY_PATTERN=0
EMPTY_TEXT=0
NULL_TEXT=-1
NULL_PATTERN=-1
ALLOCATION_FAILURE=-1
```

`KMP` 现在返回匹配次数 `>=0`；`NULL` 参数或分配失败返回 `-1`；`main` 检查负值并打印错误后返回 1。C 空模式仍按既有契约返回 0 次，C++ 返回空列表，Python 抛 `ValueError`，三者未被强行统一。

### 3.5 articulation 重复调用状态污染

旧三语言 `find` 不重置全局 `disc/low/parent/timer/articulation/bridge`。动态复现：先跑默认图，再跑单边图，C/C++ 第二次调用直接空转并保留旧关节点/桥，`timer` 停在 8；Python 同样。修复后每次调用先清零全部状态，C++ `std::fill`，Python `reset_state()`；回归输出：

```text
FIRST_ART=00110000
SECOND_ART=00110000
SECOND_TIMER=8
SINGLE_ART=00000000
OLD_BRIDGE_23=0
OLD_BRIDGE_67=0
STAR_ART=1000
ROOT_STAR_BRIDGES=1,1,1
```

C 空图返回 0，Python 形状错误抛 `ValueError`；C++ 错误 8×8 形状 `WRONG_SHAPE_FIND=0` 且保留星形结果 `WRONG_SHAPE_KEEPS=1`。

### 3.6 articulation 输入边界

C `add_edge` 原为 `void`，端点越界直接写矩阵；现 `int` 返回，拒绝 `graph == NULL` 和 `a/b` 不在 `0..7`，非法边不写。C++ `addEdge` 返回 `bool` 并检查 8×8 形状。Python `add_edge` 拒绝非 int/bool/越界端点，`find` 额外校验 8 行、每行为 list、每个邻接项为 0..7 int。回归输出 `ADD_NEGATIVE=0`、`ADD_TOO_LARGE=0`、`ADD_NULL_GRAPH=0`、`INVALID_EDGES_KEEP_GRAPH=1`、`invalid_endpoint -1 error`、`invalid_endpoint 8 error`、`wrong_shape error`、`invalid_neighbor error`。

根节点判据 `low[v] >= disc[u]`、桥 `low[v] > disc[u]`、非连通图多根扫描未改；星形图验证根 `0` 为关节点且三条边均为桥。

### 3.7 radix 独立参考接口

旧 C `RadixSort` 为 `static void`，`n > MAX_RECORDS=16` 会越界写 `order/next_order/sorted/buckets`，负数会让 `DigitAt` 得到负 digit 并作为桶下标；旧 C++ 负数也会在 `buckets[digit]` 断言崩溃。现在 C 返回 `int`，校验 `records != NULL`、`1 <= n <= 16`、每个值 `0..9999`；C++ 返回 `bool`，拒绝空、>16、负数、>9999；所有校验先于写入。回归输出：

```text
NORMAL_RESULT=1
NEGATIVE=0 NEGATIVE_UNCHANGED=-1,42
TOO_LARGE=0 TOO_LARGE_UNCHANGED=10000,43
NULL=0
EMPTY=0
TOO_MANY=0
MAX_BATCH_RESULT=1 MAX_BATCH_FIRST=1 MAX_BATCH_LAST=16
```

合法 0..9999 最多 4 趟，`power` 最终 10000，不发生数位因子溢出；非法大整数在入口被拒绝，不会进入 `power *= 10`。桶内 FIFO 顺序未改，`(45,1)` 仍在 `(45,2)` 前。

### 3.8 replacement 固定容量与失败传播

C 旧 `ReplacementSelection` 无入口校验：`n > 20` 越界写 `current[MAX_RECORDS]`；`capacity > 6` 越界写 `Workspace.items[6]/state[6]`。动态复现 capacity 7 + n 9 时只输出 7 条记录并丢 2 条；n 21 虽输出 21 条但已栈越界。现入口要求 `input/runs != NULL`、`1 <= n <= 20`、`2 <= capacity <= 6`，否则返回 -1；`CloseRun` 改为 `int` 并校验 `currentLength 0..20`、`runCount 0..19`，失败返回 0，调用方返回 -1，不截断、不忽略。

C++ 旧 `workspace(capacity)` 对负容量抛 `length_error`，对 0/1/7 未拒绝；字符串字面量异常 `throw "..."` 未被 `main` 捕获。现在入口抛 `invalid_argument`（记录数 1..20、容量 2..6），不变量抛 `runtime_error`，`main` 用 `try/catch(std::exception &)` 打印 `replacement selection failed: ...` 并返回 1。

Python 原本已校验 1..20、2..6；空槽 `next(...)` 可能抛 `StopIteration`。当前契约下每次输出恰好留下一个空槽，静态不可达；仍改为 `next(..., None)` 加明确 `ValueError("remaining input without an empty workspace slot")`，正常路径不变。`capacity` 增加 bool/非 int 拒绝。

回归输出：

```text
EMPTY=-1
CAPACITY_ONE=-1
CAPACITY_SEVEN=-1
TOO_MANY=-1
NULL_INPUT=-1
NULL_RUNS=-1
VALID_RUNS=2 VALID_SORTED=1 VALID_COVER=1
MAX_BATCH_RUNS=10 MAX_BATCH_SORTED=1 MAX_BATCH_COVER=1
runA length=4: 3 7 8 9
runB length=5: 1 2 4 5 6
```

C++ 对应 `invalid_argument:replacement selection needs 1..20 records`、`invalid_argument:workspace capacity must be 2..6`。`EmptySlot` 返回 -1 后第 152 行已有 `if (empty < 0) return -1`，没有作为有效下标，属静态误报。

## 4. 合法差异与保留限制

| 项 | 状态 | 理由 |
|---|---|---|
| free-list C++/Python 无 `MAX_BLOCKS` | 合法 | 使用动态容器，不存在固定描述符数组越界；C 保留 24 描述符教学表 |
| KMP 空模式三语言返回不同 | 合法 | C 计数、C++ 起点列表、Python 异常三种 API 设计；均明确表达结果 |
| articulation C 矩阵 / Python 邻接表 | 合法 | `O(V²)` 与 `O(V+E)` 是两种存储方式，未强行统一 |
| articulation 固定 8 顶点 | 保留教学限制 | C/C++ 参考实现固定 `VERTEX_COUNT=8`；UI 动态课最多 10 顶点是独立输入上限，不能宣称一致 |
| C++ `hasGraphShape` | 保留边界 | 只校验 8×8 形状，不检查对称性或元素仅 0/1；正常契约通过 `addEdge` 建图，手改矩阵属于调用方越界 |
| C KMP `-1` | 保留语义 | 同时表示 `NULL` 参数与分配失败；当前教学契约只写“非法参数或分配失败”，未进一步细分 |
| Python replacement 空槽守卫 | 防御性保留 | 合法 2..6/1..20 下静态不可达，仍保留明确 `ValueError`，不静默 `StopIteration` |
| C `MAX_BLOCKS=24` | 保留容量限制 | 不提升到 128；表满时拒绝分裂并保持块表完整，属于教学演示容量限制 |
| ASan / UBSan | 不可用 | MinGW GCC 15.2.0 缺 `-lasan` / `-lubsan`；未宣称 sanitizer 通过，改用失败注入、边界检查与不变量验证 |

## 5. 测试与验证

| 检查 | 结果 |
|---|---|
| SAFETY-02 专项 | 1 文件 / 37 tests 通过 |
| 注释、本地化相关 | 5 文件 / 66 tests 通过 |
| 全量 Vitest | 151 文件 / 1379 tests 通过 |
| `npm run typecheck` | 退出 0 |
| `npm run build` | 退出 0，32.41s；仅有既有 chunk 体积 warning |
| C/C++ 参考源码编译运行 | 10 份 demo 均以 `-std=c11` / `-std=c++17`、`-Wall -Wextra -Wpedantic -Werror` 编译并运行通过 |
| C/C++ harness | 10 份 harness 由 `safety-02.test.ts` 以 `-Werror` 编译通过；5 份 Python harness 退出 0 |
| 正常路径 | 五个算法三语言 demo 输出与修复前逐行一致（`free-list`、`KMP`、`articulation`、`radix`、`replacement`） |
| 边界路径 | 容量 8/128 上下界、空输入、负数、重复 ID、ID 截断、重复调用、星形图、错误形状、n20/cap2、稳定顺序、合并不变量 |
| 失败注入 | KMP `malloc` 失败；replacement 非法容量/数量；未使用 sanitiser |

## 6. 教学说明同步

- `annotations.ts` 仅同步两条已经失真的说明：free-list C `MAX_BLOCKS` 改为“表满时 `insert_block` 返回 0，不移动记录”；KMP C 分配失败改为“返回 -1，与零匹配区分”。
- `TEXTBOOK_COVERAGE.md` 补充三语言空模式差异、free-list 入口校验与 24 描述符限制、articulation 固定 8 顶点与每次重置、radix 三语言入口校验、replacement 1..20 / 2..6 固定容量与错误类型。
- 未做新一轮注释美化，未改动正常 Python Trace 算法语义。

## 7. 提交与边界

- 按算法拆分功能提交：free-list、KMP、articulation、radix、replacement；测试、双语说明与文档放在紧密相关的收尾提交。
- 所有提交直接进入 `main` 并推送 Gitee；未创建分支、worktree、Tag，未部署，未改版本号。
- 最终 `HEAD` 与提交哈希以 `git log -1` 为准；`图论/` 始终保持未跟踪保护状态。
- 本轮到此停止；不自动进入 CODE-DOC-04，也不扩大为其他算法重构。
