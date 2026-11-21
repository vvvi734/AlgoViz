# UIX-V02 — 算法动画区减负与右栏视觉说明

## 1. 范围与分支

- 分支：`feat/uix-v02-visual-guide`
- 基点：`8134897`（UIX-V01 交付记录）
- 版本：`0.27.2-uix02`
- 本轮只做 UI / 信息架构：不新增算法、不改课程数量、不碰 AI / MCP / 知识包、不改阶乘与斐波那契递归。
- 未创建独立 worktree，使用同一干净工作副本切独立分支；避免新 worktree 缺 `node_modules` 无法构建。分支与 `main`、`feat/uix-v01-array-canvas` 隔离。

## 2. 信息架构

右栏现在是两层，仍在同一列、同一播放器与课程系统内：

1. `VisualGuide`：位于 Teaching Course 上方，只回答“这块画面怎么读”。
   - `先看`：当前帧第一落点。
   - `符号`：颜色、指针、边/点的含义。
   - `分区`：图、表、结果条各自是什么。
   - `关键`：一条本算法观察提示。
   - 每个算法固定 3 行 + 1 句，不写“为什么”、不复述当前步骤标题。
2. `Teaching Course`：保持原有四段式讲解与步骤导航，负责“这一步做什么、为什么、发生什么变化”。

顶部 `AlgorithmGuide` 继续负责整体思想、阶段与记忆点。三层不互相复读。

`VisualGuide` 覆盖 9 个入口：`huffman`、`inorder`、`floyd-warshall`、`critical-path`、`dijkstra`、`kruskal`、`scc`、`merge`、`hash-chain`。其他算法不渲染该面板，不留空白。

## 3. 画布减法

### 哈夫曼树与编码

- 树/Huffman 预设选择器从画布下方移动到 `stage-control-strip`，画布只保留树。
- 删除树面板标题与“节点固定 88×58 · 画布内部滚动”说明。
- 删除优先队列原始 `heapq` 数组长句；保留堆条目、排序、当前合并/编码状态与“只剩根”提示。
- 编码结果改为桌面三列 × 两行、窄屏单列六行；六行始终存在，不因压缩而裁切。
- 删除编码头部重复的 WPL / 总位数（顶栏已有），只保留定长对比；删除 done 帧两段原理复述。
- 保留单字符 warning、当前路径/前缀与必要指标。

### 二叉树遍历

- 删除 `tree-legend`（当前/已访问/递归路径三色图例），由右栏 `符号` 承担。
- 遍历模式选择器上移并压成一行胶囊按钮；模式名称与顺序仍完整。
- 树画布使用剩余高度；保留递归路径、访问序列、节点访问序号、操作标签与移动端 `tree-scroll-hint`。

### Floyd-Warshall

- 删除画布内 `FLOYD-WARSHALL` kicker、标题与长 hint。
- 头部压缩为单行 `g1-toolbar`：当前操作 + `k` + 有值时的 `i→j` + 有向图徽标。
- 删除矩阵面板的重复说明，只留“距离矩阵 dist”。
- 图与矩阵仍是同一帧、同一真实模型；当前条、更新单元格、旧值/∞ 语义不变。

### AOE 关键路径

- 删除图卡五色图例与图卡底部长 `hint`。
- 删除侧栏四个面板标题下的长解释句；阶段条本身已说明当前阶段。
- 收紧事件表、活动表、阶段条与当前活动条；保留事件 6 行、活动 7 行、`data-ve/vl/slack/critical` 与关键路径结果。
- `mst-head` 保留必要指标，但不再占一整块标题区。

### 第二优先级

- `dijkstra`：隐藏画布内 `graph-current-hint` 与滚动提示；右栏说明承担符号解释。
- `kruskal`：删除图卡长 `hint`，头部不再重复大标题。
- `scc`：删除长 `hint`，保留完成序/第二遍/分量面板。
- `merge`、`hash-chain`：只接入右栏说明，不改画布数据。

## 4. 像素结果

基线：`docs/uix-v02/before/measurements.json`（12 条，4 算法 × 3 尺寸）。
复测：`docs/uix-v02/after/measurements.json`（同结构、同代表帧）。

| 页面 / 尺寸 | 指标 | Before | After |
| --- | --- | ---: | ---: |
| Huffman 1440×900 | 树面板高 | 156.3 px | **306.1 px** |
| Huffman 1440×900 | 树滚动区高 | 130.2 px | **304.1 px** |
| Huffman 1440×900 | 编码面板高 | 212.7 px | **80 px** |
| Huffman 1366×768 | 树面板高 | 150 px | **188.1 px** |
| Huffman 1366×768 | 树滚动区高 | 123.8 px | **186.1 px** |
| Huffman 1366×768 | 编码面板高 | 212.7 px | **66 px** |
| Huffman 390×844 | 树宽 / 队列 | 179 / 122 px 并排 | **树 308 px，队列下置** |
| 二叉树 1440×900 | 树滚动区高 | 268 px | **376.2 px** |
| 二叉树 1366×768 | 树滚动区高 | 204.2 px | **244.2 px** |
| Floyd 1440×900 | 头部高 | 129.4 px | **26 px** |
| Floyd 1366×768 | 头部高 | 99.4 px | **26 px** |
| AOE 1440×900 | 图例高 | 45.8 px | **0（删除）** |
| AOE 390×844 | stage 高 | 1250 px | **861.2 px** |

长句块统计（`.stage p / small / .muted` 中 >24 字）：

| 页面 | Before | After |
| --- | ---: | ---: |
| Huffman | 0 | 0 |
| 二叉树 | 0 | 0 |
| Floyd | 2 | **0** |
| AOE | 5 | **0** |

12 条复测记录均为 `pageOverflowX=false`、`stageOverflowX=false`。右栏 `VisualGuide` 高度 143.1–171.6 px；`guideOrder.beforeLesson=true` 全通过。

## 5. 验证

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过 |
| `VisualGuide.test.tsx` | 11/11：9 个算法、3 行 + 1 关键句、非目标算法无空面板、不含 Teaching Course 文案 |
| `e2e/uix02.spec.ts` | 4/4：说明区顺序/高度、画布无长句、Huffman 六行不越界、树/Floyd/AOE 去重、390 堆叠与无横向溢出 |
| `e2e/t4.spec.ts` | 2/2：真实 heapq、六行码表不裁切、WPL/总位数 |
| `e2e/g1.spec.ts` | 3/3：Floyd 当前三元更新、负环、Bellman-Ford |
| `e2e/g3.spec.ts` | 4/4：Kahn 与 AOE 事件/活动/关键路径 |
| `e2e/stage7d.spec.ts` | 6/6：三种遍历、模式切换、移动端 scroll hint |
| 目标回归合计 | **15/15 通过** |
| 布局门禁 `uix01` + `ux04c` | **7/7 通过**：归并主数组 1440 高 252.2px；1366 插入排序 footer 收回舞台；BFS 1366 队列底部 565.4px；Dijkstra 1366 SVG 222.75px；未放宽既有尺寸断言 |
| 全量 E2E | **153/153 通过**（真实 Edge + 本地 Pyodide，约 5.6 分钟；含播放、回退、跳帧、主题、移动端、知识包、AI mentor） |

## 6. 已知边界

- 哈夫曼节点仍固定 88×58，不为塞满一屏缩小；最终树 522px 高，桌面仍通过树画布内部滚动查看完整层级。本轮增加的是可视高度与宽度，不是把六个叶节点压成不可读的小字。
- 1366×768 下右栏总内容高于 499px，`Teaching Course` 尾部需要右栏内部滚动；当前步骤、为什么、变化仍在首屏可见，页面本身不产生滚动灾难。
- Floyd 在 1440 下删除 129px 头部后，画布底部保留空白；矩阵/图卡不再被拉伸成空白框。若后续要继续填充，可单独做矩阵行高或图区缩放，不在本轮范围。
- 所有播放、回退、跳帧、课程帧映射和 Trace 语义未改；只改了 DOM 结构与样式。

## 7. 截图

前后对比位于：

- `docs/uix-v02/before/`：24 张（4 页 × 3 尺寸 × 整页/visual）
- `docs/uix-v02/after/`：24 张（同结构）

代表文件：

- `huffman-final-1440x900.png`
- `binary-tree-inorder-1440x900.png`
- `floyd-warshall-k-1440x900.png`
- `aoe-critical-path-1440x900.png`
- `huffman-final-1366x768.png`
- `aoe-critical-path-390x844.png`
