# AlgoViz · 数据结构与算法可视化学习平台

**在线体验（GitHub Pages 公开测试部署）：https://vvvi734.github.io/AlgoViz/**

仓库：[GitHub](https://github.com/vvvi734/AlgoViz) · [Gitee](https://gitee.com/vvvi734/algolens)

AlgoViz 是一个浏览器端的数据结构与算法学习平台。Python 通过 Pyodide 在浏览器内真实执行，动画帧来自执行时记录的 Trace；`bubble` 官方课堂入口保留既有的 25 帧 JavaScript 教学预设。画布、变量、调用栈、教学步骤和参考代码共享同一个播放位置。

当前发布候选版本：**v1.0.0**（RELEASE-01）。GitHub Pages 公开测试站点已上线，但正式 Git Tag、Release 与 v1.0.0 正式发布仍需发布确认；公开测试部署不等同于正式发布。版本说明见 [v1.0.0 发布说明](docs/RELEASES/v1.0.0.md)，部署要求与线上地址见 [部署说明](docs/DEPLOYMENT.md)。

- 纯前端运行，不需要服务器或数据库。
- 一个算法只有一条时间轴、一个播放器，不推测执行状态。
- 理论专题是静态教学页，不挂播放器；动态算法才展示 Trace 和输入。
- C / C++ / Python 只提供只读参考代码，带中英文内部教学注释。

仓库版本字段为 `1.0.0`。

## 教材目录

按严蔚敏、吴伟民《数据结构（C语言版）》（清华大学出版社，1997 年 4 月第 1 版）的 12 章知识体系组织章节顺序，通俗讲解与典型应用选材参考程杰《大话数据结构（溢彩加强版）》。不机械照搬目录：二级、三级分组按知识关系组织，理论内容用静态图与文字完整讲解，只有具备独立教学价值的算法才提供动画。教材中的数制转换、行编辑、迷宫等辅助例题不单独建课。

AlgoViz 是独立教学项目，不隶属于上述出版社或作者，也不是两本教材的官方授权电子教材；章节顺序仅作为知识组织参考，教学分组可按知识关系调整。

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

当前共有 **56 个理论专题、60 个动态算法、60 门双语课程**。56 个专题均有中英文正文和静态图或轻量交互图；60 个算法均有输入 Schema、官方 / 自定义 / 随机输入、导学与流程图、三语言参考代码。60 个自定义与随机入口都执行真实 Python Trace；官方入口中 59 个同样使用真实 Python，`bubble` 的官方课堂预设保留既有的 25 帧 JavaScript Trace，自定义与随机输入仍走 Python。12 章教材的核心知识均已落地；教材中的普通应用例题只在相关理论页说明，不单独生成动画，也不记为缺失。

完整的课程完成状态、覆盖边界与目录层级说明见 [教材课程覆盖表](docs/TEXTBOOK_COVERAGE.md)；两本参考教材的章节、印刷页与 PDF 页索引见 [参考书索引](docs/REFERENCE_BOOKS.md)。

## 现有能力

- 左侧 12 章教材目录：章 → 二级专题/课程 → 三级课程折叠，可全部展开 / 收起，当前路径自动高亮；只有含三级叶子的分组显示展开箭头。标题框与全部展开 / 收起按钮固定在目录卡片顶部，仅章节列表滚动；收缩到章节快捷栏时，点击章节会在原位展开整棵章节树并把目录滚到该章，不改变当前课程或页面位置。顶部品牌与主题 / 语言切换栏始终吸顶。
- 官方、自定义、随机输入；输入校验失败不会执行旧 Trace。
- Python 真实执行、逐帧播放 / 暂停 / 回退 / 单步 / 拖动。
- 可视化全屏查看：浏览器 Fullscreen API + 兼容覆盖层；支持 50%–300%（链表与 B+ 树为 75% 起）缩放、图形独立缩放（教学文字保持视觉字号）、适应屏幕、鼠标 / 触控拖动与 Shift + 方向键平移，并与普通课程共用同一个播放器和当前帧。播放器快捷键为 ← / → / ↑ / ↓ / Space，另支持 `+` / `-` / `0` 缩放与 Esc 退出。
- 变量观察、递归调用栈、真实结构快照。
- 算法导学与默认展开的紧凑控制流；节点、连线和段落说明用自然语言书写，不显示伪代码；理论专题另配静态图。
- 中英文切换，算法 ID、概念 ID 保持稳定。
- 旧章 ID 兼容映射，已有侧栏展开偏好不会被目录迁移丢弃。
- 只读 C / C++ / Python 参考代码与双语内部注释。

已移除且不再提供入口：AI 导师、MCP、知识包、题库、C / C++ 在线执行、可编辑 Monaco 工作流。仓库不再包含 `packages/`、`packs/` 或相关脚本。

## 当前已知限制

- `bubble` 的官方课堂入口保留 25 帧 JavaScript Trace；它的自定义与随机输入、以及其余 59 个算法全部走真实 Python/Pyodide。
- 需要支持 WebAssembly、Web Worker 和现代 ES2020 的浏览器；首次加载 Python 运行时依赖 `cdn.jsdelivr.net` 上的 Pyodide，冷启动受网络与缓存影响，界面会显示加载状态。
- Pyodide 只执行课程内置程序，不开放任意 Python / JavaScript 代码执行；C / C++ 代码为只读参考，不提供在线编译。
- 自动无障碍扫描覆盖首页/目录、理论页、输入面板和只读代码面板的代表场景，不等同于完整屏幕阅读器人工验收。复杂 SVG 提供文字摘要、可访问名称和结构说明，但不逐装饰元素朗读。
- B+ 树本轮提供查找、插入与结构演示，删除操作未单独实现；插值查找、斐波那契查找和点双连通分量提取在理论页说明，没有独立播放器。这些是课程边界，不是隐藏入口。
- 生产依赖 `npm audit --omit=dev` 当前为 0；开发/测试工具链（Vitest 3）仍报告上游告警，不进入生产包。

## 源码结构

```text
src/
  app/          应用外壳与视图切换
  components/   与具体算法无关的通用 UI
  domain/
    algorithms/ 算法目录、教材 12 章、输入 Schema 与随机生成
    concepts/   56 个理论专题及静态图类型
    guides/     算法导学与声明式流程图
    lessons/    60 门双语课程的数据与注册表
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

- `npm test`：Vitest 单测、真实 Python fixture 与 jsdom 回归。
- `npm run test:e2e`：Playwright，默认使用本机 Microsoft Edge；覆盖目录、播放器、输入与真实 Pyodide 的代表流程，第 12 章另有索引文件、ISAM 和倒排索引三条真实执行用例。
- `npm run sync:legacy`：从迁移前定义重新生成 `*.generated.ts` 与帧基线。会改写生成文件，运行后必须 review 再提交。
- 不要用 `file://` 直接打开构建产物；Worker 和模块加载需要 `npm run dev` 或 `npm run preview`。
- 生产构建、子路径、缓存、CSP、Pyodide CDN 与静态托管要求见 [部署说明](docs/DEPLOYMENT.md)。GitHub Pages 公开测试部署由 GitHub Actions 在 GitHub `main` 更新后自动构建并发布；仅推送 Gitee 不会触发该工作流。正式 v1.0.0 尚未发布。

## 开源许可与来源

MIT，见 [LICENSE](LICENSE)。教材只参考章节与知识分类，没有复制正文、习题或插图；参考代码、课程文案和静态图均为本项目原创，`src/domain/reference-code/sources/**` 按同一 MIT 许可发布。仓库不包含两本教材的 PDF。第三方设计借鉴、算法核对来源、MPL-2.0 / CC-BY-4.0 依赖归属见 [REFERENCES](docs/REFERENCES.md)。

## English summary

AlgoViz is a browser-first data-structure and algorithm learning platform, prepared as release candidate **v1.0.0**. Python runs in Pyodide and animation frames come from a real execution trace. The textbook directory follows Yan Weimin and Wu Weimin's *Data Structures (C Language Edition)* in 12 chapters; AlgoViz is an independent teaching project and is not an official or authorised electronic edition of that book. The repository currently ships 56 bilingual concept pages, 60 bilingual algorithm courses, inputs and traces, a single player, algorithm guides, and read-only C / C++ / Python reference code. All 60 custom and random entries execute real Python; 59 official entries do the same, while `bubble` keeps its established 25-frame JavaScript classroom preset. AI tutor, MCP, knowledge packs, the question bank, C/C++ execution and the editable Monaco workflow have been removed.

```sh
npm ci && npm run dev
npm run typecheck && npm test && npm run build
npm run test:e2e
```

MIT licensed. See [the textbook coverage table](docs/TEXTBOOK_COVERAGE.md) and [architecture notes](docs/ARCHITECTURE.md).
