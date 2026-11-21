# 贡献指南 / Contributing

感谢你愿意改进 AlgoViz。请先阅读 [README](README.md)、[架构说明](docs/ARCHITECTURE.md) 与 [教材课程覆盖表](docs/TEXTBOOK_COVERAGE.md)，避免重复实现或把待完善条目误标为已支持。

## 开发前

```sh
npm ci
npm run typecheck
npm test
npm run build
```

三条命令全绿才可以开 PR。课程已完成 / 待开发状态以 [`docs/TEXTBOOK_COVERAGE.md`](docs/TEXTBOOK_COVERAGE.md) 为准。

## 模块边界（PR 评审重点）

| 层 | 可以 | 不可以 |
| --- | --- | --- |
| `src/domain/**` | 纯函数、类型、数据 | 引用 React / DOM / Worker / localStorage |
| `src/runtime/**` | Worker、fetch、Blob、存储 | 引用 React 组件 |
| `src/features/**` | React 组件与 hook | 直接操作 DOM、直接读写 localStorage |
| `src/theme/**`, `src/i18n/**` | 偏好与文案 | 写死组件颜色 |
| `src/styles/app.css` | 只用 `var(--token)` | 出现任何 hex / rgb / hsl 字面量（有测试拦截） |
| `legacy/**` | 作为回归基线 | 被应用运行时 import |

## 新增或修改算法

1. 已有生成式算法的基础定义在 `legacy/algorithm-definitions.js`；修改后执行 `npm run sync:legacy`，把生成的 `.generated.ts` 与帧 fixture 一起 review 并提交，说明帧数变化原因。不要直接手改 `*.generated.ts`。
2. KMP、稀疏矩阵快速转置等特殊入口通过 `src/domain/algorithms/examples.ts` 合并，不要为了统一注册表而漏掉它们。
3. 新算法必须提供真实 Python Trace、输入 Schema、官方 / 自定义 / 随机输入、三语言参考代码与双语课程；完整路径见 [架构说明](ARCHITECTURE.md#6-新增课程的统一路径)。
4. 新算法至少覆盖正常输入、空输入、重复元素、边界输入；帧数上限 500，消息长度上限 240，不得绕过 `createTraceCollector()`。
5. 理论专题不得挂播放器；动态算法只允许一个时间轴、一个播放器。

## 主题与文案

- 新增颜色一律加到 `src/styles/tokens.css` 的 **light 与 dark 两个块**；`tokens.test.ts` 会检查。
- 新增界面文案必须同时提供 `zh` / `en`；`messages.test.ts` 会检查键 parity。
- 长文本换行，不要靠缩小字体或截断来适配布局。

## 安全红线

- 不得把 API key 或凭据提交到仓库。
- 不得在普通 Web 服务进程里编译 / 执行用户提交的 C/C++、Python 或 JavaScript；C / C++ 当前只允许只读参考代码。
- 课程文案、参考代码与题目必须原创或附带合法授权说明；不要搬运未授权的历年真题或教材原文。

## PR 描述模板

```
## 行为变化
（用户可见的变化；无则写「无」）

## 验证
- [ ] npm run typecheck
- [ ] npm test
- [ ] npm run build
- 手工验证步骤：...

## 仍未完成
（明确列出本 PR 没有覆盖的部分，禁止把占位能力写成已支持）
```

## 提交约定

使用 Conventional Commits：`feat:` / `fix:` / `refactor:` / `test:` / `docs:` / `chore:`。一个 PR 只解决一个 Issue，保持最小作用域，不要顺手改无关模块。

## 阶段提交规范（项目约定）

每完成一个阶段（一个独立 Issue，或一个 Phase 收尾）就提交一次并推送，不要攒到最后一并提交。

- 远端：`https://gitee.com/vvvi734/algolens.git`，分支 `main`（`origin/main`）。
- 提交信息：`<type>(phase-N): <一句话说明>`，例如 `test(phase-1): 补齐 12 个算法的帧回归测试`。
- 提交前必须跑完：`npm run typecheck` → `npm test` → `npm run build`。
- 提交内容只含该阶段的改动；`node_modules/`、`dist/`、`*.log`、`*.tsbuildinfo`、`.env*` 由 `.gitignore` 排除，不要强制添加。
- 推送：`git push origin main`。若远端已有他人提交，先 `git pull --rebase origin main` 再推。
- 阶段提交后，在 PR / 报告里写明「本阶段改动、验证结果、仍未完成的部分」，不要把占位能力写成已支持。
