#include <stdio.h>
#include <string.h>

#define main articulation_app_main
#include "../sources/articulation/articulation.c"
#undef main

static int GraphMatches(int graph[VERTEX_COUNT][VERTEX_COUNT], int expected[VERTEX_COUNT][VERTEX_COUNT])
{
    for (int row = 0; row < VERTEX_COUNT; ++row)
    {
        for (int column = 0; column < VERTEX_COUNT; ++column)
        {
            if (graph[row][column] != expected[row][column])
            {
                return 0;
            }
        }
    }
    return 1;
}

int main(void)
{
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    printf("ADD_VALID=%d\n", add_edge(graph, 0, 1));
    printf("ADD_NEGATIVE=%d\n", add_edge(graph, -1, 0));
    printf("ADD_TOO_LARGE=%d\n", add_edge(graph, VERTEX_COUNT, 0));
    printf("ADD_NULL_GRAPH=%d\n", add_edge(NULL, 0, 1));
    int expected[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    expected[0][1] = expected[1][0] = 1;
    printf("INVALID_EDGES_KEEP_GRAPH=%d\n", GraphMatches(graph, expected));

    int teaching[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    add_edge(teaching, 0, 1);
    add_edge(teaching, 1, 2);
    add_edge(teaching, 2, 0);
    add_edge(teaching, 2, 3);
    add_edge(teaching, 3, 4);
    add_edge(teaching, 3, 5);
    add_edge(teaching, 4, 5);
    add_edge(teaching, 6, 7);
    printf("FIRST_RESULT=%d\n", find_articulation_points(teaching));
    printf("FIRST_ART=%d%d%d%d%d%d%d%d\n", articulation[0], articulation[1], articulation[2], articulation[3], articulation[4], articulation[5], articulation[6], articulation[7]);
    printf("FIRST_BRIDGE_23=%d FIRST_BRIDGE_67=%d FIRST_TIMER=%d\n", bridge[2][3], bridge[6][7], timer);
    printf("SECOND_RESULT=%d\n", find_articulation_points(teaching));
    printf("SECOND_ART=%d%d%d%d%d%d%d%d\n", articulation[0], articulation[1], articulation[2], articulation[3], articulation[4], articulation[5], articulation[6], articulation[7]);
    printf("SECOND_BRIDGE_23=%d SECOND_BRIDGE_67=%d SECOND_TIMER=%d\n", bridge[2][3], bridge[6][7], timer);

    int single[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    add_edge(single, 0, 1);
    printf("SINGLE_RESULT=%d\n", find_articulation_points(single));
    printf("SINGLE_ART=%d%d%d%d%d%d%d%d\n", articulation[0], articulation[1], articulation[2], articulation[3], articulation[4], articulation[5], articulation[6], articulation[7]);
    printf("SINGLE_BRIDGE_01=%d OLD_BRIDGE_23=%d OLD_BRIDGE_67=%d SINGLE_TIMER=%d\n", bridge[0][1], bridge[2][3], bridge[6][7], timer);
    printf("NULL_GRAPH=%d\n", find_articulation_points(NULL));

    int star[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    add_edge(star, 0, 1);
    add_edge(star, 0, 2);
    add_edge(star, 0, 3);
    find_articulation_points(star);
    printf("STAR_ART=%d%d%d%d ROOT_STAR_BRIDGES=%d,%d,%d\n", articulation[0], articulation[1], articulation[2], articulation[3], bridge[0][1], bridge[0][2], bridge[0][3]);
    return 0;
}
