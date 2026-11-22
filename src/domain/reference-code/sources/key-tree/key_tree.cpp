/*
 * 中文导读：键树把关键字的每个字符变成一条边，前缀共享，只有终止标记才表示完整关键字。
 * 阅读顺序：先看节点用 map<char, unique_ptr> 表示孩子；再看 find 如何逐字符下降；最后看 insert 只在缺失后缀建节点并设置 terminal。
 * 关键不变量：兄弟边字符唯一；根到节点的路径拼出前缀；terminal=true 才是完整单词。
 * 易错点：把前缀直接当词；插入重复时仍改结构；字符大小写不统一。
 * 复杂度：查找/插入 O(L)，L 为词长；空间 O(总字符数)，共享前缀合并节点。
 * 输入/输出：输入小写单词集合、目标词与操作；main 打印词典、命中与插入结果。
 * 函数地图：先读 main，再查看 KeyNode、find、insert。
*/

/*
 * Character trie (key tree) in C++17.
 *
 * Every edge consumes one lower-case letter. Only terminal nodes are words; a
 * shared prefix can be a path without being a dictionary entry. Insertion
 * creates nodes only for the missing suffix and never treats a prefix as a
 * completed key.
 */

#include <iostream>
#include <map>
#include <memory>
#include <string>
#include <vector>

struct KeyNode
{
    char letter{};
    bool terminal = false;
    std::map<char, std::unique_ptr<KeyNode>> children;
};

// Purpose: Allocate a child for one character under its real parent edge.
// 作用：为一个字符在真实父边下分配孩子节点。
std::unique_ptr<KeyNode> makeNode(char letter)
{
    auto node = std::make_unique<KeyNode>();
    node->letter = letter;
    return node;
}

// Purpose: Walk as far as the edges exist and report the last real node plus matched length.
// 作用：沿已存在的边尽量下降，返回最后真实节点与匹配长度。
int walk(const KeyNode &root, const std::string &word, const KeyNode *&last)
{
    const KeyNode *node = &root;
    int matched = 0;
    while (matched < static_cast<int>(word.size()))
    {
        auto child = node->children.find(word[matched]);
        if (child == node->children.end())
        {
            break;
        }
        node = child->second.get();
        ++matched;
    }
    last = node;
    return matched;
}

// Purpose: A hit needs the full path AND terminal=true; a prefix alone is not a word.
// 作用：命中要求整条路径存在且 terminal=true；只有前缀不算单词。
bool find(const KeyNode &root, const std::string &word, int &matched)
{
    const KeyNode *last = nullptr;
    matched = walk(root, word, last);
    return matched == static_cast<int>(word.size()) && last->terminal;
}

// Purpose: Reject duplicates first, create only missing suffix edges, then mark the final node terminal.
// 作用：先拒绝重复，再只为缺失后缀建边，最后把末节点标记为 terminal。
bool insert(KeyNode &root, const std::string &word)
{
    KeyNode *node = &root;
    bool completePath = true;
    for (char letter : word)
    {
        auto child = node->children.find(letter);
        if (child == node->children.end())
        {
            completePath = false;
            auto fresh = makeNode(letter);
            node->children.emplace(letter, std::move(fresh));
            child = node->children.find(letter);
        }
        node = child->second.get();
    }
    if (completePath && node->terminal)
    {
        return false;
    }
    node->terminal = true;
    return true;
}

// Purpose: DFS with the current prefix; terminal at depth > 0 emits one real dictionary word.
// 作用：带当前前缀 DFS；深度大于 0 的 terminal 才输出一个真实单词。
void collect(const KeyNode &node, std::string prefix, std::vector<std::string> &words)
{
    if (node.terminal && !prefix.empty())
    {
        words.push_back(prefix);
    }
    for (const auto &entry : node.children)
    {
        collect(*entry.second, prefix + entry.first, words);
    }
}

// Purpose: Build the shared-prefix dictionary and demonstrate prefix/insert behavior.
// 作用：建立共享前缀词典，演示前缀判定与插入行为。
int main()
{
    KeyNode root;
    for (const std::string word : {"car", "card", "care", "cat", "dog", "do"})
    {
        insert(root, word);
    }
    std::vector<std::string> words;
    collect(root, "", words);
    std::cout << "dictionary:";
    for (const auto &word : words)
    {
        std::cout << ' ' << word;
    }
    std::cout << "\n";
    int matched = 0;
    std::cout << "find care: " << (find(root, "care", matched) ? "yes" : "no") << " matched=" << matched << "\n";
    std::cout << "find ca: " << (find(root, "ca", matched) ? "yes" : "no") << " matched=" << matched << "\n";
    std::cout << "find cow: " << (find(root, "cow", matched) ? "yes" : "no") << " matched=" << matched << "\n";
    std::cout << "insert cargo: " << (insert(root, "cargo") ? "new" : "duplicate") << "\n";
    std::cout << "insert cargo again: " << (insert(root, "cargo") ? "new" : "duplicate") << "\n";
    return 0;
}
