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

void InitStack(Stack *stack)
{
    stack->top = -1;
}

bool StackEmpty(const Stack *stack)
{
    return stack->top == -1;
}

/*
 * data[top]；栈满时不覆盖任何已有元素，直接返回 false。
 */
// The full check uses top, not a count: top == capacity-1 means the next increment would write past the array.
bool Push(Stack *stack, int value)
{
    // Return before changing top; rejecting a full push must leave every existing element untouched.
    if (stack->top >= STACK_CAPACITY - 1)
    {
        return false;
    }
    // Increment before the write: data[top] must name the new live element, while the old top remains valid until then.
    ++stack->top;
    stack->data[stack->top] = value;
    return true;
}

/*
 * 逻辑上删除该元素。数组里的旧值可以暂时保留，但已不属于栈。
 */
// Pop copies the top out and only then decrements; the returned value must survive the state change.
bool Pop(Stack *stack, int *value)
{
    if (StackEmpty(stack))
    {
        return false;
    }
    *value = stack->data[stack->top];
    // The decrement is the removal: the old slot stays in the array but is outside [0, top].
    --stack->top;
    return true;
}

// Peek shares the read but omits the decrement, so it is observationally read-only even though it touches data[top].
bool Peek(const Stack *stack, int *value)
{
    if (StackEmpty(stack))
    {
        return false;
    }
    *value = stack->data[stack->top];
    return true;
}

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
