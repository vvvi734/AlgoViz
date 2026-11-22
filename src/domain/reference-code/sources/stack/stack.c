/*
 * 中文导读：用数组和当前栈顶下标 top 实现后进先出；push/pop/peek 只允许在栈顶发生。
 * 阅读顺序：先看 top 的约定；再看 push 的容量检查与 ++top；然后看 pop 的读取与 --top；最后看 peek 只读不弹。
 * 关键不变量：有效元素始终占据 data[0..top]，top 指向当前栈顶，top = -1 表示空栈。
 * 易错点：把 top 当成下一个空位；先移动 top 再读取；栈满仍写入；空栈仍读取；peek 修改 top。
 * 复杂度：push/pop/peek O(1)，空间 O(capacity)。
 * 输入/输出：输入 main 内置的演示操作序列；压栈/弹栈返回成功或栈顶；main 打印出栈顺序。
*/

/*
 * Array stack in C11.
 *
 * A fixed array plus the index of the current top implements last-in, first-out
 * order. top is the live top, not the next free slot: -1 means empty. Push
 * checks capacity, increments top, then writes. Pop reads, then decrements top.
 * Each operation is O(1), and the stack uses O(capacity) storage.
 */

#include <stdbool.h>
#include <stdio.h>

#define STACK_CAPACITY 8

typedef struct
{
    int data[STACK_CAPACITY];
    int top;
} Stack;

// top is the live top index; -1 means empty.

// Purpose: Initialize an empty sequential stack; the shared convention is top = -1, meaning no elements yet.
/*
 * 作用：初始化顺序栈为空。top = -1 是本题统一约定，表示还没有任何元素。
 */
void InitStack(Stack *stack)
{
    stack->top = -1;
}

// Purpose: Read-only empty check; the only condition is top == -1.
/*
 * 作用：只读判断栈是否为空。空栈的唯一条件是 top == -1。
 */
bool StackEmpty(const Stack *stack)
{
    return stack->top == -1;
}

// Purpose: Push value after checking whether top has reached capacity - 1; a full stack returns false without overwriting.
/*
 * 作用：把 value 压入栈顶。先判断 top 是否已到 capacity - 1，再 ++top 并写入
 * data[top]；栈满时不覆盖任何已有元素，直接返回 false。
 */
bool Push(Stack *stack, int value)
{
    if (stack->top >= STACK_CAPACITY - 1)
    {
        return false;
    }
    ++stack->top;
    stack->data[stack->top] = value;
    return true;
}

// Purpose: Pop: return false when empty; otherwise pass data[top] to the caller, then decrement top.
/*
 * 作用：弹出栈顶。空栈返回 false；否则先把 data[top] 交给调用者，再 --top，
 * 逻辑上删除该元素。数组里的旧值可以暂时保留，但已不属于栈。
 */
bool Pop(Stack *stack, int *value)
{
    if (StackEmpty(stack))
    {
        return false;
    }
    *value = stack->data[stack->top];
    --stack->top;
    return true;
}

// Purpose: Read the stack top without removing it; access data[top] without changing top or the element count.
/*
 * 作用：读取栈顶但不删除。只访问 data[top]，不改变 top，也不减少元素个数。
 */
bool Peek(const Stack *stack, int *value)
{
    if (StackEmpty(stack))
    {
        return false;
    }
    *value = stack->data[stack->top];
    return true;
}

// Purpose: Demonstrate stack creation, push, peek, pop and empty checks, printing the observable result of each step.
/*
 * 作用：演示建栈、压栈、读栈顶、弹栈与空栈检测，并打印每一步的可观察结果。
 */
int main(void)
{
    Stack stack;
    InitStack(&stack);

    for (int value = 1; value <= 3; ++value)
    {
        if (!Push(&stack, value))
        {
            printf("push %d failed: full\n", value);
        }
    }

    int top = 0;
    if (Peek(&stack, &top))
    {
        printf("top: %d\n", top);
    }

    int value = 0;
    while (Pop(&stack, &value))
    {
        printf("pop: %d\n", value);
    }

    printf("empty: %s\n", StackEmpty(&stack) ? "yes" : "no");
    printf("underflow: %s\n", Pop(&stack, &value) ? "no" : "yes");
    return 0;
}
