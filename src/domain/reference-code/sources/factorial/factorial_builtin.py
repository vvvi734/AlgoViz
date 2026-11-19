"""AlgoViz convenience implementation: factorial with math.factorial.

Original code written for this repository under the MIT License.
This delegates the whole computation to the CPython standard library.
"""

from __future__ import annotations

from math import factorial


def main() -> None:
    assert factorial(0) == 1
    assert factorial(5) == 120
    print("5! =", factorial(5))
    print("0! =", factorial(0))
    print("10! =", factorial(10))


if __name__ == "__main__":
    main()
