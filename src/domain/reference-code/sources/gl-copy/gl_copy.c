/*
 * AlgoViz 参考代码 · 广义表复制 · C11
 * 原理实现
 *
 * 中文导读：复制不是把根指针赋给另一个变量，而是为每个源节点分配一个新
 *   节点。tag 决定复制方式：原子复制 value.atom；子表先建立新节点，再沿
 *   源 head 逐个递归复制孩子，并用新节点的 next 接回同层链。
 *
 * 阅读顺序：先看 GLNode 的 tag/union，再看 copy_one 的原子分支和表分支，
 *   重点看 children 循环里 tail 指针如何把新孩子接到新父节点，最后看
 *   main 比较源根与新根、验证结构等价。
 *
 * 输入输出：示例树在 main 内手工构造；copy_one 接收一个源节点，返回结构
 *   相同但节点全新的副本。返回的 next 由调用方连接，copy_one 不复制源节点
 *   的同层后继。
 *
 * 关键不变量：新节点的 tag 与源节点相同；原子文本逐字复制；子表的 head
 *   只连接新节点；源节点在复制过程中只读，复制结束后仍可独立使用。
 *
 * 易错点：只返回源根指针；先递归孩子后分配父节点；空表复制成 NULL；
 *   新节点直接复用源 head；忘记把新孩子接到 tail 而丢链。
 *
 * 复杂度：时间 O(n)，新表占 O(n)，递归栈 O(h)。
 */

/*
 * Generalized-list copy in C11.
 *
 * Copying allocates a new node for every source node instead of sharing the
 * root pointer. An atom copies `value.atom`; a sublist recursively copies each
 * child and rebuilds the sibling chain through the new node's `next`. The
 * returned node owns its subtree but not its own `next`; the caller links it.
 * Time O(n), new tree O(n), recursion space O(h).
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define GL_ATOM 0
#define GL_LIST 1
#define GL_ATOM_MAX 8

typedef struct GLNode
{
    int tag;
    union
    {
        char atom[GL_ATOM_MAX + 1];
        struct GLNode *head;
    } value;
    struct GLNode *next;
} GLNode;

void free_gl(GLNode *node);

// 作用：分配零初始化节点，tag 必须从源节点继承。
// Purpose: Allocate a zero-initialized node; the copy must inherit the source tag.
/* 分配零初始化节点；复制时 tag 必须从源节点继承。 */
static GLNode *new_node(int tag)
{
    GLNode *node = (GLNode *)calloc(1, sizeof(GLNode));
    if (node == NULL)
    {
        return NULL;
    }
    node->tag = tag;
    return node;
}

// 作用：构造原子节点，供示例树使用。
// Purpose: Construct an atom node for the demo tree.
/* 构造原子节点，供示例树使用。 */
GLNode *make_atom(const char *text)
{
    GLNode *node = new_node(GL_ATOM);
    if (node == NULL)
    {
        return NULL;
    }
    strncpy(node->value.atom, text, GL_ATOM_MAX);
    node->value.atom[GL_ATOM_MAX] = '\0';
    return node;
}

// 作用：构造空表节点；head 为 NULL，但节点本身必须真实存在。
// Purpose: Construct an empty-list node; head is NULL, but the node itself is a real ().
/* 构造空表节点；空表的 head 为 NULL，但节点本身必须真实存在。 */
GLNode *make_list(void)
{
    return new_node(GL_LIST);
}

// Append through a pointer-to-pointer tail, so a copy with no children starts cleanly and keeps sibling order.
// Purpose: Append child to the sibling chain and set its next pointer.
void append_child(GLNode *list, GLNode *child)
{
    if (list == NULL || child == NULL || list->tag != GL_LIST)
    {
        return;
    }
    GLNode **tail = &list->value.head;
    while (*tail != NULL)
    {
        tail = &(*tail)->next;
    }
    *tail = child;
}

// A deep copy must allocate the new parent before descending; sharing a child would alias source and copy.
// On child failure, free the partially built subtree instead of returning a half-connected list.
GLNode *copy_one(const GLNode *src)
{
    if (src == NULL)
    {
        return NULL;
    }
    GLNode *dst = new_node(src->tag);
    if (dst == NULL)
    {
        return NULL;
    }
    if (src->tag == GL_ATOM)
    {
        memcpy(dst->value.atom, src->value.atom, sizeof(dst->value.atom));
        return dst;
    }
    GLNode **tail = &dst->value.head;
    for (const GLNode *child = src->value.head; child != NULL; child = child->next)
    {
        GLNode *child_copy = copy_one(child);
        // 新副本一旦分配失败，必须回收已经建好的部分，避免半成品泄漏。
        // Purpose: If a child copy fails, free the partially built subtree to avoid a leak.
        if (child_copy == NULL)
        {
            free_gl(dst);
            return NULL;
        }
        *tail = child_copy;
        tail = &child_copy->next;
    }
    return dst;
}

// 作用：递归释放整棵表；先保存 next，再释放当前节点和 head 链。
// Purpose: Free the table recursively; save next before freeing the node and its head chain.
/* 递归释放整棵表；先保存 next，再释放当前节点及其 head 链。 */
void free_gl(GLNode *node)
{
    while (node != NULL)
    {
        GLNode *next = node->next;
        if (node->tag == GL_LIST)
        {
            free_gl(node->value.head);
        }
        free(node);
        node = next;
    }
}

// 作用：按括号形式打印，用于比较源表与副本的文本是否一致。
// Purpose: Print the parenthesized form to compare source and copy text.
/* 打印标准括号形式，用于核对复制前后的文本是否一致。 */
void print_gl(const GLNode *node)
{
    if (node == NULL)
    {
        return;
    }
    if (node->tag == GL_ATOM)
    {
        printf("%s", node->value.atom);
        return;
    }
    printf("(");
    for (const GLNode *child = node->value.head; child != NULL; child = child->next)
    {
        print_gl(child);
        if (child->next != NULL)
        {
            printf(",");
        }
    }
    printf(")");
}

// 作用：构造示例树，复制后分别打印并释放源树与副本。
// Purpose: Build the demo tree, then print and free both the source and the copy.
int main(void)
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
    printf("source = ");
    print_gl(root);
    printf("\ncopy   = ");
    print_gl(copy);
    printf("\n");
    printf("independent root = %s\n", root != copy ? "yes" : "no");
    free_gl(root);
    free_gl(copy);
    return 0;
}
