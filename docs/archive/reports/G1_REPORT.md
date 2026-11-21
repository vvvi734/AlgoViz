# G1 报告：Floyd-Warshall 与 Bellman-Ford

分支：`feat/g1-shortest-paths`；基线 `origin/ui03/code-panel` @ `9cc738f`。

## 实现概要

- 新增两个独立结构快照 `floyd-warshall`、`bellman-ford`，未放宽 Dijkstra 的非负边权契约。
- `shortestPathExamples.ts` 提供真实 Python 示例与输入 helper：允许有限负权，拒绝自环/重复边；Floyd 教学图上限 7 节点。
- Floyd Trace 操作：`init / k / update / skip / negative-cycle / done`；距离矩阵 + previous + 当前 k/i/j + 旧值/候选/新值。
- Bellman Trace 操作：`init / round / inspect / relax / skip / early-exit / negative-cycle / done`；距离表 + previous + 轮次 + 当前边 + 提前结束。
- 可视化：`FloydVisual` 为带权图 + 动态距离矩阵 + 比较条 + 负环/最终路径；`BellmanFordVisual` 为带权图 + 距离表 + 松弛条 + 轮次 + 负环/最终路径。路径面板只在 `done` 帧出现，避免中间帧误报“不可达”。
- 课程：`floyd-warshall-all-pairs`（6 步）、`bellman-ford-single-source`（8 步），中英双语、复杂度、易错点、记忆重点；stepId 与真实 Python `lesson_step=` 对齐。
- 目录：17 个入口；侧栏图算法组新增两项。共享 UI-03 代码面板、播放/回退/跳帧、双语切换未改布局。

## 默认示例

- Floyd：A/B/C/D/E，7 条有向边，含负权 C→B −2；87 帧；A→C→B→D→E，权重 2；无负环。
- Bellman：同图去掉 C→E 8；35 帧；第 2 轮零更新提前结束；A→C→B→D→E，距离 2。

## 测试结果

本地复核环境：Windows + Microsoft Edge（Playwright `channel=msedge`）+ 真实 Pyodide 0.27.7；未使用 mock 生成 G1 帧。

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 全量单测：71 个测试文件、577 项全部通过。G1 专项覆盖 Schema、真实 fixture、课程、目录与注册表。
- 全量 E2E：78/78 通过（4.4 分钟），包含 G1 功能 3 项、G1 视觉 1 项，以及既有 Dijkstra、BFS/DFS、Stage 7B–7F、UI-01/02/03 回归。
- G1 功能 E2E：覆盖 Floyd 默认 5 节点/7 边/25 格、k=C/i=A/j=B、A→B 4→−1、done 路径、负环、不可达；Bellman 松弛 B 4→−1 previous C、第 2 轮提前结束、done 路径、不可达负环不误报。
- G1 视觉 E2E：生成 6 张 1440/390 真实 Edge 截图。
- 全量单测曾发现 `App.dom.test.tsx` 仍断言 15 个算法入口；G1 已增加到 17，现已同步修正并重跑通过。

## 截图

- `docs/g1/floyd-update-1440-light.png` / `floyd-update-390-light.png`
- `docs/g1/floyd-done-1440-light.png`
- `docs/g1/bellman-relax-1440-light.png` / `bellman-relax-390-light.png`
- `docs/g1/bellman-done-1440-light.png`

## 参考开源项目

仅阅读公开仓库的实现/测试/可视化思路，未复制代码、文案或素材；许可证均为 MIT：

- TheAlgorithms/Python，`master`，https://github.com/TheAlgorithms/Python
- trekhleb/javascript-algorithms，`master`，https://github.com/trekhleb/javascript-algorithms
- algorithm-visualizer/algorithm-visualizer，`master`，https://github.com/algorithm-visualizer/algorithm-visualizer

来源核验时间 2026-11-17；由于未复用，未产生逐文件来源路径或版本署名义务。详见 `docs/REFERENCES.md`。

## Git

- 基线：`origin/ui03/code-panel` @ `9cc738f`。
- G1 实现：`4a51f53`。
- 本地 Edge 截图刷新：`83fab76`。
- 全量回归与入口数量修正提交：见本分支最新提交。
- 已合并到 `main`：`14cf331`（`release/g1` 合并提交）。
- 分支已推送到 Gitee：`origin/feat/g1-shortest-paths`、`origin/release/g1`。