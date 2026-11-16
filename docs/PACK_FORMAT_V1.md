# `.algopack` 格式规范 v1

> 面向包作者、审阅者与未来的 MCP/工具集成方。本规范描述的每一个限制都由代码强制执行：
> 解析与校验的单一真源在 `src/domain/packs/`，运行时 ZIP 读取在 `src/runtime/packs/zip.ts`，
> 存储实现在 `src/runtime/packs/storage.ts`。规范与代码不一致时，以代码 + 测试为准，并应修正本文档。

## 1. 容器

`.algopack` 是一个**普通 ZIP 文件**（仅改扩展名），因此任何系统都能解压查看，便于审阅与代码托管。

- 只允许压缩方法 `0`（store）与 `8`（deflate）；拒绝加密条目、拒绝 ZIP64。
- 条目的 `uncompressedSize` 必须与实际解压长度一致，不符即 `size-mismatch`（防止声明值与真实内容不符）。
- 文件名必须是 UTF-8 编码、仅 ASCII 可见字符（`\x20-\x7e`），且与声明路径逐字一致。
- 每个条目必须是文本（严格 UTF-8 解码；含 `\u0000` 或非法字节即 `not-text`）。

## 2. 目录结构

```
algolens-search-basics.algopack
├── manifest.json          # 必需
├── LICENSE                # 必需（非空）
├── README.md              # 可选（给作者/审阅者看，不进 UI）
├── lessons/
│   └── binary-search.json # 1..20 个，必需至少 1 个
└── examples/
    └── binary-search.py   # 0..20 个，可选，惰性文本
```

路径白名单是**精确形状匹配**，不存在“其它文件随便放”的分支（`src/domain/packs/paths.ts`）：

| 类别 | 允许的形状 | 说明 |
| --- | --- | --- |
| manifest | `manifest.json` | 唯一，根目录 |
| license | `LICENSE` | 根目录，内容非空 |
| readme | `README.md` | 根目录 |
| lesson | `lessons/<slug>.json` 或 `lessons/<slug>/<slug>.json` | 最多一层子目录 |
| example | `examples/<slug>.py` 或 `examples/<slug>/<slug>.py` | 最多一层子目录 |

`<slug>` 只允许 `a-z0-9` 与 `-`，且以 `a-z0-9` 开头。以下路径一律拒绝（`unsafe-path`）：绝对路径（`/x`、`C:\x`）、任何 `..` / `.` / 空路径段、反斜杠、`//`、尾随 `/`、控制字符、非 ASCII 字符。长度上限 120 字符。大小写不敏感的重复路径（`Lessons/A.json` 与 `lessons/a.json`）视为同一文件并拒绝（`duplicate-path`）。

## 3. `manifest.json`

```json
{
  "packFormatVersion": 1,
  "packId": "algolens-search-basics",
  "version": "1.0.0",
  "name": { "zh": "查找算法入门", "en": "Search basics" },
  "description": { "zh": "……", "en": "……" },
  "author": "AlgoViz",
  "license": "MIT",
  "requiredTraceSchema": 1,
  "lessons": ["lessons/binary-search.json"],
  "examples": [
    { "path": "examples/binary-search.py", "lessonId": "binary-search-basics", "language": "python" }
  ]
}
```

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `packFormatVersion` | int | 必须等于 `1`（否则 `format-version`） |
| `packId` | string | `^[a-z0-9][a-z0-9-]*$`，≤64，全局稳定，也是 IndexedDB 主键 |
| `version` | string | SemVer（`1.0.0` / `1.0.0-beta.1`） |
| `name` | `{zh,en}` | 各 1..200 字符，双语必填 |
| `description` | `{zh,en}` | 同上 |
| `author` | string | 1..120 |
| `license` | string | 1..80，SPDX 风格短名；包内必须有非空 `LICENSE` |
| `requiredTraceSchema` | int | 必须等于当前应用 `TRACE_SCHEMA_VERSION`（本版为 `1`） |
| `lessons` | string[] | 1..20，每个都必须真实存在且通过 Lesson Schema |
| `examples` | object[] | 0..20；`path` 为 `examples/*.py`，`lessonId` 必须属于本包课程，`language` 固定 `"python"`，可选 `input` 覆盖算法预设输入 |

`manifest.json` 未声明的文件即使存在也不可用；声明了但缺失即报错（`missing-lesson-file` / `example-missing`）。**包内不存在可执行代码文件类型**：没有 `.js`、`.html`、`.sh`、`package.json`、动态模块。

## 4. 课程（Lesson）Schema

课程内容复用 Stage 3B 的 `src/domain/lessons/schema.ts`（Zod），**包系统不重写、不放宽**该 Schema。要点：

- `lessonId` 全局唯一（包内重复 → `lesson-duplicate`；跨包重复由注册表内置优先规则挡住）。
- `algorithmId` 必须存在于真实算法目录（`algorithmIds()`），否则 `algorithm-unknown`。
- 一个算法只能有一门课程：内置课程优先（`algorithm-builtin-conflict`），其他已装包已占用即 `algorithm-pack-conflict`。
- `steps[].stepId` 稳定、与语言无关；中文/英文共用同一 `stepId` 列表。
- `contentVersion` 是**课程内容**版本，与包版本独立（同一包升级可以不改课程文案）。

运行时关联：`TraceEvent.lessonStepId` 只能由 Python 执行时显式记录（`trace(..., lesson_step=...)`），UI 从不按 `message` 文本或算法名推断阶段；无法关联时显示“未关联”空态。

## 5. 资源限额（硬编码，先校验后解压）

| 限制 | 值 | 错误码 |
| --- | --- | --- |
| 压缩包大小 | 6 MiB | `file-too-large` |
| ZIP 条目数 | 64 | `too-many-entries` |
| 单条目声明解压大小 | 512 KiB | `file-too-large` |
| 总解压大小 | 3 MiB | `total-too-large` |
| 单条目压缩比 | ≤ 200:1 | `compression-ratio` |
| 路径长度 | 120 字符 | `path-too-long` |
| 课程数 | 20 | `manifest-invalid` |
| Python 示例数 | 20 | `manifest-invalid` |
| 单个 Python 源码 | 192 KiB | `file-too-large` |

解压不是一次性整体展开：中央目录先做纯策略检查（`checkArchiveEntries`），随后逐条目用 fflate `Inflate` 以 1 KiB 切片推进，**边解压边计数**，超过 `min(声明值, 512 KiB)` 立即中止（`size-mismatch` / `file-too-large`），最后核对实际长度与声明长度。因此“声明 1 KB、实际 5 MB”的 ZIP Bomb 不会分配超大内存。

## 6. 安装、替换与卸载

流程（全部在写入前完成校验）：

1. 选择文件 → 读取为字节（仅内存）→ ZIP 结构检查 → 路径策略 → 逐条目解压 → manifest 校验 → Lesson Schema → 冲突/兼容检查 → **预览**。
2. 用户在预览里确认（名称、版本、课程清单、是否含 Python 示例、执行风险提示）后才写入。
3. 写入是一个 IndexedDB 单事务（`packs` / `lessons` / `examples` 三 store）：要么全部落库，要么全部回滚。
4. 刷新页面后从 IndexedDB 恢复；浏览器清站点数据/隐私模式/存储回收会丢包，**不承诺永久保存**。
5. 卸载同样是单事务，只删除该包的课程与示例行，内置课程与其他包不受影响。

版本策略：

- 相同 `packId` + 相同 `version` → 拒绝（`already-installed`）。
- 相同 `packId` + 不同 `version` → 预览标记 `replaces: { version }`，UI 显示“将替换旧版本”，用户确认后以 `install(preview, { replace: true })` 在同一事务内删除旧行并写入新行。
- 不存在“静默覆盖”；也不存在跨包迁移（不搬迁用户自定义内容——本版没有用户内容）。

## 7. Python 示例的执行边界

- Python 源码导入时**只作为惰性文本存储**，不执行、不编译、不写磁盘。
- 用户点击课程里的「载入课程示例」只会把源码写进编辑器、切到 Python、填入 `input`，**不会自动运行**（`lab.applyCourseExample` 不含执行调用，App 级测试断言运行次数不变）。
- 只有用户再点击「运行」才进入既有 Pyodide Worker（限时、无网络请求、trace 限额同 Core）。
- **Pyodide 不是针对恶意 Python 的完整安全沙箱**：它能执行任意 Python 语义（文件系统虚拟、无宿主网络），但仍可耗尽 CPU/内存。信任边界是“用户主动运行自己选择的源码”，因此 UI 在预览阶段明示风险。

## 8. 错误码

域层只返回 `{ code, params }`，UI 用 `packErr.<code>` 双语插值，杜绝 “unknown error”。完整清单（`src/domain/packs/errors.ts`）：

- 容器：`not-a-zip` `empty-archive` `too-many-entries` `file-too-large` `total-too-large` `compression-ratio` `unsafe-path` `duplicate-path` `path-too-long` `unsupported-file` `unsupported-method` `encrypted-entry` `size-mismatch` `not-text`
- manifest：`missing-manifest` `manifest-json` `manifest-invalid` `format-version` `pack-id` `version` `trace-schema`
- 课程：`missing-lesson-file` `lesson-json` `lesson-invalid` `lesson-duplicate` `algorithm-unknown` `algorithm-builtin-conflict` `algorithm-pack-conflict`
- 示例/许可：`example-missing` `example-invalid` `missing-license`
- 安装：`already-installed` `version-conflict` `storage-unavailable` `storage-quota` `storage-failed` `file-read-failed`

## 9. 许可证与版权

- 包内必须携带 `LICENSE`（非空），`manifest.license` 只是短标识，二者应一致。
- 若课程文案/示例改编自第三方，必须在 `README.md` 注明来源与许可证，并保留要求的版权声明。AlgoViz 官方示例包为原创内容，MIT。
- Core 只存储与展示文本，不主张对第三方内容的版权。

## 10. 未来扩展（未实现，仅记录边界）

本版**不**支持自定义渲染器、第三方 JS/CSS、远程仓库、自动下载、包签名与包间依赖。若要加入，必须先扩展 `packFormatVersion`（例如 2），并同步更新本文件第 2/3/5 节与 `scripts/validate-pack.ts`。
