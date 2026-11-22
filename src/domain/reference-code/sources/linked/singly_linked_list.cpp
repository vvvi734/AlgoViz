/*
 * 中文导读：用结点和 next 指针保存线性序列，重点练习插入/删除时的断链与重接。
 * 阅读顺序：先看 Node 和 head/tail/length；再看头插、尾插、按位置插入；最后看删除时为什么要先保存前驱/目标。
 * 关键不变量：从 head 出发沿 next 能走完 length 个结点；尾结点的 next 为 NULL；每个结点只有一个前驱。
 * 易错点：先改指针后保存后继导致断链；删除头结点不更新 head；尾插不更新 tail；释放后访问；长度不同步。
 * 复杂度：头插 O(1)，按位置查找 O(n)，已知前驱插删 O(1)，空间 O(n)。
 * 输入/输出：输入 main 内置的演示操作序列；结构函数原地改 next 并返回成功/元素；main 打印遍历结果。
*/

// AlgoViz reference implementation: singly linked list (C++17).
//
// Reading guide:
// 1. A node stores one value and one next pointer; the list owns a head pointer and
//    a length.
// 2. Head insertion links the new node before the old head, then updates head and
//    length.
// 3. Insertion/removal after a known node rewires next pointers; search first finds
//    that predecessor.
// 4. Traversal follows next until NULL; clear frees every node and resets the list.
//
// Complexity: O(1) head insertion, O(n) search/delete; extra space O(n).
// Convention: NULL terminates the list; node positions are 0-based when printed.

#include <cstddef>
#include <iostream>

struct Node
{
    int value;
    Node *next;

    explicit Node(int value_) : value(value_), next(nullptr)
    {
    }
};

class SinglyLinkedList
{
  public:
    // The three fields form one invariant: length_ counts nodes reachable from head_, and tail_ is either the last such node or null.
    SinglyLinkedList() : head_(nullptr), tail_(nullptr), length_(0)
    {
    }

    // Raw-pointer ownership: copying would duplicate ownership and double free.
    SinglyLinkedList(const SinglyLinkedList &) = delete;
    SinglyLinkedList &operator=(const SinglyLinkedList &) = delete;

    ~SinglyLinkedList()
    {
        clear();
    }

    Node *head() const
    {
        return head_;
    }

    void insert_head(int value)
    {
        Node *node = new Node(value);
        // Publish the new node only after its next pointer reaches the old head.
        node->next = head_;
        head_ = node;
        // An empty list has no old tail, so the first inserted node must become both head_ and tail_.
        if (tail_ == nullptr)
        {
            tail_ = node;
        }
        ++length_;
    }

    Node *find_prev(const Node *target) const
    {
        if (head_ == nullptr || target == nullptr || target == head_)
        {
            return nullptr;
        }
        Node *prev = head_;
        // Stop either at the node whose next is target or at the last node; the final check distinguishes a hit from a miss.
        while (prev->next != nullptr && prev->next != target)
        {
            prev = prev->next;
        }
        return prev->next == target ? prev : nullptr;
    }

    bool insert_after(Node *prev, int value)
    {
        if (prev == nullptr)
        {
            return false;
        }
        Node *node = new Node(value);
        // Link the new node to the old successor first; then prev->next can safely point at the new node.
        node->next = prev->next;
        prev->next = node;
        // Inserting after the current tail extends the list, so tail_ must move to the new node.
        if (prev == tail_)
        {
            tail_ = node;
        }
        ++length_;
        return true;
    }

    bool remove_value(int value)
    {
        Node *prev = nullptr;
        Node *current = head_;
        while (current != nullptr && current->value != value)
        {
            prev = current;
            current = current->next;
        }
        if (current == nullptr)
        {
            return false;
        }
        if (prev == nullptr)
        {
            head_ = current->next;
        }
        else
        {
            prev->next = current->next;
        }
        // Removing the current tail must move tail_ back to prev, or the tail becomes dangling.
        if (current == tail_)
        {
            tail_ = prev;
        }
        delete current;
        --length_;
        return true;
    }

    void print() const
    {
        std::cout << "list:";
        for (const Node *current = head_; current != nullptr; current = current->next)
        {
            std::cout << ' ' << current->value;
        }
        std::cout << '\n';
    }

    std::size_t length() const
    {
        return length_;
    }

    void clear()
    {
        Node *current = head_;
        while (current != nullptr)
        {
            // Save the successor before delete; clear must never dereference a node after releasing it.
            Node *next = current->next;
            delete current;
            current = next;
        }
        head_ = nullptr;
        tail_ = nullptr;
        length_ = 0;
    }

  private:
    Node *head_;
    Node *tail_;
    std::size_t length_;
};

int main()
{
    SinglyLinkedList list;
    list.insert_head(5);
    list.insert_head(8);
    list.insert_head(3);

    // Insert 6 between the head (3) and the second node (8).
    Node *prev = list.head();
    list.insert_after(prev, 6);

    list.remove_value(8);
    list.print();
    std::cout << "length=" << list.length() << '\n';
    list.clear();
    return 0;
}
