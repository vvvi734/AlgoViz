# AlgoViz · 数据结构与算法可视化学习平台

AlgoViz 是一个浏览器端的数据结构与算法学习平台。Python 通过 Pyodide 在浏览器内真实执行，动画的每一帧都来自执行时记录的 Trace；画布、变量、调用栈、教学步骤和参考代码共享同一个播放位置。

- 纯前端运行，不需要服务器或数据库。
- 一个算法只有一条时间轴、一个播放器，不推测执行状态。
- 理论专题是静态教学页，不挂播放器；动态算法才展示 Trace 和输入。
- C / C++ / Python 只提供只读参考代码，带中英文内部教学注释。

当前仓库版本：`0.27.3-uixg01a`。

## 教材目录

按严蔚敏、吴伟民《数据结构（C语言版）》（清华大学出版社，1997 年 4 月第 1 版）的 12 章知识体系组织章节顺序，通俗讲解与典型应用选材参考程杰《大话数据结构（溢彩加强版）》。不机械照搬目录：二级、三级分组按知识关系组织，理论内容用静态图与文字完整讲解，只有具备独立教学价值的算法才提供动画。教材中的数制转换、行编辑、迷宫等辅助例题不单独建课。

1. 绪论
2. 线性表
3. 栈和队列
4. 串
5. 数组和广义表
6. 树和二叉树
7. 图
8. 动态存储管理
9. 查找
10. 内部排序
11. 外部排序
12. 文件

当前共有 **32 个理论专题、45 个动态算法、45 门双语课程**。32 个专题均有中英文正文和静态图或轻量交互图；45 个算法均有真实 Python Trace、输入 Schema、官方 / 自定义 / 随机输入、导学与流程图、三语言参考代码。第 8、11、12 章以及部分暂未实现的小节保留为“待完善”目录项，不生成假动画。

完整的已完成 / 待开发清单与目录层级说明见 [教材课程覆盖表](docs/TEXTBOOK_COVERAGE.md)；两本参考教材的章节、印刷页与 PDF 页索引见 [参考书索引](docs/REFERENCE_BOOKS.md)。

## 现有能力

- 左侧 12 章教材目录：章 → 二级专题/课程 → 三级课程折叠，可全部展开 / 收起，当前路径自动高亮；只有含三级叶子的分组显示展开箭头。标题框与全部展开 / 收起按钮固定在目录卡片顶部，仅章节列表滚动；收缩到章节快捷栏时，点击章节会在原位展开整棵章节树并把目录滚到该章，不改变当前课程或页面位置。顶部品牌与主题 / 语言切换栏始终吸顶。
- 官方、自定义、随机输入；输入校验失败不会执行旧 Trace。
- Python 真实执行、逐帧播放 / 暂停 / 回退 / 单步 / 拖动。
- 变量观察、递归调用栈、真实结构快照。
- 算法导学与默认展开的紧凑控制流；节点、连线和段落说明用自然语言书写，不显示伪代码；理论专题另配静态图。
- 中英文切换，算法 ID、概念 ID 保持稳定。
- 旧章 ID 兼容映射，已有侧栏展开偏好不会被目录迁移丢弃。
- 只读 C / C++ / Python 参考代码与双语内部注释。

已移除且不再提供入口：AI 导师、MCP、知识包、题库、C / C++ 在线执行、可编辑 Monaco 工作流。仓库不再包含 `packages/`、`packs/` 或相关脚本。

## 源码结构

```text
src/
  app/          应用外壳与视图切换
  components/   与具体算法无关的通用 UI
  domain/
    algorithms/ 算法目录、教材 12 章、输入 Schema 与随机生成
    concepts/   32 个理论专题及静态图类型
    guides/     算法导学与声明式流程图
    lessons/    45 门双语课程的数据与注册表
    reference-code/  C / C++ / Python 参考代码与注释
    trace/      Trace Schema、适配器、播放器
    visualization/ 纯视觉模型与布局
  features/
    concepts/   理论专题页与静态 SVG
    lab/        实验台、目录、时间轴、输入、画布、导学、参考代码
  i18n/         中英词典
  runtime/      Pyodide / JS Worker / Monaco 只读加载 / 存储
  styles/       设计令牌与页面样式
  theme/        三态主题
  test/         测试初始化与真实帧 fixture
e2e/            Playwright 真实浏览器测试
docs/           当前架构、参考来源、课程覆盖表与历史归档
legacy/         迁移前定义，仅构建脚本使用，运行时不 import
scripts/        生成与验证脚本
```

数据流与模块边界见 [架构说明](docs/ARCHITECTURE.md)。

## 新增课程

### 理论专题

1. 在 `src/domain/concepts/` 增加中英文页面数据。
2. 在 `src/domain/concepts/catalog.ts` 注册。
3. 如需新图型，在 `types.ts` 增加 `ConceptDiagramKind`，并在 `ConceptDiagram.tsx` 分发静态图。
4. 在 `src/domain/algorithms/textbook.ts` 对应章节增加 `concept: true` 和 `conceptId`。
5. 补目录、双语、无播放器测试。

### 动态算法

1. 在 `src/domain/algorithms/` 注册元数据与官方输入；特殊入口通过 `examples.ts` 合并。
2. 编写真实 Python 教学程序，用 `trace()` 记录帧；禁止手写假帧。
3. 在 `src/domain/trace/schema.ts` 增加或复用结构快照类型，并补真实 fixture 测试。
4. 增加输入校验与随机生成（如适用），接入 `GuidedInputPanel`。
5. 在 `src/domain/visualization/` 与 `src/features/lab/` 实现纯模型和画布，接入 `VisualStage`。
6. 在 `src/domain/lessons/registry.ts` 注册双语课程，并在 `guides/` 接入导学与流程图。
7. 在 `src/domain/reference-code/sources/` 增加三语言代码和双语注释。
8. 在 `textbook.ts` 对应章节挂载算法 ID，并跑目录、Trace、输入和代表性 E2E。

## 本地开发

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
npm run test:e2e
```

- `npm test`：Vitest 单测、真实 Python fixture 与 jsdom 回归；TEXTBOOK-06 当前为 **1109 项通过**。
- `npm run test:e2e`：Playwright，默认使用本机 Microsoft Edge；全量 176 条，本阶段运行目录、播放器、输入与真实 Pyodide 的代表流程。
- `npm run sync:legacy`：从迁移前定义重新生成 `*.generated.ts` 与帧基线。会改写生成文件，运行后必须 review 再提交。
- 不要用 `file://` 直接打开构建产物；Worker 和模块加载需要 `npm run dev` 或 `npm run preview`。

## 开源许可与来源

MIT，见 [LICENSE](LICENSE)。教材只参考章节与知识分类，没有复制正文、习题或插图；参考代码、课程文案和静态图均为本项目原创。第三方设计借鉴、算法核对来源和依赖许可证见 [REFERENCES](docs/REFERENCES.md)。

## English summary

AlgoViz is a browser-first data-structure and algorithm learning platform. Python runs in Pyodide and every animation frame comes from a real execution trace. The textbook directory follows Yan Weimin and Wu Weimin's *Data Structures (C Language Edition)* in 12 chapters. The repository currently ships 32 bilingual concept pages, 45 bilingual algorithm courses, real inputs and traces, a single player, algorithm guides, and read-only C / C++ / Python reference code. AI tutor, MCP, knowledge packs, the question bank, C/C++ execution and the editable Monaco workflow have been removed.

```sh
npm ci && npm run dev
npm run typecheck && npm test && npm run build
npm run test:e2e
```

MIT licensed. See [the textbook coverage table](docs/TEXTBOOK_COVERAGE.md) and [architecture notes](docs/ARCHITECTURE.md).
