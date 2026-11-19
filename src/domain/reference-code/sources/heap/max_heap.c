/*
 * AlgoViz reference implementation: max heap.
 * Original code written for this repository under the MIT License.
 * Array-backed binary heap with sift-up on insert and sift-down on pop.
 */

#include <stdbool.h>
#include <stdio.h>

#define HEAP_CAPACITY 16

typedef struct {
    int items[HEAP_CAPACITY];
    int size;
} MaxHeap;

void heap_init(MaxHeap *heap) {
    heap->size = 0;
}

void swap_int(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

void sift_up(MaxHeap *heap, int index) {
    while (index > 0) {
        int parent = (index - 1) / 2;
        if (heap->items[parent] >= heap->items[index]) {
            break;
        }
        swap_int(&heap->items[parent], &heap->items[index]);
        index = parent;
    }
}

void sift_down(MaxHeap *heap, int index) {
    while (true) {
        int left = index * 2 + 1;
        int right = left + 1;
        int largest = index;
        if (left < heap->size && heap->items[left] > heap->items[largest]) {
            largest = left;
        }
        if (right < heap->size && heap->items[right] > heap->items[largest]) {
            largest = right;
        }
        if (largest == index) {
            break;
        }
        swap_int(&heap->items[index], &heap->items[largest]);
        index = largest;
    }
}

bool heap_push(MaxHeap *heap, int value) {
    if (heap->size == HEAP_CAPACITY) {
        return false;
    }
    heap->items[heap->size] = value;
    ++heap->size;
    sift_up(heap, heap->size - 1);
    return true;
}

bool heap_pop(MaxHeap *heap, int *out_value) {
    if (heap->size == 0) {
        return false;
    }
    *out_value = heap->items[0];
    --heap->size;
    if (heap->size > 0) {
        heap->items[0] = heap->items[heap->size];
        sift_down(heap, 0);
    }
    return true;
}

void heap_print(const MaxHeap *heap) {
    for (int i = 0; i < heap->size; ++i) {
        printf("%d%s", heap->items[i], i + 1 == heap->size ? "" : " ");
    }
    printf("\n");
}

int main(void) {
    MaxHeap heap;
    heap_init(&heap);
    int values[] = {5, 3, 8, 1, 9, 2};
    for (size_t i = 0; i < sizeof(values) / sizeof(values[0]); ++i) {
        heap_push(&heap, values[i]);
    }
    printf("heap array: ");
    heap_print(&heap);

    int value = 0;
    printf("extract: ");
    while (heap_pop(&heap, &value)) {
        printf("%d ", value);
    }
    printf("\nempty pop: %s\n", heap_pop(&heap, &value) ? "no" : "yes");
    return 0;
}
