# UX-03 · 教材式算法目录

版本：`0.18.0-ux03`（未发布）
日期：2026-11-18
基线：`6de3ecf`（UX-02，`feat(ux02): compress teaching course into frame-synced rail`）
分支：`feat/ux03-textbook-nav`（`main` 保持 `1dcdf76` 不变）
参考：程杰《大话数据结构》，清华大学出版社，2011 年 6 月第 1 版

## 1. 改动

- **域层**：新增 `src/domain/algorithms/textbook.ts`，以数据表固化九章、专题与算法归属；`buildTextbookNavigation` 与实时注册表组合，`findTextbookPath` / `textbookPathFor` 负责当前路径，`textbookAlgorithmIds` 校验 25 个入口唯一归属。只借用教材章节组织，不复制正文、插图或习题。
- **桌面侧栏**：`AlgorithmSidebar.tsx` 改为 `章 → 专题 → 算法` 三级目录；章与专题可同时展开多个，当前算法所在路径自动打开并只标记一次；未实现知识点显示“待完善”，扩展算法显示“扩展”徽标，且不提供点击目标。
- **折叠 rail**：侧栏收起后显示 `01–09` 章号入口、当前章高亮与当前算法图标，可重新展开。
- **偏好**：`useSidebarPreferences.ts` 使用 `{ collapsed, openChapters, openTopics }`，键仍为 `algolens-sidebar`；保留旧 `collapsed`，首次恢复时自动打开当前路径且只执行一次。旧 `closedGroups` 不做猜测映射（旧 `ds` 组跨第 3/4 章，无法一对一还原）。
- **移动端**：`LabView.tsx` 在 390 宽继续隐藏侧栏，改用 `mobile-algo-select`；选项按章生成 `optgroup`，默认 9 组。
- **样式**：新增 `src/styles/ux03nav.css`，实现 `0fr → 1fr` 折叠动画、focus-visible、rail 与 390 隐藏；折叠态子树同时设 `visibility: hidden`，使键盘、命中测试与自动化可见性一致。
- **国际化**：`src/i18n/messages.ts` 新增目录、章号、待完善、扩展、参考版本的中英键。
- **不变量**：25 个算法、19 门课程、Trace Schema、播放器、顶部导学和右侧逐帧讲解均未改写；没有第二套时间轴或步骤计数器。

## 2. 目录结构

| 章 | 专题（已接入算法 / 待完善知识点） |
| --- | --- |
| 1 数据结构绪论 | 基本概念、逻辑与物理结构、抽象数据类型（均待完善） |
| 2 算法 | 定义与特性、效率度量（待完善）；递归算法：阶乘、斐波那契（扩展） |
| 3 线性表 | 定义与 ADT、顺序存储、静态链表、循环链表、双向链表（待完善）；单链表 |
| 4 栈与队列 | 栈、队列；栈的应用——递归、循环队列（待完善） |
| 5 串 | 定义/比较/ADT、存储结构、朴素匹配、KMP（均待完善） |
| 6 树 | 定义与存储、二叉树性质与存储、线索二叉树、森林转换、赫夫曼树（待完善）；遍历二叉树 |
| 7 图 | 基本概念、存储结构（待完善）；遍历：BFS/DFS；最小生成树：Prim/Kruskal；最短路径：Dijkstra/Floyd-Warshall/Bellman-Ford（扩展）；拓扑排序；关键路径；连通性：连通分量/SCC（扩展专题） |
| 8 查找 | 顺序表查找、有序表查找、BST、AVL；线性索引、多路查找树、散列表（待完善） |
| 9 排序 | 冒泡、简单选择、直接插入、快速排序；基本概念、希尔、堆、归并（待完善） |
| 扩展 | AI 自定义算法；运行时未映射算法归入“其他算法”，不会从目录消失 |

合计 9 个教材章 + 扩展章、49 个教材专题（30 个待完善专题）、25 个算法入口。图章 11 个算法，查找章 4 个，排序章 5 个。

## 3. 测试与门禁

- `npm run typecheck`：通过。
- 全量单测：**87 个文件 / 718 项通过**（UX-02 基线 86 / 706）；新增 `textbook.test.ts` 9 项、目录组件 7 项、偏好 5 项、App 级 3 项。
- 专项 E2E：`e2e/ux03.spec.ts` **5/5**，覆盖九章顺序与唯一归属、扩展徽标、rail 与英文、390 分组、真实截图。
- 全量 E2E：**107/107 通过**（Playwright + 本机 Edge，`PLAYWRIGHT_PORT=4174`，7.0 分钟）；修复折叠可见性、专题展开与多路径断言后完整复跑。
- 构建：**通过**，1436 modules；`index` JS 1,331.95 kB / gzip 375.63 kB，CSS 139.21 kB / gzip 23.98 kB。
- 真实浏览器截图由测试直接写出，未使用设计稿或合成图。

## 4. 截图

`docs/ux03/nav/`

1. `current-path-1440-light.png` — 默认第 9 章当前路径，章/专题/算法三级与唯一高亮。
2. `multi-chapter-1440-light.png` — 1440×1200，九章全见，第 7、8 章同时展开。
3. `collapsed-rail-1440-dark.png` — Dark 折叠 rail，01–09、当前章与当前算法。
4. `mobile-390-light.png` — 390 宽按章分组选择器，无页面横向溢出。

`docs/ux03/evidence/`

5. `graph-dijkstra-frame-1440-light.png` — Dijkstra 帧 28/46，图 → 最短路径 → Dijkstra；左侧距离 6→4、前驱 C→E。
6. `multi-chapter-1440-light.png` — 1440×1200 多章展开，07/08 与 Dijkstra 路径同时可见。
7. `search-chapter-1440-light.png` — 第 8 章完整展开，BST 与 AVL 算法行可见。
8. `graph-path-1440-dark-en.png` — 英文 Dark，第 7 章路径与 Bellman-Ford 扩展徽标。
9. `rail-dijkstra-1440-dark-en.png` — 英文 Dark 折叠 rail，07 当前章与当前算法。
10. `mobile-390-graph-entry-light.png` — 390 宽选择 Dijkstra 后标题与首屏，无横向溢出。

## 5. Git

- 分支：`feat/ux03-textbook-nav`，基线 `6de3ecf`。
- 提交信息：`feat(ux03): rebuild algorithm directory as textbook chapters`。
- 推送：`origin feat/ux03-textbook-nav`；不合并、不修改 `main`。
- 全量 E2E 重写的大量既有 `docs/**` 截图已还原，提交只含 UX-03 代码、测试、报告与目录证据；`docs/merge01/expanded-dijkstra-1440-light.png` 不属于本任务证据，未纳入提交。

## 6. 未覆盖的教材知识点

以下仅作为目录占位，没有算法页、Trace 或课程：

- **第 1 章**：数据结构基本概念；逻辑结构与物理结构；抽象数据类型。
- **第 2 章**：算法定义与特性；算法效率度量。
- **第 3 章**：线性表定义与 ADT；顺序存储；静态链表；循环链表；双向链表。
- **第 4 章**：栈的应用——递归；循环队列。
- **第 5 章**：串的定义、比较与 ADT；串的存储结构；朴素模式匹配；KMP。
- **第 6 章**：树定义与存储；二叉树性质与存储；线索二叉树；树/森林/二叉树转换；赫夫曼树及应用。
- **第 7 章**：图的基本概念；图的存储结构。
- **第 8 章**：线性索引查找；多路查找树；散列表查找。
- **第 9 章**：排序基本概念与分类；希尔排序；堆排序；归并排序。

兼容边界：旧 `closedGroups` 不迁移；扩展算法只在存在 `custom` 或未映射算法时出现；目录不承诺教材全部知识点可交互，也不复制教材内容。
