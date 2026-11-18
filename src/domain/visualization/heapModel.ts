/**
 * T3: pure visual model for a real-array max heap.
 *
 * Every position comes from the snapshot slots, never from the message or a
 * guessed BST layout. The geometry uses totalSize (not heapSize) so shrinking
 * a heap during extract/sort does not move the surviving nodes. A sorted suffix
 * is still shown in the array strip but is excluded from the tree.
 */
import type { MaxHeapCommand, MaxHeapOperation, MaxHeapSnapshot } from '../trace/schema';
import { layoutCompleteHeap, type HeapLayoutEdge } from './heapLayout';

export interface HeapNodeModel {
  id: string;
  value: number;
  slot: number;
  depth: number;
  x: number;
  y: number;
  root: boolean;
  active: boolean;
  onPath: boolean;
  compareParent: boolean;
  compareChild: boolean;
  swapping: boolean;
  added: boolean;
}

export interface HeapSlotModel {
  id: string;
  value: number;
  slot: number;
  inHeap: boolean;
  root: boolean;
  active: boolean;
  onPath: boolean;
  compareParent: boolean;
  compareChild: boolean;
  swapping: boolean;
  added: boolean;
  sorted: boolean;
}

export interface HeapVisualModel {
  kind: 'max-heap';
  command: MaxHeapCommand;
  operation: MaxHeapOperation;
  preset: string | null;
  totalSize: number;
  heapSize: number;
  sortedFrom: number | null;
  layoutWidth: number;
  layoutHeight: number;
  nodeRadius: number;
  nodes: HeapNodeModel[];
  edges: HeapLayoutEdge[];
  slots: HeapSlotModel[];
  pathSlots: number[];
  activeSlot: number | null;
  rootSlot: number | null;
  compareParentSlots: [number, number] | null;
  compareChildrenSlots: [number, number] | null;
  swapSlots: [number, number] | null;
  addedSlot: number | null;
  removed: { id: string; value: number; slot: number } | null;
  replacement: { id: string; fromSlot: number; toSlot: number } | null;
  sortedSuffix: number[];
  empty: boolean;
  wide: boolean;
  label: string;
}

export function buildHeapModel(
  structure: MaxHeapSnapshot,
  emptyLabel: string,
): HeapVisualModel | null {
  if (structure.kind !== 'max-heap') return null;
  if (structure.totalSize !== structure.elements.length) return null;
  if (structure.heapSize > structure.totalSize) return null;
  const layout = layoutCompleteHeap(structure.totalSize);
  const byId = new Map(structure.elements.map((element) => [element.id, element]));
  const bySlot = new Map(structure.elements.map((element) => [element.slot, element]));
  const pathSlots = structure.pathIds
    .map((id) => byId.get(id)?.slot)
    .filter((slot): slot is number => slot !== undefined);
  const activeSlot = structure.activeId === null ? null : byId.get(structure.activeId)?.slot ?? null;
  const parentCompareSlots: [number, number] | null = structure.compareParent
    ? [
        byId.get(structure.compareParent.parentId)?.slot ?? -1,
        byId.get(structure.compareParent.childId)?.slot ?? -1,
      ]
    : null;
  const childCompareSlots: [number, number] | null = structure.compareChildren
    ? [
        byId.get(structure.compareChildren.leftId)?.slot ?? -1,
        byId.get(structure.compareChildren.rightId)?.slot ?? -1,
      ]
    : null;
  const swapSlots: [number, number] | null = structure.swap
    ? [
        byId.get(structure.swap.firstId)?.slot ?? -1,
        byId.get(structure.swap.secondId)?.slot ?? -1,
      ]
    : null;
  const addedSlot = structure.addedId === null ? null : byId.get(structure.addedId)?.slot ?? null;
  const replaceSlot = structure.replacement?.toSlot ?? null;
  const parentCompareSet = new Set(parentCompareSlots ?? []);
  const childCompareSet = new Set(childCompareSlots ?? []);
  const swapSet = new Set(swapSlots ?? []);
  const pathSet = new Set(pathSlots);

  const slots: HeapSlotModel[] = structure.elements.map((element) => ({
    id: element.id,
    value: element.value,
    slot: element.slot,
    inHeap: element.slot < structure.heapSize,
    root: structure.heapSize > 0 && element.slot === 0,
    active: activeSlot === element.slot,
    onPath: pathSet.has(element.slot),
    compareParent: parentCompareSet.has(element.slot),
    compareChild: childCompareSet.has(element.slot),
    swapping: swapSet.has(element.slot),
    added: addedSlot === element.slot,
    sorted: structure.sortedFrom !== null && element.slot >= structure.sortedFrom,
  }));

  const nodes: HeapNodeModel[] = [];
  for (const layoutNode of layout.nodes) {
    if (layoutNode.slot >= structure.heapSize) continue;
    const element = bySlot.get(layoutNode.slot);
    if (!element) return null;
    nodes.push({
      id: element.id,
      value: element.value,
      slot: layoutNode.slot,
      depth: layoutNode.depth,
      x: layoutNode.x,
      y: layoutNode.y,
      root: layoutNode.slot === 0,
      active: activeSlot === layoutNode.slot,
      onPath: pathSet.has(layoutNode.slot),
      compareParent: parentCompareSet.has(layoutNode.slot),
      compareChild: childCompareSet.has(layoutNode.slot),
      swapping: swapSet.has(layoutNode.slot),
      added: addedSlot === layoutNode.slot,
    });
  }

  if (structure.heapSize > 0 && nodes.length !== structure.heapSize) return null;
  if (activeSlot !== null && activeSlot >= structure.heapSize) return null;
  if (structure.removed !== null && structure.elements.some((element) => element.id === structure.removed!.id)) {
    return null;
  }
  if (replaceSlot !== null && structure.heapSize > 0 && replaceSlot !== 0) return null;

  const sortedSuffix = structure.sortedFrom === null
    ? []
    : structure.elements.slice(structure.sortedFrom).map((element) => element.value);

  return {
    kind: 'max-heap',
    command: structure.command,
    operation: structure.operation,
    preset: structure.preset,
    totalSize: structure.totalSize,
    heapSize: structure.heapSize,
    sortedFrom: structure.sortedFrom,
    layoutWidth: layout.width,
    layoutHeight: layout.height,
    nodeRadius: layout.radius,
    nodes,
    edges: layout.edges.filter((edge) => edge.childSlot < structure.heapSize),
    slots,
    pathSlots,
    activeSlot,
    rootSlot: structure.heapSize > 0 ? 0 : null,
    compareParentSlots: parentCompareSlots?.every((slot) => slot >= 0) ? parentCompareSlots : null,
    compareChildrenSlots: childCompareSlots?.every((slot) => slot >= 0) ? childCompareSlots : null,
    swapSlots: swapSlots?.every((slot) => slot >= 0) ? swapSlots : null,
    addedSlot,
    removed: structure.removed,
    replacement: structure.replacement,
    sortedSuffix,
    empty: structure.totalSize === 0,
    wide: structure.totalSize > 8 || layout.width > 560,
    label: emptyLabel,
  };
}
