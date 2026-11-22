/*
 * 中文导读：用 std::string 运算符栈把中缀表达式转换成后缀表达式。
 * 阅读顺序：precedence 定优先级；to_postfix 主循环按 token 分类；看到 ) 或新运算符时决定弹栈。
 * 关键不变量：操作数直接进入 output；运算符栈内优先级不下降；左括号是弹栈边界。
 * 易错点：逐字符处理多位数；同级运算符用 > 而不是 >=；右括号只弹一个；扫描结束忘记清空。
 * 复杂度：时间 O(n)，空间 O(n)。
 * 输入/输出：输入中缀表达式 token；返回空格分隔的后缀表达式；main 打印转换结果。
*/

/*
 * Infix to postfix in C++17.
 *
 * Operands are appended as whole tokens. An incoming operator pops every top
 * with greater-or-equal precedence (left associativity), then pushes itself.
 * A right parenthesis pops back to its matching left parenthesis, which is
 * discarded. The remaining stack is flushed after the scan.
 */

#include <cctype>
#include <iostream>
#include <optional>
#include <string>
#include <vector>

// Purpose: Return precedence: + and - are 1, * and / are 2, everything else is 0.
/*
 * 作用：返回 +、- 为 1，*、/ 为 2，其他为 0。
 */
int precedence(char op)
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

// Purpose: Append a whole token to the output and insert one separating space.
/*
 * 作用：把 whole token 追加到输出，自动补一个空格。
 */
void append_token(std::string &output, const std::string &token)
{
    if (!output.empty())
    {
        output.push_back(' ');
    }
    output += token;
}

// Purpose: Main conversion routine; return std::nullopt for mismatched parentheses or an invalid character.
/*
 * 作用：转换主函数。返回 std::nullopt 表示括号不匹配或出现非法字符。
 */
std::optional<std::string> to_postfix(const std::string &expression)
{
    std::string output;
    std::vector<char> operators;
    std::size_t index = 0;

    while (index < expression.size())
    {
        const char current = expression[index];
        if (std::isspace(static_cast<unsigned char>(current)))
        {
            ++index;
            continue;
        }

        if (std::isdigit(static_cast<unsigned char>(current)))
        {
            std::string number;
            while (index < expression.size() &&
                   std::isdigit(static_cast<unsigned char>(expression[index])))
            {
                number.push_back(expression[index++]);
            }
            append_token(output, number);
            continue;
        }

        // a left parenthesis blocks every pop until it is explicitly removed.
        if (current == '(')
        {
            operators.push_back(current);
            ++index;
            continue;
        }

        if (current == ')')
        {
            while (!operators.empty() && operators.back() != '(')
            {
                append_token(output, std::string(1, operators.back()));
                operators.pop_back();
            }
            if (operators.empty())
            {
                return std::nullopt;
            }
            operators.pop_back();
            ++index;
            continue;
        }

        if (current == '+' || current == '-' || current == '*' || current == '/')
        {
            // 同级左结合：>= 保证 8 - 3 - 2 先把第一个 - 输出。
            // Purpose: >= preserves left associativity, so 8 - 3 - 2 emits the first minus first.
            while (!operators.empty() && operators.back() != '(' &&
                   precedence(operators.back()) >= precedence(current))
            {
                append_token(output, std::string(1, operators.back()));
                operators.pop_back();
            }
            operators.push_back(current);
            ++index;
            continue;
        }

        return std::nullopt;
    }

    while (!operators.empty())
    {
        if (operators.back() == '(')
        {
            return std::nullopt;
        }
        append_token(output, std::string(1, operators.back()));
        operators.pop_back();
    }
    return output;
}

// Purpose: Demonstrate conversion with the official example (3 + 4) * 2, expecting 3 4 + 2 *.
/*
 * 作用：用官方示例 (3 + 4) * 2 演示转换，期望输出 3 4 + 2 *。
 */
int main()
{
    const std::string expression = "(3 + 4) * 2";
    const auto postfix = to_postfix(expression);
    if (!postfix)
    {
        std::cout << "conversion failed\n";
        return 1;
    }
    std::cout << "infix:   " << expression << '\n';
    std::cout << "postfix: " << *postfix << '\n';
    return 0;
}
