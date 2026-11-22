import { describe, expect, it } from 'vitest';
import { CONCEPT_PAGES } from './catalog';
import type { Bilingual, ConceptPage } from './types';

function expectBilingual(value: Bilingual | undefined, context: string) {
  expect(value?.[0].trim(), `${context} zh`).toBeTruthy();
  expect(value?.[1].trim(), `${context} en`).toBeTruthy();
}

function normalizedLongTexts(page: ConceptPage) {
  const chunks: Array<{ where: string; text: string }> = [];
  for (const item of page.definitions) {
    chunks.push({ where: `definition:${item.term[0]}`, text: item.text[0] });
  }
  for (const section of page.sections) {
    chunks.push({ where: `body:${section.title[0]}`, text: section.body[0] });
    for (const point of section.points ?? []) {
      chunks.push({ where: `point:${section.title[0]}`, text: point[0] });
    }
  }
  return chunks
    .map((chunk) => ({
      ...chunk,
      text: chunk.text.replace(/[\s，。；、：！？,.?;:!]/g, ''),
    }))
    .filter((chunk) => chunk.text.length >= 24);
}

describe('VISUAL-02 concept catalog structure', () => {
  it('keeps every theory page in the editorial reading order with bilingual content', () => {
    for (const page of CONCEPT_PAGES) {
      expectBilingual(page.title, `${page.id}/title`);
      expectBilingual(page.chapter, `${page.id}/chapter`);
      expectBilingual(page.summary, `${page.id}/summary`);
      expectBilingual(page.takeaway, `${page.id}/takeaway`);

      expect(page.definitions.length, `${page.id}/definitions`).toBeGreaterThanOrEqual(2);
      for (const definition of page.definitions) {
        expectBilingual(definition.term, `${page.id}/definition/term`);
        expectBilingual(definition.text, `${page.id}/definition/text`);
      }

      expect(page.sections.length, `${page.id}/sections`).toBeGreaterThanOrEqual(2);
      for (const section of page.sections) {
        expectBilingual(section.title, `${page.id}/section/title`);
        expectBilingual(section.body, `${page.id}/section/body`);
        for (const point of section.points ?? []) {
          expectBilingual(point, `${page.id}/section/point`);
        }
        if (section.formulaEn) {
          expect(section.formula, `${page.id}/section/formula`).toBeTruthy();
        }
      }

      const formulasWithChinese = page.sections.filter(
        (section) => section.formula && /[\u3400-\u9fff]/.test(section.formula),
      );
      for (const section of formulasWithChinese) {
        expect(section.formulaEn?.trim(), `${page.id}/section/formulaEn`).toBeTruthy();
        expect(section.formulaEn, `${page.id}/section/formulaEn`).not.toMatch(/[\u3400-\u9fff]/);
      }

      const zhTitles = page.sections.map((section) => section.title[0].trim());
      const enTitles = page.sections.map((section) => section.title[1].trim());
      expect(new Set(zhTitles).size, `${page.id}/duplicate zh section title`).toBe(zhTitles.length);
      expect(new Set(enTitles).size, `${page.id}/duplicate en section title`).toBe(enTitles.length);

      const longTexts = normalizedLongTexts(page);
      const duplicates = longTexts.flatMap((left, index) =>
        longTexts
          .slice(index + 1)
          .filter((right) => left.text === right.text)
          .map((right) => `${left.where} == ${right.where}`),
      );
      expect(duplicates, `${page.id}/duplicated explanation`).toEqual([]);

      if (page.comparison) {
        expectBilingual(page.comparison.title, `${page.id}/comparison/title`);
        for (const column of page.comparison.columns) {
          expectBilingual(column, `${page.id}/comparison/column`);
        }
        for (const row of page.comparison.rows) {
          expect(row.length, `${page.id}/comparison/row`).toBe(page.comparison.columns.length);
          for (const cell of row) {
            expectBilingual(cell, `${page.id}/comparison/cell`);
          }
        }
      }
    }
  });
});
