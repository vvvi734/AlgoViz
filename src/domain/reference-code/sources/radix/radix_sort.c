/*
 * 中文导读：LSD 基数排序按个位、十位、百位……依次分配和收集，不直接比较两个完整关键字。
 * 阅读顺序：先看 DigitAt 如何取出当前位；再看 RadixSort 每一趟的三步分配、收集、替换 order；最后看 main 如何打印稳定结果。
 * 关键不变量：每一趟开始前，order 已按所有更低数位稳定排序；分配后每个桶内的记录保持进入桶的先后次序。
 * 易错点：从最高位开始却不递归分组；桶内按关键字重排；收集方向反了；对负数取绝对值；把“元素个数”当成位数。
 * 复杂度：O(d(n+10))，d 是最大十进制位数；额外空间 O(n+10)，需要 10 个桶和 order/next 两份下标数组。
 * 输入/输出：main 使用官方多位整数；RadixSort 原地重排记录，main 打印关键字与原始身份。
 */

/*
 * LSD decimal radix sort in C11.
 *
 * Each pass distributes records by the active digit into ten FIFO buckets,
 * then collects buckets 0..9 in order. Bucket order is never reordered, so the
 * pass is stable. Negative and out-of-range records are rejected.
 */

#include <stdio.h>

#define MAX_RECORDS 16
#define RADIX 10
#define MAX_VALUE 9999

typedef struct
{
    int value;
    int originalIndex;
} Record;

// Purpose: Extract the decimal digit selected by the current place value.
// 作用：按当前位权取出一个十进制数位；不足位自然得到 0。
static int DigitAt(int value, int power)
{
    // Dividing by the current place value removes lower digits; %10 keeps this pass's digit. Missing higher positions naturally yield 0.
    return (value / power) % RADIX;
}

// Purpose: Run LSD passes over order, using stable FIFO buckets and a fresh order each pass.
// 作用：按 LSD 顺序处理每一趟；桶保持 FIFO，收集后整体替换 order。
// 返回 1 表示已排序，0 表示参数、数量或关键字非法；所有校验都在写 order/buckets 之前完成。
static int RadixSort(Record *records, int n)
{
    // MAX_RECORDS bounds every fixed array below; reject absent storage, empty input and overflow before indexing.
    if (records == NULL || n < 1 || n > MAX_RECORDS)
    {
        return 0;
    }
    // DigitAt uses `%` and buckets[10]; negative or five-digit values would produce an invalid bucket index.
    for (int index = 0; index < n; ++index)
    {
        if (records[index].value < 0 || records[index].value > MAX_VALUE)
        {
            return 0;
        }
    }

    int order[MAX_RECORDS];
    int next_order[MAX_RECORDS];
    int buckets[RADIX][MAX_RECORDS];
    int counts[RADIX];

    for (int index = 0; index < n; ++index)
    {
        order[index] = index;
    }

    int maximum = 0;
    for (int index = 0; index < n; ++index)
    {
        if (records[index].value > maximum)
        {
            maximum = records[index].value;
        }
    }
    // Start with one pass so the value 0 still gets a units pass; divide the maximum until it is below 10 to count decimal positions.
    int maxDigits = 1;
    for (int rest = maximum; rest >= RADIX; rest /= RADIX)
    {
        maxDigits += 1;
    }

    int power = 1;
    // Before pass p, order is stable for digits below p; this pass adds digit p as the next key without discarding that lower-digit order.
    for (int pass = 0; pass < maxDigits; ++pass)
    {
        for (int digit = 0; digit < RADIX; ++digit)
        {
            // Reset counts every pass; stale bucket cells beyond counts are never read, so they need no clearing.
            counts[digit] = 0;
        }
        for (int position = 0; position < n; ++position)
        {
            // Walk the current stable order, not the raw input: earlier passes determine the order in which records enter each bucket.
            int recordIndex = order[position];
            int digit = DigitAt(records[recordIndex].value, power);
            // Write at each bucket's tail. Collecting from slot 0 upward then makes the bucket FIFO, which is the stability requirement.
            buckets[digit][counts[digit]] = recordIndex;
            counts[digit] += 1;
        }

        int write = 0;
        for (int digit = 0; digit < RADIX; ++digit)
        {
            for (int slot = 0; slot < counts[digit]; ++slot)
            {
                // Collect buckets 0..9 in ascending digit order; this digit is now the primary key, while each bucket's FIFO retains lower-digit order.
                next_order[write] = buckets[digit][slot];
                write += 1;
            }
        }
        for (int position = 0; position < n; ++position)
        {
            // Replace order only after the whole new sequence is built; mixing reads and writes in one array would corrupt unread records.
            order[position] = next_order[position];
        }
        power *= RADIX;
    }

    // After the most significant pass, every decimal digit has been applied from least to most significant; stability carried lower-digit order forward, so order is fully sorted.
    Record sorted[MAX_RECORDS];
    for (int position = 0; position < n; ++position)
    {
        sorted[position] = records[order[position]];
    }
    for (int position = 0; position < n; ++position)
    {
        records[position] = sorted[position];
    }
    return 1;
}

int main(void)
{
    Record records[MAX_RECORDS] = {
        {170, 0}, {45, 1}, {75, 2}, {90, 3}, {802, 4}, {24, 5}, {2, 6}, {66, 7}};
    int n = 8;

    for (int index = 0; index < n; ++index)
    {
        if (records[index].value < 0 || records[index].value > MAX_VALUE)
        {
            printf("radix input must be in 0..%d\n", MAX_VALUE);
            return 1;
        }
    }
    if (!RadixSort(records, n))
    {
        printf("radix input must contain 1..%d records in 0..%d\n", MAX_RECORDS, MAX_VALUE);
        return 1;
    }
    for (int index = 0; index < n; ++index)
    {
        printf("(%d,%c)%s", records[index].value, 'A' + records[index].originalIndex,
               index + 1 == n ? "\n" : " ");
    }
    return 0;
}
