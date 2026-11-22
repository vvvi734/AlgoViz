/*
 * AlgoViz 参考代码 · 广义表复制 · C++17
 * 原理实现
 *
 * 中文导读：与 C 版相同的表头—表尾节点。copy_one 先按 src->tag 分配新
 *   节点，再分两支：原子复制 value.atom；子表沿 src->value.head 递归，
 *   用 tail 指针把每个新孩子串到 dst 的同层链上。函数只复制一个节点及其
 *   子树，next 后继交给调用方连接。
 *
 * 阅读顺序：GLNode → copy_one 的原子/表分支 → main 的比较与释放。
 *
 * 输入输出：示例树在 main 构造；copy_one 返回全新的节点指针，失败返回
 *   nullptr。源树只读，复制后源树与副本可独立释放。
 *
 * 关键不变量：copy_one 不复制源节点的 next；新表 head 只连接新节点；
 *   空表保留真实节点，head 为 nullptr；原子文本完整复制。
 *
 * 易错点：返回源指针；先递归后分配父；空表变 nullptr；复用源 head；
 *   忘记把新孩子接到 tail 导致丢链；释放顺序错误。
 *
 * 复杂度：时间 O(n)，新表 O(n)，递归栈 O(h)。
 */

/*
 * Generalized-list copy in C++17.
 *
 * Copying allocates a fresh node for every source node. An atom copies its
 * text; a sublist recursively copies children and rebuilds the sibling chain
 * through `next`. `copy_one` owns the returned subtree but not its own `next`;
 * the caller links it. Time O(n), new tree O(n), recursion space O(h).
 */

#include <cstdio>
#include <cstring>
#include <iostream>

enum GlTag
{
    GL_ATOM = 0,
    GL_LIST = 1
};

constexpr int GL_ATOM_MAX = 8;

struct GLNode
{
    int tag;
    union
    {
        char atom[GL_ATOM_MAX + 1];
        GLNode *head;
    } value;
    GLNode *next;
};

void free_gl(GLNode *node);

// 作用：分配零初始化节点，tag 从源节点继承。
// Purpose: Allocate a zero-initialized node; inherit the tag from the source.
/* 分配零初始化节点，tag 从源节点继承。 */
GLNode *new_node(int tag)
{
    GLNode *node = new GLNode{};
    node->tag = tag;
    return node;
}

// 作用：构造原子节点，供示例树使用。
// Purpose: Construct an atom node for the demo tree.
/* 构造原子节点，供示例树使用。 */
GLNode *make_atom(const char *text)
{
    GLNode *node = new_node(GL_ATOM);
    std::snprintf(node->value.atom, sizeof(node->value.atom), "%s", text);
    return node;
}

// 作用：构造空表节点；head 为空，但节点本身代表真实的 ()。
// Purpose: Construct an empty list; head is null, but the node represents a real ().
/* 构造空表节点；head 为空，但节点本身代表真实的 ()。 */
GLNode *make_list()
{
    return new_node(GL_LIST);
}

// Append through a pointer-to-pointer tail so an empty child list needs no special branch.
// Purpose: Append child to the sibling chain and set its next pointer.
void append_child(GLNode *parent, GLNode *child)
{
    if (parent == nullptr || child == nullptr || parent->tag != GL_LIST)
    {
        return;
    }
    GLNode **tail = &parent->value.head;
    while (*tail != nullptr)
    {
        tail = &(*tail)->next;
    }
    *tail = child;
}

// A deep copy allocates the new parent before descending; reusing a child would keep source and copy aliased.
// On allocation failure, free the half-built subtree rather than returning a partially linked copy.
GLNode *copy_one(const GLNode *src)
{
    if (src == nullptr)
    {
        return nullptr;
    }
    // The new parent must exist before its children are copied. Sharing a source child would make the two trees alias, so a later edit in one would appear in the other.
    GLNode *dst = new_node(src->tag);
    // An atom is a leaf: copying its text into the fresh node finishes the whole subtree, with no head recursion and no next link copied.
    if (src->tag == GL_ATOM)
    {
        std::memcpy(dst->value.atom, src->value.atom, sizeof(dst->value.atom));
        return dst;
    }
    // tail addresses the next child-link slot. Starting at the fresh node's head lets an empty copy and a non-empty copy share one insertion loop.
    GLNode **tail = &dst->value.head;
    for (const GLNode *child = src->value.head; child != nullptr; child = child->next)
    {
        GLNode *child_copy = copy_one(child);
        // 分配失败时回收已建好的半棵副本，避免内存泄漏。
        // Purpose: On allocation failure, free the half-built copy instead of leaking it.
        // A throw from a deeper allocation is not caught here, but this null check still guards the contract. Freeing the half-built subtree keeps ownership clean on failure.
        if (child_copy == nullptr)
        {
            free_gl(dst);
            return nullptr;
        }
        // Write the copied child into the current slot, then advance tail to that child's next field. Reversing the two steps would lose the insertion point.
        *tail = child_copy;
        tail = &child_copy->next;
    }
    return dst;
}

// Save next before delete and free the head chain first, so neither siblings nor children are lost.
// Purpose: Free each sibling iteratively and each sublist recursively.
void free_gl(GLNode *node)
{
    while (node != nullptr)
    {
        GLNode *next = node->next;
        if (node->tag == GL_LIST)
        {
            free_gl(node->value.head);
        }
        delete node;
        node = next;
    }
}

// 作用：按括号形式打印，用于比较源表与副本。
// Purpose: Print the parenthesized form to compare source and copy.
/* 打印标准括号形式，用于比较源表与副本。 */
void print_gl(const GLNode *node)
{
    if (node == nullptr)
    {
        return;
    }
    if (node->tag == GL_ATOM)
    {
        std::cout << node->value.atom;
        return;
    }
    std::cout << "(";
    for (const GLNode *child = node->value.head; child != nullptr; child = child->next)
    {
        print_gl(child);
        if (child->next != nullptr)
        {
            std::cout << ",";
        }
    }
    std::cout << ")";
}

// 作用：构造示例树，验证副本与源树根节点互相独立后分别释放。
// Purpose: Build the demo, verify the two roots are independent, then free both trees.
int main()
{
    GLNode *root = make_list();
    GLNode *bc = make_list();
    GLNode *de = make_list();
    GLNode *inner_d = make_list();

    append_child(bc, make_atom("b"));
    append_child(bc, make_atom("c"));
    append_child(inner_d, make_atom("d"));
    append_child(de, inner_d);
    append_child(de, make_atom("e"));

    append_child(root, make_atom("a"));
    append_child(root, bc);
    append_child(root, de);

    GLNode *copy = copy_one(root);
    std::cout << "source = ";
    print_gl(root);
    std::cout << "\ncopy   = ";
    print_gl(copy);
    std::cout << "\n";
    std::cout << "independent root = " << (root != copy ? "yes" : "no") << "\n";
    free_gl(root);
    free_gl(copy);
    return 0;
}
