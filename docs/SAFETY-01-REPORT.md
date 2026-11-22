# SAFETY-01：B 树、B+ 树与双向链表安全整改报告

## 1. 基线与范围

| 项 | 实际值 |
|---|---|
| 起始 `HEAD` / `origin/main` | `4a0002a45175592ed859d9667628e0042887821e` |
| 分支 / 工作区 | 直接在 `main` 修改；未创建分支、worktree，未重置历史 |
| 受保护未跟踪目录 | `图论/`；未删除、移动、覆盖、暂存或提交 |
| 修改范围 | `doubly_linked_list.cpp`、`btree.c`、`bplus_tree.c` 的必要实现代码，直接相关双语注释与测试 |
| 未做 | 未重做 CODE-DOC-04 注释，未改 SVG/Trace/目录/其他算法，未创建 Tag，未部署，未改版本号 |

## 2. 三项风险核实

### 2.1 `doubly_linked_list.cpp::remove` 释放后访问：真实存在

原控制流先 `std::move(node->next)`，再执行 `node->prev->next = std::move(next)` 或 `head_ = std::move(next)`。后者会立即销毁 `node`，之后才读取 `node->prev` 更新 `tail_`。删除尾结点或唯一结点时会读取已释放内存。

动态复现：用全局 `operator delete` 在释放时把内存填充为 `0xDD`，构建 `[1,2,3]` 后删除尾结点。旧代码进程退出码 `-1073741819`（Windows access violation）；修复后同一复现退出 0。仓库内毒化 harness 还验证删除头/中间/单结点/连续删除/删除后遍历与再插入，结果为 `FAILURES=0 / OUTSTANDING=0 / ALL_OK=1`。

最小修复：释放前保存 `Node *prev` 与 `bool was_tail`；先转移 `next`；更新后继的 `prev`；先更新 `tail_`；最后才通过 `prev->next` 或 `head_` 释放 `node`。没有取消 `delete`，没有泄漏。

### 2.2 `btree.c::split` 分配失败处理：真实存在

原 `split` 为 `void`，`NewNode()` 失败直接 `return`；`InsertNonFull` 仍按“已分裂”继续。根满路径先安装 `new_root`，再调用 `split`，分裂失败后继续下降，可能进入空根/空孩子。

动态复现：构建根 `{10,20,5}`（3 键），`calloc` 从第 3 次调用起持续失败；插入 `15`。旧代码在新根分配成功、右结点分配失败后进程退出码 `-1073741819`。修复后同一注入返回 `0`，根保持 3 键，`10/20/5` 可查、`15` 不存在，`OUTSTANDING=0`。

最小修复：

- `split(parent,index,full,right)` 改为 `int`，只接收调用方预分配的 `right`，内部不分配；`right == NULL` 返回 0。
- `InsertNonFull` 改为 `int`；遇到满孩子先分配 `right`，失败直接返回 0，父/子结构未修改。
- `InsertBTree` 改为 `int`；空根、根满时的新根/右结点均先分配，任一失败释放已分配结点并返回 0；成功后才分裂并安装新根。
- 根分裂后更深层分配失败时，树可能已经长高一层，但仍是合法 B 树，已有键可查，插入返回 0；没有伪造成功、丢键或空指针下降。

### 2.3 `bplus_tree.c::split_leaf/split_internal` 失败伪成功：真实存在

原 `Split` 初值为 `{valid=1,separator=0,right=-1}`；`new_node` 失败时原样返回，调用方只看 `valid`，于是把 `separator=0,right=-1` 写入父结点。

动态复现：构建 `1..69`，设 `node_count=71`，插入 `70`。旧代码：

- `insert_key` 返回 `1`；
- `node46` 变成 4 键，`children` 含 `71`；
- 父结点 `node47` 变成 `keys=[61,0]`、`children=[42,46,-1]`；
- `contains(70)=0`，`find_leaf(70)=-1`，新叶 `71` 不可从根到达。

即失败被当作成功、无效节点编号进入树、目标记录不可达。修复后同一场景返回 `-1`，根和 `node46` 形状不变，`contains(70)=0`，`find_leaf(70)=49`。

最小修复：

- `Split.valid` 改为 `-1=分配失败`、`0=未分裂`、`1=有效分裂`。
- `split_leaf(node,right)` / `split_internal(node,right)` 只接收预分配右结点，内部不 `new_node`；失败不会发生在结构修改之后。
- 新增 `release_node`，仅在目标仍是最后分配的未使用节点时按 LIFO 归还静态池。
- 叶分裂先分配右叶再写键；内部节点在下降前为自身可能的分裂预分配 `pending`；孩子失败或未分裂时释放 `pending`。
- 根只在“根满且目标路径确实会分裂”时预分配新根；根满但目标叶子有空间时不再误报 OOM。
- `insert_key` 返回 `1=成功`、`0=重复`、`-1=分配失败`；demo 对 `-1` 打印 `allocation failed`。
- 所有失败都在任何键或链接修改之前发生；失败路径节点数、叶数量与原树一致。

## 3. 测试与不变量

新增 `src/domain/reference-code/safety-01-test/` 三个独立 harness，并由三个 Vitest 文件驱动：

| harness | 覆盖 |
|---|---|
| `doubly_harness.cpp` | 毒化 `operator delete`；空表、单结点、删头、删尾、删中间、不存在值、连续删除、删后遍历/再插入；直接检查 `head_/tail_/prev/next` 对称性 |
| `btree_harness.c` | `calloc/free` 注入、资源计数；空根、根第一次/第二次分配、孩子分裂、手工“满根+满子+满叶”第三次分配、正常插入；B 树不变量与后序释放 |
| `bplus_harness.c` | 静态池耗尽；空根、叶第一次/第二次、内部第二次、手工满根+满内部孩子失败、根满但不分裂、正常 70 键；B+ 不变量与叶链检查 |

验证的不变量：

- 双向链表：`head_/tail_` 与双向链接一致，删除后无悬挂尾指针，再次插入正常。
- B 树：节点键有序、子树范围正确、键数符合 4 阶定义、所有叶子同深度、已成功键仍可查、失败后整树可释放。
- B+ 树：内部键数 = 孩子数 - 1、内部索引键 = 右子树最小键、所有叶同深度、叶链 `next` 完整且键严格递增、全部记录可 `contains`、失败后节点数/叶数量不变。

正常路径输出：三个 demo 的 stdout 与修复前逐行一致；`safety-01-btree.test.ts`、`safety-01-bplus.test.ts`、`safety-01-doubly.test.ts` 均包含 demo 输出断言。

## 4. 验证结果

| 检查 | 结果 |
|---|---|
| SAFETY-01 专项 | 3 文件 / 17 tests 通过 |
| 注释、本地化、注册表 | 3 文件 / 24 tests 通过 |
| 全量 Vitest | 150 文件 / 1342 tests 通过 |
| `npm run typecheck` | 退出 0 |
| `npm run build` | 退出 0，29.64s；仅有既有 Zod 注释与 chunk 体积 warning |
| C/C++ 编译 | `btree.c`、`bplus_tree.c`、`doubly_linked_list.cpp` 均以 `-Wall -Wextra -Wpedantic -Werror` 编译通过 |
| 失败注入 | 双向毒化释放、B 树 5 种失败注入、B+ 6 种失败/边界场景全部通过 |
| AddressSanitizer | 不可用：MinGW GCC 15.2.0 链接报 `cannot find -lasan`；UBSan 同样缺 `-lubsan`。未宣称 ASan 通过 |
| 替代验证 | 失败注入、释放毒化、资源计数、指针不变量与整树释放检查 |

本机只有 MinGW `gcc/g++ 15.2.0`；未发现 `clang`、`cl` 或 `valgrind`。

## 5. 提交与边界

- `3ed9b3f` `fix(doubly): avoid reading freed node when removing tail`
- `2c462a6` `fix(btree): propagate split allocation failures`
- `2a4839d` `fix(bplus): report split allocation failures instead of valid right=-1`
- 本文档与审计状态更新为后续提交，最终 `HEAD` 以 `git log -1` 为准。

未解决问题 / 明确边界：

1. ASan/UBSan 在当前 MinGW 环境不可用；结论基于失败注入和指针/资源检查，不声称 sanitizer 通过。
2. `DoublyList` 的公开删除 API 是 `remove(Node *)`，不是按值删除；“删除不存在的值”由测试专用 `find_value` + `remove_value_if_present` 验证为查找失败、不做删除、链表不变，未新增生产 API。
3. B 树根分裂后更深层 OOM 可能保留“树高增加一层、结构合法、目标键未插入、返回 0”的状态；这是当前最小修复的失败语义，不伪造成功。
4. 未创建发布 Tag、未部署、未改版本号，未进入 SAFETY-02。
