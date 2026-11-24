/*
 * RISK-06 harness: multiway merge must accept more runs and records than the old MAX_K/MAX_RECORDS arrays.
 */
#define main multiway_demo_main
#include "../sources/multiway/multiway_merge.c"
#undef main

int main(void)
{
    enum { RUN_COUNT = 7, RUN_LENGTH = 6 };
    int values[RUN_COUNT][RUN_LENGTH];
    Record records[RUN_COUNT][RUN_LENGTH];
    InputRun runs[RUN_COUNT];
    for (int runIndex = 0; runIndex < RUN_COUNT; runIndex += 1)
    {
        for (int slot = 0; slot < RUN_LENGTH; slot += 1)
        {
            values[runIndex][slot] = runIndex + slot * RUN_COUNT;
            records[runIndex][slot].value = values[runIndex][slot];
            records[runIndex][slot].originalIndex = runIndex * RUN_LENGTH + slot;
        }
        runs[runIndex].records = records[runIndex];
        runs[runIndex].length = RUN_LENGTH;
        runs[runIndex].cursor = 0;
        runs[runIndex].buffer = NULL;
        runs[runIndex].bufferLength = 0;
    }

    int reads = 0;
    int writes = 0;
    int total = MultiwayMerge(runs, RUN_COUNT, 3, 2, &reads, &writes);
    if (total != RUN_COUNT * RUN_LENGTH)
    {
        printf("FAIL: total=%d expected=%d\n", total, RUN_COUNT * RUN_LENGTH);
        return 1;
    }
    printf("PASS: %d runs, %d records, reads=%d writes=%d\n", RUN_COUNT, total, reads, writes);
    return 0;
}
