"""AlgoViz reference implementation: postfix evaluation.

Reading guide:
1. Split by spaces and keep multi-digit numbers whole.
2. Push numbers; an operator pops `right` first, then `left`.
3. Compute `left op right`, not `right op left`.
4. Integer division truncates toward zero via `int(left / right)`, matching C/C++.
5. Exactly one value must remain at the end.

Complexity: O(n) time, O(n) space.
"""
# 中文导读：从左到右扫描后缀表达式，遇操作数入栈，遇运算符弹出两个操作数计算。
# 阅读顺序：先看操作数识别，再看二元运算符的弹出顺序。
# 输入/输出：输入空格分隔的后缀 token；返回整数结果。
# 不变量：栈中始终保存尚未参与运算的操作数；先弹出的是右操作数。
# 易错点：减法/除法左右操作数颠倒；操作数不足仍继续弹栈。
# 复杂度：O(n)，额外空间 O(n)。

from __future__ import annotations


class PostfixError(ValueError):
    """Raised for operand shortage/surplus, invalid tokens or division by zero."""


# Purpose: Evaluate the postfix expression and return its integer result; raise PostfixError for malformed input.
# 作用：计算后缀表达式并返回整数结果；非法输入抛出 PostfixError。
def evaluate(tokens: list[str]) -> int:
    """Evaluate a tokenised postfix expression or raise PostfixError."""
    # The list is an operand stack, not a call stack. Its only job is to hold values whose operator has not appeared yet.
    stack: list[int] = []

    for token in tokens:
        # Only a whole digit token is pushed. The evaluator does not accept a leading minus or a decimal point, so negative values must come from subtraction.
        if token.isdigit():
            stack.append(int(token))
            continue
        if token not in ("+", "-", "*", "/"):
            raise PostfixError(f"invalid token: {token}")
        # A binary operator needs two operands. Check length before pop so an empty or one-item stack raises PostfixError instead of IndexError.
        if len(stack) < 2:
            raise PostfixError("operand shortage")

        # the first pop is the right operand; compute left op right.
        right = stack.pop()   # first pop = right operand
        left = stack.pop()    # second pop = left operand
        # Reject a zero divisor before computing. The operands have already been popped, but the local stack is discarded on error, so no partial result escapes.
        if token == "/" and right == 0:
            raise PostfixError("division by zero")

        if token == "+":
            value = left + right
        elif token == "-":
            value = left - right
        elif token == "*":
            value = left * right
        else:
            # Python's // floors negative results; C truncates toward zero.
            value = int(left / right)
        stack.append(value)

    # No remaining value means operands were missing; the input never formed one complete expression.
    if not stack:
        raise PostfixError("operand shortage")
    # Extra values mean the input left operands unused. Raising is safer than returning the top and hiding the malformed expression.
    if len(stack) > 1:
        raise PostfixError("operand surplus")
    return stack[0]


# Purpose: Demonstrate evaluating 3 4 + 2 *.
# 作用：演示 3 4 + 2 * 的求值。
def main() -> None:
    expression = "3 4 + 2 *"
    print("postfix:", expression)
    print("result: ", evaluate(expression.split()))


if __name__ == "__main__":
    main()
