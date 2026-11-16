# AlgoLens · Python 为主的算法可视化学习平台

[English](#english) | [中文](#中文)

面向大学生与 408 考研学生的浏览器端算法学习平台：**Python 在浏览器内运行**，根据真实执行结果生成逐帧动画，并同步展示代码位置、变量值与步骤讲解。完全本地运行，无需租服务器。

> **当前版本：v0.3 Stage 3。** 刚完成「Python 递归调用栈与局部变量同步可视化」：真实 Pyodide 捕获 `@tracked` 递归调用栈、调用帧唯一标识、逐层局部变量、返回值与函数返回事件，新增调用栈面板与作用域感知的变量观察器，阶乘 `factorial(4)=24` 与斐波那契 `fib(4)=3` 两个端到端演示，真实浏览器 E2E 验证。本阶段收尾同时修复了时间轴缺陷：切换算法/语言后旧索引不再残留（新 Trace 归零 + 索引钳制），见下方「路线图」。
> 定位已收敛：**Python 为主要教学语言**，JavaScript 作为前端实现语言继续支持既有 12 个算法演示；**C / C++ 与在线判题已从规划中取消**。详见 [阶段一总结](docs/STAGE1_REPORT.md)、[阶段二总结](docs/STAGE2_REPORT.md) 与 [阶段三总结](docs/STAGE3_REPORT.md)。

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
| 统一 Trace Event Schema v1 | ✅ 已实现 | Zod 运行时校验：`schemaVersion/step/eventType/visualType/state/message/sourceLocation/variables/callStack` + 事件/帧/变量限额 |
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
| 自动化测试 | ✅ 已实现 | 170 项单测 / 帧回归 / jsdom 冒烟 + 7 条真实浏览器 E2E（Playwright + Edge） |
| 练习页编辑器 | ⏳ 后续 | 练习页仍为 textarea；Monaco 仅用于实验室主编辑器 |
| GitHub Pages 部署 | ✅ 已实现 | workflow 构建 `dist/` 后发布 |
| 开源贡献规范 | ✅ 基础版 | [CONTRIBUTING.md](CONTRIBUTING.md)、[行为准则](CODE_OF_CONDUCT.md) |

### 本地开发

```sh
npm ci
npm run dev            # 开发服务器
npm run typecheck      # TypeScript 严格检查
npm test               # Vitest（170 项）
npm run build          # tsc -b && vite build → dist/
npm run preview        # 预览构建产物
npm run test:e2e       # Playwright E2E（默认驱动本机 Microsoft Edge）
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
  features/    lab（含 SyncPanel 同步观察）/ practice / ai
  domain/      algorithms / problems / trace（schema + adapter + player）/ visualization
  runtime/     js worker / python（Pyodide + 结构化诊断）/ monaco（懒加载 + 主题）/ ai / url / storage / drafts
  theme/       三态主题解析与 Provider
  i18n/        中英词典与 Provider
  styles/      tokens.css（唯一颜色源）+ app.css
  test/        setup 与 legacy 帧快照
e2e/            Playwright 真实浏览器测试
legacy/        迁移前数据定义（回归基线来源，应用运行时不引用）
docs/          ARCHITECTURE.md、阶段报告
scripts/       从 legacy 定义生成类型化数据
```

### Trace Event Schema v1

所有语言产生的执行状态统一为版本化事件（`src/domain/trace/schema.ts`，Zod 校验）：

- 事件字段：`schemaVersion` / `step` / `eventType` / `visualType` / `state` / `message` / `sourceLocation` / `variables` / `callStack`
- 可视化结构：`array / stack / queue / linked / tree / graph`
- 变量快照：`{ name, type, value, scope? }`，值必须是 JSON 可序列化类型
- 限额：事件数 500、单条消息 240 字符、变量 50 个、状态 8KB、总量 2MB
- 无效事件返回结构化错误，绝不导致页面崩溃

旧版 `frames[{state,message}]` 由 `src/domain/trace/adapter.ts` 无损转换为新协议；旧算法没有变量/行号时展示空态，**不编造数据**。

### AI 接口约定（协议，非实现）

`POST /api/ai`：`{"action":"review_code","payload":{"code":"..."},"language":"zh"}` → `{"reply":"..."}`；
`generate_algorithm` → `{"title":"...","code":"...","input":[...],"type":"array"}`。

> 永远不要把 API key 写进前端、GitHub 仓库或浏览器 localStorage。浏览器只访问你自部署的同源/HTTPS 代理。

### 安全说明

- 用户 JavaScript 只在限时 Worker 中执行；Python 只在 Pyodide Worker 中执行，均不经过服务器。
- 练习「运行并查看输出」是学习辅助，**不做成绩判定**。
- AI 生成的代码必须由学习者检查后再运行。

### 路线图

Stage 1（已完成）：统一 Trace 协议 + 旧动画兼容 + Python 冒泡排序同步演示。
Stage 2（已完成）：Monaco 编辑器 + 执行行高亮联动 + Python 错误诊断 + 本地代码保存 + 真实浏览器 E2E。
Stage 3（已完成）：Python 递归调用栈 + 局部变量同步可视化（`@tracked` + 调用栈面板 + 作用域变量 + 阶乘/斐波那契演示）；收尾修复时间轴在切换 Trace 后不归零的缺陷。
后续：AI 渐进式教学、题库扩充、练习页 Monaco 迁移、二叉树/图遍历高级可视化、axe 可访问性。

### License

MIT（见 [LICENSE](LICENSE)）。题目与算法说明均为原创示例，不是官方历年真题。

---

## English

AlgoLens is a browser-first algorithm visualization learning platform where **Python runs in the browser** and every animation frame is driven by real execution results, synchronised with the source line, variable values and a step explanation. It runs entirely locally — no server required.

**Stage 3** adds real Python recursion call-stack tracing: a `@tracked` decorator captures call/return events, unique frame ids, per-depth locals and return values, rendered in a new call-stack panel with scope-aware variables — demonstrated end-to-end by `factorial(4) = 24` and `fib(4) = 3`, all verified with real-browser Playwright tests.

```sh
npm ci
npm run dev
npm run typecheck
npm test          # 170 tests
npm run build
npm run test:e2e  # Playwright (local Microsoft Edge)
```

See [docs/STAGE3_REPORT.md](docs/STAGE3_REPORT.md) for the detailed report and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module boundaries. Never put provider API keys in the browser. MIT licensed; all exercises are original, not official past exam questions.
