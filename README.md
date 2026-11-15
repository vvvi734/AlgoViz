# AlgoLens · 多语言算法可视化学习平台

[English](#english) | [中文](#中文)

面向大学生与考研学生的浏览器端算法学习平台：逐帧动画、多语言代码练习、循序提示与可选 AI 助教。

> **当前版本：v0.2 Phase 1。** 本仓库刚刚完成「主题系统 + React/TS/Vite 结构重构 + 现有动画回归测试」。
> 下列能力**尚未实现**，请勿按最终目标使用：[路线图与 14 个独立 Issue](docs/ARCHITECTURE.md)。

---

## 中文

### 真实状态矩阵

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| React + TypeScript + Vite 工程结构 | ✅ 已实现 | 严格类型检查、模块边界清晰、无运行时框架外依赖 |
| Light / Dark / **System** 三态主题 | ✅ 已实现 | 跟随系统外观并实时响应；首屏无闪屏；偏好持久化 |
| 全组件 + 代码编辑器配色统一 | ✅ 已实现 | 颜色只写在 `styles/tokens.css`，有契约测试强制校验 |
| 12 个算法逐帧动画 | ✅ 已实现 | 冒泡/插入/选择/快排、二分/线性查找、栈/队列/链表、BFS/DFS、树中序 |
| 播放 / 暂停 / 回退 / 单步 / 拖动 / 速度 | ✅ 已实现 | 纯函数状态机，86 项测试含逐帧回归 |
| JavaScript 本地执行 | ✅ 已实现 | 3 秒限时 Web Worker，可离线 |
| Python 执行（Pyodide） | ⚠️ 部分 | 按需从 CDN 加载 `0.27.7`；**无预加载、无离线缓存、无行列级错误定位** |
| C / C++ 编辑与示例 | ⚠️ 仅入口 | 有示例代码和 `/api/execute` 客户端协议；**本仓库不提供编译执行服务，点击运行会失败并明确报错** |
| 代码编辑器语法高亮 / 行号 / 编译错误标注 / 代码保存 | ❌ 未实现 | 目前是纯 `textarea`；见 Issue 06 |
| 统一 Trace Event Schema v1 | ❌ 未实现 | 目前沿用迁移前的 `frames[{state,message}]`；见 Issue 05 |
| C/C++ 安全隔离执行后端 | ❌ 未实现 | 见 Issue 08。**绝不在普通 Web 服务进程直接运行不可信代码** |
| AI 渐进式教学（引导→定位→伪代码→才给答案） | ❌ 未实现 | 目前只在 prompt 里要求不剧透，没有结构化 `hintLevel` 与防剧透校验；见 Issue 09 |
| 题库三分类（大学基础 / 数据结构专项 / 408 考研强化） | ❌ 未实现 | 目前只有「大学基础 / 考研强化」2 类共 8 道**原创示例题**，非官方真题；见 Issue 10 |
| 以 C++ / C / Python 为主要教学语言 | ❌ 未实现 | 当前 JS 预置示例最完整，四语言脚手架已具备；见 Issue 14 |
| 中英文界面 | ⚠️ 部分 | 覆盖迁移前全部文案 + 主题文案；新增功能文案待补；见 Issue 11 |
| 移动端适配 | ⚠️ 部分 | 保留原有断点布局；未做触控尺寸与可访问性审计；见 Issue 11 |
| 自动化测试 | ⚠️ 部分 | 86 项单测 / 帧回归 / jsdom 冒烟；**无 Playwright E2E、无 axe**；见 Issue 12 |
| GitHub Pages 部署 | ✅ 已实现 | workflow 构建 `dist/` 后发布；`base: './'` 兼容项目路径 |
| 开源贡献规范 | ✅ 基础版 | [CONTRIBUTING.md](CONTRIBUTING.md)、[行为准则](CODE_OF_CONDUCT.md) |

### 本地开发

```sh
npm ci
npm run dev            # 开发服务器
npm run typecheck      # TypeScript 严格检查
npm test               # Vitest（86 项）
npm run build          # tsc -b && vite build → dist/
npm run preview        # 预览构建产物
```

浏览器打开 Vite 提示的地址。不要用 `file://` 直接打开：Worker 与模块加载会受限。

重新生成迁移前数据 / 帧基线（**会改写 `src/**/*.generated.ts` 与帧快照，需 review 后提交**）：

```sh
npm run sync:legacy
```

### 目录结构

```
src/
  app/         视图编排
  features/    lab / practice / ai（React 组件与状态 hook）
  domain/      algorithms / problems / trace / visualization（纯逻辑，无 DOM）
  runtime/     js worker / pyodide / native / ai / storage（副作用）
  theme/       三态主题解析与 Provider
  i18n/        中英词典与 Provider
  styles/      tokens.css（唯一颜色源）+ app.css
  test/        setup 与 legacy 帧快照
legacy/        迁移前数据定义（回归基线来源，应用运行时不引用）
docs/          ARCHITECTURE.md、独立 Issue、阶段报告
scripts/       从 legacy 定义生成类型化数据
```

### 后端接口约定（协议，非实现）

`POST /api/execute`（**本仓库不提供该服务**）：

```json
{"mode":"visual","language":"cpp","code":"...","input":[5,2,1],"tests":null}
```

可视化响应 `{"frames":[{"state":{"type":"array","values":[5,2,1],"focus":[0,1]},"message":"Compare"}]}`；
判题响应 `{"result":[{"pass":true,"actual":2,"expected":2}]}`。

C/C++ 示例以 `TRACE ` 前缀输出 JSON 状态。执行后端必须校验并限制：无网络、只读文件系统、CPU/内存/时间/输出上限、进程限制、认证与速率限制；**不要盲信 stdout**。正式判题还需要服务端隐藏测试。

`POST /api/ai`：`{"action":"review_code","payload":{"code":"..."},"language":"zh"}` → `{"reply":"..."}`；
`generate_algorithm` → `{"title":"...","code":"...","input":[...],"type":"array"}`。

> 永远不要把 API key 写进前端、GitHub 仓库或浏览器 localStorage。浏览器只访问你自部署的同源/HTTPS 代理。

### 安全说明

- 用户 JavaScript 只在限时 Worker 中执行；Python 只在 Pyodide Worker 中执行。
- 练习测试是**公开样例测试**，仅供学习，不能用于成绩判定。
- AI 生成的代码必须由学习者检查后再运行，前端不做沙箱化审查。

### 路线图

Phase 1（已完成）：Issue 01–04 · Phase 2：05–08 · Phase 3：09–11、14 · Phase 4：12–13。
详见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 与 [docs/issues/](docs/issues/)。

### License

MIT（见 [LICENSE](LICENSE)）。题目与算法说明均为原创示例，不是官方历年真题。

---

## English

AlgoLens is a browser-first algorithm visualization learning platform. **This is the Phase 1 release**: the React + TypeScript + Vite refactor, a complete Light/Dark/System theme, and frame-by-frame regression tests for the pre-existing animations.

Implemented: 12 JavaScript trace-driven animations with play/pause/rewind/step/scrub, a pure playback state machine, three-state theming with a token contract enforced by tests, Chinese/English UI, 8 original practice problems with public sample tests, and 86 automated tests. Python runs through an on-demand Pyodide CDN worker.

**Not implemented (do not assume otherwise):** syntax highlighting / line numbers / compiler diagnostics / code persistence, a unified versioned Trace Event Schema, a sandboxed C/C++ execution backend, structured progressive AI hints, the three-way question-bank split (university / data structures / 408 exam), E2E and accessibility tests, and offline Pyodide. C/C++ are editor entries plus an `/api/execute` **protocol only** — this repo ships no compiler service, and untrusted code must never run inside an ordinary web server process.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the module boundaries and [docs/issues/](docs/issues/) for the 14 independent, individually claimable Issues. Never put provider API keys in the browser. Licensed under MIT; all exercises are original, not official past exam questions.
