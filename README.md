# AlgoViz · Python 为主的数据结构与算法可视化学习平台

[English](#english) | [中文](#中文)

面向学生的浏览器端数据结构与算法学习平台：**Python 在浏览器内运行**，根据真实执行结果生成逐帧动画，并同步展示代码位置、变量值与步骤讲解。完全本地运行，无需租服务器。

> **当前版本：v0.18.0 UX-03。** 用户可见品牌为 **AlgoViz**，旧 localStorage / IndexedDB / `.algopack` / `.algosession.json` / `.algocontext.json` / MCP Tool / AI Gateway 标识保持兼容。G1 补齐 **Floyd-Warshall 全源最短路** 与 **Bellman-Ford 单源最短路**；G2 补齐 **Prim** 与 **Kruskal 最小生成树**；G3 补齐 **Kahn 拓扑排序** 与 **AOE 关键路径**；G4 补齐 **无向图连通分量** 与 **Kosaraju 强连通分量**；T1 补齐 **二叉搜索树（BST）查找 / 插入 / 删除**；T2 补齐 **AVL 平衡二叉搜索树插入 / 删除 / 失衡检测 / 四种旋转**：真实 Python `AvlNode`、真实 `left/right` 指针变化、稳定 `a1…` ID、节点高度与平衡因子逐帧记录，LL/RR/LR/RL 单旋与双旋都由真实连续操作驱动。UX-01B 将顶部 **算法导学** 收敛为三层阅读顺序：一句话理解与核心思想 → 3～5 个主要阶段 → 记忆重点；详细步骤、前置、复杂度解释、条件限制与常见错误默认收起，展开后完整保留；静态示意图只保留建立直觉的作用。展开/收起仍不影响 Trace 与播放位置。UX-02 将右侧 **Teaching Course** 收敛为四项逐帧讲解：当前做什么、为什么这样做、这一步产生的真实变化、可选记忆重点；课程简介、完整步骤、复杂度、前置知识与常见错误进入折叠的资料区，步骤跳转保留在折叠的步骤导航中，仍复用唯一 `currentEvent.lessonStepId` 与播放器。UX-03 按程杰《大话数据结构》（清华大学出版社，2011 年 6 月第 1 版）的九章顺序，把左侧目录重构为 **章 → 专题 → 算法** 的可折叠教材目录，25 个算法入口全部唯一归属，保留 19 门课程、真实 Trace 与唯一播放器；旧 `collapsed` 偏好继续兼容。当前门禁：**718 项单测 / 107 条真实浏览器 E2E / UX-03 10 张目录与证据截图**；真实 Ollama / 云端模型仍未实测。
> 定位已收敛：**Python 为主要教学语言**，JavaScript 作为前端实现语言继续支持 25 个算法入口（Dijkstra / Floyd-Warshall / Bellman-Ford / Prim / Kruskal / 拓扑排序 / 关键路径 / 连通分量 / 强连通分量 / BST / AVL 的 JS 入口只提示使用 Python）；**C / C++ 与在线判题已从规划中取消**。详见 [阶段一总结](docs/STAGE1_REPORT.md)、[阶段二总结](docs/STAGE2_REPORT.md)、[阶段三总结](docs/STAGE3_REPORT.md)、[阶段 3B 总结](docs/STAGE3B_REPORT.md)、[阶段四总结](docs/STAGE4_REPORT.md)、[阶段 5A 总结](docs/STAGE5A_REPORT.md)、[阶段 6A 总结](docs/STAGE6A_REPORT.md)、[阶段 7A 总结](docs/STAGE7A_REPORT.md)、[阶段 7B 总结](docs/STAGE7B_REPORT.md)、[阶段 7C 总结](docs/STAGE7C_REPORT.md)、[阶段 7D 总结](docs/STAGE7D_REPORT.md)、[阶段 7E 总结](docs/STAGE7E_REPORT.md) 与 [阶段 7F 总结](docs/STAGE7F_REPORT.md)；课程与算法覆盖见 [COVERAGE](docs/COVERAGE.md)；品牌边界见 [BRAND_MIGRATION](docs/BRAND_MIGRATION.md)；知识包格式与作者指引见 [PACK_FORMAT_V1](docs/PACK_FORMAT_V1.md)、[PACK_AUTHOR_GUIDE](docs/PACK_AUTHOR_GUIDE.md)；MCP 安装与宿主配置见 [MCP_INSTALL](docs/MCP_INSTALL.md)；AI Gateway 安装与安全边界见 [AI_GATEWAY](docs/AI_GATEWAY.md)；T1/T2 交付细节见 [T1_REPORT](docs/T1_REPORT.md)、[T2_REPORT](docs/T2_REPORT.md)；UX-01B 交付细节见 [UX01B_REPORT](docs/UX01B_REPORT.md)、UX-02 交付细节见 [UX02_REPORT](docs/UX02_REPORT.md)。

---

## 中文

### 真实状态矩阵

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| React + TypeScript + Vite 工程结构 | ✅ 已实现 | 严格类型检查、模块边界清晰 |
| Light / Dark / System 三态主题 | ✅ 已实现 | 跟随系统实时响应；首屏无闪屏；偏好持久化 |
| 25 个算法逐帧动画 | ✅ 已实现 | 12 个原有（冒泡/插入/选择/快排、二分/线性查找、栈/队列/链表、BFS/DFS、树中序）+ 阶乘 / 斐波那契递归 + Dijkstra + Floyd-Warshall + Bellman-Ford + Prim + Kruskal + 拓扑排序 + 关键路径 + 连通分量 + 强连通分量 + BST 查找/插入/删除 + AVL 插入/删除/四种旋转 |
| 播放 / 暂停 / 回退 / 单步 / 拖动 / 速度 | ✅ 已实现 | 纯函数状态机 + 逐帧回归；新 Trace 加载即回到第 0 帧并停止播放，索引恒在合法范围内 |
| JavaScript 本地执行 | ✅ 已实现 | 3 秒限时 Web Worker，可离线 |
| Python 执行（Pyodide） | ✅ 已实现 | Worker 内运行；`trace()` 支持真实变量快照、源码行号与可选的 stack/queue/linked-list/binary-tree/bst/avl/graph/weighted-graph 结构语义 |
| 统一 Trace Event Schema v1 | ✅ 已实现 | Zod 运行时校验：`schemaVersion/step/eventType/visualType/state/message/sourceLocation/variables/callStack/lessonStepId` + Stage 7B/7C/7D/7E/7F 与 G1/G2/G3/G4/T1/T2 可选 `structure`（stack / queue / linked-list / binary-tree / bst / avl / graph / weighted-graph / floyd-matrix / bellman-table / prim-mst / kruskal-mst / topological-sort / critical-path / connected-components / kosaraju）+ 事件/帧/变量限额；旧 Trace 无 `structure` 时继续走 legacy 视图 |
| 教学课程数据层 | ✅ 已实现 | `domain/lessons/`：Lesson 类型 + Zod 校验 + 注册表 + 纯同步函数；与 React / Worker 完全解耦，可校验、可查询 |
| 教学面板（LessonPanel） | ✅ UX-02 | 默认只显示当前操作标题、阶段/帧号、操作原因、真实状态变化与可选记忆重点；课程资料、完整步骤、复杂度、前置、常见错误与原始变量进入折叠区；无结构化 Trace 时明确说明没有记录变化，不推测 |
| 教学步骤 ⇄ 时间轴双向联动 | ✅ 已实现 | 同一 `currentEvent`：时间轴驱动高亮，点击步骤跳到真实执行帧（向后找 → 回绕首帧 → 不可用则禁用） |
| 算法课程内容 | ✅ 19 / 25 内置 | 内置冒泡排序、阶乘、栈、队列、单链表、二叉树遍历、BFS、DFS、Dijkstra、Floyd-Warshall、Bellman-Ford、Prim、Kruskal、拓扑排序、AOE 关键路径、连通分量、Kosaraju 强连通分量、BST、AVL 十九门完整双语课程；其余算法显示"尚未提供教学课程"空态，可由知识包补充 |
| 顶部算法导学 | ✅ UX-01B | 位于标题栏与动画之间，可展开/收起且不重置 Trace；每算法保存折叠偏好；默认只显示一句话理解 + 核心思想、3～5 个主要阶段与记忆重点；详细步骤、前置、复杂度、条件与错误默认收起。Dijkstra / Kahn / Kosaraju 使用各自算法的阶段结构；其余复用课程，无课程算法只显示目录简介与复杂度，不编造步骤 |
| 右侧逐帧讲解 | ✅ UX-02 | 与当前帧同步的四段式紧凑 rail：当前做什么、为什么这样做、真实状态变化、可选记忆重点；状态变化优先读取 Dijkstra / Kahn / Kosaraju / BST / AVL 的强类型 `structure`，其余结构按相邻帧 `state` 给出真实差异或明确无结构化变化；旧课程资料与步骤跳转折叠保留，不新增播放器或步骤计数器 |
| 教材式算法目录 | ✅ UX-03 | 桌面侧栏按《大话数据结构》九章顺序提供 `章 → 专题 → 算法` 三级折叠；可同时展开多章/多专题，当前路径自动打开且唯一高亮；未实现知识点显示“待完善”，扩展算法带徽标；折叠后保留 `01–09` rail 与当前章/算法入口；390 宽改用按章 `optgroup` 的原生选择器，不引入第二套播放器 |
| 可安装知识包（`.algopack`） | ✅ 已实现 | ZIP 容器 + manifest v1 + 有界解压 + 路径白名单；导入 → 预览 → 确认 → 本地安装 |
| 知识包安全校验 | ✅ 已实现 | 6 MiB / 64 条目 / 512 KiB 单文件 / 3 MiB 总量 / 200:1 压缩比；拒绝路径穿越、绝对路径、重复名、加密条目、ZIP64、非文本 |
| 知识包本地持久化 | ✅ 已实现 | IndexedDB `algolens-packs` 三 store 单事务安装/替换/卸载；刷新恢复；配额失败有明确错误 |
| 知识包管理界面 | ✅ 已实现 | 「知识包」页：已装列表、导入、预览确认、版本替换提示、卸载确认、空态与错误态，中英双语 + 三态主题 |
| 课程注册表组合 | ✅ 已实现 | `createLessonCatalog`：内置优先，包课程同 Schema 校验，非法包内容跳过而非崩溃；卸载即失效 |
| 官方示例知识包 | ✅ 已实现 | `packs/algolens-search-basics.algopack`（5 条目 / 6144 B）：`binary` 二分查找 5 步双语课程 + 真实 Pyodide 示例 |
| 学习会话格式（`.algosession.json`） | ✅ 已实现 | `domain/sessions`：严格 Zod、`sessionFormatVersion=1`、96 KiB / 40k 源码字符 / 8 KiB 输入；`lessonOrigin` 记录课程来源 |
| 学习上下文格式（`.algocontext.json`） | ✅ 已实现 | 真实帧 + 变量 + 调用栈 + 教学阶段；128 KiB；源码仅在用户勾选时写入；导出不重跑 |
| Agent 学习会话导入 | ✅ 已实现 | 网页「学习会话」面板：选文件 → 预览（课程/阶段/是否含源码）→ 确认应用；不自动运行、不覆盖草稿前需确认 |
| 学习上下文导出 | ✅ 已实现 | 一键下载当前帧，含源码为显式勾选；不重新执行、不上传网络 |
| 本地 MCP Server（stdio） | ✅ 已实现 | `packages/mcp-server`，官方 SDK 1.32.2；`npm run mcp:build` / `mcp:start` / `mcp:smoke`；stdout 仅协议 |
| MCP 工具：课程 / 知识包 / 会话 / 上下文 | ✅ 已实现 | 6 个工具：`list_lessons`、`get_lesson`、`get_lesson_step`、`list_available_packs`、`create_learning_session`、`inspect_learning_context` |
| MCP 启发式教学 Prompt | ✅ 已实现 | `teach_algorithm` LEVEL 1–5；课程文本按不可信数据包裹；不调用任何模型 API、无 Key |
| MCP 本地安全边界 | ✅ 已实现 | 三个目录必须显式配置（flag/env，绝对路径）；裸文件名 + realpath 容器 + 拒符号链接 + 大小预检 + 独占写不覆盖 |
| 真实宿主接入 | ⚠️ 部分 | 协议层已用官方 Client + stdio 子进程 + Inspector CLI 实测；Claude Code / Cursor / VS Code **仅有配置模板，未实测** |
| Python 递归调用栈 | ✅ 已实现 | `@tracked` 装饰器捕获真实调用/返回事件、唯一 frameId、逐层局部变量与返回值 |
| 调用栈面板 | ✅ 已实现 | 栈式展示调用帧、高亮活跃帧、点击帧切换变量作用域、时间轴回退恢复历史栈 |
| 同步观察面板 | ✅ 已实现 | 变量观察器 + 步骤讲解随 `currentEvent` 联动；整份只读源码改为按需「已执行源码快照」，Monaco 是唯一主代码区 |
| Python 冒泡排序端到端演示 | ✅ 已实现 | 真实 `i/j/arr/n` 变量、源码行号、比较/交换高亮 |
| 栈专属教学可视化 | ✅ Stage 7B | 顶部开放、底部封闭的竖直桶；Push 从顶部进入、Pop 从顶部离开、Peek 高亮栈顶；空栈、7 帧真实 Python、DOM 顶到底顺序可测 |
| 队列专属教学可视化 | ✅ Stage 7B | 左 FRONT / 右 REAR 的横向排队；Enqueue 从右进入、Dequeue 从左离开；出队后剩余元素补位；空队列、7 帧真实 Python、DOM 前到后顺序可测 |
| 单链表专属教学可视化 | ✅ Stage 7C | 真实 Python `Node` + `next` 引用；数据格/next 格、SVG 有向箭头、HEAD 向下箭头、尾部 NULL、临时/断开节点托盘、指针变化徽章；中间插入三阶段、删除重连、遍历与回退均有真实帧；`node_id` 区分同值节点 |
| 二叉树专属教学可视化 | ✅ Stage 7D | 真实 Python `TreeNode` + `left/right` 引用；根在顶部、左孩子在左下、右孩子在右下的层级画布，SVG 父子边与箭头；前序/中序/后序共用 `inorder` 算法条目和同一棵树，通过模式选择器切换后由明确 Run 生成新 Trace；当前节点、已访问序号、递归路径、调用栈、源码行与 9 步双语课程同步；`node_id` 区分同值节点 |
| 图 BFS / DFS 专属可视化 | ✅ Stage 7E | 同一张真实无向图（7 节点/7 边，含环）由真实 Python `deque` / list 栈驱动；节点/边稳定 ID、确定性布局、当前节点环、当前检查边、discovered/visited/visitOrder、BFS 队列与 DFS 显式栈全部来自同一条 `currentEvent`；回退与任意跳帧同时恢复图、Frontier、变量和步骤；9 步双语课程 |
| Floyd-Warshall / Bellman-Ford | ✅ G1 | Floyd 用真实 Python 三重循环记录 k/i/j、距离矩阵、`previous`、更新/跳过与负环；Bellman-Ford 用真实轮次记录检查边、松弛、提前结束与负环，并明确复用带权图但**不继承 Dijkstra 的非负权限制**；两门课程覆盖全源与单源的区别 |
| Prim / Kruskal 最小生成树 | ✅ G2 | Prim 用真实 `heapq` 维护横切边，逐帧展示树扩张、候选边、堆、选中/跳过与总权重；Kruskal 用真实并查集（路径压缩 + 按秩合并）逐帧展示边权排序、当前边、两端根、环检测、接受/拒绝、union 与 parent/rank 表；默认图两算法选出不同合法 MST、总权重同为 6；负权允许，有向图/自环/重复边拒绝，非连通图明确显示最小生成森林而非一棵生成树 |
| 拓扑排序 / AOE 关键路径 | ✅ G3 | Kahn 用真实 `collections.deque` 与入度表逐帧展示候选队列、出队序列、看边/减一、重新入队与环检测；AOE 按拓扑序前推 `ve`、逆拓扑后推 `vl`、逐活动求 `e/l/slack`，并枚举全部关键路径；默认拓扑图 32 帧，默认 AOE 图 22 帧、工期 11、两条关键路径；有向环拒绝，AOE 负持续时间拒绝 |
| 连通分量 / Kosaraju 强连通分量 | ✅ G4 | 连通分量用真实迭代 DFS + 显式栈，从每个未发现节点启动，逐帧展示 pop/visit/看边/discover/push/skip 与当前 C 编号；默认 8 节点 5 边、50 帧，得到 4 个分量（含孤立点 H）。SCC 用真实 Kosaraju 双遍 DFS：第一遍记录完成顺序，`reverse` 帧反转全部边，第二遍按完成顺序逆序在反向图分配 SCC；默认 8 节点 7 边、60 帧，得到 5 个 SCC。节点与结果行同时显示 C1/C2 编号，不只依赖颜色 |
| BST 查找 / 插入 / 删除 | ✅ T1 | 真实 Python `TreeNode` 与 `left/right` 引用；稳定 `b1…b8` ID 在删除/移植/回退后不重命名。查找逐帧比较并记录路径；插入找到空位后真实创建节点并修改父指针，重复键明确拒绝；删除叶子、单孩子、双孩子三案例全部对应真实引用变化，双孩子物理移植中序后继（默认删根 50，后继 `b6=60` 移植为根，`b1=50` 真正摘除，65 接回 70 左侧），同时展示父/根指针变化与中序有序结果 |
| AVL 插入 / 删除 / 四种旋转 | ✅ T2 | 真实 Python `AvlNode`（`node_id/value/left/right/parent/height`）与稳定 `a1…` ID；每次插入/删除都按真实 `left/right` 指针重连，先改 Python 指针再由结构快照驱动画面。逐帧显示节点高度、`balance = height(left) − height(right)`、当前/失衡/轴/上升节点；LL 右旋、RR 左旋、LR 左旋+右旋、RL 右旋+左旋均为真实单旋或双旋连续操作，双旋提供两个 before/after 阶段。删除覆盖叶子、单孩子、双孩子与根节点；双孩子物理移植中序后继并保留后继 ID，删除后从受影响位置向上连续更新高度并可能连续调整多个祖先。10 个官方预设、17 步双语课程、6 张视觉截图 |
| Dijkstra 带权最短路径 | ✅ Stage 7F | 真实 Python `heapq`：带权边、起点/目标、距离表、`previous`、优先队列（含过期条目）、松弛前后距离、settled 顺序、最终路径与总权重全部同帧；不可达距离走 JSON `null`，负权/NaN/Infinity/自环/重复边在产生帧前拒绝；图、距离表、优先队列、Monaco、变量与 9 步双语课程共享同一个 `currentEvent`；46 帧真实默认 Trace、7 次松弛、1 次 stale |
| 品牌迁移与兼容 | ✅ Stage 7B | 界面/标题/元数据/README 使用 AlgoViz；旧持久化 key、packId、MCP Tool、AI Gateway 环境变量与协议头保持不变，见 `docs/BRAND_MIGRATION.md` |
| Monaco 代码编辑器 | ✅ 已实现 | Python/JS 语法高亮、行号、缩进、折叠、撤销/重做、自适应尺寸 |
| 执行行高亮联动 | ✅ 已实现 | `currentEvent.sourceLocation.line` 驱动 Monaco 高亮；时间轴/单步/回退/拖动同步 |
| Python 错误诊断 | ✅ 已实现 | SyntaxError/NameError/… 结构化抽取，行列映射为 Monaco Marker |
| 本地代码自动保存 | ✅ 已实现 | 按算法×语言 debounce 自动保存，刷新/切换恢复，两步确认恢复默认 |
| 源码一致性与异步隔离 | ✅ 已实现 | 编辑后旧 Trace 不高亮新代码并提示重跑；`runId` 丢弃过期结果 |
| 练习题库（原创示例） | ✅ 已实现 | 8 道原创题 + 3 级循序提示 + 本机学习记录 |
| 练习「运行并查看输出」 | ✅ 已实现 | 仅展示输入 → 输出，**不再自动判题**；完成状态由用户手动标记 |
| C / C++ | 🚫 已取消 | 语言入口、占位模板与 `/api/execute` 执行后端均已移除 |
| 在线 Judge / 自动判题 | 🚫 已取消 | 相关入口与宣传已清理 |
| 中英文界面 / 移动端适配 | ⚠️ 部分 | Stage 7A 修复 390–1920 横向溢出与 1024 布局；Stage 7B 栈/队列、Stage 7F 带权图在 1440/1024/390 与 Light/Dark 下实测无页面横向溢出；390 宽图保持可读最小宽度并在画布内横向滚动；仍未安装 axe-core，触控尺寸未逐项审计 |
| 自动化测试 | ✅ 已实现 | 718 项单测 / 帧回归 / jsdom 冒烟 + 107 条真实浏览器 E2E（Playwright + Edge，含真实 Pyodide、知识包、会话文件、AI 导师真实帧/离线/防剧透、Stage 7A 布局与标签状态、Stage 7B 栈/队列、Stage 7C 链表节点/箭头/回退、Stage 7D 二叉树三模式/递归调用栈/回退、Stage 7E BFS/DFS 图与 Frontier/回退/跳帧、Stage 7F Dijkstra、G1 Floyd/Bellman-Ford、G2 Prim/Kruskal 堆/并查集/环检测/回退/跳帧/负权/单点/非连通/有向拒绝、G3 Kahn 入度/队列/减一/入队/环与 AOE ve/vl/slack/多关键路径/多源多汇、G4 连通分量发现/栈/C 编号/4 分量与 Kosaraju 第一遍/转置/第二遍/5 SCC/单向链 vs 有向环、T1 BST 查找/插入/删除三案例/根变化/回退跳帧、T2 AVL 四种旋转/双旋分段/删除三案例/根变化/连续重平衡/回退跳帧、UX-01B 三层导学/3～5 阶段/详情展开/键盘/三算法切换/按算法偏好/英文/Dark/安全回退/390 无横向溢出/首屏高度、UX-02 四段式右栏/真实状态变化/回退与步骤跳帧/课程资料折叠/英文 Dark/390 无溢出、UX-03 九章顺序/25 算法唯一归属/多章多专题展开/当前路径/键盘/刷新持久化/英文 Dark/1440 无溢出/390 九个 optgroup，以及 T1 8 张、T2 6 张、UX-01 3 张、UX-01B 11 张、UX-02 11 张前后对照与 UX-03 10 张目录/证据截图）；另有 MCP 协议测试 20 项与 stdio 冒烟 9 项通过 + 1 项按配置跳过 |
| 知识包远程市场 / 包签名 | ⏳ 后续 | 本版只有本地文件导入；无远程仓库、无自动下载、无签名校验 |
| 网页 AI 导师（本地 Gateway） | ✅ 已实现（真机未验证） | Stage 7A 将其收进工作区标签页，连接状态与错误详情保留；Stage 6A：Ollama + OpenAI Chat Completions 适配、五级教学 Schema、防剧透降级、同源代理；本机无 Ollama/云端 Key，真实模型未验证 |
| AI Gateway 安全边界 | ✅ 已实现 | 仅 127.0.0.1、Origin + 自定义头、96 KiB 请求 / 30s / 20 rpm、严格 Zod、目标地址仅启动配置、密钥只存 Gateway 环境变量 |
| 多模态 / RAG / 自动判题 / Agent 实时同步 | ⏳ 后续 | Stage 6A 明确不做；文件桥与 stdio MCP 保持独立 |
| 练习页编辑器 | ⏳ 后续 | 练习页仍为 textarea；Monaco 仅用于实验室主编辑器 |
| GitHub Pages 部署 | ✅ 已实现 | workflow 构建 `dist/` 后发布 |
| 开源贡献规范 | ✅ 基础版 | [CONTRIBUTING.md](CONTRIBUTING.md)、[行为准则](CODE_OF_CONDUCT.md) |

### 本地开发

```sh
npm ci
npm run dev            # 开发服务器
npm run typecheck      # TypeScript 严格检查
npm test               # Vitest（718 项）
npm run build          # tsc -b && vite build → dist/
npm run preview        # 预览构建产物
npm run test:e2e       # Playwright E2E（默认驱动本机 Microsoft Edge，107 条）
npm run pack:build     # 从 packs/src/<name>/ 构建 .algopack
npm run pack -- packs/algolens-search-basics.algopack   # 校验知识包（与浏览器同一条校验链）
```

AI 导师（可选，本地 Gateway；详见 [docs/AI_GATEWAY.md](docs/AI_GATEWAY.md)）：

```sh
npm run ai:install     # 只装 packages/ai-gateway 依赖（Node ≥ 22.9）
npm run ai:dev         # 用 vite-node 启动 Gateway（读可选的根目录 .env）
npm run ai:typecheck   # 子包类型检查
npm run ai:build       # esbuild → packages/ai-gateway/dist/server.mjs
npm run ai:start       # 运行构建后的 Gateway
```

普通用户不需要 Gateway：不启动时页面显示「AI 未连接」和明确标注的本地教学提示，算法、Python、课程、时间轴、知识包与 MCP 全部照常工作。**GitHub Pages 是纯静态托管，没有本地 Gateway**，因此不要期望静态演示能直接使用私密云端 Key；完整 AI 功能需要在本机运行 `npm run dev` + `npm run ai:dev`。

MCP（可选，独立依赖与产物，不影响网页；详见 [docs/MCP_INSTALL.md](docs/MCP_INSTALL.md)）：

```sh
npm run mcp:install    # 只装 packages/mcp-server 依赖（需 Node ≥ 20）
npm run mcp:build      # esbuild → packages/mcp-server/dist/server.mjs
npm run mcp:start -- --help                                     # 看用法（输出到 stderr）
npm run mcp:smoke      # 真实 stdio 子进程冒烟（6 工具 + 1 prompt）
npm run mcp:typecheck  # 子包类型检查
```

浏览器打开 Vite 提示的地址。不要用 `file://` 直接打开：Worker 与模块加载会受限。

重新生成迁移前数据 / 帧基线（**会改写 `src/**/*.generated.ts` 与帧快照，需 review 后提交**）：

```sh
npm run sync:legacy
```

### 目录结构

```
src/
  app/         视图编排
  features/    lab（含 SyncPanel 同步观察 + SessionPanel 学习会话）/ packs（知识包页与管理控制器）/ practice / ai
  domain/      algorithms / problems / lessons（教学课程数据 + catalog 组合）/ packs（容器、manifest、路径、校验）/ trace（schema + adapter + player）/ visualization / sessions（.algosession.json 与 .algocontext.json 格式）/ mentor（AI 导师共享 Schema 与真实上下文构造）
  runtime/     js worker / python（Pyodide + 结构化诊断）/ packs（有界 ZIP 读取 + IndexedDB 存储）/ monaco（懒加载 + 主题）/ ai / url / storage / drafts
  theme/       三态主题解析与 Provider
  i18n/        中英词典与 Provider
  styles/      tokens.css（唯一颜色源）+ app.css
  test/        setup 与 legacy 帧快照
e2e/            Playwright 真实浏览器测试（lab.spec.ts / packs.spec.ts / session.spec.ts / mentor.spec.ts / stage7b.spec.ts / stage7c.spec.ts / stage7d.spec.ts / stage7e.spec.ts / stage7f.spec.ts / g1–g4 / t1.spec.ts / t2.spec.ts 及对应 visual spec）
packages/
  mcp-server/   本地 MCP Adapter（stdio、官方 SDK、6 工具 + teach_algorithm；依赖与产物独立）
  ai-gateway/   本地 AI Gateway（仅 127.0.0.1；Ollama + OpenAI Chat Completions；共享 mentor Schema）
packs/          知识包：src/<packId>/（源）+ <packId>.algopack（构建产物）
legacy/        迁移前数据定义（回归基线来源，应用运行时不引用）
docs/          ARCHITECTURE.md、阶段报告、PACK_FORMAT_V1.md、PACK_AUTHOR_GUIDE.md、STAGE6A_REPORT.md、AI_GATEWAY.md、MCP_INSTALL.md
scripts/       从 legacy 定义生成类型化数据、build-pack.mjs、validate-pack.ts
```

### Trace Event Schema v1

所有语言产生的执行状态统一为版本化事件（`src/domain/trace/schema.ts`，Zod 校验）：

- 事件字段：`schemaVersion` / `step` / `eventType` / `visualType` / `state` / `message` / `sourceLocation` / `variables` / `callStack` / `lessonStepId`（可选，教学阶段，仅由执行时显式记录）
- 可视化结构：`array / stack / queue / linked / tree / graph`
- 变量快照：`{ name, type, value, scope? }`，值必须是 JSON 可序列化类型
- 限额：事件数 500、单条消息 240 字符、变量 50 个、状态 8KB、总量 2MB
- 无效事件返回结构化错误，绝不导致页面崩溃

旧版 `frames[{state,message}]` 由 `src/domain/trace/adapter.ts` 无损转换为新协议；旧算法没有变量/行号时展示空态，**不编造数据**。

### 与 MCP Agent 的两种文件（Web ⇄ Agent）

- `.algosession.json`：Agent 写的**学习意图**（`sessionFormatVersion: 1`、`lessonId/algorithmId`、可选 `selectedStepId`、可选 Python `source`、可选 `input`、`lessonOrigin`）。上限 96 KiB，`.strict()` 拒绝未知键；网页导入后**不会**自动运行。
- `.algocontext.json`：网页导出的**当前真实帧**（`contextFormatVersion: 1`、`stepIndex`、`totalEvents`、`lessonStepId`、真实 `event`、可选 `source`）。上限 128 KiB；导出不重跑；MCP 只从用户配置的目录读取裸文件名。
- 两者都由 `src/domain/sessions/` 定义并被网页与 MCP 共用；MCP 看不到浏览器 IndexedDB，工具输出显式标注 `browserIndexedDbVisible: false`。

### 学习实验室布局（Stage 7A）

- 宽屏：左侧可折叠算法目录；中间动画 + 右侧 Monaco；「当前步骤」紧接动画下方；底部标签页为教学步骤 / 变量与调用栈 / AI 导师 / 学习工具。
- ≤1279px：单列顺序为动画 → 当前步骤 → 代码 → 标签页；≤899px 目录改为顶部算法选择；≤760px 单列且无页面级横向滚动。
- 标签页只隐藏 DOM，不卸载面板，因此 Monaco、Trace、草稿与 AI 会话状态不因切换而重建。题库与 AI 导入入口位于「更多工具」菜单，代码与数据未删除。

详细证据与已知限制见 [阶段 7A 总结](docs/STAGE7A_REPORT.md)，实际截图位于 `docs/stage7a/`。

### 网页 AI 导师（Stage 6A）

- 浏览器只访问**同源** `POST /api/mentor` 与 `GET /api/providers`；Vite dev/preview 将其代理到 `127.0.0.1:8787` 的本地 Gateway。页面里没有可填任意 URL 的 AI 代理地址，也没有任何 Key。
- 请求中的 `context` 复用 Stage 5A 的真实帧字段：`algorithmId`、当前 `event`（Trace Schema v1）、`stepIndex/totalEvents`、`lessonStepId` 与课程阶段文案、`traceStale`；`stepIndex` 必须等于 `event.step`。源码默认不发送，只有用户勾选后才包含（上限 40k 字符）。
- 五级教学：`level 1..5` 默认 1；Level 5 必须在前端确认并携带 `confirmFullSolution: true`，否则 Gateway 返回 403 `level5-confirmation-required`。回复经共享 Zod Schema 校验；低等级下完整代码围栏会被替换，`answerDisclosure` 超契约时降级。
- 旧请求与步骤绑定：卡片显示算法/帧号；切换步骤会中止在途请求，旧回复不会被标成新步骤答案。
- 旧版 `POST /api/ai` 仍保留给练习页/自定义导入使用的“用户自部署代理”协议（`{"action":"review_code", ...}`）；AI 导师不走这个接口，也不需要用户自己搭代理。
- **不要把 API key 写进前端、GitHub 仓库或浏览器 localStorage。** 云端 Key 只放在 Gateway 进程环境（`.env` 被 gitignore；仓库只提交 `.env.example`）。

### 安全说明

- 用户 JavaScript 只在限时 Worker 中执行；Python 只在 Pyodide Worker 中执行，均不经过服务器。
- 知识包是**纯内容**：ZIP 内只接受 `manifest.json` / `LICENSE` / `README.md` / `lessons/*.json` / `examples/*.py`，导入时不解压到磁盘、不执行包内代码、不渲染不可信 HTML（课程文本按纯文本/Markdown 安全显示）。
- 包内 Python 示例在导入时只是惰性文本；只有用户在课程里点击「载入示例」再点击「运行」才会进入既有 Pyodide Worker。**Pyodide 不是针对恶意 Python 的完整沙箱**，请只运行你信任的包。
- 安装数据保存在浏览器 IndexedDB，不上传服务器；清理站点数据/隐私模式会导致已装包丢失，这是存储边界。
- MCP Server 是**独立本地进程**：只走 stdio（stdout 仅协议、日志走 stderr），不监听端口、不联网、不扫描磁盘。三个目录（包 / 会话输出 / 上下文输入）必须由用户显式配置，且只接受裸文件名、拒绝路径穿越与符号链接；写入永不覆盖已有文件。
- MCP 读不到浏览器 IndexedDB 里安装的包，也不假装读到；反之浏览器也不会自动接收 Agent 的会话文件，必须用户手工导入。**Pyodide 不是恶意 Python 沙箱**，MCP 从不执行任何 Python。
- 练习「运行并查看输出」是学习辅助，**不做成绩判定**。
- AI Gateway 是**独立本地进程**：固定 `127.0.0.1`，不监听公网/局域网；每个请求必须带 `x-algolens-client: web` 且 Origin 在允许列表（跨站 `Sec-Fetch-Site` 直接拒绝），不使用 CORS `*`。请求 96 KiB、响应 256 KiB、总超时 30 s、默认 20 次/分钟。
- Gateway 只能访问启动配置中的 Ollama/OpenAI 地址，**请求体不能改目标地址**（无任意 URL 代理、无文件读取、无 Shell）；错误响应不回显 Key、上游正文或堆栈。日志只写 stderr 的 requestId/provider/level/status/latency。
- 模型输出按 React 文本节点渲染，**不使用 `dangerouslySetInnerHTML`**；Schema 限制每段长度/条数。Prompt 中课程与真实帧被标记为不可信数据。Prompt 与输出过滤**不能保证 100% 防剧透**，因此低等级还有独立代码围栏降级。
- AI 生成的代码必须由学习者检查后再运行；AI 不运行 Python、不改 Monaco、不改播放位置、不判题。

### 路线图

Stage 1（已完成）：统一 Trace 协议 + 旧动画兼容 + Python 冒泡排序同步演示。
Stage 2（已完成）：Monaco 编辑器 + 执行行高亮联动 + Python 错误诊断 + 本地代码保存 + 真实浏览器 E2E。
Stage 3（已完成）：Python 递归调用栈 + 局部变量同步可视化（`@tracked` + 调用栈面板 + 作用域变量 + 阶乘/斐波那契演示）；收尾修复时间轴在切换 Trace 后不归零的缺陷。
Stage 3B（已完成）：教学课程数据层（Lesson Schema / 注册表 / 双向查询）+ `lessonStepId` 教学阶段关联 + 教学面板与时间轴双向联动 + 冒泡/阶乘两门双语课程。
Stage 4（已完成）：可安装教学知识包（`.algopack`）：ZIP 格式规范 + Pack Schema/校验 + 安全导入（路径穿越/ZIP Bomb/资源限额）+ IndexedDB 本地安装/刷新恢复/卸载 + 课程注册表组合（内置优先）+ 知识包管理页 + 官方示例包（二分查找）+ 真实 Pyodide 教学同步。
Stage 5A（已完成）：本地 MCP Agent 插件（stdio、官方 SDK、6 工具 + `teach_algorithm` 五级 Prompt）+ `.algosession.json` / `.algocontext.json` 两种共享文件 + 网页会话导入与上下文导出 + 目录/路径/大小安全边界 + 真实浏览器双流程 E2E。**未在第三方宿主实测**（仅配置模板）。
Stage 6A（已完成 MVP）：本地 AI Gateway（仅 127.0.0.1）+ Ollama / OpenAI Chat Completions Provider + 共享五级 Mentor Schema 与防剧透降级 + 网页 AI 导师面板（提供商/模型/连接状态、真实步骤/变量/调用栈解释、Level 5 确认、中止、旧步骤隔离、离线本地提示）+ E2E。**真实 Ollama 与云端 API 未实测**，静态 GitHub Pages 不含 Gateway。
Stage 7A（已完成）：学习实验室信息架构重构（动画 + Monaco + 当前步骤同屏、按需标签、课程渐进展开、1024/390 单列无横向溢出）。
Stage 7B（已完成）：AlgoViz 品牌迁移与旧 key 兼容、可选 structure Trace、栈桶状/队列排队专属渲染、真实 Python 栈/队列课程与截图。
Stage 7C（已完成）：单链表结构化 Trace、真实 Python Node 示例（插入/删除/遍历）、纯链表 VisualModel、节点/箭头/HEAD/NULL/断开节点渲染、双语课程、6 条真实 Pyodide E2E 与 60 张截图。
Stage 7D（已完成）：二叉树结构化 Trace、真实 Python TreeNode 三模式递归（前序/中序/后序）、纯树布局与模型、层级画布/递归路径/访问序号、调用栈联动、9 步双语课程、6 条真实 Pyodide E2E 与 106 张截图。
Stage 7E（已完成）：图 BFS/DFS 结构化 Trace、真实 Python deque 队列与显式 list 栈、确定性图布局与纯 GraphVisualModel、节点/边/当前边/访问序号、同帧 QueueVisual/StackVisual、图与 Frontier 的回退/跳帧同步、9 步双语课程、6 条真实 Pyodide E2E 与 90 张截图。
Stage 7F（已完成）：带权图 `weighted-graph` Trace Schema、真实 Python `heapq` Dijkstra（负权/NaN/Infinity 拒绝、不可达 `null`）、距离表/`previous`/优先队列/松弛/stale/最终路径、独立 PriorityQueuePanel 与同帧图渲染、9 步双语课程、3 条功能 E2E + 1 条视觉 E2E 与 62 张截图；独立分支 `stage7f-dijkstra`，已并入 main。
G1（已完成并合并 main）：Floyd-Warshall 全源最短路与 Bellman-Ford 单源最短路，真实 Python Trace、负环检测、双语课程、3 条功能 E2E + 1 条视觉 E2E 与 6 张截图；合并提交 `14cf331`。
G2（已完成，待合并）：Prim 与 Kruskal 最小生成树，真实 `heapq` / 并查集、共享带权图组件与各自专属面板、双语课程、4 条功能 E2E + 1 条视觉 E2E 与 8 张截图；独立分支 `feat/g2-mst`。
G3（已完成，待合并）：Kahn 拓扑排序与 AOE 关键路径，真实 Python 入度队列 / ve-vl-slack、共享有向图组件与各自专属面板、双语课程、4 条功能 E2E + 1 条视觉 E2E 与 7 张截图；独立分支 `feat/g3-topo-critical-path`。
G4（已完成，待合并）：无向图连通分量与 Kosaraju 强连通分量，真实迭代 DFS / 双遍 DFS + 边反转、显式栈与完成顺序面板、双语课程、4 条功能 E2E + 1 条视觉 E2E 与 6 张截图；独立分支 `feat/g4-components-scc`。
T1（已完成，待合并）：BST 查找 / 插入 / 删除，真实 `TreeNode` 与引用变化、稳定节点 ID、删除三情况（含双孩子中序后继物理移植）、14 步双语课程、1 条真实 Pyodide E2E 与 8 张截图；独立分支 `feat/t1-bst`。
T2（已完成，待合并）：AVL 插入 / 删除 / 失衡检测 / LL·RR·LR·RL 四种真实旋转，真实 `AvlNode` 指针变化、稳定节点 ID、节点高度与平衡因子、双旋两阶段、删除后多层祖先连续重平衡、10 个官方预设、17 步双语课程、1 条真实 Pyodide E2E 与 6 张截图；独立分支 `feat/t2-avl`。
UX-01（已完成，待合并）：实验室顶部可折叠算法导学；三算法原创双语、课程派生与目录安全回退、每算法折叠偏好、键盘操作、390 手机端；独立分支 `feat/ux01-algorithm-guide`。
UX-01B（已完成，待合并）：在 UX-01 基线上把导学收敛为“一句话理解 + 核心思想 → 3～5 个阶段 → 记忆重点”三层；详细步骤/前置/复杂度/条件/错误默认收起，展开后完整保留；静态图缩小；Dijkstra/Kahn/Kosaraju 各自使用真实阶段结构；1440×900 首屏可见动画顶部；独立分支 `feat/ux01b-guide-hierarchy`。
UX-02（已完成，待合并）：右侧 Teaching Course 默认只保留“当前做什么 / 为什么这样做 / 真实状态变化 / 可选记忆重点”四段；Dijkstra、Kahn、Kosaraju、BST/AVL 读取强类型结构，其他算法按相邻帧 `state` 降级；旧课程资料与步骤跳转折叠保留；右栏 1440 高度降到 405～427px，390 单栏可读；独立分支 `feat/ux02-lesson-panel`。
后续：堆、哈夫曼树与页面主布局改造继续复用现有树布局、Trace 快照与单一播放器；Agent ↔ 浏览器实时同步（Stage 5B 候选）、RAG、题库扩充、练习页 Monaco 迁移、远程包市场与包签名、axe 可访问性。

### License

MIT（见 [LICENSE](LICENSE)）。题目与算法说明均为原创示例，不是官方历年真题。

---

## English

AlgoViz is a browser-first algorithm visualization learning platform where **Python runs in the browser** and every animation frame is driven by real execution results, synchronised with the source line, variable values and a step explanation. It runs entirely locally — no server required.

**Stage 5A** shipped the first local MCP agent plugin: `packages/mcp-server` (official TS SDK, stdio) exposing six course/pack/session/context tools plus a five-level `teach_algorithm` prompt, with `.algosession.json` / `.algocontext.json` as the explicit file bridge; MCP reads only configured directories and never browser IndexedDB.

**Stage 7A** restructures the learning lab: the animation, Monaco editor and current trace step share the first screen; teaching steps, variables/call stack, the AI mentor and learning tools move into on-demand tabs; the duplicated read-only source view becomes an expandable executed snapshot; courses open progressively. Navigation is reduced to Learn / Packs / More tools, with practice and AI import kept (labelled) inside More tools. Tabs keep their panels mounted, so switching never recreates Monaco, the trace, drafts or AI state. Screenshots and limits are recorded in [docs/STAGE7A_REPORT.md](docs/STAGE7A_REPORT.md).

**Stage 6A** adds an optional local AI tutor. `packages/ai-gateway` is a loopback-only Node process (`127.0.0.1:8787`) that talks to local Ollama or your own OpenAI Chat Completions key; the page only calls same-origin `/api/mentor` and `/api/providers`. The mentor explains the real frame under the playhead (variables, call stack and teaching stage), enforces five hint levels with an explicit Level 5 confirmation, redacts leaked full code at low levels, and keeps old answers tied to their own frame. Keys never enter the browser, localStorage or Git; without the Gateway the whole lab keeps working and the panel says AI is offline. Real Ollama/cloud calls were **not tested** here, and GitHub Pages (static hosting) does not include a Gateway.

**Stage 7B** moves the user-facing brand to AlgoViz while keeping legacy storage keys and protocol identifiers compatible, and adds structure-driven stack and queue visuals: a top-open vertical bucket for LIFO and a left-front/right-rear row for FIFO. Both are driven by real Python frames, not message parsing.

**Stage 7D** adds a real binary-tree traversal lab on one shared tree: genuine Python `TreeNode` objects with real `left`/`right` references, a pure depth/column layout (root on top, left child lower-left, right child lower-right), and the same `inorder` catalogue entry executed in preorder, inorder or postorder. Switching a mode keeps the old trace until the learner presses Run; the new trace starts at frame 0. The canvas synchronises the current node (entered ≠ visited), visited order badges, root-to-current recursion path, the real `@tracked` call stack, Monaco line and nine bilingual lesson steps. Every frame is a full snapshot, so scrubbing restores the tree and stack together. Screenshots and limits are recorded in [docs/STAGE7D_REPORT.md](docs/STAGE7D_REPORT.md).

**Stage 7C** adds a real singly linked-list teaching visualization: actual Python `Node` objects with a stable `node_id`, real `next` references, HEAD/NULL markers, SVG arrows, a detached-node tray and a pointer-change badge. Middle insertion is shown as create → `new.next = previous.next` → `previous.next = new`; deletion first bypasses the target and then clears `target.next`; traversal highlights the current Node while Monaco, variables and the lesson step stay on the same frame. Every frame is a full snapshot, so scrubbing and arbitrary jumps restore the exact chain. Screenshots and limits are recorded in [docs/STAGE7C_REPORT.md](docs/STAGE7C_REPORT.md).

**Stage 7E** adds a real graph BFS/DFS lab. One undirected teaching graph (A–G, seven edges, including a cycle) is traversed by genuine Python code: `collections.deque` for BFS and an explicit `list` stack for DFS. Every frame carries stable node/edge ids, `discovered` / `visited` / `visitOrder`, the current node and inspected edge, and the exact frontier snapshot. The graph canvas and the compact queue/stack below it are built from the same `currentEvent`; there is no second player, no index and no message parsing. Scrubbing or jumping restores the graph, frontier, variables and lesson step together, while a theme or viewport change keeps the same frame. Nine bilingual steps explain why FIFO expands layer by layer and LIFO goes deep before backtracking. Screenshots and limits are recorded in [docs/STAGE7E_REPORT.md](docs/STAGE7E_REPORT.md).

**G4** adds undirected connected components and Kosaraju strongly connected components. The components lab runs a real iterative DFS with an explicit stack, showing start/pop/visit/inspect/discover/push/skip, current C id and final node groups; the default 8-node/5-edge graph yields four groups including isolated H. The SCC lab runs a real two-pass Kosaraju: the first DFS records finish order, a dedicated `reverse` frame transposes every edge, and the second DFS scans the reversed graph in reverse finish order to assign each SCC; the default 8-node/7-edge graph yields five SCCs. Both reuse the existing graph layout and the single player, print `C1/C2/...` alongside colour, and ship bilingual courses. **T1** adds a real BST lab for search, insert and delete: every node is a real Python `TreeNode`, the input is rebuilt by real insertions, and each frame is derived from the recorded `left/right` references and stable `b1…b8` IDs. Delete exposes leaf, one-child and two-child cases; the two-child path physically transplants the in-order successor (default: delete root 50, move `b6=60` into the root, reconnect 65 as 70's left child) instead of faking a value copy, while recording the removed node, parent/side, replacement and old/new root. A 14-step bilingual course covers the BST invariant, comparison paths, duplicate rejection, the three delete cases, in-order ordering and the O(log n) average vs O(n) worst case. **T2** adds a real AVL lab for insert, delete, imbalance detection and all four rotations: every node is a real Python `AvlNode` with `node_id/value/left/right/parent/height` and a stable `a1…` ID, and each frame is derived from the recorded pointers, subtree heights and `balance = height(left) − height(right)`. LL/RR are single rotations, LR/RL are two genuine consecutive rotations with separate before/after phases; the visual update follows the real Python pointer changes rather than moving SVG nodes first. Delete covers leaf, one-child, two-child and root, physically transplants the in-order successor without faking node identity, then walks up the ancestors to refresh heights and rebalance as many levels as needed. Ten official presets cover the four rotations, a no-rotation insert, all delete cases, missing keys and a leaf deletion that triggers two different LR rebalances; a 17-step bilingual course explains the AVL invariant, degeneration, heights/BFs, single vs double rotations, deletion, O(log n) and common mistakes. **G3** adds Kahn topological sorting and AOE critical paths: a real Python indegree queue (deterministic FIFO, cycle detection) and a real AOE forward/backward pass with ve/vl, activity slack, every critical path and project duration. The directed-graph canvas, indegree/queue panels, event/activity tables and bilingual courses all read the same `currentEvent`; there is no second player. The default topological DAG has 32 frames and several valid orders (tests verify every dependency, never one fixed array); the default AOE network has 22 frames, duration 11 and two critical paths. **G1** adds Floyd-Warshall all-pairs and Bellman-Ford single-source shortest paths with real Python traces, negative-cycle detection and bilingual lessons; it reuses the weighted-graph renderer without inheriting Dijkstra's non-negative-only input rule. **G2** adds Prim and Kruskal minimum spanning trees: Prim uses a real Python `heapq` over cut edges, Kruskal uses a real union-find with path compression and union by rank; both share the weighted-graph node/edge primitives and the single player while keeping distinct panels for the heap vs. sorted-edge/Union-Find story. The default five-vertex graph produces different valid MST edge sets with the same total weight 6; negative edges are allowed, directed graphs/self-loops/duplicate undirected edges are rejected, and a disconnected input is reported as a minimum spanning forest, never as one spanning tree. **Stage 7F** adds a real weighted-graph Dijkstra lab. Genuine Python `heapq` runs against the A–G weighted graph; every full snapshot carries the distance table, `previous` pointers, the priority queue including stale entries, the current edge, relax before/after values, settled order and the final path with its total weight. Unreachable distances cross the Python/JSON boundary as `null`, never Infinity, and negative, NaN, Infinity, self-loop and duplicate-edge inputs are rejected before a frame exists. The graph canvas, distance table, independent priority-queue panel, Monaco line, variables and nine bilingual lesson steps all derive from the same `currentEvent`; scrubbing restores all panels together. The default run is 46 real frames with 7 relaxations and one stale heap entry, ending at A→B→E→F→G with total weight 7. Screenshots and limits are recorded in [docs/STAGE7F_REPORT.md](docs/STAGE7F_REPORT.md).

```sh
npm ci
npm run dev
npm run typecheck
npm test          # 718 tests (incl. 20 MCP protocol tests + gateway tests)
npm run build
npm run test:e2e  # 107 Playwright tests (local Microsoft Edge; mock provider)
npm run pack -- packs/algolens-search-basics.algopack   # validate a pack (same chain as the browser)
npm run mcp:install && npm run mcp:build                 # optional MCP server (Node >= 20)
npm run mcp:smoke                                        # real stdio child-process smoke test
npm run ai:install && npm run ai:dev                     # optional loopback AI Gateway
```

See [docs/UX02_REPORT.md](docs/UX02_REPORT.md) for UX-02, [docs/UX01B_REPORT.md](docs/UX01B_REPORT.md) for UX-01B, [docs/UX01_REPORT.md](docs/UX01_REPORT.md) for UX-01, [docs/T2_REPORT.md](docs/T2_REPORT.md) for T2, [docs/T1_REPORT.md](docs/T1_REPORT.md) for T1, [docs/G4_REPORT.md](docs/G4_REPORT.md) for G4, [docs/G3_REPORT.md](docs/G3_REPORT.md) for G3, [docs/G2_REPORT.md](docs/G2_REPORT.md) for G2, [docs/G1_REPORT.md](docs/G1_REPORT.md) for G1, [docs/STAGE7F_REPORT.md](docs/STAGE7F_REPORT.md) for the Dijkstra stage, [docs/COVERAGE.md](docs/COVERAGE.md) for the course/algorithm matrix, [docs/STAGE7E_REPORT.md](docs/STAGE7E_REPORT.md) for BFS/DFS, [docs/STAGE7D_REPORT.md](docs/STAGE7D_REPORT.md) for the tree lab, [docs/STAGE7C_REPORT.md](docs/STAGE7C_REPORT.md) for the linked list, [docs/STAGE5A_REPORT.md](docs/STAGE5A_REPORT.md), [docs/MCP_INSTALL.md](docs/MCP_INSTALL.md) for host configuration (templates only — no third-party host was tested), [docs/STAGE4_REPORT.md](docs/STAGE4_REPORT.md) for packs, [docs/PACK_FORMAT_V1.md](docs/PACK_FORMAT_V1.md) for the container spec, [docs/PACK_AUTHOR_GUIDE.md](docs/PACK_AUTHOR_GUIDE.md) for authoring, [docs/STAGE3B_REPORT.md](docs/STAGE3B_REPORT.md) for the lesson system, [docs/STAGE3_REPORT.md](docs/STAGE3_REPORT.md) for recursion, [docs/REFERENCES.md](docs/REFERENCES.md) for sources and licences, and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module boundaries. Never put provider API keys in the browser. MIT licensed; all exercises and lesson copy are original, not official past exam questions.
