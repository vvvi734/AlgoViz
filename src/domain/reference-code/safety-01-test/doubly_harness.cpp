/*
 * Test-only harness for doubly_linked_list.cpp.
 * It poisons deleted node memory so a use-after-free is exposed deterministically.
 */
#include <cstddef>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <new>

struct TrackedBlock
{
    void *ptr;
    std::size_t size;
};

#define MAX_TRACKED 256
static TrackedBlock tracked[MAX_TRACKED];
static int tracked_count = 0;
static int outstanding = 0;

static void untrack(void *ptr) noexcept
{
    for (int i = 0; i < tracked_count; ++i)
    {
        if (tracked[i].ptr == ptr)
        {
            tracked[i] = tracked[tracked_count - 1];
            tracked_count -= 1;
            return;
        }
    }
}

void *operator new(std::size_t size)
{
    void *ptr = std::malloc(size);
    if (ptr == nullptr)
    {
        throw std::bad_alloc();
    }
    if (tracked_count < MAX_TRACKED)
    {
        tracked[tracked_count++] = {ptr, size};
    }
    outstanding += 1;
    return ptr;
}

void operator delete(void *ptr) noexcept
{
    if (ptr == nullptr)
    {
        return;
    }
    std::size_t size = 0;
    for (int i = 0; i < tracked_count; ++i)
    {
        if (tracked[i].ptr == ptr)
        {
            size = tracked[i].size;
            break;
        }
    }
    if (size != 0)
    {
        std::memset(ptr, 0xDD, size);
    }
    untrack(ptr);
    outstanding -= 1;
    std::free(ptr);
}

void operator delete(void *ptr, std::size_t) noexcept
{
    operator delete(ptr);
}

#define main doubly_app_main
#include "../sources/doubly/doubly_linked_list.cpp"
#undef main

static int check_list(DoublyList &list, const int *values, int count)
{
    if (count == 0)
    {
        return list.head_.get() == nullptr && list.tail_ == nullptr;
    }
    DoublyList::Node *previous = nullptr;
    DoublyList::Node *node = list.head_.get();
    for (int index = 0; index < count; ++index)
    {
        if (node == nullptr || node->value != values[index] || node->prev != previous)
        {
            return 0;
        }
        previous = node;
        node = node->next.get();
    }
    if (node != nullptr || list.tail_ != previous)
    {
        return 0;
    }
    node = list.tail_;
    for (int index = count - 1; index >= 0; --index)
    {
        if (node == nullptr || node->value != values[index])
        {
            return 0;
        }
        node = node->prev;
    }
    return node == nullptr;
}

static DoublyList::Node *find_value(DoublyList &list, int value)
{
    for (DoublyList::Node *node = list.head_.get(); node; node = node->next.get())
    {
        if (node->value == value)
        {
            return node;
        }
    }
    return nullptr;
}

static bool remove_value_if_present(DoublyList &list, int value)
{
    DoublyList::Node *node = find_value(list, value);
    if (node == nullptr)
    {
        return false;
    }
    list.remove(node);
    return true;
}

int main()
{
    int failures = 0;
    {
        DoublyList empty;
        if (!check_list(empty, nullptr, 0)) ++failures;

        DoublyList single;
        auto *one = single.append(1);
        const int only[] = {1};
        if (!check_list(single, only, 1)) ++failures;
        single.remove(one);
        if (!check_list(single, nullptr, 0)) ++failures;
        single.append(2);
        const int reinserted[] = {2};
        if (!check_list(single, reinserted, 1)) ++failures;

        DoublyList edges;
        auto *edge_one = edges.append(1);
        auto *edge_two = edges.append(2);
        auto *edge_three = edges.append(3);
        edges.remove(edge_one);
        const int after_head[] = {2, 3};
        if (!check_list(edges, after_head, 2)) ++failures;
        edges.remove(edge_three);
        const int after_tail[] = {2};
        if (!check_list(edges, after_tail, 1)) ++failures;
        edges.remove(edge_two);
        if (!check_list(edges, nullptr, 0)) ++failures;
        edges.append(4);
        edges.append(5);
        const int after_empty_reinsert[] = {4, 5};
        if (!check_list(edges, after_empty_reinsert, 2)) ++failures;

        DoublyList middle;
        auto *first = middle.append(1);
        auto *second = middle.append(2);
        middle.append(3);
        auto *fourth = middle.append(4);
        auto *fifth = middle.append(5);
        if (find_value(middle, 99) != nullptr || remove_value_if_present(middle, 99))
        {
            ++failures;
        }
        const int after_absent[] = {1, 2, 3, 4, 5};
        if (!check_list(middle, after_absent, 5)) ++failures;
        if (!remove_value_if_present(middle, 3)) ++failures;
        const int after_middle[] = {1, 2, 4, 5};
        if (!check_list(middle, after_middle, 4)) ++failures;
        middle.remove(fifth);
        const int after_second_tail[] = {1, 2, 4};
        if (!check_list(middle, after_second_tail, 3)) ++failures;
        middle.remove(first);
        const int after_second_head[] = {2, 4};
        if (!check_list(middle, after_second_head, 2)) ++failures;
        middle.remove(second);
        const int after_middle_both[] = {4};
        if (!check_list(middle, after_middle_both, 1)) ++failures;
        middle.remove(fourth);
        if (!check_list(middle, nullptr, 0)) ++failures;
        middle.append(6);
        const int final_reinsert[] = {6};
        if (!check_list(middle, final_reinsert, 1)) ++failures;
    }

    std::printf("FAILURES=%d\n", failures);
    std::printf("OUTSTANDING=%d\n", outstanding);
    std::printf("ALL_OK=%d\n", failures == 0 ? 1 : 0);
    return failures == 0 ? 0 : 1;
}
