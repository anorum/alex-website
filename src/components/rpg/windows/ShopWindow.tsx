import { useCallback, useState } from 'react';
import { projects } from '../../../data/projects';
import { items } from '../../../data/items';
import Window, { type WindowContentProps } from '../ui/Window';

const statusTag: Record<string, string> = {
  live: 'IN SERVICE',
  active: 'IN SERVICE',
  stable: 'FIELD TESTED',
  deprecated: 'BROKEN',
};

type Tab = 'wares' | 'buy';

export default function ShopWindow({ onClose, save, dispatch, initialTab }: WindowContentProps) {
  const [tab, setTab] = useState<Tab>(initialTab === 'buy' ? 'buy' : 'wares');
  const [index, setIndex] = useState(0);
  const [buyIndex, setBuyIndex] = useState(0);
  const [note, setNote] = useState('');
  const p = projects[index];

  const buy = useCallback(
    (i: number) => {
      const item = items[i];
      if (save.gil < item.price) {
        setNote('Not enough gil.');
        return;
      }
      dispatch({ type: 'BUY', itemId: item.id });
      setNote(`Bought ${item.name}.`);
    },
    [dispatch, save.gil]
  );

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setTab((t) => (t === 'wares' ? 'buy' : 'wares'));
        return true;
      }
      const up = e.key === 'ArrowUp' || e.key === 'w';
      const down = e.key === 'ArrowDown' || e.key === 's';
      if (tab === 'wares') {
        if (up) { setIndex((i) => (i - 1 + projects.length) % projects.length); return true; }
        if (down) { setIndex((i) => (i + 1) % projects.length); return true; }
      } else {
        if (up) { setBuyIndex((i) => (i - 1 + items.length) % items.length); return true; }
        if (down) { setBuyIndex((i) => (i + 1) % items.length); return true; }
        if (e.key === 'Enter') { buy(buyIndex); return true; }
      }
    },
    [tab, buy, buyIndex]
  );

  return (
    <Window title="SHOP" onClose={onClose} onKey={onKey}>
      <div className="rpgsh-tabs" role="tablist">
        <button type="button" role="tab" className={`rpgsh-tab${tab === 'wares' ? ' selected' : ''}`} aria-selected={tab === 'wares'} onClick={() => setTab('wares')}>WARES</button>
        <button type="button" role="tab" className={`rpgsh-tab${tab === 'buy' ? ' selected' : ''}`} aria-selected={tab === 'buy'} onClick={() => setTab('buy')}>BUY</button>
        <span className="rpgsh-gil" data-testid="shop-gil">GIL {save.gil}</span>
      </div>

      {tab === 'buy' ? (
        <div className="rpgsh-buy">
          <ul className="rpgsh-list" role="list">
            {items.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`rpgsh-item${i === buyIndex ? ' selected' : ''}`}
                  data-item={item.id}
                  onMouseEnter={() => setBuyIndex(i)}
                  onClick={() => { setBuyIndex(i); buy(i); }}
                >
                  <span className="rpgsh-cursor" aria-hidden="true">▶</span>
                  <span className="rpgsh-item-name">{item.name}</span>
                  <span className="rpgsh-price">{item.price} G</span>
                  <span className="rpgsh-owned">×{save.inventory[item.id] ?? 0}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="rpgsh-detail">
            <div className="rpgq-name">{items[buyIndex].name}</div>
            <p className="rpgq-desc">{items[buyIndex].description}</p>
            <p className="rpga-flavor">{note || 'Enter or click to buy. Gil comes from battles.'}</p>
          </div>
        </div>
      ) : (
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
                <span key={t} className="rpgsh-tech-tag">{t}</span>
              ))}
            </div>
            {(p.links.live || p.links.repo) && (
              <div className="rpgsh-links">
                {p.links.live && (
                  <a href={p.links.live} target="_blank" rel="noopener noreferrer">USE ITEM (LIVE)</a>
                )}
                {p.links.repo && (
                  <a href={p.links.repo} target="_blank" rel="noopener noreferrer">INSPECT (GITHUB)</a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Window>
  );
}
