# AlgoLens 架构方案（v0.2 / Phase 1）

本文描述从单文件原型（`index.html`，296 行 / ~70 KB）迁移到 React + TypeScript + Vite 后的模块边界、数据流与演进约束。**当前仓库只实现了 Phase 1**，其余能力见 [`docs/issues/`](./issues/) 中的独立 Issue。

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
  B --> D[runtime/ 副作用：js worker · pyodide · native · ai · storage]
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
| `src/domain/trace` | 帧类型、采集器、**纯函数播放状态机** | 不碰 `setInterval` / DOM |
| `src/domain/visualization` | `TraceState → VisualModel` 纯映射、日志窗口 | 不写 `innerHTML` |
| `src/runtime/js` | Worker 客户端 + 与 Worker 共用的纯执行体 | 不在主线程 `new Function` |
| `src/runtime/python` | Pyodide classic worker（按需 CDN） | 不内置 Pyodide 到 bundle |
| `src/runtime/native` | C/C++ 的 `/api/execute` 客户端 + URL 校验 | **不编译、不运行不可信代码** |
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

### 3.3 运行时：语言适配器，不假装支持
- 统一入口 `runtime/execute.ts` 的 `runForLanguage(mode, code, input, tests, language, messages)`。
- JS → 3 秒限时 Worker；Python → 30 秒限时 Pyodide Worker（CDN 按需加载）；C/C++ → 仅向外部隔离服务发请求，**当前仓库不提供该服务**。
- README 与界面文案都明确写出哪些能力是「协议 / 占位」，避免把未实现标记成已支持。

### 3.4 安全边界
- 浏览器不保存任何模型厂商密钥；AI 请求只发到用户自部署的同源/HTTPS 代理。
- C/C++ 编译执行必须落在独立沙箱（Issue 08），带 CPU/内存/时间/输出上限、无网络、只读文件系统、认证与速率限制；服务端还要校验 `TRACE` 输出，不能盲信。
- 用户 JS 只在 Worker 内 `new Function`；练习样例测试是**公开测试**，正式判题需隐藏测试（Issue 10）。

## 4. 测试策略

| 层次 | 工具 | 覆盖 |
| --- | --- | --- |
| 纯逻辑单测 | Vitest | 主题解析、播放状态机、可视化映射、i18n、题库数据、关键词路由 |
| 帧回归 | Vitest + legacy 快照 | 12 个算法逐帧一致、空/重复/单元素输入、排序终态 |
| 组件冒烟 | Vitest + jsdom + Testing Library | 12 个算法入口、时间轴交互、三态主题、语言切换、视图切换 |
| 令牌契约 | Vitest 读 CSS 文本 | 两套主题 token 完整性、无硬编码颜色 |
| E2E / a11y | Playwright + axe | **未实现**，见 Issue 12 |

`npm run typecheck`、`npm test`、`npm run build` 是每次 PR 的必过门槛（见 `.github/workflows/ci.yml`）。

## 5. 部署

`vite.config.ts` 用 `base: './'`，产物同时适配域名根路径和 GitHub Pages 项目路径 `/<repo>/`。Pages workflow 构建 `dist/` 后上传；因为 SPA 无客户端路由，不需要 404 回退页。

## 6. 演进顺序与不可跳跃的依赖

```
Phase 1: 01 骨架 → 02 主题 → 03 动画回归 → 04 组件化重构（本次交付）
Phase 2: 05 Trace Schema → 06 编辑器 → 07 Pyodide → 08 C/C++ 沙箱
Phase 3: 09 AI 渐进教学 → 10 题库三分类/四语言示例 → 11 i18n/移动端
Phase 4: 12 E2E → 13 开源治理与发布
```

`05 Trace Event Schema` 是 `06/07/08` 的前置：编辑器诊断、Python 错误定位、C/C++ 帧输出都要先有同一份版本化事件协议。`09/10` 依赖后端能力，但前端结构化响应可以先定义。
