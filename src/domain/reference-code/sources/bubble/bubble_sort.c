/*
 * AlgoViz reference implementation: bubble sort.
 * Original code written for this repository under the MIT License.
 * This is the manual exchange-sort version; qsort is intentionally not used.
 */

#include <stddef.h>
#include <stdio.h>

static void swap_int(int *left, int *right) {
    int temporary = *left;
    *left = *right;
    *right = temporary;
}

void bubble_sort(int *values, int length) {
    int swapped;
    for (int end = length - 1; end > 0; --end) {
        swapped = 0;
        for (int index = 0; index < end; ++index) {
            if (values[index] > values[index + 1]) {
                swap_int(&values[index], &values[index + 1]);
                swapped = 1;
            }
        }
        /* No swap in a full pass means the remaining prefix is already sorted. */
        if (!swapped) {
            break;
        }
    }
}

static void print_values(const int *values, int length) {
    for (int index = 0; index < length; ++index) {
        printf(" %d", values[index]);
    }
}

int main(void) {
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int length = (int)(sizeof(values) / sizeof(values[0]));

    bubble_sort(values, length);
    printf("sorted:");
    print_values(values, length);
    printf("\n");

    int empty[1] = {0};
    int single[] = {42};
    bubble_sort(empty, 0);
    bubble_sort(single, 1);
    printf("empty:ok single:%d\n", single[0]);
    return 0;
}
