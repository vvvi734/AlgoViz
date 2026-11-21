# Phase 1 阶段报告

**范围**：主题系统、项目结构重构、现有动画功能的回归测试（Issue 01–04）。
**原则**：不一次性重写全部功能；不把未实现的能力标成已支持。

## 1. 检查结论（迁移前）

`index.html` 296 行 / 69.7 KB，所有状态、DOM 渲染、i18n、算法定义、题库、Worker 源码都塞在同一个 `<script>` 里。亮/暗二态主题通过 `html[data-theme=light]` 覆写，但 `stage`、`.codearea`、`.node`、`.graph`、`.feedback` 等约 20 处颜色硬编码在组件规则中。已有 12 个 JS `trace()` 算法、可回退时间轴、Pyodide Worker、C/C++ 的 `/api/execute` 协议、8 道原创题、中英词典、Pages 上传仓库根目录的 workflow。`docs/AGENT_TASKS.md` 有 4 条草稿 Issue，但未覆盖编辑器、题库、i18n、E2E、开源治理等要求。

## 2. 逐模块改动与验证

| 模块 | 改动 | 对应测试 | 结果 |
| --- | --- | --- | --- |
| 工程骨架 | Vite 6 + React 19 + TS strict + Vitest 3；`base: './'`；`index.html` 改为 Vite 入口并内联防闪屏脚本；`npm run sync:legacy` 数据同步脚本 | `npm run typecheck`、`npm run build` | ✅ 通过；69 modules，产物含独立 Worker chunk |
| 主题系统 | `resolve.ts` 纯解析 + `ThemeProvider` 订阅媒体查询；`tokens.css` 唯一颜色源（light/dark 两套 ~80 个令牌）；`app.css` 全部 `var(--token)`；顶栏三选一 | `theme.test.ts`（5 项）、`tokens.test.ts`（5 项）、`App.dom.test.tsx` 主题用例 | ✅ 通过 |
| 动画回归 | `player.ts` 纯状态机；`usePlayback()` 只管定时器；`legacy/algorithm-definitions.js` → 生成的类型化数据 + `legacy-frames.json` 帧基线 | `player.test.ts`（7 项）、`catalog.test.ts`（33 项）、`model.test.ts`（8 项）、`program.test.ts`（4 项） | ✅ 通过；12 个算法帧流与迁移前逐帧一致 |
| 组件化重构 | 拆出 10 个组件 + 3 个状态 hook；`domain` 纯逻辑 / `runtime` 副作用 / `features` React；等价迁移 12 算法、时间轴、JS Worker、Pyodide、`/api/execute`、`/api/ai`、8 题、中英、移动端断点、localStorage | `App.dom.test.tsx`（4 项）、`messages.test.ts`（5 项）、`problems/catalog.test.ts`（5 项）、`localDemo.test.ts`（10 项） | ✅ 通过 |
| 文档与 CI | `ARCHITECTURE.md`、14 个独立 Issue、README 状态矩阵、CONTRIBUTING、行为准则、PR 模板、CI workflow、Vite 版 Pages workflow | `npm ci && typecheck && test && build`（CI 中复现） | ✅ 本地三条命令通过；CI 待推送后验证 |

**测试总数：86 项，10 个测试文件，全部通过（Vitest 3.2.7）。** 类型检查 0 错误；生产构建成功。

## 3. 帧基线（由迁移前算法定义捕获）

| 算法 | 帧数 | 算法 | 帧数 |
| --- | --- | --- | --- |
| bubble | 25 | binary | 5 |
| insertion | 16 | linear | 6 |
| selection | 23 | stack / queue / linked | 6 / 6 / 6 |
| quick | 24 | bfs / dfs | 12 / 12 |
| inorder | 9 | 合计 | 12 个算法 |

## 4. 明确未完成（不要误读为「已支持」）

- ❌ 语法高亮、行号、编译错误提示、代码保存（Issue 06）：编辑器仍是纯 `textarea`，只是配色已令牌化。
- ❌ 统一 Trace Event Schema v1、跨语言事件校验与回放引擎（Issue 05）：当前仍是迁移前的 `frames[{state,message}]`。
- ❌ C/C++ 安全编译执行后端（Issue 08）：只有客户端协议与示例，点击运行会明确报错；**绝不在 Web 进程运行不可信代码**。
- ❌ AI 渐进式教学结构化 hintLevel 与防剧透校验（Issue 09）：只有 prompt 级约束和本地启发式兜底。
- ❌ 题库三分类 / 408 考研强化（Issue 10）：仍是 2 类 8 道原创示例题，非官方真题。
- ❌ 以 C++/C/Python 为主要教学语言（Issue 14）：JS 示例最完整，其他语言多数只有脚手架或占位。
- ❌ Playwright E2E / axe 可访问性（Issue 12）：目前只有 jsdom 冒烟。
- ⚠️ Pyodide 无预加载/离线缓存/行列级错误定位；中英词典未覆盖未来新增文案；移动端只有断点布局未做触控与对比度审计。
- ⚠️ 服务端隐藏测试、成绩判定、账号体系均不存在。

## 5. 迁移说明与已知取舍

- 根目录 `index.html` 已被 Vite 入口替换；迁移前的**数据定义**（算法 / 题库 / i18n / 多语言示例）逐字保存在 `legacy/algorithm-definitions.js`，作为帧基线的唯一来源；完整旧 HTML 未另行保留。新工程不引用 `legacy/` 运行时。
- `src/**/*.generated.ts` 与 `src/test/fixtures/legacy-frames.json` 由 `npm run sync:legacy` 生成并签入仓库；CI 会重新生成并要求无 diff，防止基线与数据漂移。
- `advance()` 在到达最后一帧时立即把 `playing` 置为 false；旧实现会在下一次 tick 才停止。播放/暂停/重播的用户可见行为一致，但状态机实现更确定。
- `useLabController` 用递增 `runId` 忽略过期执行结果，避免快速切换算法时旧 Worker 覆盖新帧（旧原型用 `currentAlgo` 变量判断）。
- 本地演示（AI 导入页）不再额外改写运行状态栏文案；这是重构中一处刻意简化的非核心提示，功能本身保留。

## 6. 下一步

按依赖顺序推进 Issue 05（Trace Event Schema）→ 06（编辑器）→ 07（Pyodide）→ 08（C/C++ 沙箱），其中 05 是后三者的前置。每个 Issue 独立领取、独立测试、独立说明未完成部分。
