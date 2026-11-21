/*
 * 中文导读：只保存非零三元组；转置时交换行/列下标，并保持按行优先的顺序。
 * 阅读顺序：先看 Triple 的 row/col/value 和 rows/cols/nonzero；再看普通转置如何扫描列；最后看快速转置的列计数与起始位置。
 * 关键不变量：转置后三元组仍按行优先排列；行列维度互换但非零元素个数不变。
 * 易错点：行列下标写反；快速转置的起始位置数组算错；零元素被保存；输出顺序不是行优先。
 * 复杂度：普通转置 O(cols × nonzeros)，快速转置 O(cols + nonzeros)，空间 O(nonzeros)。
 * 输入/输出：输入行数、列数与三元组；返回转置后的三元组；main 打印结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
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

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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
