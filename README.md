# AlgoLens · Python 为主的算法可视化学习平台

[English](#english) | [中文](#中文)

面向大学生与 408 考研学生的浏览器端算法学习平台：**Python 在浏览器内运行**，根据真实执行结果生成逐帧动画，并同步展示代码位置、变量值与步骤讲解。完全本地运行，无需租服务器。

> **当前版本：v0.7 Stage 6A。** 在 Stage 5A 的 MCP 文件桥基础上交付**网页 AI 导师 MVP**：本地 `packages/ai-gateway`（只监听 127.0.0.1）连接 Ollama 或用户自己的 OpenAI Chat Completions Key，浏览器只访问同源 `/api/mentor`、`/api/providers`；学习面板可基于当前真实 Trace 帧解释步骤/变量/调用栈，支持五级渐进提示、Level 5 显式确认、中止与离线本地提示。新增 36 项单测与 3 条真实浏览器 E2E（共 378 项 / 16 条；MCP 与页面功能保持不回归）。**真实 Ollama / 云端模型未实测**（本机未运行 Ollama、未配置 Key）。
> 定位已收敛：**Python 为主要教学语言**，JavaScript 作为前端实现语言继续支持既有 12 个算法演示；**C / C++ 与在线判题已从规划中取消**。详见 [阶段一总结](docs/STAGE1_REPORT.md)、[阶段二总结](docs/STAGE2_REPORT.md)、[阶段三总结](docs/STAGE3_REPORT.md)、[阶段 3B 总结](docs/STAGE3B_REPORT.md)、[阶段四总结](docs/STAGE4_REPORT.md)、[阶段 5A 总结](docs/STAGE5A_REPORT.md) 与 [阶段 6A 总结](docs/STAGE6A_REPORT.md)；知识包格式与作者指引见 [PACK_FORMAT_V1](docs/PACK_FORMAT_V1.md)、[PACK_AUTHOR_GUIDE](docs/PACK_AUTHOR_GUIDE.md)；MCP 安装与宿主配置见 [MCP_INSTALL](docs/MCP_INSTALL.md)；AI Gateway 安装与安全边界见 [AI_GATEWAY](docs/AI_GATEWAY.md)。

---

## 中文

### 真实状态矩阵

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| React + TypeScript + Vite 工程结构 | ✅ 已实现 | 严格类型检查、模块边界清晰 |
| Light / Dark / System 三态主题 | ✅ 已实现 | 跟随系统实时响应；首屏无闪屏；偏好持久化 |
| 14 个算法逐帧动画 | ✅ 已实现 | 12 个原有（冒泡/插入/选择/快排、二分/线性查找、栈/队列/链表、BFS/DFS、树中序）+ 阶乘 / 斐波那契递归 |
| 播放 / 暂停 / 回退 / 单步 / 拖动 / 速度 | ✅ 已实现 | 纯函数状态机 + 逐帧回归；新 Trace 加载即回到第 0 帧并停止播放，索引恒在合法范围内 |
| JavaScript 本地执行 | ✅ 已实现 | 3 秒限时 Web Worker，可离线 |
| Python 执行（Pyodide） | ✅ 已实现 | Worker 内运行；`trace()` 支持真实变量快照与源码行号 |
| 统一 Trace Event Schema v1 | ✅ 已实现 | Zod 运行时校验：`schemaVersion/step/eventType/visualType/state/message/sourceLocation/variables/callStack/lessonStepId` + 事件/帧/变量限额 |
| 教学课程数据层 | ✅ 已实现 | `domain/lessons/`：Lesson 类型 + Zod 校验 + 注册表 + 纯同步函数；与 React / Worker 完全解耦，可校验、可查询 |
| 教学面板（LessonPanel） | ✅ 已实现 | 算法介绍 / 前置知识 / 复杂度 / 教学阶段（含帧数徽标）/ 当前执行解释 / 常见错误；中英双语 |
| 教学步骤 ⇄ 时间轴双向联动 | ✅ 已实现 | 同一 `currentEvent`：时间轴驱动高亮，点击步骤跳到真实执行帧（向后找 → 回绕首帧 → 不可用则禁用） |
| 算法课程内容 | ⚠️ 2 / 14 内置 | 内置冒泡排序与阶乘两门完整课程；其余算法显示"尚未提供教学课程"空态，可由知识包补充 |
| 可安装知识包（`.algopack`） | ✅ 已实现 | ZIP 容器 + manifest v1 + 有界解压 + 路径白名单；导入 → 预览 → 确认 → 本地安装 |
| 知识包安全校验 | ✅ 已实现 | 6 MiB / 64 条目 / 512 KiB 单文件 / 3 MiB 总量 / 200:1 压缩比；拒绝路径穿越、绝对路径、重复名、加密条目、ZIP64、非文本 |
| 知识包本地持久化 | ✅ 已实现 | IndexedDB `algolens-packs` 三 store 单事务安装/替换/卸载；刷新恢复；配额失败有明确错误 |
| 知识包管理界面 | ✅ 已实现 | 「知识包」页：已装列表、导入、预览确认、版本替换提示、卸载确认、空态与错误态，中英双语 + 三态主题 |
| 课程注册表组合 | ✅ 已实现 | `createLessonCatalog`：内置优先，包课程同 Schema 校验，非法包内容跳过而非崩溃；卸载即失效 |
| 官方示例知识包 | ✅ 已实现 | `packs/algolens-search-basics.algopack`（5 条目 / 6100 B）：`binary` 二分查找 5 步双语课程 + 真实 Pyodide 示例 |
| 学习会话格式（`.algosession.json`） | ✅ 已实现 | `domain/sessions`：严格 Zod、`sessionFormatVersion=1`、96 KiB / 40k 源码字符 / 8 KiB 输入；`lessonOrigin` 记录课程来源 |
| 学习上下文格式（`.algocontext.json`） | ✅ 已实现 | 真实帧 + 变量 + 调用栈 + 教学阶段；128 KiB；源码仅在用户勾选时写入；导出不重跑 |
| Agent 学习会话导入 | ✅ 已实现 | 网页「学习会话」面板：选文件 → 预览（课程/阶段/是否含源码）→ 确认应用；不自动运行、不覆盖草稿前需确认 |
| 学习上下文导出 | ✅ 已实现 | 一键下载当前帧，含源码为显式勾选；不重新执行、不上传网络 |
| 本地 MCP Server（stdio） | ✅ 已实现 | `packages/mcp-server`，官方 SDK 1.32.2；`npm run mcp:build` / `mcp:start` / `mcp:smoke`；stdout 仅协议 |
| MCP 工具：课程 / 知识包 / 会话 / 上下文 | ✅ 已实现 | 6 个工具：`list_lessons`、`get_lesson`、`get_lesson_step`、`list_available_packs`、`create_learning_session`、`inspect_learning_context` |
| MCP 启发式教学 Prompt | ✅ 已实现 | `teach_algorithm` LEVEL 1–5；课程文本按不可信数据包裹；不调用任何模型 API、无 Key |
| MCP 本地安全边界 | ✅ 已实现 | 三个目录必须显式配置（flag/env，绝对路径）；裸文件名 + realpath 容器 + 拒符号链接 + 大小预检 + 独占写不覆盖 |
| 真实宿主接入 | ⚠️ 部分 | 协议层已用官方 Client + stdio 子进程 + Inspector CLI 实测；Claude Code / Cursor / VS Code **仅有配置模板，未实测** |
| Python 递归调用栈 | ✅ 已实现 | `@tracked` 装饰器捕获真实调用/返回事件、唯一 frameId、逐层局部变量与返回值 |
| 调用栈面板 | ✅ 已实现 | 栈式展示调用帧、高亮活跃帧、点击帧切换变量作用域、时间轴回退恢复历史栈 |
| 同步观察面板 | ✅ 已实现 | 代码位置高亮 + 变量观察器 + 步骤讲解，四区随 `currentEvent` 联动 |
| Python 冒泡排序端到端演示 | ✅ 已实现 | 真实 `i/j/arr/n` 变量、源码行号、比较/交换高亮 |
| Monaco 代码编辑器 | ✅ 已实现 | Python/JS 语法高亮、行号、缩进、折叠、撤销/重做、自适应尺寸 |
| 执行行高亮联动 | ✅ 已实现 | `currentEvent.sourceLocation.line` 驱动 Monaco 高亮；时间轴/单步/回退/拖动同步 |
| Python 错误诊断 | ✅ 已实现 | SyntaxError/NameError/… 结构化抽取，行列映射为 Monaco Marker |
| 本地代码自动保存 | ✅ 已实现 | 按算法×语言 debounce 自动保存，刷新/切换恢复，两步确认恢复默认 |
| 源码一致性与异步隔离 | ✅ 已实现 | 编辑后旧 Trace 不高亮新代码并提示重跑；`runId` 丢弃过期结果 |
| 练习题库（原创示例） | ✅ 已实现 | 8 道原创题 + 3 级循序提示 + 本机学习记录 |
| 练习「运行并查看输出」 | ✅ 已实现 | 仅展示输入 → 输出，**不再自动判题**；完成状态由用户手动标记 |
| C / C++ | 🚫 已取消 | 语言入口、占位模板与 `/api/execute` 执行后端均已移除 |
| 在线 Judge / 自动判题 | 🚫 已取消 | 相关入口与宣传已清理 |
| 中英文界面 / 移动端适配 | ⚠️ 部分 | 覆盖全部现有文案；未做触控尺寸与可访问性审计 |
| 自动化测试 | ✅ 已实现 | 378 项单测 / 帧回归 / jsdom 冒烟 + 16 条真实浏览器 E2E（Playwright + Edge，含真实 Pyodide、知识包、会话文件、AI 导师真实帧/离线/防剧透）；另有 MCP 协议测试 20 项与 stdio 冒烟 9 项通过 + 1 项按配置跳过 |
| 知识包远程市场 / 包签名 | ⏳ 后续 | 本版只有本地文件导入；无远程仓库、无自动下载、无签名校验 |
| 网页 AI 导师（本地 Gateway） | ✅ 已实现（真机未验证） | Stage 6A：Ollama + OpenAI Chat Completions 适配、五级教学 Schema、防剧透降级、同源代理；本机无 Ollama/云端 Key，真实模型未验证 |
| AI Gateway 安全边界 | ✅ 已实现 | 仅 127.0.0.1、Origin + 自定义头、96 KiB 请求 / 30s / 20 rpm、严格 Zod、目标地址仅启动配置、密钥只存 Gateway 环境变量 |
| 多模态 / RAG / 自动判题 / Agent 实时同步 | ⏳ 后续 | Stage 6A 明确不做；文件桥与 stdio MCP 保持独立 |
| 练习页编辑器 | ⏳ 后续 | 练习页仍为 textarea；Monaco 仅用于实验室主编辑器 |
| GitHub Pages 部署 | ✅ 已实现 | workflow 构建 `dist/` 后发布 |
| 开源贡献规范 | ✅ 基础版 | [CONTRIBUTING.md](CONTRIBUTING.md)、[行为准则](CODE_OF_CONDUCT.md) |

### 本地开发

```sh
npm ci
npm run dev            # 开发服务器
npm run typecheck      # TypeScript 严格检查
npm test               # Vitest（378 项）
npm run build          # tsc -b && vite build → dist/
npm run preview        # 预览构建产物
npm run test:e2e       # Playwright E2E（默认驱动本机 Microsoft Edge，16 条）
npm run pack:build     # 从 packs/src/<name>/ 构建 .algopack
npm run pack -- packs/algolens-search-basics.algopack   # 校验知识包（与浏览器同一条校验链）
```

AI 导师（可选，本地 Gateway；详见 [docs/AI_GATEWAY.md](docs/AI_GATEWAY.md)）：

```sh
npm run ai:install     # 只装 packages/ai-gateway 依赖（Node ≥ 22.9）
npm run ai:dev         # 用 vite-node 启动 Gateway（读可选的根目录 .env）
npm run ai:typecheck   # 子包类型检查
npm run ai:build       # esbuild → packages/ai-gateway/dist/server.mjs
npm run ai:start       # 运行构建后的 Gateway
```

普通用户不需要 Gateway：不启动时页面显示「AI 未连接」和明确标注的本地教学提示，算法、Python、课程、时间轴、知识包与 MCP 全部照常工作。**GitHub Pages 是纯静态托管，没有本地 Gateway**，因此不要期望静态演示能直接使用私密云端 Key；完整 AI 功能需要在本机运行 `npm run dev` + `npm run ai:dev`。

MCP（可选，独立依赖与产物，不影响网页；详见 [docs/MCP_INSTALL.md](docs/MCP_INSTALL.md)）：

```sh
npm run mcp:install    # 只装 packages/mcp-server 依赖（需 Node ≥ 20）
npm run mcp:build      # esbuild → packages/mcp-server/dist/server.mjs
npm run mcp:start -- --help                                     # 看用法（输出到 stderr）
npm run mcp:smoke      # 真实 stdio 子进程冒烟（6 工具 + 1 prompt）
npm run mcp:typecheck  # 子包类型检查
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
  features/    lab（含 SyncPanel 同步观察 + SessionPanel 学习会话）/ packs（知识包页与管理控制器）/ practice / ai
  domain/      algorithms / problems / lessons（教学课程数据 + catalog 组合）/ packs（容器、manifest、路径、校验）/ trace（schema + adapter + player）/ visualization / sessions（.algosession.json 与 .algocontext.json 格式）/ mentor（AI 导师共享 Schema 与真实上下文构造）
  runtime/     js worker / python（Pyodide + 结构化诊断）/ packs（有界 ZIP 读取 + IndexedDB 存储）/ monaco（懒加载 + 主题）/ ai / url / storage / drafts
  theme/       三态主题解析与 Provider
  i18n/        中英词典与 Provider
  styles/      tokens.css（唯一颜色源）+ app.css
  test/        setup 与 legacy 帧快照
e2e/            Playwright 真实浏览器测试（lab.spec.ts / packs.spec.ts / session.spec.ts / mentor.spec.ts）
packages/
  mcp-server/   本地 MCP Adapter（stdio、官方 SDK、6 工具 + teach_algorithm；依赖与产物独立）
  ai-gateway/   本地 AI Gateway（仅 127.0.0.1；Ollama + OpenAI Chat Completions；共享 mentor Schema）
packs/          知识包：src/<packId>/（源）+ <packId>.algopack（构建产物）
legacy/        迁移前数据定义（回归基线来源，应用运行时不引用）
docs/          ARCHITECTURE.md、阶段报告、PACK_FORMAT_V1.md、PACK_AUTHOR_GUIDE.md、STAGE6A_REPORT.md、AI_GATEWAY.md、MCP_INSTALL.md
scripts/       从 legacy 定义生成类型化数据、build-pack.mjs、validate-pack.ts
```

### Trace Event Schema v1

所有语言产生的执行状态统一为版本化事件（`src/domain/trace/schema.ts`，Zod 校验）：

- 事件字段：`schemaVersion` / `step` / `eventType` / `visualType` / `state` / `message` / `sourceLocation` / `variables` / `callStack` / `lessonStepId`（可选，教学阶段，仅由执行时显式记录）
- 可视化结构：`array / stack / queue / linked / tree / graph`
- 变量快照：`{ name, type, value, scope? }`，值必须是 JSON 可序列化类型
- 限额：事件数 500、单条消息 240 字符、变量 50 个、状态 8KB、总量 2MB
- 无效事件返回结构化错误，绝不导致页面崩溃

旧版 `frames[{state,message}]` 由 `src/domain/trace/adapter.ts` 无损转换为新协议；旧算法没有变量/行号时展示空态，**不编造数据**。

### 与 MCP Agent 的两种文件（Web ⇄ Agent）

- `.algosession.json`：Agent 写的**学习意图**（`sessionFormatVersion: 1`、`lessonId/algorithmId`、可选 `selectedStepId`、可选 Python `source`、可选 `input`、`lessonOrigin`）。上限 96 KiB，`.strict()` 拒绝未知键；网页导入后**不会**自动运行。
- `.algocontext.json`：网页导出的**当前真实帧**（`contextFormatVersion: 1`、`stepIndex`、`totalEvents`、`lessonStepId`、真实 `event`、可选 `source`）。上限 128 KiB；导出不重跑；MCP 只从用户配置的目录读取裸文件名。
- 两者都由 `src/domain/sessions/` 定义并被网页与 MCP 共用；MCP 看不到浏览器 IndexedDB，工具输出显式标注 `browserIndexedDbVisible: false`。

### 网页 AI 导师（Stage 6A）

- 浏览器只访问**同源** `POST /api/mentor` 与 `GET /api/providers`；Vite dev/preview 将其代理到 `127.0.0.1:8787` 的本地 Gateway。页面里没有可填任意 URL 的 AI 代理地址，也没有任何 Key。
- 请求中的 `context` 复用 Stage 5A 的真实帧字段：`algorithmId`、当前 `event`（Trace Schema v1）、`stepIndex/totalEvents`、`lessonStepId` 与课程阶段文案、`traceStale`；`stepIndex` 必须等于 `event.step`。源码默认不发送，只有用户勾选后才包含（上限 40k 字符）。
- 五级教学：`level 1..5` 默认 1；Level 5 必须在前端确认并携带 `confirmFullSolution: true`，否则 Gateway 返回 403 `level5-confirmation-required`。回复经共享 Zod Schema 校验；低等级下完整代码围栏会被替换，`answerDisclosure` 超契约时降级。
- 旧请求与步骤绑定：卡片显示算法/帧号；切换步骤会中止在途请求，旧回复不会被标成新步骤答案。
- 旧版 `POST /api/ai` 仍保留给练习页/自定义导入使用的“用户自部署代理”协议（`{"action":"review_code", ...}`）；AI 导师不走这个接口，也不需要用户自己搭代理。
- **不要把 API key 写进前端、GitHub 仓库或浏览器 localStorage。** 云端 Key 只放在 Gateway 进程环境（`.env` 被 gitignore；仓库只提交 `.env.example`）。

### 安全说明

- 用户 JavaScript 只在限时 Worker 中执行；Python 只在 Pyodide Worker 中执行，均不经过服务器。
- 知识包是**纯内容**：ZIP 内只接受 `manifest.json` / `LICENSE` / `README.md` / `lessons/*.json` / `examples/*.py`，导入时不解压到磁盘、不执行包内代码、不渲染不可信 HTML（课程文本按纯文本/Markdown 安全显示）。
- 包内 Python 示例在导入时只是惰性文本；只有用户在课程里点击「载入示例」再点击「运行」才会进入既有 Pyodide Worker。**Pyodide 不是针对恶意 Python 的完整沙箱**，请只运行你信任的包。
- 安装数据保存在浏览器 IndexedDB，不上传服务器；清理站点数据/隐私模式会导致已装包丢失，这是存储边界。
- MCP Server 是**独立本地进程**：只走 stdio（stdout 仅协议、日志走 stderr），不监听端口、不联网、不扫描磁盘。三个目录（包 / 会话输出 / 上下文输入）必须由用户显式配置，且只接受裸文件名、拒绝路径穿越与符号链接；写入永不覆盖已有文件。
- MCP 读不到浏览器 IndexedDB 里安装的包，也不假装读到；反之浏览器也不会自动接收 Agent 的会话文件，必须用户手工导入。**Pyodide 不是恶意 Python 沙箱**，MCP 从不执行任何 Python。
- 练习「运行并查看输出」是学习辅助，**不做成绩判定**。
- AI Gateway 是**独立本地进程**：固定 `127.0.0.1`，不监听公网/局域网；每个请求必须带 `x-algolens-client: web` 且 Origin 在允许列表（跨站 `Sec-Fetch-Site` 直接拒绝），不使用 CORS `*`。请求 96 KiB、响应 256 KiB、总超时 30 s、默认 20 次/分钟。
- Gateway 只能访问启动配置中的 Ollama/OpenAI 地址，**请求体不能改目标地址**（无任意 URL 代理、无文件读取、无 Shell）；错误响应不回显 Key、上游正文或堆栈。日志只写 stderr 的 requestId/provider/level/status/latency。
- 模型输出按 React 文本节点渲染，**不使用 `dangerouslySetInnerHTML`**；Schema 限制每段长度/条数。Prompt 中课程与真实帧被标记为不可信数据。Prompt 与输出过滤**不能保证 100% 防剧透**，因此低等级还有独立代码围栏降级。
- AI 生成的代码必须由学习者检查后再运行；AI 不运行 Python、不改 Monaco、不改播放位置、不判题。

### 路线图

Stage 1（已完成）：统一 Trace 协议 + 旧动画兼容 + Python 冒泡排序同步演示。
Stage 2（已完成）：Monaco 编辑器 + 执行行高亮联动 + Python 错误诊断 + 本地代码保存 + 真实浏览器 E2E。
Stage 3（已完成）：Python 递归调用栈 + 局部变量同步可视化（`@tracked` + 调用栈面板 + 作用域变量 + 阶乘/斐波那契演示）；收尾修复时间轴在切换 Trace 后不归零的缺陷。
Stage 3B（已完成）：教学课程数据层（Lesson Schema / 注册表 / 双向查询）+ `lessonStepId` 教学阶段关联 + 教学面板与时间轴双向联动 + 冒泡/阶乘两门双语课程。
Stage 4（已完成）：可安装教学知识包（`.algopack`）：ZIP 格式规范 + Pack Schema/校验 + 安全导入（路径穿越/ZIP Bomb/资源限额）+ IndexedDB 本地安装/刷新恢复/卸载 + 课程注册表组合（内置优先）+ 知识包管理页 + 官方示例包（二分查找）+ 真实 Pyodide 教学同步。
Stage 5A（已完成）：本地 MCP Agent 插件（stdio、官方 SDK、6 工具 + `teach_algorithm` 五级 Prompt）+ `.algosession.json` / `.algocontext.json` 两种共享文件 + 网页会话导入与上下文导出 + 目录/路径/大小安全边界 + 真实浏览器双流程 E2E。**未在第三方宿主实测**（仅配置模板）。
Stage 6A（已完成 MVP）：本地 AI Gateway（仅 127.0.0.1）+ Ollama / OpenAI Chat Completions Provider + 共享五级 Mentor Schema 与防剧透降级 + 网页 AI 导师面板（提供商/模型/连接状态、真实步骤/变量/调用栈解释、Level 5 确认、中止、旧步骤隔离、离线本地提示）+ E2E。**真实 Ollama 与云端 API 未实测**，静态 GitHub Pages 不含 Gateway。
后续：Agent ↔ 浏览器实时同步（Stage 5B 候选）、RAG、题库扩充、练习页 Monaco 迁移、远程包市场与包签名、axe 可访问性。

### License

MIT（见 [LICENSE](LICENSE)）。题目与算法说明均为原创示例，不是官方历年真题。

---

## English

AlgoLens is a browser-first algorithm visualization learning platform where **Python runs in the browser** and every animation frame is driven by real execution results, synchronised with the source line, variable values and a step explanation. It runs entirely locally — no server required.

**Stage 5A** shipped the first local MCP agent plugin: `packages/mcp-server` (official TS SDK, stdio) exposing six course/pack/session/context tools plus a five-level `teach_algorithm` prompt, with `.algosession.json` / `.algocontext.json` as the explicit file bridge; MCP reads only configured directories and never browser IndexedDB.

**Stage 6A** adds an optional local AI tutor. `packages/ai-gateway` is a loopback-only Node process (`127.0.0.1:8787`) that talks to local Ollama or your own OpenAI Chat Completions key; the page only calls same-origin `/api/mentor` and `/api/providers`. The mentor explains the real frame under the playhead (variables, call stack and teaching stage), enforces five hint levels with an explicit Level 5 confirmation, redacts leaked full code at low levels, and keeps old answers tied to their own frame. Keys never enter the browser, localStorage or Git; without the Gateway the whole lab keeps working and the panel says AI is offline. Real Ollama/cloud calls were **not tested** here, and GitHub Pages (static hosting) does not include a Gateway.

```sh
npm ci
npm run dev
npm run typecheck
npm test          # 378 tests (incl. 20 MCP protocol tests + gateway tests)
npm run build
npm run test:e2e  # 16 Playwright tests (local Microsoft Edge; mock provider)
npm run pack -- packs/algolens-search-basics.algopack   # validate a pack (same chain as the browser)
npm run mcp:install && npm run mcp:build                 # optional MCP server (Node >= 20)
npm run mcp:smoke                                        # real stdio child-process smoke test
npm run ai:install && npm run ai:dev                     # optional loopback AI Gateway
```

See [docs/STAGE5A_REPORT.md](docs/STAGE5A_REPORT.md) for this stage, [docs/MCP_INSTALL.md](docs/MCP_INSTALL.md) for host configuration (templates only — no third-party host was tested), [docs/STAGE4_REPORT.md](docs/STAGE4_REPORT.md) for packs, [docs/PACK_FORMAT_V1.md](docs/PACK_FORMAT_V1.md) for the container spec, [docs/PACK_AUTHOR_GUIDE.md](docs/PACK_AUTHOR_GUIDE.md) for authoring, [docs/STAGE3B_REPORT.md](docs/STAGE3B_REPORT.md) for the lesson system, [docs/STAGE3_REPORT.md](docs/STAGE3_REPORT.md) for recursion, [docs/REFERENCES.md](docs/REFERENCES.md) for sources and licences, and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module boundaries. Never put provider API keys in the browser. MIT licensed; all exercises and lesson copy are original, not official past exam questions.
