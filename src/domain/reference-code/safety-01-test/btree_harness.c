/*
 * Test-only harness for btree.c.
 * It injects calloc failures at a chosen allocation of one insertion and validates
 * the B-tree invariants before and after the attempt.
 */
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_TRACKED 64
static void *tracked[MAX_TRACKED];
static int tracked_count;
static int allocation_calls;
static int fail_at;

void *test_calloc(size_t count, size_t size)
{
    allocation_calls += 1;
    if (fail_at > 0 && allocation_calls == fail_at)
    {
        return NULL;
    }
    void *ptr = malloc(count * size);
    if (ptr != NULL)
    {
        memset(ptr, 0, count * size);
        if (tracked_count < MAX_TRACKED)
        {
            tracked[tracked_count++] = ptr;
        }
    }
    return ptr;
}

void test_free(void *ptr)
{
    if (ptr == NULL)
    {
        return;
    }
    for (int index = 0; index < tracked_count; ++index)
    {
        if (tracked[index] == ptr)
        {
            tracked[index] = tracked[tracked_count - 1];
            tracked_count -= 1;
            break;
        }
    }
    free(ptr);
}

#define calloc test_calloc
#define free test_free
#define main btree_app_main
#include "../sources/btree/btree.c"
#undef main
#undef free
#undef calloc

static int subtree_min(const BTreeNode *node)
{
    while (node->children[0] != NULL)
    {
        node = node->children[0];
    }
    return node->keys[0];
}

static int subtree_max(const BTreeNode *node)
{
    while (node->children[0] != NULL)
    {
        node = node->children[node->key_count];
    }
    return node->keys[node->key_count - 1];
}

static int validate_node(const BTreeNode *node, int is_root, int depth, int *leaf_depth)
{
    if (node == NULL || node->key_count > MAX_KEYS || node->key_count < 0)
    {
        return 0;
    }
    if (!is_root && node->key_count < MIN_KEYS)
    {
        return 0;
    }
    for (int index = 1; index < node->key_count; ++index)
    {
        if (node->keys[index - 1] >= node->keys[index])
        {
            return 0;
        }
    }
    if (node->children[0] == NULL)
    {
        if (*leaf_depth < 0)
        {
            *leaf_depth = depth;
        }
        return *leaf_depth == depth;
    }
    for (int index = 0; index <= node->key_count; ++index)
    {
        if (node->children[index] == NULL)
        {
            return 0;
        }
    }
    for (int index = 0; index <= node->key_count; ++index)
    {
        if (!validate_node(node->children[index], 0, depth + 1, leaf_depth))
        {
            return 0;
        }
    }
    for (int index = 0; index < node->key_count; ++index)
    {
        if (subtree_max(node->children[index]) >= node->keys[index])
        {
            return 0;
        }
        if (subtree_min(node->children[index + 1]) <= node->keys[index])
        {
            return 0;
        }
    }
    return 1;
}

static int validate_tree(const BTreeNode *root)
{
    if (root == NULL || root->key_count < 1)
    {
        return 0;
    }
    int leaf_depth = -1;
    return validate_node(root, 1, 0, &leaf_depth);
}

static int all_present(const BTreeNode *root, const int *keys, int count)
{
    for (int index = 0; index < count; ++index)
    {
        if (!Contains(root, keys[index]))
        {
            return 0;
        }
    }
    return 1;
}

static void insert_keys(BTreeNode **root, const int *keys, int count)
{
    for (int index = 0; index < count; ++index)
    {
        InsertBTree(root, keys[index]);
    }
}

static BTreeNode *build_full_root_tree(void)
{
    BTreeNode *root = NewNode();
    if (root == NULL)
    {
        return NULL;
    }
    int separators[] = {10, 20, 30};
    int child_keys[][3] = {{5, 6, 7}, {11, 12, 13}, {21, 22, 23}, {31, 32, 33}};
    root->key_count = 3;
    for (int index = 0; index < 3; ++index)
    {
        root->keys[index] = separators[index];
    }
    for (int index = 0; index < 4; ++index)
    {
        BTreeNode *child = NewNode();
        if (child == NULL)
        {
            FreeBTree(root);
            return NULL;
        }
        child->key_count = 3;
        for (int slot = 0; slot < 3; ++slot)
        {
            child->keys[slot] = child_keys[index][slot];
        }
        root->children[index] = child;
    }
    return root;
}

static int run_case(const char *mode, const int *build_keys, int build_count, int target, int fail_offset)
{
    BTreeNode *root = NULL;
    insert_keys(&root, build_keys, build_count);
    int before_valid = root == NULL ? 1 : validate_tree(root);
    int before_contains = all_present(root, build_keys, build_count);
    int calls_before = allocation_calls;
    fail_at = fail_offset > 0 ? calls_before + fail_offset : 0;
    int result = InsertBTree(&root, target);
    fail_at = 0;
    int after_valid = root == NULL ? 1 : validate_tree(root);
    int after_contains = all_present(root, build_keys, build_count);
    int target_present = Contains(root, target);
    int invariant_ok = before_valid && before_contains && after_valid && after_contains;
    printf("MODE=%s\n", mode);
    printf("FAIL_OFFSET=%d\n", fail_offset);
    printf("RESULT=%d\n", result);
    printf("CALLS_BEFORE=%d\n", calls_before);
    printf("CALLS_AFTER=%d\n", allocation_calls);
    printf("VALID_AFTER=%d\n", after_valid);
    printf("EXISTING_KEYS=%d\n", after_contains);
    printf("TARGET_PRESENT=%d\n", target_present);
    printf("INVARIANTS=%d\n", invariant_ok);
    FreeBTree(root);
    printf("OUTSTANDING=%d\n", tracked_count);
    return invariant_ok ? 0 : 1;
}

static int run_deep_case(const char *mode, int fail_offset)
{
    BTreeNode *root = build_full_root_tree();
    if (root == NULL)
    {
        return 1;
    }
    int existing[] = {5, 6, 7, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33};
    int before_valid = validate_tree(root);
    int before_contains = all_present(root, existing, 15);
    int calls_before = allocation_calls;
    fail_at = calls_before + fail_offset;
    int result = InsertBTree(&root, 14);
    fail_at = 0;
    int after_valid = validate_tree(root);
    int after_contains = all_present(root, existing, 15);
    int target_present = Contains(root, 14);
    int invariant_ok = before_valid && before_contains && after_valid && after_contains;
    printf("MODE=%s\n", mode);
    printf("FAIL_OFFSET=%d\n", fail_offset);
    printf("RESULT=%d\n", result);
    printf("CALLS_BEFORE=%d\n", calls_before);
    printf("CALLS_AFTER=%d\n", allocation_calls);
    printf("VALID_AFTER=%d\n", after_valid);
    printf("EXISTING_KEYS=%d\n", after_contains);
    printf("TARGET_PRESENT=%d\n", target_present);
    printf("INVARIANTS=%d\n", invariant_ok);
    FreeBTree(root);
    printf("OUTSTANDING=%d\n", tracked_count);
    return invariant_ok ? 0 : 1;
}

int main(int argc, char **argv)
{
    if (argc < 2)
    {
        return 2;
    }
    const char *mode = argv[1];
    int fail_offset = argc > 2 ? atoi(argv[2]) : 0;
    if (strcmp(mode, "empty-first") == 0)
    {
        return run_case(mode, NULL, 0, 10, 1);
    }
    if (strcmp(mode, "root-first") == 0)
    {
        const int keys[] = {10, 20, 5};
        return run_case(mode, keys, 3, 15, 1);
    }
    if (strcmp(mode, "root-second") == 0)
    {
        const int keys[] = {10, 20, 5};
        return run_case(mode, keys, 3, 15, 2);
    }
    if (strcmp(mode, "child-first") == 0)
    {
        const int keys[] = {10, 20, 5, 6, 12, 30};
        return run_case(mode, keys, 6, 15, 1);
    }
    if (strcmp(mode, "deep-third") == 0)
    {
        return run_deep_case(mode, fail_offset > 0 ? fail_offset : 3);
    }
    if (strcmp(mode, "normal") == 0)
    {
        const int keys[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12};
        BTreeNode *root = NULL;
        insert_keys(&root, keys, 12);
        int ok = validate_tree(root) && all_present(root, keys, 12);
        printf("NORMAL_OK=%d\n", ok);
        FreeBTree(root);
        printf("OUTSTANDING=%d\n", tracked_count);
        return ok ? 0 : 1;
    }
    return 2;
}
