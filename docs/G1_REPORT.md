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

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 单测：G1 相关 72 passed（`shortestPath`、`g1Lessons`、`registry`、`catalog`、`i18n`）。
- 浏览器功能 E2E：3/3 通过；覆盖 Floyd 默认 5 节点/7 边/25 格、k=C/i=A/j=B、A→B 4→−1、done 路径、负环、不可达；Bellman 松弛 B 4→−1 previous C、第 2 轮提前结束、done 路径、不可达负环不误报。
- 视觉 E2E：1/1 通过；生成 6 张 1440/390 真实 Chromium 截图。
- 全量单测未在 600 s 内完成：本机 2 核 3 GB，jsdom 环境每文件约 25 s；日志中 26 个文件全部通过无失败，非 G1 全量回归仍未取得最终 summary。已单独验证既有 Dijkstra/BFS/DFS 相关 Schema/模型/课程套件未受破坏。

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

本批次提交在本分支，不合并 `main`。提交哈希见最终交付消息。
