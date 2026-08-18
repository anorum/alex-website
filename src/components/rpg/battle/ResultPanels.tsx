import { useEffect } from 'react';
import type { Boss } from '../../../data/battles';
import { experience } from '../../../data/experience';

export function VictoryPanel({ boss, onWin, onExit }: { boss: Boss; onWin: (bossId: string) => void; onExit: () => void }) {
  useEffect(() => {
    onWin(boss.id);
    // record the win exactly once per victory screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const match = boss.experienceMatch;
  const era = experience.find(
    (e) => e.company === match.company && (!match.period || e.period === match.period)
  );

  return (
    <div className="rpgb-window rpgb-result" data-testid="victory-panel">
      <h3 className="rpgb-result-title">QUEST COMPLETE!</h3>
      <div className="rpgb-result-tally">
        <div>EXP <span>{boss.maxHp * 10}</span></div>
        <div>GIL <span>{boss.maxHp * 5}</span></div>
        <div>AP <span>+99</span></div>
      </div>

      {era && (
        <>
          <div className="rpgb-quest-header">REWARD - REAL-WORLD ACHIEVEMENTS UNLOCKED:</div>
          <div className="rpgb-quest-role">{era.role} · {era.company} · {era.period}</div>
          <ul className="rpgb-achievements" data-testid="victory-achievements">
            {era.achievements.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      )}

      <div className="rpgb-result-actions">
        <button type="button" className="rpgb-result-btn" data-testid="victory-continue" onClick={onExit}>
          CONTINUE ▶
        </button>
      </div>
    </div>
  );
}

export function DefeatPanel({ onRetry, onExit }: { onRetry: () => void; onExit: () => void }) {
  return (
    <div className="rpgb-window rpgb-result" data-testid="defeat-panel">
      <h3 className="rpgb-result-title">ROLLBACK INITIATED…</h3>
      <p style={{ textAlign: 'center', fontSize: '9px', marginBottom: '0.5rem' }}>
        State restored from the last known-good deploy. No data was lost.
      </p>
      <div className="rpgb-result-actions">
        <button type="button" className="rpgb-result-btn" data-testid="retry-button" onClick={onRetry}>
          RETRY
        </button>
        <button type="button" className="rpgb-result-btn" onClick={onExit}>
          RUN AWAY
        </button>
      </div>
    </div>
  );
}
