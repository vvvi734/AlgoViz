import { describe, expect, it } from 'vitest';
import { ALGORITHM_FLOWS } from './algorithmFlows';
import { plainFlowLabel } from './flowPlainLanguage';

const CODEISH_ZH = /[=[\]]|[<>]|==|!=|\+=|-=|\s？|；/;
const CODEISH_EN = /[=[\]]|[<>]|==|!=|\+=|-=|\.\w+\(|\s\?/;

describe('control-flow plain language', () => {
  it('turns every code-like node and edge label into prose in both languages', () => {
    const offenders: string[] = [];

    for (const [algorithmId, flow] of Object.entries(ALGORITHM_FLOWS)) {
      for (const section of flow.sections) {
        for (const node of section.nodes) {
          const zh = plainFlowLabel(node.label.zh, node.label.en, 'zh');
          const en = plainFlowLabel(node.label.zh, node.label.en, 'en');
          if (CODEISH_ZH.test(zh)) offenders.push(`${algorithmId}/${section.id}/${node.id}/zh: ${zh}`);
          if (CODEISH_EN.test(en)) offenders.push(`${algorithmId}/${section.id}/${node.id}/en: ${en}`);
        }
        for (const edge of section.edges) {
          if (!edge.label) continue;
          const zh = plainFlowLabel(edge.label.zh, edge.label.en, 'zh');
          const en = plainFlowLabel(edge.label.zh, edge.label.en, 'en');
          if (CODEISH_ZH.test(zh)) offenders.push(`${algorithmId}/${section.id}/${edge.from}->${edge.to}/zh: ${zh}`);
          if (CODEISH_EN.test(en)) offenders.push(`${algorithmId}/${section.id}/${edge.from}->${edge.to}/en: ${en}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
