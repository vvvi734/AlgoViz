/*
 * 中文导读：用操作数栈从左到右计算后缀表达式。
 * 阅读顺序：先看 main 的 token 扫描；再看 EvalPostfix 的入栈/弹栈；重点看 right 先弹、left 后弹。
 * 关键不变量：栈中保存已算好的整数；运算符弹出两个值、算完压回一个值；结束时栈中恰好一个值。
 * 易错点：先弹左后弹右；多位数拆成字符；除数为零不报错；结束时栈中还有多个值。
 * 复杂度：时间 O(n)，空间 O(n)。
 * 输入/输出：输入空格分隔的后缀表达式 token；返回整数结果；main 打印求值结果。
*/

/*
 * Postfix evaluation in C11.
 *
 * Numbers are pushed as whole tokens. For an operator, the first pop is the
 * RIGHT operand and the second pop is the LEFT operand, so subtraction and
 * division use left op right. Division is integer division truncating toward
 * zero, matching C and the course trace. Exactly one value must remain.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_TOKENS 64

// Check that token consists only of decimal digits; an empty string returns false.
/*
 * 判断 token 是否只由十进制数字组成；空串返回 false。
 */
static bool IsNumber(const char *token)
{
    if (*token == '\0')
    {
        return false;
    }
    for (const char *cursor = token; *cursor != '\0'; ++cursor)
    {
        if (*cursor < '0' || *cursor > '9')
        {
            return false;
        }
    }
    return true;
}

// Evaluate postfix; return false for insufficient/extra operands, an invalid token or division by zero.
/*
 * 后缀求值主函数。返回 false 表示操作数不足/过多、非法 token 或除零。
 * value 只在成功时写入最终结果。
 */
bool EvalPostfix(char *expression, int *value, char *error, size_t error_capacity)
{
    // The stack holds values already computed from the processed prefix. A binary operator consumes two values and returns one, so its height never exceeds the token count.
    int stack[MAX_TOKENS];
    int top = -1;
    char *token = strtok(expression, " \t");
    while (token != NULL)
    {
        // Only an all-digit token is a number. A leading minus is not accepted here, so negative literals must be produced by subtraction rather than written directly.
        if (IsNumber(token))
        {
            if (top + 1 >= MAX_TOKENS)
            {
                snprintf(error, error_capacity, "operand stack overflow");
                return false;
            }
            // The token has already passed the digit check; atoi converts the same text to an integer and pushes it as one complete operand.
            stack[++top] = atoi(token);
            token = strtok(NULL, " \t");
            continue;
        }

        if (token[0] == '+' || token[0] == '-' || token[0] == '*' || token[0] == '/')
        {
            // top is an index, so top < 1 means fewer than two operands. Check before popping; otherwise the second read would use a negative index.
            if (top < 1)
            {
                snprintf(error, error_capacity, "operand shortage");
                return false;
            }
            // the first pop is the right operand; compute left op right.
            const int right = stack[top--];
            const int left = stack[top--];
            // Check the divisor before dividing. Returning false with an error message leaves the caller's output value untouched.
            if (token[0] == '/' && right == 0)
            {
                snprintf(error, error_capacity, "division by zero");
                return false;
            }
            int result = 0;
            if (token[0] == '+')
            {
                result = left + right;
            }
            else if (token[0] == '-')
            {
                result = left - right;
            }
            else if (token[0] == '*')
            {
                result = left * right;
            }
            else
            {
                // C integer division truncates toward zero; consistent with the
                // Python trace's int(left / right).
                result = left / right;
            }
            // The two popped operands are replaced by one result. Each binary operator therefore reduces stack height by exactly one.
            stack[++top] = result;
        }
        else
        {
            snprintf(error, error_capacity, "invalid token: %s", token);
            return false;
        }
        token = strtok(NULL, " \t");
    }

    // A valid postfix expression leaves exactly one value. top < 0 means missing operands; top > 0 means extra operands were never consumed.
    if (top != 0)
    {
        snprintf(error, error_capacity, top < 0 ? "operand shortage" : "operand surplus");
        return false;
    }
    *value = stack[top];
    return true;
}

// Evaluate the official example 3 4 + 2 *, expecting 14.
/*
 * 用官方示例 3 4 + 2 * 演示求值，期望结果 14。
 */
int main(void)
{
    char expression[] = "3 4 + 2 *";
    char error[128] = "";
    int value = 0;
    if (!EvalPostfix(expression, &value, error, sizeof(error)))
    {
        printf("evaluation failed: %s\n", error);
        return 1;
    }
    printf("postfix: 3 4 + 2 *\n");
    printf("result:  %d\n", value);
    return 0;
}
