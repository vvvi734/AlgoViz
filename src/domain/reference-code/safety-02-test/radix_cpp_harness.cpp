#include <cstdio>
#include <vector>

#define main radix_app_main
#include "../sources/radix/radix_sort.cpp"
#undef main

static void print_records(const std::vector<Record> &records)
{
    for (const Record &record : records)
    {
        std::printf(" (%d,%d)", record.value, record.originalIndex);
    }
    std::printf("\n");
}

int main()
{
    std::vector<Record> records = {
        {170, 0}, {45, 1}, {45, 2}, {90, 3}, {802, 4}, {24, 5}, {2, 6}, {66, 7}};
    bool result = RadixSort(records);
    std::printf("NORMAL_RESULT=%d\nNORMAL_ORDER", (int)result);
    print_records(records);

    std::vector<Record> negative = {{-1, 42}};
    result = RadixSort(negative);
    std::printf("NEGATIVE=%d NEGATIVE_VALUE=%d NEGATIVE_INDEX=%d\n", (int)result, negative[0].value, negative[0].originalIndex);
    std::vector<Record> too_large = {{10000, 43}};
    result = RadixSort(too_large);
    std::printf("TOO_LARGE=%d TOO_LARGE_VALUE=%d TOO_LARGE_INDEX=%d\n", (int)result, too_large[0].value, too_large[0].originalIndex);
    std::vector<Record> empty;
    std::printf("EMPTY=%d\n", (int)RadixSort(empty));
    std::vector<Record> too_many(17);
    std::printf("TOO_MANY=%d\n", (int)RadixSort(too_many));

    std::vector<Record> maximum;
    for (int index = 0; index < MAX_RECORDS; ++index)
    {
        maximum.push_back({MAX_RECORDS - index, index});
    }
    result = RadixSort(maximum);
    std::printf("MAX_BATCH_RESULT=%d MAX_BATCH_FIRST=%d MAX_BATCH_LAST=%d\n", (int)result, maximum.front().value, maximum.back().value);
    return 0;
}
