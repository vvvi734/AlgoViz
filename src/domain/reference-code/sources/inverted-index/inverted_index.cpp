/*
 * 中文导读：倒排索引把“记录含哪些词”翻转为“每个词对应哪些记录”。
 * 构建逐记录追加 ID；查询读取倒排表，AND 求交、OR 求并，结果仍回到原记录。
 * 易错点：一个词可对应多条记录；缺失词是空表；AND 第一张表不是最终结果；OR 必须去重。
 * 复杂度：构建 O(T)，查询 O(Σ|L|)。不做分词、排名或全文搜索。
 * 输入/输出：R1–R4，构建倒排表并演示 AND/OR。
 */

/*
 * Inverted index in C++17 using an ordered map from term to posting list.
 * Results are record ids filtered in original record order.
 */

#include <algorithm>
#include <iostream>
#include <map>
#include <string>
#include <vector>

struct Record
{
    std::string id;
    std::vector<std::string> keywords;
};

using PostingLists = std::map<std::string, std::vector<std::string>>;

// 作用：逐记录、逐关键字把记录 ID 追加到对应倒排表。
static PostingLists BuildIndex(const std::vector<Record> &records)
{
    PostingLists lists;
    for (const Record &record : records)
    {
        for (const std::string &term : record.keywords)
        {
            lists[term].push_back(record.id);
        }
    }
    return lists;
}

// 作用：按原记录顺序做 AND 交集或 OR 并集；同一条记录最多返回一次。
static std::vector<std::string> Query(const std::vector<Record> &records,
                                      const PostingLists &lists,
                                      const std::vector<std::string> &terms,
                                      bool useAnd)
{
    std::vector<std::string> result;
    for (const Record &record : records)
    {
        bool include = useAnd;
        for (const std::string &term : terms)
        {
            auto found = lists.find(term);
            bool present = found != lists.end() &&
                           std::find(found->second.begin(), found->second.end(), record.id) != found->second.end();
            include = useAnd ? (include && present) : (include || present);
        }
        if (include)
        {
            result.push_back(record.id);
        }
    }
    return result;
}

int main()
{
    std::vector<Record> records = {
        {"R1", {"data structures", "algorithms"}},
        {"R2", {"algorithms", "sorting"}},
        {"R3", {"data structures", "sorting"}},
        {"R4", {"index", "algorithms"}}};
    PostingLists lists = BuildIndex(records);

    std::cout << "inverted index:\n";
    for (const auto &entry : lists)
    {
        std::cout << "  " << entry.first << " ->";
        for (const std::string &id : entry.second)
        {
            std::cout << " " << id;
        }
        std::cout << "\n";
    }

    std::vector<std::string> query = {"algorithms", "sorting"};
    std::vector<std::string> intersection = Query(records, lists, query, true);
    std::cout << "algorithms AND sorting:";
    for (const std::string &id : intersection)
    {
        std::cout << " " << id;
    }
    std::cout << "\n";

    std::vector<std::string> unionSet = Query(records, lists, query, false);
    std::cout << "algorithms OR sorting:";
    for (const std::string &id : unionSet)
    {
        std::cout << " " << id;
    }
    std::cout << "\n";
    return 0;
}


