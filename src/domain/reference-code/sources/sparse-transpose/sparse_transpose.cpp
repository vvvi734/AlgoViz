/*
 * 中文导读：只保存非零三元组；转置时交换行/列下标，并保持按行优先的顺序。
 * 阅读顺序：先看 Triple 的 row/col/value 与矩阵维度；再看 fast_transpose 如何统计列非零数、累加起始位置并按原顺序回填。
 * 关键不变量：转置后三元组仍按行优先排列；行列维度互换但非零元素个数不变。
 * 易错点：行列下标写反；快速转置的起始位置数组算错；零元素被保存；输出顺序不是行优先。
 * 复杂度：快速转置 O(cols + nonzeros)；额外空间 O(cols) 辅助数组，加 O(nonzeros) 结果表。
 * 输入/输出：输入行数、列数与三元组；返回转置后的 SparseMatrix；main 打印结果。
*/

/*
 * Sparse matrix fast transpose — original C++17 implementation.
 *
 * Convention: 0-based matrix coordinates, triplet positions and cpot slots; input
 * triplets are row-major with unique (row, col).
 *
 * Reading guide:
 * 1. num[c] counts the non-zero entries in original column c, using one pass over
 *    the triplets.
 * 2. cpot[c] is the first result slot for column c: cpot[0] = 0 and cpot[c] =
 *    cpot[c-1] + num[c-1].
 * 3. Scan the source triplets again in row-major order; q = cpot[col] is the
 *    destination slot.
 * 4. Write (col, row, value), then increment cpot[col] so the next entry of that
 *    column follows.
 *
 * Complexity: O(t + c) time; extra space O(c) for num/cpot, plus O(t) for the result
 *   table.
 */

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

// `cpot[col]` is the next write position for that column; writing a triple increments it for the next entry.
// Purpose: Fast transpose: count nonzeros per column, prefix-sum the counts into column starts, then fill the target triplets in the original order.
// 作用：快速转置：先统计每列非零个数，再累加得到每列起始位置，最后按原顺序填入目标三元组。
SparseMatrix fast_transpose(const SparseMatrix &source)
{
    SparseMatrix result;
    // The transpose swaps dimensions before any data movement: source columns become result rows and source rows become result columns. Only coordinates change, not the number of non-zero values.
    result.rows = source.cols;
    result.cols = source.rows;
    result.triples.resize(source.triples.size());

    // With no source columns there is no column start to compute; the resized result already has the correct row count and zero triples.
    if (source.cols == 0)
    {
        return result;
    }

    std::vector<int> num(static_cast<std::size_t>(source.cols), 0);
    std::vector<int> cpot(static_cast<std::size_t>(source.cols), 0);

    // Phase 1: count non-zeros per original column.
    for (const Triple &item : source.triples)
    {
        ++num[static_cast<std::size_t>(item.col)];
    }

    // Phase 2: each column's first result slot.
    // Column 0 starts at result slot 0 because no earlier column has entries to reserve before it.
    cpot[0] = 0;
    // The loop builds a prefix sum: column c starts after the start plus the size of column c-1, so all earlier columns remain contiguous and untouched.
    for (int c = 1; c < source.cols; ++c)
    {
        cpot[static_cast<std::size_t>(c)] =
            cpot[static_cast<std::size_t>(c - 1)] + num[static_cast<std::size_t>(c - 1)];
    }

    // Phase 3: place entries directly; cpot acts as a moving write cursor.
    // The source is scanned in its stored row-major order. Within one source column, source rows increase, and after the coordinate swap those become increasing result columns, so each column's block is filled in order.
    for (const Triple &item : source.triples)
    {
        // q is the next free slot of this specific column, not a global counter; cpot is a per-column moving write cursor.
        int q = cpot[static_cast<std::size_t>(item.col)];
        result.triples[static_cast<std::size_t>(q)] = {item.col, item.row, item.value};
        // Increment only after writing. The current item owns q, and the next item from this column must use q+1 or it would overwrite the just-written triple.
        ++cpot[static_cast<std::size_t>(item.col)];
    }

    return result;
}

// Purpose: Print triplets (row, col, value) in row-major order; read-only.
// 作用：按行优先输出三元组 (row, col, value)；只读。
void print_triplets(const SparseMatrix &matrix)
{
    std::cout << "shape = " << matrix.rows << " x " << matrix.cols
              << ", nnz = " << matrix.triples.size() << '\n';
    for (const Triple &item : matrix.triples)
    {
        std::cout << '(' << item.row << ", " << item.col << ", " << item.value << ")\n";
    }
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

    const SparseMatrix result = fast_transpose(source);
    print_triplets(source);
    std::cout << "--- transposed ---\n";
    print_triplets(result);
    return 0;
}
