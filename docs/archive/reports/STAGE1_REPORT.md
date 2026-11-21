# AlgoLens 阶段一开发总结：统一 Trace 协议与同步算法可视化

> 版本 v0.3 Stage 1 · 完成日期 2026-11-16 · 分支 `main`

本阶段只做一件核心事：**建立可靠的统一执行追踪协议，并让 Python 代码、变量值、数据结构动画和执行步骤说明同步变化**。未提前开发后续阶段功能。

---

## 1. 本阶段完成情况

| # | 验收条件 | 状态 | 说明 |
| --- | --- | --- | --- |
| 1 | 项目仍能本地启动 | ✅ 已完成 | `npm run dev` / `build` 正常，生产构建成功 |
| 2 | 原有 12 个算法动画可继续使用 | ✅ 已完成 | 逐帧回归测试通过，帧流与迁移前一致 |
| 3 | C/C++ 与自动判题入口已按新定位清理 | ✅ 已完成 | 语言类型收敛为 `js \| python`；`native/client.ts` 删除；练习「运行测试/判题」改为「运行并查看输出」+ 手动「标记完成」；删除「在线判题」宣传 |
| 4 | Trace Event Schema v1 有明确类型和运行时校验 | ✅ 已完成 | Zod v3 校验，含版本、事件类型、限额与结构化错误 |
| 5 | Python 追踪支持真实变量快照和源码位置 | ✅ 已完成 | `trace(state, message='', line=None, variables=None)`，Python 侧深拷贝快照 |
| 6 | 冒泡排序同步显示代码、数组、变量与解释 | ✅ 已完成 | Python 冒泡排序四区联动（代码行/数组/变量/步骤） |
| 7 | 时间轴前进、回退、拖动时所有面板同步 | ✅ 已完成 | 单一 `currentEvent` 数据源，`SyncPanel` 三区 + 舞台同源 |
| 8 | 不存在用模拟数据冒充真实执行结果 | ✅ 已完成 | 旧算法缺失变量/行号显示空态；变量与行号仅来自真实运行 |
| 9 | 新增相关测试通过 | ✅ 已完成 | 112 项测试（新增 26 项）全部通过 |
| 10 | 原有功能无重大回归 | ✅ 已完成 | 主题、i18n、播放状态机、题库、Worker 均回归通过 |

---

## 2. 实际修改文件

### 新增

| 文件 | 作用 |
| --- | --- |
| `src/domain/trace/schema.ts` | Trace Event Schema v1：Zod 类型 + 运行时校验 + 限额 + `parseTraceDocument` |
| `src/domain/trace/schema.test.ts` | Schema 校验测试（字段缺失/类型错误/版本/非法步骤/超限/不可序列化） |
| `src/domain/trace/adapter.ts` | legacy `frames` → TraceEvent 兼容适配层（不编造数据） |
| `src/domain/trace/adapter.test.ts` | 适配层测试（含 Python line/variables 透传） |
| `src/runtime/url.ts` | `validateHttpUrl`（从已删除的 native/client 迁出） |
| `src/runtime/python/pyodide.trace.test.ts` | Python `trace()` 契约测试 + 边界透传测试 |
| `src/features/lab/SyncPanel.tsx` | 同步观察面板：代码位置 / 变量观察 / 步骤说明三区 |
| `src/features/lab/SyncPanel.test.tsx` | 面板联动、空态、stale 提示测试 |

### 修改

| 文件 | 改动 |
| --- | --- |
| `src/domain/trace/types.ts` | 新增 `RawTraceFrame` / `RawVariableSnapshot`；`VisualRunResult.frames` 改为 `RawTraceFrame[]` |
| `src/domain/algorithms/types.ts` | `CodeLanguage = 'js' \| 'python'`，删除 cpp/c 与 `LOCALLY_EXECUTABLE` |
| `src/domain/algorithms/examples.ts` | `exampleFor`/`engineNote` 删除 C/C++ 分支 |
| `src/domain/problems/examples.ts` | `practiceTemplate` 删除 cpp/c 分支 |
| `src/runtime/execute.ts` | 删除 `executeNative` 与 cpp/c 分发 |
| `src/runtime/python/pyodide.ts` | 重写 `trace()`：`_snapshot` 深拷贝 + 可选 `line`/`variables` |
| `src/runtime/ai/client.ts`、`src/features/ai/ApiSettingsModal.tsx` | `validateHttpUrl` 改从 `runtime/url` 导入 |
| `src/features/ai/CustomImportView.tsx` | 删除「在线判题」宣传区块 |
| `src/features/practice/usePracticeController.ts` | `testSolution` → `runSamples`（仅输出，不判题）；新增 `toggleSolved` 手动完成 |
| `src/features/practice/PracticeView.tsx` | 按钮改为「运行并查看输出」+「标记完成」；语言选项收敛为两语言 |
| `src/features/lab/useLabController.ts` | 状态改为 `events + source`，执行后经 adapter → schema 校验 |
| `src/features/lab/{VisualStage,Timeline,ConceptPanel,LabView,usePlayback}.tsx/.ts` | 由 `frames` 改为 `events`（TraceEvent） |
| `src/i18n/messages.ts` | footer 去掉 C/C++；新增同步面板/练习新按钮文案 |
| `src/styles/app.css` | 新增同步面板样式（复用 token，无硬编码颜色） |
| `legacy/algorithm-definitions.js` | 删除 cpp/c 示例；Python 冒泡改为带 `line`/`variables` |
| `src/**/*.generated.ts`、`src/test/fixtures/legacy-frames.json` | 由 `npm run sync:legacy` 重新生成 |
| 测试 | `catalog.test.ts`/`problems/catalog.test.ts` 收敛为两语言断言 |
| `README.md`、`docs/ARCHITECTURE.md` | 更新定位与状态矩阵 |

### 删除

| 文件 | 原因 |
| --- | --- |
| `src/runtime/native/client.ts` | C/C++ 执行后端已取消 |

---

## 3. Trace Schema 设计

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `schemaVersion` | `1`（字面量） | ✅ | 协议版本 |
| `step` | `number`（非负整数） | ✅ | 0 起步骤编号 |
| `eventType` | `init\|step\|compare\|swap\|visit\|mark\|done` | ✅ | 事件类型（适配层只发 `step`/`done`） |
| `visualType` | `array\|stack\|queue\|linked\|tree\|graph` | ✅ | 数据结构展示类型 |
| `state` | JSON 对象 | ✅ | 可视化状态（渲染以 `state.type` 为准） |
| `message` | `string`（≤240） | ✅ | 步骤说明 |
| `sourceLocation` | `{ line, column? }` | 可选 | 源码定位 |
| `variables` | `{ name, type, value, scope? }[]` | 可选 | 变量快照 |
| `callStack` | `{ name, line? }[]` | 可选 | 调用栈（本阶段仅定义，未动画化） |

顶层还有 `source`（生成这些事件的源码快照）与 `events[]`。

### 限额

事件 500 / 消息 240 字符 / 变量 50 / 调用栈 64 / 状态 8KB / 变量值 2KB / 单事件 16KB / 总量 2MB / 源码 40K 字符。超过即拒绝并返回结构化错误。

### 历史兼容

`adapter.ts` 把 legacy `frames[{state,message}]` 转成事件：`visualType` 取自 `state.type`（未知类型回退为 `array` 但 `state.type` 保留，渲染仍走 raw 回退）；旧算法无 `line`/`variables` 时不生成这两个字段，UI 展示空态。**不编造变量、行号或 eventType**。

### 真实 Trace Event 示例（Python 冒泡排序「交换」步）

```json
{
  "schemaVersion": 1,
  "step": 3,
  "eventType": "swap",
  "visualType": "array",
  "state": { "type": "array", "values": [2, 5, 8, 1, 6, 3], "focus": [0, 1] },
  "message": "交换 / Swap",
  "sourceLocation": { "line": 8 },
  "variables": [
    { "name": "i", "type": "int", "value": 0 },
    { "name": "j", "type": "int", "value": 0 },
    { "name": "arr", "type": "list", "value": [2, 5, 8, 1, 6, 3] }
  ]
}
```

---

## 4. Python 同步可视化成果（冒泡排序）

- **运行方式**：Pyodide 0.27.7 classic Worker（CDN 按需加载），30 秒限时，绝不经过服务器。
- **变量记录方式**：`trace(..., variables={'i': i, 'j': j, 'arr': arr.copy()})`，Python 侧 `_snapshot()` 深拷贝 + `json.dumps` 立即序列化，保证后续数组变更不污染历史帧（已用真实 Python 解释器验证）。
- **代码行映射方式**：显式 `line=N` 指向语义相关的语句（`比较`→第 7 行 if、`交换`→第 8 行 swap），不做解释器级自动逐行调试、不猜行号。
- **时间轴联动方式**：`useLabController` 持有 `events[]` 与 `source`，`playback.index` 是唯一 `currentStep`；舞台、代码位置、变量表、步骤说明都读 `events[index]`，回退/拖动自动恢复对应帧的变量。
- **真实效果**：25 帧，与 JS 冒泡帧数一致；末帧 `done:true` 自动停止；比较/交换通过 `focus` 高亮对应柱。
- **编辑后重新追踪**：执行时记录 `source` 快照；用户编辑代码后 `editorCode !== source` 触发 `traceStale`，同步面板显示「代码已修改…请重新运行」，高亮仍基于上次运行的只读快照，不会错位。

---

## 5. 测试结果

实际执行的命令与结果（不编造）：

```
node node_modules/typescript/bin/tsc -b --pretty false   → 退出码 0（0 个类型错误）
node node_modules/vitest/vitest.mjs run                  → 14 个文件、112 项测试全部通过
node node_modules/vite/bin/vite.js build                 → 退出码 0（81 模块，index 344.74 kB / gzip 108.30 kB）
```

新增 26 项：Schema（11）、适配层（5）、Python trace 契约（5）、同步面板（6）——其余为受影响的旧测试改写。另有一次性真实 Python 冒泡验证（非提交测试）：25 帧、排序正确、变量/行号正确、旧 API 兼容、深拷贝隔离。

未做浏览器 E2E（本阶段不强加新测试工具链，Playwright/axe 留到后续）。

---

## 6. 已知问题

1. **无浏览器 E2E**：Pyodide 的真实浏览器加载、同步面板在真实 Worker 下的表现未自动化验证。
2. **Python 侧深拷贝仅「源码级 + 边界级」验证**：`_snapshot` 逻辑以字符串形式内嵌在 worker 源码中，通过契约测试与真实 Python 一次性验证覆盖，未做 Pyodide 集成测试。
3. **默认语言仍是 JavaScript**：12 个算法演示以 JS 示例最完整，故实验室默认语言暂留 JS（保证离线启动即有动画）；Python 已可作为一等选项并完成冒泡端到端，切换默认语言是单行改动。
4. **i18n 残留死键**：`grading`/`gradingDetail` 两个词典键已无任何组件引用，留待后续清理（不改动 legacy 压缩行以降低风险）。
5. **`visualType` 冗余**：未知 `state.type` 回退为 `array` 的降级字段与 `state.type`（渲染真相源）并存，语义已文档化但略冗余。
6. **`callStack` 仅定义未动画**：协议字段已就绪，递归调用栈可视化留待后续。

---

## 7. 下一阶段准备情况

- **接入 Monaco**：现有 `SyncPanel` 已用「只读代码 + 行号 + 高亮行」验证了 `source + sourceLocation.line` 的映射链路；Monaco 可直接复用 `events[index].sourceLocation` 做 `setPosition`/高亮，无需改 Schema。建议 Stage 2 用 Monaco 替换现有 `.codeview` 只读区并加编辑能力。
- **Monaco 按 Trace 高亮**：已具备 `source` 快照与 `sourceLocation.line`，Monaco 的 decoration API 天然契合；只需保证编辑器内容与 `source` 一致（已有一致性校验 `traceStale`）。
- **Python Worker 限制**：① 每次运行重建 Worker 并重新 `loadPyodide()`（无缓存/预加载）；② 无源码行级异常定位（异常仍是整条 `String(err)`）；③ `trace()` 依赖用户显式传 `line`，无解释器级逐行调试。
- **是否需要改 Schema**：短期不需要。编辑器诊断、递归栈动画都已被当前字段覆盖（`sourceLocation`、`callStack`）；若要记录「未捕获异常」，可增量加一个可选 `error` 字段（向后兼容）。
- **递归栈动画障碍**：`callStack` 协议已定义，但 Python/JS 运行时目前都不产出调用栈帧；需要各 runner 增加「进入/退出函数」的显式钩子（或轻量装饰器）后才有数据可动画。

---

## 8. Git 状态

- **分支**：`main`
- **远端**：`https://gitee.com/vvvi734/algolens.git`（`origin`）
- **README**：已更新（定位、状态矩阵、Trace Schema 说明）
- 本次改动尚未提交（将在三门槛全绿后按 `docs(phase-2): ...` 提交并推送）。

---

**下一步建议**：Stage 2 优先做 Monaco 编辑器（高亮/行号/诊断/保存）并直接复用 `sourceLocation` 做 Trace 高亮；Python Worker 增加缓存与行级异常定位。是否开始由你确认，我不会自行推进 Stage 2。
