import { useCallback, useState } from 'react';
import { projects } from '../../../data/projects';
import Window, { type WindowContentProps } from '../ui/Window';

const statusTag: Record<string, string> = {
  live: 'IN SERVICE',
  active: 'IN SERVICE',
  stable: 'FIELD TESTED',
  deprecated: 'BROKEN',
};

export default function ShopWindow({ onClose }: WindowContentProps) {
  const [index, setIndex] = useState(0);
  const p = projects[index];

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'w') {
      setIndex((i) => (i - 1 + projects.length) % projects.length);
      return true;
    }
    if (e.key === 'ArrowDown' || e.key === 's') {
      setIndex((i) => (i + 1) % projects.length);
      return true;
    }
  }, []);

  return (
    <Window title="SHOP" onClose={onClose} onKey={onKey}>
      <div className="rpgsh-layout">
        <ul className="rpgsh-list" role="list">
          {projects.map((proj, i) => (
            <li key={proj.id}>
              <button
                type="button"
                className={`rpgsh-item ${i === index ? 'selected' : ''} ${proj.status === 'deprecated' ? 'broken' : ''}`}
                data-project={proj.id}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
              >
                <span className="rpgsh-cursor" aria-hidden="true">▶</span>
                {proj.rpg.itemName}
              </button>
            </li>
          ))}
        </ul>

        <div className="rpgsh-detail" data-project={p.id}>
          <div className="rpgq-head">
            <span className="rpgq-name">{p.rpg.itemName}</span>
            <span className={`rpgq-status ${p.status === 'deprecated' ? 'rpgsh-broken-tag' : ''}`}>
              {statusTag[p.status]}
            </span>
          </div>
          <p className="rpga-flavor">{p.rpg.itemDescription}</p>
          <div className="rpgw-divider" />
          <div className="rpgw-label">APPRAISAL - REAL WORLD DATA</div>
          <p className="rpgq-desc">{p.description}</p>
          {p.highlights.length > 0 && (
            <ul className="rpgq-rewards">
              {p.highlights.map((h) => (
                <li key={h}>
                  <span aria-hidden="true">▸</span> {h}
                </li>
              ))}
            </ul>
          )}
          <div className="rpgsh-tech">
            {p.tech.map((t) => (
              <span key={t} className="rpgsh-tech-tag">
                {t}
              </span>
            ))}
          </div>
          {(p.links.live || p.links.repo) && (
            <div className="rpgsh-links">
              {p.links.live && (
                <a href={p.links.live} target="_blank" rel="noopener noreferrer">
                  USE ITEM (LIVE)
                </a>
              )}
              {p.links.repo && (
                <a href={p.links.repo} target="_blank" rel="noopener noreferrer">
                  INSPECT (GITHUB)
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Window>
  );
}
