/*
 * 中文导读：反复合并权值最小的两棵树，得到带权路径长度最小的前缀码。
 * 阅读顺序：先看优先队列/最小堆如何选两个最小结点；再看合并后的新结点权值；最后递归打印 0/1 路径得到编码。
 * 关键不变量：每次合并后森林结点数减一；任何字符编码都不是另一个编码的前缀。
 * 易错点：合并顺序不稳定导致同权树形不同；叶子权值当频率用错；只支持单字符；释放树时递归断链。
 * 复杂度：O(n log n) 时间（堆），O(n) 空间；编码长度取决于频率分布。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入字符及其权值；构造哈夫曼树后输出每个字符的 0/1 编码；main 打印编码表。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz convenience implementation: Huffman tree with std::priority_queue.
// priority_queue is a max-heap by default, so the comparator reverses order.
//
// Reading guide:
// 1. This convenience file keeps the Huffman merge logic but uses
//    std::priority_queue.
// 2. The queue orders nodes by frequency; two minima are merged until one root
//    remains.
// 3. The library supplies heap maintenance; the tree and code construction stay
//    explicit.
//
// Complexity: O(n log n); extra space O(n).
// Convention: Left edges are 0 and right edges are 1; ties are resolved by the
//   comparator.

#include <iostream>
#include <memory>
#include <queue>
#include <string>
#include <vector>

struct Node
{
    int frequency = 0;
    char symbol = '\0';
    int order = 0;
    Node *left = nullptr;
    Node *right = nullptr;
};

struct Compare
{
    // Purpose: Priority-queue comparator: lower frequency wins, and insertion order breaks ties.
    // 作用：优先队列比较器：频率小的结点优先；频率相同用插入序号打破平局。
    bool operator()(const Node *a, const Node *b) const
    {
        if (a->frequency != b->frequency)
        {
            return a->frequency > b->frequency;
        }
        return a->order > b->order;
    }
};

// Purpose: Recursively print each leaf's Huffman code along the 0/1 tree path without modifying the tree.
// 作用：沿树的 0/1 路径递归输出每个叶子的哈夫曼编码；不修改树。
void print_codes(const Node *node, const std::string &path)
{
    if (!node->left && !node->right)
    {
        std::cout << node->symbol << ": " << (path.empty() ? "(empty)" : path) << '\n';
        return;
    }
    if (node->left)
    {
        print_codes(node->left, path + '0');
    }
    if (node->right)
    {
        print_codes(node->right, path + '1');
    }
}

// Purpose: Free a Huffman tree postorder: release both children before the current node.
// 作用：后序释放哈夫曼树：先释放左右孩子，再释放当前结点。
void free_tree(Node *node)
{
    if (!node)
    {
        return;
    }
    free_tree(node->left);
    free_tree(node->right);
    delete node;
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    std::vector<int> frequencies{5, 9, 12, 13, 16, 45};
    std::vector<char> symbols{'a', 'b', 'c', 'd', 'e', 'f'};
    std::priority_queue<Node *, std::vector<Node *>, Compare> heap;

    for (std::size_t i = 0; i < frequencies.size(); ++i)
    {
        heap.push(new Node{frequencies[i], symbols[i], static_cast<int>(i), nullptr, nullptr});
    }

    int order = static_cast<int>(frequencies.size());
    // The comparator reverses the default max-heap order so the two smallest frequencies are popped first.
    while (heap.size() > 1)
    {
        Node *first = heap.top();
        heap.pop();
        Node *second = heap.top();
        heap.pop();
        // Min-heap ordering is (frequency, insertion order), keeping ties deterministic.
        heap.push(new Node{first->frequency + second->frequency, '\0', order++, first, second});
    }

    Node *root = heap.top();
    heap.pop();
    std::cout << "root frequency: " << root->frequency << '\n';
    std::cout << "codes:\n";
    print_codes(root, "");
    free_tree(root);
    return 0;
}
