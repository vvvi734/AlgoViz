"""Univariate polynomial addition — independent Python teaching implementation.

一元多项式相加——独立 Python 教学实现。

Each polynomial is a singly linked list of real nodes, strictly ordered by
descending exponent. Two cursors walk A and B once. Equal exponents add the
coefficients; a zero sum creates no result node. The result chain is newly
allocated, so the inputs remain intact.

Each polynomial is stored as nodes rather than a coefficient array, which keeps
only nonzero terms and makes the ordered merge possible.

Run: python3 polynomial_add.py
"""
# 中文导读：两个按指数降序排列的稀疏多项式链表同步前进，指数相等时合并系数。
# 阅读顺序：先看 PolyNode 的非零约束，再看 add_polynomials 的双游标分支。
# 输入/输出：输入两个有序多项式；返回新的结果链表，输入保持不变。
# 不变量：结果链表仍按指数严格降序；系数和为 0 的项不创建结点。
# 易错点：系数和为 0 仍写入；指数相等时只前进一个游标；破坏输入链。
# 复杂度：O(m+n)，额外空间 O(m+n)。

from __future__ import annotations

from dataclasses import dataclass

# Two cursors advance once each; a zero coefficient sum creates no node.


@dataclass
class PolyNode:
    coefficient: int
    exponent: int
    next: "PolyNode | None" = None

    def __post_init__(self) -> None:
        if self.coefficient == 0:
            raise ValueError("a sparse chain must not store a zero coefficient")
        if self.exponent < 0:
            raise ValueError("the exponent must be non-negative")


class Polynomial:
    def __init__(self, terms: list[tuple[int, int]]) -> None:
        self.head: PolyNode | None = None
        self.tail: PolyNode | None = None
        previous_exponent: int | None = None
        for coefficient, exponent in terms:
            if previous_exponent is not None and exponent >= previous_exponent:
                raise ValueError("terms must strictly descend by exponent")
            previous_exponent = exponent
            self.append(coefficient, exponent)

    # Purpose: Append a non-zero term at the tail; the caller keeps exponents in descending order.
    # 作用：在尾部追加一个非零项；调用方负责保持指数降序。
    def append(self, coefficient: int, exponent: int) -> None:
        """Append one term at the tail; the caller keeps the chain ordered."""
        node = PolyNode(coefficient, exponent)
        if self.head is None:
            self.head = node
        else:
            self.tail.next = node
        self.tail = node

    def __iter__(self):
        node = self.head
        while node is not None:
            yield node
            node = node.next


# Purpose: Merge two ordered polynomials into a new list without modifying a or b.
# 作用：合并两个有序多项式，返回新链表；不修改 a、b。
def add_polynomials(a: Polynomial, b: Polynomial) -> Polynomial:
    """Merge two ordered chains into a new result chain in O(m + n)."""
    result = Polynomial([])
    left = a.head
    right = b.head

    while left is not None or right is not None:
        if left is not None and right is not None:
            if left.exponent == right.exponent:
                total = left.coefficient + right.coefficient
                if total != 0:
                    # A zero sum is simply omitted: 0x^k is not a sparse term.
                    result.append(total, left.exponent)
                left = left.next          # equal exponents advance both
                right = right.next
            elif left.exponent > right.exponent:
                result.append(left.coefficient, left.exponent)
                left = left.next          # only A advances
            else:
                result.append(right.coefficient, right.exponent)
                right = right.next        # only B advances
        elif left is not None:
            # B is exhausted; the rest of A is already ordered.
            result.append(left.coefficient, left.exponent)
            left = left.next
        else:
            # A is exhausted; append the rest of B.
            result.append(right.coefficient, right.exponent)
            right = right.next
    return result


# Purpose: Format the polynomial as a readable string.
# 作用：把多项式格式化为可读字符串。
def format_polynomial(poly: Polynomial) -> str:
    pieces: list[str] = []
    for node in poly:
        coefficient = node.coefficient
        exponent = node.exponent
        sign = "−" if coefficient < 0 else ""
        magnitude = abs(coefficient)
        if exponent == 0:
            term = f"{magnitude}"
        elif exponent == 1:
            term = ("" if magnitude == 1 else str(magnitude)) + "x"
        else:
            term = ("" if magnitude == 1 else str(magnitude)) + f"x{superscript(exponent)}"
        pieces.append(sign + term)
    if not pieces:
        return "0"
    text = pieces[0]
    for piece in pieces[1:]:
        text += piece if piece.startswith("−") else " + " + piece
    return text


SUPERSCRIPT = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")


# Purpose: Convert an integer exponent to superscript characters for display.
# 作用：把整数指数转成上标字符，供输出使用。
def superscript(value: int) -> str:
    return str(value).translate(SUPERSCRIPT)


if __name__ == "__main__":
    # A = 3x^4 + 2x^2 - 5, B = -3x^4 + 4x^3 + 7.
    a = Polynomial([(3, 4), (2, 2), (-5, 0)])
    b = Polynomial([(-3, 4), (4, 3), (7, 0)])
    result = add_polynomials(a, b)
    print("A =", format_polynomial(a))
    print("B =", format_polynomial(b))
    print("A+B =", format_polynomial(result))   # 4x³ + 2x² + 2
