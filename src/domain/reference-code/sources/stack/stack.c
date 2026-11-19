/*
 * AlgoViz reference implementation: array stack.
 * Original code written for this repository under the MIT License.
 * A fixed-capacity stack with manual top index and overflow checks.
 */

#include <stdbool.h>
#include <stdio.h>

#define STACK_CAPACITY 8

typedef struct {
    int items[STACK_CAPACITY];
    int size;
} Stack;

void stack_init(Stack *stack) {
    stack->size = 0;
}

bool stack_push(Stack *stack, int value) {
    if (stack->size >= STACK_CAPACITY) {
        return false;
    }
    stack->items[stack->size] = value;
    ++stack->size;
    return true;
}

bool stack_pop(Stack *stack, int *out_value) {
    if (stack->size == 0) {
        return false;
    }
    --stack->size;
    *out_value = stack->items[stack->size];
    return true;
}

bool stack_peek(const Stack *stack, int *out_value) {
    if (stack->size == 0) {
        return false;
    }
    *out_value = stack->items[stack->size - 1];
    return true;
}

bool stack_is_empty(const Stack *stack) {
    return stack->size == 0;
}

int main(void) {
    Stack stack;
    stack_init(&stack);
    stack_push(&stack, 1);
    stack_push(&stack, 2);
    stack_push(&stack, 3);

    int value = 0;
    stack_peek(&stack, &value);
    printf("top: %d\n", value);

    while (stack_pop(&stack, &value)) {
        printf("pop: %d\n", value);
    }
    printf("empty: %s\n", stack_is_empty(&stack) ? "yes" : "no");
    printf("underflow: %s\n", stack_pop(&stack, &value) ? "no" : "yes");
    return 0;
}
