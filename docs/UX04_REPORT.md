# UX-04 · 桌面一屏学习体验优化

版本：`0.19.0-ux04`（未发布）  
日期：2026-11-18  
基线：`0e34933`（UX-03，`feat(ux03): rebuild algorithm directory as textbook chapters`）  
分支：`feat/ux04-desktop-viewport`（`main` 保持 `1dcdf76` 不变）

## 1. 改动范围

- **桌面一屏壳层**：`App` 增加 `data-view`，学习视图增加 `app-view app-view-learn`；新增 `src/styles/ux04.css`。在 `≥1280px` 且 `≥600px` 高时，学习视图使用 `100dvh` flex 列，`lab-main` 按 `auto minmax(0, 1fr) auto auto` 分配高度；导学收起时舞台填满剩余空间，页面 footer 隐藏。
- **播放控制固定**：`.stage-panel` 占据主行，`.stage` 仅在自身内部滚动，`.stage-playback` 不随图内容滚走；右侧 Teaching Course 在桌面改为填满学习区并在自身内部滚动。
- **导学衔接**：`AlgorithmGuide` 的收起回调统一为 `onStart`。点击“开始看动画”只收起导学，然后双 `requestAnimationFrame` 后把学习工作区滚动到最近可见位置并聚焦播放按钮；不 seek、不重跑 Python、不重置 `lab.playback.index`。尊重 `prefers-reduced-motion`。
- **高级面板默认折叠**：`WorkspaceTabs` 增加 `open=false` 默认值、头部说明、展开/收起按钮、`aria-expanded` / `aria-controls` 与 `data-expanded`。变量、调用栈、AI 导师、学习工具仍挂载，仅由 `hidden` 隐藏，Trace、当前帧、代码草稿和已生成回答不因折叠丢失；展开后仍绑定当前执行帧。
- **代码区**：沿用已有 `CodeDock` 默认折叠能力，Monaco 保持挂载。
- **图与树空间再分配**：
  - Dijkstra 把状态、距离表、路径摘要收进 `.graph-data-rail`；桌面网格为 `minmax(0, 1.55fr) minmax(232px, 0.9fr)`，画布与数据列分列，距离表内部纵向滚动，优先队列压缩为横向单行。
  - Kosaraju 的图、DFS 栈、完成顺序、强连通分量同屏；Kahn 的图、入度表、候选队列、当前序列同屏。
  - G3/G4/MST 图卡桌面为纵向 flex，图容器填满并内部滚动，辅助侧栏内部滚动，重复的 eyebrow / subtitle / hint 隐藏。
  - BST/AVL 桌面改为 `minmax(0, 1fr) minmax(196px, 0.56fr)` 五列布局；树容器占左列并 `overflow: auto`，指标、序列、树详情与旋转面板在右列。
  - 修复 `.mst-graph-svg` 继承 `min-width: 420px` 导致 1440 下 Kahn 的 G 节点被右侧裁切的问题；桌面学习视图设 `min-width: 0`，图缩入容器而非裁切节点。
- **国际化**：新增“高级面板 / 变量、调用栈、AI 导师与学习工具，按需展开 / 展开高级面板 / 收起高级面板”的中英文文案。
- **未改动**：Python 算法、Trace Schema、算法结果、顶部导学正文、右侧逐步解释、教材目录结构、算法数量、AI / MCP 能力均未改写。没有全站视觉重设计，没有新增算法或图论定理。

## 2. 桌面布局验收

真实浏览器断言位于 `e2e/ux04-layout.spec.ts`，同时检查面板矩形与视口，不只检查 `scrollWidth`。正式断言要求以下元素全部在视口内：

- `.topbar`
- `[data-testid="nav-learn"]`
- `[data-testid="lab-title"]`
- `[data-testid="sidebar"]`
- `.stage-panel`
- `[data-testid="current-step"]`
- `.stage-playback`
- `[data-testid="code-dock"]`
- `[data-testid="workspace-tabs-toggle"]`

覆盖率：

| 视口 | 算法 | 整页滚动 | 结果 |
| --- | --- | --- | --- |
| 1366×768 | Dijkstra、Kosaraju、Kahn、BST、AVL | `scrollHeight = 768` | 主要面板与播放控制全部在视口内 |
| 1440×900 | 同上五种 | `scrollHeight = 900` | 无不必要的整页滚动 |
| 1920×1080 | Dijkstra、Kosaraju、BST | `scrollHeight ≤ 1080` | 额外高度用于图与讲解，没有隐藏内容 |

1366×768 实测关键几何：topbar 51px、主导航 34px、算法标题区 48px、学习主区 661px、舞台 377px、播放控制 88px、代码折叠条 40px、高级面板条 49px、footer 0px。Dijkstra 图在 1366 下为 400×241px，距离表数据列 232px；1440 下舞台 509px、画布 397px、播放控制 88px。

导学展开时 `guide-open` 不套固定高度，仍使用文档流滚动；点击“开始看动画”后导学消失，播放控制进入视口，进度、步骤号与运行反馈保持不变。

## 3. 图与树的裁切检查

正式断言对图容器与树容器分开处理：

- **图类容器**（Dijkstra `.graph-canvas-scroll`、Kosaraju/Kahn `.mst-graph-scroll`）：每个节点四边都必须在可视容器内。
- **树类容器**（`.tree-scroller`）：允许横向滚动，但断言 `overflow-x: auto`，且每个节点相对滚动内容的 left/right 都位于 `scrollWidth` 内；不能用 `overflow: hidden` 掩盖不可访问节点。

结果：

- Dijkstra：节点、距离表、优先队列均同屏；1366 下距离表在自身 47px 可视高度内纵向滚动（内容 152px）。当前节点 E 的距离 3、邻接点 F、目标 G 同时出现在上方真实状态和图中，关键步骤信息不依赖表格滚动才可见。
- Kosaraju：反图、DFS 栈、完成顺序、强连通分量同屏，节点完整。
- Kahn：入度表、候选队列与有向图同屏；1440 下 G 节点右边缘修复后可完整看到。
- BST：1440 下 7 节点 `50/30/70/20/40/60/80` 全部可见。1366 下树容器宽 401px，原生树画布 524px，保留容器内横向滚动；7 个节点全部位于 `scrollWidth` 内容内并可滚动访问。没有强行缩到 401px，因为节点文字会缩到约 6px，低于可读下限。
- AVL：1366/1440 下 5 节点树与旋转面板同屏，右旋完成帧的 `a4 promoted` 信息完整。

## 4. 响应式与兼容

- 1024×768：不套一屏壳层，页面允许纵向滚动到播放区；无页面级横向溢出。
- 390×844：允许正常纵向滚动，高级面板默认收起，展开后仍无页面级横向溢出。
- 侧栏折叠/展开：不重置 Trace、当前帧或播放状态。
- 中英文、Light/Dark/System 使用既有变量与本地化键；动画衔接尊重 reduced-motion。

## 5. 测试与门禁

- `npm run typecheck`：通过。
- 单测：**87 个文件 / 718 项通过**。
- UX-04 正式布局 E2E：`e2e/ux04-layout.spec.ts` **9/9 通过**。
- UX-04 最终截图 E2E：`e2e/ux04-visual.spec.ts` **2/2 通过**。
- 全量 E2E：**118/118 通过**（Playwright + 本机 Edge，`PLAYWRIGHT_PORT=4174`，8.5 分钟）。
- 构建：**通过**，1437 modules；`index` JS 1,333.71 kB / gzip 376.15 kB，CSS 153.04 kB / gzip 26.02 kB。
- 全量 E2E 首轮发现 8 个旧用例仍在点击默认已折叠的高级 tab；已在 `mentor`、`stage7c`、`stage7d`、`stage7e`、`stage7f` 等用例中先展开高级面板，产品逻辑未回退，复跑全部通过。

## 6. 截图

优化前 `docs/ux04/before/`：

1. `bubble-1366x768-full.png` — 1366 全页基线，初始冒泡 trace，变量区展开导致整页高度远超 768。
2. `dijkstra-1440x900-full.png` — Dijkstra 帧 28/46 全页基线，变量/调用栈展开。
3. `kosaraju-1440x900-full.png` — Kosaraju 帧 28/60 全页基线。
4. `bst-1440x900-full.png` — BST 帧 6/8 全页基线。
5. `avl-1440x900-full.png` — AVL 帧 13/15 全页基线，右旋完成。

优化后 `docs/ux04/after/`：

1. `full-1366x768.png` — 1366×768 整页截图，Dijkstra 帧 28/46，`scrollHeight = 768`，顶部导航、目录、图、距离表/优先队列、右侧讲解、播放控制、代码折叠条、高级面板入口全在首屏。
2. `dijkstra-1366x768.png` — 1366 下 Dijkstra 图与状态数据列。
3. `kosaraju-1366x768.png` — 1366 下 Kosaraju 图、DFS 栈、完成顺序、分量。
4. `kahn-1366x768.png` — 1366 下 Kahn 图、入度表、候选队列。
5. `bst-1366x768.png` — 1366 下 BST 树容器横向滚动与右栏指标。
6. `avl-rotation-1366x768.png` — 1366 下 AVL 右旋完成帧。
7. `guide-open-1366x768.png` — 导学展开布局。
8. `dijkstra-1440x900.png` — 与 before 同帧的 1440 对照，距离表 7 行全部可见。
9. `kosaraju-1440x900.png` — 与 before 同帧的 1440 对照。
10. `kahn-1440x900.png` — G 节点修复后的 1440 布局。
11. `bst-1440x900.png` — 7 节点全部可见。
12. `avl-1440x900.png` — 右旋完成帧，与 before 同帧。
13. `dijkstra-1920x1080.png` — 1920 一屏验证。

## 7. 已知限制

- 1366×768 的 7 节点 BST 使用容器内横向滚动，而不是压缩到不可读字号；所有节点均可达。
- 1366×768 的 Dijkstra 距离表使用容器内纵向滚动；当前步骤关键值同时由上方状态与图形显示。
- 导学展开时属于正常阅读流，可能把动画区推到首屏下方；点击“开始看动画”会立即收起导学并聚焦播放控制。
- 1024 宽按需求不使用一屏固定壳层，允许整页纵向滚动；页面无横向溢出。
- 没有使用 `overflow: hidden` 掩盖整页问题；桌面断言的 `scrollHeight` 严格等于视口高度。

## 8. Git

- 分支：`feat/ux04-desktop-viewport`，创建自 UX-03 提交 `0e34933`。
- 提交信息：`feat(ux04): fit desktop learning lab into one viewport`。
- 推送：`origin feat/ux04-desktop-viewport`；不合并、不修改 `main`。
- 历史 `docs/**` 截图由全量视觉 E2E 重新生成后已还原；提交只包含 UX-04 代码、测试、报告与 `docs/ux04` 证据。
