/*
 * 中文导读：只保存非零三元组；转置时交换行/列下标，并保持按行优先的顺序。
 * 中文导读：本文件用“交换 row/col 后按 (row,col) 排序”的便捷转置，不是课程中的 num/cpot 快速转置。
 * 阅读顺序：先看逐项交换行列；再看排序恢复行优先；最后比较 O(t log t) 与 O(t+c)。
 * 关键不变量：转置后仍为行优先；非零元素个数不变。
 * 易错点：忘记排序导致顺序错误；把排序版复杂度说成 O(t+c)；行列下标写反。
 * 复杂度：O(t log t) 时间，O(t) 额外空间。
 * 输入/输出：输入行数、列数与三元组；返回交换并排序后的 SparseMatrix；main 打印结果。
*/

/*
 * Sparse transpose — C++17 convenience example.
 *
 * This is the common "swap then sort" approach: it produces the same
 * row-major transposed triplet list, but costs O(t log t), not O(t + c).
 * It does not use num/cpot and is not the fast transpose taught in the course.
 *
 * Reading guide:
 * 1. This convenience file swaps row/col in every triplet, then sorts by (row, col).
 * 2. Sorting restores row-major order, producing the same transpose table as the
 *    fast algorithm.
 * 3. It does not compute num/cpot and runs in O(t log t), not O(t + c).
 *
 * Complexity: O(t log t) time; extra space O(t) for the copied result.
 * Convention: 0-based coordinates; input must still be a valid sparse triplet table.
 */

#include <algorithm>
#include <iostream>
#include <vector>

struct Triple
{
    int row;
    int col;
    int value;
};

struct SparseMatrix
{
    int rows = 0;
    int cols = 0;
    std::vector<Triple> triples;
};

// Purpose: Sort triplets into transposed row-major order to produce the transposed matrix.
// 作用：按转置后的行优先顺序排序三元组，得到转置矩阵。
SparseMatrix sort_transpose(const SparseMatrix &source)
{
    SparseMatrix result{source.cols, source.rows, {}};
    result.triples.reserve(source.triples.size());
    for (const Triple &item : source.triples)
    {
        result.triples.push_back({item.col, item.row, item.value});
    }
    // Swap row/col first, then sort by (row, col); this is O(t log t), not the course O(t+c) fast transpose.
    std::sort(result.triples.begin(), result.triples.end(),
              [](const Triple &a, const Triple &b)
              {
                  if (a.row != b.row)
                      return a.row < b.row;
                  return a.col < b.col;
              });
    return result;
}

int main()
{
    SparseMatrix source{4,
                        5,
                        {
                            {0, 0, 3},
                            {0, 2, 7},
                            {1, 2, 5},
                            {2, 1, 4},
                            {3, 0, 6},
                            {3, 2, 8},
                        }};
    const SparseMatrix result = sort_transpose(source);
    for (const Triple &item : result.triples)
    {
        std::cout << '(' << item.row << ", " << item.col << ", " << item.value << ")\n";
    }
    return 0;
}
