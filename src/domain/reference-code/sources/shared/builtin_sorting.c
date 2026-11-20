/*
 * AlgoViz shared convenience reference: C standard-library qsort.
 *
 * qsort performs the same task (order an int array ascending), but it is an
 * unspecified in-place sort rather than a hand-written bubble/selection/
 * insertion sort. It is not guaranteed to be stable.
 *
 * Reference: C standard library qsort documentation.
 *
 * Reading guide:
 * 1. This is the C standard-library sorting shortcut, not a hand-written sort.
 * 2. qsort receives the array, element count, element size and a comparator.
 * 3. The comparator returns negative/zero/positive for less/equal/greater.
 *
 * Complexity: O(n log n) comparisons on average; extra space is
 *   implementation-defined.
 * Convention: 0-based array; qsort is not guaranteed stable.
 */

#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>

static int compare_int(const void *left, const void *right) {
    int a = *(const int *)left;
    int b = *(const int *)right;
    /* Compare instead of subtracting, so large values cannot overflow. */
    return (a > b) - (a < b);
}

static void print_values(const int *values, size_t length) {
    for (size_t index = 0; index < length; ++index) {
        printf(" %d", values[index]);
    }
}

int main(void) {
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    size_t length = sizeof(values) / sizeof(values[0]);

    qsort(values, length, sizeof(values[0]), compare_int);
    printf("sorted:");
    print_values(values, length);
    printf("\n");

    int empty[1] = {0};
    int single[] = {42};
    qsort(empty, 0, sizeof(empty[0]), compare_int);
    qsort(single, 1, sizeof(single[0]), compare_int);
    printf("empty:ok single:%d\n", single[0]);
    return 0;
}
