/*
 * 中文导读：在带权有向无环图上求事件最早/最迟发生时间，找出决定总工期的活动链。
 * 阅读顺序：先看拓扑排序求 ve；再看逆拓扑求 vl；最后用 e/vl 差值为 0 判定关键活动。
 * 关键不变量：ve 只能由所有前驱完成后确定；vl 必须由所有后继的最迟时间倒推。
 * 易错点：把边权当成点权；入度/出度更新不对称；多个终点时没有统一汇点；e/l 公式记反。
 * 复杂度：O(V+E) 时间，O(V+E) 空间。
 * 输入/输出：输入 AOE 网的活动边与持续时间；输出最早/最迟开始时间、时间余量与关键活动。
*/

/*
 * Critical path on an activity-on-edge network in C11.
 *
 * Events are vertices; activities are directed edges with a duration. The
 * earliest event time is the longest path from the source, and the latest event
 * time is the longest path that still meets the project deadline. An activity is
 * critical when its earliest start equals its latest start. A Kahn pass builds
 * the processing order, so the activity array does not have to be sorted.
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

// Forward pass takes the maximum predecessor finish; backward pass the minimum successor start; activity slack is latest[to] - weight - earliest[from].
// Purpose: Topologically compute earliest event times ve, then reverse-topologically compute latest vl, and finally select activities whose e equals l.
// 作用：先拓扑排序求事件最早时间 ve，再逆拓扑求最迟 vl，最后找 e 与 l 相等的关键活动。
void CriticalPath(void)
{
    int earliest[EVENT_COUNT] = {0};
    int latest[EVENT_COUNT];
    int indegree[EVENT_COUNT] = {0};
    int order[EVENT_COUNT];
    int order_count = 0;
    int queue[EVENT_COUNT];
    int head = 0;
    int tail = 0;

    // Build a real topological order first; the activity array is data, not a promise that edges already appear in topological order.
    for (int index = 0; index < ACTIVITY_COUNT; ++index)
    {
        ++indegree[ACTIVITIES[index].to];
    }
    for (int event = 0; event < EVENT_COUNT; ++event)
    {
        if (indegree[event] == 0)
        {
            queue[tail++] = event;
        }
    }
    while (head < tail)
    {
        int event = queue[head++];
        order[order_count++] = event;
        for (int index = 0; index < ACTIVITY_COUNT; ++index)
        {
            if (ACTIVITIES[index].from == event && --indegree[ACTIVITIES[index].to] == 0)
            {
                queue[tail++] = ACTIVITIES[index].to;
            }
        }
    }
    if (order_count != EVENT_COUNT)
    {
        printf("cycle detected\n");
        return;
    }

    // Process events in topological order, so every predecessor has already contributed its finish time.
    for (int position = 0; position < order_count; ++position)
    {
        int event = order[position];
        for (int index = 0; index < ACTIVITY_COUNT; ++index)
        {
            if (ACTIVITIES[index].from == event)
            {
                // Earliest time is the latest possible finish over all incoming activities; taking max prevents a later predecessor from being ignored.
                int candidate = earliest[event] + ACTIVITIES[index].duration;
                if (candidate > earliest[ACTIVITIES[index].to])
                {
                    earliest[ACTIVITIES[index].to] = candidate;
                }
            }
        }
    }

    // The project duration is the maximum event time, not the last array slot; multiple sinks must share this deadline.
    int project_duration = 0;
    for (int event = 0; event < EVENT_COUNT; ++event)
    {
        if (earliest[event] > project_duration)
        {
            project_duration = earliest[event];
        }
    }
    // Latest times start at the shared project deadline; reverse topological relaxation lowers every non-sink event.
    for (int event = 0; event < EVENT_COUNT; ++event)
    {
        latest[event] = project_duration;
    }
    // Walk the reverse topological order produced by Kahn; an arbitrary edge order would leave latest times incomplete.
    for (int position = order_count - 1; position >= 0; --position)
    {
        int event = order[position];
        for (int index = 0; index < ACTIVITY_COUNT; ++index)
        {
            if (ACTIVITIES[index].from == event)
            {
                // Latest time is the minimum of successor latest minus duration; a smaller candidate forces this predecessor to start earlier.
                int candidate = latest[ACTIVITIES[index].to] - ACTIVITIES[index].duration;
                if (candidate < latest[event])
                {
                    latest[event] = candidate;
                }
            }
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
        // Zero slack is the activity-level certificate: earliest start equals latest start, so any delay moves the project.
        if (early_start == late_start)
        {
            printf("%d -> %d: %d\n", ACTIVITIES[index].from, ACTIVITIES[index].to,
                   ACTIVITIES[index].duration);
        }
    }
    printf("project duration: %d\n", project_duration);
}

int main(void)
{
    CriticalPath();
    return 0;
}
