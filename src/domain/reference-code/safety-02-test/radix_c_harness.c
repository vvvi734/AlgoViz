#include <stdio.h>

#define main radix_app_main
#include "../sources/radix/radix_sort.c"
#undef main

int main(void)
{
    Record records[8] = {
        {170, 0}, {45, 1}, {45, 2}, {90, 3}, {802, 4}, {24, 5}, {2, 6}, {66, 7}};
    int result = RadixSort(records, 8);
    printf("NORMAL_RESULT=%d\n", result);
    printf("NORMAL_ORDER");
    for (int index = 0; index < 8; ++index)
    {
        printf(" (%d,%d)", records[index].value, records[index].originalIndex);
    }
    printf("\n");

    Record negative = {-1, 42};
    result = RadixSort(&negative, 1);
    printf("NEGATIVE=%d NEGATIVE_UNCHANGED=%d,%d\n", result, negative.value, negative.originalIndex);
    Record too_large = {10000, 43};
    result = RadixSort(&too_large, 1);
    printf("TOO_LARGE=%d TOO_LARGE_UNCHANGED=%d,%d\n", result, too_large.value, too_large.originalIndex);
    printf("NULL=%d\n", RadixSort(NULL, 3));
    printf("EMPTY=%d\n", RadixSort(records, 0));
    printf("TOO_MANY=%d\n", RadixSort(records, MAX_RECORDS + 1));

    Record maximum[16];
    for (int index = 0; index < MAX_RECORDS; ++index)
    {
        maximum[index].value = MAX_RECORDS - index;
        maximum[index].originalIndex = index;
    }
    result = RadixSort(maximum, MAX_RECORDS);
    printf("MAX_BATCH_RESULT=%d MAX_BATCH_FIRST=%d MAX_BATCH_LAST=%d\n", result, maximum[0].value, maximum[MAX_RECORDS - 1].value);
    return 0;
}
