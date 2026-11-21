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
 * Sparse matrix fast transpose — original C implementation.
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

#include <stdio.h>
#include <stdlib.h>

typedef struct
{
    int row;
    int col;
    int value;
} Triple;

typedef struct
{
    int rows;
    int cols;
    int count;
    Triple *data;
} TripletList;

// Purpose: Print triplets (row, col, value) in row-major order; read-only.
// 作用：按行优先输出三元组 (row, col, value)；只读。
static void print_triplets(const TripletList *matrix)
{
    int k;
    printf("shape = %d x %d, nnz = %d\n", matrix->rows, matrix->cols, matrix->count);
    for (k = 0; k < matrix->count; ++k)
    {
        printf("(%d, %d, %d)\n", matrix->data[k].row, matrix->data[k].col, matrix->data[k].value);
    }
}

/*
 * Transposes src into dst. Returns 1 on success, 0 on allocation failure or
 * invalid dimensions. dst must not alias src.
 */
// `cpot[col]` is the next write position for that column; writing a triple increments it for the next entry.
// Purpose: Fast transpose: count nonzeros per column, prefix-sum the counts into column starts, then fill the target triplets in the original order.
// 作用：快速转置：先统计每列非零个数，再累加得到每列起始位置，最后按原顺序填入目标三元组。
static int fast_transpose(const TripletList *src, TripletList *dst)
{
    int *num = NULL;
    int *cpot = NULL;
    int c;
    int k;

    if (src->rows < 0 || src->cols < 0 || src->count < 0)
    {
        return 0;
    }
    if (src->count > 0 && (src->data == NULL || src->cols == 0))
    {
        return 0;
    }

    dst->rows = src->cols;
    dst->cols = src->rows;
    dst->count = src->count;
    dst->data = NULL;
    if (src->count > 0)
    {
        dst->data = (Triple *)malloc((size_t)src->count * sizeof(Triple));
        if (dst->data == NULL)
        {
            return 0;
        }
    }

    if (src->cols == 0)
    {
        return 1;
    }

    num = (int *)calloc((size_t)src->cols, sizeof(int));
    cpot = (int *)calloc((size_t)src->cols, sizeof(int));
    if (num == NULL || cpot == NULL)
    {
        free(num);
        free(cpot);
        free(dst->data);
        dst->data = NULL;
        return 0;
    }

    /* Phase 1: num[c] counts non-zeros in original column c. */
    for (k = 0; k < src->count; ++k)
    {
        ++num[src->data[k].col];
    }

    /* Phase 2: cpot[c] is the first result slot of column c. */
    cpot[0] = 0;
    for (c = 1; c < src->cols; ++c)
    {
        cpot[c] = cpot[c - 1] + num[c - 1];
    }

    /* Phase 3: place each source triplet directly into its final slot. */
    for (k = 0; k < src->count; ++k)
    {
        int q = cpot[src->data[k].col];
        dst->data[q].row = src->data[k].col;
        dst->data[q].col = src->data[k].row;
        dst->data[q].value = src->data[k].value;
        ++cpot[src->data[k].col];
    }

    free(num);
    free(cpot);
    return 1;
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    Triple source_data[] = {
        {0, 0, 3}, {0, 2, 7}, {1, 2, 5}, {2, 1, 4}, {3, 0, 6}, {3, 2, 8},
    };
    TripletList source = {4, 5, 6, source_data};
    TripletList result = {0, 0, 0, NULL};

    if (!fast_transpose(&source, &result))
    {
        fprintf(stderr, "transpose failed\n");
        return 1;
    }

    print_triplets(&source);
    printf("--- transposed ---\n");
    print_triplets(&result);

    free(result.data);
    return 0;
}
