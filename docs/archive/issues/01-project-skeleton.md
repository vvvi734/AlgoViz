# Issue 01 — 工程骨架：Vite + React + TypeScript + Vitest

**Labels:** `infra, phase-1, done`
**状态:** 已完成（Phase 1）
**依赖:** 无

## 背景

单文件 HTML 无法单测、无法并行开发。

## 范围 / 实现要点

- 新增 `package.json` / `tsconfig.json` / `vite.config.ts`，React 19 + TS strict + Vitest + jsdom。
- 目录分层：`app / features / domain / runtime / theme / i18n / styles / test / legacy / scripts`。
- 根目录 `index.html` 改为 Vite 入口，首屏前注入主题脚本避免闪屏。
- `base: './'` 兼容 GitHub Pages 项目路径；构建产物输出到 `dist/`。

## 明确不做

- 不引入路由、状态管理库、UI 组件库（本期不需要）。
- 不改动算法行为。

## 验收标准

- `npm run typecheck`、`npm test`、`npm run build` 全部通过。
- 生产构建包含 JS Worker 独立 chunk。

## 验证方式

`npm run typecheck`；`npm test`；`node node_modules/vite/bin/vite.js build`

## 备注

本 Issue 可独立领取；请在 PR 描述中写明行为变化、验证命令与仍然未完成的部分。不要把未实现的能力标注为已支持。
