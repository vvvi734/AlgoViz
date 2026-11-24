/*
 * RISK-06 harness: tournament sort must accept more than the old 12-record ceiling.
 * The production main is renamed so the static sorting routine can be called directly.
 */
#define main tournament_demo_main
#include "../sources/tournament/tournament_sort.c"
#undef main

int main(void)
{
    int values[64];
    for (int index = 0; index < 64; index += 1)
    {
        values[index] = (index * 37) % 19 - 9;
    }
    Record sorted[64];
    if (!TournamentSort(values, 64, sorted))
    {
        printf("FAIL: TournamentSort rejected 64 records\n");
        return 1;
    }
    for (int index = 0; index < 63; index += 1)
    {
        if (sorted[index].value > sorted[index + 1].value)
        {
            printf("FAIL: not sorted at %d\n", index);
            return 2;
        }
    }
    printf("PASS: 64 records sorted\n");
    return 0;
}
