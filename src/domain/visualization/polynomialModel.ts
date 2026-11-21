import type { PolynomialNode, PolynomialSnapshot } from '../trace/schema';

/**
 * TEXTBOOK-02 pure model for polynomial addition. A, B and the result are three
 * separate recorded chains; the current pointers and the compared exponents are
 * facts from the trace. The renderer only formats them.
 */

export interface PolynomialTermModel {
  id: string;
  coefficient: number;
  exponent: number;
  text: string;
  current: boolean;
  active: boolean;
  appended: boolean;
  role: 'a' | 'b' | 'result';
}

export interface PolynomialListModel {
  headId: string | null;
  terms: PolynomialTermModel[];
  expression: string;
  currentId: string | null;
}

export interface PolynomialVisualModel {
  kind: 'polynomial';
  operation: PolynomialSnapshot['operation'];
  action: PolynomialSnapshot['action'];
  phase: PolynomialSnapshot['phase'];
  a: PolynomialListModel;
  b: PolynomialListModel;
  result: PolynomialListModel;
  focusSide?: PolynomialSnapshot['focusSide'];
  comparison?: PolynomialSnapshot['comparison'];
  resultTailId: string | null;
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

export function superscript(value: number): string {
  return String(value).split('').map((digit) => SUPERSCRIPT[digit] ?? digit).join('');
}

/** `3x⁴`, `−5`, `x²`, `2x` — a term, never a whole expression. */
export function formatPolynomialTerm(coefficient: number, exponent: number): string {
  const sign = coefficient < 0 ? '−' : '';
  const magnitude = Math.abs(coefficient);
  if (exponent === 0) return `${sign}${magnitude}`;
  const head = magnitude === 1 ? '' : String(magnitude);
  if (exponent === 1) return `${sign}${head}x`;
  return `${sign}${head}x${superscript(exponent)}`;
}

function expressionOf(terms: PolynomialTermModel[]): string {
  if (!terms.length) return '0';
  return terms
    .map((term, index) => {
      const text = term.text;
      if (index === 0) return text;
      return text.startsWith('−') ? text : `+ ${text}`;
    })
    .join(' ');
}

function chainNodes(headId: string | null, nodes: PolynomialNode[]): PolynomialNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const order: PolynomialNode[] = [];
  const seen = new Set<string>();
  let current = headId;
  while (current !== null && !seen.has(current)) {
    const node = byId.get(current);
    if (!node) break;
    seen.add(current);
    order.push(node);
    current = node.nextId;
  }
  return order;
}

function listModel(
  headId: string | null,
  nodes: PolynomialNode[],
  currentId: string | null,
  role: 'a' | 'b' | 'result',
  appendedId: string | null,
): PolynomialListModel {
  const included = new Set(chainNodes(headId, nodes).map((node) => node.id));
  const terms = nodes
    .filter((node) => included.has(node.id))
    .map((node) => ({
      id: node.id,
      coefficient: node.coefficient,
      exponent: node.exponent,
      text: formatPolynomialTerm(node.coefficient, node.exponent),
      current: node.id === currentId,
      active: role !== 'result' && node.id === currentId,
      appended: role === 'result' && node.id === appendedId,
      role,
    }));
  return {
    headId,
    terms,
    expression: expressionOf(terms),
    currentId,
  };
}

export function buildPolynomialModel(snapshot: PolynomialSnapshot): PolynomialVisualModel {
  const appendedId =
    snapshot.action === 'merge' || snapshot.action === 'take-a' || snapshot.action === 'take-b' ||
    snapshot.action === 'append-a' || snapshot.action === 'append-b'
      ? snapshot.resultTailId
      : null;
  return {
    kind: 'polynomial',
    operation: snapshot.operation,
    action: snapshot.action,
    phase: snapshot.phase,
    a: listModel(snapshot.aHeadId, snapshot.aNodes, snapshot.aCurrentId, 'a', null),
    b: listModel(snapshot.bHeadId, snapshot.bNodes, snapshot.bCurrentId, 'b', null),
    result: listModel(snapshot.resultHeadId, snapshot.resultNodes, null, 'result', appendedId),
    ...(snapshot.focusSide ? { focusSide: snapshot.focusSide } : {}),
    ...(snapshot.comparison ? { comparison: snapshot.comparison } : {}),
    resultTailId: snapshot.resultTailId,
  };
}
