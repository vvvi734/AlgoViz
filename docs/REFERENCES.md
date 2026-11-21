# 参考来源、设计借鉴与许可证记录

本文件区分三类内容：教材结构参考、交互设计借鉴、第三方依赖许可证。AlgoViz 的教学文案、Trace、可视化组件和参考代码均为本项目原创；仓库根目录的 [LICENSE](../LICENSE) 为 MIT。

## 教材结构参考

- 严蔚敏、吴伟民《数据结构（C语言版）》，清华大学出版社，1997 年 4 月第 1 版。作为课程范围、术语和章节顺序的基准；只参考章节结构与知识分类，用于组织 `src/domain/algorithms/textbook.ts` 的 12 章目录。
- 程杰《大话数据结构（溢彩加强版）》，清华大学出版社，2020 年修订版。作为直观解释、图示组织和入门类比的参考，不作为课程边界依据。
- 详细章节、印刷页与 PDF 页索引见 [`REFERENCE_BOOKS.md`](REFERENCE_BOOKS.md)；两本 PDF 只保存在本地，不提交到仓库。
- 没有复制教材正文、例题、习题、插图或版式；课程讲解、静态图和参考代码均重新撰写。

## 设计思想借鉴（不含代码或素材）

| 来源 | 许可证 | 使用方式 |
| --- | --- | --- |
| [OpenDSA](https://github.com/OpenDSA/OpenDSA) | MIT | 仅借鉴“教学内容独立于渲染器、课程有稳定标识、内容可独立校验”的组织方式。 |
| [Algorithm Visualizer](https://github.com/algorithm-visualizer/algorithm-visualizer) | MIT | 仅借鉴“执行轨迹与渲染器分离、目录与可视化实现分开”的架构思想。 |
| Python Tutor / VisuAlgo / AlgoMonster | 公开网页产品，未复用内容 | 仅观察“教学步骤与当前执行并排呈现”的通用交互模式。 |

上述项目均未作为依赖、子模块或代码来源引入；AlgoViz 的 `TraceEvent` Schema、播放器、课程同步、流程图和静态图均为原创实现。

## 算法实现核对来源

以下仓库仅用于核对标准算法写法和测试组织，没有复制函数、注释、测试数据或文案：

| 来源 | 许可证 | 使用方式 |
| --- | --- | --- |
| [TheAlgorithms/Python](https://github.com/TheAlgorithms/Python) | MIT | 核对排序、图、树、哈希、KMP 等标准实现思路。 |
| [trekhleb/javascript-algorithms](https://github.com/trekhleb/javascript-algorithms) | MIT | 核对算法说明与测试组织方式。 |
| [algorithm-visualizer/algorithms](https://github.com/algorithm-visualizer/algorithms) | 未单独核验根许可证；未复制 | 仅保留“轨迹与渲染分离”的通用设计取向。 |

`src/domain/reference-code/sources/**` 中的 C / C++ / Python 代码和双语注释是 AlgoViz 为教学重新编写的参考实现，不是第三方代码的搬运。若后续引入外部实现，必须同时固定仓库、路径、版本和许可证，并在文件或 `NOTICE` 中保留要求的版权与许可声明。

## 运行时依赖

主要第三方依赖通过 npm 安装，许可证随包分发，`node_modules` 不提交：

| 依赖 | 用途 | 许可证 |
| --- | --- | --- |
| React / React DOM | UI | MIT |
| Vite | 开发与构建 | MIT |
| TypeScript | 类型检查 | Apache-2.0 |
| Zod | 运行时 Schema 校验 | MIT |
| Monaco Editor | 只读代码查看器与高亮 | MIT |
| Pyodide | 浏览器内真实 Python 执行 | MPL-2.0 |
| Vitest / Testing Library / jsdom | 单测与 DOM 测试 | MIT |
| Playwright | 真实浏览器 E2E | Apache-2.0 |

依赖版本以 `package.json` 与 `package-lock.json` 为准。升级依赖时应重新核对许可证，不得删除依赖自带的版权与许可文件。

## 明确没有做的事

- 没有搬运教材原文、习题、插图或第三方课程文案。
- 没有复制 OpenDSA、Algorithm Visualizer 或其他参考仓库的源代码与素材。
- 没有把第三方仓库作为 git submodule 引入。
- 没有移除任何第三方许可证、版权声明或代码来源记录。
