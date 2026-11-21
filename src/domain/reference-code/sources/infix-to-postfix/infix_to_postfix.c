/*
 * 中文导读：用运算符栈把中缀表达式转换成后缀表达式。
 * 阅读顺序：precedence 定义优先级；InfixToPostfix 扫描 token；遇到右括号或新运算符时决定弹栈。
 * 关键不变量：操作数直接输出；栈中运算符的优先级从栈底到栈顶不下降；左括号挡住弹栈。
 * 易错点：把多位整数拆成单个数字；右括号只弹一个运算符；扫描结束忘记清空栈；把左括号输出到结果。
 * 复杂度：时间 O(n)，运算符栈与输出均为 O(n)。
 * 输入/输出：输入中缀表达式 token；返回空格分隔的后缀表达式；main 打印转换结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * Infix to postfix in C11.
 *
 * The operator stack delays operators whose output order is not decided yet.
 * Operands are copied as whole tokens. An incoming operator pops every top with
 * greater-or-equal precedence because all four operators are left-associative.
 * A right parenthesis pops back to its matching left parenthesis, which is
 * discarded. One pass, O(n) time and O(n) space.
 */

#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#define MAX_EXPR 128

// Purpose: Return operator precedence: + and - are 1, * and / are 2, other characters are 0.
/*
 * 作用：返回运算符优先级。+、- 为 1，*、/ 为 2；其他字符返回 0。
 */
static int Precedence(char op)
{
    if (op == '+' || op == '-')
    {
        return 1;
    }
    if (op == '*' || op == '/')
    {
        return 2;
    }
    return 0;
}

// Purpose: Append a whole token to the output with one separating space; return false when capacity is insufficient.
/*
 * 作用：把一个完整 token 追加到输出，token 之间补一个空格；容量不足时返回 false。
 */
static bool AppendToken(char *out, size_t capacity, const char *token)
{
    const size_t used = strlen(out);
    const size_t need = strlen(token) + (used == 0 ? 0 : 1);
    if (used + need + 1 > capacity)
    {
        return false;
    }
    if (used > 0)
    {
        out[used] = ' ';
        out[used + 1] = '\0';
    }
    strncat(out, token, capacity - strlen(out) - 1);
    return true;
}

// Purpose: Main conversion routine; return false for mismatched parentheses, an invalid character or an undersized output buffer.
/*
 * 作用：转换主函数。返回 false 表示括号不匹配、非法字符或输出缓冲区不足。
 *
 * 关键顺序：遇到操作数立即输出；遇到运算符先弹出所有“优先级不低于自己”的
 * 栈顶，再把自己压入；遇到右括号弹到左括号；扫描结束清空剩余运算符。
 */
bool InfixToPostfix(const char *expression, char *out, size_t capacity)
{
    if (capacity == 0)
    {
        return false;
    }
    out[0] = '\0';

    char operators[MAX_EXPR];
    int top = -1;
    const char *cursor = expression;

    while (*cursor != '\0')
    {
        if (*cursor == ' ' || *cursor == '\t')
        {
            ++cursor;
            continue;
        }

        if (*cursor >= '0' && *cursor <= '9')
        {
            char number[32];
            size_t length = 0;
            while (*cursor >= '0' && *cursor <= '9' && length + 1 < sizeof(number))
            {
                number[length++] = *cursor++;
            }
            number[length] = '\0';
            if (!AppendToken(out, capacity, number))
            {
                return false;
            }
            continue;
        }

        const char token = *cursor++;
        // a left parenthesis blocks every pop until it is explicitly removed.
        if (token == '(')
        {
            if (top + 1 >= MAX_EXPR)
            {
                return false;
            }
            operators[++top] = token;
        }
        else if (token == ')')
        {
            while (top >= 0 && operators[top] != '(')
            {
                char popped[2] = {operators[top--], '\0'};
                if (!AppendToken(out, capacity, popped))
                {
                    return false;
                }
            }
            if (top < 0)
            {
                return false;
            }
            --top;
        }
        else if (token == '+' || token == '-' || token == '*' || token == '/')
        {
            // 同级运算符左结合：>= 而不是 >，否则 8 - 3 - 2 会算错。
            // Purpose: Use >= for left associativity; > would make 8 - 3 - 2 wrong.
            while (top >= 0 && operators[top] != '(' && Precedence(operators[top]) >= Precedence(token))
            {
                char popped[2] = {operators[top--], '\0'};
                if (!AppendToken(out, capacity, popped))
                {
                    return false;
                }
            }
            if (top + 1 >= MAX_EXPR)
            {
                return false;
            }
            operators[++top] = token;
        }
        else
        {
            return false;
        }
    }

    while (top >= 0)
    {
        if (operators[top] == '(')
        {
            return false;
        }
        char popped[2] = {operators[top--], '\0'};
        if (!AppendToken(out, capacity, popped))
        {
            return false;
        }
    }
    return true;
}

// Purpose: Demonstrate conversion with the official example (3 + 4) * 2, expecting 3 4 + 2 *.
/*
 * 作用：用官方示例 (3 + 4) * 2 演示转换，期望输出 3 4 + 2 *。
 */
int main(void)
{
    char postfix[MAX_EXPR];
    const char *expression = "(3 + 4) * 2";
    if (!InfixToPostfix(expression, postfix, sizeof(postfix)))
    {
        printf("conversion failed\n");
        return 1;
    }
    printf("infix:   %s\n", expression);
    printf("postfix: %s\n", postfix);
    return 0;
}
