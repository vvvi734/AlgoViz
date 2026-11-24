# AlgoViz 中文术语审查报告（I18N-TERMS-01）

- 审查日期：2026-11-24
- 审查基线：`6ad55da6b60b03a3e290519ee8c9a961b3df7764`（`feat(ux): add immersive fullscreen visualization`）
- 审查对象：AlgoViz 中文模式中，面向学生的英文算法名、专业术语与缩写
- 修改边界：中文教学展示文案、i18n 数据、集中术语词典、必要样式与测试；算法实现、Python Trace、参考代码、输入 Schema、课程注册 ID、SVG 几何语义和英文模式未改

## 1. 实际审查范围

| 范围 | 真实来源 | 数量 |
| --- | --- | --- |
| 教材章节 | `src/domain/algorithms/textbook.ts` 的 `TEXTBOOK_CHAPTERS` | 12 章 |
| 正式算法 | `src/domain/algorithms/examples.ts` 合并后的 `catalog` | 60 个 |
| 算法课时 | `src/domain/lessons/registry.ts` 的 `lessonRegistry.lessons` | 60 个 |
| 理论专题 | `src/domain/concepts/catalog.ts` 的 `CONCEPT_PAGES` | 56 个 |
| 算法导学 | `src/domain/guides/courseGuides.ts` | 60 份导学 |
| 中文 UI 字典 | `src/i18n/messages.ts` | 中文 `EXTRA` 全量键值 |
| 教材标题覆盖 | `src/domain/algorithms/textbook.ts` 与 `TEXTBOOK_TITLE_ZH` | 15 条 |

审查覆盖首页、教材目录、左侧导航、移动端目录选择器、算法卡片、算法详情 h1、算法导学、理论专题标题与正文、术语定义、算法步骤、复杂度说明、图解标题与图例、输入示例、动态状态标签、Trace 错误文案和全屏工作区标题。

课程注册数量已经通过运行时脚本核对，不采用 `catalog.generated.ts` 的 35 条索引作为算法总数；完整 60 条来自 `examples.ts` 的合并目录。

## 2. 扫描与计数

扫描器 `tmp-terms-inventory.json` 的最终候选结果为：

- 含拉丁字符的候选片段：3519 条。
- 其中 `messages`：727 条，289 个不同拉丁词形。
- 其余候选来自 60 个算法、60 个课时、56 个理论页、60 份导学与教材目录。

3519 不是“3519 个术语”。其中大量命中是公式变量、C/JS/Python 标识符、Trace 字段、示例输入、URL、语言名、第三方库名和代码片段。人工分类后：

- 建立术语词典：106 条。
- 被课程页面实际引用：100 条。
- 仅作人名算法备用、未单独渲染：6 条（`dijkstra`、`bellman-ford`、`prim`、`kruskal`、`kahn`、`kosaraju`，均由标题或导学承担解释）。
- 有术语说明块的算法页：46 / 60。
- 有术语说明块的理论页：43 / 56。
- 其余 14 个算法页、13 个理论页经逐页人工检查，没有需要新增术语块的专业英文术语；详见第 7 节。

## 3. 术语分类处理结论

### A. 人名算法

已补充规范中文名称或通行音译：

- Dijkstra（迪杰斯特拉）
- Prim（普里姆）
- Kruskal（克鲁斯卡尔）
- Floyd–Warshall（弗洛伊德—沃舍尔）
- Bellman-Ford（贝尔曼—福特）
- Kosaraju（科萨拉朱）
- Huffman 采用教材式中文优先：哈夫曼树（Huffman Tree），不为已有规范译名另造音译
- KMP 解释为 Knuth–Morris–Pratt 人名组合，不再误写成功能型英文短语
- AVL 解释为 Adelson-Velsky–Landis，并注明“不是平衡的英文缩写”
- Lomuto 课程统一称“Lomuto 分区法”；首次出现可补充“洛穆托分区法”，但不把音译作为必用正式名称

### B. 专业缩写

统一采用“缩写（English Full Name，中文名称）”或教材式中文优先：

- `ADT（Abstract Data Type，抽象数据类型）`
- `BFS（Breadth-First Search，广度优先搜索）`
- `DFS（Depth-First Search，深度优先搜索）`
- `LIFO（Last In First Out，后进先出）` / `FIFO（First In First Out，先进先出）`
- `MST（Minimum Spanning Tree，最小生成树）`
- `DAG（Directed Acyclic Graph，有向无环图）`
- `SCC（Strongly Connected Component，强连通分量）`
- `DSU（Disjoint Set Union，并查集）`
- `LSD（Least Significant Digit first，最低位优先）` / `MSD（Most Significant Digit first，最高位优先）`
- `ASL（Average Search Length，平均查找长度）`
- `WPL（Weighted Path Length，带权路径长度）`
- `CSR（Compressed Sparse Row，压缩稀疏行）`
- `ISAM（Indexed Sequential Access Method，索引顺序存取方法）`
- `BF（Brute Force，暴力匹配）`
- `BST（Binary Search Tree，二叉搜索树）`、`AVL`
- `B 树（B-Tree）`、`B+ 树（B+ Tree）` 明确为不同结构，B+ 树额外说明叶链与范围扫描

### C. 数据结构术语

中文优先，必要时才附英文：

- 哈希表（Hash Table）
- 字典树（Trie，又称前缀树）；“键树”作为教材相关别名，只在概念对应准确时保留
- 栈（Stack）、队列（Queue）
- 邻接矩阵 / 邻接表 / 十字链表 / 邻接多重表
- 满二叉树 / 完全二叉树 / 线索二叉树
- 三元组表（Triple Table）
- 块链串（Block-Linked String）

不对“栈”“队列”的每次出现都追加英文，避免机械双语堆砌。

### D. 算法性质与操作

- 原地算法（In-place Algorithm）
- 稳定排序（Stable Sort）
- 分治（Divide and Conquer）
- 贪心策略（Greedy Strategy）
- 动态规划（Dynamic Programming）
- 松弛操作（Relaxation）

这些词在首次出现的导学或术语块中解释，而不是只给英文直译。

### E. 合理保留英文

以下内容按技术标识处理，不中文化、不音译：

- AlgoViz 品牌、C / C++ / Python / Fortran / MATLAB / SQL 等语言或技术正式名称
- HTML 标签、CSS 属性、JS 对象键、API 函数名、npm 包名、URL、localStorage 键
- 变量名、公式变量、数学函数名、代码片段
- Python 库名与解释器名：`heapq`、`Pyodide`、`Monaco`
- Trace 机器字段：`frameId`、`copyId` 等
- 示例输入的记录字母 A/B/C、节点标号
- `ID` 作为记录标识符时保留；正文已有“记录 ID”这一中文说明

## 4. 集中术语词典

文件：`src/i18n/terminology.ts`。

字段：

```ts
{
  id: string;
  abbreviation?: string;
  english: string;
  chinese: string;
  transliteration?: string;
  labelZh: string;
  noteZh?: string;
}
```

词典只做显式查询，不做运行时全局正则替换。

主要分组与词条：

| 分组 | 代表词条 |
| --- | --- |
| 基础 | `data-structure`、`algorithm`、`linear-list`、`adt`、`big-o`、`algorithm-cases` |
| 线性结构 | `stack-operations`、`queue-operations`、`linked-pointers`、`lifo`、`fifo` |
| 串 | `bf`、`kmp`、`prefix`、`suffix`、`lps`、`next-array`、`token` |
| 树 | `bst`、`avl`、`avl-rotations`、`b-tree`、`b-plus-tree`、`huffman`、`wpl`、`trie`、`threaded-binary-tree`、`threaded-tags`、`asl` |
| 图 | `graph`、`adjacency-matrix`、`adjacency-list`、`bfs`、`dfs`、`frontier`、`dijkstra`、`floyd`、`relaxation`、`distance`、`prim`、`kruskal`、`mst`、`union-find`、`dag`、`aov`、`aoe`、`topological-sort`、`critical-path`、`scc`、`low-link`、`articulation-point`、`bridge` |
| 查找 | `hash-table`、`hash-function`、`collision`、`load-factor`、`open-addressing`、`chaining`、`hash-slot`、`binary-tree`、`full-binary-tree`、`complete-binary-tree` |
| 排序 | `quick-sort`、`lomuto`、`pivot`、`merge-sort`、`heap-sort`、`shell-sort`、`gap`、`radix-sort`、`lsd`、`msd`、`stable-sort`、`in-place` |
| 文件 | `external-sort`、`replacement-selection`、`merge`、`run`、`buffer`、`index`、`isam`、`vsam`、`inverted-index`、`posting` |
| 状态 | `bfs-state`、`dfs-state`、`dijkstra-state`、`free-block-state`、`hash-slot` |
| 扩展 | `mark-sweep`、`compaction`、`buddy-system`、`generalized-list`、`orthogonal-list`、`adjacency-multilist` |

完整 106 条以 `TERMINOLOGY` 常量为准；本报告不把词典复制成第二套可漂移的数据源。

## 5. 展示位置与去重规则

- 理论页：`ConceptView.tsx` 在标题 hero 后插入 `<TermGlossary conceptId={concept.id} />`。
- 算法页：`AlgorithmGuide.tsx` 在普通导学 header 后、定义区前插入；无导学的算法页走 `CatalogGuide`，在 hero 后插入。
- 术语块是中文可见的正文块，不使用鼠标悬停 Tooltip；`lang !== 'zh'` 时组件返回 `null`。
- 视觉形式为“术语说明”面板，桌面双列、窄屏单列，条目包含中文名与必要英文全称；不强制把所有词都塞进标题。
- 标题与术语块去重：BFS 只列 `fifo / frontier / bfs-state`；DFS 只列 `lifo / frontier / dfs-state`；Dijkstra 列 `relaxation / distance / dijkstra-state / previous`；Prim/Kruskal 不重复算法名，Kruskal 增加 `union-find`；拓扑排序不重复 `Kahn`。

名称策略：

- 页面 h1 用完整名，例如 `Dijkstra（迪杰斯特拉）最短路径算法`。
- 导航栏、移动端下拉、导学标题、参考代码和全屏标题用受控短名，例如 `Dijkstra 最短路径`、`广度优先搜索（BFS）`，避免 1280px 侧栏换行拥挤。
- 完整名称与短名各自维护 28 个算法 ID；不在模板里拼接英文和中文，防止切换语言后重复。

## 6. 实际展示结果

### Dijkstra

- 页面 h1：`Dijkstra（迪杰斯特拉）最短路径算法`
- 导航短名：`Dijkstra 最短路径`
- 导学术语块：
  - `松弛操作（Relaxation）`
  - `dist（Distance，当前最短距离估计）`
  - `Dijkstra 状态：discovered（已发现，距离待定）、settled（已确定，最短距离已锁定）、in-heap（在堆中）`
  - `前驱指针（previous / predecessor，记录最短路径树中的上一个顶点）`
- 导学首段：`BFS（广度优先搜索）只能处理边权相同的最短路径……Dijkstra（迪杰斯特拉）算法维护……`

### ADT

- 理论页 h1：`抽象数据类型（ADT）`
- 术语块：
  - `ADT（Abstract Data Type，抽象数据类型）`
  - `栈操作：push（压栈）、pop（弹栈）、peek / top（查看栈顶）、isEmpty（判空）`
- 不把 ADT 解释成某种具体结构实现；页面用栈举例时，`push/pop/top/isEmpty` 也在首屏一并解释。

### BFS / DFS

- BFS h1：`广度优先搜索（BFS，Breadth-First Search）`
- BFS 导学定义：`BFS（Breadth-First Search，广度优先搜索）……`
- BFS 术语块：`FIFO（First In First Out，先进先出）`、`边界集合（Frontier，待访问顶点集合）`、`BFS 状态：discovered（已发现，已入队）、visited（已访问，已处理）`
- DFS h1：`深度优先搜索（DFS，Depth-First Search）`
- DFS 术语块：`LIFO（Last In First Out，后进先出）`、`边界集合（Frontier，待访问顶点集合）`、`DFS 状态：discovered（已发现，已入栈）、visited（已访问，已处理）`
- 图错误提示：`FRONT（队首）/ REAR（队尾）与 TOP（栈顶）`

### 其他已补全内容

- 教材标题：`Dijkstra 算法` → `Dijkstra（迪杰斯特拉）算法`；`Prim 算法` → `Prim（普里姆）算法`；`Kruskal 算法` → `Kruskal（克鲁斯卡尔）算法`；`Floyd 算法` → `Floyd（弗洛伊德）算法`；`Bellman-Ford（扩展）` → `Bellman-Ford（贝尔曼—福特）算法`；`折半查找判定树与 ASL` → 补全平均查找长度。
- 动态状态：`EMPTY` → `空槽（EMPTY）`、`OCCUPIED` → `占用（OCCUPIED）`、`DELETED` → `已删除（DELETED）`、`SORTED` → `已排序（SORTED）`。
- 栈/队列操作：`push（压栈）`、`pop（弹栈）`、`peek（查看栈顶）`、`enqueue（入队）`、`dequeue（出队）`、`front（查看队首）`。
- 稀疏矩阵新增 `三元组表（Triple Table）`、`CSR（Compressed Sparse Row，压缩稀疏行）`。
- 静态树表新增 `ASL`、`WPL`、`BST`、`AVL` 四条同页解释。
- 线索二叉树新增 `ltag / rtag` 线索标志解释。
- 倒排索引新增 `Posting（倒排项）`、`AND / OR` 逻辑运算解释。
- 空闲块合并新增 `isolated / left-free / right-free / both-free` 状态解释。

## 7. 没有术语块但已完成审查的页面

这些页面没有建立术语块，不是因为扫描器不再匹配，而是逐页人工检查后确认没有需要额外解释的学生可见专业英文术语，或相关字段已在紧邻正文中用中文定义。

算法页（14）：

`bubble`、`insertion`、`selection`、`binary`、`linear`、`seqlist`、`factorial`、`fib`、`gl-depth`、`gl-copy`、`sparse-transpose`、`static-linked-list`、`polynomial-add`、`tournament`

理论页（13）：

`array-basics`、`special-matrices`、`circular-queue`、`tree-storage`、`forest-conversion`、`static-linked-list`、`sequential-list-capacity`、`stack-recursion`、`dynamic-storage-overview`、`boundary-tag-method`、`file-basics`、`sequential-file`、`multi-table-file`

判定理由：

- `circular-queue` 的 `front / rear / count / capacity`、`tree-storage` 的 `firstChild / nextSibling`、`static-linked-list` 的 `next / freeHead`、`sequential-list-capacity` 的 `length / capacity` 都是代码字段名，首次出现时已有紧邻中文定义；不把它们升级为独立音译术语。
- `array-basics` 只出现 C / C++ / Fortran / MATLAB 等语言正式名称。
- `special-matrices`、`forest-conversion`、`dynamic-storage-overview`、`boundary-tag-method`、`file-basics`、`sequential-file` 的拉丁字符主要是公式变量、记录字母或局部字段。
- `stack-recursion` 的 `factorial` 是函数名，`gl-depth` / `gl-copy` 的 `Depth` / `Copy` 是程序入口名，均属代码标识。
- `multi-table-file` 的 `ID` 是记录标识符，页面正文写作“记录 ID”，按技术标识保留。
- `polynomial-add` 已用中文“系数 coef、指数 exp”解释字段，保留代码字段本身。
- `bubble`、`insertion`、`selection`、`binary`、`linear`、`seqlist`、`tournament` 的英文命中为代码、语言名或 `O(...)` 复杂度记号，没有新的专业缩写。

## 8. 状态判定

### 已正确解释

- 46 个算法页、43 个理论页有可见术语块。
- 100 条被引用词典条目均有中文名称与必要英文全称。
- `ADT`、`BFS`、`DFS`、`Dijkstra`、`LIFO`、`FIFO`、`LSD`、`MSD`、`MST`、`DAG`、`SCC`、`CSR`、`ASL`、`WPL` 这些高风险误读术语已按教材含义核对。

### 本轮补全

- 新建词典与术语组件。
- 补全 60 份导学中的关键算法定义，重点是图算法、串匹配、AVL、DAG、SCC、关节点、ISAM。
- 补全操作标签、堆状态、哈希槽位状态、BFS/DFS 状态、Dijkstra 的 `dist/settled/previous`。
- 完成 28 个算法完整名、28 个短名和 15 个教材标题覆盖。

### 合理保留英文

- 代码标识、公式变量、Trace 字段、语言名、库名、产品名、URL、示例输入与代码片段。
- 这些内容不是学生需要翻译的专业术语，改动会破坏代码或教学语义。

### 人工确认后的译法约定

- `Lomuto` → 正式展示“Lomuto 分区法”；首次出现可补充“洛穆托分区法”，不将“洛穆托”作为固定正式名称。
- `Floyd–Warshall` → “弗洛伊德—沃舍尔”；首次介绍使用“Floyd–Warshall（弗洛伊德—沃舍尔）算法”，明确上下文后可用“Floyd 算法”简称。
- `Trie` → “字典树（Trie，又称前缀树）”；“键树”保留为教材相关别名，只在键树等概念对应准确的页面展示。
- `AVL` → 音译“阿德尔森—韦尔斯基与兰迪斯”仅保存在词典 `transliteration` 字段，界面不展示；避免标题过长。

### 真正遗漏

本轮审查范围内未确认仍存在“学生可见、未被解释、且不是代码/公式标识”的专业英文缩写。该结论来自逐页人工检查，不以正则不再命中为唯一依据。

仍需明确说明的边界：

- 14 个算法页与 13 个理论页没有术语块，原因已逐类列出，不是扫描失败。
- 页面中的 `O(...)` 是复杂度数学记号，由首页/复杂度理论页和每页复杂度栏承担解释；没有为 60 个算法页机械追加同一个 Big O 卡片。
- `ID`、`SQL`、`heapq`、`TreeNode`、`frameId` 等保留英文，理由见第 3 节 E 类。

## 9. 版面与双语影响

- 术语块桌面双列，`max-width: 720px` 以下单列；`overflow-wrap: anywhere`，不产生页面横向溢出。
- 长术语放在标题下方术语块或导学首段，不强行塞入 h1。390px 下 Dijkstra h1 会自然换成两行，但与标签、按钮无重叠。
- 导航统一使用短名，避免 1280px 侧栏出现多行拥挤。
- 英文模式：`TermGlossary` 返回 `null`；教材标题、算法名、组标签、导学正文保持英文原值。语言切换不会拼接中英文术语。
- 动态 Trace：只改中文展示层的状态词映射，Trace payload、字段值、Python 逻辑和回退帧均未改。

## 10. 测试与截图

本地结果：

| 项目 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过 |
| `npm test` / `npx vitest run` | 167 个文件，1632 项测试全部通过 |
| `npm run build` | 通过；仅保留 zod 注释被 Rollup 移除的既有无害警告 |
| `npx playwright test e2e/i18n-terms.spec.ts` | 5 / 5 通过，30.5s |

说明：一次与 `npm run build` 并行执行的全量 Vitest 中，`ReferenceCodePanel` 的 hash-chain 动态导入用例等待 1s 未完成而超时；该用例单独复跑通过，随后顺序执行全量 Vitest 也全部通过。失败原因是并行构建造成的模块加载时序抖动，测试门禁未被删除或放宽。

Playwright 覆盖：

- 中文首页、ADT、Dijkstra、BFS、DFS、B 树、快速排序、Floyd–Warshall、键树、稀疏矩阵、静态树表。
- 390px 与 1280px 全页截图与无页面横向溢出。
- 360 / 390 / 768 / 1280 / 1440 多视口无横向溢出。
- 英文模式无中文术语、标题保持英文、组标签保持 `GRAPH`。
- Dijkstra 术语块加入后仍能执行真实 Trace，进度显示 `1 / N`。
- 人工确认项：快速排序显示 `Lomuto 分区法`，Floyd–Warshall 首屏使用全名，键树页显示 `字典树（Trie，又称前缀树）`；三者无横向溢出。

截图目录：`test-results/i18n-terms01/`，共 29 张全页 PNG。`test-results/` 被 `.gitignore` 忽略，不进入提交。

关键截图：

- `390-dijkstra.png`：Dijkstra 完整名、4 条术语、短名导航与移动端单列布局。
- `390-adt.png`：ADT 页中文优先标题，以及“ADT 全称 + 栈操作”两条术语。
- `390-bfs.png` / `390-dfs.png`：BFS 与 DFS 各自的 FIFO/LIFO、Frontier 和状态术语，未重复或混用。
- `390-quick-sort.png`：`Lomuto 分区法` 术语与说明，未再使用“洛穆托划分”作为正式名。
- `390-floyd-warshall.png`：首屏 `Floyd–Warshall（弗洛伊德—沃舍尔）全源最短路径算法`。
- `390-key-tree.png`：`字典树（Trie，又称前缀树）` 术语与键树课程标题并存，概念对应准确。
- `390-static-tree-table.png`：ASL/WPL/BST/AVL 四列术语在 390px 下完整换行。
- `390-sparse-matrix.png`：CSR 与三元组表术语块。
- `1280-dijkstra-en.png`：英文模式无中文术语，组标签为 `GRAPH`。

## 11. 初次交付与公网验收

- 功能提交：`4fb1b105be9ed13f3fb134d412cb4abf1f343dec`（`feat(i18n): add Chinese terminology glossary and audit`），已推送到 Gitee `origin/main` 与 GitHub `github/main`。
- 2026-11-24 人工确认后的增量修订见第 12 节，并随最新 `main` 提交交付；初次部署记录如下。
- GitHub Actions `CI`：run `45379622864`，结论 success。
- GitHub Actions `Deploy AlgoViz to GitHub Pages`：run `45379622633`，结论 success。
- 公网中文页复核（2026-11-24）：`https://vvvi734.github.io/AlgoViz/` 首页标题为“数据结构的基本概念”，术语块显示“数据结构（Data Structure）”；Dijkstra 页标题为“Dijkstra（迪杰斯特拉）最短路径算法”，术语块显示松弛操作、`dist`、Dijkstra 状态和前驱指针。
- 未创建 `v1.0.0` Tag，未发布 GitHub Release。

## 12. 人工确认结论（2026-11-24）

上一版列出的 5 项问题已全部确认，处理如下：

1. `Lomuto`：课程主要使用“Lomuto 分区法”。术语块已由 `Lomuto（洛穆托）划分` 改为 `Lomuto 分区法`；首次出现可补充“洛穆托分区法”，但不将音译作为必用正式名称。`sortingNoteQuick` 原本已使用“Lomuto 分区”，无需改动。
2. `Floyd–Warshall`：采用“弗洛伊德—沃舍尔”。算法详情页标题已改为 `Floyd–Warshall（弗洛伊德—沃舍尔）全源最短路径算法`，导学首次定义同步使用该名称；教材目录与导航中的 `Floyd 算法`、`Floyd 全源最短路径`保留为简称。
3. `ADT`：理论页标题保持 `抽象数据类型（ADT）`；`ADT（Abstract Data Type，抽象数据类型）` 继续放在首屏术语说明中，未把英文全称塞入主标题。
4. `Trie`：术语标签已改为 `字典树（Trie，又称前缀树）`；“键树”保留在键树算法与对应教材标题中，只在概念对应准确时出现，不要求每个页面重复。
5. 六个备用算法名：Dijkstra、Bellman-Ford、Prim、Kruskal、Kahn、Kosaraju 不为提高词典覆盖率重复生成术语卡片；现有标题、导学或紧邻正文已经承担解释，保持现状。

本轮只围绕上述三项译名（Lomuto、Floyd–Warshall、Trie）做最小文案修改；ADT 标题与六个备用算法名无代码改动。未新增术语面板，未改算法实现、Python Trace、参考代码、课程注册、英文模式或 SVG 教学语义。

## 13. 例外与未处理清单

不翻译且不进入术语块：

- C / C++ / Python / Fortran / MATLAB / SQL
- `heapq`、`Pyodide`、`Monaco`、`React`、`TypeScript`、`Vite`
- `TreeNode`、`GraphSnapshot`、`frameId`、`copyId`、`next` 等代码字段
- 公式变量 `n`、`m`、`V`、`E`、`i`、`j`、`k`、`dist` 等；其中 `dist` 在 Dijkstra/Floyd/Bellman-Ford 术语块中作为教学缩写解释，但公式本身不改
- 示例输入记录字母、节点编号、URL、文件路径、localStorage 键、npm 包名

这些例外不是遗漏，而是代码标识与教学术语的边界。若后续新增课程，仍应按本报告的分类规则逐页审查，不能仅依赖正则扫描。
