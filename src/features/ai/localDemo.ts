/** Local keyword → preset mapping, ported from the legacy "try local demo" action. */
export function pickLocalAlgorithm(query: string): string {
  const q = query.toLowerCase();
  if (/binary|二分/.test(q)) return 'binary';
  if (/bfs|广度|队列/.test(q)) return 'bfs';
  if (/dfs|深度/.test(q)) return 'dfs';
  if (/栈|stack/.test(q)) return 'stack';
  if (/快排|quick/.test(q)) return 'quick';
  return 'bubble';
}
