# Issue 02 — 完整的 Light / Dark / System 主题系统

**Labels:** `ui, theme, phase-1, done`
**状态:** 已完成（Phase 1）
**依赖:** Issue 01

## 背景

原原型只有亮/暗二态，且大量组件和编辑器颜色硬编码。

## 范围 / 实现要点

- `theme/resolve.ts` 纯解析 + `ThemeProvider` 订阅 `prefers-color-scheme` 实时切换。
- 偏好持久化，首屏前应用，同步 `data-theme` / `data-theme-preference` / `color-scheme`。
- `styles/tokens.css` 为唯一颜色源，定义两套同名令牌（含 `--code-*` 编辑器专用）。
- `styles/app.css` 全部改为 `var(--token)`；顶栏提供 Light / Dark / System 三选一。

## 明确不做

- 不做用户自定义配色、不做主题动画过渡（后续可选）。
- 不把任何组件颜色写回组件 CSS。

## 验收标准

- 三种模式都能生效；system 跟随系统并在系统切换时实时更新。
- 所有面板、柱状图、节点、图、反馈框、弹窗、代码编辑器在两套主题下都有对应令牌。

## 验证方式

`src/theme/theme.test.ts`、`src/theme/tokens.test.ts`、`src/app/App.dom.test.tsx`

## 备注

本 Issue 可独立领取；请在 PR 描述中写明行为变化、验证命令与仍然未完成的部分。不要把未实现的能力标注为已支持。
