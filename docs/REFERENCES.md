# 参考来源、设计借鉴与许可证记录（Stage 3B / Stage 5A 增补）

本文件只记录**研究过什么、借鉴了什么、有没有复用代码或素材**，避免把"参考设计"和"复制实现"混为一谈。

核验时间：2026-11-16。核验方式：直接访问 GitHub License API 与仓库内 LICENSE 原文件；Stage 5A 的 SDK 事实取自 `packages/mcp-server/node_modules/@modelcontextprotocol/sdk/package.json` 与 npm registry。

| 参考项目 | 仓库 | 许可证（原文核验） | 本项目的使用方式 |
| --- | --- | --- | --- |
| OpenDSA | https://github.com/OpenDSA/OpenDSA | MIT，许可文件名为 `MIT-license.txt`（版权行："OpenDSA Project / Distributed under the MIT License / Copyright (c) 2011-2025 - Ville Karavirta and Cliff Shaffer"）。注意：GitHub License API 因其文件名特殊而归类为 `other / NOASSERTION`，以仓库内原文为准。 | **仅学习设计思想**。 |
| Algorithm Visualizer | https://github.com/algorithm-visualizer/algorithm-visualizer | MIT，许可文件 `LICENSE`（"Copyright (c) 2019 Jinseo Jason Park"）。 | **仅学习设计思想**。 |
| Python Tutor / VisuAlgo / AlgoMonster | —（公开网页产品） | 未复用任何内容，未读取其源码仓库 | **仅观察公开交互设计**（"教学步骤 + 当前执行"并排呈现、点击步骤定位执行过程这类通用交互模式）。 |
| Model Context Protocol TypeScript SDK（Stage 5A） | https://github.com/modelcontextprotocol/typescript-sdk | **MIT**（本地安装实读：`@modelcontextprotocol/sdk@1.32.2`，`license: "MIT"`，`engines.node >= 18`，peer `zod ^3.25 \|\| ^4`） | **作为运行时依赖使用**（未复制其源码到本仓库）；stdio Transport、`McpServer`、`Client`、`InMemoryTransport`、`StdioClientTransport` 均为直接依赖。 |
| MCP Inspector（Stage 5A 验证工具） | https://github.com/modelcontextprotocol/inspector | 通过 `npx` 临时执行，未纳入仓库依赖 | **仅用于协议验证**（`--cli` 模式列工具、调用工具），不参与构建产物。 |

## 借鉴的设计思想（不含任何代码或文案）

来自 OpenDSA：

- 教学内容是**独立的数据/文档**，与可视化渲染组件解耦，同一套渲染组件服务多门课程。
- 教学单元有稳定标识，可被课程目录统一注册与检索。
- 教学内容的正确性可以独立校验（而不是靠人工点页面确认）。

来自 Algorithm Visualizer：

- 算法数据（执行轨迹）与渲染器分离，渲染器只消费统一的轨迹事件。
- 算法目录与可视化实现分开组织，便于后续扩展新算法、新渲染器。
- 轨迹是"执行时记录"的产物，渲染层不得自行推测执行状态。

这些思想在 AlgoLens 的落地形式是 `src/domain/lessons/`（课程数据 + 注册表 + 纯同步函数）

- `TraceEvent.lessonStepId`（执行时记录的教学阶段）+ 单一 `currentEvent` 驱动的 `LessonPanel`。

Stage 5A 关于 MCP 的设计取向（不涉及任何第三方代码）：

- **协议交给官方 SDK，规则留给自己**：传输、握手、JSON Schema 转换由 SDK 负责；课程、包、会话与上下文校验全部复用本项目既有实现，避免"两套规则漂移"。
- **能力即目录、文件名即名字**：MCP 进程只拥有用户显式配置的目录，入参只接受裸文件名，这一取向借鉴操作系统"最小权限"原则，而非任何特定 MCP 实现。

## 明确没有做的事

- **没有复用任何第三方源代码**：`src/domain/lessons/*`、`LessonPanel.tsx`、`sync.ts` 全部为本项目原创实现。
- **Stage 5A 除 SDK 依赖外没有复制任何第三方实现**：`packages/mcp-server/src/*`（config / fsSafe / catalog / tools / prompts）全部原创；`domain/sessions/*` 亦原创。MCP Inspector 仅作为外部验证工具临时运行。
- **没有复用任何教学素材/文案/图片**：两门课程的中英文说明、示例代码、常见错误清单均为原创撰写（`bubbleSort.ts`、`factorial.ts`）。
- **没有复制第三方教程原文**，也没有把第三方仓库作为 git submodule 引入。
- 由于没有把第三方代码/素材复制进本仓库，源码内不需要附加第三方版权声明；Stage 5A 的 MIT SDK 以 npm 依赖形式安装（`node_modules` 不提交），其许可声明随包分发。

## 若未来引入第三方内容

必须分别确认：仓库根许可证、子模块/第三方素材的独立许可证、示例数据的授权范围；保留所要求的版权与许可声明；教学文案一律重新撰写，不复用原文。
