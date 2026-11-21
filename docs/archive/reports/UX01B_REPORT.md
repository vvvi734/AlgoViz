# UX-01B — 顶部算法导学排版与视觉层级

分支：`feat/ux01b-guide-hierarchy`  
基线：UX-01 提交 `715acc30b0ef7a31e96a0cde2a4715bfee00a21a`  
版本：`0.16.1-ux01b`

## 1. 范围

本批只优化顶部「算法导学」的阅读顺序、内容层级、静态示意图与首屏高度。

- 不进入 UX-02：右侧逐帧讲解未改。
- 不改左侧目录、Trace、算法数量、整页网格或 Python 执行。
- 不增加新算法或新的动态播放器。
- 保留 UX-01 的按算法折叠偏好、键盘操作和中英双语。

## 2. 交付内容

### 2.1 三层阅读顺序

默认展开时只显示：

1. **一句话理解**：算法名、要解决的问题、高对比 `coreHeadline` 与核心说明。
2. **算法整体流程**：3～5 个编号阶段，每阶段只保留“阶段名 + 一句话”。
3. **记忆重点**：一条加粗短句，不替代详细适用条件。

详细内容统一移入 `guide-details`，默认关闭；展开后完整保留：

- 完整执行步骤。
- 必要前置知识。
- 复杂度解释、适用条件与关键限制。
- 常见错误。
- 内容来源。

### 2.2 三算法各自的阶段结构

| 算法 | 核心思想 | 阶段 |
| --- | --- | --- |
| Dijkstra | 贪心选最近 + 松弛出边 | 初始化距离表 → 贪心选最近 → 松弛出边 → 重复并回退路径 |
| Kahn | 入度归零 + 队列推进 | 统计入度 → 零入度入队 → 出队删边减度 → 归零再入队并查环 |
| Kosaraju | 两遍 DFS + 完成顺序 + 反向图 | 原图第一遍 DFS → 记录完成顺序 → 构造转置图 → 按逆序第二遍 DFS → 一棵 DFS 树 = 一个 SCC |

没有把三个算法机械套进同一套四步文案。

### 2.3 课程派生与安全回退

- 课程本身恰好有 3～5 个真实步骤：转换为阶段条，标题去掉课程自带圈号，说明取首句。
- 课程有 6 步及以上：不强行分组，概览只显示一条紧凑回退说明；完整步骤仍保留在详情区。
- 无课程算法：只显示目录已确认的简介、时间/空间和“不会补写”的说明，不生成阶段、详情大卡或记忆口诀。

### 2.4 静态示意图

- 保留 Dijkstra、Kahn、Kosaraju 的紧凑静态图解，放在核心思想右侧，仅承担建立直觉的作用。
- SVG 最大高度 138px；不再占用旧版大半屏高度。
- 图解内部标签已跟随中英切换，不再出现英文界面中的中文 SVG 文案。
- 没有创建第二套播放器。

### 2.5 折叠与播放

- 标题栏 `guide-toggle` 仍是 `aria-expanded` / `aria-controls` 原生按钮。
- 新增底部“开始看动画”只调用折叠回调，不触碰 Trace。
- `LabView` 以算法 id 作为 `AlgorithmGuide` 的 key，切换算法时重置详情展开状态。
- E2E 在 Dijkstra 第 11/46 帧收起再展开，帧号保持 `11 / 46`。

## 3. 高度与首屏结果

1440×900、Light、导学默认展开：

| 算法 | 导学高度 | `lab-workbench` 顶部 | 首屏可见动画 |
| --- | ---: | ---: | --- |
| Dijkstra | 480.7px | 744.8px | 约 155px |
| Kahn | 513.4px | 777.4px | 约 123px |
| Kosaraju | 513.4px | 777.4px | 约 123px |

优化前：导学从标题栏下方一直延伸到 900px 视口之外，算法动画完全不可见。优化后三个重点算法的动画区域顶部都进入首屏。

390px 手机端导学可正常单栏阅读与滚动，页面无横向溢出；手机端不要求动画同时出现在首屏。

## 4. 证据

优化前（由 UX-01 `715acc3` 的旧构建捕获）：

- `docs/ux01b/before/dijkstra-expanded-1440-light.png`
- `docs/ux01b/before/kahn-expanded-1440-light.png`
- `docs/ux01b/before/kosaraju-expanded-1440-light.png`
- `docs/ux01b/before/kosaraju-expanded-390-light.png`

优化后（本分支最终构建）：

- `docs/ux01b/after/dijkstra-expanded-1440-light.png`
- `docs/ux01b/after/dijkstra-details-1440-light.png`
- `docs/ux01b/after/dijkstra-collapsed-1440-light.png`
- `docs/ux01b/after/kahn-expanded-1440-light.png`
- `docs/ux01b/after/kosaraju-expanded-1440-light.png`
- `docs/ux01b/after/kosaraju-expanded-1440-dark.png`
- `docs/ux01b/after/kosaraju-expanded-390-light.png`

## 5. 验收对照

| 验收项 | 结果 |
| --- | --- |
| 核心思想第一眼可见 | ✅ 25px 主色 `coreHeadline`，位于问题与阶段条之间 |
| 主要步骤简短清楚 | ✅ 每算法 4～5 个阶段，每阶段一句话 |
| 完整详细内容仍可找到 | ✅ 详情区保留步骤、前置、复杂度、条件、错误、来源 |
| 导学展开高度明显降低 | ✅ 1440 下 481～513px，动画顶部进入 900px 首屏 |
| 下方动画更早出现 | ✅ `lab-workbench` 顶部 745～777px |
| 展开/收起不影响播放 | ✅ 第 11/46 帧收起再展开仍为 11/46 |
| 中英 | ✅ 标题、阶段、记忆、详情与 SVG 标签均切换 |
| Light / Dark | ✅ 两种主题均验证，Dark 截图已保存 |
| 键盘 | ✅ `guide-toggle` Enter/Space 可折叠/展开，详情按钮原生可聚焦 |
| 390 手机端 | ✅ 单栏、无横向溢出、详情可展开 |
| 目录安全回退 | ✅ 只显示简介/复杂度/安全说明，无空阶段卡 |
| 长课程 | ✅ 6 步以上不生成虚假阶段，只显示紧凑回退说明 |

## 6. 测试与门禁

- `npm run typecheck`：通过。
- 单测：85 个文件、694 tests 全部通过。
- 真实浏览器 E2E（Playwright + Microsoft Edge + 真实 Pyodide）：97/97 通过，用时 6.2 分钟。
  - `e2e/ux01b.spec.ts` 2/2：桌面三层/详情/高度/折叠帧保持/键盘/三算法/偏好/英文/Dark/目录回退；390 展开/详情/收起。
- Build：1433 modules；`index-BSf2Dpt6.js` 1,279.25 kB / gzip 359.41 kB；`index-C3WZL0dF.css` 127.59 kB / gzip 22.23 kB。
- 全量 E2E 运行会重新生成旧阶段截图，已在提交前还原，只保留 `docs/ux01b/` 的本批证据。

## 7. 已知边界

- 原创完整导学仍只有 Dijkstra、Kahn、Kosaraju 三个；其余课程只能按真实步骤派生。
- 阶段条是教学归纳，不改变下方 Python Trace 的帧顺序或算法语义。
- 静态图解仍是示意，不是按当前输入实时计算的图；真实状态以下方动画为准。
- UX-01B 完成后停止，未开始 UX-02。
