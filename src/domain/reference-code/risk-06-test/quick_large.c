/*
 * RISK-06 harness: quicksort must stay correct and avoid O(n) stack on ordered input.
 */
#define main quick_demo_main
#include <stdlib.h>
#include "../sources/quick/quick_sort.c"
#undef main

int main(void)
{
    const int count = 200000;
    int *values = (int *)malloc((size_t)count * sizeof(int));
    if (values == NULL)
    {
        printf("FAIL: allocation\n");
        return 1;
    }
    for (int index = 0; index < count; index += 1)
    {
        values[index] = index;
    }
    QuickSort(values, count);
    for (int index = 0; index < count; index += 1)
    {
        if (values[index] != index)
        {
            printf("FAIL: ascending order at %d\n", index);
            free(values);
            return 2;
        }
    }
    for (int index = 0; index < count; index += 1)
    {
        values[index] = count - index;
    }
    QuickSort(values, count);
    for (int index = 0; index < count; index += 1)
    {
        if (values[index] != index + 1)
        {
            printf("FAIL: descending order at %d\n", index);
            free(values);
            return 3;
        }
    }
    free(values);
    printf("PASS: 200000 ordered records sorted twice\n");
    return 0;
}
