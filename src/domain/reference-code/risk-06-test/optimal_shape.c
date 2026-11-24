/*
 * RISK-06 harness: optimal merge tree must keep virtual leaves structural and report internal cost.
 */
#define main optimal_demo_main
#include "../sources/optimal-merge/optimal_merge_tree.c"
#undef main

int main(void)
{
    int weights[5] = {1, 2, 3, 4, 5};
    Node nodes[36];
    int cost = BuildOptimalMergeTree(weights, 5, 3, nodes);
    if (cost != 21)
    {
        printf("FAIL: total cost=%d expected 21\n", cost);
        return 1;
    }
    int virtualCount = 0;
    for (int index = 0; index < 7; index += 1)
    {
        if (nodes[index].kind == VIRTUAL_LEAF)
        {
            virtualCount += 1;
            if (nodes[index].weight != 0)
            {
                printf("FAIL: virtual leaf has weight %d\n", nodes[index].weight);
                return 2;
            }
        }
    }
    printf("PASS: cost=21 virtual=%d\n", virtualCount);
    return 0;
}
