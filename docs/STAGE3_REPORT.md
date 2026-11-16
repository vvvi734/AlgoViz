# AlgoLens Stage 3 开发总结

> 版本 `0.3.0-phase3` ｜ 阶段主题：Python 递归调用栈与局部变量同步可视化 + 时间轴重置缺陷修复 ｜ 本文所有数字均为本机实测，未使用估算或示例值。

## A. 完成情况总览

### 已完成

| 能力 | 说明 |
| --- | --- |
| `callStack` 协议扩展 | 在既有 Trace Event Schema v1 的 `callStack` 字段上补齐 `frameId / depth / arguments / locals / returnValue / status`，全部可选，旧 `{name, line}` 帧仍通过校验 |
| Python `@tracked` 真实追踪 | 装饰器包裹的函数在**进入**与**返回**时各发一条真实事件，携带完整调用栈快照，非静态预置数据 |
| 帧唯一标识 | 单调计数器发号 `f1, f2, …`，同一函数的两次调用是不同帧；`fib(4)` 中 `fib(2)` 被算两次，实测得到 `f3` 与 `f7` 两个不同 id |
| 逐层局部变量 | 每帧独立的 `locals`（深拷贝 JSON 快照），时间轴回退恢复历史栈，变量面板按选中帧切换作用域 |
| 调用栈面板 | `CallStackPanel` 栈式渲染，最深帧置顶并高亮为「当前帧」，点击任意帧切换变量作用域，含空态 |
| 作用域感知变量观察 | `SyncPanel.resolveScope()` 统一决定显示哪一帧的变量；选中帧已离栈时回退到当前活跃帧 |
| 阶乘 / 斐波那契示例 | `legacy/algorithm-definitions.js` 定义、生成器产出 Python 源码，均为真实可执行程序 |
| 时间轴重置修复 | 见 A.1，是本阶段收尾的核心缺陷修复 |
| 回归测试 | 单测 158 → **170**（23 个文件），E2E 6 → **7 条** |

### 部分完成

| 能力 | 现状 | 缺口 |
| --- | --- | --- |
| 递归可视化 | 调用栈以「每个事件一张静态栈快照」呈现 | 没有进出栈动画、没有栈帧折叠/展开，深栈靠面板内滚动 |
| 中英文案 | 新增面板与提示均已接入 `messages.ts` | 未做自动化文案一致性校验（现有 i18n 单测只覆盖键存在） |
| 浏览器验证 | E2E 用真实 Edge + 真实 Pyodide 验证阶乘/斐波那契 | 仅覆盖 Chrome 系；Firefox / Safari 未验证 |

### 未完成（本阶段明确不做，留待后续）

| 能力 | 原因 |
| --- | --- |
| 任意函数自动追踪 | 需要字节级 tracing 或 `sys.settrace`，会与 Pyodide 性能预算和事件限额冲突 |
| 异步 / 生成器调用帧 | `@tracked` 是同步装饰器，`await`、`yield` 期间的帧状态无法可靠表达 |
| Pyodide 离线化 | 仍从 CDN 加载（首次约 15 MB），离线时 Python 入口不可用；这是已知限制，不是已完成能力 |
| 树 / 图 / 动态规划可视化 | 属于下一阶段，本阶段未动 |
| AI 助教、题库扩充、Monaco 瘦身、练习页 Monaco | 明确排除在本阶段范围外 |

### A.1 `usePlayback` 时间轴缺陷（本阶段修复）

**真实原因。** 旧代码的重置副作用写成 `useEffect(() => setState(initialPlayback), [frames])`，但组件作用域内并不存在名为 `events` 的数组被引用，`frames` 被 TypeScript 解析为 `lib.dom.d.ts` 的全局声明 `declare var frames: WindowProxy`。因此：

- 类型检查通过（`tsc -b` exit 0），运行也不报错，CI 完全无感；
- 依赖恒为同一个 `window.frames` 对象，重置 effect **永不触发**；
- 用户拖到第 25/25 帧再切到 5 帧的二分查找，索引仍停在 24 → `events[24]` 为 `undefined`，舞台、变量、调用栈全部落到空状态。

**修复方式（先写测试再改码）。**

1. `src/domain/trace/player.ts` 新增纯函数 `clampPlayback(state, frameCount)`：索引合法时**返回同一对象**（避免无意义重渲染），越界时钳制到 `[0, count-1]` 并置 `playing: false`。
2. `src/features/lab/usePlayback.ts` 拆成三个职责明确的 effect：
   - `[events]` → 新 Trace 一律回到第 0 帧并停止播放。信号取**数组身份**而非长度：`events` 是 controller 的 React state 值，每次执行恰好换一次身份（成功换新数组、失败换新空数组），普通重渲染（主题/语言/速度/打字）身份稳定，所以「新 Trace 归零」与「手动跳转不被清掉」同时成立；长度信号则会漏掉「同帧数不同内容」的切换。
   - `[frameCount]` → 兜底钳制，覆盖「错误执行直接换入空数组」这类来不及走重置的路径，保证 `events[index]` 永不为 `undefined`。
   - 定时器 effect 增加 `frameCount <= 1` 提前返回，并在停止播放 / Trace 变化 / 速度变化时销毁，旧轨迹的定时器无法再推动新轨迹。
   - 渲染值再经 `clampIndex` 读一次，避免 swap 后首次 render 越界。
   - 源码中留下注释明确「不要写 `[frames]`，那是 WindowProxy」，防止回归。

**在缺陷状态下，门禁是绿的（这是它能存活至今的原因）。** 实测：把依赖还原成 `[frames]` 后 `npm run typecheck` exit 0、`npm run build` 成功，只有新增的浏览器用例会红——断言 `1 / 5`，实际得到 `5 / 5`（钳制生效但没归零），退出码 1。

## B. 核心修改文件

### 新增

| 文件 | 作用 |
| --- | --- |
| `src/features/lab/CallStackPanel.tsx` | 调用栈面板：深拷贝后的帧列表、活跃帧高亮、点击切换作用域、空态 |
| `src/features/lab/CallStackPanel.test.tsx` | 面板单测（帧倒序、活跃帧、返回值展示、空态） |
| `src/app/App.stage3.test.tsx` | 组件级递归视图联动（mock 运行时注入 callStack 帧） |
| `src/app/App.stage3.playback.test.tsx` | 组件级时间轴回归：长→短切换、播放中切换、错误清栈、主题/语言/速度不重置 |
| `src/features/lab/usePlayback.test.tsx` | Hook 级回归 7 例（A 长→短、B 播放中切换、C 空数组、D 同帧数不同 Trace、E 无关重渲染不重置、越界钳制） |

### 修改

| 文件 | 变更 |
| --- | --- |
| `src/domain/trace/schema.ts` | `callFrameSchema` 增加 `frameId/depth/arguments/locals/returnValue/status`；`MAX_CALL_STACK = 64` |
| `src/domain/trace/types.ts` | `RawCallFrame` 与运行时帧类型对齐 |
| `src/domain/trace/adapter.ts` | 旧帧 → 新协议时保留 callStack 字段，缺失字段不伪造 |
| `src/domain/trace/player.ts` | 新增 `clampPlayback`；导出 `clampIndex` 供渲染期防御使用 |
| `src/runtime/python/pyodide.ts` | 新增 `PYTHON_RECURSION_HELPER`（`@tracked`、`stack_state`、`_emit_call/_emit_return`），`trace()` 在 tracked 帧内自动抓取调用者局部变量；Visual bootstrap 注入 `tracked` |
| `src/features/lab/usePlayback.ts` | 时间轴重置 / 钳制 / 定时器守卫重写（见 A.1） |
| `src/features/lab/SyncPanel.tsx` | `resolveScope()`：有栈时按选中帧取 `locals`，选中帧消失回退活跃帧；无栈走 Stage-1 平铺路径 |
| `src/features/lab/LabView.tsx` | 接入 `CallStackPanel` 与 `selectedFrameId`，仅在当前事件带 `callStack` 时渲染 |
| `src/styles/app.css` | `.callframe/.callstack` 样式；`.callstack` 限高 460px + 面板内滚动（`overscroll-behavior: contain`） |
| `src/i18n/messages.ts` | `callStack / depth / activeFrame / returning / returnValue / args / noCallStack / frameSelectHint` 等键（中英） |
| `src/domain/algorithms/examples.ts`、`types.ts` | 新增 `recursion` 分组与 `'recursion'` 类型 |
| `legacy/algorithm-definitions.js` | 阶乘 / 斐波那契定义与四语言示例（Python 版使用 `@tracked`） |
| `src/domain/algorithms/catalog.generated.ts`、`languageExamples.generated.ts`、`src/test/fixtures/legacy-frames.json` | `npm run sync:legacy` 生成：14 个算法、帧基线新增 factorial 2 / fib 2（JS 侧） |
| `src/app/App.dom.test.tsx`、`src/domain/algorithms/catalog.test.ts`、`src/domain/trace/adapter.test.ts`、`src/domain/trace/schema.test.ts`、`src/runtime/python/pyodide.trace.test.ts`、`src/features/lab/SyncPanel.test.tsx` | 断言更新到 14 个算法 / 新协议字段 / 作用域回退 |
| `e2e/lab.spec.ts` | 新增 JS-only 长短 Trace 切换用例（bubble 25 帧 → binary 5 帧） |
| `playwright.config.ts` | `launchOptions.args: ['--disable-quic']`，见 G 的说明 |
| `package.json`、`package-lock.json` | 版本 `0.3.0-phase3`（两处 lock 元数据同步） |
| `README.md`、`docs/ARCHITECTURE.md` | 版本、状态矩阵、测试计数、§3.5 递归可视化不变量、演进顺序 |

## C. Trace 协议：`callStack`

`callStack` 是事件级字段，**每个事件携带该时刻的完整栈快照**（不是增量补丁），因此时间轴任意跳转都能还原当时的栈：

```json
{
  "schemaVersion": 1,
  "step": 3,
  "state": { "type": "stack", "values": ["factorial", "factorial", "factorial", "factorial"] },
  "message": "调用 / call factorial(n=1)",
  "sourceLocation": { "line": 2 },
  "callStack": [
    { "frameId": "f4", "name": "factorial", "depth": 3, "status": "running",
      "arguments": [{ "name": "n", "type": "int", "value": 1 }],
      "locals":    [{ "name": "n", "type": "int", "value": 1 }] },
    { "frameId": "f3", "name": "factorial", "depth": 2, "status": "running",
      "arguments": [{ "name": "n", "type": "int", "value": 2 }],
      "locals":    [{ "name": "n", "type": "int", "value": 2 }] },
    { "frameId": "f2", "name": "factorial", "depth": 1, "status": "running",
      "arguments": [{ "name": "n", "type": "int", "value": 3 }],
      "locals":    [{ "name": "n", "type": "int", "value": 3 }] },
    { "frameId": "f1", "name": "factorial", "depth": 0, "status": "running",
      "arguments": [{ "name": "n", "type": "int", "value": 4 }],
      "locals":    [{ "name": "n", "type": "int", "value": 4 }] }
  ]
}
```

返回事件的同一帧会带上 `"returnValue": 1, "status": "returning"`；此时 `locals` 里已出现 `result`。

| 字段 | 语义 | 约束 |
| --- | --- | --- |
| `frameId` | 单次调用唯一标识 | 可选但推荐；缺失时面板用 `name-depth` 兜底 key |
| `name` | 函数名 | 必填（Stage-1 兼容） |
| `depth` | 从 0 起的栈深 | 非负整数，等于进入时的 `len(_CALL_STACK)` |
| `arguments` | 调用实参快照 | 深拷贝、JSON 可序列化、最多 50 项 |
| `locals` | 该帧局部变量快照 | 同上；每次 `trace()` 刷新为最新 |
| `returnValue` | 真实返回值 | 仅 `returning` 帧存在，超过 2 KB 拒绝 |
| `status` | `running` / `returning` / `returned` | 枚举，可选 |

栈长上限 `MAX_CALL_STACK = 64`；事件上限 500；超限由 Zod 拒绝并给结构化错误，页面不崩。

## D. Python 递归实现

### 工作原理

```python
def tracked(fn):
    def wrapper(*args, **kwargs):
        _FRAME_SEQ[0] += 1
        fid = 'f' + str(_FRAME_SEQ[0])
        arg_names = fn.__code__.co_varnames[:len(args)]
        arg_dict = dict(zip(arg_names, args))
        arg_dict.update(kwargs)
        frame = {'frameId': fid, 'name': fn.__name__, 'depth': len(_CALL_STACK),
                 'arguments': _snapshot_variables(arg_dict),
                 'locals': _snapshot_variables(arg_dict), 'status': 'running'}
        _CALL_STACK.append(frame)
        _emit_call(fn.__name__, frame, arg_dict, fn.__code__.co_firstlineno)
        try:
            result = fn(*args, **kwargs)
        except BaseException:
            _CALL_STACK.pop()   # 异常也要出栈，避免脏栈泄漏到后续事件
            raise
        _emit_return(fn.__name__, frame, result, frame.get('line', fn.__code__.co_firstlineno))
        _CALL_STACK.pop()
        return result
    wrapper.__name__ = fn.__name__
    return wrapper
```

要点：

1. **帧 id 来自单调计数**，与函数名、深度都无关，所以同名递归层不会撞 id。
2. **进入与返回各一条事件**：进入事件用 `co_firstlineno`（函数定义行）作为 `line`，返回事件用该帧最后一次 `trace()` 记录的 `line`，两者都来自真实运行时，不猜。
3. **`_snapshot()` 深拷贝**：`list/dict/tuple` 递归复制，`set`、自定义对象转字符串。这是「历史帧不被后续 `arr[j], arr[j+1] = …` 污染」的唯一保证。
4. **`trace()` 在栈内会自省调用者帧**：`sys._getframe(1).f_locals` 过滤后与显式 `variables` 合并，写入 `event.variables` 并回填 `_CALL_STACK[-1]['locals']`；`_getframe` 只在函数内瞬态使用，帧对象不会被长期持有，避免引用环。
5. **过滤规则**：以下划线开头的名字、`module/function/type/method/builtin_function_or_method` 等类型被排除；无法 JSON 序列化的值被丢弃（`_filter_locals`）或降级为字符串（`_snapshot_variables`）。

### 局限与边界

| 边界 | 表现 |
| --- | --- |
| 只追踪被装饰的函数 | 未加 `@tracked` 的辅助函数、模块级语句不产生帧 |
| 不支持异步 / 生成器 | `await`、`yield` 期间的帧无法持续表达；`async def` 被装饰后返回协程对象，语义不成立 |
| 栈深上限 64 | 更深递归的帧被 Zod 拒绝 → 事件无效，需自行加参数或分治 |
| 事件上限 500 | `factorial(7)` 类深递归会逼近上限；`fib` 为指数级事件量，`n` 稍大即超限 |
| 快照成本 | 每条事件复制整栈 + 局部变量，`O(深度 × 变量大小)`；大 list 深递归会明显变慢 |
| 返回值时机 | 返回事件仍包含该帧（`status: returning`），下一事件才出栈；UI 无「返回中」专属动画 |
| 异常路径 | 抛出时直接 `pop` 且不发返回事件，只由 bootstrap 转成结构化诊断 |

## E. 前端同步机制

**单一数据源**：`useLabController` 把运行时帧经 `framesToTraceDocument` + `parseTraceDocument` 归一为 `events: TraceEvent[]`，之后所有视图只读 `events[index]`。

```
events ──► usePlayback(index/playing) ──► currentEvent = events[index]
                                              │
        ┌─────────────────────────────────────┼───────────────────────────┐
        ▼                                     ▼                           ▼
   VisualStage                        SyncPanel                     CallStackPanel
 (state 渲染)                 (代码行高亮 + 变量观察)            (栈快照 + 活跃帧)
        │                                     │                           │
        └──────────── Monaco 行装饰（sourceLocation.line） ────────────────┘
```

- **Monaco**：`currentEvent.sourceLocation.line` 驱动行装饰；代码被改过（`traceStale`）时不高亮，避免「旧 Trace 标注新代码」。
- **SyncPanel**：`resolveScope(event, selectedFrameId)` 是纯函数，规则为「有栈 → 选中帧的 `locals`，选中帧已离栈 → 回退活跃帧（栈顶）；无栈 → Stage-1 平铺 `variables`」。
- **CallStackPanel**：读同一 `event.callStack`，倒序渲染（最深在上），栈顶为 `active`；点击帧只改 `selectedFrameId`，**不参与时间轴**，所以选帧不会改变播放位置。
- **Timeline**：`index` 的唯一来源，见 A.1 的重置与钳制不变量。
- 栈只在当前事件带 `callStack` 时渲染；切换到无栈的 12 个旧算法时面板整体消失，不残留上一算法的高亮或帧。

## F. 算法验证

采集方式：`vite preview` + 真实 Microsoft Edge + 真实 Pyodide（`cdn.jsdelivr.net/pyodide/v0.27.7`），逐帧操作 `scrub` 读取 `progress / step-desc / variables-scope / variables-watch / call-frame-*`，**不是静态 fixture**。

### F.1 `factorial(4)`：共 13 帧，答案 24

| # | 事件 | 调用栈（帧:深度） | 当前帧变量 |
| --- | --- | --- | --- |
| 0 | 调用 / call factorial(n=4) | f1:0 | n = 4 |
| 1 | 调用 / call factorial(n=3) | f2:1 f1:0 | n = 3 |
| 2 | 调用 / call factorial(n=2) | f3:2 f2:1 f1:0 | n = 2 |
| 3 | 调用 / call factorial(n=1) | f4:3 f3:2 f2:1 f1:0 | n = 1 |
| 4 | 递归终止 / Base case | f4:3 f3:2 f2:1 f1:0 | n = 1 |
| 5 | 返回 / return factorial = 1 | f4:3 … f1:0 | n = 1 |
| 6 | 本层计算 / Compute | f3:2 f2:1 f1:0 | n = 2, result = 2 |
| 7 | 返回 / return factorial = 2 | f3:2 f2:1 f1:0 | n = 2, result = 2 |
| 8 | 本层计算 / Compute | f2:1 f1:0 | n = 3, result = 6 |
| 9 | 返回 / return factorial = 6 | f2:1 f1:0 | n = 3, result = 6 |
| 10 | 本层计算 / Compute | f1:0 | n = 4, result = 24 |
| 11 | 返回 / return factorial = 24 | f1:0 | n = 4, result = 24 |
| 12 | 完成 / Done | （空栈） | answer = 24 |

结论：深度 0→3 与实际递归层一一对应；四层 `n` 分别为 4/3/2/1；返回顺序 1 → 2 → 6 → 24 与数学定义一致；末帧 `answer = 24`。变量作用域标签实测为「作用域: factorial · 深度 0…3」，随当前帧变化。

### F.2 `fib(4)`：共 28 帧，答案 3，9 个不同帧 id

| 分支 | 关键事件 | 帧 id |
| --- | --- | --- |
| 左子树 fib(3)→fib(2)→fib(1),fib(0) | 调用 n=3 / n=2 / n=1 / n=0 | f2:d1 → f3:d2 → f4:d3, f5:d3 |
| fib(2) 合并 | 返回 1 | f3:d2，局部 `left=1 right=0` |
| 中段 fib(1) | 调用 n=1 | f6:d2 |
| fib(3) 合并 | 返回 2 | f2:d1，`left=1 right=1` |
| 右子树 fib(2)→fib(1),fib(0) | 调用 n=2 / n=1 / n=0 | **f7:d1** → f8:d2, f9:d2 |
| fib(2) 再次合并 | 返回 1 | f7:d1，`left=1 right=0` |
| 根合并 | 返回 3 | f1:d0，`left=2 right=1` |
| 结束 | 完成 / Done | 空栈，`answer = 3` |

结论：同一个 `fib(2)` 被计算两次，得到 **f3（深度 2）与 f7（深度 1）两个不同 frameId**，证明「同名函数不同调用」不会被混淆；同名的 `left/right` 局部变量各自独立；返回序列 1,0,1,1,2,1,0,1,3 与递归展开一致；末帧 `answer = 3`。

### F.3 帧数与基线的关系

`legacy-frames.json` 中 factorial / fib 各 2 帧是**计划任务（`solve`）模式的 JS 基线**；Python 可视化模式走 `@tracked`，实测 13 / 28 帧。两者不是同一运行路径，报告与 README 中不混用这两个数字。

## G. 测试结果

本机实测（Windows，Node 22.23.2，Edge 无头，`vite preview` 127.0.0.1:4173）：

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查 | `npm run typecheck`（`tsc -b --pretty false`） | **exit 0**，0 错误 |
| 单元测试 | `npm test`（Vitest） | **170 / 170 通过**，23 个文件，5.63 s |
| 构建 | `npm run build` | **exit 0**，22.14 s；`index-BAj8ZTu1.js` 366.24 kB（gzip 115.52），`monaco-setup-DN4jWwzq.js` 4,122.24 kB（gzip 1,066.60） |
| 生成文件一致性 | `npm run sync:legacy` + SHA256 比对 | 4 个 `*.generated.ts` 与 `legacy-frames.json` **全部未变化**，CI 的 `sync` 门禁不会红 |
| 浏览器 E2E | `npm run test:e2e`（Playwright + Edge） | **7 / 7 通过**，26.1 s |

E2E 明细（真实浏览器，非 mock）：

| # | 用例 | 耗时 | 覆盖 |
| --- | --- | --- | --- |
| 1 | Python 冒泡排序同步高亮 + 变量 | 10.8 s | 真 Pyodide、变量、行高亮 |
| 2 | SyntaxError 出现与修复后清除 | 5.0 s | 结构化诊断 + Monaco Marker |
| 3 | 编辑自动保存并在刷新后恢复 | 1.6 s | localStorage 草稿 |
| 4 | Light / Dark / System 切换不丢编辑器 | 0.6 s | 三态主题 |
| 5 | **阶乘递归真实调用栈，结果 24** | 3.7 s | 真 Pyodide：f1→f2 push、prev 回退、末帧 24 |
| 6 | **斐波那契真实分支，结果 3** | 3.0 s | 真 Pyodide：f1→f2→f3 逐层 push、末帧 3 |
| 7 | **长短 Trace 切换回到第 1 帧**（新增） | 0.6 s | 25 帧 → 5 帧，断言 `1 / 5`、舞台非空、7 根 bar |

新增/变更的单元测试：

| 文件 | 数量 | 覆盖 |
| --- | --- | --- |
| `src/features/lab/usePlayback.test.tsx` | 7 | A 长→短、B 播放中切换、C 空数组全控件安全、D 同帧数不同 Trace、E 无关重渲染不重置、越界不越界 |
| `src/app/App.stage3.playback.test.tsx` | 4 | 组件级：拖到 11/12 → 切阶乘得到 `1 / 4`、播放中切换、错误清栈 `0 / 0`、主题/语言/速度保持 `7 / 12` |
| `src/features/lab/SyncPanel.test.tsx` | 10（+1） | 选中帧离栈后回退活跃帧 |
| `src/features/lab/CallStackPanel.test.tsx` | — | 面板渲染与空态 |

**缺陷可被测试抓住的证据（RED → GREEN）。** 临时把 `usePlayback` 的依赖改回 `[frames]`：

- `npm run typecheck` → exit 0，`npm run build` → 成功（缺陷对静态门禁完全隐形）；
- `npx playwright test -g "25-frame bubble sort"` → **1 failed**，`expected "1 / 5"` / `received "5 / 5"`。

恢复修复版并重建后同一用例 **1 passed（0.7 s）**。

**关于 `--disable-quic`。** 本机 Edge 对 `cdn.jsdelivr.net` 协商 HTTP/3 时，10 MB 的 `pyodide.asm.wasm` 会在传输途中被中断（`net::ERR_QUIC_PROTOCOL_ERROR`），Pyodide 初始化超过应用自身 30 秒预算，页面明确报「Python 初始化或执行超时（30 秒）」。这是网络传输问题，不是应用缺陷：同一环境用 PowerShell/页面 `fetch` 走 HTTP/2 下载 10 MB 仅需 1.3 s，禁用 QUIC 后 Pyodide 冷启动实测 2.1 s。因此 E2E 在 `playwright.config.ts` 的 `use.launchOptions.args` 中加了 `--disable-quic`——只改传输方式，**未改动、未删除、未跳过任何断言**。若在其他网络下 HTTP/3 正常，该参数同样安全（只是回退到 HTTP/2）。

## H. 已知限制

1. **自动追踪未实现**：只有 `@tracked` 装饰的函数进栈；这是「显式追踪」而非「任意代码自动追踪」，README 与本文均未把它写成已完成。
2. **Pyodide 仍依赖 CDN**：首次约 15 MB、冷启动约 2 s（HTTP/2）；离线或 CDN 不可达时 Python 入口不可用，应用会在 30 秒后给出结构化超时提示。离线化尚未实现。
3. **性能边界**：每条事件复制整栈 + 局部变量（`O(深度 × 变量大小)`）；`fib` 为指数级事件量，`n ≥ 6` 极易触达 500 事件上限；栈深上限 64，超出即整条事件被拒。
4. **异步与生成器不支持**，`await` 期间的栈无法表达。
5. **面板为静态栈快照**：无进出栈动画、无帧折叠、无虚拟滚动；深栈在 460 px 高度内滚动。
6. **时间轴重置依赖 `events` 身份**：这是当前设计的关键不变量——每次执行必须恰好 `setEvents` 一次，且不要在渲染期派生新的数组字面量。若未来改成「每次渲染新建数组」，会退化成不断归零；代码内已就此留下注释。
7. **无 a11y 审计**：调用栈行为 `role="button"` + Enter/Space，但没有完整的 roving tabindex / 焦点管理，也没有 axe 扫描；`tokens.test` 只校验 token 存在性，不校验对比度。
8. **Monaco 体积**：`monaco-setup` 仍为 4.12 MB（gzip 1.07 MB），瘦身留待后续。
9. **练习页仍是 textarea**，未迁移 Monaco。
10. **E2E 覆盖仅 Chrome 系**（本机 Edge），Firefox/Safari 未跑。

## I. Git 状态

| 项 | 值 |
| --- | --- |
| 分支 | `main`（跟踪 `origin/main`） |
| 远端 | `https://gitee.com/vvvi734/algolens.git` |
| 提交前 HEAD | `f921552 feat(phase-2): Monaco editor, trace-linked highlighting, diagnostics, drafts, E2E` |
| 提交 | `feat(phase-3): recursive call stack visualization and playback fixes`（哈希见下方「提交后记录」） |
| 推送 | `git push origin main` |
| 工作区 | 提交后应仅剩 gitignored 的 `dist/`、`tsconfig.tsbuildinfo`、`test-results/`；无临时脚本 |

安全性说明：本阶段全程未使用 `git reset --hard`、`git clean -fd`、force push，未改写历史，未修改远端地址；临时采集脚本（`.tmp-*.mjs`）在仓库内运行后已删除，未入库。

### 提交后记录

- Commit：见 `git log -1 --oneline`（本文在提交前撰写，哈希由提交后回填）。
- Push：以 `git status` 的 `main...origin/main` 无 `ahead` 为准。

## J. 下一阶段准备情况

仅评估影响，不实现。

| 方向 | 对现有架构的影响 | 判断 |
| --- | --- | --- |
| 二叉树遍历可视化 | `visualType: 'tree'` 已在协议里预留但无渲染器；需要 `state` 表达节点/边/访问状态，并新增 `VisualStage` 的 tree renderer | 协议够用，主要是渲染层新增；不触动时间轴与同步层 |
| 图遍历（BFS/DFS）可视化 | 需要邻接表 + 节点坐标或布局算法（力导向/分层），`state` 体积会逼近 8 KB 限额 | 协议需评估 `state` 限额；布局是新增依赖，建议先静态坐标 |
| 动态规划可视化 | 需要二维表格状态 + 「来源箭头」，`state.type` 需新增 `table`；事件量随 `n²` 增长 | 事件限额压力最大，可能需要分帧/合并策略 |
| 调用栈动画化 | 现有 `callStack` 快照可直接驱动补间动画，无需协议改动 | 增量最小、性价比最高的后续项 |
| 任意函数自动追踪 | 需要 `sys.settrace` 或字节码插桩，与 500 事件上限、Pyodide 性能冲突 | 建议作为独立特性评估，不并入可视化阶段 |

结论：Stage 3 建立的「一条事件流 + 单一 `currentEvent` + 索引钳制」不变量可以承载树/图/DP，新增工作集中在协议字段扩展与渲染层，不需要重构 `usePlayback` 或同步面板。
