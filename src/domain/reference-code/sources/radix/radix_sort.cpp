/*
 * 中文导读：LSD 基数排序把十进制关键字拆成数位，逐位放进十个稳定桶，再按桶号收集。
 * 阅读顺序：先看 digitAt 的取位公式；再看 radixSort 的“清桶→分配→收集→替换”循环；最后看 main 的输入检查。
 * 关键不变量：每趟开始前 order 已按所有更低数位稳定有序；桶内记录保持进入顺序。
 * 易错点：用比较排序修正结果；桶内重排；从 9 号桶倒着收集；忽略最大位数而固定跑常数趟。
 * 复杂度：O(d(n+10))，d 为最大位数；额外空间 O(n+10)。
 * 输入/输出：main 使用官方示例，排序后打印关键字与原始身份。
 */

/*
 * LSD decimal radix sort in C++17.
 *
 * Ten FIFO buckets preserve arrival order; each pass replaces the sequence
 * with buckets collected 0..9. No comparison sort is used to obtain the result.
 */

#include <array>
#include <cstdio>
#include <vector>

constexpr int MAX_RECORDS = 16;
constexpr int MAX_VALUE = 9999;

struct Record
{
    int value;
    int originalIndex;
};

// Purpose: Extract the decimal digit selected by the current place value.
// 作用：按当前位权取出一个十进制数位；不足位自然得到 0。
static int DigitAt(int value, int power)
{
    // The place value selects one decimal digit; a shorter number has implicit leading zeros, so division naturally yields 0 beyond its top digit.
    return (value / power) % 10;
}

// Purpose: Run LSD passes over order, using stable FIFO buckets and a fresh order each pass.
// 作用：按 LSD 顺序处理每一趟；桶保持 FIFO，收集后整体替换 order。
// Returns false for an empty/oversized batch or an out-of-range key; all checks precede vector allocation and sorting.
static bool RadixSort(std::vector<Record> &records)
{
    // The teaching contract is 1..MAX_RECORDS records; reject empty or oversized input before deriving n.
    if (records.empty() || static_cast<int>(records.size()) > MAX_RECORDS)
    {
        return false;
    }
    // DigitAt uses `%` and buckets[10]; negative or five-digit values would index outside that bucket array.
    for (const Record &record : records)
    {
        if (record.value < 0 || record.value > MAX_VALUE)
        {
            return false;
        }
    }

    const int n = static_cast<int>(records.size());
    std::vector<int> order(n);
    for (int index = 0; index < n; ++index)
    {
        order[index] = index;
    }

    int maximum = 0;
    for (const Record &record : records)
    {
        maximum = record.value > maximum ? record.value : maximum;
    }
    // At least one pass handles zero; repeatedly dividing the maximum by ten counts how many decimal positions exist.
    int maxDigits = 1;
    for (int rest = maximum; rest >= 10; rest /= 10)
    {
        maxDigits += 1;
    }

    int power = 1;
    // At the start of pass p, order is already stable for all lower digits; this pass adds digit p as the next key.
    for (int pass = 0; pass < maxDigits; ++pass)
    {
        std::array<std::vector<int>, 10> buckets;
        for (int position = 0; position < n; ++position)
        {
            // Distribute the current stable sequence, not raw input: the order from previous passes decides insertion order inside each bucket.
            int recordIndex = order[position];
            int digit = DigitAt(records[recordIndex].value, power);
            // push_back appends at the bucket tail; when buckets are collected front-to-back, this preserves FIFO order.
            buckets[digit].push_back(recordIndex);
        }

        std::vector<int> nextOrder;
        nextOrder.reserve(n);
        for (int digit = 0; digit < 10; ++digit)
        {
            for (int recordIndex : buckets[digit])
            {
                // Append buckets 0..9 in order; the current digit is now the primary key, while the bucket sequence retains lower digits.
                nextOrder.push_back(recordIndex);
            }
        }
        // Swap only after nextOrder is complete; the old order then becomes the discarded buffer for the next pass.
        order.swap(nextOrder);
        power *= 10;
    }

    // Once the highest digit has been processed, all digits have acted from least to most significant; stability preserved lower digits, so order is fully sorted.
    std::vector<Record> sorted;
    sorted.reserve(n);
    for (int recordIndex : order)
    {
        sorted.push_back(records[recordIndex]);
    }
    records.swap(sorted);
    return true;
}

int main()
{
    std::vector<Record> records = {
        {170, 0}, {45, 1}, {75, 2}, {90, 3}, {802, 4}, {24, 5}, {2, 6}, {66, 7}};
    for (const Record &record : records)
    {
        if (record.value < 0 || record.value > MAX_VALUE)
        {
            std::puts("radix input must be in 0..9999");
            return 1;
        }
    }

    if (!RadixSort(records))
    {
        std::puts("radix input must contain 1..16 records in 0..9999");
        return 1;
    }
    for (int index = 0; index < static_cast<int>(records.size()); ++index)
    {
        std::printf("(%d,%c)%s", records[index].value, 'A' + records[index].originalIndex,
                    index + 1 == static_cast<int>(records.size()) ? "\n" : " ");
    }
    return 0;
}
