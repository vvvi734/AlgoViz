/*
 * 中文导读：在普通二叉搜索树上维护高度差，使查找、插入保持 O(log n)；本版本不实现删除。
 * 阅读顺序：先看 Node 的 height 字段；再看 height()/balance_factor() 如何由子树高度算出；最后跟 insert() 的递归返回路径看四种旋转。
 * 关键不变量：任意结点的左右子树高度差只能是 -1、0、1；旋转后仍要满足 BST 的中序有序性。
 * 易错点：只改指针却忘记更新 height；把“不平衡”误判成只要左右高度相等；旋转后先刷新较高结点导致高度用旧值。
 * 复杂度：查找/插入 O(log n)，单次旋转 O(1)，额外空间 O(h) 递归。
 * 输入/输出：输入 main 中的整数键序列；插入原地修改树，中序输出升序键；重复键被忽略；不提供删除。
*/

/*
 * AVL tree in C11.
 *
 * A binary search tree that keeps |height(left) - height(right)| <= 1 at every
 * node. Insertion recurses down, then refreshes heights on the way back and
 * applies one of LL, RR, LR or RL rotations when a node becomes unbalanced.
 * This C demo implements insertion only; deletion is not part of this module.
 * Height stays O(log n), so search and insert are O(log n).
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

// Purpose: Return the larger of two integers when recomputing node height.
// 作用：返回两个整数中的较大值，用于计算结点高度。
static int MaxInt(int left, int right)
{
    return left > right ? left : right;
}

// Purpose: Return node height, treating null as 0 so rotations need no extra null check.
// 作用：返回结点高度；空结点按 0 处理，保证旋转时不必额外判空。
static int NodeHeight(const AVLNode *node)
{
    return node == NULL ? 0 : node->height;
}

// Purpose: Recompute the current node's height from child heights after any structural change.
// 作用：由左右子树高度重算当前结点高度；任何结构变化后都要调用。
// Height is derived state, never trusted: recompute it after every pointer change, or every balance factor above becomes stale.
static void RefreshHeight(AVLNode *node)
{
    node->height = 1 + MaxInt(NodeHeight(node->left), NodeHeight(node->right));
}

// Purpose: Rotate right around root: the left child becomes the new root, its right subtree moves to root's left, and the new subtree root is returned.
// 作用：以 root 为轴右旋：左孩子上位，左孩子的右子树改挂到 root 左侧；返回新的子树根。
static AVLNode *RotateRight(AVLNode *root)
{
    AVLNode *pivot = root->left;
    // Save the middle subtree before pivot->right is overwritten; it must become root's left child, not stay under the old parent.
    AVLNode *middle = pivot->right;
    pivot->right = root;
    root->left = middle;
    // root is now the lower node; refresh it before pivot, whose height depends on root's new height.
    RefreshHeight(root);
    RefreshHeight(pivot);
    return pivot;
}

// Purpose: Rotate left around root: the right child becomes the new root, its left subtree moves to root's right, and the new subtree root is returned.
// 作用：以 root 为轴左旋：右孩子上位，右孩子的左子树改挂到 root 右侧；返回新的子树根。
static AVLNode *RotateLeft(AVLNode *root)
{
    AVLNode *pivot = root->right;
    // The left rotation has the mirror obligation: save pivot->left first, then reattach it as root's right child.
    AVLNode *middle = pivot->left;
    pivot->left = root;
    root->right = middle;
    // root is now the lower node; refresh it before pivot, whose height depends on root's new height.
    RefreshHeight(root);
    RefreshHeight(pivot);
    return pivot;
}

// Purpose: Insert by BST ordering, recompute heights while recursion unwinds, and apply one of the four rotations; returns the new subtree root.
// 作用：按 BST 规则插入 value，并在递归返回时重算高度、按四种失衡情况旋转；返回新的子树根。
// Insertion is ordinary BST descent; all AVL work happens on the unwinding path, where subtree heights and balance factors become known.
AVLNode *AVLInsert(AVLNode *root, int value)
{
    if (root == NULL)
    {
        AVLNode *node = (AVLNode *)malloc(sizeof(AVLNode));
        // A new leaf starts at height 1; allocation failure returns NULL, and the demo caller must avoid assigning it over an existing subtree.
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
        // The recursive result is assigned back to root->left; this is also how a rotated subtree root replaces the old child.
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
    // The sign matters: positive means left-heavy, so only positive imbalance can select LL or LR; magnitude alone is not enough.
    int balance = NodeHeight(root->left) - NodeHeight(root->right);
    if (balance > 1)
    {
        // The inserted value distinguishes LL from LR without another height query; if it lies left of the left child, one right rotation suffices.
        if (value < root->left->value)
        {
            return RotateRight(root);
        }
        // LR case: rotate the left child left first, then rotate the unbalanced root right.
        // LR must rotate the left child first; rotating the root immediately would leave the middle subtree attached to the wrong side.
        root->left = RotateLeft(root->left);
        return RotateRight(root);
    }
    // The mirror cases are symmetric: a negative factor means right-heavy, RR needs one left rotation, and RL needs a child right rotation first.
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

// Purpose: Inorder traversal that prints keys; the order should be ascending, which verifies the BST property.
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

// Purpose: Free an AVL tree postorder: release both children before the current node.
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
