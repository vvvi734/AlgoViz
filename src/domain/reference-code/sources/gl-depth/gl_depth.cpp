/*
 * AlgoViz 参考代码 · 广义表深度 · C++17
 * 原理实现
 *
 * 中文导读：与 C 版保持同一套表头—表尾链式节点：tag 区分原子/子表，
 *   原子存 value.atom，子表用 value.head 指向首元素，next 连接同层后继。
 *   gl_depth 递归取子表最大深度加 1；原子返回 0，空表返回 1。
 *
 * 阅读顺序：先看 GLNode 的 tag/union，再看 gl_depth 的终止条件与循环，
 *   最后看 main 手工构造的 (a,(b,c),((d),e)) 示例。
 *
 * 输入输出：示例树在 main 内构造，不读取外部表达式；gl_depth 接收
 *   当前表节点并返回深度，nullptr 按 0 防御性处理。
 *
 * 关键不变量：只有 GL_LIST 节点读取 head；next 只表示同层后继，不是
 *   二叉树右孩子；空表的 head == nullptr，但节点本身不能被省略。
 *
 * 易错点：空表深度写成 0；多个子表深度求和；原子继续展开 head；
 *   释放时先 delete 当前节点再读 next。
 *
 * 复杂度：时间 O(n)，递归栈 O(h)，n 为节点数，h 为最大嵌套层数。
 */

#include <cstdio>
#include <cstdlib>
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

/* 分配零初始化节点；tag 决定 union 的读取方式。 */
GLNode *new_node(int tag)
{
    GLNode *node = new GLNode{};
    node->tag = tag;
    return node;
}

/* 构造原子节点，复制最多 GL_ATOM_MAX 个字符。 */
GLNode *make_atom(const char *text)
{
    GLNode *node = new_node(GL_ATOM);
    std::snprintf(node->value.atom, sizeof(node->value.atom), "%s", text);
    return node;
}

/* 构造空表节点；head 为空但节点仍代表一个真实的 ()。 */
GLNode *make_list()
{
    return new_node(GL_LIST);
}

/* 把 child 追加到 list 的同层链尾。 */
void append_child(GLNode *list, GLNode *child)
{
    if (list == nullptr || child == nullptr || list->tag != GL_LIST)
    {
        return;
    }
    GLNode **tail = &list->value.head;
    while (*tail != nullptr)
    {
        tail = &(*tail)->next;
    }
    *tail = child;
}

/*
 * 求广义表深度：原子 0，空表 1，非空表 1 + 最大子深度。
 * 只读递归，不修改结构，也不分配内存。
 */
int gl_depth(const GLNode *node)
{
    if (node == nullptr)
    {
        return 0;
    }
    if (node->tag == GL_ATOM)
    {
        return 0;
    }
    if (node->value.head == nullptr)
    {
        return 1;
    }
    int best = 0;
    for (const GLNode *child = node->value.head; child != nullptr; child = child->next)
    {
        int child_depth = gl_depth(child);
        if (child_depth > best)
        {
            best = child_depth;
        }
    }
    return best + 1;
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

/* 打印标准括号形式，用于核对示例。 */
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

    std::cout << "expression = ";
    print_gl(root);
    std::cout << "\n";
    std::cout << "depth = " << gl_depth(root) << "\n";
    free_gl(root);
    return 0;
}
