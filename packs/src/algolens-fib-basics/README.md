# algolens-fib-basics（AlgoViz 官方示例包）

面向 `fib`（斐波那契递归）的官方教学知识包。F1 之后 `binary`、`linear` 已有内置课程，知识包不再用它们作为“无内置课程”的示例，因此官方样例迁移到仍无内置课程的 `fib`。

| 字段 | 值 |
| --- | --- |
| `packId` | `algolens-fib-basics` |
| 版本 | `1.0.0` |
| 许可证 | MIT |
| lessons | `lessons/fibonacci.json`（`fibonacci-basics`） |
| 示例 | `examples/fibonacci.py`（真实 Python，含 `trace(...)` 与 `lesson_step`） |
| 阶段 | `init` / `compare` / `recurse` / `combine` / `done` |

## 构建与校验

```bash
npm run pack:build          # writes packs/algolens-fib-basics.algopack
npm run pack -- packs/algolens-fib-basics.algopack   # validate the archive
```
