/*
 * Quicksort in C11.
 *
 * Lomuto partition: use the last element as pivot, move values not greater than
 * the pivot to the left, then place the pivot in its final slot and recurse on
 * both sides. Average O(n log n), worst O(n^2); recursion space O(log n) average.
 * The partition is not stable.
 */

#include <stdio.h>

static int Partition(int *values, int low, int high)
{
    int pivot = values[high];
    int boundary = low - 1;

    for (int index = low; index < high; ++index) {
        if (values[index] <= pivot) {
            ++boundary;
            int temporary = values[boundary];
            values[boundary] = values[index];
            values[index] = temporary;
        }
    }
    int temporary = values[boundary + 1];
    values[boundary + 1] = values[high];
    values[high] = temporary;
    return boundary + 1;
}

static void QuickSortRange(int *values, int low, int high)
{
    if (low >= high) {
        return;
    }
    int pivot = Partition(values, low, high);
    QuickSortRange(values, low, pivot - 1);
    QuickSortRange(values, pivot + 1, high);
}

void QuickSort(int *values, int count)
{
    if (count <= 1) {
        return;
    }
    QuickSortRange(values, 0, count - 1);
}

int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    QuickSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index) {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
