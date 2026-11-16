# AlgoLens Stage 6A 阶段报告：网页 AI 导师 MVP

> 版本：`0.7.0-phase6a` ｜ 完成日期：2026-11-16 ｜ 基线：Stage 5A（`a230b4f`）
> 结论：本地 AI Gateway、Ollama 与 OpenAI Chat Completions Provider、五级教学契约、真实帧面板、Mock E2E 已完成；**真实 Ollama 与真实云端 API 未实测**（本机 127.0.0.1:11434 无服务、未配置 Key），因此相关验收项标为“部分完成”。

## A. 20 项验收矩阵

| # | 验收条件 | 状态 | 证据 / 说明 |
| --- | --- | --- | --- |
| 1 | 本地 AI Gateway 可以启动 | ✅ 完成 | `ai:dev`（vite-node）与 `ai:build` 后 `ai:start` 均可启动；Playwright 将其作为第二个 webServer 拉起并以 `/api/health` 探活 |
| 2 | Ollama Provider 已实现 | 🟡 部分完成 | 探测 `/api/tags`、`/api/chat`、模型列表/默认模型、未启动/模型不存在/超时/中止/无效响应均已实现且有单测；**真实 Ollama 未实测** |
| 3 | 一个明确的云端 API Provider 已实现 | 🟡 部分完成 | 仅声明 OpenAI Chat Completions；Key/BaseURL/模型仅由 Gateway env 决定；401/404/429/5xx/网络/超时均有映射与单测；**真实 Key 未实测** |
| 4 | API 密钥不暴露给前端 | ✅ 完成 | 浏览器代码无 Key 读取；`/api/providers` 不返回 Key；测试断言 `sk-` 不出现在错误响应；`.env` gitignore、只提交 `.env.example` |
| 5 | Gateway 有本地访问限制与安全校验 | ✅ 完成 | 固定 `127.0.0.1`；Origin 白名单 + `x-algolens-client` + 拒绝 `Sec-Fetch-Site: cross-site`；96 KiB body / 256 KiB response / 30 s / 20 rpm；严格 Zod `.strict()` |
| 6 | AI 请求复用已有学习上下文 | ✅ 完成 | `domain/mentor/schema.ts` 内嵌 `traceEventSchema`；`stepIndex === event.step`；课程阶段与 `traceStale` 直接来自 Stage 5A 字段 |
| 7 | 能解释真实当前 Trace | ✅ 完成（Mock Provider） | E2E 在真实 Pyodide 冒泡帧上发送，卡片出现 `arr = [5,2,8,1,6,3]`、`i = 0` 与真实帧号；真实模型侧未验证，但请求构造与响应契约已通过 |
| 8 | 支持五级渐进式提示 | ✅ 完成 | `MENTOR_LEVELS 1..5`，默认 1；`levelContract` 决定披露上限；L1–3 隐藏所有代码围栏、L4 隐藏实现型围栏 |
| 9 | Level 5 需要用户主动确认 | ✅ 完成 | 前端必须勾选确认才能发送；Gateway 无 `confirmFullSolution` 返回 403；单测与 E2E 各覆盖一次 |
| 10 | 模型响应经过 Schema 校验 | ✅ 完成 | `parseMentorReply` 截取 JSON + `mentorReplySchema.safeParse`；等级不一致覆盖、披露超契约降级；前端再次用共享 Schema 校验 |
| 11 | AI 面板支持中英文 | ✅ 完成 | 新增约 50 个 zh/en key；E2E 为中文；英文词典与单测（组件按 locale 渲染）覆盖，未做英文人工走查 |
| 12 | AI 面板适配三态主题 | ✅ 完成 | 全部使用现有 token；令牌契约测试继续通过；Light/Dark/System 由既有 ThemeProvider 驱动 |
| 13 | AI 不可用不影响算法学习 | ✅ 完成 | E2E 路由中断 `/api/providers`、`/api/mentor` 后仍能加载 Monaco、运行真实 Pyodide、到达 compare 步骤 |
| 14 | 旧请求不会覆盖新步骤 | ✅ 完成 | 组件以 requestId + 帧快照记录回答；切换帧 abort 在途请求并清空；单测断言 step 2 的延迟回复在 step 4 不出现；历史卡片标注“来自之前的步骤” |
| 15 | 类型检查通过 | ✅ 完成 | 根 `npm run typecheck` 与 `npm run ai:typecheck` 均 0 错误（见 G） |
| 16 | 单元测试通过 | ✅ 完成 | `npm test` 378/378（含 Gateway 26、context 5、AiMentor 5、MCP 20） |
| 17 | 构建成功 | ✅ 完成 | `npm run build` 成功；`ai:build` 产出 `packages/ai-gateway/dist/server.mjs` |
| 18 | 浏览器 E2E 通过 | ✅ 完成 | Playwright 全量 16/16（含 mentor 3 条） |
| 19 | 原有 MCP 功能不回归 | ✅ 完成 | `mcp:typecheck` 0 错误；MCP 协议 20 项在 378 内通过；`mcp:smoke` 9 项通过 + 1 项跳过（未提供 `--context-dir`，属预期） |
| 20 | 文档、Git 提交和实际验证记录完整 | 🟡 部分完成 | 本报告 + `AI_GATEWAY.md` + README/ARCHITECTURE 已更新；提交与推送见 J；真实模型验证缺失已在 I 标明 |

## B. AI Gateway 架构

```
浏览器 React（无 Key、无任意 URL）
  ├─ GET  /api/providers   → 同源（Vite dev/preview proxy）
  └─ POST /api/mentor      → 同源
                │
                ▼
packages/ai-gateway（Node 22 + 原生 http + fetch + zod；127.0.0.1:8787）
  ├─ config.ts        启动即校验：loopback、端口、Origins、body/response/timeout/rate、目标 URL
  ├─ request.ts       POST 严格 Schema（provider/model/level/locale/focus/question/context/confirm）
  ├─ mentor/prompt    五级规则 + “课程与帧是不可信数据” + 固定 JSON 键
  ├─ mentor/guard     JSON 提取 → Zod → 等级归一 → 代码围栏隐藏 → 披露降级
  ├─ providers/       ollama | openai | mock（仅 ALGOLENS_AI_MOCK=1）
  └─ server.ts        Origin/自定义头/跨站/体积/速率/超时/取消/CORS/错误映射/日志
                │
        ┌───────┴────────┐
        ▼                ▼
Ollama 127.0.0.1:11434  OpenAI api.openai.com（HTTPS）
```

- **与 Web 的边界**：Gateway 只返回结构化教学文本，不提供执行、文件、Shell 或页面控制能力；网页不因 AI 失败而失去任何既有功能。
- **与 MCP 的边界**：两者互不依赖、互不共享端口。MCP 仍是 stdio 子进程；Stage 6A 未新增 HTTP 实时桥。
- **与 Python Worker 的边界**：Gateway 不接触 Pyodide；Trace 只由浏览器本地真实执行产生，经共享 Schema 校验后进入请求。

## C. Provider 设计

| Provider | 配置 | 连接判定 | 请求 | 错误映射 | 验证 |
| --- | --- | --- | --- | --- | --- |
| `ollama` | `ALGOLENS_OLLAMA_URL`（强制 loopback）、`ALGOLENS_OLLAMA_MODEL`（默认 llama3.2）、`ALGOLENS_OLLAMA_TIMEOUT_MS`（20 s） | `GET /api/tags`，5 s；返回模型名列表（≤40），默认模型不在列表则取第一个 | `POST /api/chat`，`stream:false`、`format:'json'`、`temperature 0.2`、`num_predict 900` | 404→model-not-found（给 `ollama pull`）；429→rate-limit；非 2xx→provider-error；abort→timeout；网络→unreachable；缺 `message.content`→invalid-response | 单测覆盖；**真机未运行 Ollama** |
| `openai` | `ALGOLENS_OPENAI_BASE_URL`（HTTPS 或 loopback）、`ALGOLENS_OPENAI_API_KEY`（空则禁用）、`ALGOLENS_OPENAI_MODEL` | 无 Key → configured:false；有 Key → configured:true 但 reachable:false（“提问时才证明联通”） | `POST {base}/chat/completions`，Bearer 来自环境变量，`temperature 0.2`、`max_tokens 900`、`response_format:{type:'json_object'}` | 401/403→auth（不回显 Key）；404→model-not-found；429→rate-limit；5xx→provider-error（retryable）；网络→unreachable；abort→timeout | 单测覆盖；**无真实 Key** |
| `mock` | 仅 `ALGOLENS_AI_MOCK=1` | 注册即 reachable | 基于真实 meta 生成确定性 JSON；`mock-tutor` / `mock-leak` | — | E2E 与 Gateway 单测使用 |

`AIProvider` 接口：`id`、`status()`、`generate(input)`；`GenerateInput` 携带 messages/model/signal/meta（level、locale、stepIndex、totalEvents、eventMessage、variables、callStackNames、traceStale、sourceIncluded）。所有 Provider 都受 `AbortSignal` 与总超时控制。**没有“所有 OpenAI 兼容服务都已支持”的声明。**

## D. 真实上下文（脱敏示例）

E2E 在真实 Pyodide 冒泡排序停在 compare 帧时发出的请求（节选，数组为真实运行值）：

```json
{
  "requestId": "web-3f0c…",
  "provider": "mock",
  "model": "mock-tutor",
  "level": 1,
  "locale": "zh",
  "focus": "step",
  "question": "",
  "confirmFullSolution": false,
  "context": {
    "algorithmId": "bubble-sort",
    "lessonId": "bubble-sort-basics",
    "lessonStepId": "compare",
    "lessonStepTitle": "比较相邻元素",
    "lessonStepExplanation": "比较 arr[j] 与 arr[j+1]，若前者更大则交换。",
    "locale": "zh",
    "stepIndex": 2,
    "totalEvents": 45,
    "traceStale": false,
    "event": {
      "schemaVersion": 1,
      "step": 2,
      "line": 12,
      "message": "比较 arr[0] 与 arr[1]",
      "variables": { "arr": [5, 2, 8, 1, 6, 3], "i": 0, "j": 0 },
      "callStack": [{ "name": "bubble_sort", "line": 12, "depth": 0 }]
    }
  }
}
```

映射关系：`stepIndex` = 当前播放游标且必须等于 `event.step`；`algorithmId/lessonId/lessonStepId` 由当前算法与课程阶段提供；`lessonStepTitle/Explanation` 按 locale 取当前阶段；`event` 是 `events[index]` 原对象，不重算；`traceStale` 为真时 Prompt 强制要求 AI 说明“代码已改、运行记录过期”；`code` 仅在用户勾选后以 40k 上限附带。响应中 `observedFacts` 只能引用帧内真实名称/值，`possibleIssues` 与解释必须与观察事实分开。

脱敏：示例不含 Key、路径、账户、完整历史；数组与变量属于演示输入，真实用户数据只留在本机请求内。

## E. 分层教学

- **Schema**：`level / explanation / guidingQuestion / observedFacts[≤6] / possibleIssues[≤5] / suggestedNextAction / answerDisclosure`；每字段有长度上限，`answerDisclosure` 只能 `none|partial|full`。
- **契约**：L1–2 `none`（只提问/知识点，禁伪代码）；L3–4 `partial`（可给思路/伪代码）；L5 `full`。
- **授权**：前端默认 L1，用户逐级点击；L5 必须勾选确认，请求带 `confirmFullSolution:true`，Gateway 无确认返回 403。没有“普通按钮直接跳过确认”的路径。
- **校验**：Gateway 从模型文本中截取首个 `{` 到末个 `}`，去围栏后 `mentorReplySchema.safeParse`。等级与请求不符 → 覆盖并记 `level-normalised`；披露超契约 → 降级并记 `disclosure-downgraded`；低等级代码围栏 → 本地化占位并记 `code-redacted`。前端再次校验，失败不渲染。
- **防剧透限制**：Prompt 与过滤是**软约束 + 确定性兜底**，不能保证 100% 防剧透（模型仍可能在自然语言里描述实现）。Level 5 用户确认后允许完整参考解法。
- **本地教学不被替代**：原有课程阶段说明与本地提示仍在；AI 是附加层，离线时明确标注“本地教学提示（非 AI）”。

## F. 安全

| 面向 | 措施 |
| --- | --- |
| Key 管理 | 仅 Gateway 进程环境；`.env` gitignore；不写前端/localStorage/IndexedDB；日志与错误响应不含 Key |
| 本地监听 | host 硬编码 `127.0.0.1`，无公网配置；端口 1024–65535 |
| 跨站 | Origin 白名单（默认 5173/4173 × localhost/127.0.0.1）；`ALGOLENS_AI_ORIGINS` 仅 loopback；CORS 只回显允许来源；必须 `x-algolens-client: web`；`Sec-Fetch-Site: cross-site` 拒绝 |
| 请求限制 | `application/json`；96 KiB 流式上限→413；响应 256 KiB；总超时 30 s；每 socket 20 rpm→429 + Retry-After |
| SSRF | 请求体 `.strict()`，无 URL/目标字段；Ollama 必须 loopback；OpenAI 必须 HTTPS/loopback；适配器固定路径 |
| 输出渲染 | React 文本节点；无 `dangerouslySetInnerHTML`；Schema 限额；错误码中文化 |
| 隐私 | 默认只发当前帧与课程阶段；源码默认关闭；不发历史 Trace、包内容、账户信息；云端模式在面板明示数据出境 |
| 文件/执行 | Gateway 无文件读取、无 Shell、无 Python 控制；MCP 的目录边界保持原样 |

## G. 测试

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 根 typecheck | `npm run typecheck` | 0 错误 |
| Gateway typecheck | `npm run ai:typecheck` | 0 错误 |
| MCP typecheck | `npm run mcp:typecheck` | 0 错误 |
| 单元/集成 | `npm test` | **378 passed / 46 files**（Stage 5A 342 + 新增 36） |
| 构建 | `npm run build` | 成功（主包 475.58 kB / gzip 151.29 kB；Monaco 懒加载 chunk 4,122.24 kB） |
| Gateway 构建 | `npm run ai:build` | 成功，`dist/server.mjs` 可 `--help` |
| Playwright | `npx playwright test` | **16/16 passed**（分组执行：mentor 3 条 2.8 min、packs 2 条 46.2 s、lab 9 条 3.2 min、session 2 条 1.8 min；均使用真实 Edge + 真实 Pyodide；AI 使用 mock provider） |
| MCP stdio 冒烟 | `npm run mcp:smoke` | 9 passed + 1 skipped（真实子进程；跳过项需要 E2E 导出的上下文目录） |
| Mock Provider | 同上单测/E2E | 通过；**不是真实模型集成测试** |
| 真实 Ollama | 手动命令见 `docs/AI_GATEWAY.md` §8 | **未验证**（本机无服务） |
| 真实云端 API | 同上 | **未验证**（无 Key） |

新增测试分布：`packages/ai-gateway/src/server.test.ts` 16、`providers.test.ts` 10、`domain/mentor/context.test.ts` 5、`AiMentor.test.tsx` 5，共 36 项；342 + 36 = 378。

E2E 覆盖：
1. 真实 Pyodide 冒泡到 compare → 点“解释当前步骤” → 结构化回复含真实 `arr`/`i`，卡片帧号与时间轴一致，mock 徽章。
2. `mock-leak` 在 Level 1 不含 `def bubble_sort`/代码围栏，含“已按当前提示等级隐藏”；Level 5 勾选确认后出现完整代码与“完整解法”。
3. 中断 `/api/providers` 与 `/api/mentor` → “AI 未连接”+“本地教学提示（非 AI）”，真实 Pyodide 仍可运行到 compare 并显示变量。

## H. 实际用户体验（冒泡排序 → 当前变量）

1. 打开算法实验室，选择「冒泡排序」，Python 示例已在 Monaco 中。
2. 点击运行；Pyodide 真实执行，时间轴出现帧，变量面板显示 `arr`、`i`、`j`，调用栈显示 `bubble_sort`。
3. 暂停在一次比较/交换帧；AI 面板显示 Gateway 状态、Provider（本地 Ollama 或云端）、模型。
4. 点「解释当前变量」或输入问题；请求只带当前帧与课程阶段，源码默认不带。
5. 默认 Level 1 回复以提问引导，`observedFacts` 列出当前真实值；点「下一等级提示」逐步获得知识点、困难定位，L4 才可能出现伪代码。
6. 若想要完整解法，勾选 Level 5 确认；否则不会自动升级。
7. 请求中切换时间轴：旧请求被中止；若它仍返回，卡片标注“来自之前的步骤”，不会被当成新帧答案。
8. 关闭 Gateway：面板变为离线，显示“AI 未连接”和明确标注的本地提示；算法、变量、调用栈、课程、知识包、MCP 全部照常。

## I. 已知问题

- **真实 Ollama 未验证**：本机 `127.0.0.1:11434` 无服务；没有跑过真实模型输出质量与延迟。
- **真实云端 API 未验证**：无 Key；未验证 OpenAI 实际 JSON 遵从度、配额与错误体差异。
- 只有两个 Provider；其他“OpenAI 兼容”服务未测试，不声明支持。
- Prompt/过滤不能保证绝对防剧透；Level 5 一旦确认即允许完整答案。
- 无流式输出、无多轮对话记忆、无 RAG、无账户/云端历史；每次请求独立。
- `AiMentor` 在 App 级测试挂载时会触发异步 providers 请求，产生若干 React `act(...)` 警告（不影响通过）；未逐项消除。
- GitHub Pages 无 Gateway，AI 功能在静态演示中不可用；这是架构边界，不是缺陷。
- Node 版本口径：网页/MCP 为 ≥20，AI Gateway 的 `--env-file-if-exists` 需要 ≥22.9；已在 `packages/ai-gateway/package.json` 与文档标注。
- 本机到 jsDelivr 的 Pyodide WASM 下载一度达到约 40 秒，原先初始化与执行共用 30 秒会误判超时。现已拆为**初始化/下载 120 秒 + 用户代码执行 30 秒**（`PYODIDE_INIT_TIMEOUT_MS` / `PYODIDE_TIMEOUT_MS`），用户代码的执行上限没有放宽。
- E2E 仅使用 Mock Provider；不能称为真实云端模型集成测试。

## J. Git

- 分支：`main`
- 远端：`https://gitee.com/vvvi734/algolens.git`
- 基线：`a230b4f`（Stage 5A）
- 实现提交：`ae584fa`（`feat(phase-6a): local AI gateway + progressive web mentor`）；本报告的哈希更新与测试记录在紧随其后的文档提交中
- 工作区：提交前包含 Stage 6A 新建/修改文件；`dist/`、`packages/ai-gateway/dist/`、`.env` 均被忽略。
- 推送：`git push origin main`（普通推送，无 force）。

## K. 后续准备（只评估）

| 方向 | 评估 |
| --- | --- |
| Stage 5B Agent ↔ Web 实时联动 | 需要认证的本地通道（WebSocket/HTTP + 一次性令牌）、会话生命周期与冲突处理；当前文件桥是最小可信基线，实时化不能复用“无鉴权本地端口” |
| AI 自定义算法生成 | 高风险：生成代码必须静态校验 + 沙箱 + 用户确认；当前 Gateway 明确不执行、不改代码，需新增独立管线 |
| 更完整知识包 | 现有 `.algopack` 格式足以承载课程/示例；下一步是作者工具、版本/签名与来源信任，不是改 Schema |
| 大学与 408 考研内容 | 需要课程内容与题目数据扩展、难度/知识点标签；与 AI 网关解耦，可独立推进 |
| RAG / 多轮记忆 | 需向量存储与隐私边界；当前单帧最小上下文更适合教学准确性，先做评测再引入 |

## 结论

Stage 6A 的 MVP 已能真实运行：本地 Gateway 安全启动、两个 Provider 适配器、共享五级契约、真实帧解释、Level 5 授权、离线降级、旧请求隔离与 E2E 均有可复现证据。唯一不能宣布为“已验证”的是**真实模型调用**（Ollama 与云端 Key），报告已按部分完成标注，并提供手动验证命令。Stage 6A 到此停止，不进入 Stage 5B。
