/*
 * Sparse transpose — C++17 convenience example, MIT.
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

SparseMatrix sort_transpose(const SparseMatrix &source)
{
    SparseMatrix result{source.cols, source.rows, {}};
    result.triples.reserve(source.triples.size());
    for (const Triple &item : source.triples) {
        result.triples.push_back({item.col, item.row, item.value});
    }
    std::sort(result.triples.begin(), result.triples.end(),
              [](const Triple &a, const Triple &b) {
                  if (a.row != b.row) return a.row < b.row;
                  return a.col < b.col;
              });
    return result;
}

int main()
{
    SparseMatrix source{4, 5, {
        {0, 0, 3}, {0, 2, 7}, {1, 2, 5},
        {2, 1, 4}, {3, 0, 6}, {3, 2, 8},
    }};
    const SparseMatrix result = sort_transpose(source);
    for (const Triple &item : result.triples) {
        std::cout << '(' << item.row << ", " << item.col << ", " << item.value << ")\n";
    }
    return 0;
}
