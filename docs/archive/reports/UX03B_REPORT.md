# UX-03B · 教材目录层级精简

版本：`0.19.1-ux03b`（未发布）  
日期：2026-11-18  
基线：`10f9a68`（UX-03 + UX-04，`feat(ux04): fit desktop learning lab into one viewport`）  
分支：`feat/ux03b-nav-compaction`（`main` 保持 `10f9a68` 不变）  
参考：程杰《大话数据结构》，清华大学出版社，2011 年 6 月第 1 版

## 1. 目标与不变量

本次只调整教材导航的呈现层级：

- 单算法专题自动变成可直接点击的二级入口，消除“专题名 → 同名算法”的重复点击。
- 多算法专题保留展开/收起。
- 目录条目区分 `concept` / `algorithm` / `planned`，概念与未实现算法都不伪装成可学习页面。
- 保留九章顺序、49 个作者配置专题、25 个注册算法入口及全部课程 / 播放 / Trace 行为。

未改动：教材章节顺序、算法 ID、课程 ID、Python Worker、Trace Schema、算法结果、顶部算法导学、右侧讲解、整体页面布局、AI / MCP 能力。没有新增算法、图论定理或知识讲解页面。

## 2. 分类与层级判定

`src/domain/algorithms/textbook.ts` 为专题增加显式语义：

| 语义 | 数据标记 | 渲染结果 |
| --- | --- | --- |
| 知识讲解 | `concept: true` | 静态行，`data-kind="concept"`，不生成算法目标 |
| 计划中的算法演示 | `planned: true` | 静态行，`data-kind="planned"`，不生成算法目标 |
| 已实现的单算法专题 | 无 concept/planned，实时解析后仅 1 个算法 | 一个直接入口，`data-kind="algorithm"` |
| 已实现的多算法专题 | 无 concept/planned，实时解析后多于 1 个算法 | 保留展开/收起，`data-kind="group"` |

判定集中在 `textbookTopicKind(topic, algorithms)`，输入是作者语义与 live catalog 的已解析子项数量，没有在 React 组件中写死任何算法名或专题 ID。运行时动态追加的“其他算法”扩展专题使用同一规则：1 个未映射算法为直达，多个为 group。

当前默认目录的分类结果：

- 21 个 concept：`intro-concepts`、`intro-logical-physical`、`intro-adt`、`algorithm-definition`、`algorithm-efficiency`、`linear-basics`、`sequential-list`、`static-linked-list`、`circular-linked-list`、`doubly-linked-list`、`stack-recursion`、`circular-queue`、`string-basics`、`string-storage`、`tree-basics`、`binary-tree`、`threaded-tree`、`forest-conversion`、`graph-basics`、`graph-storage`、`sort-basics`。
- 9 个 planned：`naive-match`、`kmp`、`huffman`、`indexed-search`、`multiway-tree`、`hash-search`、`shell-sort`、`heap-sort`、`merge-sort`。
- 14 个直达算法专题：`linked-list`、`stack-basics`、`queue-basics`、`binary-tree-traversal`、`topological`、`critical-path`、`sequential-search`、`ordered-search`、`bst`、`avl`、`bubble-sort`、`selection-sort`、`insertion-sort`、`quick-sort`。
- 5 个保留展开的 group：`recursion-extension`（阶乘 / 斐波那契）、`graph-traversal`（BFS / DFS）、`mst`（Prim / Kruskal）、`shortest-path`（Dijkstra / Floyd-Warshall / Bellman-Ford）、`graph-connectivity`（连通分量 / SCC）。

合计 9 个教材章、49 个作者配置专题、25 个唯一算法入口；章节顺序与 UX-03 完全一致。

## 3. 目录 UI

`src/features/lab/AlgorithmSidebar.tsx` 现在按 `kind` 分为四条渲染路径：

1. **直达单算法**
   - 外层 `section[data-testid="topic-<id>"][data-direct="true"][data-kind="algorithm"]` 不再有 disclosure。
   - 内层只有一个 `button.alg-item.textbook-direct-item`，`data-testid="algo-<id>"`，点击直接调用现有算法选择器。
   - 主标签显示专题名；只有注册算法名与专题名不同才追加次级算法名。因此“排序 → 冒泡排序”只出现一次“冒泡排序”，而“简单选择排序”仍能看到其算法名“选择排序”。
   - 保留当前算法圆点、扩展徽标、`aria-current` 和原生按钮键盘行为。

2. **多算法专题**
   - 仍是 `button.textbook-topic-head`，带 `aria-expanded`、`aria-controls`、`topic-<id>-body`、`inert` 和数量徽标。
   - `aria-label` 明确标注“专题名 · 算法专题”。展开/收起互不影响其他章或专题。

3. **知识讲解**
   - 静态 `div[data-kind="concept"][aria-disabled="true"]`，无 button、无算法目标。
   - 使用 `◇` 统一小图标和“知识讲解”小字状态；`aria-label` / `title` 同时写明“知识讲解 · 待完善”，因为本次没有开发知识讲解页面。概念不会指向不存在的动画。

4. **未实现算法演示**
   - 静态 `div[data-kind="planned"][aria-disabled="true"]`，使用 `△` 和“待完善”小字状态。
   - 没有算法按钮或算法 ID，不会误导为可运行课程。

样式位于 `src/styles/ux03nav.css`：新增 `.is-concept` / `.is-planned` 共用静态行、`.textbook-kind-icon`、`.textbook-kind-status` 和直达行 `.textbook-topic.is-direct` / `.textbook-direct-item` / `.textbook-direct-copy`。未改整体布局、字号体系、移动端断点或目录滚动容器。

## 4. 交互与兼容

- **选中状态**：`algo-<id>[aria-current="true"]`、`topic-<id>[data-has-current="true"]`、`chapter-<id>[data-has-current="true"]` 继续由唯一当前算法驱动；直达行仍只有一个 active 按钮。
- **自动展开**：只需展开当前算法的章；直达专题不再需要展开，因此默认排序章展开后立即看到冒泡排序按钮。多算法专题仍按当前路径自动展开。
- **刷新恢复**：章、group 专题的展开状态与侧栏整体折叠继续写入 `algolens-sidebar` 的 `{ collapsed, openChapters, openTopics }`。
- **旧偏好兼容**：已保存的 `openTopics` 中即使包含现在已直达的专题 ID（例如 `bubble-sort`、`bst`），组件也不会消费它的展开状态，因此不会出现“看似已展开/收起但内容不动”的错误状态；现有存储不会被清空。真实浏览器中已用 `openChapters: ['ch7-graph','ch8-search']`、`openTopics: ['shortest-path','bst']` 的旧格式验证刷新恢复。
- **侧栏与播放**：折叠/展开侧栏、折叠/展开章或 group 专题，只改变呈现，不调用算法选择，不重置 Trace 或播放位置。
- **键盘**：直达行、章头、group 头仍使用原生 `<button type="button">`，保留 focus-visible 和 Enter / Space 行为；静态 concept/planned 行不可聚焦。
- **移动端**：390 宽继续隐藏桌面侧栏，使用 `mobile-algo-select`；选项仍按章分组，选择直达算法后直接打开现有学习页，不增加中间层级。
- **中英文**：新增 `textbookConcept`、`textbookConceptPending`、`textbookAlgorithm`、`textbookAlgorithmGroup`，中英文目录名称、状态与 aria-label 同步。

## 5. 测试与门禁

- `npm run typecheck`：通过。
- 全量单测：87 个文件 / 721 项通过（UX-04 基线 718 项，新增 3 项）。
- 目录定向测试：`textbook.test.ts` + `AlgorithmSidebar.test.tsx` + `App.ui01.test.tsx`，3 个文件 / 22 项通过。
- UX-03B 正式 E2E：`e2e/ux03b.spec.ts`，3/3 通过：
  - 14 个 direct 专题、5 个 group；每个直达专题恰好 1 个算法按钮；
  - 冒泡排序同名层级只渲染一次；
  - 最短路径 3 个算法仍可展开；
  - BST / AVL 可直达并正确高亮；
  - 全目录仍有 25 个算法入口；
  - concept / planned 静态行无按钮、无算法目标；
  - 播放 3/25 时折叠章、折叠侧栏均不改变进度；
  - 旧 `openTopics` 偏好刷新兼容；
  - 1440 与 390 截图由真实应用写出。
- 全量 E2E：121/121 通过（Playwright + 本机 Edge，headless，`PLAYWRIGHT_PORT=4174`，8.0 分钟）。
- 构建：通过，1437 modules；`index` JS 1,335.64 kB / gzip 376.52 kB，CSS 154.26 kB / gzip 26.18 kB。
- 全量 E2E 会重新生成既有的 tracked `docs/**` 截图；运行后已执行 `git restore -- docs` 还原，提交只包含 UX-03B 代码、测试、报告与 `docs/ux03b` 证据。

## 6. 视觉证据

优化前 `docs/ux03b/before/`：

1. `desktop-1440x900-light.png`（1440×900）— 默认冒泡排序，旧目录可见“冒泡排序”专题下再挂同名算法行。
2. `sidebar-1440x900-light.png`（220×671）— 排序章展开，专题与算法两级重复，且单算法专题仍有 disclosure。
3. `mobile-390-light.png`（390×2530）— 390×844 全页基线。

优化后 `docs/ux03b/after/`：

1. `desktop-1440x900-light.png`（1440×900）— 默认冒泡排序，直达行只有一个“冒泡排序”，当前圆点保留。
2. `sidebar-1440x900-light.png`（220×669）— 冒泡、选择、插入、快速排序均为直达行；概念“知识讲解”、未实现“待完善”与多算法专题数量清晰分层。
3. `graph-groups-1440x900-light.png`（220×877）— 第 7 章：图的基本概念 / 存储为概念，遍历与最小生成树为 group，最短路径展开 3 个算法，拓扑排序与关键路径为直达行。
4. `mobile-390-light.png`（390×2530）— 390×844 默认冒泡排序与按章分组选择器，无横向溢出；测试随后切换到 Dijkstra 验证直达选择。

1440 目录前后对照：

- `docs/ux03b/compare-1440-directory.png`（512×749）— 由上述真实 before/after 侧栏截图并排组成，左为 UX-03 重复层级，右为 UX-03B 直达层级。

截图均由 Playwright 在真实应用与真实 `dist` 上生成；对照图仅做并排排版，没有修改应用像素。

## 7. 已知限制

- 21 个概念条目只完成目录状态与映射，不提供知识讲解页面；可见状态为“知识讲解”，辅助技术文本与 `title` 为“知识讲解 · 待完善”。
- 9 个 planned 算法专题明确显示“待完善”，无算法按钮，不能进入学习页。
- 直达行的次级算法名只在专题名与算法名不同时出现，因此少数条目（如“简单选择排序”）会显示两行文本，这是名称映射信息，不是重复层级。
- 390 宽不使用桌面目录，移动选择器保持原有按章分组；目录层级精简不影响其选项与课程入口。
- 本次没有清理 `openTopics` 中的历史直达专题 ID；它们被安全忽略，保留原偏好数据以便未来回退或迁移。

## 8. Git

- 分支：`feat/ux03b-nav-compaction`，创建自包含 UX-03 / UX-04 的 `10f9a68`。
- 提交信息：`feat(ux03b): collapse single-algorithm textbook topics`。
- 推送：`origin feat/ux03b-nav-compaction`；不合并、不修改 `main`。
- 完成 UX-03B 后停止，不自动开发知识讲解页面或其他算法。
