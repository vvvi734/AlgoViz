/*
 * 中文导读：键树把关键字的每个字符变成一条边，前缀共享，只有终止标记才表示完整关键字。
 * 阅读顺序：先看节点用 map<char, unique_ptr> 表示孩子；再看 find 如何逐字符下降；最后看 insert 只在缺失后缀建节点并设置 terminal。
 * 关键不变量：兄弟边字符唯一；根到节点的路径拼出前缀；terminal=true 才是完整单词。
 * 易错点：把前缀直接当词；插入重复时仍改结构；字符大小写不统一。
 * 复杂度：查找/插入 O(L)，L 为词长；空间 O(总字符数)，共享前缀合并节点。
 * 输入/输出：输入小写单词集合、目标词与操作；main 打印词典、命中与插入结果。
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

// A std::map keyed by char makes each sibling edge unique by construction; no separate scan over 26 slots is needed.
struct KeyNode
{
    char letter{};
    bool terminal = false;
    std::map<char, std::unique_ptr<KeyNode>> children;
};

// Purpose: Allocate a standalone child node for one character; the caller inserts it under the real parent edge.
// 作用：为一个字符分配独立孩子节点；真正挂到父边由调用方完成。
std::unique_ptr<KeyNode> makeNode(char letter)
{
    auto node = std::make_unique<KeyNode>();
    node->letter = letter;
    return node;
}

// Purpose: Walk as far as the edges exist and report the last real node plus matched length.
// 作用：沿已存在的边尽量下降，返回最后真实节点与匹配长度。
// last always points at a real node, including the root when the first edge is missing; matched stops at the first absent edge or at the end of the string.
int walk(const KeyNode &root, const std::string &word, const KeyNode *&last)
{
    const KeyNode *node = &root;
    int matched = 0;
    while (matched < static_cast<int>(word.size()))
    {
        // A failed find breaks the walk without modifying last; a successful find moves both the node and matched exactly one character forward.
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
// The full-length test and terminal test are separate; a word that is only a prefix must fail even though walk visited its last character.
bool find(const KeyNode &root, const std::string &word, int &matched)
{
    const KeyNode *last = nullptr;
    matched = walk(root, word, last);
    return matched == static_cast<int>(word.size()) && last->terminal;
}

// Purpose: Reject duplicates first, create only missing suffix edges, then mark the final node terminal.
// 作用：先拒绝重复，再只为缺失后缀建边，最后把末节点标记为 terminal。
// completePath starts true and is cleared on the first missing edge; a pre-existing path with terminal already set is the only duplicate case.
bool insert(KeyNode &root, const std::string &word)
{
    KeyNode *node = &root;
    bool completePath = true;
    for (char letter : word)
    {
        // Only a missing edge allocates; an existing prefix is reused, so inserting cargo after car extends the shared path instead of creating a new root branch.
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
// Prefix is passed by value, so each recursive branch owns its own string; map iteration order then yields lexicographic output.
void collect(const KeyNode &node, std::string prefix, std::vector<std::string> &words)
{
    if (node.terminal && !prefix.empty())
    {
        words.push_back(prefix);
    }
    for (const auto &entry : node.children)
    {
        // A new string is built for every edge; this is simple but costs O(length) per node, a limitation of the teaching version rather than a tuned dictionary.
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
