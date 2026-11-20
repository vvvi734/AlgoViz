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
- **注释与网站语言**：源文件保留其原有语言的注释；网站切换到另一种界面语言时，使用同一份算法主体加上经审校的本地化注释头，函数签名和算法语句不变。复制按钮复制当前界面语言对应的完整源码。
- **许可**：除标注为教材代码的文件外，本目录代码采用仓库根目录的 MIT License。26 个 C 原理文件是教材节选，版权归原作者/出版方所有，仅用于学习，不适用 MIT 许可；文件头保留来源和版权说明。
- **第三方来源**：除上述教材节选外，没有复制第三方算法实现；标准库用法依据各语言官方文档，教材只作为知识体系与算法思想参考。

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
- **Comments and UI language**: source files retain their native comments. When the website switches to its other language, the same algorithm body is shown with a reviewed localized annotation header; function signatures and algorithm statements do not change. The copy button copies the complete source for the current UI language.
- **Licensing**: except files marked as textbook excerpts, the code here is distributed under the repository's MIT License. Twenty-six C principle files are textbook excerpts whose copyright remains with the original authors/publisher; they are for study only and are not MIT-licensed. Their headers retain provenance and copyright notices.
- **Third-party code**: apart from those textbook excerpts, no third-party algorithm implementation is copied. Standard-library examples follow the languages' official documentation; the textbook is used as a knowledge-system and algorithm-idea reference.

See the repository root `LICENSE` for the full MIT text.
