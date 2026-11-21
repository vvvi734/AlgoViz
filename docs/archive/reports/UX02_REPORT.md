# UX-02 — 右侧 Teaching Course 精简为逐帧讲解面板

分支：`feat/ux02-lesson-panel`  
基线：UX-01B 提交 `f866bafde4ed8f6885ba0f4fda09123c1ddf8ec5`  
版本：`0.17.0-ux02`

## 1. 范围

本批只改造右侧 `Teaching Course`：默认展示与当前 Trace 帧同步的四项内容，其余课程数据和步骤跳转折叠保留。

- 不改顶部算法导学、左侧教材目录、整页双栏网格。
- 不改代码编辑器、底部变量区、Python Worker 或 Trace 协议。
- 不新增算法、播放器或独立步骤计数器。
- 完成后停止，未进入 UX-03。

## 2. 默认四项

| 区块 | 默认内容 | 数据来源 |
| --- | --- | --- |
| 当前做什么 | 当前操作标题、算法阶段 pill、帧数 `n / total` | `currentEvent` + `lessonStepId` + 单一播放器 index |
| 为什么这样做 | 一两句话的操作目的 | `frameInsight.why`；无结构时回退到当前课程步骤说明 |
| 这一步产生什么变化 | 真实 before → after 数值、箭头、路径、队列、指针或明确“正在检查/比较/准备下一步” | `frameInsight.changes`，只读强类型 `structure`、`state`、`lessonStepId`，不解析任意 message |
| 记忆重点 | 与当前帧相关的一条短提示，无合适提示时省略 | `frameInsight.memory` |

旧课程数据全部进入两个折叠入口，仍保留在 DOM 与课程数据中：

- `课程资料`：简介、核心思想、时间/空间复杂度、前置知识、常见错误、原始 message、变量。
- `步骤导航`：原 `lesson-step-<id>` 列表；跳转继续用 `countStepFrames` / `findFrameForStep`，从当前帧向后找，找不到才回绕首帧。

`currentEvent.lessonStepId` 仍是唯一同步键；没有新增 `useEffect` 计时器、帧索引或播放状态。

## 3. 帧语义适配

新增纯函数 `src/domain/lessons/frameInsight.ts`，按 `structure.kind` 读取真实字段：

- **Dijkstra**：`init/push/pop/stale/settle/inspect-edge/relax/skip/done`；显示距离、前驱、堆条目、跳过原因与最终路径/总权重。
- **Kahn**：`init/enqueue/dequeue/inspect-edge/decrement/enqueue-node/cycle/done`；显示入度 before→after、队列增减、拓扑序列与环。
- **Kosaraju**：两遍 DFS、完成顺序、转置图、当前分量与分量完成；读取 `phase/finishOrder/secondPassOrder/components/frontierItems`。
- **BST / AVL**：比较、左/右转、找到/未找到、插入/删除、后继、移植、高度、平衡因子、旋转类型与 pivot/promoted。
- **无结构/无课程**：优先比较当前帧与上一帧的 `state.values`，给出真实前后差异；否则明确写“这一帧没有记录结构化状态变化”，不编造结论。无活动课程步骤时不显示记忆提示。

## 4. 高度与视觉结果

1440×900、Light、导学收起，右栏 `lesson-panel` 实际 bounding box：

| 算法/帧 | 改造前 | 改造后 | 降幅 |
| --- | ---: | ---: | ---: |
| Dijkstra `relax`，frame 27 | 1153px | 427px | 63.0% |
| Kahn `decrement`，frame 5 | 964px | 427px | 55.7% |
| Kosaraju `second-pass`，frame 27 | 1056px | 405px | 61.6% |
| Dijkstra 390×844，frame 27 | 1372px | 416px | 69.7% |

- 当前步骤标题 20px（390 下 18px），是右栏最醒目元素。
- 四个小节只用虚线分隔，没有层层嵌套卡片；数值用 before → after 和标签表达。
- 390px 单栏可读，长路径/列表在容器内换行，页面无横向溢出。
- 中英、Light/Dark/System 均复用现有 token；英文 Dark 截图已验证。

## 5. 真实帧证据

| 算法 | 默认总帧 | 已验证帧 |
| --- | ---: | --- |
| Dijkstra | 46 | 27 relax：`6 → 4`、前驱 `C → E`；21 回退：`∞ → 6`；40 stale；45 done：`A → B → E → F → G`、总权重 7 |
| Kahn | 32 | 5：C 入度 `2 → 1`；8：D 入队；9：D 出队；31 完成，顺序 `A, B, D, C, E, F, G` |
| Kosaraju | 60 | 14 finish(E)；26 转置；27 second-pass / C1={H}；29 分量完成；59 done / 5 个分量 |
| BST | 8 | 5 compare `b5(40)`；7 done |

前进、回退、拖动与步骤跳转都由同一 `index` 驱动；切换语言或主题只重渲染，不移动帧。

## 6. 截图

改造前（由基线 `f866baf` 的独立 worktree 重新构建捕获）：

- `docs/ux02/before/dijkstra-relax-1440-light.png`
- `docs/ux02/before/kahn-decrement-1440-light.png`
- `docs/ux02/before/kosaraju-second-1440-light.png`
- `docs/ux02/before/dijkstra-relax-390-light.png`

改造后（本分支最终构建）：

- `docs/ux02/after/dijkstra-relax-1440-light.png`
- `docs/ux02/after/dijkstra-done-1440-light.png`
- `docs/ux02/after/kahn-decrement-1440-light.png`
- `docs/ux02/after/kosaraju-second-1440-light.png`
- `docs/ux02/after/bst-find-1440-light.png`
- `docs/ux02/after/bst-compare-390-light.png`
- `docs/ux02/after/dijkstra-relax-1440-dark-en.png`

## 7. 测试与门禁

- `npm run typecheck`：通过。
- 单测：86 个文件、706 项通过；其中 `frameInsight.test.ts` 9 项、`LessonPanel.test.tsx` 18 项。
- 全量 E2E：102/102 通过（97 条既有 + 5 条 UX-02）；真实 Pyodide + Edge，覆盖 Dijkstra/Kahn/Kosaraju/BST、前进/回退/跳帧、英文、Dark、390px；用时 6.5 分钟。
- Build：1434 modules；`dist/assets/index-CwtbNTcD.js` 1,320.94 kB / gzip 372.59 kB；`dist/assets/index-cn669NMh.css` 133.05 kB / gzip 23.06 kB。
- 回归：现有 25 个算法入口、19 门课程、播放器、知识包、会话与 AI 导师 E2E 全部通过。

## 8. 已知边界

- 右栏的“变化”只来自 Trace 已记录的结构化快照；没有结构化的算法会明确显示无结构化变化提示，而不是推测。
- 课程资料与步骤导航默认折叠，但数据、testid 和跳帧能力完整保留。
- 改造前截图来自独立的 `f866baf` 基线构建，不是当前工作树。
- UX-02 完成后停止；UX-03、UX-04、新算法与全站视觉重构未开始。
