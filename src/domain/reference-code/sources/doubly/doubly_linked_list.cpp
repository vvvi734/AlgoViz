/*
 * 中文导读：每个结点同时保存 prev 和 next，使已知结点两侧的插入/删除都为 O(1)。
 * 阅读顺序：先看 Node 的两个指针和 head/tail；再看插入时四条链接的赋值顺序；最后看删除时两侧如何互相接回。
 * 关键不变量：对任意相邻结点 a、b，必须同时有 a.next == b 与 b.prev == a。
 * 易错点：只改 next 不改 prev；删除尾结点不更新 tail；头尾边界空指针；释放后仍访问旧结点。
 * 复杂度：已知位置插删 O(1)，查找 O(n)，空间 O(n)（每结点多一个指针）。
 * 输入/输出：输入 main 内置的演示操作序列；结构函数原地改 prev/next，返回成功/元素；main 双向打印。
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

    /*
     * Ownership follows `head_->next`: repeatedly moving the next pointer into
     * `head_` releases the previous head. No `length` is stored. The loop ends when
     * `head_` becomes null; `tail_` is a non-owning observer and is not used after
     * the object is destroyed.
     */
    ~DoublyList()
    {
        // Moving head_->next into head_ releases the old head; tail_ is only an observer and is never dereferenced after destruction.
        while (head_)
        {
            head_ = std::move(head_->next);
        }
    }

    /*
     * `make_unique` establishes ownership before the node is linked; failure is
     * reported by an exception, not by a null return. `raw` preserves the address
     * because moving the unique_ptr into the old tail transfers ownership. For an
     * empty list there is no old tail, so `head_` receives the node instead. The
     * new links exist before `tail_` is moved, keeping prev/next symmetric.
     */
    Node *append(int value)
    {
        // make_unique establishes ownership before any link is changed; unlike the C version, allocation failure throws instead of returning null.
        auto node = std::make_unique<Node>();
        node->value = value;
        node->prev = tail_;
        // Keep the raw address because moving the unique_ptr transfers ownership; tail_ must observe the node, not own it.
        Node *raw = node.get();
        // A non-empty list attaches through the old tail's owning next; an empty list must install the node as head_ instead.
        if (tail_)
        {
            tail_->next = std::move(node);
        }
        else
        {
            head_ = std::move(node);
        }
        // tail_ moves only after the new node is reachable from head_; updating early would expose a node with no inbound link.
        tail_ = raw;
        return raw;
    }

    // Removal repairs both `prev` and `next`; removing the head or tail must also update the external head/tail pointer.
    /*
     * `prev` and `was_tail` are captured while the node is still alive. The local
     * `next` then takes ownership of the successor, and the final assignment to
     * `prev->next` or `head_` may delete `node`. Updating `tail_` before that
     * assignment avoids reading a freed `node->prev`.
     */
    void remove(Node *node)
    {
        // Capture prev and the tail relation before moving node->next: the move may destroy node once ownership is reassigned.
        Node *prev = node->prev;
        bool was_tail = (tail_ == node);
        // Moving next out of node makes the successor owned by the local variable; the later assignment transfers it to prev or head_.
        std::unique_ptr<Node> next = std::move(node->next);
        if (next)
        {
            next->prev = prev;
        }
        // tail_ must retreat before the final owning assignment may delete node; after deletion node->prev is unreadable.
        if (was_tail)
        {
            tail_ = prev;
        }
        if (prev)
        {
            prev->next = std::move(next);
        }
        else
        {
            head_ = std::move(next);
        }
    }

    void print_forward() const
    {
        for (Node *node = head_.get(); node; node = node->next.get())
        {
            std::cout << node->value << (node->next ? " " : "");
        }
        std::cout << '\n';
    }

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
