# G3 交付报告：拓扑排序 + AOE 关键路径

日期：2026-11-18  
分支：`feat/g3-topo-critical-path`  
基线：从 G2 已提交版本 `feat/g2-mst` @ `2bb40ec` 创建；`main` 仍为 `1dcdf76`（缺少 G2）。本批次没有修改其他 Agent 的工作目录，也没有直接覆盖 `main`。

## 1. 实现内容

### 1.1 拓扑排序（Kahn 入度法）

- 新增 `topological-sort` 快照：`nodes`、`edges`、`indegree`、`queue`、`queueAdded/queueRemoved`、`currentNodeId/currentEdgeId/neighborNodeId`、`indegreeChange`、`removedEdgeIds`、`topologicalOrder`、`hasCycle/cycleNodeIds`。
- 真实 Python `collections.deque` FIFO 候选队列；稳定队列 id `q1...`；入度与逐边移除真实变化；源点按顶点输入顺序入队，保证同一输入每次播放一致。
- 操作序列：`init / enqueue / dequeue / inspect-edge / decrement / enqueue-node / cycle / done`。
- 默认图：7 节点 A–G、8 条依赖边，32 帧，得到 `A, B, D, C, E, F, G`。该序列不是唯一答案，测试逐边验证 `from` 先于 `to`。
- 支持多个零入度源点、多个合法拓扑序列、非连通 DAG、单点与空图；队列耗尽但仍有顶点时进入 `cycle`，保留 `cycleNodeIds`，不伪造序列。
- 顺势修正课程 stepId：初始源点帧使用真实 `lesson_step="seed"`，新零入度节点入队使用 `enqueue`，避免把两类入队混为同一教学步骤。

### 1.2 关键路径（AOE 网络）

- 新增 `critical-path` 快照：边带非负 `duration`；`sourceNodeIds/sinkNodeIds`、`topologicalOrder`、`veRows/vlRows`、带 `e/l/slack/critical` 的 `activities`、`criticalEdgeIds`、`criticalPaths`、`projectDuration`、`hasCycle/cycleNodeIds`。
- 真实 Python：Kahn 求拓扑序并检测环；按拓扑序前推 `ve[v]=max(ve[u]+duration)`；按逆拓扑序后推 `vl[v]=min(vl[w]-duration)`；活动 `e=ve[from]`、`l=vl[to]-duration`、`slack=l-e`；沿零余量边 DFS 枚举所有源到汇关键路径。
- 操作序列：`init / topo-order / ve / vl / activity / cycle / done`，分阶段展示拓扑序、最早事件时间、最迟事件时间、活动余量和最终路径。
- 默认图：6 事件 A–F、7 项活动，22 帧；`ve=vl={A:0,B:3,C:2,D:6,E:9,F:11}`，总工期 11，关键活动 `e1/e2/e4/e5/e6/e7`，两条关键路径 `A→B→E→F` 与 `A→C→D→E→F`；B–D 余量为 1，显示为非关键。
- 多源语义：所有入度 0 的源事件 `ve=0`；源事件的 `vl` 不一定为 0（多源案例中较短分支源可为正余量）。多汇语义：所有出度 0 的汇事件 `vl=projectDuration`，`projectDuration=max(ve[sink])`。
- 负持续时间、非有限值、有向环、无向图、自环、重复同向边与未知端点均在生成帧前拒绝；关键路径枚举上限 12 条，超过时 Python 显式 `raise ValueError`，不静默截断。

### 1.3 可视化、课程与接入

- `DAGVisuals.tsx` 复用既有有向图节点/边语言和确定性 `layoutDag` 分层坐标，但两种算法使用不同辅助面板：
  - 拓扑：有向图 + 入度徽标 + 入度表 + FIFO 候选队列 + 当前拓扑序列 + 完成/环结果；
  - AOE：AOE 带权图 + 计算阶段轨道 + 事件 ve/vl 表 + 活动 e/l/余量表 + 全部关键路径 + 总工期。
- 所有面板只读取同一帧 `currentEvent.structure`；没有第二个 `currentIndex`、第二套播放器或 message 解析。时间轴播放、回退、任意跳帧时，图、表格、高亮、变量与课程步骤一起恢复。
- 双语课程：`topological-sort-kahn` 8 步，`aoe-critical-path` 7 步；覆盖 DAG/入度、多个合法顺序、确定性、环、非连通、AOV vs AOE、最长路径 vs 最短路径、多源多汇、多关键路径、复杂度、常见错误和记忆重点。
- 目录入口从 19 增至 21，课程从 13 增至 15；G3 的 JS 入口是提示桩，只提示在 Python 模式运行，不伪造图动画。
- 没有调整页面主布局；`g3.css` 只处理 G3 面板与 980/560 断点单列，390px 下画布和表格在容器内滚动，页面无横向溢出。

## 2. 测试结果

| 门禁 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过 |
| `npm run build` | 通过；1408 modules；`index-BtIHFP4-.js` 985.23 kB / gzip 288.66 kB；`index-JPNTH2Fw.css` 104.90 kB |
| 全量单测 | **76 个测试文件 / 622 项全部通过** |
| G3 专项单测 | **26 项通过**：`dag.test.ts` 10 项、`dagEdgeCases.test.ts` 10 项、`g3Lessons.test.ts` 6 项 |
| G3 功能 E2E | **4/4 通过**，真实 Edge + Pyodide，约 22.9s |
| G3 视觉 E2E | **1/1 通过**，约 5.6s |
| 全量 E2E | **88/88 通过**，真实 Edge + Pyodide，5.2m（83 条既有回归 + 4 条 G3 功能 + 1 条 G3 视觉） |
| 独立 CPython 校验 | `scripts/verify_dag_python.py` 通过：默认拓扑 32 帧/序列 `A B D C E F G`；非连通 14 帧/`A C B D`；环 3 帧/`A B C`；默认 AOE 22 帧/工期 11/两条路径；多源 14 帧/工期 4；多汇 11 帧/工期 5；单点 5 帧；空图 2 拓扑帧、3 关键路径帧 |

G3 测试重点：

- 拓扑逐边验证前驱先于后继，不把默认序列当唯一正确答案；检查入度与队列在同帧变化；非连通 DAG、环、单点、空图均覆盖。
- AOE 以独立 TS 参考实现重算 ve/vl/slack，并枚举源到汇最长路径交叉验证；多源、多汇、多条关键路径、单点、空图均覆盖。
- 回退与任意跳帧后，入度表、队列、ve/vl 表、活动余量、关键边/路径高亮与课程步骤同步恢复；负持续时间与无向图被拒绝。

## 3. 截图位置

全部为真实 Microsoft Edge + Pyodide 运行截图，位于 `docs/g3/`：

| 文件 | 内容 |
| --- | --- |
| `docs/g3/topo-decrement-1440-light.png` | 拓扑排序第 6/32 帧，看边 A→C，C 入度 2→1，队列 B，1440 Light |
| `docs/g3/topo-done-1440-light.png` | 拓扑完成 32/32，完整序列、入度 7/7、队列 0、无环，1440 Light |
| `docs/g3/topo-done-390-light.png` | 拓扑完成 32/32，390 手机单列，无页面横向溢出 |
| `docs/g3/critical-ve-1440-light.png` | AOE 第 9/22 帧，ve 阶段，事件 F ve=11，事件表与图同步 |
| `docs/g3/critical-activity-1440-light.png` | AOE 第 18/22 帧，活动 B→E 余量 0，活动表与图同步 |
| `docs/g3/critical-done-1440-light.png` | AOE 完成 22/22，总工期 11、关键活动 6/7、两条关键路径 |
| `docs/g3/critical-done-390-light.png` | AOE 完成 22/22，390 手机单列，事件表/活动表/路径纵向堆叠，无溢出 |

## 4. 已知限制

- 本批次只保证官方 Python 示例与预设输入的完整动画；任意用户改代码后自动生成专属动画仍不在范围内。
- 拓扑与 AOE 输入上限为 12 节点 / 30 条原始边 / 20 条唯一边（AOE 另限 20 项活动）；超限或非法图在 Python 侧拒绝。
- 关键路径超过 12 条时显式报错，不静默截断；非连通 AOE 没有单独的“无关键路径”UI 文案，由源/汇语义和空路径状态处理。
- 多源 AOE 的源事件 `vl` 可以大于 0，页面按真实值显示，不假设“源事件最迟时间一定为 0”；多汇事件统一 `vl=总工期`。
- 全量视觉 E2E 会重拍历史阶段截图；本分支只保留 `docs/g3` 的 7 张 G3 截图，历史目录已恢复到 `HEAD`，避免把无关生成物混入提交。
- G2 与 G3 均尚未合并 `main`；G3 分支基于 G2 的已提交版本，不是从缺少 G2 的旧 `main` 开发。

## 5. Git 提交

- G3 实现、测试、截图：`3b073ea` `feat(g3): add Kahn topological sort and AOE critical path visualizations`
- G3 覆盖清单、架构、参考与 README：`fbe428c` `docs(g3): update coverage, architecture and release notes`
- 本报告：随分支最终提交推送

分支：`feat/g3-topo-critical-path`；远端：`https://gitee.com/vvvi734/algolens.git`。未直接覆盖 `main`。
