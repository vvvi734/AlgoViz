# Stage 4 报告 — 可安装教学知识包系统（`.algopack` MVP）

> 版本 `0.5.0-phase4` ｜ 代码提交 `6d4c814` ｜ 基线 HEAD `7a7f81b`（Stage 3B）
> 本报告只陈述真实执行结果；未实现的能力一律标为未完成，不以设计代替实现。

## A. 18 项验收矩阵

| # | 验收项 | 状态 | 证据 |
| --- | --- | --- | --- |
| 1 | `.algopack` 文件格式明确且有文档 | ✅ | `docs/PACK_FORMAT_V1.md`（容器、manifest 字段、目录规则、限额、错误码） |
| 2 | Pack Schema 能运行时校验 | ✅ | `src/domain/packs/manifest.ts`（Zod）+ `validate.ts`；`manifest.test.ts` 11 项 |
| 3 | ZIP 导入具备资源和路径安全限制 | ✅ | `archive.ts` 中央目录策略 + `runtime/packs/zip.ts` 有界解压；`archive.test.ts` 12 项、`zip.test.ts` 9 项 |
| 4 | 知识包可以本地导入 | ✅ | 「知识包」页 `pack-file-input` → `usePacksController.importFile`；App 级测试 + E2E 用例 1 |
| 5 | 安装前有内容预览和确认 | ✅ | `pack-preview` 卡片：名称/版本/作者/许可/课程清单/示例数/替换提示/执行风险；必须点 `pack-preview-confirm` |
| 6 | 已安装包持久保存到 IndexedDB | ✅ | `runtime/packs/storage.ts`，`algolens-packs` v1 三 store 单事务；`storage.test.ts` 9 项 |
| 7 | 刷新后可以恢复 | ✅ | App 级「同一 IndexedDB 重建 React 树」测试 + E2E 用例 1 的 `page.reload()` |
| 8 | 可以安全卸载 | ✅ | 卸载走确认按钮；单事务删除该包行；`uninstall` 后 `pack-empty` 出现，E2E 覆盖 |
| 9 | 内置课程不会被外部包覆盖 | ✅ | `validate.ts` 的 `algorithm-builtin-conflict` + App 级「cannot override a built-in course」测试 |
| 10 | 安装后的课程进入现有查询与展示流程 | ✅ | `createLessonCatalog` 组合目录；`pack-open-binary` 打开 `binary` 课程，`lesson-origin` 显示包名 |
| 11 | 官方示例 `.algopack` 真实可用 | ✅ | `packs/algolens-search-basics.algopack`（6100 B / 5 条目），CLI 校验 OK，E2E 真实安装 |
| 12 | 示例 Python 在明确用户操作后生成真实 Trace | ✅ | 载入示例不执行（断言运行次数不变）；点「运行」后 E2E 断言 `init` / `found` / `missing` 阶段来自真实 Pyodide |
| 13 | 中英文界面正常 | ✅ | 新增文案全部走 `messages.ts`（`packs*` 与 `packErr.<code>` 双语）；E2E/单测覆盖中文，i18n 键完整性由既有测试守住 |
| 14 | 三态主题正常 | ✅ | 新增 CSS 只用 tokens 变量；`tokens.test.ts`（无硬编码颜色）通过；E2E 主题用例通过 |
| 15 | 现有 14 个算法与已完成课程不回归 | ✅ | `npm run sync:legacy` 未产生文件变化；221 项既有单测全绿；9 条既有 E2E 全绿 |
| 16 | typecheck / 单元测试 / build 成功 | ✅ | `tsc -b` 0 错误；37 文件 298 项全通过；`vite build` 成功 |
| 17 | 真实浏览器 E2E 通过 | ✅ | `11 passed (39.2s)`，含 2 条新增 Stage 4 用例（真实 Pyodide） |
| 18 | 文档完整、Git 状态清楚 | ✅ | 本报告 + `PACK_FORMAT_V1` / `PACK_AUTHOR_GUIDE` + README / ARCHITECTURE 更新；提交与推送见 J 节 |

## B. 修改文件清单

**新增（域层，纯逻辑）**

| 文件 | 作用 |
| --- | --- |
| `src/domain/packs/types.ts` | `PACK_FORMAT_VERSION=1`、`PACK_LIMITS`、manifest/preview/installed 类型 |
| `src/domain/packs/errors.ts` | 38 个稳定错误码 + `PackResult` / `packError` / `describeErrors` |
| `src/domain/packs/paths.ts` | 路径结构安全 + 精确白名单 + 大小写不敏感同一性 |
| `src/domain/packs/manifest.ts` | manifest Zod schema、格式版本、声明路径/重复检查 |
| `src/domain/packs/archive.ts` | 中央目录元数据策略 `checkArchiveEntries`（条数/大小/压缩比/方法/加密/ZIP64/重复名） |
| `src/domain/packs/validate.ts` | 内容校验 + 预览构建（Lesson Schema 复用、算法/内置/跨包冲突、许可、示例关联、版本） |

**新增（运行时 / 功能 / 测试 / 脚本 / 内容）**

| 文件 | 作用 |
| --- | --- |
| `src/runtime/packs/zip.ts` | 自研中央目录解析（EOCD 反扫）+ fflate `Inflate` 1 KiB 切片限量解压 + 严格 UTF-8 |
| `src/runtime/packs/storage.ts` | IndexedDB 三 store 单事务安装/替换/卸载 + 错误映射 + 不可用降级 |
| `src/domain/lessons/catalog.ts` | `createLessonCatalog(packs)`：内置优先、每包独立校验、`originOf`/`byPack` |
| `src/features/packs/usePacksController.ts` | 导入/预览/确认/替换/卸载状态机；存储注入以便测试 |
| `src/features/packs/PacksView.tsx`、`packText.ts` | 知识包页面与错误码插值文案 |
| `src/test/packs.ts` | 测试夹具：`lessonFixture` / `manifestFixture` / `packFileSet` / `zipOf` |
| `src/domain/packs/{manifest,archive,validate}.test.ts`、`src/runtime/packs/{zip,storage}.test.ts`、`src/domain/lessons/catalog.test.ts`、`src/features/packs/PacksView.test.tsx`、`src/app/App.stage4.packs.test.tsx` | 77 项新增测试 |
| `packs/src/algolens-search-basics/`（manifest / lessons/binary-search.json / examples/binary-search.py / LICENSE / README.md） | 官方示例包源（原创，MIT） |
| `packs/algolens-search-basics.algopack` | 构建产物（6100 B，5 条目；提交入库以便“下载即用”） |
| `scripts/build-pack.mjs`、`scripts/validate-pack.ts` | 打包与校验 CLI（`npm run pack:build` / `npm run pack -- <file>`） |
| `e2e/packs.spec.ts` | 2 条真实浏览器用例 |
| `docs/PACK_FORMAT_V1.md`、`docs/PACK_AUTHOR_GUIDE.md`、`docs/STAGE4_REPORT.md` | 规范、作者指引、本报告 |

**修改**

| 文件 | 变更 |
| --- | --- |
| `src/app/App.tsx` | 接入 `usePacksController`、`packs` 视图、`openCourse`；向 LabView 传 catalog/origin/example |
| `src/app/types.ts`、`src/components/NavTabs.tsx` | `ViewName` 增加 `packs`；第 4 个 tab（并补 `nav-<id>` testid） |
| `src/features/lab/LabView.tsx` | 改为接收注入的 `LessonCatalog`，透传 `packOrigin` / `courseExample` |
| `src/features/lab/LessonPanel.tsx` | 包来源标签 + 「载入课程示例」按钮 |
| `src/features/lab/useLabController.ts` | `applyCourseExample(code, input)`：只加载，不执行 |
| `src/i18n/messages.ts` | EXTRA.zh/en 新增知识包与全部 `packErr.<code>` 文案 |
| `src/styles/app.css` | 追加知识包页样式（仅 tokens） |
| `package.json` / `package-lock.json` | `fflate@^0.8.3`、`fake-indexeddb@^6.2.2`、`pack`/`pack:build` 脚本、版本 `0.5.0-phase4` |
| `README.md`、`docs/ARCHITECTURE.md` | Stage 4 能力矩阵、命令、目录、3.7 节设计说明、演进顺序 |

**删除**：无。

## C. `.algopack` 文件格式

ZIP 容器，仅允许 5 类文件：`manifest.json`、`LICENSE`、`README.md`、`lessons/<slug>.json`（可一层子目录）、`examples/<slug>.py`（可一层子目录）。manifest v1 必填 `packFormatVersion` / `packId` / `version`(SemVer) / `name`(zh,en) / `description`(zh,en) / `author` / `license` / `requiredTraceSchema` / `lessons[]`，可选 `examples[]`（`path` + `lessonId` + `language:"python"` + 可选 `input`）。

课程沿用 Stage 3B 的 Lesson Schema（`lessonId` / `algorithmId` / `contentVersion` / 双语 `title` `oneLiner` `overview` `intuition` `prerequisites` `complexity` / `steps[]`（`stepId`+`title`+`explanation`+`tip`）/ `commonMistakes`），**包系统不放宽任何字段**。兼容机制：`packFormatVersion` 与 `requiredTraceSchema` 都是严格相等校验，格式或协议升级时旧包被明确拒绝而不是错位运行。详见 `docs/PACK_FORMAT_V1.md`。

## D. 安全设计

1. **不进磁盘**：ZIP 字节只存在于内存（`File` → `Uint8Array`），不写宿主目录，因此 Zip Slip 无落点。
2. **路径双重把关**：`paths.ts` 拒绝绝对路径 / `..` / `.` / 空段 / 反斜杠 / `//` / 尾斜杠 / 控制字符 / 非 ASCII / 超长；再用精确白名单确定文件类型，不存在“其它文件随便放”。
3. **元数据先行**：`checkArchiveEntries` 在解压前检查条目数、声明大小、压缩比、压缩方法、加密位、ZIP64、重复路径（大小写不敏感）。
4. **有界解压**：不用 `unzipSync`（无输出上限）；自研 EOCD 解析后逐条目用 `Inflate` 以 1 KiB 推进，边解压边计数，超过 `min(声明, 512 KiB)` 立即中止，最后核对实际长度 == 声明长度（`size-mismatch`）。1 MiB 级 ZIP Bomb 在测试中以受控小夹具验证限额逻辑，不构造真正耗尽资源样本。
5. **内容渲染安全**：课程文本只作为数据渲染（React 文本节点），没有 `dangerouslySetInnerHTML`，不接受 HTML/JS/CSS 资源。
6. **Python 边界**：示例导入时是惰性文本；UI 只在用户点「载入示例」+「运行」后进入既有 Pyodide Worker。**Pyodide 不是恶意 Python 的沙箱**，预览卡片与 README 均明示风险与信任边界。
7. **错误不吞**：所有失败返回结构化码（38 个），UI 用双语模板插值，杜绝 “unknown error”。

## E. IndexedDB 设计

- 数据库 `algolens-packs` v1：`packs`（keyPath `packId`，含 manifest、`installedAt`、`lessonIds`）、`lessons`（keyPath `[packId, lessonId]` + `by-pack` 索引）、`examples`（同结构）。
- **单事务原子性**：安装/替换/卸载都在一个 `readwrite` 事务里；旧行在事务外先读完（避免 `await` 让事务失活），事务内同步发出全部请求，再 `await transactionDone`。
- 失败语义：`QuotaExceededError` → `storage-quota`；其余写失败 → `storage-failed`；`indexedDB` 不存在 → `kind: 'unavailable'` 且安装抛 `storage-unavailable`（UI 禁用导入按钮）。
- 回滚有测试：往预览里塞不可结构化克隆的值让 `put` 中途抛错，断言旧版本行完好（`storage.test.ts`）。
- 边界：浏览器清理站点数据 / 隐私模式 / 存储回收会丢包，不承诺永久保存，也不上传服务器。

## F. 课程注册机制

`createLessonCatalog(packs)` 返回 `{ lessons, byId, byAlgorithm, byPack, originOf, has, builtinCourseAlgorithms, builtinLessonCatalog }`：

- 内置课程（冒泡、阶乘）先注册，`byAlgorithm` 命中即返回，包课程不可覆盖（`validate` 在导入阶段就已拒绝）。
- 每个包用既有 `createLessonRegistry` **独立校验**，损坏的持久化数据被跳过而不是让整页崩溃（`catalog.test.ts` 覆盖）。
- 一个算法一门课：同包内重复算法、跨包冲突都在导入阶段报 `algorithm-pack-conflict`；运行期再兜底“先到先得”。
- 卸载后 App 重建 catalog（`packs` 状态变化触发），`byAlgorithm('binary')` 回到 `undefined`，`LessonPanel` 显示 `lesson-no-lesson` 空态。

## G. 官方示例包

- 路径：`packs/src/algolens-search-basics/`（源）+ `packs/algolens-search-basics.algopack`（构建产物，6100 B / 5 条目）。
- manifest：`packId=algolens-search-basics`、`version=1.0.0`、`license=MIT`、`requiredTraceSchema=1`、1 门课程、1 个 Python 示例。
- 课程 `binary-search-basics` → `algorithmId=binary`（仓库中真实 id，Python 预设输入 `{nums:[1,3,5,7,9,11,13], target:9}`，原本无课程）。5 个阶段：`init` / `compare` / `narrow` / `found` / `missing`，5 个步骤都对应真实帧。
- 示例 `examples/binary-search.py` 跑**两轮查找**（目标 9 命中、目标 10 未命中），因此单次运行即可展示 `missing`；`line=` 与真实源码行对齐（9/17/22/29/38）。
- CLI 实跑输出：

```
OK packs/algolens-search-basics.algopack
  pack: algolens-search-basics v1.0.0 (MIT)
  name: 查找算法入门 / Search basics
  files: 5, bytes: 11939, lessons: 1, python examples: 1
  lesson binary-search-basics → binary (5 steps)
  example examples/binary-search.py → binary-search-basics
```

安装步骤（与 E2E 一致）：知识包页 → 选择该文件 → 预览（名称/版本/MIT/1 门课程/1 个示例/风险提示）→ 确认 → 卡片出现 → 「打开课程」→ 阅读双语内容 → 点「载入课程示例」→「运行」→ 真实 Trace 与 `init/compare/narrow/found/missing` 高亮同步 → 刷新仍在 → 卸载后课程消失、内置课程不受影响。

## H. 测试结果（真实执行）

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | exit 0，0 错误（版本升级后重跑） |
| `npm test` | **37 文件 / 298 项全部通过**（既有 221 + 新增 77：manifest 11、archive 12、validate 16、zip 9、storage 9、catalog 6、PacksView 10、App 4） |
| `npm run build` | 成功（`✓ built in 21.09s`，主包 430.08 kB，Monaco 分包 4.12 MB） |
| `npm run test:e2e` | **11 passed (39.2s)**：既有 9 条 + 新增 2 条（`e2e/packs.spec.ts`） |
| 真实 Pyodide | 是。E2E 用例 2 真跑包内 Python，断言 `init` → 点击 `found` 阶段跳帧 → 末帧 `missing` |
| Mock 使用 | 仅在 jsdom 组件/App 测试里 mock `runtime/execute`；ZIP 读取、IndexedDB（fake-indexeddb）、域校验均为真实执行 |
| `npm run sync:legacy` | 执行后 `git status` 无生成物变化，12 个旧算法帧快照未变 |
| 偶发失败 | 本次全部实跑无偶发；此前记录的“冷启动首跑偶发 1 例 jsdom 计时失败”未在本次复现，也未掩盖 |

## I. 已知问题

1. **无远程市场 / 无签名 / 无自动更新**：只能本地选文件；包的真实性靠用户信任（预览展示作者与许可，但不做加密验签）。
2. **升级只有“显式替换”**：同 `packId` 不同版本 → 预览标记替换 → 用户确认后单事务 delete+put；不迁移任何用户数据（本版没有用户数据）。
3. **卸载时若正停留在被卸载课程**：不强制切换算法，直接进入 `lesson-no-lesson` 空态（安全但略显突兀）。
4. **存储边界**：清站点数据/隐私模式/浏览器回收会丢包；IndexedDB 配额因浏览器而异，`storage-quota` 只是明确报错，不提供重试向导。
5. **Pyodide 非恶意代码沙箱**：包内 Python 仍需用户主动运行；高风险包要靠人工审阅。
6. **格式 v1 限制**：无自定义渲染器、无媒体资源、无包依赖、每包 ≤20 课/≤20 示例、单包 ≤6 MiB 压缩 / ≤3 MiB 解压。
7. **课程覆盖仍少**：内置仅 2 门；除示例包的 `binary` 外，`linear` / 数据结构 / 图 / DP 仍无课程。
8. **示例包为了“单次运行覆盖 5 个阶段”跑了两轮查找**，若改成单轮需重算 `missing` 的帧与文档描述。
9. **UI 细节**：知识包页未做移动端专项排版与 a11y（axe）审计；`packs/*.algopack` 二进制入库（6 KB，可接受，但每次改内容都会产生二进制 diff）。
10. **MCP / AI 未接入**：本阶段严格未开发。

## J. Git 状态

- 分支：`main`（跟踪 `origin/main`），远端 `https://gitee.com/vvvi734/algolens.git`。
- 基线 HEAD：`7a7f81b`（Stage 3B 文档回填）。
- 本阶段代码 + 文档提交：`6d4c814` — `feat(phase-4): installable .algopack packs with safe import and local install`。
- 工作区：提交后干净（`git status` 无输出）；本报告作为文档回填单独提交。
- 推送：使用普通 `git push`（无 force、无改写历史、不改远端地址）；推送结果在下一行回填。
  - 推送结果：待回填（见本次提交后的推送记录）。

## K. 下一阶段准备（仅评估，不实现）

| 能力 | 应放位置 | 理由 |
| --- | --- | --- |
| 课程查询（内置 + 包） | **Core**（`createLessonCatalog` 已就绪） | Agent 只需注入已安装包列表即可查询，无需新 API |
| 教学步骤元数据 | **Core**（Lesson 类型 + `stepId`） | 步骤语义属于内容层，MCP 只读 |
| 真实 Trace 读取 | **Core**（`useLabController` 的 `events` / `runId`） | Trace 是执行产物，Agent 不应自己造帧 |
| 打开本地可视化学习会话 | **Core + Adapter**：Core 暴露“选中算法/课程/帧”的意图，Adapter 负责工具调用 | 会话归属 UI 状态，工具层不直接改 UI |
| MCP 工具定义、鉴权、调度 | **MCP Adapter 层**（`mcp/` 新包） | 与浏览器运行时解耦，便于独立测试 |
| 包安装/卸载 | **Core**（已实现）；MCP 仅可调用 | 安装是本地事务，Agent 不应绕过预览确认 |
| 课程内容生成 / AI 讲解 | 后续 AI 层 | 本阶段无 AI 后端，禁止假装已有 |

关键约束：Agent 只能看到**已通过 Schema 校验并已安装**的课程；严禁让 Agent 直接执行包内 Python（执行必须经过用户点击与既有 Worker 限额）；若未来开放远程包，必须先解决签名与信任链，否则不得自动下载安装。
