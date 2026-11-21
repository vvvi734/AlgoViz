# G4 交付报告：连通分量 + Kosaraju 强连通分量

日期：2026-11-18  
分支：`feat/g4-components-scc`  
基线：从 G3 已提交版本 `787d0df` 创建；`main` 仍为 `1dcdf76`（缺少 G2/G3）。本批次没有修改 `main`，也没有在缺少 G2/G3 的旧基线上开发。

## 1. 实现内容

### 1.1 无向图连通分量

- 新增 `connected-components` 快照：无向 `nodes/edges`、`directed:false`、`startNodeId`、`currentNodeId/currentEdgeId/neighborNodeId`、`discoveredIds/visitedIds`、`frontierItems`（显式 DFS 栈）、`currentComponentId/componentCount/components`。
- 真实 Python 迭代 DFS：按节点输入顺序选择未发现根，按输入边顺序构建邻接表；`start-component` 同时完成根的发现与入栈，`discover` 与 `push` 分成两个真实帧；邻接遍历顺序确定，同一输入每次播放一致。
- 操作序列：`init / start-component / pop / visit / inspect-edge / discover / push / skip / complete-component / done`。
- 默认图 8 节点、5 条无向边（A–B、A–C、B–C、D–E、F–G，H 孤立），50 帧；最终 `C1={A,B,C}`、`C2={D,E}`、`C3={F,G}`、`C4={H}`。
- 支持单点、孤立节点、空图、完全连通图和多个分量；空图只产生 2 帧并显示明确空态。

### 1.2 有向图 Kosaraju 强连通分量

- 新增 `kosaraju` 快照：有向 `nodes/edges`、`phase`（first-pass/reverse/second-pass/done）、`reversed`、`finishOrder`、`secondPassOrder/secondPassIndex`、当前节点/边、栈、`currentComponentId/componentCount/components`。
- 真实 Python 迭代 Kosaraju：第一遍原图 DFS 记录真实完成顺序；`reverse` 帧反转全部边并清空第二遍 discovered/visited/栈/分量，但保留完成顺序；第二遍严格按完成顺序的逆序扫描反向图，逐个分配 SCC。迭代栈保存 `[node, nextAdjacencyIndex]`，避免回溯后重复扫描。
- 操作序列：`init / start-first / inspect-edge / skip / push / finish / reverse / start-second / assign / complete-component / done`。
- 默认图 8 节点、7 条有向边（A→B、B→C、C→A、C→D、D→E、E→D、F→G），60 帧；第一遍完成顺序 `E,D,C,B,A,G,F,H`，第二遍顺序 `H,F,G,A,B,C,D,E`，最终 5 个 SCC：`{H}`、`{F}`、`{G}`、`{A,C,B}`、`{D,E}`。
- 直接面对教学难点：普通连通 vs 强连通、方向为什么重要、为什么需要两遍 DFS、为什么按完成时间逆序处理；默认图同时包含 3 节点环、2 节点环、单向边 F→G 与孤立点 H。

### 1.3 可视化、课程与接入

- 复用既有 `mst-stage / mst-layout / mst-panel / mst-graph-scroll / mst-graph-svg / mst-node / mst-edge`、`layoutGraph` 与单一播放器；没有新增播放器，也没有改造页面主布局。
- 连通分量面板：无向图 + 当前节点/检查边 + 显式 DFS 栈 + 当前 C 编号 + 分量结果表 + 节点状态表。
- SCC 面板：有向图/反向图 + 阶段轨道 + 第一遍完成顺序 + 第二遍处理顺序 + 当前 DFS 栈 + SCC 结果表 + 节点左上角完成序号。
- 节点、分量行、状态表都同时打印 `C1/C2/...` 文本编号，颜色只是辅助，不是唯一语义；反向图边标签保留 `rev u→v`，不会让人误以为“忽略方向后普通连通就等于 SCC”。
- 双语课程：`connected-components-dfs` 10 步，`strongly-connected-components-kosaraju` 11 步；覆盖算法思想、O(V+E) 时间/空间、常见错误与记忆重点。
- 目录入口从 21 增至 23，课程从 15 增至 17；G4 的 JS 入口是提示桩，只提示在 Python 模式运行，不伪造图动画。
- 没有进行页面主布局改造；`g4.css` 只处理 G4 面板与 980/560 断点单列，390px 下图与结果表在容器内滚动，页面无横向溢出。

## 2. 测试结果

| 门禁 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过 |
| `npm run build` | 通过；1414 modules；`index-Cf7Q5QtD.js` 1078.42 kB / gzip 310.49 kB；`index-D4fiU_S7.css` 110.71 kB / gzip 19.57 kB |
| 全量单测 | **78 个测试文件 / 644 项全部通过** |
| G4 专项单测 | **18 项通过**：`components.test.ts` 12 项、`g4Lessons.test.ts` 6 项 |
| G4 功能 E2E | **4/4 通过**，真实 Edge + Pyodide（连通分量发现/栈/C 编号/4 分量；Kosaraju 第一遍/转置/第二遍/5 SCC；空图；单向链 vs 有向环） |
| G4 视觉 E2E | **1/1 通过**，1440 与 390，共 6 张真实截图 |
| 全量 E2E | **93/93 通过**，真实 Edge + Pyodide，5.7m（88 条既有回归 + 4 条 G4 功能 + 1 条 G4 视觉） |
| 独立 CPython 校验 | `scripts/verify_components_python.py` 通过：默认连通 50 帧/4 分量、SCC 60 帧/5 SCC；边界 disconnected 28 帧/3、single 6 帧/1、empty 2 帧/0、complete 39 帧/1、chain 24 帧/3、cycle 24 帧/1、bridge 36 帧/2、single 8 帧/1、empty 2 帧/0；逐组核对 SCC 内双向可达与跨 SCC 不合并 |

G4 测试重点：

- 连通分量按分组集合比较，不依赖节点顺序；每个节点恰好属于一个完整分量，无遗漏、无重复；发现集、访问集、栈与当前分量同帧同步。
- SCC 用独立参考实现和双向可达性检查验证分组；不依赖固定分量编号，组内顺序按真实 DFS 发现顺序保留。单向链 `A→B→C` 得到 3 个 SCC，有向环 `A→B→C→A` 得到 1 个 SCC，桥接图 `A↔B`、`C↔D` 得到 2 个 SCC。
- 转置帧检查所有边 `reversed=true`，第二遍顺序严格等于完成顺序的逆序；回退和任意跳帧后，图、栈、完成顺序、分组与高亮同步恢复。
- 回归范围覆盖 Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、BFS/DFS、拓扑排序、关键路径、Stage 7B–7F 与 UI-01/02/03；全量 E2E 93/93 无回归。

## 3. 截图位置

全部为真实 Microsoft Edge + Pyodide 运行截图，位于 `docs/g4/`：

| 文件 | 内容 |
| --- | --- |
| `docs/g4/cc-stack-1440-light.png` | 连通分量第 10/50 帧，C 入栈，C1 已含 A/B/C，DFS 栈 B、C，1440 Light |
| `docs/g4/cc-done-1440-light.png` | 连通分量完成 50/50，4 个分量、C1–C4、8/8 已发现/已访问，1440 Light |
| `docs/g4/cc-done-390-light.png` | 连通分量完成 50/50，390 手机单列，无页面横向溢出 |
| `docs/g4/scc-reverse-1440-light.png` | SCC 第 27/60 帧，全部边反转，完成顺序 8 项，第二遍顺序 8 项，第二遍尚未开始，1440 Light |
| `docs/g4/scc-second-pass-1440-light.png` | SCC 第 30/60 帧，C1={H} 完成，第二遍正按 H→F→G→… 处理，1440 Light |
| `docs/g4/scc-done-390-light.png` | SCC 完成 60/60，5 个 SCC，C1={H}、C2={F}、C3={G}、C4={A,C,B}、C5={D,E}，390 手机单列 |

## 4. 已知限制

- 本批次只保证官方 Python 示例与预设输入的完整动画；任意用户改代码后自动生成专属动画仍不在范围内。
- 连通分量与 SCC 输入上限为 12 节点 / 30 条原始边 / 20 条唯一边；拒绝未知端点、自环、重复边、重复节点 id。连通分量要求无向图，SCC 要求有向图。
- 连通分量使用迭代 DFS，邻接表按输入边顺序构建；同一输入顺序确定，换输入边顺序会改变分量内部节点顺序，但不改变分组集合。
- SCC 的 `C1/C2/...` 编号按第二遍真实发现顺序分配，不是字典序；测试比较分组集合，不锁定固定编号。
- 空图 SCC 的 `done` 帧 `reversed=false`（没有边可反转）；这是当前明确定义的语义，不表示漏做转置。
- 390px 下图画布与结果表各自在容器内滚动，页面本身无横向溢出；没有为 G4 改造页面主布局。
- G2、G3、G4 均尚未合并 `main`；G4 从 G3 的 `787d0df` 创建，不从缺少 G2/G3 的旧 `main` 开发。

## 5. Git 提交

- G4 实现、测试与截图：`9d335e5` `feat(g4): add connected components and Kosaraju SCC visualizations`
- G4 覆盖清单、架构、参考、README、版本与本报告：随分支最终文档提交推送

分支：`feat/g4-components-scc`；远端：`https://gitee.com/vvvi734/algolens.git`。未直接覆盖 `main`。

## 6. 本批次主要时间去向

主要时间花在三处：一是把 Kosaraju 的“第一遍完成顺序 / 转置 / 第二遍逆序”做成真实、可回退的逐帧快照，并让 Schema 强制保证转置帧与第二遍顺序的语义；二是把连通分量的“发现”和“入栈”拆成真实帧，同时保证分量编号、发现集、访问集、栈和结果表在同一条 `currentEvent` 下同步；三是真实 Pyodide E2E 与视觉验收，尤其是帧序号、空图、单向链/有向环和 390 布局。页面主布局、播放器和图布局均未重做，开发时间集中在算法 Trace 与可复核测试上。
