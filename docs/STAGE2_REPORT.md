# AlgoLens Stage 2 开发总结

**阶段目标**：Monaco Editor 专业编辑器 + Python 同步调试体验（代码高亮、变量/动画同步、错误诊断、本地代码保存、真实浏览器验证）。

**提交基线**：基于 `7487130`（Stage 1）。本阶段提交见文末 Git 状态。

---

## A. 完成情况总览

| # | 验收条件 | 状态 |
|---|---|---|
| 1 | Monaco 已替换主要代码编辑器中的 textarea | ✅ 完成 |
| 2 | Python 语法高亮、行号、缩进正常 | ✅ 完成 |
| 3 | Python 冒泡排序运行后，Monaco 高亮真实 Trace 对应代码行 | ✅ 完成（E2E 验证） |
| 4 | 时间轴前进/回退/跳转同步代码高亮、变量、数组、讲解 | ✅ 完成 |
| 5 | Python 错误显示真实错误信息，位置可靠时显示 Monaco Marker | ✅ 完成（E2E 验证 squiggle 出现/清除） |
| 6 | 用户代码自动保存并在刷新后恢复 | ✅ 完成（E2E 验证） |
| 7 | 不同算法草稿互不覆盖 | ✅ 完成（单测验证算法×语言隔离） |
| 8 | 修改代码后旧 Trace 不错误映射到新源码 | ✅ 完成（`traceStale` + 单测验证） |
| 9 | Light / Dark / System 三种主题正常 | ✅ 完成（E2E 验证，编辑器不重建） |
| 10 | 原有 12 算法与 112 项基线测试无重大回归 | ✅ 完成（133 项单测全绿） |
| 11 | typecheck 与生产构建成功 | ✅ 完成 |
| 12 | 真实浏览器验证完成 | ✅ 完成（Microsoft Edge 4/4 通过） |

---

## B. 实际修改文件

**新增**

| 文件 | 用途 |
| --- | --- |
| `src/runtime/monaco/loader.ts` | 懒加载入口（`loadMonaco`）、语言映射、测试环境开关 |
| `src/runtime/monaco/monaco-setup.ts` | 动态加载 `monaco-editor` + 配置本地 Worker（无 CDN） |
| `src/runtime/monaco/themes.ts` | 从 CSS 变量读取配色，定义/应用 `algolens` 主题 |
| `src/features/lab/MonacoEditor.tsx` | 受控 Monaco 封装：单实例、Decoration 高亮、Marker、回退 textarea |
| `src/domain/trace/diagnostic.ts` | `ExecutionDiagnostic` 类型 + `ExecutionError` + 规范化/格式化 |
| `src/runtime/drafts.ts` | 本地草稿持久化（按算法×语言键，localStorage） |
| `playwright.config.ts` | E2E 配置（`msedge` channel + `vite preview` webServer） |
| `e2e/lab.spec.ts` | 4 条真实浏览器 E2E 用例 |
| `src/domain/trace/diagnostic.test.ts`、`src/runtime/drafts.test.ts`、`src/runtime/monaco/loader.test.ts`、`src/features/lab/MonacoEditor.test.tsx`、`src/app/App.stage2.test.tsx` | 新增单测 |

**修改**

| 文件 | 改动 |
| --- | --- |
| `src/runtime/python/pyodide.ts` | 视觉运行器包装 try/except，抽取结构化 `syntax`/`runtime` 诊断（类型/行列/traceback）；`executePython` 抛 `ExecutionError` |
| `src/features/lab/useLabController.ts` | 增加 `diagnostics`、`draftStatus`；`editCode`/`applyCode` 分离；debounce 自动保存 + 切换前 flush + `beforeunload` 兜底；首挂载恢复草稿 |
| `src/features/lab/CodeEditorPanel.tsx` | textarea → `MonacoEditor`；保存状态指示；两步「恢复默认」确认 |
| `src/features/lab/LabView.tsx` | 计算并下传 `highlightLine`（stale 时为 null）与 `noLocationHint` |
| `src/i18n/messages.ts` | 新增保存状态/恢复确认/无定位/编辑器加载等词条 |
| `src/styles/tokens.css` | 新增 `--code-active-line(-gutter)` / `--code-selection` / `--code-line-highlight`（双主题） |
| `src/styles/app.css` | Monaco 容器/执行行装饰/保存状态样式 |
| `src/runtime/python/pyodide.trace.test.ts` | 更新为新 bootstrap 断言 + 诊断结构断言 |
| `vite.config.ts` | `chunkSizeWarningLimit`（Monaco 懒加载大 chunk） |
| `package.json` | 依赖 `monaco-editor`、`@playwright/test`；`test:e2e` 脚本 |
| `.gitignore` | 排除 `test-results/`、`playwright-report/` |

---

## C. Monaco 技术方案

- **集成包**：`monaco-editor@0.57.0`，自写轻量 React 封装（不用 `@monaco-editor/react`），以便完全掌控懒加载、Worker、Decoration、Marker 与资源释放。
- **Vite Worker 配置**：`monaco-setup.ts` 用 `import editorWorker from 'monaco-editor/editor/editor.worker?worker'`（公开路径经 `exports` 映射到 `esm/vs/editor/editor.worker.js`），在 `self.MonacoEnvironment.getWorker` 返回本地打包的 Worker；**不依赖远程 CDN**。Python/JS 高亮用 Monarch tokenizer，无需语言服务 Worker。
- **懒加载**：`loadMonaco()` 用 `import('./monaco-setup')` 动态加载，Monaco 成为独立 chunk（4.1 MB / gzip 1.07 MB），首屏不加载。
- **编辑器主题**：`themes.ts` 在主题切换后（延迟一个宏任务，确保 `<html data-theme>` 已更新）从 `getComputedStyle` 读取 `--code-bg/--code-fg/--accent/--muted/--warn/--red/--edge` 等令牌，`defineTheme('algolens')` 后 `setTheme`。切换主题只改 theme，不重建实例。
- **代码行 Decorations**：`editor.createDecorationsCollection()` 在 `highlightLine` 变化时 `set()` 一条 `isWholeLine` 装饰（`className='algolens-active-line'`，行号区 `linesDecorationsClassName='algolens-active-line-gutter'`）；无高亮时 `clear()`。配合 `revealLineInCenterIfOutsideViewport` 只滚动越界行，不抢光标。
- **错误标记**：`monaco.editor.setModelMarkers(model, 'algolens', markers)`，`ExecutionDiagnostic` 的行列映射为 `IMarkerData`（无 `line` 的诊断只进输出面板、不标记）。
- **实例管理**：单实例复用；语言切换用 `setModelLanguage`（保留撤销栈），值同步仅在外部值变化时 `setValue`；`useEffect` 清理时 `dispose()` 并释放 decoration 引用。jsdom（`import.meta.env.MODE==='test'`）或加载失败时渲染等价 textarea 回退。

---

## D. 代码与动画同步机制

- **单一数据源**：`useLabController` 持有 `events: TraceEvent[]`；`currentEvent = events[playback.index]`。LabView 计算 `highlightLine = !traceStale && currentEvent?.sourceLocation?.line ? line : null` 下传 Monaco。
- **`sourceLocation.line` 高亮**：Stage 1 的 Python trace 显式记录 `line`（冒泡：比较→第 7 行 `if arr[j]>arr[j+1]`，交换→第 8 行），Monaco 直接高亮该行；变量表/步骤说明仍由 `SyncPanel` 读同一 `currentEvent`。
- **时间轴刷新**：前进/回退/拖动/播放都改 `playback.index` → `currentEvent` 变化 → `highlightLine` 变化 → Monaco 的 decoration effect 更新。无需第二套步骤状态。
- **Draft vs Executed 区分**：`editorCode`（Draft）与 `source`（产生 `events` 的快照）分离；`traceStale = source !== '' && editorCode !== source`。
- **异步隔离**：`runId` 自增；`runVisualizationWith` 在 `await` 后校验 `id === runId.current`，旧执行（A）完成后若已启动新执行（B）则丢弃，避免旧结果覆盖新结果。
- **改码提示**：stale 时 `SyncPanel` 显示「代码已修改，请重新运行」，并继续显示上次执行的只读源码快照；Monaco 停止高亮（避免把旧 Trace 行号映射到新代码）。

---

## E. Python 错误诊断

- **可靠定位**：`SyntaxError`/`IndentationError`（`compile(user_code, '<algo>', 'exec')` 的 `err.lineno`/`err.offset`）与运行时异常（`traceback.extract_tb` 过滤 `<algo>` 帧取末帧行号），行号相对 `user_code`、与 Monaco 行号一致。
- **只能纯文本**：非用户代码引起的错误（Pyodide 加载失败、超时、`<algo>` 帧缺失）不伪造行号，仅显示 `message`/`traceback`。
- **行号映射**：显式文件名 `<algo>` 区分用户帧与 bootstrap 帧，避免包装层行号偏移。
- **清理过期 Marker**：成功重跑 `setDiagnostics([])`；切算法/语言时 `setDiagnostics([])`；`setModelMarkers` 以固定 owner `'algolens'` 覆盖，杜绝泄漏。

---

## F. 代码保存

- **存储**：`localStorage`（短代码场景足够，无后端/账户）。`drafts.ts` 键 `algolens.code.<algoId>.<lang>`。
- **算法/语言隔离**：键同时含算法与语言，互不覆盖。
- **自动保存**：`editCode` 立即更新 + 600ms debounce 落盘；切换算法/语言前 `flushCurrent()` 同步落盘旧草稿；`beforeunload` 兜底刷出未落盘的最近输入。
- **保存失败**：`saveDraft` 捕获配额/隐私模式异常返回 `false`，UI 显示「保存失败」，内存值仍保留。
- **恢复默认**：两步确认（按钮变「确认恢复？」3 秒内二次点击执行），执行后把默认代码写回草稿。
- **草稿 vs 快照分离**：草稿走 `drafts.ts`，已执行源码走 `source`（Trace pipeline），互不干扰。

---

## G. 测试结果

| 项 | 结果 |
| --- | --- |
| TypeScript 类型错误 | **0** |
| 单元/集成测试 | **133 通过 / 0 失败**（19 个文件，较基线 112 +21） |
| 生产构建 | **成功**（主包 355.73 kB / gzip 112.57 kB；Monaco 独立懒加载 chunk 4.12 MB / gzip 1.07 MB） |
| 真实浏览器 E2E | **4 通过 / 0 失败**（Microsoft Edge，headless） |
| lint | 仓库未配置 ESLint，未运行（无 lint 脚本） |

> 未运行项：CI 上的 `npx playwright install chromium`（本环境用系统 Edge，见 §H）。

---

## H. 实际浏览器验证

- **浏览器**：Microsoft Edge（`msedge` channel，headless）。
- **Python 运行**：`vite preview` 服务 `dist/`，切 Python → 点运行 → Pyodide（jsdelivr）初始化成功 → 生成 Trace → 变量表出现 `i`/`arr`。
- **Monaco 加载**：`.monaco-editor` 出现（懒加载成功，无空白/回退）。
- **冒泡执行行同步**：`.algolens-active-line` 高亮出现；单步后 `step-desc` 变化且高亮保持。
- **变量值**：`variables-watch` 表含 `arr`、`i` 等真实变量。
- **错误诊断**：`def broken(:` 运行 → 输出面板出现 `SyntaxError`，且 Monaco 出现 `.squiggly-error` 波浪线；修复重跑后 `squiggly-error` 归零、变量恢复。
- **自动保存**：编辑 `const CUSTOM_MARKER = 424242;` → `localStorage['algolens.code.bubble.js']` 写入 → `page.reload()` 后编辑器仍含 `CUSTOM_MARKER`。
- **主题切换**：Light/Dark/System 下 `html[data-theme]` 正确切换，编辑器不丢代码、不重建。

---

## I. 已知问题与技术债

1. **Monaco 全量打包**：当前懒加载 chunk 含全部语言与 TS 语言服务（4.1 MB）。可后续改为 `editor.api` + 仅 Python/JS basic-languages 以缩减到约 1.5 MB。
2. **TS 语言服务未启用**：`getWorker` 统一返回 editor.worker，JS 只有高亮无 IntelliSense（本阶段无此需求）。
3. **练习页仍为 textarea**：本阶段仅替换实验室主编辑器；练习页编辑器未迁移（范围外）。
4. **错误行号依赖显式文件名**：运行时错误行号来自 `traceback` 的 `<algo>` 帧；若未来改成逐行解释器需重审。
5. **E2E 用系统 Edge**：CI 需 `npx playwright install chromium` 并切换 `channel`；本环境用 `msedge` 免下载。
6. **Monaco 回退仅 jsdom/失败时**：真实浏览器加载失败会退回 textarea（含提示），但该分支未在 E2E 单独覆盖。

---

## J. Git 状态

| 项 | 值 |
| --- | --- |
| 当前分支 | `main` |
| 远端 | `https://gitee.com/vvvi734/algolens.git`（`origin`） |
| 提交 | 见下方提交命令结果（阶段提交 `feat(phase-2): ...`） |
| 工作区 | 提交后应干净 |
| 已推送 | 是（`git push origin main`） |
| 文档 | 本报告 + `README.md` 已更新 |

---

## K. 下一阶段准备情况（Stage 3：高级数据结构 + 递归调用栈）

1. **Trace Schema 是否足以支持递归调用栈**：`schema.ts` 已定义 `callStack: Array<{name, line?}>`（上限 64），但当前任何 runner 都不产出它。支持递归只需 Python trace 扩展在 `variables` 同级增加 `call_stack` 快照（`inspect.stack()` 或显式传入），**Schema 本身无需改动**。
2. **Monaco 能否高亮递归执行中的代码行**：可以。`sourceLocation.line` 已能驱动任意行高亮；多帧深度的递归无非是每个事件带不同 `line`。真正的挑战是「当前帧属于哪个调用层」，需依赖 `callStack` 携带层级。
3. **变量观察器能否区分递归层级**：`VariableSnapshot` 已有可选 `scope` 字段，可放 `depth`/函数名；但 UI 目前只平铺展示，需给 `SyncPanel` 加按层级分组的展示。
4. **树/图可视化是否需扩展协议**：`VISUAL_TYPES` 已含 `tree`/`graph`，`state` 是自由 JSON，够用；但递归树的「子树高亮/父节点回溯」语义可能需要新增 `focus`/`range` 之外的字段（如 `callEdge`）。
5. **Stage 3 技术阻碍**：无阻塞性阻碍。工作量集中在「递归 trace 采集器（Python 侧记录栈帧）」「SyncPanel 分层变量视图」「树状可视化的回溯动画」三处；Monaco 与 Schema 均已就绪。
