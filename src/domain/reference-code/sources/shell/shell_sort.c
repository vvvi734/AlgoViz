/*
 * AlgoViz reference implementation: Shell sort.
 * Original code written for this repository under the MIT License.
 * Gap insertion sort, halving the gap until the final gap-1 pass.
 */

#include <stddef.h>
#include <stdio.h>

void shell_sort(int *values, int length) {
    for (int gap = length / 2; gap > 0; gap /= 2) {
        for (int index = gap; index < length; ++index) {
            int current = values[index];
            int position = index;
            while (position >= gap && values[position - gap] > current) {
                values[position] = values[position - gap];
                position -= gap;
            }
            values[position] = current;
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

    shell_sort(values, length);
    printf("sorted:");
    print_values(values, length);
    printf("\n");

    int empty[1] = {0};
    int single[] = {42};
    shell_sort(empty, 0);
    shell_sort(single, 1);
    printf("empty:ok single:%d\n", single[0]);
    return 0;
}
