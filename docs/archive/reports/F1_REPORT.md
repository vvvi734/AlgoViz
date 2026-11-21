# F1 交付报告 · 顺序查找 / 二分查找

状态：**已完成并停止**（真实 Python Trace、独立查找语义、双语课程、独立 CPython 参考、专项单测、真实 Pyodide E2E、全量回归、生产构建与截图）。

- 分支：`feat/f1-searching`
- 基线：`1e17dfe docs(s2): record final progress chip fix and gates`
- 版本：`0.24.0-f1`
- F1 完成后不进入 F2，不开发哈希表、BST/AVL 新功能、图论定理、AI/MCP 或任意用户 Python 自动可视化

## 1. 实现摘要

### 1.1 复用入口与共享基础设施

`legacy/algorithm-definitions.js` 已有 `linear`、`binary`，均属 `search` 分组。本次复用这两个 ID，没有新增同名入口；只把 `linear` 显示名从「线性查找」改为「顺序查找」，并重生成 catalog/messages/fixtures。

复用既有数组绘制基础、Python Trace、Timeline 播放器、课程注册表与教材目录；查找状态由新的 `SearchVisualModel` 独立推导，不表现成排序交换动画，也没有第二套播放器或 Trace Schema 大重构。

### 1.2 顺序查找

- 官方输入：`nums=[6,3,9,2,7,4]`，`target=7`
- 官方 Trace：12 帧；第 10 帧比较 `p4=7`，第 11 帧 `found` 索引 4
- 操作：`init → scan-start → scan-compare → 不匹配 scan-next → found/not-found`
- 从索引 0 向左到右逐项比较，返回**首次遇到的匹配位置**
- 视觉区分：已检查前缀、当前比较元素、未检查后缀、命中元素；`checked` 数从上一帧真实前缀推导
- 空数组只产生 `init + not-found` 两帧，不伪造柱子

### 1.3 二分查找

- 官方输入：`nums=[1,3,5,7,9,11,13]`，`target=9`
- 官方 Trace：10 帧；`[0,6] → mid3(7<9) → left=4 → [4,6] → mid5(11>9) → right=4 → [4,4] → mid4(found)`
- 真实迭代 `while left <= right`，`mid=(left+right)//2`
- 操作：`binary-init / binary-mid / binary-compare / binary-exclude-left / binary-exclude-right / binary-found / binary-not-found / invalid`
- 排除区间完全由真实 Python `left/right` 变化驱动；左边界 `L`、右边界 `R`、中点 `MID` 与当前有效区间同帧显示，被排除半区淡色
- `left<=right` 保证最后一个候选元素仍被比较；失败帧满足 `left>right`，`result=-1`
- 重复值按普通“找到任意一个匹配位置”语义，不保证第一个或最后一个；课程与讲解明确说明
- 无序输入不偷偷排序：只发 1 帧 `invalid`，`reason='unsorted'`，不携带 `left/right/mid/range`，页面显示前提警告

### 1.4 UI、讲解与课程

- `SearchVisual.tsx` 复用 `.bars/.bar-item/.bar` 数组基础，增加目标值、已检查/排除/候选数量、当前区间、`L/R/MID` chip、成功/失败结果与查找图例。
- 找到帧只显示单个 `✓`；存在 `mid` 时只显示 `MID`；`left===right` 且无 `mid` 时显示合并 `L=R`，避免标记叠字。
- `frameInsight.ts` 增加 search 分支，逐帧给出 action / why / 真实状态变化 / 记忆重点；二分排除帧展示 before→after 区间、MID 与比较关系。
- 课程：
  - `linear-search-basics`，5 步 `init / scan-start / scan-compare / scan-next / done`
  - `binary-search-basics`，5 步 `init / binary-mid / binary-compare / binary-narrow / done`
  - 两门课程中英双语，均含一句话理解、核心思想、5 个阶段、复杂度、常见错误与记忆重点；`binary` 明确有序前提、`left<=right`、重复值语义与无序处理。
- 教材第 8 章「查找」沿用既有 `sequential-search → linear`、`ordered-search → binary`，未改章节结构、顶部导学或页面布局。
- 导学阶段数与真实课程一致，不存在“0 个阶段却有完整步骤”。

### 1.5 知识包回归

`linear` / `binary` 在 F1 后已有内置课程，旧官方示例包把它们当作“无内置课程”载体，触发 `algorithm-builtin-conflict`。按“知识包不可覆盖内置课程”的既有规则，官方示例包迁移为：

- `packs/src/algolens-fib-basics`：`packId=algolens-fib-basics`，`fibonacci-basics → fib`，5 步 `init / compare / recurse / combine / done`
- 归档 `packs/algolens-fib-basics.algopack`：5 文件、5,502 B，解包 10,431 B，校验通过
- 旧 `algolens-search-basics` 源文件与归档已删除
- Pack/MCP/浏览器 E2E 夹具迁移到 `fib`；`fib` 因此成为当前唯一无内置课程的目录安全回退入口

## 2. 正确性与验收

| 项 | 结果 |
| --- | --- |
| 独立 CPython 参考 | ✅ `scripts/verify_search_python.py` 143/143 帧、23 组输入，逐帧对照独立参考，不依赖预设答案 |
| 覆盖场景 | ✅ 成功、失败、空数组、单元素、首元素命中、末元素命中、重复值、负数、中间目标、回退/跳帧 |
| 顺序查找额外 | ✅ 无序数组正确；返回首次匹配；已检查前缀状态逐帧正确 |
| 二分查找额外 | ✅ 每次排除区间不含目标；左右边界变化正确；最后一个候选不被遗漏；失败时 `left>right`；重复值返回合法索引；无序只发 `invalid` |
| fixtures | ✅ 默认 12+10=22 帧；边界 121 帧；全部通过 Zod `structureSchema` 与 `searchSnapshotSchema` |
| 专项单测 | ✅ `search.test.ts` 10、`searchVisual.test.tsx` 6、`searchLessons.test.ts` 5、`searchInsight.test.ts` 3，合计 24/24 |
| 全量单测 | ✅ 100 个文件、819 tests 全部通过 |
| 类型检查 | ✅ `npm run typecheck` 通过 |
| 生产构建 | ✅ `npm run build` 通过；版本 `0.24.0-f1` |
| F1 真实 Pyodide E2E | ✅ 2/2；真实浏览器执行官方 Python，无预写帧 |
| 全量 E2E | ✅ 138/138（F1 前 136 条基线 + 2 条 F1；6 条既有夹具用例迁移后通过） |
| 官方知识包 E2E | ✅ 2/2；Fib 包安装/课程/卸载与 Python 示例真实运行通过 |
| 回归 | ✅ 既有排序、树、图、栈/队列/链表、BST/AVL、堆、哈夫曼、会话与 AI 导师用例全部通过 |
| 响应式 | ✅ `390×844` 下两种查找均无横向溢出 |

真实 Pyodide E2E 重点：

- linear：第 10 帧比较 `p4=7`、`checked=4/6`、`p5` 未检查；第 11 帧 found 索引 4；前后跳帧状态一致。
- binary：第 3 帧排除左半区 `left=4/right=6`、`excluded=4`、L/R/MID 可见；第 9 帧 found 索引 4；前后跳帧状态一致。
- 无序输入 `[3,1,2], target=2`：1 帧 invalid、警告可见、没有 range/L/MID。

## 3. 截图

| 文件 | 内容 |
| --- | --- |
| `docs/f1/linear-compare-1440-light.png` | 顺序查找第 11/12 帧，`p4=7` 当前比较，已检查 4/6，`p5` 未检查 |
| `docs/f1/linear-found-1440-light.png` | 顺序查找最终态，`p4=7` 绿色 found，结果索引 4 |
| `docs/f1/binary-narrow-1440-light.png` | 二分查找第 4/10 帧，排除左半区 `left=4/right=6`，`p0..p3` 淡色，区间 `[4,6]` |
| `docs/f1/binary-found-1440-light.png` | 二分查找最终态，`mid=4`，`p4` 绿色 found，候选 1 个，单个 `✓` 无重叠 |

## 4. 已知限制

- 只实现官方 `linear` 顺序查找与 `binary` 迭代二分；不实现哈希表、冲突处理、跳表、插值查找、指数查找或其他变体。
- 二分查找采用“任意一个匹配位置”语义；重复值不保证首个/末个匹配。
- 无序输入不会自动排序后继续二分；只显示前提警告与 `invalid` 帧。
- 用户改写后的任意 Python 代码不会自动获得通用查找可视化。
- 知识包不能覆盖内置课程；旧 `algolens-search-basics` 包已迁移为 `algolens-fib-basics`，旧的同名外部包不能再用 `binary` 内置课程载体安装。
- 4 张证据截图均为 1440 Light；390 只做无溢出断言，未额外保存移动端截图。
- 本批次未引入外部源码；顺序查找与迭代二分均按教学语义独立编写。

## 5. 构建产物

- `dist/assets/index-B6D540Fj.js` 1,694.24 kB（gzip 479.35 kB）
- `dist/assets/monaco-setup-CAbsRbAx.js` 4,122.24 kB（gzip 1,066.60 kB）
- `dist/assets/index-55iv9UmO.css` 194.97 kB（gzip 32.10 kB）
- `dist/assets/monaco-setup-CX3ij07K.css` 186.75 kB（gzip 27.79 kB）

## 6. Git

- 分支：`feat/f1-searching`，从 `1e17dfe` 建立
- 实现提交：`61dddc3 feat(f1): add real Python linear and binary search visualizations`
- 远端：`https://gitee.com/vvvi734/algolens.git`
- 未直接修改 `main`；F1 完成后停止，不自动进入 F2
