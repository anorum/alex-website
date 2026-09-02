import { useEffect, useState } from 'react';
import { bosses } from '../../../data/battles';
import { BossSprite } from './Sprites';
import { playCursor, playConfirm } from '../../../utils/rpg-audio';

interface EncounterSelectProps {
  wins: string[];
  active: boolean;
  onPick: (bossId: string) => void;
}

export default function EncounterSelect({ wins, active, onPick }: EncounterSelectProps) {
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const nav = document.getElementById('ff7-nav');
      if (nav && !nav.classList.contains('hidden')) return;
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          setFocus((f) => (f - 1 + bosses.length) % bosses.length);
          playCursor();
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          setFocus((f) => (f + 1) % bosses.length);
          playCursor();
          e.preventDefault();
          break;
        case 'Enter': {
          playConfirm();
          onPick(bosses[focus].id);
          e.preventDefault();
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, focus, onPick]);

  const allClear = bosses.every((b) => wins.includes(b.id));

  return (
    <div className="rpgb-window" data-testid="encounter-select">
      <div className="rpgb-select-title">BATTLE ARENA</div>
      <div className="rpgb-select-sub">
        {allClear ? '★ ALL BOSSES DEFEATED · PLATFORM SECURED ★' : 'Choose your encounter. Beat a boss to unlock its chapter of the career.'}
      </div>
      <div className="rpgb-encounters">
        {bosses.map((boss, i) => (
          <button
            key={boss.id}
            type="button"
            className={`rpgb-window rpgb-encounter${focus === i ? ' rpgb-focused' : ''}`}
            data-testid={`encounter-${boss.id}`}
            onMouseEnter={() => setFocus(i)}
            onClick={() => {
              playConfirm();
              onPick(boss.id);
            }}
          >
            <span className="rpgb-thumb" aria-hidden="true">
              <BossSprite spriteId={boss.spriteId} name="" />
            </span>
            <span>
              <span className="rpgb-encounter-name">
                {boss.name}
                {wins.includes(boss.id) && <span className="rpgb-defeated">✓ DEFEATED</span>}
              </span>
              <br />
              <span className="rpgb-encounter-era">{boss.era}</span>
              <br />
              <span className="rpgb-stars" aria-label={`difficulty ${boss.stars} of 4`}>
                {'★'.repeat(boss.stars)}{'☆'.repeat(4 - boss.stars)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
