/*
 * KMP pattern matching — original C implementation, MIT.
 *
 * LPS convention used here: 0-based, lps[k] is the length of the longest
 * proper prefix of pattern[0..k] that is also a suffix. On a mismatch, j moves
 * to lps[j - 1]; the text pointer i never moves backwards.
 *
 * The demo works byte by byte, which is fine for the ASCII examples. For
 * UTF-8 input, operate on decoded code points if positions must be characters.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void build_lps(const char *pattern, int m, int *lps)
{
    int i = 1;
    int j = 0;

    lps[0] = 0;
    while (i < m) {
        if (pattern[i] == pattern[j]) {
            lps[i] = ++j;
            ++i;
        } else if (j > 0) {
            j = lps[j - 1];
        } else {
            lps[i] = 0;
            ++i;
        }
    }
}

/*
 * Writes up to max_starts match starts into starts[] and returns the number of
 * matches found; overlapping matches are included.
 */
static int kmp_find_all(const char *text, const char *pattern,
                        int *starts, int max_starts)
{
    int n = (int)strlen(text);
    int m = (int)strlen(pattern);
    int i = 0;
    int j = 0;
    int count = 0;
    int *lps;

    if (m == 0) {
        return 0;
    }

    lps = (int *)malloc((size_t)m * sizeof(int));
    if (lps == NULL) {
        return 0;
    }
    build_lps(pattern, m, lps);

    while (i < n) {
        if (text[i] == pattern[j]) {
            ++i;
            ++j;
            if (j == m) {
                if (count < max_starts) {
                    starts[count] = i - m;
                }
                ++count;
                j = lps[j - 1];
            }
        } else if (j > 0) {
            j = lps[j - 1];
        } else {
            ++i;
        }
    }

    free(lps);
    return count;
}

int main(void)
{
    const char *text = "ABABABCABABABC";
    const char *pattern = "ABABC";
    int starts[32];
    int count;
    int k;

    count = kmp_find_all(text, pattern, starts, 32);
    printf("matches = %d\n", count);
    for (k = 0; k < count && k < 32; ++k) {
        printf("start[%d] = %d\n", k, starts[k]);
    }
    return 0;
}
