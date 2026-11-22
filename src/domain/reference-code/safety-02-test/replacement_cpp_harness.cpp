#include <cstdio>
#include <exception>
#include <vector>

#define main replacement_app_main
#include "../sources/replacement/replacement_selection.cpp"
#undef main

static bool RunsAreSorted(const std::vector<std::vector<Item>> &runs)
{
    for (const auto &run : runs)
    {
        for (std::size_t index = 1; index < run.size(); ++index)
        {
            if (!comes_before(run[index - 1], run[index]))
            {
                return false;
            }
        }
    }
    return true;
}

static bool RunsCover(const std::vector<std::vector<Item>> &runs, int n)
{
    std::vector<bool> seen(n, false);
    int total = 0;
    for (const auto &run : runs)
    {
        for (const auto &item : run)
        {
            if (item.originalIndex < 0 || item.originalIndex >= n || seen[item.originalIndex])
            {
                return false;
            }
            seen[item.originalIndex] = true;
            total += 1;
        }
    }
    if (total != n)
    {
        return false;
    }
    for (bool present : seen)
    {
        if (!present)
        {
            return false;
        }
    }
    return true;
}

int main()
{
    std::vector<Item> input = {
        {7, 0}, {3, 1}, {9, 2}, {1, 3}, {8, 4}, {2, 5}, {6, 6}, {4, 7}, {5, 8}};
    try
    {
        auto runs = replacement_selection(input, 3);
        std::printf("VALID_RUNS=%zu VALID_SORTED=%d VALID_COVER=%d\n", runs.size(), (int)RunsAreSorted(runs), (int)RunsCover(runs, 9));

        std::vector<Item> maximum;
        for (int index = 0; index < MAX_RECORDS; ++index)
        {
            maximum.push_back({MAX_RECORDS - index, index});
        }
        auto maximumRuns = replacement_selection(maximum, 2);
        std::printf("MAX_BATCH_RUNS=%zu MAX_BATCH_SORTED=%d MAX_BATCH_COVER=%d\n",
                    maximumRuns.size(), (int)RunsAreSorted(maximumRuns), (int)RunsCover(maximumRuns, MAX_RECORDS));
    }
    catch (const std::exception &error)
    {
        std::printf("VALID_EXCEPTION=%s\n", error.what());
    }

    auto expectError = [](const char *label, auto function) {
        try
        {
            function();
            std::printf("%s=accepted\n", label);
        }
        catch (const std::invalid_argument &error)
        {
            std::printf("%s=invalid_argument:%s\n", label, error.what());
        }
        catch (const std::exception &error)
        {
            std::printf("%s=exception:%s\n", label, error.what());
        }
    };

    expectError("EMPTY", [] { replacement_selection({}, 3); });
    expectError("CAPACITY_ONE", [&] { replacement_selection(input, 1); });
    expectError("CAPACITY_SEVEN", [&] { replacement_selection(input, 7); });
    expectError("TOO_MANY", [] {
        std::vector<Item> oversized(21);
        replacement_selection(oversized, 3);
    });
    expectError("NEGATIVE_CAPACITY", [&] { replacement_selection(input, -1); });
    return 0;
}
