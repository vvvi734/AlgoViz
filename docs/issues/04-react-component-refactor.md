# Issue 04 — 单文件 → React 组件化重构（功能等价迁移）

**Labels:** `refactor, phase-1, done`
**状态:** 已完成（Phase 1）
**依赖:** Issue 01, 02, 03

## 背景

把 DOM 字符串拼接与全局可变状态拆成可维护的模块，同时不丢功能。

## 范围 / 实现要点

- 拆出 `AlgorithmSidebar / VisualStage / Timeline / CodeEditorPanel / ConceptPanel / AiMentor / ProblemList / PracticeView / CustomImportView / ApiSettingsModal`。
- 状态集中在 `useLabController` / `usePracticeController` / `usePlayback`；DOM 副作用收敛到 runtime。
- 等价迁移：12 算法、时间轴、JS Worker、Pyodide、`/api/execute`、`/api/ai`、8 道练习题、中英文、移动端断点、localStorage 偏好。

## 明确不做

- 不实现新编辑器能力（Issue 06）、不实现统一 Trace Schema（Issue 05）。
- 不声称 C/C++ 可编译、不声称 AI 已具备结构化渐进教学。

## 验收标准

- 迁移前全部已有交互在新工程中可用，且不出现「已支持」的虚假标注。
- `domain` 层不引用 React/DOM，`runtime` 层不引用 React。

## 验证方式

`npm test`（86 项）、`npm run typecheck`、`npm run build`

## 备注

本 Issue 可独立领取；请在 PR 描述中写明行为变化、验证命令与仍然未完成的部分。不要把未实现的能力标注为已支持。
