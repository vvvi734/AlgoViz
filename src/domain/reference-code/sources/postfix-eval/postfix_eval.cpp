/*
 * 中文导读：用 std::vector 作操作数栈，从左到右计算后缀表达式。
 * 阅读顺序：先看 token 分类；再看运算符分支的 right 先弹、left 后弹；最后看结束时栈大小检查。
 * 关键不变量：栈中保存已算好的整数；一个运算符净减少一个栈元素；结束时恰好一个值。
 * 易错点：左右操作数顺序颠倒；多位数按字符拆分；除零未判断；结束后仍有多余操作数。
 * 复杂度：时间 O(n)，空间 O(n)。
 */

/*
 * Postfix evaluation in C++17.
 *
 * Numbers stay whole tokens. For an operator, pop right first, then left, and
 * compute left op right. Division is integer division truncating toward zero.
 * Success requires exactly one value at the end.
 */

#include <cctype>
#include <iostream>
#include <optional>
#include <sstream>
#include <string>
#include <variant>
#include <vector>

struct EvalError
{
    std::string message;
};

/*
 * 作用：判断 token 是否只含数字，防止 "12a" 被当作数字压栈。
 */
bool is_number(const std::string &token)
{
    if (token.empty())
    {
        return false;
    }
    for (const char ch : token)
    {
        if (!std::isdigit(static_cast<unsigned char>(ch)))
        {
            return false;
        }
    }
    return true;
}

/*
 * 作用：后缀求值。成功返回值；失败返回 EvalError 说明操作数不足/过多、非法 token 或除零。
 */
std::variant<int, EvalError> evaluate(const std::string &expression)
{
    std::istringstream input(expression);
    std::vector<int> stack;
    std::string token;

    while (input >> token)
    {
        if (is_number(token))
        {
            stack.push_back(std::stoi(token));
            continue;
        }

        if (token.size() == 1 &&
            (token[0] == '+' || token[0] == '-' || token[0] == '*' || token[0] == '/'))
        {
            if (stack.size() < 2)
            {
                return EvalError{"operand shortage"};
            }
            // the first pop is the right operand; compute left op right.
            const int right = stack.back();
            stack.pop_back();
            const int left = stack.back();
            stack.pop_back();
            if (token[0] == '/' && right == 0)
            {
                return EvalError{"division by zero"};
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
                // C++ integer division truncates toward zero, matching the trace.
                result = left / right;
            }
            stack.push_back(result);
            continue;
        }

        return EvalError{"invalid token: " + token};
    }

    if (stack.empty())
    {
        return EvalError{"operand shortage"};
    }
    if (stack.size() > 1)
    {
        return EvalError{"operand surplus"};
    }
    return stack.back();
}

/*
 * 作用：用官方示例 3 4 + 2 * 演示求值，期望结果 14；出错时打印原因并返回非零。
 */
int main()
{
    const std::string expression = "3 4 + 2 *";
    const auto result = evaluate(expression);
    if (std::holds_alternative<EvalError>(result))
    {
        std::cout << "evaluation failed: " << std::get<EvalError>(result).message << '\n';
        return 1;
    }
    std::cout << "postfix: " << expression << '\n';
    std::cout << "result:  " << std::get<int>(result) << '\n';
    return 0;
}
