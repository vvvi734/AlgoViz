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

struct Triple {
    int row;
    int col;
    int value;
};

struct SparseMatrix {
    int rows = 0;
    int cols = 0;
    std::vector<Triple> triples;
};

SparseMatrix fast_transpose(const SparseMatrix &source)
{
    SparseMatrix result;
    result.rows = source.cols;
    result.cols = source.rows;
    result.triples.resize(source.triples.size());

    if (source.cols == 0) {
        return result;
    }

    std::vector<int> num(static_cast<std::size_t>(source.cols), 0);
    std::vector<int> cpot(static_cast<std::size_t>(source.cols), 0);

    // Phase 1: count non-zeros per original column.
    for (const Triple &item : source.triples) {
        ++num[static_cast<std::size_t>(item.col)];
    }

    // Phase 2: each column's first result slot.
    cpot[0] = 0;
    for (int c = 1; c < source.cols; ++c) {
        cpot[static_cast<std::size_t>(c)] =
            cpot[static_cast<std::size_t>(c - 1)] + num[static_cast<std::size_t>(c - 1)];
    }

    // Phase 3: place entries directly; cpot acts as a moving write cursor.
    for (const Triple &item : source.triples) {
        int q = cpot[static_cast<std::size_t>(item.col)];
        result.triples[static_cast<std::size_t>(q)] = {item.col, item.row, item.value};
        ++cpot[static_cast<std::size_t>(item.col)];
    }

    return result;
}

void print_triplets(const SparseMatrix &matrix)
{
    std::cout << "shape = " << matrix.rows << " x " << matrix.cols
              << ", nnz = " << matrix.triples.size() << '\n';
    for (const Triple &item : matrix.triples) {
        std::cout << '(' << item.row << ", " << item.col << ", " << item.value << ")\n";
    }
}

int main()
{
    SparseMatrix source{4, 5, {
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
