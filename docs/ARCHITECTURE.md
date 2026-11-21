# AlgoViz 架构说明

本文描述 TEXTBOOK-01 之后的实际代码结构。历史阶段报告已移至 `docs/archive/`，不作为当前实现依据。

## 1. 定位与边界

AlgoViz 是浏览器端数据结构与算法学习平台：

- Python 通过 Pyodide 在 Worker 内真实执行，动画帧来自执行时记录的 Trace，不靠前端推测。
- 每个算法只有一条时间轴、一个播放器；画布、变量、调用栈和教学右栏共享同一个 `currentEvent`。
- 理论专题是静态教学页，不挂播放器；动态算法才需要 Trace、输入和可视化。
- C / C++ 只提供只读参考代码；C / C++ 在线执行、判题、AI 导师、MCP、知识包和可编辑 Monaco 工作流均已移除。
- 当前教材目录按严蔚敏、吴伟民《数据结构（C语言版）》12 章组织。

非目标：恢复已移除功能、引入新的状态管理框架、重建教学页面、改写现有 Trace 算法。

## 2. 一次动态算法执行的数据流

```text
官方 / 自定义 / 随机输入
        ↓
guidedInput + 具体输入校验（graph / tree / heap / hash / ...）
        ↓
Pyodide Worker 执行真实 Python
        ↓  trace(...) 事件
Trace Schema v1（Zod 校验、限额、结构快照）
        ↓
adapter：统一事件、旧帧兼容
        ↓
playback：当前帧、播放 / 暂停 / 单步 / 拖动
        ↓
VisualStage + 具体 Visual 组件
        ├─ LearningRail（当前步骤、变量、调用栈）
        ├─ AlgorithmGuide（导学与流程图）
        └─ ReferenceCodePanel（C / C++ / Python 只读代码）
```

`useLabController` 负责算法、输入、执行状态、语言和播放器的接线；`usePlayback` 只负责单一时间轴。Trace 出错返回结构化诊断，页面不崩溃。

## 3. 领域层（`src/domain/`）

### `algorithms/`

- `catalog.generated.ts`：迁移前的算法基础目录，由 `npm run sync:legacy` 生成；运行时通过 `examples.ts` 组合。
- `examples.ts`：唯一算法目录出口，合并生成目录与特殊入口（`kmpExamples.ts`、`sparseTransposeExamples.ts`）。
- `textbook.ts`：12 章目录、专题、算法归属、计划项和旧章 ID 兼容映射。目录是纯数据，不依赖 React。
- `guidedInput.ts` 与各具体 `*Input.ts`：官方、自定义、随机输入的模型与校验。输入 Schema 是执行契约，不属于可清理的旧代码。
- `recursionExamples.ts`、`structureExamples.ts` 等：按结构提供默认输入和 Python 程序。

### `trace/`

- `schema.ts`：Trace Event Schema v1（事件、变量、调用栈、可选 `structure` 快照、限额）。
- `adapter.ts`：旧 `frames` 到统一事件的兼容转换。
- `player.ts`：纯播放状态机。
- 各 `*.test.ts`：真实 Python fixture 的逐帧校验。

### `visualization/`

纯模型与布局：数组、链表、树、图、排序、递归等。React 组件只消费这些模型，不在画布内重新解释 Trace。

### `lessons/`

- `types.ts` + `schema.ts`：课程、步骤和双语文本。
- `registry.ts` + `catalog.ts`：37 门内置课程的注册与查询；不存在外部包安装层。
- 各 `*Lesson*.ts`：课程正文。新增课程应注册一次，避免在多个 UI 文件里重复元数据。

### `concepts/`

- `types.ts`：理论页、双语段落、`ConceptDiagramKind`。
- `catalog.ts`：`BASE_CONCEPT_PAGES + STORAGE_CONCEPT_PAGES`，共 28 页。
- `storageConcepts.ts`：TEXTBOOK-01 新增的静态链表、栈与递归、串的存储结构。
- 理论页不含 Trace、播放器或编辑器。

### `guides/`

- `flowTypes.ts` / `algorithmFlows.ts`：声明式算法流程图数据。
- `buildGuide.ts` / `courseGuides.ts`：从课程和安全回退构造导学。
- `validateFlow.ts`：流程图数据校验；由流程图测试使用，不能因“只有测试引用”删除。

### `reference-code/`

- `registry.ts` + `sources/**`：37 个算法的 C / C++ / Python 参考实现和双语内部注释，只读加载。
- `localization.ts` / `annotations.ts`：注释本地化与来源检查。

## 4. 功能层（`src/features/`）

- `lab/`：实验台 UI。`LabView` 编排；`AlgorithmSidebar` 只读 `textbook.ts`；`LearningRail` 是当前逐帧教学栏；`VisualStage` 选择具体画布；`GuidedInputPanel` 与各结构编辑器负责输入；`ReferenceCodePanel` / `ReadOnlyCodeViewer` 负责只读代码。
- `concepts/`：`ConceptView` 渲染理论页；`ConceptDiagram` 按 kind 分发静态 SVG；`StorageConceptDiagram` 承载 TEXTBOOK-01 的三张新图，避免继续膨胀通用图组件。
- 全局 `components/`：与算法无关的通用 UI。

旧 `LessonPanel`、`ConceptPanel`、`runtime/drafts.ts`、`runtime/url.ts` 已在 TEXTBOOK-01 删除；旧课程 CSS 选择器同步移除。

## 5. 运行时（`src/runtime/`）

- `python/pyodide.ts`：Worker 内加载 Pyodide、执行 Python、把 `trace()` 转成事件。
- `js/`：限时 Web Worker，保留浏览器本地执行能力。
- `monaco/`：按需加载 Monaco，仅用于只读参考代码查看与高亮，不是可编辑执行器。
- `execute.ts`：执行入口与取消 / 隔离。
- `storage.ts`：主题等本地偏好。

运行时不得 import React 组件；React 组件不得直接操作 Worker 或 localStorage。

## 6. 新增课程的统一路径

### 理论专题

1. 在 `domain/concepts/` 增加页面数据（中英文段落、定义、图示说明）。
2. 在 `domain/concepts/catalog.ts` 注册。
3. 如需要新图型，在 `types.ts` 增加 `ConceptDiagramKind`，在 `ConceptDiagram.tsx` 分发，并实现静态图组件。
4. 在 `textbook.ts` 对应章节新增 `concept: true` + `conceptId` 的专题。
5. 补目录、双语和“无播放器”测试。

### 动态算法

1. 在 `domain/algorithms/` 注册算法元数据与官方输入；特殊入口在 `examples.ts` 合并。
2. 提供真实 Python 程序，执行时用 `trace()` 记录帧；不得手写假帧。
3. 在 `domain/trace/schema.ts` 增加或复用 `structure` 类型，并补真实 fixture 测试。
4. 增加输入 Schema、校验和随机生成（如适用）。
5. 实现纯 `visualization` 模型与 React 画布，接入 `VisualStage`；保持单一播放器。
6. 在 `domain/lessons/registry.ts` 注册双语课程；在 `domain/guides/` 接入导学与流程图。
7. 在 `domain/reference-code/sources/` 增加 C / C++ / Python 代码与双语注释，并在 `registry.ts` 注册。
8. 在 `textbook.ts` 对应章节挂载算法 ID；跑目录、Trace、输入和代表性 E2E。

## 7. 教材目录与兼容

- 12 章 ID：`ch1-intro` 到 `ch12-files`；扩展章 `ext` 没有未映射算法时隐藏。
- 旧章 ID 通过 `LEGACY_CHAPTER_ID_MAP` 迁移；旧主题 `recursion-extension` 迁移到 `recursion-examples`。
- 侧栏偏好读取时迁移旧 ID，写回时保存新 ID；算法 ID 和概念 ID 保持不变。
- 计划专题只显示“待完善”，不创建可运行目标；分类由 `concept / planned / extension` 三个布尔语义决定。

## 8. 质量门禁

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e        # 代表性真实 Pyodide / 目录 / 播放器流程
```

- 单测使用 Vitest + Testing Library；真实 Python fixture 校验每个事件。
- E2E 使用 Playwright，默认本机 Microsoft Edge；不要求每次运行全部算法矩阵，但目录、输入、播放器、真实 Pyodide 的代表流程必须通过。
- 颜色只能来自 `styles/tokens.css`；中英文键必须对齐；Trace 限额由 Schema 统一执行。

## 9. 已知的后续整理项

- `features/lab/` 仍有若干较大的画布组件（如 `DAGVisuals.tsx`、`MSTVisuals.tsx`、`VisualStage.tsx`）。它们职责明确，暂不再拆，避免本轮扩大范围。
- 历史截图证据仍保存在 `docs/archive/evidence/`，不参与构建；如未来需要缩小仓库体积，可单独评估移除。
- `catalog.generated.ts` 与 `languageExamples.generated.ts` 仍由迁移脚本生成；新增特殊算法通过 `examples.ts` 合并，暂不强行统一所有注册表。
