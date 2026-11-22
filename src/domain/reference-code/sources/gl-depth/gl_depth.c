/*
 * AlgoViz 参考代码 · 广义表深度 · C11
 * 原理实现
 *
 * 中文导读：本文件演示教材的表头—表尾链式存储：tag 区分原子/子表，
 *   原子的值存在 value.atom，子表的首元素由 value.head 指向，所有节点
 *   再用 next 串起同层后继。gl_depth 只回答“嵌套有几层”，不数元素个数。
 *
 * 阅读顺序：先看 GLNode 的 tag 与 union，再看 make_* 如何构造示例，
 *   然后看 gl_depth 的两个终止条件和子表循环，最后看 main 的输出。
 *
 * 深度约定：原子 0；空表 () 1；非空表 = 1 + 子表最大深度。
 *
 * 输入输出：本文件的示例树在 main 中手工构造，不读取外部表达式；
 *   gl_depth 接收一个表节点指针，返回其深度。空指针按 0 处理，仅用于
 *   防御，不表示合法的广义表。
 *
 * 关键不变量：tag=GL_ATOM 时只能读 value.atom；tag=GL_LIST 时只能读
 *   value.head；next 永远指向同层下一个元素，绝不指向子表首元素。
 *
 * 易错点：把空表当深度 0；把各子表深度相加而不是取最大值；把 next
 *   当成二叉树右孩子；原子节点继续访问 value.head。
 *
 * 复杂度：每个节点访问一次，时间 O(n)；递归栈 O(h)，h 为嵌套层数。
 */

/*
 * Generalized-list depth in C11.
 *
 * `tag` separates atoms from sublists: an atom stores text in `value.atom`, a
 * sublist stores its first child in `value.head`, and `next` links siblings at
 * the same level. Depth is 0 for an atom, 1 for an empty list, and 1 plus the
 * maximum child depth otherwise. O(n) time and O(h) recursion space.
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

// 作用：分配零初始化节点；tag 决定之后读取 atom 还是 head。
// Purpose: Allocate a zero-initialized node; tag decides whether atom or head is read.
/* 分配一个零初始化节点；tag 决定后续读取 union 的哪一支。 */
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

// 作用：构造原子节点并复制文本；调用方保证长度不超过 GL_ATOM_MAX。
// Purpose: Construct an atom and copy text; the caller keeps it within GL_ATOM_MAX.
/* 构造原子节点；调用方保证 text 不超过 GL_ATOM_MAX。 */
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

// 作用：构造空表节点；head 为 NULL，但节点本身代表真实的 ()。
// Purpose: Construct an empty list; head is NULL, but the node is a real ().
/* 构造空表节点；空表的 head 为 NULL，但节点本身真实存在。 */
GLNode *make_list(void)
{
    return new_node(GL_LIST);
}

// Append through a pointer-to-pointer tail, so an empty head is updated without a separate branch.
// Purpose: Append child to the sibling chain; this function sets the child's next pointer.
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

// Depth semantics: atom 0, empty list 1, non-empty list 1 + maximum child depth; null is only a defensive 0.
int gl_depth(const GLNode *node)
{
    if (node == NULL)
    {
        return 0;
    }
    if (node->tag == GL_ATOM)
    {
        return 0;
    }
    if (node->value.head == NULL)
    {
        return 1;
    }
    int best = 0;
    for (const GLNode *child = node->value.head; child != NULL; child = child->next)
    {
        // 子表之间是并列关系，深度取最大值，不能把各子表深度相加。
        // Purpose: Sibling sublists are alternatives, so take the maximum depth, never the sum.
        int child_depth = gl_depth(child);
        if (child_depth > best)
        {
            best = child_depth;
        }
    }
    return best + 1;
}

// Save next before freeing, and release the head chain first so nested children are not lost.
// Purpose: Free the table iteratively at each level and recursively through sublists.
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

// 作用：按括号形式输出广义表，仅用于人工核对示例结构。
// Purpose: Print the parenthesized list only to verify the demo structure.
/* 按 (a,(b,c)) 的形式打印，仅用于人工核对示例结果。 */
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

// 作用：构造示例 (a,(b,c),((d),e))，打印深度后释放整棵树。
// Purpose: Build the demo (a,(b,c),((d),e)), print its depth, then free the tree.
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

    printf("expression = ");
    print_gl(root);
    printf("\n");
    printf("depth = %d\n", gl_depth(root));
    free_gl(root);
    return 0;
}
