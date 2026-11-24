/*
 * RISK-06 harness: ISAM C must reject the overflow record that would exceed MAX_OVERFLOW
 * instead of writing overflow[overflowCount].
 */
#define main isam_demo_main
#include "../sources/isam/isam_file.c"
#undef main

int main(void)
{
    IsamFile file = {0};
    file.blocks[0].records[0] = (Record){101, "A"};
    file.blocks[0].records[1] = (Record){102, "B"};
    file.blocks[0].length = 2;
    file.blocks[0].overflowHead = -1;
    file.blockCount = 1;
    RefreshBounds(&file);

    int accepted = 0;
    for (int index = 0; index < 14; index += 1)
    {
        if (Insert(&file, (Record){103 + index, "X"}))
        {
            accepted += 1;
        }
        else
        {
            break;
        }
    }
    if (file.overflowCount > MAX_OVERFLOW)
    {
        printf("FAIL: overflowCount=%d exceeds MAX_OVERFLOW=%d\n", file.overflowCount, MAX_OVERFLOW);
        return 1;
    }
    int isOverflow = 0;
    int found = Lookup(&file, 103 + accepted - 1, &isOverflow);
    if (found < 0)
    {
        printf("FAIL: last accepted record is not reachable\n");
        return 2;
    }
    printf("PASS: accepted=%d overflowNodes=%d lastHit=%d\n", accepted, file.overflowCount, found);
    return 0;
}
