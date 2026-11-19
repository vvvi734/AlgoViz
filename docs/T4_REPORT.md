# T4 交付报告 · 哈夫曼树与哈夫曼编码

状态：**已完成**（真实 `heapq` 建树、同一棵树生成前缀编码、三区联动、双语课程、独立 Python 校验、专项单测与真实 Pyodide E2E）。

- 分支：`feat/t4-huffman`
- 基线：`f939f3e docs(t3): record final branch and push details`（T3 定稿，包含 UX-04C、T2、T3 与全部既有算法）
- 基线来源：没有从落后的 `main`（`10f9a68`）开发，也没有重置或覆盖既有分支
- 版本：`0.21.0-t4`
- 实现与文档提交：本分支 HEAD（见文末 Git）
- 按用户要求，完成 T4 后停止；未开发排序、查找或其他算法，未继续页面布局优化

## 1. 实现摘要

### 1.1 一个算法、两个连续阶段

目录只新增一个算法 id `huffman`，算法名称覆盖「哈夫曼树构建 / 哈夫曼编码」。一次真实 Python 运行先建树、再编码，共用同一份 Trace、同一套强类型快照、同一个播放器与同一门课程。

10 种操作帧：

`init → merge-select → merge-create → merge-requeue → build-done → encode-start → encode-left / encode-right → encode-leaf → done`

不是两个独立播放器，也不是按预设直接画最终树。

### 1.2 真实 `heapq` 与稳定节点身份

`src/domain/algorithms/huffmanExamples.ts` 中的 `HUFFMAN_PYTHON` 使用真实 `heapq`：

- 初始每个字符是稳定叶子 `n1…nN`，同时拥有唯一且单调递增的 `order`。
- `merge-select` 在真实 `heappop` 两次之后发出；队列只剩其余根，被弹出的两个节点仍作为森林根高亮。
- `merge-create` 创建真实父节点、真实 `left/right` 引用；父权值严格等于两个孩子之和，尚未入队。
- `merge-requeue` 在真实 `heappush` 之后发出。
- `queueIds` 读取 heapq 内部真实数组顺序，不是前端手写排序；Schema 逐帧校验最小堆性质。
- 等权时统一使用 `(weight, order)` 键，先创建者先弹出，官方示例可复现。

父子关系、队列和编码表全部来自同一帧 `HuffmanSnapshot`，不根据画布坐标反推。

### 1.3 编码与边界语义

- 约定左分支 `0`、右分支 `1`；`encode-start` 从根出发，`encode-left/right` 沿真实边追加位，`encode-leaf` 才写入码表。
- 官方最终码表：

| 字符 | 频率 | 编码 | 码长 | 加权贡献 |
| --- | ---: | --- | ---: | ---: |
| A | 5 | `1100` | 4 | 20 |
| B | 9 | `1101` | 4 | 36 |
| C | 12 | `100` | 3 | 36 |
| D | 13 | `101` | 3 | 39 |
| E | 16 | `111` | 3 | 48 |
| F | 45 | `0` | 1 | 45 |

WPL = `224`，实际编码总位数 = `224`；定长编码 `ceil(log2 6)=3` 位/字符，总计 `300` 位，节省 25.3%。

- 单字符 `single`：理论树 WPL = `0`，实际采用 1 位码 `0`，码长 1、总位数 `7×1=7`；页面同时展示三者，明确区分理论 WPL 与实际传输位数。
- 空输入：只有 `init` 与 `done(result='empty')`，不建树、不编码，metrics 全 0。
- 重复字符：Python 按首次出现顺序累加频率；边界夹具 `A5+A3→A8`、`B7`、`C9` 共 14 帧，WPL 39。
- 编码不唯一：左右子树交换或等权不同合并顺序会得到不同合法码串，但最优 WPL 相同；页面展示确定性顺序下的一条合法编码，不作为唯一答案。

### 1.4 Schema 与纯视觉模型

`src/domain/trace/schema.ts` 新增 `huffmanSnapshotSchema` 与导出类型 `HuffmanOperation / HuffmanNode / HuffmanCodeRow / HuffmanMetrics / HuffmanSnapshot`，限制：

- `MAX_SYMBOLS=16`、`MAX_NODES=33`、`MAX_WEIGHT=1_000_000_000_000`、`MAX_CODE_BITS=16`。
- 节点 id 唯一、`order` 连续 `0..n-1`。
- 每个节点双孩子或无孩子；叶子带 `symbol`，内部节点 `symbol=null`。
- 父权值等于左右孩子之和；每个孩子最多一个父；全节点从根可达且无环。
- `queueIds` 唯一、只指向森林根、满足 `(weight, order)` 最小堆序，并与当前 operation 的森林状态一致。
- `merge-select` 的 picked 是按 `(weight, order)` 前两个根；`merge-create` 父为 newest node、left/right 等于 picked。
- `encode-left/right` active 为内部节点且 `viaSide` 一致；`encode-leaf` active 为真实叶子且码表已含该叶。
- `prefix` 等于 `pathIds` 的真实边位串；码表 code 沿真实路径；单字符码必须 `0`。
- metrics 由真实树叶深度重算：`WPL=Σ(weight×depth)`；单字符 `totalBits=totalWeight`；`fixedBitsPerChar=ceil(log2 k)` 或单字符 1。
- done 时叶子与编码一一对应；空输入零 metrics、空 codes、空 queue。

`huffmanLayout.ts`：固定节点 88×58，子树水平间隔 30、根间隔 44、行间隔 46、边距 30/24；递归计算子树宽度，父节点居中于两孩子；不缩小节点以挤入一屏。

`huffmanModel.ts`：生成节点 flags（root/leaf/picked/created/active/onPath/encoded）、边 flags、`queueEntries`（真实优先级 + `heapIndex`）、`pickedEntries`、`createdEntry`、码表、路径、prefix、metrics 与布局尺寸。`model.ts` 负责分派与空态。

### 1.5 三区联动 UI

`HuffmanVisual.tsx` 与 `t4.css` 组成三区：

1. **树形画布**：SVG 固定 88×58 节点；显示节点 ID、字符、权值、编码、ROOT/叶/内部标签；边上标 0/1；树面板内部横向/纵向滚动。
2. **最小优先队列**：显示真实 heapq 原始数组顺序、真实优先级顺序、heap index、已取出、未回队新父、只剩根提示。
3. **编码结果表**：字符、频率、二进制编码、码长、加权贡献；当前叶高亮；完成阶段自动增高以完整显示官方 6 行；表头 sticky，窄屏自身横向滚动。

顶部展示阶段徽标、operation、叶数、总权值、WPL、总位数；底部展示当前路径、前缀与阶段提示。所有区域读取同一 `HuffmanSnapshot`，前进、回退、任意跳帧均同步恢复。

预设选择器 `HuffmanPicker` 复用既有 picker 样式，提供 `official`、`equal`、`single`、`empty` 四种输入；官方默认 Python。

### 1.6 课程与目录

- `src/domain/lessons/huffmanLesson.ts`：lessonId `huffman-build-and-prefix-codes`，算法 `huffman`，10 步与 Python `lesson_step` 严格对应；中英双语。
- 覆盖 WPL、最优二叉树、为什么合并最小两个（交换论证）、最小堆作用、左 0 右 1、前缀码结构性、高频短码、与定长编码对比、`O(n log n)` / `O(n)`、编码不唯一、单字符口径、7 条常见错误。
- 记忆提示「两小合一，重复建树；左零右一，走到叶子」，并注明只适用于本页二叉编码约定。
- `textbook.ts` 的 `ch6-tree/huffman` 从 planned 改为 authored，指向 `huffman`。
- `frameInsight.ts` 新增 Huffman 分支，按 operation 生成动作、真实状态变化、最小堆大小、新父、WPL/总位数等讲解。
- `legacy/algorithm-definitions.js`、`catalog.generated.ts`、`legacy-frames.json` 已同步；catalog 共 27 个入口。

### 1.7 接入范围

`schema.ts`、`huffmanExamples.ts`、`structureExamples.ts`、`huffmanLayout.ts`、`huffmanModel.ts`、`model.ts`、`HuffmanVisual.tsx`、`HuffmanPicker.tsx`、`t4.css`、`main.tsx`、`messages.ts`、`huffmanLesson.ts`、`registry.ts`、`textbook.ts`、`frameInsight.ts`、`LabView.tsx`、`useLabController.ts`、`VisualStage.tsx`。

复用了现有舞台、播放器、树布局、课程、目录与响应式基础；没有第二套播放器，没有新增 AI/MCP，没有修改顶部导学、左侧教材目录、右侧逐步讲解与底部折叠布局。

## 2. 正确性与验收

| 项 | 结果 |
| --- | --- |
| 独立 CPython 校验 | ✅ `scripts/verify_huffman_python.py` 69/69 帧：official 29、equal 19、single 5、empty 2、duplicate 14；逐帧校验两个最小根、父权值、森林根、queue 最小堆序、编码路径、前缀性、WPL 与单字符位数，并用最终码表真实编解码往返 |
| 真实帧 fixtures | ✅ `huffman-default-frames.json` 29 帧、`huffman-edge-frames.json` 40 帧，全部通过 Zod `structureSchema` 与 `huffmanSnapshotSchema` |
| 专项单测 | ✅ `huffman.test.ts` 11 项：Schema、布局、等权/单字符/空/重复、码表、回退与非法快照拒绝 |
| 课程测试 | ✅ `huffmanLesson.test.ts` 4 项：课程 Schema、10 步与真实帧对齐、内容覆盖、编码不唯一与单字符口径 |
| 目录/课程/讲解 | ✅ `catalog.test.ts` 64、`registry.test.ts` 8、`schema.test.ts` 11、`frameInsight.test.ts` 10、`textbook.test.ts` 10、`AlgorithmSidebar.test.tsx` 9 全部通过 |
| 全量单测 | ✅ 90 个文件、756 tests 全部通过 |
| 类型检查 | ✅ `npm run typecheck` 通过 |
| 生产构建 | ✅ `npm run build` 通过；`index-DH6SJzdP.js` 1,493.50 kB、`monaco-setup-CTppBAf0.js` 4,122.24 kB、`index-CssMgkvo.css` 177,775 B |
| T4 真实 Pyodide E2E | ✅ 2/2：官方 29 帧关键帧、真实弹出/新父/回队、build-done 11 节点/WPL224、F 路径 `0`、最终 6 行码表、回退同步；equal/single/empty、Dark、390 无页面横向溢出 |
| 全量 E2E | ✅ 131/131（既有 129 条基线 + 2 条 T4） |
| 入口/课程计数 | ✅ 算法 26→27、课程 20→21、真实 Python 21→22；catalog 27、legacy fixtures 27 算法，旧断言已修正并复跑通过 |

验收重点逐项：

1. 每次确实取出当前最小两个权值：CPython 逐帧检查 picked 与真实 heapq 弹出顺序，Schema 再次校验。
2. 新父权值等于两个孩子之和：Python 与 Schema 双重校验。
3. 最终树叶子与原始字符一一对应：official 6 叶、11 节点，done 码表 6 行。
4. 无环与错误引用：Schema 全节点从根可达、每孩子最多一个父；专项测试拒绝非法快照。
5. WPL 正确：独立参考实现不依赖树，累加每次合并父权值，与树深度计算结果一致。
6. 前缀码性质：逐帧验证已有码均不是新码前缀，最终码表可唯一解码。
7. 编码解码往返：independent verifier 用最终码表真实编码再解码，字符序列恢复。
8. 等权/单字符/重复/空输入：全部纳入独立 Python 与 fixtures；等权 4 个码长 2，单字符实际码 `0`，空输入零 metrics。
9. 回退同步：E2E 从 frame 28 回 frame 16、18、2、0，树节点数、队列项、picked、码表行与 WPL 全部恢复。
10. 现有算法不受影响：全量 90 文件单测与 131 条浏览器 E2E 通过。

## 3. 截图

| 文件 | 内容 |
| --- | --- |
| `docs/t4/huffman-merge-select-1440-light.png` | frame 2/29，弹出 A=5 与 B=9，队列剩 C/D/E/F，树与队列同步高亮 |
| `docs/t4/huffman-build-done-1440-light.png` | frame 17/29，森林只剩根 n11，叶 6、Σw 100、WPL 224、总位数 224 |
| `docs/t4/huffman-build-done-tree-bottom-1440-light.png` | 建树完成后树画布滚动到底部，显示 C/D/A 等底层子树与固定节点尺寸 |
| `docs/t4/huffman-encode-path-1440-light.png` | frame 19/29，根 n11 → 叶 F 路径高亮，边 0，F 编码 0、码表 1 行 |
| `docs/t4/huffman-final-table-1440-light.png` | frame 29/29，完整 6 行码表、WPL 224、定长 300、节省 25.3% |
| `docs/t4/huffman-final-table-1440-dark.png` | 同一最终帧 Dark 主题 |
| `docs/t4/huffman-final-table-390-light.png` | 390×844 单栏布局，码表改为单列六行，六行全部可见且页面无横向溢出 |
| `docs/t4/huffman-single-symbol-1440-light.png` | 单字符 Z7：WPL=0、实际总位数 7、码 0/长 1 与单字符警告 |

## 4. 已知限制

- 只保证官方 `official/equal/single/empty` 预设与重复频率边界的真实 Trace；不支持任意用户改写代码、任意字符集、多叉哈夫曼或通用频率表输入。
- 单次最多 16 个字符、33 个节点、16 位码长；超过上限不会生成教学 Trace。
- 编码不唯一；官方页展示 `(weight, order)` 确定性顺序下的一条合法编码，仍具有最优 WPL。
- 单字符理论 WPL 为 0，实际采用 1 位码 `0`；页面已分开展示 WPL、码长与总位数。
- 节点固定 88×58，不缩小以适配一屏；官方 6 叶最终树宽约 678 px、高约 474 px，桌面与手机均通过树画布内部滚动查看。码表在桌面上为三列两行、390 px 下为单列六行，六行均完整显示。
- 课程与讲解只保证内置中英文内容；不新增 AI 自动生成或任意代码自动追踪。
- 按用户要求，本批次在 T4 完成后停止，没有进入其他排序、查找或图算法，也没有继续 UI 结构优化。

## 5. Git

- 分支：`feat/t4-huffman`，从 `f939f3e` 建立
- 远端：`https://gitee.com/vvvi734/algolens.git`
- 实现、课程、测试、截图与初始报告提交：`82035b4 feat(t4): add real heapq Huffman tree and prefix coding lab`
- 文档定稿提交：`d994780 docs(t4): record implementation commit and branch details`
- 推送：2026-11-19 已推送到 `origin/feat/t4-huffman`，远端包含上述提交
