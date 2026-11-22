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

/*
 * Generalized-list depth in C++17.
 *
 * `tag` separates atoms from sublists: an atom stores text in `value.atom`, a
 * sublist stores its first child in `value.head`, and `next` links siblings at
 * the same level. Depth is 0 for an atom, 1 for an empty list, and 1 plus the
 * maximum child depth otherwise. O(n) time and O(h) recursion space.
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

// 作用：分配零初始化节点；tag 决定之后读取 atom 还是 head。
// Purpose: Allocate a zero-initialized node; tag decides whether atom or head is read.
/* 分配零初始化节点；tag 决定 union 的读取方式。 */
GLNode *new_node(int tag)
{
    GLNode *node = new GLNode{};
    node->tag = tag;
    return node;
}

// 作用：构造原子节点并复制文本，最多 GL_ATOM_MAX 个字符。
// Purpose: Construct an atom and copy at most GL_ATOM_MAX characters.
/* 构造原子节点，复制最多 GL_ATOM_MAX 个字符。 */
GLNode *make_atom(const char *text)
{
    GLNode *node = new_node(GL_ATOM);
    std::snprintf(node->value.atom, sizeof(node->value.atom), "%s", text);
    return node;
}

// 作用：构造空表节点；head 为空，但节点本身代表真实的 ()。
// Purpose: Construct an empty list; head is null, but the node is a real ().
/* 构造空表节点；head 为空但节点仍代表一个真实的 ()。 */
GLNode *make_list()
{
    return new_node(GL_LIST);
}

// Append through a pointer-to-pointer tail, so an empty head is updated without a separate branch.
// Purpose: Append child to the sibling chain; this function sets the child's next pointer.
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

// Depth semantics: atom 0, empty list 1, non-empty list 1 + maximum child depth; null is only a defensive 0.
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
    // A real empty list has no children but still represents one pair of parentheses, so it returns 1; null is only a defensive no-node value.
    if (node->value.head == nullptr)
    {
        return 1;
    }
    // The empty case already returned, so best can start at 0. Each child's depth is compared against the best seen so far.
    int best = 0;
    for (const GLNode *child = node->value.head; child != nullptr; child = child->next)
    {
        // 子表并列，深度取最大值；不能把所有子表深度相加。
        // Purpose: Sibling sublists are alternatives; take the maximum, not the sum.
        // head moves one level down, while the loop's child=child->next stays on the sibling chain. Recursion depth therefore tracks nesting, not the number of siblings.
        int child_depth = gl_depth(child);
        if (child_depth > best)
        {
            best = child_depth;
        }
    }
    // The +1 accounts for the current list layer; the maximum, not a sum, ensures several sibling branches do not inflate the depth.
    return best + 1;
}

// Save next before delete, and release the head chain first so nested children are not lost.
// Purpose: Free the table iteratively at each level and recursively through sublists.
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

// 作用：按括号形式输出广义表，用于核对示例结构。
// Purpose: Print the parenthesized list to verify the demo.
/* 打印标准括号形式，用于核对示例。 */
void print_gl(const GLNode *node)
{
    if (node == nullptr)
    {
        return;
    }
    // An atom contributes no nesting layer, so it returns 0. Deferencing value.head for an atom would read the union through the wrong member.
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

// 作用：构造示例 (a,(b,c),((d),e))，打印深度后释放整棵树。
// Purpose: Build the demo, print its depth, then free the tree.
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
