/*
 * RISK-06 harness: inverted index must fail cleanly when the fixed term or keyword tables overflow.
 */
#define main inverted_demo_main
#include "../sources/inverted-index/inverted_index.c"
#undef main

int main(void)
{
    Record records[MAX_RECORDS];
    const char *terms[MAX_RECORDS][MAX_KEYWORDS];
    for (int record = 0; record < MAX_RECORDS; record += 1)
    {
        for (int keyword = 0; keyword < MAX_KEYWORDS; keyword += 1)
        {
            terms[record][keyword] = "unique";
            records[record].id = "R";
            records[record].keywords[keyword] = terms[record][keyword];
        }
        records[record].keywordCount = MAX_KEYWORDS;
    }
    /* Make every term distinct so the 17th insertion exceeds MAX_TERMS. */
    char names[MAX_RECORDS * MAX_KEYWORDS][8];
    for (int index = 0; index < MAX_RECORDS * MAX_KEYWORDS; index += 1)
    {
        snprintf(names[index], sizeof(names[index]), "T%d", index);
        records[index / MAX_KEYWORDS].keywords[index % MAX_KEYWORDS] = names[index];
    }

    PostingList lists[MAX_TERMS];
    int listCount = 0;
    if (BuildIndex(records, MAX_RECORDS, lists, &listCount))
    {
        printf("FAIL: 36 distinct terms were accepted into %d slots\n", MAX_TERMS);
        return 1;
    }
    if (listCount != 0)
    {
        printf("FAIL: failed build left listCount=%d\n", listCount);
        return 2;
    }

    Record bad = {"R", {"a", "b", "c", "d"}, MAX_KEYWORDS + 1};
    if (BuildIndex(&bad, 1, lists, &listCount))
    {
        printf("FAIL: overlong keyword list accepted\n");
        return 3;
    }
    printf("PASS: term and keyword overflow rejected\n");
    return 0;
}
