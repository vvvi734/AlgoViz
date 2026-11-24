/*
 * Test-only harness for bplus_tree.c.
 * It exhausts the static node pool at chosen points and checks that insertion
 * failure is explicit, existing records remain reachable, and the leaf chain is intact.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// The harness owns the test budget: the implementation itself grows without a
// compile-time cap, so these constants describe the failure point under test.
#define MAX_NODES 72
#define HARNESS_NODES 4096

#define main bplus_app_main
#include "../sources/bplus-tree/bplus_tree.c"
#undef main

static void ensure_capacity(int cap)
{
    if (node_capacity >= cap)
    {
        return;
    }
    BPlusNode *grown = (BPlusNode *)realloc(nodes, (size_t)cap * sizeof(BPlusNode));
    if (grown == NULL)
    {
        fprintf(stderr, "harness realloc failed\n");
        exit(2);
    }
    nodes = grown;
    node_capacity = cap;
}

static int visited[HARNESS_NODES];
static int leaf_ids[HARNESS_NODES];
static int leaf_count;
static int leaf_depth = -1;
static int chain_ok;
static int separator_ok;

static int subtree_min_key(int id)
{
    while (!nodes[id].leaf)
    {
        id = nodes[id].children[0];
    }
    return nodes[id].keys[0];
}

static int validate_node(int id, int depth)
{
    if (id < 0 || id >= node_count || visited[id])
    {
        return 0;
    }
    visited[id] = 1;
    if (nodes[id].key_count < 1 || nodes[id].key_count > MAX_KEYS)
    {
        return 0;
    }
    for (int index = 1; index < nodes[id].key_count; ++index)
    {
        if (nodes[id].keys[index - 1] >= nodes[id].keys[index])
        {
            return 0;
        }
    }
    if (nodes[id].leaf)
    {
        if (leaf_depth < 0)
        {
            leaf_depth = depth;
        }
        if (leaf_depth != depth)
        {
            return 0;
        }
        leaf_ids[leaf_count++] = id;
        return nodes[id].next >= -1 && nodes[id].next < node_count;
    }
    if (nodes[id].child_count != nodes[id].key_count + 1)
    {
        return 0;
    }
    for (int index = 0; index < nodes[id].child_count; ++index)
    {
        if (nodes[id].children[index] < 0 || nodes[id].children[index] >= node_count)
        {
            return 0;
        }
    }
    for (int index = 0; index < nodes[id].child_count; ++index)
    {
        if (!validate_node(nodes[id].children[index], depth + 1))
        {
            return 0;
        }
    }
    for (int index = 0; index < nodes[id].key_count; ++index)
    {
        int first = subtree_min_key(nodes[id].children[index + 1]);
        if (nodes[id].keys[index] != first)
        {
            separator_ok = 0;
            return 0;
        }
    }
    return 1;
}

static int validate_bplus(int expected_max_key)
{
    memset(visited, 0, sizeof(visited));
    leaf_count = 0;
    leaf_depth = -1;
    chain_ok = 1;
    separator_ok = 1;
    if (root < 0)
    {
        return expected_max_key == 0;
    }
    if (!validate_node(root, 0))
    {
        return 0;
    }
    for (int index = 0; index < leaf_count; ++index)
    {
        int expected_next = index + 1 < leaf_count ? leaf_ids[index + 1] : -1;
        if (nodes[leaf_ids[index]].next != expected_next)
        {
            chain_ok = 0;
            return 0;
        }
        if (index + 1 < leaf_count && nodes[leaf_ids[index]].keys[nodes[leaf_ids[index]].key_count - 1] >=
                                              nodes[leaf_ids[index + 1]].keys[0])
        {
            chain_ok = 0;
            return 0;
        }
    }
    return chain_ok && separator_ok;
}

static int all_contains(int low, int high)
{
    for (int key = low; key <= high; ++key)
    {
        if (!contains(key))
        {
            return 0;
        }
    }
    return 1;
}

static int leaf_sum(void)
{
    int sum = 0;
    for (int index = 0; index < leaf_count; ++index)
    {
        int id = leaf_ids[index];
        for (int slot = 0; slot < nodes[id].key_count; ++slot)
        {
            sum += nodes[id].keys[slot];
        }
    }
    return sum;
}

static int run_failure(const char *mode, int build_count, int cap, int target)
{
    root = -1;
    node_count = 0;
    int build_ok = 1;
    for (int key = 1; key <= build_count; ++key)
    {
        if (insert_key(key) != 1)
        {
            build_ok = 0;
            break;
        }
    }
    int before_valid = validate_bplus(build_count);
    int before_contains = all_contains(1, build_count);
    int before_leaves = leaf_count;
    ensure_capacity(cap);
    node_limit = cap;
    node_count = cap;
    int result = insert_key(target);
    int after_valid = validate_bplus(build_count);
    int after_contains = all_contains(1, build_count);
    int target_present = contains(target);
    int unchanged = node_count == cap && leaf_count == before_leaves;
    int ok = build_ok && before_valid && before_contains && after_valid && after_contains && unchanged && result == -1 && !target_present;
    printf("MODE=%s\n", mode);
    printf("BUILD_OK=%d\n", build_ok);
    printf("RESULT=%d\n", result);
    printf("CAP=%d\n", cap);
    printf("NODE_COUNT=%d\n", node_count);
    printf("VALID_AFTER=%d\n", after_valid);
    printf("EXISTING_KEYS=%d\n", after_contains);
    printf("TARGET_PRESENT=%d\n", target_present);
    printf("LEAF_CHAIN=%d\n", chain_ok);
    printf("SEPARATORS=%d\n", separator_ok);
    printf("UNCHANGED=%d\n", unchanged);
    printf("ALL_OK=%d\n", ok);
    return ok ? 0 : 1;
}

static int run_no_split_under_cap(void)
{
    root = -1;
    node_count = 0;
    for (int key = 1; key <= 64; ++key)
    {
        if (insert_key(key) != 1)
        {
            return 1;
        }
    }
    if (!validate_bplus(64))
    {
        return 1;
    }
    int before_leaves = leaf_count;
    ensure_capacity(MAX_NODES);
    node_limit = MAX_NODES;
    node_count = MAX_NODES;
    int result = insert_key(65);
    int after_valid = validate_bplus(65);
    int present = all_contains(1, 65);
    int unchanged_shape = node_count == MAX_NODES && leaf_count == before_leaves;
    int ok = result == 1 && after_valid && present && unchanged_shape;
    printf("MODE=root-full-no-split\n");
    printf("RESULT=%d\n", result);
    printf("NODE_COUNT=%d\n", node_count);
    printf("VALID_AFTER=%d\n", after_valid);
    printf("ALL_KEYS=%d\n", present);
    printf("LEAF_CHAIN=%d\n", chain_ok);
    printf("SEPARATORS=%d\n", separator_ok);
    printf("UNCHANGED_SHAPE=%d\n", unchanged_shape);
    printf("ALL_OK=%d\n", ok);
    return ok ? 0 : 1;
}

static int make_leaf(const int *keys, int count)
{
    int id = new_node(1);
    if (id < 0)
    {
        return -1;
    }
    nodes[id].key_count = count;
    for (int index = 0; index < count; ++index)
    {
        nodes[id].keys[index] = keys[index];
    }
    return id;
}

static int make_internal(const int *keys, int key_count, const int *children)
{
    int id = new_node(0);
    if (id < 0)
    {
        return -1;
    }
    nodes[id].key_count = key_count;
    nodes[id].child_count = key_count + 1;
    for (int index = 0; index < key_count; ++index)
    {
        nodes[id].keys[index] = keys[index];
    }
    for (int index = 0; index <= key_count; ++index)
    {
        nodes[id].children[index] = children[index];
    }
    return id;
}

static BPlusNode *build_internal_split_tree(void)
{
    static const int k1[] = {1};
    static const int k2[] = {2, 3};
    static const int k3[] = {10};
    static const int k4[] = {11, 12};
    static const int k5[] = {13, 14};
    static const int k6[] = {15, 16, 17};
    static const int k7[] = {20};
    static const int k8[] = {21, 22};
    static const int k9[] = {30};
    static const int k10[] = {31, 32};
    int l0 = make_leaf(k1, 1);
    int l1 = make_leaf(k2, 2);
    int l2 = make_leaf(k3, 1);
    int l3 = make_leaf(k4, 2);
    int l4 = make_leaf(k5, 2);
    int l5 = make_leaf(k6, 3);
    int l6 = make_leaf(k7, 1);
    int l7 = make_leaf(k8, 2);
    int l8 = make_leaf(k9, 1);
    int l9 = make_leaf(k10, 2);
    if (l0 < 0 || l1 < 0 || l2 < 0 || l3 < 0 || l4 < 0 || l5 < 0 || l6 < 0 || l7 < 0 || l8 < 0 || l9 < 0)
    {
        return NULL;
    }
    nodes[l0].next = l1;
    nodes[l1].next = l2;
    nodes[l2].next = l3;
    nodes[l3].next = l4;
    nodes[l4].next = l5;
    nodes[l5].next = l6;
    nodes[l6].next = l7;
    nodes[l7].next = l8;
    nodes[l8].next = l9;
    nodes[l9].next = -1;

    static const int c0_keys[] = {2};
    static const int c1_keys[] = {11, 13, 15};
    static const int c2_keys[] = {21};
    static const int c3_keys[] = {31};
    int c0_children[] = {l0, l1};
    int c1_children[] = {l2, l3, l4, l5};
    int c2_children[] = {l6, l7};
    int c3_children[] = {l8, l9};
    int c0 = make_internal(c0_keys, 1, c0_children);
    int c1 = make_internal(c1_keys, 3, c1_children);
    int c2 = make_internal(c2_keys, 1, c2_children);
    int c3 = make_internal(c3_keys, 1, c3_children);
    if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0)
    {
        return NULL;
    }
    static const int root_keys[] = {10, 20, 30};
    int root_children[] = {c0, c1, c2, c3};
    int root_id = make_internal(root_keys, 3, root_children);
    if (root_id < 0)
    {
        return NULL;
    }
    root = root_id;
    return &nodes[root];
}

static int run_internal_split_failure(void)
{
    root = -1;
    node_count = 0;
    if (build_internal_split_tree() == NULL)
    {
        return 1;
    }
    static const int existing[] = {1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 20, 21, 22, 30, 31, 32};
    int before_valid = validate_bplus(17);
    int before_present = 1;
    for (int index = 0; index < (int)(sizeof(existing) / sizeof(existing[0])); ++index)
    {
        before_present = before_present && contains(existing[index]);
    }
    int before_leaves = leaf_count;
    ensure_capacity(MAX_NODES - 2);
    node_limit = MAX_NODES - 2;
    node_count = MAX_NODES - 2;
    int result = insert_key(18);
    int after_valid = validate_bplus(18);
    int after_present = 1;
    for (int index = 0; index < (int)(sizeof(existing) / sizeof(existing[0])); ++index)
    {
        after_present = after_present && contains(existing[index]);
    }
    int target_present = contains(18);
    int unchanged = node_count == MAX_NODES - 2 && leaf_count == before_leaves;
    int ok = before_valid && before_present && after_valid && after_present && unchanged && result == -1 && !target_present;
    printf("MODE=internal-child-second\n");
    printf("RESULT=%d\n", result);
    printf("NODE_COUNT=%d\n", node_count);
    printf("VALID_AFTER=%d\n", after_valid);
    printf("EXISTING_KEYS=%d\n", after_present);
    printf("TARGET_PRESENT=%d\n", target_present);
    printf("LEAF_CHAIN=%d\n", chain_ok);
    printf("SEPARATORS=%d\n", separator_ok);
    printf("UNCHANGED=%d\n", unchanged);
    printf("ALL_OK=%d\n", ok);
    return ok ? 0 : 1;
}

int main(int argc, char **argv)
{
    if (argc < 2)
    {
        return 2;
    }
    const char *mode = argv[1];
    if (strcmp(mode, "internal-child-second") == 0)
    {
        return run_internal_split_failure();
    }
    if (strcmp(mode, "root-full-no-split") == 0)
    {
        return run_no_split_under_cap();
    }
    if (strcmp(mode, "empty-first") == 0)
    {
        root = -1;
        node_count = 0;
        ensure_capacity(MAX_NODES);
        node_limit = MAX_NODES;
        node_count = MAX_NODES;
        int result = insert_key(10);
        int ok = result == -1 && root == -1 && node_count == MAX_NODES;
        printf("MODE=%s\n", mode);
        printf("RESULT=%d\n", result);
        printf("ROOT=%d\n", root);
        printf("NODE_COUNT=%d\n", node_count);
        printf("ALL_OK=%d\n", ok);
        return ok ? 0 : 1;
    }
    if (strcmp(mode, "leaf-first") == 0)
    {
        return run_failure(mode, 3, MAX_NODES, 4);
    }
    if (strcmp(mode, "leaf-second") == 0)
    {
        return run_failure(mode, 3, MAX_NODES - 1, 4);
    }
    if (strcmp(mode, "internal-second") == 0)
    {
        return run_failure(mode, 69, MAX_NODES - 1, 70);
    }
    if (strcmp(mode, "dynamic-growth") == 0)
    {
        root = -1;
        node_count = 0;
        node_limit = 0;
        int ok = 1;
        for (int key = 1; key <= 500; ++key)
        {
            if (insert_key(key) != 1)
            {
                ok = 0;
                break;
            }
        }
        int valid = validate_bplus(500);
        int present = all_contains(1, 500);
        printf("MODE=%s\n", mode);
        printf("NODE_COUNT=%d\n", node_count);
        printf("VALID=%d\n", valid);
        printf("ALL_KEYS=%d\n", present);
        printf("ALL_OK=%d\n", ok && valid && present);
        return (ok && valid && present) ? 0 : 1;
    }
    if (strcmp(mode, "normal") == 0)
    {
        root = -1;
        node_count = 0;
        int build_ok = 1;
        for (int key = 1; key <= 70; ++key)
        {
            if (insert_key(key) != 1)
            {
                build_ok = 0;
                break;
            }
        }
        int valid = validate_bplus(70);
        int present = all_contains(1, 70);
        int expected_sum = 70 * 71 / 2;
        int actual_sum = leaf_sum();
        int ok = build_ok && valid && present && actual_sum == expected_sum;
        printf("MODE=%s\n", mode);
        printf("BUILD_OK=%d\n", build_ok);
        printf("VALID=%d\n", valid);
        printf("ALL_KEYS=%d\n", present);
        printf("LEAF_CHAIN=%d\n", chain_ok);
        printf("SEPARATORS=%d\n", separator_ok);
        printf("LEAF_SUM=%d\n", actual_sum);
        printf("EXPECTED_SUM=%d\n", expected_sum);
        printf("NODE_COUNT=%d\n", node_count);
        printf("ALL_OK=%d\n", ok);
        return ok ? 0 : 1;
    }
    return 2;
}
