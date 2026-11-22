#include <cstdio>
#include <vector>

#define main articulation_app_main
#include "../sources/articulation/articulation.cpp"
#undef main

int main()
{
    std::vector<std::vector<int>> graph(VERTEX_COUNT, std::vector<int>(VERTEX_COUNT, 0));
    printf("ADD_VALID=%d\n", (int)addEdge(graph, 0, 1));
    printf("ADD_NEGATIVE=%d\n", (int)addEdge(graph, -1, 0));
    printf("ADD_TOO_LARGE=%d\n", (int)addEdge(graph, VERTEX_COUNT, 0));

    std::vector<std::vector<int>> teaching(VERTEX_COUNT, std::vector<int>(VERTEX_COUNT, 0));
    addEdge(teaching, 0, 1);
    addEdge(teaching, 1, 2);
    addEdge(teaching, 2, 0);
    addEdge(teaching, 2, 3);
    addEdge(teaching, 3, 4);
    addEdge(teaching, 3, 5);
    addEdge(teaching, 4, 5);
    addEdge(teaching, 6, 7);
    printf("FIRST_RESULT=%d\n", (int)findArticulationPoints(teaching));
    printf("FIRST_ART=%d%d%d%d%d%d%d%d\n", (int)articulation[0], (int)articulation[1], (int)articulation[2], (int)articulation[3], (int)articulation[4], (int)articulation[5], (int)articulation[6], (int)articulation[7]);
    printf("FIRST_BRIDGE_23=%d FIRST_BRIDGE_67=%d FIRST_TIMER=%d\n", (int)bridges[2][3], (int)bridges[6][7], timer);
    printf("SECOND_RESULT=%d\n", (int)findArticulationPoints(teaching));
    printf("SECOND_ART=%d%d%d%d%d%d%d%d\n", (int)articulation[0], (int)articulation[1], (int)articulation[2], (int)articulation[3], (int)articulation[4], (int)articulation[5], (int)articulation[6], (int)articulation[7]);
    printf("SECOND_BRIDGE_23=%d SECOND_BRIDGE_67=%d SECOND_TIMER=%d\n", (int)bridges[2][3], (int)bridges[6][7], timer);

    std::vector<std::vector<int>> single(VERTEX_COUNT, std::vector<int>(VERTEX_COUNT, 0));
    addEdge(single, 0, 1);
    printf("SINGLE_RESULT=%d\n", (int)findArticulationPoints(single));
    printf("SINGLE_ART=%d%d%d%d%d%d%d%d\n", (int)articulation[0], (int)articulation[1], (int)articulation[2], (int)articulation[3], (int)articulation[4], (int)articulation[5], (int)articulation[6], (int)articulation[7]);
    printf("SINGLE_BRIDGE_01=%d OLD_BRIDGE_23=%d OLD_BRIDGE_67=%d SINGLE_TIMER=%d\n", (int)bridges[0][1], (int)bridges[2][3], (int)bridges[6][7], timer);

    std::vector<std::vector<int>> star(VERTEX_COUNT, std::vector<int>(VERTEX_COUNT, 0));
    addEdge(star, 0, 1);
    addEdge(star, 0, 2);
    addEdge(star, 0, 3);
    findArticulationPoints(star);
    printf("STAR_ART=%d%d%d%d ROOT_STAR_BRIDGES=%d,%d,%d\n", (int)articulation[0], (int)articulation[1], (int)articulation[2], (int)articulation[3], (int)bridges[0][1], (int)bridges[0][2], (int)bridges[0][3]);

    std::vector<std::vector<int>> wrong(7, std::vector<int>(VERTEX_COUNT, 0));
    printf("WRONG_SHAPE_ADD=%d\n", (int)addEdge(wrong, 0, 1));
    printf("WRONG_SHAPE_FIND=%d\n", (int)findArticulationPoints(wrong));
    printf("WRONG_SHAPE_KEEPS=%d\n", (int)(articulation[0] == true && bridges[0][1] == true));
    return 0;
}
