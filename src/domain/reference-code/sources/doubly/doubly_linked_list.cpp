/*
 * 中文导读：每个结点同时保存 prev 和 next，使已知结点两侧的插入/删除都为 O(1)。
 * 阅读顺序：先看 Node 的两个指针和 head/tail；再看插入时四条链接的赋值顺序；最后看删除时两侧如何互相接回。
 * 关键不变量：对任意相邻结点 a、b，必须同时有 a.next == b 与 b.prev == a。
 * 易错点：只改 next 不改 prev；删除尾结点不更新 tail；头尾边界空指针；释放后仍访问旧结点。
 * 复杂度：已知位置插删 O(1)，查找 O(n)，空间 O(n)（每结点多一个指针）。
 * 输入/输出：输入 main 内置的演示操作序列；结构函数原地改 prev/next，返回成功/元素；main 双向打印。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz reference implementation: doubly linked list (C++17).
// Nodes own their successors through unique_ptr and keep raw prev pointers.
//
// Reading guide:
// 1. Each node stores prev and next; the list keeps head and tail.
// 2. Appending links the new node after tail and updates tail.
// 3. Removing a known node patches its two neighbours; head/tail are fixed when
//    necessary.
// 4. Forward traversal follows next; backward traversal follows prev.
//
// Complexity: O(1) splice at a known node, O(n) search; extra space O(n).
// Convention: NULL/None marks both ends; prev and next must stay mutually
//   consistent.

#include <iostream>
#include <memory>

class DoublyList
{
  public:
    struct Node
    {
        int value = 0;
        Node *prev = nullptr;
        std::unique_ptr<Node> next;
    };

    // Purpose: Destructor: release every dynamic node, restore null head/tail and zero length, and save next before freeing each node.
    // 作用：析构：释放容器中所有动态结点，并把头尾指针和长度恢复为空状态；先保存 next 再释放当前结点。
    ~DoublyList()
    {
        while (head_)
        {
            head_ = std::move(head_->next);
        }
    }

    // Append wires prev and next first; only then does tail move to the new node.
    // Purpose: Append value at the doubly linked-list tail while maintaining prev, next, tail and length.
    // 作用：在双向链表尾部追加 value，同时维护 prev、next、tail 和 length。
    Node *append(int value)
    {
        auto node = std::make_unique<Node>();
        node->value = value;
        node->prev = tail_;
        Node *raw = node.get();
        if (tail_)
        {
            tail_->next = std::move(node);
        }
        else
        {
            head_ = std::move(node);
        }
        tail_ = raw;
        return raw;
    }

    // Removal repairs both `prev` and `next`; removing the head or tail must also update the external head/tail pointer.
    // Purpose: Remove a known node by reconnecting its predecessor and successor before freeing it; handle head and tail boundaries.
    // 作用：删除已知结点：让前驱与后继互相接回，再释放结点；注意头尾边界。
    void remove(Node *node)
    {
        std::unique_ptr<Node> next = std::move(node->next);
        if (next)
        {
            next->prev = node->prev;
        }
        if (node->prev)
        {
            node->prev->next = std::move(next);
        }
        else
        {
            head_ = std::move(next);
        }
        if (tail_ == node)
        {
            tail_ = node->prev;
        }
    }

    // Purpose: Print the list forward from head along next; read-only and does not alter links.
    // 作用：从 head 沿 next 正向输出链表；只读，不改变结构。
    void print_forward() const
    {
        for (Node *node = head_.get(); node; node = node->next.get())
        {
            std::cout << node->value << (node->next ? " " : "");
        }
        std::cout << '\n';
    }

    // Purpose: Print the list backward from tail along prev; read-only and does not alter links.
    // 作用：从 tail 沿 prev 反向输出链表；只读，不改变结构。
    void print_backward() const
    {
        for (Node *node = tail_; node; node = node->prev)
        {
            std::cout << node->value << (node->prev ? " " : "");
        }
        std::cout << '\n';
    }

    std::unique_ptr<Node> head_;
    Node *tail_ = nullptr;
};

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    DoublyList list;
    auto *one = list.append(1);
    auto *two = list.append(2);
    list.append(3);

    std::cout << "forward: ";
    list.print_forward();
    std::cout << "backward: ";
    list.print_backward();

    list.remove(two);
    std::cout << "after remove 2: ";
    list.print_forward();
    std::cout << "head: " << one->value << '\n';
    return 0;
}
