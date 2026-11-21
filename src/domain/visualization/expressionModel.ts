/**
 * Pure presentation model for infix→postfix conversion and postfix evaluation.
 *
 * The Trace already contains every fact: the token stream, the scan index, the
 * operator/operand stack and the produced suffix. This module only labels
 * tokens as consumed/current/pending and copies stack entries, so React never
 * reconstructs an algorithm step from the message text.
 */
import type { ExpressionSnapshot, ExpressionStackItem } from '../trace/schema';

export type ExpressionTokenState = 'consumed' | 'current' | 'pending';

export interface ExpressionTokenModel {
  index: number;
  value: string;
  state: ExpressionTokenState;
}

export interface ExpressionStackItemModel {
  id: string;
  value: string;
  active: boolean;
}

export interface ExpressionOperandModel {
  right: string;
  left: string;
  operator: string;
  result: number;
}

export interface ExpressionVisualModel {
  kind: 'expression';
  algorithm: ExpressionSnapshot['algorithm'];
  operation: ExpressionSnapshot['operation'];
  tokens: ExpressionTokenModel[];
  currentIndex: number;
  operatorStack: ExpressionStackItemModel[];
  operandStack: ExpressionStackItemModel[];
  output: string[];
  result: number | null;
  error: string | null;
  operands?: ExpressionOperandModel;
  targetId?: string;
  label: string;
}

function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return String(value);
}

function stackItems(items: ExpressionStackItem[], activeId?: string): ExpressionStackItemModel[] {
  const active = activeId ?? items[items.length - 1]?.id;
  return items.map((item) => ({
    id: item.id,
    value: text(item.value),
    active: item.id === active,
  }));
}

export function buildExpressionModel(
  snapshot: ExpressionSnapshot,
  label: string,
): ExpressionVisualModel {
  const tokens: ExpressionTokenModel[] = snapshot.tokens.map((value, index) => ({
    index,
    value,
    state: index < snapshot.index ? 'consumed' : index === snapshot.index ? 'current' : 'pending',
  }));
  const operands = snapshot.operands
    ? {
        right: text(snapshot.operands.right.value),
        left: text(snapshot.operands.left.value),
        operator: snapshot.operands.operator,
        result: snapshot.operands.result,
      }
    : undefined;
  return {
    kind: 'expression',
    algorithm: snapshot.algorithm,
    operation: snapshot.operation,
    tokens,
    currentIndex: snapshot.index,
    operatorStack: stackItems(snapshot.operatorStack, snapshot.operation === 'pop' ? snapshot.targetId : undefined),
    operandStack: stackItems(snapshot.operandStack ?? []),
    output: snapshot.output ?? [],
    result: snapshot.result ?? null,
    error: snapshot.error ?? null,
    ...(operands ? { operands } : {}),
    ...(snapshot.targetId ? { targetId: snapshot.targetId } : {}),
    label,
  };
}
