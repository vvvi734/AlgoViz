/*
 * AlgoViz reference implementation: quicksort.
 * Original code written for this repository under the MIT License.
 * Lomuto partition: <= pivot goes left, > pivot goes right.
 */

#include <stddef.h>
#include <stdio.h>

static void swap_int(int *left, int *right) {
    int temporary = *left;
    *left = *right;
    *right = temporary;
}

static int partition(int *values, int low, int high) {
    int pivot = values[high];
    int boundary = low - 1;
    for (int index = low; index < high; ++index) {
        if (values[index] <= pivot) {
            ++boundary;
            swap_int(&values[boundary], &values[index]);
        }
    }
    swap_int(&values[boundary + 1], &values[high]);
    return boundary + 1;
}

static void quick_sort_range(int *values, int low, int high) {
    if (low >= high) {
        return;
    }
    int middle = partition(values, low, high);
    quick_sort_range(values, low, middle - 1);
    quick_sort_range(values, middle + 1, high);
}

void quick_sort(int *values, int length) {
    quick_sort_range(values, 0, length - 1);
}

static void print_values(const int *values, int length) {
    for (int index = 0; index < length; ++index) {
        printf(" %d", values[index]);
    }
}

int main(void) {
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int length = (int)(sizeof(values) / sizeof(values[0]));

    quick_sort(values, length);
    printf("sorted:");
    print_values(values, length);
    printf("\n");

    int empty[1] = {0};
    int single[] = {42};
    quick_sort(empty, 0);
    quick_sort(single, 1);
    printf("empty:ok single:%d\n", single[0]);
    return 0;
}
