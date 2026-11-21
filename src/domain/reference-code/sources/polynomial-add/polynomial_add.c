/*
 * 中文导读：用按指数递减的单链表保存非零项，合并同类项并释放不再需要的结点。
 * 阅读顺序：先看 Term 的 coef/exp/next；再看两个链表按指数比较的三路分支；最后看相等指数相加为 0 时如何删除结点。
 * 关键不变量：每条链表内部指数严格递减且无零系数项；结果链表同样保持这个不变量。
 * 易错点：同指数相加为 0 仍保留结点；指针提前移动丢失后继；结果链表尾插未更新尾指针；释放了仍在使用的结点。
 * 复杂度：O(m+n) 时间，O(1) 额外空间（复用原结点时）。
 * 输入/输出：输入两个按指数降序排列的稀疏多项式链；返回新链，输入不变；main 打印和式。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * Univariate polynomial addition — independent C teaching implementation.
 * 一元多项式相加——独立 C 教学实现。
 *
 * Each polynomial is a singly linked list in strictly descending exponent
 * order. Two cursors compare exponents; equal exponents add coefficients, and a
 * zero sum creates no result node. The result chain is new; inputs are not
 * destroyed.
 *
 * 每个多项式是一条按指数严格降序的单链表。两个指针比较指数；指数相等时系数相加，
 * 和为 0 不创建结果结点。结果链新建，不破坏输入多项式。
 *
 * Compile: cc -std=c11 -Wall -Wextra polynomial_add.c -o polynomial_add
 */
#include <stdio.h>
#include <stdlib.h>

// Equal exponents add; a zero sum creates no result node.

typedef struct PolyNode
{
    int coefficient;
    int exponent;
    struct PolyNode *next;
} PolyNode;

// Purpose: Create a new node with its value and pointer initialized; the caller owns the release.
// 作用：创建一个新结点并初始化值和指针；调用者负责释放。
static PolyNode *make_node(int coefficient, int exponent)
{
    PolyNode *node = (PolyNode *)malloc(sizeof(PolyNode));
    if (node == NULL)
    {
        fprintf(stderr, "out of memory\n");
        exit(1);
    }
    node->coefficient = coefficient;
    node->exponent = exponent;
    node->next = NULL;
    return node;
}

// Purpose: Free every polynomial node, saving next before releasing the current term.
// 作用：释放多项式链表全部结点；先保存 next，再释放当前项。
static void free_poly(PolyNode *head)
{
    while (head != NULL)
    {
        PolyNode *next = head->next;
        free(head);
        head = next;
    }
}

/* Append a newly allocated term to the result tail. */
// Purpose: Append a term at the result polynomial's tail and maintain tail for O(1) insertion.
// 作用：在结果多项式尾部追加一项；维护 tail 指针，保证尾插 O(1)。
static void append_term(PolyNode **head, PolyNode **tail, int coefficient, int exponent)
{
    PolyNode *node = make_node(coefficient, exponent);
    if (*head == NULL)
        *head = node;
    else
        (*tail)->next = node;
    *tail = node;
}

/*
 * Merge A and B. Both inputs stay owned by the caller.
 * Invariant: result is strictly descending and no zero-coefficient term exists.
 */
// Purpose: Merge two exponent-descending polynomials: add coefficients of equal exponents and omit a term when the sum is zero.
// 作用：按指数从高到低合并两条多项式：指数相等则系数相加，相加为 0 时不保留该项。
static PolyNode *add_polynomials(const PolyNode *a, const PolyNode *b)
{
    PolyNode *result = NULL;
    PolyNode *tail = NULL;

    while (a != NULL || b != NULL)
    {
        if (a != NULL && b != NULL)
        {
            if (a->exponent == b->exponent)
            {
                int sum = a->coefficient + b->coefficient;
                if (sum != 0)
                { /* cancellation drops the term */
                    append_term(&result, &tail, sum, a->exponent);
                }
                a = a->next; /* both cursors advance */
                b = b->next;
            }
            else if (a->exponent > b->exponent)
            {
                append_term(&result, &tail, a->coefficient, a->exponent);
                a = a->next; /* only A advances */
            }
            else
            {
                append_term(&result, &tail, b->coefficient, b->exponent);
                b = b->next; /* only B advances */
            }
        }
        else if (a != NULL)
        {
            append_term(&result, &tail, a->coefficient, a->exponent);
            a = a->next;
        }
        else
        {
            append_term(&result, &tail, b->coefficient, b->exponent);
            b = b->next;
        }
    }
    return result;
}

// Purpose: Print the polynomial from high to low exponent without modifying any node.
// 作用：按指数从高到低输出多项式；只读，不修改结点。
static void print_polynomial(const char *label, const PolyNode *head)
{
    const PolyNode *node;
    printf("%s = ", label);
    if (head == NULL)
    {
        printf("0\n");
        return;
    }
    for (node = head; node != NULL; node = node->next)
    {
        int coef = node->coefficient;
        int magnitude = coef < 0 ? -coef : coef;
        if (node == head)
        {
            if (coef < 0)
                printf("-");
        }
        else
        {
            printf(coef < 0 ? " - " : " + ");
        }
        if (node->exponent == 0)
        {
            printf("%d", magnitude);
        }
        else if (node->exponent == 1)
        {
            if (magnitude != 1)
                printf("%d", magnitude);
            printf("x");
        }
        else
        {
            if (magnitude != 1)
                printf("%d", magnitude);
            printf("x^%d", node->exponent);
        }
    }
    printf("\n");
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    /* A = 3x^4 + 2x^2 - 5, B = -3x^4 + 4x^3 + 7. */
    PolyNode *a = NULL;
    PolyNode *b = NULL;
    PolyNode *result = NULL;
    PolyNode *tail_a = NULL;
    PolyNode *tail_b = NULL;

    append_term(&a, &tail_a, 3, 4);
    append_term(&a, &tail_a, 2, 2);
    append_term(&a, &tail_a, -5, 0);

    append_term(&b, &tail_b, -3, 4);
    append_term(&b, &tail_b, 4, 3);
    append_term(&b, &tail_b, 7, 0);

    result = add_polynomials(a, b);
    print_polynomial("A", a);
    print_polynomial("B", b);
    print_polynomial("A+B", result); /* 4x^3 + 2x^2 + 2 */

    free_poly(a);
    free_poly(b);
    free_poly(result);
    return 0;
}
