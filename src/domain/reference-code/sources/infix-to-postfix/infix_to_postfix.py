"""AlgoViz reference implementation: infix to postfix.

Reading guide:
1. Numbers are whole tokens; never split `12` into `1` and `2`.
2. `(` is pushed as a barrier; `)` pops back to it and discards it.
3. An incoming operator pops every top with greater-or-equal precedence because
   all four operators are left-associative, then pushes itself.
4. After the scan, flush the remaining operators.

Complexity: O(n) time, O(n) space.
"""
# 中文导读：用运算符栈把中缀表达式转成后缀，遇到低优先级运算符先弹出栈顶。
# 阅读顺序：先看 precedence 表，再看 tokenize 如何处理多位数，最后看主循环的左右括号分支。
# 输入/输出：输入中缀表达式字符串；返回空格分隔的后缀表达式。
# 不变量：栈中运算符优先级从底到顶非降；左括号在遇到右括号前不弹出。
# 易错点：多位数被拆成单个字符；右括号后忘记弹出左括号；优先级相等时错误地先入栈。
# 复杂度：O(n)，额外空间 O(n)。

from __future__ import annotations


# Return operator precedence: + and - are 1, * and / are 2, everything else is 0.
# 返回运算符优先级；+/- 为 1，*// 为 2，其他为 0。
def precedence(operator: str) -> int:
    """Return 1 for +/-, 2 for */, and 0 for anything else."""
    if operator in ("+", "-"):
        return 1
    if operator in ("*", "/"):
        return 2
    return 0


# Split the expression into numbers and multi-character operators while skipping whitespace.
# 把表达式拆成数字和多字符运算符，跳过空白。
def tokenize(expression: str) -> list[str]:
    """Split into numbers, parentheses and single-character operators."""
    tokens: list[str] = []
    index = 0
    while index < len(expression):
        char = expression[index]
        if char.isspace():
            index += 1
            continue
        if char.isdigit():
            end = index
            while end < len(expression) and expression[end].isdigit():
                end += 1
            tokens.append(expression[index:end])
            index = end
            continue
        if char in "+-*/()":
            tokens.append(char)
            index += 1
            continue
        # Only digits, the four binary operators and parentheses are accepted. A unary minus, exponentiation or variable is rejected instead of assigned a guessed precedence.
        raise ValueError(f"unsupported character: {char}")
    return tokens


# Return the postfix expression; raise ValueError when parentheses are unbalanced or a character is unsupported.
# 返回后缀表达式；括号不匹配或出现不支持的字符时抛出 ValueError。
def infix_to_postfix(expression: str) -> str:
    """Convert an infix expression; raise ValueError on unbalanced parentheses."""
    # Tokenization happens before conversion so the converter sees whole numbers and explicit parentheses, not individual characters.
    tokens = tokenize(expression)
    output: list[str] = []
    # This list is the operator stack. Operands go straight to output; only operators whose output order is still unsettled wait here.
    operators: list[str] = []

    for token in tokens:
        if token.isdigit():
            output.append(token)
        # a left parenthesis blocks every pop until it is explicitly removed.
        elif token == "(":
            operators.append(token)
        # A right parenthesis drains operators to its matching left parenthesis and discards both parentheses; an empty stack means it is unmatched.
        elif token == ")":
            while operators and operators[-1] != "(":
                output.append(operators.pop())
            if not operators:
                raise ValueError("unmatched )")
            operators.pop()
        else:
            # `>=` (not `>`) is required for left associativity: 8 - 3 - 2 must
            # emit the first minus before pushing the second one.
            # The left-parenthesis test short-circuits the precedence test; `>=` is required for left associativity, so 8-3-2 emits the first minus first.
            while (operators and operators[-1] != "(" and
                   precedence(operators[-1]) >= precedence(token)):
                output.append(operators.pop())
            operators.append(token)

    # No token remains to settle the stack order. Pop everything, but treat a leftover left parenthesis as an unmatched-parenthesis error.
    while operators:
        operator = operators.pop()
        if operator == "(":
            raise ValueError("unmatched (")
        output.append(operator)
    return " ".join(output)


# Demonstrate the conversion of (3 + 4) * 2.
# 演示 (3 + 4) * 2 的转换结果。
def main() -> None:
    print("infix:  (3 + 4) * 2")
    print("postfix:", infix_to_postfix("(3 + 4) * 2"))


if __name__ == "__main__":
    main()
