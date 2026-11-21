/*
 * AlgoViz 参考代码 · 朴素模式匹配（BF） · C11
 * 原理实现
 *
 * 中文导读：逐个枚举模式串在主串中的对齐起点，每个起点都从 P[0] 重新逐位比较；命中后仍继续下一起点，因此不会漏掉重叠出现。
 *
 * 思路：外层枚举模式串首字符对齐到主串的每个合法起点 s，内层令 j 从 0
 *   开始逐位比较 text[s + j] 与 pattern[j]。字符相同就继续；一旦不同，
 *   当前起点不可能完整匹配，直接令 s 右移一格、j 归零，从头再比。
 *   若 j 走到 m，说明整段模式串都已匹配，记录起点 s，然后仍继续检查
 *   s + 1，因此重叠出现也会被保留。
 *
 * 输入输出：text 是主串，pattern 是非空模式串；starts 接收全部 0 基匹配
 *   起点，capacity 是它的可写槽数。返回匹配个数；空模式串、空指针或
 *   starts 容量不足时返回 -1。
 *
 * 关键不变量：外层 s 始终满足 0 <= s <= n - m；内层每次比较的主串位置
 *   都是 s + j，j 只是模式串内偏移，不是主串绝对下标；matches 严格递增。
 *
 * 易错点：外层写成 s < n 会越界；失配只清 j 而忘了右移 s 会死循环；
 *   找到第一个匹配就返回会漏掉重叠；把空模式串当作“处处匹配”。
 *
 * 复杂度：最坏 O(nm) 时间；除结果数组外只用常数个下标与计数，O(1) 空间。
 */

#include <stdio.h>
#include <string.h>

/*
 * 在 text 中找出 pattern 的全部匹配起点（允许重叠）。
 *
 * text      主串，允许为空串；空串没有任何候选起点。
 * pattern   模式串，必须非空。
 * starts    输出缓冲区，按递增顺序写入每一个 0 基起点。
 * capacity  starts 最多能写多少个整数。
 *
 * 返回匹配个数；参数非法或缓冲区装不下全部结果时返回 -1。
 * 本函数不修改输入字符串，也不分配堆内存。
 */
int bf_find_all(const char *text, const char *pattern, int *starts, int capacity)
{
    if (text == NULL || pattern == NULL || starts == NULL)
    {
        return -1;
    }

    int n = (int)strlen(text);
    int m = (int)strlen(pattern);
    if (m == 0)
    {
        return -1;
    }

    // n < m 时连一个完整对齐都放不下，直接返回 0，不能进入候选循环。
    if (n < m)
    {
        return 0;
    }

    int matches = 0;
    int candidate_count = n - m + 1;

    // 外层只枚举合法起点；s 再大就会让 s + m - 1 越过主串末尾。
    for (int s = 0; s < candidate_count; ++s)
    {
        int j = 0;

        // j 同时表示“已确认相等的前缀长度”和“下一个待比较的模式下标”。
        while (j < m && text[s + j] == pattern[j])
        {
            ++j;
        }

        // 内层自然结束时 j == m，表示 m 个字符全部相等，而不只是某一对相等。
        if (j == m)
        {
            if (matches == capacity)
            {
                return -1;
            }
            starts[matches] = s;
            ++matches;
        }

        // 这里不 break：一个起点成功后仍要检查 s + 1，才能保留重叠匹配。
    }

    return matches;
}

/*
 * 演示入口：用同一组输入验证普通匹配、重叠匹配、无匹配和非法空模式串。
 * 输出只用于人工核对，不参与算法本身。
 */
int main(void)
{
    int starts[16];

    const char *text = "ABABABCABABABC";
    const char *pattern = "ABABC";
    int count = bf_find_all(text, pattern, starts, 16);
    printf("matches = %d\n", count);
    for (int i = 0; i < count; ++i)
    {
        printf("start[%d] = %d\n", i, starts[i]);
    }

    // AAAAA 中查找 AAA 应得到 0、1、2，验证成功后继续右移的语义。
    int overlap_count = bf_find_all("AAAAA", "AAA", starts, 16);
    printf("overlapping = %d\n", overlap_count);

    // 模式串比主串长时没有合法起点，返回 0 而不是 -1。
    printf("shorter text = %d\n", bf_find_all("AB", "ABC", starts, 16));

    // 空模式串没有定义好的匹配语义，作为参数错误返回 -1。
    printf("empty pattern = %d\n", bf_find_all("ABC", "", starts, 16));
    return 0;
}
