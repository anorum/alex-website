import type { PlayerState } from './types';
import { playerBase } from '../../../data/battles';

function Bar({ kind, value, extraClass = '' }: { kind: 'hp' | 'mp' | 'atb' | 'limit'; value: number; extraClass?: string }) {
  return (
    <div className={`rpgb-bar rpgb-bar-${kind} ${extraClass}`} data-testid={kind === 'atb' ? 'atb-gauge' : undefined}>
      <div className="rpgb-bar-fill" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export default function StatusPanel({ player }: { player: PlayerState }) {
  const hpRatio = player.hp / player.maxHp;
  const hpClass = hpRatio <= 0.25 ? 'rpgb-critical' : hpRatio <= 0.5 ? 'rpgb-low' : '';

  return (
    <div className="rpgb-window rpgb-status" data-testid="status-panel">
      <div className="rpgb-stat-row">
        <span className="rpgb-stat-label">HP</span>
        <span data-testid="player-hp">{player.hp}/{player.maxHp}</span>
        <Bar kind="hp" value={hpRatio} extraClass={hpClass} />
      </div>
      <div className="rpgb-stat-row">
        <span className="rpgb-stat-label">MP</span>
        <span data-testid="player-mp">{player.mp}/{player.maxMp}</span>
        <Bar kind="mp" value={player.mp / player.maxMp} />
      </div>
      <div className="rpgb-stat-row">
        <span className="rpgb-stat-label">ATB</span>
        <span>{player.buffed ? `${playerBase.name} ▲` : playerBase.name}</span>
        <Bar kind="atb" value={player.atb} />
      </div>
      <div className="rpgb-stat-row">
        <span className="rpgb-stat-label">LIMIT</span>
        <span>{player.limit >= 1 ? 'READY!' : ''}</span>
        <Bar kind="limit" value={player.limit} extraClass={player.limit >= 1 ? 'rpgb-ready' : ''} />
      </div>
    </div>
  );
}
