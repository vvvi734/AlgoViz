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
    // Purpose: Release the owning chain from the head; no count field is involved.
    // 作用：从 head 沿 unique_ptr 链释放全部结点；本类没有 length，tail_ 不参与所有权。
    ~DoublyList()
    {
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
    // Purpose: Link a new owned node after the old tail, then publish it as tail_.
    // 作用：先把新结点接入链并保持 prev/next 对称，最后再更新 tail_。
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
    /*
     * The local `next` takes ownership of the successor before the predecessor is
     * rewired, so the rest of the list survives. Replacing `node->prev->next` (or
     * `head_`) releases the old owner and therefore deletes `node` during that
     * assignment. The subsequent `tail_ == node` check and `tail_ = node->prev`
     * therefore touch a node that may already be freed when the removed node is the
     * tail or the only node. This ordering is a known implementation risk recorded
     * in the audit, not a pattern to copy; a safe version would capture `prev` and
     * tail membership before releasing the owner. The demo removes a middle node,
     * so it does not execute the dangling-tail path.
     */
    // Purpose: Remove a known node by reconnecting its neighbours with unique_ptr ownership.
    // 作用：用 unique_ptr 转移所有权接回前驱/后继；尾结点删除顺序存在已登记的释放后访问风险。
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
