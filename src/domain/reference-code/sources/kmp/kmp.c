/*
 * 中文导读：利用模式串自身的最长相等前后缀，匹配失败时不回退主串指针。
 * 阅读顺序：先看 next 表的 1 基约定；再看构建时 border=next[border] 的回退；最后看匹配循环为何只前进 i。
 * 关键不变量：next[0]=-1；对 t>=1，next[t] 是 pattern[0..t-1] 的最长真 border 长度。失配位置 i 使用 next[i]。
 * 易错点：把 next[t] 说成 pattern[0..t] 的 border；把“回退位置”和“长度”混用；空模式串按匹配处理；下标从 0/1 混用。
 * 复杂度：预处理 O(m)，匹配 O(n)，总 O(n+m)，空间 O(m)。
 * 输入/输出：输入主串与非空模式串；返回全部 0 基匹配起点或匹配次数；main 打印结果。
*/

/*
 * KMP pattern matching in C11.
 *
 * Build a one-based failure table for the pattern: next[i] is the length of the
 * longest proper prefix that is also a suffix of pattern[0..i-1], with
 * next[0] = -1. Matching then never moves the text pointer backwards; on a
 * mismatch it falls back to the longest known border. O(n + m) time and O(m)
 * space. After a match the table is applied again to report overlapping hits.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Purpose: Build the one-based failure table next[0..m].
/*
 * 作用：构造 1 基失败表 next[0..m]。
 * 参数：pattern 是以 '\0' 结尾的非空模式串；next 至少有 m+1 个 int 槽。
 * 返回：无返回值。next[0] 固定为 -1；next[t] 对应前缀 pattern[0..t-1]。
 * 副作用：只写 next，不修改 pattern。
 * 不变量：position 是当前前缀长度，border 是该前缀的最长真 border 长度。
 */
void get_next(const char *pattern, int next[])
{
    // position is the prefix length being extended; border is that prefix's longest proper border length.
    int position = 0;
    int border = -1;
    // -1 is a sentinel, not a real border: at the first pattern character there is no shorter prefix to fall back to.
    next[0] = -1;
    // Build one table entry per prefix: position is also the next pattern character to compare against pattern[border].
    while (pattern[position] != '\0')
    {
        // The border can be extended when border is -1 (start fresh) or the two next characters match; either way the new length grows by one.
        if (border == -1 || pattern[position] == pattern[border])
        {
            ++position;
            ++border;
            // After extension, next[position] records the border length of the prefix ending at position-1, which is exactly one-based next.
            next[position] = border;
        }
        else
        {
            // The current border cannot be extended, so try the border of that border; next[border] stores that shorter length, not a character index.
            border = next[border];
        }
    }
}

// Purpose: Count occurrences of pattern in text, including overlapping matches.
/*
 * 作用：统计 pattern 在 text 中出现的次数，包含重叠出现。
 * 参数：text 可为空串；pattern 为空串或 malloc 失败时按 0 次处理。
 * 返回：匹配次数，不是首个匹配下标。
 * 副作用：临时分配并释放 next 表；不修改输入字符串。
 * 不变量：text_index 只增不减；pattern_index 等于已匹配前缀长度，最大为 m。
 */
int KMP(const char *text, const char *pattern)
{
    int text_length = (int)strlen(text);
    int pattern_length = (int)strlen(pattern);
    // This C demo defines an empty pattern as zero matches; there is no start position to return, so it does not use the usual matches-everywhere convention.
    if (pattern_length == 0)
    {
        return 0;
    }

    // The table needs m+1 entries: next[m] is reused after a full match to keep the longest overlap.
    int *next = (int *)malloc((size_t)(pattern_length + 1) * sizeof(int));
    // This teaching API maps allocation failure to zero matches; callers cannot distinguish it from a real no-match result.
    if (next == NULL)
    {
        return 0;
    }
    get_next(pattern, next);

    int matches = 0;
    int text_index = 0;
    // pattern_index is the length of the matched prefix, not the index of the last compared pattern character.
    int pattern_index = 0;
    while (text_index < text_length)
    {
        // -1 means no usable border is left; in that case advance both pointers, so the text pointer still never moves backwards.
        if (pattern_index == -1 || text[text_index] == pattern[pattern_index])
        {
            ++text_index;
            ++pattern_index;
        }
        else
        {
            // A mismatch falls back to the longest border of the matched prefix; the text index stays put because that prefix is already known to match.
            pattern_index = next[pattern_index];
        }
        if (pattern_index == pattern_length)
        {
            ++matches;
            // After a full match, reuse the border table so overlapping occurrences are still found.
            pattern_index = next[pattern_index];
        }
    }

    free(next);
    return matches;
}

int main(void)
{
    const char *text = "ababcabcacbab";
    const char *pattern = "abcac";

    printf("text: %s\npattern: %s\nmatches: %d\n", text, pattern, KMP(text, pattern));
    printf("overlapping: %d\n", KMP("aaaaa", "aa"));
    printf("missing: %d\n", KMP("abcdef", "xyz"));
    return 0;
}
