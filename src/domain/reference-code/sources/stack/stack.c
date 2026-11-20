/*
 * Array stack in C11.
 *
 * A fixed array plus a size counter implements last-in, first-out order. Push
 * checks capacity before writing; pop checks emptiness before reading. Each
 * operation is O(1), and the stack uses O(capacity) storage.
 */

#include <stdbool.h>
#include <stdio.h>

#define STACK_CAPACITY 8

typedef struct {
    int items[STACK_CAPACITY];
    int size;
} Stack;

void InitStack(Stack *stack)
{
    stack->size = 0;
}

bool StackEmpty(const Stack *stack)
{
    return stack->size == 0;
}

bool Push(Stack *stack, int value)
{
    if (stack->size == STACK_CAPACITY) {
        return false;
    }
    stack->items[stack->size] = value;
    ++stack->size;
    return true;
}

bool Pop(Stack *stack, int *value)
{
    if (stack->size == 0) {
        return false;
    }
    --stack->size;
    *value = stack->items[stack->size];
    return true;
}

bool Peek(const Stack *stack, int *value)
{
    if (stack->size == 0) {
        return false;
    }
    *value = stack->items[stack->size - 1];
    return true;
}

int main(void)
{
    Stack stack;
    InitStack(&stack);
    for (int value = 1; value <= 3; ++value) {
        Push(&stack, value);
    }

    int top = 0;
    if (Peek(&stack, &top)) {
        printf("top: %d\n", top);
    }

    int value = 0;
    while (Pop(&stack, &value)) {
        printf("pop: %d\n", value);
    }
    printf("empty: %s\n", StackEmpty(&stack) ? "yes" : "no");
    printf("underflow: %s\n", Pop(&stack, &value) ? "no" : "yes");
    return 0;
}
