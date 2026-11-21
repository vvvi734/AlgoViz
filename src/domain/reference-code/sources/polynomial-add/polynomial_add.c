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

typedef struct PolyNode {
    int coefficient;
    int exponent;
    struct PolyNode *next;
} PolyNode;

static PolyNode *make_node(int coefficient, int exponent) {
    PolyNode *node = (PolyNode *)malloc(sizeof(PolyNode));
    if (node == NULL) {
        fprintf(stderr, "out of memory\n");
        exit(1);
    }
    node->coefficient = coefficient;
    node->exponent = exponent;
    node->next = NULL;
    return node;
}

static void free_poly(PolyNode *head) {
    while (head != NULL) {
        PolyNode *next = head->next;
        free(head);
        head = next;
    }
}

/* Append a newly allocated term to the result tail. */
static void append_term(PolyNode **head, PolyNode **tail, int coefficient, int exponent) {
    PolyNode *node = make_node(coefficient, exponent);
    if (*head == NULL) *head = node;
    else (*tail)->next = node;
    *tail = node;
}

/*
 * Merge A and B. Both inputs stay owned by the caller.
 * Invariant: result is strictly descending and no zero-coefficient term exists.
 */
static PolyNode *add_polynomials(const PolyNode *a, const PolyNode *b) {
    PolyNode *result = NULL;
    PolyNode *tail = NULL;

    while (a != NULL || b != NULL) {
        if (a != NULL && b != NULL) {
            if (a->exponent == b->exponent) {
                int sum = a->coefficient + b->coefficient;
                if (sum != 0) {                    /* cancellation drops the term */
                    append_term(&result, &tail, sum, a->exponent);
                }
                a = a->next;                       /* both cursors advance */
                b = b->next;
            } else if (a->exponent > b->exponent) {
                append_term(&result, &tail, a->coefficient, a->exponent);
                a = a->next;                       /* only A advances */
            } else {
                append_term(&result, &tail, b->coefficient, b->exponent);
                b = b->next;                       /* only B advances */
            }
        } else if (a != NULL) {
            append_term(&result, &tail, a->coefficient, a->exponent);
            a = a->next;
        } else {
            append_term(&result, &tail, b->coefficient, b->exponent);
            b = b->next;
        }
    }
    return result;
}

static void print_polynomial(const char *label, const PolyNode *head) {
    const PolyNode *node;
    printf("%s = ", label);
    if (head == NULL) {
        printf("0\n");
        return;
    }
    for (node = head; node != NULL; node = node->next) {
        int coef = node->coefficient;
        int magnitude = coef < 0 ? -coef : coef;
        if (node == head) {
            if (coef < 0) printf("-");
        } else {
            printf(coef < 0 ? " - " : " + ");
        }
        if (node->exponent == 0) {
            printf("%d", magnitude);
        } else if (node->exponent == 1) {
            if (magnitude != 1) printf("%d", magnitude);
            printf("x");
        } else {
            if (magnitude != 1) printf("%d", magnitude);
            printf("x^%d", node->exponent);
        }
    }
    printf("\n");
}

int main(void) {
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
    print_polynomial("A+B", result);   /* 4x^3 + 2x^2 + 2 */

    free_poly(a);
    free_poly(b);
    free_poly(result);
    return 0;
}
