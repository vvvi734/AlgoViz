/*
 * 中文导读：在普通二叉搜索树上维护高度差，使查找、插入、删除都保持 O(log n)。
 * 阅读顺序：先看 Node 的 height 字段；再看 height()/balance_factor() 如何由子树高度算出；最后跟 insert() 的递归返回路径看四种旋转。
 * 关键不变量：任意结点的左右子树高度差只能是 -1、0、1；旋转后仍要满足 BST 的中序有序性。
 * 易错点：只改指针却忘记更新 height；把“不平衡”误判成只要左右高度相等；删除时没有沿整条返回路径继续修复。
 * 复杂度：查找/插入/删除 O(log n)，单次旋转 O(1)，额外空间 O(n)。
 */

/*
 * AVL tree in C11.
 *
 * A binary search tree that keeps |height(left) - height(right)| <= 1 at every
 * node. Insertion recurses down, then refreshes heights on the way back and
 * applies one of LL, RR, LR or RL rotations when a node becomes unbalanced.
 * Height stays O(log n), so search, insert and delete are O(log n).
 */

#include <stdio.h>
#include <stdlib.h>

typedef struct AVLNode
{
    int value;
    int height;
    struct AVLNode *left;
    struct AVLNode *right;
} AVLNode;

// 作用：返回两个整数中的较大值，用于计算结点高度。
static int MaxInt(int left, int right)
{
    return left > right ? left : right;
}

// 作用：返回结点高度；空结点按 0 处理，保证旋转时不必额外判空。
static int NodeHeight(const AVLNode *node)
{
    return node == NULL ? 0 : node->height;
}

// 作用：由左右子树高度重算当前结点高度；任何结构变化后都要调用。
static void RefreshHeight(AVLNode *node)
{
    node->height = 1 + MaxInt(NodeHeight(node->left), NodeHeight(node->right));
}

// 作用：以 root 为轴右旋：左孩子上位，左孩子的右子树改挂到 root 左侧；返回新的子树根。
static AVLNode *RotateRight(AVLNode *root)
{
    AVLNode *pivot = root->left;
    AVLNode *middle = pivot->right;
    pivot->right = root;
    root->left = middle;
    RefreshHeight(root);
    RefreshHeight(pivot);
    return pivot;
}

// 作用：以 root 为轴左旋：右孩子上位，右孩子的左子树改挂到 root 右侧；返回新的子树根。
static AVLNode *RotateLeft(AVLNode *root)
{
    AVLNode *pivot = root->right;
    AVLNode *middle = pivot->left;
    pivot->left = root;
    root->right = middle;
    RefreshHeight(root);
    RefreshHeight(pivot);
    return pivot;
}

// 作用：按 BST 规则插入 value，并在递归返回时重算高度、按四种失衡情况旋转；返回新的子树根。
AVLNode *AVLInsert(AVLNode *root, int value)
{
    if (root == NULL)
    {
        AVLNode *node = (AVLNode *)malloc(sizeof(AVLNode));
        if (node == NULL)
        {
            return NULL;
        }
        node->value = value;
        node->height = 1;
        node->left = NULL;
        node->right = NULL;
        return node;
    }
    if (value < root->value)
    {
        root->left = AVLInsert(root->left, value);
    }
    else if (value > root->value)
    {
        root->right = AVLInsert(root->right, value);
    }
    else
    {
        return root;
    }

    RefreshHeight(root);
    // The balance factor is height(left) - height(right); values outside {-1, 0, 1} need rotation.
    int balance = NodeHeight(root->left) - NodeHeight(root->right);
    if (balance > 1)
    {
        if (value < root->left->value)
        {
            return RotateRight(root);
        }
        // LR case: rotate the left child left first, then rotate the unbalanced root right.
        root->left = RotateLeft(root->left);
        return RotateRight(root);
    }
    if (balance < -1)
    {
        if (value > root->right->value)
        {
            return RotateLeft(root);
        }
        root->right = RotateRight(root->right);
        return RotateLeft(root);
    }
    return root;
}

// 作用：中序遍历并输出键值；顺序应为升序，可用于验证 BST 性质。
void InOrder(const AVLNode *root)
{
    if (root == NULL)
    {
        return;
    }
    InOrder(root->left);
    printf("%d ", root->value);
    InOrder(root->right);
}

// 作用：后序释放 AVL 树：先释放左右子树，再释放当前结点。
void FreeAVL(AVLNode *root)
{
    if (root == NULL)
    {
        return;
    }
    FreeAVL(root->left);
    FreeAVL(root->right);
    free(root);
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    AVLNode *root = NULL;
    int keys[] = {10, 20, 30, 40, 50, 25};

    for (int index = 0; index < (int)(sizeof(keys) / sizeof(keys[0])); ++index)
    {
        root = AVLInsert(root, keys[index]);
    }

    printf("inorder:");
    InOrder(root);
    printf("\nheight: %d\n", NodeHeight(root));
    FreeAVL(root);
    return 0;
}
