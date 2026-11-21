# UX-01 交付报告：顶部可折叠算法导学

日期：2026-11-18  
分支：`feat/ux01-algorithm-guide`（从 T2 文档提交 `639ae33` 创建，不基于旧 `main`）  
版本：`0.16.0-ux01`

## 1. 本批范围

在顶部算法标题栏与动画 / 逐步讲解之间加入可折叠「算法导学」区：

- 展开时展示该算法的问题、核心思想、完整执行步骤、必要前置、复杂度与适用条件、常见错误与记忆重点；页面自然向下滚动。
- 收起后恢复为原有的简洁算法标题栏，只保留一个明确的“展开算法导学”按钮，动画区域重新获得空间。
- 导学开关与该算法绑定：未折叠算法默认展开，已折叠算法在切换离开再回来后保持收起。
- 展开/收起、切换算法、切换语言、切换主题均不 seek、不 stop、不重跑 Trace；播放帧保持不变。
- 未改左侧算法目录、右侧 `LessonPanel`、整页双栏比例、Trace Schema、Python 执行逻辑或算法数量。

## 2. 实现摘要

### 数据层

- 新增 `src/domain/guides/`：
  - `types.ts`：`AlgorithmGuideContent` 只描述展示数据，不包含播放器状态。
  - `algorithmGuides.ts`：Dijkstra、Kahn 拓扑排序、Kosaraju 三份原创双语导学，含静态直觉图标识与显式适用条件。
  - `buildGuide.ts`：按“原创精选 → 注册课程派生 → 目录安全回退 → 空态”解析；课程步骤标题去掉自带圈号；无课程时不生成步骤。
- 未扩展 Lesson Schema，也没有复制教材长文或插图；导学与现有课程共用同一份算法事实。

### 组件与交互

- 新增 `AlgorithmGuide`：原生标题、编号章节、双语内容、静态 SVG 示意图、来源页脚、面板内收起按钮。
- 复用 `LabView` 的 `lab-head` 作为收起态标题栏；`lab-head-actions` 增加带 `aria-expanded` / `aria-controls` 的展开按钮。
- 新增 `useAlgorithmGuidePreferences`：以“已折叠算法 id”数组保存 `localStorage`，未出现的算法自然展开，不需要 effect 重置。
- 新增 `ux01.css`：全部颜色来自 `tokens.css`；1440 两栏、1100 以下逐级单栏、760 以下手机单栏；未引入第二套播放器。

### 内容覆盖

| 来源 | 数量 | 说明 |
| --- | --- | --- |
| 原创精选 | 3 | Dijkstra、Kahn、Kosaraju；各 7～8 步，含限制与记忆重点 |
| 课程派生 | 16 | 其余有 Lesson 的算法；复用 oneLiner / intuition / steps / prerequisites / complexity / commonMistakes |
| 目录安全回退 | 6 | 插入、选择、快速、二分、线性、斐波那契；只显示目录简介与复杂度，不编造步骤 |

## 3. 测试与门禁

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过 |
| `npm run build` | 通过；1433 modules；`index-CEenMHGX.js` 1,270.57 kB / gzip 357.35 kB；`index-pw1hFmk8.css` 125.36 kB / gzip 21.90 kB |
| 全量单测 | 85 个文件 / 691 tests 全部通过（基线 82 / 677） |
| UX-01 专项单测 | 14/14：导学内容 6、组件 5、折叠偏好 3 |
| 全量 E2E | 97/97，真实 Edge + Pyodide；基线 95/95，新增 UX-01 2 条 |
| UX-01 E2E | 2/2：1440 默认展开、键盘折叠/展开、帧号保持、三算法切换、偏好、英文、Dark/System、目录回退；390 单栏、折叠保持帧号、无横向溢出 |
| 既有布局回归 | Stage 7A 与 UI-02 的旧首屏断言先收起导学，再验证原双栏 / 代码坞布局；未放宽原布局阈值 |
| 独立 Python 校验 | T1/T2 的 `verify_bst_python.py`、`verify_avl_python.py` 继续通过；UX-01 不修改 Python/Trace，无新增算法校验范围 |

## 4. 截图

- `docs/ux01/guide-expanded-1440-light.png`：Dijkstra 导学展开，静态示意图、7 步步骤、复杂度/限制与记忆重点。
- `docs/ux01/guide-collapsed-1440-light.png`：同一帧 11/46 收起，仅保留算法标题栏与展开按钮。
- `docs/ux01/guide-expanded-390-light.png`：390 手机端 Kosaraju 展开首屏，单栏可读。

## 5. 已知限制

- 原创完整导学只覆盖 Dijkstra、Kahn、Kosaraju 三个样本；其余课程按现有 Lesson 派生，未单独重写“适用条件/记忆重点”字段。
- 6 个无课程算法只显示目录简介与复杂度，不会出现步骤；这是有意的安全回退，不是内容缺失的占位错误。
- 导学中的 SVG 只是直觉示意，不代表当前输入的真实树/图；真实状态仍由下方唯一播放器驱动。
- 未实现任意用户代码的自动导学生成；本次不进入 UX-02、UX-03、UX-04，也不做堆 / 哈夫曼树 / 页面主布局改造。

## 6. 开发耗时分类（近似）

| 分类 | 占比 | 内容 |
| --- | --- | --- |
| 内容与结构设计 | 30% | 三算法原创文案、课程派生规则、安全回退、导学信息架构 |
| 组件与样式实现 | 30% | 折叠状态、偏好持久化、双语与主题、桌面/手机布局、静态图 |
| 测试与回归 | 28% | 14 项专项单测、2 条真实浏览器 E2E、旧布局断言隔离、全量门禁 |
| 截图、文档与 Git | 12% | 3 张证据图、README / COVERAGE / 本报告、分支与推送 |

## 7. Git

- 分支：`feat/ux01-algorithm-guide`
- 基线：T2 文档提交 `639ae33`（未使用落后 `main`）
- 提交哈希：见本批次最终提交与交付消息；`main` 未被修改。
