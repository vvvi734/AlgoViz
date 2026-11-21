# F2 交付报告：散列表与冲突处理可视化

## 1. 基线与范围

- 分支：`feat/f2-hashing`，从 F1 最终提交 `eb06700` 创建，未从落后的 `main` 开发，也未合并回 `main`。
- 版本：`0.25.0-f2`。
- 实现提交：`95e0c69`。
- 范围：只实现链地址法（Separate Chaining）与线性探测（Linear Probing），两种方法均覆盖插入、查找、删除。未实现二次探测、双重散列、动态扩容/重新散列、复杂自定义散列函数；未调整页面布局；未新增 AI/MCP；未做图论定理；F2 完成后停止。

## 2. 实现内容

### 2.1 共同教学基础

- 官方表长固定为 `m=7`，哈希函数 `h(key)=key % 7`，冲突键 `1、8、15` 全部映射到桶/槽 1。
- 两种算法都使用真实 Python 从基础结构实现，不用内置 `dict` 代替教学算法；`structure` 快照由 Python 发射，JS 只读取快照，不模拟冲突过程。
- 可视化明确展示当前键、哈希值、表长、桶/槽索引、冲突、解决过程、操作结果、真实元素数与装载因子。
- 直接定址法、散列函数、装载因子与冲突不可避免性放在顶部导学中，不单独创建动画入口。

### 2.2 链地址法

- 真实 `Node` 类、真实 `next` 引用、稳定节点 ID `n1/n2/n3/n4`；官方桶 1 链为 `15 → 8 → 1`（`n3 → n2 → n1`）。
- 插入采用头插：新节点 `next` 指向原桶头，再更新桶头指针；逐节点比较键后才决定插入或命中。
- 删除覆盖桶内头节点、中间节点、尾节点，真实记录前一节点、被删节点与重连结果；`removed` 区显示被摘除的真实对象，不用动画节点冒充 Python 对象。
- 重复键策略：唯一键；重复插入返回 `duplicate`，不覆盖旧值、不增加元素数。课程、Python、Schema、测试与教材描述一致。
- 装载因子按真实元素数 / 表长计算，允许链地址法 `n>m` 与装载因子大于 1。

### 2.3 线性探测

- 真实 `Entry` 数组 + `TOMBSTONE = object()`，三态槽：`EMPTY` 从未使用、`OCCUPIED` 当前存放元素、`DELETED` 墓碑。
- 标准探测序列 `(h(key)+i) % m`，画布显示连续槽位、PTR、当前探测槽与完整探测路径。
- 删除写 `DELETED`，不写回 `EMPTY`；查找遇到 `DELETED` 必须继续，只有 `EMPTY` 才能证明键不存在。
- 插入扫描完整探测链查重，并记录第一个 `DELETED`；优先复用墓碑，否则写入 `EMPTY`，不会无限循环。
- 官方覆盖回绕（插入 24 路径 `3→4→5→6→0`）、表满（插入 31 路径 `3→4→5→6→0→1→2` 后返回 `full`）、删除后继续查找 15（经过 slot2 的 DELETED）、墓碑复用（22→slot2、31→slot3、38→slot0）。
- 最终槽位：`0=38, 1=1, 2=22, 3=31, 4=3, 5=10, 6=17`；最终 OCCUPIED 键集合 `[1,3,10,17,22,31,38]`，装载因子 `1.000`。

### 2.4 Schema、视觉与课程

- 新增 `HashSnapshot` 判别联合与 17 个哈希操作；链地址法校验桶归属、`headId`、`nextId` 无环且完全可达、三种删除真实重连；线性探测校验槽状态、键/ID 唯一、探测路径从 hashIndex 起按 `+1 % m` 连续、当前槽在路径上、表满路径长度 `m`。
- `hashModel.ts` 从真实结构推导 only/head/middle/tail、三态、probe/current/reused；并要求 `state.type === 'array'` 且 `state.values` 与真实结构一致。
- `HashVisual.tsx` 复用既有 Trace 播放器、Timeline 与 `VisualStage` 接入；链地址法画哈希桶 + 真实 next 链，线性探测画连续槽 + 探测路径 + 墓碑，没有退化成普通数组高亮。
- 两门课程均为 5 步中英双语：
  - `hash-chaining-basics`：`init / hash / collision / resolve / result`。
  - `hash-probing-basics`：`init / hash / probe / resolve / result`。
- 顶部导学覆盖散列表、哈希函数、冲突不可避免、两种方法思想、装载因子、优缺点、平均/期望 `O(1)` 的条件、最坏 `O(n)`、聚集、DELETED 必要性、EMPTY 与 DELETED 的区别、回绕、表满、插入/查找/删除复杂度、常见错误与记忆重点。未笼统声称哈希查找总是 `O(1)`。
- 右侧逐步解释只讲当前键、当前槽/节点、冲突与本步结果；已修正线性探测插入/命中误用链地址法文案的问题，并加 UI/E2E 断言防止回归。

### 2.5 注册与兼容

- `hash-chain`、`hash-probe` 加入 legacy 目录，`group:'search'`，保留既有 `linear`、`binary`。
- 第 8 章「查找」的既有 `hash-search` 专题从 `planned` 升级为真实课程，未新增章节、未改章节顺序，未创建重复算法入口。
- 保留官方知识包、用户本地课程与旧存储键；`fib` 仍是无内置课程的目录安全回退载体。
- 当前口径：31 个算法入口 / 30 门课程 / 31 个真实 Python。
- `useLabController` 的默认 Python 列表已加入两种哈希算法，避免选择后只显示 JS 占位。

## 3. 正确性验证

| 验证 | 结果 |
| --- | --- |
| F2 专项单测 | 24/24 通过：`hash.test.ts` 10 项、`hashVisual.test.tsx` 7 项、`hashLessons.test.ts` 7 项 |
| 独立 CPython 参考 | `scripts/verify_hash_python.py`：752/752 帧、19 组输入全部通过；逐命令比较终端结果、事件、桶/槽状态、最终键集合与装载因子 |
| 官方 fixtures | `hash-default-frames.json` 242 帧（链 60 + 探测 182），`hash-edge-frames.json` 510 帧，全部通过 Schema |
| 边界覆盖 | 空表、单元素、负整数键、表长 2、表长 17、长链、重复键、删除头/中/尾、墓碑继续查找、墓碑复用、回绕、表满、查找不存在键 |
| 真实 Pyodide E2E | `e2e/f2.spec.ts` 2/2：链 60 帧、探测 182 帧；真实 Edge + 本地 Pyodide |
| 全量单测 | 103 个文件、847 tests 通过 |
| 全量 E2E | 140/140 通过（含 F1、S1/S2、树/图/排序/查找全部回归） |
| 构建 | `npm run build` 通过；`dist/assets/index-DVU8IkM-.js` 1,785.03 kB（gzip 504.30 kB） |

E2E 覆盖：桶 1 冲突链、重复键、删除头/中/尾并重连、最终只剩 22；线性探测三态槽、墓碑查找、回绕、表满、墓碑复用、最终键集合；前进/回退/跳帧与解释一致；390px 无横向溢出。

## 4. 真实截图

均为 1440×1000 Light 全页截图，位于 `docs/f2/`：

| 文件 | 画面 |
| --- | --- |
| `chain-collision-1440-light.png` | 链地址法 frame 13/60：桶 1 链 `15→8→1`，当前节点 `n3`，哈希公式、冲突、count 3/7、load 0.429 |
| `chain-delete-middle-1440-light.png` | frame 34/60：删除中间节点 `n2`，桶 1 重连为 `15→1`，removed 区显示 `n2` |
| `chain-delete-tail-1440-light.png` | frame 44/60：删除尾节点 `n1`，桶 1 只剩 15，removed 区显示尾节点 `n1` |
| `probe-collision-1440-light.png` | frame 16/182：插入 15，槽 1/2/3 OCCUPIED，探测路径 1→2→3，操作标题“线性探测：写入槽位” |
| `probe-tombstone-1440-light.png` | frame 42/182：查找 15，slot2 DELETED、slot3 OCCUPIED(15)，路径 1→2→3，解释说明经过 DELETED 未停止 |
| `probe-tablefull-1440-light.png` | frame 107/182：表满，7 槽 OCCUPIED，路径 `3→4→5→6→0→1→2`，结果 full |

## 5. 已知限制

- 只支持固定表长 `m=7`、`h(key)=key%7` 的官方示例与内置输入；不支持动态扩容/重新散列、二次探测、双重散列、复杂自定义散列函数。
- 平均/期望 `O(1)` 依赖散列分布较均匀且装载因子受控；最坏情况可能退化为 `O(n)`，线性探测还需说明聚集现象。
- 链地址法允许 `n>m`；线性探测 OCCUPIED 槽数不超过表长。DELETED 不计入元素数。
- 重复键策略为拒绝插入并返回 `duplicate`，不覆盖旧值、不改变元素数。
- 真实 Pyodide E2E 只执行官方 Python 源码与内置输入；用户改写代码后的完整自动可视化不在本批次范围。
- 6 张证据截图均为 1440 Light；390 仅做无横向溢出断言，未额外保存移动端截图。

## 6. Git

- 基线：`eb06700`（`docs(f1): record delivery gates and evidence`）。
- F2 实现提交：`95e0c69`（`feat(f2): add real Python chaining and linear probing visualizations`）。
- 报告、覆盖清单、README 与 6 张截图随后单独提交，分支顶端提交哈希见最终交付说明。
- 分支只推送 `feat/f2-hashing`，不修改 `main`。
