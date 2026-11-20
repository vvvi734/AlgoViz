/*
 * Sparse matrix fast transpose — original C implementation, MIT.
 *
 * Convention: all matrix coordinates, triplet positions and cpot slots are
 * 0-based. The input triplet list is row-major with unique (row, col).
 *
 * Time O(t + c), extra working space O(c). The result list itself is O(t).
 */
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int row;
    int col;
    int value;
} Triple;

typedef struct {
    int rows;
    int cols;
    int count;
    Triple *data;
} TripletList;

static void print_triplets(const TripletList *matrix)
{
    int k;
    printf("shape = %d x %d, nnz = %d\n", matrix->rows, matrix->cols, matrix->count);
    for (k = 0; k < matrix->count; ++k) {
        printf("(%d, %d, %d)\n",
               matrix->data[k].row, matrix->data[k].col, matrix->data[k].value);
    }
}

/*
 * Transposes src into dst. Returns 1 on success, 0 on allocation failure or
 * invalid dimensions. dst must not alias src.
 */
static int fast_transpose(const TripletList *src, TripletList *dst)
{
    int *num = NULL;
    int *cpot = NULL;
    int c;
    int k;

    if (src->rows < 0 || src->cols < 0 || src->count < 0) {
        return 0;
    }
    if (src->count > 0 && (src->data == NULL || src->cols == 0)) {
        return 0;
    }

    dst->rows = src->cols;
    dst->cols = src->rows;
    dst->count = src->count;
    dst->data = NULL;
    if (src->count > 0) {
        dst->data = (Triple *)malloc((size_t)src->count * sizeof(Triple));
        if (dst->data == NULL) {
            return 0;
        }
    }

    if (src->cols == 0) {
        return 1;
    }

    num = (int *)calloc((size_t)src->cols, sizeof(int));
    cpot = (int *)calloc((size_t)src->cols, sizeof(int));
    if (num == NULL || cpot == NULL) {
        free(num);
        free(cpot);
        free(dst->data);
        dst->data = NULL;
        return 0;
    }

    /* Phase 1: num[c] counts non-zeros in original column c. */
    for (k = 0; k < src->count; ++k) {
        ++num[src->data[k].col];
    }

    /* Phase 2: cpot[c] is the first result slot of column c. */
    cpot[0] = 0;
    for (c = 1; c < src->cols; ++c) {
        cpot[c] = cpot[c - 1] + num[c - 1];
    }

    /* Phase 3: place each source triplet directly into its final slot. */
    for (k = 0; k < src->count; ++k) {
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

int main(void)
{
    Triple source_data[] = {
        {0, 0, 3},
        {0, 2, 7},
        {1, 2, 5},
        {2, 1, 4},
        {3, 0, 6},
        {3, 2, 8},
    };
    TripletList source = {4, 5, 6, source_data};
    TripletList result = {0, 0, 0, NULL};

    if (!fast_transpose(&source, &result)) {
        fprintf(stderr, "transpose failed\n");
        return 1;
    }

    print_triplets(&source);
    printf("--- transposed ---\n");
    print_triplets(&result);

    free(result.data);
    return 0;
}
