import { useI18n } from '../../i18n/I18nProvider';

/**
 * UIX-V02: a compact "how to read this frame" rail above Teaching Course.
 *
 * It intentionally answers only three visual questions — where to look, what
 * the marks mean, and what each region is — plus one short takeaway. Step
 * reasoning, why/how answers and frame changes stay in LessonPanel, so the two
 * panels never narrate the same thing.
 */
const GUIDES = {
  huffman: {
    focus: 'visualGuideHuffmanFocus',
    symbols: 'visualGuideHuffmanSymbols',
    regions: 'visualGuideHuffmanRegions',
    note: 'visualGuideHuffmanNote',
  },
  inorder: {
    focus: 'visualGuideTreeFocus',
    symbols: 'visualGuideTreeSymbols',
    regions: 'visualGuideTreeRegions',
    note: 'visualGuideTreeNote',
  },
  'floyd-warshall': {
    focus: 'visualGuideFloydFocus',
    symbols: 'visualGuideFloydSymbols',
    regions: 'visualGuideFloydRegions',
    note: 'visualGuideFloydNote',
  },
  'critical-path': {
    focus: 'visualGuideAoeFocus',
    symbols: 'visualGuideAoeSymbols',
    regions: 'visualGuideAoeRegions',
    note: 'visualGuideAoeNote',
  },
  dijkstra: {
    focus: 'visualGuideDijkstraFocus',
    symbols: 'visualGuideDijkstraSymbols',
    regions: 'visualGuideDijkstraRegions',
    note: 'visualGuideDijkstraNote',
  },
  kruskal: {
    focus: 'visualGuideKruskalFocus',
    symbols: 'visualGuideKruskalSymbols',
    regions: 'visualGuideKruskalRegions',
    note: 'visualGuideKruskalNote',
  },
  scc: {
    focus: 'visualGuideKosarajuFocus',
    symbols: 'visualGuideKosarajuSymbols',
    regions: 'visualGuideKosarajuRegions',
    note: 'visualGuideKosarajuNote',
  },
  merge: {
    focus: 'visualGuideMergeFocus',
    symbols: 'visualGuideMergeSymbols',
    regions: 'visualGuideMergeRegions',
    note: 'visualGuideMergeNote',
  },
  'hash-chain': {
    focus: 'visualGuideHashFocus',
    symbols: 'visualGuideHashSymbols',
    regions: 'visualGuideHashRegions',
    note: 'visualGuideHashNote',
  },
} as const;

export const VISUAL_GUIDE_ALGORITHMS = Object.keys(GUIDES);

export function VisualGuide({ algorithmId }: { algorithmId: string }) {
  const { t } = useI18n();
  const guide = GUIDES[algorithmId as keyof typeof GUIDES];
  if (!guide) return null;

  const rows = [
    { label: t('visualGuideFocus'), text: t(guide.focus), tone: 'focus' },
    { label: t('visualGuideSymbols'), text: t(guide.symbols), tone: 'symbols' },
    { label: t('visualGuideRegions'), text: t(guide.regions), tone: 'regions' },
  ];

  return (
    <section
      className="panel visual-guide"
      data-testid="visual-guide"
      data-algorithm={algorithmId}
      aria-label={t('visualGuideTitle')}
    >
      <header className="visual-guide-head">
        <div>
          <span className="visual-guide-kicker">{t('visualGuideKicker')}</span>
          <h2>{t('visualGuideTitle')}</h2>
        </div>
        <span className="visual-guide-mark" aria-hidden="true">◎</span>
      </header>
      <dl className="visual-guide-list">
        {rows.map((row) => (
          <div className={`visual-guide-row is-${row.tone}`} key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>
      <p className="visual-guide-note" data-testid="visual-guide-note">
        <b>{t('visualGuideNote')}</b>
        <span>{t(guide.note)}</span>
      </p>
    </section>
  );
}
