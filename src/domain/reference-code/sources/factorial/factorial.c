/*
 * AlgoViz reference implementation: factorial.
 * Original code written for this repository under the MIT License.
 * Recursive definition: n! = n * (n - 1)!, with 0! = 1.
 */

#include <stddef.h>
#include <stdio.h>

unsigned long long factorial(unsigned int number) {
    if (number <= 1U) {
        return 1ULL;
    }
    return (unsigned long long)number * factorial(number - 1U);
}

int main(void) {
    printf("5! = %llu\n", factorial(5U));
    printf("0! = %llu\n", factorial(0U));
    printf("10! = %llu\n", factorial(10U));
    return 0;
}
