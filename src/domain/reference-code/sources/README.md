# AlgoViz reference code / AlgoViz 参考代码

## 中文

本目录是 AlgoViz 的只读教学参考代码，面向大学数据结构初学者。代码可以脱离网站单独复制、编译或运行，不依赖 AlgoViz 的 Python Trace、Pyodide 或前端组件。

- **语言**：C11、C++17、Python 3。
- **算法**：36 个正式算法，每个算法有 C、C++、Python 三种原理实现；部分算法还有标准库简洁实现。
- **原理实现**：显式写出核心算法步骤，用于理解底层数据结构与算法。
- **简洁实现**：使用目标语言的标准库接口，例如 C 的 `qsort`/`bsearch`、C++ 的 `std::sort`/`std::stack`、Python 的 `heapq`/`collections.deque`。标准库快捷方法不一定采用当前课程演示的底层算法，不能把两者混为一谈。
- **运行方式**：
  - C：`cc file.c -std=c11 -Wall -Wextra -pedantic`
  - C++：`c++ file.cpp -std=c++17 -Wall -Wextra -pedantic`
  - Python：`python file.py`
- **注释与网站语言**：源文件使用英文教学注释；网站切换到中文界面时，使用同一份算法主体加上经审校的中文教学注释头，函数签名和算法语句不变。复制按钮复制当前界面语言对应的完整源码。
- **原创性**：本目录的全部示例均为 AlgoViz 原创，没有复制第三方实现或外部注释；标准库用法依据各语言官方文档。

## English

This directory contains AlgoViz's read-only teaching reference code for university data-structure beginners. The examples can be copied, compiled or run outside the website; they do not depend on AlgoViz traces, Pyodide or front-end components.

- **Languages**: C11, C++17 and Python 3.
- **Coverage**: 36 formal algorithms, each with C, C++ and Python principle implementations; some algorithms also have standard-library convenience versions.
- **Principle implementation**: writes out the core algorithm so learners can inspect the underlying data structures and steps.
- **Convenience implementation**: uses the target language's standard library, such as C `qsort`/`bsearch`, C++ `std::sort`/`std::stack`, or Python `heapq`/`collections.deque`. A standard-library shortcut may not use the algorithm demonstrated in the lesson; do not confuse the two.
- **Running**:
  - C: `cc file.c -std=c11 -Wall -Wextra -pedantic`
  - C++: `c++ file.cpp -std=c++17 -Wall -Wextra -pedantic`
  - Python: `python file.py`
- **Comments and UI language**: source files use English teaching comments. When the website switches to Chinese, the same algorithm body is shown with a reviewed Chinese annotation header; function signatures and algorithm statements do not change. The copy button copies the complete source for the current UI language.
- **Originality**: every example in this directory is original AlgoViz work; no third-party implementation or external comment is copied. Standard-library examples follow the languages' official documentation.

See the repository root `LICENSE` for the project license.
