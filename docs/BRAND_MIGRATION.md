# AlgoLens → AlgoViz 品牌迁移说明（Stage 7B）

本文记录 2026-11 的品牌迁移范围、兼容边界和后续技术债。原则只有一条：**用户可见名称统一为 AlgoViz；所有已经落到用户设备、文件协议、MCP 或 AI Gateway 里的稳定标识继续工作。**

## 1. 迁移范围

### 1.1 已迁移为用户可见 AlgoViz

| 位置 | 变化 |
| --- | --- |
| 顶栏品牌 | `TopBar` 显示 `AlgoViz`，副标题使用 `brandTagline`（中/英），三层块 SVG 标识替代原 `∑` 字形 |
| 浏览器标题 / 元数据 | `index.html` 的 `<title>` 为 `AlgoViz · Interactive Algorithm Visualization & Learning`，description、`application-name`、`theme-color` 同步 |
| 页面页脚 | 中文/英文 footer 均为 AlgoViz |
| README | 标题、简介、版本段、状态矩阵中的品牌改为 AlgoViz |
| 架构文档 | `docs/ARCHITECTURE.md` 标题改为 `AlgoViz 架构方案（v0.9 / Stage 7B）` |
| 贡献/许可证/Gateway 文档 | `CONTRIBUTING.md`、`LICENSE`、`docs/AI_GATEWAY.md`、`.env.example` 文件头、PACK 文档中的项目 prose 改为 AlgoViz |
| 官方示例包 | `packs/src/algolens-search-basics/manifest.json` 的 `author` 改为 `AlgoViz`；README 标明 AlgoViz 官方示例包；`.algopack` 已重新打包 |
| 阶段报告 | `docs/STAGE7B_REPORT.md` 使用 AlgoViz；历史 Stage 报告按当时版本保留 AlgoLens，不改写历史 |

### 1.2 明确保留的旧标识

这些不是“漏改”，而是兼容性的一部分：

| 类别 | 保留项 | 原因 |
| --- | --- | --- |
| localStorage | `algolens-theme`、`algolens-lang`、`algolens-code-language`、`algolens.code.<algo>.<lang>`、`algolens-api`、`algolens-practice-language`、`algolens-solved-*` | 用户刷新/升级后草稿、主题、语言、练习记录不能丢；改名需要一次性迁移，当前不做 |
| IndexedDB | 数据库名 `algolens-packs` 与三个 store | 已安装知识包必须在升级后继续存在；清库会丢课程 |
| 知识包 | `packId = algolens-search-basics`、目录名、`.algopack` 文件名与内容路径 | packId 是课程来源、安装冲突和 `lessonOrigin` 的一部分；改 ID 会让旧包变成另一门课 |
| Monaco | 自定义主题名 `algolens`、CSS 类 `algolens-active-line*` | 只是内部视觉标识，不影响用户；改名会造成无收益的样式/测试 churn |
| HTTP | 请求头 `x-algolens-client` | Gateway 的 Origin/自定义头校验依赖它；改名会让旧客户端无法连接 |
| AI Gateway | 环境变量 `ALGOLENS_AI_*`、`ALGOLENS_AI_MOCK`、端口配置等 | 部署脚本、CI、用户 `.env` 已在使用；改名是破坏性变更 |
| MCP | 6 个 tool 名称、stdio 包名/可执行路径 | 宿主配置已引用；改名会让 Claude Code / Cursor 等现有配置失效 |
| 代码符号 | `algolens` npm package name、内部类型/文件路径 | 与用户无关；改包名可能影响 lockfile、构建与发布 |
| 历史文档 | Stage 1–7A 报告中的 AlgoLens | 尊重版本演进；报告描述的是当时的产品 |

## 2. 存储迁移策略

**本阶段不执行存储迁移。** 理由是旧 key 仍被当前代码读取，迁移反而增加丢数据风险：

- 代码继续优先读取旧 key；新写入仍使用同一 key，避免出现“旧草稿在 A key、新草稿在 B key”的双写分叉。
- 官方 `.algopack` 重新打包只改 manifest 的 `author` 和 README 文案，`packFormatVersion`、`packId`、`requiredTraceSchema`、课程 ID、文件路径均未变；已安装的旧包不需要卸载重装。
- `.algosession.json` / `.algocontext.json` 的 `sessionFormatVersion` / 文件协议未变，旧文件可直接导入。
- 若未来要做前缀迁移，必须提供一次性、可回滚、带“读取旧 key → 写入新 key → 校验 → 保留旧 key 一个版本”的迁移函数，并用 fake-indexeddb + localStorage 测试证明无数据丢失；本阶段明确不做。

## 3. Git 与包身份

- 远端保持 `https://gitee.com/vvvi734/algolens.git`，分支 `main`，未改 remote、未强推、未重写历史。
- 根 `package.json` 的 `name` 仍为 `algolens`（内部包身份），`version` 在 Stage 7B 为 `0.9.0-phase7b`，Stage 7C 升为 `0.9.0-phase7c`，Stage 7D 升为 `0.9.0-phase7d`，`description` 改为 AlgoViz 描述。
- 没有发布任何 npm 包；`packages/mcp-server` 与 `packages/ai-gateway` 的包名/协议身份未改。
- 官方 `.algopack` 二进制因 manifest/README 文案变化而重新生成，属于内容更新，不是格式升级。

## 4. 品牌审计方法

1. 对仓库执行 `rg -i "AlgoLens|algolens"`，得到 79 个文件。
2. 逐项分类为：用户品牌、配置标识、持久化 key、协议字段、代码符号、历史文档。
3. 只对“用户品牌”做定向编辑，禁止全局替换；`algolens` 小写标识一律保留。
4. 用单测与真实 E2E 验证：页面可见文本不含 AlgoLens、旧草稿仍能读取、旧主题 key 仍生效、官方包仍可安装、MCP/AI 回归仍通过。

## 5. 后续技术债

- 是否把 localStorage/IndexedDB 前缀统一到 `algoviz-*`，需要一次可测试的迁移；当前未做。
- `algolens` npm 包名、MCP/AI 子包名与远端仓库名仍是旧标识；这不影响用户，但会在开发者文档里长期存在。
- 历史 Stage 报告保留旧名；如果未来对外发布合集，需要在索引页标注“AlgoLens 为 AlgoViz 的旧名”。
- `ALGOLENS_*` 环境变量若未来改名为 `ALGOVIZ_*`，必须同时支持旧变量至少一个发布周期。
