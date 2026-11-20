/*
 * Insertion sort in C11.
 *
 * Maintain a sorted prefix. Lift the next key, shift strictly larger values one
 * slot right, then write the key into the gap. Equal keys do not move, so the
 * sort is stable. Time O(n^2) worst, O(n) best; extra space O(1).
 */

#include <stdio.h>

void InsertionSort(int *values, int count)
{
    for (int index = 1; index < count; ++index) {
        int key = values[index];
        int position = index - 1;
        while (position >= 0 && values[position] > key) {
            values[position + 1] = values[position];
            --position;
        }
        values[position + 1] = key;
    }
}

int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    InsertionSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index) {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
