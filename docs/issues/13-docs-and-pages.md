# Issue 13 — README、贡献规范与 GitHub Pages 发布

**Labels:** `docs, ci, phase-4, todo`
**状态:** 待实现（Phase 1 已完成基础部分）
**依赖:** Issue 01, 12

## 背景

开源项目需要可验证的状态说明、贡献流程与可复现部署。

## 范围 / 实现要点

- README 中英双语 + 真实状态矩阵（已实现 / 协议占位 / 未实现），本地开发与安全说明。
- `CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、Issue / PR 模板、标签体系、语义化提交约定。
- Pages workflow 构建 `dist/` 并部署；CI workflow 跑 typecheck / test / build；发布检查清单。

## 明确不做

- 不把未实现功能写成「已支持」。

## 验收标准

- 全新 clone 后按 README 三条命令即可运行与构建。
- Pages 产物在项目路径下资源引用正确。

## 验证方式

`npm ci && npm run typecheck && npm test && npm run build` + Pages 部署验证

## 备注

本 Issue 可独立领取；请在 PR 描述中写明行为变化、验证命令与仍然未完成的部分。不要把未实现的能力标注为已支持。
