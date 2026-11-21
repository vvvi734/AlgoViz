# AlgoViz UI-03 — 底部可折叠代码面板

## 范围

UI-03 只调整学习工作区的**代码编辑器位置与折叠交互**，建立在 UI-02 的“左侧算法可视化 / 右侧同步讲解”双栏与 UI-01 可折叠算法目录之上：

- 代码面板从右栏移出，横跨主学习区域，位于双栏下方。
- 默认折叠，只显示标题栏；标题栏保留语言切换和主运行按钮。
- 点击标题栏“展开代码/收起代码”切换；展开后 Monaco 可编辑、可滚动。
- 折叠时不卸载 Monaco，草稿、撤销历史、光标/滚动位置和播放帧都保留。

## 分支

- 分支：`ui03/code-panel`
- 基线：`cfffaab`（UI-02 报告提交，包含 Dijkstra + UI-01 + UI-02）
- 本次实现与截图、报告在同一个 UI-03 提交中；不合并、不推送 `main`，不使用强制推送。

## 实现摘要

### 新增 `CodeDock`

`src/features/lab/CodeDock.tsx` 是新的全宽代码容器：

- `data-expanded`、`aria-expanded`、`aria-controls` 表达折叠状态。
- 折叠 body 使用 `inert` + `aria-hidden`，不进入焦点顺序/读屏；展开恢复。
- body 上监听 Escape，收起后焦点回到切换按钮。
- 标题栏持有唯一的 `#code-lang` 语言选择器和 `run-btn`，因此折叠时仍可切换语言、直接运行。
- 状态文本 `code-dock-status` 使用 `aria-live`，折叠时也能看到运行/错误反馈。
- `CodeEditorPanel` 以 `embedded` 模式常驻；折叠仅改变可见性，不销毁 Monaco。

### 编辑器与 CSS

- `CodeEditorPanel` 新增 `embedded`/`showRun`：嵌入模式不再渲染外层 panel、标题和重复的语言选择器/运行按钮；非嵌入调用保持原结构。
- `LabView` 把 `CodeDock` 放在 `.lab-primary` 之后、`WorkspaceTabs` 之前，天然横跨两栏。
- `ui03.css` 负责折叠过渡、展开高度（桌面 `clamp(300px,34vh,400px)`）、移动端高度、reduced-motion 和标题栏响应式动作区。
- 删除 `ui02.css` 中已不再使用的 `.lab-editor-dock` 规则。

### Monaco 初始化竞态修复

因为 Monaco 现在在页面加载时就常驻挂载，若用户在异步加载完成前切换算法/语言，旧实现可能把旧源码写进模型并停止同步。`MonacoEditor` 现在：

- 创建模型时读取最新 `value`/`language` 引用；
- 用 `ready` 状态触发语言、值、主题、执行行高亮的再同步。

这保证展开后不会出现旧算法源码或空白编辑器，也补了专门的 E2E 回归用例。

## 验证结果

| 门禁 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过 |
| `npm test` | 69 个文件 / 558 个测试通过 |
| `npm run build` | 通过（`✓ built in 21.00s`） |
| UI-03 专项 E2E | 7/7 通过（含折叠、草稿、Dijkstra、折叠标题栏运行、390 键盘、1366、Monaco 初始化竞态） |
| 完整 Playwright E2E | 74/74 通过（4.0 分钟，端口 4191） |
| 真实截图 | 3 张，见下 |

完整回归覆盖：lab、mentor、MERGE-01、packs、session、Stage 7A–7F、UI-01、UI-02、UI-03 及全部 visual spec；Dijkstra 的图、距离表、优先队列、讲解和回退均保持正常。

## 截图

截图由 `e2e/ui03.visual.spec.ts` 在真实 Chromium/Edge 页面生成：

- `docs/ui03/code-dock-collapsed-1440-light.png` — 1440px，默认折叠，代码面板标题栏位于双栏下方。
- `docs/ui03/code-dock-expanded-1440-light.png` — 1440px，展开 Monaco，当前执行行高亮。
- `docs/ui03/code-dock-expanded-390-light.png` — 390px，手机端展开，无页面级横向溢出。

## 本地预览

- 地址：<http://127.0.0.1:5183/>
- 目录：`D:\Desktop\algolens_github_starter\algolens-ui03`

```powershell
Set-Location -LiteralPath 'D:\Desktop\algolens_github_starter\algolens-ui03'
npm run preview -- --host 127.0.0.1 --port 5183 --strictPort
```

端口 5183 为本 UI-03 worktree 独立预览，与旧集成预览 5180、UI-02 预览 5182 和 Playwright 的 4191 分开。

## 边界

- 未修改左侧算法目录结构、算法注册、Trace Schema、Python Worker、AI/MCP/知识包。
- 未移动 Monaco 到其他位置；仅把现有编辑器嵌入新底部 dock。
- 未新增算法、未开始 UI-04、未做整页一屏高度优化。
- 未修改或合并 `main`；历史 UI-02/Stage 7 截图已从本轮测试产生的覆盖中恢复。
