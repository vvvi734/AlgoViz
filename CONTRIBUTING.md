# 贡献指南 / Contributing

感谢你愿意改进 AlgoLens。请先阅读 [README 状态矩阵](../README.md) 与 [架构方案](ARCHITECTURE.md)，避免重复实现或把未实现能力误标为已支持。

## 开发前

```sh
npm ci
npm run typecheck
npm test
npm run build
```

三条命令全绿才可以开 PR。Issue 列表在 [`docs/issues/`](issues/)，按编号领取并在 PR 中写明 `Closes #NN`。

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

1. 算法代码字符串在 `legacy/algorithm-definitions.js` 中；改完执行 `npm run sync:legacy`，**把生成的 `.generated.ts` 与 `src/test/fixtures/legacy-frames.json` 一起提交**，并在 PR 描述里说明帧数变化的原因。
2. 新算法必须至少有：正常输入、空输入、重复元素、边界输入四类测试。
3. 帧数上限 500，消息长度上限 240；不要绕过 `createTraceCollector()`。

## 主题与文案

- 新增颜色一律加到 `src/styles/tokens.css` 的 **light 与 dark 两个块**；`tokens.test.ts` 会检查。
- 新增界面文案必须同时提供 `zh` / `en`；`messages.test.ts` 会检查键 parity。
- 长文本换行，不要靠缩小字体或截断来适配布局。

## 安全红线

- 不得把 API key、沙箱凭据或隐藏测试写进前端或仓库。
- 不得在普通 Web 服务进程里编译 / 执行用户提交的 C/C++、Python 或 JavaScript。
- 不得把 AI 生成的代码不经检查直接执行或声称其正确。
- 题目内容必须原创或附带合法授权说明；不要搬运未授权的历年真题。

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
