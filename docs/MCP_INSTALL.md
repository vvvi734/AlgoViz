# AlgoViz MCP Server — 安装与接入（Stage 5A）

本文件说明如何在本机安装、构建、启动并接入 `packages/mcp-server`。它是一份**本地 stdio MCP Server**：
不监听端口、不需要服务器、不需要任何 AI API Key，AI 由 MCP 宿主（Claude Code / Cursor / VS Code 等）自带。

> 边界先说清楚：本阶段只在**官方 SDK 客户端**（进程内 + 真实 stdio 子进程）与 **MCP Inspector CLI** 上做过协议验证。
> 文中出现的宿主配置片段是**可直接复制粘贴的配置模板**，但**没有在任何真实第三方宿主上实测连接**，因此不能宣称"已支持"。
> 详见 `docs/STAGE5A_REPORT.md` 的 I 节。

---

## 1. 环境要求

| 项 | 要求 | 本次实测 |
| --- | --- | --- |
| Node.js | **≥ 20**（`packages/mcp-server/package.json` 的 `engines.node`；SDK 自身要求 ≥ 18） | Node v22.23.2 |
| npm | 任意随 Node 提供的版本 | 10.9.8 |
| 操作系统 | Windows / macOS / Linux | Windows 11 + PowerShell 7 |
| 网络 | **首次** `npm run mcp:install` 需要联网下载依赖；运行 MCP Server 本身**完全离线** | 已验证 |

浏览器端（AlgoViz Web）与 MCP Server 是两套独立产物：MCP 故障不会影响网页；网页正常也不需要 MCP 在跑。

---

## 2. 安装与构建

在仓库根目录执行（Windows PowerShell / macOS / Linux 通用）：

```sh
npm ci                      # 安装网页端依赖（已有 node_modules 可跳过）
npm run mcp:install         # 只安装 packages/mcp-server 自己的依赖
npm run mcp:build           # esbuild 打包 → packages/mcp-server/dist/server.mjs（单文件 ESM）
```

各平台差异：

- **Windows**：命令相同；路径含空格时在 JSON 配置里用 `\\` 转义或改用环境变量（见第 3 节）。
- **macOS / Linux**：命令相同；配置里的 `command` 可直接写 `node`（已在 PATH 中）。

验证构建产物可以独立启动（`--help` 输出到 stderr，stdout 保持干净）：

```sh
npm run mcp:start -- --help
```

期望输出（stderr）：

```text
AlgoViz MCP server (stdio).

Usage: node dist/server.mjs [options]

Options:
  --pack-dir <abs dir>     directory with .algopack files to expose (env ALGOLENS_PACK_DIR)
  --session-dir <abs dir>  directory where .algosession.json files may be written (env ALGOLENS_SESSION_DIR)
  --context-dir <abs dir>  directory from which .algocontext.json files may be read (env ALGOLENS_CONTEXT_DIR)
  --help, -h               print this help
```

跑一遍**真实子进程**协议冒烟（会 spawn `dist/server.mjs`，用官方 `StdioClientTransport` 握手、列工具、调 6 个工具）：

```sh
npm run mcp:smoke
```

如果手上已有网页导出的 `.algocontext.json`，把它放进一个目录并加两个参数，冒烟会额外验证"读取真实上下文"这一步：

```sh
npm run mcp:smoke -- --context-dir "<绝对目录>" --context-file bubble.algocontext.json --require-context
```

---

## 3. 三个目录：全部显式配置，没有默认值

MCP Server **不会扫描磁盘、不会猜默认目录**。三个目录各自独立，可用命令行参数或环境变量给出，**必须是绝对路径**：

| 用途 | 命令行参数 | 环境变量 | 未配置时的行为 |
| --- | --- | --- | --- |
| 只读：可暴露的 `.algopack` 文件 | `--pack-dir` | `ALGOLENS_PACK_DIR` | `list_available_packs` 返回 `configured:false`，仅内置课程可用 |
| 写入：`.algosession.json` 输出 | `--session-dir` | `ALGOLENS_SESSION_DIR` | `create_learning_session` 返回 `session-dir-not-configured`，**不写任何文件** |
| 只读：`.algocontext.json` 输入 | `--context-dir` | `ALGOLENS_CONTEXT_DIR` | `inspect_learning_context` 返回 `context-dir-not-configured` |

要点：

- 命令行参数优先于环境变量；实际生效的来源会在 stderr 与工具输出里回显（`cli` / `env`），便于排查。
- 相对路径会被拒绝（启动时 stderr 报错、退出码 2）。
- 文件名一律是**裸文件名**：带 `/`、`\`、`../` 的入参直接返回 `unsafe-name`；不会因为"看起来像路径"就去解析。
- 写入永不覆盖：同名文件已存在时自动改写成 `xxx-2.algosession.json`（最多 50 次，之后报 `no-free-name`）。

推荐（本机演示）：

```text
<仓库>/packs                                   → --pack-dir
<仓库>/test-results/agent                      → --session-dir 与 --context-dir（同一目录也可，但语义不同）
```

> `test-results/` 已加入 `.gitignore`，适合放演示产物；你也可以换成任意自有目录。

---

## 4. 宿主配置模板（**仅配置示例，未实测连接**）

三个宿主都用同一种 `mcpServers` JSON 结构。下面把可执行文件写成 `node` + 打包产物绝对路径，**没有任何硬编码的开发者路径**，把 `<...>` 换成你自己的路径即可。

### 4.1 Claude Code / 通用 `mcpServers` 配置

```json
{
  "mcpServers": {
    "algolens": {
      "command": "node",
      "args": [
        "<仓库绝对路径>/packages/mcp-server/dist/server.mjs",
        "--pack-dir", "<仓库绝对路径>/packs",
        "--session-dir", "<你的输出目录绝对路径>",
        "--context-dir", "<你的上下文目录绝对路径>"
      ]
    }
  }
}
```

### 4.2 Cursor（`~/.cursor/mcp.json` 或项目内 `.cursor/mcp.json`）

```json
{
  "mcpServers": {
    "algolens": {
      "command": "node",
      "args": [
        "<仓库绝对路径>/packages/mcp-server/dist/server.mjs",
        "--pack-dir", "<仓库绝对路径>/packs",
        "--session-dir", "<你的输出目录绝对路径>",
        "--context-dir", "<你的上下文目录绝对路径>"
      ]
    }
  }
}
```

### 4.3 VS Code（`.vscode/mcp.json`，或用户设置中的 MCP 配置）

```json
{
  "servers": {
    "algolens": {
      "type": "stdio",
      "command": "node",
      "args": [
        "<仓库绝对路径>/packages/mcp-server/dist/server.mjs",
        "--pack-dir", "<仓库绝对路径>/packs"
      ],
      "env": {
        "ALGOLENS_SESSION_DIR": "<你的输出目录绝对路径>",
        "ALGOLENS_CONTEXT_DIR": "<你的上下文目录绝对路径>"
      }
    }
  }
}
```

### 4.4 Windows 注意点

- 路径用正斜杠 `C:/Users/you/algolens/packs` 最省事；若要用反斜杠，JSON 里必须写成 `C:\\Users\\you\\...`。
- 路径含空格：JSON 字符串本身没问题（不要自己再加引号）。
- `command` 若写相对名 `node` 找不到，可写 Node 的绝对路径（`where.exe node` 查询），但**不要**提交到仓库。
- 不需要设置 `cwd`；服务端按自身文件位置找依赖，参数里的路径都是绝对路径。

---

## 5. 不装宿主也能验证协议：MCP Inspector

官方 Inspector 的 CLI 模式可以当成"第二个独立客户端"，不打开浏览器界面也能核对工具与调用结果。在 `packages/mcp-server` 目录下执行：

```sh
# 列出工具（并做 JSON Schema 可移植性检查，--strict 会打印问题明细）
npx --yes @modelcontextprotocol/inspector --cli node "dist/server.mjs" ^
  --pack-dir "<仓库绝对路径>/packs" --method tools/list --strict

# 直接调用一个只读工具
npx --yes @modelcontextprotocol/inspector --cli node "dist/server.mjs" ^
  --pack-dir "<仓库绝对路径>/packs" ^
  --context-dir "<上下文目录绝对路径>" ^
  --method tools/call --tool-name inspect_learning_context ^
  --tool-arg file=bubble.algocontext.json
```

（`^` 是 PowerShell 续行符；bash/zsh 直接写成一行的 `\` 续行或去掉换行。）

本次实测结果记录在 `docs/STAGE5A_REPORT.md`：`tools/list` 为 6 个工具、`--strict` **0 errors / 0 warnings**；
`inspect_learning_context` 返回了浏览器真实导出的第 2/30 帧、`step compare`、`arr=[5,2,8,1,6,3]`。

---

## 6. 排障

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 宿主里"连上了但没有任何回复" | `dist/server.mjs` 不存在或启动即崩 | 先 `npm run mcp:build`，再 `npm run mcp:smoke` 确认子进程能握手 |
| 启动立刻退出，stderr 有 `configuration error` | 目录参数不是绝对路径 | 改成绝对路径；退出码为 2 |
| `create_learning_session` 返回 `session-dir-not-configured` | 没配 `--session-dir` / `ALGOLENS_SESSION_DIR` | 这是**设计行为**，不是 bug：不猜默认目录 |
| `inspect_learning_context` 返回 `unsafe-name` | 传了 `../x.json`、`C:\...` 或带分隔符的名字 | 只传裸文件名，并把文件移动进配置目录 |
| 返回 `symlink` | 目标是符号链接 / 目录联接 | 复制文件本体进目录（服务端拒绝跟随链接） |
| 返回 `too-large` | 上下文超过 128 KiB（会话文件超过 96 KiB） | 重新导出，或不要勾选完整源码 |
| `list_available_packs` 报 `pack-directory-unavailable` | 目录不存在 / 不可读 | 检查路径存在且有读权限 |
| 宿主日志里看到一行行 `[algolens-mcp] ...` | 这是 stderr 诊断（正常） | stdout 才是协议流；不要把这些日志当错误 |
| Windows 报 `EPERM: operation not permitted, symlink` | 没有开发者模式 | 只影响"创建符号链接"类测试；服务端本身不需要创建链接 |

---

## 7. 升级、卸载与回滚

- 升级代码：`git pull` → `npm run mcp:install`（依赖有变时）→ `npm run mcp:build`。
- 卸载：删除宿主配置里的 `algolens` 条目即可；不想留产物可删除 `packages/mcp-server/dist` 与 `packages/mcp-server/node_modules`（两者都在 `.gitignore` 内，不会进入提交）。
- 回滚：`dist/server.mjs` 是构建产物，重新 `npm run mcp:build` 即可重建，不存在需要手工修复的持久状态。
- 数据面：服务端**不写数据库、不写用户主目录**，唯一的写操作是把 `.algosession.json` 写进你配置的 `--session-dir`。

---

## 8. 已验证 vs 未验证（必须区分）

| 客户端 / 宿主 | 状态 | 证据 |
| --- | --- | --- |
| 官方 SDK `Client` + `InMemoryTransport` | ✅ 已实测 | `packages/mcp-server/src/server.test.ts`，20 项协议往返 |
| 官方 SDK `StdioClientTransport` → 真实 `dist/server.mjs` 子进程 | ✅ 已实测 | `packages/mcp-server/scripts/smoke.mjs`，10 项 |
| MCP Inspector（CLI 模式） | ✅ 已实测 | `tools/list --strict`、`tools/call inspect_learning_context` |
| Claude Code / Cursor / VS Code / 其他 GUI 宿主 | ⚠️ **仅配置示例，未实测** | 第 4 节模板；本阶段没有在这些产品里真正建立连接 |
