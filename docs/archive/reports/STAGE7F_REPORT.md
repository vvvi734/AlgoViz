# Stage 7F 报告：Dijkstra 带权最短路径可视化

- **版本**：`0.10.0-phase7f`
- **分支**：`stage7f-dijkstra`（从 Stage 7E 提交 `6512118ad006715b549a6043792d838edd32ce22` 创建）
- **基线远端**：`https://gitee.com/vvvi734/algolens.git`
- **范围**：Dijkstra + 带权图可视化；本阶段不开发 Floyd / Prim / Bellman-Ford / MST / 拓扑排序。
- **实现提交**：`de13dda`（`feat(stage7f): add real heapq Dijkstra weighted-graph lab`）。
- **交付状态**：功能、真实 Python、双语课程、单测、真实 Pyodide E2E、62 张截图、全量门禁完成。分支独立，未合并 `main`。

## 1. 验收对照

| 验收要求 | 结果 | 证据 |
| --- | --- | --- |
| 真实 Python Dijkstra，优先 `heapq` | ✅ | `dijkstraExamples.ts` 使用真实 `heapq.heappush/heappop`；Pyodide 执行，不是前端手写模拟 |
| 带权图节点、边、边权 | ✅ | 7 节点 / 7 边 / 7 个边权标签；E2E 逐条核对 `A-B:2 … F-G:3` |
| 起点与目标点 | ✅ | `startNodeId/targetNodeId` 同帧快照；图上 start ring 与 target ring/tag |
| 当前节点、当前检查边 | ✅ | `currentNodeId/currentEdgeId/neighborNodeId`；E2E 校验 e1/e6 |
| 距离表与当前最短距离 | ✅ | 7 行 `dijkstra-distance-row`；节点显示 `d=∞ / d=0 / d=4`；时间为真实帧值 |
| 松弛前后变化 | ✅ | `relax` 帧带 `oldDistance/newDistance/oldPreviousId/newPreviousId`；F `6→4`、previous `C→E` |
| previous 更新 | ✅ | 距离表 `data-previous-id`；`relax` 要求 `newPreviousId === current`，否则 Schema 拒绝 |
| settled 节点 | ✅ | `visitedIds === visitOrder`；E2E 在 done 帧 7 个 settled |
| 最终路径与总权重 | ✅ | A→B→E→F→G，`pathDistance=7`；Schema 逐边 + previous + 成本三重校验 |
| 优先队列候选与距离 | ✅ | 独立 `PriorityQueuePanel`；`(distance,node)`、加入/弹出/过期；不用 QueueVisual/StackVisual 冒充 |
| 所有面板同一 Trace Event | ✅ | 图、距离表、PQ、Monaco 行、变量、课程 stepId 均从同一个 `currentEvent.structure` / `lessonStepId` 派生 |
| 回退、任意跳帧、重跑 | ✅ | 45→27→21→3 三面板同步恢复；Run 回到 1/46；无第二播放器 |
| 非负边权与负权拒绝 | ✅ | Python 在产生帧前抛出 `non-negative edge weights`；UI 显示错误并清空旧图 |
| 不可达节点 | ✅ | Python `float('inf')` 在快照边界转 `null`；done 帧空路径、无路径权重；E2E 非连通 11 帧 |
| 重复候选 / 过期堆项 | ✅ | 默认图 1 次 stale；旧 `(6,F)` 在 F 已 settle 后移除；E2E 校验 `data-stale=true` |
| 距离相同 | ✅ | 相同距离输入 27 帧；B/C 同为 1，各自 previous=A；堆序由 `(distance,entrySeq)` 稳定决定 |
| 自定义起点/目标 | ✅ | 输入 `{start,target,nodes,edges,directed}`；默认 A→G，可改任意合法节点 |
| 起点 = 目标 | ✅ | 11 帧，路径 `[A]`、距离 0；单节点 5 帧 |
| 有向 / 无向图 | ✅ | `directed` 控制邻接表方向与箭头；有向图 fixture 16 帧 |
| 复用现有 Graph 架构 | ✅ | 扩展同一 `GraphVisualModel` / `GraphVisual` / `Timeline` / `Monaco` / `LessonPanel` / Worker；新增 `weighted-graph` 同级 Schema |
| 不破坏 BFS/DFS | ✅ | 原 `graphSnapshotSchema` 与 7E 测试不变；全量 50 条 E2E 全通过，含 7E 6 条功能 + 视觉 |
| 双语课程 | ✅ | 9 步中英课程；9 个 stepId 均与真实 Trace 一致 |
| 单测 / 真实 E2E / 截图 | ✅ | 542 单测；50 条 E2E；62 张 PNG |
| 覆盖清单 | ✅ | `docs/COVERAGE.md`：15 算法 / 9 课程 / 6 未覆盖 |
| README / ARCHITECTURE / 报告 | ✅ | 版本、计数、Schema、Dijkstra 章节、测试矩阵、路线图已更新 |
| 提交 / 推送 | ✅ | `stage7f-dijkstra` 独立分支；不合并 `main`；另一 Agent 的 `feat/sidebar` worktree 未被写入 |

## 2. 架构决策

### 2.1 新增同级 Schema，而不是污染 BFS/DFS

`src/domain/trace/schema.ts` 新增：

- `weightedGraphSnapshotSchema`：`kind:'weighted-graph'`、`algorithm:'dijkstra'`。
- `DIJKSTRA_OPERATIONS`：`init / push / pop / stale / settle / inspect-edge / relax / skip / done`。
- `graphNodeSchema` 复用；边改为 `{id,fromId,toId,weight}`。
- 距离行 `{nodeId,distance}`（`null` 表示不可达），前驱行 `{nodeId,previousId}`。
- 堆项 `{id,nodeId,distance,stale}`；`frontierAdded/frontierRemoved` 均带完整堆项。
- 松弛记录 `{nodeId,oldDistance,newDistance,oldPreviousId,newPreviousId}`。
- 最终路径 `pathNodeIds` 与 `pathDistance`。
- `GRAPH_LIMITS.MAX_PRIORITY_QUEUE = 64`；节点 20、边 40 继续复用。

原有 `graphSnapshotSchema`、`GraphSnapshot`、BFS/DFS 测试和渲染分支未改。加权图有独立的模型入口 `buildWeightedGraphVisualModel`，但复用 `graphLayout.ts` 的确定性坐标，避免出现第二套图布局。

### 2.2 不可达距离的 JSON 表示

Python 内部用 `float('inf')` 做数学比较，但快照边界调用 `safe_distance()`：

```python
def safe_distance(value):
    return None if value == math.inf else value
```

因此 Trace JSON 中不存在 `Infinity/NaN`；Schema 只接受有限非负数或 `null`。`null` 在模型层映射为未发现/不可达，在 UI 显示 `∞`，done 帧空路径。这个转换只发生在边界，不改变算法内部的松弛语义。

### 2.3 协议不变量：让“最终路径”不能伪造

Schema 不是只校验类型，还校验教学语义：

- `visitedIds === visitOrder`，settle 必须追加当前节点。
- `relax` 必须严格降低距离；`oldDistance === null` 时旧 previous 必须为 null。
- `skip` 不得隐藏 `currentDistance + weight < neighborDistance` 的严格改进。
- fresh 堆项距离必须等于当前距离；settled 后仍留在堆中的项必须 stale。
- 每个有限距离节点的 previous 链必须无环回到 start；不可达节点 previous 必须 null。
- start 一旦 discovered，距离必须为 0。
- done 路径必须从 start 到 target；相邻节点必须有真实边；`previous[to] === from`；`pathDistance === target distance`。

这比“渲染时拼路径”更强：即使未来有包或导入器直接构造帧，错误路径也会被拒绝。

## 3. 真实 Python 与边界

`src/domain/algorithms/dijkstraExamples.ts` 的输入契约：

```json
{
  "start": "A",
  "target": "G",
  "directed": false,
  "nodes": ["A", "B", "C", "D", "E", "F", "G"],
  "edges": [["A", "B", 2], ["A", "C", 2], ["B", "D", 4],
            ["B", "E", 1], ["C", "F", 4], ["E", "F", 1], ["F", "G", 3]]
}
```

默认真实结果：

- **46 帧**。
- settle：`A → B → C → E → F → D → G`。
- 最终路径：`A → B → E → F → G`，总权重 **7**。
- **7 次 relax，1 次 stale**。
- F 先从 C 得到 6，再由 E 松弛为 4，旧 `(6,F)` 堆项成为 stale；D 的距离 6 由 B-D 得到；G 的距离 7 由 F-G 得到。

关键帧（0-based）：

| 帧 | 内容 |
| ---: | --- |
| 0 | init，所有距离 null |
| 1 | push start A，距离 0 |
| 2 | pop A |
| 3 | settle A |
| 5 | relax B：∞→2，previous A |
| 7 | B/C 同为 2，堆序稳定 |
| 17 | settle C |
| 21 | relax F：∞→6，previous C |
| 27 | relax F：6→4，previous E，active edge e6 |
| 40 | stale 移除旧 `(6,F)`；堆只剩 `(7,G)` |
| 45 | done，路径 A-B-E-F-G，d=7 |

拒绝输入（都在产生任何 Trace 帧之前）：

- 负权：`Dijkstra requires non-negative edge weights; negative weight on A->B`
- NaN / Infinity：`edge weight must be finite`
- 自环：`self-loops are not supported`
- 重复边：`duplicate edge B->A`
- 非法 start/target：`start/target must name an existing node`
- 空图：允许 `init/done`，start/target 为 null。

独立参考验证：`scripts/verify_dijkstra_python.py` 不只写死期望值，还用独立 Bellman-Ford 计算逐节点最短距离，并校验最终路径边、路径总权重与参考距离一致。覆盖默认图、起点=目标、不可达、单节点、有向图、相同距离、零权边、空图，以及负权/NaN/Infinity/自环/重复边/无效输入。

## 4. 同帧渲染与回退

### 4.1 模型

`GraphVisualModel` 向后兼容扩展：

- 节点：`settled / distance / previousId / target / onPath`。
- 边：`weight / directed / onPath`。
- frontier：`distance / stale`。
- 顶层：`weighted / directed / targetNodeId / relax / pathNodeIds / pathEdgeIds / pathDistance`。

BFS/DFS 不设置这些可选字段，原渲染器行为不变。

### 4.2 三个面板

- **图画布**：边权标签、有向箭头、start/target 标记、当前边、邻居高亮、settled 样式、`d=X`、relax 条带、最终路径高亮与路径摘要。
- **距离表**：每行节点、当前距离、previous、settled；`dijkstra-distance-table` 与 `dijkstra-distance-row` 可直接断言。
- **优先队列**：独立 `PriorityQueuePanel`，显示 `(distance, node)`、新增/移除/过期；`graph-pq-entry` 带 `data-distance/data-node-id/data-stale`。展示顺序只在模型副本按 `(distance,nodeId,entryId)` 排序，原始 `frontierItems` 不被重排。

`VisualStage` 的 `weighted-graph` 分支只读取 `currentEvent.structure`。没有第二个 `currentIndex`、第二个播放器、延迟计时器或 message 解析。时间轴回退 45→27→21→3 时，图、距离表、PQ、变量、课程高亮一起恢复到该帧；再点 Run 从 1/46 重新执行。

### 4.3 CSS 修复

视觉审查发现 390px 下 `.graph-canvas-scroll { justify-content:center }` 会把超宽 SVG 同时裁掉左右两端，左侧节点无法通过滚动恢复。`stage7f.css` 改为：

```css
.graph-canvas-scroll { justify-content: flex-start; }
.graph-canvas-scroll .graph-svg { margin-inline: auto; }
```

- 390px 时左侧节点可见，右侧通过画布内部横向滚动可达。
- 补充 `dijkstra-graph-scrolled-right-390-{light,dark}.png` 作为右滚证据。
- 该规则影响所有图阶段；全量 E2E 50 条通过，Stage 7E 的 6 条功能测试与视觉测试均通过，确认 BFS/DFS 未被破坏。

## 5. 课程与算法目录

课程 `dijkstra-weighted-shortest-path`：

- `algorithmId = dijkstra`，`contentVersion = 1.0.0`。
- 9 步：`init / start / pop / stale / settle / inspect / relax / skip / done`。
- 每步 stepId 与真实 Python `lesson_step=` 一致；测试加载 46 帧 fixture 校验所有出现的 stepId 都在课程中。
- 内容覆盖：最短路径定义、带权图与边权、距离表、松弛、最小候选、优先队列、previous 恢复、负权不适用、复杂度、常见错误。
- 中英文列表等长；英文 UI 下课程标题与步骤说明已英文。

算法目录新增第 15 个 `dijkstra`。`legacy/algorithm-definitions.js` 中只有显式提示桩（“Dijkstra weighted graph: use the Python preset”），因为旧无权重 `Graph` 渲染器无法诚实地表达边权。真实演示始终走 Python preset；`structureExamples.ts` 注册 Python/input，`useLabController.ts` 的 `isGraphAlgorithm` 包含 dijkstra 并默认 Python。

覆盖快照见 `docs/COVERAGE.md`：

- 15 个算法入口。
- 9 门内置课程：bubble、factorial、stack、queue、linked、inorder、bfs、dfs、dijkstra。
- 6 个尚未覆盖：insertion、selection、quick、binary、linear、fib。

## 6. 测试与门禁

| 门禁 | 结果 |
| --- | --- |
| `npm test` | **542 / 542，65 文件全通过**，11.50s；含 MCP 20、AI Gateway 16 |
| `npm run build` | 通过，29.06s；Monaco chunk 4,122.24 kB |
| `npm run typecheck` | 通过 |
| `npm run mcp:typecheck` | 通过 |
| `npm run ai:typecheck` | 通过（首次暴露 `schema.ts` 的 `string | undefined` 索引问题，已加 guard） |
| `npm run mcp:build` | 通过，`dist/server.mjs` 312.7 kB |
| `npm run mcp:smoke` | 9 项通过、1 项因未给 `--context-dir` 跳过；`list_lessons` 返回 10 门（内置+包） |
| `python scripts/verify_dijkstra_python.py` | 通过；默认 46 帧、7 relax、1 stale、路径 d=7；所有边界通过 |
| `npm run test:e2e` | **50 / 50 通过，3.4m** |

Stage 7F 专项测试：

- Schema 16/16。
- 纯模型 7/7。
- Dijkstra 课程 5/5。
- 课程注册表 8/8（9 课程 / 15 算法 / 6 未覆盖）。
- `e2e/stage7f.spec.ts` 3/3：
  1. 默认 46 帧，图/距离表/PQ/relax/stale/路径同一 Trace；终点 G 初始 `d=∞`，最终 `d=7`，7 个 settled、5 个 on-path 节点、4 条 on-path 边。
  2. 回退 45→27→21→3 三面板同步，再 Run 回到 1/46。
  3. 真实 Pyodide 边界：非连通 11 帧、相同距离 27 帧、单节点 5 帧、负权拒绝并清空图（`graph-node=0`、`graph-visual=0`）。
- `e2e/stage7f.visual.spec.ts` 1/1：真实截图 62 张，耗时 14.9s。

## 7. 截图证据

目录：`docs/stage7f/after`

- **62 张 PNG，31,329,480 字节**；Light 31 张、Dark 31 张。
- 8 个中文状态 × 3 视口（1440/1024/390）× 2 主题 = 48 张。
- 回退帧 21：6 张。
- 390 右滚证据：2 张。
- 英文 done：6 张。
- 合计 **62 张**。

代表文件：

- `dijkstra-relax-improves-f-1440-light.png`：F `6→4`、previous `C→E`、e6 高亮、PQ 中同时出现 stale `(6,F)`。
- `dijkstra-stale-entry-1440-dark.png`：F 已 settled，旧堆项被移除，堆只剩 `(7,G)`。
- `dijkstra-done-1024-light.png`：最终路径 A→B→E→F→G 与总权重 7。
- `dijkstra-done-390-light.png`：390px 页面无横向溢出，画布内部滚动。
- `dijkstra-graph-scrolled-right-390-light.png`：右滚后右侧节点可达，证明不是裁切丢失。
- `dijkstra-en-done-1440-light.png`：英文课程 done 状态。

人工检查过：1440 light relax、1440 dark stale、1024 light done、390 light done、390 light 右滚、1440 light English done。未逐张人工检查全部 62 张；视觉测试对每个状态做了 DOM 断言，截图用于布局复核。

## 8. 过程问题与修正

1. **课程 stepId 与真实 Trace 不一致**：最初用 `push` 表示起点入堆，真实 Python 记录的是 `lesson_step="start"`。已把课程第 2 步改为 `start`，并新增测试读取 46 帧 fixture，校验所有出现的 stepId 都在课程中。
2. **负权 E2E 断言错误**：原以为错误后仍保留 1 个节点，实际 UI 清空图。已改为断言 `graph-node=0` 与 `graph-visual=0`，重跑通过。这是测试预期错误，不是产品缺陷。
3. **390px 图被两端裁切**：根因是 flex 居中 + 超宽 SVG；改为 `flex-start` + SVG `margin-inline:auto` 后，左端恢复可见，右端可滚。补了右滚截图。
4. **AI 包 typecheck 暴露索引类型错误**：`previousById.get(to)` 中 `to` 可能为 `undefined`；根 `tsc -b` 未报，`ai:typecheck` 的严格配置报 TS2345。已加 `if (from === undefined || to === undefined) continue;`，三套 typecheck 全通过。这个错误说明“根 build 通过”不能替代独立包 typecheck。
5. **全量 E2E 重新生成旧阶段截图**：运行全部 visual spec 会重写 7B/7C/7D/7E 的 PNG，产生与功能无关的像素级变化。已把 7B–7E 的已跟踪截图恢复到 HEAD，只保留 7F 新截图，避免把环境渲染差异混入提交。Stage 7E 的功能与视觉测试仍全通过。
6. **截图数量口径**：实际是 8 个中文状态（不是 9 个），加回退/右滚/英文后正好 62 张；覆盖清单已按实际代码修正。

## 9. 已知边界

- **Dijkstra 的 JS 是提示桩**：不提供无权重 JS 伪演示；这是有意的诚实降级，不是功能缺失。
- **English UI 的 Python 原始 message 仍是中英双语/中文**：课程、操作提示、图例已英文，但 Python `trace(message=...)` 未做本地化；英文截图可见混合文案，已披露。
- **有向图反向平行边重叠**：同一对节点之间的双向边使用相同坐标，当前未做偏移；教学默认图不含该情况。
- **`MAX_PRIORITY_QUEUE=64` 未压测极端图**：Schema 有上限，但未在 20 节点 / 40 边图上专门制造大量重复堆项。
- **390px 不是整图压缩**：维持可读最小宽度并在画布内滚动，符合“可读优先”的取舍。
- **`graphInputForLanguage` 的 JS 收窄**：JS 仍只保留 `{start}`，自定义 target/权重在 JS↔Python 切换时可能回退默认 rich input，未专项验证；Dijkstra 主要走 Python。
- **未跑真实 Ollama / 云端模型**：与 Stage 6A 相同，不在本阶段范围。
- **未做 axe**：无自动可访问性审计；与既有路线图一致。

## 10. Git 与协作边界

- 工作树：`D:/Desktop/algolens_github_starter/algolens-github`，分支 `stage7f-dijkstra`，基线 `6512118`。
- 另一 Agent 的独立工作树：`D:/Desktop/algolens_github_starter/algolens-ui01`，分支 `feat/sidebar`。本阶段未读写该目录、未修改侧边栏布局/导航组件，只按现有 catalog 机制注册 `dijkstra`。
- `main` 未被合并，7F 未合入 `main`。
- 实现提交：`de13dda`；本报告所在提交为后续文档提交。
- 推送目标为 `origin/stage7f-dijkstra`；不合并 `main`。

## 11. 停止点

Stage 7F 到此停止。不开发 Floyd、Prim、Bellman-Ford、MST、拓扑排序；下一阶段如需这些算法，可复用本阶段的 `weighted-graph` Schema、`GraphVisualModel`、`PriorityQueuePanel` 和真实 Python Trace 管线。
