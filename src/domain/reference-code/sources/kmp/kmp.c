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

void get_next(const char *pattern, int next[])
{
    int position = 0;
    int border = -1;
    next[0] = -1;
    while (pattern[position] != '\0') {
        if (border == -1 || pattern[position] == pattern[border]) {
            ++position;
            ++border;
            next[position] = border;
        } else {
            // next[] is a one-based failure table; follow its chain instead of restarting the pattern.
            border = next[border];
        }
    }
}

int KMP(const char *text, const char *pattern)
{
    int text_length = (int)strlen(text);
    int pattern_length = (int)strlen(pattern);
    if (pattern_length == 0) {
        return 0;
    }

    int *next = (int *)malloc((size_t)(pattern_length + 1) * sizeof(int));
    if (next == NULL) {
        return 0;
    }
    get_next(pattern, next);

    int matches = 0;
    int text_index = 0;
    int pattern_index = 0;
    while (text_index < text_length) {
        if (pattern_index == -1 || text[text_index] == pattern[pattern_index]) {
            ++text_index;
            ++pattern_index;
        } else {
            pattern_index = next[pattern_index];
        }
        if (pattern_index == pattern_length) {
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
