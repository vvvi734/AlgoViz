import type { ReactNode } from 'react';
import { buildVisualModel } from '../../domain/visualization/model';
import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';

export function VisualStage({ event }: { event: TraceEvent | undefined }) {
  const { t } = useI18n();
  const model = event
    ? buildVisualModel(event.state, { invalid: t('invalidTrace'), emptyStructure: t('emptyStack') })
    : { kind: 'empty' as const, text: t('ready') };

  let content: ReactNode;
  switch (model.kind) {
    case 'bars':
      content = (
        <div className="bars">
          {model.bars.map((bar) => (
            <div className="bar-item" key={bar.index}>
              <div
                className={`bar ${bar.focused ? 'focus' : bar.done ? 'done' : ''}`}
                style={{ height: `${bar.height}px` }}
              >
                <span>{String(bar.value)}</span>
              </div>
              <span className="bar-label">{bar.label}</span>
            </div>
          ))}
        </div>
      );
      break;
    case 'nodes':
      content = (
        <div className="nodeflex">
          {model.nodes.map((node) => (
            <span key={node.index} style={{ display: 'contents' }}>
              <div className="node-wrap">
                <div className={`node ${node.focused ? 'focus' : ''}`}>{String(node.value)}</div>
                <div className="node-sub">{node.sub}</div>
              </div>
              {node.arrowAfter && <span className="arrow">→</span>}
            </span>
          ))}
        </div>
      );
      break;
    case 'graph': {
      const positions = new Map(model.nodes.map((node) => [node.index, node]));
      content = (
        <svg className="graph" viewBox="0 0 540 280" role="img" aria-label="graph visualization">
          {model.edges.map(([from, to], index) => {
            const a = positions.get(from);
            const b = positions.get(to);
            if (!a || !b) return null;
            return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
          {model.nodes.map((node) => (
            <g key={node.index}>
              <circle className={node.status === 'none' ? '' : node.status} cx={node.x} cy={node.y} r="23" />
              <text x={node.x} y={node.y}>{String(node.value)}</text>
            </g>
          ))}
        </svg>
      );
      break;
    }
    case 'raw':
      content = <div className="empty">{model.text}</div>;
      break;
    default:
      content = <div className="empty">◈ {model.text}</div>;
  }

  return <div className="stage" aria-label="Algorithm visualization" data-testid="visual-stage">{content}</div>;
}
