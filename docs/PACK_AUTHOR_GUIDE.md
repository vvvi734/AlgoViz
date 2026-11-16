# 知识包作者指南（`.algopack` v1）

本文只讲“怎么做出一个能装的包”。规范细节见 [PACK_FORMAT_V1](PACK_FORMAT_V1.md)。

## 0. 先决条件

- 目标算法必须已存在于 AlgoLens（真实 id 见 `src/domain/algorithms/`，例如 `bubble` `binary` `linear` `factorial`）。
- 目标算法**还没有内置课程**才能被包接管。内置课程（当前为 `bubble`、`factorial`）永远优先，包对其声明课程会被拒绝（`algorithm-builtin-conflict`）。
- 需要一门课程，包含 3～6 个教学阶段，中英文都要写。

## 1. 目录骨架

```
packs/src/my-pack/
├── manifest.json
├── LICENSE
├── README.md
├── lessons/
│   └── my-course.json
└── examples/
    └── my-example.py
```

参考官方示例：`packs/src/algolens-search-basics/`。

## 2. 写 manifest

```json
{
  "packFormatVersion": 1,
  "packId": "my-pack",
  "version": "1.0.0",
  "name": { "zh": "我的知识包", "en": "My pack" },
  "description": { "zh": "中文说明", "en": "English description" },
  "author": "你的名字",
  "license": "MIT",
  "requiredTraceSchema": 1,
  "lessons": ["lessons/my-course.json"],
  "examples": [{ "path": "examples/my-example.py", "lessonId": "my-course", "language": "python" }]
}
```

要点：

- `packId` 用小写与 `-`，发布后不要改（它是本地安装的主键）。
- `version` 用 SemVer；改课程文案但结构不变时递增次版本即可。
- `requiredTraceSchema` 必须等于当前 Trace Schema（v1）。Trace 协议升级后旧包会被明确拒绝，而不是悄悄错位。

## 3. 写课程

课程字段与 Stage 3B 完全一致（`src/domain/lessons/schema.ts`）。最小可用结构：

```json
{
  "lessonId": "my-course",
  "algorithmId": "binary",
  "contentVersion": "1.0.0",
  "title": { "zh": "二分查找：每次砍掉一半", "en": "Binary search: halve the problem" },
  "oneLiner": { "zh": "一句话说明", "en": "One sentence" },
  "overview": { "zh": "……", "en": "……" },
  "intuition": { "zh": "……", "en": "……" },
  "prerequisites": { "zh": ["数组与下标"], "en": ["Arrays and indices"] },
  "complexity": { "time": "O(log n)", "space": "O(1)", "note": { "zh": "……", "en": "……" } },
  "steps": [
    {
      "stepId": "init",
      "title": { "zh": "初始化区间", "en": "Initialise" },
      "explanation": { "zh": "……", "en": "……" },
      "tip": { "zh": "可选提示", "en": "Optional tip" }
    }
  ],
  "commonMistakes": { "zh": ["……"], "en": ["……"] }
}
```

`stepId` 是**教学阶段的稳定标识**，不要随文案改动而改；中英文共用同一套 id。

## 4. 写 Python 示例并绑定教学阶段

示例是一段普通 Python，但要让每个教学阶段都产生**真实帧**，否则面板会一直空着。使用 Core 提供的 `trace()`：

```python
def search(nums, target, left, right):
    trace({"type": "array", "values": nums, "focus": [left, right]},
          "初始化区间", line=9, variables={"left": left, "right": right},
          lesson_step="init")
    ...
```

规则：

1. `lesson_step` 必须是本课程 `steps[].stepId` 之一。
2. `line` 是当前源码行号（与编辑器里的真实行对齐，便于 Monaco 高亮）。
3. 想在单次运行里演示“命中”和“未命中”，就像官方包那样跑两轮查找（目标 9 命中、目标 10 未命中）。
4. 输入通过 `input`（编辑器里的 JSON）读取，或由 manifest 的 `examples[].input` 提供默认值；不要在导入时执行任何代码。

## 5. 打包与校验

```sh
npm run pack:build                       # 读取 packs/src/<name>/ 并写出 packs/<name>.algopack
npm run pack -- packs/<name>.algopack    # 真实解析 + 真实校验，失败 exit 1
```

`pack:build` 用 fflate `zipSync(level 9)`，路径统一为 `/`。`npm run pack` 跑的是与浏览器完全相同的 `readPackArchive` + `validatePack`，因此 CLI 通过即可在网页导入成功（仍需用户在预览里点确认）。

校验成功输出示例：

```
OK packs/algolens-search-basics.algopack
pack algolens-search-basics v1.0.0 (MIT)
files 5, bytes 11939, lessons 1, python examples 1
lesson binary-search-basics → binary (5 steps)
```

## 6. 常见报错与修法

| 报错 | 常见原因 | 修法 |
| --- | --- | --- |
| `unsafe-path` | 用了 `../`、绝对路径、反斜杠、中文目录名 | 只放在 `manifest.json` / `LICENSE` / `README.md` / `lessons/` / `examples/` 下，用 ASCII |
| `unsupported-file` | 放了 `.js`、`.png`、多级目录 | 删掉；第一版只接受文本类型的白名单文件 |
| `format-version` | `packFormatVersion` 不是 1 | 改成 1；未来版本需等 Core 升级 |
| `trace-schema` | `requiredTraceSchema` 与应用不匹配 | 改成当前版本（1） |
| `manifest-invalid` | 缺双语字段、`packId` 含大写、版本不是 SemVer | 按第 2 节逐字段核对 |
| `lesson-invalid` | 缺 `steps`、双语不一致、`stepId` 重复 | 对照 Lesson Schema；中文和英文阶段数量必须相同 |
| `algorithm-builtin-conflict` | 给 `bubble` / `factorial` 写课程 | 换一个没有内置课程的算法，或改为提交内置课程 PR |
| `algorithm-unknown` | `algorithmId` 写错（如 `binarySearch`） | 用真实 id：`binary` `linear` 等 |
| `example-missing` / `example-invalid` | manifest 声明了示例但文件缺失，或 `lessonId` 不属于本包 | 补齐文件或修正 `lessonId` |
| `compression-ratio` / `file-too-large` | 塞了大文件或高压缩比内容 | 精简文本；包是教学文本不是素材库 |
| `already-installed` | 同版本重复安装 | 递增 `version` 后重新安装（会走替换确认） |

## 7. 发布与合规

- 附带 `LICENSE`，并在 `README.md` 写明第三方素材来源与许可。
- 不要复制他人教程原文；AlgoLens 的课程文案与示例应为你自己的表达。
- 不要把用户数据、密钥或本地路径打进包。
- 安装完全在用户浏览器本地完成：没有服务器、没有账号、没有远程市场。
