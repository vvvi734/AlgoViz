"""AlgoViz convenience implementation: factorial with math.factorial.

This delegates the whole computation to the CPython standard library.

Reading guide:
1. This convenience file delegates to math.factorial instead of writing the recursion.
2. The C implementation multiplies the factors internally and returns an
   arbitrary-precision int.
3. No Python recursion limit is involved.

Complexity: O(n) multiplications; extra space depends on the big-integer result,
  not Python stack depth.
Convention: Input must be a non-negative integer; math.factorial raises ValueError
  otherwise.
"""
# 中文导读：用 math.factorial 演示阶乘的标准库实现，并与手写递归版本对照。
# 阅读顺序：先看输入校验，再看库函数调用。
# 输入/输出：输入非负整数 n；输出 n!；负数抛 ValueError。
# 不变量：n! 只对非负整数有定义；0! = 1。
# 易错点：把负数传给库函数；混淆递归深度与数值范围。
# 复杂度：库实现接近 O(n) 乘法，额外空间取决于实现。

from __future__ import annotations

from math import factorial


# 作用：演示 math.factorial 并打印结果。
def main() -> None:
    # `math.factorial` returns an arbitrary-precision integer and rejects negative input.
    assert factorial(0) == 1
    assert factorial(5) == 120
    print("5! =", factorial(5))
    print("0! =", factorial(0))
    print("10! =", factorial(10))


if __name__ == "__main__":
    main()
