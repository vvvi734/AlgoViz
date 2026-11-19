/*
 * AlgoViz reference implementation: insertion sort.
 * Original code written for this repository under the MIT License.
 * The sorted prefix grows one element at a time; larger elements shift right.
 */

#include <stddef.h>
#include <stdio.h>

void insertion_sort(int *values, int length) {
    for (int index = 1; index < length; ++index) {
        int current = values[index];
        int position = index - 1;
        while (position >= 0 && values[position] > current) {
            values[position + 1] = values[position];
            --position;
        }
        values[position + 1] = current;
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

    insertion_sort(values, length);
    printf("sorted:");
    print_values(values, length);
    printf("\n");

    int empty[1] = {0};
    int single[] = {42};
    insertion_sort(empty, 0);
    insertion_sort(single, 1);
    printf("empty:ok single:%d\n", single[0]);
    return 0;
}
