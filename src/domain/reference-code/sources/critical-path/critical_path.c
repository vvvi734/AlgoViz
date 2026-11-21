/*
 * 中文导读：在带权有向无环图上求事件最早/最迟发生时间，找出决定总工期的活动链。
 * 阅读顺序：先看拓扑排序求 ve；再看逆拓扑求 vl；最后用 e/vl 差值为 0 判定关键活动。
 * 关键不变量：ve 只能由所有前驱完成后确定；vl 必须由所有后继的最迟时间倒推。
 * 易错点：把边权当成点权；入度/出度更新不对称；多个终点时没有统一汇点；e/l 公式记反。
 * 复杂度：O(V+E) 时间，O(V+E) 空间。
 * 输入/输出：输入 AOE 网的活动边与持续时间；输出最早/最迟开始时间、时间余量与关键活动。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * Critical path on an activity-on-edge network in C11.
 *
 * Events are vertices; activities are directed edges with a duration. The
 * earliest event time is the longest path from the source, and the latest event
 * time is the longest path that still meets the project deadline. An activity is
 * critical when its earliest start equals its latest start. Edges are listed in
 * topological order, so forward and backward passes each scan the list once.
 */

#include <stdio.h>

#define EVENT_COUNT 6
#define ACTIVITY_COUNT 8

typedef struct
{
    int from;
    int to;
    int duration;
} Activity;

static const Activity ACTIVITIES[ACTIVITY_COUNT] = {
    {0, 1, 3}, {0, 2, 2}, {1, 3, 2}, {1, 4, 3}, {2, 3, 4}, {2, 5, 3}, {3, 5, 2}, {4, 5, 1},
};

// Forward pass takes the maximum predecessor finish; backward pass the minimum successor start; activity slack is latest(head) - earliest(tail) - weight.
// 作用：先拓扑排序求事件最早时间 ve，再逆拓扑求最迟 vl，最后找 e 与 l 相等的关键活动。
void CriticalPath(void)
{
    int earliest[EVENT_COUNT] = {0};
    int latest[EVENT_COUNT];

    for (int index = 0; index < ACTIVITY_COUNT; ++index)
    {
        int candidate = earliest[ACTIVITIES[index].from] + ACTIVITIES[index].duration;
        if (candidate > earliest[ACTIVITIES[index].to])
        {
            earliest[ACTIVITIES[index].to] = candidate;
        }
    }
    for (int event = 0; event < EVENT_COUNT; ++event)
    {
        latest[event] = earliest[EVENT_COUNT - 1];
    }
    for (int index = ACTIVITY_COUNT - 1; index >= 0; --index)
    {
        int candidate = latest[ACTIVITIES[index].to] - ACTIVITIES[index].duration;
        if (candidate < latest[ACTIVITIES[index].from])
        {
            latest[ACTIVITIES[index].from] = candidate;
        }
    }

    printf("earliest:");
    for (int event = 0; event < EVENT_COUNT; ++event)
    {
        printf(" %d", earliest[event]);
    }
    printf("\nlatest:");
    for (int event = 0; event < EVENT_COUNT; ++event)
    {
        printf(" %d", latest[event]);
    }
    printf("\ncritical activities:\n");
    for (int index = 0; index < ACTIVITY_COUNT; ++index)
    {
        int early_start = earliest[ACTIVITIES[index].from];
        int late_start = latest[ACTIVITIES[index].to] - ACTIVITIES[index].duration;
        if (early_start == late_start)
        {
            printf("%d -> %d: %d\n", ACTIVITIES[index].from, ACTIVITIES[index].to,
                   ACTIVITIES[index].duration);
        }
    }
    printf("project duration: %d\n", earliest[EVENT_COUNT - 1]);
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    CriticalPath();
    return 0;
}
