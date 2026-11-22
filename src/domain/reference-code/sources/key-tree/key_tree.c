/*
 * 中文导读：键树把关键字的每个字符变成一条边，前缀共享，只有终止标记才表示完整关键字。
 * 阅读顺序：先看节点池与 26 个孩子的表示；再看 find_word 如何逐字符下降；最后看 insert_word 只在缺失后缀处建节点并设置 terminal。
 * 关键不变量：兄弟边的字符唯一；根到节点的路径拼出一个前缀；terminal=true 才是字典中的词。
 * 易错点：把前缀节点直接当成单词；先设置 terminal 再判断重复；字符大小写未统一。
 * 复杂度：查找/插入 O(L)，L 为关键字长度；空间 O(总字符数)，共享前缀会合并节点。
 * 输入/输出：输入小写单词集合、目标词与操作；查找返回命中/失败，插入返回是否新增；main 打印词典。
*/

/*
 * Character trie (key tree) in C11.
 *
 * One node owns one lower-case letter edge. A root-to-node path spells a prefix,
 * and only terminal nodes are complete dictionary words. Prefixes are shared, so
 * the cost depends on the word length rather than the dictionary size.
 */

#include <stdio.h>
#include <string.h>

#define ALPHABET 26
#define MAX_NODES 96
#define MAX_WORDS 8
#define MAX_WORD_LENGTH 8

typedef struct
{
    char letter;
    int terminal;
    int child[ALPHABET];
} KeyNode;

static KeyNode nodes[MAX_NODES];
static int node_count = 0;
static int root = -1;

// Purpose: Allocate one node and initialize its letter, terminal flag and 26 child slots; the caller links the parent edge.
// 作用：分配一个节点并初始化 letter、terminal 与 26 个孩子槽；父边由调用方接入，本函数不修改父节点。
static int new_node(char letter)
{
    if (node_count >= MAX_NODES)
    {
        return -1;
    }
    int id = node_count++;
    nodes[id].letter = letter;
    nodes[id].terminal = 0;
    for (int slot = 0; slot < ALPHABET; ++slot)
    {
        nodes[id].child[slot] = -1;
    }
    return id;
}

// Purpose: Return the child reached by one character, or -1 when the edge is absent.
// 作用：返回一个字符对应的孩子；边不存在时返回 -1。
static int find_child(int parent, char letter)
{
    return nodes[parent].child[letter - 'a'];
}

// Purpose: Follow the whole word and report the last existing node plus matched length; terminal is a separate test.
// 作用：沿整词下降，返回最后存在的节点与已匹配长度；是否为词还要单独检查 terminal。
static int walk_word(const char *word, int *node_out, int *matched_out)
{
    int node = root;
    int matched = 0;
    while (word[matched] != '\0')
    {
        int child = find_child(node, word[matched]);
        if (child < 0)
        {
            break;
        }
        node = child;
        ++matched;
    }
    *node_out = node;
    *matched_out = matched;
    return word[matched] == '\0';
}

// Purpose: A word exists only when every character edge exists AND the last node is terminal.
// 作用：只有每个字符边都存在且末节点 terminal=true 才算命中。
static int find_word(const char *word, int *matched_out)
{
    int node = 0;
    int complete = walk_word(word, &node, matched_out);
    return complete && nodes[node].terminal;
}

// Purpose: Reject duplicates first, create only missing suffix nodes, then set terminal at the end.
// 作用：先拒绝重复，再只为缺失后缀建节点，最后在末端设置 terminal。
static int insert_word(const char *word)
{
    int node = root;
    int matched = 0;
    int exists = 1;
    while (word[matched] != '\0')
    {
        int child = find_child(node, word[matched]);
        if (child < 0)
        {
            exists = 0;
            child = new_node(word[matched]);
            if (child < 0)
            {
                return -1;
            }
            nodes[node].child[word[matched] - 'a'] = child;
        }
        node = child;
        ++matched;
    }
    if (exists && nodes[node].terminal)
    {
        return 0;
    }
    nodes[node].terminal = 1;
    return 1;
}

// Purpose: Print words by DFS; terminal at depth > 0 turns the current prefix into a real word.
// 作用：DFS 打印单词；深度大于 0 的 terminal 才把当前前缀变成真实单词。
static void print_words(int node, char *prefix, int depth)
{
    if (nodes[node].terminal && depth > 0)
    {
        prefix[depth] = '\0';
        printf("%s\n", prefix);
    }
    for (int slot = 0; slot < ALPHABET; ++slot)
    {
        int child = nodes[node].child[slot];
        if (child >= 0)
        {
            prefix[depth] = nodes[child].letter;
            print_words(child, prefix, depth + 1);
        }
    }
}

// Purpose: Build the shared-prefix dictionary and show that a prefix is not automatically a word.
// 作用：建立共享前缀词典，并演示前缀本身不等于一个单词。
int main(void)
{
    root = new_node('\0');
    const char *words[] = {"car", "card", "care", "cat", "dog", "do"};
    for (int index = 0; index < (int)(sizeof(words) / sizeof(words[0])); ++index)
    {
        insert_word(words[index]);
    }
    char prefix[MAX_WORD_LENGTH + 1] = {0};
    printf("dictionary:\n");
    print_words(root, prefix, 0);

    int matched = 0;
    int found = find_word("care", &matched);
    printf("find care: %s (matched=%d)\n", found ? "yes" : "no", matched);
    found = find_word("ca", &matched);
    printf("find ca: %s (matched=%d)\n", found ? "yes" : "no", matched);
    found = find_word("cow", &matched);
    printf("find cow: %s (matched=%d)\n", found ? "yes" : "no", matched);
    printf("insert cargo: %d\n", insert_word("cargo"));
    printf("insert cargo again: %d\n", insert_word("cargo"));
    return 0;
}
