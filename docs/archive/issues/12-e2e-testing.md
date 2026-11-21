# Issue 12 — 端到端测试与可访问性自动化

**Labels:** `testing, phase-4, todo`
**状态:** 待实现
**依赖:** Issue 06, 07, 08, 11

## 背景

当前只有 Vitest 单测与 jsdom 冒烟，缺少真实浏览器验证。

## 范围 / 实现要点

- Playwright 覆盖：主题三态、算法选择与动画播放、四语言切换编辑器、练习判题、AI 导入、移动端视口。
- axe 扫描关键页面；把 typecheck / 单测 / E2E / build 串进 CI matrix。
- 输出可复现的失败截图与 trace。

## 明确不做

- 不依赖外部 AI / 编译服务；外部接口用 mock。

## 验收标准

- CI 中所有 E2E 稳定通过，无 axe 严重/致命违规。

## 验证方式

Playwright 配置 + CI workflow

## 备注

本 Issue 可独立领取；请在 PR 描述中写明行为变化、验证命令与仍然未完成的部分。不要把未实现的能力标注为已支持。
