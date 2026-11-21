/*
 * 中文导读：利用模式串自身的最长相等前后缀，匹配失败时不回退主串指针。
 * 阅读顺序：先看 next/prefix 数组每个位置的含义；再看构建时 j=next[j-1] 的回退；最后看匹配循环为何只前进 i。
 * 关键不变量：next[i] 是 pattern[0..i] 的最长相等前后缀长度；回退后已经匹配的前缀仍然成立。
 * 易错点：把 next 定义为“包含当前字符”还是“前一位”混用；回退条件写错；空模式串；下标从 0/1 混用。
 * 复杂度：预处理 O(m)，匹配 O(n)，总 O(n+m)，空间 O(m)。
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

// 作用：构建 next 数组：next[i] 是 pattern[0..i] 的最长相等前后缀长度；失配时按它回退。
void get_next(const char *pattern, int next[])
{
    int position = 0;
    int border = -1;
    next[0] = -1;
    while (pattern[position] != '\0')
    {
        if (border == -1 || pattern[position] == pattern[border])
        {
            ++position;
            ++border;
            next[position] = border;
        }
        else
        {
            // next[] is a one-based failure table; follow its chain instead of restarting the pattern.
            border = next[border];
        }
    }
}

// 作用：在 text 中查找 pattern；i 只前进，失配时用 next 回退模式串指针；返回首次匹配下标。
int KMP(const char *text, const char *pattern)
{
    int text_length = (int)strlen(text);
    int pattern_length = (int)strlen(pattern);
    if (pattern_length == 0)
    {
        return 0;
    }

    int *next = (int *)malloc((size_t)(pattern_length + 1) * sizeof(int));
    if (next == NULL)
    {
        return 0;
    }
    get_next(pattern, next);

    int matches = 0;
    int text_index = 0;
    int pattern_index = 0;
    while (text_index < text_length)
    {
        if (pattern_index == -1 || text[text_index] == pattern[pattern_index])
        {
            ++text_index;
            ++pattern_index;
        }
        else
        {
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

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    const char *text = "ababcabcacbab";
    const char *pattern = "abcac";

    printf("text: %s\npattern: %s\nmatches: %d\n", text, pattern, KMP(text, pattern));
    printf("overlapping: %d\n", KMP("aaaaa", "aa"));
    printf("missing: %d\n", KMP("abcdef", "xyz"));
    return 0;
}
