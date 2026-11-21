# L1A 交付报告：双向链表与循环单链表

## 范围与基线

- 分支：`feat/l1a-linked-lists`，从 F2 最终记录 `27f7354` 创建，未从落后的 `main` 开发，也未修改 `main`。
- 版本：`0.26.0-l1a`（`package.json` / `package-lock.json`，UTF-8 无 BOM）。
- 新增入口：`doubly`、`circular`；新增课程：`doubly-linked-list-pointers`（11 步）、`circular-linked-list-cycle`（10 步）。
- 只实现双向链表与循环单链表；未开发顺序表、循环双向链表、图论定理、AI/MCP，未调整页面布局、导学/教材目录整体结构，未扩展任意用户 Python 代码的自动可视化。L1A 完成后停止。

## 实现内容

### 快照与纯模型

- `src/domain/trace/schema.ts` 新增 `doubly-linked-list`、`circular-linked-list` 两个独立快照分支，并加入 `structureSchema` 联合；旧 `linkedListSnapshotSchema` 未放宽，仍拒绝任何环。
- 新快照包含 `operation`、`phase: 'intermediate' | 'complete'`、`headId`、`tailId`、稳定节点 ID、真实 `prevId/nextId`、`change`、`targetId/searchValue/found`。
- 双向节点 `{id,value,prevId,nextId}`；循环节点 `{id,value,nextId}`；`change={nodeId,field,beforeId,afterId}`。循环分支明确拒绝 `set-prev` 和 `field:'prev'`。
- `complete` 帧强制结构不变量；`intermediate` 只校验引用合法。空表 `head/tail` 同时为空的一致性只在 `complete` 强制，避免真实“先写 head、再写 tail”的中间帧被误拒。
- `src/domain/visualization/advancedLinkedListModel.ts` 沿真实 `nextId` 建链；循环以回到 `head` 终止。边只按真实 `nextId/prevId` 生成：中间帧 `n2.prev=n4` 且 `n4` 不在链上时，不画虚假的 `n2→n1` 虚线；循环只有真实尾节点 `next=head` 时才生成回环边。

### 真实 Python

- `src/domain/algorithms/advancedLinkedListExamples.ts` 新增 `DOUBLY_PYTHON`、`CIRCULAR_PYTHON` 与默认输入。
- 双向真实 `DNode(node_id, value, prev, next)`，循环真实 `CNode(node_id, value, next)` 维护 `head/tail`；节点 ID `n1…` 来自 Python 对象创建顺序，不在删除、移动或重新布局时重命名。
- 官方预设覆盖空表、单节点、头/尾/中间插入、正反向或整圈遍历、命中/未命中、头/中/尾删除、删到空、重建。双向默认 89 帧，循环默认 80 帧。
- 循环遍历终止条件为 `current is head`，不是 `current.next is None`；查找未命中在一整圈后 `break`。
- 每条 `change` 记录真实赋值前后的 ID，没有从最终数组重建结构。

### 画布与课程

- 新建 `src/features/lab/AdvancedLinkedListVisual.tsx`，复用既有链表节点外壳、舞台、Trace、Timeline、播放器与课程面板；`VisualStage.tsx` 增加两个 kind 分支。没有第二套播放器。
- 双向节点卡片显示 `prev ←` 与 `next →` 两行真实目标；next 实线、prev 虚线。循环回环使用虚线曲线与独立标签，不只靠颜色区分。
- 有 `HEAD`、`TAIL`、单节点 `HEAD · TAIL`；空表 `HEAD → NULL / TAIL → NULL`；单节点循环有自环；脱离节点进入下方 detached 区并保留稳定 ID 与 prev/next。
- 最终视觉收尾移除了节点间 28 px 间距内的冗余边缘文字，并移除 head `prev → NULL` 左侧短线和 `NULL` 文本（左缘裁切）；头部 `prev ← NULL` 仍由节点卡片明确展示，尾部 `next → NULL` 线保留。
- `src/domain/lessons/frameInsight.ts` 新增 `advancedLinkedInsight` 并接入两个 kind，右侧逐步讲解明确指出当前修改哪个节点的哪个指针。
- `doublyLinkedList.ts` / `circularLinkedList.ts` 提供中英课程；顶部导学覆盖结构定义、与普通单链表的区别、核心操作、适用场景、复杂度及前提、易错指针关系、记忆重点。双向明确“持有目标节点引用时局部插入/删除 O(1)，按值查找仍 O(n)”；循环明确“维护 head/tail 时头插/尾插 O(1)，删尾仍需 O(n) 找前驱”，没有笼统宣称所有操作 O(1)。
- `registry.ts` 注册两门课程；教材第 3 章原有 `circular-linked-list`、`doubly-linked-list` 两个 planned 专题升级为真实入口，未新增章节、未改顺序。

## 正确性验证

| 验证 | 结果 |
| --- | --- |
| 专项单测 | ✅ `advancedLinkedList.test.ts` 14/14 通过：新旧 Schema 隔离、稳定 ID、正反向遍历、头/中/尾插入删除、循环 `tail.next=head`、单节点自环、删最后节点为空、整圈遍历、未命中、模型边类型、中间帧不画真实指针不存在的边、回退与课程帧映射 |
| 独立 CPython 校验 | ✅ `python scripts/verify_l1a_python.py` 18 组 / 516 帧全部通过，输出 `ALL L1A INDEPENDENT CHECKS PASS`；逐帧检查完成帧不变量、`change.beforeId/afterId` 与前后帧一致、正反遍历互逆、循环恰好一圈、空表/单节点/删最后节点、未命中不无限循环、最终 ID/指针/head/tail |
| 真实帧 fixtures | ✅ 双向默认 89 帧、循环默认 80 帧、双向边界 174 帧、循环边界 171 帧，共 514 帧全部通过 Zod `structureSchema` 与专用 Schema |
| 专项 E2E | ✅ `npx playwright test e2e/l1a.spec.ts` 3/3 通过，真实 Edge + 本地 Pyodide 0.27.7，约 15.7 s；覆盖空表/单节点、5 节点双指针、中间插入中间态、中间删除重连、正反向、整圈 5 帧、命中/未命中、头/尾/中删除、删到空、重建、回退跳帧、中英 Dark/Light、1440/1024/390 无页面横向溢出与 390 画布内滚动 |
| 类型检查 | ✅ `npm run typecheck` 通过 |
| 构建 | ✅ `npm run build` 通过，版本 `0.26.0-l1a`，1477 modules；`index-Dsx06dbZ.js` 1,869.83 kB（gzip 523.61 kB）、`monaco-setup-DCiCr8Np.js` 4,122.24 kB（gzip 1,066.59 kB）、`index-Zg0Bjj0l.css` 208.90 kB（gzip 34.01 kB）、`monaco-setup-CX3ij07K.css` 186.75 kB（gzip 27.79 kB） |
| 全量单测 | ✅ 104 个文件、865 tests 全部通过 |
| 全量 E2E | ✅ 143/143 通过（F1 138 条基线 + F2 2 条 + L1A 3 条），真实 Edge + 本地 Pyodide，约 9.9 分钟 |
| 旧功能回归 | ✅ 单链表、BST、AVL、哈希链地址法/线性探测及既有布局/目录/导学 E2E 全部通过；旧单链表 Schema 仍拒绝环 |

## 截图

均在真实 Edge、1440×900、Light 主题、真实 Pyodide 下生成：

- `docs/l1a/doubly-empty-1440-light.png`：空双向链表，`HEAD/TAIL → NULL`。
- `docs/l1a/doubly-five-1440-light.png`：双向 5 节点，frame 23/89，`[3,5,6,7,8]`，prev/next 双指针。
- `docs/l1a/doubly-delete-middle-1440-light.png`：双向删除中间节点中间帧，frame 46/89，`n4` 已脱离、`n2.prev=n4` 仍保留。
- `docs/l1a/circular-single-1440-light.png`：循环单节点自环，frame 5/80，`HEAD · TAIL`。
- `docs/l1a/circular-five-1440-light.png`：循环 5 节点，frame 23/80，`n5.next=n3` 回环。
- `docs/l1a/circular-empty-1440-light.png`：循环删空后，frame 63/80，detached 区显示 `n1…n5`。

## 已知边界

- L1A 只覆盖双向链表与循环单链表；顺序表、循环双向链表、静态链表和其他算法不在本批次范围。
- `intermediate` 帧允许“head 已更新、tail 尚未更新”“新节点已创建但尚未接线”“被删节点仍持有旧 prev/next”等真实瞬态；只有 `complete` 帧强制不变量，截图和讲解必须区分中间帧与完成帧。
- 循环单链表有 head/tail 引用时头插/尾插可为 O(1)，但删尾仍为 O(n) 找前驱；课程没有把整条链的所有操作都写成 O(1)。
- 6 张证据截图均为 1440 Light；中英与 Dark 由 E2E 断言覆盖，未额外保存 Dark 截图。
- 真实 Pyodide E2E 只执行官方 Python 源码与内置输入；任意用户 Python 链表的自动识别与可视化不在本批次范围。
- 390 px 下画布内部横向滚动，页面本身无横向溢出。

## Git

- 创建基线：`27f7354b8f0329ab1564a21c4dcd7ad903e21772`（F2 报告/覆盖/截图提交）。
- 实现提交：`fc30f94`（`feat(l1a): add real Python doubly and circular linked-list visualizations`）。
- 本报告、README 与覆盖清单在同一交付分支上单独提交；分支 `feat/l1a-linked-lists` 推送到 `https://gitee.com/vvvi734/algolens.git`，`main` 未修改。
