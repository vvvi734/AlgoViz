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

/* 分配零初始化节点，tag 从源节点继承。 */
GLNode *new_node(int tag)
{
    GLNode *node = new GLNode{};
    node->tag = tag;
    return node;
}

/* 构造原子节点，供示例树使用。 */
GLNode *make_atom(const char *text)
{
    GLNode *node = new_node(GL_ATOM);
    std::snprintf(node->value.atom, sizeof(node->value.atom), "%s", text);
    return node;
}

/* 构造空表节点；head 为空，但节点本身代表真实的 ()。 */
GLNode *make_list()
{
    return new_node(GL_LIST);
}

/* 把 child 追加到 parent 的同层链尾。 */
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

/*
 * 复制一个节点及其子树；不复制 src->next。
 * 返回新节点，分配失败返回 nullptr。调用方负责连接同层后继。
 */
GLNode *copy_one(const GLNode *src)
{
    if (src == nullptr)
    {
        return nullptr;
    }
    GLNode *dst = new_node(src->tag);
    if (src->tag == GL_ATOM)
    {
        std::memcpy(dst->value.atom, src->value.atom, sizeof(dst->value.atom));
        return dst;
    }
    GLNode **tail = &dst->value.head;
    for (const GLNode *child = src->value.head; child != nullptr; child = child->next)
    {
        GLNode *child_copy = copy_one(child);
        if (child_copy == nullptr)
        {
            free_gl(dst);
            return nullptr;
        }
        *tail = child_copy;
        tail = &child_copy->next;
    }
    return dst;
}

/* 递归释放整棵表；先保存 next，避免释放后继续解引用。 */
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
