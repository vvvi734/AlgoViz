/*
 * 中文导读：用操作数栈从左到右计算后缀表达式。
 * 阅读顺序：先看 main 的 token 扫描；再看 EvalPostfix 的入栈/弹栈；重点看 right 先弹、left 后弹。
 * 关键不变量：栈中保存已算好的整数；运算符弹出两个值、算完压回一个值；结束时栈中恰好一个值。
 * 易错点：先弹左后弹右；多位数拆成字符；除数为零不报错；结束时栈中还有多个值。
 * 复杂度：时间 O(n)，空间 O(n)。
 * 输入/输出：输入空格分隔的后缀表达式 token；返回整数结果；main 打印求值结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
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

// Purpose: Check that token consists only of decimal digits; an empty string returns false.
/*
 * 作用：判断 token 是否只由十进制数字组成；空串返回 false。
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

// Purpose: Evaluate postfix; return false for insufficient/extra operands, an invalid token or division by zero.
/*
 * 作用：后缀求值主函数。返回 false 表示操作数不足/过多、非法 token 或除零。
 * value 只在成功时写入最终结果。
 */
bool EvalPostfix(char *expression, int *value, char *error, size_t error_capacity)
{
    int stack[MAX_TOKENS];
    int top = -1;
    char *token = strtok(expression, " \t");
    while (token != NULL)
    {
        if (IsNumber(token))
        {
            if (top + 1 >= MAX_TOKENS)
            {
                snprintf(error, error_capacity, "operand stack overflow");
                return false;
            }
            stack[++top] = atoi(token);
            token = strtok(NULL, " \t");
            continue;
        }

        if (token[0] == '+' || token[0] == '-' || token[0] == '*' || token[0] == '/')
        {
            if (top < 1)
            {
                snprintf(error, error_capacity, "operand shortage");
                return false;
            }
            // the first pop is the right operand; compute left op right.
            const int right = stack[top--];
            const int left = stack[top--];
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
            stack[++top] = result;
        }
        else
        {
            snprintf(error, error_capacity, "invalid token: %s", token);
            return false;
        }
        token = strtok(NULL, " \t");
    }

    if (top != 0)
    {
        snprintf(error, error_capacity, top < 0 ? "operand shortage" : "operand surplus");
        return false;
    }
    *value = stack[top];
    return true;
}

// Purpose: Evaluate the official example 3 4 + 2 *, expecting 14.
/*
 * 作用：用官方示例 3 4 + 2 * 演示求值，期望结果 14。
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
