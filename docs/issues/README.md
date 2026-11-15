# 独立 Issue 索引

14 条 Issue 均可独立领取，每条都写明了「范围 / 明确不做 / 验收标准 / 验证方式 / 依赖」。

| # | Issue | 阶段 | 状态 |
| --- | --- | --- | --- |
| 01 | [工程骨架：Vite + React + TypeScript + Vitest](01-project-skeleton.md) | Phase 1 | ✅ 已完成 |
| 02 | [完整的 Light / Dark / System 主题系统](02-three-state-theme.md) | Phase 1 | ✅ 已完成 |
| 03 | [现有动画功能的逐帧回归测试](03-animation-regression-tests.md) | Phase 1 | ✅ 已完成 |
| 04 | [单文件 → React 组件化重构](04-react-component-refactor.md) | Phase 1 | ✅ 已完成 |
| 05 | [统一 Trace Event Schema v1 与跨语言适配器](05-trace-event-schema.md) | Phase 2 | ⬜ 待实现 |
| 06 | [代码编辑器：高亮 / 行号 / 错误提示 / 保存](06-code-editor.md) | Phase 2 | ⬜ 待实现 |
| 07 | [Python / Pyodide 运行时加固](07-pyodide-runtime.md) | Phase 2 | ⬜ 待实现 |
| 08 | [C/C++ 安全编译执行后端](08-c-cpp-safe-executor.md) | Phase 2 | ⬜ 待实现 |
| 09 | [AI 助教渐进式教学与防剧透](09-progressive-ai-coach.md) | Phase 3 | ⬜ 待实现 |
| 10 | [题库三分类与原创内容](10-question-bank.md) | Phase 3 | ⬜ 待实现 |
| 11 | [中英文完善、移动端与可访问性](11-i18n-mobile-a11y.md) | Phase 3 | ⬜ 待实现 |
| 12 | [端到端测试与可访问性自动化](12-e2e-testing.md) | Phase 4 | ⬜ 待实现 |
| 13 | [README、贡献规范与 GitHub Pages 发布](13-docs-and-pages.md) | Phase 4 | ⚠️ 基础部分已完成 |
| 14 | [教学语言主次调整与示例覆盖矩阵](14-teaching-language-matrix.md) | Phase 3 | ⬜ 待实现 |

依赖顺序：`05 → 06/07/08`，`08 → 09/10/14`，`11 → 12`。详见 [架构方案](../ARCHITECTURE.md)。

> 在 GitHub 上批量创建：可用 `gh issue create --title "<标题>" --body-file docs/issues/NN-*.md --label "<labels>"` 逐个提交。本仓库不自动写入远端 Issue。
