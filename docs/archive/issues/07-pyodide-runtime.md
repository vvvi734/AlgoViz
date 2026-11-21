# Issue 07 — Python / Pyodide 运行时加固

**Labels:** `runtime, python, phase-2, todo`
**状态:** 待实现
**依赖:** Issue 05

## 背景

Pyodide 每次按需从 CDN 下载，无缓存、无预加载、错误信息不可定位。

## 范围 / 实现要点

- 优先使用 Pyodide；改为可复用的常驻 Worker、加载状态与失败重试、版本锁定与离线缓存策略。
- Python `trace()` / `solve()` 契约文档化，异常映射为可读的源码行列信息。
- 限制帧数、执行时间、输出体积；禁止隐式网络访问。

## 明确不做

- 不把 ~10MB Pyodide 运行时打进主 bundle。
- 不在主线程执行用户 Python。

## 验收标准

- 首次与二次执行均有明确反馈；断网时给出可理解提示。
- 错误 Python 代码给出行列级提示，不泄漏堆栈细节。

## 验证方式

Pyodide worker 集成测试（mock CDN）+ Python 示例 fixture

## 备注

本 Issue 可独立领取；请在 PR 描述中写明行为变化、验证命令与仍然未完成的部分。不要把未实现的能力标注为已支持。
