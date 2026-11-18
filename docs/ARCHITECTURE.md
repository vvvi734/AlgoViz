# AlgoViz 架构方案（v0.10 / Stage 7F）

本文描述从单文件原型（`index.html`，296 行 / ~70 KB）迁移到 React + TypeScript + Vite 后的模块边界、数据流与演进约束。

**定位已收敛**：Python 为主要教学语言；JavaScript 作为前端实现语言继续支持 19 个算法入口（Dijkstra / Floyd-Warshall / Bellman-Ford / Prim / Kruskal 的 JS 入口只提示使用 Python）。**C/C++ 与在线判题已从规划中取消**，相关入口与执行后端已移除。Stage 1 落地「统一 Trace Event Schema v1 + 旧动画兼容 + Python 冒泡排序同步演示」；Stage 2 落地「Monaco Editor + 执行行高亮 + Python 错误诊断 + 本地代码保存 + 真实浏览器 E2E」；Stage 3 落地「Python 递归调用栈 + 作用域感知变量观察 + 时间轴重置修复」；Stage 3B 落地「教学课程数据层 + 教学阶段关联 + 教学面板与时间轴双向联动」；Stage 4 落地「可安装教学知识包 `.algopack`（容器规范 + 安全导入 + 本地安装 + 注册表组合 + 管理页）」；Stage 5A 落地「本地 MCP Agent 插件（stdio、6 工具 + 五级 Prompt）+ `.algosession.json` / `.algocontext.json` 双文件桥 + 网页导入/导出」；Stage 6A 落地「本地 AI Gateway（仅 127.0.0.1）+ Ollama / OpenAI Chat Completions Provider + 共享五级 Mentor Schema 与防剧透降级 + 网页 AI 导师面板」；Stage 7A 落地「学习实验室信息架构重构：动画 + Monaco + 当前步骤同屏，教学/变量/AI/工具按需标签，课程渐进展开，1024 与移动端单列且无横向溢出」；Stage 7B 落地「AlgoViz 品牌迁移 + 可选 structure Trace 语义 + 栈桶状/队列排队专属渲染 + 真实 Python 栈/队列课程」；Stage 7C 落地「单链表结构化 Trace + 真实 Python Node 对象 + 纯 linkedListModel + 节点/箭头/HEAD/NULL/断开节点渲染 + 双语链表课程」；Stage 7D 落地「二叉树结构化 Trace + 真实 Python TreeNode 三模式递归 + 纯树布局/模型 + 层级画布/递归路径/访问序号 + 调用栈联动 + 双语树课程」；Stage 7E 落地「图 BFS/DFS 结构化 Trace + 真实 Python deque/显式栈 + 确定性图布局 + 纯 GraphVisualModel + 节点/边/当前边/访问序号 + 同帧 QueueVisual/StackVisual + 图与 Frontier 回退/跳帧同步 + 双语图课程」；Stage 7F 落地「Dijkstra 带权图结构化 Trace + 真实 Python heapq + 距离表/前驱/优先队列/松弛/过期条目 + 目标与最终路径 + 独立 PriorityQueuePanel + 双语 Dijkstra 课程」，详见 [STAGE1_REPORT.md](./STAGE1_REPORT.md)、[STAGE2_REPORT.md](./STAGE2_REPORT.md)、[STAGE3_REPORT.md](./STAGE3_REPORT.md)、[STAGE3B_REPORT.md](./STAGE3B_REPORT.md)、[STAGE4_REPORT.md](./STAGE4_REPORT.md)、[STAGE5A_REPORT.md](./STAGE5A_REPORT.md)、[STAGE6A_REPORT.md](./STAGE6A_REPORT.md)、[STAGE7A_REPORT.md](./STAGE7A_REPORT.md)、[STAGE7B_REPORT.md](./STAGE7B_REPORT.md)、[STAGE7C_REPORT.md](./STAGE7C_REPORT.md)、[STAGE7D_REPORT.md](./STAGE7D_REPORT.md)、[STAGE7E_REPORT.md](./STAGE7E_REPORT.md)、[STAGE7F_REPORT.md](./STAGE7F_REPORT.md)、[COVERAGE.md](./COVERAGE.md)、[BRAND_MIGRATION.md](./BRAND_MIGRATION.md)、[AI_GATEWAY.md](./AI_GATEWAY.md)、[PACK_FORMAT_V1.md](./PACK_FORMAT_V1.md) 与 [MCP_INSTALL.md](./MCP_INSTALL.md)。

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
  M[packages/mcp-server · stdio MCP Adapter] --> C
  M --> D
  D -. ".algosession / .algocontext 文件交换（无实时通道）" .-> M
  N[features/lab AiMentor] --> O[runtime/ai/mentorClient · 同源 /api/mentor]
  O --> P[packages/ai-gateway · 仅 127.0.0.1]
  P --> Q[Ollama 127.0.0.1:11434]
  P --> R[OpenAI Chat Completions · Key 仅 Gateway env]
  C --> P
  E --> G[styles/tokens.css 唯一颜色源]
  G --> H[styles/app.css 只引用 var(--token)]
```

**依赖方向是单向的**：`app → features → domain / runtime / theme / i18n`。`domain` 不引用 DOM、React、Worker；`runtime` 不引用 React；`features` 不直接访问 `localStorage`（统一走 `runtime/storage.ts`）。

| 目录 | 职责 | 不许做什么 |
| --- | --- | --- |
| `src/domain/algorithms` | 19 个算法定义、按教学语言取示例 | 不执行用户代码 |
| `src/domain/problems` | 题库数据、脚手架 | 不判题 |
| `src/domain/trace` | Trace Event Schema（Zod 校验）、legacy 适配层、**纯函数播放状态机** | 不碰 `setInterval` / DOM；不编造变量/行号 |
| `src/domain/lessons` | 教学课程数据：类型、Zod 校验、注册表、课程 ⇄ Trace 的**纯查找函数**、内置 + 知识包课程的组合目录（`catalog.ts`） | 不引用 React / Worker；不执行代码；不从 message 推断教学阶段 |
| `src/domain/packs` | 知识包纯逻辑：格式常量与限额、路径白名单、manifest Zod 解析、中央目录策略、内容校验与预览 | 不解压、不写存储、不执行包内代码 |
| `src/domain/sessions` | Stage 5A 两种桥接文件的**唯一定义**：`.algosession.json` / `.algocontext.json` 的类型、Zod 严格校验、builder/parser、限额、IssueCode | 不读写文件、不碰浏览器存储、不执行代码；不保存密钥/聊天/环境路径 |
| `src/domain/mentor` | Stage 6A 网页与 Gateway **共用**的 Mentor 契约：上下文/回复/meta Schema、五级披露契约、纯函数 `buildMentorContext`（只接受真实帧） | 不引用 React / fetch；不伪造变量或帧；不读取源码以外的用户数据 |
| `src/domain/visualization` | `TraceState → VisualModel` 纯映射、日志窗口 | 不写 `innerHTML` |
| `src/runtime/js` | Worker 客户端 + 与 Worker 共用的纯执行体 | 不在主线程 `new Function` |
| `src/runtime/python` | Pyodide classic worker（按需 CDN）+ 扩展版 `trace()` | 不内置 Pyodide 到 bundle |
| `src/runtime/packs` | 有界 ZIP 读取（中央目录 + 限量流式解压）、IndexedDB 三 store 单事务存储 | 不把 ZIP 写盘、不做无上限解压、不自动执行示例 |
| `src/runtime/monaco` | Monaco 懒加载、本地 Worker 打包、`algolens` 主题映射 | 不打包到主 bundle（`import()` 拆包） |
| `src/runtime/drafts` | localStorage 代码草稿（按算法 × 语言） | 不缓存敏感信息；由 `features` 通过接口调用 |
| `src/runtime/url` | HTTP(S) 地址校验 | 不承载业务逻辑 |
| `src/runtime/ai` | `/api/ai` legacy 客户端 + Stage 6A `mentorClient`（同源 `/api/providers`、`/api/mentor`，响应用共享 Schema 复验） | 不保存任何 API key；不接受任意目标 URL |
| `src/theme` | 偏好解析、媒体查询监听、根元素属性 | 不写组件颜色 |
| `src/i18n` | 词典、翻译、语言持久化 | 不放业务文案以外的逻辑 |
| `src/features/*` | React 组件 + 状态 hook | 不直接摸 DOM / 存储 |
| `packages/mcp-server` | Stage 5A 本地 MCP Adapter：stdio 生命周期、目录配置与 `fsSafe`、课程/包/会话/上下文 6 个工具、五级教学 Prompt | 不引用 React / DOM / IndexedDB；不执行 Python；不联网；不扫描磁盘；不复制第二套校验规则 |
| `packages/ai-gateway` | Stage 6A 本地 HTTP Gateway：provider 适配（Ollama/OpenAI/Mock）、请求 Schema、五级 Prompt 组装、回复校验与降级、Origin/体积/速率/超时控制 | 不引用 React/DOM；不读文件；不执行 Shell/Python；不监听非 loopback；目标地址只能来自启动配置 |
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
- JS → 3 秒限时 Worker；Python → Pyodide Worker（CDN 按需加载）：初始化/下载单独给 120 秒预算，用户代码执行仍限 30 秒；`trace()` 支持真实变量快照与显式行号。
- 两个 runner 产出的 `frames` 统一由 `domain/trace/adapter.ts` 转为 Trace Event Schema v1，再由 `schema.ts`（Zod）校验后才进入播放/同步面板。
- README 与界面文案都明确写出哪些能力是「协议 / 占位」，避免把未实现标记成已支持。

### 3.4 安全边界
- 浏览器不保存任何模型厂商密钥；AI 请求只发到同源 Gateway（Stage 6A），或用户自部署的 legacy `/api/ai` 代理（练习/自定义导入）。
- Stage 6A Gateway 固定 `127.0.0.1`，要求 Origin 允许列表 + 自定义 `x-algolens-client` 头，拒绝跨站 `Sec-Fetch-Site`，不使用 CORS `*`；请求体/响应/超时/速率均有上限。Provider 目标地址只来自启动配置，请求体不能改 URL；无文件读取、无 Shell、无 Python 控制。
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

### 3.7 知识包：内容与应用分离，安全先行（Stage 4）
- **包是内容**：`.algopack` 只是 ZIP，里面只有 `manifest.json`、JSON 课程、UTF-8 Python 示例与 `LICENSE`；没有自定义渲染器、没有 JS/CSS，因此 Core 不需要为包新增执行入口。
- **三段式校验**：`domain/packs`（纯策略：路径白名单 + 中央目录元数据）→ `runtime/packs/zip.ts`（有界解压：条目数/单文件 512 KiB/总 3 MiB/压缩比 200:1，1 KiB 切片边解压边计数，核对声明长度）→ `domain/packs/validate.ts`（manifest + Lesson Schema + 算法/内置/跨包冲突 + 版本），全部通过后才产生预览。
- **存储单事务**：`algolens-packs` v1 三个 store（`packs` / `lessons` / `examples`），安装、替换、卸载都在**一个 readwrite 事务**内完成；写事务前先读完旧行，写事务内同步发全部请求再 `await transactionDone`，避免 `await` 让事务失活。配额/失败统一映射成 `storage-quota` / `storage-failed`，不会退化成 `UnknownError`。
- **注册表组合而非重写**：`createLessonCatalog(packs)` 把内置课程放在前面，每个包仍用 `createLessonRegistry` 独立校验；单个包数据损坏被跳过，不影响内置课程或其它包。`originOf(algorithmId)` 返回 `builtin` 或 `{pack, packId}`，UI 据此显示来源徽标与「载入课程示例」按钮。
- **示例只载入不执行**：`applyCourseExample()` 只写编辑器 + 切语言 + 填 `input`，不调用 `runForLanguage`（App 级测试断言运行次数不变）；用户点「运行」才进既有 Pyodide Worker。Pyodide 不是恶意 Python 的沙箱，风险在预览阶段明示。
- **可作者化**：`scripts/build-pack.mjs` 打包、`scripts/validate-pack.ts` 跑真实 `readPackArchive` + `validatePack`，与浏览器同一条校验链，CLI 通过即导入可用。

### 3.8 MCP Adapter：共享 Core，隔离宿主（Stage 5A）
- **Adapter 不是第二个后端**：`packages/mcp-server` 只把已有 Core 暴露给 MCP 宿主。课程来自 `domain/lessons`，包解析复用 `runtime/packs/zip.ts` + `domain/packs/validate.ts`，两种文件格式来自 `domain/sessions`；没有第二套课程、第二套包规则、第二套 Trace。
- **一个方向、一个通道**：Node 侧 `StdioServerTransport`，stdout 只走 JSON-RPC，所有诊断写 stderr。没有 HTTP、没有 WebSocket、没有监听端口，因此不需要鉴权层，也不构成新增攻击面。
- **能力即目录**：`--pack-dir`（只读包）/ `--session-dir`（只写会话）/ `--context-dir`（只读上下文）必须由用户显式给出（CLI 或 `ALGOLENS_*` 环境变量，绝对路径）。未配置时对应工具直接禁用并给出配置方法，**不猜默认目录、不扫描磁盘**。
- **文件名不是路径**：`fsSafe.ts` 统一执行四道闸门——裸文件名正则 → `realpath` 容器校验 → `lstat` 拒绝符号链接 → `stat` 大小预检；写侧用 `wx` 独占创建，同名自动加 `-2..-50` 后缀，**永不覆盖**。
- **浏览器不可见是事实而非缺陷**：包安装在 IndexedDB，stdio 进程读不到。`list_available_packs` / `list_lessons` 显式输出 `browserIndexedDbVisible:false`；会话用 `lessonOrigin` 记录来源，导入时包缺失返回 `origin-pack-missing` 并提示先安装。
- **导入不执行，导出不重跑**：`useSessionTransfer` 的 apply 只做 stop → flush → 切语言 → 写编辑器/输入 → 清空事件；导出只序列化 `events[index]`，不调用 `runForLanguage`。App 级测试用"运行次数不变"与"帧号不变"断言这两条。
- **Prompt 不给 AI，只给宿主**：`teach_algorithm` 组装课程与真实帧，并硬性区分"数据/指令"、"真实帧/推断"；不内置模型调用，也不需要任何 API Key。Prompt 约束是模板，不承诺绝对防剧透。

### 3.9 AI 导师：Gateway 拥有模型，页面只有真实帧（Stage 6A）
- **一个契约两处执行**：`src/domain/mentor/schema.ts` 同时被浏览器与 Gateway 引用。`mentorContextSchema` 内嵌 Trace Event Schema v1 并强制 `stepIndex === event.step`；`mentorReplySchema` 限制每个字段长度/条数；浏览器收到回复后再次复验，失败就拒绝展示。
- **真实帧是唯一输入**：`buildMentorContext` 是纯函数，只从 `lab.events[lab.playback.index]`、课程阶段与 `traceStale` 构造，不重新执行、不猜测变量；源码默认不发送，勾选后才带 40k 上限。
- **Provider 是边界**：`AIProvider` 只有 `status/generate`；Ollama 走 `/api/tags` + `/api/chat (stream:false, format:json)`，云端只实现 OpenAI Chat Completions。目标 URL、Key、超时全在 Gateway 启动配置里；请求体无法改变目标。
- **五级 + 确定性降级**：Prompt 约束是软约束，所以 `parseMentorReply` 还做硬处理：Level 1–3 隐藏所有代码围栏，Level 4 隐藏实现型围栏，披露等级超契约就降级，并记录 `guardrails`。Level 5 必须前后端双重确认。
- **请求与步骤绑定**：组件用 requestId + 快照元数据（algorithmId、stepIndex、totalEvents）记录每条回答；切换帧会 abort 在途请求并清空对话，历史回答即使在返回后也只属于它自己的帧，卡片显示“来自之前的步骤”。模型不能改播放位置、Monaco、变量或 Trace。
- **静态与本地分界**：GitHub Pages 无 `/api/*`，面板进入离线态并显示标注“非 AI”的本地提示；算法、课程、Python、知识包与 MCP 不受影响。完整 AI 只在本地 `npm run dev` + `npm run ai:dev`。

### 3.10 学习实验室：一个主工作区，按需标签（Stage 7A）
- **信息层级**：`.lab-shell` 是「可折叠目录 + 主列」。`LabView` 的 `.lab-primary` 在宽屏为「动画/时间轴 + Monaco」两列；「当前步骤」紧接动画（`VisualStage`）之后，时间轴紧随其后；变量、课程、AI、工具进入 `WorkspaceTabs`。`ConceptPanel` 不再常驻，`LessonPanel` 使用 compact 模式，完整讲义折叠。
- **单一代码面**：`SyncPanel` 保留只读源码能力，但 `LabView` 传 `showSource={false}`，只显示「查看已执行源码快照」；Monaco 继续持有草稿、行高亮、Marker 与 traceStale。
- **状态不随面板卸载**：`WorkspaceTabs` 同时挂载四个 panel，只切换 `hidden` 与 `aria-selected`；Monaco、时间轴、Trace 位于标签之外。`WorkspaceTabs.test.tsx` 用输入框草稿证明隐藏面板不丢状态，E2E 再验证真实 Monaco 草稿与运行进度不变。
- **响应式是顺序变化而非第二套布局**：≤1279px 令 `.lab-primary { display:contents }`，按动画 → 当前步骤 → 代码 → 标签页重排；≤899px 目录变顶部算法选择；≤760px 单列，课程 steps 纵向内部滚动。`scripts/capture-ui.mjs` 在五个视口实测 `scrollWidth == clientWidth`。
- **导航收敛**：`NavTabs` 只保留学习实验室、知识包、更多工具；题库（暂停）与 AI 导入（实验）在 `nav-more-menu` 中保留原页面与数据，不删除兼容逻辑。

### 3.11 栈/队列专属动画：结构语义与纯映射（Stage 7B）
- **协议向后兼容**：`TraceEvent.structure?` 是可选的 `{kind, operation, items[], targetId?, removed?}`。`items` 是操作之后的容器快照（栈 bottom→top，队列 front→rear），元素有稳定 `id`；`pop/dequeue` 必须同时带 `removed`，`targetId` 必须匹配它。旧 Trace 没有该字段时仍通过 Schema v1，继续使用 legacy nodes。
- **运行器记录，不猜文本**：Python `trace(..., structure=...)` 把结构对象深拷贝进帧；adapter 只透传通过 `structureSnapshotSchema.safeParse` 的 payload，非法结构整块丢弃、保留 legacy 视图，绝不半应用。React 组件不根据 `message`、算法名或数组长度变化推断操作。
- **纯模型映射**：`buildVisualModel(state, labels, structure?)` 只在 `state.type` 与 structure kind 匹配、`items.length === state.values.length` 且语义合法时返回 `stack`/`queue` 模型；否则返回 `raw invalid`。`StructureVisuals` 只画模型：栈 DOM 按 top→bottom，队列按 front→rear，`data-element-id/value/role/status` 供 E2E 断言。
- **动画由帧状态决定**：`push/enqueue` 目标项 `entering`，`peek/front` 高亮目标，`pop/dequeue` 的 `removed` 单独显示为 `leaving`；任意跳帧直接渲染该帧快照，不依次重放未执行的状态。回退恢复快照中的元素；`prefers-reduced-motion` 关闭位移但保留文字、颜色与角色标签。
- **课程与默认语言**：`stack-lifo-basics` / `queue-fifo-basics` 的 stepId 与 Python `lesson_step=` 完全一致（empty/push/peek/pop/done；empty/enqueue/front/dequeue/done）。选中 stack/queue 时默认切到 Python，但仍允许用户切回 JS legacy 演示。

### 3.12 单链表专属动画：节点身份与真实指针赋值（Stage 7C）
- **协议是 union，不是第二套 Trace**：`structureSchema = z.union([structureSnapshotSchema, linkedListSnapshotSchema])`。旧 stack/queue 事件不变；`linked-list` 事件是 `{kind, operation, headId, nodes[], targetId?, change?}`，`nodes` 是当前 Python 程序仍持有的全部 Node（含尚未接入或刚断开的节点），可达链只由 `headId` + `nextId` 推导，数组顺序不参与排序。
- **节点身份是 `node_id`**：Python `Node` 有真实 `node_id/value/next`，`next` 指向另一个 Node 或 `None`；不使用 Python `id()` 作跨运行 ID，不直接把 Node 交给 JSON，而是每帧 `node_json()` 生成 `{id,value,nextId}`。同值不同节点在 Schema、模型和 DOM 中始终分开。
- **指针变化来自真实赋值**：`change = {nodeId, beforeNextId, afterNextId}` 只在 `set-next` / `detach` 出现，`afterNextId` 必须等于该节点当前 `nextId`，`targetId` 必须等于 `change.nodeId`；`detach` 必须记录 `next = null`。Schema 拒绝重复 ID、悬空 `headId/nextId/targetId`、超过 40 个节点、缺少 change、change 与快照不一致，以及任何环（含只在 detached 节点之间的环）。
- **纯模型与渲染分离**：`linkedListModel.ts` 从 `headId -> nextId` 构造主链，把不可达节点放入 `detachedNodes`；状态区分 `temporary`（create/set-next 目标尚未接入）与 `detached`。`LinkedListVisual` 只渲染模型：节点数据格 + next 格、SVG 箭头、HEAD 向下箭头、尾部 NULL、下方临时/断开托盘、指针变化徽章；不持有播放索引、不复制真实节点状态、不解析 message。
- **任意帧直接渲染**：每一帧都是完整快照；拖动、回退和跳帧只替换 `currentEvent`，不会逐帧重放未执行的指针赋值。`prefers-reduced-motion` 关闭节点进入动画与过渡，保留文字、边框、箭头和角色标签。
- **课程与默认语言**：`linked-list-pointer-basics` 的 8 个 stepId（init/create/find/connect/insert/unlink/traverse/done）与 Python `lesson_step=` 完全一致；选中 `linked` 时默认 Python，同时保留 legacy JS 数组帧与旧视图。

### 3.13 二叉树专属动画：层级、三种递归与调用栈联动（Stage 7D）
- **协议仍是同一个可选 `structure`**：`structureSchema` 扩为 stack/queue、linked-list、binary-tree 三分支。树快照为 `{kind:'binary-tree', traversal, operation, rootId, nodes[{id,value,leftId,rightId}], currentNodeId, visitedIds, pathIds}`；旧栈/队列/链表/legacy Trace 保持不变。
- **结构安全规则**：节点最多 40 个；ID 唯一；`leftId/rightId` 必须指向存在的节点或 null；`rootId` 必须存在（空树为 null）；每个非 root 最多一个父；无环；所有节点必须从 root 可达；`visitedIds/pathIds` 只能引用存在的节点；`pathIds` 必须从 root 连续到当前节点。`init/done` 的 current 为 null 且路径为空；其他操作 current 非空；`visit` 的 current 必须已在 visited；`left/right` 必须确有对应孩子。
- **真实 Python 树**：`TreeNode` 保存 `node_id/value/index/left/right`，层序数组建树后将引用转换为 `leftId/rightId`；节点 ID 是 `n1…n7` 教学身份，不使用 Python `id()`，不把对象直接 JSON 序列化；每帧生成独立快照，后续递归不能污染历史。
- **三模式共用一棵树与一个 `inorder` 条目**：合法输入为旧数组（默认中序）或 `{mode, tree}`；`MODE` 记录真实执行模式。`traverse(node)` 内按模式在左递归前、两次递归之间或右递归后调用 `visit_node`，左右递归使用真实 `node.left/right`，没有预写结果数组。
- **递归帧与树帧分离**：`@tracked` 仍用 `fN` 标识函数帧，树节点用 `nN`；`enter_hook` 在帧入栈后追加 PATH、生成进入帧；`return_hook` 在弹出前生成返回帧。调用栈来自真实 `_CALL_STACK`，UI 不根据节点位置推断帧。
- **纯布局与渲染**：`layoutBinaryTree(nodes, rootId)` 用迭代中序分配列、深度分配行，返回稳定节点/边坐标；空树/缺失 root 返回空布局，不可达节点不绘制，带 `seen/inStack` 防护环。`BinaryTreeVisual` 只渲染 `BinaryTreeVisualModel`：根/左/右层级、SVG 父子边、当前节点边框、已访问序号、递归路径、ROOT/LEAF 与模式/操作标签；宽树在画布内滚动，不让页面横向溢出。
- **当前 ≠ 已访问**：`enter` 只改变当前节点与路径；`visit` 才追加访问序号。中序/后序的当前节点可以没有序号。任意跳帧只替换 `currentEvent`，树、栈、变量一起恢复；`prefers-reduced-motion` 关闭过渡但保留状态与文字。
- **课程与模式选择**：`binary-tree-traversal-basics` 的 9 个 stepId（init/root/enter/left/visit/right/return/order/done）与 Python `lesson_step=` 一致；模式选择器只改写输入 `{mode, tree}`，旧 Trace 保留并显示 pending，必须由用户明确 Run 才生成从第 0 帧开始的新 Trace。

### 3.14 图 BFS / DFS：一张图、一个 Frontier、一条事件流（Stage 7E）
- **协议是第四个 `structure` 分支**：`structureSchema` 在 stack/queue、linked-list、binary-tree 之外增加 `graph`。快照为 `{kind:'graph', algorithm:'bfs'|'dfs', operation, nodes[{id,value}], edges[{id,fromId,toId}], startNodeId, currentNodeId, currentEdgeId, neighborNodeId, discoveredIds, visitedIds, visitOrder, frontierKind, frontierItems[{id,nodeId}], frontierRemoved}`。旧 stack/queue/linked-list/tree 与 legacy Trace 的字段、校验和渲染路径不变。
- **无向简单图，显式拒绝非法输入**：节点/边 ID 唯一；每条边端点必须存在；拒绝自环、重复无向边和悬空引用；环图合法，且不会导致无限布局。空图的 `startNodeId` 必须为 null；非空图的 `startNodeId` 必须存在。`currentNodeId` 必须已 discovered；`currentEdgeId` 必须真实且至少触及当前节点。`visitedIds === visitOrder`、visited ⊆ discovered，frontier 节点必须 discovered、未 visited 且不能重复。BFS 只允许 queue + enqueue/dequeue，DFS 只允许 stack + push/pop。节点 20、去重边 40、frontier 20 的上限防止单帧耗尽 Trace 配额。
- **三种状态正交表达**：`discovered` 是“已进入待办集合”，`frontier` 是其中真正排队/压栈的节点，`visited` 是已经正式处理的节点。BFS 在入队时 discovered、出队后 visit；DFS 在压栈时 discovered、弹出后 visit。`current`（`currentNodeId`）与 `visited` 是两个维度，不能互斥覆盖：当前节点可能刚出队但尚未 visit，也可能刚 visit 仍在栈中。模型用 `state ∈ visited|pending|undiscovered` 加独立 `current/visited/visitIndex/inFrontier` 表达，避免把“当前”误当“已访问”。
- **确定性布局**：`graphLayout.ts` 只读节点 id 与边，不看访问状态。官方 A–G 图使用固定教学坐标；其他图按 id 排序，≤8 节点圆周、>8 节点网格，边按节点半径裁剪。同一图在每一帧、每次回退、每个主题下坐标完全一致；空图/孤立节点有独立安全分支，环图只绘制真实边，不做力导向震荡。
- **图和 Frontier 同帧派生**：`VisualStage` 的 `graph-traversal` 分支从同一个 `currentEvent.structure` 构造 `GraphVisualModel` 与 `graphFrontierModel()`；前者画 SVG 节点/边/当前边/访问序号，后者把同一 `frontierItems` 映射为 compact `QueueVisual` / `StackVisual`。没有第二个 `currentIndex`、第二个播放器、延迟计时器或 message 解析；回退/任意跳帧只替换 `currentEvent`，图与 Frontier 一起恢复到该帧的完整快照。
- **真实 Python 语义**：`graphTraversalExamples.ts` 使用固定邻接表（A:[B,C] …），BFS 用 `collections.deque.popleft()`，DFS 用真实 list `stack.pop()` 并对邻居 `reversed()` 扫描，使邻接表首个邻居最终位于栈顶。每次 `trace` 记录真实调用行与 `lesson_step`；变量区同步 `queue`/`stack`、`current`、`discovered`、`visited`、`frontier_size`、`neighbors`。真实输出：BFS 51 帧访问 A→B→C→D→E→F→G；DFS 51 帧访问 A→B→D→E→F→G→C；两者都不是唯一合法序列。
- **课程与独立入口**：`graph-bfs-queue-basics` / `graph-dfs-stack-basics` 各 9 步，stepId 与 Python `lesson_step` 精确一致。BFS/DFS 保留 legacy 的两个独立 `bfs`/`dfs` 算法入口，共享同一套 Graph Schema/布局/模型/渲染器；切到 Python 时使用 rich `{start,nodes,edges}` 输入，切回 JS 时收窄为 legacy `{start}`，旧 JS 邻接表与帧快照不变。选中独立算法入口沿用既有“选择即运行 catalog preset”的行为并清空旧 Trace；没有旧帧被重新标成新模式。

### 3.15 Dijkstra 带权图：一个 Snapshot，三个联动面板（Stage 7F）
- **协议与 BFS/DFS 同级，不塞进无权重图**：新增 `weightedGraphSnapshotSchema`（`kind:'weighted-graph'`、`algorithm:'dijkstra'`），与 stack/queue、linked-list、binary-tree、`graph` 一起进入 `structureSchema` union。快照字段包括 `directed`、`startNodeId`、`targetNodeId`、`currentNodeId`、`currentEdgeId`、`neighborNodeId`、`distances[{nodeId,distance}]`、`previous[{nodeId,previousId}]`、`visitedIds/visitOrder`（真实 settled 顺序）、`frontierItems[{id,nodeId,distance,stale}]`、`frontierAdded/frontierRemoved`、`relax{nodeId,oldDistance,newDistance,oldPreviousId,newPreviousId}`、`pathNodeIds` 与 `pathDistance`。原 `graphSnapshotSchema` 与 BFS/DFS 渲染路径、测试完全不变。
- **真实 Python 而非预置结果**：`dijkstraExamples.ts` 用标准 `heapq.heappush/heappop`；堆元组含单调 `entry_seq`，因此相同距离的节点不会比较字符串，也不会随机重排。输入在产生帧前拒绝负权、NaN/Infinity、自环、重复边、悬空端点与非法 start/target；上限为 20 节点、40 条去重边。`float('inf')` 只在快照边界经 `safe_distance()` 变成 JSON `null`，Trace 中不存在非法 Infinity。空图允许 `init/done` 且 start/target 为 null；起点=目标时路径长度为 1、权重为 0。
- **状态语义严格分开**：`discoveredIds` 是“曾进入候选集”，`visitedIds` 是“已经 settle”，`previous` 是“当前最短路径树”，`frontier` 是“真实堆中的全部条目（可重复节点）”。过期条目只发 `stale`，移除记录标记 `stale:true`；不再为同一旧条目额外发 `pop`，因为 `pop` 帧未 settle 的语义与真实堆状态冲突。`relax` 只允许严格降低距离；`skip` 不允许隐藏严格改进；fresh 堆项距离必须等于当前距离，settled 之后仍留在堆中的项必须标记 stale。
- **最终路径是校验出来的**：`done` 帧的 `pathNodeIds` 必须从 start 到 target，相邻节点必须有真实边（有向图看方向），且 `previous[to] === from`；`pathDistance` 必须等于目标距离行。另有全帧校验：每个有限距离节点的 `previous` 链必须无环地回到 start；不可达节点 `previous` 必须为 null；start 一旦发现距离必须为 0；`visitedIds === visitOrder` 且 settle 只追加当前节点。这样“最终路径”不是渲染器拼出来的字符串。
- **三个面板同帧派生**：`VisualStage` 的 `weighted-graph` 分支从同一个 `currentEvent.structure` 构造 `GraphVisualModel`；`GraphVisual` 在原有节点/边骨架上增加边权标签、有向箭头、target ring/tag、settled 状态、`d=X`、relax 前后条带、距离表与路径摘要；`PriorityQueuePanel` 独立渲染 `(distance, node)`、加入/弹出/过期，复用 compositor key 但没有把 PQ 冒充 `QueueVisual`/`StackVisual`。优先队列的展示顺序只在模型副本按 `(distance,nodeId,entryId)` 排序，原始帧数组不被重排。没有第二个 `currentIndex`、第二个播放器或 message 解析；回退/跳帧只替换 `currentEvent`，图、距离表、PQ、变量和步骤一起恢复。
- **默认真实结果**：A–G 无向图，start A、target G；46 帧，settle 顺序 A→B→C→E→F→D→G，路径 A→B→E→F→G、总权重 7；7 次 relax、1 次 stale。F 先由 C 得到 6，再由 E 松驰为 4，旧 `(6,F)` 堆项在之后的 `stale` 帧移除；这是“重复候选/过期条目”的教学证据。
- **课程与算法目录**：`dijkstra-weighted-shortest-path` 9 步（init/start/pop/stale/settle/inspect/relax/skip/done），stepId 与真实 Python `lesson_step=` 逐帧一致；讲清距离表、松弛、最小候选、PQ、previous 恢复、负权不适用、复杂度与常见错误。算法目录新增第 15 个 `dijkstra`。`legacy/algorithm-definitions.js` 只放显式 JS 提示桩，避免旧无权重 `Graph` 渲染器伪造带权结构；真实带权演示始终走 Python preset。
- **窄屏策略**：加权图沿用 `graphLayout.ts` 的确定性坐标；`stage7f.css` 在 ≤760/≤420 调整图例、距离表与 PQ 堆叠。390px 下画布保留可读最小宽度并在自身内部横向滚动，`justify-content:flex-start` 防止超宽 SVG 两端同时被裁掉；页面本身不横向溢出。
### 3.16 最小生成树：共享带权图骨架，Prim 与 Kruskal 各自解释（G2）
- **两个独立快照，不塞进 `weighted-graph`**：`primMstSnapshotSchema`（`kind:'prim-mst'`）与 `kruskalMstSnapshotSchema`（`kind:'kruskal-mst'`）同时进入 `structureSchema` union。Prim 记录 `treeNodeIds`、`componentNodeIds`、`componentIndex/componentCount`、`visitOrder`、heap `frontierItems`、`selectedEdgeIds/skippedEdgeIds`、`currentEdgeId`、`selectedEdge`、`totalWeight`、`connected/forest`；Kruskal 记录 `sortedEdgeIds`、`currentIndex`、`selectedEdgeIds/rejectedEdgeIds`、并查集 `parent`（含 `nodeId/parentId/rank/rootId`）、`componentCount`、`formsCycle`、`union{rootA,rootB,mergedRoot,attachedRoot,rankBefore,rankAfter,parentOfAttachedBefore,parentOfAttachedAfter,componentCountBefore,componentCountAfter}` 与总权重。两分支与旧 graph/weighted-graph 的字段、校验和渲染路径互不影响。
- **真实 Python，不是预置帧**：`mstExamples.ts` 中 Prim 用标准 `heapq.heappush/heappop`，堆元组带单调序号，保证同权候选有稳定次序；Kruskal 用真实并查集，`find` 路径压缩、`union` 按秩合并。共享 helper 在产生帧前拒绝有向图、自环、重复无向边、非有限权重、未知端点；上限 12 节点 / 30 条原始边 / 20 条唯一边，Prim 额外限制 10 节点以保证 heap 可读。最小生成树允许负权边，**不继承 Dijkstra 的非负权限制**。
- **Prim 语义**：候选边只要求“至少一端已在树内”，另一端在树外才是有效选择；每次 `pop` 后若另一端已在树内，写入真实 `skip` 帧，而不是提前把堆内边标成 skipped。树内顶点、候选边、已选边、跳过边分别渲染；当前边在 skip 帧同时保留 `current` 与 `skipped`，UI 显示“已跳过”徽标。完成条件为“堆空且所有节点已覆盖”，因此树覆盖全部顶点后仍会排空堆内无效边，`done` 才是最终态。
- **Kruskal 语义**：`init` 的排序表为空，`sort` 帧才给出完整稳定顺序；`inspect-edge` 只比较 union 前的两个根，`union` 帧记录真实合并双方与 rank 变化，`reject-edge` 只有根相同才允许，且必须不动 parent/rank。`componentCount` 是并查集实时分量数：连通图在中间 union 帧仍可能大于 1，所以“图不连通 / 最小生成森林”警告只在最终 `done && forest` 出现，不能把中间态误判为森林结果。
- **默认教学图**：5 节点 A–E，边输入顺序 B–C 2、A–B 2、A–C 2、C–D 1、D–E 1、C–E 3，start A。Prim 21 帧，选 A–B、A–C、C–D、D–E，跳过 B–C、C–E，总权重 6；Kruskal 15 帧，排序 C–D、D–E、B–C、A–B、A–C、C–E，接受前四条、拒绝后两条，总权重 6。两算法边集不同，但最小总权重相同，专门用于讲“多解 MST / 总权重唯一”。
- **共享基础、不同面板、同一播放器**：`MSTVisuals.tsx` 复用 `mst-node` / `mst-edge` 基础图组件；Prim 面板是带权图 + 生成树指标 + heapq 队列 + 已选边 + 当前候选/跳过条，Kruskal 面板是带权图 + 排序边表 + 当前边根/环检测 + parent/rank/find 根表 + 集合成员 + union 详情。两者都只消费 `currentEvent.structure`，没有第二个 `currentIndex`、第二个播放器或 message 解析；回退/跳帧只替换 `currentEvent`，图、辅助面板、变量与课程一起恢复。
- **课程与目录**：`prim-minimum-spanning-tree` 8 步（init/start/push/pop/select/skip/component/done），`kruskal-minimum-spanning-tree` 6 步（init/sort/inspect-edge/reject-edge/union/done），stepId 与真实 Python `lesson_step=` 对齐。课程明确解释 MST 定义、MST 与最短路径的区别、Prim 的横切边贪心、Kruskal 的全局排序 + 并查集、为什么不能成环、为什么不同边集可以有相同最小总权重、负权允许、非连通森林以及有向图不支持。默认连通图没有 `component-start` 帧，Prim 的 `component` 步骤作为断连边界说明保留，步骤列表显示 0 帧。
- **窄屏策略**：`g2.css` 在 980/560 断点把面板改为单列；390px 下 `mst-graph-svg` 保留最小可读宽度并在自身容器内滚动，并查集表也在容器内滚动，页面本身无横向溢出。

### 3.17 拓扑排序与 AOE 关键路径：同一有向图骨架，两种教学叙事（G3）
- **两个独立快照，不塞进 `graph`**：`topologicalSortSnapshotSchema`（`kind:'topological-sort'`）与 `criticalPathSnapshotSchema`（`kind:'critical-path'`）进入 `structureSchema` union。拓扑快照记录 `indegree`、FIFO `queue`、`queueAdded/queueRemoved`、`currentNodeId/currentEdgeId/neighborNodeId`、`indegreeChange`、`removedEdgeIds`、`topologicalOrder`、`hasCycle/cycleNodeIds`；AOE 快照记录 `sourceNodeIds/sinkNodeIds`、`topologicalOrder`、`veRows/vlRows`、`activities`（e/l/slack/critical）、`timeChange/activityChange`、`criticalEdgeIds`、`criticalPaths`、`projectDuration`、`hasCycle/cycleNodeIds`。两分支与 G1/G2 快照字段、校验和渲染路径互不影响。
- **真实 Python，不是预置帧**：`dagExamples.ts` 中 Kahn 使用 `collections.deque` 的 FIFO 候选队列、稳定队列 id `q1...`、真实入度与逐边移除；AOE 先用同一套依赖逻辑求拓扑序，前推 `ve[v]=max(ve[u]+duration)`，后推 `vl[v]=min(vl[w]-duration)`，逐活动求 `e/l/slack`，再沿零余量边 DFS 枚举源到汇关键路径。两者都在产生帧前拒绝无向图、自环、重复同向边、未知端点；AOE 额外拒绝负/非有限持续时间。教学上限 12 节点 / 30 条原始边 / 20 条唯一边或 20 项活动。
- **拓扑语义**：初始源点按顶点输入顺序入队，保证同输入每次播放一致；`inspect-edge` 与 `decrement` 是两个真实帧，减一前不伪装成已移除；入度到 0 才入队。队列为空但仍有顶点时，剩余顶点入度均大于 0，进入 `cycle` 并保留 `cycleNodeIds`，不把环硬塞进序列。非连通 DAG 合法，按分量分别排序；单点输出单元素序列，空图只产生 init/done。
- **AOE 语义**：所有入度 0 的源事件 `ve=0`；所有出度 0 的汇事件 `vl=projectDuration`；`projectDuration=max(ve[sink])`。默认图有两条关键路径 `A→B→E→F` 与 `A→C→D→E→F`，不得只标一条；B–D 余量 1，正确显示为非关键。有向环拒绝，负持续时间拒绝；关键路径是决定最短工期的**最长**路径，课程明确与 Dijkstra 最短路径对照。枚举上限 12，超过时 Python 显式 `raise ValueError`，不静默截断。
- **共享基础、不同面板、同一播放器**：`DAGVisuals.tsx` 复用 `mst-node` / `mst-edge` 基础图组件和 `layoutDag` 的最长路径分层坐标（源在左、后继在右），但拓扑面板是“图 + 入度表 + FIFO 队列 + 当前序列”，AOE 面板是“AOE 图 + 阶段轨道 + 事件 ve/vl 表 + 活动余量表 + 全部关键路径”。两者只消费 `currentEvent.structure`，没有第二个 `currentIndex`、第二个播放器或 message 解析；回退/跳帧只替换 `currentEvent`，图、辅助面板、变量与课程一起恢复。
- **课程与目录**：`topological-sort-kahn` 8 步（init/seed/dequeue/inspect/decrement/enqueue/cycle/done），`aoe-critical-path` 7 步（init/topo/ve/vl/activity/cycle/done），stepId 与真实 Python `lesson_step=` 对齐。课程覆盖 DAG/入度、多合法序列、确定性、环、非连通、AOV/AOE 区别、最长路径 vs 最短路径、多源多汇、多关键路径、复杂度与常见错误。默认图没有 cycle 帧，两门课程的 cycle 步骤作为边界说明保留，步骤列表显示 0 帧。
- **窄屏策略**：`g3.css` 在 980/560 断点把面板改为单列；390px 下 DAG 画布与表格在各自容器内滚动，页面本身无横向溢出。

### 3.18 连通分量与 Kosaraju SCC：同一图骨架，两种可达性（G4）
- **两个独立快照，不扩展 `graph`**：`connectedComponentsSnapshotSchema`（`kind:'connected-components'`）与 `kosarajuSnapshotSchema`（`kind:'kosaraju'`）进入 `structureSchema` union，union 从 11 个分支增至 13 个。连通分量快照记录无向 `nodes/edges`、`currentNodeId/currentEdgeId/neighborNodeId`、`discoveredIds/visitedIds`、`frontierItems`（显式 DFS 栈）、`currentComponentId/componentCount/components`；SCC 快照额外记录 `phase`、`reversed`、`finishOrder`、`secondPassOrder/secondPassIndex`。两个分支与 BFS/DFS 的 `graph` 语义、G1/G2/G3 快照互不影响。
- **Schema 校验要点**：无向边按无序对拒绝重复，有向边按同向对拒绝重复；拒绝未知端点、自环、重复节点；分量 id 连续、节点不可重复分配；`visitedIds` 必须是 `discoveredIds` 子集；栈项 id 唯一，`added` 必须在栈内、`removed` 必须已不在栈内；SCC 的 `secondPassOrder` 必须严格等于完成顺序的逆序；`reverse` 帧重置第二遍 discovered/visited/栈/分量；`done` 必须覆盖全部节点且每个节点恰好属于一个完整分量。
- **真实 Python，不是预置帧**：`componentExamples.ts` 中连通分量使用迭代 DFS，而不是递归；按节点输入顺序选择未发现根，按输入边顺序构建邻接表，栈用 Python list。`start-component` 同时发现根并入栈，`discover` 与 `push` 分成两帧，便于观察“发现”和“入栈”不是同一事件。SCC 使用迭代 Kosaraju：第一遍原图 DFS 记录真实完成顺序；`reverse` 帧反转所有边，清空第二遍状态但保留完成顺序；第二遍按完成顺序逆序扫描，在反向图 DFS，逐个 SCC 分配。迭代栈保存 `[node, nextAdjacencyIndex]`，避免回溯后重复扫描。
- **默认教学图**：连通分量 8 节点、5 条无向边（A–B、A–C、B–C、D–E、F–G，H 孤立），50 帧，`C1={A,B,C}`、`C2={D,E}`、`C3={F,G}`、`C4={H}`。SCC 8 节点、7 条有向边（A→B、B→C、C→A、C→D、D→E、E→D、F→G），60 帧；第一遍完成顺序 `E,D,C,B,A,G,F,H`，第二遍顺序 `H,F,G,A,B,C,D,E`，5 个 SCC：`{H}`、`{F}`、`{G}`、`{A,C,B}`、`{D,E}`。
- **为什么不能只靠忽略方向**：默认 SCC 图若按无向边连通性分组，A–E 会被并成一个 5 节点分量；Kosaraju 的真实结果把 A/B/C 与 D/E 分成两个 SCC，F→G 与 H 各自独立。`reverse` 帧的边标签保留 `rev u→v`，UI 同时显示“反向图 / 边已反转 / 阶段轨道”，不要求用户从颜色猜方向。
- **共享基础、不同面板、同一播放器**：`ComponentVisuals.tsx` 复用 `mst-stage / mst-layout / mst-panel / mst-graph-scroll / mst-graph-svg / mst-node / mst-edge` 和 `layoutGraph`；连通分量面板是“无向图 + 显式 DFS 栈 + 当前 C + 分量结果 + 节点状态表”，SCC 面板额外有“阶段轨道 + 完成顺序 + 第二遍处理顺序 + 反向图”。两者只消费 `currentEvent.structure`，没有第二个 `currentIndex`、第二个播放器或 message 解析。
- **视觉语义**：节点、分量行、节点状态表都带 `C1/C2/...` 文本编号与组色；颜色只是辅助，不是唯一语义。SCC 的完成序号用节点左上角小徽标；第二遍当前根用 ROOT 标签；当前节点用 ring 高亮。
- **课程与目录**：`connected-components-dfs` 10 步（init/start/pop/visit/inspect/discover/push/skip/complete/done），`strongly-connected-components-kosaraju` 11 步（init/start-first/inspect/push/skip/finish/reverse/start-second/assign/complete/done），stepId 与真实 Python `lesson_step=` 对齐。课程覆盖无向连通分量、孤立点、DFS 确定性、普通连通 vs 强连通、边方向、转置、完成顺序、为什么两遍、复杂度 O(V+E) 与常见错误。
- **窄屏策略**：`g4.css` 在 980/560 断点把面板改为单列；390px 下图画布与结果表在各自容器内滚动，页面本身无横向溢出。

## 4. 测试策略

| 层次 | 工具 | 覆盖 |
| --- | --- | --- |
| 纯逻辑单测 | Vitest | 主题解析、播放状态机（含 `clampPlayback`）、可视化映射、i18n、题库数据、关键词路由、教学课程校验与阶段查找、**知识包 manifest/路径/中央目录/内容校验** |
| 帧回归 | Vitest + legacy 快照 | 23 个 catalog 入口逐帧一致（12 个 legacy 动画 + 阶乘/斐波那契 + Dijkstra/Floyd/Bellman/Prim/Kruskal/拓扑/关键路径/连通分量/SCC 真实 Python preset）、空/重复/单元素输入、排序终态 |
| 存储单测 | Vitest + fake-indexeddb | 安装成功、刷新恢复、卸载隔离、重复安装、版本冲突/显式替换、写事务失败回滚、配额映射、存储不可用 |
| 会话/上下文格式 | Vitest（node + jsdom） | 两文件 Schema、格式版本、未知键拒绝、`stepIndex === event.step`、大小限额、篡改检测、导出不重跑 |
| MCP 协议 | Vitest + 官方 SDK `Client` + `InMemoryTransport` | 工具/提示词发现、参数校验、内置+包课程、中英 stepId、未知 lesson/step、会话写盘复验且从不覆盖、上下文读取（穿越/绝对路径/符号链接/超限/篡改/坏 JSON）、恶意包文本、Prompt 五级 |
| AI Gateway（Stage 6A） | Vitest + 真实 `http` 临时端口 + 注入 fake provider + `fetch` stub | 请求 Schema、Origin/自定义头/跨站、体积/速率、Level 5 授权、Provider 401/404/429/超时/无效 JSON、防剧透降级、Mock 显式开启、错误不泄 Key；Ollama/OpenAI 适配器分别用 fetch stub 覆盖 |
| AI 导师组件 | Vitest + jsdom + Testing Library | 连接状态、发送真实帧、切换步骤后旧回答不冒充新步骤、中止、离线本地提示、Level 5 确认、模型结构化字段渲染 |
| stdio 子进程 | Node + `StdioClientTransport` | 真实 `dist/server.mjs` 启动、握手、6 工具、真实上下文回读、stderr 诊断（`scripts/smoke.mjs`） |
| 结构语义（Stage 7B） | Vitest + Schema/模型/组件 | `structure` 合法与非法、重复 id、pop/dequeue 必带 removed、旧 Trace 兼容、栈/队列模型映射、空态、DOM 顺序与 removed 独立渲染 |
| 单链表语义（Stage 7C） | Vitest + Schema/模型/组件/Python | linked-list 合法/空表/同值不同 ID/悬空引用/环/40 上限；主链由 nextId 而非数组顺序；HEAD/临时/断开/回退；真实 Node 示例 22 帧；DOM 节点、箭头目标、变化徽章 |
| 工作区布局（Stage 7A） | Playwright + 真实页面 | 1440 并排 + 当前步骤落在 900 高首屏；1024/390 无页面级横向溢出；标签切换保留 Monaco 草稿、不自动运行；方向键切标签、Escape 关闭菜单；AI 错误折叠 |
| 组件冒烟 | Vitest + jsdom + Testing Library | 23 个算法入口、时间轴交互与 **Trace 切换重置**、三态主题、语言切换、视图切换、调用栈面板与作用域变量、教学面板（高亮/禁用/跳转/空态）、知识包页（预览/确认/卸载/错误文案）、**App 级导入→课程→卸载** |
| 令牌契约 | Vitest 读 CSS 文本 | 两套主题 token 完整性、无硬编码颜色 |
| E2E | Playwright（真实 Edge 无头 + `vite preview`） | Monaco 加载、Python 冒泡同步高亮、SyntaxError 波浪线出现/清除、草稿自动保存/刷新恢复、主题切换、真实 Pyodide 阶乘/斐波那契递归栈、JS 长短 Trace 切换重置、**教学步骤与真实数组/变量/调用栈同步**（`e2e/lab.spec.ts`）、**知识包导入→安装→刷新恢复→卸载**与**包内 Python 示例真实 Trace**（`e2e/packs.spec.ts`）、**Agent 会话导入→用户运行→步骤同步**与**导出真实帧→Schema 复验**（`e2e/session.spec.ts`） |
| 栈/队列 E2E（Stage 7B） | Playwright + 真实 Pyodide | 真实 7 帧栈/队列、DOM 顶→底/前→后顺序、Peek/Front 不移除、Pop/Dequeue 与回退、1024/390 无横向溢出、Light/Dark、Reduced Motion、36 张真实截图 |
| 二叉树语义（Stage 7D） | Vitest + Schema/布局/模型/组件/Python | 空树/单节点/只有左或右孩子/同值不同 ID/重复 ID/悬空引用/多父/环/40 上限；根上、左孩子左下、右孩子右下、同层不重叠、边不交叉；三种遍历访问序列与真实递归路径；调用栈、变量、源码行、9 个 stepId；任意帧坐标稳定 |
| 二叉树 E2E（Stage 7D） | Playwright + 真实 Pyodide | 真实 30 帧：前序 4-2-1-3-6-5-7、中序 1-2-3-4-5-6-7、后序 1-3-2-5-7-6-4；递归下降/返回与三层调用栈；模式切换 pending 与旧 Trace 保留；回退恢复；空树/单节点/同值；1024/390 无页面溢出、Reduced Motion；栈回归；102 张截图 |
| 图语义（Stage 7E） | Vitest + Schema/布局/模型/Python 契约 | 空图/单节点/非连通/带环/重复节点/重复边/悬空端点/无效起点/无效 currentEdge/无效 discovered/frontier/类型不匹配；BFS queue 与 DFS stack 的操作约束；同一输入坐标稳定、孤立节点、边端点正确、布局无随机；真实 `deque`/list 栈、51/51 帧、访问序列、frontier 与变量一致、lessonStepId 与源码行 |
| 图 E2E（Stage 7E） | Playwright + 真实 Pyodide | BFS 7 节点/7 边、真实队列 `[A]→[B,C]→[C,D,E]`、访问序号 1–7、当前边 e1、Monaco 90–150、回退；DFS 真实栈 `[C,B]→[C,E,D]→[C]`、访问 A-B-D-E-F-G-C、任意跳帧；BFS↔DFS 切换不混用旧 Trace；空图/单节点/非连通/重复边/非法起点；1024/390 无页面溢出、画布内部滚动、Reduced Motion；90 张截图 |
| 图 E2E（Stage 7E） | Playwright + 真实 Pyodide | BFS 7 节点/7 边、真实队列 `[A]→[B,C]→[C,D,E]`、访问序号 1–7、当前边 e1、Monaco 90–150、回退；DFS 真实栈 `[C,B]→[C,E,D]→[C]`、访问 A-B-D-E-F-G-C、任意跳帧；BFS↔DFS 切换不混用旧 Trace；空图/单节点/非连通/重复边/非法起点；1024/390 无页面溢出、画布内部滚动、Reduced Motion；90 张截图 |
| 带权图语义（Stage 7F） | Vitest + Schema/模型/Python 契约 | 16 项 Schema：空图/单节点/不可达/有向/零权/相同距离、非法松弛（不降反升）、skip 隐藏改进、previous 环/断链、路径缺边/错成本、fresh/stale 堆项、重复节点/重复边/负权/NaN/Infinity/自环；7 项纯模型：距离表、target/settled/onPath、PQ 排序副本、relax 条带；真实 heapq 46 帧、7 relax、1 stale、F 6→4、路径/权重 |
| MST 语义（G2） | Vitest + Schema/模型/Python 契约 | 6 项 `mst.test.ts`：21+15 帧逐帧 Schema、Prim 树/堆/选中/跳过、Kruskal 根/环/拒绝/union、两算法总权重 6 但边集不同；`g2Lessons.test.ts` 5 项校验课程 stepId 与真实 fixture 一致 |
| MST E2E（G2） | Playwright + 真实 Pyodide | Prim 21 帧 heap/树/跳过/总权重、Kruskal 15 帧排序/并查集/接受/拒绝、两算法总权重一致但边集不同、负权/单点/非连通森林/有向拒绝；回退与任意跳帧同步；1440/390 无页面溢出；8 张 G2 截图 |
| DAG 语义（G3） | Vitest + Schema/模型/Python 契约 | 11 项 `dag.test.ts` + 10 项 `dagEdgeCases.test.ts`：默认 32/22 帧逐帧 Schema、逐边依赖、队列/入度同帧、拓扑非连通/环/单点/空图、AOE 多源/多汇/单点/空图，并以独立 ve/vl/slack/最长路径枚举交叉验证；`g3Lessons.test.ts` 6 项校验课程 stepId 与真实 fixture 一致 |
| DAG E2E（G3） | Playwright + 真实 Pyodide | Kahn 32 帧入度/队列/减一/入队/完成、非连通多合法顺序/环/单点、AOE 22 帧 ve/vl/余量/双关键路径、多源/多汇、负持续时间与无向图拒绝；回退与任意跳帧同步；1440/390 无页面溢出；7 张 G3 截图 |
| 连通性语义（G4） | Vitest + Schema/模型/Python 契约 | `components.test.ts` 12 项：50/60 帧逐帧 Schema、默认 4 分量/5 SCC、发现/栈/分量同帧、边界（非连通/单点/空图/完全连通/单向链/环/桥接）、SCC 双向可达性、转置帧、回退跳帧模型稳定、C 编号显示；`g4Lessons.test.ts` 6 项校验 10/11 步课程与真实 fixture stepId 一致 |
| 连通性 E2E（G4） | Playwright + 真实 Pyodide | 连通分量 50 帧发现/栈/C 编号/4 分量、Kosaraju 60 帧第一遍/转置/第二遍/5 SCC、空图、单向链 vs 有向环；回退与任意跳帧同步；1440/390 无页面溢出；6 张 G4 截图 |
| Dijkstra E2E（Stage 7F） | Playwright + 真实 Pyodide | 默认 46 帧图/距离表/PQ 同帧；`F=6→4` 与 previous `C→E`；路径 A→B→E→F→G=7；回退 45→27→21→3 三面板一起恢复并重跑；非连通 11 帧、相同距离 27 帧、单节点 5 帧、负权拒绝并清空图；1024/390 无页面溢出、画布内部滚动、Light/Dark；62 张截图 |
| 单链表 E2E（Stage 7C） | Playwright + 真实 Pyodide | 真实 22 帧：中间插入三阶段（create/set-next/predecessor）、删除绕过并清空 next、回退恢复、HEAD→NULL 遍历、同值不同 ID、栈/队列切换无残留、1024/390 无页面溢出、Reduced Motion、60 张截图 |
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
Stage 4（已完成）: 格式规范与限额 → 路径白名单 → 有界 ZIP 读取 → manifest/Lesson/冲突校验与预览 → IndexedDB 单事务安装 → 课程目录组合（内置优先）→ 管理页 → 官方示例包与真实 Trace 同步
Stage 5A（已完成）: 共享会话/上下文格式 → 课程与包工具 → stdio MCP Adapter 与目录/路径安全边界 → 会话文件生成 → 网页导入（不自动运行）→ 真实帧导出与上下文回读 → 五级教学 Prompt → 协议测试 / stdio 冒烟 / 真实浏览器双流程
Stage 6A（已完成 MVP）: 共享 Mentor Schema（真实帧/五级/限额）→ 本地 Gateway（loopback/Origin/限额/超时）→ Ollama + OpenAI Provider → Prompt 与防剧透降级 → 网页面板（连接状态/预设提问/中止/Level 5 确认/旧步骤隔离）→ Mock E2E。真实模型另需手动验证
Stage 7B（已完成）: 品牌审计与旧 key 兼容 → 可选 structure Trace 协议 → 纯 stack/queue VisualModel → 桶状/排队渲染 → 真实 Python 示例与双语课程 → 真实 Pyodide E2E + 36 张视觉截图
Stage 7C（已完成）: linked-list union Schema → 真实 Python Node/next 示例 → 纯 linkedListModel（HEAD 可达链）→ SVG 节点/箭头/HEAD/NULL/断开节点 → 双语链表课程 → 真实 Pyodide E2E + 60 张视觉截图
Stage 7D（已完成）: binary-tree union Schema → 真实 Python TreeNode/left/right 三模式递归 → 纯树布局与模型 → 层级画布/递归路径/访问序号 → 调用栈联动与双语树课程 → 真实 Pyodide E2E + 102 张视觉截图
Stage 7E（已完成）: graph union Schema → 真实 Python deque/显式栈 → 确定性图布局与纯 GraphVisualModel → 节点/边/当前边/访问序号 → 同帧 QueueVisual/StackVisual → 图与 Frontier 回退/跳帧同步 → 双语图课程 → 真实 Pyodide E2E + 90 张视觉截图
Stage 7F（已完成）: weighted-graph union Schema → 真实 Python heapq Dijkstra（负权拒绝/不可达 null）→ 距离表/previous/PQ/relax/stale/最终路径 → 独立 PriorityQueuePanel + 加权图渲染 → 回退/跳帧三面板同步 → 9 步双语课程 → 真实 Pyodide E2E + 62 张视觉截图
G1（已完成，main）: Floyd-Warshall / Bellman-Ford 独立快照 → 负环检测与提前结束 → 距离矩阵/距离表 + 同帧带权图 → 6 步/8 步双语课程 → 3 条功能 E2E + 1 条视觉 E2E
G2（已完成，feat/g2-mst）: prim-mst / kruskal-mst 独立快照 → 真实 Python heapq / 并查集 → Prim 树扩张+堆候选、Kruskal 排序+环检测+Union-Find 面板 → 共享基础图组件与单一播放器 → 8 步/6 步双语课程 → 4 条功能 E2E + 1 条视觉 E2E
G3（已完成，feat/g3-topo-critical-path）: topological-sort / critical-path 独立快照 → 真实 Python Kahn + AOE ve/vl/slack/path 枚举 → 有向图分层布局、入度/队列面板与事件/活动/路径面板 → 单一播放器与 8 步/7 步双语课程 → 4 条功能 E2E + 1 条视觉 E2E
G4（已完成，feat/g4-components-scc）: connected-components / kosaraju 独立快照 → 真实 Python 迭代 DFS 与 Kosaraju 双遍 DFS + 转置 → 复用图布局与单一播放器，新增显式栈、完成顺序、反向图与 C 编号分组 → 10 步/11 步双语课程 → 4 条功能 E2E + 1 条视觉 E2E
后续             : G4 / 树算法等更多结构化课程；Agent ⇄ 浏览器实时同步（Stage 5B 候选）、RAG / 多轮记忆、练习页 Monaco、a11y / axe、远程包市场与签名
```

`Trace Event Schema v1` 是编辑器诊断、递归栈动画与后续树/图可视化的共同前置：Monaco 需要根据 `event.sourceLocation` 高亮，调用栈读取 `callStack`，任何新结构都必须先扩展协议再改渲染，不允许渲染层自己发明字段。
