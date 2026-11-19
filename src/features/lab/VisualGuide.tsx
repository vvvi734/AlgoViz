import { useI18n } from '../../i18n/I18nProvider';

/**
 * UX-SIMPLIFY-02 compact symbol legend.
 *
 * Only algorithms whose marks are not self-explanatory keep this panel. It is a
 * collapsed <details> by default: one visible line explains the symbols, and
 * the longer focus/region notes are opt-in instead of a permanent rail card.
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

  return (
    <details
      className="visual-guide-symbols"
      data-testid="visual-guide"
      data-algorithm={algorithmId}
    >
      <summary>
        <span>{t('visualGuideTitle')}</span>
        <strong>{t(guide.symbols)}</strong>
      </summary>
      <div className="visual-guide-body">
        <dl>
          <div>
            <dt>{t('visualGuideFocus')}</dt>
            <dd>{t(guide.focus)}</dd>
          </div>
          <div>
            <dt>{t('visualGuideRegions')}</dt>
            <dd>{t(guide.regions)}</dd>
          </div>
        </dl>
        <p className="visual-guide-note" data-testid="visual-guide-note">
          <b>{t('visualGuideNote')}</b>
          <span>{t(guide.note)}</span>
        </p>
      </div>
    </details>
  );
}
