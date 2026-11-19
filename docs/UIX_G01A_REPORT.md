# UIX-G01A — Prim / Kruskal 主画布可读性

## 1. 范围与分支

- 分支：`feat/uix-g01a-mst-readability`
- 基点：`2f57c14`（UIX-V02 最新提交，版本 `0.27.2-uix02`）
- 实现提交：`39a8498`（`feat(uix-g01a): enlarge MST canvases and fit their viewports`）
- 本轮版本：`0.27.3-uixg01a`
- 只改 Prim / Kruskal 的 MST 主画布与局部侧栏比例：不新增算法，不改真实 Python Trace / 帧语义 / 课程内容，不改整站布局，不碰阶乘、斐波那契、其他图算法、排序柱高、导学默认展开、VisualGuide 结构或 AI/MCP。
- 从 UIX-V02 最新提交独立切分支，未覆盖 `feat/uix-v02-visual-guide` 或其他 Agent 的工作。

## 2. 实现

### 2.1 图形几何

- 共享 `layoutGraph` / `trimEdge` 增加**可选** `radius` 参数，默认仍是 23，BFS / DFS / Dijkstra / AOE / SCC 几何不变；只有 Prim / Kruskal 传入 `MST_NODE_RADIUS = 29`（直径 58 个 SVG 单位）。
- `mstModel.ts` 新增 `MST_LABEL_GUTTER = 16` 与纯函数 `computeMstViewBox(model)`：从已构建的视觉模型计算内容边界，裁掉原固定 580×380 画布的多余空白；底部额外保留 16 单位，避免 Kruskal 的 `↳root` 和 Prim 的 `+` 标签被裁切。空图仍回退 580×380。
- `computeMstViewBox` 只依赖视觉模型，不读取 Trace 状态；同一图在不同帧的坐标与 viewBox 稳定，不会因放大而漂移。
- 新增确定性边权避让：权值默认留在边中点；若中点矩形碰到任一节点（官方 C–D 边靠近 E），依次尝试沿边 ±26、垂直 ±22 的候选点。候选只由图模型决定，拖动时间轴不会跳字。

### 2.2 画布与侧栏

- `MSTVisuals.tsx` 两个 SVG 改用内容自适应 `viewBox`；图例从小标题下的一整行并入图卡 header；删除重复的“带权图 / 带权无向图与生成树”标题。
- Prim 的画布内长 `mst-hint` 删除，`VisualStage.tsx` 同步移除 `PRIM_HINT_KEYS` 与对应 prop；右侧 Teaching Course 继续负责“为什么选 / 为什么跳过”，不增加第二说明面板。
- 新增 `src/styles/g01a.css`，在 `uix02.css` 之后引入：
  - 桌面图卡 padding 8px；图例 8.5px、指示线 14px；header 最小高 22px。
  - 边权 12.5px、节点标签 13.5px、START/ROOT 9.5px、新节点 `+` 15px。
  - `min-width: 981px` 使用 `minmax(0, 1fr) 210px`、gap 8px；980px 以下保持单列。
  - `max-width: 560px` 让 SVG 完全贴合卡片，消除移动端 10px 横向滚动。
- `package.json` / `package-lock.json` 版本改为 `0.27.3-uixg01a`。

## 3. 改前 / 改后像素测量

基线：`docs/uix-g01a/before/measurements.json`（12 条，Prim 2 态 + Kruskal 3 态 × 3 尺寸）。
复测：`docs/uix-g01a/after/measurements.json`（同结构、同代表帧）。

| 页面 / 尺寸 | 指标 | Before | After | 变化 |
| --- | --- | ---: | ---: | ---: |
| Prim 1440×900 | 节点实际直径 | 31.11 px | **46.94 px** | +50.9% |
| Prim 1440×900 | 边权文字高度 | 8 px | **12 px** | +50% |
| Prim 1440×900 | 节点标签高度 | 10 px | **13 px** | +30% |
| Prim 1366×768 | 节点实际直径 | 20.27 px | **42.01 px** | +107.3% |
| Prim 1366×768 | 边权文字高度 | 5 px | **10 px** | +100% |
| Prim 1366×768 | 节点标签高度 | 6 px | **11 px** | +83.3% |
| Prim 390×844 | 节点实际直径 | 23.79 px | **30.99 px** | +30.3% |
| Prim 390×844 | 边权文字高度 | 6 px | **8 px** | +33.3% |
| Prim 390×844 | 节点标签高度 | 8 px | **9 px** | +12.5% |
| Kruskal 1440×900 | 节点实际直径 | 31.11 px | **46.94 px** | +50.9% |
| Kruskal 1440×900 | 边权文字高度 | 8 px | **12 px** | +50% |
| Kruskal 1366×768 | 节点实际直径 | 20.10–20.56 px | **42.01 px** | 约 +105% |
| Kruskal 1366×768 | 边权文字高度 | 5 px | **10 px** | +100% |
| Kruskal 390×844 | 节点实际直径 | 23.79 px | **30.99 px** | +30.3% |
| Kruskal 390×844 | 边权文字高度 | 6 px | **8 px** | +33.3% |

图形占用与滚动区：

| 尺寸 / 算法 | 图卡宽 Before → After | 图滚动区 Before → After | SVG 缩放 Before → After |
| --- | ---: | ---: | ---: |
| 1440 / Prim | 414.2 → **456.2 px** | 394.2×301.5 → **438.2×334.3 px** | 0.676 → **0.809** |
| 1366 / Prim | 368.3 → **410.4 px** | 348.3×169.5 → **392.4×202.3 px** | 0.441 → **0.724** |
| 390 / Prim | 308 → **308 px** | 288×198.5 → **290×144.7 px** | 0.517 → **0.534** |
| 1440 / Kruskal | 414.2 → **456.2 px** | 394.2×300.1 → **438.2×332.9 px** | 0.676 → **0.809** |
| 1366 / Kruskal | 368.3 → **410.4 px** | 348.3×168.1 → **392.4×200.9 px** | 0.437 → **0.724** |
| 390 / Kruskal | 308 → **308 px** | 288×198.5 → **290×132.9 px** | 0.517 → **0.534** |

- 桌面右栏由 250px 收到 210px，gap 8px；图卡宽度分别增加 +42.0 / +42.1px，全部让给图形，不压缩表格字号。
- 390 的 SVG 高度变小是因为内容自适应裁掉了上下空白，不是图形变小；节点直径仍从 23.79 提升到 30.99px，且图滚动区由 288→290px，完全消除原有的 10px 横向滚动。
- 390 stage 高度：Prim 814.8 / 867.7 → **679.5 / 732.4 px**；Kruskal 999.3 / 1058.5 → **889.6 / 948.9 px**。画布减负后页面更短，但节点更大。

### 3.1 裁切、重叠与溢出

- 12 条复测记录均为：节点越界 **0**、边权越界 **0**、权值互相重叠 **0**、节点-权值重叠 **0**。
- 页面 `scrollWidth == clientWidth`（1440 / 1366 / 390 全部精确相等）。
- 边权与节点之间加入避让后，官方 C–D 权值不再压在 E 节点上；权值仍可辨识所属边。
- 1440 / 1366 的 Prim 优先队列字号 10.5px、行高 28px；Kruskal 排序表字号 10.5px、行高 28px、状态 8.5px；并查集 parent 表 9.5px、行高 18.4px，均与改前一致，没有为放大图形牺牲表格。
- Kruskal 1366 的右栏仍是既有内部滚动（clientHeight / scrollHeight 约 270 / 445）：排序表 6 行与当前边完整可见，Union-Find 面板需在右栏内向下滚动。此为改前既有行为，本轮未新增页面级滚动，也未删除任一表行。

## 4. 代表截图

改前 / 改后各 30 张（Prim / Kruskal × 3 尺寸 × 代表态 × 整页/舞台）：

- `docs/uix-g01a/before/`
- `docs/uix-g01a/after/`

Prim（当前选边 + 完成）：

- `docs/uix-g01a/after/prim-select-1440x900-stage.png`
- `docs/uix-g01a/after/prim-done-1440x900-stage.png`
- `docs/uix-g01a/after/prim-select-1366x768-stage.png`
- `docs/uix-g01a/after/prim-done-390x844.png`

Kruskal（并查集 / 拒绝边 + 完成）：

- `docs/uix-g01a/after/kruskal-union-1440x900-stage.png`
- `docs/uix-g01a/after/kruskal-reject-1440x900-stage.png`
- `docs/uix-g01a/after/kruskal-done-1440x900-stage.png`
- `docs/uix-g01a/after/kruskal-reject-1366x768-stage.png`
- `docs/uix-g01a/after/kruskal-done-390x844.png`

## 5. 验证

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过 |
| `npm run build` | 通过：`tsc -b` + Vite，1487 modules；`index-B8lGvAui.js` 1,933.55 kB（gzip 542.93 kB）、`index-CsnOdI-Y.css` 229.93 kB（gzip 37.37 kB）；后续避让修订后 `index-DZFFGCJC.js` 1,934.00 kB、`index-CshD0CDF.css` 230.03 kB |
| 域层单测 | `graphLayout.test.ts` 12/12 + `mst.test.ts` 7/7 = **19/19**：默认半径 23、MST 显式 29、边裁切、viewBox 内容边界与空图回退 |
| 全量单测 | **888/888 通过**（106 个测试文件，19.67s） |
| 专项 E2E `uix-g01a.spec.ts` | **3/3 通过**：1440 / 1366 / 390 各覆盖 Prim 与 Kruskal；节点直径、权值文字、节点标签、无越界/重叠、无页面横向溢出、排序表/并查集/PQ 可读性、播放/暂停、回退/前进、任意跳帧、右侧讲解 active step 与帧号同步 |
| G2 回归 `g2.spec.ts` | 4/4：真实 heapq、并查集、负权/单点/森林/有向图边界 |
| 布局门禁 `ux04c.spec.ts` | 4/4：BFS / Dijkstra 等非 MST 画布尺寸断言未放宽 |
| 全量 E2E | **156/156 通过**（真实 Edge + 本地 Pyodide；既有 153 条 + 新增专项 3 条，10.9 分钟） |

### 5.1 未改项核对

- `layoutGraph` 默认 `GRAPH_NODE_RADIUS` 仍为 23；BFS / DFS / Dijkstra / AOE / SCC 未传 radius，几何与改前一致。
- 未新增算法入口、课程或 Trace 字段；Prim 仍 21 帧、Kruskal 仍 15 帧，按钮、播放器、`seek` 与课程 step 映射未改。
- 未改阶乘、斐波那契、排序柱高、导学默认展开或 VisualGuide 的 9 个入口。
- 未开发 AI/MCP、知识包、阶段跳转或第二套播放器。

## 6. 已知边界

- 390×844 的节点 30.99px，仍低于桌面 42–46px 目标。原因是移动端卡片仅 290px 宽、内容宽约 541 单位；要在 390 保持全部节点可见，当前上限约 31px。继续放大需要横向滚动或改变图布局，会与“无裁切、无页面横向溢出”冲突，本轮选择整体清晰优先。
- 1366×768 的 Kruskal 侧栏高度不足以同时完整展示“排序表 + 并查集表”，保留既有局部滚动；排序表 6 行、当前边和拒绝/接受状态仍在首屏，Union 表可向下滚动查看。
- 390 的 `stage` 截图由元素自身边界裁切，左侧标题有 full-bleed 溢出；这是截图定位方式造成的，不是页面内容被裁。整页截图 `*-390x844.png` 显示完整标题与页面，且 `scrollWidth == clientWidth`。
