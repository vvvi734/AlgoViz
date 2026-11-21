/*
 * 中文导读：让尾结点的 next 指回头结点，使“从任意结点出发都能绕一圈”。
 * 阅读顺序：先看 tail/head 的指向；再看插入/删除如何维护环；最后看遍历为什么必须用 do-while 或记录起点。
 * 关键不变量：最后一个结点的 next 永远指回第一个结点；空表时指针关系要单独定义。
 * 易错点：用 while(p != NULL) 遍历环导致死循环；删除时没有更新前驱/尾指针；空表和非空表分支不一致。
 * 复杂度：已知位置插入/删除 O(1)，查找 O(n)，空间 O(n)。
 */

// AlgoViz reference implementation: circular singly linked list (C++17).
// The tail node links back to the head, so traversal stops when it returns.
//
// Reading guide:
// 1. The list keeps a tail pointer and tail->next points back to the head.
// 2. Appending inserts after tail and moves tail to the new node.
// 3. Traversal starts at head and stops when it returns to head; an empty list has
//    tail == NULL.
//
// Complexity: O(1) append, O(n) traversal; extra space O(n).
// Convention: There is no NULL terminator inside a non-empty list; emptiness is tail
//   == NULL.

#include <iostream>
#include <new>

class CircularList
{
  public:
    struct Node
    {
        int value = 0;
        Node *next = nullptr;
    };

    // 作用：析构：释放容器中所有动态结点，并把头尾指针和长度恢复为空状态；先保存 next 再释放当前结点。
    ~CircularList()
    {
        clear();
    }

    // New node points at head; the old tail points at the new node, preserving the ring.
    // The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.
    // 作用：在循环链表尾部追加 value，并维护 tail 与环的闭合关系。
    bool append(int value)
    {
        Node *node = new (std::nothrow) Node{value, nullptr};
        if (!node)
        {
            return false;
        }
        if (!tail_)
        {
            node->next = node;
            head_ = node;
        }
        else
        {
            node->next = head_;
            tail_->next = node;
        }
        tail_ = node;
        return true;
    }

    // 作用：只读遍历并输出当前结构；不会修改数据，适合在每一步后核对状态。
    void print() const
    {
        if (!head_)
        {
            std::cout << "(empty)\n";
            return;
        }
        const Node *node = head_;
        do
        {
            std::cout << node->value << (node->next == head_ ? "" : " ");
            node = node->next;
        } while (node != head_);
        std::cout << '\n';
    }

    // 作用：返回尾指针供只读访问；尾结点的 next 指向头结点。
    const Node *tail() const
    {
        return tail_;
    }

  private:
    // 作用：清空容器并释放所有动态结点，把头尾指针和长度恢复为空状态。
    void clear()
    {
        if (!head_)
        {
            return;
        }
        Node *node = head_;
        while (node != tail_)
        {
            Node *next = node->next;
            delete node;
            node = next;
        }
        delete tail_;
        head_ = nullptr;
        tail_ = nullptr;
    }

    Node *head_ = nullptr;
    Node *tail_ = nullptr;
};

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    CircularList list;
    list.append(1);
    list.append(2);
    list.append(3);
    std::cout << "circular: ";
    list.print();
    std::cout << "tail->next: " << list.tail()->next->value << '\n';
    return 0;
}
