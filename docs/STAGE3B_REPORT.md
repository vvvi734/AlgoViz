# Stage 3B 阶段报告：算法教学课程系统 + 教学步骤与真实 Trace 同步

版本：`0.4.0-phase3b`
日期：2026-11-16
基线：`8f5b7f2`（Stage 3 Fix 收尾提交，工作区 clean）
分支：`main`，远端 `https://gitee.com/vvvi734/algolens.git`

本阶段只做两件事：把教学课程变成**可校验、可注册、可查询的数据**；把教学步骤与**真实 Python 执行产生的 Trace**用一条显式记录（`lessonStepId`）连起来。没有做 AI、MCP、包安装器，也没有新增算法。

---

## A. 功能完成矩阵

对照任务书「十三、Stage 3B 完成标准」的 16 条：

| # | 验收标准 | 状态 | 证据 |
| --- | --- | --- | --- |
| 1 | 建立经过运行时验证的 Lesson Schema | ✅ | `domain/lessons/schema.ts`（Zod）+ `schema.test.ts` 11 项；注册表在模块加载期即校验，内置课程校验失败会直接抛错 |
| 2 | 课程内容与算法执行逻辑分离 | ✅ | `domain/lessons/` 不 import React / Worker / trace schema；UI 只读数据 |
| 3 | Trace Event 能关联真实教学阶段 | ✅ | 事件新增可选 `lessonStepId`；Python `trace(..., lesson_step=)`、`@tracked(call_step=, return_step=)` 在**执行时**写入 |
| 4 | 同一教学步骤对应多个真实执行帧 | ✅ | 冒泡一次运行中 `compare` 15 帧、`swap` 8 帧（真实 Pyodide 实测，见 E 节） |
| 5 | LessonPanel 正常展示算法说明与步骤 | ✅ | `features/lab/LessonPanel.tsx` + `LessonPanel.test.tsx` 12 项 |
| 6 | 时间轴变化能同步高亮教学步骤 | ✅ | 同一 `currentEvent`；`App.stage3b.lesson.test.tsx` 覆盖拖动/单步/回退 |
| 7 | 点击教学步骤能定位对应执行帧 | ✅ | 纯函数 `findFrameForStep`（向后找→回绕首帧→`null`）+ 组件/应用级测试 |
| 8 | 冒泡排序教学课程完整 | ✅ | `bubbleSort.ts`：5 阶段 + 介绍/思想/前置/复杂度/4 条常见错误，中英双语 |
| 9 | 阶乘教学课程完整 | ✅ | `factorial.ts`：6 阶段 + 5 条常见错误，中英双语 |
| 10 | 中英文内容完整 | ✅ | 所有课程字段与界面键双语言；切换语言不改 stepId、不改帧位置、不重跑代码 |
| 11 | Light / Dark / System 显示正常 | ⚠️ | 面板所有颜色只引用 `tokens.css` 令牌（`tokens.test.ts` 契约测试仍然通过），三态切换的既有 E2E 也通过；但**没有做对比度测量或三态截图人工审计** |
| 12 | 原有 14 个算法正常 | ✅ | `catalog.test.ts` 38 项帧回归通过（12 旧 + 阶乘/斐波那契）；JS 逐帧快照未改动 |
| 13 | Monaco / 变量 / 调用栈 / 时间轴无重大回归 | ✅ | 既有 170 项单测 + 7 条 E2E 全部保留并通过；新增 2 条 E2E |
| 14 | 类型检查、测试和构建通过 | ✅ | typecheck 0 错误；221/221；build 成功（见 F 节） |
| 15 | 真实浏览器 E2E 验证完成 | ✅ | 9/9（真实 Edge + 真实 Pyodide），含 2 条本阶段新增用例 |
| 16 | 参考开源项目的来源及许可记录清楚 | ✅ | `docs/REFERENCES.md`：OpenDSA=MIT、Algorithm Visualizer=MIT，**无任何代码/素材复用** |

未完成/受限项集中在 H 节，没有把任何未完成能力写成已完成。

---

## B. 修改文件清单

### 新增（教学课程域）

| 文件 | 用途 |
| --- | --- |
| `src/domain/lessons/types.ts` | 课程类型：`LocalizedText` / `LocalizedList` / `LessonStep` / `LessonComplexity` / `Lesson`；纯类型，无运行时依赖 |
| `src/domain/lessons/schema.ts` | Zod 校验：id 一律小写稳定标识、`contentVersion` 形如 `1.2.3`、`steps` 1–20 且 `stepId` 不得重复、中英列表长度必须一致；`parseLesson` / `validateLesson` / `validateLessonSet` |
| `src/domain/lessons/registry.ts` | `createLessonRegistry`（校验失败即抛）、`byId` / `byAlgorithm` / `has`（查询失败返回 `undefined`，绝不抛）、`validateLessonsAgainstCatalog` |
| `src/domain/lessons/sync.ts` | 纯函数：`lessonStepIdOf`、`resolveStep`、`stepIndexForEvent`、`countStepFrames`、`findFrameForStep`、`countUnlinkedFrames` |
| `src/domain/lessons/bubbleSort.ts` | 冒泡排序课程（`bubble-sort-basics`，`1.0.0`） |
| `src/domain/lessons/factorial.ts` | 阶乘递归课程（`factorial-recursion-basics`，`1.0.0`） |
| `src/features/lab/LessonPanel.tsx` | 教学面板：概览（可折叠）、步骤（帧数徽标 / 当前高亮 / 点击跳转）、当前执行解释、常见错误（可折叠）、无课程空态 |
| `src/domain/lessons/schema.test.ts`、`registry.test.ts`、`sync.test.ts` | 数据层 28 项单测 |
| `src/domain/trace/lessonStep.test.ts` | Trace 兼容与透传 4 项单测 |
| `src/features/lab/LessonPanel.test.tsx` | 面板 12 项单测 |
| `src/app/App.stage3b.lesson.test.tsx` | 应用级联动 7 项单测 |
| `docs/STAGE3B_REPORT.md`、`docs/REFERENCES.md` | 本报告与来源/许可记录 |

### 修改

| 文件 | 改动 |
| --- | --- |
| `src/domain/trace/schema.ts` | 事件新增可选 `lessonStepId`（`min(1).max(64)`）；`schemaVersion` 仍为 1，旧事件完全兼容 |
| `src/domain/trace/types.ts` | `RawTraceFrame` 新增 `lessonStepId?` |
| `src/domain/trace/adapter.ts` | 仅当帧真的带了非空 id 时透传；不根据 `message` 或事件类型推断 |
| `src/runtime/python/pyodide.ts` | `trace(..., lesson_step=None)`；`_emit_call` / `_emit_return` 增加可选 `lesson_step`；`tracked(fn=None, *, call_step=None, return_step=None)`（裸 `@tracked` 仍可用） |
| `src/runtime/python/pyodide.trace.test.ts` | 三条契约断言更新为新签名（并新增「裸 `@tracked` 仍可用」断言） |
| `legacy/algorithm-definitions.js` | 冒泡/阶乘 Python 示例加 `lesson_step`，冒泡新增「完成一轮 / Pass complete」事件，阶乘拆出 `partial` 以产生 `combine` 阶段 |
| `src/domain/algorithms/languageExamples.generated.ts` | 由 `npm run sync:legacy` 重新生成（唯一变化的生成物） |
| `src/features/lab/LabView.tsx` | 在舞台/时间轴之后、调用栈面板之前渲染 `LessonPanel`，课程来自 `lessonRegistry.byAlgorithm(lab.currentAlgo)` |
| `src/i18n/messages.ts` | 新增 15 个 `lesson*` 文案键（中英） |
| `src/styles/app.css` | `.lessonpanel` 系列样式（全部走令牌），移动端取消步骤列表内部滚动 |
| `e2e/lab.spec.ts` | 新增 2 条真实 Pyodide 教学同步用例；旧的阶乘用例改为「按行为推进直到内层帧出现」，不再依赖固定序号 |
| `README.md`、`docs/ARCHITECTURE.md` | 更新版本、能力矩阵、测试计数、§3.6 教学课程层 |
| `package.json`、`package-lock.json` | `0.3.0-phase3` → `0.4.0-phase3b` |

**没有删除任何文件**；`src/test/fixtures/legacy-frames.json` 未改动（JS 侧算法代码一行未动）。

---

## C. Lesson Schema 设计

### 字段结构

```ts
interface Lesson {
  lessonId: string;          // 稳定唯一，例：bubble-sort-basics
  algorithmId: string;       // 关联算法目录，例：bubble
  contentVersion: string;    // 教学内容版本，例：1.0.0（与 app 版本无关）
  title: LocalizedText;      // 中英算法名
  oneLiner: LocalizedText;   // 一句话：解决什么问题
  overview: LocalizedText;   // 适用场景段落
  intuition: LocalizedText;  // 核心思想
  prerequisites: LocalizedList;
  complexity: { time: string; space: string; note: LocalizedText };
  steps: LessonStep[];       // 1–20
  commonMistakes: LocalizedList;
}

interface LessonStep {
  stepId: string;            // 稳定教学阶段键，不随语言变化
  title: LocalizedText;
  explanation: LocalizedText;
  tip?: LocalizedText;
}
```

### 双语策略

`LocalizedText = { zh: string; en: string }`，每个可读字符串**必须两种语言都有**（Zod 强制非空）。`stepId` 是唯一不做本地化的字段——它是教学步骤与 Trace 事件的连接键，所以切换语言绝不会改变"当前高亮哪一步"。

### 步骤 ID

- 冒泡：`init | compare | swap | pass | done`
- 阶乘：`call | check | recurse | combine | return | done`

这些 id 必须与 Python 示例里写下的 `lesson_step=` / `call_step=` / `return_step=` 字面一致。`schema.test.ts` 里有一条测试把两边的集合作双向比较：课程多写一个 id、或少写一个 id，都会失败。

### 版本

`contentVersion` 独立于 `package.json`：改文案/步骤不一定要发版应用，但必须递增内容版本，否则学习者无法判断"我看的是哪一版讲解"。面板右上角直接显示 `v1.0.0`。

### 与 algorithmId 的关系

一门课对应一个算法（`validateLessonSet` 禁止两个课程抢同一个 `algorithmId`），但算法可以没有课程：`byAlgorithm` 返回 `undefined`，面板显示"该算法尚未提供教学课程；可视化与时间轴仍可正常使用"。当前 14 个算法中只有 2 个有课程，其余 12 个走空态。

### 真实课程片段（节选，非伪造）

```json
{
  "lessonId": "bubble-sort-basics",
  "algorithmId": "bubble",
  "contentVersion": "1.0.0",
  "title": { "zh": "冒泡排序：把最大的数冒到末尾", "en": "Bubble sort: bubbling the largest value to the end" },
  "complexity": { "time": "O(n²)", "space": "O(1)", "note": { "zh": "两层循环……", "en": "Two loops……" } },
  "steps": [
    {
      "stepId": "compare",
      "title": { "zh": "② 比较相邻元素", "en": "② Compare adjacent elements" },
      "explanation": { "zh": "内层循环取一对相邻元素 arr[j] 与 arr[j+1]，判断它们是否逆序……", "en": "…" },
      "tip": { "zh": "观察变量面板里的 i 与 j……", "en": "…" }
    }
  ]
}
```

### 未来知识包可扩展性

`createLessonRegistry(unknown[])` 已经接受**任意**课程数组（`registry.test.ts` 用"只含阶乘"的集合验证过），所以将来的 `.algopack` 只需提供同形状的 `Lesson[]`：加载 → 校验 → 注册，UI 无需改动。本阶段**没有实现**包安装、远程仓库或版本解析。

---

## D. Trace 与教学步骤的关联

### `lessonStepId` 如何产生

只有执行时显式记录才会产生，两种来源：

1. 函数体里的 `trace(state, message, line=8, lesson_step='combine')`；
2. `@tracked(call_step='call', return_step='return')` —— 装饰器在**真正进入/返回**时写入 `lessonStepId`。

裸 `@tracked` 仍然可用，此时 call/return 事件不带教学阶段（`fib` 示例就是这种用法，它还没有课程）。

### 如何进入 TraceEvent

Python 帧 dict → `postFrame(json)` → Worker `onmessage` → `RawTraceFrame.lessonStepId` → `adapter.toEvent()` 透传 → `traceEventSchema` 校验 → `TraceEvent.lessonStepId`。

### 如何校验

- 协议层：`z.string().min(1).max(64).optional()`，空字符串直接被判非法（`lessonStep.test.ts` 有断言）。
- 课程层：`resolveStep` / `stepIndexForEvent` 只认当前课程的 `steps`；不在课程里的 id 返回 `null` / `-1`，面板显示"该阶段不在本课程中"并附上 id，**不崩溃、不猜测**。

### 如何反向定位执行帧

`findFrameForStep(events, stepId, fromIndex)`：

1. 从 `fromIndex + 1` 向后找该阶段的下一次出现；
2. 后面没有，则回绕到该阶段的**第一次**出现；
3. 都没有 → `null`，按钮禁用并提示"本次运行没有记录到该阶段"。

没有伪造帧，没有"落在两帧之间"的中间态。`sync.test.ts` 覆盖了重复阶段、回绕、空 Trace、越界/NaN 游标。

### 重复阶段

同一阶段天然出现多帧（`compare` 15 次），因此：

- 高亮是"当前帧属于哪个阶段"，不是"第几个阶段"；
- 步骤按钮显示该阶段在本次运行中的**真实帧数徽标**，点击按上面的确定性规则跳转。

### 旧 Trace 兼容

`schemaVersion` 保持 1，字段可选；`lessonStep.test.ts` 用 Stage-1 形状的事件（无该字段）验证仍通过；`adapter` 对没有 id 的帧不写字段。JS 运行器不产生该字段，所以 JS 演示显示"当前执行帧没有记录教学阶段（JavaScript 演示未记录；切换到 Python 运行可同步）"。

---

## E. 两个课程的真实效果

数据来自真实 Edge + 真实 Pyodide 运行（构建产物，非 mock）。

### 冒泡排序（Python，输入 `[5,2,8,1,6,3]`）

- 总帧数 **30**：`init` 1 / `compare` 15 / `swap` 8 / `pass` 5 / `done` 1。
- 首帧高亮"① 初始化"，末帧高亮"⑤ 排序完成"，末帧变量 `arr = [1,2,3,5,6,8]`。
- 点击"② 比较相邻元素"跳到第 2 帧（第一个 compare），变量面板显示 `i`、`j`、`arr`，Monaco 高亮第 7 行 `if arr[j] > arr[j + 1]:`。
- 再点"下一步"回到 `compare`/`swap` 区间内的真实帧，高亮随之切换；拖到最后一步高亮 `done`。

### 阶乘递归（Python，`factorial(4)`）

- 总帧数 **16**：`call` 4 / `check` 1 / `recurse` 3 / `combine` 3 / `return` 4 / `done` 1。
- 首帧高亮"① 函数调用"，调用栈只有 `f1`；点击"④ 本层计算"跳到第一个 `combine` 帧，调用栈仍在屏上（帧未弹出），变量为该层的 `n`。
- 末帧高亮"⑥ 完成"，变量 `answer = 24`，调用栈清空；回拖到第 0 帧恢复 `call` 阶段与 `f1` 帧。
- 不同递归层共用同一 `stepId`，但 `frameId` 仍各自独立（`f1…f4`），`CallStackPanel` 行为与 Stage 3 一致。

---

## F. 测试结果（实际执行）

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查 | `npm run typecheck` | **0 错误**（exit 0） |
| 单元测试 | `npm test` | **221 / 221 通过，29 个文件**（基线 170 / 23 → 新增 51 项、6 个文件） |
| 构建 | `npm run build` | 成功，22.5 s；`index` 390.24 kB（gzip 125.25），`monaco-setup` 4,122.24 kB（gzip 1,066.60） |
| E2E | `npx playwright test` | **9 / 9 通过**（29.4 s），真实 Edge（`channel:'msedge'`、`--disable-quic`）+ 真实 Pyodide |
| 生成物幂等 | `npm run sync:legacy` 连跑 | 第二次运行无任何文件变化；`legacy-frames.json`、`catalog.generated.ts`、`problems/catalog.generated.ts`、`messages.generated.ts` 均未变 |

新增 51 项单测分布：`lessons/schema` 11、`lessons/registry` 8、`lessons/sync` 9、`trace/lessonStep` 4、`LessonPanel` 12、`App.stage3b.lesson` 7。

稳定性：实现完成后的全量运行中，**7 次确认 `221 / 221` 全绿**（其中 5 次退出码 0），另有 1 次冷启动首跑出现 1 例失败但未捕获用例名（见 H-4）。期间捕获并修复了一例**由本轮新增测试自身引起的竞态**：`does not keep the old teaching highlight after a new run` 在"新 Trace 仍在落地"时就做了同步断言（期望 `done`，实得 `init`）。修复方式是把断言改为等待 React 状态稳定（`waitFor` 进度与高亮），不是放宽断言内容；修复后连续全绿。

是否真实执行 Python：**是**。两条新增 E2E 与既有 2 条递归 E2E 都跑真实 Pyodide（`e2e/lab.spec.ts`，无 mock）。Mock 仅用于 jsdom 组件/应用级测试（`vi.mock('../runtime/execute')`），这些测试证明的是 React 连线，不冒充真实执行。

新增 E2E 用例：

1. `bubble sort: lesson highlight follows the real trace and a step click seeks`
2. `factorial recursion: lesson stages track the real call stack, answer stays 24`

回归基线：原 7 条 E2E 全部保留并通过。其中"Stage 3 — Python factorial recursion"一条的断言由"点一次下一步必然出现 `f2`"改为"反复单步直到 `f2` 出现（最多 6 次），再按实际步数回退"——因为本阶段在 `f1` 与 `f2` 之间插入了一个**真实**的 `recurse` 事件，固定序号断言反映的是旧数据形状而非行为，改动属于对真实数据变化的适配，不是弱化断言。

---

## G. 架构参考与许可证

| 项目 | 许可证 | 使用性质 |
| --- | --- | --- |
| OpenDSA | MIT（仓库内 `MIT-license.txt`；GitHub API 标 `other/NOASSERTION` 系文件名导致） | 仅学习设计思想：教学内容与渲染解耦、课程统一注册、内容独立校验 |
| Algorithm Visualizer | MIT（`LICENSE`，Copyright (c) 2019 Jinseo Jason Park） | 仅学习设计思想：轨迹数据与渲染器分离、目录与实现分层 |
| Python Tutor / VisuAlgo / AlgoMonster | 未复用内容 | 仅观察公开交互设计 |

**没有复用任何代码、教学文本或图片**；两门课程的中英文文案、Python 示例代码均为本项目原创。因此无须附加第三方版权声明。详见 `docs/REFERENCES.md`。

---

## H. 已知问题

1. **只有 2 门课程**（冒泡、阶乘）。其余 12 个算法显示"尚未提供教学课程"空态——这是设计上的合法状态，不是缺陷，但确实意味着教学内容覆盖很窄。
2. **JavaScript 演示没有教学阶段**。JS 运行器不产生 `lessonStepId`，因此界面只给出"切换到 Python 运行可同步"的提示。没有为 JS 补一层"按已知模板回填阶段"的逻辑，那等于按文本猜测，明确禁止。
3. **`fib` 没有课程，也没有阶段标记**：它的 `@tracked` 仍是裸形式，call/return 事件不带阶段。若要开课，必须同步改 Python 与课程数据。
4. **jsdom 环境下的偶发失败仍未彻底定位**：本阶段开始时基线首跑为 `1 failed | 169 passed`（未捕获用例名，随后 4 次全绿）；本阶段实现完成后，全量运行中又有 1 次冷启动首跑出现 1 例失败（同样未捕获到用例名），其余运行全绿。两次都发生在**冷启动后的第一次运行**，与既有"计时类偶发"的描述一致，但尚无证据锁定具体用例。报告不宣称"从未失败"。
5. **Light/Dark/System 未做对比度审计**：面板只用令牌，但三态下的实际对比度、以及在深色下 `lessonstep.active` 的高亮可辨识度，没有量化验证。
6. **移动端未实测**：只做了 CSS 层适配（去掉步骤列表内部滚动、复杂度格栅改单列），没有真机/窄屏 E2E。
7. **包体积增长**：`index` 从 366.24 kB → 390.24 kB（gzip +9.7 kB），主要是两门课程的文案数据。课程变多时需要按需加载。
8. **离线仍未实现**：Pyodide 仍从 CDN 下载；本机 Edge 对 jsdelivr 的 HTTP/3 会中断 wasm 下载，`playwright.config.ts` 里的 `--disable-quic` 只是**测试传输兼容**，不代表产品支持离线。
9. **`@tracked` 的边界**：只追踪被装饰函数本身；被调用但未装饰的函数（如内建函数、普通辅助函数）不会产生帧。参数捕获依赖 `code.co_varnames` 与位置参数个数匹配，`*args/**kwargs` 场景仅按实际传入值记录。
10. **没有做"课程内容热更新/包安装"**，也没有多课程学习进度（进度仍只服务练习题库）。

---

## I. Git 状态

- 分支：`main`（跟踪 `origin/main`）
- 远端：`https://gitee.com/vvvi734/algolens.git`
- 本阶段提交：见下方「提交记录」；未使用 `--amend`、未 force push、未改远端地址
- 工作区：提交后 clean
- README：已更新版本段落、能力矩阵、测试计数与路线图，并新增本报告与 `REFERENCES.md` 链接

提交记录：

- `<待回填>` `feat(phase-3b): teaching course model, lesson-linked traces and lesson panel`

---

## J. 下一阶段准备情况（仅评估，未实现）

### 哪些文件适合直接进 `.algopack`

- `src/domain/lessons/*.ts`（`bubbleSort.ts` / `factorial.ts` 这类**纯数据**）：字段与 UI 无耦合，序列化成 JSON 即可。
- 课程自带的示例代码字符串（Python 源码）与 `stepId` 契约：属于内容资产，应随包分发。
- 建议包结构：`manifest`（包 id/版本/兼容的 `algorithmId` 列表）+ `lessons/*.json` + `examples/*.py`。

### 哪些必须留在 Core

- `schema.ts`（校验规则本身）、`sync.ts`（查找规则）、`registry.ts` 的注册流程：这些是信任边界，不能由包提供，否则等于让包自己决定"什么算合法"。
- 算法执行引擎（Pyodide Worker / JS Worker）、Trace Schema、渲染与时间轴：包只能声明课程，不能注入执行逻辑。
- i18n 架构与主题令牌。

### 包版本与课程版本

建议双版本：`contentVersion`（课程内容，`x.y.z`，用于 UI 展示与缓存键）与 `packVersion`（打包/分发版本）。Trace 兼容性靠 `TRACE_SCHEMA_VERSION`——包声明它依赖的 schema 版本，Core 只加载匹配或更旧的包。

### 如何避免加载不可信代码

- 包只允许**数据**：JSON 课程 + Python 源码字符串；禁止第三方 JS 模块、禁止动态 `eval`、禁止包提供校验器。
- 加载路径：`fetch → JSON.parse → Zod 校验 → 目录交叉校验（algorithmId 存在）→ stepId 唯一 → 注册`，任一失败整包拒绝并给出可读错误。
- Python 源码仍由用户在预览界面确认后才在本机 Pyodide 中运行，行为与现在编辑器的"运行"一致（本地执行、无服务器）。

### 网页与未来 MCP Agent 如何共享课程数据

课程数据是纯 JSON，网页侧由 `createLessonRegistry` 装入，Agent 侧可直接读取同一份 JSON 做检索/讲解，**不需要复制实现**。`stepId` 作为跨端稳定键，Agent 引用"某步"与网页高亮"某步"指向同一概念。

---

## 一句话结论

教学课程已经是独立、可校验的数据层；教学阶段只由真实执行记录，UI 只做确定性的查找与展示；两门课程的 30/16 帧真实运行数据、221 项单测与 9 条真实浏览器 E2E 均已通过。本阶段到此停止，未进入知识包或 AI 插件开发。
