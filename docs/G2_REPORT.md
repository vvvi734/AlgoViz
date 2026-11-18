# G2 报告：Prim 与 Kruskal 最小生成树

分支：`feat/g2-mst`；基线 `main` @ `1dcdf76`（G1 已合并，工作区无未提交改动）。G2 只开发 Prim / Kruskal，没有调整页面布局、没有创建第二套播放器，也没有继续拓扑排序或关键路径。

## 1. 实现概要

- 新增两个独立结构快照 `prim-mst`、`kruskal-mst`，进入既有 `structureSchema` union；既有 graph / weighted-graph / stack / queue / tree / linked-list 路径不变。
- `mstExamples.ts` 提供真实 Python 示例与共享输入 helper：
  - Prim 使用标准 `heapq.heappush/heappop`，堆元组带单调序号，同权候选顺序稳定。
  - Kruskal 使用真实并查集：`find` 路径压缩，`union` 按秩合并。
  - 输入在产生帧前拒绝有向图、自环、重复无向边、非有限权重、未知端点；上限 12 节点 / 30 条原始边 / 20 条唯一边，Prim 额外限制 10 节点。
- 可视化复用带权图节点/边基础组件与唯一播放器，但保留各自面板：
  - Prim：带权图 + 生成树扩张 + 当前候选边 + heapq 优先队列 + 已选边 + 跳过边 + 总权重/树覆盖/分量。
  - Kruskal：带权图 + 按权排序表 + 当前边 + 两端根 + 环检测 + Union-Find `parent/rank/find 根`表 + 集合成员 + union 详情 + 总权重/已选/拒绝/分量。
- 边状态明确区分：
  - Prim：`idle / candidate / current / selected / skipped`；skip 帧当前边同时保留 current 与 skipped，UI 显示“已跳过”。
  - Kruskal：`idle / current / selected / rejected`；拒绝边在图上显示红色虚线，不隐藏。
- 双语课程：`prim-minimum-spanning-tree` 8 步、`kruskal-minimum-spanning-tree` 6 步；stepId 与真实 Python `lesson_step=` 对齐。课程解释 MST 定义、MST 与最短路径的区别、Prim 横切边贪心、Kruskal 全局排序 + 并查集、为什么不能成环、为什么不同边集可以同总权重、负权允许、非连通森林与有向图不支持。
- 目录：19 个入口；侧栏图算法组新增 `Prim 最小生成树`、`Kruskal 最小生成树`。

## 2. 默认示例

5 节点 A/B/C/D/E，6 条无向边，start A：

| edge id | 边 | 权重 |
| --- | --- | --- |
| e1 | B–C | 2 |
| e2 | A–B | 2 |
| e3 | A–C | 2 |
| e4 | C–D | 1 |
| e5 | D–E | 1 |
| e6 | C–E | 3 |

默认图刻意包含三条权重 2 的边，使两种算法选出不同的合法 MST：

- Prim：21 帧；选中 A–B(e2)、A–C(e3)、C–D(e4)、D–E(e5)，跳过 B–C(e1)、C–E(e6)，总权重 6。
- Kruskal：15 帧；排序 C–D(e4)、D–E(e5)、B–C(e1)、A–B(e2)、A–C(e3)、C–E(e6)，接受前四条、拒绝后两条，总权重 6。

两算法边集不同，但最小总权重相同，用于讲“多解 MST / 最小总权重唯一”。

## 3. 正确性验证

### 3.1 独立 CPython 脚本

`scripts/verify_mst_python.py` 直接从 `mstExamples.ts` 抽取真实 Python 模板，用 CPython 执行并注入本地 `trace()`；再用独立的穷举生成树参考实现核对最终权重。最新输出：

```text
MST Python checks passed: prim 21 frames / kruskal 15 frames; both total=6 with different edge sets; union=4, reject=2.
```

覆盖：

- 默认图：两算法 total=6，边集不同；穷举所有生成树的最优值也是 6。
- 负权三元图：total=−3；Prim 与 Kruskal 均允许负权。
- 单顶点：total=0，`connected=true`。
- 非连通图：4 节点两条边，total=3，2 条 selected，`forest=true`，分量数 2；结果是最小生成森林，不是一棵生成树。
- 相同权重、多解图：4 点多解，total=4；只比较最小总权重，不固定边列表。
- Kruskal：每个 union 的两根不同、分量数恰好 −1、attached 的真实 parent 从自身根改为 merged 根；每个 reject 的两端根相同。
- Prim：每条 `select-edge` 的新端点不在选择前的树内，且旧端点在树内（或为起点），因此不会选中生成树内部边。
- 森林最终态额外校验：selected 边无环、覆盖每个参考连通分量，总权重等于独立参考最小生成森林权重。
- 有向图、重复无向边、自环：两算法均抛 `ValueError`。

### 3.2 单元测试

- `src/domain/trace/mst.test.ts`：6/6。
  - Prim 21 帧、Kruskal 15 帧逐帧 Schema 校验与视觉模型。
  - 两算法总权重 6、边集不同。
  - Prim 只在真实 `pop` 拒绝时标记 skipped；skip 帧模型状态为 `skipped` 且仍 `current`。
  - Kruskal reject 帧两端根相同、边状态 `rejected`；union 详情与 parent 表一致。
- `src/domain/lessons/g2Lessons.test.ts`：5/5；直接读取真实 fixture，校验课程 stepId 与 `lessonStepId` 一致，Prim 允许 `component` 无默认帧。
- 全量单测：73 个文件、592 项全部通过。

### 3.3 类型、构建与 E2E

- `npm run typecheck`：通过。
- `npm run build`：通过；Monaco chunk 约 4.12 MB，`index` 886.13 kB。
- G2 功能 E2E 4/4：
  - Prim 真实 heap、树扩张、skip、总权重、侧栏无关播放。
  - Kruskal 排序、并查集根、accept/reject、总权重同步。
  - 两算法同一图总权重一致、边集不同。
  - 负权、单顶点、非连通森林、有向图拒绝。
- G2 视觉 E2E 1/1：Prim 选中/跳过/完成、Kruskal 合并/拒绝/完成；1440 与 390。
- 全量 E2E：83/83 通过（4.8 分钟），包含 Dijkstra、Floyd、Bellman-Ford、BFS/DFS、Stage 7B–7F、UI-01/02/03 回归。

## 4. 截图

`docs/g2/` 共 8 张真实 Edge + Pyodide 截图：

- `prim-select-1440-light.png` / `prim-select-390-light.png`：Prim 选中 A–B。
- `prim-skip-1440-light.png`：Prim 跳过 B–C，当前边显示“已跳过”，堆内仍保留 C–E。
- `prim-done-1440-light.png`：Prim 完成，总权重 6，树覆盖 5/5，跳过 2。
- `kruskal-union-1440-light.png` / `kruskal-union-390-light.png`：Kruskal 中间 union B–C，显示 `B ∪ E → B`、分量 2，不显示森林警告。
- `kruskal-reject-1440-light.png`：Kruskal 拒绝 A–C，两端根均为 A，环检测徽标“会成环”，拒绝边红色虚线。
- `kruskal-done-1440-light.png`：Kruskal 完成，总权重 6，已选 4、拒绝 2、分量 1、单棵生成树。

## 5. 关键修复记录

1. Python 模板模块级 `nonlocal` 非法 → 用 `sequence=[0]`。
2. Prim 完成时堆里仍残留内部候选边 → 循环条件改为“堆空且所有节点覆盖”，用真实 skip 帧排空。
3. Prim 曾在 select 时提前把堆内边标记 skipped → 只在真实 pop 后判定 target 已在树内才写入 skipped。
4. Prim skip 帧当前边显示 `current` 而非 `skipped` → 模型状态优先级改为 selected > skipped > current，UI 增加“已跳过”徽标。
5. Kruskal `init` 曾提前返回完整排序列表 → `init` 返回空表，`sort` 帧才给出排序。
6. Kruskal union 帧用合并后的 parent 判断 union 前成环 → 只在 inspect/reject 比较 union 前根。
7. 按秩合并的 `rankAfter` 曾误取被合并根 → 修正为 merged root 的真实 rank。
8. 并查集 `attachedRoot` 校验过严 → 放宽为两根之一且不等于 merged，再用 post-union parent 验证真实合并。
9. Kruskal 空排序表指针显示 `1 / 0` → 改为 `0 / 0`。
10. Kruskal 中间 union 帧 `componentCount > 1` 被误判为森林 → `showForest = done && forest`，只有最终帧显示森林警告；Prim 同理。
11. 课程测试曾把 MST 加进依赖 `LANGUAGE_EXAMPLES` 的同步测试 → 撤回；G2 改为直接校验真实 fixture 的 `lessonStepId`。
12. 全量视觉 E2E 会重拍所有历史阶段截图 → 已在提交前恢复 `docs/g1`、`stage7b`–`stage7f`、`ui01`–`ui03` 的既有文件，G2 只保留 `docs/g2/` 新图。

## 6. 开源参考

只阅读公开仓库的实现、测试组织与边界用例，未复制代码、文案或素材，未引入依赖或子模块：

- TheAlgorithms/Python，`master`，MIT（公开仓库页标注）。
- trekhleb/javascript-algorithms，`master`，MIT（根 `LICENSE` 原文核验）。
- algorithm-visualizer/algorithms，`master`；未单独核验根许可证，未复制任何内容，仅观察“轨迹与渲染分离”的通用设计取向。

AlgoViz 的 MST Python 程序、Trace、并查集实现、课程与视觉组件均为自研；没有移植其他项目的整套 UI 或播放器。详见 `docs/REFERENCES.md`。

## 7. 已知边界

- Prim 教学图限制 10 节点，Kruskal / 共享 helper 限制 12 节点、30 条原始边、20 条唯一边；默认图 5 节点、6 边。
- 最小生成树允许负权边；有向图不是本批次普通 MST 的支持范围，直接拒绝；自环、重复无向边、非有限权重、未知端点拒绝。
- 非连通图不输出“一棵生成树”：结果条只在最终 `done` 帧显示“最小生成森林”警告；中间 union 帧不会误报。
- Prim 的 `component-start` 只在非连通图进入下一分量时产生；默认连通图没有该帧，课程保留 `component` 步骤作为断连边界说明，步骤列表显示 0 帧。
- 相同权重、多种合法 MST 只比较最小总权重，不固定要求某一条边集；默认示例正好覆盖“边集不同、总权重相同”。
- 390 px 下图与并查集表各自在容器内滚动，页面本身无横向溢出。
- 用户任意改代码后的完整自动可视化不在本批次范围。

## 8. Git

- 基线：`main` @ `1dcdf76`。
- 实现提交：`c10dc25`。
- 本报告与覆盖清单提交：见 `feat/g2-mst` 后续文档提交。
- 分支：`feat/g2-mst`，按要求不合并 `main`。
- 版本：`0.11.0-g2`。
- G2 完成后停止；拓扑排序、关键路径及其他算法未开发。
