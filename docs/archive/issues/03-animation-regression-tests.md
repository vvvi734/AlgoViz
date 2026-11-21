# Issue 03 — 现有动画功能的逐帧回归测试

**Labels:** `testing, phase-1, done`
**状态:** 已完成（Phase 1）
**依赖:** Issue 01

## 背景

重构前没有任何测试，无法证明动画行为未被改坏。

## 范围 / 实现要点

- `legacy/algorithm-definitions.js` 保留迁移前数据定义；`npm run sync:legacy` 生成类型化模块与 `src/test/fixtures/legacy-frames.json`。
- 12 个算法逐一比对逐帧快照；覆盖空数组、重复元素、单元素与排序终态。
- 播放状态机、可视化映射、日志窗口、i18n、题库、关键词路由、UI 冒烟全部单测化。

## 明确不做

- 不新增算法、不改动任何算法源码字符串。
- 不在测试运行时自动刷新基线（基线必须显式重新捕获并 review）。

## 验收标准

- 任一算法帧流与迁移前不一致即失败。
- 播放/暂停/回退/单步/拖动/末尾自动停止与旧版一致。

## 验证方式

`src/domain/algorithms/catalog.test.ts`、`src/domain/trace/player.test.ts`、`src/domain/visualization/model.test.ts`、`src/app/App.dom.test.tsx`

## 备注

本 Issue 可独立领取；请在 PR 描述中写明行为变化、验证命令与仍然未完成的部分。不要把未实现的能力标注为已支持。
