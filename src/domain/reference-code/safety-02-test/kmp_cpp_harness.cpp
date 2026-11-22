#include <cstdio>
#include <string>

#define main kmp_app_main
#include "../sources/kmp/kmp.cpp"
#undef main

int main()
{
    auto starts = kmp_find_all("aaaaa", "aa");
    std::printf("OVERLAP_COUNT=%zu FIRST=%zu LAST=%zu\n", starts.size(), starts.empty() ? 0 : starts.front(), starts.empty() ? 0 : starts.back());
    std::printf("NO_MATCH=%zu\n", kmp_find_all("abcdef", "xyz").size());
    std::printf("EMPTY_PATTERN=%zu\n", kmp_find_all("abc", "").size());
    std::printf("EMPTY_TEXT=%zu\n", kmp_find_all("", "a").size());
    return 0;
}
