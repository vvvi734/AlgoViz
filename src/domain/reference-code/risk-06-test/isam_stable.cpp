/*
 * RISK-06 harness: C++ ISAM must insert equal keys after existing ones, matching C/Python.
 */
#define main isam_demo_main
#include "../sources/isam/isam_file.cpp"
#undef main

int main()
{
    IsamFile file;
    MainBlock block;
    block.records = {{101, "A"}, {102, "B"}};
    file.blocks.push_back(block);
    file.RefreshBounds();

    file.Insert({101, "X"});
    file.Insert({101, "Y"});
    if (file.overflow.empty() || file.overflow[0].records.size() != 2)
    {
        std::printf("FAIL: expected two overflow records\n");
        return 1;
    }
    if (file.overflow[0].records[0].label != "X" || file.overflow[0].records[1].label != "Y")
    {
        std::printf("FAIL: equal keys were not appended in arrival order\n");
        return 2;
    }
    std::printf("PASS: equal-key labels are X then Y\n");
    return 0;
}
