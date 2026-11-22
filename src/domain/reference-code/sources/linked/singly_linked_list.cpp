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

    // Purpose: Construct a singly linked-list node with value and a null next pointer.
    // 作用：构造单链表结点：保存 value，next 置空。
    explicit Node(int value_) : value(value_), next(nullptr)
    {
    }
};

class SinglyLinkedList
{
  public:
    // Purpose: Construct an empty singly linked list with null head/tail and zero length.
    // 作用：构造空单链表：head、tail 置空，length 归零。
    SinglyLinkedList() : head_(nullptr), tail_(nullptr), length_(0)
    {
    }

    // Raw-pointer ownership: copying would duplicate ownership and double free.
    SinglyLinkedList(const SinglyLinkedList &) = delete;
    SinglyLinkedList &operator=(const SinglyLinkedList &) = delete;

    // Purpose: Destructor: release every dynamic node, restore null head/tail and zero length, and save next before freeing each node.
    // 作用：析构：释放容器中所有动态结点，并把头尾指针和长度恢复为空状态；先保存 next 再释放当前结点。
    ~SinglyLinkedList()
    {
        clear();
    }

    // Purpose: Return the head pointer for read-only access.
    // 作用：返回头指针供只读访问。
    Node *head() const
    {
        return head_;
    }

    // Purpose: Head insertion: point the new node at the old head, then update head, and update tail when the list was empty.
    // 作用：头插：新结点的 next 指向旧 head，再更新 head；空表时同时更新 tail。
    void insert_head(int value)
    {
        Node *node = new Node(value);
        // Publish the new node only after its next pointer reaches the old head.
        node->next = head_;
        head_ = node;
        if (tail_ == nullptr)
        {
            tail_ = node;
        }
        ++length_;
    }

    // Purpose: Find the predecessor of target for deletion or insertion after a known node.
    // 作用：查找 target 的前驱结点；用于删除或“在已知结点后插入”。
    Node *find_prev(const Node *target) const
    {
        if (head_ == nullptr || target == nullptr || target == head_)
        {
            return nullptr;
        }
        Node *prev = head_;
        while (prev->next != nullptr && prev->next != target)
        {
            prev = prev->next;
        }
        return prev->next == target ? prev : nullptr;
    }

    // Purpose: Insert value after known node prev by linking the new node to the successor before changing prev->next.
    // 作用：在已知结点 prev 后插入 value；先接新结点到后继，再改 prev->next。
    bool insert_after(Node *prev, int value)
    {
        if (prev == nullptr)
        {
            return false;
        }
        Node *node = new Node(value);
        node->next = prev->next;
        prev->next = node;
        if (prev == tail_)
        {
            tail_ = node;
        }
        ++length_;
        return true;
    }

    // Purpose: Find and remove the first node with the given value, updating tail and length after the removal.
    // 作用：按值查找并删除第一个匹配结点；删除后同步更新 tail 和 length。
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

    // Purpose: Traverse and print the current structure without modifying data, so each step can be checked.
    // 作用：只读遍历并输出当前结构；不会修改数据，适合在每一步后核对状态。
    void print() const
    {
        std::cout << "list:";
        for (const Node *current = head_; current != nullptr; current = current->next)
        {
            std::cout << ' ' << current->value;
        }
        std::cout << '\n';
    }

    // Purpose: Return the list length by reading length_ directly, without traversal.
    // 作用：返回链表长度；直接读取 length_，不遍历。
    std::size_t length() const
    {
        return length_;
    }

    // Purpose: Clear the container, release every dynamic node, and restore null head/tail and zero length.
    // 作用：清空容器并释放所有动态结点，把头尾指针和长度恢复为空状态。
    void clear()
    {
        Node *current = head_;
        while (current != nullptr)
        {
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
