/*
 * 中文导读：反复合并权值最小的两棵树，得到带权路径长度最小的前缀码。
 * 阅读顺序：先看优先队列/最小堆如何选两个最小结点；再看合并后的新结点权值；最后递归打印 0/1 路径得到编码。
 * 关键不变量：每次合并后森林结点数减一；任何字符编码都不是另一个编码的前缀。
 * 易错点：合并顺序不稳定导致同权树形不同；叶子权值当频率用错；只支持单字符；释放树时递归断链。
 * 复杂度：O(n log n) 时间（堆），O(n) 空间；编码长度取决于频率分布。
 * 输入/输出：输入字符及其权值；构造哈夫曼树后输出每个字符的 0/1 编码；main 打印编码表。
*/

// AlgoViz reference implementation: Huffman coding (C++17).
// Builds a min-heap of nodes, repeatedly merges the two lightest nodes,
// then emits prefix-free codes by walking the tree.
//
// Reading guide:
// 1. Count the frequency of every symbol.
// 2. Put all leaf nodes in a min-heap ordered by frequency.
// 3. Repeatedly merge the two least frequent nodes until one root remains.
// 4. Left edges mean 0 and right edges mean 1, producing prefix-free codes.
//
// Complexity: O(n log n) with a heap; extra space O(n) for tree and codes.
// Convention: Symbols are unique; ties are broken by insertion order where the heap
//   supports it.

#include <iostream>
#include <string>
#include <vector>

struct Node
{
    int frequency = 0;
    char symbol = '\0';
    int order = 0;
    int left = -1;
    int right = -1;
};

class MinHeap
{
  public:
    // Purpose: Build a min-heap from leaf nodes, storing indices only while the real nodes live in nodes_.
    // 作用：用叶子结点数组建最小堆；只保存下标，真实结点在 nodes_ 中。
    explicit MinHeap(std::vector<Node> &nodes) : nodes_(nodes)
    {
    }

    // Min-heap ordering is (frequency, insertion order), keeping ties deterministic.
    // Purpose: Push a node index into the min-heap and sift it up using less(index, index) for comparisons.
    // 作用：把结点下标加入最小堆并上浮；比较用 less(index, index)。
    void push(int index)
    {
        heap_.push_back(index);
        sift_up(heap_.size() - 1);
    }

    // Purpose: Pop the heap-top index, sift the last index down, and return the index of the least frequent node.
    // 作用：弹出堆顶下标并把末尾下标下沉；返回频率最小的结点下标。
    int pop()
    {
        int top = heap_.front();
        heap_.front() = heap_.back();
        heap_.pop_back();
        if (!heap_.empty())
        {
            sift_down(0);
        }
        return top;
    }

    // Purpose: Read-only emptiness test that does not modify the structure.
    // 作用：只读判断容器是否为空；不修改结构。
    bool empty() const
    {
        return heap_.empty();
    }

    // Purpose: Return the current element count from the maintained field instead of traversing.
    // 作用：返回当前有效元素个数；直接读取维护字段，不遍历。
    std::size_t size() const
    {
        return heap_.size();
    }

  private:
    // Purpose: Compare two node indices by frequency, using insertion order to break frequency ties stably.
    // 作用：比较两个结点下标：频率小者优先，频率相同按插入序号稳定排序。
    bool less(int a, int b) const
    {
        if (nodes_[a].frequency != nodes_[b].frequency)
        {
            return nodes_[a].frequency < nodes_[b].frequency;
        }
        return nodes_[a].order < nodes_[b].order;
    }

    // Purpose: Sift up from index, swapping with the parent until min-heap order is restored.
    // 作用：从 index 向上与父结点比较并交换，直到最小堆序恢复。
    void sift_up(std::size_t index)
    {
        while (index > 0)
        {
            std::size_t parent = (index - 1) / 2;
            if (!less(heap_[index], heap_[parent]))
            {
                return;
            }
            std::swap(heap_[parent], heap_[index]);
            index = parent;
        }
    }

    // Purpose: Sift down from index, swapping with the smaller child until min-heap order is restored.
    // 作用：从 index 向下与较小孩子交换，直到最小堆序恢复。
    void sift_down(std::size_t index)
    {
        while (true)
        {
            std::size_t left = index * 2 + 1;
            std::size_t right = left + 1;
            std::size_t smallest = index;
            if (left < heap_.size() && less(heap_[left], heap_[smallest]))
            {
                smallest = left;
            }
            if (right < heap_.size() && less(heap_[right], heap_[smallest]))
            {
                smallest = right;
            }
            if (smallest == index)
            {
                return;
            }
            std::swap(heap_[index], heap_[smallest]);
            index = smallest;
        }
    }

    std::vector<Node> &nodes_;
    std::vector<int> heap_;
};

// Purpose: Recursively print each leaf's Huffman code along the 0/1 tree path without modifying the tree.
// 作用：沿树的 0/1 路径递归输出每个叶子的哈夫曼编码；不修改树。
void print_codes(const std::vector<Node> &nodes, int index, std::string path)
{
    const Node &node = nodes[index];
    if (node.left == -1 && node.right == -1)
    {
        std::cout << node.symbol << ": " << (path.empty() ? "(empty)" : path) << '\n';
        return;
    }
    if (node.left != -1)
    {
        print_codes(nodes, node.left, path + '0');
    }
    if (node.right != -1)
    {
        print_codes(nodes, node.right, path + '1');
    }
}

int main()
{
    std::vector<int> frequencies{5, 9, 12, 13, 16, 45};
    std::vector<char> symbols{'a', 'b', 'c', 'd', 'e', 'f'};

    std::vector<Node> nodes;
    nodes.reserve(2 * frequencies.size() - 1);
    MinHeap heap(nodes);
    for (std::size_t i = 0; i < frequencies.size(); ++i)
    {
        nodes.push_back(Node{frequencies[i], symbols[i], static_cast<int>(i), -1, -1});
        heap.push(static_cast<int>(i));
    }

    int order = static_cast<int>(frequencies.size());
    // Merge the two least frequent nodes repeatedly; the final tree gives shorter codes to more frequent symbols.
    while (heap.size() > 1)
    {
        int first = heap.pop();
        int second = heap.pop();
        nodes.push_back(
            Node{nodes[first].frequency + nodes[second].frequency, '\0', order++, first, second});
        heap.push(static_cast<int>(nodes.size() - 1));
    }

    int root = heap.pop();
    std::cout << "root frequency: " << nodes[root].frequency << '\n';
    std::cout << "codes:\n";
    print_codes(nodes, root, "");
    return 0;
}
