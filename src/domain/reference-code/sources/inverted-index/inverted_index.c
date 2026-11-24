/*
 * 中文导读：倒排文件为每个关键字保存包含它的记录 ID。构建时逐记录扫描已分好的关键字，
 * 把记录编号追加到对应倒排表；查询时读取若干表，AND 求交、OR 求并，结果映射回原记录。
 * 一个关键字可对应多个记录，倒排表不是唯一键索引；缺失关键字得到空表，不是错误。
 * 易错点：记录 ID 追加到错表；AND 只读第一张表；OR 不去重；结果按集合迭代顺序输出。
 * 复杂度：构建 O(T)，查询 O(Σ|L|)；本文件不做分词、排名或真实全文搜索。
 * 输入/输出：R1–R4 与关键字，构建后演示“algorithms AND sorting”与“algorithms OR sorting”。
 */

/*
 * Inverted index in C11. Term lists are built by scanning pre-segmented record
 * keywords; query results are record indices, not term strings.
 */

#include <stdio.h>
#include <string.h>

#define MAX_RECORDS 9
#define MAX_TERMS 16
#define MAX_POSTINGS 9
#define MAX_KEYWORDS 4

typedef struct
{
    const char *id;
    const char *keywords[MAX_KEYWORDS];
    int keywordCount;
} Record;

typedef struct
{
    const char *term;
    int postings[MAX_POSTINGS];
    int postingCount;
} PostingList;

// Purpose: Find a term's list, creating an empty one when it is new.
// 作用：按关键字查找倒排表；首次出现时建立空表，表键是关键字而不是记录 ID。
static int FindOrCreateTerm(PostingList *lists, int *listCount, const char *term)
{
    for (int index = 0; index < *listCount; index += 1)
    {
        if (strcmp(lists[index].term, term) == 0)
        // A term owns exactly one posting list; the scan returns the existing table instead of creating a duplicate for the same string.
        {
            return index;
        }
    }
    lists[*listCount].term = term;
    // A new table is appended without checking MAX_TERMS; the demo stays within 16 distinct terms, but the API has no capacity failure path.
    lists[*listCount].postingCount = 0;
    *listCount += 1;
    return *listCount - 1;
}

// Purpose: Scan every record and append its id to each term's posting list.
// 作用：逐记录、逐关键字追加记录编号；构建结果必须等于真实关键字集合。
static void BuildIndex(const Record *records, int recordCount, PostingList *lists, int *listCount)
{
    for (int record = 0; record < recordCount; record += 1)
    {
        for (int keyword = 0; keyword < records[record].keywordCount; keyword += 1)
        {
            int term = FindOrCreateTerm(lists, listCount, records[record].keywords[keyword]);
            lists[term].postings[lists[term].postingCount] = record;
            // The posting stores the integer record position, so the same record can be found without comparing external ID strings.
            lists[term].postingCount += 1;
        }
    }
}

// A missing term returns NULL; an empty posting list is a different state, though both contain no record.
// 作用：按关键字取倒排表；缺失关键字返回 NULL，这与“表存在但暂未收录记录”不是同一状态。
static const PostingList *FindTerm(const PostingList *lists, int listCount, const char *term)
{
    for (int index = 0; index < listCount; index += 1)
    {
        if (strcmp(lists[index].term, term) == 0)
        {
            return &lists[index];
        }
    }
    return NULL;
    // NULL means the term was never seen; an existing table with postingCount 0 would be a different state even though neither contains records.
}

// Postings store record indices, so membership compares an integer position rather than an external ID string.
// 作用：判断记录编号是否在倒排表中；倒排表保存的是记录下标，不是记录 ID 文本。
static int Contains(const PostingList *list, int record)
{
    if (list == NULL)
    {
        return 0;
    }
    for (int index = 0; index < list->postingCount; index += 1)
    {
        if (list->postings[index] == record)
        // Contains compares record indices, not IDs; this is why the query can be evaluated by walking the original record array.
        {
            return 1;
        }
    }
    return 0;
}

// Iterating records in storage order makes AND/OR results stable and naturally deduplicated.
// 作用：按原记录顺序求 AND 交集或 OR 并集；同一条记录只检查一次，因此结果天然去重且顺序稳定。
static int Query(int recordCount, const PostingList *lists,
                 int listCount, const char **terms, int termCount, int useAnd, int *result)
{
    int count = 0;
    for (int record = 0; record < recordCount; record += 1)
    // Walking records rather than postings makes output follow storage order, and each record is tested once so duplicates cannot appear.
    {
        int include = useAnd;
        // The identity value differs by mode: AND starts true because an empty conjunction holds, OR starts false because an empty disjunction does not.
        for (int term = 0; term < termCount; term += 1)
        {
            const PostingList *list = FindTerm(lists, listCount, terms[term]);
            int present = Contains(list, record);
            if (useAnd)
            {
                include = include && present;
                // A missing term yields present=0, so AND fails that record; OR can still succeed through another present term.
            }
            else
            {
                include = include || present;
            }
        }
        if (include)
        {
            result[count] = record;
            count += 1;
        }
    }
    return count;
}

int main(void)
{
    Record records[MAX_RECORDS] = {
        {"R1", {"data structures", "algorithms"}, 2},
        {"R2", {"algorithms", "sorting"}, 2},
        {"R3", {"data structures", "sorting"}, 2},
        {"R4", {"index", "algorithms"}, 2},
    };
    int recordCount = 4;
    PostingList lists[MAX_TERMS];
    int listCount = 0;
    BuildIndex(records, recordCount, lists, &listCount);

    printf("inverted index:\n");
    for (int term = 0; term < listCount; term += 1)
    {
        printf("  %s ->", lists[term].term);
        for (int posting = 0; posting < lists[term].postingCount; posting += 1)
        {
            printf(" %s", records[lists[term].postings[posting]].id);
        }
        printf("\n");
    }

    const char *query[] = {"algorithms", "sorting"};
    int result[MAX_RECORDS];
    int count = Query(recordCount, lists, listCount, query, 2, 1, result);
    printf("algorithms AND sorting:");
    for (int index = 0; index < count; index += 1)
    {
        printf(" %s", records[result[index]].id);
    }
    printf("\n");

    count = Query(recordCount, lists, listCount, query, 2, 0, result);
    printf("algorithms OR sorting:");
    for (int index = 0; index < count; index += 1)
    {
        printf(" %s", records[result[index]].id);
    }
    printf("\n");
    return 0;
}



