/*
 * Shell sort in C11.
 *
 * Insertion-sort each subsequence whose elements are gap positions apart, then
 * shrink the gap and finish with gap 1. The cost depends on the gap sequence;
 * halving gaps gives O(n^2) worst case. The usual implementation is not stable.
 * Extra space O(1).
 */

#include <stdio.h>

// Each gap pass insertion-sorts independent subsequences; gap 1 is the final ordinary insertion sort.
void ShellSort(int *values, int count)
{
    for (int gap = count / 2; gap > 0; gap /= 2) {
        for (int start = gap; start < count; ++start) {
            int key = values[start];
            int position = start;
            while (position >= gap && values[position - gap] > key) {
                values[position] = values[position - gap];
                position -= gap;
            }
            values[position] = key;
        }
    }
}

int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    ShellSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index) {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
