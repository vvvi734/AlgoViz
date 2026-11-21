"""AlgoViz reference implementation: infix to postfix.

Reading guide:
1. Numbers are whole tokens; never split `12` into `1` and `2`.
2. `(` is pushed as a barrier; `)` pops back to it and discards it.
3. An incoming operator pops every top with greater-or-equal precedence because
   all four operators are left-associative, then pushes itself.
4. After the scan, flush the remaining operators.

Complexity: O(n) time, O(n) space.
"""

from __future__ import annotations


def precedence(operator: str) -> int:
    """Return 1 for +/-, 2 for */, and 0 for anything else."""
    if operator in ("+", "-"):
        return 1
    if operator in ("*", "/"):
        return 2
    return 0


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
        raise ValueError(f"unsupported character: {char}")
    return tokens


def infix_to_postfix(expression: str) -> str:
    """Convert an infix expression; raise ValueError on unbalanced parentheses."""
    tokens = tokenize(expression)
    output: list[str] = []
    operators: list[str] = []

    for token in tokens:
        if token.isdigit():
            output.append(token)
        # a left parenthesis blocks every pop until it is explicitly removed.
        elif token == "(":
            operators.append(token)
        elif token == ")":
            while operators and operators[-1] != "(":
                output.append(operators.pop())
            if not operators:
                raise ValueError("unmatched )")
            operators.pop()
        else:
            # `>=` (not `>`) is required for left associativity: 8 - 3 - 2 must
            # emit the first minus before pushing the second one.
            while (operators and operators[-1] != "(" and
                   precedence(operators[-1]) >= precedence(token)):
                output.append(operators.pop())
            operators.append(token)

    while operators:
        operator = operators.pop()
        if operator == "(":
            raise ValueError("unmatched (")
        output.append(operator)
    return " ".join(output)


def main() -> None:
    print("infix:  (3 + 4) * 2")
    print("postfix:", infix_to_postfix("(3 + 4) * 2"))


if __name__ == "__main__":
    main()
