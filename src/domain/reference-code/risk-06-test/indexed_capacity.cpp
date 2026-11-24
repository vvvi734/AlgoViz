/*
 * RISK-06 harness: indexed-file position must follow the capacity parameter, not a literal 3.
 */
#define main indexed_demo_main
#include "../sources/file-index/indexed_file.cpp"
#undef main

int main()
{
    std::vector<Record> records = {
        {107, "G"}, {101, "A"}, {105, "E"}, {103, "C"},
        {102, "B"}, {108, "H"}, {104, "D"}, {106, "F"}};
    SortRecords(records);
    std::vector<Block> blocks = BuildBlocks(records, 4);
    std::vector<Entry> index = BuildIndex(blocks, true);
    Io io;
    int found = Lookup(blocks, index, 106, 4, io);
    if (found != 5)
    {
        std::printf("FAIL: capacity 4 returned position %d, expected 5\n", found);
        return 1;
    }
    std::printf("PASS: capacity 4 position=5\n");
    return 0;
}
