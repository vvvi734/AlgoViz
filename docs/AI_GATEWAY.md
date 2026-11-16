# AlgoViz 本地 AI Gateway（Stage 6A）

> 这是一个**只监听 `127.0.0.1`** 的本机进程，不是公网服务，也不需要租服务器。普通用户不启动它也能完整使用 AlgoViz 的算法、Python、课程、时间轴、知识包与 MCP。AI 不可用时页面显示明确离线状态，不会伪造回答。

## 1. 边界

```
浏览器 (React/Vite)
   │  GET  /api/providers      POST /api/mentor      ← 同源，无 Key
   ▼
Vite dev / preview proxy
   ▼
packages/ai-gateway (Node, 127.0.0.1:8787)
   ├── OllamaProvider  ──► http://127.0.0.1:11434  (GET /api/tags, POST /api/chat)
   ├── OpenAiProvider  ──► https://api.openai.com/v1/chat/completions（Key 仅在 Gateway 环境变量）
   └── MockProvider    ──► 仅 ALGOLENS_AI_MOCK=1；确定性测试数据
```

- 浏览器**没有**可填任意 URL 的 AI 代理地址，也**没有**任何 API Key；`/api/mentor` 与 `/api/providers` 是固定同源路径。
- Gateway 的目标地址只来自**启动配置**：请求体不能改变目标 → 没有任意 URL 转发 / SSRF 面。
- Gateway 不读文件、不执行 Shell、不控制 Python Worker、不碰浏览器状态。
- 与 MCP Server **完全独立**：MCP 仍只走 stdio；本阶段没有 WebSocket/HTTP 实时桥。

## 2. 安装与启动

要求 Node.js **≥ 22.9**（`--env-file-if-exists` 用于可选 `.env`；仅网页与 MCP 可用 Node ≥ 20）。

```sh
npm run ai:install     # 只安装 packages/ai-gateway 的 zod/esbuild
npm run ai:dev         # vite-node 直接运行 TypeScript
# 或
npm run ai:build       # esbuild → packages/ai-gateway/dist/server.mjs
npm run ai:start
```

另开一个终端：

```sh
npm run dev
# 打开 Vite 给出的地址（默认 http://localhost:5173）
```

可选配置：

```sh
cp .env.example .env    # Windows PowerShell: Copy-Item .env.example .env
```

`npm run ai:dev` / `ai:start` 会读取根目录 `.env`（不存在则跳过）。`.env` 已被 `.gitignore` 忽略，仓库只提交 `.env.example`。也可以直接设置进程环境变量：

```powershell
# Windows PowerShell
$env:ALGOLENS_OLLAMA_MODEL = "qwen2.5:3b"
npm run ai:dev
```

```sh
# macOS / Linux
ALGOLENS_OLLAMA_MODEL=qwen2.5:3b npm run ai:dev
```

## 3. 使用 Ollama（推荐，无需云端 Key）

1. 安装 Ollama（官方安装包 / `brew install ollama`）。
2. 启动服务：`ollama serve`（桌面版通常随系统启动）。
3. 下载模型，例如：`ollama pull llama3.2`（或 `qwen2.5:3b` 等）。
4. 确认：`curl http://127.0.0.1:11434/api/tags`。
5. 在页面 AI 面板选择「本地 Ollama」与模型；刷新后 `GET /api/providers` 会重新探测。

- `ALGOLENS_OLLAMA_URL` **必须是 loopback**（`http://127.0.0.1:…` / `localhost`）。远程 Ollama 不在本 MVP 范围，配置会直接启动失败。
- 模型不存在时 Gateway 返回 `provider-model-not-found` 与 `Run: ollama pull <model>`，不会假装连接成功。
- Ollama 超时默认 20 s（且不超过总超时），失败返回 `provider-timeout` 或 `provider-unreachable`。

## 4. 使用云端 API（OpenAI Chat Completions）

只实现**一个明确的云端协议**：OpenAI Chat Completions。没有宣称“所有 OpenAI 兼容服务均已验证”。

```sh
# .env
ALGOLENS_OPENAI_API_KEY=sk-...
ALGOLENS_OPENAI_MODEL=gpt-4o-mini
ALGOLENS_OPENAI_BASE_URL=https://api.openai.com/v1
```

- Key 只存在于 Gateway 进程环境；不写入前端、不写 localStorage/IndexedDB、不进 Git、不在响应中回显。
- `ALGOLENS_OPENAI_BASE_URL` 必须 HTTPS（本机回环地址可用 HTTP，便于本地测试）；请求体不能改它。
- 面板会显示“已配置；提问时才会真正证明连通”，不会把静态配置当作已验证连接。
- 401/403 → `provider-auth`；404 → `provider-model-not-found`；429 → `provider-rate-limit`；5xx → `provider-error`；网络失败 → `provider-unreachable`。错误不带上游正文或堆栈。
- 云端模式下，面板明确提示：算法名、真实帧、变量/调用栈与问题会发送给外部提供商；Python 源码默认不发送，需用户勾选。

## 5. 接口

### `GET /api/providers`

请求头：

```
Origin: http://localhost:5173
x-algolens-client: web
```

响应（节选）：

```json
{
  "ok": true,
  "gatewayVersion": "0.7.0-phase6a",
  "providers": [
    {
      "id": "ollama",
      "label": "Ollama (local)",
      "configured": true,
      "reachable": true,
      "models": ["llama3.2"],
      "defaultModel": "llama3.2",
      "mock": false
    }
  ]
}
```

### `POST /api/mentor`

```json
{
  "requestId": "web-…",
  "provider": "ollama",
  "model": "llama3.2",
  "level": 2,
  "locale": "zh",
  "focus": "step",
  "question": "为什么这里要交换？",
  "confirmFullSolution": false,
  "context": {
    "algorithmId": "bubble-sort",
    "lessonId": "bubble-sort-basics",
    "lessonStepId": "compare",
    "lessonStepTitle": "比较相邻元素",
    "locale": "zh",
    "stepIndex": 2,
    "totalEvents": 30,
    "event": { "schemaVersion": 1, "step": 2, "…": "真实 TraceEvent" },
    "traceStale": false
  }
}
```

- `context.event` 与 `stepIndex` 必须一致（共享 Zod `superRefine`）；`totalEvents` 来自本次真实运行。
- `level` 默认 1；`level 5` 必须同时 `confirmFullSolution: true`，否则 HTTP 403 `level5-confirmation-required`。
- 返回 `{ok, reply, meta, disclaimer}`；`reply` 经共享 Schema 校验并经过代码围栏/披露等级降级。

### 错误形状

```json
{ "ok": false, "requestId": "…", "error": { "code": "provider-timeout", "message": "…", "retryable": true } }
```

不返回堆栈、不 echo Key、不 echo 上游响应正文。

## 6. 安全控制

| 项目 | 实现 |
| --- | --- |
| 监听地址 | 固定 `127.0.0.1`；无公网配置项 |
| 浏览器来源 | 默认 `localhost/127.0.0.1` 的 5173、4173；`ALGOLENS_AI_ORIGINS` 只接受 loopback origin；CORS 只回显允许来源，绝不用 `*` |
| 本地授权 | 所有 API 请求必须带自定义头 `x-algolens-client: web`（简单跨站请求无法携带）；`Sec-Fetch-Site: cross-site` 直接拒绝 |
| 方法 | `GET /api/health`、`GET /api/providers`、`POST /api/mentor`、`OPTIONS`；其余 404 |
| 请求体 | 必须 `application/json`；默认上限 96 KiB（`ALGOLENS_AI_MAX_BODY_BYTES` 8 KiB–1 MiB），流式读取超限 413 |
| 响应 | 默认上限 256 KiB；序列化后再检查 |
| 超时 | 总超时默认 30 s（1–120 s）；`AbortController` 会中止上游请求；客户端中止也会触发 |
| 速率 | 每 socket 地址默认 20 次/分钟（1–200），429 + `Retry-After` |
| 目标地址 | Ollama 必须 loopback；OpenAI 必须 HTTPS/loopback；请求体 `.strict()` 拒绝未知字段 |
| 日志 | 仅 stderr：requestId、provider、model、level、status、latency；不写 body/Key |
| 输出渲染 | React 文本节点；无 `dangerouslySetInnerHTML`；Schema 限制长度与条数 |
| 数据最小化 | 默认只发当前帧；源码默认关闭；不发历史 Trace、不发包内容、不发账户信息 |

Prompt 与输出过滤不能保证 100% 防剧透。因此低等级额外做确定性降级：Level 1–3 隐藏所有代码围栏；Level 4 只允许非实现型伪代码围栏；`answerDisclosure` 超过该等级契约时降级并记录 guardrail。

## 7. 静态托管（GitHub Pages）与本地完整版的区别

| | GitHub Pages | 本地完整版 |
| --- | --- | --- |
| 算法 / Python / 课程 / 时间轴 / 知识包 | ✅ | ✅ |
| MCP 文件桥 | ✅（手工导入/导出） | ✅ |
| AI 导师 | ❌ 无 Gateway | ✅ 需本机启动 |
| 云端 Key | **绝不能**放进静态页面 | 仅 Gateway 环境变量 |

静态页会显示「AI 未连接」并提供标注为“本地教学提示（非 AI）”的启发式提示；这不是模型回答。

## 8. 测试与 Mock

```sh
npm run ai:typecheck
npx vitest run packages/ai-gateway/src/server.test.ts packages/ai-gateway/src/providers.test.ts
ALGOLENS_AI_MOCK=1 npm run ai:dev
```

- `ALGOLENS_AI_MOCK=1` 只注册确定性 mock provider（模型 `mock-tutor` / `mock-leak`），用于 E2E 验证 Schema、真实变量映射、Level 1 代码隐藏和 Level 5 确认。
- **Mock 测试不是真实模型集成测试。** 本仓库开发机上 Ollama 未运行、无云端 Key，因此真实模型冒烟标记为“未验证”。

### 手动真机验证命令（未自动执行）

```sh
# 1) Ollama
ollama serve
ollama pull llama3.2
curl http://127.0.0.1:11434/api/tags

# 2) Gateway（另开终端）
ALGOLENS_OLLAMA_MODEL=llama3.2 npm run ai:dev

# 3) 浏览器
npm run dev
# 打开页面 → 算法实验室 → 运行冒泡排序 → 暂停在某一帧 → AI 面板点“解释当前步骤”
```

期望：面板显示 Ollama 已连接与模型列表；回复包含当前帧真实变量；Level 1 不出现完整 `def bubble_sort`；只有确认 Level 5 后才可能给出完整解法。

## 9. 故障排查

| 现象 | 原因 / 处理 |
| --- | --- |
| 面板「AI 未连接」 | Gateway 未启动、端口不同、或页面是静态托管。先 `npm run ai:dev`，再刷新。 |
| `origin-not-allowed` | 页面来源不在允许列表。用 `localhost`/`127.0.0.1` 的 5173/4173，或把该 loopback origin 加到 `ALGOLENS_AI_ORIGINS`。 |
| `client-header-required` | 用 curl 测试时补 `-H "x-algolens-client: web"`；浏览器面板自动携带。 |
| Ollama 显示未连接 | `ollama serve` 是否运行？`ALGOLENS_OLLAMA_URL` 是否 loopback？ |
| `provider-model-not-found` | `ollama pull <model>`，或在面板换一个已下载模型。 |
| `provider-timeout` | 模型太大/机器太慢；换小模型或提高 `ALGOLENS_AI_TIMEOUT_MS`（≤120000）。 |
| `rate-limited` | 默认 20 次/分钟；等待或调 `ALGOLENS_AI_RATE_LIMIT`。 |
| 云端 `provider-auth` | Key 无效/无权限；只改 Gateway 环境变量，不要贴到页面。 |
| 返回 `invalid-model-response` | 模型没按 JSON 输出；换模型/重试。Gateway 不会把原始文本硬塞给页面。 |
| 页面显示“来自之前的步骤” | 正常：你在请求返回前切换了帧，旧回答保留但不会冒充新帧。 |

## 10. 已知限制

- 真实 Ollama、真实 OpenAI Key 均未在本机验证。
- 只有 Ollama 与 OpenAI Chat Completions 两个适配器；其他兼容服务未测试、不宣称支持。
- Prompt 不是绝对防剧透；Level 5 一旦用户确认即允许完整解法。
- 不提供流式输出、对话持久化、多轮上下文记忆、RAG、账户或云端聊天记录。
- 不提供公网部署模式；若未来需要，必须重新设计认证与跨源策略，而不是简单放大 CORS。
