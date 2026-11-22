#include <stdio.h>

#define main replacement_app_main
#include "../sources/replacement/replacement_selection.c"
#undef main

static int RunsAreSorted(RunResult *runs, int runCount)
{
    for (int runIndex = 0; runIndex < runCount; ++runIndex)
    {
        for (int index = 1; index < runs[runIndex].length; ++index)
        {
            if (!ComesBefore(runs[runIndex].items[index - 1], runs[runIndex].items[index]))
            {
                return 0;
            }
        }
    }
    return 1;
}

static int RunsCover(RunResult *runs, int runCount, int n)
{
    int seen[MAX_RECORDS] = {0};
    int total = 0;
    for (int runIndex = 0; runIndex < runCount; ++runIndex)
    {
        for (int index = 0; index < runs[runIndex].length; ++index)
        {
            int original = runs[runIndex].items[index].originalIndex;
            if (original < 0 || original >= n || seen[original])
            {
                return 0;
            }
            seen[original] = 1;
            total += 1;
        }
    }
    if (total != n)
    {
        return 0;
    }
    for (int index = 0; index < n; ++index)
    {
        if (!seen[index])
        {
            return 0;
        }
    }
    return 1;
}

int main(void)
{
    Item input[MAX_RECORDS] = {
        {7, 0}, {3, 1}, {9, 2}, {1, 3}, {8, 4}, {2, 5}, {6, 6}, {4, 7}, {5, 8}};
    RunResult runs[MAX_RUNS];
    int runCount = ReplacementSelection(input, 9, 3, runs);
    printf("VALID_RUNS=%d VALID_SORTED=%d VALID_COVER=%d\n",
           runCount, RunsAreSorted(runs, runCount), RunsCover(runs, runCount, 9));

    Item maximum[MAX_RECORDS];
    for (int index = 0; index < MAX_RECORDS; ++index)
    {
        maximum[index].value = MAX_RECORDS - index;
        maximum[index].originalIndex = index;
    }
    RunResult maximumRuns[MAX_RUNS];
    int maximumCount = ReplacementSelection(maximum, MAX_RECORDS, 2, maximumRuns);
    printf("MAX_BATCH_RUNS=%d MAX_BATCH_SORTED=%d MAX_BATCH_COVER=%d\n",
           maximumCount, RunsAreSorted(maximumRuns, maximumCount), RunsCover(maximumRuns, maximumCount, MAX_RECORDS));

    printf("EMPTY=%d\n", ReplacementSelection(input, 0, 3, runs));
    printf("CAPACITY_ONE=%d\n", ReplacementSelection(input, 9, 1, runs));
    printf("CAPACITY_SEVEN=%d\n", ReplacementSelection(input, 9, 7, runs));
    printf("TOO_MANY=%d\n", ReplacementSelection(input, MAX_RECORDS + 1, 3, runs));
    printf("NULL_INPUT=%d\n", ReplacementSelection(NULL, 9, 3, runs));
    printf("NULL_RUNS=%d\n", ReplacementSelection(input, 9, 3, NULL));
    printf("MAX_RECORDS=%d MAX_WORKSPACE=%d MAX_RUNS=%d\n", MAX_RECORDS, MAX_WORKSPACE, MAX_RUNS);
    return 0;
}
