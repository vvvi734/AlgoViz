# AlgoLens 架构方案（v0.4 / Stage 3B）

本文描述从单文件原型（`index.html`，296 行 / ~70 KB）迁移到 React + TypeScript + Vite 后的模块边界、数据流与演进约束。

**定位已收敛**：Python 为主要教学语言；JavaScript 作为前端实现语言继续支持既有 12 个算法演示。**C/C++ 与在线判题已从规划中取消**，相关入口与执行后端已移除。Stage 1 落地「统一 Trace Event Schema v1 + 旧动画兼容 + Python 冒泡排序同步演示」；Stage 2 落地「Monaco Editor + 执行行高亮 + Python 错误诊断 + 本地代码保存 + 真实浏览器 E2E」；Stage 3 落地「Python 递归调用栈 + 作用域感知变量观察 + 时间轴重置修复」；Stage 3B 落地「教学课程数据层 + 教学阶段关联 + 教学面板与时间轴双向联动」，详见 [STAGE1_REPORT.md](./STAGE1_REPORT.md)、[STAGE2_REPORT.md](./STAGE2_REPORT.md)、[STAGE3_REPORT.md](./STAGE3_REPORT.md) 与 [STAGE3B_REPORT.md](./STAGE3B_REPORT.md)。

## 1. 现状盘点（迁移前）

| 项 | 迁移前状态 | 问题 |
| --- | --- | --- |
| 代码组织 | 所有状态、DOM 渲染、i18n、题库、算法示例塞进一个 `<script>` | 无法单测、无法多人协作、改动易互相影响 |
| 主题 | `light` / `dark` 二态；`html[data-theme=light]` 覆写一批硬编码颜色 | 没有 system；`stage` / `.codearea` / `.node` / `.graph` / `.feedback` 等大量颜色写死在组件里，两套主题不一致 |
| 动画 | 12 个 JS 算法用 `trace()` + Web Worker 生成帧；时间轴支持播放/暂停/回退/单步/拖动 | 播放逻辑与 DOM 渲染耦合在 `renderFrame()` 里，没有可回归的纯逻辑 |
| 语言 | JS 可本地执行；Python 走 Pyodide CDN Worker；C/C++ 只有示例与 `/api/execute` 协议 | 无统一事件协议；C/C++ 没有真正的执行后端（且不应在 Web 进程里跑） |
| 题库 | 8 道原创题，2 个分类（university / postgrad） | 不满足「大学基础 / 数据结构专项 / 408 考研强化」三分类 |
| AI | `/api/ai` 代理、prompt 里写「不要给完整答案」 | 无结构化 hintLevel、无防剧透校验 |
| 部署 | Pages workflow 直接上传仓库根目录 | Vite 构建产物在 `dist/`，必须改 workflow |

## 2. 目标分层与模块边界

```mermaid
flowchart TD
  A[app/ App.tsx · 视图切换 / 全局状态编排] --> B[features/ lab · practice · ai]
  B --> C[domain/ 纯逻辑：algorithms · problems · trace · visualization]
  B --> D[runtime/ 副作用：js worker · python(Pyodide) · ai · url · storage]
  A --> E[theme/ 三态主题 + CSS 设计令牌]
  A --> F[i18n/ zh-en 词典]
  C -. 通过接口调用 .-> D
  E --> G[styles/tokens.css 唯一颜色源]
  G --> H[styles/app.css 只引用 var(--token)]
```

**依赖方向是单向的**：`app → features → domain / runtime / theme / i18n`。`domain` 不引用 DOM、React、Worker；`runtime` 不引用 React；`features` 不直接访问 `localStorage`（统一走 `runtime/storage.ts`）。

| 目录 | 职责 | 不许做什么 |
| --- | --- | --- |
| `src/domain/algorithms` | 12 个算法定义、按教学语言取示例 | 不执行用户代码 |
| `src/domain/problems` | 题库数据、脚手架 | 不判题 |
| `src/domain/trace` | Trace Event Schema（Zod 校验）、legacy 适配层、**纯函数播放状态机** | 不碰 `setInterval` / DOM；不编造变量/行号 |
| `src/domain/lessons` | 教学课程数据：类型、Zod 校验、注册表、课程 ⇄ Trace 的**纯查找函数** | 不引用 React / Worker；不执行代码；不从 message 推断教学阶段 |
| `src/domain/visualization` | `TraceState → VisualModel` 纯映射、日志窗口 | 不写 `innerHTML` |
| `src/runtime/js` | Worker 客户端 + 与 Worker 共用的纯执行体 | 不在主线程 `new Function` |
| `src/runtime/python` | Pyodide classic worker（按需 CDN）+ 扩展版 `trace()` | 不内置 Pyodide 到 bundle |
| `src/runtime/monaco` | Monaco 懒加载、本地 Worker 打包、`algolens` 主题映射 | 不打包到主 bundle（`import()` 拆包） |
| `src/runtime/drafts` | localStorage 代码草稿（按算法 × 语言） | 不缓存敏感信息；由 `features` 通过接口调用 |
| `src/runtime/url` | HTTP(S) 地址校验 | 不承载业务逻辑 |
| `src/runtime/ai` | `/api/ai` 客户端与响应校验 | 不保存任何 API key |
| `src/theme` | 偏好解析、媒体查询监听、根元素属性 | 不写组件颜色 |
| `src/i18n` | 词典、翻译、语言持久化 | 不放业务文案以外的逻辑 |
| `src/features/*` | React 组件 + 状态 hook | 不直接摸 DOM / 存储 |
| `legacy/` | 迁移前数据定义，作为回归基线来源 | 不被应用运行时引用 |
| `src/test/fixtures` | 由 `npm run sync:legacy` 生成的帧快照 | 不随测试运行自动更新 |

## 3. 关键设计决策

### 3.1 主题：单一颜色源 + 契约测试
- `styles/tokens.css` 定义 `:root[data-theme='dark']` 与 `:root[data-theme='light']` 两套同名变量；`styles/app.css` **只允许** `var(--token)`。
- `theme/resolve.ts` 是纯函数：`resolveTheme('system', prefersDark)` → 具体主题；`system` 模式订阅 `prefers-color-scheme` 并在系统切换时实时更新。
- `index.html` 内联脚本在首屏前应用主题，避免闪屏；`ThemeProvider` 同步 `data-theme` / `data-theme-preference` / `color-scheme`。
- `src/theme/tokens.test.ts` 强制校验：组件 CSS 无硬编码颜色、每个被使用的 token 在两套主题中都存在、代码编辑器有独立的 `--code-*` 令牌。这是「所有组件及代码编辑器颜色统一」的可执行定义。

### 3.2 动画：纯状态机 + 帧快照基线
- `domain/trace/player.ts`：播放/暂停/单步/回退/拖动/末尾自动停止/速度映射全部是无 DOM 纯函数，`usePlayback()` 只负责 `setInterval`。
- `legacy/algorithm-definitions.js` 保留迁移前的算法源码；`npm run sync:legacy` 由它生成类型化数据模块和 `src/test/fixtures/legacy-frames.json`（12 个算法的逐帧快照）。
- `catalog.test.ts` 逐一比对新执行结果与该快照；任何改动算法代码导致动画变化都会被测试挡下。

### 3.3 运行时：统一事件协议，不假装支持
- 统一入口 `runtime/execute.ts` 的 `runForLanguage(mode, code, input, tests, language, messages)`。
- JS → 3 秒限时 Worker；Python → 30 秒限时 Pyodide Worker（CDN 按需加载），`trace()` 支持真实变量快照与显式行号。
- 两个 runner 产出的 `frames` 统一由 `domain/trace/adapter.ts` 转为 Trace Event Schema v1，再由 `schema.ts`（Zod）校验后才进入播放/同步面板。
- README 与界面文案都明确写出哪些能力是「协议 / 占位」，避免把未实现标记成已支持。

### 3.4 安全边界
- 浏览器不保存任何模型厂商密钥；AI 请求只发到用户自部署的同源/HTTPS 代理。
- 用户 JS 只在 Worker 内 `new Function`；Python 只在 Pyodide Worker 内执行，均不经过服务器，绝无远程代码执行。
- 练习「运行并查看输出」是学习辅助，**不做成绩判定**；完成状态由用户手动标记。

### 3.5 递归可视化：一条事件流，四块视图（Stage 3）
- Python 侧不解析文本，而是注入 `tracked` 装饰器：进入/返回真实产生事件，`frameId` 由单调计数器发号（同一函数的不同递归层是不同帧），`_snapshot()` 深拷贝保证历史帧不被后续 `list` 变异污染。
- `callStack` 沿用 Stage 1 定义的协议字段（`name/frameId/line/depth/arguments/locals/returnValue/status`），全部可选，旧 `{name,line}` 帧仍然通过校验。
- 前端仍是**单一 `currentEvent`**：`Timeline/usePlayback` 只决定 `index`，`VisualStage`、`SyncPanel`（含变量作用域）、`CallStackPanel`、Monaco 行装饰全部读同一个 `events[index]`；`selectedFrameId` 只是"在变量表里看哪一帧"，不参与时间轴。
- 播放状态机新增不变量：**新 Trace（`events` 数组身份变化）即回到第 0 帧并停止播放**，且 `index` 始终被钳制在 `[0, frameCount-1]`。重置信号用数组身份而非长度，因为同长度、不同内容的 Trace 也必须归零；`events` 是 React state 值，跨普通重渲染身份稳定，所以用户拖动的位置不会被主题/语言切换清掉。注意 `frames` 是 `lib.dom` 的全局（`declare var frames: WindowProxy`），把依赖写成 `[frames]` 会类型检查通过但永不触发——这是已修复的真实缺陷。

### 3.6 教学课程层：数据与执行分离（Stage 3B）
- **课程是数据**：`Lesson` 只有文本、列表与稳定 id，住在 `src/domain/lessons/*.ts`，不 import React、Worker 或 Trace 模块；将来可以被序列化成 JSON 装进外部包。
- **两个概念不合并**：`LessonStep`（老师讲什么）与 `TraceEvent`（程序真的做了什么）是不同类型。一个阶段可以对应很多帧，因此**不用 `event.step` 推导阶段**，只看执行时记录的 `lessonStepId`。
- **关联只在执行时产生**：Python `trace(..., lesson_step=)` 与 `@tracked(call_step=, return_step=)` 写入帧字段，`adapter` 只透传、不推断；字段可选，`schemaVersion` 仍为 1。
- **查找是纯函数**：`findFrameForStep` 规则固定为「当前帧之后的下一次 → 回绕到该阶段首帧 → `null`」，`null` 时按钮禁用。允许回绕，但不允许落在不存在或不属于该阶段的帧上。
- **注册表是信任边界**：`createLessonRegistry` 加载即校验（id 规则、`stepId` 唯一、中英列表等长、一算法一课程），校验失败直接抛；运行期 `byAlgorithm` 对没有课程的算法返回 `undefined`，旧算法照常工作。
- **仍是一条游标**：`LessonPanel` 与 `VisualStage` / `SyncPanel` / `CallStackPanel` / Monaco 一样读 `events[index]`，没有第二套播放进度；点步骤调用同一个 `seek()`（并暂停播放）。

## 4. 测试策略

| 层次 | 工具 | 覆盖 |
| --- | --- | --- |
| 纯逻辑单测 | Vitest | 主题解析、播放状态机（含 `clampPlayback`）、可视化映射、i18n、题库数据、关键词路由、教学课程校验与阶段查找 |
| 帧回归 | Vitest + legacy 快照 | 14 个算法逐帧一致（12 旧 + 阶乘/斐波那契）、空/重复/单元素输入、排序终态 |
| 组件冒烟 | Vitest + jsdom + Testing Library | 14 个算法入口、时间轴交互与 **Trace 切换重置**、三态主题、语言切换、视图切换、调用栈面板与作用域变量、教学面板（高亮/禁用/跳转/空态） |
| 令牌契约 | Vitest 读 CSS 文本 | 两套主题 token 完整性、无硬编码颜色 |
| E2E | Playwright（真实 Edge 无头 + `vite preview`） | Monaco 加载、Python 冒泡同步高亮、SyntaxError 波浪线出现/清除、草稿自动保存/刷新恢复、主题切换、真实 Pyodide 阶乘/斐波那契递归栈、JS 长短 Trace 切换重置、**教学步骤与真实数组/变量/调用栈同步**（见 `e2e/lab.spec.ts`） |
| a11y | axe | **未实现**，见后续 Issue |

`npm run typecheck`、`npm test`、`npm run build` 是每次 PR 的必过门槛（见 `.github/workflows/ci.yml`）。

## 5. 部署

`vite.config.ts` 用 `base: './'`，产物同时适配域名根路径和 GitHub Pages 项目路径 `/<repo>/`。Pages workflow 构建 `dist/` 后上传；因为 SPA 无客户端路由，不需要 404 回退页。

## 6. 演进顺序与不可跳跃的依赖

```
Stage 1（已完成）: Trace Schema v1 → 旧动画适配 → Python trace 扩展 → 同步观察面板 → 冒泡排序端到端
Stage 2（已完成）: Monaco 编辑器（懒加载/本地 Worker）→ 执行行高亮 → Python 错误诊断与 Marker → 源码一致性/异步隔离 → 草稿自动保存 → 深浅主题适配 → 真实浏览器 E2E
Stage 3（已完成）: callStack 协议落地 → Python @tracked 递归追踪 → 调用栈面板与作用域变量 → 阶乘/斐波那契端到端 → 时间轴重置与索引钳制修复
Stage 3B（已完成）: Lesson 数据层（类型/Zod/注册表）→ `lessonStepId` 协议扩展与执行时记录 → 教学面板 → 步骤 ⇄ 时间轴双向联动 → 冒泡/阶乘课程
后续             : 可安装知识包（`.algopack`）、树/图与动态规划可视化、练习页 Monaco、a11y / axe、AI 渐进式教学
```

`Trace Event Schema v1` 是编辑器诊断、递归栈动画与后续树/图可视化的共同前置：Monaco 需要根据 `event.sourceLocation` 高亮，调用栈读取 `callStack`，任何新结构都必须先扩展协议再改渲染，不允许渲染层自己发明字段。
