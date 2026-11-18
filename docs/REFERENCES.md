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

## G1 参考记录（2026-11-17）

| 项目 | 默认分支 | 许可证 | 使用方式 |
| --- | --- | --- | --- |
| TheAlgorithms/Python | `master` | MIT | 仅参考算法实现与测试思路，未复制代码/文案 |
| trekhleb/javascript-algorithms | `master` | MIT | 仅参考算法说明与测试组织，未复制代码/文案 |
| algorithm-visualizer/algorithm-visualizer | `master` | MIT | 仅参考“执行轨迹与渲染器分离”的设计思想，未复制代码/素材 |

三个仓库均未作为依赖或子模块引入；AlgoViz 的 Floyd/Bellman 实现、Trace、课程与视觉组件均为自研。

## G2 参考记录（2026-11-18）

本轮只阅读公开仓库中的 Prim/Kruskal 实现、测试组织和小图边界用例；没有复制任何代码、文案或素材，也没有作为依赖或 git submodule 引入。AlgoViz 的 MST Python 程序、Trace、并查集实现、课程与视觉组件均为自研。

| 项目 | 默认分支 | 许可证 | 使用方式 |
| --- | --- | --- | --- |
| TheAlgorithms/Python | `master` | MIT（公开仓库页标注；本轮未复制） | 仅参考 Prim/Kruskal 的可读实现与测试思路；未复制函数、注释或测试数据 |
| trekhleb/javascript-algorithms | `master` | MIT（`LICENSE` 原文核验：Copyright (c) 2018 Oleksii Trekhleb） | 仅参考算法说明与测试组织；未复制代码或文案 |
| algorithm-visualizer/algorithms | `master` | 未单独核验根许可证；未复制任何内容 | 仅观察“轨迹与渲染分离”的通用设计取向；未移植整套 UI、播放器或素材 |

由于没有复制第三方代码/素材，本仓库源码不需要附加第三方版权声明；若未来引用其中具体实现，必须先固定仓库、路径、版本与许可证，并补齐署名与许可文本。

## G3 参考记录（2026-11-18）

本轮 G3 的 Kahn 与 AOE 实现、Trace、课程与视觉组件均为自研；没有复制任何第三方代码、文案、测试数据或素材，也没有把参考仓库作为依赖或 git submodule 引入。实现采用数据结构教材中的标准 Kahn 入度法与 AOE 事件/活动时间参数方法。

| 项目 | 默认分支 | 许可证 | 使用方式 |
| --- | --- | --- | --- |
| TheAlgorithms/Python | `master` | MIT（仓库公开标注；本轮未复制） | 作为后续核对算法写法的参考链接；本轮未读取或复用具体实现 |
| trekhleb/javascript-algorithms | `master` | MIT（`LICENSE` 公开标注；本轮未复制） | 作为后续核对测试组织方式的参考链接；本轮未读取或复用具体实现 |
| algorithm-visualizer/algorithms | `master` | 未单独核验根许可证；本轮未复制 | 仅保留“执行轨迹与渲染分离”的通用设计取向；未移植整套 UI、播放器或素材 |

由于没有复制第三方代码/素材，本仓库源码不需要附加第三方版权声明。若未来引用其中具体实现，必须先固定仓库、路径、版本与许可证，并补齐署名与许可文本。

## G4 参考记录（2026-11-18）

本轮 G4 的连通分量、Kosaraju 双遍 DFS、Trace、课程与视觉组件均为自研。实现采用数据结构教材中的标准无向图 DFS 连通分量与 Kosaraju 算法；课程只使用通用算法概念，没有复制第三方文案或测试数据，也没有把参考仓库作为依赖或 git submodule 引入。

| 项目 | 默认分支 | 许可证 | 使用方式 |
| --- | --- | --- | --- |
| TheAlgorithms/Python | `master` | MIT（仓库公开标注；本轮未复制） | 仅作为核对 Kosaraju / 连通分量标准写法的参考链接；未复制函数、注释或测试数据 |
| trekhleb/javascript-algorithms | `master` | MIT（`LICENSE` 公开标注；本轮未复制） | 仅作为核对图算法测试组织方式的参考链接；未复制代码或文案 |
| algorithm-visualizer/algorithms | `master` | 未单独核验根许可证；本轮未复制 | 仅保留“执行轨迹与渲染分离”的通用设计取向；未移植整套 UI、播放器或素材 |

由于没有复制第三方代码/素材，本仓库源码不需要附加第三方版权声明。若未来引用其中具体实现，必须先固定仓库、路径、版本与许可证，并补齐署名与许可文本。

## T1 参考记录（2026-11-18）

本轮 T1 的 BST Python 程序、稳定节点 ID、删除三案例 Trace、课程与视觉组件均为自研，实现采用数据结构教材中的标准 BST 查找/插入与 Hibbard 删除（中序后继物理移植）方法；没有复制第三方代码、文案、测试数据或素材，也没有把参考仓库作为依赖或 git submodule 引入。

| 项目 | 默认分支 | 许可证 | 使用方式 |
| --- | --- | --- | --- |
| TheAlgorithms/Python | `master` | MIT（仓库公开标注；本轮未复制） | 仅作为核对 BST 查找/插入/删除标准写法的参考链接；未复制函数、注释或测试数据 |
| trekhleb/javascript-algorithms | `master` | MIT（`LICENSE` 公开标注；本轮未复制） | 仅作为核对 BST 删除案例测试组织方式的参考链接；未复制代码或文案 |
| algorithm-visualizer/algorithms | `master` | 未单独核验根许可证；本轮未复制 | 仅保留“执行轨迹与渲染分离”的通用设计取向；未移植整套 UI、播放器或素材 |

由于没有复制第三方代码/素材，本仓库源码不需要附加第三方版权声明。若未来引用其中具体实现，必须先固定仓库、路径、版本与许可证，并补齐署名与许可文本。

## T2 参考记录（2026-11-18）

本轮 T2 的 AVL Python 程序、稳定节点 ID、高度/平衡因子、四种旋转与删除后多层重平衡 Trace、课程与视觉组件均为自研。实现采用数据结构教材中的标准 AVL 旋转与再平衡方法；没有复制第三方代码、文案、测试数据或素材，也没有把参考仓库作为依赖或 git submodule 引入。

| 项目 | 默认分支 | 许可证 | 使用方式 |
| --- | --- | --- | --- |
| TheAlgorithms/Python | `master` | MIT（仓库公开标注；本轮未复制） | 仅作为核对 AVL 插入/删除与旋转标准写法的参考链接；未复制函数、注释或测试数据 |
| trekhleb/javascript-algorithms | `master` | MIT（`LICENSE` 公开标注；本轮未复制） | 仅作为核对 AVL 旋转案例与测试组织方式的参考链接；未复制代码或文案 |
| algorithm-visualizer/algorithms | `master` | 未单独核验根许可证；本轮未复制 | 仅保留“执行轨迹与渲染分离”的通用设计取向；未移植整套 UI、播放器或素材 |

由于没有复制第三方代码/素材，本仓库源码不需要附加第三方版权声明。若未来引用其中具体实现，必须先固定仓库、路径、版本与许可证，并补齐署名与许可文本。
