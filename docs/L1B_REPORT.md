# L1B 交付报告：顺序表基本操作

## 范围与基线

- 分支：`feat/l1b-sequential-list`，从 L1A 最终记录 `4fab01b` 创建；未从落后的 `main` 开发，也未修改 `main`。
- 版本：`0.27.0-l1b`（`package.json` / `package-lock.json`）。
- 新增入口：`seqlist`；新增课程：`sequential-list-basics`（7 步）。
- 只实现固定容量顺序表及其五类基本操作；未开发动态扩容、第二套播放器、循环双向链表、图论定理、AI/MCP 或页面布局调整。L1B 完成后停止，不进入 Q1。

## 实现内容

### Schema 与纯视觉模型

- `src/domain/trace/schema.ts` 新增独立 `sequential-list` 快照分支并加入 `structureSchema` 联合；旧链表、排序、哈希 Schema 未放宽。
- 快照固定携带 `capacity`、`length`、`slots`、`operation`、`action`、`phase`、`focusIndex`、`sourceIndex`、`targetIndex`、`change`、`checked`、`removedIndex/removedValue`、`error`、`preset`。`slots.length === capacity`、槽位索引连续、`length <= capacity`。
- 插入搬移只能 `shift-right` 且目标为源 +1；删除搬移只能 `shift-left` 且目标为源 -1；`write` 必须带目标槽与 change，`save` 必须记录被删值，`clear` 必须清空尾部槽，`reject` 必须带错误且为完成帧。
- 完成帧强制 `[0,length)` 全非空、`[length,capacity)` 全空；中间帧允许临时重复/空位，但 `change.after` 必须等于该槽当前值。
- `src/domain/visualization/sequentialListModel.ts` 只用 `index < length` 判定有效元素；空闲槽即使持有真实复制值也只标 `temporary`，不会成为有效区数据。`model.ts` 已接入 union 与分派。

### 真实 Python

- `src/domain/algorithms/sequentialListExamples.ts` 使用真实 `data=[None]*capacity`，显式维护 `length`，不使用 `list.insert()` / `list.pop()`。
- 插入：`for i in range(old_length-1, index-1, -1): data[i+1]=data[i]`，逐帧发 `shift-right`，再 `data[index]=value` 发 `write`，最后 `length += 1`。
- 删除：保存 `removed` 发 `save`，`for i in range(index, length-1): data[i]=data[i+1]` 逐帧发 `shift-left`，再 `length -= 1`、`data[length]=None` 发 `clear`。
- 访问、查找、遍历与三类错误（满表插入、空表删除、非法索引）均有独立真实 Trace；成功回合都有 `done` 帧。
- 14 个官方预设：`access-middle`、`access-out`、`search-hit`、`search-miss`、`insert-middle`（默认）、`insert-head`、`insert-tail`、`delete-middle`、`delete-head`、`delete-tail`、`traverse`、`empty`、`empty-delete`、`full-insert`。

### 画布、课程与注册

- `SequentialListVisual.tsx` 使用连续槽位网格：索引、值、有效/空闲/临时角色、`length/capacity`、源/目标/当前/已删除标记、真实 `before→after`、搬移方向条、错误/命中/完成结果。8 个默认槽位在 1440 下完整显示；窄屏由画布内部横向滚动，不撑破页面。
- `SequentialListPicker.tsx` 复用现有预设切换模式；预设只改输入，点击 Run 后才执行。没有新增算法导航入口，教材第 3 章「顺序表」专题升级为真实 `seqlist` 入口。
- `sequentialList.ts` 提供中英课程与顶部导学，覆盖顺序存储、连续空间、`length`/`capacity`、O(1) 下标访问原因、插入从后往前、删除从前往后、顺序表与链表差异、越界错误与固定容量前提。记忆重点：`顺序表能随机访问；插入后移，删除前移。`
- `frameInsight.ts` 按真实 action/change 生成右栏“当前做什么 / 为什么 / 实际变化 / 记忆重点”，中间帧明确标注“真实赋值尚未完成”。

## 正确性验证

| 验证 | 结果 |
| --- | --- |
| 专项单测 | ✅ `sequentialList.test.ts` 8/8：Schema、搬移方向、change、write/save/clear、拒绝不改数据、临时槽不是有效元素、回退/跳帧、重复值/负数/单元素/初始溢出、focus 同步 |
| 独立 CPython 校验 | ✅ 官方 14 例 / 84 帧 + 边界 21 例 / 89 帧，共 173 帧；逐帧对照独立 `Reference` 模型，覆盖区域不变量、源/目标方向、最终数组与边界拒绝 |
| 真实帧 fixtures | ✅ `seqlist-official-frames.json` 84 帧、`seqlist-edge-frames.json` 89 帧，共 173 帧通过 Zod |
| 专项 E2E | ✅ `e2e/l1b.spec.ts` 3/3，真实 Edge + 本地 Pyodide 0.27.7：默认插入 8 帧、删除 9 帧、满表 3 帧、空表 2 帧；覆盖预设 pending→Run、shift-right 4→5、shift-left 2→1、回退/跳帧、390 画布内滚动 |
| 类型检查 | ✅ `npm run typecheck` 通过 |
| 构建 | ✅ `npm run build` 通过，版本 `0.27.0-l1b`，1483 modules；`index-CumYtbGl.js` 1,926.63 kB（gzip 539.81 kB）、`monaco-setup-DMZIIKab.js` 4,122.24 kB（gzip 1,066.60 kB）、`index-DlzkhwaX.css` 218.15 kB（gzip 35.45 kB） |
| 全量单测 | ✅ 105 个文件、875 tests 全部通过 |
| 全量 E2E | ✅ 146/146 通过（既有 143 条基线 + L1B 3 条），真实 Edge + 本地 Pyodide，约 9.7 分钟 |
| 旧功能回归 | ✅ 排序、查找、链表、BST/AVL、哈希、图算法、教学布局与教材目录 E2E 全部通过 |

## 截图

均在真实 Edge、1440×900、Light 主题、真实 Pyodide 下生成：

- `docs/l1b/insert-middle-1440-light.png`：索引 2 插入 25，frame 3/8，真实 `data[5]=data[4]`，槽 4→5。
- `docs/l1b/delete-middle-1440-light.png`：删除索引 1，frame 4/9，真实 `data[1]=data[2]`，槽 2→1。
- `docs/l1b/full-insert-1440-light.png`：满表插入被拒绝，frame 3/3，`capacity-full`。
- `docs/l1b/empty-delete-1440-light.png`：空表删除被拒绝，frame 2/2，`list-empty`。

## 已知边界

- 固定容量实现，不提供动态扩容、缩容或重新分配；官方容量最大 16。
- `index=length` 是合法尾插位置，但不是合法访问/删除位置。
- 中间帧的重复值、临时空位是真实赋值过程，不能解释为操作已完成。
- 真实 Pyodide E2E 只执行官方 Python 与内置输入，不扩展任意用户 Python 代码的自动可视化。
- 4 张证据截图均为 1440 Light；中英、Dark 与 390 窄屏由 E2E 断言覆盖，未额外保存对应截图。

## Git

- 基线：`4fab01b`（L1A 文档/截图最终记录）。
- 实现提交：`a3884a0`（`feat(l1b): add real Python sequential-list visualizations`）。
- 本报告、覆盖清单、README 与截图在同一独立分支的文档提交中；分支推送到 `https://gitee.com/vvvi734/algolens.git`，`main` 未修改。
