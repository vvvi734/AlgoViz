# UI-02 — 左侧算法动画，右侧同步逐步讲解

## 分支与基线

- 分支：`ui02/lab-layout`
- 基线：`integrate/stage7f-ui01`，HEAD `b9ecfc363c5ea0e135c872ba6e43e1788a29ebb4`（短哈希 `b9ecfc3`）
- UI-02 实现提交：`2f900e6` (`feat(ui-02): split lab into animation stage and synchronized lesson rail`)
- 未修改或推送 `main`。

## 修改概要

- 学习主区域改为两栏：左栏为 `VisualStage` 算法动画、图专属结构、播放控制与时间轴；右栏为 `LessonPanel variant="rail"` 的同步课程讲解。
- 右栏把“当前步骤”置顶，展示当前解释、方法说明、提示、同帧消息和变量；课程标题、帧号、版本、完整步骤、复杂度与常见错误仍可访问。
- 课程严格使用现有 Trace 帧与 `stepIndexForEvent()` 同步；没有第二套播放器、独立索引或硬编码讲解。
- 没有课程内容的算法显示 `lesson-no-lesson` 空态，不伪造步骤；当前帧无课程映射时显示统一的回退标题。
- Monaco 代码编辑器仍位于右栏内部，通过 `.lab-editor-dock` 接入；没有移动到页面底部（留给 UI-03）。
- `WorkspaceTabs` 收敛为 `state | mentor | tools`，避免出现第二份课程面板；原 `lesson` 页签的测试同步更新。
- 新增 `src/styles/ui02.css`：宽屏 `1.55fr / 0.95fr` 两列，右栏 sticky + 内部滚动；`≤1279px` 单列堆叠；`≤760px` 手机细化；所有列 `min-width: 0`，无页面级横向溢出。
- 算法注册、Trace Schema、Python 执行、UI-01 侧栏组件均未改动。

## 测试结果

| 门禁 | 结果 |
| --- | --- |
| `npm test` | 68 files / **557 tests passed** |
| `npm run typecheck` | passed |
| `npm run mcp:typecheck` | passed |
| `npm run ai:typecheck` | passed |
| `npm run build` | passed，`✓ built in 24.18s` |
| `PLAYWRIGHT_PORT=4191 npm run test:e2e` | **66/66 passed**（4.0m） |

新增 UI-02 覆盖：

- `e2e/ui02.spec.ts`（6 条）：1440 两栏与首屏讲解、Dijkstra 松弛/回退/过期条目/完成路径同步、侧栏折叠不影响播放头、BFS/DFS/树/链表回归、无课程空态、1366/1024/390 响应式。
- `e2e/ui02.visual.spec.ts`（1 条）：1440/1366/1024/390 × Light/Dark 共 8 张截图，外加 1440 首屏、完成态和无课程空态。
- `LessonPanel.test.tsx`：新增 3 条 rail 测试（当前帧置顶、消息/变量同帧、无帧步骤禁用）。
- `stage7a.spec.ts` 按新布局重写；其余 E2E 仅移除已不存在的 `lesson` workspace 页签入口。

## 截图位置

目录：`docs/ui02/`

- `dijkstra-relax-1440-light.png` / `dijkstra-relax-1440-dark.png`
- `dijkstra-relax-1366-light.png` / `dijkstra-relax-1366-dark.png`
- `dijkstra-relax-1024-light.png` / `dijkstra-relax-1024-dark.png`（单列，fullPage）
- `dijkstra-relax-390-light.png` / `dijkstra-relax-390-dark.png`（手机，fullPage）
- `dijkstra-relax-1440-light-firstscreen.png`
- `dijkstra-done-1440-light-firstscreen.png`
- `dijkstra-done-1440-light.png`
- `no-course-rail-1440-light-firstscreen.png`

桌面截图使用 viewport，避免右栏内部滚动在 fullPage 中留下空白；1024/390 保留 fullPage 以展示完整堆叠顺序。

## 已知取舍

- 宽屏右栏采用 `sticky + max-height: calc(100vh - 24px) + overflow-y: auto`，保证动画与当前讲解同屏；Monaco 位于右栏内部下方，需要滚动右栏才能看到。编辑器没有移到页面底部，符合本阶段边界，最终一屏高度适配留给 UI-04。
- 无课程算法切换时，旧 Trace 会在新异步运行完成前短暂保留；这是既有 `selectAlgo` 控制器行为，本次未改 Python/Trace/Schema。右栏在切换后立即进入空态，不会显示旧课程步骤。

## 本地预览

在 `D:\Desktop\algolens_github_starter\algolens-ui02` 执行：

```powershell
npm run build
npm run preview -- --port 5182 --strictPort --host 127.0.0.1
```

地址：`http://127.0.0.1:5182/`

该端口独立于旧的集成分支预览 `127.0.0.1:5180`。
