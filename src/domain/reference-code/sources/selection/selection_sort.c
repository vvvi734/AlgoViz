/*
 * AlgoViz reference implementation: selection sort.
 * Original code written for this repository under the MIT License.
 * Each pass selects the smallest remaining element and places it at the front.
 */

#include <stddef.h>
#include <stdio.h>

static void swap_int(int *left, int *right) {
    int temporary = *left;
    *left = *right;
    *right = temporary;
}

void selection_sort(int *values, int length) {
    for (int start = 0; start < length - 1; ++start) {
        int minimum = start;
        for (int index = start + 1; index < length; ++index) {
            if (values[index] < values[minimum]) {
                minimum = index;
            }
        }
        if (minimum != start) {
            swap_int(&values[start], &values[minimum]);
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

    selection_sort(values, length);
    printf("sorted:");
    print_values(values, length);
    printf("\n");

    int empty[1] = {0};
    int single[] = {42};
    selection_sort(empty, 0);
    selection_sort(single, 1);
    printf("empty:ok single:%d\n", single[0]);
    return 0;
}
